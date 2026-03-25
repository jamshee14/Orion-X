from fastapi import FastAPI, Response, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from . import models, schemas, auth, database
from .database import engine
from sqlalchemy import text
from datetime import datetime
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import os
import google.generativeai as genai
from .config import settings

load_dotenv()

import fitz  # PyMuPDF
import json
import re

# --- CLOUDINARY CONFIG ---
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

# --- GEMINI AI CONFIG ---
genai.configure(api_key=settings.gemini_api_key)
model = genai.GenerativeModel("gemini-2.5-flash")

models.Base.metadata.create_all(bind=engine)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE IF EXISTS quizzes ADD COLUMN IF NOT EXISTS note_id INTEGER"))
        conn.commit()
    except Exception:
        pass
app = FastAPI()

# --- MANDATORY CORS CONFIG ---
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/users", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # Check if this specific email/role combo exists
    existing = db.query(models.User).filter(
        models.User.email == user.email, 
        models.User.role == user.role
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail=f"You are already registered as a {user.role}")

    hashed = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, password=hashed, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login")
def login(creds: schemas.UserCreate, response: Response, db: Session = Depends(database.get_db)):
    # Filter by both email and role
    user = db.query(models.User).filter(
        models.User.email == creds.email,
        models.User.role == creds.role
    ).first()
    
    if not user or not auth.verify_password(creds.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid Email, Password, or Role selection")
        
    # Include both email and role in the token
    token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    response.set_cookie(key="token", value=token, httponly=True, samesite="lax", secure=False)
    return {
        "role": user.role,
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.access_token_expire * 60
    }

@app.get("/notes", response_model=List[schemas.NoteOut])
def get_notes(db: Session = Depends(database.get_db), user: models.User = Depends(auth.get_current_user_from_cookie)):
    notes = []
    if user.role == "teacher":
        notes = db.query(models.Note).filter(models.Note.owner_id == user.id).all()
    else:
        notes = db.query(models.Note).all()
    
    # Enrich notes with has_study_path info
    result = []
    for n in notes:
        n_out = schemas.NoteOut.model_validate(n)
        n_out.has_study_path = n.study_path is not None
        result.append(n_out)
    return result

# --- STUDY PATH ENDPOINTS ---

@app.post("/notes/{note_id}/study-path", response_model=schemas.StudyPathOut)
def generate_study_path(note_id: int, db: Session = Depends(database.get_db), user: models.User = Depends(auth.get_current_user_from_cookie)):

    
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Check if study path already exists
    existing = db.query(models.StudyPath).filter(models.StudyPath.note_id == note_id).first()
    if existing:
        return existing

    # Actual AI Roadmap generation using Gemini
    prompt = f"""
    Act as an expert educator. Based on the following educational content, generate a structured study roadmap for a student.
    
    Content Title: {note.title}
    Content Body: {note.content}
    
    Provide the output in STRICT JSON format with the following keys:
    - summary: A brief (2-3 sentences) overview of the topic.
    - key_terms: A list of 4-6 important terms from the content.
    - reading_order: A list of 4-5 steps the student should take to master this content.
    - estimated_time: A string indicating how long it will take to study (e.g., "45 minutes").
    
    Return ONLY the JSON.
    """
    
    try:
        response = model.generate_content(prompt)
        # Clean the response to ensure it's valid JSON (Gemini sometimes adds ```json)
        raw_text = response.text.strip()
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0].strip()
            
        roadmap = json.loads(raw_text)
    except Exception as e:
        print(f"AI Generation Error: {e}")
        # Fallback to mock if AI fails
        roadmap = {
            "summary": f"This study path covers the essential concepts of {note.title}.",
            "key_terms": ["Core Concepts", "Key Definitions"],
            "reading_order": ["1. Review the notes", "2. Practice questions"],
            "estimated_time": "30 minutes"
        }
    
    new_path = models.StudyPath(note_id=note_id, roadmap_json=roadmap)
    db.add(new_path)
    db.commit()
    db.refresh(new_path)
    return new_path

@app.get("/notes/{note_id}/study-path", response_model=schemas.StudyPathOut)
def get_study_path(note_id: int, db: Session = Depends(database.get_db), user: models.User = Depends(auth.get_current_user_from_cookie)):
    path = db.query(models.StudyPath).filter(models.StudyPath.note_id == note_id).first()
    if not path:
        raise HTTPException(status_code=404, detail="Study path not found for this note")
    return path

# --- QUIZ SUBMISSION & ANALYTICS ---

@app.post("/quizzes/submit", response_model=schemas.QuizResultOut)
def submit_quiz(submission: schemas.QuizSubmission, db: Session = Depends(database.get_db), user: models.User = Depends(auth.get_current_user_from_cookie)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == submission.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    total_questions = len(quiz.questions)
    correct_count = 0
    
    # Create the result record first
    new_result = models.QuizResult(
        quiz_id=submission.quiz_id,
        student_id=user.id,
        score=0.0,
        total_questions=total_questions
    )
    db.add(new_result)
    db.commit()
    db.refresh(new_result)
    
    for question in quiz.questions:
        student_ans = submission.answers.get(question.id) or ""
        is_correct = 1 if student_ans.lower() == question.correct_answer.lower() else 0
        if is_correct:
            correct_count += 1
            
        log = models.AnswerLog(
            quiz_result_id=new_result.id,
            question_id=question.id,
            student_answer=student_ans,
            is_correct=is_correct
        )
        db.add(log)
    
    new_result.score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
    db.commit()
    db.refresh(new_result)
    return new_result

@app.get("/analytics/quizzes/{quiz_id}", response_model=schemas.QuizAnalytics)
def get_quiz_analytics(quiz_id: int, db: Session = Depends(database.get_db), user: models.User = Depends(auth.get_current_user_from_cookie)):
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access analytics")
    
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    results = db.query(models.QuizResult).filter(models.QuizResult.quiz_id == quiz_id).all()
    attempt_count = len(results)
    avg_score = sum(r.score for r in results) / attempt_count if attempt_count > 0 else 0
    
    # Find most missed questions
    missed_questions = []
    for question in quiz.questions:
        logs = db.query(models.AnswerLog).filter(models.AnswerLog.question_id == question.id).all()
        total_attempts = len(logs)
        miss_count = sum(1 for l in logs if l.is_correct == 0)
        
        if total_attempts > 0:
            missed_questions.append({
                "question_id": question.id,
                "text": question.text,
                "miss_count": miss_count,
                "total_attempts": total_attempts
            })
    
    # Sort by miss_count descending
    missed_questions.sort(key=lambda x: x["miss_count"], reverse=True)
    
    return {
        "quiz_id": quiz_id,
        "title": quiz.title,
        "attempt_count": attempt_count,
        "average_score": avg_score,
        "most_missed_questions": missed_questions[:5] # Top 5 missed
    }

@app.post("/notes", response_model=schemas.NoteOut)
async def create_note(
    db: Session = Depends(database.get_db),
    user: models.User = Depends(auth.get_current_user_from_cookie),
    title: str = Form(...),
    content: str = Form(...),
    file: Optional[UploadFile] = File(None),
):
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can upload")

    file_url = None
    extracted_content = content

    if file:
        try:
            # Read file into memory
            file_bytes = await file.read()
            await file.seek(0) # Reset file pointer

            # Extract text if it's a PDF
            if file.filename.endswith(".pdf"):
                with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                    extracted_content = "".join(page.get_text() for page in doc)
            
            # Upload to Cloudinary
            resource_type = "raw" if file.filename.endswith(".pdf") else "auto"
            upload_result = cloudinary.uploader.upload(
                file.file, 
                resource_type=resource_type,
                folder="orion_notes",
                use_filename=True,
                unique_filename=True
            )
            file_url = upload_result.get("secure_url")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File processing failed: {e}")

    new_note = models.Note(
        title=title,
        content=extracted_content, # Use extracted content
        file_url=file_url,
        owner_id=user.id
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@app.post("/logout")
def logout(response: Response):
    response.delete_cookie("token")
    return {"message": "Logged out"}

# --- QUIZ ENDPOINTS ---

@app.post("/meetings/start", response_model=schemas.MeetingOut)
def start_meeting(db: Session = Depends(database.get_db), user: models.User = Depends(auth.get_current_user_from_cookie)):
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can start meetings")
    room = f"OrionX-{user.id}-{int(datetime.utcnow().timestamp())}"
    url = f"https://meet.jit.si/{room}"
    meeting = models.Meeting(room_name=room, url=url, host_id=user.id, status="live")
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting

@app.get("/meetings", response_model=List[schemas.MeetingOut])
def list_meetings(db: Session = Depends(database.get_db), user: models.User = Depends(auth.get_current_user_from_cookie)):
    q = db.query(models.Meeting).filter(models.Meeting.status == "live").order_by(models.Meeting.started_at.desc()).all()
    return q

@app.post("/meetings/{meeting_id}/end", status_code=204)
def end_meeting(meeting_id: int, db: Session = Depends(database.get_db), user: models.User = Depends(auth.get_current_user_from_cookie)):
    m = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if user.role != "teacher" or m.host_id != user.id:
        raise HTTPException(status_code=403, detail="Only the host teacher can end this meeting")
    m.status = "ended"
    m.ended_at = datetime.utcnow()
    db.commit()
    return

@app.get("/quizzes", response_model=List[schemas.QuizSummary])
def get_quizzes(db: Session = Depends(database.get_db), user: models.User = Depends(auth.get_current_user_from_cookie)):
    # Students can see all quizzes, teachers only their own
    if user.role == "teacher":
        return db.query(models.Quiz).filter(models.Quiz.owner_id == user.id).all()
    return db.query(models.Quiz).all()

@app.get("/quizzes/{quiz_id}", response_model=schemas.QuizOut)
def get_quiz(quiz_id: int, db: Session = Depends(database.get_db), user: models.User = Depends(auth.get_current_user_from_cookie)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz

@app.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(quiz_id: int, db: Session = Depends(database.get_db), user: models.User = Depends(auth.get_current_user_from_cookie)):
    if user.role != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to perform this action")
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Quiz with id: {quiz_id} does not exist")
    if quiz.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to perform this action")
    db.query(models.AnswerLog).filter(models.AnswerLog.question_id.in_([q.id for q in quiz.questions])).delete(synchronize_session=False)
    db.query(models.QuizResult).filter(models.QuizResult.quiz_id == quiz_id).delete(synchronize_session=False)
    db.query(models.Question).filter(models.Question.quiz_id == quiz_id).delete(synchronize_session=False)
    db.query(models.Quiz).filter(models.Quiz.id == quiz_id).delete(synchronize_session=False)
    db.commit()
    return

@app.post("/quizzes", response_model=schemas.QuizOut)
def create_quiz(quiz: schemas.QuizCreate, db: Session = Depends(database.get_db), user: models.User = Depends(auth.get_current_user_from_cookie)):
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create quizzes")
    
    new_quiz = models.Quiz(
        title=quiz.title,
        description=quiz.description,
        timer_minutes=quiz.timer_minutes,
        owner_id=user.id,
        note_id=getattr(quiz, 'note_id', None) # Associate with note if provided
    )
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)
    
    for q in quiz.questions:
        new_q = models.Question(
            quiz_id=new_quiz.id,
            text=q.text,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            correct_answer=q.correct_answer
        )
        db.add(new_q)
    
    db.commit()
    db.refresh(new_quiz)
    return new_quiz

@app.post("/quizzes/generate")
def generate_quiz_ai(
    topic: Optional[str] = Form(None), 
    note_id: Optional[int] = Form(None),
    num_questions: int = Form(5),
    timer_minutes: int = Form(10),
    db: Session = Depends(database.get_db), 
    user: models.User = Depends(auth.get_current_user_from_cookie)
):
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can generate quizzes")
    
    context = ""
    title = topic or "Custom Topic"
    
    if note_id:
        note = db.query(models.Note).filter(models.Note.id == note_id).first()
        if note:
            # Limit context size to avoid token overflows
            content_text = (note.content or "").strip()
            # Keep the first ~12k characters which is usually enough for MCQs
            max_len = 12000
            if len(content_text) > max_len:
                content_text = content_text[:max_len] + "\n...[truncated]..."
            context = f"""
            Use ONLY the following source content to create questions.
            CONTENT START
            {content_text}
            CONTENT END
            """
            title = note.title

    # Actual AI Generation logic using Gemini
    prompt = f"""
    Create a {num_questions}-question multiple choice quiz on the topic: {title}.
    {context}
    Strict rules:
    - Return ONLY a JSON array (no prose, no code fences).
    - Each option must be meaningful. Do NOT use placeholders like "Option 1", "Statement A", or "Idea A".
    - correct_answer must be one of 'a', 'b', 'c', 'd' only.
    - Use plausible distractors and only one correct option per question.
    - If source content is provided, base every question and answer strictly on it. Do not invent facts beyond the content.
    Example of one array element:
    {{
      "text": "What does a compiler do?",
      "option_a": "Translates source code to machine code",
      "option_b": "Executes code line by line at runtime",
      "option_c": "Stores data in a database",
      "option_d": "Renders UI components in the browser",
      "correct_answer": "a"
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        raw_text = (response.text or "").strip()
        
        # Strip markdown code fences if present
        if "```json" in raw_text:
            raw_text = raw_text.split("```json", 1)[1].split("```", 1)[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```", 1)[1].split("```", 1)[0].strip()
        
        questions = None
        # Try direct parse first
        try:
            parsed = json.loads(raw_text)
            # Gemini sometimes wraps the array in an object
            if isinstance(parsed, list):
                questions = parsed
            elif isinstance(parsed, dict):
                # Look for the first list value in the dict
                for v in parsed.values():
                    if isinstance(v, list):
                        questions = v
                        break
        except Exception:
            pass
        
        # Regex fallback: extract JSON array from raw text
        if not isinstance(questions, list):
            m = re.search(r"(\[\s*\{[\s\S]*?\}\s*\])", raw_text)
            if m:
                try:
                    questions = json.loads(m.group(1))
                except Exception:
                    pass

        if not isinstance(questions, list) or len(questions) == 0:
            raise ValueError(f"AI did not return a valid JSON array. Raw response: {raw_text[:300]}")
            
    except Exception as e:
        print(f"AI Quiz Generation Error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"AI quiz generation failed. Please try again or choose a different topic/note. Error: {str(e)[:200]}"
        )
    
    return {
        "title": f"AI Quiz on {title}",
        "description": f"Automatically generated quiz about {title}",
        "timer_minutes": timer_minutes,
        "questions": questions,
        "note_id": note_id # Pass note_id back to frontend
    }

@app.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: int, db: Session = Depends(database.get_db), user: models.User = Depends(auth.get_current_user_from_cookie)):
    if user.role != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to perform this action")

    note_query = db.query(models.Note).filter(models.Note.id == note_id)
    note = note_query.first()

    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Note with id: {note_id} does not exist")

    if note.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to perform this action")

    # Clean up related data first
    db.query(models.StudyPath).filter(models.StudyPath.note_id == note_id).delete(synchronize_session=False)
    
    # Find quizzes related to the note to clean their children
    quizzes = db.query(models.Quiz).filter(models.Quiz.note_id == note_id).all()
    for quiz in quizzes:
        db.query(models.Question).filter(models.Question.quiz_id == quiz.id).delete(synchronize_session=False)
        # Also delete quiz results and answer logs
        results = db.query(models.QuizResult).filter(models.QuizResult.quiz_id == quiz.id).all()
        for result in results:
            db.query(models.AnswerLog).filter(models.AnswerLog.quiz_result_id == result.id).delete(synchronize_session=False)
        db.query(models.QuizResult).filter(models.QuizResult.quiz_id == quiz.id).delete(synchronize_session=False)

    db.query(models.Quiz).filter(models.Quiz.note_id == note_id).delete(synchronize_session=False)
    
    note_query.delete(synchronize_session=False)
    db.commit()


# --- AI Tutor Endpoint ---
@app.post("/tutor/chat", response_model=schemas.TutorChatResponse)
def tutor_chat(req: schemas.TutorChatRequest, db: Session = Depends(database.get_db), user: models.User = Depends(auth.get_current_user_from_cookie)):
    if user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can use the AI tutor")

    # Get the student's latest question
    last_user_question = "Explain this clearly."
    if req.history:
        for msg in reversed(req.history):
            if msg.role == "user":
                last_user_question = msg.parts
                break

    query = last_user_question.lower()

    # Fetch all uploaded notes (teacher PDFs)
    all_notes = db.query(models.Note).all()

    # Build chunks from all notes, tagging each with its title
    corpus_chunks = []
    for n in all_notes:
        content = (n.content or "").strip()
        if not content:
            continue
        # Split into paragraphs; fall back to chunking by character count if no paragraphs
        paragraphs = [p.strip() for p in re.split(r"\n{2,}", content) if p.strip()]
        if not paragraphs:
            paragraphs = [content[i:i+800] for i in range(0, len(content), 800)]
        for p in paragraphs:
            corpus_chunks.append({"title": n.title, "text": p[:1200]})

    # Score chunks by keyword relevance (allow short terms too)
    def score_chunk(chunk_text: str, query_str: str) -> int:
        if not query_str:
            return 0
        terms = [t for t in re.split(r"[^a-z0-9]+", query_str) if len(t) > 1]
        ct = chunk_text.lower()
        return sum(ct.count(t) for t in terms)

    scored = [(score_chunk(c["text"], query), c) for c in corpus_chunks]
    scored.sort(key=lambda x: x[0], reverse=True)

    # Build context up to ~8000 char budget, relevance-ranked
    context_parts = []
    char_budget = 8000
    used = 0
    for s, c in scored:
        if used >= char_budget:
            break
        snippet = f"[From: {c['title']}]\n{c['text']}"
        context_parts.append(snippet)
        used += len(snippet)

    # Also include req.note_content if provided and context is thin
    if used < 500 and req.note_content:
        context_parts.insert(0, f"[Provided context]\n{req.note_content[:3000]}")

    context = "\n\n".join(context_parts) if context_parts else ""

    # Build prompt based on whether we have context
    if context:
        full_prompt = (
            "You are Orion-X AI Tutor, a helpful and encouraging academic assistant. "
            "You have access to course materials uploaded by teachers (shown below). "
            "Answer the student's question using the provided course content. "
            "If it is directly covered, give a clear detailed explanation. "
            "If partially covered, share what you know from the materials. "
            "Only say you lack information if the materials contain absolutely nothing relevant. "
            "Be friendly, educational, and use examples when helpful.\n\n"
            f"--- COURSE MATERIALS ---\n{context}\n--- END OF COURSE MATERIALS ---\n\n"
            f"Student's question: {last_user_question}\n"
            "Please provide a clear, helpful answer."
        )
    else:
        full_prompt = (
            "You are Orion-X AI Tutor. No course materials have been uploaded yet by the teacher. "
            f"The student asked: {last_user_question}\n"
            "Politely let the student know that no course content has been uploaded yet, "
            "and encourage them to ask their teacher to upload the relevant PDF modules."
        )

    # Reformat history for Gemini (exclude last message — included in full_prompt)
    formatted_history = []
    for i in range(len(req.history) - 1):
        m = req.history[i]
        formatted_history.append({"role": m.role, "parts": [m.parts]})

    try:
        chat_session = model.start_chat(history=formatted_history)
        response = chat_session.send_message(full_prompt)
        return {"reply": response.text}
    except Exception as e:
        print(f"AI Tutor Error: {e}")
        raise HTTPException(status_code=500, detail="The AI tutor is currently unavailable. Please try again later.")

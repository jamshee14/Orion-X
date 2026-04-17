from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from .models import UserRole
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: UserRole = UserRole.student

class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    class Config:
        from_attributes = True

class TokenData(BaseModel):
    id: Optional[str] = None
    role: Optional[str] = None

class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = None
    file_url: Optional[str] = None

class NoteOut(BaseModel):
    id: int
    title: str
    content: str
    file_url: Optional[str]
    owner_id: int
    has_study_path: bool = False
    class Config:
        from_attributes = True

class StudyPathOut(BaseModel):
    id: int
    note_id: int
    roadmap_json: Dict[str, Any]
    class Config:
        from_attributes = True

class QuizSubmission(BaseModel):
    quiz_id: int
    answers: Dict[int, str] # question_id: answer

class QuizResultOut(BaseModel):
    id: int
    quiz_id: int
    score: float
    total_questions: int
    submitted_at: datetime
    class Config:
        from_attributes = True

class AnalyticsQuestionSummary(BaseModel):
    question_id: int
    text: str
    miss_count: int
    total_attempts: int

class QuizAnalytics(BaseModel):
    quiz_id: int
    title: str
    attempt_count: int
    average_score: float
    most_missed_questions: List[AnalyticsQuestionSummary]

class QuestionBase(BaseModel):
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str

class QuestionCreate(QuestionBase):
    pass

class QuestionOut(QuestionBase):
    id: int
    class Config:
        from_attributes = True

class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = None
    timer_minutes: int = 10
    questions: List[QuestionCreate]
    note_id: Optional[int] = None

class QuizOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    timer_minutes: int
    owner_id: int
    note_id: Optional[int] = None
    questions: List[QuestionOut]
    class Config:
        from_attributes = True

class QuizSummary(BaseModel):
    id: int
    title: str
    description: Optional[str]
    timer_minutes: int
    owner_id: int
    note_id: Optional[int] = None
    class Config:
        from_attributes = True

# --- AI Tutor Schemas ---
class ChatMessage(BaseModel):
    role: str # 'user' or 'model'
    parts: str

class TutorChatRequest(BaseModel):
    note_content: Optional[str] = None
    history: List[ChatMessage]

class TutorChatResponse(BaseModel):
    reply: str

class MeetingOut(BaseModel):
    id: int
    room_name: str
    url: str
    status: str
    host_id: int
    started_at: datetime
    class Config:
        from_attributes = True

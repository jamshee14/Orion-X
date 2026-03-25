import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from .database import Base
from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import relationship

class UserRole(str, enum.Enum):
    teacher = "teacher"
    student = "student"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False) # Remove unique=True here
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)

    # This allows 'user@test.com' to exist twice: once as teacher, once as student
    __table_args__ = (UniqueConstraint('email', 'role', name='_email_role_uc'),)
    
    quizzes = relationship("Quiz", back_populates="owner")
    notes = relationship("Note", back_populates="owner")

from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Float, DateTime, JSON
from datetime import datetime

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    file_url = Column(String, nullable=True) # For Supabase PDF link
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    owner = relationship("User", back_populates="notes")
    study_path = relationship("StudyPath", back_populates="note", uselist=False, cascade="all, delete-orphan")

class StudyPath(Base):
    __tablename__ = "study_paths"
    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False, unique=True)
    roadmap_json = Column(JSON, nullable=False) # Store summaries, key terms, reading order
    
    note = relationship("Note", back_populates="study_path")

class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    timer_minutes = Column(Integer, default=10) # Default 10 minutes
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    note_id = Column(Integer, ForeignKey("notes.id", ondelete="CASCADE"), nullable=True) # Link quiz to a note
    
    owner = relationship("User", back_populates="quizzes")
    note = relationship("Note") # New relationship
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    results = relationship("QuizResult", back_populates="quiz", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    text = Column(String, nullable=False)
    option_a = Column(String, nullable=False)
    option_b = Column(String, nullable=False)
    option_c = Column(String, nullable=False)
    option_d = Column(String, nullable=False)
    correct_answer = Column(String, nullable=False) # 'a', 'b', 'c', or 'd'
    
    quiz = relationship("Quiz", back_populates="questions")
    answer_logs = relationship("AnswerLog", back_populates="question", cascade="all, delete-orphan")

class QuizResult(Base):
    __tablename__ = "quiz_results"
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=False)
    total_questions = Column(Integer, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    
    quiz = relationship("Quiz", back_populates="results")
    student = relationship("User")

class AnswerLog(Base):
    __tablename__ = "answer_logs"
    id = Column(Integer, primary_key=True, index=True)
    quiz_result_id = Column(Integer, ForeignKey("quiz_results.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    student_answer = Column(String, nullable=False)
    is_correct = Column(Integer, nullable=False) # 0 or 1
    
    question = relationship("Question", back_populates="answer_logs")

class Meeting(Base):
    __tablename__ = "meetings"
    id = Column(Integer, primary_key=True, index=True)
    room_name = Column(String, nullable=False, unique=True)
    url = Column(String, nullable=False)
    status = Column(String, default="live")  # 'live' | 'ended'
    host_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

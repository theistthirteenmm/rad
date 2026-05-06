from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    school = Column(String, nullable=False)
    class_name = Column(String, nullable=False)
    grade = Column(String, nullable=False)
    teacher_name = Column(String, nullable=False)
    avatar = Column(String, default="avatar1")
    stars = Column(Integer, default=0)
    coins = Column(Integer, default=0)
    level = Column(Integer, default=1)
    character_items = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("GameSession", back_populates="student")
    progress = relationship("SubjectProgress", back_populates="student")


class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject = Column(String, nullable=False)
    game_type = Column(String, nullable=False)
    score = Column(Integer, default=0)
    stars_earned = Column(Integer, default=0)
    coins_earned = Column(Integer, default=0)
    duration_seconds = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    played_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="sessions")


class SubjectProgress(Base):
    __tablename__ = "subject_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject = Column(String, nullable=False)
    total_sessions = Column(Integer, default=0)
    total_stars = Column(Integer, default=0)
    highest_score = Column(Integer, default=0)
    last_played = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="progress")

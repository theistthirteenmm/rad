from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class School(Base):
    __tablename__ = 'schools'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    grades = relationship('Grade', back_populates='school', cascade='all, delete-orphan')


class Grade(Base):
    __tablename__ = 'grades'
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    school_id = Column(Integer, ForeignKey('schools.id'), nullable=False)
    school = relationship('School', back_populates='grades')
    classes = relationship('ClassRoom', back_populates='grade', cascade='all, delete-orphan')
    __table_args__ = (UniqueConstraint('name', 'school_id', name='uq_grade_school'),)


class ClassRoom(Base):
    __tablename__ = 'classrooms'
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    grade_id = Column(Integer, ForeignKey('grades.id'), nullable=False)
    school_id = Column(Integer, ForeignKey('schools.id'), nullable=False)
    grade = relationship('Grade', back_populates='classes')
    school = relationship('School')
    __table_args__ = (UniqueConstraint('name', 'grade_id', name='uq_class_grade'),)


class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)
    name = Column(String, nullable=False)
    school_id = Column(Integer, ForeignKey('schools.id'), nullable=True)
    grade_id = Column(Integer, ForeignKey('grades.id'), nullable=True)
    class_id = Column(Integer, ForeignKey('classrooms.id'), nullable=True)
    teacher_name = Column(String, default='')
    avatar = Column(String, default='avatar0')
    stars = Column(Integer, default=0)
    coins = Column(Integer, default=0)
    level = Column(Integer, default=1)
    child_name = Column(String, nullable=True)
    character_items = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    school = relationship('School', foreign_keys=[school_id])
    grade = relationship('Grade', foreign_keys=[grade_id])
    classroom = relationship('ClassRoom', foreign_keys=[class_id])
    game_sessions = relationship('GameSession', back_populates='user', cascade='all, delete-orphan')
    subject_progress = relationship('SubjectProgress', back_populates='user', cascade='all, delete-orphan')


# Alias for backward compat with progress router
Student = User


class LevelProgress(Base):
    __tablename__ = 'level_progress'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    subject = Column(String, nullable=False)
    game_type = Column(String, nullable=False)
    stars = Column(Integer, default=0)
    best_score = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    __table_args__ = (UniqueConstraint('user_id', 'subject', 'game_type', name='uq_level_progress'),)


class GameSession(Base):
    __tablename__ = 'game_sessions'
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    subject = Column(String, nullable=False)
    game_type = Column(String, nullable=False)
    score = Column(Integer, default=0)
    stars_earned = Column(Integer, default=0)
    coins_earned = Column(Integer, default=0)
    duration_seconds = Column(Integer, default=0)
    completed = Column(Integer, default=1)
    played_at = Column(DateTime, default=datetime.utcnow)
    user = relationship('User', back_populates='game_sessions')


class SubjectProgress(Base):
    __tablename__ = 'subject_progress'
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    subject = Column(String, nullable=False)
    total_sessions = Column(Integer, default=0)
    total_stars = Column(Integer, default=0)
    highest_score = Column(Integer, default=0)
    last_played = Column(DateTime, nullable=True)
    user = relationship('User', back_populates='subject_progress')

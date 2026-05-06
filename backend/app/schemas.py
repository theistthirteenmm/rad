from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any


# ─── Auth ────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str
    name: str
    school_id: Optional[str] = None
    grade_id: Optional[str] = None
    class_id: Optional[str] = None
    teacher_name: str = ''
    avatar: str = 'avatar0'
    child_name: Optional[str] = None
    school_name: Optional[str] = None  # admin only: creates a new school


class LoginRequest(BaseModel):
    username: str
    password: str
    role: str


class ChangeCredRequest(BaseModel):
    new_username: str
    new_password: str


class UpdateUserRequest(BaseModel):
    stars: Optional[int] = None
    coins: Optional[int] = None
    level: Optional[int] = None
    avatar: Optional[str] = None
    teacher_name: Optional[str] = None


class UserOut(BaseModel):
    id: str
    username: str
    passwordHash: str = ''
    role: str
    name: str
    school: str = ''
    school_id: str = ''
    grade: str = ''
    grade_id: str = ''
    class_name: str = ''
    class_id: str = ''
    teacher_name: str = ''
    avatar: str = 'avatar0'
    stars: int = 0
    coins: int = 0
    level: int = 1
    child_name: Optional[str] = None
    createdAt: int = 0


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    user: UserOut


# ─── Schools ─────────────────────────────────────────────────────
class ClassOut(BaseModel):
    id: str
    name: str


class GradeOut(BaseModel):
    id: str
    name: str
    classes: List[ClassOut]


class SchoolOut(BaseModel):
    id: str
    name: str
    grades: List[GradeOut]


class AddSchoolRequest(BaseModel):
    name: str


class AddGradeRequest(BaseModel):
    name: str


class AddClassRequest(BaseModel):
    name: str


# ─── Games / Progress (kept from original) ───────────────────────
class StudentCreate(BaseModel):
    name: str
    school: str
    class_name: str
    grade: str
    teacher_name: str
    avatar: Optional[str] = 'avatar1'


class StudentUpdate(BaseModel):
    avatar: Optional[str] = None
    character_items: Optional[List[str]] = None


class StudentOut(BaseModel):
    id: int
    name: str
    school: str = ''
    class_name: str = ''
    grade: str = ''
    teacher_name: str = ''
    avatar: str
    stars: int
    coins: int
    level: int
    character_items: Optional[Any] = []
    created_at: datetime

    class Config:
        from_attributes = True


class GameSessionCreate(BaseModel):
    subject: str
    game_type: str
    score: int
    stars_earned: int
    coins_earned: int
    duration_seconds: int
    completed: bool


class GameSessionOut(BaseModel):
    id: int
    subject: str
    game_type: str
    score: int
    stars_earned: int
    coins_earned: int
    duration_seconds: int
    completed: bool
    played_at: datetime

    class Config:
        from_attributes = True


class SubjectProgressOut(BaseModel):
    subject: str
    total_sessions: int
    total_stars: int
    highest_score: int
    last_played: Optional[datetime]

    class Config:
        from_attributes = True


class DashboardOut(BaseModel):
    student: StudentOut
    recent_sessions: List[GameSessionOut]
    subject_progress: List[SubjectProgressOut]
    weekly_stats: dict

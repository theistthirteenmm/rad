from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, GameSession, SubjectProgress, LevelProgress
from ..schemas import GameSessionCreate, GameSessionOut
from .auth import get_current_user

router = APIRouter(prefix='/api/progress', tags=['progress'])

STARS_PER_LEVEL = 50
# سقف ستاره و الماس برای هر مرحله (بر اساس تعداد ستاره)
STARS_CAP = 3
COINS_PER_STAR = 5


@router.post('/{student_id}/session', response_model=GameSessionOut)
async def save_session(student_id: int, data: GameSessionCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail='دانش‌آموز یافت نشد')

    # ── بررسی سقف امتیاز برای این مرحله ──────────────────────────────────────
    prev_result = await db.execute(
        select(LevelProgress).where(
            LevelProgress.user_id == student_id,
            LevelProgress.subject == data.subject,
            LevelProgress.game_type == data.game_type,
        )
    )
    prev_level = prev_result.scalar_one_or_none()
    prev_stars = prev_level.stars if prev_level else 0

    # فقط تفاوت ستاره نسبت به بهترین نتیجه قبلی پاداش داده می‌شه
    new_stars = max(0, data.stars_earned - prev_stars)
    new_coins = new_stars * COINS_PER_STAR

    # ── ذخیره session با مقادیر واقعی (نه مقادیر capped) ─────────────────────
    session = GameSession(
        student_id=student_id,
        subject=data.subject,
        game_type=data.game_type,
        score=data.score,
        stars_earned=new_stars,   # فقط ستاره‌های جدید
        coins_earned=new_coins,
        duration_seconds=data.duration_seconds,
        completed=data.completed,
    )
    db.add(session)

    # ── به‌روزرسانی کیف پول دانش‌آموز ────────────────────────────────────────
    student.stars += new_stars
    student.coins += new_coins
    student.level = (student.stars // STARS_PER_LEVEL) + 1

    # ── به‌روزرسانی LevelProgress (سقف ستاره مرحله) ──────────────────────────
    if prev_level:
        if data.stars_earned > prev_level.stars:
            prev_level.stars = data.stars_earned
        if data.score > prev_level.best_score:
            prev_level.best_score = data.score
        if not prev_level.completed and data.stars_earned > 0:
            prev_level.completed = True
            prev_level.completed_at = datetime.utcnow()
    else:
        db.add(LevelProgress(
            user_id=student_id,
            subject=data.subject,
            game_type=data.game_type,
            stars=data.stars_earned,
            best_score=data.score,
            completed=data.stars_earned > 0,
            completed_at=datetime.utcnow() if data.stars_earned > 0 else None,
        ))

    # ── به‌روزرسانی SubjectProgress ───────────────────────────────────────────
    prog_result = await db.execute(
        select(SubjectProgress).where(
            SubjectProgress.student_id == student_id,
            SubjectProgress.subject == data.subject
        )
    )
    progress = prog_result.scalar_one_or_none()
    if progress:
        progress.total_sessions += 1
        progress.total_stars += new_stars
        if data.score > progress.highest_score:
            progress.highest_score = data.score
        progress.last_played = datetime.utcnow()
    else:
        db.add(SubjectProgress(
            student_id=student_id, subject=data.subject,
            total_sessions=1, total_stars=new_stars,
            highest_score=data.score, last_played=datetime.utcnow()
        ))

    await db.commit()
    await db.refresh(session)
    return session


@router.get('/{student_id}/dashboard')
async def get_dashboard(student_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail='دانش‌آموز یافت نشد')

    sessions_result = await db.execute(
        select(GameSession)
        .where(GameSession.student_id == student_id)
        .order_by(GameSession.played_at.desc())
        .limit(10)
    )
    recent_sessions = sessions_result.scalars().all()

    progress_result = await db.execute(
        select(SubjectProgress).where(SubjectProgress.student_id == student_id)
    )
    subject_progress = progress_result.scalars().all()

    week_ago = datetime.utcnow() - timedelta(days=7)
    weekly_result = await db.execute(
        select(func.count(GameSession.id), func.sum(GameSession.stars_earned))
        .where(GameSession.student_id == student_id, GameSession.played_at >= week_ago)
    )
    weekly_row = weekly_result.one()

    return {
        'student': student,
        'recent_sessions': recent_sessions,
        'subject_progress': subject_progress,
        'weekly_stats': {
            'sessions': weekly_row[0] or 0,
            'stars': int(weekly_row[1] or 0)
        }
    }

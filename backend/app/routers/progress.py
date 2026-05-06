from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, GameSession, SubjectProgress
from ..schemas import GameSessionCreate, GameSessionOut

router = APIRouter(prefix='/api/progress', tags=['progress'])

STARS_PER_LEVEL = 50


@router.post('/{student_id}/session', response_model=GameSessionOut)
async def save_session(student_id: int, data: GameSessionCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail='دانش‌آموز یافت نشد')

    session = GameSession(student_id=student_id, **data.model_dump())
    db.add(session)

    student.stars += data.stars_earned
    student.coins += data.coins_earned
    student.level = (student.stars // STARS_PER_LEVEL) + 1

    prog_result = await db.execute(
        select(SubjectProgress).where(
            SubjectProgress.student_id == student_id,
            SubjectProgress.subject == data.subject
        )
    )
    progress = prog_result.scalar_one_or_none()
    if progress:
        progress.total_sessions += 1
        progress.total_stars += data.stars_earned
        if data.score > progress.highest_score:
            progress.highest_score = data.score
        progress.last_played = datetime.utcnow()
    else:
        db.add(SubjectProgress(
            student_id=student_id, subject=data.subject,
            total_sessions=1, total_stars=data.stars_earned,
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

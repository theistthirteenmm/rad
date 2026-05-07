from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from ..database import get_db
from ..models import LevelProgress
from ..routers.auth import get_current_user
from ..models import User
from pydantic import BaseModel

router = APIRouter(prefix='/api/levels', tags=['levels'])


class CompleteLevelRequest(BaseModel):
    subject: str
    game_type: str
    stars: int
    score: int


@router.get('/{subject}')
async def get_subject_progress(
    subject: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LevelProgress).where(
            LevelProgress.user_id == user.id,
            LevelProgress.subject == subject,
        )
    )
    rows = result.scalars().all()
    return {
        row.game_type: {
            'stars': row.stars,
            'best_score': row.best_score,
            'completed': row.completed,
            'completed_at': row.completed_at.isoformat() if row.completed_at else None,
        }
        for row in rows
    }


@router.post('/complete')
async def complete_level(
    data: CompleteLevelRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    فقط LevelProgress رو آپدیت می‌کنه — بدون دادن پاداش مستقیم.
    پاداش واقعی از طریق /progress/{id}/session داده می‌شه که سقف رو رعایت می‌کنه.
    """
    result = await db.execute(
        select(LevelProgress).where(
            LevelProgress.user_id == user.id,
            LevelProgress.subject == data.subject,
            LevelProgress.game_type == data.game_type,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        if data.stars > existing.stars:
            existing.stars = data.stars
        if data.score > existing.best_score:
            existing.best_score = data.score
        if not existing.completed and data.stars > 0:
            existing.completed = True
            existing.completed_at = datetime.utcnow()
    else:
        db.add(LevelProgress(
            user_id=user.id,
            subject=data.subject,
            game_type=data.game_type,
            stars=data.stars,
            best_score=data.score,
            completed=data.stars > 0,
            completed_at=datetime.utcnow() if data.stars > 0 else None,
        ))

    await db.commit()
    return {'ok': True}

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from ..database import get_db
from ..models import User
from ..schemas import UserOut
from ..cache import cache_get, cache_set, cache_del_pattern
from .auth import get_current_user, _user_out

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])

_CACHE_TTL = 120  # 2 minutes


@router.get("/school/{school_id}", response_model=list[UserOut])
async def school_leaderboard(
    school_id: int,
    grade_id: int | None = Query(None),
    class_id: int | None = Query(None),
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
):
    key = f"leaderboard:{school_id}:{grade_id}:{class_id}:{limit}"
    cached = await cache_get(key)
    if cached:
        return cached

    q = (
        select(User)
        .options(selectinload(User.school), selectinload(User.grade), selectinload(User.classroom))
        .where(User.role == "student", User.school_id == school_id)
        .order_by(desc(User.stars))
        .limit(limit)
    )
    if grade_id:
        q = q.where(User.grade_id == grade_id)
    if class_id:
        q = q.where(User.class_id == class_id)

    result = await db.execute(q)
    students = [_user_out(u) for u in result.scalars().all()]
    out = [s.model_dump() for s in students]
    await cache_set(key, out, ttl=_CACHE_TTL)
    return out


@router.get("/me", response_model=dict)
async def my_rank(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "student" or not user.school_id:
        return {"rank": None, "total": 0}

    count_q = await db.execute(
        select(User).where(
            User.role == "student",
            User.school_id == user.school_id,
            User.stars > user.stars,
        )
    )
    ahead = len(count_q.scalars().all())

    total_q = await db.execute(
        select(User).where(User.role == "student", User.school_id == user.school_id)
    )
    total = len(total_q.scalars().all())

    return {"rank": ahead + 1, "total": total, "stars": user.stars}

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from ..database import get_db
from ..models import User
from ..schemas import UserOut
from ..cache import cache_get, cache_set
from .auth import get_current_user, _user_out

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])

_CACHE_TTL = 120


def _assign_league(rank: int, total: int) -> str:
    if total == 0:
        return "bronze"
    pct = rank / total
    if pct <= 0.10 or rank <= 3:
        return "gold"
    if pct <= 0.35:
        return "silver"
    return "bronze"


async def _ranked(db: AsyncSession, school_id: int,
                  grade_id: int | None = None, class_id: int | None = None,
                  limit: int = 50) -> list[dict]:
    key = f"lb:{school_id}:{grade_id}:{class_id}:{limit}"
    cached = await cache_get(key)
    if cached:
        return cached

    q = (
        select(User)
        .options(selectinload(User.school), selectinload(User.grade), selectinload(User.classroom))
        .where(User.role == "student", User.school_id == school_id)
        .order_by(desc(User.stars), desc(User.level))
        .limit(limit)
    )
    if grade_id:
        q = q.where(User.grade_id == grade_id)
    if class_id:
        q = q.where(User.class_id == class_id)

    result = await db.execute(q)
    users = result.scalars().all()
    total = len(users)

    out = []
    for i, u in enumerate(users):
        d = _user_out(u).model_dump()
        d["rank"] = i + 1
        d["league"] = _assign_league(i + 1, total)
        out.append(d)

    await cache_set(key, out, ttl=_CACHE_TTL)
    return out


async def _total_count(db: AsyncSession, school_id: int,
                       grade_id: int | None, class_id: int | None) -> int:
    q = select(func.count()).select_from(User).where(
        User.role == "student", User.school_id == school_id)
    if grade_id:
        q = q.where(User.grade_id == grade_id)
    if class_id:
        q = q.where(User.class_id == class_id)
    r = await db.execute(q)
    return r.scalar_one()


@router.get("/school/{school_id}")
async def school_leaderboard(
    school_id: int,
    grade_id: int | None = Query(None),
    class_id: int | None = Query(None),
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await _ranked(db, school_id, grade_id, class_id, limit)


@router.get("/leagues/{school_id}")
async def leagues(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns gold/silver/bronze lists + my ranks in all 3 scopes."""
    key = f"leagues:{school_id}:{current_user.id}"
    cached = await cache_get(key)
    if cached:
        return cached

    school_list = await _ranked(db, school_id, limit=100)
    grade_list = await _ranked(db, school_id, current_user.grade_id, limit=50) \
        if current_user.grade_id else []
    class_list = await _ranked(db, school_id, current_user.grade_id,
                                current_user.class_id, limit=50) \
        if current_user.class_id else []

    def find_rank(lst, uid):
        for item in lst:
            if item["id"] == str(uid):
                return item["rank"], item["league"]
        return None, "bronze"

    school_rank, school_league = find_rank(school_list, current_user.id)
    grade_rank, grade_league = find_rank(grade_list, current_user.id)
    class_rank, class_league = find_rank(class_list, current_user.id)

    out = {
        "school": school_list[:50],
        "grade": grade_list[:30],
        "class": class_list[:30],
        "me": {
            "school_rank": school_rank,
            "school_total": len(school_list),
            "school_league": school_league,
            "grade_rank": grade_rank,
            "grade_total": len(grade_list),
            "grade_league": grade_league,
            "class_rank": class_rank,
            "class_total": len(class_list),
            "class_league": class_league,
        }
    }
    await cache_set(key, out, ttl=_CACHE_TTL)
    return out


@router.get("/me")
async def my_rank(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "student" or not user.school_id:
        return {"rank": None, "total": 0, "league": "bronze"}

    ahead = await db.execute(
        select(func.count()).select_from(User).where(
            User.role == "student",
            User.school_id == user.school_id,
            User.stars > user.stars,
        )
    )
    rank = ahead.scalar_one() + 1
    total = await _total_count(db, user.school_id, None, None)

    return {
        "rank": rank,
        "total": total,
        "stars": user.stars,
        "league": _assign_league(rank, total),
    }

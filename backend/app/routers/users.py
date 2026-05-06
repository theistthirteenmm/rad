from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete as sql_delete
from sqlalchemy.orm import selectinload
from ..database import get_db
from ..models import User, GameSession, LevelProgress
from ..schemas import UserOut, UpdateUserRequest
from .auth import get_current_user, _load_user, _user_out

router = APIRouter(prefix='/api/users', tags=['users'])


@router.get('/', response_model=list[UserOut])
async def list_users(
    role: str | None = None,
    school_id: str | None = None,
    grade_id: str | None = None,
    class_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(User).options(
        selectinload(User.school), selectinload(User.grade), selectinload(User.classroom)
    )
    if role:
        q = q.where(User.role == role)
    if school_id:
        q = q.where(User.school_id == int(school_id))
    if grade_id:
        q = q.where(User.grade_id == int(grade_id))
    if class_id:
        q = q.where(User.class_id == int(class_id))
    # school-scoped admin sees only their school; super admin (no school) sees all
    if current_user.role == 'admin' and current_user.school_id:
        q = q.where(User.school_id == current_user.school_id)
    elif current_user.role in ('teacher', 'parent') and current_user.school_id:
        q = q.where(User.school_id == current_user.school_id)
    result = await db.execute(q)
    return [_user_out(u) for u in result.scalars().all()]


@router.get('/child', response_model=UserOut | None)
async def find_child(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != 'parent' or not current_user.child_name:
        return None
    result = await db.execute(
        select(User)
        .options(selectinload(User.school), selectinload(User.grade), selectinload(User.classroom))
        .where(
            User.role == 'student',
            User.name == current_user.child_name,
            User.school_id == current_user.school_id,
            User.grade_id == current_user.grade_id,
            User.class_id == current_user.class_id,
        )
    )
    child = result.scalar_one_or_none()
    return _user_out(child) if child else None


@router.patch('/{user_id}', response_model=UserOut)
async def update_user(
    user_id: int,
    data: UpdateUserRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id != user_id and current_user.role != 'admin':
        raise HTTPException(403, 'Forbidden')
    r = await db.execute(select(User).where(User.id == user_id))
    user = r.scalar_one_or_none()
    if not user:
        raise HTTPException(404, 'کاربر یافت نشد')
    if data.stars is not None:
        user.stars = data.stars
    if data.coins is not None:
        user.coins = data.coins
    if data.level is not None:
        user.level = data.level
    if data.avatar is not None:
        user.avatar = data.avatar
    if data.teacher_name is not None:
        user.teacher_name = data.teacher_name
    await db.commit()
    full = await _load_user(db, user_id)
    return _user_out(full)


@router.delete('/{user_id}', status_code=204)
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != 'admin':
        raise HTTPException(403, 'Forbidden')
    if current_user.id == user_id:
        raise HTTPException(400, 'نمی‌توانی خودت را حذف کنی')
    r = await db.execute(select(User).where(User.id == user_id))
    user = r.scalar_one_or_none()
    if not user:
        raise HTTPException(404, 'کاربر یافت نشد')
    # school-scoped admin can only delete their own school users
    if current_user.school_id and user.school_id != current_user.school_id:
        raise HTTPException(403, 'Forbidden')
    await db.execute(sql_delete(GameSession).where(GameSession.user_id == user_id))
    await db.execute(sql_delete(LevelProgress).where(LevelProgress.user_id == user_id))
    await db.delete(user)
    await db.commit()

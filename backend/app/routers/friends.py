from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from ..database import get_db
from ..models import User, Friendship
from .auth import get_current_user

router = APIRouter(prefix='/api/friends', tags=['friends'])


@router.get('/')
async def list_friends(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Friendship).where(
            and_(
                or_(
                    Friendship.requester_id == current_user.id,
                    Friendship.addressee_id == current_user.id,
                ),
                Friendship.status == 'accepted',
            )
        )
    )
    friendships = result.scalars().all()

    friend_ids = [
        f.addressee_id if f.requester_id == current_user.id else f.requester_id
        for f in friendships
    ]

    if not friend_ids:
        return []

    users_result = await db.execute(select(User).where(User.id.in_(friend_ids)))
    friends = users_result.scalars().all()

    return [
        {
            'id': str(u.id),
            'username': u.username,
            'name': u.name,
            'avatar': u.avatar or 'avatar0',
            'stars': u.stars,
            'level': u.level,
        }
        for u in friends
    ]


@router.get('/requests')
async def pending_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Friendship).where(
            and_(
                Friendship.addressee_id == current_user.id,
                Friendship.status == 'pending',
            )
        )
    )
    reqs = result.scalars().all()

    if not reqs:
        return []

    requester_ids = [r.requester_id for r in reqs]
    users_result = await db.execute(select(User).where(User.id.in_(requester_ids)))
    users = {u.id: u for u in users_result.scalars().all()}

    return [
        {
            'request_id': r.id,
            'from_id': str(r.requester_id),
            'from_name': users[r.requester_id].name if r.requester_id in users else '?',
            'from_username': users[r.requester_id].username if r.requester_id in users else '?',
            'from_avatar': users[r.requester_id].avatar if r.requester_id in users else 'avatar0',
        }
        for r in reqs
    ]


@router.post('/request/{username}')
async def send_friend_request(
    username: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.username == username))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(404, 'کاربر یافت نشد')
    if target.id == current_user.id:
        raise HTTPException(400, 'نمی‌توانی با خودت دوست شوی')

    existing = await db.execute(
        select(Friendship).where(
            or_(
                and_(Friendship.requester_id == current_user.id, Friendship.addressee_id == target.id),
                and_(Friendship.requester_id == target.id, Friendship.addressee_id == current_user.id),
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, 'درخواست دوستی قبلاً ارسال شده یا دوستی برقرار است')

    f = Friendship(requester_id=current_user.id, addressee_id=target.id)
    db.add(f)
    await db.commit()
    return {'ok': True, 'message': 'درخواست دوستی ارسال شد'}


@router.post('/accept/{request_id}')
async def accept_friend_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Friendship).where(
            and_(
                Friendship.id == request_id,
                Friendship.addressee_id == current_user.id,
                Friendship.status == 'pending',
            )
        )
    )
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(404, 'درخواست یافت نشد')
    f.status = 'accepted'
    await db.commit()
    return {'ok': True, 'message': 'دوستی پذیرفته شد'}


@router.delete('/{user_id}')
async def remove_friend(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Friendship).where(
            or_(
                and_(Friendship.requester_id == current_user.id, Friendship.addressee_id == user_id),
                and_(Friendship.requester_id == user_id, Friendship.addressee_id == current_user.id),
            )
        )
    )
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(404, 'دوستی یافت نشد')
    await db.delete(f)
    await db.commit()
    return {'ok': True}

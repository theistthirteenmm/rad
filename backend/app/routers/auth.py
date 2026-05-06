from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import bcrypt as _bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, School
from ..schemas import RegisterRequest, LoginRequest, ChangeCredRequest, TokenResponse, UserOut
from ..config import settings

router = APIRouter(prefix='/api/auth', tags=['auth'])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/api/auth/login', auto_error=False)

ROLE_LABELS = {
    'student': 'دانش‌آموز', 'parent': 'اولیا',
    'teacher': 'معلم', 'admin': 'مدیر'
}


def _hash(pw: str) -> str:
    return _bcrypt.hashpw(pw.encode()[:72], _bcrypt.gensalt()).decode()


def _verify(pw: str, hashed: str) -> bool:
    return _bcrypt.checkpw(pw.encode()[:72], hashed.encode())


def _make_token(user_id: int) -> str:
    exp = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({'sub': str(user_id), 'exp': exp}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def _load_user(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(
        select(User)
        .options(selectinload(User.school), selectinload(User.grade), selectinload(User.classroom))
        .where(User.id == user_id)
    )
    return result.scalar_one_or_none()


def _user_out(u: User) -> UserOut:
    return UserOut(
        id=str(u.id),
        username=u.username,
        role=u.role,
        name=u.name,
        school=u.school.name if u.school else '',
        school_id=str(u.school_id) if u.school_id else '',
        grade=u.grade.name if u.grade else '',
        grade_id=str(u.grade_id) if u.grade_id else '',
        class_name=u.classroom.name if u.classroom else '',
        class_id=str(u.class_id) if u.class_id else '',
        teacher_name=u.teacher_name or '',
        avatar=u.avatar or 'avatar0',
        stars=u.stars,
        coins=u.coins,
        level=u.level,
        child_name=u.child_name,
        createdAt=int(u.created_at.timestamp() * 1000) if u.created_at else 0,
    )


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(status_code=401, detail='Not authenticated')
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = int(payload['sub'])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail='Invalid token')
    user = await _load_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail='User not found')
    return user


@router.post('/register', response_model=TokenResponse)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if len(data.username.strip()) < 3:
        raise HTTPException(400, 'نام کاربری باید حداقل ۳ حرف باشد')
    if not data.username.strip().replace('_', '').isalnum():
        raise HTTPException(400, 'نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و _ باشد')
    if len(data.password) < 4:
        raise HTTPException(400, 'رمز عبور باید حداقل ۴ کاراکتر باشد')
    if not data.name.strip():
        raise HTTPException(400, 'نام کاربر الزامی است')

    existing = await db.execute(select(User).where(User.username == data.username.strip()))
    if existing.scalar_one_or_none():
        raise HTTPException(400, 'این نام کاربری قبلاً ثبت شده است. یک نام دیگر انتخاب کنید')

    school_id: int | None = None
    if data.role == 'admin':
        if not data.school_name or not data.school_name.strip():
            raise HTTPException(400, 'نام مدرسه الزامی است')
        dup = await db.execute(select(School).where(School.name == data.school_name.strip()))
        if dup.scalar_one_or_none():
            raise HTTPException(400, 'مدرسه‌ای با این نام قبلاً ثبت شده است')
        school = School(name=data.school_name.strip())
        db.add(school)
        await db.flush()
        school_id = school.id
    else:
        if data.role == 'student' and not data.school_id:
            raise HTTPException(400, 'لطفاً مدرسه را انتخاب کنید')
        if data.role == 'student' and not data.grade_id:
            raise HTTPException(400, 'لطفاً پایه تحصیلی را انتخاب کنید')
        if data.role == 'student' and not data.class_id:
            raise HTTPException(400, 'لطفاً کلاس را انتخاب کنید')
        if data.role == 'parent' and not data.child_name:
            raise HTTPException(400, 'لطفاً نام فرزند را وارد کنید')
        school_id = int(data.school_id) if data.school_id else None

    user = User(
        username=data.username.strip(),
        password_hash=_hash(data.password),
        role=data.role,
        name=data.name.strip(),
        school_id=school_id,
        grade_id=int(data.grade_id) if data.grade_id else None,
        class_id=int(data.class_id) if data.class_id else None,
        teacher_name=data.teacher_name,
        avatar=data.avatar,
        child_name=data.child_name,
    )
    db.add(user)
    await db.commit()

    full = await _load_user(db, user.id)
    return TokenResponse(access_token=_make_token(user.id), user=_user_out(full))


@router.post('/login', response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    if not data.username.strip():
        raise HTTPException(400, 'نام کاربری را وارد کنید')
    if not data.password:
        raise HTTPException(400, 'رمز عبور را وارد کنید')

    result = await db.execute(
        select(User)
        .options(selectinload(User.school), selectinload(User.grade), selectinload(User.classroom))
        .where(User.username == data.username.strip())
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(400, 'نام کاربری وجود ندارد')
    if user.role != data.role:
        raise HTTPException(400, f'این حساب با نقش «{ROLE_LABELS.get(user.role, user.role)}» ثبت شده است')
    if not _verify(data.password, user.password_hash):
        raise HTTPException(400, 'رمز عبور اشتباه است')

    return TokenResponse(access_token=_make_token(user.id), user=_user_out(user))


@router.get('/me', response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return _user_out(user)


@router.patch('/credentials')
async def change_credentials(
    data: ChangeCredRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if len(data.new_username.strip()) < 3:
        raise HTTPException(400, 'نام کاربری باید حداقل ۳ حرف باشد')
    if len(data.new_password) < 6:
        raise HTTPException(400, 'رمز عبور باید حداقل ۶ کاراکتر باشد')

    dup = await db.execute(
        select(User).where(User.username == data.new_username.strip(), User.id != user.id)
    )
    if dup.scalar_one_or_none():
        raise HTTPException(400, 'این نام کاربری قبلاً توسط شخص دیگری استفاده شده')

    user.username = data.new_username.strip()
    user.password_hash = _hash(data.new_password)
    await db.commit()

    full = await _load_user(db, user.id)
    return {'ok': True, 'user': _user_out(full).model_dump()}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db, AsyncSessionLocal
from .routers import games
from .routers.auth import router as auth_router, _hash
from .routers.schools import router as schools_router
from .routers.users import router as users_router
from .routers.progress import router as progress_router
from .routers.leaderboard import router as leaderboard_router
from .routers.levels import router as levels_router
from .routers.battle import router as battle_router
from .routers.friends import router as friends_router
from .routers.accounting import router as accounting_router
from .routers.exams import router as exams_router
from .models import User
from sqlalchemy import select

app = FastAPI(title='رادین - بازی آموزشی کلاس اول', version='2.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth_router)
app.include_router(schools_router)
app.include_router(users_router)
app.include_router(progress_router)
app.include_router(leaderboard_router)
app.include_router(levels_router)
app.include_router(games.router)
app.include_router(battle_router)
app.include_router(friends_router)
app.include_router(accounting_router)
app.include_router(exams_router)


@app.on_event('startup')
async def startup():
    await init_db()
    await _seed_superadmin()


async def _seed_superadmin():
    async with AsyncSessionLocal() as db:
        r = await db.execute(select(User).where(User.username == 'hamed'))
        u = r.scalar_one_or_none()
        if u:
            u.role = 'admin'
            u.name = 'حامد — مدیر کل'
            u.school_id = None
        else:
            u = User(
                username='hamed',
                password_hash=_hash('H@med_Rad#2026'),
                role='admin',
                name='حامد — مدیر کل',
                school_id=None,
            )
            db.add(u)
        await db.commit()


@app.get('/')
async def root():
    return {'message': 'رادین - بازی آموزشی کلاس اول', 'status': 'ok'}


@app.get('/health')
async def health():
    return {'status': 'ok'}

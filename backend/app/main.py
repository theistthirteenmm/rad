from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routers import games
from .routers.auth import router as auth_router
from .routers.schools import router as schools_router
from .routers.users import router as users_router
from .routers.progress import router as progress_router
from .routers.leaderboard import router as leaderboard_router

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
app.include_router(games.router)


@app.on_event('startup')
async def startup():
    await init_db()


@app.get('/')
async def root():
    return {'message': 'رادین - بازی آموزشی کلاس اول', 'status': 'ok'}


@app.get('/health')
async def health():
    return {'status': 'ok'}

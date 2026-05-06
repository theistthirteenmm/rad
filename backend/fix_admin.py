import asyncio
import bcrypt
import sys
sys.path.insert(0, '/app')

PASSWORD = 'H@med_Rad#2026'

async def fix():
    from app.database import AsyncSessionLocal
    from app.models import User
    from sqlalchemy import select

    h = bcrypt.hashpw(PASSWORD.encode()[:72], bcrypt.gensalt()).decode()

    async with AsyncSessionLocal() as db:
        r = await db.execute(select(User).where(User.username == 'hamed'))
        u = r.scalar_one_or_none()
        if u:
            u.password_hash = h
            u.role = 'admin'
            u.school_id = None
            await db.commit()
            print(f'OK - hash: {h[:20]}...')
        else:
            new_u = User(username='hamed', password_hash=h, role='admin', name='hamed', school_id=None)
            db.add(new_u)
            await db.commit()
            print('Created new user hamed')

asyncio.run(fix())

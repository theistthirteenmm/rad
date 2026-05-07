"""
battle.py — بازی گروهی real-time با WebSocket
matchmaking از طریق Redis، state بازی در حافظه
"""
import asyncio
import json
import random
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..cache import get_redis

router = APIRouter(prefix='/api/battle', tags=['battle'])

# ── سوالات بازی ──────────────────────────────────────────────────────────────
QUESTIONS = [
    {'q': '۳ + ۴ = ?',   'a': '۷',  'choices': ['۵', '۶', '۷', '۸']},
    {'q': '۸ - ۳ = ?',   'a': '۵',  'choices': ['۳', '۴', '۵', '۶']},
    {'q': '۲ + ۶ = ?',   'a': '۸',  'choices': ['۷', '۸', '۹', '۱۰']},
    {'q': '۹ - ۴ = ?',   'a': '۵',  'choices': ['۳', '۴', '۵', '۶']},
    {'q': '۵ + ۵ = ?',   'a': '۱۰', 'choices': ['۸', '۹', '۱۰', '۱۱']},
    {'q': '۷ - ۲ = ?',   'a': '۵',  'choices': ['۴', '۵', '۶', '۷']},
    {'q': '۴ + ۳ = ?',   'a': '۷',  'choices': ['۵', '۶', '۷', '۸']},
    {'q': '۶ + ۲ = ?',   'a': '۸',  'choices': ['۶', '۷', '۸', '۹']},
    {'q': '۱۰ - ۳ = ?',  'a': '۷',  'choices': ['۵', '۶', '۷', '۸']},
    {'q': '۳ + ۵ = ?',   'a': '۸',  'choices': ['۶', '۷', '۸', '۹']},
    {'q': '۶ - ۴ = ?',   'a': '۲',  'choices': ['۱', '۲', '۳', '۴']},
    {'q': '۷ + ۱ = ?',   'a': '۸',  'choices': ['۶', '۷', '۸', '۹']},
    {'q': 'حرف اول «سیب» چیه؟', 'a': 'س', 'choices': ['ب', 'س', 'ی', 'آ']},
    {'q': 'حرف اول «ماه» چیه؟',  'a': 'م', 'choices': ['م', 'ا', 'ه', 'و']},
    {'q': 'حرف اول «گل» چیه؟',   'a': 'گ', 'choices': ['ک', 'گ', 'ل', 'ا']},
    {'q': '۲ × ۳ = ?',   'a': '۶',  'choices': ['۴', '۵', '۶', '۷']},
    {'q': '۴ × ۲ = ?',   'a': '۸',  'choices': ['۶', '۷', '۸', '۹']},
    {'q': '۵ × ۲ = ?',   'a': '۱۰', 'choices': ['۸', '۹', '۱۰', '۱۱']},
]

RACE_DISTANCE = 100   # مسافت کل مسیر
FUEL_PER_Q    = 20    # سوخت هر جواب درست
TOTAL_TIME    = 60    # ثانیه کل مسابقه
Q_TIME        = 8     # ثانیه هر سوال

# ── نگهداری اتاق‌های بازی در حافظه ──────────────────────────────────────────
# { room_id: { 'players': {uid: ws}, 'state': {...} } }
_rooms: dict[str, dict] = {}

# ── صف انتظار: { grade_id: [(uid, name, avatar, ws, ts)] } ──────────────────
_queue: dict[str, list] = {}


async def _send(ws: WebSocket, msg: dict):
    try:
        await ws.send_text(json.dumps(msg, ensure_ascii=False))
    except Exception:
        pass


async def _broadcast(room_id: str, msg: dict):
    room = _rooms.get(room_id)
    if not room:
        return
    for ws in room['players'].values():
        await _send(ws, msg)


def _make_questions(n=10):
    pool = random.sample(QUESTIONS, min(n, len(QUESTIONS)))
    return [{'q': q['q'], 'choices': q['choices'], 'a': q['a']} for q in pool]


async def _run_game(room_id: str):
    """اجرای کامل بازی در یه coroutine"""
    room = _rooms[room_id]
    state = room['state']
    questions = state['questions']
    uids = list(room['players'].keys())

    # ── شمارش معکوس ──────────────────────────────────────────────────────────
    for i in range(3, 0, -1):
        await _broadcast(room_id, {'type': 'countdown', 'count': i})
        await asyncio.sleep(1)

    await _broadcast(room_id, {'type': 'start', 'total_time': TOTAL_TIME})
    state['started_at'] = time.time()
    state['phase'] = 'playing'

    # ── حلقه سوالات ──────────────────────────────────────────────────────────
    for qi, q in enumerate(questions):
        if state['phase'] != 'playing':
            break

        state['current_q'] = qi
        state['q_answers'] = {}  # uid → True/False

        await _broadcast(room_id, {
            'type': 'question',
            'index': qi,
            'total': len(questions),
            'q': q['q'],
            'choices': q['choices'],
            'time': Q_TIME,
        })

        # صبر کن تا همه جواب بدن یا وقت تموم بشه
        deadline = time.time() + Q_TIME
        while time.time() < deadline:
            if len(state['q_answers']) >= len(uids):
                break
            # چک کن مسابقه تموم شده؟
            elapsed = time.time() - state['started_at']
            if elapsed >= TOTAL_TIME:
                state['phase'] = 'finished'
                break
            await asyncio.sleep(0.1)

        # نتیجه سوال
        await _broadcast(room_id, {
            'type': 'q_result',
            'correct': q['a'],
            'positions': state['positions'],
            'answers': state['q_answers'],
        })
        await asyncio.sleep(1.2)

        # چک کن کسی برنده شده؟
        for uid, pos in state['positions'].items():
            if pos >= RACE_DISTANCE:
                state['phase'] = 'finished'
                state['winner'] = uid
                break

        if state['phase'] == 'finished':
            break

        # چک کن وقت کل تموم شده؟
        elapsed = time.time() - state['started_at']
        if elapsed >= TOTAL_TIME:
            state['phase'] = 'finished'
            break

    # ── پایان مسابقه ─────────────────────────────────────────────────────────
    if 'winner' not in state:
        # هرکی جلوتره برنده
        positions = state['positions']
        winner = max(positions, key=lambda u: positions[u])
        state['winner'] = winner

    await _broadcast(room_id, {
        'type': 'game_over',
        'winner': state['winner'],
        'positions': state['positions'],
        'scores': state['scores'],
    })

    # پاک‌سازی بعد از ۳۰ ثانیه
    await asyncio.sleep(30)
    _rooms.pop(room_id, None)


@router.websocket('/ws/{grade_id}/{user_id}/{user_name}/{avatar}')
async def battle_ws(
    websocket: WebSocket,
    grade_id: str,
    user_id: str,
    user_name: str,
    avatar: str,
):
    await websocket.accept()
    room_id: str | None = None

    try:
        # ── matchmaking ──────────────────────────────────────────────────────
        if grade_id not in _queue:
            _queue[grade_id] = []

        # پاک‌سازی اتصال‌های قدیمی از صف
        _queue[grade_id] = [
            p for p in _queue[grade_id]
            if time.time() - p['ts'] < 30
        ]

        # آیا کسی در صف هست؟
        if _queue[grade_id]:
            # جفت شدن با اولین نفر در صف
            opponent = _queue[grade_id].pop(0)
            room_id = f"room_{grade_id}_{int(time.time()*1000)}"

            questions = _make_questions(10)

            _rooms[room_id] = {
                'players': {
                    opponent['uid']: opponent['ws'],
                    user_id: websocket,
                },
                'state': {
                    'phase': 'countdown',
                    'questions': questions,
                    'current_q': -1,
                    'q_answers': {},
                    'positions': {opponent['uid']: 0, user_id: 0},
                    'scores': {opponent['uid']: 0, user_id: 0},
                    'started_at': 0,
                }
            }

            # اطلاع به هر دو بازیکن
            await _send(opponent['ws'], {
                'type': 'matched',
                'room_id': room_id,
                'my_id': opponent['uid'],
                'opponent': {'id': user_id, 'name': user_name, 'avatar': avatar},
            })
            await _send(websocket, {
                'type': 'matched',
                'room_id': room_id,
                'my_id': user_id,
                'opponent': {'id': opponent['uid'], 'name': opponent['name'], 'avatar': opponent['avatar']},
            })

            # شروع بازی
            asyncio.create_task(_run_game(room_id))

        else:
            # اضافه شدن به صف
            _queue[grade_id].append({
                'uid': user_id,
                'name': user_name,
                'avatar': avatar,
                'ws': websocket,
                'ts': time.time(),
            })
            await _send(websocket, {'type': 'waiting'})

        # ── دریافت پیام‌ها ────────────────────────────────────────────────────
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            if msg['type'] == 'answer' and room_id:
                room = _rooms.get(room_id)
                if not room:
                    continue
                state = room['state']
                if state['phase'] != 'playing':
                    continue

                qi = state['current_q']
                if qi < 0 or qi >= len(state['questions']):
                    continue

                q = state['questions'][qi]
                correct = msg['answer'] == q['a']

                # ثبت جواب (فقط اولین جواب هر بازیکن)
                if user_id not in state['q_answers']:
                    state['q_answers'][user_id] = correct
                    if correct:
                        state['positions'][user_id] = min(
                            state['positions'][user_id] + FUEL_PER_Q,
                            RACE_DISTANCE
                        )
                        state['scores'][user_id] = state['scores'].get(user_id, 0) + 10

                    # اطلاع فوری به همه
                    await _broadcast(room_id, {
                        'type': 'player_answered',
                        'uid': user_id,
                        'correct': correct,
                        'positions': state['positions'],
                    })

            elif msg['type'] == 'cancel':
                # خروج از صف
                if grade_id in _queue:
                    _queue[grade_id] = [
                        p for p in _queue[grade_id] if p['uid'] != user_id
                    ]
                break

    except WebSocketDisconnect:
        pass
    finally:
        # پاک‌سازی از صف
        if grade_id in _queue:
            _queue[grade_id] = [p for p in _queue[grade_id] if p['uid'] != user_id]

        # اطلاع به حریف
        if room_id and room_id in _rooms:
            room = _rooms[room_id]
            room['state']['phase'] = 'finished'
            for uid, ws in room['players'].items():
                if uid != user_id:
                    await _send(ws, {'type': 'opponent_left'})

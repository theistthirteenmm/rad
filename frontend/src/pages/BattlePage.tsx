import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { api } from '../lib/apiClient'

const AVATARS = ['🦁', '🐯', '🐻', '🦊', '🐼', '🐸', '🦋', '🐬']
const RACE_DISTANCE = 100
const TOTAL_TIME = 60

type Phase =
  | 'menu'        // انتخاب حالت بازی
  | 'friends'     // لیست دوستان
  | 'searching'   // دنبال حریف
  | 'matched'     // جفت شد
  | 'countdown'   // شمارش معکوس
  | 'playing'     // در حال بازی
  | 'q_result'    // نتیجه سوال
  | 'finished'    // پایان

interface Player {
  id: string
  name: string
  avatar: string
  position: number
  score: number
}

interface Question {
  q: string
  choices: string[]
  index: number
  total: number
  timeLeft: number
}

interface Friend {
  id: string
  username: string
  name: string
  avatar: string
  stars: number
  level: number
}

interface BattleInvite {
  invite_id: string
  from_id: string
  from_name: string
  from_avatar: string
  room_id: string
}

function getAvatar(val: string) {
  if (val?.startsWith('data:')) return null
  return AVATARS[parseInt(val?.replace('avatar', '') || '0')] || '🦁'
}

function AvatarDisplay({ avatar, size = 44 }: { avatar: string; size?: number }) {
  const emoji = getAvatar(avatar)
  if (!emoji) {
    return (
      <img src={avatar} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#f0eeff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.55 }}>
      {emoji}
    </div>
  )
}

function RaceTrack({ me, opponent }: { me: Player; opponent: Player }) {
  const myPct = Math.min((me.position / RACE_DISTANCE) * 100, 100)
  const oppPct = Math.min((opponent.position / RACE_DISTANCE) * 100, 100)

  return (
    <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AvatarDisplay avatar={me.avatar} size={32} />
            <span style={{ fontWeight: 700, fontSize: 14, color: '#6C63FF' }}>{me.name.split(' ')[0]} (من)</span>
          </div>
          <span style={{ fontSize: 13, color: '#FFB703', fontWeight: 700 }}>⭐ {me.score}</span>
        </div>
        <div style={{ height: 28, background: '#f0eeff', borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
          <motion.div animate={{ width: `${myPct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            style={{ height: '100%', background: 'linear-gradient(90deg,#6C63FF,#a855f7)',
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              paddingRight: 6, minWidth: 32 }}>
            <span style={{ fontSize: 18 }}>🚗</span>
          </motion.div>
          <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🏁</div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AvatarDisplay avatar={opponent.avatar} size={32} />
            <span style={{ fontWeight: 700, fontSize: 14, color: '#FF6584' }}>{opponent.name.split(' ')[0]}</span>
          </div>
          <span style={{ fontSize: 13, color: '#FFB703', fontWeight: 700 }}>⭐ {opponent.score}</span>
        </div>
        <div style={{ height: 28, background: '#fff0f3', borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
          <motion.div animate={{ width: `${oppPct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            style={{ height: '100%', background: 'linear-gradient(90deg,#FF6584,#FF8FA3)',
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              paddingRight: 6, minWidth: 32 }}>
            <span style={{ fontSize: 18 }}>🚙</span>
          </motion.div>
          <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🏁</div>
        </div>
      </div>
    </div>
  )
}

export default function BattlePage() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useStore(s => s.user)


  const [phase, setPhase] = useState<Phase>('menu')
  const [countdown, setCountdown] = useState(3)
  const [searchTime, setSearchTime] = useState(0)
  const [roomId, setRoomId] = useState('')
  const [myId, setMyId] = useState('')
  const [me, setMe] = useState<Player | null>(null)
  const [opponent, setOpponent] = useState<Player | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
  const [winner, setWinner] = useState<string | null>(null)

  // Friends state
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<any[]>([])
  const [addUsername, setAddUsername] = useState('')
  const [addMsg, setAddMsg] = useState('')
  const [pendingInvites, setPendingInvites] = useState<BattleInvite[]>([])
  const [sentInviteRoomId, setSentInviteRoomId] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const qTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const invitePollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (qTimerRef.current) clearInterval(qTimerRef.current)
  }

  // Load friends & requests
  const loadFriends = useCallback(async () => {
    try {
      const [fl, rl] = await Promise.all([
        api.get<Friend[]>('/friends/'),
        api.get<any[]>('/friends/requests'),
      ])
      setFriends(fl.data)
      setFriendRequests(rl.data)
    } catch {}
  }, [])

  // Poll for battle invites when on friends/menu screen
  useEffect(() => {
    if (phase !== 'menu' && phase !== 'friends') {
      if (invitePollRef.current) clearInterval(invitePollRef.current)
      return
    }
    const poll = async () => {
      try {
        const { data } = await api.get<BattleInvite[]>('/battle/invites')
        setPendingInvites(data)
      } catch {}
    }
    poll()
    invitePollRef.current = setInterval(poll, 3000)
    return () => { if (invitePollRef.current) clearInterval(invitePollRef.current) }
  }, [phase])

  useEffect(() => {
    if (phase === 'friends') loadFriends()
  }, [phase])

  const buildWsUrl = (path: string) =>
    `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/battle${path}`

  const setupWsHandlers = useCallback((ws: WebSocket, currentMyId: string) => {
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)

      if (msg.type === 'waiting') {
        setPhase('searching')
      } else if (msg.type === 'matched') {
        setMyId(msg.my_id)
        setRoomId(msg.room_id)
        setMe({ id: msg.my_id, name: user!.name, avatar: user!.avatar || 'avatar0', position: 0, score: 0 })
        setOpponent({ id: msg.opponent.id, name: msg.opponent.name, avatar: msg.opponent.avatar, position: 0, score: 0 })
        setPhase('matched')
      } else if (msg.type === 'countdown') {
        setPhase('countdown')
        setCountdown(msg.count)
      } else if (msg.type === 'start') {
        setPhase('playing')
        setTimeLeft(TOTAL_TIME)
        timerRef.current = setInterval(() => {
          setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current!); return 0 } return t - 1 })
        }, 1000)
      } else if (msg.type === 'question') {
        setQuestion({ q: msg.q, choices: msg.choices, index: msg.index, total: msg.total, timeLeft: msg.time })
        setSelectedAnswer(null)
        setCorrectAnswer(null)
        setPhase('playing')
        if (qTimerRef.current) clearInterval(qTimerRef.current)
        let qt = msg.time
        qTimerRef.current = setInterval(() => {
          qt--
          setQuestion(prev => prev ? { ...prev, timeLeft: qt } : null)
          if (qt <= 0) clearInterval(qTimerRef.current!)
        }, 1000)
      } else if (msg.type === 'player_answered') {
        const pos = msg.positions
        setMe(prev => prev ? { ...prev, position: pos[prev.id] ?? prev.position, score: prev.score + (msg.uid === prev.id && msg.correct ? 10 : 0) } : null)
        setOpponent(prev => prev ? { ...prev, position: pos[prev.id] ?? prev.position, score: prev.score + (msg.uid === prev.id && msg.correct ? 10 : 0) } : null)
      } else if (msg.type === 'q_result') {
        setCorrectAnswer(msg.correct)
        setPhase('q_result')
        const pos = msg.positions
        setMe(prev => prev ? { ...prev, position: pos[prev.id] ?? prev.position } : null)
        setOpponent(prev => prev ? { ...prev, position: pos[prev.id] ?? prev.position } : null)
        if (qTimerRef.current) clearInterval(qTimerRef.current)
      } else if (msg.type === 'game_over') {
        clearTimers()
        setWinner(msg.winner)
        const pos = msg.positions; const sc = msg.scores
        setMe(prev => prev ? { ...prev, position: pos[prev.id] ?? prev.position, score: sc[prev.id] ?? prev.score } : null)
        setOpponent(prev => prev ? { ...prev, position: pos[prev.id] ?? prev.position, score: sc[prev.id] ?? prev.score } : null)
        setPhase('finished')
      } else if (msg.type === 'opponent_left') {
        clearTimers()
        setPhase('finished')
        setWinner(currentMyId)
      }
    }
    ws.onclose = () => { clearTimers() }
  }, [user])

  const connectRandom = useCallback(() => {
    if (!user) return
    const ws = new WebSocket(buildWsUrl(`/ws/${user.grade_id || 'all'}/${user.id}/${encodeURIComponent(user.name)}/${encodeURIComponent(user.avatar || 'avatar0')}`))
    wsRef.current = ws
    const uid = String(user.id)
    setMyId(uid)
    setupWsHandlers(ws, uid)
    setPhase('searching')
    setSearchTime(0)
  }, [user, setupWsHandlers])

  const connectPrivate = useCallback((roomId: string) => {
    if (!user) return
    const ws = new WebSocket(buildWsUrl(`/ws/private/${roomId}/${user.id}/${encodeURIComponent(user.name)}/${encodeURIComponent(user.avatar || 'avatar0')}`))
    wsRef.current = ws
    const uid = String(user.id)
    setMyId(uid)
    setRoomId(roomId)
    setupWsHandlers(ws, uid)
    setPhase('searching')
    setSearchTime(0)
  }, [user, setupWsHandlers])

  useEffect(() => {
    // If deep-linked with ?room=... (from invite accept)
    const room = searchParams.get('room')
    if (room) connectPrivate(room)
    return () => { clearTimers(); wsRef.current?.close() }
  }, [])

  useEffect(() => {
    if (phase !== 'searching') return
    const t = setInterval(() => setSearchTime(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  const sendAnswer = (answer: string) => {
    if (selectedAnswer || phase !== 'playing') return
    setSelectedAnswer(answer)
    wsRef.current?.send(JSON.stringify({ type: 'answer', answer }))
  }

  const cancel = () => {
    wsRef.current?.send(JSON.stringify({ type: 'cancel' }))
    wsRef.current?.close()
    setPhase('menu')
  }

  const sendBattleInvite = async (friendId: string) => {
    try {
      const { data } = await api.post<{ invite_id: string; room_id: string }>(`/battle/invite/${friendId}`)
      setSentInviteRoomId(data.room_id)
      connectPrivate(data.room_id)
    } catch {}
  }

  const acceptBattleInvite = async (invite: BattleInvite) => {
    try { await api.delete(`/battle/invite/${invite.invite_id}`) } catch {}
    connectPrivate(invite.room_id)
  }

  const declineInvite = async (invite: BattleInvite) => {
    try { await api.delete(`/battle/invite/${invite.invite_id}`) } catch {}
    setPendingInvites(prev => prev.filter(i => i.invite_id !== invite.invite_id))
  }

  const addFriend = async () => {
    if (!addUsername.trim()) return
    try {
      const { data } = await api.post<{ ok: boolean; message: string }>(`/friends/request/${addUsername.trim()}`)
      setAddMsg(data.message)
      setAddUsername('')
    } catch (e: any) {
      setAddMsg(e.response?.data?.detail || 'خطا در ارسال درخواست')
    }
  }

  const acceptFriend = async (requestId: number) => {
    try { await api.post(`/friends/accept/${requestId}`) } catch {}
    loadFriends()
  }

  if (!user) { nav('/login'); return null }

  // ── منو اصلی ──────────────────────────────────────────────────────────────
  if (phase === 'menu') return (
    <div className="container" style={{ paddingTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => nav('/')} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>←</button>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#6C63FF' }}>⚔️ بازی رقابتی</h2>
      </div>

      {/* دعوت‌نامه‌های بازی */}
      {pendingInvites.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {pendingInvites.map(inv => (
            <motion.div key={inv.invite_id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="card" style={{ padding: '14px 16px', marginBottom: 10,
                border: '2px solid #FF6584', background: '#fff0f3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <AvatarDisplay avatar={inv.from_avatar} size={40} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#FF6584' }}>{inv.from_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>دعوت به بازی رقابتی</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => acceptBattleInvite(inv)} style={{
                  flex: 1, padding: '10px', borderRadius: 12, background: '#06D6A0',
                  color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                  ✅ قبول
                </button>
                <button onClick={() => declineInvite(inv)} style={{
                  flex: 1, padding: '10px', borderRadius: 12, background: '#f0f0f0',
                  color: 'var(--text-light)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  رد کردن
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={connectRandom}
          style={{ padding: '20px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#6C63FF,#a855f7)', color: 'white',
            fontFamily: 'inherit', textAlign: 'right' }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🎲</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>بازی تصادفی</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>با یه حریف تصادفی بازی کن</div>
        </motion.button>

        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setPhase('friends')}
          style={{ padding: '20px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#FF6584,#ff8fa3)', color: 'white',
            fontFamily: 'inherit', textAlign: 'right' }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>👫</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>بازی با دوست</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
            دوستانت را دعوت کن — {friends.length > 0 ? `${friends.length} دوست` : 'لیست دوستان'}
          </div>
        </motion.button>
      </div>
    </div>
  )

  // ── صفحه دوستان ───────────────────────────────────────────────────────────
  if (phase === 'friends') return (
    <div className="container" style={{ paddingTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => setPhase('menu')} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>←</button>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#FF6584' }}>👫 دوستان من</h2>
      </div>

      {/* اضافه کردن دوست */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#6C63FF', marginBottom: 10 }}>➕ اضافه کردن دوست</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={addUsername} onChange={e => { setAddUsername(e.target.value); setAddMsg('') }}
            onKeyDown={e => e.key === 'Enter' && addFriend()}
            placeholder="نام کاربری دوستت" dir="ltr"
            style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '2px solid #e2e8f0',
              fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          <button onClick={addFriend} style={{ padding: '10px 18px', borderRadius: 12,
            background: '#6C63FF', color: 'white', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontFamily: 'inherit' }}>ارسال</button>
        </div>
        {addMsg && <div style={{ fontSize: 13, color: '#06D6A0', marginTop: 8 }}>✅ {addMsg}</div>}
      </div>

      {/* درخواست‌های دوستی */}
      {friendRequests.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#FF9800', marginBottom: 10 }}>
            🔔 درخواست‌های دوستی ({friendRequests.length})
          </div>
          {friendRequests.map(req => (
            <div key={req.request_id} style={{ display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <AvatarDisplay avatar={req.from_avatar} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{req.from_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>@{req.from_username}</div>
              </div>
              <button onClick={() => acceptFriend(req.request_id)} style={{
                padding: '8px 14px', borderRadius: 10, background: '#06D6A0',
                color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13 }}>
                قبول
              </button>
            </div>
          ))}
        </div>
      )}

      {/* لیست دوستان */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 14, color: '#6C63FF', marginBottom: 10 }}>
          دوستان ({friends.length})
        </div>
        {friends.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-light)', fontSize: 14 }}>
            هنوز دوستی نداری! اسم کاربری دوستت رو وارد کن 👆
          </div>
        ) : (
          friends.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
              <AvatarDisplay avatar={f.avatar} size={42} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{f.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>⭐ {f.stars} · سطح {f.level}</div>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => sendBattleInvite(f.id)}
                style={{ padding: '10px 14px', borderRadius: 12,
                  background: 'linear-gradient(135deg,#FF6584,#ff8fa3)',
                  color: 'white', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: 700, fontSize: 13 }}>
                ⚔️ دعوت
              </motion.button>
            </div>
          ))
        )}
      </div>
    </div>
  )

  // ── صفحه جستجو / انتظار ───────────────────────────────────────────────────
  if (phase === 'searching') return (
    <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        style={{ fontSize: '4rem', display: 'inline-block', marginBottom: 20 }}>
        {sentInviteRoomId ? '⏳' : '🔍'}
      </motion.div>
      <h2 style={{ fontSize: 20, color: '#6C63FF', marginBottom: 8 }}>
        {sentInviteRoomId ? 'منتظر قبول دوستت هستم...' : 'دنبال حریف می‌گردم...'}
      </h2>
      <p style={{ color: 'var(--text-light)', fontSize: 13 }}>{searchTime} ثانیه</p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '24px 0' }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.4 }}
            style={{ width: 12, height: 12, borderRadius: '50%', background: '#6C63FF' }} />
        ))}
      </div>

      <button onClick={cancel}
        style={{ padding: '12px 32px', borderRadius: 14, background: '#f0f0f0',
          color: 'var(--text-light)', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
        انصراف
      </button>
    </div>
  )

  // ── جفت شد ────────────────────────────────────────────────────────────────
  if (phase === 'matched' && opponent) return (
    <div className="container" style={{ textAlign: 'center', paddingTop: 40 }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚔️</div>
        <h2 style={{ fontSize: 22, color: '#6C63FF', marginBottom: 24 }}>حریف پیدا شد!</h2>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <AvatarDisplay avatar={user.avatar || 'avatar0'} size={64} />
            <div style={{ fontWeight: 700, marginTop: 8, color: '#6C63FF' }}>{user.name.split(' ')[0]}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>من</div>
          </div>
          <div style={{ fontSize: '2rem', color: '#FF6584', fontWeight: 900 }}>VS</div>
          <div style={{ textAlign: 'center' }}>
            <AvatarDisplay avatar={opponent.avatar} size={64} />
            <div style={{ fontWeight: 700, marginTop: 8, color: '#FF6584' }}>{opponent.name.split(' ')[0]}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>حریف</div>
          </div>
        </div>
        <p style={{ color: 'var(--text-light)', marginTop: 24, fontSize: 14 }}>آماده باش...</p>
      </motion.div>
    </div>
  )

  // ── شمارش معکوس ───────────────────────────────────────────────────────────
  if (phase === 'countdown') return (
    <div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
      <AnimatePresence mode="wait">
        <motion.div key={countdown}
          initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          style={{ fontSize: '8rem', fontWeight: 900, color: '#6C63FF', lineHeight: 1 }}>
          {countdown}
        </motion.div>
      </AnimatePresence>
      <p style={{ fontSize: 18, color: 'var(--text-light)', marginTop: 20 }}>آماده باش!</p>
    </div>
  )

  // ── پایان بازی ────────────────────────────────────────────────────────────
  if (phase === 'finished' && me && opponent) {
    const iWon = winner === myId
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 30 }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="card" style={{ padding: 32 }}>
          <div style={{ fontSize: '4rem', marginBottom: 12 }}>{iWon ? '🏆' : '😔'}</div>
          <h2 style={{ fontSize: 24, color: iWon ? '#FFB703' : '#6C63FF', marginBottom: 8 }}>
            {iWon ? 'بردی! آفرین!' : 'باختی، دفعه بعد بهتر!'}
          </h2>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, margin: '20px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <AvatarDisplay avatar={me.avatar} size={52} />
              <div style={{ fontWeight: 700, marginTop: 6, fontSize: 14 }}>{me.name.split(' ')[0]}</div>
              <div style={{ color: '#FFB703', fontWeight: 700 }}>⭐ {me.score}</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)' }}>🚗 {me.position}%</div>
            </div>
            <div style={{ fontSize: '1.5rem', alignSelf: 'center', color: '#aaa' }}>VS</div>
            <div style={{ textAlign: 'center' }}>
              <AvatarDisplay avatar={opponent.avatar} size={52} />
              <div style={{ fontWeight: 700, marginTop: 6, fontSize: 14 }}>{opponent.name.split(' ')[0]}</div>
              <div style={{ color: '#FFB703', fontWeight: 700 }}>⭐ {opponent.score}</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)' }}>🚙 {opponent.position}%</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => { wsRef.current?.close(); setSentInviteRoomId(null); connectRandom() }}
              style={{ flex: 1, padding: '12px', borderRadius: 14, background: '#f0eeff',
                color: '#6C63FF', border: 'none', cursor: 'pointer', fontSize: 14,
                fontWeight: 700, fontFamily: 'inherit' }}>
              🔄 دوباره
            </button>
            <button onClick={() => nav('/')}
              style={{ flex: 1, padding: '12px', borderRadius: 14,
                background: 'linear-gradient(135deg,#6C63FF,#a855f7)',
                color: 'white', border: 'none', cursor: 'pointer', fontSize: 14,
                fontWeight: 700, fontFamily: 'inherit' }}>
              🏠 خانه
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── صفحه بازی ─────────────────────────────────────────────────────────────
  if ((phase === 'playing' || phase === 'q_result') && me && opponent && question) {
    const qTimePct = (question.timeLeft / 8) * 100
    const totalTimePct = (timeLeft / TOTAL_TIME) * 100
    const timerColor = timeLeft <= 10 ? '#FF6584' : timeLeft <= 20 ? '#FF9800' : '#06D6A0'

    return (
      <div className="container" style={{ paddingBottom: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12,
            fontWeight: 700, color: timerColor, marginBottom: 4 }}>
            <span>⏱ {timeLeft} ثانیه مانده</span>
            <span>سوال {question.index + 1} از {question.total}</span>
          </div>
          <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4 }}>
            <motion.div animate={{ width: `${totalTimePct}%` }}
              style={{ height: '100%', background: timerColor, borderRadius: 4, transition: 'width 1s linear' }} />
          </div>
        </div>

        <RaceTrack me={me} opponent={opponent} />

        <AnimatePresence mode="wait">
          <motion.div key={question.index}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="card" style={{ marginBottom: 14, textAlign: 'center' }}>
            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, marginBottom: 12 }}>
              <motion.div animate={{ width: `${qTimePct}%` }}
                style={{ height: '100%', borderRadius: 3, transition: 'width 1s linear',
                  background: question.timeLeft <= 3 ? '#FF6584' : '#6C63FF' }} />
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
              {question.q}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-light)' }}>⏱ {question.timeLeft} ثانیه</p>
          </motion.div>
        </AnimatePresence>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {question.choices.map(choice => {
            const isSelected = selectedAnswer === choice
            const isCorrect = correctAnswer === choice
            const isWrong = isSelected && correctAnswer && choice !== correctAnswer

            let bg = '#f0eeff', border = '#e0d8ff', color = '#6C63FF'
            if (phase === 'q_result') {
              if (isCorrect) { bg = '#06D6A0'; border = 'transparent'; color = 'white' }
              else if (isWrong) { bg = '#FF6584'; border = 'transparent'; color = 'white' }
              else { bg = '#f5f5f5'; border = '#e0e0e0'; color = '#aaa' }
            } else if (isSelected) {
              bg = '#6C63FF'; border = 'transparent'; color = 'white'
            }

            return (
              <motion.button key={choice}
                whileTap={{ scale: phase === 'playing' && !selectedAnswer ? 0.95 : 1 }}
                onClick={() => sendAnswer(choice)}
                disabled={!!selectedAnswer || phase === 'q_result'}
                style={{ padding: '18px 12px', borderRadius: 16, fontSize: 22, fontWeight: 800,
                  background: bg, border: `2px solid ${border}`, cursor: selectedAnswer ? 'default' : 'pointer',
                  color, transition: 'all 0.2s', fontFamily: 'inherit' }}>
                {choice}
              </motion.button>
            )
          })}
        </div>

        {phase === 'q_result' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', marginTop: 12, fontSize: 14,
              color: selectedAnswer === correctAnswer ? '#06D6A0' : '#FF6584', fontWeight: 700 }}>
            {selectedAnswer === correctAnswer ? '🎉 درست! ماشینت جلو رفت!' : '😅 اشتباه بود...'}
          </motion.div>
        )}
      </div>
    )
  }

  return null
}

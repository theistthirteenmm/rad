import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'

const AVATARS = ['🦁', '🐯', '🐻', '🦊', '🐼', '🐸', '🦋', '🐬']
const RACE_DISTANCE = 100
const TOTAL_TIME = 60

type Phase =
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

/** نوار پیشرفت ماشین */
function RaceTrack({ me, opponent, myId }: { me: Player; opponent: Player; myId: string }) {
  const myPct = Math.min((me.position / RACE_DISTANCE) * 100, 100)
  const oppPct = Math.min((opponent.position / RACE_DISTANCE) * 100, 100)

  return (
    <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
      {/* بازیکن من */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AvatarDisplay avatar={me.avatar} size={32} />
            <span style={{ fontWeight: 700, fontSize: 14, color: '#6C63FF' }}>
              {me.name.split(' ')[0]} (من)
            </span>
          </div>
          <span style={{ fontSize: 13, color: '#FFB703', fontWeight: 700 }}>⭐ {me.score}</span>
        </div>
        <div style={{ height: 28, background: '#f0eeff', borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
          <motion.div
            animate={{ width: `${myPct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            style={{ height: '100%', background: 'linear-gradient(90deg,#6C63FF,#a855f7)',
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              paddingRight: 6, minWidth: 32 }}>
            <span style={{ fontSize: 18 }}>🚗</span>
          </motion.div>
          <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            fontSize: 18 }}>🏁</div>
        </div>
      </div>

      {/* حریف */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AvatarDisplay avatar={opponent.avatar} size={32} />
            <span style={{ fontWeight: 700, fontSize: 14, color: '#FF6584' }}>
              {opponent.name.split(' ')[0]}
            </span>
          </div>
          <span style={{ fontSize: 13, color: '#FFB703', fontWeight: 700 }}>⭐ {opponent.score}</span>
        </div>
        <div style={{ height: 28, background: '#fff0f3', borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
          <motion.div
            animate={{ width: `${oppPct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            style={{ height: '100%', background: 'linear-gradient(90deg,#FF6584,#FF8FA3)',
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              paddingRight: 6, minWidth: 32 }}>
            <span style={{ fontSize: 18 }}>🚙</span>
          </motion.div>
          <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            fontSize: 18 }}>🏁</div>
        </div>
      </div>
    </div>
  )
}

export default function BattlePage() {
  const nav = useNavigate()
  const user = useStore(s => s.user)

  const [phase, setPhase] = useState<Phase>('searching')
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

  const wsRef = useRef<WebSocket | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const qTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (qTimerRef.current) clearInterval(qTimerRef.current)
  }

  const connect = useCallback(() => {
    if (!user) return
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/battle/ws/${user.grade_id || 'all'}/${user.id}/${encodeURIComponent(user.name)}/${encodeURIComponent(user.avatar || 'avatar0')}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)

      if (msg.type === 'waiting') {
        setPhase('searching')
      }

      else if (msg.type === 'matched') {
        setMyId(msg.my_id)
        setRoomId(msg.room_id)
        setMe({
          id: msg.my_id,
          name: user.name,
          avatar: user.avatar || 'avatar0',
          position: 0,
          score: 0,
        })
        setOpponent({
          id: msg.opponent.id,
          name: msg.opponent.name,
          avatar: msg.opponent.avatar,
          position: 0,
          score: 0,
        })
        setPhase('matched')
      }

      else if (msg.type === 'countdown') {
        setPhase('countdown')
        setCountdown(msg.count)
      }

      else if (msg.type === 'start') {
        setPhase('playing')
        setTimeLeft(TOTAL_TIME)
        // تایمر کلی
        timerRef.current = setInterval(() => {
          setTimeLeft(t => {
            if (t <= 1) { clearInterval(timerRef.current!) ; return 0 }
            return t - 1
          })
        }, 1000)
      }

      else if (msg.type === 'question') {
        setQuestion({
          q: msg.q,
          choices: msg.choices,
          index: msg.index,
          total: msg.total,
          timeLeft: msg.time,
        })
        setSelectedAnswer(null)
        setCorrectAnswer(null)
        setPhase('playing')
        // تایمر سوال
        if (qTimerRef.current) clearInterval(qTimerRef.current)
        let qt = msg.time
        qTimerRef.current = setInterval(() => {
          qt--
          setQuestion(prev => prev ? { ...prev, timeLeft: qt } : null)
          if (qt <= 0) clearInterval(qTimerRef.current!)
        }, 1000)
      }

      else if (msg.type === 'player_answered') {
        const pos = msg.positions
        setMe(prev => prev ? { ...prev, position: pos[prev.id] ?? prev.position,
          score: prev.score + (msg.uid === prev.id && msg.correct ? 10 : 0) } : null)
        setOpponent(prev => prev ? { ...prev, position: pos[prev.id] ?? prev.position,
          score: prev.score + (msg.uid === prev.id && msg.correct ? 10 : 0) } : null)
      }

      else if (msg.type === 'q_result') {
        setCorrectAnswer(msg.correct)
        setPhase('q_result')
        const pos = msg.positions
        setMe(prev => prev ? { ...prev, position: pos[prev.id] ?? prev.position } : null)
        setOpponent(prev => prev ? { ...prev, position: pos[prev.id] ?? prev.position } : null)
        if (qTimerRef.current) clearInterval(qTimerRef.current)
      }

      else if (msg.type === 'game_over') {
        clearTimers()
        setWinner(msg.winner)
        const pos = msg.positions
        const sc = msg.scores
        setMe(prev => prev ? { ...prev, position: pos[prev.id] ?? prev.position, score: sc[prev.id] ?? prev.score } : null)
        setOpponent(prev => prev ? { ...prev, position: pos[prev.id] ?? prev.position, score: sc[prev.id] ?? prev.score } : null)
        setPhase('finished')
      }

      else if (msg.type === 'opponent_left') {
        clearTimers()
        setPhase('finished')
        setWinner(myId)
      }
    }

    ws.onclose = () => {
      clearTimers()
    }
  }, [user, myId])

  useEffect(() => {
    connect()
    return () => {
      clearTimers()
      wsRef.current?.close()
    }
  }, [])

  // شمارش زمان جستجو
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
    nav('/')
  }

  if (!user) { nav('/login'); return null }

  // ── صفحه جستجو ────────────────────────────────────────────────────────────
  if (phase === 'searching') return (
    <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        style={{ fontSize: '4rem', display: 'inline-block', marginBottom: 20 }}>
        🔍
      </motion.div>
      <h2 style={{ fontSize: 20, color: '#6C63FF', marginBottom: 8 }}>دنبال حریف می‌گردم...</h2>
      <p style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 4 }}>
        پایه {user.grade || 'شما'}
      </p>
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
          color: 'var(--text-light)', border: 'none', cursor: 'pointer',
          fontSize: 14, fontFamily: 'inherit' }}>
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
          <div style={{ fontSize: '4rem', marginBottom: 12 }}>
            {iWon ? '🏆' : '😔'}
          </div>
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
            <button onClick={() => { wsRef.current?.close(); connect(); setPhase('searching'); setSearchTime(0) }}
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
        {/* تایمر کلی */}
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

        {/* مسیر مسابقه */}
        <RaceTrack me={me} opponent={opponent} myId={myId} />

        {/* سوال */}
        <AnimatePresence mode="wait">
          <motion.div key={question.index}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="card" style={{ marginBottom: 14, textAlign: 'center' }}>

            {/* تایمر سوال */}
            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, marginBottom: 12 }}>
              <motion.div animate={{ width: `${qTimePct}%` }}
                style={{ height: '100%', borderRadius: 3, transition: 'width 1s linear',
                  background: question.timeLeft <= 3 ? '#FF6584' : '#6C63FF' }} />
            </div>

            <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
              {question.q}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
              ⏱ {question.timeLeft} ثانیه
            </p>
          </motion.div>
        </AnimatePresence>

        {/* گزینه‌ها */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {question.choices.map(choice => {
            const isSelected = selectedAnswer === choice
            const isCorrect = correctAnswer === choice
            const isWrong = isSelected && correctAnswer && choice !== correctAnswer

            let bg = '#f0eeff'
            let border = '#e0d8ff'
            let color = '#6C63FF'

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
                style={{
                  padding: '18px 12px', borderRadius: 16, fontSize: 22, fontWeight: 800,
                  background: bg, border: `2px solid ${border}`, cursor: selectedAnswer ? 'default' : 'pointer',
                  color, transition: 'all 0.2s', fontFamily: 'inherit',
                }}>
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

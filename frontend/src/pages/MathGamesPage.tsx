import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api, useSaveSession } from '../hooks/useApi'
import { useStore } from '../store/useStore'
import { useTimer } from '../hooks/useTimer'
import { useLevelProgress } from '../hooks/useLevelProgress'
import { SUBJECT_LEVELS, type LevelDef } from '../lib/levels'
import LevelMap from '../components/LevelMap'
import RewardModal from '../components/RewardModal'
import TeacherVoice from '../components/TeacherVoice'

const COLOR = '#6C63FF'
const SUBJECT = 'math'

// ─── Rocket Game (with 20s timer) ────────────────────────────────────────────
function RocketGame({ problems, onComplete, timerSec }: any) {
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [height, setHeight] = useState(0)
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong' | 'timeout'>('idle')
  const [timeouts, setTimeouts] = useState(0)

  const advance = (won: boolean) => {
    timer.stop()
    const newScore = won ? score + 10 : score
    const isLast = idx + 1 >= problems.length
    if (won) setHeight(h => Math.min(h + 20, 100))
    setTimeout(() => {
      if (isLast) {
        const stars = newScore >= 70 ? 3 : newScore >= 40 ? 2 : 1
        onComplete(newScore, stars)
      } else {
        setIdx(i => i + 1); setAnswer(''); setStatus('idle')
        timer.reset(); timer.start()
      }
    }, 800)
  }

  const timer = useTimer(timerSec, () => {
    if (status !== 'idle') return
    setTimeouts(t => t + 1); setStatus('timeout'); advance(false)
  })

  useEffect(() => { if (problems.length > 0) timer.start() }, [])

  const check = () => {
    if (status !== 'idle') return
    const p = problems[idx]
    if (parseInt(answer) === p.answer) { setStatus('correct'); advance(true) }
    else { setStatus('wrong'); setTimeout(() => { setStatus('idle'); setAnswer('') }, 700) }
  }

  if (!problems[idx]) return null
  const p = problems[idx]
  const timerColor = timer.urgent ? '#FF6584' : timer.timeLeft <= 10 ? '#FF9800' : COLOR

  return (
    <div>
      {/* Timer bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700,
          color: timerColor, marginBottom: 4 }}>
          <span>⏱ {timer.timeLeft}ث</span>
          <span>{idx + 1} / {problems.length}</span>
        </div>
        <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4 }}>
          <motion.div animate={{ width: `${timer.pct}%` }} transition={{ duration: 0.5 }}
            style={{ height: '100%', background: timerColor, borderRadius: 4 }} />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ height: 100, background: '#f0eeff', borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
          <motion.div animate={{ bottom: `${height}%` }}
            style={{ position: 'absolute', fontSize: '2.5rem', left: '50%', transform: 'translateX(-50%)' }}>
            🚀
          </motion.div>
        </div>
      </div>

      <motion.div key={idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="card" style={{ textAlign: 'center', marginBottom: 14 }}>
        <p style={{ fontSize: 34, fontWeight: 700, color: COLOR }}>
          {p.a} {p.type === 'add' ? '+' : '-'} {p.b} = ?
        </p>
        <TeacherVoice
          text={`${p.a} ${p.type === 'add' ? 'به‌علاوه' : 'منهای'} ${p.b} مساوی چنده؟`}
          style={{ justifyContent: 'center', color: 'var(--text-light)' }} fontSize={12} />
        {timeouts > 0 && <p style={{ fontSize: 11, color: '#FF6584' }}>⏱ {timeouts} بار وقت تموم شد</p>}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 12 }}>
        {[1,2,3,4,5,6,7,8,9,0].map(n => (
          <button key={n} onClick={() => status === 'idle' && setAnswer(a => a + n)}
            style={{ padding: 12, borderRadius: 10, fontSize: 18, fontWeight: 700,
              background: '#f0eeff', border: '2px solid #e0d8ff', cursor: 'pointer', color: COLOR }}>
            {n}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setAnswer(a => a.slice(0, -1))}
          style={{ flex: 1, padding: 12, borderRadius: 10, background: '#ffe0e0', border: 'none', cursor: 'pointer', color: '#FF6584', fontSize: 16 }}>
          ⌫
        </button>
        <button className={`btn ${status === 'correct' ? 'btn-success' : 'btn-primary'}`}
          style={{ flex: 3 }} onClick={check} disabled={!answer || status !== 'idle'}>
          {status === 'correct' ? '🎉 درست!' : status === 'wrong' ? '❌ اشتباه!' : status === 'timeout' ? '⏱ وقت تموم شد' : `= ${answer || '?'} ✓`}
        </button>
      </div>
    </div>
  )
}

// ─── Market Game ──────────────────────────────────────────────────────────────
const ITEMS = [
  { name: 'سیب', price: 3, emoji: '🍎' },
  { name: 'نان', price: 2, emoji: '🍞' },
  { name: 'شیر', price: 5, emoji: '🥛' },
  { name: 'پنیر', price: 4, emoji: '🧀' },
  { name: 'موز', price: 6, emoji: '🍌' },
]

function MarketGame({ onComplete, timerSec }: any) {
  const [coins, setCoins] = useState(20)
  const [cart, setCart] = useState<any[]>([])
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [target] = useState(() => Math.floor(Math.random() * 8) + 8)
  const [done, setDone] = useState(false)
  const [expired, setExpired] = useState(false)

  const timer = useTimer(timerSec, () => { if (!done) setExpired(true) })
  useEffect(() => { timer.start() }, [])

  const total = cart.reduce((s, i) => s + i.price, 0)

  const buy = (item: any) => {
    if (coins < item.price || expired) return
    const newCart = [...cart, item]
    const newTotal = total + item.price
    setCoins(c => c - item.price)
    setCart(newCart)
    if (newTotal === target) {
      setScore(s => s + 30); timer.stop(); setDone(true)
    } else if (newTotal > target) {
      setCart([]); setCoins(20)
    }
  }

  if (done || expired) {
    const stars = done ? (round <= 1 ? 3 : 2) : 1
    return (
      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="card" style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: '3.5rem' }}>{done ? '🎉' : '⏱️'}</div>
        <h2 style={{ marginTop: 8 }}>{done ? `دقیقاً ${target} تومان!` : 'وقت تموم شد!'}</h2>
        <p style={{ color: 'var(--text-light)', marginTop: 8 }}>امتیاز: {score}</p>
        <button className="btn btn-success" style={{ marginTop: 16 }} onClick={() => onComplete(score, stars)}>
          دریافت جایزه 🎁
        </button>
      </motion.div>
    )
  }

  const timerColor = timer.urgent ? '#FF6584' : timer.timeLeft <= 15 ? '#FF9800' : '#FFB703'

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700,
          color: timerColor, marginBottom: 4 }}>
          <span>⏱ {timer.timeLeft}ث</span>
          <span>هدف: {target} تومان</span>
        </div>
        <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4 }}>
          <motion.div animate={{ width: `${timer.pct}%` }} transition={{ duration: 0.5 }}
            style={{ height: '100%', background: timerColor, borderRadius: 4 }} />
        </div>
      </div>

      <TeacherVoice text={`با ${coins} تومان، دقیقاً ${target} تومان خرید کن`}
        style={{ justifyContent: 'center', display: 'flex', marginBottom: 8, color: 'var(--text-light)' }} fontSize={13} />
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, padding: '10px 16px' }}>
        <span>💰 {coins} موجودی</span>
        <span style={{ color: total > target ? '#FF6584' : total === target ? '#06D6A0' : 'var(--text)' }}>
          🛒 {total} / {target}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {ITEMS.map(item => (
          <button key={item.name} onClick={() => buy(item)}
            style={{ padding: '14px', borderRadius: 14,
              background: coins >= item.price ? '#f0fff9' : '#f7f7f7',
              border: `2px solid ${coins >= item.price ? '#06D6A0' : '#e2e8f0'}`,
              cursor: coins >= item.price ? 'pointer' : 'not-allowed',
              opacity: coins >= item.price ? 1 : 0.5 }}>
            <div style={{ fontSize: '1.8rem' }}>{item.emoji}</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
            <div style={{ color: '#06D6A0', fontWeight: 700 }}>{item.price} ت</div>
          </button>
        ))}
      </div>

      {cart.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {cart.map((item, i) => (
            <span key={i} style={{ background: '#f0eeff', borderRadius: 8, padding: '3px 8px', fontSize: 13 }}>
              {item.emoji}{item.price}
            </span>
          ))}
          <button onClick={() => { setCart([]); setCoins(20) }}
            style={{ background: '#ffe0e0', border: 'none', borderRadius: 8, padding: '3px 10px',
              fontSize: 12, color: '#FF6584', cursor: 'pointer' }}>
            🗑️
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Pattern Game ─────────────────────────────────────────────────────────────
const PATTERNS = [
  { sequence: [1,2,3,4,'?'], answer: 5 },
  { sequence: [2,4,6,8,'?'], answer: 10 },
  { sequence: [10,9,8,7,'?'], answer: 6 },
  { sequence: [1,3,5,7,'?'], answer: 9 },
  { sequence: [5,10,15,20,'?'], answer: 25 },
  { sequence: [3,6,9,12,'?'], answer: 15 },
]

function PatternGame({ onComplete }: any) {
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<'idle'|'correct'|'wrong'>('idle')

  const p = PATTERNS[idx]

  const check = () => {
    if (parseInt(answer) === p.answer) {
      setStatus('correct')
      const ns = score + 15
      setTimeout(() => {
        if (idx + 1 >= PATTERNS.length) onComplete(ns, ns >= 60 ? 3 : ns >= 30 ? 2 : 1)
        else { setIdx(i => i + 1); setAnswer(''); setStatus('idle') }
      }, 700)
      setScore(ns)
    } else {
      setStatus('wrong')
      setTimeout(() => { setStatus('idle'); setAnswer('') }, 700)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-light)' }}>{idx + 1} از {PATTERNS.length}</div>
      <div className="progress-bar" style={{ marginBottom: 16 }}>
        <div className="progress-fill" style={{ width: `${(idx / PATTERNS.length) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
          <TeacherVoice text={`دنباله اعداد: ${p.sequence.filter((n: any) => n !== '?').join('، ')}. عدد بعدی چنده؟`}
            style={{ justifyContent: 'center', marginBottom: 12, color: 'var(--text-light)' }} fontSize={14} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {p.sequence.map((n, i) => (
              <div key={i} style={{ width: 48, height: 48, borderRadius: 12, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700,
                background: n === '?' ? '#06D6A0' : '#f0eeff',
                color: n === '?' ? 'white' : COLOR,
                border: n === '?' ? 'none' : '2px solid #e0d8ff' }}>
                {n}
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <input type="number" value={answer} onChange={e => setAnswer(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && check()} placeholder="جواب..."
        style={{ width: '100%', padding: 14, borderRadius: 14, border: '2px solid',
          borderColor: status === 'correct' ? '#06D6A0' : status === 'wrong' ? '#FF6584' : '#e2e8f0',
          fontSize: 20, textAlign: 'center', marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />

      <button className={`btn ${status === 'correct' ? 'btn-success' : 'btn-primary'}`}
        onClick={check} disabled={!answer || status !== 'idle'}>
        {status === 'correct' ? '🎉 درست!' : status === 'wrong' ? '❌ اشتباه!' : '✓ بررسی'}
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MathGamesPage() {
  const nav = useNavigate()
  const student = useStore(s => s.student)
  const saveSession = useSaveSession()
  const { progress, saveLevel } = useLevelProgress(SUBJECT)
  const [activeLevel, setActiveLevel] = useState<LevelDef | null>(null)
  const [problems, setProblems] = useState<any[]>([])
  const [reward, setReward] = useState<{ stars: number; coins: number } | null>(null)

  useEffect(() => {
    api.getMathProblems(student?.level || 1, 8).then(r => setProblems(r.data)).catch(() => {
      setProblems(Array.from({ length: 8 }, (_, i) => ({
        a: Math.floor(Math.random() * 9) + 1,
        b: Math.floor(Math.random() * 9) + 1,
        type: Math.random() > 0.5 ? 'add' : 'sub',
        get answer() { return this.type === 'add' ? this.a + this.b : Math.abs(this.a - this.b) }
      })))
    })
  }, [student])

  const handleComplete = async (gameType: string, score: number, stars: number) => {
    const coins = stars * 5
    await saveSession({ subject: SUBJECT, game_type: gameType, score, stars_earned: stars, coins_earned: coins, duration_seconds: 60, completed: true })
    await saveLevel(gameType, stars, score)
    setReward({ stars, coins })
  }

  if (reward) return (
    <div className="container">
      <RewardModal stars={reward.stars} coins={reward.coins}
        onClose={() => { setReward(null); setActiveLevel(null) }} onHome={() => nav('/')} />
    </div>
  )

  if (activeLevel) {
    const gt = activeLevel.gameType
    const ts = activeLevel.timerSeconds ?? 20
    return (
      <div className="container">
        <button onClick={() => setActiveLevel(null)}
          style={{ marginBottom: 16, background: 'none', color: 'var(--text-light)', fontSize: 14, border: 'none', cursor: 'pointer' }}>
          ← برگشت
        </button>
        <h2 style={{ marginBottom: 16, color: COLOR }}>{activeLevel.icon} {activeLevel.title}</h2>
        {gt === 'rocket' && problems.length > 0 && (
          <RocketGame problems={problems} timerSec={ts} onComplete={(s: number, st: number) => handleComplete(gt, s, st)} />
        )}
        {gt === 'market' && (
          <MarketGame timerSec={ts} onComplete={(s: number, st: number) => handleComplete(gt, s, st)} />
        )}
        {gt === 'pattern' && (
          <PatternGame onComplete={(s: number, st: number) => handleComplete(gt, s, st)} />
        )}
      </div>
    )
  }

  const totalDone = Object.values(progress).filter(r => r.completed).length
  const totalStars = Object.values(progress).reduce((a, r) => a + (r.stars || 0), 0)

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button onClick={() => nav('/')} style={{ background: 'none', fontSize: 20, border: 'none', cursor: 'pointer' }}>←</button>
        <h1 style={{ fontSize: 22, color: COLOR }}>🔢 درس ریاضی</h1>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '12px 16px',
        background: 'linear-gradient(135deg,#f0eeff,#fff)', border: `2px solid ${COLOR}20` }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLOR }}>{totalDone}</div>
            <div style={{ fontSize: 11, color: 'var(--text-light)' }}>مرحله تموم</div>
          </div>
          <div style={{ width: 1, background: '#f0f0f0' }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFB703' }}>{totalStars}⭐</div>
            <div style={{ fontSize: 11, color: 'var(--text-light)' }}>ستاره</div>
          </div>
          <div style={{ width: 1, background: '#f0f0f0' }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#06D6A0' }}>
              {SUBJECT_LEVELS.math.filter(l => !l.comingSoon).length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-light)' }}>کل مراحل</div>
          </div>
        </div>
      </div>

      <LevelMap levels={SUBJECT_LEVELS.math} progress={progress} color={COLOR} onPlay={setActiveLevel} />
    </div>
  )
}

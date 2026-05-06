import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api, useSaveSession } from '../hooks/useApi'
import { useStore } from '../store/useStore'
import RewardModal from '../components/RewardModal'

type GameType = null | 'rocket' | 'market' | 'pattern'

export default function MathGamesPage() {
  const nav = useNavigate()
  const student = useStore(s => s.student)
  const saveSession = useSaveSession()
  const [game, setGame] = useState<GameType>(null)
  const [problems, setProblems] = useState<any[]>([])
  const [reward, setReward] = useState<{ stars: number; coins: number } | null>(null)

  useEffect(() => {
    api.getMathProblems(student?.level || 1, 8).then(r => setProblems(r.data)).catch(() => {})
  }, [student])

  const handleComplete = async (gameType: string, score: number, stars: number) => {
    const coins = stars * 5
    await saveSession({ subject: 'riazi', game_type: gameType, score, stars_earned: stars, coins_earned: coins, duration_seconds: 60, completed: true })
    setReward({ stars, coins })
  }

  if (reward) return (
    <div className="container">
      <RewardModal stars={reward.stars} coins={reward.coins}
        onClose={() => { setReward(null); setGame(null) }} onHome={() => nav('/')} />
    </div>
  )

  if (game === 'rocket') return <RocketGame problems={problems} onComplete={(s, st) => handleComplete('rocket', s, st)} onBack={() => setGame(null)} />
  if (game === 'market') return <MarketGame onComplete={(s, st) => handleComplete('market', s, st)} onBack={() => setGame(null)} />
  if (game === 'pattern') return <PatternGame onComplete={(s, st) => handleComplete('pattern', s, st)} onBack={() => setGame(null)} />

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => nav('/')} style={{ background: 'none', fontSize: 20 }}>←</button>
        <h1 style={{ fontSize: 22, color: 'var(--primary)' }}>🔢 درس ریاضی</h1>
      </div>

      {[
        { id: 'rocket', icon: '🚀', title: 'موشک اعداد', desc: 'جمع و تفریق سریع، موشکت بالاتر میره!', color: '#6C63FF' },
        { id: 'market', icon: '🛒', title: 'بازار ریاضی', desc: 'با سکه‌های مجازی خرید کن', color: '#FFB703' },
        { id: 'pattern', icon: '🧩', title: 'الگوی اعداد', desc: 'دنباله اعداد رو کامل کن', color: '#06D6A0' },
      ].map((g, i) => (
        <motion.button key={g.id}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setGame(g.id as GameType)}
          className="card"
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
          <div style={{ fontSize: '2.5rem', background: `${g.color}22`, borderRadius: 16,
            width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{g.icon}</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: g.color }}>{g.title}</div>
            <div style={{ color: 'var(--text-light)', fontSize: 13, marginTop: 2 }}>{g.desc}</div>
          </div>
        </motion.button>
      ))}
    </div>
  )
}

function RocketGame({ problems, onComplete, onBack }: any) {
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [height, setHeight] = useState(0)
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')

  const p = problems[idx]
  if (!p) return null

  const check = () => {
    if (parseInt(answer) === p.answer) {
      setStatus('correct')
      setScore(s => s + 10)
      setHeight(h => Math.min(h + 20, 100))
      setTimeout(() => {
        if (idx + 1 >= problems.length) {
          const stars = score >= 70 ? 3 : score >= 40 ? 2 : 1
          onComplete(score + 10, stars)
        } else {
          setIdx(i => i + 1)
          setAnswer('')
          setStatus('idle')
        }
      }, 800)
    } else {
      setStatus('wrong')
      setTimeout(() => { setStatus('idle'); setAnswer('') }, 800)
    }
  }

  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: 16, background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
      <h2 style={{ marginBottom: 16, color: 'var(--primary)' }}>🚀 موشک اعداد</h2>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ height: 120, background: '#f0eeff', borderRadius: 16, position: 'relative', overflow: 'hidden', marginBottom: 8 }}>
          <motion.div animate={{ bottom: `${height}%` }}
            style={{ position: 'absolute', fontSize: '3rem', left: '50%', transform: 'translateX(-50%)' }}>
            🚀
          </motion.div>
          <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 12, color: 'var(--text-light)' }}>
            ارتفاع: {height}%
          </div>
        </div>
      </div>

      <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 36, fontWeight: 700 }}>
          {p.a} {p.type === 'add' ? '+' : '-'} {p.b} = ?
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {[0,1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => setAnswer(a => a + n)}
            style={{ padding: '14px', borderRadius: 12, fontSize: 20, fontWeight: 700,
              background: '#f0eeff', border: '2px solid #e0d8ff', cursor: 'pointer', color: 'var(--primary)' }}>
            {n}
          </button>
        ))}
        <button onClick={() => setAnswer(a => a.slice(0, -1))}
          style={{ padding: '14px', borderRadius: 12, fontSize: 16, background: '#ffe0e0',
            border: '2px solid #ffc0c0', cursor: 'pointer', color: '#FF6584' }}>⌫</button>
      </div>

      {answer && (
        <div style={{ textAlign: 'center', marginBottom: 12, fontSize: 24, fontWeight: 700,
          color: status === 'correct' ? '#06D6A0' : status === 'wrong' ? '#FF6584' : 'var(--primary)' }}>
          = {answer}
        </div>
      )}

      <button className={`btn ${status === 'correct' ? 'btn-success' : 'btn-primary'}`}
        onClick={check} disabled={!answer || status !== 'idle'}>
        {status === 'correct' ? '🎉 درست!' : status === 'wrong' ? '❌ اشتباه!' : '✓ بررسی'}
      </button>
    </div>
  )
}

const ITEMS = [
  { name: 'سیب', price: 3, emoji: '🍎' },
  { name: 'نان', price: 2, emoji: '🍞' },
  { name: 'شیر', price: 5, emoji: '🥛' },
  { name: 'پنیر', price: 4, emoji: '🧀' },
  { name: 'موز', price: 6, emoji: '🍌' },
]

function MarketGame({ onComplete, onBack }: any) {
  const [coins, setCoins] = useState(20)
  const [cart, setCart] = useState<any[]>([])
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [target, setTarget] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => { setTarget(Math.floor(Math.random() * 10) + 8) }, [round])

  const buy = (item: any) => {
    if (coins < item.price) return
    setCoins(c => c - item.price)
    setCart(c => [...c, item])
    const total = cart.reduce((s, i) => s + i.price, 0) + item.price
    if (total === target) {
      setScore(s => s + 20)
      setDone(true)
    }
  }

  const total = cart.reduce((s, i) => s + i.price, 0)

  if (done) return (
    <div className="container">
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <div style={{ fontSize: '4rem' }}>🎉</div>
        <h2 style={{ marginTop: 12 }}>دقیقاً {target} تومان!</h2>
        <p style={{ color: 'var(--text-light)', marginTop: 8 }}>امتیاز: {score}</p>
        <button className="btn btn-success" style={{ marginTop: 20 }}
          onClick={() => onComplete(score, score >= 40 ? 3 : 2)}>
          دریافت جایزه 🎁
        </button>
      </div>
    </div>
  )

  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: 16, background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
      <h2 style={{ marginBottom: 8, color: '#FFB703' }}>🛒 بازار ریاضی</h2>
      <p style={{ color: 'var(--text-light)', marginBottom: 16, fontSize: 14 }}>
        باید دقیقاً <strong style={{ color: '#FFB703' }}>{target} تومان</strong> خرید کنی!
      </p>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>💰 موجودی: <strong>{coins}</strong></div>
        <div>🛒 سبد: <strong>{total}</strong> تومان</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {ITEMS.map(item => (
          <button key={item.name} onClick={() => buy(item)}
            style={{ padding: '16px', borderRadius: 16, background: coins >= item.price ? '#f0fff9' : '#f7f7f7',
              border: `2px solid ${coins >= item.price ? '#06D6A0' : '#e2e8f0'}`,
              cursor: coins >= item.price ? 'pointer' : 'not-allowed', opacity: coins >= item.price ? 1 : 0.5 }}>
            <div style={{ fontSize: '2rem' }}>{item.emoji}</div>
            <div style={{ fontWeight: 600 }}>{item.name}</div>
            <div style={{ color: '#06D6A0', fontWeight: 700 }}>{item.price} تومان</div>
          </button>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 8 }}>سبد خرید:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {cart.map((item, i) => (
              <span key={i} style={{ background: '#f0eeff', borderRadius: 8, padding: '4px 10px', fontSize: 13 }}>
                {item.emoji} {item.price}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 8, fontWeight: 700, color: total > target ? '#FF6584' : 'var(--text)' }}>
            جمع: {total} {total > target ? '(بیش از هدف!)' : ''}
          </div>
          {total > target && (
            <button onClick={() => { setCart([]); setCoins(20) }}
              style={{ marginTop: 8, padding: '8px 16px', borderRadius: 10, background: '#ffe0e0',
                border: 'none', color: '#FF6584', cursor: 'pointer', fontSize: 13 }}>
              🗑️ خالی کردن سبد
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const PATTERNS = [
  { sequence: [1, 2, 3, 4, '?'], answer: 5 },
  { sequence: [2, 4, 6, 8, '?'], answer: 10 },
  { sequence: [10, 9, 8, 7, '?'], answer: 6 },
  { sequence: [1, 3, 5, 7, '?'], answer: 9 },
  { sequence: [5, 10, 15, 20, '?'], answer: 25 },
]

function PatternGame({ onComplete, onBack }: any) {
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')

  const p = PATTERNS[idx]

  const check = () => {
    if (parseInt(answer) === p.answer) {
      setStatus('correct')
      setScore(s => s + 15)
      setTimeout(() => {
        if (idx + 1 >= PATTERNS.length) onComplete(score + 15, score >= 50 ? 3 : 2)
        else { setIdx(i => i + 1); setAnswer(''); setStatus('idle') }
      }, 800)
    } else {
      setStatus('wrong')
      setTimeout(() => { setStatus('idle'); setAnswer('') }, 800)
    }
  }

  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: 16, background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
      <h2 style={{ marginBottom: 16, color: '#06D6A0' }}>🧩 الگوی اعداد</h2>

      <div style={{ marginBottom: 8, color: 'var(--text-light)', fontSize: 13 }}>{idx + 1} از {PATTERNS.length}</div>
      <div className="progress-bar" style={{ marginBottom: 20 }}>
        <div className="progress-fill" style={{ width: `${(idx / PATTERNS.length) * 100}%` }} />
      </div>

      <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="card" style={{ textAlign: 'center', marginBottom: 20 }}>
        <p style={{ color: 'var(--text-light)', marginBottom: 12, fontSize: 14 }}>عدد بعدی چیست؟</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          {p.sequence.map((n, i) => (
            <div key={i} style={{
              width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700,
              background: n === '?' ? 'var(--primary)' : '#f0eeff', color: n === '?' ? 'white' : 'var(--primary)',
              border: n === '?' ? 'none' : '2px solid #e0d8ff'
            }}>
              {n}
            </div>
          ))}
        </div>
      </motion.div>

      <input type="number" value={answer} onChange={e => setAnswer(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && check()}
        placeholder="جواب را بنویس..."
        style={{ width: '100%', padding: '14px', borderRadius: 14, border: '2px solid #e2e8f0',
          fontSize: 20, textAlign: 'center', marginBottom: 12, outline: 'none',
          borderColor: status === 'correct' ? '#06D6A0' : status === 'wrong' ? '#FF6584' : '#e2e8f0' }}
      />

      <button className={`btn ${status === 'correct' ? 'btn-success' : 'btn-primary'}`}
        onClick={check} disabled={!answer || status !== 'idle'}>
        {status === 'correct' ? '🎉 درست!' : status === 'wrong' ? '❌ اشتباه!' : '✓ بررسی'}
      </button>
    </div>
  )
}

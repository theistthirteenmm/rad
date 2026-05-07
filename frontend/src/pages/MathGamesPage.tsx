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
        {[1,2,3,4,5,6,7,8,9,0].map(n => {
          const isInAnswer = answer.includes(String(n))
          return (
            <motion.button
              key={n}
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                if (status !== 'idle') return
                // جلوگیری از عدد بیش از ۲ رقم
                if (answer.length >= 2) return
                setAnswer(a => a + n)
              }}
              style={{
                padding: 12, borderRadius: 10, fontSize: 18, fontWeight: 700,
                background: isInAnswer ? COLOR : '#f0eeff',
                border: `2px solid ${isInAnswer ? COLOR : '#e0d8ff'}`,
                cursor: status === 'idle' ? 'pointer' : 'default',
                color: isInAnswer ? 'white' : COLOR,
                transition: 'all 0.15s',
              }}>
              {n}
            </motion.button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setAnswer(a => a.slice(0, -1))}
          style={{ flex: 1, padding: 12, borderRadius: 10, background: '#ffe0e0', border: 'none', cursor: 'pointer', color: '#FF6584', fontSize: 16 }}>
          ⌫
        </button>
        <button className={`btn ${status === 'correct' ? 'btn-success' : 'btn-primary'}`}
          style={{ flex: 3 }} onClick={check} disabled={!answer || status !== 'idle'}>
          {status === 'correct' ? '🎉 درست!' : status === 'wrong' ? '❌ اشتباه!' : status === 'timeout' ? '⏱ وقت تموم شد' : answer ? `جواب: ${answer} ✓` : '؟'}
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

// ─── Compare Game — مقایسه اعداد ─────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

const COMPARE_QUESTIONS = [
  { a: 3, b: 7 }, { a: 9, b: 4 }, { a: 5, b: 5 }, { a: 2, b: 8 },
  { a: 6, b: 3 }, { a: 1, b: 9 }, { a: 7, b: 7 }, { a: 4, b: 6 },
  { a: 10, b: 5 }, { a: 8, b: 2 }, { a: 3, b: 3 }, { a: 6, b: 9 },
]

function CompareGame({ onComplete, timerSeconds }: any) {
  const questions = useState(() => shuffle(COMPARE_QUESTIONS).slice(0, 8))[0]
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)

  const q = questions[idx]
  const correct = q.a > q.b ? '>' : q.a < q.b ? '<' : '='

  const timer = useTimer(timerSeconds, () => {
    if (selected) return
    setSelected('timeout')
    setTimeout(next, 1000)
  })

  useEffect(() => { timer.reset(); timer.start(); setSelected(null) }, [idx])

  const answer = (sign: string) => {
    if (selected) return
    timer.stop()
    setSelected(sign)
    if (sign === correct) setScore(s => s + 10)
    setTimeout(next, 900)
  }

  const next = () => {
    if (idx + 1 >= questions.length) {
      const ns = score + (selected === correct ? 10 : 0)
      onComplete(ns, ns >= 60 ? 3 : ns >= 40 ? 2 : 1)
    } else setIdx(i => i + 1)
  }

  const timerColor = timer.urgent ? '#FF6584' : timer.timeLeft <= 5 ? '#FF9800' : COLOR

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: timerColor, marginBottom: 4 }}>
          <span>⏱ {timer.timeLeft}ث</span><span>{idx + 1} / {questions.length}</span>
        </div>
        <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4 }}>
          <motion.div animate={{ width: `${timer.pct}%` }} transition={{ duration: 0.5 }}
            style={{ height: '100%', background: timerColor, borderRadius: 4 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="card" style={{ marginBottom: 20, padding: '24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: '#f0eeff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, fontWeight: 900, color: COLOR }}>{q.a}</div>
            <div style={{ fontSize: 36, color: selected
              ? selected === correct ? '#06D6A0' : '#FF6584'
              : '#ddd', fontWeight: 900, width: 40 }}>
              {selected && selected !== 'timeout' ? selected : '?'}
            </div>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: '#fff0f3',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, fontWeight: 900, color: '#FF6584' }}>{q.b}</div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 12 }}>
            کدام علامت درسته؟
          </p>
        </motion.div>
      </AnimatePresence>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {['<', '=', '>'].map(sign => {
          const isSelected = selected === sign
          const isCorrectSign = sign === correct
          let bg = '#f0eeff', col = COLOR, border = '#e0d8ff'
          if (selected) {
            if (isCorrectSign) { bg = '#06D6A0'; col = 'white'; border = 'transparent' }
            else if (isSelected) { bg = '#FF6584'; col = 'white'; border = 'transparent' }
            else { bg = '#f5f5f5'; col = '#ccc'; border = '#eee' }
          }
          return (
            <motion.button key={sign} whileTap={{ scale: 0.9 }} onClick={() => answer(sign)}
              style={{ width: 80, height: 80, borderRadius: 20, fontSize: 36, fontWeight: 900,
                background: bg, border: `2px solid ${border}`, cursor: selected ? 'default' : 'pointer',
                color: col, transition: 'all 0.2s', fontFamily: 'inherit' }}>
              {sign}
            </motion.button>
          )
        })}
      </div>
      <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-light)' }}>⭐ {score}</div>
    </div>
  )
}

// ─── Shapes Game — شکل‌شناس ───────────────────────────────────────────────────
const SHAPES = [
  { name: 'مربع',     emoji: '🟦', sides: 4, equal: true,  desc: '۴ ضلع مساوی' },
  { name: 'مثلث',    emoji: '🔺', sides: 3, equal: false, desc: '۳ ضلع' },
  { name: 'دایره',   emoji: '⭕', sides: 0, equal: false, desc: 'بدون ضلع، گرد' },
  { name: 'مستطیل',  emoji: '🟩', sides: 4, equal: false, desc: '۴ ضلع، دو به دو مساوی' },
  { name: 'لوزی',    emoji: '🔷', sides: 4, equal: true,  desc: '۴ ضلع مساوی، کج' },
]

const SHAPE_QUESTIONS = [
  { q: 'کدام شکل ۳ ضلع دارد؟',           answer: 'مثلث' },
  { q: 'کدام شکل گرد است؟',               answer: 'دایره' },
  { q: 'کدام شکل ۴ ضلع مساوی دارد؟',     answer: 'مربع' },
  { q: 'کدام شکل ضلع ندارد؟',             answer: 'دایره' },
  { q: 'کدام شکل مثل در و پنجره است؟',   answer: 'مستطیل' },
  { q: 'کدام شکل مثل توپ است؟',           answer: 'دایره' },
  { q: 'کدام شکل ۴ ضلع دارد ولی کج است؟', answer: 'لوزی' },
  { q: 'کدام شکل مثل کتاب است؟',          answer: 'مستطیل' },
]

function ShapesGame({ onComplete }: any) {
  const questions = useState(() => shuffle(SHAPE_QUESTIONS).slice(0, 6))[0]
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)

  const q = questions[idx]
  const choices = useState(() => shuffle(SHAPES).slice(0, 4).map(s => s.name))[0]
  // مطمئن بشیم جواب درست توی choices هست
  const finalChoices = useState(() => {
    const base = shuffle(SHAPES).map(s => s.name)
    const ans = q.answer
    const pool = [ans, ...base.filter(n => n !== ans)].slice(0, 4)
    return shuffle(pool)
  })[0]

  const answer = (name: string) => {
    if (selected) return
    setSelected(name)
    if (name === q.answer) setScore(s => s + 15)
    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        const ns = score + (name === q.answer ? 15 : 0)
        onComplete(ns, ns >= 60 ? 3 : ns >= 30 ? 2 : 1)
      } else { setIdx(i => i + 1); setSelected(null) }
    }, 900)
  }

  const shapeEmoji = (name: string) => SHAPES.find(s => s.name === name)?.emoji || '❓'

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-light)' }}>{idx + 1} از {questions.length}</div>
      <div className="progress-bar" style={{ marginBottom: 16 }}>
        <div className="progress-fill" style={{ width: `${(idx / questions.length) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="card" style={{ marginBottom: 20, padding: '20px 16px' }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.6 }}>{q.q}</p>
        </motion.div>
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {finalChoices.map(name => {
          const isSelected = selected === name
          const isCorrect = name === q.answer
          let bg = '#f0eeff', border = '#e0d8ff', col = COLOR
          if (selected) {
            if (isCorrect) { bg = '#06D6A0'; border = 'transparent'; col = 'white' }
            else if (isSelected) { bg = '#FF6584'; border = 'transparent'; col = 'white' }
            else { bg = '#f5f5f5'; border = '#eee'; col = '#ccc' }
          }
          return (
            <motion.button key={name} whileTap={{ scale: 0.95 }} onClick={() => answer(name)}
              style={{ padding: '18px 12px', borderRadius: 16, background: bg,
                border: `2px solid ${border}`, cursor: selected ? 'default' : 'pointer',
                color: col, transition: 'all 0.2s', fontFamily: 'inherit' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>{shapeEmoji(name)}</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{name}</div>
            </motion.button>
          )
        })}
      </div>
      <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-light)' }}>⭐ {score}</div>
    </div>
  )
}

// ─── Pairs Game — جفت‌ساز ۱۰ ─────────────────────────────────────────────────
function PairsGame({ onComplete }: any) {
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [wrongPair, setWrongPair] = useState<number | null>(null)

  // هر دور یه عدد ثابت داریم، باید جفتش رو پیدا کنه
  const rounds = useState(() => shuffle([1,2,3,4,5,6,7,8,9].map(n => ({ fixed: n, answer: 10 - n }))))[0]
  const current = rounds[round]

  // گزینه‌ها: جواب درست + ۳ تا اشتباه
  const choices = useState(() =>
    rounds.map(r => {
      const wrong = shuffle([1,2,3,4,5,6,7,8,9].filter(n => n !== r.answer)).slice(0, 3)
      return shuffle([r.answer, ...wrong])
    })
  )[0]

  const answer = (n: number) => {
    if (status !== 'idle') return
    setSelected(n)
    if (n === current.answer) {
      setStatus('correct')
      setScore(s => s + 10)
      setTimeout(() => {
        if (round + 1 >= rounds.length) {
          const ns = score + 10
          onComplete(ns, ns >= 70 ? 3 : ns >= 40 ? 2 : 1)
        } else { setRound(r => r + 1); setSelected(null); setStatus('idle') }
      }, 800)
    } else {
      setStatus('wrong')
      setWrongPair(n)
      setTimeout(() => { setSelected(null); setStatus('idle'); setWrongPair(null) }, 900)
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-light)' }}>{round + 1} از {rounds.length}</div>
      <div className="progress-bar" style={{ marginBottom: 16 }}>
        <div className="progress-fill" style={{ width: `${(round / rounds.length) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={round} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="card" style={{ marginBottom: 20, padding: '24px 16px' }}>
          <p style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 12 }}>
            با کدام عدد جمعش میشه ۱۰؟
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'linear-gradient(135deg,#6C63FF,#a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 38, fontWeight: 900, color: 'white' }}>{current.fixed}</div>
            <div style={{ fontSize: 28, color: '#aaa', fontWeight: 700 }}>+</div>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: '#f0eeff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 38, fontWeight: 900, color: '#ccc', border: '3px dashed #c4b5fd' }}>?</div>
            <div style={{ fontSize: 28, color: '#aaa', fontWeight: 700 }}>=</div>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: '#f0fff9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 38, fontWeight: 900, color: '#06D6A0', border: '3px solid #06D6A040' }}>۱۰</div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {choices[round].map(n => {
          const isSelected = selected === n
          const isCorrect = n === current.answer
          let bg = '#f0eeff', border = '#e0d8ff', col = COLOR
          if (status !== 'idle') {
            if (isCorrect) { bg = '#06D6A0'; border = 'transparent'; col = 'white' }
            else if (isSelected) { bg = '#FF6584'; border = 'transparent'; col = 'white' }
            else { bg = '#f5f5f5'; border = '#eee'; col = '#ccc' }
          }
          return (
            <motion.button key={n} whileTap={{ scale: 0.9 }} onClick={() => answer(n)}
              style={{ padding: '18px 8px', borderRadius: 14, fontSize: 26, fontWeight: 900,
                background: bg, border: `2px solid ${border}`, cursor: status === 'idle' ? 'pointer' : 'default',
                color: col, transition: 'all 0.2s', fontFamily: 'inherit' }}>
              {n}
            </motion.button>
          )
        })}
      </div>
      <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-light)' }}>⭐ {score}</div>
    </div>
  )
}

// ─── Counting Game — شمارش ────────────────────────────────────────────────────
const EMOJIS_COUNT = ['🍎','🌟','🐱','🎈','🌸','🦋','🍭','🐸','⭐','🎯']

function CountingGame({ onComplete, timerSeconds }: any) {
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)

  const rounds = useState(() =>
    Array.from({ length: 8 }, () => {
      const count = Math.floor(Math.random() * 9) + 2  // 2 تا 10
      const emoji = EMOJIS_COUNT[Math.floor(Math.random() * EMOJIS_COUNT.length)]
      const wrong = shuffle([1,2,3,4,5,6,7,8,9,10].filter(n => n !== count)).slice(0, 3)
      return { count, emoji, choices: shuffle([count, ...wrong]) }
    })
  )[0]

  const timer = useTimer(timerSeconds, () => {
    if (selected !== null) return
    setSelected(-1)
    setTimeout(next, 1000)
  })

  useEffect(() => { timer.reset(); timer.start(); setSelected(null) }, [idx])

  const r = rounds[idx]

  const answer = (n: number) => {
    if (selected !== null) return
    timer.stop()
    setSelected(n)
    if (n === r.count) setScore(s => s + 10)
    setTimeout(next, 900)
  }

  const next = () => {
    if (idx + 1 >= rounds.length) {
      const ns = score + (selected === r.count ? 10 : 0)
      onComplete(ns, ns >= 60 ? 3 : ns >= 40 ? 2 : 1)
    } else setIdx(i => i + 1)
  }

  const timerColor = timer.urgent ? '#FF6584' : timer.timeLeft <= 8 ? '#FF9800' : COLOR

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: timerColor, marginBottom: 4 }}>
          <span>⏱ {timer.timeLeft}ث</span><span>{idx + 1} / {rounds.length}</span>
        </div>
        <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4 }}>
          <motion.div animate={{ width: `${timer.pct}%` }} transition={{ duration: 0.5 }}
            style={{ height: '100%', background: timerColor, borderRadius: 4 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="card" style={{ marginBottom: 16, padding: '16px' }}>
          <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 12 }}>چند تا هست؟</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
            {Array.from({ length: r.count }).map((_, i) => (
              <motion.span key={i}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
                style={{ fontSize: '2rem' }}>{r.emoji}</motion.span>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {r.choices.map(n => {
          const isSelected = selected === n
          const isCorrect = n === r.count
          let bg = '#f0eeff', border = '#e0d8ff', col = COLOR
          if (selected !== null) {
            if (isCorrect) { bg = '#06D6A0'; border = 'transparent'; col = 'white' }
            else if (isSelected) { bg = '#FF6584'; border = 'transparent'; col = 'white' }
            else { bg = '#f5f5f5'; border = '#eee'; col = '#ccc' }
          }
          return (
            <motion.button key={n} whileTap={{ scale: 0.9 }} onClick={() => answer(n)}
              style={{ padding: '18px 8px', borderRadius: 14, fontSize: 26, fontWeight: 900,
                background: bg, border: `2px solid ${border}`, cursor: selected === null ? 'pointer' : 'default',
                color: col, transition: 'all 0.2s', fontFamily: 'inherit' }}>
              {n}
            </motion.button>
          )
        })}
      </div>
      <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-light)' }}>⭐ {score}</div>
    </div>
  )
}

// ─── Measure Game — اندازه‌گیری ───────────────────────────────────────────────
const MEASURE_QUESTIONS = [
  { q: 'کدام بلندتر است؟',    items: [{ label: 'درخت 🌳', val: 10 }, { label: 'گل 🌸', val: 2 }],   type: 'tall' },
  { q: 'کدام سنگین‌تر است؟',  items: [{ label: 'فیل 🐘', val: 100 }, { label: 'موش 🐭', val: 1 }],  type: 'heavy' },
  { q: 'کدام کوتاه‌تر است؟',  items: [{ label: 'مداد ✏️', val: 2 }, { label: 'خط‌کش 📏', val: 8 }], type: 'short' },
  { q: 'کدام سبک‌تر است؟',    items: [{ label: 'پر 🪶', val: 1 }, { label: 'سنگ 🪨', val: 50 }],    type: 'light' },
  { q: 'کدام بزرگ‌تر است؟',   items: [{ label: 'هندوانه 🍉', val: 8 }, { label: 'انگور 🍇', val: 2 }], type: 'big' },
  { q: 'کدام کوچک‌تر است؟',   items: [{ label: 'مورچه 🐜', val: 1 }, { label: 'فیل 🐘', val: 100 }], type: 'small' },
  { q: 'کدام بلندتر است؟',    items: [{ label: 'آسمان‌خراش 🏢', val: 100 }, { label: 'خانه 🏠', val: 10 }], type: 'tall' },
  { q: 'کدام سنگین‌تر است؟',  items: [{ label: 'کتاب 📚', val: 5 }, { label: 'پر 🪶', val: 1 }],    type: 'heavy' },
]

function MeasureGame({ onComplete }: any) {
  const questions = useState(() => shuffle(MEASURE_QUESTIONS).slice(0, 6))[0]
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)

  const q = questions[idx]
  const correctIdx = ['tall','heavy','big'].includes(q.type)
    ? q.items[0].val > q.items[1].val ? 0 : 1
    : q.items[0].val < q.items[1].val ? 0 : 1

  const answer = (i: number) => {
    if (selected !== null) return
    setSelected(i)
    if (i === correctIdx) setScore(s => s + 15)
    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        const ns = score + (i === correctIdx ? 15 : 0)
        onComplete(ns, ns >= 60 ? 3 : ns >= 30 ? 2 : 1)
      } else { setIdx(j => j + 1); setSelected(null) }
    }, 1000)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-light)' }}>{idx + 1} از {questions.length}</div>
      <div className="progress-bar" style={{ marginBottom: 16 }}>
        <div className="progress-fill" style={{ width: `${(idx / questions.length) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="card" style={{ marginBottom: 20, padding: '20px 16px' }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>{q.q}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            {q.items.map((item, i) => {
              const isSelected = selected === i
              const isCorrect = i === correctIdx
              let bg = '#f0eeff', border = '#e0d8ff'
              if (selected !== null) {
                if (isCorrect) { bg = '#f0fff9'; border = '#06D6A0' }
                else if (isSelected) { bg = '#fff0f3'; border = '#FF6584' }
              }
              return (
                <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => answer(i)}
                  style={{ flex: 1, padding: '20px 12px', borderRadius: 18, background: bg,
                    border: `2px solid ${border}`, cursor: selected === null ? 'pointer' : 'default',
                    transition: 'all 0.2s', fontFamily: 'inherit' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>{item.label.split(' ')[1]}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                    {item.label.split(' ')[0]}
                  </div>
                  {selected !== null && isCorrect && (
                    <div style={{ fontSize: 20, marginTop: 6 }}>✅</div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>
      <div style={{ fontSize: 13, color: 'var(--text-light)' }}>⭐ {score}</div>
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
  const [reward, setReward] = useState<{ stars: number; coins: number; totalStars?: number } | null>(null)

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
    const actual = await saveSession({ subject: SUBJECT, game_type: gameType, score, stars_earned: stars, coins_earned: coins, duration_seconds: 60, completed: true })
    await saveLevel(gameType, stars, score)
    setReward({ stars: actual.stars_earned, coins: actual.coins_earned, totalStars: stars })
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
        {gt === 'compare' && (
          <CompareGame timerSeconds={ts} onComplete={(s: number, st: number) => handleComplete(gt, s, st)} />
        )}
        {gt === 'shapes' && (
          <ShapesGame onComplete={(s: number, st: number) => handleComplete(gt, s, st)} />
        )}
        {gt === 'pairs' && (
          <PairsGame onComplete={(s: number, st: number) => handleComplete(gt, s, st)} />
        )}
        {gt === 'counting' && (
          <CountingGame timerSeconds={ts} onComplete={(s: number, st: number) => handleComplete(gt, s, st)} />
        )}
        {gt === 'measure' && (
          <MeasureGame onComplete={(s: number, st: number) => handleComplete(gt, s, st)} />
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

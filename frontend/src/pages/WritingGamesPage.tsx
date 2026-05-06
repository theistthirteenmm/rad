import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSaveSession } from '../hooks/useApi'
import { useStore } from '../store/useStore'
import RewardModal from '../components/RewardModal'

const LETTERS = ['الف', 'ب', 'پ', 'ت', 'ث', 'ج', 'چ', 'ح', 'خ', 'د']
const WORDS_WRITE = [
  { word: 'آب', hint: '💧' },
  { word: 'سیب', hint: '🍎' },
  { word: 'گل', hint: '🌸' },
  { word: 'ماه', hint: '🌙' },
  { word: 'آفتاب', hint: '☀️' },
]

export default function WritingGamesPage() {
  const nav = useNavigate()
  const saveSession = useSaveSession()
  const [game, setGame] = useState<null | 'trace' | 'dictation'>(null)
  const [reward, setReward] = useState<any>(null)

  const handleComplete = async (gameType: string, score: number, stars: number) => {
    await saveSession({ subject: 'negaresh', game_type: gameType, score, stars_earned: stars, coins_earned: stars * 5, duration_seconds: 60, completed: true })
    setReward({ stars, coins: stars * 5 })
  }

  if (reward) return (
    <div className="container">
      <RewardModal stars={reward.stars} coins={reward.coins} onClose={() => { setReward(null); setGame(null) }} onHome={() => nav('/')} />
    </div>
  )

  if (game === 'trace') return <LetterTrace onComplete={(s, st) => handleComplete('trace', s, st)} onBack={() => setGame(null)} />
  if (game === 'dictation') return <WordDictation onComplete={(s, st) => handleComplete('dictation', s, st)} onBack={() => setGame(null)} />

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => nav('/')} style={{ background: 'none', fontSize: 20 }}>←</button>
        <h1 style={{ fontSize: 22, color: '#4ECDC4' }}>✏️ درس نگارش</h1>
      </div>

      {[
        { id: 'trace', icon: '✏️', title: 'خط‌نویس', desc: 'روی صفحه لمسی حروف بنویس', color: '#4ECDC4' },
        { id: 'dictation', icon: '🖼️', title: 'نقاشی کلمه', desc: 'کلمه رو بنویس، نقاشیش ظاهر بشه', color: '#FF6584' },
      ].map((g, i) => (
        <motion.button key={g.id}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setGame(g.id as any)}
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

function LetterTrace({ onComplete, onBack }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [letterIdx, setLetterIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [hasDrawn, setHasDrawn] = useState(false)

  const letter = LETTERS[letterIdx]

  const startDraw = (e: any) => {
    setDrawing(true)
    setHasDrawn(true)
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: any) => {
    if (!drawing) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#6C63FF'
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  const stopDraw = () => setDrawing(false)

  const clear = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const next = () => {
    setScore(s => s + 10)
    clear()
    if (letterIdx + 1 >= LETTERS.length) onComplete(score + 10, 3)
    else setLetterIdx(i => i + 1)
  }

  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: 16, background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
      <h2 style={{ marginBottom: 8, color: '#4ECDC4' }}>✏️ خط‌نویس</h2>

      <div style={{ marginBottom: 8, color: 'var(--text-light)', fontSize: 13 }}>{letterIdx + 1} از {LETTERS.length}</div>

      <div className="card" style={{ textAlign: 'center', marginBottom: 12 }}>
        <p style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 4 }}>این حرف را بنویس:</p>
        <p style={{ fontSize: 60, fontWeight: 700, color: '#4ECDC4' }}>{letter}</p>
      </div>

      <div style={{ position: 'relative', background: 'white', borderRadius: 16,
        border: '2px solid #4ECDC4', overflow: 'hidden', marginBottom: 12 }}>
        <canvas
          ref={canvasRef}
          width={400} height={200}
          style={{ width: '100%', height: 200, touchAction: 'none', display: 'block' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
        />
        {!hasDrawn && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#ccc', fontSize: 14, pointerEvents: 'none' }}>
            اینجا بنویس ✏️
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn" onClick={clear}
          style={{ background: '#ffe0e0', color: '#FF6584', width: '40%' }}>🗑️ پاک کن</button>
        <button className="btn btn-success" onClick={next} disabled={!hasDrawn} style={{ width: '60%' }}>
          {letterIdx + 1 >= LETTERS.length ? '🏆 پایان!' : '← بعدی'}
        </button>
      </div>
    </div>
  )
}

function WordDictation({ onComplete, onBack }: any) {
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [score, setScore] = useState(0)
  const [shown, setShown] = useState(false)

  const item = WORDS_WRITE[idx]

  const check = () => {
    if (input.trim() === item.word) {
      setStatus('correct')
      setScore(s => s + 15)
      setShown(true)
      setTimeout(() => {
        if (idx + 1 >= WORDS_WRITE.length) onComplete(score + 15, score >= 40 ? 3 : 2)
        else { setIdx(i => i + 1); setInput(''); setStatus('idle'); setShown(false) }
      }, 1200)
    } else {
      setStatus('wrong')
      setTimeout(() => setStatus('idle'), 800)
    }
  }

  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: 16, background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
      <h2 style={{ marginBottom: 16, color: '#FF6584' }}>🖼️ نقاشی کلمه</h2>

      <div style={{ marginBottom: 8, color: 'var(--text-light)', fontSize: 13 }}>{idx + 1} از {WORDS_WRITE.length}</div>

      <motion.div key={idx} initial={{ scale: 0 }} animate={{ scale: 1 }}
        className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
        <motion.div
          animate={shown ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
          style={{ fontSize: '5rem' }}>
          {item.hint}
        </motion.div>
        {shown && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ fontSize: 28, fontWeight: 700, color: '#06D6A0', marginTop: 8 }}>
            ✓ {item.word}
          </motion.p>
        )}
        {!shown && <p style={{ color: 'var(--text-light)', fontSize: 13, marginTop: 8 }}>نام این را بنویس:</p>}
      </motion.div>

      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && check()}
        placeholder="کلمه را بنویس..."
        style={{
          width: '100%', padding: '14px', borderRadius: 14, fontSize: 20, textAlign: 'center',
          border: `2px solid ${status === 'correct' ? '#06D6A0' : status === 'wrong' ? '#FF6584' : '#e2e8f0'}`,
          outline: 'none', marginBottom: 12, direction: 'rtl'
        }}
      />

      <button className={`btn ${status === 'correct' ? 'btn-success' : 'btn-primary'}`}
        onClick={check} disabled={!input || status === 'correct'}>
        {status === 'correct' ? '🎉 درست!' : status === 'wrong' ? '❌ دوباره!' : '✓ بررسی'}
      </button>
    </div>
  )
}

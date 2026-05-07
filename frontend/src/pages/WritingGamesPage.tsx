import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSaveSession } from '../hooks/useApi'
import { useTimer } from '../hooks/useTimer'
import { useLevelProgress } from '../hooks/useLevelProgress'
import { SUBJECT_LEVELS, type LevelDef } from '../lib/levels'
import LevelMap from '../components/LevelMap'
import RewardModal from '../components/RewardModal'
import TeacherVoice from '../components/TeacherVoice'

const COLOR = '#4ECDC4'
const SUBJECT = 'writing'

const LETTERS = ['الف','ب','پ','ت','ث','ج','چ','ح','خ','د']
const WORDS_WRITE = [
  { word:'آب', hint:'💧' }, { word:'سیب', hint:'🍎' },
  { word:'گل', hint:'🌸' }, { word:'ماه', hint:'🌙' }, { word:'آفتاب', hint:'☀️' },
]

// ─── الگوی نقطه‌های هر حرف (مختصات نسبی 0-1 روی canvas) ──────────────────────
const LETTER_PATTERNS: Record<string, { x: number; y: number }[][]> = {
  'الف': [
    [{ x: 0.5, y: 0.1 }, { x: 0.5, y: 0.9 }],
  ],
  'ب': [
    [{ x: 0.2, y: 0.5 }, { x: 0.5, y: 0.7 }, { x: 0.8, y: 0.5 }, { x: 0.8, y: 0.35 }],
  ],
  'پ': [
    [{ x: 0.2, y: 0.5 }, { x: 0.5, y: 0.7 }, { x: 0.8, y: 0.5 }, { x: 0.8, y: 0.35 }],
  ],
  'ت': [
    [{ x: 0.2, y: 0.5 }, { x: 0.5, y: 0.7 }, { x: 0.8, y: 0.5 }],
  ],
  'ج': [
    [{ x: 0.8, y: 0.3 }, { x: 0.8, y: 0.6 }, { x: 0.5, y: 0.8 }, { x: 0.2, y: 0.6 }],
  ],
  'د': [
    [{ x: 0.7, y: 0.2 }, { x: 0.7, y: 0.7 }, { x: 0.3, y: 0.7 }],
  ],
  'ر': [
    [{ x: 0.6, y: 0.2 }, { x: 0.6, y: 0.7 }, { x: 0.3, y: 0.8 }],
  ],
  'س': [
    [{ x: 0.15, y: 0.5 }, { x: 0.35, y: 0.65 }, { x: 0.5, y: 0.5 }, { x: 0.65, y: 0.65 }, { x: 0.85, y: 0.5 }],
  ],
  'ک': [
    [{ x: 0.7, y: 0.2 }, { x: 0.7, y: 0.8 }],
    [{ x: 0.7, y: 0.5 }, { x: 0.3, y: 0.3 }],
    [{ x: 0.7, y: 0.5 }, { x: 0.3, y: 0.7 }],
  ],
  'م': [
    [{ x: 0.2, y: 0.4 }, { x: 0.5, y: 0.2 }, { x: 0.8, y: 0.4 }, { x: 0.8, y: 0.7 }, { x: 0.5, y: 0.85 }],
  ],
}

const DEFAULT_PATTERN = [
  [{ x: 0.5, y: 0.15 }, { x: 0.5, y: 0.85 }],
]

function getPattern(letter: string) {
  return LETTER_PATTERNS[letter] ?? DEFAULT_PATTERN
}

/** محاسبه امتیاز شباهت مسیر کشیده‌شده با الگو */
function calcSimilarity(
  drawn: { x: number; y: number }[],
  pattern: { x: number; y: number }[][],
  W: number, H: number
): number {
  if (drawn.length < 5) return 0
  // همه نقاط الگو رو یه لیست کن
  const allPts = pattern.flat()
  let matched = 0
  for (const pt of allPts) {
    const px = pt.x * W
    const py = pt.y * H
    // آیا نقطه‌ای از مسیر کشیده‌شده نزدیک این نقطه هست؟
    const near = drawn.some(d => Math.hypot(d.x - px, d.y - py) < W * 0.18)
    if (near) matched++
  }
  return matched / allPts.length
}

function LetterTrace({ onComplete }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [letterIdx, setLetterIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [drawnPoints, setDrawnPoints] = useState<{ x: number; y: number }[]>([])
  const [checked, setChecked] = useState(false)
  const [similarity, setSimilarity] = useState(0)
  const letter = LETTERS[letterIdx]

  const W = 340, H = 320

  // رسم الگوی نقطه‌چین روی canvas
  const drawPattern = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W, H)

    // خطوط راهنما
    ctx.strokeStyle = '#e8e8e8'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke()
    ctx.setLineDash([])

    // الگوی حرف با نقطه‌های راهنما
    const pattern = getPattern(letter)
    pattern.forEach(stroke => {
      // خط نقطه‌چین بین نقاط
      ctx.strokeStyle = `${COLOR}40`
      ctx.lineWidth = 3
      ctx.setLineDash([8, 6])
      ctx.beginPath()
      stroke.forEach((pt, i) => {
        const x = pt.x * W, y = pt.y * H
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.setLineDash([])

      // دایره‌های نقطه راهنما
      stroke.forEach((pt, i) => {
        const x = pt.x * W, y = pt.y * H
        ctx.beginPath()
        ctx.arc(x, y, i === 0 ? 10 : 7, 0, Math.PI * 2)
        ctx.fillStyle = i === 0 ? COLOR : `${COLOR}80`
        ctx.fill()
        if (i === 0) {
          ctx.fillStyle = 'white'
          ctx.font = 'bold 10px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('شروع', x, y)
        }
      })
    })
  }

  useEffect(() => {
    drawPattern()
    setDrawnPoints([])
    setChecked(false)
    setSimilarity(0)
  }, [letterIdx])

  const getPos = (e: any) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    return {
      x: ((e.touches?.[0]?.clientX ?? e.clientX) - rect.left) * scaleX,
      y: ((e.touches?.[0]?.clientY ?? e.clientY) - rect.top) * scaleY,
    }
  }

  const startDraw = (e: any) => {
    e.preventDefault()
    if (checked) return
    setDrawing(true)
    const pos = getPos(e)
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setDrawnPoints(prev => [...prev, pos])
  }

  const draw = (e: any) => {
    e.preventDefault()
    if (!drawing || checked) return
    const pos = getPos(e)
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    setDrawnPoints(prev => [...prev, pos])
  }

  const endDraw = () => setDrawing(false)

  const checkDrawing = () => {
    const sim = calcSimilarity(drawnPoints, getPattern(letter), W, H)
    setSimilarity(sim)
    setChecked(true)
    if (sim >= 0.55) {
      setScore(s => s + 10)
    }
  }

  const clear = () => {
    drawPattern()
    setDrawnPoints([])
    setChecked(false)
    setSimilarity(0)
  }

  const next = () => {
    const ns = checked && similarity >= 0.55 ? score : score
    if (letterIdx + 1 >= LETTERS.length) {
      onComplete(ns, ns >= LETTERS.length * 8 ? 3 : ns >= LETTERS.length * 5 ? 2 : 1)
    } else {
      setLetterIdx(i => i + 1)
    }
  }

  const isGood = checked && similarity >= 0.55

  return (
    <div>
      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12,
        color: 'var(--text-light)', marginBottom: 6 }}>
        <span>حرف {letterIdx + 1} از {LETTERS.length}</span>
        <span>⭐ {score}</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: 14 }}>
        <div className="progress-fill" style={{ width: `${(letterIdx / LETTERS.length) * 100}%` }} />
      </div>

      {/* حرف نمونه */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 12, padding: '12px 16px' }}>
        <TeacherVoice text={`این حرف را بنویس: ${letter}`}
          style={{ justifyContent: 'center', marginBottom: 4, color: 'var(--text-light)' }} />
        <div style={{ fontSize: 72, fontWeight: 900, color: COLOR, lineHeight: 1 }}>{letter}</div>
      </div>

      {/* canvas بزرگ */}
      <div style={{
        position: 'relative', background: 'white', borderRadius: 20,
        border: `3px solid ${isGood ? '#06D6A0' : checked ? '#FF6584' : COLOR}`,
        overflow: 'hidden', marginBottom: 12,
        boxShadow: isGood ? '0 0 0 4px #06D6A020' : checked ? '0 0 0 4px #FF658420' : 'none',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}>
        <canvas
          ref={canvasRef}
          width={W} height={H}
          style={{ width: '100%', height: 'auto', touchAction: 'none', display: 'block', cursor: 'crosshair' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        />
        {drawnPoints.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 14, color: '#bbb', textAlign: 'center' }}>
              ✏️ روی نقطه «شروع» شروع کن<br/>و حرف را بکش
            </div>
          </div>
        )}
      </div>

      {/* نتیجه */}
      {checked && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 12, padding: '10px 16px',
            borderRadius: 14, background: isGood ? '#f0fff9' : '#fff0f3',
            border: `1.5px solid ${isGood ? '#06D6A040' : '#FF658440'}` }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>{isGood ? '🎉' : '😅'}</div>
          <div style={{ fontWeight: 700, color: isGood ? '#06D6A0' : '#FF6584', fontSize: 15 }}>
            {isGood ? 'آفرین! خوب نوشتی!' : 'دوباره تلاش کن!'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
            شباهت: {Math.round(similarity * 100)}٪
          </div>
        </motion.div>
      )}

      {/* دکمه‌ها */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn" onClick={clear}
          style={{ background: '#ffe0e0', color: '#FF6584', flex: 1 }}>
          🗑️ پاک
        </button>
        {!checked ? (
          <button className="btn btn-primary" onClick={checkDrawing}
            disabled={drawnPoints.length < 5}
            style={{ flex: 2, opacity: drawnPoints.length < 5 ? 0.5 : 1 }}>
            ✓ بررسی
          </button>
        ) : (
          <button className="btn btn-success" onClick={next} style={{ flex: 2 }}>
            {letterIdx + 1 >= LETTERS.length ? '🏆 پایان!' : isGood ? 'بعدی ←' : 'رد کن ←'}
          </button>
        )}
      </div>
    </div>
  )
}

function WordDictation({ onComplete, timerSec }: any) {
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'idle'|'correct'|'wrong'|'timeout'>('idle')
  const [score, setScore] = useState(0)
  const [shown, setShown] = useState(false)
  const item = WORDS_WRITE[idx]

  const advance = (correct: boolean) => {
    timer.stop()
    const ns = correct ? score + 15 : score
    setScore(ns)
    setTimeout(() => {
      if (idx + 1 >= WORDS_WRITE.length) onComplete(ns, ns >= 40 ? 3 : 2)
      else { setIdx(i => i + 1); setInput(''); setStatus('idle'); setShown(false); timer.reset(); timer.start() }
    }, 1000)
  }

  const timer = useTimer(timerSec, () => {
    if (status !== 'idle') return
    setStatus('timeout'); advance(false)
  })

  const check = () => {
    if (status !== 'idle') return
    if (input.trim() === item.word) {
      setStatus('correct'); setShown(true); advance(true)
    } else {
      setStatus('wrong'); setTimeout(() => setStatus('idle'), 800)
    }
  }

  const timerColor = timer.urgent ? '#FF6584' : timer.timeLeft <= 10 ? '#FF9800' : COLOR

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: timerColor, marginBottom: 4 }}>
          <span>⏱ {timer.timeLeft}ث</span><span>{idx + 1} / {WORDS_WRITE.length}</span>
        </div>
        <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4 }}>
          <motion.div animate={{ width: `${timer.pct}%` }} transition={{ duration: 0.5 }}
            style={{ height: '100%', background: timerColor, borderRadius: 4 }} />
        </div>
      </div>
      <motion.div key={idx} initial={{ scale: 0 }} animate={{ scale: 1 }}
        className="card" style={{ textAlign: 'center', marginBottom: 14 }}>
        <motion.div animate={shown ? { scale: [1,1.3,1], rotate:[0,10,-10,0] } : {}} style={{ fontSize: '4.5rem' }}>
          {item.hint}
        </motion.div>
        {shown
          ? <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 26, fontWeight: 700, color: '#06D6A0', marginTop: 8 }}>✓ {item.word}</motion.p>
          : <TeacherVoice text="نام این رو بنویس" autoSpeak={false}
              style={{ justifyContent: 'center', marginTop: 8, color: 'var(--text-light)' }} />
        }
      </motion.div>
      <input value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && check()}
        placeholder="کلمه را بنویس..."
        style={{ width: '100%', padding: 14, borderRadius: 14, fontSize: 20, textAlign: 'center',
          border: `2px solid ${status === 'correct' ? '#06D6A0' : status === 'wrong' ? '#FF6584' : '#e2e8f0'}`,
          outline: 'none', marginBottom: 12, direction: 'rtl', boxSizing: 'border-box' }} />
      <button className={`btn ${status === 'correct' ? 'btn-success' : 'btn-primary'}`}
        onClick={check} disabled={!input || status === 'correct'}>
        {status === 'correct' ? '🎉 درست!' : status === 'wrong' ? '❌ دوباره!' : status === 'timeout' ? '⏱ وقت تموم شد' : '✓ بررسی'}
      </button>
    </div>
  )
}

export default function WritingGamesPage() {
  const nav = useNavigate()
  const saveSession = useSaveSession()
  const { progress, saveLevel } = useLevelProgress(SUBJECT)
  const [activeLevel, setActiveLevel] = useState<LevelDef | null>(null)
  const [reward, setReward] = useState<any>(null)

  const handleComplete = async (gameType: string, score: number, stars: number) => {
    const actual = await saveSession({ subject: SUBJECT, game_type: gameType, score, stars_earned: stars, coins_earned: stars * 5, duration_seconds: 60, completed: true })
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
    return (
      <div className="container">
        <button onClick={() => setActiveLevel(null)}
          style={{ marginBottom: 16, background: 'none', color: 'var(--text-light)', fontSize: 14, border: 'none', cursor: 'pointer' }}>
          ← برگشت
        </button>
        <h2 style={{ marginBottom: 16, color: COLOR }}>{activeLevel.icon} {activeLevel.title}</h2>
        {gt === 'trace' && <LetterTrace onComplete={(s: number, st: number) => handleComplete(gt, s, st)} />}
        {gt === 'dictation' && <WordDictation timerSec={activeLevel.timerSeconds ?? 30} onComplete={(s: number, st: number) => handleComplete(gt, s, st)} />}
      </div>
    )
  }

  const totalDone = Object.values(progress).filter(r => r.completed).length
  const totalStars = Object.values(progress).reduce((a, r) => a + (r.stars || 0), 0)

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button onClick={() => nav('/')} style={{ background: 'none', fontSize: 20, border: 'none', cursor: 'pointer' }}>←</button>
        <h1 style={{ fontSize: 22, color: COLOR }}>✏️ درس نگارش</h1>
      </div>
      <div className="card" style={{ marginBottom: 20, padding: '12px 16px',
        background: 'linear-gradient(135deg,#f0fffe,#fff)', border: `2px solid ${COLOR}20` }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: COLOR }}>{totalDone}</div><div style={{ fontSize: 11, color: 'var(--text-light)' }}>مرحله تموم</div></div>
          <div style={{ width: 1, background: '#f0f0f0' }} />
          <div><div style={{ fontSize: 22, fontWeight: 800, color: '#FFB703' }}>{totalStars}⭐</div><div style={{ fontSize: 11, color: 'var(--text-light)' }}>ستاره</div></div>
          <div style={{ width: 1, background: '#f0f0f0' }} />
          <div><div style={{ fontSize: 22, fontWeight: 800, color: '#06D6A0' }}>{SUBJECT_LEVELS.writing.filter(l => !l.comingSoon).length}</div><div style={{ fontSize: 11, color: 'var(--text-light)' }}>کل مراحل</div></div>
        </div>
      </div>
      <LevelMap levels={SUBJECT_LEVELS.writing} progress={progress} color={COLOR} onPlay={setActiveLevel} />
    </div>
  )
}

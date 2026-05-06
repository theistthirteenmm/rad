import { useState, useRef } from 'react'
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

function LetterTrace({ onComplete }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [letterIdx, setLetterIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [hasDrawn, setHasDrawn] = useState(false)
  const letter = LETTERS[letterIdx]

  const getPos = (e: any) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.touches?.[0]?.clientX ?? e.clientX) - rect.left,
      y: (e.touches?.[0]?.clientY ?? e.clientY) - rect.top,
    }
  }
  const startDraw = (e: any) => {
    setDrawing(true); setHasDrawn(true)
    const { x, y } = getPos(e)
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.beginPath(); ctx.moveTo(x, y)
  }
  const draw = (e: any) => {
    if (!drawing) return
    const { x, y } = getPos(e)
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.lineTo(x, y); ctx.strokeStyle = COLOR; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke()
  }
  const clear = () => {
    canvasRef.current!.getContext('2d')!.clearRect(0, 0, 400, 200)
    setHasDrawn(false)
  }
  const next = () => {
    const ns = score + 10; setScore(ns); clear()
    if (letterIdx + 1 >= LETTERS.length) onComplete(ns, 3)
    else setLetterIdx(i => i + 1)
  }

  return (
    <div>
      <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-light)' }}>{letterIdx + 1} از {LETTERS.length}</div>
      <div className="card" style={{ textAlign: 'center', marginBottom: 12 }}>
        <TeacherVoice text={`این حرف را بنویس: ${letter}`}
          style={{ justifyContent: 'center', marginBottom: 4, color: 'var(--text-light)' }} />
        <p style={{ fontSize: 56, fontWeight: 700, color: COLOR }}>{letter}</p>
      </div>
      <div style={{ position: 'relative', background: 'white', borderRadius: 16, border: `2px solid ${COLOR}`, overflow: 'hidden', marginBottom: 12 }}>
        <canvas ref={canvasRef} width={400} height={180}
          style={{ width: '100%', height: 180, touchAction: 'none', display: 'block' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => setDrawing(false)}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => setDrawing(false)} />
        {!hasDrawn && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#ccc', fontSize: 14, pointerEvents: 'none' }}>
            اینجا بنویس ✏️
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn" onClick={clear} style={{ background: '#ffe0e0', color: '#FF6584', flex: 1 }}>🗑️ پاک</button>
        <button className="btn btn-success" onClick={next} disabled={!hasDrawn} style={{ flex: 2 }}>
          {letterIdx + 1 >= LETTERS.length ? '🏆 پایان!' : '← بعدی'}
        </button>
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
    await saveSession({ subject: SUBJECT, game_type: gameType, score, stars_earned: stars, coins_earned: stars * 5, duration_seconds: 60, completed: true })
    await saveLevel(gameType, stars, score)
    setReward({ stars, coins: stars * 5 })
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

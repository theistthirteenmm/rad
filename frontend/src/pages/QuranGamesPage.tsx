import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, useSaveSession } from '../hooks/useApi'
import { useStore } from '../store/useStore'
import { useTimer } from '../hooks/useTimer'
import { useLevelProgress } from '../hooks/useLevelProgress'
import { SUBJECT_LEVELS, type LevelDef } from '../lib/levels'
import LevelMap from '../components/LevelMap'
import RewardModal from '../components/RewardModal'
import TeacherVoice from '../components/TeacherVoice'

const COLOR = '#FFB703'
const SUBJECT = 'quran'

function ReciteGame({ verses, onComplete }: any) {
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [status, setStatus] = useState<'idle'|'listening'|'correct'|'wrong'>('idle')
  const recognitionRef = useRef<any>(null)
  const verse = verses[idx]

  const listen = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('مرورگر از میکروفن پشتیبانی نمی‌کند'); return }
    const r = new SR(); r.lang = 'ar-SA'
    r.onstart = () => setStatus('listening')
    r.onresult = (e: any) => {
      const text = e.results[0][0].transcript
      const words = verse.arabic.split(' ')
      const heard = text.split(' ')
      const matches = words.filter((w: string) => heard.some((h: string) => h.includes(w.slice(0, 3))))
      setStatus(matches.length >= Math.ceil(words.length * 0.5) ? 'correct' : 'wrong')
      if (matches.length >= Math.ceil(words.length * 0.5)) setScore(s => s + 15)
    }
    r.onerror = () => setStatus('idle')
    r.start(); recognitionRef.current = r
  }

  const next = () => {
    if (idx + 1 >= verses.length) onComplete(score, score >= 40 ? 3 : 2)
    else { setIdx(i => i + 1); setStatus('idle') }
  }

  return (
    <div>
      <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-light)' }}>{idx + 1} از {verses.length}</div>
      <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg,#fffbf0,#fff5d6)', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: COLOR, marginBottom: 6 }}>سوره {verse.surah} · آیه {verse.verse}</p>
        <p style={{ fontSize: 20, fontWeight: 700, lineHeight: 2, direction: 'rtl', fontFamily: 'serif', marginBottom: 10 }}>{verse.arabic}</p>
        <p style={{ fontSize: 13, color: 'var(--text-light)', fontStyle: 'italic' }}>{verse.persian}</p>
      </motion.div>
      {status === 'idle' || status === 'wrong' ? (
        <button className="btn btn-warning" onClick={listen}>🎤 {status === 'wrong' ? 'دوباره' : 'بخون!'}</button>
      ) : status === 'listening' ? (
        <motion.button animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
          className="btn" style={{ background: '#FF6584', color: 'white' }}
          onClick={() => recognitionRef.current?.stop()}>🔴 گوش میدم...</motion.button>
      ) : (
        <div>
          <div style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 12 }}>🌟 آفرین!</div>
          <button className="btn btn-success" onClick={next}>{idx + 1 >= verses.length ? '🏆 پایان!' : 'بعدی ←'}</button>
        </div>
      )}
    </div>
  )
}

function MatchGame({ verses, onComplete, timerSec }: any) {
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)

  const verse = verses[idx]
  const choices = [...new Set([verse.persian, ...verses.map((v: any) => v.persian).sort(() => Math.random() - 0.5)])].slice(0, 3).sort(() => Math.random() - 0.5)

  const advance = (correct: boolean) => {
    timer.stop()
    const ns = correct ? score + 15 : score
    setScore(ns)
    setTimeout(() => {
      if (idx + 1 >= verses.length) onComplete(ns, ns >= 30 ? 3 : 2)
      else { setIdx(i => i + 1); setAnswered(false); timer.reset(); timer.start() }
    }, 700)
  }

  const timer = useTimer(timerSec, () => { if (!answered) advance(false) })
  useEffect(() => { timer.start() }, [])
  useEffect(() => { if (idx > 0) { timer.reset(); timer.start() } }, [idx])

  const timerColor = timer.urgent ? '#FF6584' : timer.timeLeft <= 15 ? '#FF9800' : COLOR

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: timerColor, marginBottom: 4 }}>
          <span>⏱ {timer.timeLeft}ث</span><span>{idx + 1} / {verses.length}</span>
        </div>
        <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4 }}>
          <motion.div animate={{ width: `${timer.pct}%` }} transition={{ duration: 0.5 }}
            style={{ height: '100%', background: timerColor, borderRadius: 4 }} />
        </div>
      </div>
      <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="card" style={{ textAlign: 'center', background: '#fffbf0', marginBottom: 16 }}>
        <p style={{ fontSize: 18, fontWeight: 700, lineHeight: 2, direction: 'rtl', fontFamily: 'serif' }}>{verse.arabic}</p>
      </motion.div>
      <TeacherVoice text="معنی این آیه کدوم‌ه؟" autoSpeak={false}
        style={{ marginBottom: 10, color: 'var(--text-light)' }} fontSize={14} />
      {choices.map((c: string, i: number) => (
        <button key={i} onClick={() => { if (!answered) { setAnswered(true); advance(c === verse.persian) } }}
          style={{ width: '100%', padding: '12px 16px', borderRadius: 14, marginBottom: 10,
            background: '#f7fafc', border: '2px solid #e2e8f0', cursor: 'pointer', textAlign: 'right', fontSize: 14 }}>
          {c}
        </button>
      ))}
    </div>
  )
}

const QA = [
  { q: 'اولین سوره قرآن چه نام دارد؟', a: 'فاتحه', choices: ['فاتحه','توحید','ناس','فلق'] },
  { q: 'قرآن کریم به چه زبانی نازل شد؟', a: 'عربی', choices: ['فارسی','عربی','ترکی','اردو'] },
  { q: 'خداوند در قرآن چه صفاتی دارد؟', a: 'رحمان و رحیم', choices: ['رحمان و رحیم','کبیر و صغیر','اول و دوم','بزرگ و کوچک'] },
]
const SHAPES = ['⭕','🔷','⭐','🔺','🟦','🟩','🟡','🟣']

function ColorGame({ onComplete }: any) {
  const [idx, setIdx] = useState(0)
  const [colors, setColors] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const q = QA[idx]

  const answer = (a: string) => {
    const correct = a === q.a
    const newColors = correct ? [...colors, `hsl(${Math.random() * 360}, 70%, 70%)`] : colors
    if (correct) setColors(newColors)
    if (idx + 1 >= QA.length) { setDone(true); onComplete(newColors.length * 15 + 10, newColors.length >= 2 ? 3 : 2) }
    else setIdx(i => i + 1)
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {SHAPES.map((s, i) => (
          <div key={i} style={{ fontSize: '2rem', textAlign: 'center', padding: 8,
            filter: colors[i] ? `hue-rotate(${i * 45}deg)` : 'grayscale(1)', transition: 'filter 0.5s' }}>
            {s}
          </div>
        ))}
      </div>
      {!done && (
        <>
          <div className="card" style={{ marginBottom: 12 }}>
            <p style={{ fontWeight: 600, fontSize: 16 }}>{idx + 1}. {q.q}</p>
          </div>
          {q.choices.map((c: string, i: number) => (
            <button key={i} onClick={() => answer(c)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 14, marginBottom: 8,
                background: '#f7fafc', border: '2px solid #e2e8f0', cursor: 'pointer', textAlign: 'right', fontSize: 15 }}>
              {c}
            </button>
          ))}
        </>
      )}
    </div>
  )
}

export default function QuranGamesPage() {
  const nav = useNavigate()
  const saveSession = useSaveSession()
  const student = useStore(s => s.student)
  const { progress, saveLevel } = useLevelProgress(SUBJECT)
  const [activeLevel, setActiveLevel] = useState<LevelDef | null>(null)
  const [verses, setVerses] = useState<any[]>([])
  const [reward, setReward] = useState<any>(null)

  useEffect(() => { api.getQuranVerses().then(r => setVerses(r.data)).catch(() => {}) }, [student])

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
        {gt === 'recite' && verses.length > 0 && <ReciteGame verses={verses} onComplete={(s: number, st: number) => handleComplete(gt, s, st)} />}
        {gt === 'match' && verses.length > 0 && <MatchGame verses={verses} timerSec={activeLevel.timerSeconds ?? 30} onComplete={(s: number, st: number) => handleComplete(gt, s, st)} />}
        {gt === 'color' && <ColorGame onComplete={(s: number, st: number) => handleComplete(gt, s, st)} />}
      </div>
    )
  }

  const totalDone = Object.values(progress).filter(r => r.completed).length
  const totalStars = Object.values(progress).reduce((a, r) => a + (r.stars || 0), 0)

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button onClick={() => nav('/')} style={{ background: 'none', fontSize: 20, border: 'none', cursor: 'pointer' }}>←</button>
        <h1 style={{ fontSize: 22, color: COLOR }}>📿 درس قرآن</h1>
      </div>
      <div className="card" style={{ marginBottom: 20, padding: '12px 16px',
        background: 'linear-gradient(135deg,#fffbf0,#fff)', border: `2px solid ${COLOR}20` }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: COLOR }}>{totalDone}</div><div style={{ fontSize: 11, color: 'var(--text-light)' }}>مرحله تموم</div></div>
          <div style={{ width: 1, background: '#f0f0f0' }} />
          <div><div style={{ fontSize: 22, fontWeight: 800, color: '#FFB703' }}>{totalStars}⭐</div><div style={{ fontSize: 11, color: 'var(--text-light)' }}>ستاره</div></div>
          <div style={{ width: 1, background: '#f0f0f0' }} />
          <div><div style={{ fontSize: 22, fontWeight: 800, color: '#06D6A0' }}>{SUBJECT_LEVELS.quran.filter(l => !l.comingSoon).length}</div><div style={{ fontSize: 11, color: 'var(--text-light)' }}>کل مراحل</div></div>
        </div>
      </div>
      <LevelMap levels={SUBJECT_LEVELS.quran} progress={progress} color={COLOR} onPlay={setActiveLevel} />
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, useSaveSession } from '../hooks/useApi'
import { useStore } from '../store/useStore'
import RewardModal from '../components/RewardModal'

export default function QuranGamesPage() {
  const nav = useNavigate()
  const saveSession = useSaveSession()
  const student = useStore(s => s.student)
  const [game, setGame] = useState<null | 'recite' | 'match' | 'color'>(null)
  const [verses, setVerses] = useState<any[]>([])
  const [reward, setReward] = useState<any>(null)

  useEffect(() => {
    api.getQuranVerses().then(r => setVerses(r.data)).catch(() => {})
  }, [])

  const handleComplete = async (gameType: string, score: number, stars: number) => {
    await saveSession({ subject: 'ghoran', game_type: gameType, score, stars_earned: stars, coins_earned: stars * 5, duration_seconds: 60, completed: true })
    setReward({ stars, coins: stars * 5 })
  }

  if (reward) return (
    <div className="container">
      <RewardModal stars={reward.stars} coins={reward.coins} onClose={() => { setReward(null); setGame(null) }} onHome={() => nav('/')} />
    </div>
  )

  if (game === 'recite' && verses.length > 0) return <ReciteGame verses={verses} onComplete={(s, st) => handleComplete('recite', s, st)} onBack={() => setGame(null)} />
  if (game === 'match' && verses.length > 0) return <MatchGame verses={verses} onComplete={(s, st) => handleComplete('match', s, st)} onBack={() => setGame(null)} />
  if (game === 'color') return <ColorGame onComplete={(s, st) => handleComplete('color', s, st)} onBack={() => setGame(null)} />

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => nav('/')} style={{ background: 'none', fontSize: 20 }}>←</button>
        <h1 style={{ fontSize: 22, color: '#FFB703' }}>📿 درس قرآن</h1>
      </div>

      {[
        { id: 'recite', icon: '🎤', title: 'تلاوت ستاره', desc: 'آیه‌های کوتاه رو با میکروفن بخون', color: '#FFB703' },
        { id: 'match', icon: '🧩', title: 'معنای آیه', desc: 'آیه رو با معنیش تطبیق بده', color: '#6C63FF' },
        { id: 'color', icon: '🎨', title: 'رنگ‌آمیزی قرآنی', desc: 'با جواب درست رنگ اضافه میشه', color: '#FF6584' },
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

function ReciteGame({ verses, onComplete, onBack }: any) {
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [status, setStatus] = useState<'idle' | 'listening' | 'correct' | 'wrong'>('idle')
  const recognitionRef = useRef<any>(null)

  const verse = verses[idx]

  const listen = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('مرورگر از میکروفن پشتیبانی نمی‌کند'); return }
    const r = new SR()
    r.lang = 'ar-SA'
    r.onstart = () => setStatus('listening')
    r.onresult = (e: any) => {
      const text = e.results[0][0].transcript
      const words = verse.arabic.split(' ')
      const heard = text.split(' ')
      const matches = words.filter((w: string) => heard.some((h: string) => h.includes(w.slice(0, 3))))
      if (matches.length >= Math.ceil(words.length * 0.5)) {
        setStatus('correct')
        setScore(s => s + 15)
      } else {
        setStatus('wrong')
      }
    }
    r.onerror = () => setStatus('idle')
    r.start()
    recognitionRef.current = r
  }

  const next = () => {
    if (idx + 1 >= verses.length) onComplete(score, score >= 40 ? 3 : 2)
    else { setIdx(i => i + 1); setStatus('idle') }
  }

  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: 16, background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
      <h2 style={{ marginBottom: 16, color: '#FFB703' }}>🎤 تلاوت ستاره</h2>

      <div style={{ marginBottom: 8, color: 'var(--text-light)', fontSize: 13 }}>{idx + 1} از {verses.length}</div>

      <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #fffbf0, #fff5d6)', marginBottom: 16 }}>
        <p style={{ fontSize: 14, color: '#FFB703', marginBottom: 8 }}>سوره {verse.surah} · آیه {verse.verse}</p>
        <p style={{ fontSize: 20, fontWeight: 700, lineHeight: 2, direction: 'rtl', fontFamily: 'serif', marginBottom: 12 }}>
          {verse.arabic}
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-light)', fontStyle: 'italic' }}>{verse.persian}</p>
      </motion.div>

      {status === 'idle' || status === 'wrong' ? (
        <button className="btn btn-warning" onClick={listen} style={{ marginBottom: 12 }}>
          🎤 {status === 'wrong' ? 'دوباره بخون' : 'بخون!'}
        </button>
      ) : status === 'listening' ? (
        <motion.button animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
          className="btn" style={{ background: '#FF6584', color: 'white', marginBottom: 12 }}
          onClick={() => recognitionRef.current?.stop()}>
          🔴 در حال گوش دادن...
        </motion.button>
      ) : (
        <div>
          <div style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 12 }}>🌟 آفرین!</div>
          <button className="btn btn-success" onClick={next}>
            {idx + 1 >= verses.length ? '🏆 پایان!' : 'بعدی ←'}
          </button>
        </div>
      )}
    </div>
  )
}

function MatchGame({ verses, onComplete, onBack }: any) {
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)

  const verse = verses[idx]
  const choices = verses.map((v: any) => v.persian).sort(() => Math.random() - 0.5).slice(0, 3)
  const allChoices = [...new Set([verse.persian, ...choices])].slice(0, 3).sort(() => Math.random() - 0.5)

  const answer = (choice: string) => {
    if (choice === verse.persian) setScore(s => s + 15)
    if (idx + 1 >= verses.length) onComplete(score + 15, score >= 30 ? 3 : 2)
    else setIdx(i => i + 1)
  }

  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: 16, background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
      <h2 style={{ marginBottom: 16, color: '#6C63FF' }}>🧩 معنای آیه</h2>

      <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="card" style={{ textAlign: 'center', background: '#fffbf0', marginBottom: 20 }}>
        <p style={{ fontSize: 18, fontWeight: 700, lineHeight: 2, direction: 'rtl', fontFamily: 'serif' }}>
          {verse.arabic}
        </p>
      </motion.div>

      <p style={{ color: 'var(--text-light)', marginBottom: 12, fontSize: 14 }}>معنی این آیه کدام است؟</p>
      {allChoices.map((c: string, i: number) => (
        <button key={i} onClick={() => answer(c)}
          style={{ width: '100%', padding: '14px 16px', borderRadius: 14, marginBottom: 10,
            background: '#f7fafc', border: '2px solid #e2e8f0', cursor: 'pointer',
            textAlign: 'right', fontSize: 14, fontWeight: 500 }}>
          {c}
        </button>
      ))}
    </div>
  )
}

const SHAPES = ['⭕', '🔷', '⭐', '🔺', '🟦', '🟩', '🟡', '🟣']
const QA = [
  { q: 'اولین سوره قرآن چه نام دارد؟', a: 'فاتحه', choices: ['فاتحه', 'توحید', 'ناس', 'فلق'] },
  { q: 'قرآن کریم به چه زبانی نازل شد؟', a: 'عربی', choices: ['فارسی', 'عربی', 'ترکی', 'اردو'] },
  { q: 'خداوند در قرآن چه صفاتی دارد؟', a: 'رحمان و رحیم', choices: ['رحمان و رحیم', 'کبیر و صغیر', 'اول و دوم', 'بزرگ و کوچک'] },
]

function ColorGame({ onComplete, onBack }: any) {
  const [idx, setIdx] = useState(0)
  const [colors, setColors] = useState<string[]>([])
  const [done, setDone] = useState(false)

  const q = QA[idx]
  const answer = (a: string) => {
    if (a === q.a) {
      const newColor = `hsl(${Math.random() * 360}, 70%, 70%)`
      setColors(c => [...c, newColor])
    }
    if (idx + 1 >= QA.length) { setDone(true); onComplete(colors.length * 15 + 10, colors.length >= 2 ? 3 : 2) }
    else setIdx(i => i + 1)
  }

  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: 16, background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
      <h2 style={{ marginBottom: 16, color: '#FF6584' }}>🎨 رنگ‌آمیزی قرآنی</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
        {SHAPES.map((s, i) => (
          <div key={i} style={{ fontSize: '2rem', textAlign: 'center', padding: 8,
            filter: colors[i] ? `hue-rotate(${i * 45}deg)` : 'grayscale(1)',
            transition: 'filter 0.5s' }}>
            {s}
          </div>
        ))}
      </div>

      {!done && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{idx + 1}. {q.q}</p>
          </div>
          {q.choices.map((c: string, i: number) => (
            <button key={i} onClick={() => answer(c)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 14, marginBottom: 8,
                background: '#f7fafc', border: '2px solid #e2e8f0', cursor: 'pointer',
                textAlign: 'right', fontSize: 15 }}>
              {c}
            </button>
          ))}
        </>
      )}
    </div>
  )
}

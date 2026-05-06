import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, useSaveSession } from '../hooks/useApi'
import { useStore } from '../store/useStore'
import RewardModal from '../components/RewardModal'

export default function ScienceGamesPage() {
  const nav = useNavigate()
  const student = useStore(s => s.student)
  const saveSession = useSaveSession()
  const [game, setGame] = useState<null | 'animals' | 'plants' | 'seasons'>(null)
  const [data, setData] = useState<any>({})
  const [reward, setReward] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      api.getScienceTopic('animals').then(r => ({ animals: r.data })),
      api.getScienceTopic('plants').then(r => ({ plants: r.data })),
      api.getScienceTopic('seasons').then(r => ({ seasons: r.data })),
    ]).then(results => setData(Object.assign({}, ...results))).catch(() => {})
  }, [])

  const handleComplete = async (gameType: string, score: number, stars: number) => {
    await saveSession({ subject: 'olum', game_type: gameType, score, stars_earned: stars, coins_earned: stars * 5, duration_seconds: 60, completed: true })
    setReward({ stars, coins: stars * 5 })
  }

  if (reward) return (
    <div className="container">
      <RewardModal stars={reward.stars} coins={reward.coins} onClose={() => { setReward(null); setGame(null) }} onHome={() => nav('/')} />
    </div>
  )

  if (game === 'animals' && data.animals) return <AnimalGame animals={data.animals} onComplete={(s, st) => handleComplete('animals', s, st)} onBack={() => setGame(null)} />
  if (game === 'plants' && data.plants) return <PlantGame stages={data.plants} onComplete={(s, st) => handleComplete('plants', s, st)} onBack={() => setGame(null)} />
  if (game === 'seasons' && data.seasons) return <SeasonsGame seasons={data.seasons} onComplete={(s, st) => handleComplete('seasons', s, st)} onBack={() => setGame(null)} />

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => nav('/')} style={{ background: 'none', fontSize: 20 }}>←</button>
        <h1 style={{ fontSize: 22, color: '#06D6A0' }}>🌱 درس علوم</h1>
      </div>

      {[
        { id: 'animals', icon: '🐾', title: 'دنیای حیوانات', desc: 'حیوانات رو دسته‌بندی کن', color: '#FFB703' },
        { id: 'plants', icon: '🌱', title: 'باغبان کوچک', desc: 'مراحل رشد گیاه رو مرتب کن', color: '#06D6A0' },
        { id: 'seasons', icon: '🌦️', title: 'فصل‌های سال', desc: 'ویژگی هر فصل رو بشناس', color: '#6C63FF' },
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

const ANIMAL_EMOJIS: Record<string, string> = {
  cat: '🐱', dog: '🐶', chicken: '🐔', cow: '🐄', lion: '🦁', fish: '🐟'
}

function AnimalGame({ animals, onComplete, onBack }: any) {
  const categories = [...new Set(animals.map((a: any) => a.type))] as string[]
  const [sorted, setSorted] = useState<Record<string, any[]>>({})
  const [remaining, setRemaining] = useState([...animals].sort(() => Math.random() - 0.5))
  const [score, setScore] = useState(0)

  const place = (animal: any, category: string) => {
    if (animal.type === category) {
      setScore(s => s + 10)
      setSorted(p => ({ ...p, [category]: [...(p[category] || []), animal] }))
    }
    setRemaining(r => r.filter(a => a.name !== animal.name))
    if (remaining.length === 1) {
      onComplete(score + 10, score >= 40 ? 3 : 2)
    }
  }

  const current = remaining[0]

  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: 16, background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
      <h2 style={{ marginBottom: 16, color: '#FFB703' }}>🐾 دنیای حیوانات</h2>

      {current && (
        <motion.div key={current.name} initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '4rem' }}>{ANIMAL_EMOJIS[current.image] || '🐾'}</div>
          <p style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>{current.name}</p>
          <p style={{ color: 'var(--text-light)', fontSize: 13 }}>صدا: {current.sound}</p>
          <p style={{ color: 'var(--text-light)', fontSize: 14, marginTop: 4 }}>این حیوان کجا زندگی می‌کند؟</p>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => current && place(current, cat)}
            style={{ padding: '16px', borderRadius: 16, background: '#f7fafc',
              border: '2px solid #e2e8f0', cursor: 'pointer', fontWeight: 600, fontSize: 15 }}>
            {cat === 'خانگی' ? '🏠' : cat === 'وحشی' ? '🌿' : cat === 'مزرعه' ? '🌾' : cat === 'آبزی' ? '🌊' : cat === 'پرنده' ? '🕊️' : '❓'}
            <br/>{cat}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16, color: 'var(--text-light)', fontSize: 13, textAlign: 'center' }}>
        باقی مانده: {remaining.length} · امتیاز: ⭐{score}
      </div>
    </div>
  )
}

function PlantGame({ stages, onComplete, onBack }: any) {
  const [shuffled, setShuffled] = useState([...stages].sort(() => Math.random() - 0.5))
  const [order, setOrder] = useState<any[]>([])
  const [checked, setChecked] = useState(false)
  const [correct, setCorrect] = useState(false)

  const move = (stage: any) => {
    setOrder(o => [...o, stage])
    setShuffled(s => s.filter(x => x.stage !== stage.stage))
  }

  const check = () => {
    const isCorrect = order.every((s, i) => s.stage === i + 1)
    setChecked(true)
    setCorrect(isCorrect)
    if (isCorrect) onComplete(30, 3)
    else setTimeout(() => { setShuffled([...stages].sort(() => Math.random() - 0.5)); setOrder([]); setChecked(false) }, 1500)
  }

  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: 16, background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
      <h2 style={{ marginBottom: 8, color: '#06D6A0' }}>🌱 باغبان کوچک</h2>
      <p style={{ color: 'var(--text-light)', marginBottom: 16, fontSize: 13 }}>مراحل رشد گیاه رو از اول به آخر مرتب کن:</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {shuffled.map(s => (
          <button key={s.stage} onClick={() => move(s)}
            style={{ padding: '10px 14px', borderRadius: 12, background: '#f0fff9',
              border: '2px solid #06D6A0', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {s.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, flexWrap: 'wrap', minHeight: 50 }}>
        {order.map((s, i) => (
          <motion.div key={s.stage} initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--primary)',
              color: 'white', fontSize: 13, fontWeight: 600 }}>{s.name}</div>
            {i < order.length - 1 && <span style={{ color: 'var(--text-light)' }}>←</span>}
          </motion.div>
        ))}
      </div>

      {order.length === stages.length && !checked && (
        <button className="btn btn-success" onClick={check}>✓ بررسی</button>
      )}

      {checked && (
        <div style={{ textAlign: 'center', fontSize: '2rem', marginTop: 12 }}>
          {correct ? '🎉 عالی!' : '😅 دوباره تلاش کن!'}
        </div>
      )}
    </div>
  )
}

function SeasonsGame({ seasons, onComplete, onBack }: any) {
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [score2, setScore2] = useState(0)

  const season = seasons[idx]
  const choices = seasons.map((s: any) => s.name).sort(() => Math.random() - 0.5)

  const answer = (name: string) => {
    if (name === season.name) setScore(s => s + 10)
    if (idx + 1 >= seasons.length) onComplete(score + 10, score >= 30 ? 3 : 2)
    else setIdx(i => i + 1)
  }

  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: 16, background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
      <h2 style={{ marginBottom: 16, color: '#6C63FF' }}>🌦️ فصل‌های سال</h2>

      <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="card" style={{ textAlign: 'center', background: season.color, marginBottom: 20 }}>
        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{season.description}</p>
        <p style={{ color: 'var(--text-light)', fontSize: 14 }}>این توصیف کدام فصل است؟</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {choices.map((name: string) => (
          <button key={name} onClick={() => answer(name)}
            style={{ padding: '18px', borderRadius: 16, fontSize: 18, fontWeight: 700,
              background: '#f7fafc', border: '2px solid #e2e8f0', cursor: 'pointer' }}>
            {name === 'بهار' ? '🌸' : name === 'تابستان' ? '☀️' : name === 'پاییز' ? '🍂' : '❄️'}
            <br/>{name}
          </button>
        ))}
      </div>
    </div>
  )
}

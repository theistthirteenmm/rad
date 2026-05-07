import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, useSaveSession } from '../hooks/useApi'
import { useStore } from '../store/useStore'
import { useLevelProgress } from '../hooks/useLevelProgress'
import { SUBJECT_LEVELS, type LevelDef } from '../lib/levels'
import LevelMap from '../components/LevelMap'
import RewardModal from '../components/RewardModal'
import TeacherVoice from '../components/TeacherVoice'

const COLOR = '#06D6A0'
const SUBJECT = 'science'

const ANIMAL_EMOJIS: Record<string, string> = {
  cat:'🐱', dog:'🐶', chicken:'🐔', cow:'🐄', lion:'🦁', fish:'🐟'
}

function AnimalGame({ animals, onComplete }: any) {
  const categories = [...new Set(animals.map((a: any) => a.type))] as string[]
  const [remaining, setRemaining] = useState([...animals].sort(() => Math.random() - 0.5))
  const [score, setScore] = useState(0)

  const place = (animal: any, category: string) => {
    const correct = animal.type === category
    if (correct) setScore(s => s + 10)
    const newRem = remaining.filter(a => a.name !== animal.name)
    setRemaining(newRem)
    if (newRem.length === 0) {
      const ns = score + (correct ? 10 : 0)
      onComplete(ns, ns >= 40 ? 3 : ns >= 20 ? 2 : 1)
    }
  }

  const current = remaining[0]
  return (
    <div>
      {current && (
        <motion.div key={current.name} initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '3.5rem' }}>{ANIMAL_EMOJIS[current.image] || '🐾'}</div>
          <p style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>{current.name}</p>
          <p style={{ color: 'var(--text-light)', fontSize: 13 }}>صدا: {current.sound}</p>
          <TeacherVoice text={`${current.name} کجا زندگی می‌کنه؟`}
            style={{ justifyContent: 'center', marginTop: 4, color: 'var(--text-light)' }} fontSize={14} />
        </motion.div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => current && place(current, cat)}
            style={{ padding: 16, borderRadius: 16, background: '#f7fafc',
              border: '2px solid #e2e8f0', cursor: 'pointer', fontWeight: 600, fontSize: 15 }}>
            {cat==='خانگی'?'🏠':cat==='وحشی'?'🌿':cat==='مزرعه'?'🌾':cat==='آبزی'?'🌊':cat==='پرنده'?'🕊️':'❓'}
            <br/>{cat}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 12, color: 'var(--text-light)', fontSize: 13, textAlign: 'center' }}>
        باقی: {remaining.length} · ⭐{score}
      </div>
    </div>
  )
}

function PlantGame({ stages, onComplete }: any) {
  const [shuffled, setShuffled] = useState(() => [...stages].sort(() => Math.random() - 0.5))
  const [order, setOrder] = useState<any[]>([])
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [tries, setTries] = useState(0)

  const move = (stage: any) => {
    if (result !== 'idle') return
    setOrder(o => [...o, stage])
    setShuffled(s => s.filter(x => x.stage !== stage.stage))
  }

  const removeFromOrder = (idx: number) => {
    if (result !== 'idle') return
    const removed = order[idx]
    setOrder(o => o.filter((_, i) => i !== idx))
    setShuffled(s => [...s, removed].sort((a, b) => a.stage - b.stage))
  }

  const check = () => {
    const ok = order.every((s, i) => s.stage === i + 1)
    if (ok) {
      setResult('correct')
      const stars = tries === 0 ? 3 : tries === 1 ? 2 : 1
      setTimeout(() => onComplete(30, stars), 1200)
    } else {
      setResult('wrong')
      setTimeout(() => {
        setShuffled([...stages].sort(() => Math.random() - 0.5))
        setOrder([])
        setResult('idle')
        setTries(t => t + 1)
      }, 1500)
    }
  }

  const reset = () => {
    setShuffled([...stages].sort(() => Math.random() - 0.5))
    setOrder([])
    setResult('idle')
  }

  return (
    <div>
      <p style={{ color: 'var(--text-light)', marginBottom: 8, fontSize: 13 }}>
        مراحل رشد گیاه رو به ترتیب مرتب کن:
      </p>

      {/* نمایش ترتیب درست به عنوان راهنما */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14,
        background: '#f0fff9', borderRadius: 12, padding: '8px 12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#06D6A0', fontWeight: 700, marginLeft: 4 }}>ترتیب:</span>
        {stages.map((s: any, i: number) => (
          <span key={s.stage} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
              {i + 1}. {s.name}
            </span>
            {i < stages.length - 1 && <span style={{ color: '#ccc', fontSize: 10 }}>←</span>}
          </span>
        ))}
      </div>

      {/* کارت‌های قابل انتخاب */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 6 }}>
          👆 روی مراحل بزن تا مرتب کنی:
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {shuffled.map((s: any) => (
            <motion.button
              key={s.stage}
              whileTap={{ scale: 0.93 }}
              onClick={() => move(s)}
              style={{
                padding: '10px 16px', borderRadius: 12,
                background: '#f0fff9', border: '2px solid #06D6A0',
                cursor: 'pointer', fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              <span style={{ fontSize: 18 }}>
                {s.stage === 1 ? '🌱' : s.stage === 2 ? '🌿' : s.stage === 3 ? '🪴' : s.stage === 4 ? '🌳' : '🌸'}
              </span>
              {s.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ترتیب انتخاب‌شده */}
      <div style={{ minHeight: 56, background: '#f7fafc', borderRadius: 14,
        padding: '10px 12px', marginBottom: 14, border: '2px dashed #e2e8f0' }}>
        {order.length === 0 ? (
          <div style={{ color: '#ccc', fontSize: 13, textAlign: 'center', paddingTop: 6 }}>
            اینجا مرتب می‌شه...
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {order.map((s: any, i: number) => (
              <motion.div key={`${s.stage}-${i}`}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => removeFromOrder(i)}
                  style={{
                    padding: '7px 12px', borderRadius: 10,
                    background: result === 'correct' ? '#06D6A0' :
                                result === 'wrong' ? '#FF6584' : 'var(--primary)',
                    color: 'white', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                    transition: 'background 0.3s',
                  }}>
                  {i + 1}. {s.name}
                </button>
                {i < order.length - 1 && <span style={{ color: '#aaa' }}>←</span>}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* نتیجه */}
      {result === 'correct' && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          style={{ textAlign: 'center', fontSize: 28, marginBottom: 12, color: '#06D6A0', fontWeight: 700 }}>
          🎉 آفرین! ترتیب درسته!
        </motion.div>
      )}
      {result === 'wrong' && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          style={{ textAlign: 'center', fontSize: 18, marginBottom: 12, color: '#FF6584', fontWeight: 700 }}>
          😅 ترتیب اشتباهه، دوباره تلاش کن!
        </motion.div>
      )}

      {/* دکمه‌ها */}
      {result === 'idle' && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={reset}
            style={{ background: '#ffe0e0', color: '#FF6584', flex: 1 }}>
            🗑️ پاک
          </button>
          <button className="btn btn-success" onClick={check}
            disabled={order.length !== stages.length}
            style={{ flex: 2, opacity: order.length !== stages.length ? 0.5 : 1 }}>
            ✓ بررسی
          </button>
        </div>
      )}

      {tries > 0 && result === 'idle' && (
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#aaa' }}>
          تلاش {tries + 1}
        </div>
      )}
    </div>
  )
}

function SeasonsGame({ seasons, onComplete }: any) {
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)

  const season = seasons[idx]
  const choices = [...seasons].map((s: any) => s.name).sort(() => Math.random() - 0.5)

  const answer = (name: string) => {
    const ns = name === season.name ? score + 10 : score
    setScore(ns)
    if (idx + 1 >= seasons.length) onComplete(ns, ns >= 30 ? 3 : 2)
    else setIdx(i => i + 1)
  }

  return (
    <div>
      <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
        <TeacherVoice text={`${season.description}. این توصیف کدام فصله؟`}
          style={{ flexDirection: 'column', gap: 6, justifyContent: 'center' }} fontSize={15} />

      </motion.div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {choices.map((name: string) => (
          <button key={name} onClick={() => answer(name)}
            style={{ padding: 18, borderRadius: 16, fontSize: 18, fontWeight: 700,
              background: '#f7fafc', border: '2px solid #e2e8f0', cursor: 'pointer' }}>
            {name==='بهار'?'🌸':name==='تابستان'?'☀️':name==='پاییز'?'🍂':'❄️'}<br/>{name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ScienceGamesPage() {
  const nav = useNavigate()
  const student = useStore(s => s.student)
  const saveSession = useSaveSession()
  const { progress, saveLevel } = useLevelProgress(SUBJECT)
  const [activeLevel, setActiveLevel] = useState<LevelDef | null>(null)
  const [data, setData] = useState<any>({})
  const [reward, setReward] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      api.getScienceTopic('animals').then(r => ({ animals: r.data })),
      api.getScienceTopic('plants').then(r => ({ plants: r.data })),
      api.getScienceTopic('seasons').then(r => ({ seasons: r.data })),
    ]).then(results => setData(Object.assign({}, ...results))).catch(() => {})
  }, [student])

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
        {gt === 'animals' && data.animals && <AnimalGame animals={data.animals} onComplete={(s: number, st: number) => handleComplete(gt, s, st)} />}
        {gt === 'plants' && data.plants && <PlantGame stages={data.plants} onComplete={(s: number, st: number) => handleComplete(gt, s, st)} />}
        {gt === 'seasons' && data.seasons && <SeasonsGame seasons={data.seasons} onComplete={(s: number, st: number) => handleComplete(gt, s, st)} />}
      </div>
    )
  }

  const totalDone = Object.values(progress).filter(r => r.completed).length
  const totalStars = Object.values(progress).reduce((a, r) => a + (r.stars || 0), 0)

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button onClick={() => nav('/')} style={{ background: 'none', fontSize: 20, border: 'none', cursor: 'pointer' }}>←</button>
        <h1 style={{ fontSize: 22, color: COLOR }}>🌱 درس علوم</h1>
      </div>
      <div className="card" style={{ marginBottom: 20, padding: '12px 16px',
        background: 'linear-gradient(135deg,#f0fff9,#fff)', border: `2px solid ${COLOR}20` }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: COLOR }}>{totalDone}</div><div style={{ fontSize: 11, color: 'var(--text-light)' }}>مرحله تموم</div></div>
          <div style={{ width: 1, background: '#f0f0f0' }} />
          <div><div style={{ fontSize: 22, fontWeight: 800, color: '#FFB703' }}>{totalStars}⭐</div><div style={{ fontSize: 11, color: 'var(--text-light)' }}>ستاره</div></div>
          <div style={{ width: 1, background: '#f0f0f0' }} />
          <div><div style={{ fontSize: 22, fontWeight: 800, color: '#06D6A0' }}>{SUBJECT_LEVELS.science.filter(l => !l.comingSoon).length}</div><div style={{ fontSize: 11, color: 'var(--text-light)' }}>کل مراحل</div></div>
        </div>
      </div>
      <LevelMap levels={SUBJECT_LEVELS.science} progress={progress} color={COLOR} onPlay={setActiveLevel} />
    </div>
  )
}

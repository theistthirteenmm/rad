import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api, useSaveSession } from '../hooks/useApi'
import { useStore } from '../store/useStore'
import { useTimer } from '../hooks/useTimer'
import { useLevelProgress } from '../hooks/useLevelProgress'
import { SUBJECT_LEVELS, type LevelDef } from '../lib/levels'
import LevelMap from '../components/LevelMap'
import FarsiReading from '../games/FarsiReading'
import WordBuilder from '../games/WordBuilder'
import AlphabetCards from '../games/AlphabetCards'
import StoryReader from '../games/StoryReader'
import RewardModal from '../components/RewardModal'
import TeacherVoice from '../components/TeacherVoice'
import { speak } from '../lib/tts'

const COLOR = '#FF6584'
const SUBJECT = 'farsi'

const AVATARS_EMOJI = ['🦁','🐯','🐻','🦊','🐼','🐸','🦋','🐬']

const FALLBACK_ALPHABET = [
  {letter:'آ',name:'آ',word:'آب',emoji:'💧'},{letter:'ا',name:'الف',word:'انار',emoji:'🌿'},
  {letter:'ب',name:'بِ',word:'بابا',emoji:'👨'},{letter:'پ',name:'پِ',word:'پرنده',emoji:'🐦'},
  {letter:'ت',name:'تِ',word:'تاب',emoji:'🎠'},{letter:'ث',name:'ثِ',word:'ثروت',emoji:'💰'},
  {letter:'ج',name:'جیم',word:'جنگل',emoji:'🌲'},{letter:'چ',name:'چِ',word:'چراغ',emoji:'💡'},
  {letter:'ح',name:'حِ',word:'حیوان',emoji:'🐾'},{letter:'خ',name:'خِ',word:'خرس',emoji:'🐻'},
  {letter:'د',name:'دال',word:'درخت',emoji:'🌳'},{letter:'ذ',name:'ذال',word:'ذرت',emoji:'🌽'},
  {letter:'ر',name:'رِ',word:'رنگ',emoji:'🎨'},{letter:'ز',name:'زِ',word:'زنبور',emoji:'🐝'},
  {letter:'ژ',name:'ژِ',word:'ژاله',emoji:'🌧️'},{letter:'س',name:'سین',word:'سیب',emoji:'🍎'},
  {letter:'ش',name:'شین',word:'شیر',emoji:'🦁'},{letter:'ص',name:'صاد',word:'صبح',emoji:'🌅'},
  {letter:'ض',name:'ضاد',word:'ضربه',emoji:'👊'},{letter:'ط',name:'طا',word:'طلا',emoji:'🥇'},
  {letter:'ظ',name:'ظا',word:'ظرف',emoji:'🍽️'},{letter:'ع',name:'عین',word:'عقاب',emoji:'🦅'},
  {letter:'غ',name:'غین',word:'غاز',emoji:'🦆'},{letter:'ف',name:'فِ',word:'فیل',emoji:'🐘'},
  {letter:'ق',name:'قاف',word:'قلم',emoji:'✏️'},{letter:'ک',name:'کاف',word:'کتاب',emoji:'📚'},
  {letter:'گ',name:'گاف',word:'گربه',emoji:'🐱'},{letter:'ل',name:'لام',word:'لاله',emoji:'🌷'},
  {letter:'م',name:'میم',word:'مامان',emoji:'👩'},{letter:'ن',name:'نون',word:'نان',emoji:'🍞'},
  {letter:'و',name:'واو',word:'ورزش',emoji:'⚽'},{letter:'ه',name:'هِ',word:'هدیه',emoji:'🎁'},
  {letter:'ی',name:'یِ',word:'یخ',emoji:'🧊'},
]
const FALLBACK_WORDS = [
  {word:'آب',image:'water',letters:['آ','ب'],difficulty:1},{word:'دل',image:'heart',letters:['د','ل'],difficulty:1},
  {word:'گل',image:'flower',letters:['گ','ل'],difficulty:1},{word:'نان',image:'bread',letters:['ن','ا','ن'],difficulty:1},
  {word:'سیب',image:'apple',letters:['س','ی','ب'],difficulty:1},{word:'فیل',image:'elephant',letters:['ف','ی','ل'],difficulty:1},
  {word:'خرس',image:'bear',letters:['خ','ر','س'],difficulty:1},{word:'کتاب',image:'book',letters:['ک','ت','ا','ب'],difficulty:2},
]
const FALLBACK_SENTENCES = [
  {text:'بابا آب داد',level:1},{text:'مامان نان داد',level:1},{text:'باد آمد',level:1},
  {text:'سارا کتاب دارد',level:2},{text:'سیب قرمز است',level:2},{text:'علی به مدرسه رفت',level:3},
]

// LetterMatch with timer
function LetterMatchGame({ alphabet, onComplete, timerSeconds }: {
  alphabet: any[]; onComplete: (score: number, stars: number) => void; timerSeconds: number
}) {
  const [items] = useState(() => [...alphabet].sort(() => Math.random() - 0.5))
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [choices, setChoices] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [timeouts, setTimeouts] = useState(0)

  const advance = () => {
    if (idx + 1 >= items.length) { setDone(true); timer.stop() }
    else { setIdx(i => i + 1); setSelected(null); timer.reset(); timer.start() }
  }

  const timer = useTimer(timerSeconds, () => {
    if (done || selected) return
    setTimeouts(t => t + 1)
    speak(items[idx].letter)
    setSelected('__timeout__')
    setTimeout(advance, 1000)
  })

  useEffect(() => {
    if (items.length === 0) return
    const correct = items[idx].letter
    const wrongs = alphabet.filter(a => a.letter !== correct).sort(() => Math.random() - 0.5).slice(0, 3).map(a => a.letter)
    setChoices([correct, ...wrongs].sort(() => Math.random() - 0.5))
    timer.start()
    return () => timer.stop()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  const answer = (letter: string) => {
    if (selected) return
    timer.stop()
    const correct = items[idx].letter
    setSelected(letter)
    if (letter === correct) { setScore(s => s + 10); speak('آفرین') }
    else speak(correct)
    setTimeout(advance, 900)
  }

  if (done || idx >= items.length) {
    const total = items.length
    const stars = score >= total * 8 ? 3 : score >= total * 5 ? 2 : 1
    return (
      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem' }}>🏆</div>
        <h2 style={{ marginTop: 8 }}>آفرین! تمام شد!</h2>
        <p style={{ color: 'var(--text-light)', marginTop: 6 }}>امتیاز: {score} از {total * 10}</p>
        {timeouts > 0 && <p style={{ fontSize: 12, color: '#FF6584' }}>⏱ {timeouts} بار وقت تموم شد</p>}
        <button className="btn btn-success" style={{ marginTop: 16 }} onClick={() => onComplete(score, stars)}>
          دریافت جایزه 🎁
        </button>
      </motion.div>
    )
  }

  const item = items[idx]
  const pct = timer.pct
  const timerColor = timer.urgent ? '#FF6584' : timer.timeLeft <= 10 ? '#FF9800' : '#06D6A0'

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Timer */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12,
          color: timerColor, fontWeight: 700, marginBottom: 4 }}>
          <span>⏱ {timer.timeLeft} ثانیه</span>
          <span>{idx + 1} / {items.length}</span>
        </div>
        <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4 }}>
          <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
            style={{ height: '100%', background: timerColor, borderRadius: 4 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }} className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '3rem', marginBottom: 6 }}>{item.emoji}</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{item.word}</div>
          <TeacherVoice text={`حرف اول کلمه ${item.word} چیه؟`}
            style={{ justifyContent: 'center', marginTop: 4, color: 'var(--text-light)' }} fontSize={13} />
          <button onClick={() => speak(item.word)} style={{ background: 'none', fontSize: 18, cursor: 'pointer', marginTop: 4 }}>🔊</button>
        </motion.div>
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {choices.map(letter => {
          const isCorrect = letter === item.letter
          const isSelected = letter === selected
          let bg = '#f0eeff', border = '#e0d8ff', col = 'var(--primary)'
          if (isSelected) { bg = isCorrect ? '#06D6A0' : '#FF6584'; border = 'transparent'; col = 'white' }
          else if (selected && isCorrect) { bg = '#06D6A022'; border = '#06D6A0'; col = '#06D6A0' }
          return (
            <motion.button key={letter} whileTap={{ scale: 0.95 }} onClick={() => answer(letter)}
              style={{ padding: 18, borderRadius: 14, fontSize: 26, fontWeight: 900,
                background: bg, border: `2px solid ${border}`, cursor: 'pointer', color: col, transition: 'all 0.2s' }}>
              {letter}
            </motion.button>
          )
        })}
      </div>
      <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-light)' }}>⭐ {score}</div>
    </div>
  )
}

export default function FarsiGamesPage() {
  const nav = useNavigate()
  const student = useStore(s => s.student)
  const saveSession = useSaveSession()
  const { progress, saveLevel } = useLevelProgress(SUBJECT)

  const [activeLevel, setActiveLevel] = useState<LevelDef | null>(null)
  const [words, setWords] = useState<any[]>([])
  const [sentences, setSentences] = useState<any[]>([])
  const [alphabet, setAlphabet] = useState<any[]>([])
  const [reward, setReward] = useState<{ stars: number; coins: number; totalStars?: number } | null>(null)

  useEffect(() => {
    const lv = student?.level || 1
    api.getFarsiWords(lv).then(r => setWords(r.data)).catch(() => setWords(FALLBACK_WORDS))
    api.getFarsiSentences(lv).then(r => setSentences(r.data)).catch(() => setSentences(FALLBACK_SENTENCES))
    api.getFarsiAlphabet().then(r => setAlphabet(r.data)).catch(() => setAlphabet(FALLBACK_ALPHABET))
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
    const back = (
      <button onClick={() => setActiveLevel(null)}
        style={{ marginBottom: 16, background: 'none', color: 'var(--text-light)', fontSize: 14, border: 'none', cursor: 'pointer' }}>
        ← برگشت
      </button>
    )
    const gt = activeLevel.gameType
    return (
      <div className="container">
        {back}
        <h2 style={{ marginBottom: 16, color: COLOR }}>
          {activeLevel.icon} {activeLevel.title}
        </h2>
        {gt === 'alphabet' && alphabet.length > 0 && (
          <AlphabetCards alphabet={alphabet} onComplete={(s, st) => handleComplete(gt, s, st)} />
        )}
        {gt === 'letterMatch' && alphabet.length > 0 && (
          <LetterMatchGame alphabet={alphabet} timerSeconds={activeLevel.timerSeconds!}
            onComplete={(s, st) => handleComplete(gt, s, st)} />
        )}
        {gt === 'wordbuilder' && words.length > 0 && (
          <WordBuilder words={words.slice(0, 8)} onComplete={(s, st) => handleComplete(gt, s, st)} />
        )}
        {gt === 'reading' && sentences.length > 0 && (
          <FarsiReading sentences={sentences} onComplete={(s, st) => handleComplete(gt, s, st)} />
        )}
        {gt === 'story' && (
          <StoryReader onComplete={(s, st) => handleComplete(gt, s, st)} />
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
        <h1 style={{ fontSize: 22, color: COLOR }}>📖 درس فارسی</h1>
      </div>

      {/* Progress summary */}
      <div className="card" style={{ marginBottom: 20, padding: '12px 16px',
        background: 'linear-gradient(135deg, #fff0f3, #fff)', border: `2px solid ${COLOR}20` }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLOR }}>{totalDone}</div>
            <div style={{ fontSize: 11, color: 'var(--text-light)' }}>مرحله تموم</div>
          </div>
          <div style={{ width: 1, background: '#f0f0f0' }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFB703' }}>{totalStars}⭐</div>
            <div style={{ fontSize: 11, color: 'var(--text-light)' }}>ستاره کسب شده</div>
          </div>
          <div style={{ width: 1, background: '#f0f0f0' }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#06D6A0' }}>
              {SUBJECT_LEVELS.farsi.filter(l => !l.comingSoon).length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-light)' }}>کل مراحل</div>
          </div>
        </div>
      </div>

      <LevelMap
        levels={SUBJECT_LEVELS.farsi}
        progress={progress}
        color={COLOR}
        onPlay={setActiveLevel}
      />
    </div>
  )
}

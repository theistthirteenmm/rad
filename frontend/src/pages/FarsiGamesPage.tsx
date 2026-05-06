import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api, useSaveSession } from '../hooks/useApi'
import { useStore } from '../store/useStore'
import FarsiReading from '../games/FarsiReading'
import WordBuilder from '../games/WordBuilder'
import AlphabetCards from '../games/AlphabetCards'
import RewardModal from '../components/RewardModal'

type GameType = null | 'reading' | 'wordbuilder' | 'alphabet' | 'letterMatch'

interface AlphabetItem {
  letter: string
  name: string
  word: string
  emoji: string
}

const FALLBACK_ALPHABET: AlphabetItem[] = [
  { letter: 'آ', name: 'آ', word: 'آب', emoji: '💧' },
  { letter: 'ا', name: 'الف', word: 'انار', emoji: '🌿' },
  { letter: 'ب', name: 'بِ', word: 'بابا', emoji: '👨' },
  { letter: 'پ', name: 'پِ', word: 'پرنده', emoji: '🐦' },
  { letter: 'ت', name: 'تِ', word: 'تاب', emoji: '🎠' },
  { letter: 'ث', name: 'ثِ', word: 'ثروت', emoji: '💰' },
  { letter: 'ج', name: 'جیم', word: 'جنگل', emoji: '🌲' },
  { letter: 'چ', name: 'چِ', word: 'چراغ', emoji: '💡' },
  { letter: 'ح', name: 'حِ', word: 'حیوان', emoji: '🐾' },
  { letter: 'خ', name: 'خِ', word: 'خرس', emoji: '🐻' },
  { letter: 'د', name: 'دال', word: 'درخت', emoji: '🌳' },
  { letter: 'ذ', name: 'ذال', word: 'ذرت', emoji: '🌽' },
  { letter: 'ر', name: 'رِ', word: 'رنگ', emoji: '🎨' },
  { letter: 'ز', name: 'زِ', word: 'زنبور', emoji: '🐝' },
  { letter: 'ژ', name: 'ژِ', word: 'ژاله', emoji: '🌧️' },
  { letter: 'س', name: 'سین', word: 'سیب', emoji: '🍎' },
  { letter: 'ش', name: 'شین', word: 'شیر', emoji: '🦁' },
  { letter: 'ص', name: 'صاد', word: 'صبح', emoji: '🌅' },
  { letter: 'ض', name: 'ضاد', word: 'ضربه', emoji: '👊' },
  { letter: 'ط', name: 'طا', word: 'طلا', emoji: '🥇' },
  { letter: 'ظ', name: 'ظا', word: 'ظرف', emoji: '🍽️' },
  { letter: 'ع', name: 'عین', word: 'عقاب', emoji: '🦅' },
  { letter: 'غ', name: 'غین', word: 'غاز', emoji: '🦆' },
  { letter: 'ف', name: 'فِ', word: 'فیل', emoji: '🐘' },
  { letter: 'ق', name: 'قاف', word: 'قلم', emoji: '✏️' },
  { letter: 'ک', name: 'کاف', word: 'کتاب', emoji: '📚' },
  { letter: 'گ', name: 'گاف', word: 'گربه', emoji: '🐱' },
  { letter: 'ل', name: 'لام', word: 'لاله', emoji: '🌷' },
  { letter: 'م', name: 'میم', word: 'مامان', emoji: '👩' },
  { letter: 'ن', name: 'نون', word: 'نان', emoji: '🍞' },
  { letter: 'و', name: 'واو', word: 'ورزش', emoji: '⚽' },
  { letter: 'ه', name: 'هِ', word: 'هدیه', emoji: '🎁' },
  { letter: 'ی', name: 'یِ', word: 'یخ', emoji: '🧊' },
]

const FALLBACK_WORDS = [
  { word: 'آب', image: 'water', letters: ['آ', 'ب'], difficulty: 1 },
  { word: 'دل', image: 'heart', letters: ['د', 'ل'], difficulty: 1 },
  { word: 'گل', image: 'flower', letters: ['گ', 'ل'], difficulty: 1 },
  { word: 'نان', image: 'bread', letters: ['ن', 'ا', 'ن'], difficulty: 1 },
  { word: 'سیب', image: 'apple', letters: ['س', 'ی', 'ب'], difficulty: 1 },
  { word: 'تاب', image: 'swing', letters: ['ت', 'ا', 'ب'], difficulty: 1 },
  { word: 'فیل', image: 'elephant', letters: ['ف', 'ی', 'ل'], difficulty: 1 },
  { word: 'خرس', image: 'bear', letters: ['خ', 'ر', 'س'], difficulty: 1 },
  { word: 'بابا', image: 'father', letters: ['ب', 'ا', 'ب', 'ا'], difficulty: 1 },
  { word: 'مامان', image: 'mother', letters: ['م', 'ا', 'م', 'ا', 'ن'], difficulty: 1 },
  { word: 'کتاب', image: 'book', letters: ['ک', 'ت', 'ا', 'ب'], difficulty: 2 },
  { word: 'خانه', image: 'house', letters: ['خ', 'ا', 'ن', 'ه'], difficulty: 2 },
  { word: 'درخت', image: 'tree', letters: ['د', 'ر', 'خ', 'ت'], difficulty: 2 },
  { word: 'گربه', image: 'cat', letters: ['گ', 'ر', 'ب', 'ه'], difficulty: 2 },
  { word: 'لاله', image: 'tulip', letters: ['ل', 'ا', 'ل', 'ه'], difficulty: 2 },
  { word: 'ستاره', image: 'star', letters: ['س', 'ت', 'ا', 'ر', 'ه'], difficulty: 3 },
  { word: 'پرنده', image: 'bird', letters: ['پ', 'ر', 'ن', 'د', 'ه'], difficulty: 3 },
  { word: 'زنبور', image: 'bee', letters: ['ز', 'ن', 'ب', 'و', 'ر'], difficulty: 3 },
]

const FALLBACK_SENTENCES = [
  { text: 'بابا آب داد', level: 1 },
  { text: 'مامان نان داد', level: 1 },
  { text: 'باد آمد', level: 1 },
  { text: 'ماه تابید', level: 1 },
  { text: 'سارا کتاب دارد', level: 2 },
  { text: 'سیب قرمز است', level: 2 },
  { text: 'گل زیباست', level: 2 },
  { text: 'علی به مدرسه رفت', level: 3 },
  { text: 'پرنده روی درخت نشست', level: 3 },
  { text: 'خرس در جنگل است', level: 3 },
]

export default function FarsiGamesPage() {
  const nav = useNavigate()
  const student = useStore(s => s.student)
  const saveSession = useSaveSession()
  const [game, setGame] = useState<GameType>(null)
  const [words, setWords] = useState<any[]>([])
  const [sentences, setSentences] = useState<any[]>([])
  const [alphabet, setAlphabet] = useState<AlphabetItem[]>([])
  const [reward, setReward] = useState<{ stars: number; coins: number } | null>(null)

  // letter match state
  const [lmItems, setLmItems] = useState<AlphabetItem[]>([])
  const [lmIdx, setLmIdx] = useState(0)
  const [lmScore, setLmScore] = useState(0)
  const [lmDone, setLmDone] = useState(false)
  const [lmSelected, setLmSelected] = useState<string | null>(null)
  const [lmChoices, setLmChoices] = useState<string[]>([])

  useEffect(() => {
    const level = student?.level || 1
    api.getFarsiWords(level).then(r => setWords(r.data)).catch(() => setWords(FALLBACK_WORDS))
    api.getFarsiSentences(level).then(r => setSentences(r.data)).catch(() => setSentences(FALLBACK_SENTENCES))
    api.getFarsiAlphabet().then(r => setAlphabet(r.data)).catch(() => setAlphabet(FALLBACK_ALPHABET))
  }, [student])

  useEffect(() => {
    if (alphabet.length > 0) {
      const shuffled = [...alphabet].sort(() => Math.random() - 0.5)
      setLmItems(shuffled)
    }
  }, [alphabet])

  useEffect(() => {
    if (lmItems.length > 0 && lmIdx < lmItems.length) {
      const correct = lmItems[lmIdx].letter
      const wrongs = alphabet
        .filter(a => a.letter !== correct)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(a => a.letter)
      setLmChoices([correct, ...wrongs].sort(() => Math.random() - 0.5))
    }
  }, [lmIdx, lmItems, alphabet])

  const handleComplete = async (gameType: string, score: number, stars: number) => {
    const coins = stars * 5
    await saveSession({
      subject: 'farsi', game_type: gameType, score,
      stars_earned: stars, coins_earned: coins, duration_seconds: 60, completed: true
    })
    setReward({ stars, coins })
  }

  const resetLm = () => {
    setLmIdx(0)
    setLmScore(0)
    setLmDone(false)
    setLmSelected(null)
    const shuffled = [...alphabet].sort(() => Math.random() - 0.5)
    setLmItems(shuffled)
  }

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'fa-IR'
      u.rate = 0.8
      window.speechSynthesis.speak(u)
    }
  }

  const handleLmAnswer = (letter: string) => {
    if (lmSelected) return
    const correct = lmItems[lmIdx].letter
    setLmSelected(letter)
    if (letter === correct) {
      setLmScore(s => s + 10)
      speak('آفرین')
    } else {
      speak(correct)
    }
    setTimeout(() => {
      if (lmIdx + 1 >= lmItems.length) {
        setLmDone(true)
      } else {
        setLmIdx(i => i + 1)
        setLmSelected(null)
      }
    }, 900)
  }

  if (reward) return (
    <div className="container">
      <RewardModal stars={reward.stars} coins={reward.coins}
        onClose={() => { setReward(null); setGame(null) }} onHome={() => nav('/')} />
    </div>
  )

  if (game === 'reading' && sentences.length > 0) return (
    <div className="container">
      <button onClick={() => setGame(null)} style={{ marginBottom: 16, background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
      <h2 style={{ marginBottom: 16, color: '#FF6584' }}>🎤 صدای قهرمان</h2>
      <FarsiReading sentences={sentences} onComplete={(s, st) => handleComplete('reading', s, st)} />
    </div>
  )

  if (game === 'wordbuilder' && words.length > 0) return (
    <div className="container">
      <button onClick={() => setGame(null)} style={{ marginBottom: 16, background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
      <h2 style={{ marginBottom: 16, color: '#FF6584' }}>🔤 کلمه‌ساز</h2>
      <WordBuilder words={words.slice(0, 8)} onComplete={(s, st) => handleComplete('wordbuilder', s, st)} />
    </div>
  )

  if (game === 'alphabet' && alphabet.length > 0) return (
    <div className="container">
      <button onClick={() => setGame(null)} style={{ marginBottom: 16, background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
      <h2 style={{ marginBottom: 16, color: '#FF6584' }}>🔡 الفبا</h2>
      <AlphabetCards alphabet={alphabet} onComplete={(s, st) => handleComplete('alphabet', s, st)} />
    </div>
  )

  if (game === 'letterMatch' && lmItems.length > 0) {
    const item = lmItems[lmIdx]
    return (
      <div className="container">
        <button onClick={() => { setGame(null); resetLm() }} style={{ marginBottom: 16, background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
        <h2 style={{ marginBottom: 16, color: '#FF6584' }}>🎯 حرف‌یاب</h2>

        {lmDone ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem' }}>🏆</div>
            <h2 style={{ marginTop: 12 }}>آفرین! تمام حروف رو شناختی!</h2>
            <p style={{ color: 'var(--text-light)', marginTop: 8 }}>امتیاز: {lmScore} از {lmItems.length * 10}</p>
            <button className="btn btn-success" style={{ marginTop: 16 }}
              onClick={() => { resetLm(); handleComplete('letterMatch', lmScore, lmScore >= lmItems.length * 7 ? 3 : lmScore >= lmItems.length * 4 ? 2 : 1) }}>
              دریافت جایزه 🎁
            </button>
          </motion.div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 8, color: 'var(--text-light)', fontSize: 13 }}>
              {lmIdx + 1} از {lmItems.length}
            </div>
            <div className="progress-bar" style={{ marginBottom: 20 }}>
              <div className="progress-fill" style={{ width: `${(lmIdx / lmItems.length) * 100}%` }} />
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={lmIdx} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }} className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>{item.emoji}</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{item.word}</div>
                <p style={{ fontSize: 14, color: 'var(--text-light)' }}>کدام حرف اول این کلمه‌ست؟</p>
                <button onClick={() => speak(item.word)} style={{ background: 'none', fontSize: 20, cursor: 'pointer', marginTop: 4 }}>🔊</button>
              </motion.div>
            </AnimatePresence>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {lmChoices.map(letter => {
                const isCorrect = letter === item.letter
                const isSelected = letter === lmSelected
                let bg = '#f0eeff'
                let border = '#e0d8ff'
                let color = 'var(--primary)'
                if (isSelected) {
                  bg = isCorrect ? '#06D6A0' : '#FF6584'
                  border = 'transparent'
                  color = 'white'
                } else if (lmSelected && isCorrect) {
                  bg = '#06D6A022'
                  border = '#06D6A0'
                  color = '#06D6A0'
                }
                return (
                  <motion.button key={letter} whileTap={{ scale: 0.95 }}
                    onClick={() => handleLmAnswer(letter)}
                    style={{
                      padding: '18px', borderRadius: 14, fontSize: 26, fontWeight: 900,
                      background: bg, border: `2px solid ${border}`, cursor: 'pointer',
                      color, transition: 'all 0.2s'
                    }}>
                    {letter}
                  </motion.button>
                )
              })}
            </div>

            <div style={{ marginTop: 16, fontSize: 14, color: 'var(--text-light)' }}>⭐ {lmScore}</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => nav('/')} style={{ background: 'none', fontSize: 20 }}>←</button>
        <h1 style={{ fontSize: 22, color: '#FF6584' }}>📖 درس فارسی</h1>
      </div>

      {[
        { id: 'alphabet', icon: '🔡', title: 'الفبا', desc: 'همه ۳۳ حرف فارسی رو یاد بگیر و آزمون بده', color: '#06D6A0' },
        { id: 'letterMatch', icon: '🎯', title: 'حرف‌یاب', desc: 'حرف اول کلمه‌ها رو پیدا کن - همه حروف الفبا', color: '#FF9800' },
        { id: 'wordbuilder', icon: '🔤', title: 'کلمه‌ساز', desc: 'حروف رو کنار هم بذار و کلمه بساز', color: '#6C63FF' },
        { id: 'reading', icon: '🎤', title: 'صدای قهرمان', desc: 'جمله‌ها رو بلند بخون، قهرمان می‌شی!', color: '#FF6584' },
      ].map((g, i) => (
        <motion.button key={g.id}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setGame(g.id as GameType)}
          className="card"
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', border: `2px solid ${g.color}22`, marginBottom: 12 }}>
          <div style={{ fontSize: '2.5rem', background: `${g.color}22`, borderRadius: 16, width: 60, height: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{g.icon}</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: g.color }}>{g.title}</div>
            <div style={{ color: 'var(--text-light)', fontSize: 13, marginTop: 2 }}>{g.desc}</div>
          </div>
        </motion.button>
      ))}

      <div style={{ marginTop: 16, padding: '12px 16px', background: '#f0eeff', borderRadius: 12, fontSize: 13, color: 'var(--text-light)', textAlign: 'center' }}>
        📊 {alphabet.length} حرف · {words.length} کلمه · {sentences.length} جمله
      </div>
    </div>
  )
}

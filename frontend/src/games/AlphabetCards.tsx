import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { speak } from '../lib/tts'

interface AlphabetItem {
  letter: string
  name: string
  word: string
  emoji: string
}

interface Props {
  alphabet: AlphabetItem[]
  onComplete: (score: number, stars: number) => void
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

/** شباهت ساده بین دو رشته */
function similarity(a: string, b: string): number {
  if (!a || !b) return 0
  const wordsA = a.split(' ')
  const wordsB = b.split(' ')
  const matches = wordsA.filter(w => wordsB.some(wb => wb.includes(w) || w.includes(wb)))
  return matches.length / Math.max(wordsB.length, 1)
}

type CardState = 'front' | 'revealed' | 'listening' | 'correct' | 'wrong'

export default function AlphabetCards({ alphabet, onComplete }: Props) {
  const items = useState(() => shuffle(alphabet))[0]
  const [idx, setIdx] = useState(0)
  const [cardState, setCardState] = useState<CardState>('front')
  const [heard, setHeard] = useState('')
  const [score, setScore] = useState(0)
  const [tries, setTries] = useState(0)
  const recognitionRef = useRef<any>(null)

  const item = items[idx]
  const total = items.length

  // وقتی کارت عوض میشه reset کن
  useEffect(() => {
    setCardState('front')
    setHeard('')
    setTries(0)
  }, [idx])

  // وقتی کارت رو زد → نشون بده کلمه رو و صداش رو پخش کن
  const handleReveal = () => {
    if (cardState !== 'front') return
    setCardState('revealed')
    speak(item.word)
  }

  // شروع ضبط صدا
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      // اگه میکروفن نبود، دکمه "بعدی" نشون بده
      setCardState('correct')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'fa-IR'
    recognition.continuous = false
    recognition.interimResults = false
    recognitionRef.current = recognition

    recognition.onstart = () => setCardState('listening')

    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript.trim()
      setHeard(text)
      const ok =
        text.includes(item.word) ||
        item.word.includes(text) ||
        similarity(text, item.word) > 0.5
      if (ok) {
        setCardState('correct')
        setScore(s => s + 10)
        speak('آفرین')
      } else {
        setTries(t => t + 1)
        setCardState('wrong')
        speak(item.word)
      }
    }

    recognition.onerror = () => {
      setCardState('revealed')
      setHeard('')
    }

    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setCardState('revealed')
  }

  const next = () => {
    if (idx + 1 >= total) {
      const stars = score >= total * 8 ? 3 : score >= total * 5 ? 2 : 1
      onComplete(score, stars)
    } else {
      setIdx(i => i + 1)
    }
  }

  const progressPct = (idx / total) * 100

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12,
        color: 'var(--text-light)', marginBottom: 6 }}>
        <span>حرف {idx + 1} از {total}</span>
        <span>⭐ {score}</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: 24 }}>
        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* کارت اصلی */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          onClick={handleReveal}
          className="card"
          style={{
            minHeight: 220,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            cursor: cardState === 'front' ? 'pointer' : 'default',
            marginBottom: 20,
            background:
              cardState === 'correct' ? 'linear-gradient(135deg,#f0fff9,#e0fdf4)' :
              cardState === 'wrong'   ? 'linear-gradient(135deg,#fff0f3,#ffe4e8)' :
              cardState === 'front'   ? 'white' :
              'linear-gradient(135deg,#f0eeff,#fff0f3)',
            border:
              cardState === 'correct' ? '2px solid #06D6A060' :
              cardState === 'wrong'   ? '2px solid #FF658460' :
              '2px solid #6C63FF22',
            transition: 'background 0.3s, border 0.3s',
          }}
        >
          {cardState === 'front' ? (
            /* روی کارت — فقط حرف */
            <>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ fontSize: '6rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
                {item.letter}
              </motion.div>
              <div style={{ fontSize: 16, color: 'var(--text-light)', marginTop: 8 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: '#bbb', marginTop: 12 }}>
                👆 بزن تا کلمه ببینی
              </div>
            </>
          ) : (
            /* پشت کارت — emoji + کلمه */
            <>
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                style={{ fontSize: '5rem', marginBottom: 8 }}>
                {item.emoji}
              </motion.div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>
                {item.word}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-light)' }}>
                با حرف{' '}
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{item.letter}</span>
                {' '}شروع می‌شه
              </div>

              {/* نتیجه تلفظ */}
              {cardState === 'correct' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{ marginTop: 12, fontSize: 28 }}>🎉</motion.div>
              )}
              {cardState === 'wrong' && heard && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#FF6584',
                  background: '#fff0f3', borderRadius: 8, padding: '6px 12px' }}>
                  شنیدم: «{heard}» — دوباره تلاش کن
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* دکمه‌های عمل */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>

        {/* حالت revealed — دکمه بخون */}
        {cardState === 'revealed' && (
          <>
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.95 }}
              onClick={startListening}
              style={{
                padding: '14px 40px', borderRadius: 18,
                background: 'linear-gradient(135deg,#FF6584,#FF8FA3)',
                color: 'white', border: 'none', cursor: 'pointer',
                fontSize: 18, fontWeight: 700, fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(255,101,132,0.4)',
              }}>
              🎤 بخون!
            </motion.button>
            <button
              onClick={() => speak(item.word)}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: 'var(--text-light)' }}>
              🔊 دوباره بشنو
            </button>
          </>
        )}

        {/* حالت listening */}
        {cardState === 'listening' && (
          <motion.button
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ repeat: Infinity, duration: 0.7 }}
            onClick={stopListening}
            style={{
              padding: '14px 40px', borderRadius: 18,
              background: '#FF6584', color: 'white',
              border: 'none', cursor: 'pointer',
              fontSize: 18, fontWeight: 700, fontFamily: 'inherit',
            }}>
            🔴 در حال گوش دادن...
          </motion.button>
        )}

        {/* حالت wrong — دوباره تلاش */}
        {cardState === 'wrong' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={startListening}
              style={{
                padding: '12px 28px', borderRadius: 16,
                background: 'linear-gradient(135deg,#FF6584,#FF8FA3)',
                color: 'white', border: 'none', cursor: 'pointer',
                fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
              }}>
              🎤 دوباره
            </motion.button>
            {tries >= 2 && (
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={next}
                style={{
                  padding: '12px 28px', borderRadius: 16,
                  background: '#f0eeff', color: 'var(--primary)',
                  border: 'none', cursor: 'pointer',
                  fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
                }}>
                رد کن ←
              </motion.button>
            )}
          </div>
        )}

        {/* حالت correct — بعدی */}
        {cardState === 'correct' && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            whileTap={{ scale: 0.95 }}
            onClick={next}
            style={{
              padding: '14px 48px', borderRadius: 18,
              background: 'linear-gradient(135deg,#06D6A0,#05b888)',
              color: 'white', border: 'none', cursor: 'pointer',
              fontSize: 18, fontWeight: 700, fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(6,214,160,0.4)',
            }}>
            {idx + 1 >= total ? '🏆 پایان!' : 'بعدی ←'}
          </motion.button>
        )}
      </div>
    </div>
  )
}

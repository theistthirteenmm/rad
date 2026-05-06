import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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

type Mode = 'learn' | 'quiz'

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function LearnMode({ alphabet, onStartQuiz }: { alphabet: AlphabetItem[]; onStartQuiz: () => void }) {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const item = alphabet[idx]

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'fa-IR'
      u.rate = 0.8
      window.speechSynthesis.speak(u)
    }
  }

  useEffect(() => {
    setFlipped(false)
  }, [idx])

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 8, color: 'var(--text-light)', fontSize: 13 }}>
        حرف {idx + 1} از {alphabet.length}
      </div>
      <div className="progress-bar" style={{ marginBottom: 20 }}>
        <div className="progress-fill" style={{ width: `${((idx + 1) / alphabet.length) * 100}%` }} />
      </div>

      <motion.div
        key={idx}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card"
        onClick={() => { setFlipped(f => !f); speak(flipped ? item.letter : item.word) }}
        style={{
          minHeight: 200, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', marginBottom: 20,
          background: flipped
            ? 'linear-gradient(135deg, #6C63FF22, #FF658422)'
            : 'white',
          border: '2px solid #6C63FF33'
        }}
      >
        {!flipped ? (
          <>
            <div style={{ fontSize: '5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1, marginBottom: 8 }}>
              {item.letter}
            </div>
            <div style={{ fontSize: 18, color: 'var(--text-light)' }}>{item.name}</div>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>بزن تا کلمه ببینی 👇</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '4rem', marginBottom: 4 }}>{item.emoji}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)' }}>{item.word}</div>
            <div style={{ fontSize: 14, color: 'var(--text-light)', marginTop: 4 }}>
              با حرف <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{item.letter}</span> شروع می‌شه
            </div>
          </>
        )}
      </motion.div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
        <button
          className="btn"
          onClick={() => setIdx(i => Math.max(0, i - 1))}
          disabled={idx === 0}
          style={{ opacity: idx === 0 ? 0.4 : 1, minWidth: 80 }}
        >
          → قبلی
        </button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="btn btn-primary"
          onClick={() => speak(flipped ? item.word : item.letter)}
          style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6584)' }}
        >
          🔊 بشنو
        </motion.button>
        {idx < alphabet.length - 1 ? (
          <button className="btn" onClick={() => setIdx(i => i + 1)} style={{ minWidth: 80 }}>
            بعدی ←
          </button>
        ) : (
          <button className="btn btn-success" onClick={onStartQuiz} style={{ minWidth: 80 }}>
            آزمون! 🎯
          </button>
        )}
      </div>

      {/* Mini alphabet strip */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 8 }}>
        {alphabet.map((a, i) => (
          <button
            key={a.letter}
            onClick={() => setIdx(i)}
            style={{
              width: 34, height: 34, borderRadius: 8, fontSize: 16, fontWeight: 700,
              background: i === idx ? 'var(--primary)' : i < idx ? '#06D6A022' : '#f0eeff',
              color: i === idx ? 'white' : i < idx ? '#06D6A0' : 'var(--primary)',
              border: `1px solid ${i === idx ? 'var(--primary)' : '#e0d8ff'}`,
              cursor: 'pointer'
            }}
          >
            {a.letter}
          </button>
        ))}
      </div>
    </div>
  )
}

function QuizMode({ alphabet, onComplete }: { alphabet: AlphabetItem[]; onComplete: (score: number, stars: number) => void }) {
  const questions = shuffle(alphabet).slice(0, 10)
  const [qIdx, setQIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)

  const q = questions[qIdx]

  const choices = shuffle([
    q.letter,
    ...shuffle(alphabet.filter(a => a.letter !== q.letter)).slice(0, 3).map(a => a.letter)
  ])

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'fa-IR'
      u.rate = 0.8
      window.speechSynthesis.speak(u)
    }
  }

  const handleAnswer = (letter: string) => {
    if (selected) return
    setSelected(letter)
    if (letter === q.letter) {
      setScore(s => s + 10)
      speak('آفرین')
    } else {
      speak(q.letter)
    }
    setTimeout(() => {
      if (qIdx + 1 >= questions.length) {
        const finalScore = score + (letter === q.letter ? 10 : 0)
        const stars = finalScore >= 80 ? 3 : finalScore >= 50 ? 2 : 1
        onComplete(finalScore, stars)
      } else {
        setQIdx(i => i + 1)
        setSelected(null)
      }
    }, 1000)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 8, color: 'var(--text-light)', fontSize: 13 }}>
        سوال {qIdx + 1} از {questions.length}
      </div>
      <div className="progress-bar" style={{ marginBottom: 20 }}>
        <div className="progress-fill" style={{ width: `${(qIdx / questions.length) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={qIdx} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }} className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '4rem', marginBottom: 8 }}>{q.emoji}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{q.word}</div>
          <div style={{ fontSize: 14, color: 'var(--text-light)' }}>
            کدام حرف اوله؟
          </div>
          <button
            onClick={() => speak(q.word)}
            style={{ marginTop: 8, background: 'none', fontSize: 20, cursor: 'pointer' }}
          >
            🔊
          </button>
        </motion.div>
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {choices.map(letter => {
          const isCorrect = letter === q.letter
          const isSelected = letter === selected
          let bg = '#f0eeff'
          let border = '#e0d8ff'
          let color = 'var(--primary)'
          if (isSelected) {
            bg = isCorrect ? '#06D6A0' : '#FF6584'
            border = 'transparent'
            color = 'white'
          } else if (selected && isCorrect) {
            bg = '#06D6A022'
            border = '#06D6A0'
            color = '#06D6A0'
          }
          return (
            <motion.button
              key={letter}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAnswer(letter)}
              style={{
                padding: '20px 16px', borderRadius: 14, fontSize: 28, fontWeight: 900,
                background: bg, border: `2px solid ${border}`, cursor: 'pointer', color,
                transition: 'all 0.2s'
              }}
            >
              {letter}
            </motion.button>
          )
        })}
      </div>

      <div style={{ fontSize: 14, color: 'var(--text-light)' }}>⭐ {score}</div>
    </div>
  )
}

export default function AlphabetCards({ alphabet, onComplete }: Props) {
  const [mode, setMode] = useState<Mode>('learn')

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
        <button
          onClick={() => setMode('learn')}
          style={{
            padding: '8px 18px', borderRadius: 20, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            background: mode === 'learn' ? 'var(--primary)' : '#f0eeff',
            color: mode === 'learn' ? 'white' : 'var(--primary)',
            border: 'none'
          }}
        >
          📖 یاد بگیر
        </button>
        <button
          onClick={() => setMode('quiz')}
          style={{
            padding: '8px 18px', borderRadius: 20, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            background: mode === 'quiz' ? '#FF6584' : '#fff0f3',
            color: mode === 'quiz' ? 'white' : '#FF6584',
            border: 'none'
          }}
        >
          🎯 آزمون
        </button>
      </div>

      {mode === 'learn' ? (
        <LearnMode alphabet={alphabet} onStartQuiz={() => setMode('quiz')} />
      ) : (
        <QuizMode alphabet={alphabet} onComplete={onComplete} />
      )}
    </div>
  )
}

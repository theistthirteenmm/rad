import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  words: { word: string; image: string; letters: string[]; difficulty: number }[]
  onComplete: (score: number, stars: number) => void
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function WordBuilder({ words, onComplete }: Props) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [shuffled, setShuffled] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [score, setScore] = useState(0)

  const word = words[current]

  useEffect(() => {
    const extraLetters = ['ر', 'و', 'ت', 'ن', 'ل'].slice(0, 2)
    setShuffled(shuffle([...word.letters, ...extraLetters.slice(0, Math.max(0, 5 - word.letters.length))]))
    setSelected([])
    setStatus('idle')
  }, [current])

  const addLetter = (letter: string, idx: number) => {
    if (status !== 'idle') return
    const newSelected = [...selected, letter]
    setSelected(newSelected)
    const newShuffled = [...shuffled]
    newShuffled.splice(idx, 1)
    setShuffled(newShuffled)

    if (newSelected.length === word.letters.length) {
      const formed = newSelected.join('')
      if (formed === word.word) {
        setStatus('correct')
        setScore(s => s + 15)
      } else {
        setStatus('wrong')
        setTimeout(() => {
          const extraLetters = ['ر', 'و', 'ت', 'ن', 'ل'].slice(0, 2)
          setShuffled(shuffle([...word.letters, ...extraLetters.slice(0, Math.max(0, 5 - word.letters.length))]))
          setSelected([])
          setStatus('idle')
        }, 1000)
      }
    }
  }

  const removeLetter = (idx: number) => {
    if (status !== 'idle') return
    const letter = selected[idx]
    setSelected(s => s.filter((_, i) => i !== idx))
    setShuffled(s => [...s, letter])
  }

  const next = () => {
    if (current + 1 >= words.length) {
      const stars = score >= 100 ? 3 : score >= 60 ? 2 : 1
      onComplete(score, stars)
    } else {
      setCurrent(c => c + 1)
    }
  }

  const WORD_IMAGES: Record<string, string> = {
    water: '💧', father: '👨', mother: '👩', apple: '🍎', book: '📚',
    school: '🏫', friend: '🤝', house: '🏠', tree: '🌳', bird: '🐦',
    heart: '❤️', flower: '🌸', night: '🌙', ice: '🧊', bread: '🍞',
    wind: '💨', swing: '🎠', road: '🛣️', moon: '🌙', cow: '🐄',
    pen: '✏️', pencil: '✏️', elephant: '🐘', bear: '🐻', goose: '🦆',
    air: '🌤️', paint: '🎨', fish: '🐟', cat: '🐱', seed: '🌱',
    earth: '🌍', hat: '🎩', tulip: '🌷', lamp: '💡', corn: '🌽',
    map: '🗺️', forest: '🌲', glass: '🥤', bee: '🐝', eagle: '🦅',
    watermelon: '🍉', butterfly: '🦋', star: '⭐', fruit: '🍑',
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 12, color: 'var(--text-light)', fontSize: 13 }}>
        کلمه {current + 1} از {words.length}
      </div>
      <div className="progress-bar" style={{ marginBottom: 20 }}>
        <div className="progress-fill" style={{ width: `${(current / words.length) * 100}%` }} />
      </div>

      {/* Word Image */}
      <motion.div key={current} initial={{ scale: 0 }} animate={{ scale: 1 }}
        style={{ fontSize: '5rem', marginBottom: 12 }}>
        {WORD_IMAGES[word.image] || '❓'}
      </motion.div>

      <p style={{ color: 'var(--text-light)', marginBottom: 16, fontSize: 14 }}>
        حروف را مرتب کن تا کلمه بسازی:
      </p>

      {/* Answer slots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {Array(word.letters.length).fill(0).map((_, i) => (
          <motion.div key={i}
            whileTap={{ scale: 0.95 }}
            onClick={() => selected[i] && removeLetter(i)}
            style={{
              width: 50, height: 50, borderRadius: 12,
              background: selected[i] ? (status === 'correct' ? '#06D6A0' : status === 'wrong' ? '#FF6584' : 'var(--primary)') : '#f0eeff',
              border: `2px solid ${selected[i] ? 'transparent' : 'var(--primary)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: selected[i] ? 'white' : 'var(--primary)',
              cursor: selected[i] ? 'pointer' : 'default',
              transition: 'all 0.2s'
            }}>
            {selected[i] || ''}
          </motion.div>
        ))}
      </div>

      {/* Status */}
      <AnimatePresence>
        {status === 'correct' && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            style={{ fontSize: '2rem', marginBottom: 8 }}>🎉 آفرین!</motion.div>
        )}
        {status === 'wrong' && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            style={{ fontSize: '2rem', marginBottom: 8 }}>😅 دوباره!</motion.div>
        )}
      </AnimatePresence>

      {/* Letter buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {shuffled.map((letter, i) => (
          <motion.button key={`${letter}-${i}`}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => addLetter(letter, i)}
            style={{
              width: 52, height: 52, borderRadius: 14, fontSize: 22, fontWeight: 700,
              background: 'white', border: '2px solid #e2e8f0', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'all 0.2s'
            }}>
            {letter}
          </motion.button>
        ))}
      </div>

      {status === 'correct' && (
        <button className="btn btn-success" onClick={next}>
          {current + 1 >= words.length ? '🏆 پایان!' : 'بعدی ←'}
        </button>
      )}

      <div style={{ marginTop: 12, fontSize: 14, color: 'var(--text-light)' }}>⭐ {score}</div>
    </div>
  )
}

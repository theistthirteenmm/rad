import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  sentences: { text: string; level: number }[]
  onComplete: (score: number, stars: number) => void
}

export default function FarsiReading({ sentences, onComplete }: Props) {
  const [current, setCurrent] = useState(0)
  const [status, setStatus] = useState<'idle' | 'listening' | 'correct' | 'wrong'>('idle')
  const [score, setScore] = useState(0)
  const [heard, setHeard] = useState('')
  const [tries, setTries] = useState(0)
  const recognitionRef = useRef<any>(null)

  const sentence = sentences[current]

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('مرورگر شما از میکروفن پشتیبانی نمی‌کند. لطفاً از Chrome استفاده کنید.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'fa-IR'
    recognition.continuous = false
    recognition.interimResults = false
    recognitionRef.current = recognition

    recognition.onstart = () => setStatus('listening')

    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript.trim()
      setHeard(text)
      const correct = text.includes(sentence.text.split(' ')[0]) ||
        similarity(text, sentence.text) > 0.6
      if (correct) {
        setStatus('correct')
        setScore(s => s + 10)
      } else {
        setTries(t => t + 1)
        setStatus('wrong')
      }
    }

    recognition.onerror = () => {
      setStatus('idle')
      setHeard('متأسفم، صدا شنیده نشد')
    }

    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setStatus('idle')
  }

  const next = () => {
    if (current + 1 >= sentences.length) {
      const stars = score >= 80 ? 3 : score >= 50 ? 2 : 1
      onComplete(score, stars)
    } else {
      setCurrent(c => c + 1)
      setStatus('idle')
      setHeard('')
      setTries(0)
    }
  }

  function similarity(a: string, b: string) {
    const wordsA = a.split(' ')
    const wordsB = b.split(' ')
    const matches = wordsA.filter(w => wordsB.some(wb => wb.includes(w) || w.includes(wb)))
    return matches.length / Math.max(wordsB.length, 1)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 12, color: 'var(--text-light)', fontSize: 13 }}>
        {current + 1} از {sentences.length}
      </div>
      <div className="progress-bar" style={{ marginBottom: 24 }}>
        <div className="progress-fill" style={{ width: `${((current) / sentences.length) * 100}%` }} />
      </div>

      <motion.div key={current} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="card" style={{ marginBottom: 20, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.8, color: 'var(--text)' }}>
          {sentence.text}
        </p>
      </motion.div>

      <div style={{ marginBottom: 20 }}>
        <AnimatePresence>
          {status === 'correct' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              style={{ fontSize: '3rem', marginBottom: 8 }}>🎉</motion.div>
          )}
          {status === 'wrong' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              style={{ fontSize: '3rem', marginBottom: 8 }}>😅</motion.div>
          )}
        </AnimatePresence>

        {heard && (
          <div style={{ background: '#f7fafc', borderRadius: 12, padding: '10px 16px',
            fontSize: 14, color: 'var(--text-light)', marginBottom: 12 }}>
            شنیدم: "{heard}"
          </div>
        )}

        {status === 'wrong' && tries >= 2 && (
          <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 12 }}>
            💡 دوباره تلاش کن یا از دکمه بعدی استفاده کن
          </div>
        )}
      </div>

      {status === 'idle' || status === 'wrong' ? (
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="btn btn-primary"
          onPointerDown={startListening}
          style={{ background: 'linear-gradient(135deg, #FF6584, #FF8FA3)', fontSize: 18 }}
        >
          🎤 بخون!
        </motion.button>
      ) : status === 'listening' ? (
        <motion.button
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="btn"
          onClick={stopListening}
          style={{ background: '#FF6584', color: 'white', fontSize: 18 }}
        >
          🔴 در حال گوش دادن...
        </motion.button>
      ) : (
        <motion.button
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="btn btn-success"
          onClick={next}
        >
          {current + 1 >= sentences.length ? '🏆 پایان بازی!' : 'بعدی ←'}
        </motion.button>
      )}

      <div style={{ marginTop: 16, fontSize: 14, color: 'var(--text-light)' }}>
        امتیاز: ⭐ {score}
      </div>
    </div>
  )
}

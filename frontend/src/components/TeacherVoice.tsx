import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  text: string
  autoSpeak?: boolean
  style?: React.CSSProperties
  fontSize?: number | string
  className?: string
}

export function speakFa(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'fa-IR'
  u.rate = 0.82
  u.pitch = 1.1
  window.speechSynthesis.speak(u)
}

export default function TeacherVoice({ text, autoSpeak = true, style, fontSize = 13, className }: Props) {
  const [speaking, setSpeaking] = useState(false)
  const prevRef = useRef('')

  const speak = () => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'fa-IR'
    u.rate = 0.82
    u.pitch = 1.1
    u.onstart = () => setSpeaking(true)
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(u)
  }

  useEffect(() => {
    if (!autoSpeak || prevRef.current === text) return
    prevRef.current = text
    const t = setTimeout(speak, 380)
    return () => clearTimeout(t)
  }, [text, autoSpeak])

  return (
    <span
      onClick={speak}
      className={className}
      title="بزن تا بشنوی 🔊"
      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
        gap: 5, userSelect: 'none', ...style }}>
      <span style={{ fontSize }}>{text}</span>
      <motion.span
        animate={speaking
          ? { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }
          : { scale: 1, opacity: 0.4 }}
        transition={speaking ? { repeat: Infinity, duration: 0.65 } : {}}
        style={{ fontSize: typeof fontSize === 'number' ? fontSize * 0.95 : '0.95em', lineHeight: 1 }}>
        🔊
      </motion.span>
    </span>
  )
}

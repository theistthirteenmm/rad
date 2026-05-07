import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { speakFarsi, speak as ttsSpeak } from '../lib/tts'

interface Props {
  text: string
  autoSpeak?: boolean
  style?: React.CSSProperties
  fontSize?: number | string
  className?: string
}

export function speakFa(text: string) {
  ttsSpeak(text)
}

export default function TeacherVoice({ text, autoSpeak = true, style, fontSize = 13, className }: Props) {
  const [speaking, setSpeaking] = useState(false)
  const prevRef = useRef('')

  const speak = () => {
    speakFarsi(text, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
    })
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

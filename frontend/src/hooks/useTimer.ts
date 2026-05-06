import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer(seconds: number, onExpire: () => void) {
  const [timeLeft, setTimeLeft] = useState(seconds)
  const [running, setRunning] = useState(false)
  const cb = useRef(onExpire)
  cb.current = onExpire

  useEffect(() => {
    if (!running) return
    if (timeLeft <= 0) { cb.current(); return }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [running, timeLeft])

  const start = useCallback(() => { setTimeLeft(seconds); setRunning(true) }, [seconds])
  const reset = useCallback(() => { setTimeLeft(seconds); setRunning(false) }, [seconds])
  const stop  = useCallback(() => setRunning(false), [])

  const pct = (timeLeft / seconds) * 100
  const urgent = timeLeft <= 5

  return { timeLeft, running, start, reset, stop, pct, urgent }
}

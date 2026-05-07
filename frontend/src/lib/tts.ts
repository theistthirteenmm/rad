/**
 * tts.ts — Persian Text-to-Speech utility
 *
 * Strategy:
 * 1. Try Web Speech API with fa-IR voice (works on desktop Chrome, some Android)
 * 2. If no Persian voice found → fallback to Google Translate TTS audio (always works)
 */

let _hasFaVoice: boolean | null = null

/** Check once if a Persian voice is available */
function hasFarsiVoice(): Promise<boolean> {
  if (_hasFaVoice !== null) return Promise.resolve(_hasFaVoice)

  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      _hasFaVoice = false
      return resolve(false)
    }

    const check = () => {
      const voices = window.speechSynthesis.getVoices()
      const found = voices.some(
        (v) => v.lang.startsWith('fa') || v.lang.startsWith('per')
      )
      _hasFaVoice = found
      resolve(found)
    }

    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      check()
    } else {
      window.speechSynthesis.onvoiceschanged = check
      // timeout fallback — if voices never load, assume no fa voice
      setTimeout(() => {
        if (_hasFaVoice === null) {
          _hasFaVoice = false
          resolve(false)
        }
      }, 1500)
    }
  })
}

/** Play audio from Google Translate TTS (always has Persian) */
function playGoogleTTS(text: string, rate = 1): void {
  // Limit to 200 chars (Google TTS limit)
  const chunk = text.slice(0, 200)
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=fa&client=tw-ob&q=${encodeURIComponent(chunk)}`
  const audio = new Audio(url)
  audio.playbackRate = rate
  audio.play().catch(() => {
    // If Google TTS also fails (e.g. offline), silently ignore
  })
}

/** Play using Web Speech API */
function playWebSpeech(
  text: string,
  rate = 0.82,
  onStart?: () => void,
  onEnd?: () => void
): void {
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'fa-IR'
  u.rate = rate
  u.pitch = 1.1
  if (onStart) u.onstart = onStart
  if (onEnd) {
    u.onend = onEnd
    u.onerror = onEnd
  }
  window.speechSynthesis.speak(u)
}

/**
 * Main speak function — use this everywhere instead of speechSynthesis directly.
 * Automatically picks the best available method.
 */
export async function speakFarsi(
  text: string,
  options: {
    rate?: number
    onStart?: () => void
    onEnd?: () => void
  } = {}
): Promise<void> {
  if (!text) return
  const { rate = 0.82, onStart, onEnd } = options

  const hasFa = await hasFarsiVoice()

  if (hasFa) {
    playWebSpeech(text, rate, onStart, onEnd)
  } else {
    onStart?.()
    playGoogleTTS(text, rate > 0.9 ? 1 : 0.9)
    // Estimate duration for onEnd callback (Google TTS has no events)
    if (onEnd) {
      const estimatedMs = Math.max(1000, text.length * 120)
      setTimeout(onEnd, estimatedMs)
    }
  }
}

/** Simple fire-and-forget version */
export function speak(text: string, rate = 0.82): void {
  speakFarsi(text, { rate })
}

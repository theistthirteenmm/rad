/**
 * sounds.ts — صداهای بازی با Web Audio API
 * بدون فایل خارجی، همیشه آفلاین کار می‌کنه
 */

let _ctx: AudioContext | null = null

function ctx(): AudioContext {
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  // iOS نیاز داره context رو resume کنیم
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

/** یه نت ساده پخش کن */
function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.4,
  startDelay = 0,
): void {
  try {
    const c = ctx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, c.currentTime + startDelay)
    gain.gain.setValueAtTime(0, c.currentTime + startDelay)
    gain.gain.linearRampToValueAtTime(volume, c.currentTime + startDelay + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startDelay + duration)
    osc.start(c.currentTime + startDelay)
    osc.stop(c.currentTime + startDelay + duration)
  } catch { /* silent fail */ }
}

/** صدای ضربه/کلیک */
function click(volume = 0.2): void {
  try {
    const c = ctx()
    const buf = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    }
    const src = c.createBufferSource()
    const gain = c.createGain()
    src.buffer = buf
    src.connect(gain)
    gain.connect(c.destination)
    gain.gain.setValueAtTime(volume, c.currentTime)
    src.start()
  } catch { /* silent fail */ }
}

// ─── صداهای اصلی ──────────────────────────────────────────────────────────────

/** ✅ درست — ملودی شاد صعودی */
export function playCorrect(): void {
  tone(523, 0.12, 'sine', 0.35, 0.00)   // C5
  tone(659, 0.12, 'sine', 0.35, 0.10)   // E5
  tone(784, 0.20, 'sine', 0.40, 0.20)   // G5
}

/** ❌ اشتباه — صدای نزولی */
export function playWrong(): void {
  tone(330, 0.15, 'sawtooth', 0.25, 0.00)  // E4
  tone(262, 0.25, 'sawtooth', 0.20, 0.15)  // C4
}

/** 🎉 عالی / آفرین — فانفار کوتاه */
export function playBravo(): void {
  tone(523, 0.10, 'sine', 0.3, 0.00)   // C5
  tone(659, 0.10, 'sine', 0.3, 0.10)   // E5
  tone(784, 0.10, 'sine', 0.3, 0.20)   // G5
  tone(1047, 0.30, 'sine', 0.4, 0.30)  // C6
}

/** ⏱ وقت تموم شد — صدای هشدار */
export function playTimeout(): void {
  tone(440, 0.10, 'square', 0.2, 0.00)
  tone(440, 0.10, 'square', 0.2, 0.15)
  tone(330, 0.25, 'square', 0.2, 0.30)
}

/** 🔔 کلیک دکمه — صدای ملایم */
export function playTap(): void {
  tone(800, 0.06, 'sine', 0.15)
}

/** 🃏 برگشتن کارت */
export function playFlip(): void {
  tone(600, 0.04, 'sine', 0.12, 0.00)
  tone(900, 0.06, 'sine', 0.10, 0.04)
}

/** 🏆 پایان بازی — ملودی پیروزی */
export function playWin(): void {
  const notes = [523, 523, 523, 659, 523, 659, 784]
  const times = [0, 0.15, 0.30, 0.45, 0.65, 0.80, 0.95]
  notes.forEach((f, i) => tone(f, 0.18, 'sine', 0.35, times[i]))
}

/** ⭐ گرفتن ستاره */
export function playStar(): void {
  tone(880, 0.08, 'sine', 0.3, 0.00)
  tone(1100, 0.08, 'sine', 0.3, 0.08)
  tone(1320, 0.15, 'sine', 0.35, 0.16)
}

/** 🎤 شروع ضبط صدا */
export function playRecordStart(): void {
  tone(660, 0.08, 'sine', 0.2, 0.00)
  tone(880, 0.12, 'sine', 0.2, 0.08)
}

/** 🔇 توقف ضبط */
export function playRecordStop(): void {
  tone(880, 0.08, 'sine', 0.2, 0.00)
  tone(660, 0.12, 'sine', 0.15, 0.08)
}

/** 🔓 باز شدن مرحله جدید */
export function playUnlock(): void {
  tone(392, 0.10, 'sine', 0.25, 0.00)  // G4
  tone(494, 0.10, 'sine', 0.25, 0.12)  // B4
  tone(587, 0.10, 'sine', 0.25, 0.24)  // D5
  tone(784, 0.25, 'sine', 0.35, 0.36)  // G5
}

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { speak as ttsSpeak } from '../lib/tts'

interface Story {
  id: string
  title: string
  emoji: string
  color: string
  pages: { illustration: string; sentences: string[] }[]
}

const STORIES: Story[] = [
  {
    id: 'fox-crow', title: 'روباه و کلاغ', emoji: '🦊', color: '#FF9800',
    pages: [
      { illustration: '🦅', sentences: ['روزی کلاغی یک تکه پنیر پیدا کرد.', 'روی شاخه‌ی درخت نشست.'] },
      { illustration: '🦊', sentences: ['روباهی از زیر درخت رد می‌شد.', 'پنیر را دید و آب دهانش راه افتاد.'] },
      { illustration: '🎵', sentences: ['روباه گفت: ای کلاغ زیبا!', 'صدایت حتماً شیرین‌تر از پنیر است.', 'یک آواز بخوان!'] },
      { illustration: '😮', sentences: ['کلاغ دهانش را باز کرد تا بخواند.', 'پنیر افتاد و روباه آن را برداشت.'] },
      { illustration: '💡', sentences: ['کلاغ فهمید که اشتباه کرد.', 'تعریف و تمجید را باید بشناسیم.'] },
    ]
  },
  {
    id: 'rabbit-tortoise', title: 'خرگوش و لاک‌پشت', emoji: '🐢', color: '#06D6A0',
    pages: [
      { illustration: '🏁', sentences: ['خرگوش و لاک‌پشت قرار گذاشتند مسابقه بدهند.', 'همه حیوانات آمدند تماشا کنند.'] },
      { illustration: '🐇', sentences: ['خرگوش خیلی تند دوید.', 'بعد زیر درختی دراز کشید.', 'گفت: وقت دارم کمی بخوابم.'] },
      { illustration: '🐢', sentences: ['لاک‌پشت آرام و پیوسته راه رفت.', 'هیچ‌وقت نایستاد و استراحت نکرد.'] },
      { illustration: '🏆', sentences: ['وقتی خرگوش بیدار شد دیر شده بود.', 'لاک‌پشت به خط پایان رسیده بود.', 'لاک‌پشت برنده شد!'] },
      { illustration: '💡', sentences: ['درس این داستان این است:', 'کوشش و پشتکار به موفقیت می‌رسد.'] },
    ]
  },
  {
    id: 'lion-mouse', title: 'شیر و موش', emoji: '🦁', color: '#6C63FF',
    pages: [
      { illustration: '😴', sentences: ['روزی شیری در جنگل خواب بود.', 'موش کوچکی از روی پایش رد شد.'] },
      { illustration: '😠', sentences: ['شیر بیدار شد و موش را گرفت.', 'خواست او را بخورد.'] },
      { illustration: '🙏', sentences: ['موش گفت: من را نخور.', 'روزی به کمکت خواهم آمد.', 'شیر خندید و رهایش کرد.'] },
      { illustration: '🕸️', sentences: ['چند روز بعد شیر در تله افتاد.', 'هرچه تقلا کرد نتوانست فرار کند.'] },
      { illustration: '🐭', sentences: ['موش کوچولو آمد و طناب را جوید.', 'شیر آزاد شد و موش را تشکر کرد.', 'هیچ‌کس کوچک نیست.'] },
    ]
  },
]

interface Props {
  onComplete: (score: number, stars: number) => void
}

type Phase = 'pick' | 'read' | 'done'
type ReadState = 'tapping' | 'reciting' | 'listening' | 'result_ok' | 'result_fail'

/** نرمال‌سازی متن برای مقایسه */
function normalize(s: string): string {
  return s.trim().replace(/[،؟!.«»:]/g, '').replace(/\s+/g, ' ')
}

/** مقایسه کلمه‌به‌کلمه — برمی‌گردونه چند کلمه اشتباه بود */
function countWrongWords(heard: string, original: string): { wrong: number; total: number; wrongWords: string[] } {
  const heardWords = normalize(heard).split(' ').filter(Boolean)
  const origWords = normalize(original).split(' ').filter(Boolean)
  const wrongWords: string[] = []

  origWords.forEach((ow, i) => {
    const hw = heardWords[i] || ''
    // اگه کلمه شنیده‌شده با کلمه اصلی خیلی فرق داشت → اشتباه
    const match = hw === ow || hw.includes(ow) || ow.includes(hw) ||
      (ow.length > 2 && hw.length > 2 && (ow.startsWith(hw.slice(0, 2)) || hw.startsWith(ow.slice(0, 2))))
    if (!match) wrongWords.push(ow)
  })

  return { wrong: wrongWords.length, total: origWords.length, wrongWords }
}

export default function StoryReader({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('pick')
  const [story, setStory] = useState<Story | null>(null)
  const [pageIdx, setPageIdx] = useState(0)
  const [sentIdx, setSentIdx] = useState(0)
  const [wordIdx, setWordIdx] = useState(0)
  const [lit, setLit] = useState<number[]>([])
  const [readState, setReadState] = useState<ReadState>('tapping')
  const [pageDone, setPageDone] = useState(false)
  const [score, setScore] = useState(0)
  const [totalSentences, setTotalSentences] = useState(0)
  // نتیجه تلاوت
  const [heardText, setHeardText] = useState('')
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [wrongCount, setWrongCount] = useState(0)
  const [tries, setTries] = useState(0)
  const recognitionRef = useRef<any>(null)
  const bravoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const page = story?.pages[pageIdx]
  const sentences = page?.sentences ?? []
  const currentSent = sentences[sentIdx] ?? ''
  const words = currentSent.split(' ').filter(Boolean)

  const speak = (text: string) => ttsSpeak(text, 0.75)

  const startStory = (s: Story) => {
    const total = s.pages.reduce((acc, p) => acc + p.sentences.length, 0)
    setTotalSentences(total)
    setStory(s)
    setPageIdx(0); setSentIdx(0); setWordIdx(0)
    setLit([]); setReadState('tapping')
    setPageDone(false); setScore(0)
    setHeardText(''); setWrongWords([]); setWrongCount(0); setTries(0)
    setPhase('read')
    speak(s.title)
  }

  // وقتی جمله عوض میشه reset کن
  useEffect(() => {
    setWordIdx(0); setLit([])
    setReadState('tapping')
    setHeardText(''); setWrongWords([]); setWrongCount(0); setTries(0)
  }, [sentIdx, pageIdx])

  /** دانش‌آموز روی کلمه می‌زنه */
  const tapWord = (idx: number) => {
    if (readState !== 'tapping' || idx !== wordIdx) return
    const newLit = [...lit, idx]
    setLit(newLit)
    speak(words[idx])

    if (idx === words.length - 1) {
      // همه کلمات انتخاب شدن → حالا باید کل جمله رو بخونه
      setReadState('reciting')
      speak(currentSent)
    } else {
      setWordIdx(idx + 1)
    }
  }

  /** شروع ضبط صدا برای خواندن جمله */
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      // میکروفن نیست → امتیاز کامل بده و برو بعدی
      handleResult(currentSent)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'fa-IR'
    recognition.continuous = false
    recognition.interimResults = false
    recognitionRef.current = recognition

    recognition.onstart = () => setReadState('listening')
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript.trim()
      handleResult(text)
    }
    recognition.onerror = () => {
      setReadState('reciting')
      setHeardText('صدا شنیده نشد، دوباره تلاش کن')
    }
    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setReadState('reciting')
  }

  /** پردازش نتیجه تلاوت */
  const handleResult = (heard: string) => {
    setHeardText(heard)
    const { wrong, total, wrongWords: ww } = countWrongWords(heard, currentSent)
    setWrongWords(ww)
    setWrongCount(wrong)

    // امتیاز: هر جمله ۱۰ امتیاز، به ازای هر کلمه اشتباه ۲ امتیاز کم میشه
    const earned = Math.max(0, 10 - wrong * 2)
    setScore(s => s + earned)

    if (wrong === 0) {
      setReadState('result_ok')
    } else {
      setTries(t => t + 1)
      setReadState('result_fail')
    }
  }

  /** رفتن به جمله بعدی */
  const nextSentence = () => {
    if (!story) return
    if (sentIdx + 1 >= sentences.length) {
      // صفحه تموم شد
      setPageDone(true)
    } else {
      setSentIdx(s => s + 1)
    }
  }

  /** رفتن به صفحه بعدی */
  const nextPage = () => {
    if (!story) return
    const next = pageIdx + 1
    if (next >= story.pages.length) {
      setPhase('done')
    } else {
      setPageIdx(next)
      setSentIdx(0)
      setPageDone(false)
    }
  }

  const finish = () => {
    const maxScore = totalSentences * 10
    const pct = maxScore > 0 ? score / maxScore : 0
    const stars = pct >= 0.85 ? 3 : pct >= 0.6 ? 2 : 1
    onComplete(score, stars)
  }

  useEffect(() => () => {
    bravoTimer.current && clearTimeout(bravoTimer.current)
    recognitionRef.current?.stop()
  }, [])

  // ─── انتخاب داستان ────────────────────────────────────────────────────────
  if (phase === 'pick') return (
    <div>
      <p style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 16 }}>یک داستان انتخاب کن:</p>
      {STORIES.map((s, i) => (
        <motion.button key={s.id}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => startStory(s)}
          className="card"
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16,
            cursor: 'pointer', border: `2px solid ${s.color}30`, marginBottom: 12 }}>
          <div style={{ fontSize: '2.5rem', background: `${s.color}20`, borderRadius: 16,
            width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {s.emoji}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: s.color }}>{s.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 3 }}>
              {s.pages.length} صفحه · {s.pages.reduce((a, p) => a + p.sentences.length, 0)} جمله
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  )

  // ─── پایان داستان ─────────────────────────────────────────────────────────
  if (phase === 'done') return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="card" style={{ textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: '4rem' }}>🌟</div>
      <h2 style={{ marginTop: 12, color: story?.color }}>آفرین! داستان تموم شد!</h2>
      <p style={{ color: 'var(--text-light)', marginTop: 8, fontSize: 15 }}>{story?.title}</p>
      <div style={{ margin: '16px 0', background: '#f7fafc', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: story?.color }}>{score}</div>
        <div style={{ fontSize: 13, color: 'var(--text-light)' }}>امتیاز از {totalSentences * 10}</div>
      </div>
      <motion.button whileTap={{ scale: 0.95 }} className="btn btn-success"
        style={{ marginTop: 8, background: story?.color }} onClick={finish}>
        دریافت جایزه 🎁
      </motion.button>
    </motion.div>
  )

  if (!story || !page) return null

  const progress = ((pageIdx + sentIdx / Math.max(sentences.length, 1)) / story.pages.length) * 100

  return (
    <div>
      {/* Progress + امتیاز */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4 }}>
          <motion.div animate={{ width: `${progress}%` }}
            style={{ height: '100%', background: story.color, borderRadius: 4, transition: 'width 0.4s' }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-light)', whiteSpace: 'nowrap' }}>
          ⭐{score} · ص {pageIdx + 1}/{story.pages.length}
        </span>
      </div>

      {/* تصویر */}
      <AnimatePresence mode="wait">
        <motion.div key={pageIdx}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '5rem', lineHeight: 1.2 }}>{page.illustration}</div>
        </motion.div>
      </AnimatePresence>

      {/* کارت جمله */}
      <div className="card" style={{ marginBottom: 12, padding: '16px 20px', minHeight: 100 }}>
        {sentences.map((sent, si) => {
          if (si > sentIdx) return null
          const isCurr = si === sentIdx
          const sentWords = sent.split(' ').filter(Boolean)

          return (
            <div key={si} style={{ marginBottom: si < sentIdx ? 10 : 0, lineHeight: 2.4 }}>
              {sentWords.map((w, wi) => {
                const isDone = si < sentIdx
                const isLit = isCurr && lit.includes(wi)
                const isCurrent = isCurr && wi === wordIdx && readState === 'tapping'
                const isWrong = isCurr && readState === 'result_fail' && wrongWords.includes(w)

                return (
                  <span key={wi}
                    onClick={() => isCurr && tapWord(wi)}
                    style={{
                      display: 'inline-block',
                      margin: '0 3px',
                      padding: '2px 7px',
                      borderRadius: 8,
                      fontSize: 22,
                      fontWeight: isDone || isLit ? 700 : 400,
                      cursor: isCurrent ? 'pointer' : 'default',
                      color: isDone ? story.color
                        : isWrong ? '#FF6584'
                        : isLit ? story.color
                        : isCurrent ? 'white'
                        : '#ccc',
                      background: isDone ? `${story.color}18`
                        : isWrong ? '#fff0f3'
                        : isLit ? `${story.color}20`
                        : isCurrent ? story.color
                        : 'transparent',
                      border: isWrong ? '1.5px solid #FF658460' : 'none',
                      transition: 'all 0.2s',
                      direction: 'rtl',
                    }}>
                    {isCurrent ? (
                      <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                        {w}
                      </motion.span>
                    ) : w}
                  </span>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* راهنما و نتیجه */}
      <AnimatePresence mode="wait">

        {/* مرحله ۱: انتخاب کلمات */}
        {readState === 'tapping' && (
          <motion.p key="tap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-light)', marginBottom: 12 }}>
            👆 روی کلمه‌ی روشن بزن وقتی خوندیش
          </motion.p>
        )}

        {/* مرحله ۲: آماده خواندن کل جمله */}
        {readState === 'reciting' && (
          <motion.div key="recite" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: story.color, marginBottom: 10 }}>
              🎤 حالا کل جمله رو بلند بخون!
            </div>
            {heardText && (
              <div style={{ fontSize: 12, color: '#aaa', background: '#f7fafc',
                borderRadius: 8, padding: '6px 12px', marginBottom: 10 }}>
                شنیدم: «{heardText}»
              </div>
            )}
            <motion.button whileTap={{ scale: 0.95 }} onClick={startListening}
              style={{ padding: '13px 36px', borderRadius: 16,
                background: 'linear-gradient(135deg,#FF6584,#FF8FA3)',
                color: 'white', border: 'none', cursor: 'pointer',
                fontSize: 17, fontWeight: 700, fontFamily: 'inherit',
                boxShadow: '0 4px 14px rgba(255,101,132,0.35)' }}>
              🎤 بخون!
            </motion.button>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => speak(currentSent)}
                style={{ background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, color: 'var(--text-light)' }}>
                🔊 دوباره بشنو
              </button>
            </div>
          </motion.div>
        )}

        {/* در حال گوش دادن */}
        {readState === 'listening' && (
          <motion.div key="listen" style={{ textAlign: 'center', marginBottom: 12 }}>
            <motion.button
              animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 0.7 }}
              onClick={stopListening}
              style={{ padding: '13px 36px', borderRadius: 16,
                background: '#FF6584', color: 'white',
                border: 'none', cursor: 'pointer',
                fontSize: 17, fontWeight: 700, fontFamily: 'inherit' }}>
              🔴 در حال گوش دادن...
            </motion.button>
          </motion.div>
        )}

        {/* نتیجه: درست */}
        {readState === 'result_ok' && (
          <motion.div key="ok" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#06D6A0', marginBottom: 4 }}>
              آفرین! عالی خوندی!
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 12 }}>
              +۱۰ امتیاز
            </div>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={nextSentence}
              style={{ padding: '12px 36px', borderRadius: 16,
                background: `linear-gradient(135deg, ${story.color}, ${story.color}cc)`,
                color: 'white', border: 'none', cursor: 'pointer',
                fontSize: 16, fontWeight: 700, fontFamily: 'inherit' }}>
              {sentIdx + 1 >= sentences.length ? (pageIdx + 1 >= story.pages.length ? '🏁 پایان!' : '📖 صفحه بعد') : 'جمله بعدی ←'}
            </motion.button>
          </motion.div>
        )}

        {/* نتیجه: اشتباه */}
        {readState === 'result_fail' && (
          <motion.div key="fail" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>😅</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#FF6584', marginBottom: 4 }}>
              {wrongCount} کلمه اشتباه بود
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>
              کلمات اشتباه:{' '}
              {wrongWords.map((w, i) => (
                <span key={i} style={{ color: '#FF6584', fontWeight: 700, margin: '0 3px' }}>{w}</span>
              ))}
            </div>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>
              شنیدم: «{heardText}»
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setReadState('reciting')}
                style={{ padding: '11px 24px', borderRadius: 14,
                  background: 'linear-gradient(135deg,#FF6584,#FF8FA3)',
                  color: 'white', border: 'none', cursor: 'pointer',
                  fontSize: 15, fontWeight: 700, fontFamily: 'inherit' }}>
                🎤 دوباره
              </motion.button>
              {tries >= 2 && (
                <motion.button whileTap={{ scale: 0.95 }} onClick={nextSentence}
                  style={{ padding: '11px 24px', borderRadius: 14,
                    background: '#f0eeff', color: 'var(--primary)',
                    border: 'none', cursor: 'pointer',
                    fontSize: 15, fontWeight: 700, fontFamily: 'inherit' }}>
                  رد کن ←
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* دکمه صفحه بعد (وقتی صفحه تموم شده) */}
      {pageDone && readState !== 'result_ok' && (
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.95 }}
          className="btn btn-success"
          style={{ background: story.color, width: '100%', fontSize: 17, marginTop: 8 }}
          onClick={nextPage}>
          {pageIdx + 1 < story.pages.length ? '📖 صفحه بعد ←' : '🏁 پایان داستان!'}
        </motion.button>
      )}
    </div>
  )
}

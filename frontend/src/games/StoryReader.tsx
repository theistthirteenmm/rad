import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
      {
        illustration: '🦅',
        sentences: ['روزی کلاغی یک تکه پنیر پیدا کرد.', 'روی شاخه‌ی درخت نشست.']
      },
      {
        illustration: '🦊',
        sentences: ['روباهی از زیر درخت رد می‌شد.', 'پنیر را دید و آب دهانش راه افتاد.']
      },
      {
        illustration: '🎵',
        sentences: ['روباه گفت: ای کلاغ زیبا!', 'صدایت حتماً شیرین‌تر از پنیر است.', 'یک آواز بخوان!']
      },
      {
        illustration: '😮',
        sentences: ['کلاغ دهانش را باز کرد تا بخواند.', 'پنیر افتاد و روباه آن را برداشت.']
      },
      {
        illustration: '💡',
        sentences: ['کلاغ فهمید که اشتباه کرد.', 'تعریف و تمجید را باید بشناسیم.']
      },
    ]
  },
  {
    id: 'rabbit-tortoise', title: 'خرگوش و لاک‌پشت', emoji: '🐢', color: '#06D6A0',
    pages: [
      {
        illustration: '🏁',
        sentences: ['خرگوش و لاک‌پشت قرار گذاشتند مسابقه بدهند.', 'همه حیوانات آمدند تماشا کنند.']
      },
      {
        illustration: '🐇',
        sentences: ['خرگوش خیلی تند دوید.', 'بعد زیر درختی دراز کشید.', 'گفت: وقت دارم کمی بخوابم.']
      },
      {
        illustration: '🐢',
        sentences: ['لاک‌پشت آرام و پیوسته راه رفت.', 'هیچ‌وقت نایستاد و استراحت نکرد.']
      },
      {
        illustration: '🏆',
        sentences: ['وقتی خرگوش بیدار شد دیر شده بود.', 'لاک‌پشت به خط پایان رسیده بود.', 'لاک‌پشت برنده شد!']
      },
      {
        illustration: '💡',
        sentences: ['درس این داستان این است:', 'کوشش و پشتکار به موفقیت می‌رسد.']
      },
    ]
  },
  {
    id: 'lion-mouse', title: 'شیر و موش', emoji: '🦁', color: '#6C63FF',
    pages: [
      {
        illustration: '😴',
        sentences: ['روزی شیری در جنگل خواب بود.', 'موش کوچکی از روی پایش رد شد.']
      },
      {
        illustration: '😠',
        sentences: ['شیر بیدار شد و موش را گرفت.', 'خواست او را بخورد.']
      },
      {
        illustration: '🙏',
        sentences: ['موش گفت: من را نخور.', 'روزی به کمکت خواهم آمد.', 'شیر خندید و رهایش کرد.']
      },
      {
        illustration: '🕸️',
        sentences: ['چند روز بعد شیر در تله افتاد.', 'هرچه تقلا کرد نتوانست فرار کند.']
      },
      {
        illustration: '🐭',
        sentences: ['موش کوچولو آمد و طناب را جوید.', 'شیر آزاد شد و موش را تشکر کرد.', 'هیچ‌کس کوچک نیست.']
      },
    ]
  },
]

interface Props {
  onComplete: (score: number, stars: number) => void
}

type Phase = 'pick' | 'read' | 'done'

export default function StoryReader({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('pick')
  const [story, setStory] = useState<Story | null>(null)
  const [pageIdx, setPageIdx] = useState(0)
  const [sentIdx, setSentIdx] = useState(0)
  const [wordIdx, setWordIdx] = useState(0)
  const [lit, setLit] = useState<number[]>([])  // lit word indices in current sentence
  const [sentDone, setSentDone] = useState(false)
  const [pageDone, setPageDone] = useState(false)
  const [pagesRead, setPagesRead] = useState(0)
  const [showBravo, setShowBravo] = useState(false)
  const bravoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const page = story?.pages[pageIdx]
  const sentences = page?.sentences ?? []
  const currentSent = sentences[sentIdx] ?? ''
  const words = currentSent.split(' ').filter(Boolean)

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'fa-IR'
      u.rate = 0.75
      window.speechSynthesis.speak(u)
    }
  }

  const startStory = (s: Story) => {
    setStory(s)
    setPageIdx(0)
    setSentIdx(0)
    setWordIdx(0)
    setLit([])
    setSentDone(false)
    setPageDone(false)
    setPagesRead(0)
    setPhase('read')
    speak(s.title)
  }

  const tapWord = (idx: number) => {
    if (idx !== wordIdx) return
    const newLit = [...lit, idx]
    setLit(newLit)
    speak(words[idx])

    if (idx === words.length - 1) {
      // sentence done
      setSentDone(true)
      setShowBravo(true)
      if (bravoTimer.current) clearTimeout(bravoTimer.current)
      bravoTimer.current = setTimeout(() => setShowBravo(false), 1200)

      if (sentIdx === sentences.length - 1) {
        setPageDone(true)
      }
    } else {
      setWordIdx(idx + 1)
    }
  }

  const nextSentence = () => {
    if (!story) return
    const nextSent = sentIdx + 1
    setSentIdx(nextSent)
    setWordIdx(0)
    setLit([])
    setSentDone(false)
  }

  const nextPage = () => {
    if (!story) return
    const nextPage = pageIdx + 1
    setPagesRead(p => p + 1)
    if (nextPage >= story.pages.length) {
      setPhase('done')
      return
    }
    setPageIdx(nextPage)
    setSentIdx(0)
    setWordIdx(0)
    setLit([])
    setSentDone(false)
    setPageDone(false)
  }

  const finish = () => {
    const total = story?.pages.length ?? 1
    const ratio = pagesRead / total
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1
    onComplete(pagesRead * 20, stars)
  }

  useEffect(() => () => { bravoTimer.current && clearTimeout(bravoTimer.current) }, [])

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
              {s.pages.length} صفحه
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  )

  if (phase === 'done') return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="card" style={{ textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: '4rem' }}>🌟</div>
      <h2 style={{ marginTop: 12, color: story?.color }}>آفرین! داستان تموم شد!</h2>
      <p style={{ color: 'var(--text-light)', marginTop: 8, fontSize: 15 }}>
        {story?.title} رو کامل خوندی!
      </p>
      <motion.button
        whileTap={{ scale: 0.95 }}
        className="btn btn-success"
        style={{ marginTop: 20, background: story?.color }}
        onClick={finish}>
        دریافت جایزه 🎁
      </motion.button>
    </motion.div>
  )

  if (!story || !page) return null

  const progress = ((pageIdx + sentIdx / sentences.length) / story.pages.length) * 100

  return (
    <div>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4 }}>
          <motion.div animate={{ width: `${progress}%` }}
            style={{ height: '100%', background: story.color, borderRadius: 4, transition: 'width 0.4s' }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-light)', whiteSpace: 'nowrap' }}>
          صفحه {pageIdx + 1} از {story.pages.length}
        </span>
      </div>

      {/* Illustration */}
      <AnimatePresence mode="wait">
        <motion.div key={pageIdx}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '5rem', lineHeight: 1.2 }}>{page.illustration}</div>
        </motion.div>
      </AnimatePresence>

      {/* Sentences already done on this page */}
      <div className="card" style={{ marginBottom: 12, padding: '16px 20px', minHeight: 120 }}>
        {sentences.map((sent, si) => {
          if (si > sentIdx) return null
          const isCurrentSent = si === sentIdx
          const sentWords = sent.split(' ').filter(Boolean)

          return (
            <div key={si} style={{ marginBottom: si < sentIdx ? 10 : 0, lineHeight: 2.2 }}>
              {sentWords.map((w, wi) => {
                const isDone = si < sentIdx
                const isLit = isCurrentSent && lit.includes(wi)
                const isCurrent = isCurrentSent && wi === wordIdx && !sentDone
                const isPending = isCurrentSent && !isLit && !isCurrent

                return (
                  <span key={wi}
                    onClick={() => isCurrentSent && tapWord(wi)}
                    style={{
                      display: 'inline-block',
                      margin: '0 4px',
                      padding: '2px 6px',
                      borderRadius: 8,
                      fontSize: 22,
                      fontWeight: isDone || isLit ? 700 : 400,
                      cursor: isCurrent ? 'pointer' : 'default',
                      color: isDone ? story.color
                        : isLit ? story.color
                        : isCurrent ? 'white'
                        : '#ccc',
                      background: isDone ? `${story.color}18`
                        : isLit ? `${story.color}20`
                        : isCurrent ? story.color
                        : 'transparent',
                      transition: 'all 0.25s',
                      direction: 'rtl',
                    }}>
                    {isCurrent ? (
                      <motion.span
                        animate={{ scale: [1, 1.12, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}>
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

      {/* Instruction */}
      {!sentDone && (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-light)', marginBottom: 12 }}>
          👆 روی کلمه‌ی روشن ضربه بزن وقتی خوندیش
        </p>
      )}

      {/* Bravo */}
      <AnimatePresence>
        {showBravo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            style={{ textAlign: 'center', fontSize: 28, marginBottom: 8 }}>
            🎉 آفرین!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      {sentDone && !pageDone && (
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.95 }}
          className="btn btn-primary"
          style={{ background: story.color, width: '100%' }}
          onClick={nextSentence}>
          جمله بعدی ←
        </motion.button>
      )}

      {pageDone && (
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.95 }}
          className="btn btn-success"
          style={{ background: story.color, width: '100%', fontSize: 17 }}
          onClick={nextPage}>
          {pageIdx + 1 < story.pages.length ? '📖 صفحه بعد ←' : '🏁 پایان داستان!'}
        </motion.button>
      )}
    </div>
  )
}

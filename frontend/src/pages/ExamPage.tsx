import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../hooks/useApi'
import { useStore } from '../store/useStore'

const OPTION_LABELS = ['الف', 'ب', 'پ', 'ت']
const OPTION_KEYS = ['a', 'b', 'c', 'd'] as const
const SUBJECT_EMOJI: Record<string, string> = {
  farsi: '📖', math: '🔢', science: '🌱', quran: '📿', writing: '✏️',
}

interface Question {
  id: number
  text: string
  image_data: string | null
  option_a: string
  option_b: string
  option_c: string
  option_d: string
}

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>()
  const nav = useNavigate()
  const student = useStore(s => s.student)

  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [current, setCurrent] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; total: number; percent: number } | null>(null)
  const [error, setError] = useState('')

  // ضدتقلب
  const [warning, setWarning] = useState('')
  const [showForceClosed, setShowForceClosed] = useState(false)
  const awayStartRef = useRef<number | null>(null)
  const startedAtRef = useRef<string>('')

  if (!student) { nav('/login'); return null }

  // بارگذاری آزمون
  useEffect(() => {
    if (!examId) return
    api.startExam(parseInt(examId))
      .then(r => {
        const d = r.data
        setExam(d.exam)
        setQuestions(d.questions)
        setAnswers(d.existing_answers || {})
        startedAtRef.current = d.started_at

        if (d.exam.time_limit_minutes > 0) {
          const elapsed = (Date.now() - new Date(d.started_at).getTime()) / 1000
          const remaining = d.exam.time_limit_minutes * 60 - elapsed
          setTimeLeft(Math.max(0, Math.floor(remaining)))
        }
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'خطا در بارگذاری آزمون')
      })
      .finally(() => setLoading(false))
  }, [examId])

  // تایمر
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return
    if (timeLeft === 0) { handleSubmit(); return }
    const t = setInterval(() => setTimeLeft(s => {
      if (s === null || s <= 1) { clearInterval(t); return 0 }
      return s - 1
    }), 1000)
    return () => clearInterval(t)
  }, [timeLeft !== null ? Math.floor(timeLeft / 10) : null])

  useEffect(() => {
    if (timeLeft === 0 && !result && !submitting) handleSubmit()
  }, [timeLeft])

  // ضدتقلب: Page Visibility API
  const handleVisibility = useCallback(async () => {
    if (!examId || result || showForceClosed) return
    if (document.hidden) {
      awayStartRef.current = Date.now()
    } else {
      if (awayStartRef.current === null) return
      const awaySecs = Math.round((Date.now() - awayStartRef.current) / 1000)
      awayStartRef.current = null
      if (awaySecs < 2) return  // نوسانات کوتاه نادیده گرفته می‌شوند
      try {
        const r = await api.reportAway(parseInt(examId), awaySecs)
        if (r.data.force_close) {
          setShowForceClosed(true)
        } else if (r.data.warning) {
          setWarning(r.data.message)
        }
      } catch { /* ignore */ }
    }
  }, [examId, result, showForceClosed])

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [handleVisibility])

  const handleSubmit = async () => {
    if (!examId || submitting) return
    setSubmitting(true)
    try {
      const r = await api.submitExam(parseInt(examId), answers)
      setResult(r.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در ثبت آزمون')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const answeredCount = Object.keys(answers).length
  const totalQ = questions.length
  const q = questions[current]

  // ─── صفحه نتیجه ─────────────────────────────────────────────────
  if (result) return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="card" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: '4rem', marginBottom: 12 }}>
          {result.percent >= 70 ? '🎉' : result.percent >= 50 ? '👍' : '😔'}
        </div>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>
          {result.percent >= 70 ? 'آفرین!' : result.percent >= 50 ? 'خوب بود!' : 'تلاش بیشتری لازم است'}
        </h2>
        <div style={{
          fontSize: 48, fontWeight: 800, marginBottom: 8,
          color: result.percent >= 70 ? '#06D6A0' : result.percent >= 50 ? '#FFB703' : '#FF6584',
        }}>
          {result.percent}%
        </div>
        <div style={{ fontSize: 18, color: 'var(--text-light)', marginBottom: 24 }}>
          {result.score} از {result.total} سوال درست
        </div>
        <div className="progress-bar" style={{ height: 16, marginBottom: 24 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${result.percent}%` }}
            transition={{ duration: 0.8 }}
            style={{
              height: '100%', borderRadius: 10,
              background: result.percent >= 70 ? '#06D6A0' : result.percent >= 50 ? '#FFB703' : '#FF6584',
            }}
          />
        </div>
        <button onClick={() => nav('/')}
          style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'var(--primary)',
            color: 'white', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' }}>
          🏠 بازگشت به خانه
        </button>
      </motion.div>
    </div>
  )

  // ─── بسته شدن آزمون (تقلب) ───────────────────────────────────────
  if (showForceClosed) return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: '4rem', marginBottom: 12 }}>🚫</div>
        <h2 style={{ fontSize: 20, marginBottom: 8, color: '#FF6584' }}>آزمون بسته شد</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>
          به دلیل خروج مکرر از صفحه، آزمون شما توسط سیستم بسته شد.
          با معلم خود صحبت کنید.
        </p>
        <button onClick={() => nav('/')}
          style={{ width: '100%', padding: '14px', borderRadius: 14, background: '#FF6584',
            color: 'white', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' }}>
          بازگشت به خانه
        </button>
      </div>
    </div>
  )

  // ─── خطا ────────────────────────────────────────────────────────
  if (!loading && error) return (
    <div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
      <p style={{ color: '#FF6584', marginBottom: 24 }}>{error}</p>
      <button onClick={() => nav('/')}
        style={{ background: 'var(--primary)', color: 'white', borderRadius: 12,
          padding: '12px 24px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
        بازگشت
      </button>
    </div>
  )

  if (loading || !exam || !q) return (
    <div style={{ textAlign: 'center', paddingTop: 100 }}>
      <div style={{ fontSize: '2.5rem' }}>⏳</div>
    </div>
  )

  const isWarningRed = timeLeft !== null && timeLeft < 60

  // ─── صفحه اصلی آزمون ─────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc', display: 'flex', flexDirection: 'column' }}>

      {/* هشدار ضدتقلب */}
      <AnimatePresence>
        {warning && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20,
            }}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              style={{ background: 'white', borderRadius: 20, padding: 32, textAlign: 'center', maxWidth: 360 }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
              <h3 style={{ fontSize: 18, marginBottom: 12, color: '#FF9800' }}>هشدار!</h3>
              <p style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 24, lineHeight: 1.8 }}>{warning}</p>
              <button onClick={() => setWarning('')}
                style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#FF9800',
                  color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
                متوجه شدم، ادامه می‌دهم
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* هدر ثابت */}
      <div style={{
        background: 'white', padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {SUBJECT_EMOJI[exam.subject] || '📝'} {exam.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
            سوال {current + 1} از {totalQ} · {answeredCount}/{totalQ} پاسخ داده شده
          </div>
        </div>
        {timeLeft !== null && (
          <div style={{
            fontWeight: 800, fontSize: 22, fontFamily: 'monospace',
            color: isWarningRed ? '#FF6584' : '#06D6A0',
            background: isWarningRed ? '#fff0f3' : '#f0fff9',
            padding: '6px 12px', borderRadius: 10,
            animation: isWarningRed ? 'pulse 1s infinite' : 'none',
          }}>
            ⏱ {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* نوار پیشرفت سوالات */}
      <div style={{ display: 'flex', gap: 4, padding: '10px 16px', background: 'white', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
        {questions.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            style={{
              width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 700,
              background: i === current ? 'var(--primary)' : answers[String(questions[i].id)] ? '#06D6A020' : '#f0f0f0',
              color: i === current ? 'white' : answers[String(questions[i].id)] ? '#06D6A0' : '#888',
              outline: i === current ? '2px solid var(--primary)' : 'none',
              outlineOffset: 1,
            }}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* محتوای سوال */}
      <div style={{ flex: 1, padding: '16px', maxWidth: 600, margin: '0 auto', width: '100%' }}>
        <AnimatePresence mode="wait">
          <motion.div key={current}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}>

            <div className="card" style={{ marginBottom: 16, padding: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 10, fontWeight: 600 }}>
                سوال {current + 1}
              </div>
              <div style={{ fontSize: 17, lineHeight: 1.9, fontWeight: 600, direction: 'rtl' }}>
                {q.text}
              </div>
              {q.image_data && (
                <img src={q.image_data} alt="تصویر سوال"
                  style={{ marginTop: 12, maxWidth: '100%', borderRadius: 10, border: '1px solid #e2e8f0' }} />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {OPTION_KEYS.map((opt, idx) => {
                const optKey = `option_${opt}` as keyof Question
                const optText = q[optKey] as string
                const isSelected = answers[String(q.id)] === opt
                return (
                  <motion.button key={opt}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setAnswers(prev => ({ ...prev, [String(q.id)]: opt }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 14, border: '2px solid',
                      borderColor: isSelected ? 'var(--primary)' : '#e2e8f0',
                      background: isSelected ? '#f0eeff' : 'white',
                      cursor: 'pointer', textAlign: 'right', direction: 'rtl',
                      boxShadow: isSelected ? '0 2px 12px rgba(108,99,255,0.2)' : 'none',
                      transition: 'all 0.15s',
                    }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 14,
                      background: isSelected ? 'var(--primary)' : '#f0f0f0',
                      color: isSelected ? 'white' : '#666',
                    }}>
                      {OPTION_LABELS[idx]}
                    </div>
                    <span style={{ fontSize: 15, fontWeight: isSelected ? 600 : 400, flex: 1 }}>
                      {optText}
                    </span>
                    {isSelected && <span style={{ fontSize: 18 }}>✓</span>}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ناوبری پایین */}
      <div style={{
        background: 'white', borderTop: '1px solid #e2e8f0',
        padding: '12px 16px', display: 'flex', gap: 10,
        position: 'sticky', bottom: 0,
      }}>
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          style={{
            flex: 1, padding: '12px', borderRadius: 12, border: '2px solid #e2e8f0',
            background: current === 0 ? '#f7fafc' : 'white',
            color: current === 0 ? '#ccc' : 'var(--text-light)',
            fontWeight: 600, fontSize: 15, cursor: current === 0 ? 'default' : 'pointer',
          }}>
          ← قبلی
        </button>

        {current < totalQ - 1 ? (
          <button
            onClick={() => setCurrent(c => c + 1)}
            style={{ flex: 2, padding: '12px', borderRadius: 12, background: 'var(--primary)',
              color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
            بعدی ←
          </button>
        ) : (
          <button
            onClick={() => {
              const unanswered = totalQ - answeredCount
              if (unanswered > 0 && !confirm(`${unanswered} سوال بی‌پاسخ دارید. آیا مطمئنید؟`)) return
              handleSubmit()
            }}
            disabled={submitting}
            style={{
              flex: 2, padding: '12px', borderRadius: 12,
              background: submitting ? '#ccc' : '#06D6A0',
              color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer',
            }}>
            {submitting ? '⏳ در حال ثبت...' : `✅ ثبت آزمون (${answeredCount}/${totalQ})`}
          </button>
        )}
      </div>
    </div>
  )
}

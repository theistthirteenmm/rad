import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../hooks/useApi'
import { useStore } from '../store/useStore'

const SUBJECTS = [
  { id: 'farsi',   label: 'فارسی',  emoji: '📖', color: '#FF6584' },
  { id: 'math',    label: 'ریاضی',  emoji: '🔢', color: '#6C63FF' },
  { id: 'science', label: 'علوم',   emoji: '🌱', color: '#06D6A0' },
  { id: 'quran',   label: 'قرآن',   emoji: '📿', color: '#FFB703' },
  { id: 'writing', label: 'نگارش',  emoji: '✏️', color: '#4ECDC4' },
]

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'پیش‌نویس',  color: '#888',    bg: '#f0f0f0' },
  active:    { label: 'فعال',      color: '#06D6A0', bg: '#f0fff9' },
  scheduled: { label: 'زمان‌بندی', color: '#FFB703', bg: '#fffbf0' },
  closed:    { label: 'بسته',      color: '#FF6584', bg: '#fff0f3' },
}

type View = 'list' | 'create' | 'detail' | 'add-question' | 'results'

interface Exam {
  id: number
  title: string
  subject: string
  status: string
  time_limit_minutes: number
  shuffle_questions: boolean
  shuffle_options: boolean
  question_count: number
  attempt_count: number
  created_at: string
  scheduled_at: string | null
  class_id: number | null
  grade_id: number | null
}

interface Question {
  id: number
  order: number
  text: string
  image_data: string | null
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct: string
}

const emptyQ = () => ({
  text: '', image_data: null as string | null,
  option_a: '', option_b: '', option_c: '', option_d: '',
  correct: 'a', order: 0,
})

export default function TeacherExamPage() {
  const nav = useNavigate()
  const user = useStore(s => s.user)
  const [view, setView] = useState<View>('list')
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  // فرم آزمون جدید
  const [form, setForm] = useState({
    title: '', subject: 'farsi', time_limit_minutes: 0,
    shuffle_questions: true, shuffle_options: false,
    class_id: null as number | null,
    scheduled_at: '',
  })

  // فرم سوال
  const [qForm, setQForm] = useState(emptyQ())
  const [editingQId, setEditingQId] = useState<number | null>(null)
  const [results, setResults] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  if (!user || user.role !== 'teacher') { nav('/login'); return null }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  const loadExams = async () => {
    setLoading(true)
    try {
      const r = await api.listExams()
      setExams(r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadExams() }, [])

  const openExam = async (id: number) => {
    setLoading(true)
    try {
      const r = await api.getExam(id)
      setSelectedExam(r.data)
      setView('detail')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExam = async () => {
    if (!form.title.trim()) return showToast('عنوان آزمون را وارد کنید')
    setSaving(true)
    try {
      const payload: any = {
        title: form.title,
        subject: form.subject,
        time_limit_minutes: form.time_limit_minutes,
        shuffle_questions: form.shuffle_questions,
        shuffle_options: form.shuffle_options,
        class_id: form.class_id,
      }
      if (form.scheduled_at) payload.scheduled_at = new Date(form.scheduled_at).toISOString()
      const r = await api.createExam(payload)
      showToast('✅ آزمون ایجاد شد')
      await loadExams()
      await openExam(r.data.id)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!selectedExam) return
    const payload: any = { status }
    if (status === 'scheduled' && form.scheduled_at)
      payload.scheduled_at = new Date(form.scheduled_at).toISOString()
    await api.updateExam(selectedExam.id, payload)
    setSelectedExam({ ...selectedExam, status })
    setExams(exams.map(e => e.id === selectedExam.id ? { ...e, status } : e))
    showToast('وضعیت تغییر کرد')
  }

  const handleDeleteExam = async () => {
    if (!selectedExam || !confirm('آزمون حذف شود؟')) return
    await api.deleteExam(selectedExam.id)
    setExams(exams.filter(e => e.id !== selectedExam.id))
    setView('list')
    showToast('آزمون حذف شد')
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) return showToast('حجم عکس نباید بیشتر از ۵۰۰KB باشد')
    const reader = new FileReader()
    reader.onload = ev => setQForm(f => ({ ...f, image_data: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const handleSaveQuestion = async () => {
    if (!qForm.text.trim()) return showToast('متن سوال را وارد کنید')
    if (!qForm.option_a || !qForm.option_b || !qForm.option_c || !qForm.option_d)
      return showToast('همه گزینه‌ها را پر کنید')
    setSaving(true)
    try {
      const payload = { ...qForm, order: selectedExam.questions?.length ?? 0 }
      if (editingQId) {
        const r = await api.updateQuestion(selectedExam.id, editingQId, payload)
        setSelectedExam((prev: any) => ({
          ...prev,
          questions: prev.questions.map((q: Question) => q.id === editingQId ? { ...q, ...r.data } : q),
        }))
      } else {
        const r = await api.addQuestion(selectedExam.id, payload)
        setSelectedExam((prev: any) => ({
          ...prev,
          questions: [...(prev.questions || []), r.data],
        }))
      }
      setQForm(emptyQ())
      setEditingQId(null)
      setView('detail')
      showToast(editingQId ? '✅ سوال ویرایش شد' : '✅ سوال اضافه شد')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuestion = async (qid: number) => {
    if (!confirm('سوال حذف شود؟')) return
    await api.deleteQuestion(selectedExam.id, qid)
    setSelectedExam((prev: any) => ({
      ...prev,
      questions: prev.questions.filter((q: Question) => q.id !== qid),
    }))
    showToast('سوال حذف شد')
  }

  const startEditQ = (q: Question) => {
    setQForm({
      text: q.text, image_data: q.image_data,
      option_a: q.option_a, option_b: q.option_b,
      option_c: q.option_c, option_d: q.option_d,
      correct: q.correct, order: q.order,
    })
    setEditingQId(q.id)
    setView('add-question')
  }

  const loadResults = async () => {
    if (!selectedExam) return
    const r = await api.getExamResults(selectedExam.id)
    setResults(r.data)
    setView('results')
  }

  const subj = SUBJECTS.find(s => s.id === selectedExam?.subject)
  const statusInfo = STATUS_LABELS[selectedExam?.status || 'draft']

  // ─── Renders ─────────────────────────────────────────────────────

  if (view === 'results') return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => setView('detail')} style={{ background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
        <h2 style={{ fontSize: 18 }}>📊 نتایج: {selectedExam?.title}</h2>
      </div>

      {results.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>
          هنوز هیچ دانش‌آموزی آزمون نداده
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'شرکت‌کننده', value: results.length, emoji: '👥' },
              { label: 'میانگین', value: `${Math.round(results.reduce((a, r) => a + r.percent, 0) / results.length)}%`, emoji: '📈' },
              { label: 'قبولی', value: results.filter(r => r.percent >= 50).length, emoji: '✅' },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: 14 }}>
                <div style={{ fontSize: '1.6rem' }}>{s.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 20 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{s.label}</div>
              </div>
            ))}
          </div>
          {results.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="card" style={{ marginBottom: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{r.student_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
                    کلاس {r.class_name}
                    {r.away_count > 0 && <span style={{ color: '#FF9800', marginRight: 8 }}>⚠️ {r.away_count} بار خروج ({r.away_seconds}ث)</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontWeight: 800, fontSize: 22,
                    color: r.percent >= 70 ? '#06D6A0' : r.percent >= 50 ? '#FFB703' : '#FF6584'
                  }}>
                    {r.percent}%
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{r.score}/{r.total}</div>
                </div>
              </div>
              <div className="progress-bar">
                <div style={{
                  height: '100%', borderRadius: 10, transition: 'width 0.6s',
                  width: `${r.percent}%`,
                  background: r.percent >= 70 ? '#06D6A0' : r.percent >= 50 ? '#FFB703' : '#FF6584',
                }} />
              </div>
            </motion.div>
          ))}
        </>
      )}
    </div>
  )

  if (view === 'add-question') return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => { setView('detail'); setQForm(emptyQ()); setEditingQId(null) }}
          style={{ background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
        <h2 style={{ fontSize: 18 }}>{editingQId ? '✏️ ویرایش سوال' : '➕ سوال جدید'}</h2>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>متن سوال *</label>
        <textarea
          value={qForm.text}
          onChange={e => setQForm(f => ({ ...f, text: e.target.value }))}
          rows={3}
          placeholder="سوال را اینجا بنویسید..."
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '2px solid #e2e8f0',
            fontSize: 14, resize: 'vertical', direction: 'rtl', outline: 'none', fontFamily: 'inherit' }}
        />

        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginTop: 14, marginBottom: 6 }}>
          📷 عکس سوال (اختیاری — برای فرمول‌ها)
        </label>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => fileRef.current?.click()}
            style={{ background: '#f0eeff', color: 'var(--primary)', borderRadius: 10,
              padding: '8px 14px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            📤 آپلود عکس
          </button>
          {qForm.image_data && (
            <button onClick={() => setQForm(f => ({ ...f, image_data: null }))}
              style={{ background: '#fff0f3', color: '#FF6584', borderRadius: 10,
                padding: '8px 14px', fontSize: 13, border: 'none', cursor: 'pointer' }}>
              🗑 حذف عکس
            </button>
          )}
        </div>
        {qForm.image_data && (
          <img src={qForm.image_data} alt="سوال"
            style={{ marginTop: 10, maxWidth: '100%', maxHeight: 200, borderRadius: 10, border: '1px solid #e2e8f0' }} />
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 12 }}>گزینه‌ها *</label>
        {(['a', 'b', 'c', 'd'] as const).map(opt => {
          const key = `option_${opt}` as keyof typeof qForm
          const isCorrect = qForm.correct === opt
          return (
            <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <button
                onClick={() => setQForm(f => ({ ...f, correct: opt }))}
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  flexShrink: 0, fontWeight: 700, fontSize: 14,
                  background: isCorrect ? '#06D6A0' : '#f0f0f0',
                  color: isCorrect ? 'white' : '#888',
                  boxShadow: isCorrect ? '0 2px 8px rgba(6,214,160,0.4)' : 'none',
                }}>
                {opt.toUpperCase()}
              </button>
              <input
                value={qForm[key] as string}
                onChange={e => setQForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={`گزینه ${opt.toUpperCase()}...`}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 10, fontSize: 14,
                  border: isCorrect ? '2px solid #06D6A0' : '2px solid #e2e8f0',
                  outline: 'none', direction: 'rtl', fontFamily: 'inherit',
                  background: isCorrect ? '#f0fff9' : 'white',
                }}
              />
            </div>
          )
        })}
        <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
          روی حرف گزینه کلیک کنید تا پاسخ صحیح مشخص شود
        </div>
      </div>

      <button
        onClick={handleSaveQuestion}
        disabled={saving}
        style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'var(--primary)',
          color: 'white', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' }}>
        {saving ? '⏳ در حال ذخیره...' : editingQId ? '✏️ ذخیره تغییرات' : '✅ افزودن سوال'}
      </button>
    </div>
  )

  if (view === 'detail' && selectedExam) return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => setView('list')} style={{ background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
        <h2 style={{ fontSize: 18, flex: 1 }}>{subj?.emoji} {selectedExam.title}</h2>
        <span style={{ background: statusInfo.bg, color: statusInfo.color,
          borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
          {statusInfo.label}
        </span>
      </div>

      {/* کنترل وضعیت */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-light)' }}>🎛 وضعیت آزمون</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {selectedExam.status !== 'active' && (
            <button onClick={() => handleStatusChange('active')}
              style={{ background: '#f0fff9', color: '#06D6A0', borderRadius: 10,
                padding: '8px 14px', fontSize: 13, fontWeight: 600, border: '1.5px solid #06D6A0', cursor: 'pointer' }}>
              ▶ فعال کن
            </button>
          )}
          {selectedExam.status === 'active' && (
            <button onClick={() => handleStatusChange('closed')}
              style={{ background: '#fff0f3', color: '#FF6584', borderRadius: 10,
                padding: '8px 14px', fontSize: 13, fontWeight: 600, border: '1.5px solid #FF6584', cursor: 'pointer' }}>
              ⏹ ببند
            </button>
          )}
          {selectedExam.status === 'draft' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                style={{ padding: '8px 10px', borderRadius: 10, border: '1.5px solid #FFB703',
                  fontSize: 12, direction: 'ltr' }}
              />
              <button onClick={() => handleStatusChange('scheduled')}
                style={{ background: '#fffbf0', color: '#FFB703', borderRadius: 10,
                  padding: '8px 14px', fontSize: 13, fontWeight: 600, border: '1.5px solid #FFB703', cursor: 'pointer' }}>
                📅 زمان‌بندی
              </button>
            </div>
          )}
          <button onClick={loadResults}
            style={{ background: '#f0eeff', color: 'var(--primary)', borderRadius: 10,
              padding: '8px 14px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            📊 نتایج
          </button>
          <button onClick={handleDeleteExam}
            style={{ background: '#fff0f3', color: '#FF6584', borderRadius: 10,
              padding: '8px 14px', fontSize: 13, border: 'none', cursor: 'pointer' }}>
            🗑
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          {[
            { label: 'تعداد سوال', value: selectedExam.questions?.length ?? 0, emoji: '❓' },
            { label: 'زمان', value: selectedExam.time_limit_minutes ? `${selectedExam.time_limit_minutes} دقیقه` : 'بدون محدودیت', emoji: '⏱' },
          ].map(s => (
            <div key={s.label} style={{ background: '#f7fafc', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <span style={{ fontSize: '1.2rem' }}>{s.emoji}</span>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* لیست سوالات */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 15 }}>❓ سوالات ({selectedExam.questions?.length ?? 0})</h3>
        <button
          onClick={() => { setQForm(emptyQ()); setEditingQId(null); setView('add-question') }}
          style={{ background: 'var(--primary)', color: 'white', borderRadius: 10,
            padding: '8px 14px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          ➕ سوال جدید
        </button>
      </div>

      {(!selectedExam.questions || selectedExam.questions.length === 0) ? (
        <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-light)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>❓</div>
          هنوز سوالی اضافه نشده
        </div>
      ) : (
        selectedExam.questions.map((q: Question, i: number) => (
          <motion.div key={q.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
            className="card" style={{ marginBottom: 10, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  <span style={{ color: 'var(--primary)', marginLeft: 6 }}>سوال {i + 1}:</span>
                  {q.text.length > 80 ? q.text.slice(0, 80) + '...' : q.text}
                </div>
                {q.image_data && (
                  <img src={q.image_data} alt="" style={{ maxHeight: 60, borderRadius: 6, marginBottom: 6 }} />
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(['a', 'b', 'c', 'd'] as const).map(opt => (
                    <span key={opt} style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 6,
                      background: q.correct === opt ? '#06D6A020' : '#f0f0f0',
                      color: q.correct === opt ? '#06D6A0' : '#888',
                      fontWeight: q.correct === opt ? 700 : 400,
                      border: q.correct === opt ? '1px solid #06D6A0' : 'none',
                    }}>
                      {opt.toUpperCase()}: {(q as any)[`option_${opt}`]}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => startEditQ(q)}
                  style={{ background: '#f0eeff', color: 'var(--primary)', borderRadius: 8,
                    padding: '6px 10px', fontSize: 12, border: 'none', cursor: 'pointer' }}>✏️</button>
                <button onClick={() => handleDeleteQuestion(q.id)}
                  style={{ background: '#fff0f3', color: '#FF6584', borderRadius: 8,
                    padding: '6px 10px', fontSize: 12, border: 'none', cursor: 'pointer' }}>🗑</button>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  )

  if (view === 'create') return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => setView('list')} style={{ background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
        <h2 style={{ fontSize: 18 }}>📝 آزمون جدید</h2>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>عنوان آزمون *</label>
        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="مثلاً: آزمون فصل اول ریاضی"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10,
            border: '2px solid #e2e8f0', fontSize: 14, direction: 'rtl', outline: 'none' }}
        />

        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginTop: 14, marginBottom: 8 }}>درس</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {SUBJECTS.map(s => (
            <button key={s.id} onClick={() => setForm(f => ({ ...f, subject: s.id }))}
              style={{
                padding: '10px 6px', borderRadius: 10, border: '2px solid',
                borderColor: form.subject === s.id ? s.color : '#e2e8f0',
                background: form.subject === s.id ? s.color + '15' : 'white',
                cursor: 'pointer', textAlign: 'center',
              }}>
              <div style={{ fontSize: '1.4rem' }}>{s.emoji}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: form.subject === s.id ? s.color : '#888' }}>{s.label}</div>
            </button>
          ))}
        </div>

        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginTop: 14, marginBottom: 6 }}>⏱ زمان آزمون (دقیقه)</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[0, 15, 20, 30, 45, 60].map(t => (
            <button key={t} onClick={() => setForm(f => ({ ...f, time_limit_minutes: t }))}
              style={{
                padding: '8px 14px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                background: form.time_limit_minutes === t ? 'var(--primary)' : '#f0f0f0',
                color: form.time_limit_minutes === t ? 'white' : '#555',
                border: 'none', fontWeight: form.time_limit_minutes === t ? 700 : 400,
              }}>
              {t === 0 ? 'بدون محدودیت' : `${t} دقیقه`}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={form.shuffle_questions}
              onChange={e => setForm(f => ({ ...f, shuffle_questions: e.target.checked }))} />
            🔀 مخلوط ترتیب سوالات
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={form.shuffle_options}
              onChange={e => setForm(f => ({ ...f, shuffle_options: e.target.checked }))} />
            🔀 مخلوط گزینه‌ها
          </label>
        </div>
      </div>

      <button onClick={handleCreateExam} disabled={saving}
        style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'var(--primary)',
          color: 'white', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' }}>
        {saving ? '⏳ در حال ایجاد...' : '✅ ایجاد آزمون و افزودن سوالات'}
      </button>
    </div>
  )

  // ─── List view ────────────────────────────────────────────────────
  return (
    <div className="container">
      {toast && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: '#333', color: 'white', padding: '10px 20px', borderRadius: 12,
            fontSize: 14, zIndex: 9999, textAlign: 'center' }}>
          {toast}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => nav('/teacher')} style={{ background: 'none', color: 'var(--text-light)', fontSize: 14 }}>← برگشت</button>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>📝 آزمون‌های من</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{user.school}</div>
          </div>
        </div>
        <button onClick={() => { setForm({ title: '', subject: 'farsi', time_limit_minutes: 0, shuffle_questions: true, shuffle_options: false, class_id: null, scheduled_at: '' }); setView('create') }}
          style={{ background: 'var(--primary)', color: 'white', borderRadius: 12,
            padding: '10px 16px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          ➕ آزمون جدید
        </button>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2rem' }}>⏳</div>
        </div>
      ) : exams.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📝</div>
          <p style={{ color: 'var(--text-light)', marginBottom: 20 }}>هنوز آزمونی نساختید</p>
          <button onClick={() => setView('create')}
            style={{ background: 'var(--primary)', color: 'white', borderRadius: 12,
              padding: '12px 24px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            اولین آزمون را بسازید
          </button>
        </motion.div>
      ) : (
        exams.map((exam, i) => {
          const s = SUBJECTS.find(x => x.id === exam.subject)
          const st = STATUS_LABELS[exam.status] || STATUS_LABELS.draft
          return (
            <motion.div key={exam.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card"
              onClick={() => openExam(exam.id)}
              style={{ marginBottom: 12, padding: 16, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ fontSize: '2rem', background: '#f7fafc', borderRadius: 12,
                    width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s?.emoji}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{exam.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
                      {s?.label} · {exam.question_count} سوال · {exam.time_limit_minutes ? `${exam.time_limit_minutes} دقیقه` : 'بدون زمان'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span style={{ background: st.bg, color: st.color, borderRadius: 8,
                    padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>{st.label}</span>
                  {exam.attempt_count > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--text-light)' }}>👥 {exam.attempt_count}</span>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })
      )}
    </div>
  )
}

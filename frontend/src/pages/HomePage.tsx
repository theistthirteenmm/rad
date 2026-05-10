import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { api } from '../hooks/useApi'
import { isSubjectAvailable, hasAnyContent, getGradeLabel } from '../lib/gradeContent'

const SUBJECT_EMOJI: Record<string, string> = {
  farsi: '📖', math: '🔢', science: '🌱', quran: '📿', writing: '✏️',
}

const AVATARS = ['🦁', '🐯', '🐻', '🦊', '🐼', '🐸', '🦋', '🐬']

const SUBJECTS = [
  { id: 'farsi', label: 'فارسی', emoji: '📖', color: '#FF6584', bg: '#fff0f3', desc: 'خواندن و نوشتن' },
  { id: 'math', label: 'ریاضی', emoji: '🔢', color: '#6C63FF', bg: '#f0eeff', desc: 'اعداد و حساب' },
  { id: 'science', label: 'علوم', emoji: '🌱', color: '#06D6A0', bg: '#f0fff9', desc: 'دنیای پیرامون' },
  { id: 'quran', label: 'قرآن', emoji: '📿', color: '#FFB703', bg: '#fffbf0', desc: 'تلاوت و معنا' },
  { id: 'writing', label: 'نگارش', emoji: '✏️', color: '#4ECDC4', bg: '#f0fffe', desc: 'خط و نوشتن' },
]

type Mode = 'learn' | 'game'

export default function HomePage() {
  const nav = useNavigate()
  const student = useStore((s) => s.student)
  const logout = useStore((s) => s.logout)
  const [mode, setMode] = useState<Mode>('learn')
  const [activeExams, setActiveExams] = useState<any[]>([])

  useEffect(() => {
    api.getActiveExams()
      .then(r => setActiveExams(r.data))
      .catch(() => {})
  }, [])

  if (!student) return null

  const avatarVal = student.avatar || 'avatar0'
  const isPhoto = avatarVal.startsWith('data:')
  const avatarEmoji = !isPhoto ? (AVATARS[parseInt(avatarVal.replace('avatar', '') || '0')] || '🦁') : null
  const levelProgress = (student.stars % 50) / 50 * 100

  const handleSubject = (id: string) => {
    if (mode === 'learn') nav(`/learn?s=${id}`)
    else nav(`/${id}`)
  }

  return (
    <div className="container">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div onClick={() => nav('/character')}
            style={{ borderRadius: '50%', width: 52, height: 52, overflow: 'hidden',
              background: '#f0eeff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
              border: isPhoto ? '2px solid var(--primary)' : 'none' }}>
            {isPhoto
              ? <img src={avatarVal} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '2.5rem' }}>{avatarEmoji}</span>
            }
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>سلام {student.name.split(' ')[0]}! 👋</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>سطح {student.level} · {student.school}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => nav('/leaderboard')}
            style={{ background: '#fff8e1', color: '#FFB703', borderRadius: 12, padding: '8px 12px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            🏆
          </button>
          <button onClick={() => nav('/dashboard')}
            style={{ background: 'var(--primary)', color: 'white', borderRadius: 12, padding: '8px 14px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            📊 گزارش
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem' }}>⭐</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{student.stars}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>ستاره</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem' }}>💎</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{student.coins}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>الماس</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem' }}>🏅</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>سطح {student.level}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>مرحله</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 6 }}>
          پیشرفت به سطح بعد: {student.stars % 50}/50 ستاره
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${levelProgress}%` }} />
        </div>
      </motion.div>

      {/* آزمون‌های فعال */}
      {activeExams.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, color: '#FF6584', fontWeight: 700, marginBottom: 10 }}>
            🔔 آزمون فعال داری!
          </h2>
          {activeExams.map(exam => {
            const done = exam.attempt_status === 'submitted'
            const closed = exam.attempt_status === 'force_closed'
            return (
              <motion.button key={exam.id} whileTap={{ scale: 0.98 }}
                onClick={() => !done && !closed && nav(`/exam/${exam.id}`)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 16, marginBottom: 8,
                  background: done ? '#f0fff9' : closed ? '#fff0f3' : 'linear-gradient(135deg, #ff6584, #ff9800)',
                  border: done ? '2px solid #06D6A040' : closed ? '2px solid #FF658440' : 'none',
                  cursor: done || closed ? 'default' : 'pointer',
                  boxShadow: done || closed ? 'none' : '0 4px 16px rgba(255,101,132,0.35)',
                  color: done || closed ? 'var(--text-light)' : 'white',
                  textAlign: 'right',
                }}>
                <div style={{ fontSize: '2rem', flexShrink: 0 }}>{SUBJECT_EMOJI[exam.subject] || '📝'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{exam.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>
                    {done ? '✅ انجام داده‌ای' : closed ? '🚫 بسته شده' :
                      exam.time_limit_minutes ? `⏱ ${exam.time_limit_minutes} دقیقه` : '⏱ بدون محدودیت زمانی'}
                  </div>
                </div>
                {!done && !closed && <div style={{ fontSize: 22 }}>←</div>}
              </motion.button>
            )
          })}
        </motion.div>
      )}

      {/* Mode Toggle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setMode('learn')}
          style={{ padding: '14px 8px', borderRadius: 18, cursor: 'pointer', textAlign: 'center',
            background: mode === 'learn' ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#f7fafc',
            border: mode === 'learn' ? 'none' : '2px solid #e2e8f0',
            color: mode === 'learn' ? 'white' : 'var(--text-light)',
            boxShadow: mode === 'learn' ? '0 4px 15px rgba(102,126,234,0.4)' : 'none',
            transition: 'all 0.25s' }}>
          <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>📚</div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>یادگیری</div>
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setMode('game')}
          style={{ padding: '14px 8px', borderRadius: 18, cursor: 'pointer', textAlign: 'center',
            background: mode === 'game' ? 'linear-gradient(135deg,#f093fb,#f5576c)' : '#f7fafc',
            border: mode === 'game' ? 'none' : '2px solid #e2e8f0',
            color: mode === 'game' ? 'white' : 'var(--text-light)',
            boxShadow: mode === 'game' ? '0 4px 15px rgba(245,87,108,0.4)' : 'none',
            transition: 'all 0.25s' }}>
          <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>🎮</div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>بازی</div>
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => nav('/battle')}
          style={{ padding: '14px 8px', borderRadius: 18, cursor: 'pointer', textAlign: 'center',
            background: 'linear-gradient(135deg,#FF6584,#FF9800)',
            border: 'none', color: 'white',
            boxShadow: '0 4px 15px rgba(255,101,132,0.4)',
            transition: 'all 0.25s' }}>
          <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>⚔️</div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>رقابت</div>
        </motion.button>
      </div>

      {/* Mode description */}
      <motion.div key={mode} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 10 }}>
          {mode === 'learn' ? '📖 انتخاب موضوع یادگیری:' : '🕹️ انتخاب درس بازی:'}
        </h2>

        {!hasAnyContent(student.grade) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: '#fffbf0', border: '2px dashed #FFB703', borderRadius: 16,
              padding: '16px 20px', textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🚧</div>
            <div style={{ fontWeight: 700, color: '#FFB703', fontSize: 14 }}>
              محتوای {getGradeLabel(student.grade)} در حال آماده‌سازی
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
              بزودی برای پایه شما محتوا اضافه می‌شود
            </div>
          </motion.div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {SUBJECTS.map((subj, i) => {
            const available = isSubjectAvailable(student.grade, subj.id, mode === 'learn' ? 'learn' : 'games')
            return (
              <motion.button
                key={subj.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                whileTap={available ? { scale: 0.95 } : {}}
                onClick={() => available && handleSubject(subj.id)}
                style={{
                  background: available ? subj.bg : '#f5f5f5',
                  borderRadius: 20, padding: '20px 16px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 8,
                  border: available ? `2px solid ${subj.color}22` : '2px dashed #ddd',
                  cursor: available ? 'pointer' : 'default',
                  gridColumn: i === 4 ? 'span 2' : 'span 1',
                  position: 'relative', overflow: 'hidden',
                  opacity: available ? 1 : 0.75,
                }}>
                <div style={{ fontSize: '2.5rem', filter: available ? 'none' : 'grayscale(80%)' }}>
                  {subj.emoji}
                </div>
                <div style={{ fontWeight: 700, color: available ? subj.color : '#bbb', fontSize: 16 }}>
                  {subj.label}
                </div>
                {available ? (
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
                    {mode === 'learn' ? subj.desc : '🎮 ' + subj.desc}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: '#bbb', fontWeight: 600, textAlign: 'center' }}>
                    🚧 در حال آماده‌سازی
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      <button onClick={logout}
        style={{ marginTop: 8, width: '100%', padding: '10px', background: 'none',
          color: 'var(--text-light)', fontSize: 13, borderRadius: 12, border: '1px solid #e2e8f0' }}>
        🚪 خروج از حساب
      </button>
    </div>
  )
}

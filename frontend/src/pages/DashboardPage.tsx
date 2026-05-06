import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../hooks/useApi'
import { useStore } from '../store/useStore'

const SUBJECT_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  farsi: { label: 'فارسی', emoji: '📖', color: '#FF6584' },
  riazi: { label: 'ریاضی', emoji: '🔢', color: '#6C63FF' },
  olum: { label: 'علوم', emoji: '🌱', color: '#06D6A0' },
  ghoran: { label: 'قرآن', emoji: '📿', color: '#FFB703' },
  negaresh: { label: 'نگارش', emoji: '✏️', color: '#4ECDC4' },
}

const AVATARS = ['🦁', '🐯', '🐻', '🦊', '🐼', '🐸', '🦋', '🐬']

export default function DashboardPage() {
  const nav = useNavigate()
  const student = useStore(s => s.student)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!student) return
    api.getDashboard(parseInt(student.id))
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [student])

  if (!student) return null

  const avatar = AVATARS[parseInt(student.avatar?.replace('avatar', '') || '0')] || '🦁'

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => nav('/')} style={{ background: 'none', fontSize: 20 }}>←</button>
        <h1 style={{ fontSize: 20, color: 'var(--primary)' }}>📊 گزارش پیشرفت</h1>
      </div>

      {/* Student card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="card" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', color: 'white', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: '3rem', background: 'rgba(255,255,255,0.2)', borderRadius: '50%',
            width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {avatar}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{student.name}</div>
            <div style={{ opacity: 0.85, fontSize: 13 }}>{student.school} · کلاس {student.class_name}</div>
            <div style={{ opacity: 0.85, fontSize: 13 }}>معلم: {student.teacher_name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 16,
          background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{student.stars}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>⭐ ستاره</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{student.coins}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>🪙 سکه</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{student.level}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>🏅 سطح</div>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="animate-bounce" style={{ fontSize: '2rem' }}>⏳</div>
        </div>
      ) : data ? (
        <>
          {/* Weekly stats */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 12, fontSize: 15 }}>📅 این هفته</h3>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, textAlign: 'center', background: '#f0eeff', borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>{data.weekly_stats.sessions}</div>
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>بازی انجام شد</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', background: '#fffbf0', borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#FFB703' }}>{data.weekly_stats.stars}</div>
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>ستاره گرفته شد</div>
              </div>
            </div>
          </div>

          {/* Subject progress */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 12, fontSize: 15 }}>📚 پیشرفت در هر درس</h3>
            {data.subject_progress.map((p: any, i: number) => {
              const subj = SUBJECT_LABELS[p.subject] || { label: p.subject, emoji: '📘', color: '#6C63FF' }
              const maxStars = Math.max(...data.subject_progress.map((x: any) => x.total_stars), 1)
              return (
                <div key={p.subject} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{subj.emoji} {subj.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-light)' }}>⭐{p.total_stars} · {p.total_sessions} بازی</span>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.total_stars / maxStars) * 100}%` }}
                      transition={{ delay: i * 0.1, duration: 0.6 }}
                      style={{ height: '100%', borderRadius: 10, background: `linear-gradient(90deg, ${subj.color}, ${subj.color}99)` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Recent sessions */}
          {data.recent_sessions.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: 12, fontSize: 15 }}>🕐 آخرین بازی‌ها</h3>
              {data.recent_sessions.slice(0, 5).map((s: any, i: number) => {
                const subj = SUBJECT_LABELS[s.subject] || { label: s.subject, emoji: '📘', color: '#6C63FF' }
                return (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '10px 0',
                    borderBottom: i < 4 ? '1px solid #f0f0f0' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{subj.emoji} {subj.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{s.game_type}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, color: '#FFB703' }}>{'⭐'.repeat(s.stars_earned)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{s.score} امتیاز</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-light)' }}>هنوز بازی انجام نداده‌ای! برو بازی کن 🎮</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => nav('/')}>
            🎮 بریم بازی!
          </button>
        </div>
      )}
    </div>
  )
}

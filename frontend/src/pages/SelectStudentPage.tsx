import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../hooks/useApi'
import { useStore } from '../store/useStore'

const AVATARS = ['🦁', '🐯', '🐻', '🦊', '🐼', '🐸', '🦋', '🐬']

export default function SelectStudentPage() {
  const nav = useNavigate()
  const setUser = useStore((s) => s.setUser)
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.listStudents()
      .then(r => setStudents(r.data))
      .catch(() => {
        const local = JSON.parse(localStorage.getItem('radin_students') || '[]')
        setStudents(local)
      })
      .finally(() => setLoading(false))
  }, [])

  const select = (s: any) => {
    setUser(s)
    nav('/')
  }

  return (
    <div className="container" style={{ paddingTop: 40 }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '3.5rem' }}>🎓</div>
          <h1 style={{ fontSize: 24, color: 'var(--primary)', marginTop: 12 }}>رادین</h1>
          <p style={{ color: 'var(--text-light)', marginTop: 4 }}>بازی آموزشی کلاس اول</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: '2rem' }} className="animate-bounce">⏳</div>
            <p style={{ color: 'var(--text-light)', marginTop: 12 }}>در حال بارگذاری...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>👋</div>
            <h2 style={{ marginBottom: 8 }}>خوش آمدی!</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: 20 }}>
              برای شروع، اطلاعاتت رو وارد کن
            </p>
            <button className="btn btn-primary" onClick={() => nav('/register')}>
              🎮 شروع کن!
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ marginBottom: 16, fontSize: 16, color: 'var(--text-light)' }}>انتخاب دانش‌آموز:</h2>
            {students.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card"
                onClick={() => select(s)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, padding: 16 }}
              >
                <div style={{ fontSize: '2.5rem' }}>
                  {AVATARS[parseInt(s.avatar?.replace('avatar', '') || '0')] || '🦁'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{s.name}</div>
                  <div style={{ color: 'var(--text-light)', fontSize: 13 }}>
                    {s.school} · کلاس {s.class_name}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 13 }}>
                    <span>⭐ {s.stars}</span>
                    <span>💎 {s.coins}</span>
                    <span>🏅 سطح {s.level}</span>
                  </div>
                </div>
              </motion.div>
            ))}
            <button className="btn btn-primary" onClick={() => nav('/register')} style={{ marginTop: 8 }}>
              + دانش‌آموز جدید
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}

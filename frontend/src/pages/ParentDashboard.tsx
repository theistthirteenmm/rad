import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { findChildOf, type User } from '../lib/auth'

const AVATARS = ['🦁', '🐯', '🐻', '🦊', '🐼', '🐸', '🦋', '🐬']

function avatar(u: User) {
  return AVATARS[parseInt(u.avatar?.replace('avatar', '') || '0')] || '🦁'
}

const SUBJECTS = [
  { id: 'farsi', label: 'فارسی', emoji: '📖', color: '#FF6584' },
  { id: 'math', label: 'ریاضی', emoji: '🔢', color: '#6C63FF' },
  { id: 'science', label: 'علوم', emoji: '🌱', color: '#06D6A0' },
  { id: 'quran', label: 'قرآن', emoji: '📿', color: '#FFB703' },
  { id: 'writing', label: 'نگارش', emoji: '✏️', color: '#4ECDC4' },
]

export default function ParentDashboard() {
  const nav = useNavigate()
  const user = useStore(s => s.user)
  const logout = useStore(s => s.logout)
  const [child, setChild] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'parent') return
    findChildOf(user).then(c => { setChild(c); setLoading(false) })
  }, [user])

  if (!user || user.role !== 'parent') { nav('/login'); return null }

  const levelProgress = child ? (child.stars % 50) / 50 * 100 : 0

  return (
    <div className="container">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>سلام {user.name.split(' ')[0]} 👪</div>
          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>پنل اولیا</div>
        </div>
        <button onClick={() => { logout(); nav('/login') }}
          style={{ background: '#fff0f3', color: '#FF6584', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600 }}>
          خروج
        </button>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>⏳ در حال بارگذاری...</div>
      ) : !child ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔍</div>
          <h2 style={{ marginBottom: 12 }}>فرزند یافت نشد</h2>
          <p style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 8 }}>
            فرزند شما (<strong>{user.child_name}</strong>) هنوز در اپ ثبت‌نام نکرده
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-light)' }}>
            از فرزندتان بخواهید با نقش «دانش‌آموز» در مدرسه{' '}
            <strong>{user.school}</strong> ثبت‌نام کند
          </p>
        </motion.div>
      ) : (
        <>
          {/* Child Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="card" style={{ marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: 8 }}>{avatar(child)}</div>
            <h2 style={{ fontSize: 20, marginBottom: 4 }}>{child.name}</h2>
            <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 12 }}>
              {child.school} · کلاس {child.class_name} · معلم: {child.teacher_name}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 14 }}>
              {[
                { label: 'ستاره', value: child.stars, emoji: '⭐' },
                { label: 'سکه', value: child.coins, emoji: '🪙' },
                { label: 'سطح', value: child.level, emoji: '🏅' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem' }}>{s.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 20 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 6 }}>
              پیشرفت به سطح {child.level + 1}: {child.stars % 50}/50 ستاره
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${levelProgress}%` }} />
            </div>
          </motion.div>

          {/* Subjects Overview */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 14, color: 'var(--text-light)' }}>📚 دروس</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {SUBJECTS.map(subj => (
                <div key={subj.id} style={{
                  padding: '12px 14px', borderRadius: 12,
                  background: subj.color + '12', border: `1px solid ${subj.color}22`,
                  display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{subj.emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: subj.color }}>{subj.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Encouragement */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="card" style={{ background: 'linear-gradient(135deg, #6C63FF15, #FF658415)', border: '1px solid #6C63FF22' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>💡</div>
            <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.8 }}>
              {child.level >= 3
                ? `${child.name.split(' ')[0]} عالی داره پیش می‌ره! سطح ${child.level} رسیده 🎉`
                : child.stars > 0
                ? `${child.name.split(' ')[0]} شروع خوبی داشته، ${child.stars} ستاره جمع کرده ⭐`
                : `با ${child.name.split(' ')[0]} بشین و اولین بازی رو با هم شروع کنید! 🎮`
              }
            </p>
          </motion.div>
        </>
      )}
    </div>
  )
}

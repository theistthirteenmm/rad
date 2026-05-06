import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { getAllStudents, type User } from '../lib/auth'

const AVATARS = ['🦁', '🐯', '🐻', '🦊', '🐼', '🐸', '🦋', '🐬']

function avatar(u: User) {
  return AVATARS[parseInt(u.avatar?.replace('avatar', '') || '0')] || '🦁'
}

function LevelBadge({ level }: { level: number }) {
  const colors = ['#6C63FF', '#06D6A0', '#FF9800', '#FF6584', '#9C27B0']
  return (
    <span style={{
      background: colors[(level - 1) % colors.length] + '22',
      color: colors[(level - 1) % colors.length],
      borderRadius: 8, padding: '2px 8px', fontSize: 12, fontWeight: 700
    }}>
      سطح {level}
    </span>
  )
}

export default function TeacherDashboard() {
  const nav = useNavigate()
  const user = useStore(s => s.user)
  const logout = useStore(s => s.logout)
  const [selected, setSelected] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [allStudents, setAllStudents] = useState<User[]>([])
  useEffect(() => { getAllStudents().then(setAllStudents) }, [])

  if (!user || user.role !== 'teacher') { nav('/login'); return null }

  const myStudents = allStudents.filter(s =>
    s.school === user.school &&
    (search === '' || s.name.includes(search) || s.class_name.includes(search))
  )

  const totalStars = myStudents.reduce((a, s) => a + s.stars, 0)
  const avgLevel = myStudents.length > 0
    ? (myStudents.reduce((a, s) => a + s.level, 0) / myStudents.length).toFixed(1)
    : '—'

  if (selected) {
    return (
      <div className="container">
        <button onClick={() => setSelected(null)}
          style={{ background: 'none', color: 'var(--text-light)', fontSize: 14, marginBottom: 16 }}>
          ← برگشت به لیست
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: '4rem', marginBottom: 8 }}>{avatar(selected)}</div>
            <h2 style={{ fontSize: 20, marginBottom: 4 }}>{selected.name}</h2>
            <div style={{ color: 'var(--text-light)', fontSize: 13, marginBottom: 12 }}>
              {selected.school} · کلاس {selected.class_name} · معلم: {selected.teacher_name}
            </div>
            <LevelBadge level={selected.level} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'ستاره', value: selected.stars, emoji: '⭐' },
              { label: 'الماس', value: selected.coins, emoji: '💎' },
              { label: 'سطح', value: selected.level, emoji: '🏅' },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: 16 }}>
                <div style={{ fontSize: '1.8rem' }}>{s.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 22, marginTop: 4 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 8 }}>پیشرفت به سطح بعد:</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(selected.stars % 50) / 50 * 100}%` }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 6 }}>
              {selected.stars % 50}/50 ستاره
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>سلام {user.name.split(' ')[0]} 👩‍🏫</div>
          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{user.school}</div>
        </div>
        <button onClick={() => { logout(); nav('/login') }}
          style={{ background: '#fff0f3', color: '#FF6584', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600 }}>
          خروج
        </button>
      </motion.div>

      {/* Class Stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 12, color: '#06D6A0' }}>📊 آمار کلاس</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { label: 'دانش‌آموز', value: myStudents.length, emoji: '🎒' },
            { label: 'کل ستاره', value: totalStars, emoji: '⭐' },
            { label: 'میانگین سطح', value: avgLevel, emoji: '🏅' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem' }}>{s.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="🔍 جستجو در دانش‌آموزان..."
        style={{
          width: '100%', padding: '12px 16px', borderRadius: 12,
          border: '2px solid #e2e8f0', fontSize: 14, outline: 'none',
          marginBottom: 16, direction: 'rtl'
        }}
        onFocus={e => e.target.style.borderColor = '#06D6A0'}
        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
      />

      {/* Students List */}
      <h3 style={{ fontSize: 15, color: 'var(--text-light)', marginBottom: 12 }}>
        لیست دانش‌آموزان ({myStudents.length})
      </h3>

      {myStudents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎒</div>
          <p style={{ color: 'var(--text-light)' }}>
            {search ? 'دانش‌آموزی با این مشخصات یافت نشد' : 'هنوز هیچ دانش‌آموزی ثبت‌نام نکرده'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 8 }}>
            دانش‌آموزان باید با نام مدرسه <strong>{user.school}</strong> ثبت‌نام کنند
          </p>
        </div>
      ) : (
        myStudents
          .sort((a, b) => b.stars - a.stars)
          .map((s, i) => (
            <motion.div key={s.id}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="card"
              onClick={() => setSelected(s)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, padding: 14 }}>
              <div style={{ fontSize: '2rem', width: 44, height: 44, borderRadius: 12,
                background: '#f0eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {i < 3 ? ['🥇', '🥈', '🥉'][i] : avatar(s)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>کلاس {s.class_name}</div>
              </div>
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <LevelBadge level={s.level} />
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>⭐ {s.stars}</div>
              </div>
            </motion.div>
          ))
      )}
    </div>
  )
}

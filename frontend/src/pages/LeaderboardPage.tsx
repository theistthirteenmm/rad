import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { api } from '../lib/apiClient'
import type { User } from '../lib/auth'

const AVATARS = ['🦁', '🐯', '🐻', '🦊', '🐼', '🐸', '🦋', '🐬']
const MEDALS = ['🥇', '🥈', '🥉']

function av(u: User) {
  return AVATARS[parseInt(u.avatar?.replace('avatar', '') || '0')] || '🦁'
}

export default function LeaderboardPage() {
  const nav = useNavigate()
  const user = useStore(s => s.user)
  const [students, setStudents] = useState<User[]>([])
  const [myRank, setMyRank] = useState<{ rank: number; total: number; stars: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'school' | 'grade' | 'class'>('school')

  useEffect(() => {
    if (!user?.school_id) return

    const params: Record<string, string> = {}
    if (filter === 'grade' && user.grade_id) params.grade_id = user.grade_id
    if (filter === 'class' && user.class_id) params.class_id = user.class_id

    const qs = new URLSearchParams(params).toString()
    Promise.all([
      api.get(`/leaderboard/school/${user.school_id}?limit=20&${qs}`),
      user.role === 'student' ? api.get('/leaderboard/me') : Promise.resolve({ data: null }),
    ])
      .then(([lb, rank]) => {
        setStudents(lb.data)
        if (rank.data) setMyRank(rank.data)
      })
      .finally(() => setLoading(false))
  }, [user, filter])

  if (!user) { nav('/login'); return null }

  const filterLabel: Record<string, string> = {
    school: `مدرسه ${user.school}`,
    grade: `پایه ${user.grade}`,
    class: `کلاس ${user.grade} ${user.class_name}`,
  }

  return (
    <div className="container">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => nav(-1 as any)}
          style={{ background: 'none', fontSize: 20, color: 'var(--text-light)', border: 'none', cursor: 'pointer' }}>
          ←
        </button>
        <div>
          <h1 style={{ fontSize: 20, color: 'var(--primary)' }}>🏆 تابلوی افتخار</h1>
          <p style={{ fontSize: 12, color: 'var(--text-light)' }}>{filterLabel[filter]}</p>
        </div>
      </motion.div>

      {/* My Rank badge (student only) */}
      {myRank && myRank.rank && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="card" style={{ marginBottom: 16, background: 'linear-gradient(135deg,#6C63FF18,#FF658418)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-light)' }}>رتبه من</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>#{myRank.rank}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>از {myRank.total} دانش‌آموز</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem' }}>{myRank.rank <= 3 ? MEDALS[myRank.rank - 1] : '⭐'}</div>
            <div style={{ fontWeight: 700, color: '#FFB703' }}>{myRank.stars} ستاره</div>
          </div>
        </motion.div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { id: 'school', label: '🏫 مدرسه' },
          { id: 'grade',  label: '📚 پایه',  disabled: !user.grade_id },
          { id: 'class',  label: '🚪 کلاس',  disabled: !user.class_id },
        ].map(t => (
          <button key={t.id} onClick={() => !t.disabled && setFilter(t.id as any)}
            disabled={t.disabled}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              cursor: t.disabled ? 'not-allowed' : 'pointer',
              border: `2px solid ${filter === t.id ? 'var(--primary)' : '#e2e8f0'}`,
              background: filter === t.id ? '#f0eeff' : 'white',
              color: filter === t.id ? 'var(--primary)' : 'var(--text-light)',
              opacity: t.disabled ? 0.4 : 1,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>⏳ در حال بارگذاری...</div>
      ) : students.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎒</div>
          <p style={{ color: 'var(--text-light)' }}>هنوز دانش‌آموزی ثبت‌نام نکرده</p>
        </div>
      ) : (
        students.map((s, i) => {
          const isMe = s.id === user.id
          return (
            <motion.div key={s.id}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card"
              style={{
                marginBottom: 8, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
                background: isMe ? 'linear-gradient(135deg,#6C63FF12,#FF658412)' : undefined,
                border: isMe ? '2px solid var(--primary)' : undefined,
              }}>
              {/* Rank */}
              <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                {i < 3
                  ? <span style={{ fontSize: '1.5rem' }}>{MEDALS[i]}</span>
                  : <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-light)' }}>#{i + 1}</span>
                }
              </div>

              {/* Avatar */}
              <div style={{ fontSize: '1.8rem', width: 40, height: 40, borderRadius: 12,
                background: '#f0eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {av(s)}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {s.name} {isMe && <span style={{ fontSize: 11, color: 'var(--primary)' }}>(من)</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
                  {s.grade && `پایه ${s.grade}`}{s.class_name && ` · کلاس ${s.class_name}`}
                </div>
              </div>

              {/* Score */}
              <div style={{ textAlign: 'left', flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#FFB703' }}>⭐ {s.stars}</div>
                <div style={{ fontSize: 11, color: 'var(--text-light)' }}>سطح {s.level}</div>
              </div>
            </motion.div>
          )
        })
      )}
    </div>
  )
}

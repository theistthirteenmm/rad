import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { api } from '../lib/apiClient'
import type { User } from '../lib/auth'

const AVATARS = ['🦁', '🐯', '🐻', '🦊', '🐼', '🐸', '🦋', '🐬']
const MEDALS = ['🥇', '🥈', '🥉']

const LEAGUE_META = {
  gold:   { label: 'لیگ طلایی',  emoji: '🏅', color: '#FFB703', bg: '#fff8e1', border: '#FFB70340' },
  silver: { label: 'لیگ نقره‌ای', emoji: '🥈', color: '#9E9E9E', bg: '#f5f5f5', border: '#9E9E9E40' },
  bronze: { label: 'لیگ برنزی',  emoji: '🥉', color: '#CD7F32', bg: '#fdf3e7', border: '#CD7F3240' },
}

type Scope = 'school' | 'grade' | 'class'
type League = 'gold' | 'silver' | 'bronze'

interface RankedUser extends User {
  rank: number
  league: League
}

interface LeagueData {
  school: RankedUser[]
  grade: RankedUser[]
  class: RankedUser[]
  me: {
    school_rank: number | null
    school_total: number
    school_league: League
    grade_rank: number | null
    grade_total: number
    grade_league: League
    class_rank: number | null
    class_total: number
    class_league: League
  }
}

function av(u: User) {
  return AVATARS[parseInt(u.avatar?.replace('avatar', '') || '0')] || '🦁'
}

function Podium({ top3, myId, color }: { top3: RankedUser[]; myId: string; color: string }) {
  const order = [top3[1], top3[0], top3[2]].filter(Boolean)
  const heights = [80, 110, 60]
  const sizes = ['1.8rem', '2.4rem', '1.6rem']

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, margin: '20px 0 8px' }}>
      {order.map((u, i) => {
        if (!u) return <div key={i} style={{ width: 90 }} />
        const isMe = u.id === myId
        const podiumIdx = i
        const rank = u.rank
        const meta = LEAGUE_META['gold']
        return (
          <motion.div key={u.id}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 90 }}>
            {rank <= 3 && <span style={{ fontSize: '1.4rem', marginBottom: 4 }}>{MEDALS[rank - 1]}</span>}
            <div style={{ fontSize: sizes[podiumIdx], background: isMe ? color + '25' : '#f7fafc',
              borderRadius: '50%', width: 52, height: 52, display: 'flex', alignItems: 'center',
              justifyContent: 'center', border: isMe ? `2px solid ${color}` : '2px solid #e2e8f0',
              marginBottom: 4 }}>
              {av(u)}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', color: isMe ? color : 'var(--text)',
              maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {u.name.split(' ')[0]}
            </div>
            <div style={{ fontSize: 11, color: '#FFB703', fontWeight: 600 }}>⭐{u.stars}</div>
            <div style={{
              width: '100%', height: heights[podiumIdx],
              background: podiumIdx === 1 ? `linear-gradient(180deg, ${meta.color}60, ${meta.color}30)`
                : podiumIdx === 0 ? `linear-gradient(180deg, #9E9E9E50, #9E9E9E25)`
                : `linear-gradient(180deg, #CD7F3250, #CD7F3225)`,
              borderRadius: '10px 10px 0 0', marginTop: 6,
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 6,
              fontSize: 16, fontWeight: 900,
              color: podiumIdx === 1 ? meta.color : podiumIdx === 0 ? '#9E9E9E' : '#CD7F32',
              border: `1px solid ${podiumIdx === 1 ? meta.color + '40' : podiumIdx === 0 ? '#9E9E9E30' : '#CD7F3230'}`,
            }}>
              {rank}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function MyLeagueBadge({ scope, data, user }: { scope: Scope; data: LeagueData; user: User }) {
  const rank = data.me[`${scope}_rank`]
  const total = data.me[`${scope}_total`]
  const league = data.me[`${scope}_league`] as League
  const meta = LEAGUE_META[league]

  if (!rank) return null

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      style={{
        background: meta.bg, border: `2px solid ${meta.border}`,
        borderRadius: 16, padding: '14px 20px', marginBottom: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 2 }}>رتبه من</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: meta.color }}>#{rank}</div>
        <div style={{ fontSize: 12, color: 'var(--text-light)' }}>از {total} دانش‌آموز</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.2rem' }}>{meta.emoji}</div>
        <div style={{ fontWeight: 700, fontSize: 13, color: meta.color }}>{meta.label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{user.stars} ستاره</div>
      </div>
    </motion.div>
  )
}

function LeagueSection({ title, users, myId, color }: {
  title: string; users: RankedUser[]; myId: string; color: string
}) {
  const [expanded, setExpanded] = useState(false)
  if (users.length === 0) return null
  const visible = expanded ? users : users.slice(0, 5)

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)', whiteSpace: 'nowrap' }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
      </div>
      {visible.map((u, i) => {
        const isMe = u.id === myId
        return (
          <motion.div key={u.id}
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              borderRadius: 14, marginBottom: 6,
              background: isMe ? color + '10' : 'white',
              border: isMe ? `2px solid ${color}60` : '2px solid #f0f0f0',
            }}>
            <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
              {u.rank <= 3
                ? <span style={{ fontSize: '1.3rem' }}>{MEDALS[u.rank - 1]}</span>
                : <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)' }}>#{u.rank}</span>
              }
            </div>
            <div style={{ fontSize: '1.6rem', width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: '#f0eeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {av(u)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.name} {isMe && <span style={{ fontSize: 10, color }}>(من)</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
                {u.grade && `پایه ${u.grade}`}{u.class_name && ` · ${u.class_name}`}
              </div>
            </div>
            <div style={{ textAlign: 'left', flexShrink: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#FFB703' }}>⭐{u.stars}</div>
              <div style={{ fontSize: 10, color: 'var(--text-light)' }}>سطح {u.level}</div>
            </div>
          </motion.div>
        )
      })}
      {users.length > 5 && (
        <button onClick={() => setExpanded(e => !e)}
          style={{ width: '100%', padding: '8px', background: 'none', border: '1px dashed #e2e8f0',
            borderRadius: 10, fontSize: 13, color: 'var(--text-light)', cursor: 'pointer' }}>
          {expanded ? '▲ کمتر' : `▼ ${users.length - 5} نفر دیگر`}
        </button>
      )}
    </div>
  )
}

const SCOPE_COLORS: Record<Scope, string> = {
  school: '#6C63FF',
  grade: '#06D6A0',
  class: '#FF9800',
}

export default function LeaderboardPage() {
  const nav = useNavigate()
  const user = useStore(s => s.user)
  const [data, setData] = useState<LeagueData | null>(null)
  const [scope, setScope] = useState<Scope>('school')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.school_id) return
    setLoading(true)
    api.get(`/leaderboard/leagues/${user.school_id}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [user?.school_id])

  if (!user) { nav('/login'); return null }

  const color = SCOPE_COLORS[scope]
  const list: RankedUser[] = data?.[scope] ?? []
  const top3 = list.filter(u => u.rank <= 3)
  const rest = list.filter(u => u.rank > 3)

  const gold = rest.filter(u => u.league === 'gold')
  const silver = rest.filter(u => u.league === 'silver')
  const bronze = rest.filter(u => u.league === 'bronze')

  const scopeLabels: Record<Scope, string> = {
    school: `مدرسه ${user.school}`,
    grade: `پایه ${user.grade}`,
    class: `کلاس ${user.class_name}`,
  }

  return (
    <div className="container" style={{ paddingBottom: 32 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => nav(-1 as any)}
          style={{ background: 'none', fontSize: 20, border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
          ←
        </button>
        <div>
          <h1 style={{ fontSize: 20, color }}>🏆 لیگ برترین‌ها</h1>
          <p style={{ fontSize: 12, color: 'var(--text-light)' }}>{scopeLabels[scope]}</p>
        </div>
      </motion.div>

      {/* Scope tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {([
          { id: 'school', label: '🏫 مدرسه', disabled: false },
          { id: 'grade',  label: '📚 پایه',  disabled: !user.grade_id },
          { id: 'class',  label: '🚪 کلاس',  disabled: !user.class_id },
        ] as { id: Scope; label: string; disabled: boolean }[]).map(t => (
          <button key={t.id} onClick={() => !t.disabled && setScope(t.id)}
            disabled={t.disabled}
            style={{
              flex: 1, padding: '10px 4px', borderRadius: 12, fontSize: 13, fontWeight: 700,
              cursor: t.disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              border: `2px solid ${scope === t.id ? SCOPE_COLORS[t.id] : '#e2e8f0'}`,
              background: scope === t.id ? SCOPE_COLORS[t.id] + '15' : 'white',
              color: scope === t.id ? SCOPE_COLORS[t.id] : 'var(--text-light)',
              opacity: t.disabled ? 0.4 : 1,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{ fontSize: '2rem', display: 'inline-block' }}>⏳</motion.div>
        </div>
      ) : list.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎒</div>
          <p style={{ color: 'var(--text-light)' }}>هنوز دانش‌آموزی در این سطح ثبت‌نام نکرده</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={scope}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}>

            {/* My badge */}
            {data && user.role === 'student' && (
              <MyLeagueBadge scope={scope} data={data} user={user as any} />
            )}

            {/* Podium */}
            {top3.length >= 2 && (
              <div className="card" style={{ marginBottom: 16, padding: '16px 8px 0' }}>
                <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-light)', marginBottom: 4 }}>
                  🏆 سکوی افتخار
                </div>
                <Podium top3={top3} myId={user.id} color={color} />
              </div>
            )}

            {/* League sections */}
            {gold.length > 0 && (
              <LeagueSection
                title={`${LEAGUE_META.gold.emoji} ${LEAGUE_META.gold.label}`}
                users={gold} myId={user.id} color={LEAGUE_META.gold.color} />
            )}
            {silver.length > 0 && (
              <LeagueSection
                title={`${LEAGUE_META.silver.emoji} ${LEAGUE_META.silver.label}`}
                users={silver} myId={user.id} color={LEAGUE_META.silver.color} />
            )}
            {bronze.length > 0 && (
              <LeagueSection
                title={`${LEAGUE_META.bronze.emoji} ${LEAGUE_META.bronze.label}`}
                users={bronze} myId={user.id} color={LEAGUE_META.bronze.color} />
            )}

          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

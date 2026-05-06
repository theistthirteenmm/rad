import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { getAll, deleteUser, updateUser } from '../lib/auth'

const ROLE_FA: Record<string, string> = {
  student: '🎒 دانش‌آموز',
  teacher: '👩‍🏫 معلم',
  parent: '👪 اولیا',
  admin: '🔑 مدیر',
}
const ROLE_COLOR: Record<string, string> = {
  student: '#6C63FF', teacher: '#06D6A0', parent: '#FFB703', admin: '#FF6584',
}

interface EditState { id: string; name: string; stars: number; coins: number; level: number }

export default function SuperAdminPage() {
  const nav = useNavigate()
  const user = useStore(s => s.user)
  const logout = useStore(s => s.logout)

  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [schoolFilter, setSchoolFilter] = useState<string>('all')
  const [editUser, setEditUser] = useState<EditState | null>(null)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  if (!user || user.username !== 'hamed') {
    nav('/login')
    return null
  }

  const flash = (text: string, ok = true) => {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 3000)
  }

  const load = async () => {
    setLoading(true)
    const all = await getAll()
    setUsers(all.filter(u => u.username !== 'hamed'))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const schools = useMemo(() => [...new Set(users.map(u => u.school).filter(Boolean))].sort(), [users])

  const filtered = useMemo(() => users.filter(u => {
    const matchSearch = !search || u.name?.includes(search) || u.username?.includes(search) || u.school?.includes(search)
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchSchool = schoolFilter === 'all' || u.school === schoolFilter
    return matchSearch && matchRole && matchSchool
  }), [users, search, roleFilter, schoolFilter])

  const stats = useMemo(() => ({
    total: users.length,
    students: users.filter(u => u.role === 'student').length,
    teachers: users.filter(u => u.role === 'teacher').length,
    schools: schools.length,
  }), [users, schools])

  const handleDelete = async (u: any) => {
    if (!confirm(`حذف «${u.name}» (@${u.username})؟\nاین عمل برگشت‌پذیر نیست.`)) return
    setDeleting(u.id)
    const ok = await deleteUser(u.id)
    setDeleting(null)
    if (ok) { flash(`«${u.name}» حذف شد`); setUsers(prev => prev.filter(x => x.id !== u.id)) }
    else flash('خطا در حذف', false)
  }

  const handleEdit = async () => {
    if (!editUser) return
    await updateUser(editUser.id, { stars: editUser.stars, coins: editUser.coins, level: editUser.level })
    setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...editUser } : u))
    flash('ذخیره شد ✓')
    setEditUser(null)
  }

  return (
    <div className="container" style={{ maxWidth: 600 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#FF6584' }}>🔐 پنل مدیر کل</div>
          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>@hamed · دسترسی کامل</div>
        </div>
        <button onClick={() => { logout(); nav('/login') }}
          style={{ background: '#fff0f3', color: '#FF6584', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          🚪 خروج
        </button>
      </motion.div>

      {/* Flash message */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ borderRadius: 12, padding: '10px 16px', marginBottom: 12, fontSize: 13, fontWeight: 600,
              background: msg.ok ? '#f0fff9' : '#fff0f3', color: msg.ok ? '#06D6A0' : '#FF6584' }}>
            {msg.ok ? '✅' : '⚠️'} {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'کل کاربران', value: stats.total, emoji: '👥', color: '#6C63FF' },
          { label: 'دانش‌آموز', value: stats.students, emoji: '🎒', color: '#6C63FF' },
          { label: 'معلم', value: stats.teachers, emoji: '👩‍🏫', color: '#06D6A0' },
          { label: 'مدرسه', value: stats.schools, emoji: '🏫', color: '#FFB703' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '12px 6px', marginBottom: 0 }}>
            <div style={{ fontSize: '1.4rem' }}>{s.emoji}</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 16px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 جستجو نام، یوزرنیم، مدرسه..."
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0',
            fontSize: 14, outline: 'none', marginBottom: 10, direction: 'rtl' }}
          onFocus={e => (e.target.style.borderColor = '#FF6584')}
          onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['all','همه'],['student','دانش‌آموز'],['teacher','معلم'],['parent','اولیا'],['admin','مدیر']].map(([val, label]) => (
            <button key={val} onClick={() => setRoleFilter(val)}
              style={{ padding: '5px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer', fontWeight: 600, border: 'none',
                background: roleFilter === val ? '#FF6584' : '#f7fafc',
                color: roleFilter === val ? 'white' : 'var(--text-light)' }}>
              {label}
            </button>
          ))}
        </div>

        {schools.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setSchoolFilter('all')}
              style={{ padding: '4px 10px', borderRadius: 14, fontSize: 11, cursor: 'pointer', border: 'none', fontWeight: 600,
                background: schoolFilter === 'all' ? '#6C63FF' : '#f0eeff', color: schoolFilter === 'all' ? 'white' : '#6C63FF' }}>
              همه مدارس
            </button>
            {schools.map(s => (
              <button key={s} onClick={() => setSchoolFilter(s)}
                style={{ padding: '4px 10px', borderRadius: 14, fontSize: 11, cursor: 'pointer', border: 'none', fontWeight: 600,
                  background: schoolFilter === s ? '#6C63FF' : '#f0eeff', color: schoolFilter === s ? 'white' : '#6C63FF' }}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User count */}
      <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 10 }}>
        {filtered.length} کاربر
        {search || roleFilter !== 'all' || schoolFilter !== 'all' ? ` (از ${users.length})` : ''}
        {loading && ' · در حال بارگذاری...'}
      </div>

      {/* User List */}
      <AnimatePresence>
        {filtered.map((u, i) => (
          <motion.div key={u.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: Math.min(i * 0.03, 0.3) }}
            className="card" style={{ padding: '12px 16px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{u.name}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 600,
                    background: ROLE_COLOR[u.role] + '18', color: ROLE_COLOR[u.role] }}>
                    {ROLE_FA[u.role]}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 3 }}>
                  @{u.username}
                  {u.school && <span> · {u.school}</span>}
                  {u.grade && <span> · پایه {u.grade} {u.class_name}</span>}
                </div>
                {u.role === 'student' && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 5, fontSize: 12 }}>
                    <span>⭐ {u.stars}</span>
                    <span>💎 {u.coins}</span>
                    <span>🏅 سطح {u.level}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginRight: 8 }}>
                {u.role === 'student' && (
                  <button onClick={() => setEditUser({ id: u.id, name: u.name, stars: u.stars, coins: u.coins, level: u.level })}
                    style={{ padding: '5px 10px', borderRadius: 8, background: '#f0eeff', color: '#6C63FF',
                      border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    ✏️ ویرایش
                  </button>
                )}
                <button onClick={() => handleDelete(u)}
                  disabled={deleting === u.id}
                  style={{ padding: '5px 10px', borderRadius: 8, background: '#fff0f3', color: '#FF6584',
                    border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    opacity: deleting === u.id ? 0.5 : 1 }}>
                  {deleting === u.id ? '⏳' : '🗑️ حذف'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {!loading && filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>🔍</div>
          <p style={{ color: 'var(--text-light)' }}>کاربری یافت نشد</p>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setEditUser(null)}>
            <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 380 }}>
              <h3 style={{ fontSize: 16, marginBottom: 18, color: '#6C63FF' }}>✏️ ویرایش — {editUser.name}</h3>

              {([
                { key: 'stars', label: '⭐ ستاره', min: 0, max: 9999 },
                { key: 'coins', label: '💎 الماس', min: 0, max: 9999 },
                { key: 'level', label: '🏅 سطح', min: 1, max: 99 },
              ] as const).map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 5 }}>{f.label}</label>
                  <input type="number" min={f.min} max={f.max}
                    value={editUser[f.key]}
                    onChange={e => setEditUser(prev => prev ? { ...prev, [f.key]: parseInt(e.target.value) || 0 } : null)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0',
                      fontSize: 15, outline: 'none', direction: 'ltr', textAlign: 'center' }}
                    onFocus={e => (e.target.style.borderColor = '#6C63FF')}
                    onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
                </div>
              ))}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setEditUser(null)}
                  style={{ flex: 1, padding: '11px', borderRadius: 12, background: '#f0f0f0', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                  انصراف
                </button>
                <button onClick={handleEdit}
                  style={{ flex: 2, padding: '11px', borderRadius: 12, background: 'linear-gradient(135deg,#7C73FF,#6C63FF)',
                    color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                  💾 ذخیره
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

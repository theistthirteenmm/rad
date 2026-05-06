import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { login, type Role } from '../lib/auth'
import { useStore } from '../store/useStore'

const ROLES: { id: Role; label: string; emoji: string; color: string; desc: string }[] = [
  { id: 'student', label: 'دانش‌آموز', emoji: '🎒', color: '#6C63FF', desc: 'بازی و یادگیری' },
  { id: 'parent',  label: 'اولیا',     emoji: '👪', color: '#FF6584', desc: 'پیشرفت فرزندم' },
  { id: 'teacher', label: 'معلم',      emoji: '👩‍🏫', color: '#06D6A0', desc: 'مدیریت کلاس' },
  { id: 'admin',   label: 'مدیر',      emoji: '🏫', color: '#FF9800', desc: 'مدیریت مدرسه' },
]

export default function LoginPage() {
  const nav = useNavigate()
  const setUser = useStore(s => s.setUser)
  const [role, setRole] = useState<Role>('student')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const active = ROLES.find(r => r.id === role)!

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    const result = await login(username.trim(), password, role)
    setLoading(false)
    if (!result.ok) { setError(result.error); return }
    setUser(result.user)
    const routes: Record<Role, string> = { teacher: '/teacher', parent: '/parent', admin: '/admin', student: '/' }
    const dest = role === 'admin' && result.user?.username === 'hamed' ? '/superadmin' : routes[role]
    nav(dest, { replace: true })
  }

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh' }}>

      <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: 28 }}>
        {/* RAD Logo */}
        <div style={{ marginBottom: 8 }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="36" cy="36" r="36" fill="url(#logoGrad)"/>
            <text x="36" y="44" textAnchor="middle" fontSize="28" fontWeight="900" fill="white" fontFamily="Vazirmatn, sans-serif">راد</text>
            <circle cx="56" cy="16" r="7" fill="#FFD166"/>
            <circle cx="56" cy="16" r="4" fill="white"/>
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6C63FF"/>
                <stop offset="1" stopColor="#FF6584"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 style={{ fontSize: 26, color: 'var(--primary)', fontWeight: 900 }}>راد</h1>
        <p style={{ color: 'var(--text-light)', fontSize: 14, marginTop: 4 }}>بازی آموزشی هوشمند</p>
      </motion.div>

      {/* Role Selector - 2x2 grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {ROLES.map(r => (
          <button key={r.id} onClick={() => { setRole(r.id); setError('') }}
            style={{
              padding: '14px 8px', borderRadius: 16, border: `2px solid ${role === r.id ? r.color : '#e2e8f0'}`,
              background: role === r.id ? r.color + '15' : 'white',
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4
            }}>
            <span style={{ fontSize: '1.8rem' }}>{r.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: role === r.id ? 700 : 400, color: role === r.id ? r.color : 'var(--text-light)' }}>
              {r.label}
            </span>
            <span style={{ fontSize: 11, color: role === r.id ? r.color + 'aa' : '#ccc' }}>{r.desc}</span>
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={role} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }} className="card">

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, fontSize: '1.6rem',
              background: active.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {active.emoji}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: active.color }}>ورود {active.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{active.desc}</div>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 6 }}>نام کاربری</label>
            <input value={username} onChange={e => { setUsername(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="نام کاربری" dir="ltr"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12,
                border: `2px solid ${error ? '#FF6584' : '#e2e8f0'}`, fontSize: 15, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = active.color}
              onBlur={e => e.target.style.borderColor = error ? '#FF6584' : '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 6 }}>رمز عبور</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="رمز عبور" dir="ltr"
                style={{ width: '100%', padding: '12px 44px 12px 16px', borderRadius: 12,
                  border: `2px solid ${error ? '#FF6584' : '#e2e8f0'}`, fontSize: 15, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = active.color}
                onBlur={e => e.target.style.borderColor = error ? '#FF6584' : '#e2e8f0'}
              />
              <button onClick={() => setShowPw(s => !s)} style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-light)', border: 'none' }}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ background: '#fff0f3', borderRadius: 10, padding: '10px 14px',
                  fontSize: 13, color: '#FF6584', marginBottom: 14 }}>
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogin} disabled={loading}
            className="btn btn-primary"
            style={{ background: `linear-gradient(135deg, ${active.color}, ${active.color}cc)`, marginBottom: 14 }}>
            {loading ? '⏳ در حال ورود...' : `ورود ${active.emoji}`}
          </motion.button>

          <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-light)' }}>
            حساب نداری?{' '}
            <Link to={`/register?role=${role}`} style={{ color: active.color, fontWeight: 700 }}>
              ثبت‌نام کن
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-light)' }}>
        <Link to="/about" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>
          درباره راد · رایان نوین
        </Link>
      </div>
    </div>
  )
}

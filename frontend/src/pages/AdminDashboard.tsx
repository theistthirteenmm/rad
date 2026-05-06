import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { getAll, changeCredentials } from '../lib/auth'
import {
  getSchool, addGrade, deleteGrade, addClass, deleteClass,
  type School
} from '../lib/schoolData'

const GRADE_PRESETS = ['اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم']
const CLASS_PRESETS = ['الف', 'ب', 'پ', 'ت', 'ث', 'ج']

function Msg({ text, type }: { text: string; type: 'err' | 'ok' }) {
  if (!text) return null
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 12,
        background: type === 'err' ? '#fff0f3' : '#f0fff9',
        color: type === 'err' ? '#FF6584' : '#06D6A0',
      }}>
      {type === 'err' ? '⚠️' : '✅'} {text}
    </motion.div>
  )
}

function Input({ label, value, onChange, placeholder, type = 'text', hint, dir = 'rtl' }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder: string; type?: string; hint?: string; dir?: string
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} dir={dir as any}
        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, outline: 'none' }}
        onFocus={e => e.target.style.borderColor = '#FF9800'}
        onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
      {hint && <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

/* ─── Change Credentials Modal ──────────────────────────────── */
function ChangeCredModal({ onClose, onSaved }: { onClose: () => void; onSaved: (newUsername: string) => void }) {
  const user = useStore(s => s.user)!
  const setUser = useStore(s => s.setUser)
  const [newUsername, setNewUsername] = useState(user.username)
  const [newPw, setNewPw] = useState('')
  const [newPw2, setNewPw2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)

  const valid = newUsername.trim().length >= 3 && newPw.length >= 6 && newPw === newPw2

  async function save() {
    setErr(''); setOk('')
    setLoading(true)
    const r = await changeCredentials(user.id, newUsername.trim(), newPw)
    setLoading(false)
    if (!r.ok) { setErr(r.error); return }
    if (r.user) setUser(r.user)
    setOk('اطلاعات با موفقیت ذخیره شد')
    setNewPw(''); setNewPw2('')
    setTimeout(() => { onSaved(newUsername.trim()); onClose() }, 1200)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
        onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 }}>
        <h3 style={{ fontSize: 16, marginBottom: 16, color: '#FF9800' }}>🔑 تغییر اطلاعات ورود</h3>

        <Input label="نام کاربری جدید" value={newUsername} onChange={v => { setNewUsername(v); setErr('') }}
          placeholder="نام کاربری" dir="ltr" />

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 6 }}>رمز عبور جدید (حداقل ۶ کاراکتر)</label>
          <div style={{ position: 'relative' }}>
            <input type={showPw ? 'text' : 'password'} value={newPw}
              onChange={e => { setNewPw(e.target.value); setErr('') }} placeholder="رمز جدید" dir="ltr"
              style={{ width: '100%', padding: '12px 44px 12px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#FF9800'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            <button onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', fontSize: 16, cursor: 'pointer', border: 'none' }}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <Input label="تکرار رمز جدید" value={newPw2} onChange={v => { setNewPw2(v); setErr('') }}
          placeholder="تکرار رمز" type="password" dir="ltr" />

        {newPw2 && newPw !== newPw2 && (
          <p style={{ fontSize: 12, color: '#FF6584', marginBottom: 10 }}>⚠️ رمزها یکسان نیستند</p>
        )}

        <Msg text={err} type="err" />
        <Msg text={ok} type="ok" />

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 12, background: '#f0f0f0', border: 'none', cursor: 'pointer', fontSize: 14 }}>
            انصراف
          </button>
          <button onClick={save} disabled={!valid || loading}
            style={{ flex: 2, padding: '10px', borderRadius: 12, background: '#FF9800', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: valid ? 1 : 0.5 }}>
            {loading ? '⏳...' : '💾 ذخیره'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Main Dashboard ────────────────────────────────────────── */
type Tab = 'structure' | 'users'

export default function AdminDashboard() {
  const nav = useNavigate()
  const user = useStore(s => s.user)
  const logout = useStore(s => s.logout)
  const [showCredModal, setShowCredModal] = useState(false)
  const [tab, setTab] = useState<Tab>('structure')
  const [school, setSchool] = useState<School | null>(null)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [expandedGrade, setExpandedGrade] = useState<string | null>(null)
  const [newGrade, setNewGrade] = useState('')
  const [newClassGradeId, setNewClassGradeId] = useState('')
  const [newClass, setNewClass] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const reload = useCallback(async () => {
    if (!user?.school_id) return
    const s = await getSchool(user.school_id)
    setSchool(s)
  }, [user?.school_id])

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    const sid = user.school_id
    reload()
    getAll().then(users => setAllUsers(users.filter(u => u.school_id === sid && u.role !== 'admin')))
  }, [user, reload])

  if (!user || user.role !== 'admin') { nav('/login'); return null }

  function flash(e: string | null, s?: string) {
    if (e) { setErr(e); setOk(''); setTimeout(() => setErr(''), 3000) }
    else { setOk(s ?? ''); setErr(''); setTimeout(() => setOk(''), 3000) }
  }

  async function handleAddGrade() {
    if (!user) return
    if (!newGrade.trim()) { flash('پایه را انتخاب یا وارد کنید'); return }
    const r = await addGrade(user.school_id, newGrade.trim())
    if (!r.ok) { flash(r.error); return }
    setSchool(r.school)
    setNewGrade('')
    const newG = r.school.grades.find(g => g.name === newGrade.trim())
    if (newG) setExpandedGrade(newG.id)
    flash(null, `پایه «${newGrade.trim()}» اضافه شد`)
  }

  async function handleAddClass(gradeId: string, gradeName: string) {
    if (!user) return
    if (!newClass.trim()) { flash('نام کلاس را انتخاب یا وارد کنید'); return }
    const r = await addClass(user.school_id, gradeId, newClass.trim())
    if (!r.ok) { flash(r.error); return }
    setSchool(r.school)
    setNewClass(''); setNewClassGradeId('')
    flash(null, `کلاس «${gradeName} ${newClass.trim()}» اضافه شد`)
  }

  async function handleDeleteGrade(gradeId: string, gradeName: string) {
    if (!user || !confirm(`پایه «${gradeName}» حذف شود؟`)) return
    const s = await deleteGrade(user.school_id, gradeId)
    if (s) setSchool(s)
  }

  async function handleDeleteClass(gradeId: string, classId: string) {
    if (!user) return
    const s = await deleteClass(user.school_id, gradeId, classId)
    if (s) setSchool(s)
  }

  return (
    <div className="container">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#FF9800' }}>🏫 {user.school}</div>
          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>@{user.username} · مدیر</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowCredModal(true)}
            style={{ background: '#fff8e1', color: '#FF9800', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            🔑 ویرایش
          </button>
          <button onClick={() => { logout(); nav('/login') }}
            style={{ background: '#fff0f3', color: '#FF6584', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            خروج
          </button>
        </div>
      </motion.div>

      <Msg text={err} type="err" />
      <Msg text={ok} type="ok" />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'پایه', value: school?.grades.length ?? 0, emoji: '📚' },
          { label: 'کلاس', value: school?.grades.reduce((a, g) => a + g.classes.length, 0) ?? 0, emoji: '🚪' },
          { label: 'کاربر', value: allUsers.length, emoji: '👥' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ fontSize: '1.6rem' }}>{s.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: 22, color: '#FF9800' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'structure', label: '📚 پایه‌ها و کلاس‌ها' },
          { id: 'users', label: '👥 کاربران مدرسه' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as Tab)}
            style={{ flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: `2px solid ${tab === t.id ? '#FF9800' : '#e2e8f0'}`,
              background: tab === t.id ? '#fff8e1' : 'white',
              color: tab === t.id ? '#FF9800' : 'var(--text-light)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── STRUCTURE TAB ── */}
      {tab === 'structure' && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 10, color: '#FF9800' }}>➕ افزودن پایه تحصیلی</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {GRADE_PRESETS.map(g => (
                <button key={g} onClick={() => setNewGrade(g)}
                  style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', border: 'none', fontWeight: 600,
                    background: newGrade === g ? '#FF9800' : '#fff8e1', color: newGrade === g ? 'white' : '#FF9800' }}>
                  {g}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={newGrade} onChange={e => setNewGrade(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddGrade()}
                placeholder="یا پایه دلخواه وارد کن"
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#FF9800'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              <button onClick={handleAddGrade}
                style={{ padding: '10px 18px', borderRadius: 10, background: '#FF9800', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                + پایه
              </button>
            </div>
          </div>

          {!school || school.grades.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: '3rem', marginBottom: 10 }}>📚</div>
              <p style={{ color: 'var(--text-light)', fontSize: 14 }}>هنوز پایه‌ای اضافه نشده</p>
            </div>
          ) : (
            school.grades.map(grade => (
              <motion.div key={grade.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="card" style={{ marginBottom: 10, padding: 0, overflow: 'hidden' }}>

                <div onClick={() => setExpandedGrade(expandedGrade === grade.id ? null : grade.id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.3rem' }}>📚</span>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>پایه {grade.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-light)', marginRight: 8 }}>
                        ({grade.classes.length} کلاس)
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={e => { e.stopPropagation(); handleDeleteGrade(grade.id, grade.name) }}
                      style={{ background: '#fff0f3', color: '#FF6584', borderRadius: 8, padding: '4px 10px', fontSize: 12, border: 'none', cursor: 'pointer' }}>
                      حذف
                    </button>
                    <span style={{ color: 'var(--text-light)' }}>{expandedGrade === grade.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedGrade === grade.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      style={{ overflow: 'hidden', borderTop: '1px solid #fff8e1' }}>
                      <div style={{ padding: '14px 16px', background: '#fffdf8' }}>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                          {grade.classes.map(cls => (
                            <div key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: 6,
                              background: '#fff8e1', borderRadius: 8, padding: '6px 12px', border: '1px solid #ffe082' }}>
                              <span style={{ fontWeight: 700, color: '#FF9800', fontSize: 14 }}>
                                {grade.name} {cls.name}
                              </span>
                              <button onClick={() => handleDeleteClass(grade.id, cls.id)}
                                style={{ background: 'none', color: '#FF6584', fontSize: 16, cursor: 'pointer', border: 'none', padding: 0, lineHeight: 1 }}>×</button>
                            </div>
                          ))}
                          {grade.classes.length === 0 && (
                            <span style={{ fontSize: 12, color: '#aaa' }}>هنوز کلاسی اضافه نشده</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                          {CLASS_PRESETS.map(c => (
                            <button key={c}
                              onClick={() => { setNewClassGradeId(grade.id); setNewClass(c) }}
                              style={{ padding: '4px 10px', borderRadius: 16, fontSize: 12, cursor: 'pointer', border: 'none', fontWeight: 600,
                                background: newClassGradeId === grade.id && newClass === c ? '#FF9800' : '#fff8e1',
                                color: newClassGradeId === grade.id && newClass === c ? 'white' : '#FF9800' }}>
                              {c}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            value={newClassGradeId === grade.id ? newClass : ''}
                            onChange={e => { setNewClassGradeId(grade.id); setNewClass(e.target.value) }}
                            onFocus={() => setNewClassGradeId(grade.id)}
                            onKeyDown={e => e.key === 'Enter' && handleAddClass(grade.id, grade.name)}
                            placeholder="نام کلاس"
                            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}
                          />
                          <button onClick={() => handleAddClass(grade.id, grade.name)}
                            style={{ padding: '8px 14px', borderRadius: 8, background: '#06D6A0', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                            + کلاس
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </>
      )}

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <>
          {(['teacher', 'student', 'parent'] as const).map(role => {
            const roleUsers = allUsers.filter(u => u.role === role)
            const labels = { teacher: '👩‍🏫 معلمان', student: '🎒 دانش‌آموزان', parent: '👪 اولیا' }
            return (
              <div key={role} className="card" style={{ marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, marginBottom: 10, color: 'var(--text-light)' }}>
                  {labels[role]} ({roleUsers.length})
                </h3>
                {roleUsers.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#bbb', textAlign: 'center', padding: '8px 0' }}>کاربری ثبت‌نام نکرده</p>
                ) : (
                  roleUsers.map(u => (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
                          @{u.username}
                          {u.grade ? ` · پایه ${u.grade} ${u.class_name}` : ''}
                        </div>
                      </div>
                      {role === 'student' && (
                        <span style={{ fontSize: 13, color: 'var(--text-light)' }}>⭐ {u.stars}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )
          })}
        </>
      )}

      <AnimatePresence>
        {showCredModal && (
          <ChangeCredModal
            onClose={() => setShowCredModal(false)}
            onSaved={() => setShowCredModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

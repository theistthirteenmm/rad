import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { register, getStudentsInClass, type Role } from '../lib/auth'
import { getSchools, getGrades, getClasses, type School, type Grade, type ClassRoom } from '../lib/schoolData'
import { useStore } from '../store/useStore'

const ROLES: { id: Role; label: string; emoji: string; color: string }[] = [
  { id: 'student', label: 'دانش‌آموز', emoji: '🎒', color: '#6C63FF' },
  { id: 'parent',  label: 'اولیا',     emoji: '👪', color: '#FF6584' },
  { id: 'teacher', label: 'معلم',      emoji: '👩‍🏫', color: '#06D6A0' },
  { id: 'admin',   label: 'مدیر مدرسه', emoji: '🏫', color: '#FF9800' },
]
const AVATARS = ['🦁', '🐯', '🐻', '🦊', '🐼', '🐸', '🦋', '🐬']

function SelectField({
  label, value, onChange, options, placeholder, color, disabled = false, hint
}: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string; color: string; disabled?: boolean; hint?: string
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 6 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        style={{
          width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 14,
          border: `2px solid ${value ? color + '80' : '#e2e8f0'}`,
          background: disabled ? '#f5f5f5' : 'white', outline: 'none',
          color: value ? 'var(--text)' : '#aaa', direction: 'rtl', cursor: disabled ? 'not-allowed' : 'pointer',
          appearance: 'none', WebkitAppearance: 'none'
        }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

function TextField({
  label, value, onChange, placeholder, color, dir = 'rtl', hint
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder: string; color: string; dir?: string; hint?: string
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 6 }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        dir={dir as any}
        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 15, outline: 'none' }}
        onFocus={e => e.target.style.borderColor = color}
        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
      />
      {hint && <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

export default function RegisterPage() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const setUser = useStore(s => s.setUser)

  const [role, setRole] = useState<Role>((params.get('role') as Role) || 'student')
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [avatar, setAvatar] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [childName, setChildName] = useState('')
  const [adminSchoolName, setAdminSchoolName] = useState('')

  const [schools, setSchools] = useState<School[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [schoolId, setSchoolId] = useState('')
  const [gradeId, setGradeId] = useState('')
  const [classId, setClassId] = useState('')

  const [studentsInClass, setStudentsInClass] = useState<{ value: string; label: string }[]>([])
  const [selectedStudentName, setSelectedStudentName] = useState('')

  // Load schools on mount
  useEffect(() => {
    getSchools().then(setSchools)
  }, [])

  // Cascade school → grades
  useEffect(() => {
    if (schoolId) {
      setGrades(getGrades(schoolId, schools))
      setGradeId('')
      setClassId('')
    } else {
      setGrades([])
      setGradeId('')
      setClassId('')
    }
  }, [schoolId, schools])

  // Cascade grade → classes
  useEffect(() => {
    if (gradeId) {
      setClasses(getClasses(gradeId, grades))
      setClassId('')
    } else {
      setClasses([])
      setClassId('')
    }
  }, [gradeId, grades])

  // Load students in class for parent child picker
  useEffect(() => {
    if (role === 'parent' && schoolId && gradeId && classId) {
      getStudentsInClass(schoolId, gradeId, classId).then(students => {
        setStudentsInClass(students.map(s => ({ value: s.name, label: s.name })))
      })
    } else {
      setStudentsInClass([])
      setSelectedStudentName('')
    }
  }, [schoolId, gradeId, classId, role])

  const active = ROLES.find(r => r.id === role)!
  const schoolOptions = schools.map(s => ({ value: s.id, label: s.name }))
  const gradeOptions = grades.map(g => ({ value: g.id, label: `پایه ${g.name}` }))
  const classOptions = classes.map(c => ({
    value: c.id,
    label: `${grades.find(g => g.id === gradeId)?.name ?? ''} ${c.name}`
  }))

  const schoolName = schools.find(s => s.id === schoolId)?.name ?? ''
  const gradeName = grades.find(g => g.id === gradeId)?.name ?? ''
  const className = classes.find(c => c.id === classId)?.name ?? ''

  const step1Valid = username.trim().length >= 3 && password.length >= 4 && password === password2

  function step2Valid(): boolean {
    if (!name.trim()) return false
    if (role === 'admin') return adminSchoolName.trim().length >= 3
    if (!schoolId) return false
    if (role === 'student') return !!gradeId && !!classId
    if (role === 'parent') return !!gradeId && !!classId && !!(childName.trim() || selectedStudentName)
    if (role === 'teacher') return !!gradeId && !!classId
    return false
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    const result = await register({
      username: username.trim(),
      password,
      role,
      name: name.trim(),
      school: schoolName,
      school_id: schoolId,
      grade: gradeName,
      grade_id: gradeId,
      class_name: className,
      class_id: classId,
      teacher_name: teacherName.trim(),
      avatar: `avatar${avatar}`,
      stars: 0, coins: 0, level: 1,
      child_name: role === 'parent' ? (selectedStudentName || childName.trim()) : undefined,
      school_name: role === 'admin' ? adminSchoolName.trim() : undefined,
    })

    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      if (result.error.includes('نام کاربری')) setStep(1)
      return
    }
    setUser(result.user)
    const routes: Record<string, string> = { teacher: '/teacher', parent: '/parent', admin: '/admin', student: '/' }
    nav(routes[role] ?? '/', { replace: true })
  }

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Link to="/login" style={{ background: 'none', fontSize: 20, color: 'var(--text-light)', textDecoration: 'none' }}>←</Link>
        <h1 style={{ fontSize: 20, color: active.color }}>ثبت‌نام {active.emoji}</h1>
      </div>

      {/* Role Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {ROLES.map(r => (
          <button key={r.id} onClick={() => { setRole(r.id); setStep(1); setError(''); setSchoolId(''); setGradeId(''); setClassId('') }}
            style={{
              flex: 1, padding: '10px 4px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              border: `2px solid ${role === r.id ? r.color : '#e2e8f0'}`,
              background: role === r.id ? r.color + '15' : 'white',
              color: role === r.id ? r.color : 'var(--text-light)', cursor: 'pointer',
            }}>
            {r.emoji} {r.label}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[1, 2].map(i => (
          <div key={i} style={{ flex: 1, height: 6, borderRadius: 3,
            background: step >= i ? active.color : '#e2e8f0', transition: 'background 0.3s' }} />
        ))}
      </div>

      {schools.length === 0 && step === 2 && role !== 'admin' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: '#fff8e1', borderRadius: 12, padding: '14px 16px', marginBottom: 16, fontSize: 14 }}>
          ⚠️ هنوز هیچ مدرسه‌ای توسط مدیر ثبت نشده است.<br />
          <span style={{ fontSize: 12, color: '#888', marginTop: 4, display: 'block' }}>
            لطفاً از مدیر مدرسه بخواهید ابتدا مدرسه و کلاس‌ها را در سیستم ثبت کند.
          </span>
        </motion.div>
      )}

      <AnimatePresence mode="wait">

        {/* Step 1 */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} className="card">
            <p style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 16 }}>۱. اطلاعات ورود:</p>

            <TextField label="نام کاربری (حداقل ۳ حرف، فقط انگلیسی)"
              value={username} onChange={v => { setUsername(v); setError('') }}
              placeholder="مثلاً: ali2024" color={active.color} dir="ltr" />

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 6 }}>
                رمز عبور (حداقل ۴ کاراکتر)
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }} placeholder="رمز عبور" dir="ltr"
                  style={{ width: '100%', padding: '12px 44px 12px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 15, outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = active.color}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                <button onClick={() => setShowPw(s => !s)} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', fontSize: 18, cursor: 'pointer', border: 'none' }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 6 }}>تکرار رمز عبور</label>
              <input type="password" value={password2} onChange={e => { setPassword2(e.target.value); setError('') }}
                placeholder="رمز را دوباره وارد کن" dir="ltr"
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12,
                  border: `2px solid ${password2 && password !== password2 ? '#FF6584' : '#e2e8f0'}`,
                  fontSize: 15, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = active.color}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              {password2 && password !== password2 && (
                <p style={{ fontSize: 12, color: '#FF6584', marginTop: 4 }}>⚠️ رمزها یکسان نیستند</p>
              )}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ background: '#fff0f3', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FF6584', marginBottom: 14 }}>
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button className="btn btn-primary"
              style={{ background: `linear-gradient(135deg, ${active.color}, ${active.color}cc)`, opacity: step1Valid ? 1 : 0.5 }}
              disabled={!step1Valid} onClick={() => setStep(2)}>
              بعدی ←
            </button>
          </motion.div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} className="card">
            <p style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 16 }}>۲. اطلاعات پروفایل:</p>

            <TextField label="نام و نام‌خانوادگی" value={name} onChange={setName}
              placeholder="مثلاً: علی احمدی" color={active.color} />

            {role === 'admin' && (
              <TextField label="نام مدرسه" value={adminSchoolName} onChange={setAdminSchoolName}
                placeholder="مثلاً: دبستان شهید رجایی شهر ری" color={active.color}
                hint="دانش‌آموزان و معلمان هنگام ثبت‌نام این مدرسه را انتخاب خواهند کرد" />
            )}

            {role !== 'admin' && (
              <SelectField label="مدرسه" value={schoolId} onChange={setSchoolId}
                options={schoolOptions} placeholder="-- مدرسه را انتخاب کنید --" color={active.color}
                hint={schools.length === 0 ? 'هنوز هیچ مدرسه‌ای توسط مدیر ثبت نشده. لطفاً با مدیر مدرسه تماس بگیرید' : undefined} />
            )}

            {role !== 'admin' && (<>
              <SelectField label="پایه تحصیلی" value={gradeId} onChange={setGradeId}
                options={gradeOptions} placeholder={!schoolId ? 'ابتدا مدرسه را انتخاب کنید' : '-- پایه را انتخاب کنید --'}
                color={active.color} disabled={!schoolId}
                hint={schoolId && grades.length === 0 ? 'مدیر هنوز پایه‌ای برای این مدرسه ثبت نکرده' : undefined} />

              <SelectField label="کلاس" value={classId} onChange={setClassId}
                options={classOptions} placeholder={!gradeId ? 'ابتدا پایه را انتخاب کنید' : '-- کلاس را انتخاب کنید --'}
                color={active.color} disabled={!gradeId}
                hint={gradeId && classes.length === 0 ? 'مدیر هنوز کلاسی برای این پایه ثبت نکرده' : undefined} />

              {role === 'student' && (
                <TextField label="نام معلم (اختیاری)" value={teacherName} onChange={setTeacherName}
                  placeholder="نام معلم کلاس" color={active.color} />
              )}

              {role === 'parent' && classId && (
                studentsInClass.length > 0 ? (
                  <SelectField label="نام فرزند" value={selectedStudentName}
                    onChange={v => { setSelectedStudentName(v); setChildName('') }}
                    options={studentsInClass} placeholder="-- فرزندتان را انتخاب کنید --" color={active.color} />
                ) : (
                  <TextField label="نام فرزند" value={childName} onChange={setChildName}
                    placeholder="نام کامل فرزندتان" color={active.color} />
                )
              )}
              {role === 'parent' && !classId && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 6 }}>نام فرزند</label>
                  <div style={{ padding: '12px 16px', borderRadius: 12, background: '#f5f5f5', fontSize: 14, color: '#aaa' }}>
                    ابتدا مدرسه، پایه و کلاس را انتخاب کنید
                  </div>
                </div>
              )}
            </>)}

            {role === 'student' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 8 }}>آواتار:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {AVATARS.map((em, i) => (
                    <button key={i} onClick={() => setAvatar(i)} style={{
                      fontSize: '2rem', padding: 10, borderRadius: 14, cursor: 'pointer',
                      border: `3px solid ${avatar === i ? active.color : 'transparent'}`,
                      background: avatar === i ? active.color + '15' : '#f7fafc',
                      transform: avatar === i ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s'
                    }}>{em}</button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ background: '#fff0f3', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FF6584', marginBottom: 14 }}>
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" onClick={() => setStep(1)}
                style={{ background: '#e2e8f0', color: 'var(--text)', width: '35%' }}>← برگشت</button>
              <button className="btn btn-success"
                style={{ width: '65%', opacity: step2Valid() ? 1 : 0.5 }}
                disabled={!step2Valid() || loading}
                onClick={handleSubmit}>
                {loading ? '⏳ در حال ثبت...' : '🎉 ثبت‌نام!'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-light)' }}>
        قبلاً ثبت‌نام کردی?{' '}
        <Link to="/login" style={{ color: active.color, fontWeight: 700 }}>ورود</Link>
      </div>
    </div>
  )
}

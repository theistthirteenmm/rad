import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

function RadLogo({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="36" cy="36" r="36" fill="url(#aboutGrad)"/>
      <text x="36" y="44" textAnchor="middle" fontSize="28" fontWeight="900" fill="white" fontFamily="Vazirmatn, sans-serif">راد</text>
      <circle cx="56" cy="16" r="7" fill="#FFD166"/>
      <circle cx="56" cy="16" r="4" fill="white"/>
      <defs>
        <linearGradient id="aboutGrad" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6C63FF"/>
          <stop offset="1" stopColor="#FF6584"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function AboutPage() {
  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>

      {/* Back */}
      <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-light)', textDecoration: 'none', fontSize: 14, marginBottom: 24 }}>
        ← بازگشت
      </Link>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: 32 }}>
        <RadLogo size={96} />
        <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)', marginTop: 16 }}>راد</h1>
        <p style={{ fontSize: 15, color: 'var(--text-light)', marginTop: 6 }}>
          پلتفرم بازی‌های آموزشی هوشمند برای دانش‌آموزان دبستان
        </p>
      </motion.div>

      {/* Story */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, #6C63FF12, #FF658412)', border: '1px solid #6C63FF20' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>💜</div>
        <h2 style={{ fontSize: 18, color: 'var(--primary)', marginBottom: 12 }}>داستان راد</h2>
        <p style={{ fontSize: 14, lineHeight: 2, color: 'var(--text)' }}>
          راد را به خاطر پسرم <strong>رادین کولیوند</strong>، دانش‌آموز مدرسه رازی، ساختم.
          می‌خواستم یادگیری برایش هیجان‌انگیز و لذت‌بخش باشد؛
          نه خسته‌کننده و تکراری.
        </p>
        <p style={{ fontSize: 14, lineHeight: 2, color: 'var(--text)', marginTop: 10 }}>
          به امید این که همه بچه‌های سرزمینم بتوانند علم یاد بگیرند
          و آینده‌ای روشن‌تر بسازند. 🌟
        </p>
      </motion.div>

      {/* Features */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, color: 'var(--text)', marginBottom: 16 }}>✨ امکانات</h2>
        {[
          { emoji: '🎮', title: 'بازی‌های آموزشی', desc: 'فارسی، ریاضی، علوم، قرآن و نگارش' },
          { emoji: '🏆', title: 'سیستم امتیازدهی', desc: 'ستاره، الماس و ارتقای سطح' },
          { emoji: '📊', title: 'پیشرفت تحصیلی', desc: 'نمودار پیشرفت برای اولیا و معلمان' },
          { emoji: '🏫', title: 'مدیریت مدرسه', desc: 'چند مدرسه، چند پایه، چند کلاس' },
          { emoji: '📡', title: 'تحت شبکه', desc: 'قابل نصب روی سرور مدرسه' },
        ].map(f => (
          <div key={f.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>{f.emoji}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 2 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Studio */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, color: 'var(--text)', marginBottom: 14 }}>🏢 استودیو توسعه</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#6C63FF,#FF6584)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
            💻
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>رایان نوین</div>
            <a href="http://rayanovinmt.ir/" target="_blank" rel="noreferrer"
              style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none' }}>
              rayanovinmt.ir
            </a>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.9 }}>
          استودیو رایان نوین در زمینه طراحی و توسعه نرم‌افزارهای آموزشی، اپلیکیشن‌های موبایل
          و سیستم‌های تحت وب فعالیت می‌کند.
          هدف ما ساختن ابزارهایی است که یادگیری را برای کودکان ایرانی
          ساده‌تر، شادتر و مؤثرتر کند.
        </p>
      </motion.div>

      {/* Tech Stack */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, color: 'var(--text)', marginBottom: 12 }}>⚙️ فناوری</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['React', 'TypeScript', 'FastAPI', 'SQLite', 'Docker', 'PWA'].map(t => (
            <span key={t} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              background: 'var(--primary)' + '15', color: 'var(--primary)'
            }}>{t}</span>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        style={{ textAlign: 'center' }}>
        <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '14px 32px' }}>
          🎮 شروع بازی
        </Link>
      </motion.div>
    </div>
  )
}

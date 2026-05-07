import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function DownloadPage() {
  const nav = useNavigate()

  const handleDownload = () => {
    // لینک مستقیم به APK
    window.open('/radin-app.apk', '_blank')
  }

  return (
    <div className="container" style={{ maxWidth: 500, paddingTop: 30 }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 10 }}>📱</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#6C63FF', marginBottom: 8 }}>
          دانلود اپ رادین
        </h1>
        <p style={{ color: 'var(--text-light)', fontSize: 14 }}>
          نسخه اندروید مستقل — بدون نیاز به اینترنت
        </p>
      </motion.div>

      {/* کارت اصلی */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 70,
            height: 70,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            flexShrink: 0,
            boxShadow: '0 6px 20px rgba(108,99,255,0.3)',
          }}>
            🌟
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#1a1a2e' }}>رادین — بازی آموزشی</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>نسخه ۲.۰ · ۴۵ مگابایت</div>
          </div>
        </div>

        <div style={{ background: '#f8f9ff', borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ fontSize: '1.2rem' }}>✅</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>ویژگی‌های نسخه APK:</div>
          </div>
          <ul style={{ margin: 0, paddingRight: 20, fontSize: 13, color: '#555', lineHeight: 1.8 }}>
            <li>کاملاً آفلاین — بدون نیاز به اینترنت</li>
            <li>۱۵+ بازی آموزشی فارسی، ریاضی، علوم، قرآن</li>
            <li>سیستم پاداش ستاره و الماس</li>
            <li>پنل پیشرفت برای والدین و معلم</li>
            <li>بهینه‌شده برای اندروید ۸ به بالا</li>
          </ul>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleDownload}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, #06D6A0, #06b888)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 800,
            fontFamily: 'inherit',
            marginBottom: 12,
            boxShadow: '0 6px 20px rgba(6,214,160,0.4)',
          }}
        >
          📥 دانلود APK (۴۵ مگابایت)
        </motion.button>

        <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center' }}>
          پس از دانلود، روی فایل کلیک کنید و «نصب» را بزنید
        </div>
      </motion.div>

      {/* راهنمای نصب */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFB703', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>📋</span> راهنمای نصب
        </h3>
        <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7 }}>
          <p style={{ marginBottom: 10 }}><strong>مرحله ۱:</strong> پس از دانلود، ممکن است پیام «نصب از منابع ناشناس» ظاهر شود. روی «تنظیمات» کلیک کنید و اجازه نصب از مرورگر را فعال کنید.</p>
          <p style={{ marginBottom: 10 }}><strong>مرحله ۲:</strong> به صفحه دانلود برگردید و دوباره روی فایل APK کلیک کنید.</p>
          <p style={{ marginBottom: 10 }}><strong>مرحله ۳:</strong> دکمه «نصب» را بزنید و منتظر پایان نصب باشید.</p>
          <p><strong>مرحله ۴:</strong> پس از نصب، اپ «رادین» در لیست برنامه‌های شما ظاهر می‌شود.</p>
        </div>
      </motion.div>

      {/* نکات امنیتی */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="card" style={{ padding: 20, background: '#fff8e1', border: '1.5px solid #FFB70322' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFB703', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔒</span> نکات امنیتی
        </h3>
        <ul style={{ margin: 0, paddingRight: 20, fontSize: 12, color: '#666', lineHeight: 1.6 }}>
          <li>این APK فقط از همین سایت رسمی دانلود کنید.</li>
          <li>پس از نصب، مجوز «ذخیره فایل» را تأیید کنید (برای ذخیره پیشرفت بازی).</li>
          <li>اپ هیچ دسترسی غیرضروری به گوشی شما ندارد.</li>
          <li>در صورت مشکل، از بخش «تماس با ما» در سایت کمک بگیرید.</li>
        </ul>
      </motion.div>

      {/* دکمه بازگشت */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={() => nav('/')}
        style={{
          marginTop: 20,
          width: '100%',
          padding: '12px',
          background: 'none',
          color: 'var(--text-light)',
          fontSize: 14,
          borderRadius: 12,
          border: '1.5px solid #e2e8f0',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        ← بازگشت به صفحه اصلی
      </motion.button>
    </div>
  )
}

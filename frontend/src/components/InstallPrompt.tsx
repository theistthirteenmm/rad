import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'radin-install-dismissed'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [visible, setVisible] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // اگه قبلاً رد کرده یا نصب شده، نشون نده
    if (localStorage.getItem(STORAGE_KEY)) return

    // اگه الان standalone (نصب‌شده) باز شده، نشون نده
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // کمی صبر کن تا splash بره
      setTimeout(() => setVisible(true), 1800)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem(STORAGE_KEY, '1')
    }
    setInstalling(false)
    setVisible(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          style={{
            position: 'fixed',
            bottom: 20,
            left: 12,
            right: 12,
            zIndex: 9000,
            background: 'white',
            borderRadius: 24,
            padding: '18px 20px',
            boxShadow: '0 8px 40px rgba(108,99,255,0.25), 0 2px 12px rgba(0,0,0,0.1)',
            border: '1.5px solid rgba(108,99,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {/* آیکون اپ */}
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.9rem',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(108,99,255,0.4)',
          }}>
            🌟
          </div>

          {/* متن */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#1a1a2e', marginBottom: 3 }}>
              نصب اپ راد
            </div>
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>
              نسخه PWA رو روی گوشیت نصب کن — بدون اینترنت هم کار می‌کنه!
            </div>
          </div>

          {/* دکمه‌ها */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleInstall}
              disabled={installing}
              style={{
                padding: '9px 18px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                opacity: installing ? 0.7 : 1,
              }}
            >
              {installing ? '⏳ ...' : '📲 نصب'}
            </motion.button>
            <button
              onClick={handleDismiss}
              style={{
                padding: '6px 10px',
                borderRadius: 10,
                background: 'none',
                color: '#aaa',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'inherit',
                textAlign: 'center',
              }}
            >
              نه ممنون
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

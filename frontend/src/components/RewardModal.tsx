import { motion } from 'framer-motion'
import Confetti from 'react-confetti'
import { useEffect, useState } from 'react'

interface Props {
  stars: number       // ستاره‌های جدید (پاداش واقعی)
  coins: number       // الماس‌های جدید
  totalStars?: number // ستاره‌هایی که در بازی گرفت (برای نمایش عملکرد)
  onClose: () => void
  onHome: () => void
}

export default function RewardModal({ stars, coins, totalStars, onClose, onHome }: Props) {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const hasNewReward = stars > 0 || coins > 0
  const displayStars = totalStars ?? stars  // ستاره‌های عملکرد برای نمایش

  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      {hasNewReward && <Confetti width={size.w} height={size.h} recycle={false} numberOfPieces={200} />}
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        style={{ background: 'white', borderRadius: 24, padding: 32, textAlign: 'center', maxWidth: 320, width: '100%' }}>

        <div style={{ fontSize: '4rem', marginBottom: 8 }}>
          {'⭐'.repeat(displayStars)}{'☆'.repeat(Math.max(0, 3 - displayStars))}
        </div>

        <h2 style={{ fontSize: 24, color: 'var(--primary)', marginBottom: 8 }}>
          {displayStars === 3 ? '🎉 عالی بودی!' : displayStars === 2 ? '👏 خوب بود!' : '💪 تلاش کن!'}
        </h2>

        {hasNewReward ? (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, margin: '20px 0',
            background: '#f7fafc', borderRadius: 16, padding: '16px' }}>
            <div>
              <div style={{ fontSize: '2rem' }}>⭐</div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>+{stars}</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)' }}>ستاره جدید</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem' }}>💎</div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>+{coins}</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)' }}>الماس جدید</div>
            </div>
          </div>
        ) : (
          <div style={{ margin: '20px 0', background: '#f0fff9', borderRadius: 16, padding: '16px',
            border: '2px solid #06D6A040' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>✅</div>
            <div style={{ fontSize: 14, color: '#06D6A0', fontWeight: 700 }}>
              این مرحله رو قبلاً کامل کردی!
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
              برای گرفتن ستاره بیشتر، امتیاز بالاتری بگیر
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={onClose}
            style={{ background: '#f0eeff', color: 'var(--primary)', width: '50%' }}>
            🔄 دوباره
          </button>
          <button className="btn btn-primary" onClick={onHome} style={{ width: '50%' }}>
            🏠 خانه
          </button>
        </div>
      </motion.div>
    </div>
  )
}

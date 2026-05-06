import { motion } from 'framer-motion'
import Confetti from 'react-confetti'
import { useEffect, useState } from 'react'

interface Props {
  stars: number
  coins: number
  onClose: () => void
  onHome: () => void
}

export default function RewardModal({ stars, coins, onClose, onHome }: Props) {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <Confetti width={size.w} height={size.h} recycle={false} numberOfPieces={200} />
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        style={{ background: 'white', borderRadius: 24, padding: 32, textAlign: 'center', maxWidth: 320, width: '100%' }}>

        <div style={{ fontSize: '4rem', marginBottom: 8 }}>
          {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
        </div>

        <h2 style={{ fontSize: 24, color: 'var(--primary)', marginBottom: 8 }}>
          {stars === 3 ? '🎉 عالی بودی!' : stars === 2 ? '👏 خوب بود!' : '💪 تلاش کن!'}
        </h2>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, margin: '20px 0',
          background: '#f7fafc', borderRadius: 16, padding: '16px' }}>
          <div>
            <div style={{ fontSize: '2rem' }}>⭐</div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>+{stars}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>ستاره</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem' }}>💎</div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>+{coins}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>الماس</div>
          </div>
        </div>

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

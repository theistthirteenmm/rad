import { motion } from 'framer-motion'
import type { LevelDef } from '../lib/levels'
import type { SubjectProgress } from '../hooks/useLevelProgress'

interface Props {
  levels: LevelDef[]
  progress: SubjectProgress
  color: string
  onPlay: (level: LevelDef) => void
}

function Stars({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <span style={{ fontSize: 14, letterSpacing: 2 }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ color: i < count ? '#FFB703' : '#e2e8f0' }}>★</span>
      ))}
    </span>
  )
}

export default function LevelMap({ levels, progress, color, onPlay }: Props) {
  const isUnlocked = (idx: number): boolean => {
    if (idx === 0) return true
    const prev = levels[idx - 1]
    if (prev.comingSoon) return false
    return !!progress[prev.gameType]?.completed
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* connecting line */}
      <div style={{
        position: 'absolute', right: 35, top: 40, bottom: 40,
        width: 3, background: 'linear-gradient(180deg, ' + color + '60, #e2e8f060)',
        borderRadius: 2, zIndex: 0,
      }} />

      {levels.map((lvl, i) => {
        const rec = progress[lvl.gameType]
        const done = !!rec?.completed
        const unlocked = isUnlocked(i)
        const isNext = !done && unlocked && !lvl.comingSoon
        const locked = !unlocked && !lvl.comingSoon

        return (
          <motion.div key={lvl.gameType}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            style={{ position: 'relative', zIndex: 1, marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 14 }}>

            {/* Level circle */}
            <motion.div
              animate={isNext ? { scale: [1, 1.08, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{
                width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                fontSize: locked ? '1.4rem' : '1.6rem',
                background: done ? color
                  : isNext ? color + '20'
                  : lvl.comingSoon ? '#f5f5f5'
                  : '#f0f0f0',
                border: `3px solid ${done ? color : isNext ? color : lvl.comingSoon ? '#ddd' : '#e2e8f0'}`,
                boxShadow: isNext ? `0 0 0 4px ${color}25` : 'none',
                color: done ? 'white' : locked ? '#ccc' : lvl.comingSoon ? '#bbb' : color,
              }}>
              {locked ? '🔒' : lvl.icon}
              {!locked && !lvl.comingSoon && (
                <div style={{ fontSize: 9, fontWeight: 700, marginTop: 1, opacity: 0.7 }}>
                  {i + 1}
                </div>
              )}
            </motion.div>

            {/* Content card */}
            <div onClick={() => !locked && !lvl.comingSoon && onPlay(lvl)}
              style={{
                flex: 1, borderRadius: 16, padding: '12px 14px',
                background: done ? color + '10'
                  : isNext ? 'white'
                  : lvl.comingSoon ? '#fafafa'
                  : '#f5f5f5',
                border: `2px solid ${done ? color + '40' : isNext ? color + '60' : lvl.comingSoon ? '#eee' : '#e8e8e8'}`,
                cursor: locked || lvl.comingSoon ? 'default' : 'pointer',
                opacity: locked ? 0.55 : 1,
                boxShadow: isNext ? '0 4px 12px ' + color + '25' : 'none',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 15,
                      color: done ? color : locked ? '#bbb' : lvl.comingSoon ? '#aaa' : 'var(--text)' }}>
                      مرحله {i + 1} · {lvl.title}
                    </span>
                    {lvl.timerSeconds && !locked && !lvl.comingSoon && (
                      <span style={{ fontSize: 10, background: '#FF6584', color: 'white',
                        borderRadius: 6, padding: '1px 5px', fontWeight: 600 }}>
                        ⏱ {lvl.timerSeconds}s
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: lvl.comingSoon ? '#bbb' : 'var(--text-light)' }}>
                    {lvl.comingSoon ? '🔮 در حال تولید...' : lvl.desc}
                  </div>
                  {done && rec && (
                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Stars count={rec.stars} />
                      <span style={{ fontSize: 11, color: 'var(--text-light)' }}>
                        بهترین: {rec.best_score} امتیاز
                      </span>
                    </div>
                  )}
                </div>

                {/* Action */}
                {isNext && (
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{
                      background: color, color: 'white', borderRadius: 12,
                      padding: '6px 14px', fontSize: 13, fontWeight: 700,
                      flexShrink: 0, marginRight: 4,
                    }}>
                    بازی
                  </motion.div>
                )}
                {done && (
                  <div style={{ color: color, fontSize: 20, flexShrink: 0 }}>✓</div>
                )}
                {lvl.comingSoon && (
                  <div style={{ fontSize: 18, flexShrink: 0 }}>🔮</div>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

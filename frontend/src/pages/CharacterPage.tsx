import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { updateUser } from '../lib/auth'

const AVATARS = ['🦁', '🐯', '🐻', '🦊', '🐼', '🐸', '🦋', '🐬']
const ACCESSORIES = [
  { id: 'hat1', emoji: '🎩', name: 'کلاه', cost: 10 },
  { id: 'hat2', emoji: '👑', name: 'تاج', cost: 20 },
  { id: 'glasses', emoji: '🕶️', name: 'عینک', cost: 15 },
  { id: 'star', emoji: '⭐', name: 'ستاره طلایی', cost: 30 },
  { id: 'medal', emoji: '🏅', name: 'مدال', cost: 25 },
  { id: 'rainbow', emoji: '🌈', name: 'رنگین‌کمان', cost: 40 },
]

export default function CharacterPage() {
  const nav = useNavigate()
  const student = useStore(s => s.student)
  const setUser = useStore(s => s.setUser)

  const avatarVal = student?.avatar || 'avatar0'
  const isPhoto = avatarVal.startsWith('data:')
  const [selectedAvatar, setSelectedAvatar] = useState(
    isPhoto ? 0 : parseInt(avatarVal.replace('avatar', '') || '0')
  )
  const [items, setItems] = useState<string[]>(
    () => (student?.character_items as string[] | null) ?? []
  )
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!student) return null

  const currentAvatarVal = student.avatar || 'avatar0'
  const currentIsPhoto = currentAvatarVal.startsWith('data:')

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 128
      canvas.height = 128
      const ctx = canvas.getContext('2d')!
      const size = Math.min(img.width, img.height)
      const sx = (img.width - size) / 2
      const sy = (img.height - size) / 2
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 128, 128)
      URL.revokeObjectURL(url)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      const updated = { ...student, avatar: dataUrl }
      setUser(updated)
      await updateUser(student.id, { avatar: dataUrl })
      setUploading(false)
    }
    img.onerror = () => { URL.revokeObjectURL(url); setUploading(false) }
    img.src = url
    e.target.value = ''
  }

  const buy = async (acc: typeof ACCESSORIES[0]) => {
    if (student.coins < acc.cost) { alert('الماس کافی نداری!'); return }
    if (items.includes(acc.id)) { alert('قبلاً خریدی!'); return }
    const newItems = [...items, acc.id]
    setItems(newItems)
    const updated = { ...student, coins: student.coins - acc.cost, character_items: newItems }
    setUser(updated)
    await updateUser(student.id, { coins: updated.coins, character_items: newItems })
  }

  const changeAvatar = async (idx: number) => {
    setSelectedAvatar(idx)
    const updated = { ...student, avatar: `avatar${idx}` }
    setUser(updated)
    await updateUser(student.id, { avatar: `avatar${idx}` })
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => nav('/')} style={{ background: 'none', fontSize: 20 }}>←</button>
        <h1 style={{ fontSize: 20, color: 'var(--primary)' }}>🎭 شخصیت من</h1>
      </div>

      {/* Character display */}
      <motion.div className="card" style={{ textAlign: 'center', marginBottom: 20,
        background: 'linear-gradient(135deg, #f0eeff, #fff0f3)' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
          {currentIsPhoto ? (
            <img src={currentAvatarVal}
              style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover',
                border: '4px solid var(--primary)', display: 'block' }} />
          ) : (
            <div style={{ fontSize: '6rem', lineHeight: 1 }}>{AVATARS[selectedAvatar]}</div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)',
              color: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30,
              fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
            {uploading ? '⏳' : '📷'}
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" capture="user"
          style={{ display: 'none' }} onChange={handlePhotoCapture} />

        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {items.map(id => {
            const acc = ACCESSORIES.find(a => a.id === id)
            return acc ? <span key={id} style={{ fontSize: '1.5rem' }}>{acc.emoji}</span> : null
          })}
        </div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{student.name}</div>
        <div style={{ color: 'var(--text-light)', fontSize: 13 }}>سطح {student.level}</div>
        <div style={{ marginTop: 8, color: '#FF9500', fontWeight: 600 }}>💎 {student.coins} الماس</div>
      </motion.div>

      {/* Avatar selection */}
      <h3 style={{ marginBottom: 12, fontSize: 15 }}>انتخاب آواتار:</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {AVATARS.map((emoji, i) => (
          <motion.button key={i} whileTap={{ scale: 0.9 }} onClick={() => changeAvatar(i)}
            style={{
              fontSize: '2.5rem', padding: 12, borderRadius: 16, cursor: 'pointer',
              border: !currentIsPhoto && selectedAvatar === i ? '3px solid var(--primary)' : '3px solid transparent',
              background: !currentIsPhoto && selectedAvatar === i ? '#f0eeff' : '#f7fafc',
              transition: 'all 0.2s'
            }}>
            {emoji}
          </motion.button>
        ))}
      </div>

      {/* Shop */}
      <h3 style={{ marginBottom: 12, fontSize: 15 }}>🛍️ فروشگاه اکسسوری:</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {ACCESSORIES.map(acc => {
          const owned = items.includes(acc.id)
          const canBuy = student.coins >= acc.cost
          return (
            <motion.button key={acc.id} whileTap={{ scale: 0.95 }} onClick={() => buy(acc)}
              style={{
                padding: '14px', borderRadius: 16, cursor: owned ? 'default' : canBuy ? 'pointer' : 'not-allowed',
                background: owned ? '#f0fff9' : '#f7fafc',
                border: `2px solid ${owned ? '#06D6A0' : '#e2e8f0'}`,
                opacity: !owned && !canBuy ? 0.5 : 1
              }}>
              <div style={{ fontSize: '2rem' }}>{acc.emoji}</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 4 }}>{acc.name}</div>
              <div style={{ fontSize: 13, color: owned ? '#06D6A0' : '#FF9500', marginTop: 2 }}>
                {owned ? '✓ خریداری شده' : `💎 ${acc.cost} الماس`}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

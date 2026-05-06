import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type User, updateUser, logout as authLogout } from '../lib/auth'
import { clearToken } from '../lib/apiClient'

export type { User }
export type Student = User

interface AppStore {
  user: User | null
  student: User | null
  setUser: (u: User) => void
  updateRewards: (stars: number, coins: number) => void
  logout: () => void
  offlineQueue: any[]
  addToQueue: (item: any) => void
  clearQueue: () => void
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      student: null,
      offlineQueue: [],

      setUser: (user) => set({
        user,
        student: user.role === 'student' ? user : null,
      }),

      updateRewards: (stars, coins) =>
        set((state) => {
          if (!state.user || state.user.role !== 'student') return state
          const newStars = state.user.stars + stars
          const newCoins = state.user.coins + coins
          const newLevel = Math.floor(newStars / 50) + 1
          const updated = { ...state.user, stars: newStars, coins: newCoins, level: newLevel }
          updateUser(updated.id, { stars: newStars, coins: newCoins, level: newLevel })
          return { user: updated, student: updated }
        }),

      logout: () => {
        clearToken()
        set({ user: null, student: null })
      },

      addToQueue: (item) =>
        set((state) => ({ offlineQueue: [...state.offlineQueue, item] })),

      clearQueue: () => set({ offlineQueue: [] }),
    }),
    { name: 'radin-store' }
  )
)

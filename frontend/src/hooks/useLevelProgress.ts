import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/apiClient'

export interface LevelRecord {
  stars: number
  best_score: number
  completed: boolean
}

export type SubjectProgress = Record<string, LevelRecord>

export function useLevelProgress(subject: string) {
  const [progress, setProgress] = useState<SubjectProgress>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    api.get(`/levels/${subject}`)
      .then(r => setProgress(r.data))
      .catch(() => setProgress({}))
      .finally(() => setLoading(false))
  }, [subject])

  useEffect(() => { load() }, [load])

  const saveLevel = useCallback(async (gameType: string, stars: number, score: number) => {
    try {
      await api.post('/levels/complete', { subject, game_type: gameType, stars, score })
      setProgress(prev => {
        const old = prev[gameType]
        return {
          ...prev,
          [gameType]: {
            stars: Math.max(old?.stars ?? 0, stars),
            best_score: Math.max(old?.best_score ?? 0, score),
            completed: stars > 0 || old?.completed,
          }
        }
      })
    } catch {}
  }, [subject])

  return { progress, loading, saveLevel, reload: load }
}

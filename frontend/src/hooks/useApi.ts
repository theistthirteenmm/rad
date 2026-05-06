import axios from 'axios'
import { useStore } from '../store/useStore'

const API = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export const api = {
  createStudent: (data: any) => API.post('/students/', data),
  getStudent: (id: number) => API.get(`/students/${id}`),
  listStudents: () => API.get('/students/'),
  saveSession: (studentId: number, data: any) =>
    API.post(`/progress/${studentId}/session`, data),
  getDashboard: (studentId: number) =>
    API.get(`/progress/${studentId}/dashboard`),
  getFarsiWords: (level?: number) =>
    API.get('/games/farsi/words', { params: { level } }),
  getFarsiSentences: (level?: number) =>
    API.get('/games/farsi/sentences', { params: { level } }),
  getFarsiAlphabet: () => API.get('/games/farsi/alphabet'),
  getMathProblems: (level?: number, count?: number) =>
    API.get('/games/math/problems', { params: { level, count } }),
  getScienceTopic: (topic: string) => API.get(`/games/science/${topic}`),
  getQuranVerses: () => API.get('/games/quran/verses'),
  updateStudent: (id: number, data: any) => API.patch(`/students/${id}`, data),
}

export function useSaveSession() {
  const { student, addToQueue, updateRewards } = useStore()

  return async (sessionData: any) => {
    updateRewards(sessionData.stars_earned, sessionData.coins_earned)
    if (!student) return

    try {
      await api.saveSession(parseInt(student.id), sessionData)
    } catch {
      addToQueue({ studentId: student.id, ...sessionData })
    }
  }
}

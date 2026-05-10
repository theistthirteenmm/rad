import axios from 'axios'
import { useStore } from '../store/useStore'

const API = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('radin_token')
  if (token && cfg.headers) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
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

  // ─── Accounting ──────────────────────────────────────────────────
  getInvoices: (params?: { kind?: string; status?: string; search?: string }) =>
    API.get('/accounting/invoices', { params }),
  getAccountingSummary: () => API.get('/accounting/summary'),
  createInvoice: (data: any) => API.post('/accounting/invoices', data),
  bulkCreateInvoices: (data: any[]) => API.post('/accounting/invoices/bulk', data),
  updateInvoice: (id: number, data: any) => API.put(`/accounting/invoices/${id}`, data),
  deleteInvoice: (id: number) => API.delete(`/accounting/invoices/${id}`),
  deleteManyInvoices: (ids: number[]) => API.delete('/accounting/invoices', { data: ids }),
}

export function useSaveSession() {
  const { student, addToQueue, updateRewards } = useStore()

  return async (sessionData: any): Promise<{ stars_earned: number; coins_earned: number }> => {
    if (!student) {
      // آفلاین — از مقادیر ورودی استفاده کن (بدون سقف)
      updateRewards(sessionData.stars_earned, sessionData.coins_earned)
      addToQueue({ studentId: student, ...sessionData })
      return { stars_earned: sessionData.stars_earned, coins_earned: sessionData.coins_earned }
    }

    try {
      const res = await api.saveSession(parseInt(student.id), sessionData)
      // backend مقدار واقعی (با سقف) رو برمی‌گردونه
      const actual_stars = res.data.stars_earned
      const actual_coins = res.data.coins_earned
      updateRewards(actual_stars, actual_coins)
      return { stars_earned: actual_stars, coins_earned: actual_coins }
    } catch {
      // آفلاین fallback
      updateRewards(sessionData.stars_earned, sessionData.coins_earned)
      addToQueue({ studentId: student.id, ...sessionData })
      return { stars_earned: sessionData.stars_earned, coins_earned: sessionData.coins_earned }
    }
  }
}

import { api, setToken, clearToken } from './apiClient'

export type Role = 'student' | 'parent' | 'teacher' | 'admin'

export interface User {
  id: string
  username: string
  passwordHash: string
  role: Role
  name: string
  school: string
  school_id: string
  grade: string
  grade_id: string
  class_name: string
  class_id: string
  teacher_name: string
  avatar: string
  stars: number
  coins: number
  level: number
  child_name?: string
  character_items: string[]
  createdAt: number
}

export async function login(
  username: string,
  password: string,
  role: Role,
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  try {
    const { data } = await api.post('/auth/login', { username, password, role })
    setToken(data.access_token)
    return { ok: true, user: data.user as User }
  } catch (e: any) {
    return { ok: false, error: e.response?.data?.detail || 'خطا در ورود' }
  }
}

export async function register(
  payload: Omit<User, 'id' | 'passwordHash' | 'createdAt'> & { password: string; school_name?: string }
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  try {
    const { data } = await api.post('/auth/register', {
      username: payload.username,
      password: payload.password,
      role: payload.role,
      name: payload.name,
      school_id: payload.school_id || null,
      grade_id: payload.grade_id || null,
      class_id: payload.class_id || null,
      teacher_name: payload.teacher_name,
      avatar: payload.avatar,
      child_name: payload.child_name || null,
      school_name: payload.school_name || null,
    })
    setToken(data.access_token)
    return { ok: true, user: data.user as User }
  } catch (e: any) {
    return { ok: false, error: e.response?.data?.detail || 'خطا در ثبت‌نام' }
  }
}

export async function getAll(): Promise<User[]> {
  try {
    const { data } = await api.get('/users/')
    return data as User[]
  } catch { return [] }
}

export async function getAllStudents(): Promise<User[]> {
  try {
    const { data } = await api.get('/users/', { params: { role: 'student' } })
    return data as User[]
  } catch { return [] }
}

export async function getAllTeachers(): Promise<User[]> {
  try {
    const { data } = await api.get('/users/', { params: { role: 'teacher' } })
    return data as User[]
  } catch { return [] }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
  try {
    await api.patch(`/users/${id}`, updates)
  } catch { /* best-effort */ }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    await api.delete(`/users/${id}`)
    return true
  } catch { return false }
}

export async function changeCredentials(
  _id: string,
  newUsername: string,
  newPassword: string,
): Promise<{ ok: true; user?: User } | { ok: false; error: string }> {
  try {
    const { data } = await api.patch('/auth/credentials', {
      new_username: newUsername,
      new_password: newPassword,
    })
    return { ok: true, user: data.user as User }
  } catch (e: any) {
    return { ok: false, error: e.response?.data?.detail || 'خطا در تغییر اطلاعات' }
  }
}

export async function findChildOf(parent: User): Promise<User | null> {
  try {
    const { data } = await api.get('/users/child')
    return data as User | null
  } catch { return null }
}

export async function getStudentsInClass(
  schoolId: string,
  gradeId: string,
  classId: string,
): Promise<User[]> {
  try {
    // public endpoint — no auth needed (used during parent registration)
    const { data } = await api.get('/users/public/students', {
      params: { school_id: schoolId, grade_id: gradeId, class_id: classId },
    })
    return data as User[]
  } catch { return [] }
}

export function logout() {
  clearToken()
}

import { api } from './apiClient'

export interface ClassRoom {
  id: string
  name: string
}

export interface Grade {
  id: string
  name: string
  classes: ClassRoom[]
}

export interface School {
  id: string
  name: string
  grades: Grade[]
}

export async function getSchools(): Promise<School[]> {
  try {
    const { data } = await api.get('/schools/')
    return data as School[]
  } catch { return [] }
}

export async function getSchool(schoolId: string): Promise<School | null> {
  try {
    const { data } = await api.get(`/schools/${schoolId}`)
    return data as School
  } catch { return null }
}

export async function addGrade(
  schoolId: string,
  gradeName: string,
): Promise<{ ok: true; school: School } | { ok: false; error: string }> {
  try {
    const { data } = await api.post(`/schools/${schoolId}/grades`, { name: gradeName })
    return { ok: true, school: data as School }
  } catch (e: any) {
    return { ok: false, error: e.response?.data?.detail || 'خطا در افزودن پایه' }
  }
}

export async function deleteGrade(schoolId: string, gradeId: string): Promise<School | null> {
  try {
    const { data } = await api.delete(`/schools/${schoolId}/grades/${gradeId}`)
    return data as School
  } catch { return null }
}

export async function addClass(
  schoolId: string,
  gradeId: string,
  className: string,
): Promise<{ ok: true; school: School } | { ok: false; error: string }> {
  try {
    const { data } = await api.post(`/schools/${schoolId}/grades/${gradeId}/classes`, { name: className })
    return { ok: true, school: data as School }
  } catch (e: any) {
    return { ok: false, error: e.response?.data?.detail || 'خطا در افزودن کلاس' }
  }
}

export async function deleteClass(
  schoolId: string,
  gradeId: string,
  classId: string,
): Promise<School | null> {
  try {
    const { data } = await api.delete(`/schools/${schoolId}/grades/${gradeId}/classes/${classId}`)
    return data as School
  } catch { return null }
}

export function getGrades(schoolId: string, schools: School[]): Grade[] {
  return schools.find(s => s.id === schoolId)?.grades ?? []
}

export function getClasses(gradeId: string, grades: Grade[]): ClassRoom[] {
  return grades.find(g => g.id === gradeId)?.classes ?? []
}

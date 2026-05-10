// تعریف محتوای موجود به ازای هر پایه تحصیلی
// هر پایه که اضافه بشه، اینجا آپدیت می‌شه

export interface GradeAvailability {
  learn: string[]   // درس‌های یادگیری موجود
  games: string[]   // درس‌های بازی موجود
}

// کلیدها: substring‌هایی که در نام پایه می‌آیند
const GRADE_CONTENT: Record<string, GradeAvailability> = {
  'اول': {
    learn: ['farsi', 'math', 'science', 'quran', 'writing'],
    games: ['farsi', 'math', 'science', 'quran', 'writing'],
  },
  // پایه‌های بعدی وقتی آماده شدند اینجا اضافه می‌شوند:
  // 'دوم': { learn: [], games: [] },
  // 'سوم': { learn: [], games: [] },
}

function findGradeKey(grade: string): string | null {
  if (!grade) return null
  for (const key of Object.keys(GRADE_CONTENT)) {
    if (grade.includes(key)) return key
  }
  return null
}

export function isSubjectAvailable(grade: string, subject: string, mode: 'learn' | 'games'): boolean {
  const key = findGradeKey(grade)
  if (!key) return false
  return GRADE_CONTENT[key][mode].includes(subject)
}

export function hasAnyContent(grade: string): boolean {
  return findGradeKey(grade) !== null
}

export function getGradeLabel(grade: string): string {
  if (!grade) return ''
  if (grade.includes('اول'))  return 'پایه اول'
  if (grade.includes('دوم'))  return 'پایه دوم'
  if (grade.includes('سوم'))  return 'پایه سوم'
  if (grade.includes('چهارم')) return 'پایه چهارم'
  if (grade.includes('پنجم')) return 'پایه پنجم'
  if (grade.includes('ششم'))  return 'پایه ششم'
  return grade
}

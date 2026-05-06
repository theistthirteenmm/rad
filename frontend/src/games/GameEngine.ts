// Standard contract every game must satisfy.
// Add a new game = implement this interface, nothing else changes.

export interface GameResult {
  score: number      // 0-100
  stars: number      // 0-3
  coins: number      // earned this round
  duration: number   // seconds
  correct: number    // correct answers
  total: number      // total questions
}

export interface GameProps<TConfig = Record<string, unknown>> {
  config?: TConfig
  difficulty?: 1 | 2 | 3
  onComplete: (result: GameResult) => void
  onBack: () => void
}

// Helper: convert raw score to stars (0-3)
export function scoreToStars(correct: number, total: number): number {
  if (total === 0) return 0
  const pct = correct / total
  if (pct >= 0.9) return 3
  if (pct >= 0.6) return 2
  if (pct >= 0.3) return 1
  return 0
}

// Helper: calculate coins from stars
export function starsToCoins(stars: number): number {
  return stars * 5
}

// Subject metadata — single source of truth for colors, labels, routes
export const SUBJECTS = [
  { id: 'farsi',   label: 'فارسی',  emoji: '📖', color: '#FF6584', path: '/farsi'   },
  { id: 'math',    label: 'ریاضی',  emoji: '🔢', color: '#6C63FF', path: '/math'    },
  { id: 'science', label: 'علوم',   emoji: '🌱', color: '#06D6A0', path: '/science' },
  { id: 'quran',   label: 'قرآن',   emoji: '📿', color: '#FFB703', path: '/quran'   },
  { id: 'writing', label: 'نگارش',  emoji: '✏️', color: '#4ECDC4', path: '/writing' },
] as const

export type SubjectId = typeof SUBJECTS[number]['id']

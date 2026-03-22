import type { OperationType, Difficulty, GameMode, Grade } from './question'

export interface SessionRecord {
  id: string
  userId: string
  timestamp: number
  grade: Grade
  operation: OperationType
  difficulty: Difficulty
  mode: GameMode
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  score: number
  timeTakenSeconds: number
  bestStreak: number
  isHighScore: boolean
}

export interface HighScoreEntry {
  score: number
  date: number
  sessionId: string
  timeTakenSeconds?: number // for fixed mode tiebreaking (lower = better)
}

export type HighScoreKey = `${Grade}_${OperationType}_${Difficulty}_${GameMode}`

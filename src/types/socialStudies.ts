import type { Grade } from './question'

export interface SocialStudiesQuestion {
  id: string
  grade: Grade          // '3'–'12'
  question: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  topic: string         // e.g. 'Colorado History', 'US Civics'
  standard: 'US' | 'Colorado' | 'both'
}

export interface SocialStudiesAnsweredQuestion {
  question: SocialStudiesQuestion
  selectedIndex: number | null
  isCorrect: boolean
  answeredAt: number
}

export interface SocialStudiesSession {
  id: string
  userId: string
  timestamp: number
  grade: Grade
  subject: 'socialStudies'
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  score: number
  timeTakenSeconds: number
  bestStreak: number
  isHighScore: boolean
  challengeId?: string
}

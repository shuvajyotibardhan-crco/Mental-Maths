import type { Grade } from './question'

export interface ScienceQuestion {
  id: string
  grade: Grade           // '5'–'12' (the grade level of this question)
  question: string
  options: [string, string, string, string]
  correctIndices: number[]   // sorted, 1–4 correct option indices
  topic: string              // e.g. 'Biology', 'Chemistry', 'Physics', 'Earth Science'
  imageUrl?: string          // optional diagram/image shown above the question
}

export interface ScienceAnsweredQuestion {
  question: ScienceQuestion
  selectedIndices: number[]
  isCorrect: boolean
  answeredAt: number
}

export interface ScienceSession {
  id: string
  userId: string
  timestamp: number
  grade: Grade
  subject: 'science'
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  score: number
  timeTakenSeconds: number
  bestStreak: number
  isHighScore: boolean
  challengeId?: string
}

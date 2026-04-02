import type { Grade, OperationType, Difficulty, GameMode, Question } from './question'

export type ChallengeStatus = 'waiting' | 'playing' | 'finished'

export interface ChallengeConfig {
  grade: Grade
  operation: OperationType
  difficulty: Difficulty
  mode: GameMode
}

export interface ChallengePlayer {
  username: string
  name: string
  avatar: string
  ready: boolean
  score: number
  correctAnswers: number
  totalAnswered: number
  bestStreak: number
  finished: boolean
  timeTakenSeconds: number | null
}

export interface Challenge {
  gameCode: string
  hostId: string
  status: ChallengeStatus
  createdAt: number
  startedAt: number | null
  finishedAt: number | null
  config: ChallengeConfig
  questions: Question[]
  players: Record<string, ChallengePlayer>
}

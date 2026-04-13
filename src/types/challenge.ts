import type { Grade, OperationType, Difficulty, GameMode, Question } from './question'
import type { SocialStudiesQuestion } from './socialStudies'

export type ChallengeStatus = 'waiting' | 'playing' | 'finished'
export type ChallengeSubject = 'mentalMaths' | 'socialStudies'

export interface ChallengeConfig {
  /**
   * Which subject this challenge is for. Optional for backward compatibility —
   * existing challenge docs without this field are treated as 'mentalMaths'.
   */
  subject?: ChallengeSubject
  grade: Grade
  /** Mental Maths only. Null / absent for Social Studies challenges. */
  operation?: OperationType | null
  /** Mental Maths only. Null / absent for Social Studies challenges. */
  difficulty?: Difficulty | null
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
  /** Question array — type depends on config.subject:
   *  'mentalMaths'   → Question[]
   *  'socialStudies' → SocialStudiesQuestion[]
   */
  questions: Question[] | SocialStudiesQuestion[]
  players: Record<string, ChallengePlayer>
}

import type { Grade, OperationType, Difficulty, GameMode, Question } from './question'
import type { SocialStudiesQuestion } from './socialStudies'
import type { WOMWord } from './wordOMeter'

export type ChallengeStatus = 'waiting' | 'playing' | 'finished'
export type ChallengeSubject = 'mentalMaths' | 'socialStudies' | 'wordOMeter'

export interface ChallengeConfig {
  /**
   * Which subject this challenge is for. Optional for backward compatibility —
   * existing challenge docs without this field are treated as 'mentalMaths'.
   */
  subject?: ChallengeSubject
  grade: Grade
  /** Mental Maths only. Null / absent for other subjects. */
  operation?: OperationType | null
  /** Mental Maths only. Null / absent for other subjects. */
  difficulty?: Difficulty | null
  mode: GameMode
  /** Word-O-Meter only. */
  letterCount?: number
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
  lastActiveAt?: number
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
   *  'wordOMeter'    → WOMWord[] (single element)
   */
  questions: Question[] | SocialStudiesQuestion[] | WOMWord[]
  players: Record<string, ChallengePlayer>
}

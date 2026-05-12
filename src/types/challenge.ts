import type { Grade, OperationType, Difficulty, GameMode, Question } from './question'
import type { SocialStudiesQuestion } from './socialStudies'
import type { WOMWord } from './wordOMeter'
import type { ScienceQuestion } from './science'
import type { WOMCreatorState } from './womCreator'

export type ChallengeStatus = 'waiting' | 'playing' | 'finished'
export type ChallengeSubject = 'mentalMaths' | 'socialStudies' | 'wordOMeter' | 'science' | 'womCreator'

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
  /** Word-O-Meter only. Letter count for the word (3–8). */
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
   *  'wordOMeter'    → [WOMWord] (single word)
   *  'science'       → ScienceQuestion[]
   *  'womCreator'    → [] (empty; words created in-game)
   */
  questions: Question[] | SocialStudiesQuestion[] | WOMWord[] | ScienceQuestion[]
  players: Record<string, ChallengePlayer>
  /** Only present when config.subject === 'womCreator'. */
  womCreatorState?: WOMCreatorState
}

import type { Grade, GameMode } from './question'
import type { WOMWord, WOMHintType } from './wordOMeter'

export interface WOMCreatorRound {
  creatorId: string
  word: string | null        // UPPERCASE; null until creator submits
  letterCount: number | null // null until creator submits
  wordObj: WOMWord | null    // full word object for hints; null until creator submits
}

export interface WOMCreatorGuessState {
  guesses: string[]          // UPPERCASE guessed words in submission order
  won: boolean
  passed: boolean
  hintsUsed: WOMHintType[]
  score: number              // guesser score for this round (0 if lost/passed)
  done: boolean              // true when won || passed || guesses.length === letterCount
}

export interface WOMCreatorState {
  roundOrder: string[]       // UIDs in creation order; shuffled once at game start
  currentRound: number       // 0-indexed; increments when all guessers done
  rounds: Record<string, WOMCreatorRound>
  progress: Record<string, Record<string, WOMCreatorGuessState>>
  // key = round index string → guesser UID → their guess state
}

export interface WOMCreatorSession {
  id: string
  userId: string
  timestamp: number
  grade: Grade
  subject: 'womCreator'
  challengeId: string
  totalRounds: number
  guesserScore: number
  creatorBonus: number
  totalScore: number
  roundsWon: number
  operation: null
  difficulty: null
  mode: GameMode
}

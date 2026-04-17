import type { Grade } from './question'

export interface WOMWord {
  word: string           // UPPERCASE
  letterCount: number    // 3–8
  grade: Grade           // grade this word is assigned to in the pool
  meanings: string[]     // 1–2 definitions
  partOfSpeech: string[] // e.g. ['noun', 'verb']
  synonyms: string[]     // 1–3 synonyms
  antonyms: string[]     // 0–2 antonyms
  blend?: string         // 7–8 letter words only: a notable blend/pattern hint
}

export type WOMTileState = 'empty' | 'correct' | 'present' | 'absent' | 'hinted'

export interface WOMTile {
  letter: string
  state: WOMTileState
}

export type WOMHintType =
  | 'partOfSpeech'
  | 'vowelCount'
  | 'synonym'
  | 'antonym'
  | 'revealFirst'
  | 'revealLast'
  | 'revealMiddle'
  | 'commonBlend'

export interface WOMHintResult {
  type: WOMHintType
  text: string
}

export interface WOMSession {
  id: string
  userId: string
  timestamp: number
  grade: Grade
  subject: 'wordOMeter'
  word: string
  letterCount: number
  won: boolean
  attemptsUsed: number
  maxAttempts: number
  hintsUsed: number
  score: number
  timeTakenSeconds: number
  challengeId?: string
}

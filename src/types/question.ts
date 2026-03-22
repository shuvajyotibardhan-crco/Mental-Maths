export type OperationType =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'percentage'
  | 'squareRoot'
  | 'power'
  | 'mix'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type Grade = 'KG' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'

export type GameMode = 'timed' | 'fixed'

export interface Question {
  id: string
  displayString: string
  correctAnswer: number
  operation: OperationType
  difficulty: Difficulty
}

export interface AnsweredQuestion extends Question {
  userAnswer: number | null
  isCorrect: boolean
  responseTimeMs: number
  answeredAt: number
}

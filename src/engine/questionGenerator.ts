import type { Question, OperationType, Difficulty, Grade } from '../types'
import { getGradeConfig } from '../constants/gradeConfig'

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

// Simple percentages for easy difficulty
const EASY_PERCENTAGES = [10, 25, 50]
const EASY_PERCENT_BASES = [10, 20, 40, 50, 100, 200]

// Medium percentages
const MEDIUM_PERCENTAGES = [5, 10, 15, 20, 25, 30, 40, 50, 75]
const MEDIUM_PERCENT_BASES = [10, 20, 30, 40, 50, 60, 80, 100, 200]

// Perfect squares for square root questions
const EASY_SQUARES = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
const MEDIUM_SQUARES = [...EASY_SQUARES, 121, 144]
const HARD_SQUARES = [...MEDIUM_SQUARES, 169, 196, 225, 256, 289, 324, 361, 400]

function generateArithmeticQuestion(
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division',
  min: number,
  max: number,
  timeAllotted: number,
  difficulty: Difficulty,
): Question {
  let operand1: number
  let operand2: number
  let answer: number
  let display: string

  switch (operation) {
    case 'addition':
      operand1 = randomInt(min, max)
      operand2 = randomInt(min, max)
      answer = operand1 + operand2
      display = `${operand1} + ${operand2}`
      break

    case 'subtraction':
      operand1 = randomInt(min, max)
      operand2 = randomInt(min, max)
      // Ensure non-negative result
      if (operand2 > operand1) [operand1, operand2] = [operand2, operand1]
      answer = operand1 - operand2
      display = `${operand1} − ${operand2}`
      break

    case 'multiplication':
      operand1 = randomInt(min, max)
      operand2 = randomInt(min, max)
      answer = operand1 * operand2
      display = `${operand1} × ${operand2}`
      break

    case 'division':
      // Generate division that always has whole number result
      operand2 = randomInt(Math.max(min, 1), max)
      const quotient = randomInt(min, max)
      operand1 = operand2 * quotient
      answer = quotient
      display = `${operand1} ÷ ${operand2}`
      break
  }

  return {
    id: generateId(),
    displayString: `${display} = ?`,
    correctAnswer: answer!,
    operation,
    difficulty,
    timeAllotted,
  }
}

function generatePercentageQuestion(difficulty: Difficulty, timeAllotted: number): Question {
  let percentage: number
  let base: number

  switch (difficulty) {
    case 'easy':
      percentage = EASY_PERCENTAGES[randomInt(0, EASY_PERCENTAGES.length - 1)]!
      base = EASY_PERCENT_BASES[randomInt(0, EASY_PERCENT_BASES.length - 1)]!
      break
    case 'medium':
      percentage = MEDIUM_PERCENTAGES[randomInt(0, MEDIUM_PERCENTAGES.length - 1)]!
      base = MEDIUM_PERCENT_BASES[randomInt(0, MEDIUM_PERCENT_BASES.length - 1)]!
      break
    case 'hard':
      percentage = randomInt(1, 100)
      base = randomInt(10, 500)
      // Ensure whole number result
      while ((base * percentage) % 100 !== 0) {
        base = randomInt(10, 500)
      }
      break
  }

  const answer = (base! * percentage!) / 100

  return {
    id: generateId(),
    displayString: `${percentage}% of ${base} = ?`,
    correctAnswer: answer,
    operation: 'percentage',
    difficulty,
    timeAllotted,
  }
}

function generateSquareRootQuestion(difficulty: Difficulty, timeAllotted: number): Question {
  let squares: number[]
  switch (difficulty) {
    case 'easy':
      squares = EASY_SQUARES
      break
    case 'medium':
      squares = MEDIUM_SQUARES
      break
    case 'hard':
      squares = HARD_SQUARES
      break
  }

  const square = squares[randomInt(0, squares.length - 1)]!
  const answer = Math.sqrt(square)

  return {
    id: generateId(),
    displayString: `√${square} = ?`,
    correctAnswer: answer,
    operation: 'squareRoot',
    difficulty,
    timeAllotted,
  }
}

function generatePowerQuestion(difficulty: Difficulty, timeAllotted: number): Question {
  let base: number
  let exponent: number

  switch (difficulty) {
    case 'easy':
      base = randomInt(2, 5)
      exponent = 2
      break
    case 'medium':
      base = randomInt(2, 5)
      exponent = randomInt(2, 3)
      break
    case 'hard':
      base = randomInt(2, 10)
      exponent = randomInt(2, 3)
      break
  }

  const answer = Math.pow(base!, exponent!)

  return {
    id: generateId(),
    displayString: `${base}^${exponent} = ?`,
    correctAnswer: answer,
    operation: 'power',
    difficulty,
    timeAllotted,
  }
}

export function generateQuestion(
  grade: Grade,
  operation: OperationType,
  difficulty: Difficulty,
): Question {
  const config = getGradeConfig(grade)
  const diffConfig = config.difficulty[difficulty]
  const timeAllotted = diffConfig.timePerQuestion

  // If mix, pick a random operation from available ones
  let actualOperation = operation
  if (operation === 'mix') {
    const ops = config.operations
    actualOperation = ops[randomInt(0, ops.length - 1)]!
  }

  switch (actualOperation) {
    case 'addition':
    case 'subtraction':
    case 'multiplication':
    case 'division': {
      const range = diffConfig.ranges[actualOperation]!
      return generateArithmeticQuestion(actualOperation, range.min, range.max, timeAllotted, difficulty)
    }
    case 'percentage':
      return generatePercentageQuestion(difficulty, timeAllotted)
    case 'squareRoot':
      return generateSquareRootQuestion(difficulty, timeAllotted)
    case 'power':
      return generatePowerQuestion(difficulty, timeAllotted)
    default:
      // Fallback to addition
      return generateArithmeticQuestion('addition', 1, 10, timeAllotted, difficulty)
  }
}

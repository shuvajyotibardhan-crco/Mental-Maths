import type { Question, OperationType, Difficulty, Grade } from '../types'
import { getGradeConfig } from '../constants/gradeConfig'

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

// ══════════════════════════════════════════════
// PERCENTAGE, SQUARE ROOT, POWER configs
// Follow same 2×/3× scaling as arithmetic:
//   Within group: Medium = 2× Easy, Hard = 2× Medium
//   Across groups: Next group = 3× previous group
//
// For %, "harder" = more % values × larger bases (answer scales)
// For √, "harder" = larger perfect squares (√ of bigger numbers)
// For ^, "harder" = larger bases and/or higher exponents
//
// Key format: "{gradeGroup}_{difficulty}"
// ══════════════════════════════════════════════

interface PercentConfig { percents: number[]; maxBase: number }
interface PowerConfig { minBase: number; maxBase: number; minExp: number; maxExp: number }

// Percentage: base answer ≈ maxBase × avg% / 100
// 4-5 Easy baseline: simple %, base up to 100 → answers ~10-50
// 2× within: bases double. 3× across: bases triple.
const PERCENT_CONFIGS: Record<string, PercentConfig> = {
  // 4-5: Easy base=100, Med=200, Hard=400
  '4_easy':   { percents: [10, 25, 50], maxBase: 100 },
  '4_medium': { percents: [5, 10, 20, 25, 50, 75], maxBase: 200 },
  '4_hard':   { percents: [5, 10, 15, 20, 25, 30, 40, 50, 75], maxBase: 400 },
  // 6-8: 3× of 4-5 → Easy=300, Med=600, Hard=1200
  '6_easy':   { percents: [5, 10, 15, 20, 25, 50, 75], maxBase: 300 },
  '6_medium': { percents: [5, 10, 12, 15, 20, 25, 30, 40, 50, 75], maxBase: 600 },
  '6_hard':   { percents: [2, 5, 8, 10, 12, 15, 20, 25, 30, 33, 40, 50, 60, 75], maxBase: 1200 },
  // 9-10: 3× of 6-8 → Easy=900, Med=1800, Hard=3600
  '9_easy':   { percents: [5, 10, 12, 15, 20, 25, 30, 40, 50, 75], maxBase: 900 },
  '9_medium': { percents: [2, 5, 8, 10, 12, 15, 20, 25, 30, 33, 40, 50, 60, 75], maxBase: 1800 },
  '9_hard':   { percents: [1, 2, 3, 5, 8, 10, 12, 15, 20, 25, 30, 33, 40, 50, 60, 75, 80], maxBase: 3600 },
  // 11-12: 3× of 9-10 → Easy=2700, Med=5400, Hard=10800
  '11_easy':  { percents: [2, 5, 8, 10, 12, 15, 20, 25, 30, 33, 40, 50, 60, 75], maxBase: 2700 },
  '11_medium':{ percents: [1, 2, 3, 5, 8, 10, 12, 15, 20, 25, 30, 33, 40, 50, 60, 75, 80, 90], maxBase: 5400 },
  '11_hard':  { percents: [1, 2, 3, 4, 5, 8, 10, 12, 15, 20, 25, 30, 33, 40, 50, 60, 75, 80, 90], maxBase: 10800 },
}

// Square roots: max perfect square scales 2×/3×
// 4-5 Easy baseline: √1 to √100 (roots 1-10)
// 2× → up to √200, 3× → up to √300, etc.
// We use perfect squares up to the max value
function getSquaresUpTo(maxVal: number): number[] {
  const squares: number[] = []
  for (let i = 1; i * i <= maxVal; i++) {
    squares.push(i * i)
  }
  return squares
}

// Max square value per group/difficulty
// 4-5: E=100, M=200, H=400
// 6-8: E=300, M=600, H=1200
// 9-10: E=900, M=1800, H=3600
// 11-12: E=2700, M=5400, H=10800
const SQRT_MAX: Record<string, number> = {
  '4_easy': 100, '4_medium': 200, '4_hard': 400,
  '6_easy': 300, '6_medium': 600, '6_hard': 1200,
  '9_easy': 900, '9_medium': 1800, '9_hard': 3600,
  '11_easy': 2700, '11_medium': 5400, '11_hard': 10800,
}

// Powers: max answer scales 2×/3×
// 4-5 Easy baseline: 2²–5² (answers 4–25)
// 2× within: double max answer → larger bases/exponents
// 3× across: triple max answer
const POWER_CONFIGS: Record<string, PowerConfig> = {
  // 4-5: answers ~4-25, ~4-125, ~4-500
  '4_easy':   { minBase: 2, maxBase: 5, minExp: 2, maxExp: 2 },
  '4_medium': { minBase: 2, maxBase: 5, minExp: 2, maxExp: 3 },
  '4_hard':   { minBase: 2, maxBase: 8, minExp: 2, maxExp: 3 },
  // 6-8: 3× answers → larger bases
  '6_easy':   { minBase: 2, maxBase: 8, minExp: 2, maxExp: 3 },
  '6_medium': { minBase: 2, maxBase: 12, minExp: 2, maxExp: 3 },
  '6_hard':   { minBase: 3, maxBase: 15, minExp: 2, maxExp: 3 },
  // 9-10: 3× again
  '9_easy':   { minBase: 3, maxBase: 12, minExp: 2, maxExp: 3 },
  '9_medium': { minBase: 3, maxBase: 15, minExp: 2, maxExp: 4 },
  '9_hard':   { minBase: 5, maxBase: 20, minExp: 2, maxExp: 4 },
  // 11-12: 3× again
  '11_easy':  { minBase: 5, maxBase: 15, minExp: 2, maxExp: 4 },
  '11_medium':{ minBase: 5, maxBase: 20, minExp: 2, maxExp: 4 },
  '11_hard':  { minBase: 5, maxBase: 25, minExp: 2, maxExp: 5 },
}

// Map grade to config key prefix
function gradeToKey(grade: Grade): string {
  switch (grade) {
    case '4': case '5': return '4'
    case '6': case '7': case '8': return '6'
    case '9': case '10': return '9'
    case '11': case '12': return '11'
    default: return '4'
  }
}

function generateArithmeticQuestion(
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division',
  min: number,
  max: number,
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
  }
}

function generatePercentageQuestion(grade: Grade, difficulty: Difficulty): Question {
  const key = `${gradeToKey(grade)}_${difficulty}`
  const config = PERCENT_CONFIGS[key] ?? PERCENT_CONFIGS['4_easy']!
  const percentage = config.percents[randomInt(0, config.percents.length - 1)]!

  // Pick a random base up to maxBase, ensure whole number result
  let base = randomInt(1, Math.floor(config.maxBase / 10)) * 10  // round bases
  let attempts = 0
  while ((base * percentage) % 100 !== 0 && attempts < 50) {
    base = randomInt(1, Math.floor(config.maxBase / 10)) * 10
    attempts++
  }

  const answer = (base * percentage) / 100

  return {
    id: generateId(),
    displayString: `${percentage}% of ${base} = ?`,
    correctAnswer: answer,
    operation: 'percentage',
    difficulty,
  }
}

function generateSquareRootQuestion(grade: Grade, difficulty: Difficulty): Question {
  const key = `${gradeToKey(grade)}_${difficulty}`
  const maxVal = SQRT_MAX[key] ?? 100
  const squares = getSquaresUpTo(maxVal)
  const square = squares[randomInt(0, squares.length - 1)]!
  const answer = Math.sqrt(square)

  return {
    id: generateId(),
    displayString: `√${square} = ?`,
    correctAnswer: answer,
    operation: 'squareRoot',
    difficulty,
  }
}

function generatePowerQuestion(grade: Grade, difficulty: Difficulty): Question {
  const key = `${gradeToKey(grade)}_${difficulty}`
  const config = POWER_CONFIGS[key] ?? POWER_CONFIGS['4_easy']!
  const base = randomInt(config.minBase, config.maxBase)
  const exponent = randomInt(config.minExp, config.maxExp)
  const answer = Math.pow(base, exponent)

  return {
    id: generateId(),
    displayString: `${base}^${exponent} = ?`,
    correctAnswer: answer,
    operation: 'power',
    difficulty,
  }
}

export function generateQuestion(
  grade: Grade,
  operation: OperationType,
  difficulty: Difficulty,
): Question {
  const config = getGradeConfig(grade)
  const diffConfig = config.difficulty[difficulty]

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
      return generateArithmeticQuestion(actualOperation, range.min, range.max, difficulty)
    }
    case 'percentage':
      return generatePercentageQuestion(grade, difficulty)
    case 'squareRoot':
      return generateSquareRootQuestion(grade, difficulty)
    case 'power':
      return generatePowerQuestion(grade, difficulty)
    default:
      // Fallback to addition
      return generateArithmeticQuestion('addition', 1, 10, difficulty)
  }
}

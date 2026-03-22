import type { Question, OperationType, Difficulty, Grade } from '../types'
import { getGradeConfig } from '../constants/gradeConfig'

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

// Percentage configs by tier (range value from gradeConfig)
// Tier 1 (4-5 easy): simple percentages of round numbers
// Tier 2 (4-5 med, 6-8 easy): wider percentages, more bases
// Tier 3 (4-5 hard, 6-8 med, 9-10 easy): varied percentages
// Tier 4 (6-8 hard, 9-10 med+, 11-12): any percentage, large bases
const PERCENT_TIERS: Record<number, { percents: number[]; bases: number[] }> = {
  1: { percents: [10, 25, 50], bases: [10, 20, 40, 50, 100, 200] },
  2: { percents: [5, 10, 15, 20, 25, 30, 40, 50, 75], bases: [10, 20, 30, 40, 50, 60, 80, 100, 200] },
  3: { percents: [5, 10, 12, 15, 20, 25, 30, 33, 40, 50, 60, 75], bases: [20, 30, 50, 60, 80, 100, 150, 200, 300, 500] },
  4: { percents: [1, 2, 3, 5, 8, 10, 12, 15, 20, 25, 30, 33, 40, 50, 60, 75, 80, 90], bases: [50, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800, 1000] },
}

// Perfect squares by tier
const SQUARE_TIERS: Record<number, number[]> = {
  1: [1, 4, 9, 16, 25, 36, 49, 64, 81, 100],
  2: [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144],
  3: [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 256, 289, 324, 361, 400],
  4: [9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 256, 289, 324, 361, 400, 441, 484, 529, 576, 625, 729, 784, 841, 900],
}

// Power configs by tier: [minBase, maxBase, minExp, maxExp]
const POWER_TIERS: Record<number, [number, number, number, number]> = {
  1: [2, 5, 2, 2],      // 2²–5²
  2: [2, 8, 2, 3],      // 2²–8³
  3: [2, 12, 2, 3],     // 2²–12³
  4: [2, 15, 2, 4],     // 2²–15⁴ (capped to reasonable mental math)
}

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

function generatePercentageQuestion(tier: number, difficulty: Difficulty, timeAllotted: number): Question {
  const clampedTier = Math.min(tier, 4) as 1 | 2 | 3 | 4
  const config = PERCENT_TIERS[clampedTier]!
  const percentage = config.percents[randomInt(0, config.percents.length - 1)]!
  let base = config.bases[randomInt(0, config.bases.length - 1)]!

  // Ensure whole number result
  let attempts = 0
  while ((base * percentage) % 100 !== 0 && attempts < 50) {
    base = config.bases[randomInt(0, config.bases.length - 1)]!
    attempts++
  }

  const answer = (base * percentage) / 100

  return {
    id: generateId(),
    displayString: `${percentage}% of ${base} = ?`,
    correctAnswer: answer,
    operation: 'percentage',
    difficulty,
    timeAllotted,
  }
}

function generateSquareRootQuestion(tier: number, difficulty: Difficulty, timeAllotted: number): Question {
  const clampedTier = Math.min(tier, 4) as 1 | 2 | 3 | 4
  const squares = SQUARE_TIERS[clampedTier]!
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

function generatePowerQuestion(tier: number, difficulty: Difficulty, timeAllotted: number): Question {
  const clampedTier = Math.min(tier, 4) as 1 | 2 | 3 | 4
  const [minBase, maxBase, minExp, maxExp] = POWER_TIERS[clampedTier]!
  const base = randomInt(minBase, maxBase)
  const exponent = randomInt(minExp, maxExp)
  const answer = Math.pow(base, exponent)

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
    case 'percentage': {
      const pctTier = diffConfig.ranges['percentage']?.max ?? 1
      return generatePercentageQuestion(pctTier, difficulty, timeAllotted)
    }
    case 'squareRoot': {
      const sqrtTier = diffConfig.ranges['squareRoot']?.max ?? 1
      return generateSquareRootQuestion(sqrtTier, difficulty, timeAllotted)
    }
    case 'power': {
      const powTier = diffConfig.ranges['power']?.max ?? 1
      return generatePowerQuestion(powTier, difficulty, timeAllotted)
    }
    default:
      // Fallback to addition
      return generateArithmeticQuestion('addition', 1, 10, timeAllotted, difficulty)
  }
}

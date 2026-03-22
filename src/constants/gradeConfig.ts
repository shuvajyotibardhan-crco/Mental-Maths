import type { Grade, OperationType, Difficulty } from '../types'

export interface OperandRange {
  min: number
  max: number
}

export interface DifficultyConfig {
  timePerQuestion: number
  ranges: Record<string, OperandRange>
}

export interface GradeConfig {
  operations: OperationType[]
  difficulty: Record<Difficulty, DifficultyConfig>
}

// ──────────────────────────────────────────────
// KG–1: Addition & Subtraction only
// Baseline difficulty level
// ──────────────────────────────────────────────
const GRADES_KG_1: GradeConfig = {
  operations: ['addition', 'subtraction'],
  difficulty: {
    easy: {
      timePerQuestion: 15,
      ranges: {
        addition: { min: 1, max: 10 },
        subtraction: { min: 1, max: 10 },
      },
    },
    medium: {
      timePerQuestion: 12,
      ranges: {
        addition: { min: 1, max: 20 },
        subtraction: { min: 1, max: 20 },
      },
    },
    hard: {
      timePerQuestion: 10,
      ranges: {
        addition: { min: 1, max: 50 },
        subtraction: { min: 1, max: 50 },
      },
    },
  },
}

// ──────────────────────────────────────────────
// 2–3: ~3× harder than KG–1
// Introduces multiplication & division
// ──────────────────────────────────────────────
const GRADES_2_3: GradeConfig = {
  operations: ['addition', 'subtraction', 'multiplication', 'division'],
  difficulty: {
    easy: {
      timePerQuestion: 12,
      ranges: {
        addition: { min: 1, max: 30 },
        subtraction: { min: 1, max: 30 },
        multiplication: { min: 1, max: 5 },
        division: { min: 1, max: 5 },
      },
    },
    medium: {
      timePerQuestion: 10,
      ranges: {
        addition: { min: 1, max: 60 },
        subtraction: { min: 1, max: 60 },
        multiplication: { min: 2, max: 10 },
        division: { min: 2, max: 10 },
      },
    },
    hard: {
      timePerQuestion: 8,
      ranges: {
        addition: { min: 1, max: 150 },
        subtraction: { min: 1, max: 150 },
        multiplication: { min: 2, max: 12 },
        division: { min: 2, max: 12 },
      },
    },
  },
}

// ──────────────────────────────────────────────
// 4–5: ~3× harder than 2–3
// Introduces percentage, square roots, powers
// ──────────────────────────────────────────────
const GRADES_4_5: GradeConfig = {
  operations: ['addition', 'subtraction', 'multiplication', 'division', 'percentage', 'squareRoot', 'power'],
  difficulty: {
    easy: {
      timePerQuestion: 10,
      ranges: {
        addition: { min: 1, max: 100 },
        subtraction: { min: 1, max: 100 },
        multiplication: { min: 2, max: 12 },
        division: { min: 2, max: 12 },
        percentage: { min: 1, max: 1 },
        squareRoot: { min: 1, max: 1 },
        power: { min: 1, max: 1 },
      },
    },
    medium: {
      timePerQuestion: 8,
      ranges: {
        addition: { min: 1, max: 200 },
        subtraction: { min: 1, max: 200 },
        multiplication: { min: 2, max: 15 },
        division: { min: 2, max: 15 },
        percentage: { min: 1, max: 2 },
        squareRoot: { min: 1, max: 2 },
        power: { min: 1, max: 2 },
      },
    },
    hard: {
      timePerQuestion: 6,
      ranges: {
        addition: { min: 1, max: 500 },
        subtraction: { min: 1, max: 500 },
        multiplication: { min: 2, max: 20 },
        division: { min: 2, max: 20 },
        percentage: { min: 1, max: 3 },
        squareRoot: { min: 1, max: 2 },
        power: { min: 1, max: 2 },
      },
    },
  },
}

// ──────────────────────────────────────────────
// 6–8: ~3× harder than 4–5
// ──────────────────────────────────────────────
const GRADES_6_8: GradeConfig = {
  operations: ['addition', 'subtraction', 'multiplication', 'division', 'percentage', 'squareRoot', 'power'],
  difficulty: {
    easy: {
      timePerQuestion: 8,
      ranges: {
        addition: { min: 10, max: 300 },
        subtraction: { min: 10, max: 300 },
        multiplication: { min: 2, max: 20 },
        division: { min: 2, max: 20 },
        percentage: { min: 1, max: 2 },
        squareRoot: { min: 1, max: 2 },
        power: { min: 1, max: 2 },
      },
    },
    medium: {
      timePerQuestion: 7,
      ranges: {
        addition: { min: 10, max: 600 },
        subtraction: { min: 10, max: 600 },
        multiplication: { min: 3, max: 25 },
        division: { min: 3, max: 25 },
        percentage: { min: 1, max: 3 },
        squareRoot: { min: 1, max: 3 },
        power: { min: 1, max: 3 },
      },
    },
    hard: {
      timePerQuestion: 5,
      ranges: {
        addition: { min: 10, max: 1500 },
        subtraction: { min: 10, max: 1500 },
        multiplication: { min: 3, max: 30 },
        division: { min: 3, max: 30 },
        percentage: { min: 1, max: 3 },
        squareRoot: { min: 1, max: 3 },
        power: { min: 1, max: 3 },
      },
    },
  },
}

// ──────────────────────────────────────────────
// 9–10: ~3× harder than 6–8
// ──────────────────────────────────────────────
const GRADES_9_10: GradeConfig = {
  operations: ['addition', 'subtraction', 'multiplication', 'division', 'percentage', 'squareRoot', 'power'],
  difficulty: {
    easy: {
      timePerQuestion: 7,
      ranges: {
        addition: { min: 10, max: 1000 },
        subtraction: { min: 10, max: 1000 },
        multiplication: { min: 3, max: 30 },
        division: { min: 3, max: 30 },
        percentage: { min: 1, max: 3 },
        squareRoot: { min: 1, max: 3 },
        power: { min: 1, max: 3 },
      },
    },
    medium: {
      timePerQuestion: 6,
      ranges: {
        addition: { min: 50, max: 2000 },
        subtraction: { min: 50, max: 2000 },
        multiplication: { min: 5, max: 50 },
        division: { min: 5, max: 30 },
        percentage: { min: 1, max: 4 },
        squareRoot: { min: 1, max: 4 },
        power: { min: 1, max: 3 },
      },
    },
    hard: {
      timePerQuestion: 4,
      ranges: {
        addition: { min: 100, max: 5000 },
        subtraction: { min: 100, max: 5000 },
        multiplication: { min: 5, max: 50 },
        division: { min: 5, max: 50 },
        percentage: { min: 1, max: 4 },
        squareRoot: { min: 1, max: 4 },
        power: { min: 1, max: 4 },
      },
    },
  },
}

// ──────────────────────────────────────────────
// 11–12: ~3× harder than 9–10
// ──────────────────────────────────────────────
const GRADES_11_12: GradeConfig = {
  operations: ['addition', 'subtraction', 'multiplication', 'division', 'percentage', 'squareRoot', 'power'],
  difficulty: {
    easy: {
      timePerQuestion: 6,
      ranges: {
        addition: { min: 50, max: 3000 },
        subtraction: { min: 50, max: 3000 },
        multiplication: { min: 5, max: 50 },
        division: { min: 5, max: 50 },
        percentage: { min: 1, max: 4 },
        squareRoot: { min: 1, max: 4 },
        power: { min: 1, max: 3 },
      },
    },
    medium: {
      timePerQuestion: 5,
      ranges: {
        addition: { min: 100, max: 5000 },
        subtraction: { min: 100, max: 5000 },
        multiplication: { min: 10, max: 100 },
        division: { min: 5, max: 50 },
        percentage: { min: 1, max: 4 },
        squareRoot: { min: 1, max: 4 },
        power: { min: 1, max: 4 },
      },
    },
    hard: {
      timePerQuestion: 3,
      ranges: {
        addition: { min: 100, max: 10000 },
        subtraction: { min: 100, max: 10000 },
        multiplication: { min: 10, max: 100 },
        division: { min: 10, max: 100 },
        percentage: { min: 1, max: 4 },
        squareRoot: { min: 1, max: 4 },
        power: { min: 1, max: 4 },
      },
    },
  },
}

export function getGradeConfig(grade: Grade): GradeConfig {
  switch (grade) {
    case 'KG':
    case '1':
      return GRADES_KG_1
    case '2':
    case '3':
      return GRADES_2_3
    case '4':
    case '5':
      return GRADES_4_5
    case '6':
    case '7':
    case '8':
      return GRADES_6_8
    case '9':
    case '10':
      return GRADES_9_10
    case '11':
    case '12':
      return GRADES_11_12
    default:
      return GRADES_4_5
  }
}

export function getAvailableOperations(grade: Grade): OperationType[] {
  return getGradeConfig(grade).operations
}

export const GRADE_OPTIONS: { value: Grade; label: string }[] = [
  { value: 'KG', label: 'Kindergarten' },
  { value: '1', label: 'Grade 1' },
  { value: '2', label: 'Grade 2' },
  { value: '3', label: 'Grade 3' },
  { value: '4', label: 'Grade 4' },
  { value: '5', label: 'Grade 5' },
  { value: '6', label: 'Grade 6' },
  { value: '7', label: 'Grade 7' },
  { value: '8', label: 'Grade 8' },
  { value: '9', label: 'Grade 9' },
  { value: '10', label: 'Grade 10' },
  { value: '11', label: 'Grade 11' },
  { value: '12', label: 'Grade 12' },
]

export const OPERATION_LABELS: Record<OperationType, string> = {
  addition: 'Addition (+)',
  subtraction: 'Subtraction (−)',
  multiplication: 'Multiplication (×)',
  division: 'Division (÷)',
  percentage: 'Percentage (%)',
  squareRoot: 'Square Roots (√)',
  power: 'Powers (^)',
  mix: 'Mix (All)',
}

export const AVATAR_OPTIONS = [
  '🦁', '🐯', '🐻', '🐼', '🐨', '🦊', '🐸', '🐵',
  '🦄', '🐲', '🦋', '🐬', '🦈', '🐙', '🦉', '🐧',
]

import type { Grade, OperationType, Difficulty } from '../types'

export interface OperandRange {
  min: number
  max: number
}

export interface DifficultyConfig {
  ranges: Record<string, OperandRange>
}

export interface GradeConfig {
  operations: OperationType[]
  difficulty: Record<Difficulty, DifficultyConfig>
}

// ══════════════════════════════════════════════
// SCALING RULES:
// Within group:  Medium = 2× Easy,  Hard = 2× Medium (4× Easy)
// Across groups: Next group Easy = 3× previous group Easy (same for Med & Hard)
//
// Add/Sub max:   KG-1 base = 10 → M=20 → H=40
//   2-3: 30, 60, 120  |  4-5: 90, 180, 360  |  6-8: 270, 540, 1080
//   9-10: 810, 1620, 3240  |  11-12: 2430, 4860, 9720
//
// Mul/Div max:   2-3 base = 5 → M=10 → H=20
//   4-5: 15, 30, 60  |  6-8: 45, 90, 180
//   9-10: 135, 270, 540  |  11-12: 405, 810, 1620
//
// ══════════════════════════════════════════════

// ── KG–1: Addition & Subtraction only ──
// Add/Sub: E=10, M=20, H=40
const GRADES_KG_1: GradeConfig = {
  operations: ['addition', 'subtraction'],
  difficulty: {
    easy: {
      ranges: {
        addition: { min: 1, max: 10 },
        subtraction: { min: 1, max: 10 },
      },
    },
    medium: {
      ranges: {
        addition: { min: 1, max: 20 },
        subtraction: { min: 1, max: 20 },
      },
    },
    hard: {
      ranges: {
        addition: { min: 1, max: 40 },
        subtraction: { min: 1, max: 40 },
      },
    },
  },
}

// ── 2–3: 3× KG-1 — Introduces ×, ÷ ──
// Add/Sub: E=30, M=60, H=120  |  Mul/Div: E=5, M=10, H=20
// Time: E=10s, M=15s, H=20s
const GRADES_2_3: GradeConfig = {
  operations: ['addition', 'subtraction', 'multiplication', 'division'],
  difficulty: {
    easy: {
      ranges: {
        addition: { min: 1, max: 30 },
        subtraction: { min: 1, max: 30 },
        multiplication: { min: 1, max: 5 },
        division: { min: 1, max: 5 },
      },
    },
    medium: {
      ranges: {
        addition: { min: 1, max: 60 },
        subtraction: { min: 1, max: 60 },
        multiplication: { min: 1, max: 10 },
        division: { min: 1, max: 10 },
      },
    },
    hard: {
      ranges: {
        addition: { min: 1, max: 120 },
        subtraction: { min: 1, max: 120 },
        multiplication: { min: 1, max: 20 },
        division: { min: 1, max: 20 },
      },
    },
  },
}

// ── 4–5: 3× of 2-3 — Introduces %, √, ^ ──
// Add/Sub: E=90, M=180, H=360  |  Mul/Div: E=15, M=30, H=60
// Time: E=10s, M=15s, H=20s
const GRADES_4_5: GradeConfig = {
  operations: ['addition', 'subtraction', 'multiplication', 'division', 'percentage', 'squareRoot', 'power'],
  difficulty: {
    easy: {
      ranges: {
        addition: { min: 1, max: 90 },
        subtraction: { min: 1, max: 90 },
        multiplication: { min: 2, max: 15 },
        division: { min: 2, max: 15 },
        percentage: { min: 1, max: 1 },
        squareRoot: { min: 1, max: 1 },
        power: { min: 1, max: 1 },
      },
    },
    medium: {
      ranges: {
        addition: { min: 1, max: 180 },
        subtraction: { min: 1, max: 180 },
        multiplication: { min: 2, max: 30 },
        division: { min: 2, max: 30 },
        percentage: { min: 1, max: 2 },
        squareRoot: { min: 1, max: 2 },
        power: { min: 1, max: 2 },
      },
    },
    hard: {
      ranges: {
        addition: { min: 1, max: 360 },
        subtraction: { min: 1, max: 360 },
        multiplication: { min: 2, max: 60 },
        division: { min: 2, max: 60 },
        percentage: { min: 1, max: 3 },
        squareRoot: { min: 1, max: 2 },
        power: { min: 1, max: 2 },
      },
    },
  },
}

// ── 6–8: 3× of 4-5 ──
// Add/Sub: E=270, M=540, H=1080  |  Mul/Div: E=45, M=90, H=180
// Time: E=10s, M=15s, H=20s
const GRADES_6_8: GradeConfig = {
  operations: ['addition', 'subtraction', 'multiplication', 'division', 'percentage', 'squareRoot', 'power'],
  difficulty: {
    easy: {
      ranges: {
        addition: { min: 10, max: 270 },
        subtraction: { min: 10, max: 270 },
        multiplication: { min: 2, max: 45 },
        division: { min: 2, max: 45 },
        percentage: { min: 1, max: 2 },
        squareRoot: { min: 1, max: 2 },
        power: { min: 1, max: 2 },
      },
    },
    medium: {
      ranges: {
        addition: { min: 10, max: 540 },
        subtraction: { min: 10, max: 540 },
        multiplication: { min: 3, max: 90 },
        division: { min: 3, max: 90 },
        percentage: { min: 1, max: 3 },
        squareRoot: { min: 1, max: 3 },
        power: { min: 1, max: 3 },
      },
    },
    hard: {
      ranges: {
        addition: { min: 10, max: 1080 },
        subtraction: { min: 10, max: 1080 },
        multiplication: { min: 3, max: 180 },
        division: { min: 3, max: 180 },
        percentage: { min: 1, max: 3 },
        squareRoot: { min: 1, max: 3 },
        power: { min: 1, max: 3 },
      },
    },
  },
}

// ── 9–10: 3× of 6-8 ──
// Add/Sub: E=810, M=1620, H=3240  |  Mul/Div: E=135, M=270, H=540
// Time: E=10s, M=15s, H=20s
const GRADES_9_10: GradeConfig = {
  operations: ['addition', 'subtraction', 'multiplication', 'division', 'percentage', 'squareRoot', 'power'],
  difficulty: {
    easy: {
      ranges: {
        addition: { min: 10, max: 810 },
        subtraction: { min: 10, max: 810 },
        multiplication: { min: 3, max: 135 },
        division: { min: 3, max: 135 },
        percentage: { min: 1, max: 3 },
        squareRoot: { min: 1, max: 3 },
        power: { min: 1, max: 3 },
      },
    },
    medium: {
      ranges: {
        addition: { min: 50, max: 1620 },
        subtraction: { min: 50, max: 1620 },
        multiplication: { min: 5, max: 270 },
        division: { min: 5, max: 270 },
        percentage: { min: 1, max: 4 },
        squareRoot: { min: 1, max: 4 },
        power: { min: 1, max: 3 },
      },
    },
    hard: {
      ranges: {
        addition: { min: 100, max: 3240 },
        subtraction: { min: 100, max: 3240 },
        multiplication: { min: 5, max: 540 },
        division: { min: 5, max: 540 },
        percentage: { min: 1, max: 4 },
        squareRoot: { min: 1, max: 4 },
        power: { min: 1, max: 4 },
      },
    },
  },
}

// ── 11–12: 3× of 9-10 ──
// Add/Sub: E=2430, M=4860, H=9720  |  Mul/Div: E=405, M=810, H=1620
// Time: E=10s, M=15s, H=20s
const GRADES_11_12: GradeConfig = {
  operations: ['addition', 'subtraction', 'multiplication', 'division', 'percentage', 'squareRoot', 'power'],
  difficulty: {
    easy: {
      ranges: {
        addition: { min: 50, max: 2430 },
        subtraction: { min: 50, max: 2430 },
        multiplication: { min: 5, max: 405 },
        division: { min: 5, max: 405 },
        percentage: { min: 1, max: 4 },
        squareRoot: { min: 1, max: 4 },
        power: { min: 1, max: 3 },
      },
    },
    medium: {
      ranges: {
        addition: { min: 100, max: 4860 },
        subtraction: { min: 100, max: 4860 },
        multiplication: { min: 10, max: 810 },
        division: { min: 10, max: 810 },
        percentage: { min: 1, max: 4 },
        squareRoot: { min: 1, max: 4 },
        power: { min: 1, max: 4 },
      },
    },
    hard: {
      ranges: {
        addition: { min: 100, max: 9720 },
        subtraction: { min: 100, max: 9720 },
        multiplication: { min: 10, max: 1620 },
        division: { min: 10, max: 1620 },
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

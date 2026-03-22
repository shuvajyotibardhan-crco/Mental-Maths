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

const GRADES_2_3: GradeConfig = {
  operations: ['addition', 'subtraction', 'multiplication', 'division'],
  difficulty: {
    easy: {
      timePerQuestion: 12,
      ranges: {
        addition: { min: 1, max: 20 },
        subtraction: { min: 1, max: 20 },
        multiplication: { min: 1, max: 5 },
        division: { min: 1, max: 5 },
      },
    },
    medium: {
      timePerQuestion: 10,
      ranges: {
        addition: { min: 1, max: 50 },
        subtraction: { min: 1, max: 50 },
        multiplication: { min: 1, max: 10 },
        division: { min: 1, max: 10 },
      },
    },
    hard: {
      timePerQuestion: 8,
      ranges: {
        addition: { min: 1, max: 100 },
        subtraction: { min: 1, max: 100 },
        multiplication: { min: 1, max: 12 },
        division: { min: 1, max: 12 },
      },
    },
  },
}

const GRADES_4_PLUS: GradeConfig = {
  operations: ['addition', 'subtraction', 'multiplication', 'division', 'percentage', 'squareRoot', 'power'],
  difficulty: {
    easy: {
      timePerQuestion: 12,
      ranges: {
        addition: { min: 1, max: 50 },
        subtraction: { min: 1, max: 50 },
        multiplication: { min: 1, max: 10 },
        division: { min: 1, max: 10 },
        percentage: { min: 1, max: 1 }, // simple percentages
        squareRoot: { min: 1, max: 1 },
        power: { min: 1, max: 1 },
      },
    },
    medium: {
      timePerQuestion: 10,
      ranges: {
        addition: { min: 1, max: 100 },
        subtraction: { min: 1, max: 100 },
        multiplication: { min: 1, max: 12 },
        division: { min: 1, max: 12 },
        percentage: { min: 1, max: 2 },
        squareRoot: { min: 1, max: 2 },
        power: { min: 1, max: 2 },
      },
    },
    hard: {
      timePerQuestion: 8,
      ranges: {
        addition: { min: 1, max: 200 },
        subtraction: { min: 1, max: 200 },
        multiplication: { min: 1, max: 15 },
        division: { min: 1, max: 15 },
        percentage: { min: 1, max: 3 },
        squareRoot: { min: 1, max: 3 },
        power: { min: 1, max: 3 },
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
    default:
      return GRADES_4_PLUS
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

import type { Difficulty, AnsweredQuestion } from '../types'

const BASE_POINTS: Record<Difficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 30,
}

export function calculateQuestionScore(
  question: AnsweredQuestion,
  currentStreak: number,
): number {
  if (!question.isCorrect) return 0

  const base = BASE_POINTS[question.difficulty]
  const speedMultiplier = getSpeedMultiplier(question.responseTimeMs, question.timeAllotted * 1000)
  const streakMultiplier = getStreakMultiplier(currentStreak)

  return Math.floor(base * speedMultiplier * streakMultiplier)
}

function getSpeedMultiplier(responseTimeMs: number, allottedTimeMs: number): number {
  const ratio = responseTimeMs / allottedTimeMs
  if (ratio < 0.3) return 2.0
  if (ratio < 0.5) return 1.5
  return 1.0
}

function getStreakMultiplier(streak: number): number {
  if (streak >= 10) return 2.0
  if (streak >= 5) return 1.5
  return 1.0
}

export function calculateSessionScore(questions: AnsweredQuestion[]): number {
  let score = 0
  let streak = 0

  for (const q of questions) {
    if (q.isCorrect) {
      streak++
      score += calculateQuestionScore(q, streak)
    } else {
      streak = 0
    }
  }

  return score
}

export function getBestStreak(questions: AnsweredQuestion[]): number {
  let best = 0
  let current = 0

  for (const q of questions) {
    if (q.isCorrect) {
      current++
      best = Math.max(best, current)
    } else {
      current = 0
    }
  }

  return best
}

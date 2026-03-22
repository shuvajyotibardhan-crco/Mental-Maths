import type { Difficulty, AnsweredQuestion, GameMode } from '../types'

const BASE_POINTS: Record<Difficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 30,
}

export function calculateQuestionScore(
  question: AnsweredQuestion,
  currentStreak: number,
  mode: GameMode,
): number {
  if (!question.isCorrect) return 0

  const base = BASE_POINTS[question.difficulty]
  const streakMultiplier = getStreakMultiplier(currentStreak)

  // Timed mode: reward speed (more answers in less time = higher score)
  // Fixed mode: no speed bonus — score is purely correctness + streak
  if (mode === 'timed') {
    const speedMultiplier = getTimedSpeedMultiplier(question.responseTimeMs)
    return Math.floor(base * speedMultiplier * streakMultiplier)
  }

  return Math.floor(base * streakMultiplier)
}

// For timed mode: faster answers get bonus points
function getTimedSpeedMultiplier(responseTimeMs: number): number {
  const seconds = responseTimeMs / 1000
  if (seconds < 3) return 2.0
  if (seconds < 5) return 1.5
  return 1.0
}

function getStreakMultiplier(streak: number): number {
  if (streak >= 10) return 2.0
  if (streak >= 5) return 1.5
  return 1.0
}

export function calculateSessionScore(questions: AnsweredQuestion[], mode: GameMode): number {
  let score = 0
  let streak = 0

  for (const q of questions) {
    if (q.isCorrect) {
      streak++
      score += calculateQuestionScore(q, streak, mode)
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

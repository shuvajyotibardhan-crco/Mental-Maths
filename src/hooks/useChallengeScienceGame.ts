import { useState, useCallback, useRef } from 'react'
import type { ScienceQuestion } from '../types/science'
import { updatePlayerProgress } from '../firebase/challenge'

const POINTS_PER_CORRECT = 5

interface UseChallengeScienceGameOptions {
  gameCode: string
  uid: string
  questions: ScienceQuestion[]
}

export interface ChallengeScienceGameState {
  currentIndex: number
  currentQuestion: ScienceQuestion | null
  selectedIndices: number[]
  revealed: boolean
  score: number
  streak: number
  bestStreak: number
  totalAnswered: number
  correctAnswers: number
  startTime: number
  finished: boolean
}

function isAnswerCorrect(selected: number[], correct: number[]): boolean {
  if (selected.length !== correct.length) return false
  const s = [...selected].sort((a, b) => a - b)
  const c = [...correct].sort((a, b) => a - b)
  return s.every((v, i) => v === c[i])
}

export function useChallengeScienceGame({
  gameCode,
  uid,
  questions,
}: UseChallengeScienceGameOptions) {
  const [state, setState] = useState<ChallengeScienceGameState>(() => ({
    currentIndex: 0,
    currentQuestion: questions[0] ?? null,
    selectedIndices: [],
    revealed: false,
    score: 0,
    streak: 0,
    bestStreak: 0,
    totalAnswered: 0,
    correctAnswers: 0,
    startTime: Date.now(),
    finished: false,
  }))

  const writeRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const syncProgress = useCallback(
    (
      score: number,
      correctAnswers: number,
      totalAnswered: number,
      bestStreak: number,
      finished: boolean,
      timeTakenSeconds: number | null,
    ) => {
      if (writeRef.current) clearTimeout(writeRef.current)
      writeRef.current = setTimeout(() => {
        updatePlayerProgress(gameCode, uid, {
          score,
          correctAnswers,
          totalAnswered,
          bestStreak,
          finished,
          timeTakenSeconds,
          lastActiveAt: Date.now(),
        }).catch(console.error)
      }, 100)
    },
    [gameCode, uid],
  )

  const toggleOption = useCallback((index: number) => {
    setState((s) => {
      if (s.finished || s.revealed || !s.currentQuestion) return s
      const has = s.selectedIndices.includes(index)
      return {
        ...s,
        selectedIndices: has
          ? s.selectedIndices.filter((i) => i !== index)
          : [...s.selectedIndices, index],
      }
    })
  }, [])

  const submitAnswer = useCallback(() => {
    setState((s) => {
      if (s.finished || s.revealed || !s.currentQuestion || s.selectedIndices.length === 0) return s
      return { ...s, revealed: true }
    })
  }, [])

  const advance = useCallback(() => {
    setState((s) => {
      if (!s.revealed || s.finished || !s.currentQuestion) return s

      const isCorrect = isAnswerCorrect(s.selectedIndices, s.currentQuestion.correctIndices)
      const newStreak = isCorrect ? s.streak + 1 : 0
      const newBestStreak = Math.max(s.bestStreak, newStreak)
      const newScore = s.score + (isCorrect ? POINTS_PER_CORRECT : 0)
      const newTotal = s.totalAnswered + 1
      const newCorrect = s.correctAnswers + (isCorrect ? 1 : 0)
      const nextIndex = s.currentIndex + 1
      const isDone = nextIndex >= questions.length

      const timeTaken = isDone
        ? Math.round((Date.now() - s.startTime) / 1000)
        : null

      syncProgress(newScore, newCorrect, newTotal, newBestStreak, isDone, timeTaken)

      if (isDone) {
        return {
          ...s,
          currentQuestion: null,
          selectedIndices: [],
          revealed: false,
          score: newScore,
          streak: newStreak,
          bestStreak: newBestStreak,
          totalAnswered: newTotal,
          correctAnswers: newCorrect,
          currentIndex: nextIndex,
          finished: true,
        }
      }

      return {
        ...s,
        currentIndex: nextIndex,
        currentQuestion: questions[nextIndex] ?? null,
        selectedIndices: [],
        revealed: false,
        score: newScore,
        streak: newStreak,
        bestStreak: newBestStreak,
        totalAnswered: newTotal,
        correctAnswers: newCorrect,
      }
    })
  }, [questions, syncProgress])

  const forceFinish = useCallback(() => {
    setState((s) => {
      if (s.finished) return s
      const timeTaken = Math.round((Date.now() - s.startTime) / 1000)
      syncProgress(s.score, s.correctAnswers, s.totalAnswered, s.bestStreak, true, timeTaken)
      return { ...s, currentQuestion: null, revealed: false, finished: true }
    })
  }, [syncProgress])

  return { ...state, toggleOption, submitAnswer, advance, forceFinish }
}

import { useState, useCallback, useRef } from 'react'
import type { Question, AnsweredQuestion } from '../types'
import type { ChallengeConfig } from '../types/challenge'
import { calculateQuestionScore } from '../engine/scoring'
import { updatePlayerProgress } from '../firebase/challenge'

interface UseChallengeGameOptions {
  gameCode: string
  uid: string
  questions: Question[]
  config: ChallengeConfig
}

interface ChallengeGameState {
  currentIndex: number
  currentQuestion: Question | null
  answeredQuestions: AnsweredQuestion[]
  score: number
  streak: number
  bestStreak: number
  questionStartTime: number
  finished: boolean
}

export function useChallengeGame({ gameCode, uid, questions, config }: UseChallengeGameOptions) {
  const [state, setState] = useState<ChallengeGameState>(() => ({
    currentIndex: 0,
    currentQuestion: questions[0] ?? null,
    answeredQuestions: [],
    score: 0,
    streak: 0,
    bestStreak: 0,
    questionStartTime: Date.now(),
    finished: false,
  }))

  const writeRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced write to Firestore (every answer, but don't block UI)
  const syncProgress = useCallback(
    (score: number, correctAnswers: number, totalAnswered: number, bestStreak: number, finished: boolean, timeTakenSeconds: number | null) => {
      if (writeRef.current) clearTimeout(writeRef.current)
      writeRef.current = setTimeout(() => {
        updatePlayerProgress(gameCode, uid, {
          score,
          correctAnswers,
          totalAnswered,
          bestStreak,
          finished,
          timeTakenSeconds,
        }).catch(console.error)
      }, 100)
    },
    [gameCode, uid],
  )

  const submitAnswer = useCallback(
    (userAnswer: number) => {
      setState((prev) => {
        if (!prev.currentQuestion || prev.finished) return prev

        const responseTimeMs = Date.now() - prev.questionStartTime
        const isCorrect = userAnswer === prev.currentQuestion.correctAnswer
        const newStreak = isCorrect ? prev.streak + 1 : 0
        const newBestStreak = Math.max(prev.bestStreak, newStreak)

        const answered: AnsweredQuestion = {
          ...prev.currentQuestion,
          userAnswer,
          isCorrect,
          responseTimeMs,
          answeredAt: Date.now(),
        }

        const points = calculateQuestionScore(answered, newStreak, config.mode)
        const newScore = prev.score + points
        const newAnswered = [...prev.answeredQuestions, answered]
        const newIndex = prev.currentIndex + 1
        const correct = newAnswered.filter((q) => q.isCorrect).length

        // Check if done (fixed mode: 20 questions, or ran out of pre-generated questions)
        const isDone = (config.mode === 'fixed' && newAnswered.length >= 20) || newIndex >= questions.length

        const totalTimeMs = newAnswered.reduce((sum, q) => sum + q.responseTimeMs, 0)
        const timeTaken = Math.round(totalTimeMs / 1000)

        syncProgress(newScore, correct, newAnswered.length, newBestStreak, isDone, isDone ? timeTaken : null)

        if (isDone) {
          return {
            ...prev,
            currentQuestion: null,
            answeredQuestions: newAnswered,
            score: newScore,
            streak: newStreak,
            bestStreak: newBestStreak,
            currentIndex: newIndex,
            finished: true,
          }
        }

        return {
          ...prev,
          currentIndex: newIndex,
          currentQuestion: questions[newIndex] ?? null,
          answeredQuestions: newAnswered,
          score: newScore,
          streak: newStreak,
          bestStreak: newBestStreak,
          questionStartTime: Date.now(),
        }
      })
    },
    [config.mode, questions, syncProgress],
  )

  const skipQuestion = useCallback(() => {
    setState((prev) => {
      if (!prev.currentQuestion || prev.finished) return prev

      const skipped: AnsweredQuestion = {
        ...prev.currentQuestion,
        userAnswer: null,
        isCorrect: false,
        responseTimeMs: Date.now() - prev.questionStartTime,
        answeredAt: Date.now(),
      }

      const newAnswered = [...prev.answeredQuestions, skipped]
      const newIndex = prev.currentIndex + 1
      const correct = newAnswered.filter((q) => q.isCorrect).length
      const isDone = (config.mode === 'fixed' && newAnswered.length >= 20) || newIndex >= questions.length

      const totalTimeMs = newAnswered.reduce((sum, q) => sum + q.responseTimeMs, 0)
      const timeTaken = Math.round(totalTimeMs / 1000)

      syncProgress(prev.score, correct, newAnswered.length, prev.bestStreak, isDone, isDone ? timeTaken : null)

      if (isDone) {
        return {
          ...prev,
          currentQuestion: null,
          answeredQuestions: newAnswered,
          streak: 0,
          currentIndex: newIndex,
          finished: true,
        }
      }

      return {
        ...prev,
        currentIndex: newIndex,
        currentQuestion: questions[newIndex] ?? null,
        answeredQuestions: newAnswered,
        streak: 0,
        questionStartTime: Date.now(),
      }
    })
  }, [config.mode, questions, syncProgress])

  const finishGame = useCallback(() => {
    setState((prev) => {
      if (prev.finished) return prev
      const correct = prev.answeredQuestions.filter((q) => q.isCorrect).length
      const totalTimeMs = prev.answeredQuestions.reduce((sum, q) => sum + q.responseTimeMs, 0)
      const timeTaken = Math.round(totalTimeMs / 1000)

      syncProgress(prev.score, correct, prev.answeredQuestions.length, prev.bestStreak, true, timeTaken)

      return {
        ...prev,
        currentQuestion: null,
        finished: true,
      }
    })
  }, [syncProgress])

  return {
    ...state,
    submitAnswer,
    skipQuestion,
    finishGame,
  }
}

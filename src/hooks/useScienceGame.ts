import { useState, useCallback, useRef } from 'react'
import {
  fetchScienceQuestions,
  saveScienceSession,
  saveScienceSeenIds,
} from '../firebase/science'
import type { Grade } from '../types/question'
import type { ScienceQuestion, ScienceAnsweredQuestion } from '../types/science'

type GameStatus = 'idle' | 'loading' | 'playing' | 'finished'

export interface ScienceGameState {
  status: GameStatus
  grade: Grade
  questions: ScienceQuestion[]
  currentIndex: number
  answered: ScienceAnsweredQuestion[]
  selectedIndices: number[]   // toggled options for the current question
  revealed: boolean           // true after submitAnswer()
  score: number
  streak: number
  bestStreak: number
  error: string | null
  sessionId: string | null
}

const initial: ScienceGameState = {
  status: 'idle',
  grade: '5',
  questions: [],
  currentIndex: 0,
  answered: [],
  selectedIndices: [],
  revealed: false,
  score: 0,
  streak: 0,
  bestStreak: 0,
  error: null,
  sessionId: null,
}

const POINTS_PER_CORRECT = 5  // 20 questions × 5 = 100 max

function isAnswerCorrect(selected: number[], correct: number[]): boolean {
  if (selected.length !== correct.length) return false
  const sortedSelected = [...selected].sort((a, b) => a - b)
  const sortedCorrect = [...correct].sort((a, b) => a - b)
  return sortedSelected.every((v, i) => v === sortedCorrect[i])
}

export function useScienceGame(userId: string) {
  const [state, setState] = useState<ScienceGameState>(initial)
  const startTimeRef = useRef<number>(0)

  const startGame = useCallback(async (grade: Grade) => {
    setState({ ...initial, grade, status: 'loading' })
    try {
      const questions = await fetchScienceQuestions(grade)
      if (questions.length === 0) {
        setState((s) => ({ ...s, status: 'idle', error: 'No questions available for this grade yet.' }))
        return
      }
      startTimeRef.current = Date.now()
      setState((s) => ({ ...s, status: 'playing', questions, error: null }))
    } catch {
      setState((s) => ({ ...s, status: 'idle', error: 'Failed to load questions. Please try again.' }))
    }
  }, [])

  const toggleOption = useCallback((index: number) => {
    setState((s) => {
      if (s.status !== 'playing' || s.revealed) return s
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
      if (s.status !== 'playing' || s.revealed || s.selectedIndices.length === 0) return s
      return { ...s, revealed: true }
    })
  }, [])

  const advance = useCallback(() => {
    setState((s) => {
      if (!s.revealed || s.status !== 'playing') return s

      const question = s.questions[s.currentIndex]!
      const isCorrect = isAnswerCorrect(s.selectedIndices, question.correctIndices)
      const newStreak = isCorrect ? s.streak + 1 : 0
      const newBestStreak = Math.max(s.bestStreak, newStreak)
      const newScore = s.score + (isCorrect ? POINTS_PER_CORRECT : 0)

      const answeredQuestion: ScienceAnsweredQuestion = {
        question,
        selectedIndices: s.selectedIndices,
        isCorrect,
        answeredAt: Date.now(),
      }
      const newAnswered = [...s.answered, answeredQuestion]
      const nextIndex = s.currentIndex + 1

      if (nextIndex >= s.questions.length) {
        _finishSession(s.grade, newAnswered, newScore, newBestStreak)
        return {
          ...s,
          status: 'finished',
          answered: newAnswered,
          score: newScore,
          streak: newStreak,
          bestStreak: newBestStreak,
          selectedIndices: [],
          revealed: false,
        }
      }

      return {
        ...s,
        currentIndex: nextIndex,
        answered: newAnswered,
        score: newScore,
        streak: newStreak,
        bestStreak: newBestStreak,
        selectedIndices: [],
        revealed: false,
      }
    })
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const forceFinish = useCallback(() => {
    setState((s) => {
      if (s.status !== 'playing') return s
      if (s.answered.length > 0) {
        _finishSession(s.grade, s.answered, s.score, s.bestStreak)
      }
      return { ...s, status: 'finished', selectedIndices: [], revealed: false }
    })
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const reset = useCallback(() => {
    setState(initial)
  }, [])

  return { state, startGame, toggleOption, submitAnswer, advance, forceFinish, reset }

  function _finishSession(
    grade: Grade,
    answered: ScienceAnsweredQuestion[],
    score: number,
    bestStreak: number,
  ) {
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000)
    const accuracy = answered.length > 0
      ? parseFloat(((answered.filter((a) => a.isCorrect).length / answered.length) * 100).toFixed(2))
      : 0

    saveScienceSeenIds(grade, answered.map((a) => a.question.id))

    saveScienceSession({
      userId,
      timestamp: Date.now(),
      grade,
      subject: 'science',
      totalQuestions: answered.length,
      correctAnswers: answered.filter((a) => a.isCorrect).length,
      accuracy,
      score,
      timeTakenSeconds: timeTaken,
      bestStreak,
      isHighScore: false,
    }).then((id) => {
      setState((prev) => ({ ...prev, sessionId: id }))
    }).catch(() => {/* non-critical */})
  }
}

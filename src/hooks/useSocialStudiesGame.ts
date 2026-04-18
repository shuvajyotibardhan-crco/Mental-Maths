import { useState, useCallback, useRef } from 'react'
import {
  fetchSocialStudiesQuestions,
  saveSocialStudiesSession,
  saveSeenIdsToStorage,
} from '../firebase/socialStudies'
import type { Grade } from '../types/question'
import type { SocialStudiesQuestion, SocialStudiesAnsweredQuestion } from '../types/socialStudies'

type GameStatus = 'idle' | 'loading' | 'playing' | 'finished'

export interface SocialStudiesGameState {
  status: GameStatus
  grade: Grade
  questions: SocialStudiesQuestion[]
  currentIndex: number
  answered: SocialStudiesAnsweredQuestion[]
  selectedIndex: number | null   // index chosen for current question (before advance)
  revealed: boolean              // true after user picks — shows correct/wrong highlight
  score: number
  streak: number
  bestStreak: number
  error: string | null
  sessionId: string | null
}

const initial: SocialStudiesGameState = {
  status: 'idle',
  grade: '3',
  questions: [],
  currentIndex: 0,
  answered: [],
  selectedIndex: null,
  revealed: false,
  score: 0,
  streak: 0,
  bestStreak: 0,
  error: null,
  sessionId: null,
}

const POINTS_PER_CORRECT = 5  // 20 questions × 5 = 100 max

export function useSocialStudiesGame(userId: string) {
  const [state, setState] = useState<SocialStudiesGameState>(initial)
  const startTimeRef = useRef<number>(0)

  /**
   * Grade is passed here (per-quiz) rather than at construction time so the
   * same hook instance supports different grades across sessions without
   * requiring a remount.
   */
  const startGame = useCallback(async (grade: Grade) => {
    setState({ ...initial, grade, status: 'loading' })
    try {
      const questions = await fetchSocialStudiesQuestions(grade)
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

  const selectAnswer = useCallback((index: number) => {
    setState((s) => {
      if (s.status !== 'playing' || s.revealed) return s
      return { ...s, selectedIndex: index, revealed: true }
    })
  }, [])

  const advance = useCallback(() => {
    setState((s) => {
      if (!s.revealed || s.status !== 'playing') return s

      const question = s.questions[s.currentIndex]!
      const isCorrect = s.selectedIndex === question.correctIndex
      const newStreak = isCorrect ? s.streak + 1 : 0
      const newBestStreak = Math.max(s.bestStreak, newStreak)
      const newScore = s.score + (isCorrect ? POINTS_PER_CORRECT : 0)

      const answeredQuestion: SocialStudiesAnsweredQuestion = {
        question,
        selectedIndex: s.selectedIndex,
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
          selectedIndex: null,
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
        selectedIndex: null,
        revealed: false,
      }
    })
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Ends the session early (End Game button). If at least one question was
   * answered, saves the partial session and navigates to results.
   */
  const forceFinish = useCallback(() => {
    setState((s) => {
      if (s.status !== 'playing') return s
      if (s.answered.length > 0) {
        _finishSession(s.grade, s.answered, s.score, s.bestStreak)
      }
      return { ...s, status: 'finished', selectedIndex: null, revealed: false }
    })
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const reset = useCallback(() => {
    setState(initial)
  }, [])

  return { state, startGame, selectAnswer, advance, forceFinish, reset }

  // ─── helpers (no closure over state; called with explicit snapshots) ───────

  function _finishSession(
    grade: Grade,
    answered: SocialStudiesAnsweredQuestion[],
    score: number,
    bestStreak: number,
  ) {
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000)
    const accuracy = answered.length > 0
      ? parseFloat(((answered.filter((a) => a.isCorrect).length / answered.length) * 100).toFixed(2))
      : 0

    saveSeenIdsToStorage(grade, answered.map((a) => a.question.id))

    saveSocialStudiesSession({
      userId,
      timestamp: Date.now(),
      grade,
      subject: 'socialStudies',
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

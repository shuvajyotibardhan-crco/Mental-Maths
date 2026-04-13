import { useState, useCallback, useRef } from 'react'
import { fetchSocialStudiesQuestions, saveSocialStudiesSession } from '../firebase/socialStudies'
import type { Grade } from '../types/question'
import type { SocialStudiesQuestion, SocialStudiesAnsweredQuestion } from '../types/socialStudies'

type GameStatus = 'idle' | 'loading' | 'playing' | 'finished'

export interface SocialStudiesGameState {
  status: GameStatus
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

export function useSocialStudiesGame(userId: string, grade: Grade) {
  const [state, setState] = useState<SocialStudiesGameState>(initial)
  const startTimeRef = useRef<number>(0)

  const startGame = useCallback(async () => {
    setState({ ...initial, status: 'loading' })
    try {
      const questions = await fetchSocialStudiesQuestions(grade)
      if (questions.length === 0) {
        setState((s) => ({ ...s, status: 'idle', error: 'No questions available for your grade yet.' }))
        return
      }
      startTimeRef.current = Date.now()
      setState((s) => ({ ...s, status: 'playing', questions, error: null }))
    } catch {
      setState((s) => ({ ...s, status: 'idle', error: 'Failed to load questions. Please try again.' }))
    }
  }, [grade])

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
        // Session finished — save asynchronously, don't block UI
        const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000)
        const accuracy = newAnswered.filter((a) => a.isCorrect).length / newAnswered.length

        saveSocialStudiesSession({
          userId,
          timestamp: Date.now(),
          grade,
          subject: 'socialStudies',
          totalQuestions: newAnswered.length,
          correctAnswers: newAnswered.filter((a) => a.isCorrect).length,
          accuracy,
          score: newScore,
          timeTakenSeconds: timeTaken,
          bestStreak: newBestStreak,
          isHighScore: false, // social studies doesn't use the high score system
        }).then((id) => {
          setState((prev) => ({ ...prev, sessionId: id }))
        }).catch(() => {/* non-critical */})

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
  }, [userId, grade])

  const reset = useCallback(() => {
    setState(initial)
  }, [])

  return { state, startGame, selectAnswer, advance, reset }
}

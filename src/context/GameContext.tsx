import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { Question, AnsweredQuestion, OperationType, Difficulty, GameMode, Grade } from '../types'
import { generateQuestion } from '../engine/questionGenerator'
import { calculateQuestionScore, getBestStreak } from '../engine/scoring'

const LS_KEY = 'mm_seen_questions'
const LS_MAX = 60

function loadSeenFromStorage(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(arr)
  } catch {
    return new Set()
  }
}

function saveSeenToStorage(seen: Set<string>): void {
  try {
    // Keep only the most recent LS_MAX entries (trim from the front)
    const arr = Array.from(seen)
    const trimmed = arr.length > LS_MAX ? arr.slice(arr.length - LS_MAX) : arr
    localStorage.setItem(LS_KEY, JSON.stringify(trimmed))
  } catch {
    // localStorage unavailable — silently ignore
  }
}

interface GameConfig {
  grade: Grade
  operation: OperationType
  difficulty: Difficulty
  mode: GameMode
}

interface GameState {
  status: 'idle' | 'playing' | 'finished'
  config: GameConfig | null
  currentQuestion: Question | null
  answeredQuestions: AnsweredQuestion[]
  score: number
  streak: number
  bestStreak: number
  questionStartTime: number
  questionCount: number
  seenQuestions: Set<string>
}

type GameAction =
  | { type: 'START'; config: GameConfig; initialSeen: Set<string> }
  | { type: 'ANSWER'; userAnswer: number }
  | { type: 'SKIP' }
  | { type: 'FINISH' }
  | { type: 'RESET' }

const initialState: GameState = {
  status: 'idle',
  config: null,
  currentQuestion: null,
  answeredQuestions: [],
  score: 0,
  streak: 0,
  bestStreak: 0,
  questionStartTime: 0,
  questionCount: 0,
  seenQuestions: new Set(),
}

function generateUniqueQuestion(
  grade: Grade,
  operation: OperationType,
  difficulty: Difficulty,
  seen: Set<string>,
): Question {
  let q = generateQuestion(grade, operation, difficulty)
  let retries = 0
  while (seen.has(q.displayString) && retries < 10) {
    q = generateQuestion(grade, operation, difficulty)
    retries++
  }
  return q
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START': {
      const seen = new Set(action.initialSeen)
      const question = generateUniqueQuestion(
        action.config.grade,
        action.config.operation,
        action.config.difficulty,
        seen,
      )
      seen.add(question.displayString)
      return {
        ...initialState,
        status: 'playing',
        config: action.config,
        currentQuestion: question,
        questionStartTime: Date.now(),
        questionCount: 1,
        seenQuestions: seen,
      }
    }

    case 'ANSWER': {
      if (!state.currentQuestion || !state.config) return state

      const responseTimeMs = Date.now() - state.questionStartTime
      const isCorrect = action.userAnswer === state.currentQuestion.correctAnswer
      const newStreak = isCorrect ? state.streak + 1 : 0
      const newBestStreak = Math.max(state.bestStreak, newStreak)

      const answered: AnsweredQuestion = {
        ...state.currentQuestion,
        userAnswer: action.userAnswer,
        isCorrect,
        responseTimeMs,
        answeredAt: Date.now(),
      }

      const points = calculateQuestionScore(answered, newStreak, state.config.mode)
      const newScore = state.score + points
      const newAnswered = [...state.answeredQuestions, answered]
      const newCount = state.questionCount + 1

      // Check if fixed mode is done (20 questions)
      if (state.config.mode === 'fixed' && newAnswered.length >= 20) {
        return {
          ...state,
          status: 'finished',
          currentQuestion: null,
          answeredQuestions: newAnswered,
          score: newScore,
          streak: newStreak,
          bestStreak: newBestStreak,
          questionCount: newCount,
        }
      }

      // Generate next question
      const newSeen = new Set(state.seenQuestions)
      const nextQuestion = generateUniqueQuestion(
        state.config.grade,
        state.config.operation,
        state.config.difficulty,
        newSeen,
      )
      newSeen.add(nextQuestion.displayString)

      return {
        ...state,
        currentQuestion: nextQuestion,
        answeredQuestions: newAnswered,
        score: newScore,
        streak: newStreak,
        bestStreak: newBestStreak,
        questionStartTime: Date.now(),
        questionCount: newCount,
        seenQuestions: newSeen,
      }
    }

    case 'SKIP': {
      if (!state.currentQuestion || !state.config) return state

      const skipped: AnsweredQuestion = {
        ...state.currentQuestion,
        userAnswer: null,
        isCorrect: false,
        responseTimeMs: Date.now() - state.questionStartTime,
        answeredAt: Date.now(),
      }

      const newAnswered = [...state.answeredQuestions, skipped]

      if (state.config.mode === 'fixed' && newAnswered.length >= 20) {
        return {
          ...state,
          status: 'finished',
          currentQuestion: null,
          answeredQuestions: newAnswered,
          streak: 0,
        }
      }

      const newSeen = new Set(state.seenQuestions)
      const nextQuestion = generateUniqueQuestion(
        state.config.grade,
        state.config.operation,
        state.config.difficulty,
        newSeen,
      )
      newSeen.add(nextQuestion.displayString)

      return {
        ...state,
        currentQuestion: nextQuestion,
        answeredQuestions: newAnswered,
        streak: 0,
        questionStartTime: Date.now(),
        questionCount: state.questionCount + 1,
        seenQuestions: newSeen,
      }
    }

    case 'FINISH':
      return {
        ...state,
        status: 'finished',
        currentQuestion: null,
        bestStreak: getBestStreak(state.answeredQuestions),
      }

    case 'RESET':
      return initialState
  }
}

interface GameContextValue {
  state: GameState
  startGame: (config: GameConfig) => void
  submitAnswer: (answer: number) => void
  skipQuestion: () => void
  finishGame: () => void
  resetGame: () => void
}

const GameContext = createContext<GameContextValue>({
  state: initialState,
  startGame: () => {},
  submitAnswer: () => {},
  skipQuestion: () => {},
  finishGame: () => {},
  resetGame: () => {},
})

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  // Persist seen questions to localStorage when a session finishes
  useEffect(() => {
    if (state.status === 'finished') {
      saveSeenToStorage(state.seenQuestions)
    }
  }, [state.status, state.seenQuestions])

  return (
    <GameContext.Provider
      value={{
        state,
        startGame: (config) => dispatch({ type: 'START', config, initialSeen: loadSeenFromStorage() }),
        submitAnswer: (answer) => dispatch({ type: 'ANSWER', userAnswer: answer }),
        skipQuestion: () => dispatch({ type: 'SKIP' }),
        finishGame: () => dispatch({ type: 'FINISH' }),
        resetGame: () => dispatch({ type: 'RESET' }),
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  return useContext(GameContext)
}

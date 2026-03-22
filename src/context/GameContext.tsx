import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { Question, AnsweredQuestion, OperationType, Difficulty, GameMode, Grade } from '../types'
import { generateQuestion } from '../engine/questionGenerator'
import { calculateQuestionScore, getBestStreak } from '../engine/scoring'

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
}

type GameAction =
  | { type: 'START'; config: GameConfig }
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
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START': {
      const question = generateQuestion(
        action.config.grade,
        action.config.operation,
        action.config.difficulty,
      )
      return {
        ...initialState,
        status: 'playing',
        config: action.config,
        currentQuestion: question,
        questionStartTime: Date.now(),
        questionCount: 1,
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
      const nextQuestion = generateQuestion(
        state.config.grade,
        state.config.operation,
        state.config.difficulty,
      )

      return {
        ...state,
        currentQuestion: nextQuestion,
        answeredQuestions: newAnswered,
        score: newScore,
        streak: newStreak,
        bestStreak: newBestStreak,
        questionStartTime: Date.now(),
        questionCount: newCount,
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

      const nextQuestion = generateQuestion(
        state.config.grade,
        state.config.operation,
        state.config.difficulty,
      )

      return {
        ...state,
        currentQuestion: nextQuestion,
        answeredQuestions: newAnswered,
        streak: 0,
        questionStartTime: Date.now(),
        questionCount: state.questionCount + 1,
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

  return (
    <GameContext.Provider
      value={{
        state,
        startGame: (config) => dispatch({ type: 'START', config }),
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

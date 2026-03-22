import { useState, useEffect, useCallback, useRef } from 'react'
import { useGame } from '../../context/GameContext'
import { useTimer } from '../../hooks/useTimer'
import { QuestionCard } from '../game/QuestionCard'
import { NumberPad } from '../game/NumberPad'
import { Timer } from '../game/Timer'
import { ScoreBar } from '../game/ScoreBar'

interface GameScreenProps {
  onNavigate: (screen: string) => void
}

export function GameScreen({ onNavigate }: GameScreenProps) {
  const { state, submitAnswer, finishGame } = useGame()
  const [inputValue, setInputValue] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isTimed = state.config?.mode === 'timed'

  const handleTimerComplete = useCallback(() => {
    finishGame()
    onNavigate('results')
  }, [finishGame, onNavigate])

  const timer = useTimer({
    mode: isTimed ? 'countdown' : 'elapsed',
    durationSeconds: 120,
    onComplete: handleTimerComplete,
  })

  // Start timer when game starts
  useEffect(() => {
    if (state.status === 'playing') {
      timer.start()
    }
    return () => timer.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Navigate to results when game finishes (for fixed mode)
  useEffect(() => {
    if (state.status === 'finished') {
      timer.stop()
      onNavigate('results')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status])

  // Handle keyboard input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (feedback) return // ignore input during feedback

      if (e.key >= '0' && e.key <= '9') {
        setInputValue((prev) => prev.length < 6 ? prev + e.key : prev)
      } else if (e.key === 'Backspace') {
        setInputValue((prev) => prev.slice(0, -1))
      } else if (e.key === 'Enter' && inputValue) {
        handleSubmit()
      } else if (e.key === '-') {
        setInputValue((prev) => prev.startsWith('-') ? prev.slice(1) : '-' + prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, feedback])

  function handleSubmit() {
    if (!inputValue || inputValue === '-' || !state.currentQuestion) return

    const answer = parseInt(inputValue, 10)
    if (isNaN(answer)) return

    const isCorrect = answer === state.currentQuestion.correctAnswer
    setFeedback(isCorrect ? 'correct' : 'wrong')

    // Clear any existing timeout
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)

    feedbackTimeoutRef.current = setTimeout(() => {
      submitAnswer(answer)
      setInputValue('')
      setFeedback(null)
    }, isCorrect ? 500 : 1500) // Show wrong answer longer so kid can see the correct one
  }

  if (!state.currentQuestion || state.status !== 'playing') {
    return null
  }

  return (
    <div className="flex flex-col h-dvh p-4 gap-3">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2">
        <Timer display={timer.display} progress={timer.progress} mode={isTimed ? 'countdown' : 'elapsed'} />
        <button
          onClick={() => { finishGame(); onNavigate('results') }}
          className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 bg-white/60 rounded-2xl cursor-pointer"
        >
          End Game
        </button>
      </div>

      <ScoreBar
        score={state.score}
        streak={state.streak}
        questionNumber={state.answeredQuestions.length + 1}
        totalQuestions={state.config?.mode === 'fixed' ? 20 : undefined}
      />

      {/* Question */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <QuestionCard question={state.currentQuestion} feedback={feedback} />
        </div>
      </div>

      {/* Input */}
      <div className="max-w-sm mx-auto w-full pb-2">
        <NumberPad
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}

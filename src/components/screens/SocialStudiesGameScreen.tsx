import { useEffect } from 'react'
import type { SocialStudiesGameState } from '../../hooks/useSocialStudiesGame'

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const

interface SocialStudiesGameScreenProps {
  gameState: SocialStudiesGameState
  onSelectAnswer: (index: number) => void
  onAdvance: () => void
  onEndGame: () => void
  onNavigate: (screen: string) => void
}

export function SocialStudiesGameScreen({
  gameState,
  onSelectAnswer,
  onAdvance,
  onEndGame,
  onNavigate,
}: SocialStudiesGameScreenProps) {
  const { status, questions, currentIndex, selectedIndex, revealed, score, error } = gameState

  // Auto-advance after 1.2 s when answer is revealed
  useEffect(() => {
    if (!revealed) return
    const timer = setTimeout(onAdvance, 1200)
    return () => clearTimeout(timer)
  }, [revealed, onAdvance])

  if (status === 'loading') {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-2xl font-bold text-primary animate-pulse">Loading questions…</div>
      </div>
    )
  }

  if (status === 'idle' && error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 gap-4">
        <div className="text-4xl">😕</div>
        <p className="text-red-500 font-medium text-center">{error}</p>
        <button
          onClick={() => onNavigate('ss-setup')}
          className="px-6 py-3 bg-primary text-white font-bold rounded-2xl"
        >
          Go Back
        </button>
      </div>
    )
  }

  if (status !== 'playing' || questions.length === 0) return null

  const question = questions[currentIndex]!
  const total = questions.length
  const progress = (currentIndex / total) * 100

  function optionClass(idx: number) {
    const base = 'w-full text-left px-4 py-3 rounded-2xl font-medium text-sm transition-all border-2 '
    if (!revealed) {
      return base + 'bg-white border-gray-200 hover:border-teal-400 hover:bg-teal-50 active:scale-95 cursor-pointer'
    }
    if (idx === question.correctIndex) {
      return base + 'bg-emerald-100 border-emerald-500 text-emerald-800'
    }
    if (idx === selectedIndex && idx !== question.correctIndex) {
      return base + 'bg-red-100 border-red-400 text-red-700'
    }
    return base + 'bg-white border-gray-200 text-gray-400'
  }

  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-b from-teal-50 to-white">
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200">
        <div
          className="h-full bg-teal-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top bar: counter · score · end game */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-xs text-gray-500 font-medium">
          Question {currentIndex + 1} of {total}
        </span>
        <span className="text-xs font-bold text-teal-600">Score: {score}</span>
        <button
          onClick={onEndGame}
          className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-white/60 rounded-xl cursor-pointer"
        >
          End Game
        </button>
      </div>

      <div className="flex-1 flex flex-col px-4 py-4 gap-5">
        {/* Topic badge */}
        <div className="self-start px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full">
          {question.topic}
        </div>

        {/* Question */}
        <div className="bg-white rounded-3xl shadow-md p-5">
          <p className="text-base font-semibold text-gray-800 leading-snug">{question.question}</p>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {question.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => !revealed && onSelectAnswer(idx)}
              className={optionClass(idx)}
              disabled={revealed}
            >
              <span className="font-bold text-primary mr-2">{OPTION_LABELS[idx]}.</span>
              {opt}
              {revealed && idx === question.correctIndex && (
                <span className="ml-2 text-emerald-600">✓</span>
              )}
              {revealed && idx === selectedIndex && idx !== question.correctIndex && (
                <span className="ml-2 text-red-500">✗</span>
              )}
            </button>
          ))}
        </div>

        {/* Reveal hint */}
        {revealed && (
          <p className="text-center text-xs text-gray-400 animate-pulse">Next question loading…</p>
        )}
      </div>
    </div>
  )
}

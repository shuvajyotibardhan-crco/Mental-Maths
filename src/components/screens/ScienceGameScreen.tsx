import { useEffect } from 'react'
import type { ScienceGameState } from '../../hooks/useScienceGame'

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const

interface ScienceGameScreenProps {
  gameState: ScienceGameState
  onToggleOption: (index: number) => void
  onSubmitAnswer: () => void
  onAdvance: () => void
  onEndGame: () => void
  onNavigate: (screen: string) => void
}

export function ScienceGameScreen({
  gameState,
  onToggleOption,
  onSubmitAnswer,
  onAdvance,
  onEndGame,
  onNavigate,
}: ScienceGameScreenProps) {
  const { status, questions, currentIndex, selectedIndices, revealed, score, error } = gameState

  // Auto-advance 2 s after answer is revealed
  useEffect(() => {
    if (!revealed) return
    const timer = setTimeout(onAdvance, 2000)
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
          onClick={() => onNavigate('sci-setup')}
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
  const isMultiSelect = question.correctIndices.length > 1
  const canSubmit = selectedIndices.length > 0 && !revealed

  function optionClass(idx: number) {
    const base = 'w-full text-left px-4 py-3 rounded-2xl font-medium text-sm transition-all border-2 flex items-center gap-3 '
    const isSelected = selectedIndices.includes(idx)
    const isCorrect = question.correctIndices.includes(idx)

    if (!revealed) {
      return base + (isSelected
        ? 'bg-orange-50 border-orange-400 text-orange-800'
        : 'bg-white border-gray-200 hover:border-orange-300 hover:bg-orange-50 active:scale-95 cursor-pointer')
    }
    // Revealed state
    if (isCorrect) return base + 'bg-emerald-100 border-emerald-500 text-emerald-800'
    if (isSelected && !isCorrect) return base + 'bg-red-100 border-red-400 text-red-700'
    return base + 'bg-white border-gray-200 text-gray-400'
  }

  function checkboxClass(idx: number) {
    const isSelected = selectedIndices.includes(idx)
    const isCorrect = revealed && question.correctIndices.includes(idx)
    const isWrong = revealed && isSelected && !question.correctIndices.includes(idx)
    const base = 'w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 text-xs font-bold '
    if (isCorrect) return base + 'bg-emerald-500 border-emerald-500 text-white'
    if (isWrong) return base + 'bg-red-400 border-red-400 text-white'
    if (isSelected) return base + 'bg-orange-500 border-orange-500 text-white'
    return base + 'bg-white border-gray-300'
  }

  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-b from-orange-50 to-white">
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200">
        <div
          className="h-full bg-orange-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-xs text-gray-500 font-medium">
          Question {currentIndex + 1} of {total}
        </span>
        <span className="text-xs font-bold text-orange-600">Score: {score}</span>
        <button
          onClick={onEndGame}
          className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-white/60 rounded-xl cursor-pointer"
        >
          End Game
        </button>
      </div>

      <div className="flex-1 flex flex-col px-4 py-4 gap-4">
        {/* Topic + multi-select badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
            {question.topic}
          </div>
          {isMultiSelect && (
            <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              Select all that apply
            </div>
          )}
        </div>

        {/* Question */}
        <div className="bg-white rounded-3xl shadow-md p-5 flex flex-col gap-3">
          {question.imageUrl && (
            <img
              src={question.imageUrl}
              alt="Science diagram"
              className="w-full max-h-48 object-contain rounded-xl bg-gray-50"
            />
          )}
          <p className="text-base font-semibold text-gray-800 leading-snug">{question.question}</p>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {question.options.map((opt, idx) => {
            const isSelected = selectedIndices.includes(idx)
            const isCorrect = revealed && question.correctIndices.includes(idx)
            const isWrong = revealed && isSelected && !question.correctIndices.includes(idx)
            return (
              <button
                key={idx}
                onClick={() => !revealed && onToggleOption(idx)}
                className={optionClass(idx)}
                disabled={revealed}
              >
                <div className={checkboxClass(idx)}>
                  {isCorrect && '✓'}
                  {isWrong && '✗'}
                  {!revealed && isSelected && '✓'}
                </div>
                <span className="font-bold text-primary mr-1">{OPTION_LABELS[idx]}.</span>
                <span className="flex-1">{opt}</span>
              </button>
            )
          })}
        </div>

        {/* Submit button (hidden after reveal) */}
        {!revealed && (
          <button
            onClick={onSubmitAnswer}
            disabled={!canSubmit}
            className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-2xl shadow transition-all cursor-pointer hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Check Answer
          </button>
        )}

        {revealed && (
          <p className="text-center text-xs text-gray-400 animate-pulse">Next question loading…</p>
        )}
      </div>
    </div>
  )
}

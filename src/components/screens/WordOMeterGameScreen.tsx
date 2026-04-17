import { useEffect } from 'react'
import type { WOMGameState } from '../../hooks/useWordOMeterGame'
import type { WOMTileState, WOMHintType } from '../../types/wordOMeter'

const HINT_LABELS: Record<WOMHintType, string> = {
  partOfSpeech: 'Part of Speech',
  vowelCount: 'Vowel Count',
  synonym: 'Synonym',
  antonym: 'Antonym',
  revealFirst: 'First Letter',
  revealLast: 'Last Letter',
  revealMiddle: 'Middle Letter',
  commonBlend: 'Word Blend',
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['⌫', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '✓'],
]

interface WordOMeterGameScreenProps {
  gameState: WOMGameState
  onTypeLetter: (letter: string) => void
  onDeleteLetter: () => void
  onSubmitGuess: () => void
  onUseHint: (type: WOMHintType) => void
  onEndGame: () => void
  onNavigate: (screen: string) => void
}

export function WordOMeterGameScreen({
  gameState,
  onTypeLetter,
  onDeleteLetter,
  onSubmitGuess,
  onUseHint,
  onEndGame,
}: WordOMeterGameScreenProps) {
  const {
    status, letterCount, guesses, currentGuess, maxAttempts,
    letterStates, hintsUsed, availableHints, shake, error, validating,
  } = gameState

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (status !== 'playing' || validating) return
      if (e.key === 'Enter') { e.preventDefault(); onSubmitGuess() }
      else if (e.key === 'Backspace') { e.preventDefault(); onDeleteLetter() }
      else if (/^[a-zA-Z]$/.test(e.key)) onTypeLetter(e.key)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [status, validating, onTypeLetter, onDeleteLetter, onSubmitGuess])

  if (status !== 'playing') return null

  function tileClass(state: WOMTileState): string {
    const base = 'flex items-center justify-center rounded-xl font-bold border-2 select-none '
    switch (state) {
      case 'correct': return base + 'bg-emerald-500 border-emerald-500 text-white'
      case 'present': return base + 'bg-amber-400 border-amber-400 text-white'
      case 'absent':  return base + 'bg-gray-400 border-gray-400 text-white'
      case 'hinted':  return base + 'bg-blue-300 border-blue-300 text-white'
      default:        return base + 'bg-white border-gray-300 text-gray-800'
    }
  }

  function tileSize(): string {
    if (letterCount <= 4) return 'w-12 h-12 text-xl'
    if (letterCount === 5) return 'w-11 h-11 text-lg'
    if (letterCount === 6) return 'w-10 h-10 text-base'
    return 'w-8 h-8 text-sm'
  }

  function keyClass(key: string): string {
    if (key === '⌫') {
      return 'flex-[1.8] min-w-0 h-10 rounded-xl font-bold text-base transition-all cursor-pointer active:scale-95 bg-rose-100 text-rose-600 hover:bg-rose-200'
    }
    if (key === '✓') {
      const disabled = validating
      return `flex-[1.8] min-w-0 h-10 rounded-xl font-bold text-base transition-all cursor-pointer active:scale-95 ${disabled ? 'bg-gray-200 text-gray-400' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`
    }
    const base = 'flex-1 min-w-0 h-10 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 '
    switch (letterStates[key]) {
      case 'correct': return base + 'bg-emerald-500 text-white'
      case 'present': return base + 'bg-amber-400 text-white'
      case 'absent':  return base + 'bg-gray-400 text-white'
      default:        return base + 'bg-gray-200 text-gray-800 hover:bg-gray-300'
    }
  }

  const size = tileSize()

  const rows = Array.from({ length: maxAttempts }, (_, i) => {
    if (i < guesses.length) return guesses[i]!
    if (i === guesses.length) {
      return Array.from({ length: letterCount }, (_, j) => ({
        letter: currentGuess[j] ?? '',
        state: 'empty' as WOMTileState,
      }))
    }
    return Array.from({ length: letterCount }, () => ({ letter: '', state: 'empty' as WOMTileState }))
  })

  return (
    <div className="flex flex-col h-dvh bg-gradient-to-b from-amber-50 to-white overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
        <span className="text-sm font-medium text-gray-600">
          Attempt {Math.min(guesses.length + 1, maxAttempts)} / {maxAttempts}
        </span>
        <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
          {letterCount} letters
        </span>
        <button
          onClick={onEndGame}
          className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-white/60 rounded-xl cursor-pointer"
        >
          End Game
        </button>
      </div>

      {/* Error / validating */}
      {validating && (
        <p className="text-center text-xs text-amber-600 px-4 pb-1 shrink-0">Checking word…</p>
      )}
      {!validating && error && (
        <p className="text-center text-xs text-red-500 px-4 pb-1 shrink-0 animate-slide-in">{error}</p>
      )}

      {/* Tile grid */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1.5 px-4 min-h-0">
        {rows.map((row, ri) => (
          <div
            key={ri}
            className={`flex gap-1.5 ${ri === guesses.length && shake ? 'animate-shake' : ''}`}
          >
            {row.map((tile, ci) => (
              <div key={ci} className={`${size} ${tileClass(tile.state)}`}>
                {tile.letter}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Hints used */}
      {hintsUsed.length > 0 && (
        <div className="px-4 py-1.5 shrink-0 space-y-1">
          {hintsUsed.map((h, i) => (
            <p key={i} className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1">
              💡 {h.text}
            </p>
          ))}
        </div>
      )}

      {/* Available hints */}
      {availableHints.length > 0 && (
        <div className="px-4 py-1.5 shrink-0">
          {(() => {
            const maxHints = letterCount <= 4 ? 1 : letterCount <= 6 ? 2 : 3
            const remaining = maxHints - hintsUsed.length
            return (
              <>
                <p className="text-xs text-amber-600 mb-1">
                  💡 {remaining} hint{remaining !== 1 ? 's' : ''} remaining
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                  {availableHints.map((type) => (
                    <button
                      key={type}
                      onClick={() => onUseHint(type)}
                      className="shrink-0 px-2.5 py-1 bg-white/80 text-amber-700 text-xs font-medium rounded-xl border border-amber-200 hover:bg-amber-50 cursor-pointer active:scale-95 transition-all"
                    >
                      {HINT_LABELS[type]}
                    </button>
                  ))}
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* QWERTY keyboard */}
      <div className="px-2 pb-3 pt-1 shrink-0 space-y-1.5">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {ri === 1 && <div className="flex-[0.5]" />}
            {row.map((key) => (
              <button
                key={key}
                disabled={validating && key !== '⌫'}
                onPointerDown={(e) => {
                  e.preventDefault()
                  if (validating && key !== '⌫') return
                  if (key === '⌫') onDeleteLetter()
                  else if (key === '✓') onSubmitGuess()
                  else onTypeLetter(key)
                }}
                className={keyClass(key)}
              >
                {key}
              </button>
            ))}
            {ri === 1 && <div className="flex-[0.5]" />}
          </div>
        ))}
      </div>
    </div>
  )
}

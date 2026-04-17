import type { WOMGameState } from '../../hooks/useWordOMeterGame'
import type { WOMTileState } from '../../types/wordOMeter'

interface WordOMeterResultsScreenProps {
  gameState: WOMGameState
  onPlayAgain: () => void
  onNavigate: (screen: string) => void
}

export function WordOMeterResultsScreen({
  gameState,
  onPlayAgain,
  onNavigate,
}: WordOMeterResultsScreenProps) {
  const { status, word, guesses, score, hintsUsed, maxAttempts } = gameState
  const won = status === 'won'
  const attemptsUsed = guesses.length

  function tileClass(state: WOMTileState): string {
    switch (state) {
      case 'correct': return 'bg-emerald-500'
      case 'present': return 'bg-amber-400'
      case 'absent':  return 'bg-gray-400'
      default:        return 'bg-gray-200'
    }
  }

  return (
    <div className="flex flex-col items-center p-6 gap-5 min-h-[70vh]">
      <div className="text-center animate-bounce-in">
        <div className="text-6xl mb-2">{won ? '🎉' : '😔'}</div>
        <h1 className="text-2xl font-bold text-primary-dark">
          {won ? 'Well done!' : 'Better luck next time!'}
        </h1>
        {word && (
          <p className="text-3xl font-black text-amber-600 mt-2 tracking-widest">{word.word}</p>
        )}
        {word && (
          <p className="text-sm text-gray-500 mt-1 italic max-w-xs">
            {word.meanings[0]}
          </p>
        )}
        {word && word.meanings[1] && (
          <p className="text-sm text-gray-400 mt-0.5 italic max-w-xs">
            {word.meanings[1]}
          </p>
        )}
      </div>

      {/* Guess replay grid */}
      {guesses.length > 0 && (
        <div className="flex flex-col gap-1">
          {guesses.map((row, ri) => (
            <div key={ri} className="flex gap-1">
              {row.map((tile, ci) => (
                <div
                  key={ci}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${tileClass(tile.state)}`}
                >
                  {tile.letter}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="w-full max-w-xs bg-white/80 rounded-3xl shadow p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Score</span>
          <span className="font-bold text-primary-dark text-lg">⭐ {score}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Attempts</span>
          <span className="font-bold text-primary-dark">{attemptsUsed} / {maxAttempts}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Hints used</span>
          <span className="font-bold text-amber-600">{hintsUsed.length}</span>
        </div>
        {word && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Part of speech</span>
            <span className="font-bold text-primary-dark capitalize">
              {word.partOfSpeech.join(', ')}
            </span>
          </div>
        )}
        {word && word.synonyms.length > 0 && (
          <div className="flex items-start justify-between gap-2">
            <span className="text-gray-600 font-medium shrink-0">Synonyms</span>
            <span className="font-medium text-primary-dark text-right">
              {word.synonyms.join(', ')}
            </span>
          </div>
        )}
      </div>

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={onPlayAgain}
          className="w-full py-5 bg-amber-500 text-white font-bold text-xl rounded-3xl shadow-lg hover:bg-amber-600 hover:shadow-xl active:scale-95 transition-all cursor-pointer"
        >
          Play Again
        </button>
        <button
          onClick={() => onNavigate('home')}
          className="w-full py-4 bg-white/80 text-primary-dark font-semibold text-lg rounded-3xl shadow hover:shadow-md active:scale-95 transition-all cursor-pointer"
        >
          Home
        </button>
      </div>
    </div>
  )
}

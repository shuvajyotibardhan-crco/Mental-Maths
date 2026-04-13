import type { SocialStudiesGameState } from '../../hooks/useSocialStudiesGame'

interface SocialStudiesResultsScreenProps {
  gameState: SocialStudiesGameState
  onPlayAgain: () => void
  onNavigate: (screen: string) => void
}

export function SocialStudiesResultsScreen({
  gameState,
  onPlayAgain,
  onNavigate,
}: SocialStudiesResultsScreenProps) {
  const { answered, score, bestStreak } = gameState
  const total = answered.length
  const correct = answered.filter((a) => a.isCorrect).length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  let emoji = '😔'
  let message = 'Keep practicing!'
  if (accuracy >= 90) { emoji = '🏆'; message = 'Outstanding!' }
  else if (accuracy >= 75) { emoji = '🌟'; message = 'Great job!' }
  else if (accuracy >= 60) { emoji = '👍'; message = 'Good effort!' }
  else if (accuracy >= 40) { emoji = '💪'; message = 'Keep going!' }

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-6 min-h-[70vh]">
      <div className="text-center animate-bounce-in">
        <div className="text-6xl mb-3">{emoji}</div>
        <h1 className="text-2xl font-bold text-primary-dark">{message}</h1>
        <p className="text-gray-500 text-sm mt-1">Social Studies Quiz Complete</p>
      </div>

      <div className="w-full max-w-xs bg-white/80 rounded-3xl shadow p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Score</span>
          <span className="font-bold text-primary-dark text-lg">{score} / {total * 5}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Correct</span>
          <span className="font-bold text-emerald-600">{correct} / {total}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Accuracy</span>
          <span className="font-bold text-primary-dark">{accuracy}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Best Streak</span>
          <span className="font-bold text-amber-500">{bestStreak} 🔥</span>
        </div>
      </div>

      {/* Review incorrect answers */}
      {answered.some((a) => !a.isCorrect) && (
        <div className="w-full max-w-xs">
          <h2 className="font-semibold text-gray-600 mb-2 text-sm">Review incorrect answers:</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {answered.filter((a) => !a.isCorrect).map((a, i) => (
              <div key={i} className="bg-red-50 rounded-2xl px-4 py-3 text-sm">
                <p className="font-medium text-gray-800 mb-1">{a.question.question}</p>
                <p className="text-emerald-700">
                  ✓ {a.question.options[a.question.correctIndex]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={onPlayAgain}
          className="w-full py-5 bg-teal-500 text-white font-bold text-xl rounded-3xl shadow-lg hover:bg-teal-600 hover:shadow-xl active:scale-95 transition-all cursor-pointer"
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

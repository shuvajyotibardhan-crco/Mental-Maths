import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useGame } from '../../context/GameContext'
import { saveSession, checkAndUpdateHighScore } from '../../firebase/firestore'
import { OPERATION_LABELS } from '../../constants/gradeConfig'
import type { SessionRecord, HighScoreKey } from '../../types'

interface ResultsScreenProps {
  onNavigate: (screen: string) => void
}

export function ResultsScreen({ onNavigate }: ResultsScreenProps) {
  const { profile } = useAuth()
  const { state, resetGame } = useGame()
  const [isHighScore, setIsHighScore] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveAttemptedRef = useRef(false)

  const answered = state.answeredQuestions
  const correct = answered.filter((q) => q.isCorrect).length
  const total = answered.length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const avgTimeMs = total > 0
    ? Math.round(answered.reduce((sum, q) => sum + q.responseTimeMs, 0) / total)
    : 0

  // Save session to Firestore
  useEffect(() => {
    if (!profile || !state.config || saved || saveAttemptedRef.current) return
    saveAttemptedRef.current = true

    async function save() {
      const session: SessionRecord = {
        id: '',
        userId: profile!.uid,
        timestamp: Date.now(),
        grade: state.config!.grade,
        operation: state.config!.operation,
        difficulty: state.config!.difficulty,
        mode: state.config!.mode,
        totalQuestions: total,
        correctAnswers: correct,
        accuracy,
        score: state.score,
        timeTakenSeconds: Math.round(
          (answered[answered.length - 1]!.answeredAt - answered[0]!.answeredAt) / 1000
        ),
        bestStreak: state.bestStreak,
        isHighScore: false,
      }

      const sessionId = await saveSession(session)

      // Check high score
      const key: HighScoreKey = `${state.config!.grade}_${state.config!.operation}_${state.config!.difficulty}_${state.config!.mode}`
      const isNew = await checkAndUpdateHighScore(profile!.uid, key, state.score, sessionId)
      setIsHighScore(isNew)
      setSaved(true)
    }

    save().catch(console.error)
  }, [profile, state, saved, total, correct, accuracy, answered])

  function handlePlayAgain() {
    resetGame()
    onNavigate('setup')
  }

  function handleHome() {
    resetGame()
    onNavigate('home')
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-3xl shadow-lg p-8 text-center space-y-6">
        {/* High Score Banner */}
        {isHighScore && (
          <div className="animate-bounce-in bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl p-4 shadow-md">
            <p className="text-2xl font-bold">🏆 New High Score!</p>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-primary-dark mb-1">Game Over!</h2>
          {state.config && (
            <p className="text-gray-500">
              {OPERATION_LABELS[state.config.operation]} • {state.config.difficulty} • {state.config.mode === 'timed' ? '2 min' : '20 Qs'}
            </p>
          )}
        </div>

        {/* Score */}
        <div className="text-5xl font-bold text-primary animate-bounce-in">
          ⭐ {state.score}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 rounded-2xl p-4">
            <p className="text-sm text-gray-500">Correct</p>
            <p className="text-2xl font-bold text-emerald-600">{correct}/{total}</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4">
            <p className="text-sm text-gray-500">Accuracy</p>
            <p className="text-2xl font-bold text-blue-600">{accuracy}%</p>
          </div>
          <div className="bg-orange-50 rounded-2xl p-4">
            <p className="text-sm text-gray-500">Best Streak</p>
            <p className="text-2xl font-bold text-orange-600">🔥 {state.bestStreak}</p>
          </div>
          <div className="bg-purple-50 rounded-2xl p-4">
            <p className="text-sm text-gray-500">Avg Time</p>
            <p className="text-2xl font-bold text-purple-600">{(avgTimeMs / 1000).toFixed(1)}s</p>
          </div>
        </div>

        {/* Stars */}
        <div className="text-4xl">
          {accuracy >= 90 ? '⭐⭐⭐' : accuracy >= 70 ? '⭐⭐' : '⭐'}
        </div>

        {/* Question Review */}
        <div className="text-left space-y-2">
          <h3 className="font-bold text-gray-700 text-center">Question Review</h3>
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {answered.map((q, i) => (
              <div
                key={q.id}
                className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
                  q.isCorrect ? 'bg-emerald-50' : 'bg-orange-50'
                }`}
              >
                <span className="font-medium text-gray-400 mt-0.5">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">
                    {q.displayString.replace(' = ?', '')}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`font-medium ${q.isCorrect ? 'text-emerald-600' : 'text-orange-600'}`}>
                      Your answer: {q.userAnswer ?? 'Skipped'}
                    </span>
                    {!q.isCorrect && (
                      <span className="text-emerald-600 font-medium">
                        Correct: {q.correctAnswer}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-lg mt-0.5">{q.isCorrect ? '✅' : '❌'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handlePlayAgain}
            className="w-full py-4 bg-primary text-white font-bold text-lg rounded-2xl hover:bg-primary-dark active:scale-95 transition-all cursor-pointer"
          >
            Play Again
          </button>
          <button
            onClick={handleHome}
            className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 cursor-pointer"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  )
}

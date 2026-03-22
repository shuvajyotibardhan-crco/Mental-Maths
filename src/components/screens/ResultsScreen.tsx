import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useGame } from '../../context/GameContext'
import { saveSession, checkAndUpdateHighScore, checkAndUpdateGlobalHighScore, getHighScores, getGlobalHighScore } from '../../firebase/firestore'
import { OPERATION_LABELS } from '../../constants/gradeConfig'
import type { SessionRecord, HighScoreKey } from '../../types'

interface ResultsScreenProps {
  onNavigate: (screen: string) => void
}

export function ResultsScreen({ onNavigate }: ResultsScreenProps) {
  const { profile } = useAuth()
  const { state, resetGame } = useGame()
  const [isNewPersonalBest, setIsNewPersonalBest] = useState(false)
  const [isNewGlobalBest, setIsNewGlobalBest] = useState(false)
  const [, setHadPreviousScore] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveAttemptedRef = useRef(false)
  const [userBest, setUserBest] = useState<number | null>(null)
  const [globalBest, setGlobalBest] = useState<number | null>(null)

  const answered = state.answeredQuestions
  const correct = answered.filter((q) => q.isCorrect).length
  const total = answered.length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const totalTimeMs = answered.reduce((sum, q) => sum + q.responseTimeMs, 0)
  const avgTimeMs = total > 0 ? Math.round(totalTimeMs / total) : 0
  const totalTimeSecs = Math.round(totalTimeMs / 1000)
  const isFixedMode = state.config?.mode === 'fixed'

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

      const key: HighScoreKey = `${state.config!.grade}_${state.config!.operation}_${state.config!.difficulty}_${state.config!.mode}`
      const timeForScoring = state.config!.mode === 'fixed' ? session.timeTakenSeconds : undefined

      // Check if there was a previous personal best before updating
      const existingScores = await getHighScores(profile!.uid)
      const hadPrevious = !!existingScores[key]
      setHadPreviousScore(hadPrevious)

      // Check & update personal high score (pass time for fixed mode tiebreaking)
      const isNewPB = await checkAndUpdateHighScore(profile!.uid, key, state.score, sessionId, timeForScoring)
      setIsNewPersonalBest(isNewPB && hadPrevious) // Only celebrate if they beat a previous score

      // Check & update global high score
      const existingGlobal = await getGlobalHighScore(key)
      const isNewGB = await checkAndUpdateGlobalHighScore(key, state.score, timeForScoring)
      setIsNewGlobalBest(isNewGB && !!existingGlobal) // Only celebrate if they beat someone else's score

      // Fetch updated scores for display
      const userScores = await getHighScores(profile!.uid)
      if (userScores[key]) {
        setUserBest(userScores[key].score)
      }
      const globalEntry = await getGlobalHighScore(key)
      if (globalEntry) {
        setGlobalBest(globalEntry.score)
      }

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

  // Show loading until all data is saved and fetched
  if (!saved) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-spin">⭐</div>
          <p className="text-lg font-medium text-gray-500">Calculating results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-8">
      <div className="w-full max-w-md mx-auto bg-white/90 backdrop-blur rounded-3xl shadow-lg p-8 text-center space-y-6">
        {/* High Score Banners */}
        {isNewGlobalBest && (
          <div className="animate-bounce-in bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl p-4 shadow-md">
            <p className="text-2xl font-bold">🌍 New #1 Global Score!</p>
          </div>
        )}
        {isNewPersonalBest && !isNewGlobalBest && (
          <div className="animate-bounce-in bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl p-4 shadow-md">
            <p className="text-2xl font-bold">🏆 New Personal Best!</p>
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
            <p className="text-sm text-gray-500">{isFixedMode ? 'Total Time' : 'Avg Time'}</p>
            <p className="text-2xl font-bold text-purple-600">
              {isFixedMode
                ? `${Math.floor(totalTimeSecs / 60)}:${(totalTimeSecs % 60).toString().padStart(2, '0')}`
                : `${(avgTimeMs / 1000).toFixed(1)}s`
              }
            </p>
          </div>
        </div>

        {/* Stars */}
        <div className="text-4xl">
          {accuracy >= 90 ? '⭐⭐⭐' : accuracy >= 70 ? '⭐⭐' : '⭐'}
        </div>

        {/* High Scores */}
        {(userBest !== null || globalBest !== null) && (
          <div className="grid grid-cols-2 gap-3">
            {userBest !== null && (
              <div className="bg-amber-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500">Your Personal Best</p>
                <p className="text-2xl font-bold text-amber-600">🏆 {userBest}</p>
              </div>
            )}
            {globalBest !== null && (
              <div className="bg-indigo-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500">Global #1 (All Players)</p>
                <p className="text-2xl font-bold text-indigo-600">🌍 {globalBest}</p>
              </div>
            )}
          </div>
        )}

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

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useChallengeListener } from '../../hooks/useChallengeListener'
import { saveSession, checkAndUpdateHighScore, checkAndUpdateGlobalHighScore, getHighScores, getGlobalHighScore } from '../../firebase/firestore'
import { saveSocialStudiesSession } from '../../firebase/socialStudies'
import { saveWordOMeterSession } from '../../firebase/wordOMeter'
import { OPERATION_LABELS } from '../../constants/gradeConfig'
import type { SessionRecord, HighScoreKey } from '../../types'
import type { WOMWord } from '../../types/wordOMeter'

interface ChallengeResultsScreenProps {
  gameCode: string
  onNavigate: (screen: string) => void
}

export function ChallengeResultsScreen({ gameCode, onNavigate }: ChallengeResultsScreenProps) {
  const { profile } = useAuth()
  const { challenge } = useChallengeListener(gameCode)
  const [isNewPersonalBest, setIsNewPersonalBest] = useState(false)
  const [isNewGlobalBest, setIsNewGlobalBest] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveAttemptedRef = useRef(false)

  const me = challenge && profile ? challenge.players[profile.uid] : null
  const subject = challenge?.config.subject ?? 'mentalMaths'
  const isSS = subject === 'socialStudies'
  const isWOM = subject === 'wordOMeter'

  // Save session + (maths only) check high scores
  useEffect(() => {
    if (!profile || !challenge || !me || saved || saveAttemptedRef.current) return
    if (challenge.status !== 'finished') return
    saveAttemptedRef.current = true

    async function save() {
      if (isSS) {
        const accuracy = me!.totalAnswered > 0
          ? parseFloat(((me!.correctAnswers / me!.totalAnswered) * 100).toFixed(2))
          : 0
        await saveSocialStudiesSession({
          userId: profile!.uid,
          timestamp: Date.now(),
          grade: challenge!.config.grade,
          subject: 'socialStudies',
          totalQuestions: me!.totalAnswered,
          correctAnswers: me!.correctAnswers,
          accuracy,
          score: me!.score,
          timeTakenSeconds: me!.timeTakenSeconds ?? 0,
          bestStreak: me!.bestStreak,
          isHighScore: false,
          challengeId: gameCode,
        })
        setSaved(true)
        return
      }

      if (isWOM) {
        // In WOM: correctAnswers=won(0/1), totalAnswered=attemptsUsed, bestStreak=hintsUsed
        const womWord = (challenge!.questions as WOMWord[])[0]
        if (womWord) {
          await saveWordOMeterSession({
            userId: profile!.uid,
            timestamp: Date.now(),
            grade: challenge!.config.grade,
            subject: 'wordOMeter',
            word: womWord.word,
            letterCount: womWord.letterCount,
            won: me!.correctAnswers === 1,
            attemptsUsed: me!.totalAnswered,
            maxAttempts: womWord.letterCount,
            hintsUsed: me!.bestStreak,
            score: me!.score,
            timeTakenSeconds: me!.timeTakenSeconds ?? 0,
            challengeId: gameCode,
          })
        }
        setSaved(true)
        return
      }

      // Mental Maths challenge — save + high score check
      const accuracy = me!.totalAnswered > 0
        ? parseFloat(((me!.correctAnswers / me!.totalAnswered) * 100).toFixed(2))
        : 0
      const session: SessionRecord = {
        id: '',
        userId: profile!.uid,
        timestamp: Date.now(),
        grade: challenge!.config.grade,
        operation: challenge!.config.operation ?? 'addition',
        difficulty: challenge!.config.difficulty ?? 'easy',
        mode: challenge!.config.mode,
        totalQuestions: me!.totalAnswered,
        correctAnswers: me!.correctAnswers,
        accuracy,
        score: me!.score,
        timeTakenSeconds: me!.timeTakenSeconds ?? 0,
        bestStreak: me!.bestStreak,
        isHighScore: false,
        challengeId: gameCode,
      }

      const sessionId = await saveSession(session)

      const key: HighScoreKey = `${challenge!.config.grade}_${challenge!.config.operation ?? 'mix'}_${challenge!.config.difficulty ?? 'easy'}_${challenge!.config.mode}`
      const timeForScoring = challenge!.config.mode === 'fixed' ? session.timeTakenSeconds : undefined

      const existingScores = await getHighScores(profile!.uid)
      const hadPrevious = !!existingScores[key]
      const isNewPB = await checkAndUpdateHighScore(profile!.uid, key, me!.score, sessionId, timeForScoring)
      setIsNewPersonalBest(isNewPB && hadPrevious)

      const existingGlobal = await getGlobalHighScore(key)
      const isNewGB = await checkAndUpdateGlobalHighScore(key, me!.score, timeForScoring)
      setIsNewGlobalBest(isNewGB && !!existingGlobal)

      setSaved(true)
    }

    save().catch(console.error)
  }, [profile, challenge, me, saved, gameCode, isSS, isWOM])

  if (!challenge || challenge.status !== 'finished') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-500 animate-pulse">Loading results...</div>
      </div>
    )
  }

  const leaderboard = Object.entries(challenge.players)
    .map(([uid, p]) => ({ uid, ...p }))
    .sort((a, b) => {
      if (isWOM) {
        // Solved players before unsolved
        if (a.correctAnswers !== b.correctAnswers) return b.correctAnswers - a.correctAnswers
        if (a.correctAnswers === 0) return 0
        // Both solved: fastest time wins
        const aTime = a.timeTakenSeconds ?? Infinity
        const bTime = b.timeTakenSeconds ?? Infinity
        if (aTime !== bTime) return aTime - bTime
        // Tie on time: fewest tries wins (totalAnswered = attemptsUsed)
        if (a.totalAnswered !== b.totalAnswered) return a.totalAnswered - b.totalAnswered
        // Tie on tries: fewest hints wins (bestStreak = hintsUsed)
        return a.bestStreak - b.bestStreak
      }
      // Non-WOM: sort by score desc, then time asc
      if (b.score !== a.score) return b.score - a.score
      if (a.timeTakenSeconds != null && b.timeTakenSeconds != null) return a.timeTakenSeconds - b.timeTakenSeconds
      return 0
    })

  const winner = leaderboard[0]
  const myRank = leaderboard.findIndex((p) => p.uid === profile?.uid) + 1

  function gameSubtitle() {
    if (isSS) return `Social Studies · Grade ${challenge!.config.grade} · 20 Questions`
    if (isWOM) return `Word-O-Meter · ${challenge!.config.letterCount ?? '?'}-letter · Grade ${challenge!.config.grade}`
    const op = challenge!.config.operation ? OPERATION_LABELS[challenge!.config.operation] : '—'
    const mode = challenge!.config.mode === 'timed' ? '2 min' : '20 Qs'
    return `${op} · ${challenge!.config.difficulty ?? '—'} · ${mode}`
  }

  function renderPlayerStats(player: typeof leaderboard[0]) {
    if (isWOM) {
      const won = player.correctAnswers === 1
      const attempts = player.totalAnswered
      const hints = player.bestStreak
      return (
        <p className="text-xs text-gray-500">
          {won ? `✓ Solved in ${attempts} tr${attempts === 1 ? 'y' : 'ies'}` : '✗ Not solved'}
          {hints > 0 && ` · ${hints} hint${hints !== 1 ? 's' : ''}`}
          {player.timeTakenSeconds != null && ` · ${Math.floor(player.timeTakenSeconds / 60)}:${(player.timeTakenSeconds % 60).toString().padStart(2, '0')}`}
        </p>
      )
    }
    const accuracy = player.totalAnswered > 0
      ? parseFloat(((player.correctAnswers / player.totalAnswered) * 100).toFixed(2))
      : 0
    return (
      <p className="text-xs text-gray-500">
        {player.correctAnswers}/{player.totalAnswered} ({accuracy}%)
        {player.timeTakenSeconds != null && ` · ${Math.floor(player.timeTakenSeconds / 60)}:${(player.timeTakenSeconds % 60).toString().padStart(2, '0')}`}
      </p>
    )
  }

  return (
    <div className="p-4 pb-8">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* High Score Banners (maths only) */}
        {!isSS && !isWOM && isNewGlobalBest && (
          <div className="animate-bounce-in bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl p-4 shadow-md text-center">
            <p className="text-2xl font-bold">New #1 Global Score!</p>
          </div>
        )}
        {!isSS && !isWOM && isNewPersonalBest && !isNewGlobalBest && (
          <div className="animate-bounce-in bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl p-4 shadow-md text-center">
            <p className="text-2xl font-bold">New Personal Best!</p>
          </div>
        )}

        {/* Winner Announcement */}
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-lg p-6 text-center">
          <div className="text-5xl mb-2">{winner?.avatar}</div>
          <h2 className="text-2xl font-bold text-primary-dark">
            {winner?.uid === profile?.uid ? 'You Won!' : `${winner?.name} Wins!`}
          </h2>
          <p className="text-gray-500 mt-1 text-sm">{gameSubtitle()}</p>
          {isWOM && (
            <p className="mt-2 text-lg font-bold text-violet-700">
              The word was: {((challenge.questions as WOMWord[])[0])?.word}
            </p>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-lg p-6">
          <h3 className="font-bold text-gray-700 text-center mb-4">Leaderboard</h3>
          <div className="space-y-3">
            {leaderboard.map((player, i) => {
              const rank = i + 1
              const isMe = player.uid === profile?.uid

              return (
                <div
                  key={player.uid}
                  className={`flex items-center gap-3 p-3 rounded-2xl ${
                    isMe ? 'bg-primary/5 ring-2 ring-primary/20' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-2xl font-bold text-gray-400 w-8 text-center">
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                  </div>
                  <span className="text-2xl">{player.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {isMe ? 'You' : player.name}
                    </p>
                    {renderPlayerStats(player)}
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${isWOM ? 'text-violet-600' : 'text-primary'}`}>⭐ {player.score}</p>
                    {!isWOM && player.bestStreak >= 3 && (
                      <p className="text-xs text-orange-500">🔥 {player.bestStreak}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Your Stats */}
        {me && (
          <div className="bg-white/90 backdrop-blur rounded-3xl shadow-lg p-6">
            <h3 className="font-bold text-gray-700 text-center mb-3">Your Stats</h3>
            {isWOM ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-500">Rank</p>
                  <p className="text-2xl font-bold text-emerald-600">#{myRank}</p>
                </div>
                <div className="bg-violet-50 rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-500">Result</p>
                  <p className="text-2xl font-bold text-violet-600">{me.correctAnswers === 1 ? '✓ Won' : '✗ Lost'}</p>
                </div>
                <div className="bg-blue-50 rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-500">Attempts</p>
                  <p className="text-2xl font-bold text-blue-600">{me.totalAnswered}</p>
                </div>
                <div className="bg-purple-50 rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-500">Score</p>
                  <p className="text-2xl font-bold text-purple-600">⭐ {me.score}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-500">Rank</p>
                  <p className="text-2xl font-bold text-emerald-600">#{myRank}</p>
                </div>
                <div className="bg-blue-50 rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-500">Accuracy</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {me.totalAnswered > 0 ? parseFloat(((me.correctAnswers / me.totalAnswered) * 100).toFixed(2)) : 0}%
                  </p>
                </div>
                <div className="bg-orange-50 rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-500">Best Streak</p>
                  <p className="text-2xl font-bold text-orange-600">🔥 {me.bestStreak}</p>
                </div>
                <div className="bg-purple-50 rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-500">Score</p>
                  <p className="text-2xl font-bold text-purple-600">⭐ {me.score}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => onNavigate('home')}
            className="w-full py-4 bg-primary text-white font-bold text-lg rounded-2xl hover:bg-primary-dark active:scale-95 transition-all cursor-pointer"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  )
}

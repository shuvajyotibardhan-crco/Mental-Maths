import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useChallengeListener } from '../../hooks/useChallengeListener'
import { useChallengeGame } from '../../hooks/useChallengeGame'
import { useTimer } from '../../hooks/useTimer'
import { finishChallenge } from '../../firebase/challenge'
import { QuestionCard } from '../game/QuestionCard'
import { NumberPad } from '../game/NumberPad'
import { Timer } from '../game/Timer'
import { ScoreBar } from '../game/ScoreBar'
import type { Challenge } from '../../types'

interface ChallengeGameScreenProps {
  gameCode: string
  onNavigate: (screen: string) => void
}

export function ChallengeGameScreen({ gameCode, onNavigate }: ChallengeGameScreenProps) {
  const { profile } = useAuth()
  const { challenge, loading } = useChallengeListener(gameCode)

  // Wait until challenge data is loaded before rendering the game
  if (loading || !challenge || !profile) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="text-xl text-gray-500 animate-pulse">Loading game...</div>
      </div>
    )
  }

  return (
    <ChallengeGameInner
      gameCode={gameCode}
      challenge={challenge}
      uid={profile.uid}
      onNavigate={onNavigate}
    />
  )
}

// Inner component — only mounts once challenge data is available
function ChallengeGameInner({
  gameCode,
  challenge,
  uid,
  onNavigate,
}: {
  gameCode: string
  challenge: Challenge
  uid: string
  onNavigate: (screen: string) => void
}) {
  const { profile } = useAuth()
  const { challenge: liveChallenge } = useChallengeListener(gameCode)
  const currentChallenge = liveChallenge ?? challenge

  const [inputValue, setInputValue] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigatedRef = useRef(false)

  const isTimed = challenge.config.mode === 'timed'

  // Hook initializes with real questions from the challenge (guaranteed non-empty)
  const game = useChallengeGame({
    gameCode,
    uid,
    questions: challenge.questions,
    config: challenge.config,
  })

  const handleTimerComplete = useCallback(() => {
    game.finishGame()
  }, [game])

  const timer = useTimer({
    mode: isTimed ? 'countdown' : 'elapsed',
    durationSeconds: 120,
    onComplete: handleTimerComplete,
  })

  // Start timer when component mounts
  useEffect(() => {
    timer.start()
    return () => timer.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When this player finishes, check if all are done → mark challenge finished
  useEffect(() => {
    if (!game.finished || !currentChallenge || navigatedRef.current) return

    const allFinished = Object.values(currentChallenge.players).every((p) => p.finished)
    if (allFinished && currentChallenge.status !== 'finished') {
      finishChallenge(gameCode).catch(console.error)
    }
  }, [game.finished, currentChallenge, gameCode])

  // Navigate to results when challenge status becomes 'finished'
  useEffect(() => {
    if (currentChallenge?.status === 'finished' && !navigatedRef.current) {
      navigatedRef.current = true
      timer.stop()
      onNavigate('challenge-results')
    }
  }, [currentChallenge?.status, onNavigate, timer])

  // If this player finished but others haven't, stop timer
  useEffect(() => {
    if (game.finished) {
      timer.stop()
    }
  }, [game.finished, timer])

  // Handle keyboard input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (feedback || game.finished) return
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
  }, [inputValue, feedback, game.finished])

  function handleSubmit() {
    if (!inputValue || inputValue === '-' || !game.currentQuestion) return
    const answer = parseInt(inputValue, 10)
    if (isNaN(answer)) return

    const isCorrect = answer === game.currentQuestion.correctAnswer
    setFeedback(isCorrect ? 'correct' : 'wrong')

    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    feedbackTimeoutRef.current = setTimeout(() => {
      game.submitAnswer(answer)
      setInputValue('')
      setFeedback(null)
    }, isCorrect ? 500 : 1500)
  }

  // Waiting for others to finish
  if (game.finished && currentChallenge?.status !== 'finished') {
    const totalPlayers = Object.keys(currentChallenge?.players ?? {}).length
    const finishedPlayers = Object.values(currentChallenge?.players ?? {}).filter((p) => p.finished).length

    return (
      <div className="flex flex-col items-center justify-center h-dvh p-6 gap-4">
        <div className="text-4xl animate-pulse">Waiting for others...</div>
        <p className="text-gray-500 text-lg">{finishedPlayers} / {totalPlayers} finished</p>
        <div className="bg-white/80 rounded-2xl p-4 text-center">
          <p className="text-sm text-gray-500">Your Score</p>
          <p className="text-3xl font-bold text-primary">⭐ {game.score}</p>
        </div>
      </div>
    )
  }

  if (!game.currentQuestion) return null

  // Live leaderboard data
  const leaderboard = Object.entries(currentChallenge?.players ?? {})
    .map(([pUid, p]) => ({ uid: pUid, ...p }))
    .sort((a, b) => b.score - a.score)

  return (
    <div className="flex flex-col h-dvh p-4 gap-3">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2">
        <Timer display={timer.display} progress={timer.progress} mode={isTimed ? 'countdown' : 'elapsed'} />
        <button
          onClick={() => game.finishGame()}
          className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 bg-white/60 rounded-2xl cursor-pointer"
        >
          End Game
        </button>
      </div>

      <ScoreBar
        score={game.score}
        streak={game.streak}
        questionNumber={game.answeredQuestions.length + 1}
        totalQuestions={challenge.config.mode === 'fixed' ? 20 : undefined}
      />

      {/* Mini Leaderboard */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {leaderboard.map((p, i) => (
          <div
            key={p.uid}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              p.uid === profile?.uid ? 'bg-primary/10 text-primary' : 'bg-white/60 text-gray-600'
            }`}
          >
            <span>{i === 0 ? '👑' : `#${i + 1}`}</span>
            <span>{p.avatar}</span>
            <span>{p.uid === profile?.uid ? 'You' : p.name}</span>
            <span className="font-bold">⭐{p.score}</span>
          </div>
        ))}
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <QuestionCard question={game.currentQuestion} feedback={feedback} />
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

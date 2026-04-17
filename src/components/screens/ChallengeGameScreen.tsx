import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useChallengeListener } from '../../hooks/useChallengeListener'
import { useChallengeGame } from '../../hooks/useChallengeGame'
import { useChallengeSSGame } from '../../hooks/useChallengeSSGame'
import { useTimer } from '../../hooks/useTimer'
import { finishChallenge } from '../../firebase/challenge'
import { QuestionCard } from '../game/QuestionCard'
import { NumberPad } from '../game/NumberPad'
import { Timer } from '../game/Timer'
import { ScoreBar } from '../game/ScoreBar'
import type { Challenge, ChallengeConfig } from '../../types/challenge'
import type { Question } from '../../types/question'
import type { SocialStudiesQuestion } from '../../types/socialStudies'

const SS_OPTION_LABELS = ['A', 'B', 'C', 'D'] as const

interface ChallengeGameScreenProps {
  gameCode: string
  onNavigate: (screen: string) => void
}

export function ChallengeGameScreen({ gameCode, onNavigate }: ChallengeGameScreenProps) {
  const { profile } = useAuth()
  const { challenge, loading } = useChallengeListener(gameCode)

  if (loading || !challenge || !profile) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="text-xl text-gray-500 animate-pulse">Loading game...</div>
      </div>
    )
  }

  const subject = (challenge.config as ChallengeConfig).subject ?? 'mentalMaths'

  if (subject === 'socialStudies') {
    return (
      <ChallengeSSGameInner
        gameCode={gameCode}
        challenge={challenge}
        uid={profile.uid}
        onNavigate={onNavigate}
      />
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

// ─── Mental Maths challenge game ──────────────────────────────────────────────

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
  const currentChallengeRef = useRef(currentChallenge)
  useEffect(() => { currentChallengeRef.current = currentChallenge }, [currentChallenge])

  const isTimed = challenge.config.mode === 'timed'

  const game = useChallengeGame({
    gameCode,
    uid,
    questions: challenge.questions as Question[],
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

  useEffect(() => {
    timer.start()
    return () => timer.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Once this player finishes, check immediately and every 10 s for stragglers/disconnects.
  // A player is counted done if: they finished normally, they ARE the current player (local
  // state is authoritative — avoids waiting on our own Firestore write), or they haven't
  // sent any progress update in 2 minutes (treat as disconnected/quit).
  useEffect(() => {
    if (!game.finished || navigatedRef.current) return

    const DISCONNECT_MS = 120_000

    const check = () => {
      const ch = currentChallengeRef.current
      if (!ch || navigatedRef.current || ch.status === 'finished') return
      const now = Date.now()
      const allDone = Object.entries(ch.players).every(([pUid, p]) =>
        p.finished ||
        pUid === uid ||
        now - (p.lastActiveAt ?? now) > DISCONNECT_MS,
      )
      if (allDone) finishChallenge(gameCode).catch(console.error)
    }

    check()
    const interval = setInterval(check, 10_000)
    return () => clearInterval(interval)
  }, [game.finished, uid, gameCode])

  useEffect(() => {
    if (currentChallenge?.status === 'finished' && !navigatedRef.current) {
      navigatedRef.current = true
      timer.stop()
      onNavigate('challenge-results')
    }
  }, [currentChallenge?.status, onNavigate, timer])

  useEffect(() => {
    if (game.finished) timer.stop()
  }, [game.finished, timer])

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

  const leaderboard = Object.entries(currentChallenge?.players ?? {})
    .map(([pUid, p]) => ({ uid: pUid, ...p }))
    .sort((a, b) => b.score - a.score)

  return (
    <div className="flex flex-col h-dvh p-4 gap-3">
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

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <QuestionCard question={game.currentQuestion} feedback={feedback} />
        </div>
      </div>

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

// ─── Social Studies challenge game ────────────────────────────────────────────

function ChallengeSSGameInner({
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
  const navigatedRef = useRef(false)
  const currentChallengeRef = useRef(currentChallenge)
  useEffect(() => { currentChallengeRef.current = currentChallenge }, [currentChallenge])

  const questions = challenge.questions as SocialStudiesQuestion[]
  const game = useChallengeSSGame({ gameCode, uid, questions })

  // Auto-advance after 1.2 s when answer is revealed
  useEffect(() => {
    if (!game.revealed) return
    const timer = setTimeout(game.advance, 1200)
    return () => clearTimeout(timer)
  }, [game.revealed, game.advance])

  // Once this player finishes, check immediately and every 10 s.
  // Treats current player as done via local state, and disconnected players
  // (no update in 2 min) as done.
  useEffect(() => {
    if (!game.finished || navigatedRef.current) return

    const DISCONNECT_MS = 120_000

    const check = () => {
      const ch = currentChallengeRef.current
      if (!ch || navigatedRef.current || ch.status === 'finished') return
      const now = Date.now()
      const allDone = Object.entries(ch.players).every(([pUid, p]) =>
        p.finished ||
        pUid === uid ||
        now - (p.lastActiveAt ?? now) > DISCONNECT_MS,
      )
      if (allDone) finishChallenge(gameCode).catch(console.error)
    }

    check()
    const interval = setInterval(check, 10_000)
    return () => clearInterval(interval)
  }, [game.finished, uid, gameCode])

  // Navigate to results when challenge status becomes 'finished'
  useEffect(() => {
    if (currentChallenge?.status === 'finished' && !navigatedRef.current) {
      navigatedRef.current = true
      onNavigate('challenge-results')
    }
  }, [currentChallenge?.status, onNavigate])

  // Waiting for others screen
  if (game.finished && currentChallenge?.status !== 'finished') {
    const totalPlayers = Object.keys(currentChallenge?.players ?? {}).length
    const finishedPlayers = Object.values(currentChallenge?.players ?? {}).filter((p) => p.finished).length
    return (
      <div className="flex flex-col items-center justify-center h-dvh p-6 gap-4">
        <div className="text-4xl animate-pulse">Waiting for others...</div>
        <p className="text-gray-500 text-lg">{finishedPlayers} / {totalPlayers} finished</p>
        <div className="bg-white/80 rounded-2xl p-4 text-center">
          <p className="text-sm text-gray-500">Your Score</p>
          <p className="text-3xl font-bold text-teal-600">⭐ {game.score}</p>
        </div>
      </div>
    )
  }

  if (!game.currentQuestion) return null

  const leaderboard = Object.entries(currentChallenge?.players ?? {})
    .map(([pUid, p]) => ({ uid: pUid, ...p }))
    .sort((a, b) => b.score - a.score)

  const total = questions.length
  const progress = (game.currentIndex / total) * 100

  function optionClass(idx: number) {
    const base = 'w-full text-left px-4 py-3 rounded-2xl font-medium text-sm transition-all border-2 '
    if (!game.revealed) {
      return base + 'bg-white border-gray-200 hover:border-teal-400 hover:bg-teal-50 active:scale-95 cursor-pointer'
    }
    if (idx === game.currentQuestion!.correctIndex) {
      return base + 'bg-emerald-100 border-emerald-500 text-emerald-800'
    }
    if (idx === game.selectedIndex && idx !== game.currentQuestion!.correctIndex) {
      return base + 'bg-red-100 border-red-400 text-red-700'
    }
    return base + 'bg-white border-gray-200 text-gray-400'
  }

  return (
    <div className="flex flex-col h-dvh bg-gradient-to-b from-teal-50 to-white">
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200">
        <div className="h-full bg-teal-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-xs text-gray-500 font-medium">
          Q {game.currentIndex + 1}/{total}
        </span>
        <span className="text-xs font-bold text-teal-600">Score: {game.score}</span>
        <button
          onClick={() => game.forceFinish()}
          className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-white/60 rounded-xl cursor-pointer"
        >
          End Game
        </button>
      </div>

      {/* Mini leaderboard */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-1">
        {leaderboard.map((p, i) => (
          <div
            key={p.uid}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              p.uid === profile?.uid ? 'bg-teal-100 text-teal-700' : 'bg-white/60 text-gray-600'
            }`}
          >
            <span>{i === 0 ? '👑' : `#${i + 1}`}</span>
            <span>{p.avatar}</span>
            <span>{p.uid === profile?.uid ? 'You' : p.name}</span>
            <span className="font-bold">⭐{p.score}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col px-4 py-3 gap-4 overflow-y-auto">
        {/* Topic badge */}
        <div className="self-start px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full">
          {game.currentQuestion.topic}
        </div>

        {/* Question */}
        <div className="bg-white rounded-3xl shadow-md p-4">
          <p className="text-sm font-semibold text-gray-800 leading-snug">
            {game.currentQuestion.question}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {game.currentQuestion.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => !game.revealed && game.selectAnswer(idx)}
              className={optionClass(idx)}
              disabled={game.revealed}
            >
              <span className="font-bold text-primary mr-2">{SS_OPTION_LABELS[idx]}.</span>
              {opt}
              {game.revealed && idx === game.currentQuestion!.correctIndex && (
                <span className="ml-2 text-emerald-600">✓</span>
              )}
              {game.revealed && idx === game.selectedIndex && idx !== game.currentQuestion!.correctIndex && (
                <span className="ml-2 text-red-500">✗</span>
              )}
            </button>
          ))}
        </div>

        {game.revealed && (
          <p className="text-center text-xs text-gray-400 animate-pulse">Next question loading…</p>
        )}
      </div>
    </div>
  )
}

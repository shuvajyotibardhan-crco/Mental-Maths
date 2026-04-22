import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useChallengeListener } from '../../hooks/useChallengeListener'
import { useChallengeGame } from '../../hooks/useChallengeGame'
import { useChallengeSSGame } from '../../hooks/useChallengeSSGame'
import { useChallengeWOMGame } from '../../hooks/useChallengeWOMGame'
import { useChallengeScienceGame } from '../../hooks/useChallengeScienceGame'
import { useTimer } from '../../hooks/useTimer'
import { finishChallenge } from '../../firebase/challenge'
import { QuestionCard } from '../game/QuestionCard'
import { NumberPad } from '../game/NumberPad'
import { Timer } from '../game/Timer'
import { ScoreBar } from '../game/ScoreBar'
import type { Challenge, ChallengeConfig, ChallengePlayer } from '../../types/challenge'
import type { Question } from '../../types/question'
import type { SocialStudiesQuestion } from '../../types/socialStudies'
import type { WOMWord, WOMHintType, WOMTileState } from '../../types/wordOMeter'
import type { ScienceQuestion } from '../../types/science'

const DISCONNECT_MS = 120_000
const WARN_AFTER_MS = 30_000

function WaitingForPlayers({
  players,
  uid,
  score,
  scoreColor = 'text-primary',
}: {
  players: Record<string, ChallengePlayer>
  uid: string
  score: number
  scoreColor?: string
}) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const others = Object.entries(players).filter(([pUid]) => pUid !== uid)

  return (
    <div className="flex flex-col items-center justify-center h-dvh p-6 gap-5">
      <div className="text-4xl animate-pulse">⏳</div>
      <p className="text-xl font-semibold text-gray-700">Waiting for others…</p>

      <div className="w-full max-w-sm space-y-2">
        {others.map(([pUid, p]) => {
          const inactive = p.lastActiveAt ? now - p.lastActiveAt : 0
          const isWarning = !p.finished && inactive > WARN_AFTER_MS
          const secsLeft = Math.max(0, Math.ceil((DISCONNECT_MS - inactive) / 1000))

          return (
            <div
              key={pUid}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                isWarning ? 'bg-amber-50 border border-amber-200' : 'bg-white/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{p.avatar}</span>
                <span className="font-medium text-gray-700">{p.name}</span>
              </div>
              {p.finished ? (
                <span className="text-emerald-600 font-semibold text-sm">Finished ✓</span>
              ) : isWarning ? (
                <div className="text-right">
                  <p className="text-amber-600 text-xs font-semibold">No response</p>
                  <p className="text-amber-500 text-xs">
                    Auto-proceeding in{' '}
                    <span className="font-bold tabular-nums">{secsLeft}s</span>
                  </p>
                </div>
              ) : (
                <span className="text-gray-400 text-sm animate-pulse">Playing…</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-white/80 rounded-2xl p-4 text-center w-full max-w-sm">
        <p className="text-sm text-gray-500">Your Score</p>
        <p className={`text-3xl font-bold ${scoreColor}`}>⭐ {score}</p>
      </div>
    </div>
  )
}

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

  if (subject === 'science') {
    return (
      <ChallengeScienceGameInner
        gameCode={gameCode}
        challenge={challenge}
        uid={profile.uid}
        onNavigate={onNavigate}
      />
    )
  }

  if (subject === 'wordOMeter') {
    return (
      <ChallengeWOMGameInner
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
    return (
      <WaitingForPlayers
        players={currentChallenge?.players ?? {}}
        uid={uid}
        score={game.score}
        scoreColor="text-primary"
      />
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

  if (game.finished && currentChallenge?.status !== 'finished') {
    return (
      <WaitingForPlayers
        players={currentChallenge?.players ?? {}}
        uid={uid}
        score={game.score}
        scoreColor="text-teal-600"
      />
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

// ─── Science challenge game ───────────────────────────────────────────────────

const SCI_OPTION_LABELS = ['A', 'B', 'C', 'D'] as const

function ChallengeScienceGameInner({
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

  const questions = challenge.questions as ScienceQuestion[]
  const game = useChallengeScienceGame({ gameCode, uid, questions })

  // Auto-advance 2 s after answer is revealed
  useEffect(() => {
    if (!game.revealed) return
    const timer = setTimeout(game.advance, 2000)
    return () => clearTimeout(timer)
  }, [game.revealed, game.advance])

  useEffect(() => {
    if (!game.finished || navigatedRef.current) return
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
      onNavigate('challenge-results')
    }
  }, [currentChallenge?.status, onNavigate])

  if (game.finished && currentChallenge?.status !== 'finished') {
    return (
      <WaitingForPlayers
        players={currentChallenge?.players ?? {}}
        uid={uid}
        score={game.score}
        scoreColor="text-orange-600"
      />
    )
  }

  if (!game.currentQuestion) return null

  const leaderboard = Object.entries(currentChallenge?.players ?? {})
    .map(([pUid, p]) => ({ uid: pUid, ...p }))
    .sort((a, b) => b.score - a.score)

  const total = questions.length
  const progress = (game.currentIndex / total) * 100
  const isMultiSelect = game.currentQuestion.correctIndices.length > 1
  const canSubmit = game.selectedIndices.length > 0 && !game.revealed

  function optionClass(idx: number) {
    const base = 'w-full text-left px-4 py-3 rounded-2xl font-medium text-sm transition-all border-2 flex items-center gap-3 '
    const isSelected = game.selectedIndices.includes(idx)
    const isCorrect = game.currentQuestion!.correctIndices.includes(idx)
    if (!game.revealed) {
      return base + (isSelected
        ? 'bg-orange-50 border-orange-400 text-orange-800'
        : 'bg-white border-gray-200 hover:border-orange-300 hover:bg-orange-50 active:scale-95 cursor-pointer')
    }
    if (isCorrect) return base + 'bg-emerald-100 border-emerald-500 text-emerald-800'
    if (isSelected && !isCorrect) return base + 'bg-red-100 border-red-400 text-red-700'
    return base + 'bg-white border-gray-200 text-gray-400'
  }

  function checkboxClass(idx: number) {
    const isSelected = game.selectedIndices.includes(idx)
    const isCorrect = game.revealed && game.currentQuestion!.correctIndices.includes(idx)
    const isWrong = game.revealed && isSelected && !game.currentQuestion!.correctIndices.includes(idx)
    const base = 'w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 text-xs font-bold '
    if (isCorrect) return base + 'bg-emerald-500 border-emerald-500 text-white'
    if (isWrong) return base + 'bg-red-400 border-red-400 text-white'
    if (isSelected) return base + 'bg-orange-500 border-orange-500 text-white'
    return base + 'bg-white border-gray-300'
  }

  return (
    <div className="flex flex-col h-dvh bg-gradient-to-b from-orange-50 to-white">
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200">
        <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-xs text-gray-500 font-medium">
          Q {game.currentIndex + 1}/{total}
        </span>
        <span className="text-xs font-bold text-orange-600">Score: {game.score}</span>
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
              p.uid === profile?.uid ? 'bg-orange-100 text-orange-700' : 'bg-white/60 text-gray-600'
            }`}
          >
            <span>{i === 0 ? '👑' : `#${i + 1}`}</span>
            <span>{p.avatar}</span>
            <span>{p.uid === profile?.uid ? 'You' : p.name}</span>
            <span className="font-bold">⭐{p.score}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col px-4 py-3 gap-3 overflow-y-auto">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="self-start px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
            {game.currentQuestion.topic}
          </div>
          {isMultiSelect && (
            <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              Select all that apply
            </div>
          )}
        </div>

        {/* Question */}
        <div className="bg-white rounded-3xl shadow-md p-4">
          <p className="text-sm font-semibold text-gray-800 leading-snug">
            {game.currentQuestion.question}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {game.currentQuestion.options.map((opt, idx) => {
            const isSelected = game.selectedIndices.includes(idx)
            const isCorrect = game.revealed && game.currentQuestion!.correctIndices.includes(idx)
            const isWrong = game.revealed && isSelected && !game.currentQuestion!.correctIndices.includes(idx)
            return (
              <button
                key={idx}
                onClick={() => !game.revealed && game.toggleOption(idx)}
                className={optionClass(idx)}
                disabled={game.revealed}
              >
                <div className={checkboxClass(idx)}>
                  {isCorrect && '✓'}
                  {isWrong && '✗'}
                  {!game.revealed && isSelected && '✓'}
                </div>
                <span className="font-bold text-primary mr-1">{SCI_OPTION_LABELS[idx]}.</span>
                <span className="flex-1">{opt}</span>
              </button>
            )
          })}
        </div>

        {!game.revealed && (
          <button
            onClick={() => game.submitAnswer()}
            disabled={!canSubmit}
            className="w-full py-3 bg-orange-500 text-white font-bold rounded-2xl shadow transition-all cursor-pointer hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Check Answer
          </button>
        )}

        {game.revealed && (
          <p className="text-center text-xs text-gray-400 animate-pulse">Next question loading…</p>
        )}
      </div>
    </div>
  )
}

// ─── Word-O-Meter challenge game ──────────────────────────────────────────────

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

const WOM_KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['⌫', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '✓'],
]

function womTileClass(state: WOMTileState, size: string): string {
  const base = `flex items-center justify-center rounded-xl font-bold border-2 select-none ${size} `
  switch (state) {
    case 'correct': return base + 'bg-emerald-500 border-emerald-500 text-white'
    case 'present': return base + 'bg-amber-400 border-amber-400 text-white'
    case 'absent':  return base + 'bg-gray-400 border-gray-400 text-white'
    case 'hinted':  return base + 'bg-blue-300 border-blue-300 text-white'
    default:        return base + 'bg-white border-gray-300 text-gray-800'
  }
}

function womTileSize(lc: number): string {
  if (lc <= 4) return 'w-11 h-11 text-xl'
  if (lc === 5) return 'w-10 h-10 text-lg'
  if (lc === 6) return 'w-9 h-9 text-base'
  return 'w-8 h-8 text-sm'
}

function ChallengeWOMGameInner({
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

  const word = (challenge.questions as WOMWord[])[0]!
  const game = useChallengeWOMGame({ gameCode, uid, word })

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (game.finished || game.validating) return
      if (e.key === 'Enter') { e.preventDefault(); game.submitGuess() }
      else if (e.key === 'Backspace') { e.preventDefault(); game.deleteLetter() }
      else if (/^[a-zA-Z]$/.test(e.key)) game.typeLetter(e.key)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [game])

  // Once finished, check if all others are done too
  useEffect(() => {
    if (!game.finished || navigatedRef.current) return
    const check = () => {
      const ch = currentChallengeRef.current
      if (!ch || navigatedRef.current || ch.status === 'finished') return
      const now = Date.now()
      const allDone = Object.entries(ch.players).every(([pUid, p]) =>
        p.finished || pUid === uid || now - (p.lastActiveAt ?? now) > DISCONNECT_MS,
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
      onNavigate('challenge-results')
    }
  }, [currentChallenge?.status, onNavigate])

  if (game.finished && currentChallenge?.status !== 'finished') {
    return (
      <WaitingForPlayers
        players={currentChallenge?.players ?? {}}
        uid={uid}
        score={game.score}
        scoreColor="text-violet-600"
      />
    )
  }

  const lc = word.letterCount
  const tileSize = womTileSize(lc)
  const leaderboard = Object.entries(currentChallenge?.players ?? {})
    .map(([pUid, p]) => ({ uid: pUid, ...p }))
    .sort((a, b) => b.score - a.score)

  const maxHints = lc <= 4 ? 1 : lc <= 6 ? 2 : 3
  const hintsLeft = maxHints - game.hintsUsed.length

  function womKeyClass(key: string): string {
    if (key === '⌫') return 'flex-[1.8] min-w-0 h-10 rounded-xl font-bold text-base transition-all cursor-pointer active:scale-95 bg-rose-100 text-rose-600 hover:bg-rose-200'
    if (key === '✓') return 'flex-[1.8] min-w-0 h-10 rounded-xl font-bold text-base transition-all cursor-pointer active:scale-95 bg-primary text-white hover:bg-primary-dark'
    const state = game.letterStates[key]
    if (state === 'correct') return 'flex-1 min-w-0 h-10 rounded-xl font-bold text-xs transition-all cursor-pointer bg-emerald-500 text-white'
    if (state === 'present') return 'flex-1 min-w-0 h-10 rounded-xl font-bold text-xs transition-all cursor-pointer bg-amber-400 text-white'
    if (state === 'absent')  return 'flex-1 min-w-0 h-10 rounded-xl font-bold text-xs transition-all cursor-pointer bg-gray-400 text-white'
    return 'flex-1 min-w-0 h-10 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 bg-gray-100 text-gray-800 hover:bg-gray-200'
  }

  return (
    <div className="flex flex-col h-dvh bg-gradient-to-b from-violet-50 to-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="text-sm font-semibold text-violet-700">
          {lc}-letter word · Grade {challenge.config.grade}
        </div>
        <div className="text-xs text-gray-500">
          {game.guesses.length}/{game.maxAttempts} tries
        </div>
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
              p.uid === profile?.uid ? 'bg-violet-100 text-violet-700' : 'bg-white/60 text-gray-600'
            }`}
          >
            <span>{i === 0 ? '👑' : `#${i + 1}`}</span>
            <span>{p.avatar}</span>
            <span>{p.uid === profile?.uid ? 'You' : p.name}</span>
            <span className="font-bold">⭐{p.score}</span>
          </div>
        ))}
      </div>

      {/* Error / validating */}
      <div className="h-5 text-center">
        {game.validating && <p className="text-xs text-gray-400 animate-pulse">Checking word…</p>}
        {game.error && !game.validating && <p className="text-xs text-red-500 font-medium">{game.error}</p>}
      </div>

      {/* Grid */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: game.maxAttempts }).map((_, rowIdx) => {
            const isCurrentRow = rowIdx === game.guesses.length && game.status === 'playing'
            const pastRow = game.guesses[rowIdx]

            return (
              <div
                key={rowIdx}
                className={`flex gap-1.5 ${game.shake && isCurrentRow ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
              >
                {Array.from({ length: lc }).map((_, colIdx) => {
                  if (pastRow) {
                    return <div key={colIdx} className={womTileClass(pastRow[colIdx]?.state ?? 'empty', tileSize)}>{pastRow[colIdx]?.letter}</div>
                  }
                  if (isCurrentRow) {
                    const letter = game.currentGuess[colIdx] ?? ''
                    return <div key={colIdx} className={womTileClass('empty', tileSize)}>{letter}</div>
                  }
                  return <div key={colIdx} className={womTileClass('empty', tileSize)} />
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Hints */}
      {game.hintsUsed.length > 0 && (
        <div className="px-4 pb-1 space-y-1">
          {game.hintsUsed.map((h, i) => (
            <div key={i} className="text-xs text-blue-700 bg-blue-50 rounded-xl px-3 py-1.5">{h.text}</div>
          ))}
        </div>
      )}

      {/* Hint buttons */}
      {game.status === 'playing' && game.availableHints.length > 0 && hintsLeft > 0 && (
        <div className="px-4 pb-1">
          <div className="flex gap-2 overflow-x-auto">
            <span className="text-xs text-gray-400 self-center whitespace-nowrap">Hint ({hintsLeft} left):</span>
            {game.availableHints.slice(0, 3).map((h) => (
              <button
                key={h}
                onClick={() => game.useHint(h)}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-xl whitespace-nowrap cursor-pointer hover:bg-blue-200"
              >
                {HINT_LABELS[h]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard */}
      <div className="px-2 pb-3 space-y-1">
        {WOM_KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1 justify-center">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => {
                  if (key === '⌫') game.deleteLetter()
                  else if (key === '✓') game.submitGuess()
                  else game.typeLetter(key)
                }}
                disabled={game.finished || game.validating}
                className={womKeyClass(key)}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

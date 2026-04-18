import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useChallengeListener } from '../../hooks/useChallengeListener'
import { useChallengeGame } from '../../hooks/useChallengeGame'
import { useChallengeSSGame } from '../../hooks/useChallengeSSGame'
import { useChallengeWOMGame } from '../../hooks/useChallengeWOMGame'
import { useTimer } from '../../hooks/useTimer'
import { finishChallenge } from '../../firebase/challenge'
import { QuestionCard } from '../game/QuestionCard'
import { NumberPad } from '../game/NumberPad'
import { Timer } from '../game/Timer'
import { ScoreBar } from '../game/ScoreBar'
import type { Challenge, ChallengeConfig, ChallengePlayer } from '../../types/challenge'
import type { Question } from '../../types/question'
import type { SocialStudiesQuestion } from '../../types/socialStudies'
import type { WOMWord, WOMTileState, WOMHintType } from '../../types/wordOMeter'

const DISCONNECT_MS = 120_000
const WARN_AFTER_MS = 30_000

function WaitingForPlayers({
  players,
  uid,
  score,
  scoreColor = 'text-primary',
  extraLabel,
}: {
  players: Record<string, ChallengePlayer>
  uid: string
  score: number
  scoreColor?: string
  extraLabel?: string
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
      {extraLabel && <p className="text-sm text-gray-500">{extraLabel}</p>}

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

// ─── Word-O-Meter challenge game ──────────────────────────────────────────────

const WOM_HINT_LABELS: Record<WOMHintType, string> = {
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

function womTileClass(state: WOMTileState): string {
  const base = 'flex items-center justify-center rounded-xl font-bold border-2 select-none '
  switch (state) {
    case 'correct': return base + 'bg-emerald-500 border-emerald-500 text-white'
    case 'present': return base + 'bg-amber-400 border-amber-400 text-white'
    case 'absent':  return base + 'bg-gray-400 border-gray-400 text-white'
    case 'hinted':  return base + 'bg-blue-300 border-blue-300 text-white'
    default:        return base + 'bg-white border-gray-300 text-gray-800'
  }
}

function womTileSize(letterCount: number): string {
  if (letterCount <= 4) return 'w-12 h-12 text-xl'
  if (letterCount === 5) return 'w-11 h-11 text-lg'
  if (letterCount === 6) return 'w-10 h-10 text-base'
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

  // Keyboard handler
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

  // Once finished, check if all players are done and trigger finishChallenge
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

  // Navigate to results when challenge finishes
  useEffect(() => {
    if (currentChallenge?.status === 'finished' && !navigatedRef.current) {
      navigatedRef.current = true
      onNavigate('challenge-results')
    }
  }, [currentChallenge?.status, onNavigate])

  if (game.finished && currentChallenge?.status !== 'finished') {
    const resultLabel = game.status === 'won'
      ? `You solved it in ${game.guesses.length} attempt${game.guesses.length !== 1 ? 's' : ''}!`
      : `The word was ${word.word}`
    return (
      <WaitingForPlayers
        players={currentChallenge?.players ?? {}}
        uid={uid}
        score={game.score}
        scoreColor="text-amber-600"
        extraLabel={resultLabel}
      />
    )
  }

  const leaderboard = Object.entries(currentChallenge?.players ?? {})
    .map(([pUid, p]) => ({ uid: pUid, ...p }))
    .sort((a, b) => b.score - a.score)

  const letterCount = word.letterCount
  const tileSize = womTileSize(letterCount)

  const rows = Array.from({ length: game.maxAttempts }, (_, i) => {
    if (i < game.guesses.length) return game.guesses[i]!
    if (i === game.guesses.length) {
      return Array.from({ length: letterCount }, (_, j) => ({
        letter: game.currentGuess[j] ?? '',
        state: 'empty' as WOMTileState,
      }))
    }
    return Array.from({ length: letterCount }, () => ({ letter: '', state: 'empty' as WOMTileState }))
  })

  function keyClass(key: string): string {
    if (key === '⌫') {
      return 'flex-[1.8] min-w-0 h-10 rounded-xl font-bold text-base transition-all cursor-pointer active:scale-95 bg-rose-100 text-rose-600 hover:bg-rose-200'
    }
    if (key === '✓') {
      return `flex-[1.8] min-w-0 h-10 rounded-xl font-bold text-base transition-all cursor-pointer active:scale-95 ${
        game.validating ? 'bg-gray-200 text-gray-400' : 'bg-emerald-500 text-white hover:bg-emerald-600'
      }`
    }
    const base = 'flex-1 min-w-0 h-10 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 '
    switch (game.letterStates[key]) {
      case 'correct': return base + 'bg-emerald-500 text-white'
      case 'present': return base + 'bg-amber-400 text-white'
      case 'absent':  return base + 'bg-gray-400 text-white'
      default:        return base + 'bg-gray-200 text-gray-800 hover:bg-gray-300'
    }
  }

  return (
    <div className="flex flex-col h-dvh bg-gradient-to-b from-amber-50 to-white overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
        <span className="text-sm font-medium text-gray-600">
          Attempt {Math.min(game.guesses.length + 1, game.maxAttempts)} / {game.maxAttempts}
        </span>
        <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
          {letterCount} letters
        </span>
        <button
          onClick={() => game.forceFinish()}
          className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-white/60 rounded-xl cursor-pointer"
        >
          End Game
        </button>
      </div>

      {/* Mini leaderboard */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 shrink-0">
        {leaderboard.map((p, i) => (
          <div
            key={p.uid}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              p.uid === profile?.uid ? 'bg-amber-100 text-amber-700' : 'bg-white/60 text-gray-600'
            }`}
          >
            <span>{i === 0 ? '👑' : `#${i + 1}`}</span>
            <span>{p.avatar}</span>
            <span>{p.uid === profile?.uid ? 'You' : p.name}</span>
            {p.finished
              ? <span className="font-bold">{p.correctAnswers > 0 ? `✓ ${p.totalAnswered}` : '✗'}</span>
              : <span className="font-bold animate-pulse">{p.totalAnswered > 0 ? `${p.totalAnswered}…` : '—'}</span>
            }
          </div>
        ))}
      </div>

      {/* Error / validating */}
      {game.validating && (
        <p className="text-center text-xs text-amber-600 px-4 pb-1 shrink-0">Checking word…</p>
      )}
      {!game.validating && game.error && (
        <p className="text-center text-xs text-red-500 px-4 pb-1 shrink-0">{game.error}</p>
      )}

      {/* Tile grid */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1.5 px-4 min-h-0">
        {rows.map((row, ri) => (
          <div
            key={ri}
            className={`flex gap-1.5 ${ri === game.guesses.length && game.shake ? 'animate-shake' : ''}`}
          >
            {row.map((tile, ci) => (
              <div key={ci} className={`${tileSize} ${womTileClass(tile.state)}`}>
                {tile.letter}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Hints used */}
      {game.hintsUsed.length > 0 && (
        <div className="px-4 py-1.5 shrink-0 space-y-1">
          {game.hintsUsed.map((h, i) => (
            <p key={i} className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1">
              💡 {h.text}
            </p>
          ))}
        </div>
      )}

      {/* Available hints */}
      {game.availableHints.length > 0 && (
        <div className="px-4 py-1.5 shrink-0">
          {(() => {
            const maxHints = letterCount <= 4 ? 1 : letterCount <= 6 ? 2 : 3
            const remaining = maxHints - game.hintsUsed.length
            return (
              <>
                <p className="text-xs text-amber-600 mb-1">
                  💡 {remaining} hint{remaining !== 1 ? 's' : ''} remaining
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                  {game.availableHints.map((type) => (
                    <button
                      key={type}
                      onClick={() => game.useHint(type)}
                      className="shrink-0 px-2.5 py-1 bg-white/80 text-amber-700 text-xs font-medium rounded-xl border border-amber-200 hover:bg-amber-50 cursor-pointer active:scale-95 transition-all"
                    >
                      {WOM_HINT_LABELS[type]}
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
        {WOM_KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {ri === 1 && <div className="flex-[0.5]" />}
            {row.map((key) => (
              <button
                key={key}
                disabled={game.validating && key !== '⌫'}
                onPointerDown={(e) => {
                  e.preventDefault()
                  if (game.validating && key !== '⌫') return
                  if (key === '⌫') game.deleteLetter()
                  else if (key === '✓') game.submitGuess()
                  else game.typeLetter(key)
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

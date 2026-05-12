import { useState, useCallback, useRef, useEffect } from 'react'
import {
  initCreatorState,
  submitCreatorWord,
  updateGuesserProgress,
  advanceRound,
  finaliseCreatorGame,
} from '../firebase/womCreator'
import { finishChallenge } from '../firebase/challenge'
import type { Challenge } from '../types/challenge'
import type { WOMWord, WOMTile, WOMTileState, WOMHintType, WOMHintResult } from '../types/wordOMeter'
import type { WOMCreatorGuessState } from '../types/womCreator'

// ─── shared helpers (same as useChallengeWOMGame) ─────────────────────────────

async function loadWordlist(n: number): Promise<ReadonlySet<string>> {
  switch (n) {
    case 3: return (await import('../data/wordlists/wom-3')).default
    case 4: return (await import('../data/wordlists/wom-4')).default
    case 5: return (await import('../data/wordlists/wom-5')).default
    case 6: return (await import('../data/wordlists/wom-6')).default
    case 7: return (await import('../data/wordlists/wom-7')).default
    case 8: return (await import('../data/wordlists/wom-8')).default
    default: throw new Error(`No wordlist for ${n}-letter words`)
  }
}

const STATE_PRIORITY: Record<WOMTileState, number> = {
  correct: 3, present: 2, absent: 1, empty: 0, hinted: 0,
}

function evaluateGuess(guess: string, target: string): WOMTile[] {
  const result: WOMTile[] = guess.split('').map((letter) => ({ letter, state: 'absent' as WOMTileState }))
  const counts: Record<string, number> = {}
  for (const ch of target) counts[ch] = (counts[ch] ?? 0) + 1
  for (let i = 0; i < target.length; i++) {
    if (guess[i] === target[i]) { result[i]!.state = 'correct'; counts[target[i]!]!-- }
  }
  for (let i = 0; i < target.length; i++) {
    if (result[i]!.state === 'correct') continue
    const letter = guess[i]!
    if ((counts[letter] ?? 0) > 0) { result[i]!.state = 'present'; counts[letter]!-- }
  }
  return result
}

function computeAvailableHints(word: WOMWord): WOMHintType[] {
  const hints: WOMHintType[] = ['partOfSpeech', 'vowelCount', 'revealFirst', 'revealLast', 'revealMiddle']
  if (word.synonyms.length > 0) hints.push('synonym')
  if (word.antonyms.length > 0) hints.push('antonym')
  if (word.blend) hints.push('commonBlend')
  return hints
}

function filterPositionHints(hints: WOMHintType[], guesses: WOMTile[][], word: string): WOMHintType[] {
  const correctPos = new Set<number>()
  for (const row of guesses) row.forEach((tile, i) => { if (tile.state === 'correct') correctPos.add(i) })
  if (correctPos.size === 0) return hints
  const mid = Math.floor(word.length / 2)
  return hints.filter((h) => {
    if (h === 'revealFirst') return !correctPos.has(0)
    if (h === 'revealLast') return !correctPos.has(word.length - 1)
    if (h === 'revealMiddle') return !correctPos.has(mid)
    return true
  })
}

function generateHintText(type: WOMHintType, word: WOMWord): string {
  const mid = Math.floor(word.word.length / 2)
  switch (type) {
    case 'partOfSpeech': return `Part of speech: ${word.partOfSpeech.join(' / ')}`
    case 'vowelCount': {
      const n = word.word.split('').filter((l) => 'AEIOU'.includes(l)).length
      return `This word has ${n} vowel${n !== 1 ? 's' : ''}`
    }
    case 'synonym': return `Synonym: ${word.synonyms[0]}`
    case 'antonym': return `Antonym: ${word.antonyms[0]}`
    case 'revealFirst': return `First letter: "${word.word[0]}"`
    case 'revealLast': return `Last letter: "${word.word[word.word.length - 1]}"`
    case 'revealMiddle': return `Middle letter (pos ${mid + 1}): "${word.word[mid]}"`
    case 'commonBlend': return `Blend: ${word.blend ?? ''}`
  }
}

function calcGuesserScore(attemptsUsed: number, hintsUsed: number): number {
  return Math.max(10, 100 - (attemptsUsed - 1) * 12 - hintsUsed * 8)
}

// ─── phase types ──────────────────────────────────────────────────────────────

export type WOMCreatorPhase =
  | 'initialising'      // host hasn't set up womCreatorState yet
  | 'creating'          // current player is creator; word not yet submitted
  | 'creatorWaiting'    // current player is creator; word submitted; waiting for guessers
  | 'waitingForWord'    // current player is guesser; word not yet submitted by creator
  | 'guessing'          // current player is guesser; actively guessing
  | 'guesserWaiting'    // current player is guesser; done; waiting for others in this round
  | 'finished'          // all rounds complete

// Local guessing state (per-round, reset when round advances)
interface GuessingState {
  guesses: WOMTile[][]
  currentGuess: string
  letterStates: Record<string, WOMTileState>
  hintsUsed: WOMHintResult[]
  availableHints: WOMHintType[]
  shake: boolean
  error: string | null
  validating: boolean
  done: boolean
  won: boolean
}

const initialGuessingState = (): GuessingState => ({
  guesses: [],
  currentGuess: '',
  letterStates: {},
  hintsUsed: [],
  availableHints: [],
  shake: false,
  error: null,
  validating: false,
  done: false,
  won: false,
})

// Local creator input state
interface CreatorInputState {
  input: string
  validating: boolean
  error: string | null
  submitting: boolean
}

const initialCreatorState = (): CreatorInputState => ({
  input: '',
  validating: false,
  error: null,
  submitting: false,
})

// ─── hook ─────────────────────────────────────────────────────────────────────

interface UseChallengeWOMCreatorGameOptions {
  gameCode: string
  uid: string
  isHost: boolean
  challenge: Challenge
}

export function useChallengeWOMCreatorGame({
  gameCode,
  uid,
  isHost,
  challenge,
}: UseChallengeWOMCreatorGameOptions) {
  const wcs = challenge.womCreatorState
  const players = challenge.players

  const [guessingState, setGuessingState] = useState<GuessingState>(initialGuessingState)
  const [creatorInput, setCreatorInput] = useState<CreatorInputState>(initialCreatorState)
  const guessingRef = useRef(guessingState)
  guessingRef.current = guessingState

  // Track which round we last processed so we can reset local state on advance
  const lastRoundRef = useRef<number>(-1)

  // Guard against double-calling advanceRound / finalise
  const advancingRef = useRef(false)
  const initialisingRef = useRef(false)

  // ── Determine phase ──────────────────────────────────────────────────────────

  let phase: WOMCreatorPhase = 'initialising'

  if (wcs) {
    const round = wcs.rounds[String(wcs.currentRound)]
    if (!round) {
      phase = 'finished'
    } else {
      const isCreator = round.creatorId === uid
      const wordReady = round.word !== null

      if (isCreator) {
        phase = wordReady ? 'creatorWaiting' : 'creating'
      } else {
        const myProgress = wcs.progress[String(wcs.currentRound)]?.[uid]
        if (!wordReady) {
          phase = 'waitingForWord'
        } else if (myProgress?.done) {
          phase = 'guesserWaiting'
        } else {
          phase = 'guessing'
        }
      }
    }
  }

  // ── Init creator state (host only) ───────────────────────────────────────────

  useEffect(() => {
    if (!wcs && isHost && challenge.status === 'playing' && !initialisingRef.current) {
      initialisingRef.current = true
      const uids = Object.keys(players)
      initCreatorState(gameCode, uids).catch(console.error)
    }
  }, [wcs, isHost, gameCode, players, challenge.status])

  // ── Reset local state when round advances ────────────────────────────────────

  useEffect(() => {
    if (!wcs) return
    if (wcs.currentRound !== lastRoundRef.current) {
      lastRoundRef.current = wcs.currentRound
      setGuessingState(initialGuessingState())
      setCreatorInput(initialCreatorState())
      advancingRef.current = false
    }
  }, [wcs])

  // Re-init availableHints when the word becomes available (guesser)
  useEffect(() => {
    if (!wcs) return
    const round = wcs.rounds[String(wcs.currentRound)]
    if (!round?.wordObj) return
    const myProgress = wcs.progress[String(wcs.currentRound)]?.[uid]
    if (myProgress?.done) return
    setGuessingState((s) => {
      if (s.availableHints.length > 0 || s.done) return s
      return { ...s, availableHints: computeAvailableHints(round.wordObj!) }
    })
  }, [wcs, uid])

  // ── Check round completion and advance ──────────────────────────────────────

  useEffect(() => {
    if (!wcs || advancingRef.current) return
    const roundKey = String(wcs.currentRound)
    const round = wcs.rounds[roundKey]
    if (!round?.word) return

    const nonCreators = Object.keys(players).filter((p) => p !== round.creatorId)
    if (nonCreators.length === 0) return

    const roundProgress = wcs.progress[roundKey] ?? {}
    const allDone = nonCreators.every((p) => roundProgress[p]?.done === true)
    if (!allDone) return

    advancingRef.current = true

    // Compute cumulative scores for all players
    const cumulativeScores: Record<string, number> = {}
    for (const p of Object.keys(players)) {
      cumulativeScores[p] = players[p]!.score
    }

    // Add guesser scores for this round
    for (const p of nonCreators) {
      cumulativeScores[p] = (cumulativeScores[p] ?? 0) + (roundProgress[p]?.score ?? 0)
    }

    // Creator bonus: 10 per guesser who did not win
    const failCount = nonCreators.filter((p) => !roundProgress[p]?.won).length
    const creatorId = round.creatorId
    cumulativeScores[creatorId] = (cumulativeScores[creatorId] ?? 0) + failCount * 10

    const totalRounds = wcs.roundOrder.length
    const nextRound = wcs.currentRound + 1

    if (nextRound >= totalRounds) {
      // All rounds done
      finaliseCreatorGame(gameCode, cumulativeScores)
        .then(() => finishChallenge(gameCode))
        .catch(console.error)
    } else {
      advanceRound(gameCode, nextRound, wcs.roundOrder[nextRound]!, cumulativeScores).catch(console.error)
    }
  }, [wcs, players, gameCode])

  // ── Creator actions ──────────────────────────────────────────────────────────

  const typeCreatorLetter = useCallback((ch: string) => {
    setCreatorInput((s) => {
      if (s.submitting || s.validating) return s
      const cleaned = ch.replace(/[^a-zA-Z]/g, '').toUpperCase()
      if (!cleaned) return s
      const next = s.input + cleaned
      if (next.length > 8) return s
      return { ...s, input: next, error: null }
    })
  }, [])

  const deleteCreatorLetter = useCallback(() => {
    setCreatorInput((s) => ({ ...s, input: s.input.slice(0, -1), error: null }))
  }, [])

  const setCreatorWord = useCallback((word: string) => {
    setCreatorInput((s) => ({
      ...s,
      input: word.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8),
      error: null,
    }))
  }, [])

  const submitWord = useCallback(async () => {
    const { input, validating, submitting } = creatorInput
    if (validating || submitting) return
    const word = input.toUpperCase().trim()

    if (word.length < 3 || word.length > 8) {
      setCreatorInput((s) => ({ ...s, error: 'Word must be 3–8 letters' }))
      return
    }

    setCreatorInput((s) => ({ ...s, validating: true, error: null }))
    try {
      const wordSet = await loadWordlist(word.length)
      if (!wordSet.has(word)) {
        setCreatorInput((s) => ({ ...s, validating: false, error: 'Not a valid English word' }))
        return
      }
    } catch {
      setCreatorInput((s) => ({ ...s, validating: false, error: 'Not a valid English word' }))
      return
    }

    setCreatorInput((s) => ({ ...s, validating: false, submitting: true }))

    // Build a minimal WOMWord from just the validated string (no pool lookup needed)
    const wordObj: WOMWord = {
      word,
      letterCount: word.length,
      grade: challenge.config.grade,
      meanings: [],
      partOfSpeech: [],
      synonyms: [],
      antonyms: [],
    }

    const currentRound = wcs?.currentRound ?? 0
    submitCreatorWord(gameCode, currentRound, wordObj)
      .catch(console.error)
      .finally(() => {
        setCreatorInput((s) => ({ ...s, submitting: false }))
      })
  }, [creatorInput, gameCode, wcs, challenge.config.grade])

  // ── Guesser actions ──────────────────────────────────────────────────────────

  const currentRound = wcs?.currentRound ?? 0
  const currentRoundData = wcs?.rounds[String(currentRound)]
  const targetWord = currentRoundData?.wordObj ?? null
  const maxAttempts = targetWord?.letterCount ?? 0
  const maxHints = maxAttempts <= 4 ? 1 : maxAttempts <= 6 ? 2 : 3

  const writeGuesserProgress = useCallback(
    (state: WOMCreatorGuessState) => {
      updateGuesserProgress(gameCode, currentRound, uid, state).catch(console.error)
    },
    [gameCode, currentRound, uid],
  )

  const typeLetter = useCallback((letter: string) => {
    if (!targetWord) return
    setGuessingState((s) => {
      if (s.done || s.currentGuess.length >= targetWord.letterCount) return s
      return { ...s, currentGuess: s.currentGuess + letter.toUpperCase(), shake: false, error: null }
    })
  }, [targetWord])

  const deleteLetter = useCallback(() => {
    setGuessingState((s) => {
      if (s.done || s.currentGuess.length === 0) return s
      return { ...s, currentGuess: s.currentGuess.slice(0, -1), shake: false, error: null }
    })
  }, [])

  const submitGuess = useCallback(async () => {
    const s = guessingRef.current
    if (!targetWord || s.done || s.validating) return
    if (s.currentGuess.length !== targetWord.letterCount) {
      setGuessingState((prev) => ({ ...prev, shake: true, error: `Enter a ${targetWord.letterCount}-letter word` }))
      setTimeout(() => setGuessingState((prev) => ({ ...prev, shake: false })), 600)
      return
    }

    if (s.currentGuess !== targetWord.word) {
      setGuessingState((prev) => ({ ...prev, validating: true, error: null }))
      try {
        const wordSet = await loadWordlist(targetWord.letterCount)
        if (!wordSet.has(s.currentGuess)) {
          setGuessingState((prev) => ({ ...prev, validating: false, shake: true, error: 'Not a valid English word' }))
          setTimeout(() => setGuessingState((prev) => ({ ...prev, shake: false })), 600)
          return
        }
      } catch {
        setGuessingState((prev) => ({ ...prev, validating: false, shake: true, error: 'Not a valid English word' }))
        setTimeout(() => setGuessingState((prev) => ({ ...prev, shake: false })), 600)
        return
      }
      setGuessingState((prev) => ({ ...prev, validating: false }))
    }

    const cur = guessingRef.current
    if (cur.currentGuess !== s.currentGuess || cur.done) return

    const tiles = evaluateGuess(cur.currentGuess, targetWord.word)
    const newGuesses = [...cur.guesses, tiles]
    const newLetterStates = { ...cur.letterStates }
    for (const tile of tiles) {
      const existing = newLetterStates[tile.letter]
      if (!existing || STATE_PRIORITY[tile.state] > STATE_PRIORITY[existing]) {
        newLetterStates[tile.letter] = tile.state
      }
    }

    const won = tiles.every((t) => t.state === 'correct')
    const lost = !won && newGuesses.length >= maxAttempts
    const done = won || lost
    const score = done && won ? calcGuesserScore(newGuesses.length, cur.hintsUsed.length) : 0

    const progressUpdate: WOMCreatorGuessState = {
      guesses: newGuesses.map((row) => row.map((t) => t.letter).join('')),
      won,
      passed: false,
      hintsUsed: cur.hintsUsed.map((h) => h.type),
      score,
      done,
    }

    if (done) writeGuesserProgress(progressUpdate)

    setGuessingState((prev) => ({
      ...prev,
      guesses: newGuesses,
      currentGuess: '',
      letterStates: newLetterStates,
      availableHints: done ? [] : filterPositionHints(prev.availableHints, newGuesses, targetWord.word),
      shake: false,
      error: null,
      validating: false,
      done,
      won,
    }))

    if (!done) {
      writeGuesserProgress({
        guesses: newGuesses.map((row) => row.map((t) => t.letter).join('')),
        won: false,
        passed: false,
        hintsUsed: cur.hintsUsed.map((h) => h.type),
        score: 0,
        done: false,
      })
    }
  }, [targetWord, maxAttempts, writeGuesserProgress])

  const useHint = useCallback((type: WOMHintType) => {
    if (!targetWord) return
    setGuessingState((s) => {
      if (s.done || !s.availableHints.includes(type) || s.hintsUsed.length >= maxHints) return s
      const hint: WOMHintResult = { type, text: generateHintText(type, targetWord) }
      const newHints = [...s.hintsUsed, hint]
      const newAvailable = newHints.length >= maxHints ? [] : s.availableHints.filter((h) => h !== type)
      writeGuesserProgress({
        guesses: s.guesses.map((row) => row.map((t) => t.letter).join('')),
        won: false,
        passed: false,
        hintsUsed: newHints.map((h) => h.type),
        score: 0,
        done: false,
      })
      return { ...s, hintsUsed: newHints, availableHints: newAvailable }
    })
  }, [targetWord, maxHints, writeGuesserProgress])

  const pass = useCallback(() => {
    setGuessingState((s) => {
      if (s.done) return s
      writeGuesserProgress({
        guesses: s.guesses.map((row) => row.map((t) => t.letter).join('')),
        won: false,
        passed: true,
        hintsUsed: s.hintsUsed.map((h) => h.type),
        score: 0,
        done: true,
      })
      return { ...s, done: true, won: false }
    })
  }, [writeGuesserProgress])

  const forceFinish = useCallback(() => {
    if (!wcs) return
    // Mark all non-finished guessers in current round as passed
    const roundKey = String(wcs.currentRound)
    const round = wcs.rounds[roundKey]
    if (!round) return
    const nonCreators = Object.keys(players).filter((p) => p !== round.creatorId)
    const roundProgress = wcs.progress[roundKey] ?? {}
    for (const p of nonCreators) {
      if (!roundProgress[p]?.done) {
        updateGuesserProgress(gameCode, wcs.currentRound, p, {
          guesses: [],
          won: false,
          passed: true,
          hintsUsed: [],
          score: 0,
          done: true,
        }).catch(console.error)
      }
    }
  }, [wcs, players, gameCode])

  // ── Derived data for UI ──────────────────────────────────────────────────────

  const roundCreatorId = currentRoundData?.creatorId ?? null
  const roundCreatorName = roundCreatorId ? (players[roundCreatorId]?.name ?? 'Unknown') : 'Unknown'
  const totalRounds = wcs?.roundOrder.length ?? 0
  const roundsProgress = wcs
    ? Object.keys(players)
        .filter((p) => p !== currentRoundData?.creatorId)
        .map((p) => ({
          uid: p,
          name: players[p]?.name ?? '',
          avatar: players[p]?.avatar ?? '🙂',
          done: wcs.progress[String(currentRound)]?.[p]?.done ?? false,
          won: wcs.progress[String(currentRound)]?.[p]?.won ?? false,
          passed: wcs.progress[String(currentRound)]?.[p]?.passed ?? false,
        }))
    : []

  return {
    phase,
    currentRound,
    totalRounds,
    roundCreatorId,
    roundCreatorName,
    roundsProgress,
    targetWord,
    maxAttempts,
    maxHints,
    // Creator
    creatorInput,
    typeCreatorLetter,
    deleteCreatorLetter,
    setCreatorWord,
    submitWord,
    // Guesser
    ...guessingState,
    typeLetter,
    deleteLetter,
    submitGuess,
    useHint,
    pass,
    forceFinish,
  }
}

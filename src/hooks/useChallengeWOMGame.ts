import { useState, useCallback, useRef } from 'react'
import { updatePlayerProgress } from '../firebase/challenge'
import type { WOMWord, WOMTile, WOMTileState, WOMHintType, WOMHintResult } from '../types/wordOMeter'

type GameStatus = 'playing' | 'won' | 'lost'

export interface ChallengeWOMGameState {
  status: GameStatus
  guesses: WOMTile[][]
  currentGuess: string
  letterStates: Record<string, WOMTileState>
  hintsUsed: WOMHintResult[]
  availableHints: WOMHintType[]
  shake: boolean
  error: string | null
  validating: boolean
  score: number
  finished: boolean
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

function filterPositionHints(hints: WOMHintType[], guesses: WOMTile[][], word: string): WOMHintType[] {
  if (hints.length === 0) return hints
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

function computeAvailableHints(word: WOMWord): WOMHintType[] {
  const hints: WOMHintType[] = ['partOfSpeech', 'vowelCount', 'revealFirst', 'revealLast', 'revealMiddle']
  if (word.synonyms.length > 0) hints.push('synonym')
  if (word.antonyms.length > 0) hints.push('antonym')
  if (word.blend) hints.push('commonBlend')
  return hints
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

function calcScore(attemptsUsed: number, hintsUsed: number, timeSecs: number): number {
  // Time is the primary factor: each second costs 10 raw pts, vs 5 per extra try and 2 per hint.
  // Max penalty from tries+hints ≈ 36 raw pts → ~4 s of time advantage always wins.
  return Math.max(1, Math.round((10000 - timeSecs * 10 - (attemptsUsed - 1) * 5 - hintsUsed * 2) / 100))
}

interface UseChallengeWOMGameOptions {
  gameCode: string
  uid: string
  word: WOMWord
}

export function useChallengeWOMGame({ gameCode, uid, word }: UseChallengeWOMGameOptions) {
  const maxAttempts = word.letterCount
  const maxHints = word.letterCount <= 4 ? 1 : word.letterCount <= 6 ? 2 : 3
  const startTimeRef = useRef(Date.now())
  const stateRef = useRef<ChallengeWOMGameState | null>(null)

  const [state, setState] = useState<ChallengeWOMGameState>(() => ({
    status: 'playing',
    guesses: [],
    currentGuess: '',
    letterStates: {},
    hintsUsed: [],
    availableHints: computeAvailableHints(word),
    shake: false,
    error: null,
    validating: false,
    score: 0,
    finished: false,
  }))

  stateRef.current = state

  const writeRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const syncProgress = useCallback(
    (score: number, won: boolean, attemptsUsed: number, hintsUsed: number, finished: boolean, timeTakenSeconds: number | null) => {
      if (writeRef.current) clearTimeout(writeRef.current)
      writeRef.current = setTimeout(() => {
        updatePlayerProgress(gameCode, uid, {
          score,
          correctAnswers: won ? 1 : 0,
          totalAnswered: attemptsUsed,
          bestStreak: hintsUsed,
          finished,
          timeTakenSeconds,
          lastActiveAt: Date.now(),
        }).catch(console.error)
      }, 100)
    },
    [gameCode, uid],
  )

  const typeLetter = useCallback((letter: string) => {
    setState((s) => {
      if (s.status !== 'playing' || s.currentGuess.length >= word.letterCount) return s
      return { ...s, currentGuess: s.currentGuess + letter.toUpperCase(), shake: false, error: null }
    })
  }, [word.letterCount])

  const deleteLetter = useCallback(() => {
    setState((s) => {
      if (s.status !== 'playing' || s.currentGuess.length === 0) return s
      return { ...s, currentGuess: s.currentGuess.slice(0, -1), shake: false, error: null }
    })
  }, [])

  const submitGuess = useCallback(async () => {
    const s = stateRef.current
    if (!s || s.status !== 'playing' || s.validating) return
    if (s.currentGuess.length !== word.letterCount) {
      setState((prev) => ({ ...prev, shake: true, error: `Enter a ${word.letterCount}-letter word` }))
      setTimeout(() => setState((prev) => ({ ...prev, shake: false })), 600)
      return
    }

    if (s.currentGuess !== word.word) {
      setState((prev) => ({ ...prev, validating: true, error: null }))
      try {
        const { default: wordSet } = await import(`../data/wordlists/wom-${word.letterCount}`)
        if (!wordSet.has(s.currentGuess)) {
          setState((prev) => ({ ...prev, validating: false, shake: true, error: 'Not a valid English word' }))
          setTimeout(() => setState((prev) => ({ ...prev, shake: false })), 600)
          return
        }
      } catch {
        setState((prev) => ({ ...prev, validating: false, shake: true, error: 'Not a valid English word' }))
        setTimeout(() => setState((prev) => ({ ...prev, shake: false })), 600)
        return
      }
      setState((prev) => ({ ...prev, validating: false }))
    }

    const cur = stateRef.current
    if (!cur || cur.currentGuess !== s.currentGuess || cur.status !== 'playing') return

    const tiles = evaluateGuess(cur.currentGuess, word.word)
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

    if (done) {
      const timeSecs = Math.round((Date.now() - startTimeRef.current) / 1000)
      const score = won ? calcScore(newGuesses.length, cur.hintsUsed.length, timeSecs) : 0
      syncProgress(score, won, newGuesses.length, cur.hintsUsed.length, true, timeSecs)
      setState((prev) => ({
        ...prev,
        status: won ? 'won' : 'lost',
        guesses: newGuesses,
        currentGuess: '',
        letterStates: newLetterStates,
        score,
        shake: false,
        error: null,
        validating: false,
        finished: true,
      }))
      return
    }

    syncProgress(0, false, newGuesses.length, cur.hintsUsed.length, false, null)
    setState((prev) => ({
      ...prev,
      guesses: newGuesses,
      currentGuess: '',
      letterStates: newLetterStates,
      availableHints: filterPositionHints(prev.availableHints, newGuesses, word.word),
      shake: false,
      error: null,
      validating: false,
    }))
  }, [word, maxAttempts, syncProgress])

  const useHint = useCallback((type: WOMHintType) => {
    setState((s) => {
      if (s.status !== 'playing' || !s.availableHints.includes(type)) return s
      if (s.hintsUsed.length >= maxHints) return s
      const hint: WOMHintResult = { type, text: generateHintText(type, word) }
      const newHintsUsed = [...s.hintsUsed, hint]
      const newAvailable = newHintsUsed.length >= maxHints
        ? []
        : s.availableHints.filter((h) => h !== type)
      syncProgress(0, false, s.guesses.length, newHintsUsed.length, false, null)
      return { ...s, hintsUsed: newHintsUsed, availableHints: newAvailable }
    })
  }, [word, maxHints, syncProgress])

  const forceFinish = useCallback(() => {
    setState((s) => {
      if (s.finished) return s
      const timeSecs = Math.round((Date.now() - startTimeRef.current) / 1000)
      syncProgress(0, false, s.guesses.length, s.hintsUsed.length, true, timeSecs)
      return { ...s, status: 'lost', currentGuess: '', finished: true }
    })
  }, [syncProgress])

  return { ...state, maxAttempts, maxHints, typeLetter, deleteLetter, submitGuess, useHint, forceFinish }
}

import { useState, useCallback, useRef } from 'react'
import { updatePlayerProgress } from '../firebase/challenge'
import type { WOMWord, WOMTile, WOMTileState, WOMHintType, WOMHintResult } from '../types/wordOMeter'

const STATE_PRIORITY: Record<WOMTileState, number> = {
  correct: 3, present: 2, absent: 1, empty: 0, hinted: 0,
}

function evaluateGuess(guess: string, target: string): WOMTile[] {
  const result: WOMTile[] = guess.split('').map((letter) => ({ letter, state: 'absent' as WOMTileState }))
  const counts: Record<string, number> = {}
  for (const ch of target) counts[ch] = (counts[ch] ?? 0) + 1
  for (let i = 0; i < target.length; i++) {
    if (guess[i] === target[i]) {
      result[i]!.state = 'correct'
      counts[target[i]!]!--
    }
  }
  for (let i = 0; i < target.length; i++) {
    if (result[i]!.state === 'correct') continue
    const letter = guess[i]!
    if ((counts[letter] ?? 0) > 0) {
      result[i]!.state = 'present'
      counts[letter]!--
    }
  }
  return result
}

function filterPositionHints(hints: WOMHintType[], guesses: WOMTile[][], word: string): WOMHintType[] {
  if (hints.length === 0) return hints
  const correctPos = new Set<number>()
  for (const row of guesses) {
    row.forEach((tile, i) => { if (tile.state === 'correct') correctPos.add(i) })
  }
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

/**
 * Score = attempt-based base + speed bonus - hint penalty.
 * Faster solves and fewer attempts/hints yield a higher score.
 * Max ~150 (instant, 1 attempt, no hints). Lost = 0.
 */
function calcChallengeScore(attemptsUsed: number, hintsUsed: number, timeTakenSeconds: number): number {
  const attemptScore = Math.max(10, 100 - (attemptsUsed - 1) * 12 - hintsUsed * 8)
  const speedBonus = Math.max(0, Math.round(50 * Math.max(0, 1 - timeTakenSeconds / 90)))
  return attemptScore + speedBonus
}

export interface ChallengeWOMGameState {
  status: 'playing' | 'won' | 'lost'
  guesses: WOMTile[][]
  currentGuess: string
  maxAttempts: number
  hintsUsed: WOMHintResult[]
  availableHints: WOMHintType[]
  letterStates: Record<string, WOMTileState>
  shake: boolean
  error: string | null
  validating: boolean
  score: number
  finished: boolean
}

interface UseChallengeWOMGameOptions {
  gameCode: string
  uid: string
  word: WOMWord
}

export function useChallengeWOMGame({ gameCode, uid, word }: UseChallengeWOMGameOptions) {
  const startTimeRef = useRef(Date.now())
  const [state, setState] = useState<ChallengeWOMGameState>(() => ({
    status: 'playing',
    guesses: [],
    currentGuess: '',
    maxAttempts: word.letterCount,
    hintsUsed: [],
    availableHints: computeAvailableHints(word),
    letterStates: {},
    shake: false,
    error: null,
    validating: false,
    score: 0,
    finished: false,
  }))
  const stateRef = useRef(state)
  stateRef.current = state

  const writeRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const syncProgress = useCallback(
    (
      score: number,
      correctAnswers: number,
      totalAnswered: number,
      hintsUsedCount: number,
      finished: boolean,
      timeTakenSeconds: number | null,
    ) => {
      if (writeRef.current) clearTimeout(writeRef.current)
      writeRef.current = setTimeout(() => {
        updatePlayerProgress(gameCode, uid, {
          score,
          correctAnswers,
          totalAnswered,       // attempts used
          bestStreak: hintsUsedCount,  // repurposed: hints used
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
    if (s.status !== 'playing' || s.validating) return
    if (s.currentGuess.length !== word.letterCount) {
      setState((prev) => ({ ...prev, shake: true, error: `Enter a ${word.letterCount}-letter word` }))
      return
    }

    if (s.currentGuess !== word.word) {
      setState((prev) => ({ ...prev, validating: true, error: null }))
      try {
        const res = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${s.currentGuess.toLowerCase()}`,
        )
        if (!res.ok) {
          setState((prev) => ({ ...prev, validating: false, shake: true, error: 'Not a valid English word' }))
          return
        }
      } catch {
        // Network error — allow rather than blocking gameplay
      }
      setState((prev) => ({ ...prev, validating: false }))
    }

    const cur = stateRef.current
    if (cur.currentGuess !== s.currentGuess || cur.status !== 'playing') return

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
    const lost = !won && newGuesses.length >= cur.maxAttempts

    if (won || lost) {
      const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000)
      const score = won ? calcChallengeScore(newGuesses.length, cur.hintsUsed.length, timeTaken) : 0
      syncProgress(score, won ? 1 : 0, newGuesses.length, cur.hintsUsed.length, true, timeTaken)
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

    syncProgress(0, 0, newGuesses.length, cur.hintsUsed.length, false, null)

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
  }, [word, syncProgress]) // eslint-disable-line react-hooks/exhaustive-deps

  const useHint = useCallback((type: WOMHintType) => {
    setState((s) => {
      if (s.status !== 'playing' || !s.availableHints.includes(type)) return s
      const maxHints = word.letterCount <= 4 ? 1 : word.letterCount <= 6 ? 2 : 3
      if (s.hintsUsed.length >= maxHints) return s
      const hint: WOMHintResult = { type, text: generateHintText(type, word) }
      const newHintsUsed = [...s.hintsUsed, hint]
      const newAvailable = newHintsUsed.length >= maxHints
        ? []
        : s.availableHints.filter((h) => h !== type)
      return { ...s, hintsUsed: newHintsUsed, availableHints: newAvailable }
    })
  }, [word])

  const forceFinish = useCallback(() => {
    setState((s) => {
      if (s.finished) return s
      const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000)
      syncProgress(0, 0, s.guesses.length, s.hintsUsed.length, true, timeTaken)
      return { ...s, status: 'lost', finished: true }
    })
  }, [syncProgress])

  return { ...state, typeLetter, deleteLetter, submitGuess, useHint, forceFinish }
}

import { useState, useCallback, useRef } from 'react'
import { pickWord, saveSeenWordToStorage, saveWordOMeterSession } from '../firebase/wordOMeter'
import type { Grade } from '../types/question'
import type { WOMWord, WOMTile, WOMTileState, WOMHintType, WOMHintResult } from '../types/wordOMeter'

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

type GameStatus = 'idle' | 'playing' | 'won' | 'lost'

export interface WOMGameState {
  status: GameStatus
  grade: Grade
  letterCount: number
  word: WOMWord | null
  guesses: WOMTile[][]
  currentGuess: string
  maxAttempts: number
  hintsUsed: WOMHintResult[]
  availableHints: WOMHintType[]
  letterStates: Record<string, WOMTileState>
  shake: boolean
  error: string | null
  validating: boolean
  sessionId: string | null
  score: number
}

const initial: WOMGameState = {
  status: 'idle',
  grade: 'KG',
  letterCount: 3,
  word: null,
  guesses: [],
  currentGuess: '',
  maxAttempts: 3,
  hintsUsed: [],
  availableHints: [],
  letterStates: {},
  shake: false,
  error: null,
  validating: false,
  sessionId: null,
  score: 0,
}

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

function calcScore(attemptsUsed: number, hintsUsed: number): number {
  return Math.max(10, 100 - (attemptsUsed - 1) * 12 - hintsUsed * 8)
}

export function useWordOMeterGame(userId: string) {
  const [state, setState] = useState<WOMGameState>(initial)
  const startTimeRef = useRef<number>(0)
  const stateRef = useRef<WOMGameState>(initial)
  stateRef.current = state

  const startGame = useCallback((grade: Grade, letterCount: number) => {
    const word = pickWord(grade, letterCount)
    if (!word) {
      setState((s) => ({ ...s, error: 'No words available for this grade and letter count.' }))
      return
    }
    startTimeRef.current = Date.now()
    setState({
      ...initial,
      status: 'playing',
      grade,
      letterCount,
      word,
      maxAttempts: letterCount,
      availableHints: computeAvailableHints(word),
    })
  }, [])

  const typeLetter = useCallback((letter: string) => {
    setState((s) => {
      if (s.status !== 'playing' || s.currentGuess.length >= s.letterCount) return s
      return { ...s, currentGuess: s.currentGuess + letter.toUpperCase(), shake: false, error: null }
    })
  }, [])

  const deleteLetter = useCallback(() => {
    setState((s) => {
      if (s.status !== 'playing' || s.currentGuess.length === 0) return s
      return { ...s, currentGuess: s.currentGuess.slice(0, -1), shake: false, error: null }
    })
  }, [])

  const submitGuess = useCallback(async () => {
    const s = stateRef.current
    if (s.status !== 'playing' || !s.word || s.validating) return
    if (s.currentGuess.length !== s.letterCount) {
      setState((prev) => ({ ...prev, shake: true, error: `Enter a ${prev.letterCount}-letter word` }))
      return
    }

    // Validate against local SOWPODS word list (skip if the guess IS the answer)
    if (s.currentGuess !== s.word.word) {
      setState((prev) => ({ ...prev, validating: true, error: null }))
      try {
        const wordSet = await loadWordlist(s.letterCount)
        if (!wordSet.has(s.currentGuess)) {
          setState((prev) => ({ ...prev, validating: false, shake: true, error: 'Not a valid English word' }))
          return
        }
      } catch {
        setState((prev) => ({ ...prev, validating: false, shake: true, error: 'Not a valid English word' }))
        return
      }
      setState((prev) => ({ ...prev, validating: false }))
    }

    // Re-read state after async gap; abort if the guess changed
    const cur = stateRef.current
    if (cur.currentGuess !== s.currentGuess || cur.status !== 'playing' || !cur.word) return

    const tiles = evaluateGuess(cur.currentGuess, cur.word.word)
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
      const attemptsUsed = newGuesses.length
      const score = won ? calcScore(attemptsUsed, cur.hintsUsed.length) : 0
      _finishSession(cur.word, cur.grade, won, attemptsUsed, cur.maxAttempts, cur.hintsUsed.length, score)
      saveSeenWordToStorage(cur.letterCount, cur.word.word)
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
      }))
      return
    }

    setState((prev) => ({
      ...prev,
      guesses: newGuesses,
      currentGuess: '',
      letterStates: newLetterStates,
      availableHints: filterPositionHints(prev.availableHints, newGuesses, cur.word!.word),
      shake: false,
      error: null,
      validating: false,
    }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const useHint = useCallback((type: WOMHintType) => {
    setState((s) => {
      if (s.status !== 'playing' || !s.word || !s.availableHints.includes(type)) return s
      const maxHints = s.letterCount <= 4 ? 1 : s.letterCount <= 6 ? 2 : 3
      if (s.hintsUsed.length >= maxHints) return s
      const hint: WOMHintResult = { type, text: generateHintText(type, s.word) }
      const newHintsUsed = [...s.hintsUsed, hint]
      // Disable all remaining hints once limit is reached
      const newAvailable = newHintsUsed.length >= maxHints
        ? []
        : s.availableHints.filter((h) => h !== type)
      return {
        ...s,
        hintsUsed: newHintsUsed,
        availableHints: newAvailable,
      }
    })
  }, [])

  const forceFinish = useCallback(() => {
    setState((s) => {
      if (s.status !== 'playing' || !s.word) return s
      if (s.guesses.length > 0) {
        _finishSession(s.word, s.grade, false, s.guesses.length, s.maxAttempts, s.hintsUsed.length, 0)
        saveSeenWordToStorage(s.letterCount, s.word.word)
      }
      return { ...s, status: 'lost', score: 0 }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const reset = useCallback(() => setState(initial), [])

  return { state, startGame, typeLetter, deleteLetter, submitGuess, useHint, forceFinish, reset }

  function _finishSession(
    word: WOMWord,
    grade: Grade,
    won: boolean,
    attemptsUsed: number,
    maxAttempts: number,
    hintsUsed: number,
    score: number,
  ) {
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000)
    saveWordOMeterSession({
      userId,
      timestamp: Date.now(),
      grade,
      subject: 'wordOMeter',
      word: word.word,
      letterCount: word.letterCount,
      won,
      attemptsUsed,
      maxAttempts,
      hintsUsed,
      score,
      timeTakenSeconds: timeTaken,
    }).then((id) => {
      setState((prev) => ({ ...prev, sessionId: id }))
    }).catch(() => { /* non-critical */ })
  }
}

import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from './config'
import { getWordPool } from '../data/wordOMeterData'
import type { Grade } from '../types/question'
import type { WOMWord, WOMSession } from '../types/wordOMeter'

const WOM_SEEN_KEY = (lc: number) => `mm_wom_seen_${lc}`
const WOM_SEEN_CAP = 60

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export function loadSeenWordsFromStorage(letterCount: number): Set<string> {
  try {
    const raw = localStorage.getItem(WOM_SEEN_KEY(letterCount))
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function saveSeenWordToStorage(letterCount: number, word: string): void {
  try {
    const existing: string[] = JSON.parse(localStorage.getItem(WOM_SEEN_KEY(letterCount)) ?? '[]')
    const combined = [...existing, word]
    localStorage.setItem(WOM_SEEN_KEY(letterCount), JSON.stringify(combined.slice(-WOM_SEEN_CAP)))
  } catch { /* non-critical */ }
}

export function pickWord(grade: Grade, letterCount: number): WOMWord | null {
  const pool = getWordPool(grade, letterCount)
  if (pool.length === 0) return null
  const seen = loadSeenWordsFromStorage(letterCount)
  const unseen = pool.filter((w) => !seen.has(w.word))
  const candidates = unseen.length > 0 ? unseen : pool
  return shuffle(candidates)[0] ?? null
}

export async function saveWordOMeterSession(
  session: Omit<WOMSession, 'id'>,
): Promise<string> {
  const docRef = await addDoc(collection(db, 'sessions'), {
    ...session,
    timestamp: Timestamp.fromMillis(session.timestamp),
    operation: null,
    difficulty: null,
    mode: 'fixed',
    totalQuestions: 1,
    correctAnswers: session.won ? 1 : 0,
    accuracy: session.won ? 100 : 0,
    bestStreak: 0,
    isHighScore: false,
  })
  return docRef.id
}

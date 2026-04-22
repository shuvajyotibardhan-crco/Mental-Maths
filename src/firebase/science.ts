import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
  limit,
} from 'firebase/firestore'
import { db } from './config'
import type { Grade } from '../types/question'
import type { ScienceQuestion, ScienceSession } from '../types/science'

// Grades in ascending order — used to build the cumulative pool
const SCI_GRADE_ORDER: Grade[] = ['5', '6', '7', '8', '9', '10', '11', '12']

// Cap = 5 sessions × 20 questions — guarantees no repeats across 5 consecutive sessions
const SCI_SEEN_CAP = 100

const SCI_SEEN_LS_KEY = (grade: Grade) => `mm_sci_seen_${grade}`

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/**
 * Returns all grades from grade 5 up to and including the given grade.
 * Grade 6 → ['5','6'], Grade 8 → ['5','6','7','8'], etc.
 */
function gradesUpTo(grade: Grade): Grade[] {
  const idx = SCI_GRADE_ORDER.indexOf(grade)
  if (idx < 0) return ['5']
  return SCI_GRADE_ORDER.slice(0, idx + 1)
}

/** Shuffles the four options and updates correctIndices to match the new positions. */
function shuffleOptions(q: ScienceQuestion): ScienceQuestion {
  const correctAnswers = q.correctIndices.map((i) => q.options[i]!)
  const shuffled = shuffle([...q.options]) as [string, string, string, string]
  const newCorrectIndices = correctAnswers
    .map((a) => shuffled.indexOf(a))
    .sort((a, b) => a - b)
  return { ...q, options: shuffled, correctIndices: newCorrectIndices }
}

export function loadScienceSeenIds(grade: Grade): Set<string> {
  try {
    const raw = localStorage.getItem(SCI_SEEN_LS_KEY(grade))
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function saveScienceSeenIds(grade: Grade, newIds: string[]): void {
  try {
    const existing: string[] = JSON.parse(
      localStorage.getItem(SCI_SEEN_LS_KEY(grade)) ?? '[]',
    )
    const combined = [...existing, ...newIds]
    // FIFO: keep the most recent SCI_SEEN_CAP ids
    localStorage.setItem(
      SCI_SEEN_LS_KEY(grade),
      JSON.stringify(combined.slice(-SCI_SEEN_CAP)),
    )
  } catch { /* non-critical */ }
}

/**
 * Fetches up to 200 Science questions for the given grade's cumulative pool
 * (grades 5 through selectedGrade), prioritises unseen questions, and returns
 * 20 shuffled questions for the session.
 *
 * The dedup cap of 100 (5 × 20) guarantees no repeats across 5 consecutive
 * sessions. Once all seen questions fill the cap, the window resets naturally.
 */
export async function fetchScienceQuestions(grade: Grade): Promise<ScienceQuestion[]> {
  const pool = gradesUpTo(grade)
  const q = query(
    collection(db, 'scienceQuestions'),
    where('grade', 'in', pool),
    limit(200),
  )
  const snap = await getDocs(q)
  const all: ScienceQuestion[] = snap.docs.map((d) => ({
    ...(d.data() as Omit<ScienceQuestion, 'id'>),
    id: d.id,
  }))

  const seenIds = loadScienceSeenIds(grade)
  const unseen = all.filter((q) => !seenIds.has(q.id))
  const selected = unseen.length >= 20 ? unseen : all
  return shuffle(selected).slice(0, 20).map(shuffleOptions)
}

/**
 * Saves a completed Science session to Firestore shared 'sessions' collection.
 */
export async function saveScienceSession(
  session: Omit<ScienceSession, 'id'>,
): Promise<string> {
  const docRef = await addDoc(collection(db, 'sessions'), {
    ...session,
    timestamp: Timestamp.fromMillis(session.timestamp),
    operation: null,
    difficulty: null,
    mode: 'fixed',
  })
  return docRef.id
}

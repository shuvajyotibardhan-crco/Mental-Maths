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
import type { SocialStudiesQuestion, SocialStudiesSession } from '../types/socialStudies'

const SS_SEEN_LS_KEY = (grade: Grade) => `mm_ss_seen_${grade}`
const SS_SEEN_CAP = 80  // matches the total question pool per grade

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export function loadSeenIdsFromStorage(grade: Grade): Set<string> {
  try {
    const raw = localStorage.getItem(SS_SEEN_LS_KEY(grade))
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function saveSeenIdsToStorage(grade: Grade, newIds: string[]): void {
  try {
    const existing: string[] = JSON.parse(
      localStorage.getItem(SS_SEEN_LS_KEY(grade)) ?? '[]',
    )
    const combined = [...existing, ...newIds]
    // FIFO: keep the most recent SS_SEEN_CAP ids; when all questions seen the
    // window naturally resets on the next fetchSocialStudiesQuestions call
    localStorage.setItem(SS_SEEN_LS_KEY(grade), JSON.stringify(combined.slice(-SS_SEEN_CAP)))
  } catch { /* non-critical */ }
}

/**
 * Fetches up to 80 Social Studies questions for the given grade,
 * prioritises questions not yet seen in previous sessions (cross-session
 * deduplication via localStorage), and returns 20 for the quiz session.
 *
 * If fewer than 20 unseen questions remain the full pool is used so the
 * session never comes up short — this acts as an automatic reset once the
 * player has worked through all questions at their grade level.
 */
export async function fetchSocialStudiesQuestions(grade: Grade): Promise<SocialStudiesQuestion[]> {
  const q = query(
    collection(db, 'socialStudiesQuestions'),
    where('grade', '==', grade),
    limit(80),
  )
  const snap = await getDocs(q)
  const all: SocialStudiesQuestion[] = snap.docs.map((d) => ({
    ...(d.data() as Omit<SocialStudiesQuestion, 'id'>),
    id: d.id,
  }))

  const seenIds = loadSeenIdsFromStorage(grade)
  const unseen = all.filter((q) => !seenIds.has(q.id))
  const pool = unseen.length >= 20 ? unseen : all
  return shuffle(pool).slice(0, 20)
}

/**
 * Saves a completed Social Studies session to Firestore.
 * Session is stored in the shared 'sessions' collection with subject = 'socialStudies'.
 */
export async function saveSocialStudiesSession(
  session: Omit<SocialStudiesSession, 'id'>,
): Promise<string> {
  const docRef = await addDoc(collection(db, 'sessions'), {
    ...session,
    timestamp: Timestamp.fromMillis(session.timestamp),
    // Social Studies-only fields — mental maths fields not applicable
    operation: null,
    difficulty: null,
    mode: 'fixed',
  })
  return docRef.id
}

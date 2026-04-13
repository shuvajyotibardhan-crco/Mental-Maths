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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/**
 * Fetches up to 80 Social Studies questions for the given grade,
 * shuffles them, and returns the first 20 for a quiz session.
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
  return shuffle(all).slice(0, 20)
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

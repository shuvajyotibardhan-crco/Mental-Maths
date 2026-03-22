import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore'
import { db } from './config'
import type { UserProfile } from '../types/user'
import type { SessionRecord, HighScoreEntry, HighScoreKey } from '../types/session'
import type { Grade } from '../types/question'

// ---- User Profile ----

export async function createUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(doc(db, 'users', profile.uid), profile)
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as UserProfile) : null
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data)
}

// ---- Sessions ----

export async function saveSession(session: SessionRecord): Promise<string> {
  const docRef = await addDoc(collection(db, 'sessions'), {
    ...session,
    timestamp: Timestamp.fromMillis(session.timestamp),
  })
  return docRef.id
}

export interface SessionFilter {
  userId: string
  startDate?: Date
  endDate?: Date
  grade?: Grade
  operation?: string
}

export async function getSessions(filter: SessionFilter): Promise<SessionRecord[]> {
  // Simple query with just userId to avoid composite index requirements
  const q = query(
    collection(db, 'sessions'),
    where('userId', '==', filter.userId),
  )

  let snap;
  try {
    snap = await getDocs(q)
  } catch (err) {
    console.error('Firestore getSessions error:', err)
    return []
  }

  let results = snap.docs.map((d) => {
    const data = d.data()
    return {
      ...data,
      id: d.id,
      timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : data.timestamp,
    } as SessionRecord
  })

  // All filtering done client-side to avoid composite index requirements
  if (filter.startDate) {
    const start = filter.startDate.getTime()
    results = results.filter((s) => s.timestamp >= start)
  }
  if (filter.endDate) {
    const end = filter.endDate.getTime()
    results = results.filter((s) => s.timestamp <= end)
  }
  if (filter.grade) {
    results = results.filter((s) => s.grade === filter.grade)
  }
  if (filter.operation) {
    results = results.filter((s) => s.operation === filter.operation)
  }

  // Sort by timestamp descending
  results.sort((a, b) => b.timestamp - a.timestamp)

  return results
}

// ---- High Scores ----

export async function getHighScores(userId: string): Promise<Record<string, HighScoreEntry>> {
  const snap = await getDoc(doc(db, 'highScores', userId))
  return snap.exists() ? (snap.data() as Record<string, HighScoreEntry>) : {}
}

export async function checkAndUpdateHighScore(
  userId: string,
  key: HighScoreKey,
  score: number,
  sessionId: string,
): Promise<boolean> {
  const scores = await getHighScores(userId)
  const existing = scores[key]

  if (!existing || score > existing.score) {
    await setDoc(
      doc(db, 'highScores', userId),
      { [key]: { score, date: Date.now(), sessionId } },
      { merge: true },
    )
    return true
  }

  return false
}

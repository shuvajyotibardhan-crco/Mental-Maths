import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
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

// ---- Username Lookup (publicly readable for password reset) ----

export async function saveUsernameLookup(username: string, email: string, parentEmail?: string): Promise<void> {
  await setDoc(doc(db, 'usernameLookup', username.toLowerCase()), {
    email,
    parentEmail: parentEmail ?? '',
  })
}

export async function getEmailByUsername(username: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'usernameLookup', username.toLowerCase()))
  if (!snap.exists()) return null
  const data = snap.data() as { email: string; parentEmail?: string }
  // Use parentEmail for reset if set (handles child Google accounts)
  return data.parentEmail || data.email || null
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  // Check both usernameLookup and users collection
  const lookupSnap = await getDoc(doc(db, 'usernameLookup', username.toLowerCase()))
  if (lookupSnap.exists()) return true

  // Also check users collection by querying username field
  const q = query(
    collection(db, 'users'),
    where('username', '==', username.toLowerCase()),
  )
  const snap = await getDocs(q)
  return !snap.empty
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
  timeTakenSeconds?: number,
): Promise<boolean> {
  const scores = await getHighScores(userId)
  const existing = scores[key]

  // New high score if: higher score, OR same score but faster time
  const isBetter = !existing
    || score > existing.score
    || (score === existing.score && timeTakenSeconds !== undefined && existing.timeTakenSeconds !== undefined && timeTakenSeconds < existing.timeTakenSeconds)

  if (isBetter) {
    await setDoc(
      doc(db, 'highScores', userId),
      { [key]: { score, date: Date.now(), sessionId, timeTakenSeconds: timeTakenSeconds ?? null } },
      { merge: true },
    )
    return true
  }

  return false
}

// ---- Global High Scores (across all users) ----

export async function getGlobalHighScore(key: HighScoreKey): Promise<{ score: number } | null> {
  const snap = await getDoc(doc(db, 'globalHighScores', key))
  return snap.exists() ? (snap.data() as { score: number; date: number }) : null
}

export async function checkAndUpdateGlobalHighScore(
  key: HighScoreKey,
  score: number,
  timeTakenSeconds?: number,
): Promise<boolean> {
  const existing = await getGlobalHighScore(key)

  // New global best if: higher score, OR same score but faster time
  const isBetter = !existing
    || score > existing.score
    || (score === existing.score && timeTakenSeconds !== undefined && (existing as { timeTakenSeconds?: number }).timeTakenSeconds !== undefined && timeTakenSeconds < ((existing as { timeTakenSeconds?: number }).timeTakenSeconds ?? Infinity))

  if (isBetter) {
    await setDoc(doc(db, 'globalHighScores', key), {
      score,
      date: Date.now(),
      timeTakenSeconds: timeTakenSeconds ?? null,
    })
    return true
  }

  return false
}

// ---- Purge sessions older than 6 months ----

export async function purgeOldSessions(userId: string): Promise<number> {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const q = query(
    collection(db, 'sessions'),
    where('userId', '==', userId),
  )

  let snap
  try {
    snap = await getDocs(q)
  } catch (err) {
    console.error('Firestore purgeOldSessions error:', err)
    return 0
  }

  let purged = 0
  const cutoff = sixMonthsAgo.getTime()

  for (const d of snap.docs) {
    const data = d.data()
    const ts = data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : data.timestamp
    if (ts < cutoff) {
      await deleteDoc(doc(db, 'sessions', d.id))
      purged++
    }
  }

  return purged
}

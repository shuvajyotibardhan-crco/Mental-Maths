import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  writeBatch,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { httpsCallable } from 'firebase/functions'
import { db, storage, functions } from './config'
import type { UserProfile } from '../types/user'
import type { HighScoreEntry } from '../types/session'
import type { AuditEntry } from '../types/admin'

// ---- Admin Access ----

export async function checkIsAdmin(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'admins', uid))
  return snap.exists()
}

// ---- User Search ----

export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  const q = query(
    collection(db, 'users'),
    where('username', '==', username.toLowerCase().trim()),
  )
  const snap = await getDocs(q)
  if (snap.empty || !snap.docs[0]) return null
  const d = snap.docs[0]
  return { ...d.data(), uid: d.id } as UserProfile
}

// ---- File Upload ----
// Note: requires Firebase Storage (Blaze plan)

export async function uploadSupportingFile(
  file: File,
  auditId: string,
): Promise<{ url: string; name: string }> {
  const storageRef = ref(storage, `audit-support/${auditId}/${file.name}`)
  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)
  return { url, name: file.name }
}

// ---- Audit Log ----

async function saveAuditEntry(entry: Omit<AuditEntry, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'auditLog'), {
    ...entry,
    timestamp: Timestamp.fromMillis(entry.timestamp),
  })
  return docRef.id
}

export async function getAuditLog(limitCount = 50): Promise<AuditEntry[]> {
  const q = query(
    collection(db, 'auditLog'),
    orderBy('timestamp', 'desc'),
    limit(limitCount),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      ...data,
      id: d.id,
      timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : data.timestamp,
    } as AuditEntry
  })
}

// ---- Password Reset ----
// Sets the user's password directly via Cloud Function (adminSetPassword).
// Admin provides a new temporary password; user can change it after login.

export async function adminResetPassword(
  targetUser: UserProfile,
  adminProfile: UserProfile,
  newPassword: string,
  notes: string,
): Promise<void> {
  const baseEntry = {
    timestamp: Date.now(),
    adminUid: adminProfile.uid,
    adminUsername: adminProfile.username,
    action: 'password_reset' as const,
    affectedUsers: [{ uid: targetUser.uid, username: targetUser.username }],
    notes,
  }

  try {
    const setPassword = httpsCallable(functions, 'adminSetPassword')
    await setPassword({ targetUid: targetUser.uid, newPassword })
    await saveAuditEntry({
      ...baseEntry,
      outcome: 'success',
      details: `Password set directly for @${targetUser.username} by admin.`,
    })
  } catch (err) {
    await saveAuditEntry({
      ...baseEntry,
      outcome: 'failed',
      details: err instanceof Error ? err.message : 'Unknown error',
    })
    throw err
  }
}

// ---- Merge Users ----
// User A is merged INTO User B. User B keeps their identity and account.
// Best scores from both users are kept under User B.
// All of User A's sessions are transferred to User B.
// User A's profile is marked as merged (account remains but is deactivated).

export async function adminMergeUsers(
  userA: UserProfile,
  userB: UserProfile,
  adminProfile: UserProfile,
  notes: string,
  fileUrl?: string,
  fileName?: string,
): Promise<string> {
  const baseEntry = {
    timestamp: Date.now(),
    adminUid: adminProfile.uid,
    adminUsername: adminProfile.username,
    action: 'merge_users' as const,
    affectedUsers: [
      { uid: userA.uid, username: userA.username },
      { uid: userB.uid, username: userB.username },
    ],
    notes,
    ...(fileUrl ? { supportingFileUrl: fileUrl, supportingFileName: fileName } : {}),
  }

  try {
    // 1. Fetch both users' high scores
    const [snapA, snapB] = await Promise.all([
      getDoc(doc(db, 'highScores', userA.uid)),
      getDoc(doc(db, 'highScores', userB.uid)),
    ])
    const scoresA = snapA.exists() ? (snapA.data() as Record<string, HighScoreEntry>) : {}
    const scoresB = snapB.exists() ? (snapB.data() as Record<string, HighScoreEntry>) : {}

    // 2. Merge: for each key keep the better score
    const merged = { ...scoresB }
    let mergedKeys = 0
    for (const [key, entryA] of Object.entries(scoresA)) {
      const entryB = merged[key]
      const aBetter =
        !entryB ||
        entryA.score > entryB.score ||
        (entryA.score === entryB.score &&
          entryA.timeTakenSeconds !== undefined &&
          entryB.timeTakenSeconds !== undefined &&
          entryA.timeTakenSeconds < entryB.timeTakenSeconds)
      if (aBetter) {
        merged[key] = entryA
        mergedKeys++
      }
    }

    // 3. Write merged high scores to userB
    await setDoc(doc(db, 'highScores', userB.uid), merged)

    // 4. Transfer all of userA's sessions to userB in batches of 400
    const sessionsSnap = await getDocs(
      query(collection(db, 'sessions'), where('userId', '==', userA.uid)),
    )
    const sessionCount = sessionsSnap.docs.length
    const BATCH_SIZE = 400
    for (let i = 0; i < sessionsSnap.docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db)
      for (const d of sessionsSnap.docs.slice(i, i + BATCH_SIZE)) {
        batch.update(doc(db, 'sessions', d.id), { userId: userB.uid })
      }
      await batch.commit()
    }

    // 5. Mark userA as merged
    await updateDoc(doc(db, 'users', userA.uid), {
      mergedInto: userB.uid,
      mergedAt: Date.now(),
    })

    const details = `Merged @${userA.username} into @${userB.username}. ${sessionCount} sessions transferred, ${mergedKeys} high score keys updated from User A.`

    await saveAuditEntry({ ...baseEntry, outcome: 'success', details })
    return details
  } catch (err) {
    const details = err instanceof Error ? err.message : 'Unknown error'
    await saveAuditEntry({ ...baseEntry, outcome: 'failed', details })
    throw err
  }
}

// ---- Move Scores ----
// Transfers all sessions and high scores from fromUser to toUser.
// Better scores are kept (no score is lost for toUser).
// fromUser's high scores document is deleted after transfer.
// fromUser's account and profile are left intact.

export async function adminMoveScores(
  fromUser: UserProfile,
  toUser: UserProfile,
  adminProfile: UserProfile,
  notes: string,
  fileUrl?: string,
  fileName?: string,
): Promise<string> {
  const baseEntry = {
    timestamp: Date.now(),
    adminUid: adminProfile.uid,
    adminUsername: adminProfile.username,
    action: 'move_scores' as const,
    affectedUsers: [
      { uid: fromUser.uid, username: fromUser.username },
      { uid: toUser.uid, username: toUser.username },
    ],
    notes,
    ...(fileUrl ? { supportingFileUrl: fileUrl, supportingFileName: fileName } : {}),
  }

  try {
    // 1. Fetch both users' high scores
    const [snapFrom, snapTo] = await Promise.all([
      getDoc(doc(db, 'highScores', fromUser.uid)),
      getDoc(doc(db, 'highScores', toUser.uid)),
    ])
    const scoresFrom = snapFrom.exists() ? (snapFrom.data() as Record<string, HighScoreEntry>) : {}
    const scoresTo = snapTo.exists() ? (snapTo.data() as Record<string, HighScoreEntry>) : {}

    // 2. Merge into toUser keeping best scores
    const merged = { ...scoresTo }
    let movedKeys = 0
    for (const [key, entryFrom] of Object.entries(scoresFrom)) {
      const entryTo = merged[key]
      const fromBetter =
        !entryTo ||
        entryFrom.score > entryTo.score ||
        (entryFrom.score === entryTo.score &&
          entryFrom.timeTakenSeconds !== undefined &&
          entryTo.timeTakenSeconds !== undefined &&
          entryFrom.timeTakenSeconds < entryTo.timeTakenSeconds)
      if (fromBetter) {
        merged[key] = entryFrom
        movedKeys++
      }
    }

    // 3. Write to toUser
    if (Object.keys(scoresFrom).length > 0) {
      await setDoc(doc(db, 'highScores', toUser.uid), merged)
    }

    // 4. Transfer sessions in batches of 400
    const sessionsSnap = await getDocs(
      query(collection(db, 'sessions'), where('userId', '==', fromUser.uid)),
    )
    const sessionCount = sessionsSnap.docs.length
    const BATCH_SIZE = 400
    for (let i = 0; i < sessionsSnap.docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db)
      for (const d of sessionsSnap.docs.slice(i, i + BATCH_SIZE)) {
        batch.update(doc(db, 'sessions', d.id), { userId: toUser.uid })
      }
      await batch.commit()
    }

    // 5. Delete fromUser's high scores (they have been transferred)
    if (snapFrom.exists()) {
      await deleteDoc(doc(db, 'highScores', fromUser.uid))
    }

    const details = `Moved scores from @${fromUser.username} to @${toUser.username}. ${sessionCount} sessions transferred, ${movedKeys} high score keys moved.`

    await saveAuditEntry({ ...baseEntry, outcome: 'success', details })
    return details
  } catch (err) {
    const details = err instanceof Error ? err.message : 'Unknown error'
    await saveAuditEntry({ ...baseEntry, outcome: 'failed', details })
    throw err
  }
}

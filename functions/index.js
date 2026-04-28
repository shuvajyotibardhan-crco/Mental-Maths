const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore } = require('firebase-admin/firestore')

initializeApp()

/**
 * adminSetPassword — sets a new password for any user.
 * Caller must be authenticated and present in the admins/{uid} Firestore collection.
 */
exports.adminSetPassword = onCall(async (request) => {
  // 1. Must be authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.')
  }

  // 2. Must be an admin
  const db = getFirestore()
  const adminSnap = await db.doc(`admins/${request.auth.uid}`).get()
  if (!adminSnap.exists) {
    throw new HttpsError('permission-denied', 'Admin access required.')
  }

  // 3. Validate inputs
  const { targetUid, newPassword } = request.data
  if (!targetUid || typeof targetUid !== 'string') {
    throw new HttpsError('invalid-argument', 'targetUid is required.')
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    throw new HttpsError('invalid-argument', 'Password must be at least 6 characters.')
  }

  // 4. Set the password
  await getAuth().updateUser(targetUid, { password: newPassword })

  return { success: true }
})

/**
 * adminDeleteUser — deletes a user's Firebase Auth account.
 * Caller must be authenticated and present in the admins/{uid} Firestore collection.
 * Firestore data deletion is handled client-side before calling this function.
 */
exports.adminDeleteUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.')
  }

  const db = getFirestore()
  const adminSnap = await db.doc(`admins/${request.auth.uid}`).get()
  if (!adminSnap.exists) {
    throw new HttpsError('permission-denied', 'Admin access required.')
  }

  const { targetUid } = request.data
  if (!targetUid || typeof targetUid !== 'string') {
    throw new HttpsError('invalid-argument', 'targetUid is required.')
  }

  await getAuth().deleteUser(targetUid)
  return { success: true }
})

/**
 * updateRecoveryEmail — atomically updates the user's recovery email in both
 * Firebase Auth and Firestore usernameLookup. Also migrates legacy users whose
 * Firebase Auth email was their recovery email onto the synthetic email scheme.
 * Caller must be the authenticated user themselves (not admin).
 */
exports.updateRecoveryEmail = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.')
  }

  const uid = request.auth.uid
  const { newEmail } = request.data  // string | null

  const db = getFirestore()
  const auth = getAuth()

  // Get username from Firestore user profile
  const userSnap = await db.doc(`users/${uid}`).get()
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'User profile not found.')
  }
  const username = userSnap.data().username
  const syntheticEmail = `${username.toLowerCase()}@mentalmaths.app`

  if (newEmail && typeof newEmail === 'string') {
    const trimmed = newEmail.toLowerCase().trim()

    // Check the email is not already in use by a different user
    try {
      const existing = await auth.getUserByEmail(trimmed)
      if (existing.uid !== uid) {
        throw new HttpsError('already-exists', 'This email is already linked to another account.')
      }
    } catch (err) {
      if (err.code === 'already-exists') throw err
      // auth/user-not-found means the email is free — continue
    }

    // Set Firebase Auth email to recovery email so sendPasswordResetEmail reaches the user
    await auth.updateUser(uid, { email: trimmed })
    // Store recovery email in Firestore for unauthenticated password-reset lookup
    await db.doc(`usernameLookup/${username.toLowerCase()}`).set({ reserved: true, recoveryEmail: trimmed })
  } else {
    // Removing recovery email: fall back to synthetic so the account has a valid email
    await auth.updateUser(uid, { email: syntheticEmail })
    await db.doc(`usernameLookup/${username.toLowerCase()}`).set({ reserved: true })
  }

  return { success: true }
})

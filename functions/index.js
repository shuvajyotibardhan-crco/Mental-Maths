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

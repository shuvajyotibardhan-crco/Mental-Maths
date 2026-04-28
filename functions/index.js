const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore } = require('firebase-admin/firestore')
const nodemailer = require('nodemailer')

initializeApp()

/**
 * sendPasswordResetLink — looks up the Firebase Auth account by recovery email,
 * generates a reset link for the synthetic-email account, and emails it to the
 * user's real recovery address. Unauthenticated; never reveals whether an account exists.
 */
exports.sendPasswordResetLink = onCall(async (request) => {
  const { recoveryEmail } = request.data
  if (!recoveryEmail || typeof recoveryEmail !== 'string') {
    throw new HttpsError('invalid-argument', 'recoveryEmail is required.')
  }

  const db = getFirestore()
  const auth = getAuth()
  const email = recoveryEmail.toLowerCase().trim()

  // Find the username whose recovery email matches
  const snap = await db.collection('usernameLookup')
    .where('recoveryEmail', '==', email)
    .limit(1)
    .get()

  // Silently succeed if no match — avoid email enumeration
  if (!snap.empty) {
    const username = snap.docs[0].id
    const syntheticEmail = `${username}@mentalmaths.app`

    const resetLink = await auth.generatePasswordResetLink(syntheticEmail)

    const transporter = nodemailer.createTransport({
      host: 'smtp.tuta.com',
      port: 465,
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })

    await transporter.sendMail({
      from: `"Divel Edu Quiz" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset your Divel Edu Quiz password',
      html: `
        <p>Hi,</p>
        <p>Click the link below to reset the password for your <strong>@${username}</strong> account:</p>
        <p><a href="${resetLink}" style="font-size:16px">Reset my password</a></p>
        <p>This link expires in 1 hour. If you didn't request this, you can safely ignore it.</p>
        <p>— Divel Edu Quiz</p>
      `,
    })
  }

  return { success: true }
})

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

    // 1. Migrate Firebase Auth to synthetic email (fixes legacy users)
    await auth.updateUser(uid, { email: syntheticEmail })
    // 2. Store recovery email in Firestore
    await db.doc(`usernameLookup/${username.toLowerCase()}`).set({ reserved: true, recoveryEmail: trimmed })
  } else {
    // Removing recovery email: migrate to synthetic, clear Firestore field
    await auth.updateUser(uid, { email: syntheticEmail })
    await db.doc(`usernameLookup/${username.toLowerCase()}`).set({ reserved: true })
  }

  return { success: true }
})

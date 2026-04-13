import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  deleteUser,
} from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { auth, functions } from './config'

const SYNTHETIC_DOMAIN = 'mentalmaths.app'

export function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@${SYNTHETIC_DOMAIN}`
}

export async function registerUser(
  username: string,
  password: string,
  displayName: string,
  recoveryEmail?: string,
): Promise<string> {
  // Always use synthetic email for Firebase Auth — recovery email is stored in
  // Firestore only and used solely for sendPasswordResetEmail.
  const authEmail = usernameToEmail(username)
  const credential = await createUserWithEmailAndPassword(auth, authEmail, password)
  await updateProfile(credential.user, { displayName })
  return credential.user.uid
}

export async function loginUser(
  username: string,
  password: string,
  recoveryEmail?: string,
): Promise<string> {
  // Try synthetic email first, then recovery email as fallback
  try {
    const credential = await signInWithEmailAndPassword(auth, usernameToEmail(username), password)
    return credential.user.uid
  } catch {
    if (recoveryEmail) {
      const credential = await signInWithEmailAndPassword(auth, recoveryEmail, password)
      return credential.user.uid
    }
    throw { code: 'auth/invalid-credential' }
  }
}

export async function updateRecoveryEmail(newEmail: string | undefined): Promise<void> {
  const fn = httpsCallable(functions, 'updateRecoveryEmail')
  await fn({ newEmail: newEmail ?? null })
}

export async function logoutUser(): Promise<void> {
  await signOut(auth)
}

export async function resetPasswordByUsername(recoveryEmail: string): Promise<void> {
  await sendPasswordResetEmail(auth, recoveryEmail)
}

export async function changePassword(newPassword: string): Promise<void> {
  const user = auth.currentUser
  if (!user) throw new Error('No authenticated user')
  await updatePassword(user, newPassword)
}

export async function deleteCurrentUser(): Promise<void> {
  const user = auth.currentUser
  if (!user) throw new Error('No authenticated user')
  await deleteUser(user)
}

export function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This username is already taken. Try another one!'
    case 'auth/invalid-credential':
      return 'Incorrect username or password. Please try again.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
} from 'firebase/auth'
import { auth } from './config'

// Firebase Auth requires email, so we use username@mentalmaths.app as fallback
const SYNTHETIC_DOMAIN = 'mentalmaths.app'

function usernameToSyntheticEmail(username: string): string {
  return `${username.toLowerCase()}@${SYNTHETIC_DOMAIN}`
}

export async function registerUser(
  username: string,
  password: string,
  displayName: string,
  realEmail?: string,
): Promise<string> {
  // Use real email for Firebase Auth if provided, otherwise synthetic
  const authEmail = realEmail?.trim() || usernameToSyntheticEmail(username)
  const credential = await createUserWithEmailAndPassword(auth, authEmail, password)
  await updateProfile(credential.user, { displayName })
  return credential.user.uid
}

export async function loginUser(username: string, password: string): Promise<string> {
  // Try synthetic email first (accounts without real email)
  const syntheticEmail = usernameToSyntheticEmail(username)

  try {
    const credential = await signInWithEmailAndPassword(auth, syntheticEmail, password)
    return credential.user.uid
  } catch {
    // If synthetic email fails, the user may have registered with a real email
    // They'll need to use the real email or we look it up from Firestore
    throw { code: 'auth/invalid-credential' }
  }
}

export async function loginWithEmail(email: string, password: string): Promise<string> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user.uid
}

export async function logoutUser(): Promise<void> {
  await signOut(auth)
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

export async function updateAuthEmail(newEmail: string): Promise<void> {
  const user = auth.currentUser
  if (user) {
    await updateEmail(user, newEmail)
  }
}

export function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This username or email is already taken. Try another one!'
    case 'auth/invalid-credential':
      return 'Incorrect username or password. Please try again.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/user-not-found':
      return 'No account found. Please sign up first!'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  fetchSignInMethodsForEmail,
} from 'firebase/auth'
import { auth } from './config'

// Firebase Auth requires email, so we use username@mentalmaths.app as a synthetic email
// If user provides a real email, we store it in Firestore profile for password reset
const SYNTHETIC_DOMAIN = 'mentalmaths.app'

function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@${SYNTHETIC_DOMAIN}`
}

export async function registerUser(
  username: string,
  password: string,
  displayName: string,
): Promise<string> {
  const email = usernameToEmail(username)
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName })
  return credential.user.uid
}

export async function loginUser(username: string, password: string): Promise<string> {
  const email = usernameToEmail(username)

  // Check if user exists first
  const methods = await fetchSignInMethodsForEmail(auth, email)
  if (methods.length === 0) {
    throw { code: 'auth/user-not-found' }
  }

  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user.uid
}

export async function logoutUser(): Promise<void> {
  await signOut(auth)
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
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
    case 'auth/user-not-found':
      return 'No account found with this username. Please sign up first!'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

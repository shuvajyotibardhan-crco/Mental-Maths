import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
} from 'firebase/auth'
import { auth } from './config'

const SYNTHETIC_DOMAIN = 'mentalmaths.app'

function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@${SYNTHETIC_DOMAIN}`
}

export async function registerUser(
  username: string,
  password: string,
  displayName: string,
): Promise<string> {
  const credential = await createUserWithEmailAndPassword(auth, usernameToEmail(username), password)
  await updateProfile(credential.user, { displayName })
  return credential.user.uid
}

export async function loginUser(username: string, password: string): Promise<string> {
  const credential = await signInWithEmailAndPassword(auth, usernameToEmail(username), password)
  return credential.user.uid
}

export async function logoutUser(): Promise<void> {
  await signOut(auth)
}

export async function changePassword(newPassword: string): Promise<void> {
  const user = auth.currentUser
  if (!user) throw new Error('No authenticated user')
  await updatePassword(user, newPassword)
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

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import type { Challenge, ChallengePlayer, ChallengeConfig } from '../types/challenge'
import type { Question } from '../types/question'
import type { SocialStudiesQuestion } from '../types/socialStudies'
import type { WOMWord } from '../types/wordOMeter'
import type { ScienceQuestion } from '../types/science'
import type { UserProfile } from '../types/user'
import { generateGameCode } from '../engine/gameCode'

export async function createChallenge(
  config: ChallengeConfig,
  questions: Question[] | SocialStudiesQuestion[] | WOMWord[] | ScienceQuestion[],
  host: UserProfile,
): Promise<string> {
  // Generate a unique game code (retry on collision)
  let gameCode = generateGameCode()
  let attempts = 0
  while (attempts < 5) {
    const existing = await getDoc(doc(db, 'challenges', gameCode))
    if (!existing.exists()) break
    gameCode = generateGameCode()
    attempts++
  }

  const player: ChallengePlayer = {
    username: host.username,
    name: host.name,
    avatar: host.avatar,
    ready: false,
    score: 0,
    correctAnswers: 0,
    totalAnswered: 0,
    bestStreak: 0,
    finished: false,
    timeTakenSeconds: null,
  }

  const challenge: Challenge = {
    gameCode,
    hostId: host.uid,
    status: 'waiting',
    createdAt: Date.now(),
    startedAt: null,
    finishedAt: null,
    config,
    questions,
    players: { [host.uid]: player },
  }

  await setDoc(doc(db, 'challenges', gameCode), challenge)
  return gameCode
}

export async function joinChallenge(
  gameCode: string,
  profile: UserProfile,
): Promise<Challenge> {
  const snap = await getDoc(doc(db, 'challenges', gameCode.toUpperCase()))
  if (!snap.exists()) {
    throw new Error('Challenge not found. Check the code and try again.')
  }

  const challenge = snap.data() as Challenge

  if (challenge.status === 'finished') {
    throw new Error('This challenge has already ended.')
  }

  if (challenge.players[profile.uid]) {
    // Already joined
    return challenge
  }

  const player: ChallengePlayer = {
    username: profile.username,
    name: profile.name,
    avatar: profile.avatar,
    ready: challenge.status === 'playing', // skip lobby ready-check for late joiners
    score: 0,
    correctAnswers: 0,
    totalAnswered: 0,
    bestStreak: 0,
    finished: false,
    timeTakenSeconds: null,
  }

  await updateDoc(doc(db, 'challenges', gameCode.toUpperCase()), {
    [`players.${profile.uid}`]: player,
  })

  return { ...challenge, players: { ...challenge.players, [profile.uid]: player } }
}

export async function startChallenge(gameCode: string): Promise<void> {
  await updateDoc(doc(db, 'challenges', gameCode), {
    status: 'playing',
    startedAt: Date.now(),
  })
}

export async function updatePlayerProgress(
  gameCode: string,
  uid: string,
  data: Partial<ChallengePlayer>,
): Promise<void> {
  const updates: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    updates[`players.${uid}.${key}`] = value
  }
  await updateDoc(doc(db, 'challenges', gameCode), updates)
}

export async function markPlayerReady(
  gameCode: string,
  uid: string,
): Promise<void> {
  await updateDoc(doc(db, 'challenges', gameCode), {
    [`players.${uid}.ready`]: true,
  })
}

export async function finishChallenge(gameCode: string): Promise<void> {
  await updateDoc(doc(db, 'challenges', gameCode), {
    status: 'finished',
    finishedAt: Date.now(),
  })
}

export function subscribeToChallenge(
  gameCode: string,
  callback: (challenge: Challenge | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, 'challenges', gameCode), (snap) => {
    if (snap.exists()) {
      callback(snap.data() as Challenge)
    } else {
      callback(null)
    }
  })
}

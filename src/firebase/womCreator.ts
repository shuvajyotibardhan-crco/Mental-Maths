import { doc, updateDoc, addDoc, collection, Timestamp } from 'firebase/firestore'
import { db } from './config'
import type { WOMWord } from '../types/wordOMeter'
import type { WOMCreatorGuessState, WOMCreatorState, WOMCreatorSession } from '../types/womCreator'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Called by the host once the challenge status becomes 'playing'. */
export async function initCreatorState(
  gameCode: string,
  playerUids: string[],
): Promise<WOMCreatorState> {
  const roundOrder = shuffle(playerUids)
  const state: WOMCreatorState = {
    roundOrder,
    currentRound: 0,
    rounds: {
      '0': { creatorId: roundOrder[0]!, word: null, letterCount: null, wordObj: null },
    },
    progress: {},
  }
  await updateDoc(doc(db, 'challenges', gameCode), { womCreatorState: state })
  return state
}

/** Creator submits a valid word for the current round. */
export async function submitCreatorWord(
  gameCode: string,
  roundIndex: number,
  wordObj: WOMWord,
): Promise<void> {
  const key = String(roundIndex)
  await updateDoc(doc(db, 'challenges', gameCode), {
    [`womCreatorState.rounds.${key}.word`]: wordObj.word,
    [`womCreatorState.rounds.${key}.letterCount`]: wordObj.letterCount,
    [`womCreatorState.rounds.${key}.wordObj`]: wordObj,
  })
}

/** Guesser writes their current progress for a round. */
export async function updateGuesserProgress(
  gameCode: string,
  roundIndex: number,
  uid: string,
  state: WOMCreatorGuessState,
): Promise<void> {
  const key = String(roundIndex)
  await updateDoc(doc(db, 'challenges', gameCode), {
    [`womCreatorState.progress.${key}.${uid}`]: state,
  })
}

/**
 * Advance to the next round. Also updates ChallengePlayer.score for all
 * players based on the round that just completed.
 */
export async function advanceRound(
  gameCode: string,
  nextRound: number,
  nextCreatorId: string,
  scoreUpdates: Record<string, number>,
): Promise<void> {
  const updates: Record<string, unknown> = {
    'womCreatorState.currentRound': nextRound,
    [`womCreatorState.rounds.${nextRound}`]: {
      creatorId: nextCreatorId,
      word: null,
      letterCount: null,
      wordObj: null,
    },
  }
  for (const [uid, score] of Object.entries(scoreUpdates)) {
    updates[`players.${uid}.score`] = score
    updates[`players.${uid}.lastActiveAt`] = Date.now()
  }
  await updateDoc(doc(db, 'challenges', gameCode), updates)
}

/** Flush final scores and mark each player finished. */
export async function finaliseCreatorGame(
  gameCode: string,
  scoreUpdates: Record<string, number>,
): Promise<void> {
  const updates: Record<string, unknown> = {}
  for (const [uid, score] of Object.entries(scoreUpdates)) {
    updates[`players.${uid}.score`] = score
    updates[`players.${uid}.finished`] = true
    updates[`players.${uid}.lastActiveAt`] = Date.now()
  }
  await updateDoc(doc(db, 'challenges', gameCode), updates)
}

export async function saveWOMCreatorSession(
  session: Omit<WOMCreatorSession, 'id'>,
): Promise<string> {
  const docRef = await addDoc(collection(db, 'sessions'), {
    ...session,
    timestamp: Timestamp.fromMillis(session.timestamp),
    totalQuestions: session.totalRounds,
    correctAnswers: session.roundsWon,
    accuracy: session.totalRounds > 0 ? Math.round((session.roundsWon / session.totalRounds) * 100) : 0,
    bestStreak: 0,
    isHighScore: false,
  })
  return docRef.id
}

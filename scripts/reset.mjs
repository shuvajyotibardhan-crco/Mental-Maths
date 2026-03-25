// One-time reset script — deletes all Auth users and Firestore data
// Usage: node scripts/reset.mjs
//
// Before running:
//   1. Download service account key from Firebase Console → Project Settings → Service Accounts
//   2. Save it as serviceAccount.json in the project root

// Needed for Node v24 + gRPC SSL compatibility
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { readFileSync } from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const serviceAccount = JSON.parse(readFileSync('./serviceAccount.json', 'utf8'))

initializeApp({ credential: cert(serviceAccount) })

const auth = getAuth()
const db = getFirestore()

const COLLECTIONS = ['users', 'usernameLookup', 'sessions', 'highScores', 'globalHighScores']

async function deleteAllAuthUsers() {
  let deleted = 0
  let pageToken

  do {
    const result = await auth.listUsers(1000, pageToken)
    if (result.users.length === 0) break

    await auth.deleteUsers(result.users.map(u => u.uid))
    deleted += result.users.length
    pageToken = result.pageToken
    console.log(`  Deleted ${deleted} auth user(s)...`)
  } while (pageToken)

  console.log(`Auth: deleted ${deleted} user(s) total.`)
}

async function deleteCollection(name) {
  let deleted = 0

  while (true) {
    const snap = await db.collection(name).limit(400).get()
    if (snap.empty) break

    const batch = db.batch()
    snap.docs.forEach(doc => batch.delete(doc.ref))
    await batch.commit()
    deleted += snap.docs.length
    console.log(`  ${name}: deleted ${deleted} doc(s)...`)
  }

  console.log(`  ${name}: done (${deleted} total).`)
}

console.log('\n⚠️  Resetting Mental Maths — all data will be permanently deleted.\n')

console.log('Deleting Firebase Auth users...')
await deleteAllAuthUsers()

console.log('\nDeleting Firestore collections...')
for (const col of COLLECTIONS) {
  await deleteCollection(col)
}

console.log('\n✅ Done. App is clean and ready for fresh accounts.')

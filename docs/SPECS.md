# DIVEL EDU QUIZ — Technical Specifications

## Data Models

### UserProfile
Stored in Firestore collection `users`, document ID = Firebase UID.

```typescript
interface UserProfile {
  uid: string          // Firebase Auth UID
  username: string     // lowercase, unique, ≥ 3 chars
  name: string         // display name
  grade: Grade         // 'KG'|'1'|'2'|...|'12'
  avatar: string       // emoji character
  createdAt: number    // Date.now() timestamp
}
```

### UsernameLookup
Stored in Firestore collection `usernameLookup`, document ID = username (lowercase).
Publicly readable (no auth required) to support unauthenticated password reset.

```typescript
{
  recoveryEmail?: string   // optional email for password reset
}
```

### Question
Generated in memory only — never persisted.

```typescript
interface Question {
  id: string              // Math.random().toString(36)
  displayString: string   // e.g. "25 + 17 = ?"
  correctAnswer: number   // integer result
  operation: OperationType
  difficulty: Difficulty
}
```

### AnsweredQuestion
Extends Question; used in GameState and ResultsScreen.

```typescript
interface AnsweredQuestion extends Question {
  userAnswer: number | null   // null if skipped
  isCorrect: boolean
  responseTimeMs: number      // time from question display to submission
  answeredAt: number          // Date.now() timestamp
}
```

### SessionRecord
Stored in Firestore collection `sessions`. Shared by Mental Maths, Social Studies, and Word-O-Meter sessions.

```typescript
interface SessionRecord {
  id: string               // Firestore auto-generated doc ID
  userId: string           // Firebase Auth UID
  timestamp: number        // Date.now()
  grade: Grade
  subject?: 'mentalMaths' | 'socialStudies' | 'wordOMeter'  // absent = mentalMaths (backward compat)
  operation: OperationType | null  // null for non-Maths sessions
  difficulty: Difficulty | null    // null for non-Maths sessions
  mode: GameMode           // 'fixed' for non-Maths sessions
  totalQuestions: number   // 1 for Word-O-Meter
  correctAnswers: number   // 1 (won) or 0 (lost) for Word-O-Meter
  accuracy: number         // 0–100, max 2 decimal places (e.g. 75.5); 100 (won) or 0 (lost) for WOM
  score: number
  timeTakenSeconds: number
  bestStreak: number       // 0 for Word-O-Meter (not applicable)
  isHighScore: boolean     // always false for non-Maths sessions
  challengeId?: string     // game code if from multiplayer challenge (any subject)
  // Word-O-Meter specific (only present when subject === 'wordOMeter')
  word?: string            // the target word (UPPERCASE)
  won?: boolean            // true if player guessed correctly
  attemptsUsed?: number    // number of guesses made
}
```

### SocialStudiesQuestion
Stored in Firestore collection `socialStudiesQuestions`.

```typescript
interface SocialStudiesQuestion {
  id: string                               // Firestore auto-generated doc ID
  grade: Grade                             // '3'–'12' (KG–2 not supported)
  question: string                         // question text
  options: [string, string, string, string] // four answer choices
  correctIndex: 0 | 1 | 2 | 3             // index of the correct option
  topic: string                            // e.g. 'Colorado History', 'US Civics'
  standard: 'US' | 'Colorado' | 'both'    // curriculum alignment
}
```

### SocialStudiesAnsweredQuestion
In-memory only — used in `useSocialStudiesGame` state and `SocialStudiesResultsScreen`.

```typescript
interface SocialStudiesAnsweredQuestion {
  question: SocialStudiesQuestion
  selectedIndex: number | null  // null if unanswered (edge case)
  isCorrect: boolean
  answeredAt: number            // Date.now()
}
```

### SocialStudiesSession
Shape passed to `saveSocialStudiesSession`; persisted as a `SessionRecord` in Firestore.

```typescript
interface SocialStudiesSession {
  id: string           // assigned by Firestore on write
  userId: string
  timestamp: number
  grade: Grade
  subject: 'socialStudies'
  totalQuestions: number
  correctAnswers: number
  accuracy: number     // 0–100 (e.g. 75.5 = 75.5%), max 2 decimal places
  score: number        // correctAnswers × 5 (max 100)
  timeTakenSeconds: number
  bestStreak: number
  isHighScore: boolean // always false
  challengeId?: string // game code if from multiplayer challenge
}
```

### WOMWord
Defined in `src/data/wordOMeterData.ts` (static bundle — never persisted to Firestore).

```typescript
interface WOMWord {
  word: string           // UPPERCASE target word
  letterCount: number    // 3–8
  grade: Grade           // grade this word is assigned to in the pool
  meanings: string[]     // 1–2 definitions
  partOfSpeech: string[] // e.g. ['noun', 'verb']
  synonyms: string[]     // 1–3 synonyms
  antonyms: string[]     // 0–2 antonyms
  blend?: string         // 7–8 letter words only: notable blend/pattern hint
}
```

### WOMSession
Shape passed to `saveWordOMeterSession`; persisted as a `SessionRecord` in Firestore.

```typescript
interface WOMSession {
  id: string            // assigned by Firestore on write
  userId: string
  timestamp: number
  grade: Grade
  subject: 'wordOMeter'
  word: string          // the target word (UPPERCASE)
  letterCount: number
  won: boolean
  attemptsUsed: number  // 1–N (where N = letterCount)
  maxAttempts: number   // equals letterCount (square grid)
  hintsUsed: number     // count of hints consumed
  score: number         // max(10, 100 − (attemptsUsed−1)×12 − hintsUsed×8) on win; 0 on loss
  timeTakenSeconds: number
  challengeId?: string  // reserved for future multiplayer support
}
```

### Challenge
Stored in Firestore collection `challenges`, document ID = 7-char game code.

```typescript
interface Challenge {
  gameCode: string              // 7-char alphanumeric, doc ID
  hostId: string                // Firebase UID of creator
  status: ChallengeStatus       // 'waiting' | 'playing' | 'finished'
  createdAt: number             // Date.now()
  startedAt: number | null
  finishedAt: number | null
  config: ChallengeConfig
  questions: Question[] | SocialStudiesQuestion[] | WOMWord[]  // type depends on subject; WOM = [WOMWord] (single element)
  players: Record<string, ChallengePlayer>
}
```

### ChallengePlayer
Nested in Challenge.players map, keyed by Firebase UID.

```typescript
interface ChallengePlayer {
  username: string
  name: string
  avatar: string
  ready: boolean              // true once loaded into lobby
  score: number               // updated after each answer
  correctAnswers: number
  totalAnswered: number
  bestStreak: number
  finished: boolean           // true when game complete (natural or End Game)
  timeTakenSeconds: number | null
  lastActiveAt?: number       // ms timestamp of last syncProgress write; used to detect disconnects
}
```

### ChallengeConfig
```typescript
type ChallengeSubject = 'mentalMaths' | 'socialStudies' | 'wordOMeter'

interface ChallengeConfig {
  subject?: ChallengeSubject   // optional for backward compat — absent = 'mentalMaths'
  grade: Grade
  operation?: OperationType | null  // Mental Maths only
  difficulty?: Difficulty | null    // Mental Maths only
  mode: GameMode                    // SS/WOM always uses 'fixed'
  letterCount?: number              // Word-O-Meter only; valid values are grade-restricted (see GRADE_LETTER_OPTIONS)
}
```

For Word-O-Meter challenges: `questions` is `[WOMWord]` (single element). `ChallengePlayer` fields are reused as: `correctAnswers` = won (0/1), `totalAnswered` = attempts used, `bestStreak` = hints used, `timeTakenSeconds` = seconds taken.

WOM challenge score formula: `won ? max(1, round((10000 − secs×10 − (attempts−1)×5 − hints×2) / 100)) : 0` (time-primary; faster solvers always outscore slower ones with same tries/hints)
WOM solo score formula: `won ? max(10, 100 − (attempts−1)×12 − hints×8) : 0` (no time factor)
WOM challenge leaderboard sort: solved players first; among solvers: time asc → tries asc → hints asc; unsolved rank last.

### HighScoreEntry
Stored in Firestore collections `highScores` (personal) and `globalHighScores`.

```typescript
interface HighScoreEntry {
  score: number
  date: number              // Date.now()
  sessionId: string
  timeTakenSeconds?: number // used as tiebreaker in fixed mode and WOM challenges
}
```

### AuditEntry
Stored in Firestore collection `auditLog`, document ID = Firestore auto-generated.

```typescript
type AdminActionType = 'password_reset' | 'merge_users' | 'move_scores'

interface AuditEntry {
  id: string
  timestamp: number                               // Date.now()
  adminUid: string                                // Firebase UID of the admin
  adminUsername: string
  action: AdminActionType
  affectedUsers: Array<{ uid: string; username: string }>
  notes: string                                   // mandatory reason entered by admin
  supportingFileUrl?: string                      // Firebase Storage download URL
  supportingFileName?: string
  outcome: 'success' | 'failed'
  details: string                                 // human-readable action summary or error message
}
```

### HighScoreKey
Composite key used as Firestore document ID.

```typescript
type HighScoreKey = `${Grade}_${OperationType}_${Difficulty}_${GameMode}`
// e.g. "6_multiplication_hard_timed"
```

---

## Storage Schema

### Firestore Collections

| Collection | Doc ID | Contents |
|-----------|--------|----------|
| `users` | Firebase UID | UserProfile fields |
| `usernameLookup` | username (lowercase) | `{ recoveryEmail?: string }` |
| `sessions` | auto | SessionRecord fields (Maths and Social Studies) |
| `highScores` | Firebase UID | Map of HighScoreKey → HighScoreEntry (Maths only) |
| `globalHighScores` | HighScoreKey | HighScoreEntry (Maths only) |
| `challenges` | 7-char game code | Challenge (config, questions, players map) |
| `admins` | Firebase UID | `{ role?, username?, addedAt? }` |
| `auditLog` | auto | AuditEntry fields |
| `socialStudiesQuestions` | auto | SocialStudiesQuestion fields (seeded via script) |

### localStorage

| Key | Type | Purpose |
|-----|------|---------|
| `mm_sound` | `'true'` \| `'false'` | Sound effects preference |
| `mm_seen_questions` | JSON `string[]` | Mental Maths cross-session dedup — `displayString` values of recently seen questions, FIFO capped at 60 |
| `mm_ss_seen_<grade>` | JSON `string[]` | Social Studies cross-session dedup — Firestore document IDs of recently seen questions for that grade, FIFO capped at 80. One key per grade (e.g. `mm_ss_seen_5`, `mm_ss_seen_8`). |
| `mm_wom_seen_<letterCount>` | JSON `string[]` | Word-O-Meter cross-session dedup — UPPERCASE word strings recently used, FIFO capped at 60. One key per letter count (e.g. `mm_wom_seen_3`, `mm_wom_seen_5`). |

### Firebase Storage

| Path | Contents |
|------|----------|
| `audit-support/{tempId}/{filename}` | Supporting documents uploaded during admin actions (images, PDFs, email files). Requires Firebase Storage enabled (Blaze plan). |

---

## Firebase Auth

### Synthetic Email Convention
All accounts are created with a synthetic email: `username@mentalmaths.app`.

When a recovery email is set via Profile or Registration:
1. `verifyBeforeUpdateEmail(user, recoveryEmail)` is called — sends verification to the recovery address.
2. On click, Firebase Auth updates the account's email to `recoveryEmail`.
3. `sendPasswordResetEmail(auth, recoveryEmail)` then reaches the correct account.

### Login Fallback
```
loginUser(username, password, recoveryEmail?):
  1. signInWithEmailAndPassword(auth, username@mentalmaths.app, password)
  2. If fails AND recoveryEmail provided:
     signInWithEmailAndPassword(auth, recoveryEmail, password)
  3. If both fail: throw { code: 'auth/invalid-credential' }
```

---

## Algorithms

### Question Generation
```
generateQuestion(grade, operation, difficulty):
  config = getGradeConfig(grade)            // operand ranges

  if operation == 'mix':
    operation = random choice from getAvailableOperations(grade)

  switch operation:
    'addition':
      a = randInt(config.add.min, config.add.max[difficulty])
      b = randInt(config.add.min, config.add.max[difficulty])
      return { display: "a + b = ?", answer: a + b }

    'subtraction':
      a = randInt(config.add.min, config.add.max[difficulty])
      b = randInt(config.add.min, a)        // ensure non-negative result
      return { display: "a - b = ?", answer: a - b }

    'multiplication':
      a = randInt(1, config.mul.max[difficulty])
      b = randInt(1, config.mul.max[difficulty])
      return { display: "a × b = ?", answer: a * b }

    'division':
      b = randInt(2, config.mul.max[difficulty])
      answer = randInt(1, config.mul.max[difficulty])
      a = b * answer                        // guarantee integer result
      return { display: "a ÷ b = ?", answer: answer }

    'percentage':
      pct = random from PERCENT_CONFIGS[gradeKey].percents
      base = randInt(1, PERCENT_CONFIGS[gradeKey].maxBase[difficulty])
      base = round to nice number
      return { display: "pct% of base = ?", answer: round(base * pct / 100) }

    'squareRoot':
      maxN = SQRT_MAX[gradeKey][difficulty]
      answer = randInt(1, floor(sqrt(maxN)))
      return { display: "√(answer²) = ?", answer: answer }

    'power':
      cfg = POWER_CONFIGS[gradeKey][difficulty]
      base = randInt(cfg.base.min, cfg.base.max)
      exp = randInt(cfg.exp.min, cfg.exp.max)
      return { display: "base^exp = ?", answer: base ** exp }
```

### Within-Session Deduplication (Standard Game)
```
generateUniqueQuestion(grade, operation, difficulty, seen: Set<string>):
  q = generateQuestion(grade, operation, difficulty)
  retries = 0
  while q.displayString in seen and retries < 10:
    q = generateQuestion(grade, operation, difficulty)
    retries++
  return q   // accepted even if duplicate after 10 retries (tiny pool edge case)

// GameContext tracks seen across the full session:
// START  → seen = loadSeenFromStorage() ∪ { firstQuestion.displayString }
// ANSWER → seen = seen ∪ { nextQuestion.displayString }
// SKIP   → seen = seen ∪ { nextQuestion.displayString }
// FINISH → saveSeenToStorage(seen)   // persists to localStorage, capped at 60
// RESET  → seen = {}

// localStorage key: mm_seen_questions  (JSON array of displayString, max 60 entries, FIFO)
```

### Social Studies Cross-Session Deduplication
```
// On session start — fetchSocialStudiesQuestions(grade):
seenIds = loadSeenIdsFromStorage(grade)   // reads mm_ss_seen_<grade> from localStorage
unseen  = all.filter(q => q.id NOT IN seenIds)
pool    = unseen.length >= 20 ? unseen : all   // fall back to full pool when nearly exhausted
return shuffle(pool).slice(0, 20)

// On session finish — useSocialStudiesGame advance(), finished branch:
saveSeenIdsToStorage(grade, answeredQuestions.map(q => q.id))

// saveSeenIdsToStorage(grade, newIds):
existing = JSON.parse(localStorage.getItem('mm_ss_seen_<grade>') ?? '[]')
combined = [...existing, ...newIds]
localStorage.setItem('mm_ss_seen_<grade>', JSON.stringify(combined.slice(-80)))
// FIFO, cap = 80 (matches total pool size per grade)
// Natural reset: once all 80 IDs are in the ring buffer subsequent sessions
// refill the unseen pool as the oldest IDs age out

// localStorage key: mm_ss_seen_<grade>  (JSON string[], max 80 entries, FIFO)
// One key per grade: mm_ss_seen_3 … mm_ss_seen_12
```

### Word-O-Meter Guess Evaluation
```
evaluateGuess(guess: string, target: string) → WOMTile[]:
  result = guess.split('').map(letter → { letter, state: 'absent' })
  counts = frequency map of target letters

  // Pass 1: correct positions
  for i in 0..target.length-1:
    if guess[i] == target[i]:
      result[i].state = 'correct'
      counts[target[i]]--

  // Pass 2: present letters (only for tiles not already 'correct')
  for i in 0..target.length-1:
    if result[i].state == 'correct': continue
    letter = guess[i]
    if counts[letter] > 0:
      result[i].state = 'present'
      counts[letter]--

  return result
// Two-pass order prevents double-counting when a letter appears multiple
// times (e.g. guessing "SPEED" for "SHADE" — first S is correct, second
// S would not be marked present because the target S is exhausted).
```

### Word-O-Meter Score Formula
```
// Solo
calcScore(won, attemptsUsed, hintsUsed):
  if !won: return 0
  return max(10, 100 − (attemptsUsed − 1) × 12 − hintsUsed × 8)
// Examples: win in 1 attempt, 0 hints → 100; win in 3 attempts, 1 hint → 68; loss → 0

// Challenge (time is primary so faster solver always ranks #1)
calcScore(won, attemptsUsed, hintsUsed, timeSecs):
  if !won: return 0
  return max(1, round((10000 − timeSecs × 10 − (attemptsUsed − 1) × 5 − hintsUsed × 2) / 100))
// Max penalty from tries+hints ≈ 36 raw pts → ~4 s of time advantage always wins
```

### Word-O-Meter Word Selection
```
pickWord(grade, letterCount):
  pool = getWordPool(grade, letterCount)   // all words at or below grade for letterCount
  if pool.empty: return null
  seen = loadSeenWordsFromStorage(letterCount)  // Set<string> from localStorage
  unseen = pool.filter(w → !seen.has(w.word))
  candidates = unseen.length > 0 ? unseen : pool  // fall back to full pool if all seen
  return shuffle(candidates)[0]

saveSeenWordToStorage(letterCount, word):
  existing = JSON.parse(localStorage.getItem('mm_wom_seen_<letterCount>') ?? '[]')
  combined = [...existing, word]
  localStorage.setItem('mm_wom_seen_<letterCount>', JSON.stringify(combined.slice(-60)))
// FIFO, cap = 60. Natural reset once all words exhausted.
```

### Score Calculation
```
calculateQuestionScore(question, currentStreak, mode):
  base = { easy: 10, medium: 20, hard: 30 }[question.difficulty]

  streakMultiplier =
    currentStreak >= 10 ? 2.0 :
    currentStreak >= 5  ? 1.5 : 1.0

  speedMultiplier = 1.0
  if mode == 'timed':
    elapsed = Date.now() - questionStartTime
    speedMultiplier =
      elapsed < 3000 ? 2.0 :
      elapsed < 5000 ? 1.5 : 1.0

  return floor(base * streakMultiplier * speedMultiplier)
```

### Star Rating (Results Screen)
```
accuracy >= 80%  → 3 stars
accuracy >= 50%  → 2 stars
else             → 1 star
```

### High Score Check (Personal)
```
checkAndUpdateHighScore(userId, key, score, sessionId, timeTakenSeconds?):
  existing = highScores[userId][key]
  isNew = !existing
        || score > existing.score
        || (score == existing.score
            && mode == 'fixed'
            && timeTakenSeconds < existing.timeTakenSeconds)
  if isNew: write new HighScoreEntry to Firestore
  return isNew
```

### Challenge Lifecycle
```
createChallenge(config, host):
  gameCode = generate 7-char alphanumeric code (exclude 0/O/1/I/L)
  questions = generateQuestionBatch(config.grade, config.operation, config.difficulty, count)
    count = 20 for fixed mode, 60 for timed mode
  write { gameCode, hostId, status:'waiting', config, questions, players:{[host.uid]:...} }
  return gameCode

joinChallenge(gameCode, profile):
  read challenges/{gameCode}
  if not found: throw "not found"
  if status != 'waiting': throw "already started"
  add profile to players map via updateDoc

startChallenge(gameCode):    // host only
  set status='playing', startedAt=Date.now()
  all clients detect via onSnapshot → navigate to game

during game:
  each player steps through questions[0..N] locally
  after each answer: updateDoc players.{uid}.{score,correctAnswers,totalAnswered,bestStreak,lastActiveAt}
  on finish: set players.{uid}.finished=true, timeTakenSeconds, lastActiveAt

finishChallenge(gameCode):   // any client, once local game.finished=true
  check every player: done if p.finished OR p is current player (local state) OR
                      now - p.lastActiveAt > 120 000 ms (disconnect)
  if all done → set status='finished', finishedAt=Date.now()
  re-checked every 10 s while on the waiting screen

waiting screen (WaitingForPlayers component):
  ticks every 1 s; for each opponent shows:
    - "Playing…"          if active (lastActiveAt within 30 s)
    - "No response · auto-proceeding in Xs" if inactive 30–120 s (live countdown)
    - "Finished ✓"        if p.finished=true

results:
  each player saves session with challengeId=gameCode (Maths: SessionRecord + high score checks; SS: SocialStudiesSession, no high score)
  HistoryScreen shows Multiplayer badge for any session with challengeId set
```

### Session Purge
```
purgeOldSessions(userId):
  cutoff = Date.now() - (180 days in ms)
  sessions = query sessions where userId == userId AND timestamp < cutoff
  delete each in batches of 400
```

### Account Deletion
```
deleteAllUserData(uid, username):
  delete all docs in sessions where userId == uid
  delete highScores/{uid}
  delete users/{uid}
  delete usernames/{username}

deleteCurrentUser():
  deleteUser(auth.currentUser)   // Firebase Auth deletion → triggers logout
```
Requires recent login. If `auth/requires-recent-login` is thrown, user is prompted to re-login first.

### Admin: User Search (Prefix)
```
searchUsersByPrefix(prefix):   // min 4 chars
  query users where username >= prefix AND username <= prefix + '\uf8ff', limit 10
  returns UserProfile[]
  single result → auto-selected in UI
  multiple results → picker list shown

// Client-side filtering applied AFTER the Firestore query in AdminScreen:
handleSearchA / handleSearchB (non-superadmin):
  adminUids = Set of all UIDs currently in adminList (loaded on mount)
  results = results.filter(u => !adminUids.has(u.uid))
  // → regular admins never see or interact with other admin / superadmin accounts

handleSearchA / handleSearchB (superadmin):
  no filtering — all matching users returned
```

### Admin: Delete User
```
adminDeleteUser(targetUser, adminProfile, notes):
  deleteAllUserData(targetUser.uid, targetUser.username)   // Firestore
  call adminDeleteUser Cloud Function → auth().deleteUser(targetUid)  // Auth
  saveAuditEntry(outcome)
```

### Admin: Quiz Dashboard
```
getDashboardSessions(filters):
  query sessions where timestamp >= startMs AND timestamp <= endMs
    orderBy timestamp desc, limit 500
  client-side filter: userId, grade, operation, difficulty
  batch getDoc users/{uid} for each unique userId → userMap
  return { sessions, userMap }
```
Date range default: last 60 days. Results capped at 500.

### Admin Roles (Super Admin)

**Firestore schema** — `admins/{uid}`:
```
{
  role: 'super' | 'admin'   // 'super' set manually; absence treated as 'admin'
  username: string           // stored when added via UI
  addedAt: number            // ms timestamp
}
```

**Functions:**
```
checkIsSuperAdmin(uid):  read admins/{uid}, return role === 'super'
getAdminList():          getDocs(admins), map to AdminRecord[]
addAdmin(user):          setDoc admins/{uid} { role:'admin', username, addedAt }
removeAdmin(uid):        deleteDoc admins/{uid}
```

Super admin cannot remove themselves or any other superadmin (no Remove button in UI; server-side guard in `handleRemoveAdmin` blocks it even if called directly).
Neither super admin nor regular admin can delete their own account via the Profile screen — `isAdmin || isSuperAdmin` hides the Delete Account button and confirmation panel.
Super admin cannot delete their own account via the admin panel Delete User action either (button hidden when searched user is the logged-in super admin).
Regular admin count can be zero — super admin alone is valid.

**Admin status session isolation:**
Admin status (`userIsAdmin`, `userIsSuperAdmin`) is checked in a dedicated `useEffect` in `AppShell`, keyed on `profile?.uid`. Both flags are reset to `false` synchronously before the async Firestore check runs. This ensures that if User A (admin) logs out and User B (non-admin) logs in within the same browser tab, the admin tab disappears immediately and is never shown to User B — and vice versa.

**Admin list pre-load:**
`AdminScreen` loads the full `admins` collection on component mount (via a `useEffect(loadAdminList, [])`), not only when the Admins tab is opened. This ensures the admin UID set is always available for filtering user search results, regardless of which tab the user navigates to first.

---

## Grade Configuration

Operand ranges scale approximately 2×–3× per grade group.

| Grade Group | Add max (E/M/H) | Mul max (E/M/H) | Operations |
|-------------|----------------|----------------|------------|
| KG–1 | 10/20/40 | — | Add, Sub |
| 2–3 | 30/60/120 | 5/10/20 | Add, Sub, Mul, Div |
| 4–5 | ~90/~180/~360 | ~15/~30/~60 | + %, √, ^ |
| 6–8 | ~270/~540/~1080 | ~45/~90/~180 | all |
| 9–10 | ~810/~1620/~3240 | ~135/~270/~540 | all |
| 11–12 | ~2430/~4860/~9720 | ~405/~810/~1620 | all |

---

## Configuration

### Environment Variables (`.env`)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```
See `.env.example` for variable names. Real values from Firebase Console → Project Settings → Your apps.

### Game Constants
```
Timed mode duration:  120 seconds
Fixed mode questions: 20
Session purge age:    180 days
Min username length:  3 characters
Min password length:  6 characters
Max input length:     6 characters (excluding minus)
```

### Scoring Constants (Mental Maths)
```
Base points:    easy=10, medium=20, hard=30
Streak bonus:   ≥10 streak → 2.0×, ≥5 → 1.5×, else 1.0×
Speed bonus:    <3s → 2.0×, <5s → 1.5×, else 1.0× (timed mode only)
```

### Social Studies Constants
```
Questions per session:  20 (drawn randomly from up to 80 per grade in Firestore)
Points per correct:     5 (max score = 100)
Answer reveal delay:    1.2 seconds (auto-advance after answer shown)
Eligible grades:        3–12 (KG, 1, 2 blocked)
Curriculum:             US national + Colorado state standards
Question bank size:     800 total (80 per grade, grades 3–12)
```

---

## File Inventory

```
Mental Maths/
├── .env                          # Firebase credentials (git-ignored)
├── .env.example                  # Variable names without values
├── .gitignore
├── firebase.json                 # Hosting config (SPA rewrite)
├── index.html                    # HTML entry; loads src/main.tsx
├── package.json                  # Dependencies & scripts
├── vite.config.ts                # Vite + React + Tailwind plugins
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
│
├── docs/
│   ├── REQUIREMENTS.md
│   ├── DESIGN.md
│   └── SPECS.md
│
├── scripts/
│   ├── reset.mjs                 # Dev utility: wipe all Firebase data
│   └── seedSocialStudies.mjs     # Seeds socialStudiesQuestions collection
│                                 # 800 questions, 80/grade (grades 3–12)
│                                 # Requires serviceAccount.json (git-ignored)
│                                 # Uses preferRest:true to avoid Node v24 gRPC issue
│
└── src/
    ├── main.tsx                  # ReactDOM.createRoot entry
    ├── App.tsx                   # Provider stack (Auth, Settings)
    ├── index.css                 # Tailwind + CSS custom properties + animations
    ├── vite-env.d.ts             # import.meta.env types
    │
    ├── types/
    │   ├── index.ts              # Re-exports all types
    │   ├── question.ts           # OperationType, Difficulty, Grade, GameMode, Question, AnsweredQuestion
    │   ├── session.ts            # SessionRecord, HighScoreEntry, HighScoreKey
    │   ├── user.ts               # UserProfile
    │   ├── challenge.ts          # Challenge, ChallengePlayer, ChallengeConfig, ChallengeStatus
    │   ├── admin.ts              # AuditEntry, AdminActionType
    │   ├── socialStudies.ts      # SocialStudiesQuestion, SocialStudiesAnsweredQuestion, SocialStudiesSession
    │   └── wordOMeter.ts         # WOMWord, WOMSession, WOMTile, WOMTileState, WOMHintType, WOMHintResult
    │
    ├── data/
    │   └── wordOMeterData.ts     # Static word bank; GRADE_LETTER_OPTIONS; getWordPool(grade, letterCount)
    │
    ├── firebase/
    │   ├── config.ts             # Firebase app init; exports app, auth, db, storage
    │   ├── auth.ts               # Auth helpers; synthetic email system
    │   ├── firestore.ts          # All Firestore CRUD (users, sessions, high scores)
    │   ├── challenge.ts          # Challenge CRUD + onSnapshot subscription
    │   ├── admin.ts              # Admin ops: isAdmin check, user search, reset/merge/move, audit log
    │   ├── socialStudies.ts      # fetchSocialStudiesQuestions, saveSocialStudiesSession
    │   └── wordOMeter.ts         # pickWord, saveSeenWordToStorage, saveWordOMeterSession
    │
    ├── context/
    │   ├── AuthContext.tsx       # onAuthStateChanged → profile fetch
    │   ├── GameContext.tsx       # Reducer: idle→playing→finished
    │   └── SettingsContext.tsx   # Sound toggle (localStorage)
    │
    ├── hooks/
    │   ├── useTimer.ts              # countdown/elapsed timer with onComplete
    │   ├── useSound.ts              # Web Audio API sound synthesis (wrong/complete/personalBest/globalBest)
    │   ├── useChallengeListener.ts   # onSnapshot wrapper for challenge doc
    │   ├── useChallengeGame.ts       # Mental Maths multiplayer logic (pre-gen questions + Firestore sync)
    │   ├── useChallengeSSGame.ts     # SS multiplayer logic (MC questions + Firestore sync)
    │   ├── useChallengeWOMGame.ts    # Word-O-Meter multiplayer logic (single shared word + Firestore sync)
    │   ├── useSocialStudiesGame.ts   # SS solo quiz (grade at startGame(), forceFinish, dedup, save)
    │   └── useWordOMeterGame.ts      # WOM solo game (guess eval, hints, score, dedup, save)
    │
    ├── engine/
    │   ├── questionGenerator.ts  # Pure: grade+op+diff → Question, generateQuestionBatch
    │   ├── scoring.ts            # Pure: score, streak multipliers
    │   └── gameCode.ts           # 7-char alphanumeric game code generator
    │
    ├── constants/
    │   └── gradeConfig.ts        # Operand ranges, avatar list, grade options
    │
    ├── utils/
    │   └── emailHash.ts          # maskEmail(), hashEmail()
    │
    └── components/
        ├── ui/
        │   └── GradeSelector.tsx # Shared grade picker (4-column grid); used by all setup screens
        │
        ├── layout/
        │   ├── AppShell.tsx      # Screen router; mounts GameProvider + SocialStudiesShell + WordOMeterShell
        │   ├── Header.tsx        # Brand + user avatar nav
        │   └── BottomNav.tsx     # Home/History/Profile/Settings tabs
        │
        ├── screens/
        │   ├── LoginScreen.tsx         # Login + forgot password flow
        │   ├── RegisterScreen.tsx      # Sign up + optional recovery email
        │   ├── ProfileSetupScreen.tsx  # First-time name/grade/avatar
        │   ├── HomeScreen.tsx          # Dashboard
        │   ├── GameSetupScreen.tsx     # Op/difficulty/mode selector
        │   ├── GameScreen.tsx          # Active game (timer, pad, feedback)
        │   ├── ResultsScreen.tsx       # Score, stars, high scores, review
        │   ├── HistoryScreen.tsx       # Session list with filters
        │   ├── ProfileScreen.tsx       # Edit profile, password, recovery email
        │   ├── SettingsScreen.tsx           # Sound toggle, version
        │   ├── AdminScreen.tsx              # Admin panel: user search, reset/merge/move, audit log
        │   ├── ChallengeCreateScreen.tsx        # Host configures and creates challenge
        │   ├── JoinChallengeScreen.tsx           # Enter 7-digit code to join
        │   ├── ChallengeLobbyScreen.tsx          # Waiting room with player list
        │   ├── ChallengeGameScreen.tsx           # Multiplayer gameplay + live leaderboard
        │   ├── ChallengeResultsScreen.tsx        # Leaderboard + stats + session save
        │   ├── SocialStudiesSetupScreen.tsx      # Grade info + Start Quiz button
        │   ├── SocialStudiesGameScreen.tsx       # MCQ gameplay with reveal + auto-advance
        │   ├── SocialStudiesResultsScreen.tsx    # Score, accuracy, streak, incorrect review
        │   ├── WordOMeterSetupScreen.tsx         # Grade + letter count selector + Start Game
        │   ├── WordOMeterGameScreen.tsx          # Wordle-style tile grid + QWERTY keyboard + hints
        │   └── WordOMeterResultsScreen.tsx       # Word revealed + definition + replay grid + stats
        │
        └── game/
            ├── QuestionCard.tsx  # Question text + correct/wrong feedback
            ├── NumberPad.tsx     # 0–9, minus, backspace, submit
            ├── Timer.tsx         # MM:SS display + progress bar
            └── ScoreBar.tsx      # Score, streak (≥3), question counter
```

---

## Browser Compatibility

| Feature | Minimum Requirement |
|---------|-------------------|
| ES Modules | Chrome 61+, Firefox 60+, Safari 11+ |
| CSS Custom Properties | Chrome 49+, Firefox 31+, Safari 9.1+ |
| `dvh` units | Chrome 108+, Firefox 110+, Safari 15.4+ |
| Firebase SDK v12 | Same as ES Module support |
| localStorage | All modern browsers |
| Web Audio API | Chrome 35+, Firefox 25+, Safari 14.1+ |

Target: evergreen browsers (Chrome, Firefox, Safari, Edge — current versions).

---

## Security Notes

- Firebase credentials are read from `.env` at build time; the `.env` file is git-ignored.
- The `usernameLookup` collection is publicly readable (no auth) to allow the unauthenticated "forgot password" lookup. It contains only the recovery email — no passwords, UIDs, or sensitive data beyond that.
- All other Firestore collections require Firebase Authentication (enforced via Firestore Security Rules).
- Passwords are managed entirely by Firebase Auth; no passwords are stored in Firestore.
- The `scripts/reset.mjs` admin utility requires a `serviceAccount.json` (git-ignored); it must never be committed.
- Global high scores are written from the client without server-side validation — cheating is possible. Accepted trade-off for a private family app at this stage.
- `NODE_TLS_REJECT_UNAUTHORIZED=0` is set only in the dev-only reset script; it is never set in the app itself.

---

## Sound Effects

Sounds are synthesised via the Web Audio API in `src/hooks/useSound.ts`. No audio files are used. All sounds are no-ops when `soundEnabled` is false.

| Sound | Trigger | Tones | Wave | Notes |
|-------|---------|-------|------|-------|
| `wrong` | Wrong answer in GameScreen | 280 Hz → 180 Hz | square | Descending buzz, ~360 ms total |
| `complete` | Results shown, no high score | C5 → E5 → G5 | sine | Ascending chime, ~540 ms total |
| `personalBest` | New personal best on Results | C5 → E5 → G5 → C6 | triangle | 4-note fanfare, ~780 ms total |
| `globalBest` | New global best on Results | C5 → E5 → G5 → C6 → E6 | triangle | 5-note grand fanfare, ~980 ms total |

Priority: if `isNewGlobalBest`, play `globalBest`; else if `isNewPersonalBest`, play `personalBest`; else play `complete`. Only one sound plays per results screen.

---

## Contact Form

### EmailJS Configuration
The contact form uses [EmailJS](https://www.emailjs.com) (client-side email service). Three environment variables are required:

| Variable | Description |
|----------|-------------|
| `VITE_EMAILJS_SERVICE_ID` | EmailJS service ID (e.g. `service_abc123`) |
| `VITE_EMAILJS_TEMPLATE_ID` | EmailJS template ID (e.g. `template_xyz789`) |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS public key from Account → API Keys |

### EmailJS Template Variables
The template must define these variables and set "To Email" to `app_admin@divel.me`:

| Variable | Content |
|----------|---------|
| `{{subject}}` | `[user subject] | DIVEL EDU QUIZ` |
| `{{description}}` | Problem description (≤500 words) |
| `{{contact_email}}` | User's reply-to email |
| `{{from_name}}` | User's display name |
| `{{username}}` | User's app username |

### Password Reset Email Sender
Self-service password reset emails (triggered by users from the login screen) are sent from `app_admin@divel.me`. Configuration:
1. Firebase Console → Authentication → Email Templates → Password reset → Edit
2. "From" set to `app_admin` with custom domain `@divel.me`
3. Custom domain `divel.me` is verified — active in production.

### Admin Password Reset (Cloud Function)
Admin-initiated password resets bypass email entirely. The admin sets a temporary password directly via the `adminSetPassword` Cloud Function:
- **Function:** `functions/index.js` → `adminSetPassword` (Firebase Functions v2, `onCall`)
- **Auth check:** Caller's UID must exist in `admins/{uid}` Firestore collection
- **Operation:** `getAuth().updateUser(targetUid, { password: newPassword })`
- **Validation:** password ≥ 6 characters, `targetUid` must be a non-empty string
- **Deployed to:** Firebase Functions, project `mental-maths-fabc3`

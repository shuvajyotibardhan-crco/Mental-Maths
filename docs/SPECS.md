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
Stored in Firestore collection `sessions`. Shared by Mental Maths, Social Studies, Science, and Word-O-Meter sessions.

```typescript
interface SessionRecord {
  id: string               // Firestore auto-generated doc ID
  userId: string           // Firebase Auth UID
  timestamp: number        // Date.now()
  grade: Grade
  subject?: 'mentalMaths' | 'socialStudies' | 'science' | 'wordOMeter' | 'womCreator'  // absent = mentalMaths (backward compat)
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

### ScienceQuestion
Stored in Firestore collection `scienceQuestions`.

```typescript
interface ScienceQuestion {
  id: string                        // Firestore auto-generated doc ID
  grade: Grade                      // '5'–'12'
  question: string
  options: [string, string, string, string]  // four answer choices (shuffled at fetch time)
  correctIndices: number[]          // sorted indices of correct options (1–4 correct)
  topic: string                     // 'Biology' | 'Chemistry' | 'Physics' | 'Earth Science'
  imageUrl?: string                 // optional Wikimedia Commons image shown above the question
}
```

### ScienceAnsweredQuestion
In-memory only — used in `useScienceGame` state and `ScienceResultsScreen`.

```typescript
interface ScienceAnsweredQuestion {
  question: ScienceQuestion
  selectedIndices: number[]   // indices the player selected
  isCorrect: boolean          // true only if selectedIndices matches correctIndices exactly
  answeredAt: number          // Date.now()
}
```

### ScienceSession
Shape passed to `saveScienceSession`; persisted as a `SessionRecord` in Firestore.

```typescript
interface ScienceSession {
  id: string            // assigned by Firestore on write
  userId: string
  timestamp: number
  grade: Grade          // selected grade for the session
  subject: 'science'
  totalQuestions: number
  correctAnswers: number
  accuracy: number      // 0–100, 2 decimal places
  score: number         // 5 pts × correct answers (max 100)
  timeTakenSeconds: number
  bestStreak: number
  isHighScore: boolean  // always false (no high score tracking for Science)
  challengeId?: string  // game code if from multiplayer challenge
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
  questions: Question[] | SocialStudiesQuestion[] | ScienceQuestion[] | WOMWord[]  // type depends on subject; WOM = [WOMWord] (single element); womCreator = []
  players: Record<string, ChallengePlayer>
  womCreatorState?: WOMCreatorState  // only present when config.subject === 'womCreator'
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
type ChallengeSubject = 'mentalMaths' | 'socialStudies' | 'science' | 'wordOMeter' | 'womCreator'

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

For Word-O-Meter Creator challenges: `questions` is `[]` (empty — words are created in-game, not pre-generated). The `womCreatorState` field on the Challenge document drives the game. `ChallengePlayer.score` reflects the player's running total (guesser scores + creator bonuses).

### WOMCreatorRound
One entry per round; stored inside `WOMCreatorState.rounds` keyed by round index string.

```typescript
interface WOMCreatorRound {
  creatorId: string          // UID of this round's word-creator
  word: string | null        // UPPERCASE; null until creator submits
  letterCount: number | null // null until creator submits
  wordObj: WOMWord | null    // full word object (meanings, hints); null until creator submits
}
```

### WOMCreatorGuessState
Per-player, per-round record of a guesser's progress. Stored in `WOMCreatorState.progress[roundIndex][uid]`.

```typescript
interface WOMCreatorGuessState {
  guesses: string[]          // UPPERCASE guessed words in submission order
  won: boolean               // true if any guess was correct
  passed: boolean            // true if player tapped Pass
  hintsUsed: WOMHintType[]  // hint types consumed this round
  score: number              // guesser score for this round (0 if lost/passed)
  done: boolean              // true when won || passed || guesses.length === letterCount
}
```

### WOMCreatorState
Top-level state for a Creator-mode challenge; stored as `challenge.womCreatorState`.

```typescript
interface WOMCreatorState {
  roundOrder: string[]        // UIDs in creation order; shuffled once at game start
  currentRound: number        // 0-indexed; increments when all guessers for this round are done
  rounds: Record<string, WOMCreatorRound>      // key = round index as string ("0", "1", …)
  progress: Record<string, Record<string, WOMCreatorGuessState>>
  // key = round index string → guesser UID → their guess state
}
```

### WOMCreatorSession
Shape written to `sessions` Firestore collection with `subject: 'womCreator'`.

```typescript
interface WOMCreatorSession {
  id: string              // Firestore auto-generated
  userId: string
  timestamp: number
  grade: Grade
  subject: 'womCreator'
  challengeId: string     // always present (game code)
  totalRounds: number     // N = number of players
  guesserScore: number    // sum of per-round guesser scores
  creatorBonus: number    // creator bonus earned in the player's own creation round
  totalScore: number      // guesserScore + creatorBonus
  roundsWon: number       // rounds where player guessed correctly
  operation: null
  difficulty: null
  mode: 'fixed'
}
```

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
| `scienceQuestions` | auto | ScienceQuestion fields (seeded via script, grade '5'–'12') |

### localStorage

| Key | Type | Purpose |
|-----|------|---------|
| `mm_sound` | `'true'` \| `'false'` | Sound effects preference |
| `mm_seen_questions` | JSON `string[]` | Mental Maths cross-session dedup — `displayString` values of recently seen questions, FIFO capped at 60 |
| `mm_ss_seen_<grade>` | JSON `string[]` | Social Studies cross-session dedup — Firestore document IDs of recently seen questions for that grade, FIFO capped at 80. One key per grade (e.g. `mm_ss_seen_5`, `mm_ss_seen_8`). |
| `mm_sci_seen_<grade>` | JSON `string[]` | Science cross-session dedup — Firestore document IDs of recently seen questions for that grade, FIFO capped at 100 (5 × 20). One key per grade (e.g. `mm_sci_seen_5`, `mm_sci_seen_8`). |
| `mm_wom_seen_<letterCount>` | JSON `string[]` | Word-O-Meter cross-session dedup — UPPERCASE word strings recently used, FIFO capped at 60. One key per letter count (e.g. `mm_wom_seen_3`, `mm_wom_seen_5`). |

### Firebase Storage

| Path | Contents |
|------|----------|
| `audit-support/{tempId}/{filename}` | Supporting documents uploaded during admin actions (images, PDFs, email files). Requires Firebase Storage enabled (Blaze plan). |

---

## Firebase Auth

### Synthetic Email Convention
All accounts are created with a synthetic email: `username@mentalmaths.app`.

When a recovery email is set via Profile, the `updateRecoveryEmail` Cloud Function:
1. Calls `auth.updateUser(uid, { email: recoveryEmail })` — sets Firebase Auth account email to the recovery address immediately.
2. Stores `recoveryEmail` in Firestore `usernameLookup/{username}`.
3. `sendPasswordResetEmail(auth, recoveryEmail)` then reaches the correct account.

When recovery email is removed: Firebase Auth email reverts to `username@mentalmaths.app`.

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
questions = shuffle(pool).slice(0, 20)
// Shuffle each question's options (Fisher-Yates) and update correctIndex to match,
// so the correct answer is never biased toward a fixed position (e.g. always option B).
return questions.map(q => {
  correct = q.options[q.correctIndex]
  shuffled = shuffle([...q.options])
  return { ...q, options: shuffled, correctIndex: shuffled.indexOf(correct) }
})

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

### Science Question Fetch & Cross-Session Deduplication
```
// On session start — fetchScienceQuestions(grade):
pool = ['5', '6', ..., grade]   // cumulative grades from 5 up to selected grade
all  = Firestore.query('scienceQuestions', where grade IN pool, limit 200)
seenIds = loadScienceSeenIds(grade)   // reads mm_sci_seen_<grade> from localStorage
unseen  = all.filter(q => q.id NOT IN seenIds)
selected = unseen.length >= 20 ? unseen : all   // fall back to full pool when nearly exhausted
questions = shuffle(selected).slice(0, 20)
// Shuffle each question's options (Fisher-Yates) and update correctIndices:
return questions.map(q => {
  correctAnswers = q.correctIndices.map(i => q.options[i])
  shuffled = shuffle([...q.options])
  newCorrectIndices = correctAnswers.map(a => shuffled.indexOf(a)).sort()
  return { ...q, options: shuffled, correctIndices: newCorrectIndices }
})

// On session finish — useScienceGame _finishSession():
saveScienceSeenIds(grade, answeredQuestions.map(q => q.question.id))

// saveScienceSeenIds(grade, newIds):
existing = JSON.parse(localStorage.getItem('mm_sci_seen_<grade>') ?? '[]')
combined = [...existing, ...newIds]
localStorage.setItem('mm_sci_seen_<grade>', JSON.stringify(combined.slice(-100)))
// FIFO, cap = 100 (5 sessions × 20 questions)
// One key per grade: mm_sci_seen_5 … mm_sci_seen_12
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

### Word-O-Meter Creator Mode Lifecycle
```
createChallenge (womCreator subject):
  questions = []   // no pre-generated questions; words created in-game
  womCreatorState = null  // initialised at game start
  write challenge doc with status='waiting'

startChallenge (womCreator):
  roundOrder = shuffle(Object.keys(players))  // random creation order
  womCreatorState = {
    roundOrder,
    currentRound: 0,
    rounds: { "0": { creatorId: roundOrder[0], word: null, letterCount: null, wordObj: null } },
    progress: {}
  }
  set status='playing', startedAt=Date.now()
  all clients detect via onSnapshot → navigate to game

each round (creator perspective):
  if uid == womCreatorState.rounds[currentRound].creatorId:
    show WordInputScreen
    user types word (3–8 letters), taps Submit
    validate against SOWPODS wordlist (same async import as solo WOM)
    if invalid: show error "Not a valid English word"
    if valid:
      fetch WOMWord from static pool for this word (or build minimal WOMWord with just the word string)
      updateDoc challenge: womCreatorState.rounds[currentRound] = { ..., word, letterCount, wordObj }
    creator then sees live guesser-status view

each round (guesser perspective):
  listen to challenge via onSnapshot
  if rounds[currentRound].word === null: show "Waiting for [creator] to pick a word…"
  once word is set: show WOM game board for that word
  game board uses standard WOM rules: N attempts for N-letter word, hints allowed
  "Pass" button available at any time (sets done=true, won=false, passed=true, score=0)
  on each guess: validate against SOWPODS, evaluate tiles (same 2-pass algorithm as solo WOM)
  on win: score = max(10, 100 − (attemptsUsed−1)×12 − hintsUsed×8)
  on loss (attempts exhausted) or pass: score = 0
  write to womCreatorState.progress[currentRound][uid] = { guesses, won, passed, hintsUsed, score, done }

round advancement:
  after each guesser write, check if ALL non-creator players have done=true
  if yes:
    creatorBonus = (guessers with won=false) × 10
    add creatorBonus to creators ChallengePlayer.score via updatePlayerProgress
    add each guessers round score to their ChallengePlayer.score
    if currentRound + 1 < roundOrder.length:
      next = currentRound + 1
      updateDoc: womCreatorState.currentRound = next,
                 womCreatorState.rounds[next] = { creatorId: roundOrder[next], word:null, ... }
    else:
      finishChallenge(gameCode)  // all rounds done

disconnect handling (womCreator):
  guesser: if lastActiveAt > 120s stale, mark as done=true, passed=true, score=0
  creator: if lastActiveAt > 120s stale AND word is still null after 60s, host auto-submits a fallback word

results (womCreator):
  each player saves WOMCreatorSession to sessions collection with subject='womCreator'
  results screen shows: final leaderboard (total score), per-round table (word, creator, each player outcome + score)
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

### Word-O-Meter Creator Constants
```
Eligible grades:        KG–12
Word length range:      3–8 letters
Guesser attempts:       N (same as letter count — standard WOM rule)
Guesser hints:          1 for 3–4 letters, 2 for 5–6, 3 for 7–8 (same as solo WOM)
Guesser score (win):    max(10, 100 − (attemptsUsed−1) × 12 − hintsUsed × 8)
Guesser score (loss):   0
Creator bonus:          10 × (number of guessers who did not win)
Disconnect timeout:     120 s (guesser auto-passes; creator auto-skipped by host after 60 s with null word)
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
│   ├── seedSocialStudies.mjs     # Seeds socialStudiesQuestions collection
│   │                             # 800 questions, 80/grade (grades 3–12)
│   │                             # Requires serviceAccount.json (git-ignored)
│   │                             # Uses preferRest:true to avoid Node v24 gRPC issue
│   ├── seed-science-questions.cjs    # Seeds scienceQuestions for Grades 5–6
│   │                                 # Requires serviceAccount.json (git-ignored)
│   │                                 # Uses preferRest:true to avoid Node v24 gRPC issue
│   ├── seed-science-grade7-8.cjs     # Seeds scienceQuestions for Grades 7–8
│   │                                 # Requires serviceAccount.json (git-ignored)
│   │                                 # Uses preferRest:true to avoid Node v24 gRPC issue
│   ├── seed-science-grade9-10.cjs    # Seeds scienceQuestions for Grades 9–10
│   │                                 # 245 questions (initial run); run supplement below to reach 150/grade
│   │                                 # Requires serviceAccount.json (git-ignored)
│   │                                 # Uses preferRest:true to avoid Node v24 gRPC issue
│   ├── seed-science-grade9-10-supplement.cjs  # Tops up Grades 9–10 to 150 each
│   │                                 # 55 questions (20 Gr 9 + 35 Gr 10); brings totals to 38 imageUrl + 38 multi-select per grade
│   │                                 # Run AFTER seed-science-grade9-10.cjs
│   │                                 # Requires serviceAccount.json (git-ignored)
│   ├── seed-science-grade11.cjs      # Seeds scienceQuestions for Grade 11
│   │                                 # 150 questions; 49 imageUrl + 38 multi-select
│   │                                 # Requires serviceAccount.json (git-ignored)
│   │                                 # Uses preferRest:true to avoid Node v24 gRPC issue
│   ├── seed-science-grade12.cjs      # Seeds scienceQuestions for Grade 12
│   │                                 # 150 questions; 76 imageUrl + 64 multi-select
│   │                                 # Requires serviceAccount.json (git-ignored)
│   │                                 # Uses preferRest:true to avoid Node v24 gRPC issue
│   └── generate-wordlists.cjs    # Generates src/data/wordlists/wom-{3..8}.ts from sowpods npm pkg
│                                 # Run: node scripts/generate-wordlists.cjs
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
    │   ├── science.ts            # ScienceQuestion, ScienceAnsweredQuestion, ScienceSession
    │   ├── wordOMeter.ts         # WOMWord, WOMSession, WOMTile, WOMTileState, WOMHintType, WOMHintResult
    │   └── womCreator.ts         # WOMCreatorRound, WOMCreatorGuessState, WOMCreatorState, WOMCreatorSession
    │
    ├── data/
    │   ├── wordOMeterData.ts     # Static word bank; GRADE_LETTER_OPTIONS; getWordPool(grade, letterCount)
    │   └── wordlists/            # SOWPODS word lists for guess validation (auto-generated, do not edit)
    │       ├── wom-3.ts          # 1,292 3-letter words → ReadonlySet<string>
    │       ├── wom-4.ts          # 5,454 4-letter words → ReadonlySet<string>
    │       ├── wom-5.ts          # 12,478 5-letter words → ReadonlySet<string>
    │       ├── wom-6.ts          # 22,157 6-letter words → ReadonlySet<string>
    │       ├── wom-7.ts          # 32,909 7-letter words → ReadonlySet<string>
    │       └── wom-8.ts          # 40,161 8-letter words → ReadonlySet<string>
    │
    ├── firebase/
    │   ├── config.ts             # Firebase app init; exports app, auth, db, storage
    │   ├── auth.ts               # Auth helpers; synthetic email system
    │   ├── firestore.ts          # All Firestore CRUD (users, sessions, high scores)
    │   ├── challenge.ts          # Challenge CRUD + onSnapshot subscription
    │   ├── admin.ts              # Admin ops: isAdmin check, user search, reset/merge/move, audit log
    │   ├── socialStudies.ts      # fetchSocialStudiesQuestions, saveSocialStudiesSession
    │   ├── science.ts            # fetchScienceQuestions (cumulative pool), saveScienceSession, dedup helpers
    │   ├── wordOMeter.ts         # pickWord, saveSeenWordToStorage, saveWordOMeterSession
    │   └── womCreator.ts         # initCreatorState, submitCreatorWord, updateGuesserProgress, advanceRound, saveWOMCreatorSession
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
    │   ├── useChallengeWOMGame.ts      # Word-O-Meter multiplayer logic (single shared word + Firestore sync)
    │   ├── useChallengeScienceGame.ts      # Science multiplayer logic (multi-select MC + Firestore sync)
    │   ├── useChallengeWOMCreatorGame.ts   # WOM Creator multiplayer logic (word input + guessing + round management)
    │   ├── useSocialStudiesGame.ts         # SS solo quiz (grade at startGame(), forceFinish, dedup, save)
    │   ├── useScienceGame.ts           # Science solo quiz (multi-select, cumulative pool, dedup, save)
    │   └── useWordOMeterGame.ts        # WOM solo game (guess eval, hints, score, dedup, save)
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
        │   ├── AppShell.tsx      # Screen router; mounts GameProvider + SocialStudiesShell + ScienceShell + WordOMeterShell
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
        │   ├── ChallengeGameScreen.tsx           # Multiplayer gameplay + live leaderboard; branches on subject (incl. womCreator)
        │   ├── ChallengeResultsScreen.tsx        # Leaderboard + stats + session save; womCreator shows per-round breakdown
        │   ├── SocialStudiesSetupScreen.tsx      # Grade info + Start Quiz button
        │   ├── SocialStudiesGameScreen.tsx       # MCQ gameplay with reveal + auto-advance
        │   ├── SocialStudiesResultsScreen.tsx    # Score, accuracy, streak, incorrect review
        │   ├── ScienceSetupScreen.tsx            # Grade selector (5–12) + cumulative pool info + Start
        │   ├── ScienceGameScreen.tsx             # Multi-select MC gameplay + Check Answer + End Game
        │   ├── ScienceResultsScreen.tsx          # Score, accuracy, streak, incorrect review
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

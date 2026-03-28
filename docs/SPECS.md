# Mental Maths — Technical Specifications

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
  recoveryEmail?: string   // optional adult email for password reset
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
Stored in Firestore collection `sessions`.

```typescript
interface SessionRecord {
  id: string               // Firestore auto-generated doc ID
  userId: string           // Firebase Auth UID
  timestamp: number        // Date.now()
  grade: Grade
  operation: OperationType
  difficulty: Difficulty
  mode: GameMode           // 'timed' | 'fixed'
  totalQuestions: number   // questions attempted
  correctAnswers: number
  accuracy: number         // (correctAnswers / totalQuestions) * 100
  score: number            // calculated by scoring engine
  timeTakenSeconds: number
  bestStreak: number
  isHighScore: boolean     // true if personal best at time of save
}
```

### HighScoreEntry
Stored in Firestore collections `highScores` (personal) and `globalHighScores`.

```typescript
interface HighScoreEntry {
  score: number
  date: number              // Date.now()
  sessionId: string
  timeTakenSeconds?: number // used as tiebreaker in fixed mode
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
| `sessions` | auto | SessionRecord fields |
| `highScores` | Firebase UID | Map of HighScoreKey → HighScoreEntry |
| `globalHighScores` | HighScoreKey | HighScoreEntry |

### localStorage

| Key | Type | Purpose |
|-----|------|---------|
| `mm_sound` | `'true'` \| `'false'` | Sound effects preference |

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

### Session Purge
```
purgeOldSessions(userId):
  cutoff = Date.now() - (180 days in ms)
  sessions = query sessions where userId == userId AND timestamp < cutoff
  delete each in batches of 400
```

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

### Scoring Constants
```
Base points:    easy=10, medium=20, hard=30
Streak bonus:   ≥10 streak → 2.0×, ≥5 → 1.5×, else 1.0×
Speed bonus:    <3s → 2.0×, <5s → 1.5×, else 1.0× (timed mode only)
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
│   └── reset.mjs                 # Dev utility: wipe all Firebase data
│                                 # Requires serviceAccount.json (git-ignored)
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
    │   └── user.ts               # UserProfile
    │
    ├── firebase/
    │   ├── config.ts             # Firebase app init; exports app, auth, db
    │   ├── auth.ts               # Auth helpers; synthetic email system
    │   └── firestore.ts          # All Firestore CRUD
    │
    ├── context/
    │   ├── AuthContext.tsx       # onAuthStateChanged → profile fetch
    │   ├── GameContext.tsx       # Reducer: idle→playing→finished
    │   └── SettingsContext.tsx   # Sound toggle (localStorage)
    │
    ├── hooks/
    │   └── useTimer.ts           # countdown/elapsed timer with onComplete
    │
    ├── engine/
    │   ├── questionGenerator.ts  # Pure: grade+op+diff → Question
    │   └── scoring.ts            # Pure: score, streak multipliers
    │
    ├── constants/
    │   └── gradeConfig.ts        # Operand ranges, avatar list, grade options
    │
    ├── utils/
    │   └── emailHash.ts          # maskEmail(), hashEmail()
    │
    └── components/
        ├── layout/
        │   ├── AppShell.tsx      # Screen router; mounts GameProvider
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
        │   └── SettingsScreen.tsx      # Sound toggle, version
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

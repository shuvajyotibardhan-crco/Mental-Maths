# Mental Maths — Design

## High-Level Overview
Mental Maths is a single-page React application built with TypeScript and Tailwind CSS v4, backed by Firebase Authentication and Firestore. The app targets students from KG to Grade 12 and generates arithmetic questions appropriate to each grade level across eight operation types. State is managed through React Context (auth, game, settings), routing is handled by a single AppShell component (no external router), and all game logic lives in pure engine modules decoupled from the UI. The design philosophy prioritises simplicity and child-friendly UX over feature breadth.

---

## Architecture Diagram

```
Browser
  │
  ├── main.tsx → App.tsx (Provider stack)
  │     ├── AuthProvider        (Firebase auth state + user profile)
  │     ├── SettingsProvider    (sound toggle, localStorage)
  │     └── AppShell            (screen router + GameProvider)
  │           ├── Header / BottomNav
  │           └── <ActiveScreen>
  │
  ├── Screens (src/components/screens/)
  │     LoginScreen ──────────────────────────────────────┐
  │     RegisterScreen ────────────────────────────────── │
  │     ProfileSetupScreen ─────────────────────────────  │
  │     HomeScreen                                        │
  │     GameSetupScreen                                   │ Firebase
  │     GameScreen ──→ useTimer, QuestionCard,            │ Auth
  │                    NumberPad, ScoreBar, Timer          │
  │     ResultsScreen                                     │
  │     HistoryScreen ──────────────────────────────────  │
  │     ProfileScreen ──────────────────────────────────  │
  │     SettingsScreen                                    │
  │     ChallengeCreateScreen ───────────────────────── │
  │     JoinChallengeScreen ─────────────────────────── │
  │     ChallengeLobbyScreen ────── onSnapshot listener │
  │     ChallengeGameScreen ──→ useChallengeGame,       │
  │                               QuestionCard, etc.    │
  │     ChallengeResultsScreen                          │
  │                                                       │
  ├── Engine (src/engine/)                                │
  │     questionGenerator.ts   (pure function)            ▼
  │     scoring.ts             (pure function)       Firestore
  │     gameCode.ts            (code generator)         │
  │                                                       │
  ├── Firebase (src/firebase/)                            │
  │     config.ts ────────────────────────────────────── │
  │     auth.ts   ──────────────────────────────── Auth  │
  │     firestore.ts ──────────────────────── Firestore  │
  │     challenge.ts ─────────────────────── Firestore  │
  │                                                       │
  └── Context (src/context/)                             │
        AuthContext.tsx ────── reads profile ────────────┘
        GameContext.tsx ────── reducer-based game state
        SettingsContext.tsx ── localStorage
```

---

## Module Design

### `src/firebase/config.ts`
Initialises the Firebase app from `.env` variables and exports `app`, `auth`, and `db`. All Firebase SDK access flows through these exports — nothing else imports from the Firebase SDK directly.

### `src/firebase/auth.ts`
All Firebase Authentication logic. Uses a **synthetic email system**: since Firebase Auth requires an email, usernames are mapped to `username@mentalmaths.app`. When a recovery email is registered, it is stored separately and used as the Firebase Auth email instead (allowing native password reset). Login tries the synthetic email first and falls back to the recovery email. Key functions: `registerUser`, `loginUser`, `logoutUser`, `changePassword`, `setRecoveryEmailOnAuth`, `resetPasswordByUsername`.

### `src/firebase/firestore.ts`
All Firestore read/write operations grouped by domain: user profiles, username lookup (for uniqueness + password reset routing), game sessions, and high scores. The `usernameLookup` collection stores the recovery email alongside the username and is publicly readable to support the "forgot password" flow (unauthenticated lookup).

### `src/context/AuthContext.tsx`
Subscribes to `onAuthStateChanged` and fetches the Firestore `UserProfile` when a user is signed in. Exposes `user`, `profile`, `loading`, and `setProfile` (for in-place profile updates without a Firestore re-fetch). `setLoading(true)` is called at the top of the callback — before the async profile fetch — so the loading spinner is shown during re-login, preventing a flash of ProfileSetupScreen for existing users.

### `src/context/GameContext.tsx`
Reducer-based state machine for a game session. States: `idle → playing → finished`. Handles question generation (calls engine), answer submission, scoring, streak tracking, and response timing. Provides `startGame`, `submitAnswer`, `skipQuestion`, `finishGame`, `resetGame` actions.

### `src/context/SettingsContext.tsx`
Single setting (sound toggle) persisted to `localStorage` under the key `mm_sound`.

### `src/hooks/useTimer.ts`
Reusable timer supporting both countdown (timed mode) and elapsed (fixed mode) directions. Returns formatted display string, raw seconds, progress ratio, and start/stop/reset controls. Calls `onComplete` when countdown reaches zero.

### `src/firebase/challenge.ts`
All Firestore operations for the multiplayer challenge system. Functions: `createChallenge`, `joinChallenge`, `startChallenge`, `updatePlayerProgress`, `markPlayerReady`, `finishChallenge`, `subscribeToChallenge` (onSnapshot wrapper). Uses a single `challenges/{gameCode}` collection where the game code serves as the document ID.

### `src/engine/questionGenerator.ts`
Pure function — no side effects, no imports. Generates a `Question` given grade, operation, and difficulty. Also exports `generateQuestionBatch()` for pre-generating sets of questions (used by multiplayer challenges). Operand ranges are defined per grade group in `gradeConfig.ts` and scale at approximately 2×–3× per group. Special cases handled: division always produces integer results, square root uses only perfect squares, percentage uses meaningful base/percent combinations.

### `src/engine/scoring.ts`
Pure functions. `calculateQuestionScore` applies base points (10/20/30 by difficulty), a streak multiplier (1×/1.5×/2×), and a speed multiplier (1×/1.5×/2× in timed mode only). `calculateSessionScore` sums across all correctly answered questions.

### `src/engine/gameCode.ts`
Generates 7-character alphanumeric game codes for multiplayer challenges. Uses a restricted alphabet (excludes ambiguous characters like 0/O, 1/I/L).

### `src/hooks/useSound.ts`
Provides a `play(sound: SoundType)` function that synthesises audio using the Web Audio API — no audio files required. Four named sounds: `wrong` (descending square-wave buzz), `complete` (ascending sine chime), `personalBest` (4-note triangle fanfare), `globalBest` (5-note grand fanfare). All sounds are no-ops when `soundEnabled` is false in SettingsContext. Each call creates and immediately closes its own `AudioContext` to avoid browser auto-suspension.

### `src/hooks/useChallengeListener.ts`
Wraps Firestore `onSnapshot` for a challenge document. Returns the live `Challenge` state and a loading flag. Used by lobby, game, and results screens.

### `src/hooks/useChallengeGame.ts`
Game logic hook for multiplayer. Steps through pre-generated questions from the challenge document, tracks score/streak locally, and writes progress to Firestore after each answer. Mirrors the solo GameContext reducer pattern but decoupled from it.

### `src/components/layout/AppShell.tsx`
Single source of routing truth. Uses a `currentScreen` state variable and a `navigate(screen)` function passed as props to each screen. Also wraps `GameProvider` (kept here so the game state is destroyed when leaving the game flow) and calls `purgeOldSessions` on mount. Manages `challengeCode` state for multiplayer flows. On profile load, calls `checkIsAdmin` and stores the result in `userIsAdmin` state — passed to `BottomNav` (to show/hide the admin tab) and used to guard the `admin` screen route.

### `src/firebase/admin.ts`
All admin-specific Firestore operations. Functions: `checkIsAdmin` (reads `admins/{uid}`), `getUserByUsername` (query by username field), `uploadSupportingFile` (Firebase Storage), `getAuditLog` (ordered query), `adminResetPassword`, `adminMergeUsers`, `adminMoveScores`. Every operation writes an `auditLog` entry regardless of outcome. Batch writes (400 ops/batch) handle large session transfers safely. `adminResetPassword` calls the `adminSetPassword` Cloud Function (Firebase Admin SDK) to set the password directly — no recovery email required.

### `functions/index.js`
Firebase Cloud Functions (Node 22, v2). Exports `adminSetPassword`: an `onCall` function that verifies the caller is an admin (`admins/{uid}`), then calls `auth().updateUser()` to set the target user's password directly. Returns `{ success: true }` or throws `HttpsError`. Deployed separately via `firebase-tools` in CI.

### `src/components/screens/AdminScreen.tsx`
Admin-only panel with two tabs: **Users** (search → action → confirm) and **Audit Log** (last 50 entries). User tab has a primary search (User A), three action buttons (Reset Password / Merge / Move), and an action panel with a secondary user search (for merge/move), mandatory notes field, and confirm button. Each action result is shown inline. Audit Log renders `AuditCard` components with outcome badge, affected users, details, and notes. Only rendered in AppShell when `userIsAdmin` is true. Supporting document upload is deferred (requires Firebase Storage / Blaze plan).

### `src/components/screens/ContactScreen.tsx`
Contact support form. Collects subject, description (≤500 words with live counter), and contact email. On submission, sends all fields to EmailJS, which delivers the email to `app_admin@divel.me`. Displays a confirmation screen on success and an inline error with fallback admin email on failure. File attachments are not supported (Firebase Storage requires the Blaze plan).

### `src/components/screens/*`
One file per screen. Each receives `onNavigate` and accesses shared state via context hooks. No screen imports from another screen.

### `src/components/game/*`
Presentational game UI components. `QuestionCard` handles animation states (bounce-in, shake). `NumberPad` manages local input state. `Timer` computes the visual progress bar and red-pulse threshold. `ScoreBar` is a pure display component.

---

## Design Considerations

**Why no external router?**
The app has a linear, predictable flow with no deep linking or browser back-button requirements. A simple `currentScreen` state in `AppShell` is sufficient and eliminates a dependency. Adding React Router would add complexity without benefit at this scale.

**Why synthetic emails?**
Firebase Authentication requires an email address. Rather than making email mandatory (which excludes young users who may not have one), a synthetic email (`username@mentalmaths.app`) is generated internally. Users never see it. A real recovery email can be optionally added for password reset — this is stored separately in `usernameLookup` and set as the Firebase Auth email via `verifyBeforeUpdateEmail`.

**Why usernameLookup is a separate collection?**
Username uniqueness must be checked before a Firebase Auth account is created. A dedicated `usernameLookup` collection with the username as the document ID allows an atomic existence check without querying the `users` collection (which requires auth). It also stores the recovery email for unauthenticated password-reset lookups.

**Why reducer for game state?**
Game state has many interdependent fields (score, streak, current question, status) that transition together. A reducer makes the transitions explicit, testable, and free from async race conditions that `useState` with multiple fields would introduce.

**Why Tailwind CSS v4?**
Tailwind v4 integrates with Vite as a native plugin (no PostCSS config), uses CSS custom properties for theming, and produces smaller bundles. The child-friendly colour palette and rounded components are expressed directly in className strings, keeping styling co-located with markup.

**Why a separate game hook for multiplayer instead of extending GameContext?**
The existing GameContext generates questions lazily and has no Firestore integration. Multiplayer needs pre-generated questions (for fairness), real-time Firestore writes (for live leaderboards), and multi-player awareness. A separate `useChallengeGame` hook keeps the solo path simple and avoids conditional complexity in the reducer.

**Why a single Firestore document per challenge?**
For a kids' math app with 2–8 players, all data (config, 20–60 questions, player progress) fits comfortably in one document (~10–50 KB, well under the 1 MB limit). A single document simplifies real-time sync (one `onSnapshot` listener covers everything) and avoids subcollection query complexity.

**Why EmailJS for the contact form?**
The contact form needs to send emails from the browser without a backend. EmailJS is a client-side email SDK that works with any SMTP provider via a configured service/template. It requires no server deployment and the free tier is sufficient for a low-volume support form. The trade-off is that the public key is exposed in the bundle, but EmailJS public keys are intended to be client-visible (rate limiting and domain allowlisting are the security controls on the EmailJS side). File attachments were considered but dropped — Firebase Storage (needed to host uploaded files) requires the Blaze plan.

**Why Firestore `admins` collection for admin access instead of Firebase custom claims?**
Custom claims require a Cloud Function (or Firebase Admin SDK server-side call) to set. A `admins/{uid}` Firestore collection achieves the same result with no backend: the project owner adds UIDs manually in the Firebase Console, and the app checks the collection on login. The trade-off is that a malicious user could read the collection (but not write to it) — acceptable since knowing which UIDs are admins carries no exploitable privilege.

**Why Web Audio API for sounds instead of audio files?**
Audio files require hosting, fetching, and cache management, and add to the bundle. The Web Audio API can synthesise simple tones (oscillators + gain envelopes) entirely in JavaScript with no assets. For a kids' math app needing four short sound cues, this is simpler, faster, and dependency-free. The trade-off is that sounds are synthetic rather than recorded, but this is appropriate for the use case.

**Why no state management library (Redux/Zustand)?**
Three contexts (auth, game, settings) cover all shared state. The game context uses a reducer pattern where needed. A third-party library would add overhead without benefit at this scale.

**Why session purging on startup?**
Firestore bills per document read. Purging sessions older than 6 months on app startup keeps the history collection lean and costs predictable.

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| UI Framework | React 19 | Industry standard, concurrent features |
| Language | TypeScript | Type safety across engine, data, and UI |
| Styling | Tailwind CSS v4 | Utility-first, Vite-native plugin, small output |
| Build | Vite 8 | Fast HMR, ESM-first, minimal config |
| Auth | Firebase Authentication | Email/password, password reset, session management |
| Database | Cloud Firestore | Real-time, offline-capable, serverless |
| Hosting | Firebase Hosting | CDN, SPA rewrites, free tier |
| Admin | firebase-admin (dev) | One-time data reset script only |
| Email (contact form) | EmailJS (`@emailjs/browser`) | Client-side email delivery, no backend required |

---

## Deployment

1. Run `npm run build` — TypeScript compile + Vite bundle → `dist/`
2. Run `~/.nvm/versions/node/v22.20.0/bin/firebase deploy --only hosting`
3. Firebase Hosting serves `dist/` at `https://mental-maths-fabc3.web.app`
4. All routes rewrite to `index.html` (SPA mode)
5. `.env` is never committed — must be present locally for build

Firebase project: `mental-maths-fabc3`
GitHub repo: https://github.com/shuvajyotibardhan-crco/Mental-Maths

---

## Constraints & Known Limitations

| Constraint | Detail |
|-----------|--------|
| Password reset sender | Emails are sent from `app_admin@divel.me` (custom domain verified in Firebase). |
| Firebase Storage (admin) | Supporting document upload in admin panel is deferred — requires Firebase Storage (Blaze plan). Backend function `uploadSupportingFile` is implemented but not exposed in the UI yet. |
| Password reset requires recovery email | Users who did not set a recovery email cannot self-serve reset. They must contact the app admin. |
| `verifyBeforeUpdateEmail` delay | When a recovery email is updated via Profile, it is not active until the user clicks the verification link in their inbox. |
| Single bundle | The JS bundle is ~630 KB (186 KB gzipped). Code splitting is not implemented; acceptable for current scale. |
| No offline support | Firestore offline persistence is not enabled. App requires an active internet connection. |
| Sessions capped at 6 months | Older sessions are auto-purged on startup. Long-term historical analysis is not supported. |
| Global high scores unverified | High scores are written from the client. There is no server-side validation against cheating. |

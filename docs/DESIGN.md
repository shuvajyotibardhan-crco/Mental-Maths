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
  │                                                       │
  ├── Engine (src/engine/)                                │
  │     questionGenerator.ts   (pure function)            ▼
  │     scoring.ts             (pure function)       Firestore
  │                                                       │
  ├── Firebase (src/firebase/)                            │
  │     config.ts ────────────────────────────────────── │
  │     auth.ts   ──────────────────────────────── Auth  │
  │     firestore.ts ──────────────────────── Firestore  │
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
Subscribes to `onAuthStateChanged` and fetches the Firestore `UserProfile` when a user is signed in. Exposes `user`, `profile`, `loading`, and `setProfile` (for in-place profile updates without a Firestore re-fetch).

### `src/context/GameContext.tsx`
Reducer-based state machine for a game session. States: `idle → playing → finished`. Handles question generation (calls engine), answer submission, scoring, streak tracking, and response timing. Provides `startGame`, `submitAnswer`, `skipQuestion`, `finishGame`, `resetGame` actions.

### `src/context/SettingsContext.tsx`
Single setting (sound toggle) persisted to `localStorage` under the key `mm_sound`.

### `src/hooks/useTimer.ts`
Reusable timer supporting both countdown (timed mode) and elapsed (fixed mode) directions. Returns formatted display string, raw seconds, progress ratio, and start/stop/reset controls. Calls `onComplete` when countdown reaches zero.

### `src/engine/questionGenerator.ts`
Pure function — no side effects, no imports. Generates a `Question` given grade, operation, and difficulty. Operand ranges are defined per grade group in `gradeConfig.ts` and scale at approximately 2×–3× per group. Special cases handled: division always produces integer results, square root uses only perfect squares, percentage uses meaningful base/percent combinations.

### `src/engine/scoring.ts`
Pure functions. `calculateQuestionScore` applies base points (10/20/30 by difficulty), a streak multiplier (1×/1.5×/2×), and a speed multiplier (1×/1.5×/2× in timed mode only). `calculateSessionScore` sums across all correctly answered questions.

### `src/components/layout/AppShell.tsx`
Single source of routing truth. Uses a `currentScreen` state variable and a `navigate(screen)` function passed as props to each screen. Also wraps `GameProvider` (kept here so the game state is destroyed when leaving the game flow) and calls `purgeOldSessions` on mount.

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
| Child Google accounts | Firebase password reset emails are blocked by Google Family Link. Recovery email must be an adult Gmail account. A Cloud Function–based solution is deferred to the native app. |
| Password reset requires recovery email | Users who did not set a recovery email cannot self-serve reset. They must contact the app admin. |
| `verifyBeforeUpdateEmail` delay | When a recovery email is updated via Profile, it is not active until the user clicks the verification link in their inbox. |
| Single bundle | The JS bundle is ~595 KB (177 KB gzipped). Code splitting is not implemented; acceptable for current scale. |
| No offline support | Firestore offline persistence is not enabled. App requires an active internet connection. |
| Sessions capped at 6 months | Older sessions are auto-purged on startup. Long-term historical analysis is not supported. |
| Global high scores unverified | High scores are written from the client. There is no server-side validation against cheating. |

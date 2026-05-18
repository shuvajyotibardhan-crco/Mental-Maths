# DIVEL EDU QUIZ — Design

## High-Level Overview
DIVEL EDU QUIZ is a single-page React application built with TypeScript and Tailwind CSS v4, backed by Firebase Authentication and Firestore. The app targets students from KG to Grade 12 and supports four subjects: **Mental Maths** (dynamically generated arithmetic questions across eight operation types), **Social Studies** (multiple-choice quizzes seeded into Firestore from the US and Colorado curriculum for Grades 3–12), **Science** (multiple-select quizzes covering Biology, Chemistry, Physics, and Earth Science for Grades 5–12, seeded into Firestore), and **Word-O-Meter** (Wordle-style vocabulary game using a bundled static word bank across all grades). All four subjects support multiplayer challenge mode; Word-O-Meter additionally supports a **Creator Mode** challenge variant where players take turns submitting words for the others to guess. State is managed through React Context (auth, game, settings), routing is handled by a single AppShell component (no external router), and all game logic lives in pure modules decoupled from the UI. The design philosophy prioritises simplicity and child-friendly UX over feature breadth.

---

## Architecture Diagram

![Architecture Diagram](architecture.drawio)

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
Reducer-based state machine for a game session. States: `idle → playing → finished`. Handles question generation (calls engine), answer submission, scoring, streak tracking, and response timing. Provides `startGame`, `submitAnswer`, `skipQuestion`, `finishGame`, `resetGame` actions. Maintains a `seenQuestions` Set across the session to prevent repeated questions; each new question is generated via `generateUniqueQuestion()` which retries up to 10 times on collision. On start, the set is seeded from `localStorage` (`mm_seen_questions`, last 60 entries); on finish, the session's seen questions are merged back and saved, capped at 60, providing cross-session deduplication.

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
Mental Maths multiplayer game hook. Steps through pre-generated `Question[]` from the challenge document, tracks score/streak locally, and writes progress to Firestore after each answer. Mirrors the solo GameContext reducer pattern but decoupled from it.

### `src/components/ui/GradeSelector.tsx`
Shared grade picker component used by all setup screens (Mental Maths, Social Studies, Challenge Create). Renders a 4-column button grid from `GRADE_OPTIONS`. Accepts `allowedGrades` to restrict to subject-valid grades (e.g. 3–12 for SS) and `selectedClass` for per-subject accent colours.

### `src/components/layout/AppShell.tsx`
Single source of routing truth. Uses a `currentScreen` state variable and a `navigate(screen)` function passed as props to each screen. Also wraps `GameProvider` (kept here so the game state is destroyed when leaving the game flow) and calls `purgeOldSessions` on mount. Manages `challengeCode` state for multiplayer flows. Admin status is checked in a **dedicated `useEffect` keyed on `profile?.uid`**: `userIsAdmin` and `userIsSuperAdmin` are reset to `false` synchronously before each async Firestore check, so switching users (log out → log in as someone else in the same browser session) never carries stale admin state forward. The `purgeOldSessions` call remains in a separate effect guarded by a `purgedRef` so it only fires once per app mount. The `contact` screen is accessible without login (rendered before the auth guard). Social Studies screens (`ss-setup`, `ss-game`, `ss-results`) are handled by an inner `SocialStudiesShell` component that: (a) manages the `selectedGrade` state (per-quiz, not profile-locked), (b) owns a single `useSocialStudiesGame` instance keeping SS state separate from the Maths `GameContext`, (c) wires `forceFinish` to the "End Game" button.

### `src/hooks/useSocialStudiesGame.ts`
Custom hook encapsulating all Social Studies solo game logic. Grade is passed to `startGame(grade)` at start time (per-quiz) rather than at construction. Manages a two-phase answer flow (select → reveal), tracks score/streak, and on finish calls `saveSeenIdsToStorage` + `saveSocialStudiesSession`. Also exposes `forceFinish()` which ends a session early (saving partial results if ≥1 question answered) to support the End Game button. Auto-advance timing is handled in `SocialStudiesGameScreen` via a `useEffect` (1.2 s), keeping timing in the UI layer.

### `src/hooks/useChallengeSSGame.ts`
Multiplayer Social Studies game hook. Mirrors `useChallengeGame` but for multiple-choice questions. Takes `gameCode`, `uid`, and `questions: SocialStudiesQuestion[]`. On each answer, debounces a `updatePlayerProgress` Firestore write (100 ms). Exposes `selectAnswer`, `advance`, and `forceFinish`. Scoring: 5 points per correct answer (max 100).

### `src/hooks/useChallengeWOMGame.ts`
Multiplayer Word-O-Meter game hook. Takes `gameCode`, `uid`, and the pre-determined `WOMWord` from the challenge doc. Runs the same Wordle evaluation logic as the solo hook — including local SOWPODS word list validation via dynamic import — but syncs progress to Firestore via `updatePlayerProgress`. `ChallengePlayer` fields are reused: `correctAnswers` = won (0/1), `totalAnswered` = attempts used, `bestStreak` = hints used. Challenge score formula: `max(10, 100 − (attempts−1)×12 − hints×8)` if won; 0 if lost (same formula as WOM solo for consistency). Exposes `typeLetter`, `deleteLetter`, `submitGuess`, `useHint`, `forceFinish`.

### `src/firebase/socialStudies.ts`
Four exports: `fetchSocialStudiesQuestions(grade)` — queries the `socialStudiesQuestions` Firestore collection filtered by grade (limit 80), loads previously seen question IDs from localStorage (`mm_ss_seen_<grade>`), filters to unseen questions, falls back to the full pool if fewer than 20 unseen remain, shuffles and returns 20 questions with each question's options independently shuffled (Fisher-Yates) and `correctIndex` updated to match — this prevents the correct answer from being biased toward the position it was authored in Firestore; `saveSocialStudiesSession(session)` — writes to the shared `sessions` collection with `subject: 'socialStudies'` and null values for Maths-only fields; `loadSeenIdsFromStorage(grade)` / `saveSeenIdsToStorage(grade, ids)` — FIFO localStorage helpers capped at 80 entries (one per grade) implementing cross-session deduplication.

### `src/firebase/wordOMeter.ts`
Four exports: `pickWord(grade, letterCount)` — calls `getWordPool` (from `wordOMeterData.ts`) to get words for the grade/letter-count combination, loads previously seen words from localStorage (`mm_wom_seen_<letterCount>`), filters to unseen words, falls back to full pool if all have been seen, and returns one shuffled pick; `saveSeenWordToStorage(letterCount, word)` — FIFO localStorage helper capped at 60 entries per letter count; `loadSeenWordsFromStorage(letterCount)` — returns a `Set<string>` of seen words; `saveWordOMeterSession(session)` — writes to the shared `sessions` collection with `subject: 'wordOMeter'` and null values for Maths-only fields.

### `src/data/wordOMeterData.ts`
Static word bank (~900 lines). All words are `WOMWord` objects with grade, letter count, meanings, part of speech, synonyms, antonyms, and an optional blend hint (7–8 letter words only). Exports `ALL_WORDS`, `GRADE_LETTER_OPTIONS` (maps each grade to its available letter counts), and `getWordPool(grade, letterCount)` which returns all words at or below the given grade for the given letter count.

### `src/data/wordlists/`
Six auto-generated TypeScript files (`wom-3.ts` through `wom-8.ts`), each exporting a `ReadonlySet<string>` of uppercase SOWPODS words for that letter count. Generated by `scripts/generate-wordlists.cjs` from the `sowpods` npm package. Vite code-splits these into separate chunks; each is imported dynamically by the game hooks only when that letter count is actually played. Counts: 3→1,292, 4→5,454, 5→12,478, 6→22,157, 7→32,909, 8→40,161 words.

### `src/hooks/useWordOMeterGame.ts`
Custom hook encapsulating all Word-O-Meter solo game logic. `startGame(grade, letterCount)` picks a word and initialises state; `maxAttempts` is set to `letterCount` (square grid — N letters → N attempts). `typeLetter` / `deleteLetter` manage the current-row buffer. `submitGuess` is async: it dynamically imports the SOWPODS word list for the current letter count (`src/data/wordlists/wom-{N}.ts`) and checks the guess against it — if not found, the guess is rejected with "Not a valid English word" (load failures are treated as invalid — the guess is rejected with the same error); it then evaluates the guess letter-by-letter against the target using a two-pass algorithm (correct positions first, then present letters, to handle duplicates correctly), updates `guesses` and `letterStates`, and transitions to `won`/`lost` when appropriate. A `validating` boolean prevents duplicate submits during the async import. `useHint(type)` consumes an available hint; hint limit is enforced (1 max for 3–5 letter words, 2 max for 6–8 letter words) — once the limit is reached `availableHints` is cleared. `forceFinish` ends the session early. `_finishSession` calls `saveWordOMeterSession` and `saveSeenWordToStorage` asynchronously. Score: `max(10, 100 − (attemptsUsed−1) × 12 − hintsUsed × 8)` on win; 0 on loss.

### `src/types/science.ts`
Type definitions for the Science subject: `ScienceQuestion` (id, grade, question, four options, `correctIndices` array, topic), `ScienceAnsweredQuestion` (question, selectedIndices, isCorrect, answeredAt), `ScienceSession` (saved to Firestore `sessions` collection with `subject: 'science'`).

### `src/firebase/science.ts`
Four exports: `fetchScienceQuestions(grade)` — queries the `scienceQuestions` Firestore collection using a cumulative grade pool (Grades 5 through the selected grade, via `gradesUpTo()`), limit 200, loads seen IDs from localStorage (`mm_sci_seen_<grade>`), prefers unseen questions, falls back to full pool if fewer than 20 unseen, shuffles options per question (Fisher-Yates, updates `correctIndices`), and returns 20 questions; `saveScienceSession(session)` — writes to the shared `sessions` collection with `subject: 'science'` and null for Maths-only fields; `loadScienceSeenIds(grade)` / `saveScienceSeenIds(grade, ids)` — FIFO localStorage helpers capped at 100 entries (5 sessions × 20 questions per grade).

### `src/hooks/useScienceGame.ts`
Custom hook for the Science solo game. `startGame(grade)` fetches questions and sets status to `'playing'`. `toggleOption(index)` toggles an option in `selectedIndices` (multi-select). `submitAnswer()` transitions to `revealed: true`; requires at least one option selected. `advance()` records the answered question (correct if selected indices match `correctIndices` exactly), updates score (5 pts per correct), streak, bestStreak, and moves to the next question or transitions to `'finished'`. `forceFinish()` saves and ends early if any questions answered. `_finishSession` calls `saveScienceSession` and `saveScienceSeenIds` asynchronously.

### `src/hooks/useChallengeScienceGame.ts`
Multiplayer Science game hook. Takes `gameCode`, `uid`, and pre-fetched `ScienceQuestion[]`. Same `toggleOption`/`submitAnswer`/`advance` logic as the solo hook. Syncs score, correctAnswers, totalAnswered, bestStreak, and finished status to Firestore via `updatePlayerProgress` (debounced 100 ms). `forceFinish` marks the player done and triggers a final sync.

### `src/types/womCreator.ts`
Type definitions for the Word-O-Meter Creator multiplayer mode: `WOMCreatorRound` (creatorId, word, letterCount, wordObj — all nullable until creator submits), `WOMCreatorGuessState` (per-player per-round guess progress: guesses array, won, passed, hintsUsed, score, done), `WOMCreatorState` (roundOrder, currentRound, rounds map, progress map), `WOMCreatorSession` (written to Firestore sessions with `subject: 'womCreator'`).

### `src/firebase/womCreator.ts`
Firestore helpers for Creator mode. `initCreatorState(gameCode, uids)` — shuffles uids to set round order, initialises round 0 with the first creator, writes `womCreatorState` to the challenge doc. `submitCreatorWord(gameCode, roundIndex, wordObj)` — writes the word, letterCount, and wordObj into `womCreatorState.rounds[roundIndex]`; validates are done in the hook before calling. `updateGuesserProgress(gameCode, roundIndex, uid, state)` — debounced write to `womCreatorState.progress[roundIndex][uid]`; also calls `updatePlayerProgress` to keep the `ChallengePlayer.score` current. `advanceRound(gameCode, nextRound)` — sets `womCreatorState.currentRound = nextRound` and initialises the next round entry in `rounds`. `saveWOMCreatorSession(session)` — writes a `WOMCreatorSession` to the shared `sessions` collection with `subject: 'womCreator'`.

### `src/hooks/useChallengeWOMCreatorGame.ts`
Game logic hook for Creator-mode challenges. Reads `challenge.womCreatorState` via the `useChallengeListener` snapshot. Determines the current player's role for each round: **creator** (uid matches `rounds[currentRound].creatorId`) or **guesser** (everyone else). Creator phase: manages a text input (3–8 chars), validates against the SOWPODS wordlist via dynamic import, and calls `submitCreatorWord`. Guesser phase: runs the same two-pass guess-evaluation algorithm as `useChallengeWOMGame` — `typeLetter`, `deleteLetter`, `submitGuess` (async SOWPODS validation), `useHint`. Exposes a `pass()` action. Detects when all non-creator players are done and calls `advanceRound` (or `finishChallenge` after the last round). Computes and syncs creator bonuses to Firestore. Returns a discriminated state: `{ phase: 'creating' | 'waitingForWord' | 'guessing' | 'waitingForOthers' | 'finished', ... }`.

### `src/components/screens/ScienceSetupScreen.tsx`
Setup screen for the Science solo quiz. Grade selector limited to Grades 5–12. Shows a summary card (20 questions, multi-select MC, cumulative grade pool). Orange accent colour throughout.

### `src/components/screens/ScienceGameScreen.tsx`
Science game screen. Displays topic badge + "Select all that apply" badge (for multi-correct questions), an optional image (rendered above the question text when `imageUrl` is present on the question), question card, four option buttons with checkbox indicators, a Check Answer button (disabled until at least one option selected), and an End Game button. After submission: correct options turn green, incorrectly selected options turn red, remaining options grey out. Auto-advances after 2 seconds. Option styling matches the SS game screen pattern but uses orange as the accent colour.

### `src/components/screens/ScienceResultsScreen.tsx`
Results screen showing emoji/message, score (out of 100), correct count, accuracy %, best streak, and a scrollable list of incorrectly answered questions with the correct option(s) highlighted in green.

### `src/firebase/admin.ts`
All admin-specific Firestore operations. Functions: `checkIsAdmin`, `checkIsSuperAdmin`, `searchUsersByPrefix` (prefix range query, min 4 chars), `uploadSupportingFile`, `getAuditLog`, `adminResetPassword`, `adminMergeUsers`, `adminMoveScores`, `adminDeleteUser`, `getDashboardSessions`, `getAdminList`, `addAdmin`, `removeAdmin`. Every action writes an `auditLog` entry regardless of outcome. Batch writes (400 ops/batch) handle large session transfers. `adminResetPassword` and `adminDeleteUser` call Cloud Functions for server-side Auth operations.

### `functions/index.js`
Firebase Cloud Functions (Node 22, v2). Exports two `onCall` functions — both verify caller is admin via `admins/{uid}`: `adminSetPassword` (sets target user's password via `auth().updateUser()`), `adminDeleteUser` (deletes target user's Auth account via `auth().deleteUser()`). Deployed via `firebase-tools` in CI.

### `src/components/screens/AdminScreen.tsx`
Admin-only panel with three tabs for regular admins (**Users**, **Dashboard**, **Audit**) and a fourth tab for super admins (**🔐 Admins**). Users tab: primary search (User A), four action buttons (Reset Password / Merge / Move / Delete User — Delete hidden when searching self), action panel with secondary user search (merge/move), password fields (reset), mandatory notes, and confirm. Dashboard tab: date range + username + grade + operation + difficulty filters, stats summary row, compact session rows (up to 500). Audit tab: last 50 entries. Admins tab (super admin only): search and add regular admins, list all admins with role badges, remove regular admins (Remove button hidden for super admin rows; server-side guard also blocks it). The admin list is loaded on component **mount** (not only when the Admins tab opens) so it is available to filter user search results: when the current user is a regular admin, all UIDs present in the admins collection are excluded from both the primary (User A) and secondary (User B) search results — preventing regular admins from finding, viewing, or taking action on other admins or the superadmin. Superadmins see all users in search results. Receives `isSuperAdmin` prop from AppShell.

### `src/components/screens/ContactScreen.tsx`
Contact support form. Accessible from Settings (logged in) and from the Login screen (logged out). When accessed without login, a mandatory username field is shown. Collects subject, description (≤500 words with live counter), and contact email. On submission, sends all fields to EmailJS, which delivers the email to `app_admin@divel.me`. Displays a confirmation screen on success and an inline error with fallback admin email on failure. Back navigation goes to Login (logged out) or Settings (logged in). File attachments are not supported (Firebase Storage requires the Blaze plan).

### `src/components/screens/ProfileScreen.tsx`
Displays and edits user profile (avatar, name, grade), change password, recovery email, and account deletion. Delete Account shows a confirmation panel, then calls `deleteAllUserData` + `deleteCurrentUser` — deleting all Firestore data before removing the Auth account, which triggers automatic logout. The Delete Account button and confirmation panel are hidden when either `isAdmin` or `isSuperAdmin` is true, preventing any admin from removing their own account via the Profile screen.

### `src/components/screens/ChallengeCreateScreen.tsx`
Challenge configuration screen. Has a subject selector (Mental Maths / Social Studies / Science / Word-O-Meter) and a grade selector (defaulting to profile grade, clamped per subject). For Maths: shows operation, difficulty, and mode selectors. For SS / Science: hides those and shows an info card. For WOM: shows a letter count selector restricted to the counts valid for the selected grade (via `GRADE_LETTER_OPTIONS`), matching solo play rules; selecting a new grade resets the letter count if the current one is no longer valid; `pickWord` is called at creation time to pick and store the shared word. On create, fetches/generates questions and writes the challenge doc.

### `src/components/screens/ChallengeGameScreen.tsx`
Multiplayer game screen. Branches on `challenge.config.subject` (defaulting to `'mentalMaths'` for backward compatibility). Renders `ChallengeGameInner` for Mental Maths (number pad + timer), `ChallengeSSGameInner` for Social Studies (multiple choice + auto-advance), `ChallengeScienceGameInner` for Science (multiple-select MC + Check Answer + 2 s auto-advance), `ChallengeWOMGameInner` for Word-O-Meter (Wordle-style grid + keyboard + hints), or `ChallengeWOMCreatorGameInner` for Creator Mode (word-input screen for creator; WOM grid for guessers; live round-status view). All inners share the same live leaderboard pattern, waiting-for-others screen, and End Game button.

### `src/components/screens/LoginScreen.tsx`
Handles login, forgot-password flow, and a "Contact Support" link that navigates to `ContactScreen` without requiring authentication.

### `src/components/screens/*`
One file per screen. Each receives `onNavigate` and accesses shared state via context hooks. No screen imports from another screen.

### `src/components/game/*`
Presentational game UI components. `QuestionCard` handles animation states (bounce-in, shake). `NumberPad` manages local input state. `Timer` computes the visual progress bar and red-pulse threshold. `ScoreBar` is a pure display component.

---

## Design Considerations

**Why no external router?**
The app has a linear, predictable flow with no deep linking or browser back-button requirements. A simple `currentScreen` state in `AppShell` is sufficient and eliminates a dependency. Adding React Router would add complexity without benefit at this scale.

**Why synthetic emails?**
Firebase Authentication requires an email address. Rather than making email mandatory (which excludes young users who may not have one), a synthetic email (`username@mentalmaths.app`) is generated internally. Users never see it. A real recovery email can be optionally added for password reset — this is stored in `usernameLookup` and set as the Firebase Auth account email directly via the `updateRecoveryEmail` Cloud Function (no verification step).

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

**Why a separate hook for Social Studies instead of extending GameContext?**
Social Studies questions are multiple-choice and fetched from Firestore, not generated by the local engine. Extending the Maths `GameContext` reducer would require conditional logic throughout and pollute the Maths-specific types. A lightweight `useSocialStudiesGame` hook keeps the two subjects fully independent.

**Why Word-O-Meter uses a static local word bank instead of Firestore?**
Unlike Social Studies questions (factual, curriculum-specific, authored by humans), vocabulary words for a Wordle-style game work well as a bundled static dataset. A local word bank eliminates Firestore reads entirely for this subject, reduces latency to zero, and allows the game to work offline. The `wordOMeterData.ts` file ships with ~780 words across grades and letter counts; adding more words is a code change, not a data migration.

**Why SOWPODS local word lists instead of a dictionary API for guess validation?**
The original implementation used `api.dictionaryapi.dev` to validate player guesses. That API is community-maintained with incomplete coverage, causing common English words (e.g. "BRIDE") to be incorrectly rejected. A local SOWPODS dataset (267,751 words) provides complete, reliable coverage. The list is split into six files by letter count (`wom-3.ts` through `wom-8.ts`) in `src/data/wordlists/` and dynamically imported by Vite on first use — a player in a 5-letter game downloads only the ~135 KB 5-letter chunk. This eliminates external API dependency, works offline, and is instantaneous after the first load.

**Why seed Social Studies questions into Firestore instead of generating them?**
Unlike Maths, Social Studies content is factual and curriculum-specific — it cannot be algorithmically generated. Pre-seeding 800 questions (80 per grade, Grades 3–12) via `scripts/seedSocialStudies.mjs` allows question authors to add, edit, and remove content without a code deploy. The app fetches up to 80 questions per grade and randomly serves 20, providing variety across sessions.

**Why seed Science questions into Firestore instead of generating them?**
Same rationale as Social Studies. Science content (Biology, Chemistry, Physics, Earth Science) is factual and topic-specific. Questions are seeded via `scripts/seed-science-questions.cjs` (Grades 5–6), `scripts/seed-science-grade7-8.cjs` (Grades 7–8), `scripts/seed-science-grade9-10.cjs` + supplement (Grades 9–10), `scripts/seed-science-grade11.cjs` (Grade 11), and `scripts/seed-science-grade12.cjs` (Grade 12). All grades carry at least 38 `imageUrl` and 38 multi-select questions per grade. The cumulative pool design (Grades 5 through selected grade) means a Grade 8 student's session draws from all four grade banks, giving broader variety without requiring a separate question fetch per grade. The dedup cap of 100 (5 × 20) prevents question repeats across 5 consecutive sessions per grade level.

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
| SOWPODS word lists | Word list files (`wom-3.ts` through `wom-8.ts`) are Vite code-split chunks, loaded on demand per letter count. The 5-letter list is ~135 KB uncompressed (~45 KB gzipped). Larger lengths (7–8 letters) are ~400–550 KB uncompressed but are only loaded when those letter counts are played. |
| No offline support | Firestore offline persistence is not enabled. App requires an active internet connection. |
| Sessions capped at 6 months | Older sessions are auto-purged on startup. Long-term historical analysis is not supported. |
| Global high scores unverified | High scores are written from the client. There is no server-side validation against cheating. |

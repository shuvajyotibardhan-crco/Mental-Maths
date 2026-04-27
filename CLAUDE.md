# Mental Maths — Project Context

## Global Rules

See `/Users/shuvajyotibardhan/Projects/.claude_rules.md` for the full rules. Summary:
- **Token Savings** — diffs only (no full-file rewrites), check/create `progress.md` before starting, no exploratory terminal commands, keep explanations brief.
- **Documentation** — for every feature/bug: create/update requirements, design, specs, and tasks docs; seek approval before pushing each to git.
- **progress.md** — always maintain using the template in the rules file to track current task, completed steps, and next action.

## What this is
A mental maths practice app for kids/students. Vite + React + **TypeScript** + Tailwind CSS v4 + Firebase (Auth + Firestore).

## Firebase
- **Separate Firebase project from Bingo** — never cross-reference or share config
- Firebase Auth is used for real user accounts (unlike Bingo which uses anonymous UUIDs)
- Firestore for game sessions, history, user profiles, settings
- `src/firebase/config.ts` reads from `.env` — config object is intentionally empty in the file
- Deploy with `firebase deploy` (hosting config already in `firebase.json`)
- **Never touch the Bingo Firebase project**

## GitHub
- Repo: https://github.com/shuvajyotibardhan-crco/Mental-Maths
- Branch: `main`
- Push all changes after every meaningful edit

## Architecture
- `src/firebase/config.ts` — Firebase init
- `src/firebase/auth.ts` — Auth helpers
- `src/firebase/firestore.ts` — Firestore read/write helpers
- `src/firebase/game/` — game-specific Firestore ops
- `src/context/AuthContext.tsx` — auth state, user profile
- `src/context/GameContext.tsx` — active game state
- `src/context/SettingsContext.tsx` — user settings
- `src/hooks/useTimer.ts` — timer logic for timed mode
- `src/engine/` — question generation (`question.ts`), session (`session.ts`), scoring
- `src/types/` — shared TypeScript types: `index.ts`, `question.ts`, `session.ts`, `user.ts`
- `src/components/screens/` — one file per screen
- `src/components/layout/AppShell.tsx` — top-level router/shell
- `scripts/` — admin/seeding scripts using firebase-admin

## Multiplayer Challenge
- `src/types/challenge.ts` — Challenge, ChallengePlayer, ChallengeConfig types; `ChallengeConfig.subject` ('mentalMaths' | 'socialStudies') determines game engine
- `src/firebase/challenge.ts` — Firestore CRUD for challenges collection
- `src/engine/gameCode.ts` — 7-char alphanumeric code generator
- `src/hooks/useChallengeListener.ts` — onSnapshot wrapper for live challenge state
- `src/hooks/useChallengeGame.ts` — Mental Maths multiplayer game logic hook
- `src/hooks/useChallengeSSGame.ts` — Social Studies multiplayer game logic hook (MC questions)
- `src/components/screens/Challenge*.tsx` — 5 challenge screens (Create, Join, Lobby, Game, Results)
- `ChallengeGameScreen` branches on `config.subject` → `ChallengeGameInner` (maths) or `ChallengeSSGameInner` (SS)
- `ChallengeCreateScreen` has subject selector (Mental Maths / Social Studies) + per-subject options
- Firestore collection: `challenges/{gameCode}` — single doc per challenge with config, questions, players map
- All players answer same pre-generated/fetched questions in same order
- Live leaderboard during gameplay via Firestore onSnapshot
- Sessions saved to personal history (maths uses `saveSession`+high scores; SS uses `saveSocialStudiesSession`)

## EduQuiz Framework Rules — apply to every new subject

These are non-negotiable app-level rules. When a new subject is added, ALL of the following apply automatically. No exceptions.

1. **Grade is per-quiz, not profile.** Every setup screen must include a `GradeSelector` component (`src/components/ui/GradeSelector.tsx`). The profile grade is only used as the default. Grade limits are subject-specific (Mental Maths: KG–12; Social Studies: 3–12).

2. **End Game button required.** Every active game screen must show an "End Game" button. For Mental Maths: calls `finishGame()` on the game context. For SS-style subjects: calls `forceFinish()` on the hook. Partial sessions should be saved when at least 1 question was answered.

3. **Challenge/multiplayer for all subjects.** `ChallengeCreateScreen` always has a subject selector. `ChallengeConfig.subject` determines which game engine loads in `ChallengeGameScreen`. To add a new subject to challenges: (a) add it to `ChallengeSubject` type, (b) create `useChallengeXxxGame` hook with Firestore progress syncing, (c) add a `ChallengeXxxGameInner` component to `ChallengeGameScreen.tsx`.

4. **Cross-session deduplication always on.** Every subject uses localStorage to avoid repeating questions across sessions. Mental Maths key: `mm_seen_questions` (displayString, cap 60). Social Studies key: `mm_ss_seen_<grade>` (Firestore IDs, cap 80). New subjects follow the same pattern — choose a key prefix, a meaningful cap, and implement `loadSeenIds`/`saveSeenIds` helpers.

5. **Answer input is format-driven, not subject-driven.** Free-form numeric answer (Maths) → submit button + number pad. Multiple-choice (Social Studies) → tap to select + auto-advance after 1.2 s reveal. This is intentional and consistent within each format. Do NOT add a submit button to MC screens or remove it from numeric screens.

6. **Session save on every finish.** Every subject saves a session record to the shared `sessions` Firestore collection on finish (natural or forced). For new subjects: create a `saveXxxSession` helper in `src/firebase/xxx.ts` that writes with `subject: 'xxx'` and nulls for inapplicable fields (operation, difficulty).

7. **To add a new subject:** (a) Create `src/types/xxx.ts` with Question, AnsweredQuestion, Session types. (b) Create `src/firebase/xxx.ts` with fetch, save, dedup helpers. (c) Create `src/hooks/useXxxGame.ts` (grade param at `startGame` time). (d) Create Setup/Game/Results screens. (e) Add `ChallengeXxxGameInner` to `ChallengeGameScreen`. (f) Register subject in `ChallengeSubject` type and `ChallengeCreateScreen`. (g) Update `AppShell` with an `XxxShell` inner component. (h) Add subject card to `HomeScreen`. (i) Update all three docs.

## Key rules / decisions
- **TypeScript** throughout — unlike Bingo which is plain JSX
- Auth is real Firebase Auth (email/password) — username/password login, in-app change password
- Password reset uses recovery email (optional, set by user in Profile); reset email sent from `app_admin@divel.me`
- Game has two modes: **timed** (countdown) and **fixed** (set number of questions)
- Timer logic is isolated in `useTimer.ts`
- `App.tsx` is minimal — just wraps providers; routing/screen logic is in `AppShell.tsx`

## Screen flow
Login / Register → ProfileSetup (first time) → Home → GameSetup → Game → Results → History

### Multiplayer flow
Home → ChallengeCreate → ChallengeLobby → ChallengeGame → ChallengeResults
Home → JoinChallenge → ChallengeLobby → ChallengeGame → ChallengeResults

## Admin Panel
- `src/components/screens/AdminScreen.tsx` — admin UI (two tabs: Users, Audit Log)
- `src/firebase/admin.ts` — admin Firestore ops (checkIsAdmin, getUserByUsername, uploadSupportingFile, adminResetPassword, adminMergeUsers, adminMoveScores, getAuditLog)
- `src/types/admin.ts` — AuditEntry, AdminActionType types
- Admin access: add UID to Firestore `admins/{uid}` collection manually via Firebase Console
- Admin tab (🛡️) appears in BottomNav only for admin users
- Audit trail stored in `auditLog` Firestore collection — every action (success or fail) logged
- Supporting file uploads stored at `audit-support/{tempId}/{filename}` in Firebase Storage (requires Blaze plan)
- Three operations: Reset Password (sends email to recovery address), Merge Users (A into B, best scores kept), Move Scores (A → B, A's scores cleared)

## Contact Form
- `src/components/screens/ContactScreen.tsx` — contact/support form screen
- Accessible via Settings screen → "Contact Support" button
- Sends email to `app_admin@divel.me` via EmailJS (`@emailjs/browser`)
- Subject formatted as `[user subject] | Mental Maths`
- Supports file attachments (image/document, max 5MB, first file sent as base64 attachment)
- Word limit: 500 words on description field
- Requires 3 env vars: `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`
- Password reset email sender (`app_admin@divel.me`) configured in Firebase Console → Auth → Email Templates

## .env (not in git)
Firebase project: `mental-maths-fabc3` — get real values from Firebase Console → Project Settings → Your apps.
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# EmailJS — contact form
VITE_EMAILJS_SERVICE_ID=your-service-id
VITE_EMAILJS_TEMPLATE_ID=your-template-id
VITE_EMAILJS_PUBLIC_KEY=your-public-key
```

# Mental Maths — Project Context

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
- `src/types/challenge.ts` — Challenge, ChallengePlayer, ChallengeConfig types
- `src/firebase/challenge.ts` — Firestore CRUD for challenges collection
- `src/engine/gameCode.ts` — 7-char alphanumeric code generator
- `src/hooks/useChallengeListener.ts` — onSnapshot wrapper for live challenge state
- `src/hooks/useChallengeGame.ts` — multiplayer game logic hook
- `src/components/screens/Challenge*.tsx` — 5 challenge screens (Create, Join, Lobby, Game, Results)
- Firestore collection: `challenges/{gameCode}` — single doc per challenge with config, questions, players map
- All players answer same pre-generated questions in same order
- Live leaderboard during gameplay via Firestore onSnapshot
- Sessions saved to personal history with `challengeId` field for "Multiplayer" badge

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

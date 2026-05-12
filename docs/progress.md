# Progress — Feature 21: Word-O-Meter Creator Mode (Multiplayer)

## Current Task
Implementing WOM Creator multiplayer game mode end-to-end.

## Completed Actions
- [x] Docs updated: Feature 21 added to REQUIREMENTS.md (ACs 1–18, test plan)
- [x] SPECS.md updated: WOMCreatorRound, WOMCreatorGuessState, WOMCreatorState, WOMCreatorSession data models added; ChallengeSubject + Challenge doc updated; Creator Mode Lifecycle algorithm added; File Inventory updated; WOM Creator Constants added
- [x] DESIGN.md updated: high-level overview, new module descriptions (womCreator types, firebase, hook, screen)

## Logic / Context
### How Creator Mode Works
- N players → N rounds. Round order shuffled at game start and stored in `womCreatorState.roundOrder`.
- Each round: the designated creator types a word (3–8 letters), validated against SOWPODS. Other players guess using standard WOM rules (N attempts for N-letter word, same hint allowances).
- Guesser score per round: `max(10, 100 − (attemptsUsed−1)×12 − hintsUsed×8)` on win; 0 on loss/pass.
- Creator bonus per round: 10 × (guessers who did NOT win).
- Total score = sum of guesser scores + creator bonus. Synced to `ChallengePlayer.score` after each round.
- Round advances when ALL non-creator players have `done=true` (won/lost/passed).
- `womCreatorState` lives on the challenge doc; guessers do NOT get `questions[]` (empty array).

### Key Design Decisions
- Word validation reuses SOWPODS dynamic imports (same as solo + existing WOM challenge).
- `WOMCreatorState` is a nested map inside the challenge doc (no separate Firestore collection). Acceptable for ≤10 players.
- `ChallengePlayer.score` is the running total (guesser scores + creator bonus), updated via the existing `updatePlayerProgress` helper after each round completes.
- Phase discrimination is done entirely client-side from `womCreatorState` — no extra Firestore fields needed.

### Phase States (useChallengeWOMCreatorGame)
- `creating` — current user is this round's creator, word not yet submitted
- `waitingForWord` — current user is a guesser, creator hasn't submitted yet
- `guessing` — current user is a guesser, word is available, still playing
- `waitingForOthers` — current user finished guessing this round; waiting for other guessers
- `creatorWaiting` — creator submitted word, waiting for all guessers to finish
- `finished` — all rounds done

## Next Action
Create `src/types/womCreator.ts` with the four new types.

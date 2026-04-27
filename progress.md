# Project State
- **Last Updated:** 2026-04-27
- **Current Branch:** main
- **Current Task:** Word-O-Meter — fix invalid words being accepted

## Completed Actions
1. [x] Grades 5–6 seeded (seed-science-questions.cjs — 300 questions)
2. [x] Grades 7–8 seeded (seed-science-grade7-8.cjs — 300 questions)
3. [x] ScienceQuestion type, firebase/science.ts, hooks, screens, challenge integration complete
4. [x] Added imageUrl?: string to ScienceQuestion type
5. [x] ScienceGameScreen renders image above question when imageUrl is present
6. [x] Grades 9–10 seeded — 150 Qs each, 38 image, 38 multi-select
7. [x] Grade 11 seeded — 150 Qs, 49 imageUrl, 38 multi-select ✅
8. [x] Grade 12 seeded — 150 Qs, 76 imageUrl, 64 multi-select ✅
9. [x] WOM bug fix: catch block was silently allowing invalid words through when wordlist import failed — now blocks with 'Not a valid English word' in both useWordOMeterGame.ts and useChallengeWOMGame.ts

## Current Logic Context
- WOM validation: dynamic import of wom-{letterCount}.ts; if import throws, old code fell through catch and accepted the word — fixed to return with error
- Science seeding complete for all grades 5–12

## Next Immediate Step
- Verify WOM fix works in production after deploy
- Check why wordlist import throws (may be a Vite chunking/load issue worth investigating)

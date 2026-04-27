# Project State
- **Last Updated:** 2026-04-23
- **Current Branch:** main
- **Current Task:** Science Quiz — seed grades 9–12 with 25% image questions and 25% multi-select questions

## Completed Actions
1. [x] Grades 5–6 seeded (seed-science-questions.cjs — 300 questions)
2. [x] Grades 7–8 seeded (seed-science-grade7-8.cjs — 300 questions)
3. [x] ScienceQuestion type, firebase/science.ts, hooks, screens, challenge integration complete
4. [ ] Add imageUrl?: string to ScienceQuestion type
5. [ ] Update ScienceGameScreen to render image if present
6. [ ] Create scripts/seed-science-grade9-12.cjs (grades 9–12, 150 questions each, 38 with imageUrl, 38 multi-select)

## Current Logic Context
- ScienceQuestion: { id, grade, question, options[4], correctIndices[], topic }
- imageUrl is not yet in the type — needs to be added as optional
- Higher grades include all lower-grade questions (gradesUpTo() in firebase/science.)
- 25% with images = 38 per grade (imageUrl field set to a Wikimedia Commons URL)
- 25% multi-select = 38 per grade (correctIndices.length > 1)
- Image questions distribute across topics: Bio (~13), Chem (~13), Physics (~12) per grade

    ## Seeding Mechanism (Science Questions)                       
                                                                   
    - Script pattern: `'use strict'; require('firebase-admin');    
    fs.readFileSync(process.argv[2])` — pass service account JSON  
    as CLI arg
    - `admin.initializeApp(...)` → `db.settings({ preferRest: true
    })` (prevents Node gRPC hang)
    - All questions in a single `const questions = [...]` array;
    each entry: `{ grade, topic, question, options:[4],
    correctIndices:[], imageUrl? }`
    - Batch write: `BATCH_SIZE = 499`; loop `db.batch()` →
    `batch.set(col.doc(), q)` → `await batch.commit()`
    - Collection: `scienceQuestions`
    - Run: `node scripts/seed-science-gradeX-Y.cjs
    path/to/service-account.json`
    - Verify: script prints count per grade after seeding;
    cross-check in Firestore Console → scienceQuestions
    - **Do NOT run more than one grade at a time** to avoid output
    token / memory issues in a single session
    - Existing scripts: `seed-science-questions.cjs` (grades 5–6,
    300 Qs), `seed-science-grade7-8.cjs` (grades 7–8, 300 Qs)
    - Still needed: `seed-science-grade9-12.cjs` (grades 9–12, 150
    Qs each, ~38 multi-select + ~38 imageUrl per grade)
    
## Next Immediate Step
- Run: node scripts/seed-science-grade9-12.cjs <service-account.json>
- Seed 1 grade-1 subject combination at one time, so that you do not exceed output token maximum in a session
- After seeding, verify counts in Firestore console
- Update docs/REQUIREMENTS.md, DESIGN.md, SPECS.md with imageUrl field and grades 9–12

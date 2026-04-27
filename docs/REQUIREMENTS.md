# DIVEL EDU QUIZ — Requirements

## Overview
DIVEL EDU QUIZ is a web-based educational practice app for kids and students (KG–Grade 12). It supports two subjects: **Mental Maths** (arithmetic practice across 8 operation types) and **Social Studies** (multiple-choice quizzes covering the US and Colorado curriculum for Grades 3–12). Players log in with a username and password; scores, streaks, and session history are tracked per user.

## Scope

### In Scope
- Username/password authentication (no OAuth)
- Mental Maths: question generation for 13 grade levels (KG–12) across 8 operation types
- Social Studies: 20-question multiple-choice quizzes for Grades 3–12, US and Colorado curriculum
- Two game modes for Maths: timed (2 minutes) and fixed (20 questions)
- Scoring with streak and speed multipliers (Maths); accuracy-based scoring (Social Studies)
- Personal and global high score tracking (Maths only)
- Session history with filters
- In-app password change and optional recovery email for password reset
- Sound effects toggle

### Out of Scope
- Native iOS/Android app (future)
- Email-based reset via Cloud Functions (future)
- Teacher/parent dashboard
- In-app purchase or subscriptions

---

## Feature 1 — User Registration

**User story:** As a new user, I want to create an account with a username and password so that my progress is saved.

**Acceptance Criteria:**
1. Username must be at least 3 characters.
2. Username must be unique — system shall reject duplicates.
3. Password must be at least 6 characters.
4. Confirm password field must match password.
5. Recovery email is optional; if provided, it must be a valid email format.
6. Hint text shall warn that recovery email must not be used by another account in the app.
7. On success, user shall be redirected to Profile Setup.
8. On error, a clear inline message shall be shown.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Submit with username < 3 chars | Error: "Username must be at least 3 characters." |
| Submit with existing username | Error: "Username already taken." |
| Submit with password < 6 chars | Error: "Password must be at least 6 characters." |
| Submit with non-matching passwords | Error: "Passwords do not match." |
| Submit valid form without recovery email | Account created, redirect to Profile Setup |
| Submit valid form with recovery email | Account created, verification email sent to recovery address |
| Enter invalid email format in recovery field | Browser/HTML5 validation prevents submission |

---

## Feature 2 — Login

**User story:** As a returning user, I want to log in with my username and password so that I can access my account.

**Acceptance Criteria:**
1. User must be able to log in using username and password only (no email required).
2. System shall try the synthetic email first, then fall back to the recovery email if one is registered.
3. Wrong credentials shall show a clear error message.
4. Show/hide password toggle must be available.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Enter valid username + password | Login succeeds, navigate to Home |
| Enter wrong password | Error: "Incorrect username or password." |
| Enter non-existent username | Error: "Incorrect username or password." |
| Toggle show/hide password | Password field switches between text and password type |

---

## Feature 3 — Forgot Password

**User story:** As a user who has forgotten their password, I want to receive a reset link so that I can regain access.

**Acceptance Criteria:**
1. "Forgot Password?" link must be visible on the Login screen.
2. User shall enter their username (not email) to request a reset.
3. System shall look up the recovery email from Firestore.
4. If no recovery email is on file, a clear message shall explain this and advise the user to contact the app admin.
5. If a recovery email exists, a Firebase password reset link shall be sent to it.
6. The displayed email must be masked (e.g. `****han@gmail.com`).
7. Success and error states must both be shown clearly.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Click "Forgot Password?", enter valid username with recovery email | Reset email sent; masked address shown |
| Enter username with no recovery email | Error message shown, no email sent |
| Enter non-existent username | Error message shown |
| Click reset link in email | Firebase password reset page opens for the correct account |
| Click "← Back to Login" | Returns to login screen |

---

## Feature 4 — Profile Setup (First-Time)

**User story:** As a new user, I want to set my display name, grade, and avatar so that the app feels personalised.

**Acceptance Criteria:**
1. Profile Setup screen must appear immediately after first registration.
2. User must select a display name, grade (KG–12), and avatar.
3. Display name must not be empty.
4. Selected grade shall determine question difficulty ranges for all future games.
5. On save, profile shall be written to Firestore and user redirected to Home.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Leave name blank and submit | Save button disabled or validation error |
| Select a grade and avatar, enter name, submit | Profile saved, redirect to Home |
| Return to Profile screen | Selected avatar, name, and grade are displayed |

---

## Feature 5 — Game Setup

**User story:** As a player, I want to choose the grade, operation type, difficulty, and game mode before starting so that I can practise what I need at any level.

**Acceptance Criteria:**
1. A grade selector (KG–Grade 12) shall be shown on the setup screen; it defaults to the user's profile grade but can be changed freely per session.
2. Grade is per-quiz — the profile grade is a default only, not a restriction.
3. Operation options must include: Addition, Subtraction, Multiplication, Division, Percentage, Square Root, Power, and Mix.
4. Operations not available for the selected grade shall not be shown; changing grade resets the operation if it becomes unavailable.
5. Difficulty options shall be: Easy, Medium, Hard.
6. Mode options shall be: Timed (2 minutes) and Fixed (20 questions).

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Open Game Setup | Grade selector shown, defaulting to profile grade |
| Change grade to KG | Only Addition and Subtraction shown |
| Change grade to Grade 6 | All operations shown |
| Change grade after selecting unavailable op | Operation resets to first available |
| Select all options and tap Start | Game screen opens with the selected grade + config |

---

## Feature 6 — Gameplay

**User story:** As a player, I want to answer maths questions using a number pad and see immediate feedback so that I can learn quickly.

**Acceptance Criteria:**
1. Questions shall be generated at the correct grade, operation, and difficulty.
2. In timed mode, a 2-minute countdown timer shall be displayed with a progress bar.
3. Timer shall pulse red when under 15 seconds remain.
4. In fixed mode, a question counter (e.g. Q3/20) shall be shown.
5. User shall enter answers using the on-screen number pad or physical keyboard.
6. Negative answers must be supported (minus key).
7. Correct answers shall show green feedback for 500ms then advance to next question.
8. Wrong answers shall show orange feedback including the correct answer for 1500ms.
9. A sound effect shall play when the player answers incorrectly (if sound is enabled).
10. Score and current streak shall update in real time.
11. Streak indicator shall only appear when streak ≥ 3.
12. An "End Game" button must be available to finish early.
13. On timer expiry (timed mode) or last question (fixed mode), game shall end automatically.
14. Within a single session, no question shall repeat (within-session deduplication).
15. Questions seen in previous sessions shall be deprioritised in subsequent sessions (cross-session deduplication); if fewer than the required number of unseen questions remain the full pool is used so no session is ever short.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Start timed game | 2:00 countdown begins, progress bar full |
| Answer correctly | Green feedback, score increases, streak increments |
| Answer incorrectly | Orange feedback with correct answer, streak resets; wrong-answer sound plays |
| Timer reaches 0 | Game ends, Results screen shown |
| Answer 20th question in fixed mode | Game ends, Results screen shown |
| Press End Game early | Game ends, Results screen shown with questions answered so far |
| Enter negative number | Minus sign accepted, correct calculation evaluated |
| Use keyboard numpad | Input accepted identically to on-screen pad |
| Complete a session, start another with same config | Questions from the first session do not reappear until the pool is exhausted |

---

## Feature 7 — Results & High Scores

**User story:** As a player, I want to see my score, accuracy, and whether I beat my personal or global best after each game.

**Acceptance Criteria:**
1. Results screen shall display score, correct/total, accuracy %, best streak, and time taken.
2. A star rating (1–3 stars) shall be shown based on accuracy.
3. If the session is a personal high score, a "🏆 Personal Best!" banner shall appear.
4. If the session is a global high score, a "🌍 Global #1!" banner shall appear.
5. Personal and global best scores for the same configuration shall be shown for comparison.
6. A scrollable list of all answered questions shall be shown with correct/wrong indicators.
7. Session shall be automatically saved to Firestore.
8. "Play Again" shall start a new game with the same config.
9. "Home" shall return to the Home screen.
10. A sound effect shall play when results are shown (if sound is enabled): global best → grand fanfare; personal best → fanfare; otherwise → completion chime. Only one sound plays per session.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Complete game with > 80% accuracy | 3-star rating shown |
| Beat personal best | "🏆 Personal Best!" banner displayed |
| Beat personal best | "🏆 Personal Best!" banner displayed; fanfare sound plays |
| Beat global best | "🌍 Global #1!" banner displayed; grand fanfare sound plays |
| Scroll question list | All answered questions visible with correct/wrong colour |
| Tap Play Again | New game starts with same settings |
| Tap Home | Home screen shown |

---

## Feature 8 — History

**User story:** As a player, I want to review my past sessions and filter them so that I can track my progress.

**Acceptance Criteria:**
1. History screen shall list all sessions in reverse chronological order.
2. Each entry shall show: operation, difficulty, mode, grade, score, accuracy, date, and a trophy icon if it was a high score.
3. Filters shall include: date range (All / Today / 7 days / 30 days), grade, and operation.
4. Summary stats (total games and average accuracy) shall appear at the top.
5. Sessions older than 6 months shall be automatically purged on app startup.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Open History after 3 games | 3 entries shown, most recent first |
| Apply "Today" filter | Only today's sessions shown |
| Apply grade filter | Only sessions matching selected grade shown |
| Apply operation filter | Only sessions matching selected operation shown |
| Session with high score | Trophy icon visible on that entry |

---

## Feature 9 — Profile Management

**User story:** As a user, I want to update my display name, grade, and avatar, and manage my password and recovery email from within the app.

**Acceptance Criteria:**
1. Edit Profile mode shall allow changing name, grade, and avatar.
2. Name must not be empty to save.
3. Change Password shall require a new password of ≥ 6 characters and a matching confirm field.
4. Change Password shall not require the old password.
5. If session is too old, a "log out and back in" message shall appear instead of changing.
6. Recovery email can be added or updated; validation rules identical to registration.
7. Saving a new recovery email shall trigger a Firebase verification email.
8. Until the verification link is clicked, the recovery email is not active for password reset.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Edit name and grade, tap Save | Profile updated, view mode restored |
| Attempt save with empty name | Save button disabled |
| Change Password with < 6 chars | Error shown |
| Change Password with mismatched confirm | Error shown |
| Change Password successfully | Success message shown, form cleared |
| Add recovery email | Verification email sent, success message shown |
| Update existing recovery email | New address shows, verification email sent |

---

## Feature 10 — Settings

**User story:** As a user, I want to toggle sound effects so that I can practise in quiet environments.

**Acceptance Criteria:**
1. Settings screen shall have a sound effects toggle.
2. Sound preference shall persist across sessions (localStorage).
3. App version number shall be shown on the Settings screen.
4. When sound is enabled, four distinct sounds shall play: wrong answer (descending buzz), quiz completion (ascending chime), personal best (4-note fanfare), global best (5-note grand fanfare).

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Toggle sound off, play a game | No sound effects during gameplay or on results screen |
| Toggle sound on, answer incorrectly | Descending buzz plays |
| Toggle sound on, complete a game (no high score) | Ascending chime plays on results screen |
| Toggle sound on, beat personal best | 4-note fanfare plays on results screen |
| Toggle sound on, beat global best | 5-note grand fanfare plays on results screen |
| Reload app | Sound preference retained |
| Open Settings | Version number visible |

---

## Feature 11 — Multiplayer Challenge Mode

**User story:** As a player, I want to challenge my friends to a competition in any subject so that we can see who scores the highest on the same set of questions.

**Acceptance Criteria:**
1. Home screen shall provide "Challenge Friends" and "Join Challenge" buttons.
2. The challenge create screen shall offer a **subject selector** (Mental Maths / Social Studies / Word-O-Meter) — challenge is not limited to one subject.
3. A **grade selector** (defaulting to profile grade) shall appear for all subjects; valid grades are subject-specific (Mental Maths: KG–12; Social Studies: 3–12; Word-O-Meter: KG–12).
4. For Mental Maths challenges: operation, difficulty, and mode (timed/fixed) shall be configurable.
5. For Social Studies challenges: no operation/difficulty/mode config — always 20 multiple-choice questions, fixed mode.
6. For Word-O-Meter challenges: a letter count selector shall be shown with only the counts valid for the selected grade (same rules as solo play: 3–5 for KG–2, 4–6 for Gr 3–5, 5–7 for Gr 6–8, 6–8 for Gr 9–12); if the grade changes to one where the current letter count is invalid, it resets to the first valid option; the host picks a word length and the system randomly picks one word from the pool for that grade and length; all players guess the same word.
7. On creation, the system shall generate a unique 7-character alphanumeric game code.
8. The code shall be displayed prominently in the lobby for sharing; the lobby shows the subject and grade.
9. Friends shall join by entering the code on the Join Challenge screen.
10. The lobby shall show all joined players with their avatars and names in real time.
11. The host must have a "Start Game" button that is enabled only when at least 2 players have joined and all are ready.
12. All players shall answer the same pre-generated/pre-fetched questions in the same order.
13. During gameplay, a live mini-leaderboard shall show all players' scores in real time.
14. An "End Game" button shall be available during any challenge game to quit early.
15. When a player finishes (timer expires, all questions answered, or End Game), they shall see a waiting screen that shows each opponent's real-time status: "Playing…", "Finished ✓", or — after 30 seconds of inactivity — "No response · Auto-proceeding in Xs" with a live countdown. A player inactive for 2 minutes is treated as finished so the remaining players are not blocked.
16. Once all players finish, a leaderboard screen shall rank players by score. For Mental Maths: score desc, tiebreak by time asc in fixed mode only (timed mode uses score only). For Social Studies: score desc only. For Word-O-Meter: solved players rank above unsolved; among solvers, ranked by time asc, then tries asc, then hints asc.
17. Mental Maths challenge sessions shall be saved with high-score checking; Social Studies challenge sessions shall be saved as SS sessions; Word-O-Meter challenge sessions shall be saved as WOM sessions — none have a challenge high-score system.
18. Challenge sessions in History shall display a "Multiplayer" badge.
19. For Word-O-Meter challenges: challenge score = `max(1, round((10000 − secs×10 − (attempts−1)×5 − hints×2) / 100))` if won; 0 if not solved (time is the primary factor so faster solvers always rank higher). Solo score formula is different: `max(10, 100 − (attempts−1)×12 − hints×8)` (no time factor). The revealed word shall be displayed on the results screen.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Tap "Challenge Friends" on Home | ChallengeCreateScreen opens with subject + grade selectors |
| Select Social Studies, choose Grade 5 | Operation/difficulty/mode options hidden; SS info card shown |
| Create SS challenge | Lobby shows "Social Studies · Grade 5 · 20 Questions" |
| Select Mental Maths, configure and create | Lobby shows grade/operation/difficulty/mode |
| Select Word-O-Meter, choose Grade 4, length 5 | Letter count buttons shown; WOM info card shown |
| Create WOM challenge | Lobby shows "Word-O-Meter · 5-letter · Grade 4" |
| Friend enters code on Join screen | Friend appears in lobby in real time |
| Host taps Start with 1 player | Button disabled — need at least 2 |
| Host taps Start with 2+ ready players | All players navigate to game screen simultaneously |
| Play WOM challenge | Wordle-style grid shown; same word for all players; hints and keyboard available; live leaderboard visible |
| Play SS challenge | Multiple-choice UI shown; auto-advance after 1.2 s; live leaderboard visible |
| Tap End Game during SS challenge | Session finishes, waiting screen shown |
| Answer questions during maths challenge | Same questions shown to all players; number pad + submit button |
| All players finish | Leaderboard shows rankings with scores and stats |
| WOM results shown | Revealed word displayed; player rows show "Solved in N tries" or "Not solved" |
| Beat personal best in maths challenge | "New Personal Best!" banner shown |
| View History after challenge | Session shows "Multiplayer" badge |

---

## Feature 12 — Contact Support Form

**User story:** As a user, I want to report a problem or send feedback to the app administrator, so that issues can be investigated and resolved.

**Acceptance Criteria:**

1. A "Contact Support" entry shall be accessible from the Settings screen (when logged in).
2. A "Contact Support" link shall be accessible from the Login screen (when not logged in).
3. When accessed without login, the form must include a mandatory username field.
4. The contact form must include a subject line (required, max 120 characters).
5. The contact form must include a description field (required, max 500 words; a live word counter shall be shown).
6. The contact form must include a contact email field (required, valid email format).
7. File attachments are not supported (Firebase Storage requires Blaze plan; deferred to future).
8. On submission, an email shall be sent to `app_admin@divel.me` with the subject formatted as `[user subject] | DIVEL EDU QUIZ`.
9. Email content shall include the description, contact email, display name, and username.
10. On successful send, a confirmation screen shall be shown with a back button to Login (if not logged in) or Settings (if logged in).
11. On failure, a clear error message shall be displayed with the admin email as fallback.
12. Password reset emails shall be sent from `app_admin@divel.me` (configured via Firebase Console → Authentication → Email Templates; `divel.me` domain verified).

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Open Settings screen | "Contact Support" entry visible |
| Tap "Contact Support" (logged in) | Contact form opens, no username field |
| Open Login screen | "Contact Support" link visible |
| Tap "Contact Support" (logged out) | Contact form opens with mandatory username field |
| Submit without username (logged out) | Validation error: "Please enter your username" |
| Submit with all fields empty | Validation error shown for subject |
| Submit without description | Validation error shown for description |
| Enter description and count words to 500 | Word counter turns red; further typing truncated |
| Enter invalid email format | Validation error shown |
| Submit valid form | Success screen shown; email delivered to admin |
| Tap back on success (logged in) | Returns to Settings |
| Tap back on success (logged out) | Returns to Login |

---

## Feature 13 — Admin Panel

**User story:** As the app administrator, I want a protected admin panel so that I can manage user accounts, correct data errors, and maintain a full audit trail of all administrative actions.

**Acceptance Criteria:**

1. Admin access shall be controlled by the `admins/{uid}` Firestore collection — only UIDs present in this collection can access the panel.
2. A 🛡️ Admin tab shall appear in the bottom navigation only for admin users.
3. The admin panel shall support three actions: Reset Password, Merge Users, and Move Scores.
4. **Reset Password**: Admin shall be able to directly set a new temporary password for any user via a Cloud Function (Firebase Admin SDK). The admin enters and confirms a new password (min 6 characters); the user can then log in and change it. No recovery email is required for this action.
5. **Merge Users**: Admin shall be able to merge User A into User B. Best scores from both accounts shall be kept under User B. All of User A's sessions shall be transferred to User B. User A's profile shall be marked as merged.
6. **Move Scores**: Admin shall be able to move all sessions and high scores from User A to User B. Better scores are retained. User A's high scores are cleared after transfer. User A's account is left intact.
7. Every admin action must include a mandatory notes/reason field before confirmation.
8. Supporting document upload per action is deferred (requires Firebase Storage / Blaze plan).
9. Every action — successful or failed — shall be recorded in a Firestore `auditLog` collection with: timestamp, admin UID/username, action type, affected user UIDs/usernames, notes, outcome, and details.
10. The Audit Log tab shall display the 50 most recent entries, newest first, with outcome badge, action type, affected users, admin, details, and notes.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Log in as non-admin user | No Admin tab visible in nav |
| Log in as admin user | 🛡️ Admin tab visible in nav |
| Search for non-existent username | Error message shown |
| Search for valid username | User card displayed with action buttons |
| Click Reset Password without notes | Confirm button disabled |
| Click Reset Password, enter matching passwords ≥6 chars, add notes | Password set via Cloud Function; success message; audit entry logged |
| Click Reset Password with mismatched passwords | "Passwords do not match" error shown; confirm button disabled |
| Click Merge, select same user as User B | Error: cannot select same user twice |
| Complete Merge with notes | Sessions transferred, best scores merged; success message; audit entry logged |
| Complete Move Scores with notes | Sessions transferred, scores moved, User A scores cleared; audit entry logged |
| Upload supporting file on any action | File stored in Firebase Storage; link visible in audit log entry |
| Open Audit Log tab | Last 50 entries shown, newest first |
| Failed action | Audit entry with outcome = Failed and error detail recorded |

---

## Feature 14 — Delete Account

**User story:** As a user, I want to permanently delete my account and all my data, so that I can fully remove my presence from the app.

**Acceptance Criteria:**

1. A "Delete Account" button shall be accessible from the Profile screen.
2. Tapping "Delete Account" must show a confirmation panel with a clear warning before proceeding.
3. On confirmation, the following must be deleted: all game sessions, high scores, user profile, and username lookup record.
4. The Firebase Auth account must also be deleted, logging the user out automatically.
5. If the Firebase Auth deletion fails due to stale login (`auth/requires-recent-login`), a clear message must instruct the user to log out and back in first.
6. The action is irreversible — no undo.
7. The "Delete Account" button and confirmation panel must not be shown when the logged-in user is any admin (regular or super).

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Open Profile screen | "Delete Account" button visible below Log Out |
| Tap "Delete Account" | Confirmation panel shown with warning text and Yes/Cancel buttons |
| Tap "Cancel" | Confirmation panel dismissed, no action taken |
| Tap "Yes, Delete" | All user data deleted; user logged out; redirected to login screen |
| Log in with deleted username/password | Login fails (account no longer exists) |
| Attempt delete after long session without re-login | Error shown: "Please log out and log back in, then try again" |
| Open Profile screen as super admin | "Delete Account" button not visible |
| Open Profile screen as regular admin | "Delete Account" button not visible |

---

## Feature 15 — Admin: Delete User

**User story:** As the app administrator, I want to permanently delete any user account and all their data, so that I can handle account removal requests or remove invalid accounts.

**Acceptance Criteria:**

1. A "Delete User" button (styled in red) shall appear in the admin Users tab alongside the existing action buttons.
2. On selecting Delete User, a red warning panel shall describe the irreversible action.
3. A mandatory notes field must be filled before confirming.
4. On confirmation, all sessions, high scores, profile, and username lookup data shall be deleted from Firestore, then the Auth account shall be deleted via the `adminDeleteUser` Cloud Function.
5. A success or failure message shall be shown inline.
6. Every action — successful or failed — shall be recorded in the audit log.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Search for user, click Delete User | Red warning panel shown with notes field |
| Confirm without notes | Confirm button disabled |
| Confirm with notes | User data deleted; auth account deleted; success message; audit entry logged |
| Search for deleted username | "No user found" error |
| Failed delete | Error shown; failed audit entry logged |

---

## Feature 16 — Admin: Quiz Dashboard

**User story:** As the app administrator, I want to view all quiz sessions across all users with filters, so that I can monitor usage and identify patterns.

**Acceptance Criteria:**

1. A "📊 Dashboard" tab shall appear in the Admin Panel.
2. On opening the tab, sessions from the last 60 days shall be loaded automatically.
3. Filter controls shall include: date range (from/to), username, grade, operation, difficulty.
4. Filters can be applied individually or in combination.
5. A summary row shall show: total sessions, unique users, average score, average accuracy.
6. Each session row shall display: date/time, username, grade, operation (symbol), difficulty badge, score, and accuracy.
7. Results shall be capped at 500 per query. If the limit is reached, a notice shall prompt narrowing filters.
8. A "Reset" button shall restore all filters to defaults (last 60 days, all values).

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Open Dashboard tab | Sessions from last 60 days loaded; stats shown |
| Filter by username | Only that user's sessions shown |
| Filter by grade | Only that grade's sessions shown |
| Filter by operation | Only sessions with that operation shown |
| Filter by difficulty | Only sessions with that difficulty shown |
| Combine multiple filters | All filters applied together |
| Click Reset | All filters cleared; default date range restored |
| No sessions match filters | "No sessions found" message |
| 500+ sessions in range | "Showing first 500 results" notice shown |

---

## Feature 17 — Super Admin Role

**User story:** As the sole super admin, I want to manage who has admin access, so that I can grant or revoke admin privileges without touching the Firebase Console.

**Acceptance Criteria:**

1. The `admins/{uid}` Firestore document shall support an optional `role` field: `"super"` or `"admin"`. Documents without a `role` field are treated as regular admin.
2. Exactly one super admin shall exist. The super admin UID is set manually in Firestore Console by adding `role: "super"` to the relevant `admins/{uid}` document.
3. Super admin has all the same capabilities as regular admin (reset password, merge, move scores, delete user, dashboard, audit log).
4. Super admin additionally sees a 🔐 Admins tab — regular admins do not.
5. In the Admins tab, super admin can search for any user by username (4+ chars) and grant them admin access.
6. In the Admins tab, super admin can remove any regular admin. The super admin cannot remove themselves or any other superadmin.
7. The super admin cannot delete their own account via the Delete User action in the Users tab (the button is hidden when the searched user is the logged-in super admin).
8. Neither the super admin nor any regular admin may delete their own account via the Profile screen — the Delete Account button is hidden for all admin roles.
9. Regular admins can be zero or more — the super admin can operate alone.
10. **Regular admins must not be able to search for, view, or take action on other admin or superadmin accounts.** When a regular admin performs a user search (User A or User B), all UIDs present in the `admins` collection must be excluded from the results. Superadmins see all users in search.
11. Admin tab visibility must reflect the **currently logged-in user's** actual admin status. If a user logs out and a different user logs in within the same browser session, the admin tab must update to reflect the new user — it must not carry over state from the previous session.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Log in as super admin | 🔐 Admins tab visible in admin panel |
| Log in as regular admin | 🔐 Admins tab not visible |
| Log in as admin, log out, log in as non-admin in same browser | Admin tab not visible for the non-admin user |
| Log in as non-admin, log out, log in as admin in same browser | Admin tab visible for the admin user |
| Search own username in Users tab as super admin | Delete User button not shown |
| Open Profile screen as super admin | Delete Account button not shown |
| Open Profile screen as regular admin | Delete Account button not shown |
| Open Admins tab | Full list of admins with role badges shown |
| Search and add a regular user as admin | User appears in admin list with "Admin" badge |
| Remove a regular admin | Admin removed from list; they lose panel access on next login |
| Try to remove super admin entry | No Remove button shown for super admin row |
| Regular admin searches for another admin's username | No results returned for that username |
| Regular admin searches for superadmin's username | No results returned |
| Superadmin searches for any username (including admins) | Results include all matching users |

---

## Feature 18 — Social Studies Quiz

**User story:** As a student in Grade 3–12, I want to take a Social Studies quiz covering US and Colorado curriculum so that I can practise outside of maths.

**Acceptance Criteria:**
1. A "Social Studies" subject card shall appear on the Home screen alongside "Mental Maths"; it is accessible to all users regardless of profile grade.
2. The setup screen shall include a **grade selector** restricted to Grades 3–12 (the only grades with question content); it defaults to the user's profile grade (clamped to 3 if below).
3. Grade is per-quiz — changing the grade on the setup screen does not affect the user's profile.
4. Each quiz session shall present 20 questions drawn randomly from the `socialStudiesQuestions` Firestore collection for the **selected** grade.
5. Questions shall have four answer options (A–D) presented in a **randomised order** (shuffled independently per question at fetch time, regardless of the order stored in Firestore); the correct answer shall be revealed immediately after selection.
6. After selecting an answer, the correct option shall highlight green and any wrong selection shall highlight red; the next question shall load automatically after 1.2 seconds.
7. Score increments by 5 points per correct answer (max 100).
8. A running score and question counter shall be visible throughout the quiz.
9. On completion, a results screen shall show: score, correct/total, accuracy %, best streak, and a review of all incorrectly answered questions with the correct answers shown.
10. A performance emoji and message shall be shown based on accuracy (≥90% 🏆, ≥75% 🌟, ≥60% 👍, ≥40% 💪, else 😔).
11. An "End Game" button shall be available during the quiz; tapping it shall end the session early, save the partial session (if at least 1 question was answered), and navigate to the results screen.
12. Each completed or early-ended session shall be saved to the shared `sessions` Firestore collection with `subject: 'socialStudies'`.
13. "Play Again" shall return to the setup screen; "Home" shall return to the Home screen.
14. Questions seen in previous sessions for the same grade shall be deprioritised in subsequent sessions (cross-session deduplication); when fewer than 20 unseen questions remain for the grade the full pool is used, acting as an automatic reset once the student has worked through all questions.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Log in as any user (any grade) | Social Studies card enabled on Home |
| Tap Social Studies card | Setup screen shows grade selector (3–12), 20 questions, US+Colorado curriculum |
| Change grade on setup screen | Selected grade updates without affecting profile |
| Tap Start Quiz | 20 questions for selected grade load; first question displayed |
| Select correct answer | Option highlights green; after 1.2 s next question loads; score +5 |
| Select wrong answer | Selection highlights red, correct answer highlights green; after 1.2 s advances |
| Complete all 20 questions | Results screen shown with score, accuracy, streak, and review |
| Tap End Game at question 5 | Session ends; 5 answered questions saved to Firestore; results screen shown |
| Check Firestore | Session doc with `subject: 'socialStudies'` written |
| Tap Play Again | Returns to setup screen |
| Tap Home | Home screen shown |
| Complete a session, start another | Questions from the first session do not reappear until all 80 grade questions have been seen |
| Complete 4 sessions (all 80 questions seen) | Next session draws from full pool again (natural reset) |

---

## Feature 19 — Word-O-Meter (Wordle-style vocabulary game)

**User story:** As a student in any grade (KG–12), I want to guess a hidden word using colour-coded letter feedback so that I can build vocabulary while having fun.

**Acceptance Criteria:**
1. A "Word-O-Meter" subject card shall appear on the Home screen alongside Mental Maths and Social Studies.
2. The setup screen shall include a **grade selector** (KG–12) and a **letter count selector** showing only the counts available for the chosen grade (3–5 for KG–2, 4–6 for Gr 3–5, 5–7 for Gr 6–8, 6–8 for Gr 9–12).
3. Grade and letter count are per-quiz and do not affect the user's profile.
4. The game shall give the player exactly **N attempts** equal to the letter count (square grid). A 3-letter word gets 3 attempts, a 5-letter word gets 5 attempts, etc.
5. After each guess, each tile shall be colour-coded: green (correct letter, correct position), yellow (correct letter, wrong position), grey (letter not in the word).
6. The player shall type guesses using an on-screen QWERTY keyboard or a physical keyboard. Each key on the on-screen keyboard shall reflect the best state seen so far (green > yellow > grey). The on-screen **⌫** (delete) key shall be visually distinct (rose-coloured, wider); the physical Backspace key shall also delete the last typed letter without triggering browser back-navigation.
7. Submitting a guess with fewer letters than the required count shall show an error message and shake the current row. Submitting a guess that is not a valid English word shall show an error "Not a valid English word" (validated locally against the SOWPODS word list, dynamically imported per letter count; load failures are treated as invalid — the guess is rejected). A "Checking word…" indicator is shown while validation is in progress.
8. Hint types available during play (not all types available for every word): Part of Speech, Vowel Count, Synonym, Antonym, First Letter, Last Letter, Middle Letter, Word Blend. **Hint limit: 3–5 letter words → 1 hint max; 6–8 letter words → 2 hints max.** Once the limit is reached all remaining hint buttons are disabled.
9. Each hint used shall be displayed as text below the grid for the remainder of the session.
10. Scoring: win = max(10, 100 − (attempts−1) × 12 − hints × 8); loss = 0. Maximum score is 100 (first attempt, no hints).
11. When the game ends (won or lost), a 1.6-second pause shall show the final grid state, then navigate to the results screen.
12. The results screen shall display: the word (UPPERCASE), its definition(s), a compact replay grid, score, attempts used, hints used, and part of speech + synonyms.
13. An **End Game** button shall be available at all times during play. If at least 1 guess was made, the partial session is saved and the player is taken to results.
14. Each completed or early-ended session shall be saved to the shared `sessions` Firestore collection with `subject: 'wordOMeter'`.
15. Words seen in previous sessions for the same letter count shall be deprioritised (cross-session deduplication via localStorage, cap 60 per letter count); once all words have been seen the full pool is reused.
16. "Play Again" shall return to the setup screen (grade and letter count remembered); "Home" returns to Home.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Log in as any user | Word-O-Meter card visible on Home |
| Tap Word-O-Meter | Setup screen with grade selector and letter count buttons |
| Select Grade KG | Letter count buttons show 3, 4, 5 |
| Select Grade 9 | Letter count buttons show 6, 7, 8 |
| Tap Start Game | Game screen shows N×N square tile grid + keyboard |
| Start 3-letter game | Grid is 3 rows × 3 columns (3 attempts) |
| Start 7-letter game | Grid is 7 rows × 7 columns (7 attempts) |
| Type junk letters and tap ✓ | Error "Not a valid English word"; row shakes |
| Type 3 letters and tap ✓ | Error "Enter a 5-letter word" (for 5-letter game); row shakes |
| Press physical Backspace | Last typed letter deleted (no browser back navigation) |
| Tap ⌫ on-screen key | Last typed letter deleted; key is rose-coloured and wider than letter keys |
| Type correct-length guess | Tiles colour-code green/yellow/grey correctly |
| Guess the correct word | Row turns all green; 1.6 s delay; results screen with score ≥ 10 |
| Exhaust all N attempts | Results screen shows the word revealed, score 0 |
| Tap First Letter hint (3-letter word) | Hint shown; all remaining hint buttons disappear (1-hint limit) |
| Tap 2nd hint (7-letter word) | Second hint shown; all remaining hint buttons disappear (2-hint limit) |
| Check score after win with 2 attempts + 1 hint | Score = max(10, 100 − 12 − 8) = 80 |
| Tap End Game after 2 guesses | Session saved; results screen shown |
| Tap End Game before any guess | No session saved; results screen shown |
| Check Firestore | Session doc with `subject: 'wordOMeter'`, `won`, `attemptsUsed`, `score` |
| Check History | Session listed as "Word-O-Meter" with ✓ Solved / ✗ Not solved |
| Complete 60 sessions for same letter count | Next session still shows a word (pool resets) |
| Tap Play Again | Setup screen; same grade + letter count pre-selected |

---

## Feature 20 — Science Quiz

**User story:** As a student in Grade 5–12, I want to answer multiple-select science questions covering Biology, Chemistry, Physics, and Earth Science so that I can test and expand my science knowledge.

**Acceptance Criteria:**
1. A "Science" subject card shall appear on the Home screen alongside Mental Maths, Social Studies, and Word-O-Meter.
2. The setup screen shall include a **grade selector** (Grades 5–12 only). The default grade comes from the user's profile (clamped to the Science range).
3. Grade is per-quiz and does not affect the user's profile grade.
4. Each session shall draw 20 questions from a cumulative pool covering **Grades 5 through the selected grade** (e.g. selecting Grade 8 pulls from Grades 5, 6, 7, and 8).
5. Questions are **multiple-select**: one or more of the four options may be correct. Questions with multiple correct answers shall display a "Select all that apply" badge.
6. The player selects any number of options (toggle), then taps **Check Answer** to submit. The submission button shall be disabled until at least one option is selected.
7. After submission, correct options highlight green and incorrectly selected options highlight red. The player cannot change their answer after submitting.
8. After a 2-second reveal, the game auto-advances to the next question.
9. An **End Game** button shall be available at all times. If at least 1 question was answered, the partial session is saved to Firestore and the results screen is shown.
10. Scoring: 5 points per fully-correct answer (all required options selected, no extras); 0 for a partial or wrong answer. Maximum score is 100 (20 × 5).
11. The results screen shall display: emoji + message, total score (out of 100), correct count, accuracy %, best streak, and a scrollable review of incorrect answers with the correct option(s) shown.
12. "Play Again" returns to the setup screen. "Home" returns to Home.
13. Each completed or early-ended session shall be saved to the shared `sessions` Firestore collection with `subject: 'science'`.
14. Cross-session deduplication via localStorage (key `mm_sci_seen_<grade>`, cap 100): unseen questions are preferred; once all 100 recently-seen IDs fill the cap the full pool is reused.
15. Science shall be available as a **multiplayer challenge subject**: host selects Science in `ChallengeCreateScreen`; all players answer the same 20 pre-fetched questions; live leaderboard via Firestore `onSnapshot`.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Log in as any user | Science 🔬 card visible on Home |
| Tap Science | Setup screen with grade selector (Grades 5–12) and Start Quiz button |
| Profile grade is Grade 3 | Setup screen defaults to Grade 5 (clamped) |
| Select Grade 7, tap Start Quiz | 20 questions loaded from Grades 5–7 pool |
| Question with 2 correct answers | "Select all that apply" badge shown |
| Tap one option | Option highlights orange (selected); Check Answer becomes active |
| Tap Check Answer | Correct options highlight green; wrong selections highlight red |
| Answer correct question | Score increases by 5 |
| Wait 2 seconds after reveal | Game auto-advances to next question |
| Complete all 20 questions | Results screen shown with score, correct count, accuracy, streak |
| Tap End Game at question 5 | Session saved (5 questions); results screen shown |
| Tap End Game before answering any question | No session saved; results screen shown |
| Check Firestore | Session doc with `subject: 'science'` written |
| Complete a session, start another | Questions from the first session are deprioritised |
| Complete 5 sessions (100 questions seen) | Pool resets; questions reappear |
| Tap Play Again | Returns to setup screen |
| Tap Home | Home screen shown |
| Create challenge with Science subject | Challenge created; lobby shows Science |
| All players complete Science challenge | Results screen with leaderboard |

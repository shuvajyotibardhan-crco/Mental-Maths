# Mental Maths — Requirements

## Overview
Mental Maths is a web-based arithmetic practice app for kids and students (KG–Grade 12). Players log in with a username and password, configure a game session by selecting grade, operation, difficulty, and mode, then answer questions generated at the appropriate level. Scores, streaks, and session history are tracked per user, with personal and global high score leaderboards.

## Scope

### In Scope
- Username/password authentication (no OAuth)
- Question generation for 13 grade levels (KG–12) across 8 operation types
- Two game modes: timed (2 minutes) and fixed (20 questions)
- Scoring with streak and speed multipliers
- Personal and global high score tracking
- Session history with filters
- In-app password change and optional recovery email for password reset
- Sound effects toggle

### Out of Scope
- Native iOS/Android app (future)
- Email-based reset for child Google accounts via Cloud Functions (future)
- Multiplayer or head-to-head modes
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
6. Hint text shall warn that recovery email must be an adult account and must not be used by another account in the app.
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
4. If no recovery email is on file, a clear message shall explain this and suggest asking a parent if it is a child account.
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

**User story:** As a player, I want to choose the operation type, difficulty, and game mode before starting so that I can practise what I need.

**Acceptance Criteria:**
1. Operation options must include: Addition, Subtraction, Multiplication, Division, Percentage, Square Root, Power, and Mix.
2. Operations not appropriate for the user's grade shall not be shown.
3. Difficulty options shall be: Easy, Medium, Hard.
4. Mode options shall be: Timed (2 minutes) and Fixed (20 questions).
5. All three selections are required before the Start button is enabled.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Open Game Setup as KG user | Only Addition and Subtraction shown |
| Open Game Setup as Grade 6 user | All operations shown |
| Tap Start without selecting operation | Button disabled or error |
| Select all options and tap Start | Game screen opens with correct config |

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
9. Score and current streak shall update in real time.
10. Streak indicator shall only appear when streak ≥ 3.
11. An "End Game" button must be available to finish early.
12. On timer expiry (timed mode) or last question (fixed mode), game shall end automatically.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Start timed game | 2:00 countdown begins, progress bar full |
| Answer correctly | Green feedback, score increases, streak increments |
| Answer incorrectly | Orange feedback with correct answer, streak resets |
| Timer reaches 0 | Game ends, Results screen shown |
| Answer 20th question in fixed mode | Game ends, Results screen shown |
| Press End Game early | Game ends, Results screen shown with questions answered so far |
| Enter negative number | Minus sign accepted, correct calculation evaluated |
| Use keyboard numpad | Input accepted identically to on-screen pad |

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

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Complete game with > 80% accuracy | 3-star rating shown |
| Beat personal best | "🏆 Personal Best!" banner displayed |
| Beat global best | "🌍 Global #1!" banner displayed |
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

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Toggle sound off, play a game | No sound effects during gameplay |
| Reload app | Sound preference retained |
| Open Settings | Version number visible |

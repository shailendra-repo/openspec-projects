# Auth and local storage notes

## Local-only authentication
- Accounts are local to this device and stored in the app SQLite database (`DB/planner.sqlite`).
- Passwords are hashed with a per-user salt using Node `crypto.scryptSync` (not stored in plaintext).
- Login verifies credentials locally via the local web server; no network/cloud services are used.
- Duplicate usernames (case-insensitive) are rejected.
- Invalid credentials return a generic error ("Invalid username or password") without sensitive detail.
- Logout clears the server-managed web session and returns the UI to the unauthenticated state.

## Web sessions (local web runtime)
- Authenticated sessions are managed by the local Node server using an HTTP-only cookie (`cookie-session`).
- Default implementation uses in-memory session state; sessions may be cleared if the server restarts.
- Protected planner API routes require an authenticated session and are scoped to the session's user.

## Data storage
- Primary store: SQLite database file in app folder `DB/` (`DB/planner.sqlite`), accessed by the local server.
- Existing `DB/planner.sqlite` data/accounts are preserved and reused by the web runtime (idempotent schema initialization, no reset).
- IndexedDB is not used for primary planner/account data.
- Planner entities (lists, tasks, subtasks/checklist JSON, tags, task-tag links, due/reminder/order fields) and per-user theme preference are scoped by `user_id`.

## Verification (automated/scripted)
- `npm test`: SQLite store init/schema/CRUD/per-user isolation/theme persistence (`src/db/sqlite-store.test.js`), auth create/duplicate/login checks (`src/db/auth.test.js`), and web API auth/session/route protection/cross-user isolation checks (`src/db/api.test.js`).
- `npm run build`: client build passes.
- Server start/smoke check: local server serves session API (e.g. `GET /api/auth/session` returns unauthenticated state when no session).
- Existing `DB/planner.sqlite` preserved on disk (not reset by implementation).

## Limitations
- Local device/localhost security model applies (no remote auth, no cloud services).
- In-memory sessions may not persist across server restarts.
- Reminders are best-effort and depend on browser notification permissions and runtime behavior while the app is in use.
- Full browser-based end-to-end manual testing (including preserved-account login and UI flows) is recommended for final sign-off.

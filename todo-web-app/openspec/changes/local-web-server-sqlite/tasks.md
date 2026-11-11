# Tasks

## 1. Local web server runtime and scripts

- [x] 1.1 Add local web server dependencies and create a server entrypoint that starts a local HTTP server, serves the built React client, and exposes JSON API routes for auth and planner operations; verify the server starts with the documented command and serves the app at a local browser URL (e.g. `http://localhost:<port>`).
- [x] 1.2 Update npm scripts and project configuration for browser-based local usage (e.g. `start`/`server` and dev workflow) and document the run/open steps in developer docs; verify the documented commands start the app for browser access without requiring Electron.

## 2. SQLite data store reuse and preservation

- [x] 2.1 Adapt/reuse existing SQLite, auth, and planner service modules for server-side use (`DB/` path resolution, idempotent schema initialization, CRUD/auth logic) so the server reads/writes the existing `DB/planner.sqlite` file; verify with an existing database present that accounts and planner data remain accessible (no reset/migration away from the file).
- [x] 2.2 Implement server-side data access wiring for all planner operations (load state, save/delete tasks/lists/tags, theme preference) scoped to the authenticated user and backed by `DB/planner.sqlite`; verify automated/scripted tests cover initialization against existing DB, CRUD operations, and per-user isolation through the server/service layer.

## 3. Web authentication and session handling

- [x] 3.1 Implement local web auth endpoints and session handling (register, login, logout, session check) using server-managed sessions (e.g. HTTP-only cookie/session, in-memory by default unless implemented otherwise) with credential verification against SQLite; verify register/login/logout/session behavior, duplicate rejection, invalid-credential handling, and unauthenticated access denial via API/scripted tests.
- [x] 3.2 Protect planner API routes so only the authenticated session's user can access or mutate their data and return appropriate errors when unauthenticated; verify tests or scripted checks confirm route protection and cross-user isolation over the web API boundary. Document local auth/session behavior and limitations.

## 4. Browser client integration and UI adaptation

- [x] 4.1 Replace the Electron/IPC renderer adapter with a browser HTTP API client and refactor app state/loading flows to use server APIs and web session state (login/register, session restore, logout, planner data operations); verify login, logout, and core planner CRUD/organization/planning flows work in the browser against the local server.
- [x] 4.2 Update UI/runtime assumptions for the web app (remove Electron-only availability checks/copy where inappropriate, keep auth gating, planner workspace, and light/dark theming with per-user persistence/default behavior) and ensure auth/planner screens are usable in both themes; verify theme toggle/persistence and auth gating behavior in browser sessions.
- [x] 4.3 Add/adjust client integration or scripted verification for key browser flows (session/auth gating, data operations via API, theme preference persistence) and document any environment-specific verification steps; verify checks pass or documented manual steps are reproducible.

## 5. Electron removal and documentation

- [x] 5.1 Remove or de-scope Electron from the primary runtime path (Electron entrypoints/scripts/dependencies and desktop-only assumptions) while retaining any reusable server-side modules as needed; verify the supported workflow runs without launching Electron and project scripts/docs no longer present Electron as the primary way to use the app.
- [x] 5.2 Update README and relevant docs to describe the local web server architecture, how to start/open in browser, SQLite storage in `DB/` (preserved existing data/accounts), multi-user login/session behavior, reminder limitations, and theme behavior; verify documentation matches implemented commands and behavior.

## 6. Integration verification

- [x] 6.1 Perform an end-to-end integration pass using the preserved/existing `DB/` environment and a clean-start scenario as applicable: start local server, open in browser, verify existing account/data access (where present), login/logout, per-user isolation, capture→organize→plan→complete flows, best-effort reminders, and theme behavior; verify core scenarios from the change specs are satisfied and record results/issues.
- [x] 6.2 Run automated tests and build checks for the updated web app/server implementation and fix regressions; verify `npm test` (or documented test command) and build/start commands complete successfully.

## Workflow follow-up

- Review the planning artifacts and implementation results for this change before archiving.
- When ready, archive the change with `/opsx-archive` (or `openspec archive`) and verify the archived result.

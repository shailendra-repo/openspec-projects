# Design

## Context

The application currently runs as an Electron desktop app with a React renderer, preload/IPC boundary (`window.plannerAPI`), and privileged main-process access to a SQLite database at `DB/planner.sqlite` (`electron/main.cjs`, `electron/preload.cjs`, `electron/db.cjs`, `electron/service.cjs`, `electron/auth.cjs`). It supports local multi-user accounts, login/logout, per-user planner data, and per-user theme preference stored in SQLite. The user wants a browser-accessed local web application instead of Electron, while keeping the same physical `DB/` SQLite file, existing data, and multi-user login. Motivation and scope are defined in `proposal.md` (see **Why** and **What Changes**); requirements are defined in the delta specs under `specs/`.

Constraints: local-only (no cloud hosting/remote services), preserve existing `DB/planner.sqlite` data/accounts, keep SQLite in app folder `DB/`, run as a local server used in browser, remove Electron.

## Goals / Non-Goals

**Goals:**
- Provide a local server-hosted web runtime (browser UI + local HTTP API + server-side SQLite access) that replaces Electron as the application boundary.
- Preserve and continue using the existing `DB/planner.sqlite` database, schema-compatible data, user accounts, and per-user planner/preferences data.
- Preserve local multi-user authentication, per-user data isolation, core planner capabilities, and theming behavior in the web context.
- Remove Electron-specific runtime dependencies and workflows from the primary application path.

**Non-Goals:**
- Remote/cloud deployment, multi-device sync, or external identity providers.
- Migrating data away from the existing SQLite file or resetting existing accounts/data.
- Introducing new planner features beyond what is required to maintain current behavior in the web runtime.
- Guaranteed reminder delivery beyond browser/runtime best-effort constraints.

## Decisions

### 1. Local Node web server as the runtime boundary
- **Decision**: Implement a local Node.js server (e.g. Express or equivalent lightweight HTTP framework chosen in implementation) that serves the built web client and exposes JSON HTTP API endpoints for auth and planner operations. The browser client calls these APIs instead of `window.plannerAPI`/IPC.
- **Rationale**: Enables browser access while retaining server-side filesystem access to `DB/planner.sqlite` and centralizing auth/data scoping logic.
- **Alternatives considered**:
  - **Keep Electron**: rejected by user preference.
  - **Browser-only app with IndexedDB/OPFS**: cannot reliably preserve/use the existing physical `DB/planner.sqlite` in app folder as requested. Rejected.

### 2. Reuse and adapt existing SQLite/auth/service logic
- **Decision**: Reuse the existing database initialization, schema, and service logic in `electron/db.cjs`, `electron/auth.cjs`, and `electron/service.cjs` (relocating/renaming to a runtime-neutral server location if appropriate) so the same SQLite file, tables, hashing, and per-user operations continue to work. Remove Electron IPC wiring and session state from `electron/main.cjs`.
- **Rationale**: Preserves existing `DB/planner.sqlite` data/accounts with minimal risk and avoids unnecessary schema changes.
- **Alternatives considered**:
  - **Rewrite storage/auth from scratch**: higher risk to data compatibility and behavior. Rejected.
  - **Change schema/file location**: violates "keep SQLite in DB/" and preservation requirement. Rejected.

### 3. Web session management for local multi-user login
- **Decision**: Replace in-memory Electron `currentUser` session with server-managed web sessions (e.g. signed HTTP-only session cookie + server-side session store/memory or SQLite-backed session table as implementation chooses) scoped to localhost usage. Protect planner/authenticated API routes so unauthenticated requests are denied; logout destroys the session.
- **Rationale**: Preserves login/logout and per-user access control in browser context while keeping auth local-only.
- **Alternatives considered**:
  - **Trust client-provided user identity**: insecure and breaks access control. Rejected.
  - **Stateless tokens without server validation context**: unnecessary complexity; server session is sufficient for local-only app. Rejected for MVP.

### 4. Client integration via HTTP API client
- **Decision**: Replace `src/store/planner.js` Electron API adapter with a browser `fetch`/HTTP client that calls local server endpoints (auth: register/login/logout/session; data: load state, save/delete tasks/lists/tags, save theme preference). Preserve existing UI behavior and state management patterns where possible.
- **Rationale**: Minimizes UI churn while switching runtime boundaries.
- **Alternatives considered**:
  - **Direct DB access from browser**: not possible/secure. Rejected.

### 5. Run/build workflow for local browser usage
- **Decision**: Add server entrypoint and npm scripts for local web usage (e.g. `npm run start` or `npm run server` to run backend and serve app at a local URL; keep Vite build/dev workflows adapted as needed). Document how to start and open in browser. Remove Electron as the primary run path and de-scope Electron-specific scripts/dependencies from required usage.
- **Rationale**: Meets "local server in browser" requirement with a clear developer/user workflow.
- **Alternatives considered**:
  - **Require Electron to host web content**: contradicts request. Rejected.

### 6. Preserve data and compatibility
- **Decision**: Treat `DB/planner.sqlite` as a preserved artifact: do not delete/reset it; ensure server resolves the same app-folder `DB/` path and uses compatible schema initialization (idempotent/create-if-missing behavior only). Existing users, tasks, lists, tags, and preferences remain accessible after login.
- **Rationale**: Explicit user requirement.
- **Alternatives considered**:
  - **Fresh database**: rejected (would lose existing data). Rejected.

### 7. Local-only security posture
- **Decision**: Keep credential hashing/verification local in SQLite, avoid plaintext password storage/logging, and apply reasonable localhost web protections in design/implementation (HTTP-only session cookies, input validation, authenticated route checks). Do not add cloud/remote dependencies.
- **Rationale**: Maintains current local-only security intent in a browser/server context.
- **Alternatives considered**:
  - **Remote auth/services**: out of scope. Rejected.

## Risks / Trade-offs

- [Session/security differences between Electron and browser] → Use server-side sessions, HTTP-only cookies, and authenticated API guards; document localhost/local-device threat model.
- [Accidental data loss or wrong DB path] → Resolve `DB/` relative to app root consistently, avoid destructive initialization, and verify against existing `DB/planner.sqlite` during implementation.
- [API contract drift breaking UI behavior] → Reuse existing service method semantics and add/adjust tests for API/auth/data flows.
- [Port conflicts when starting local server] → Use configurable/default port and clear startup/log messaging.
- [Reminder behavior differs in browser vs desktop runtime] → Keep reminders best-effort with explicit UI messaging and rely on due dates/views as fallback.
- [Residual Electron files/config causing confusion] → Remove or clearly deprecate Electron-specific entrypoints/scripts/docs as part of implementation tasks.

## Migration Plan

- **Implementation (planned)**:
  1. Add local web server entrypoint, dependencies, and scripts; configure serving of client and JSON APIs.
  2. Adapt/reuse SQLite, auth, and planner service modules for server-side use against existing `DB/planner.sqlite` (preserve data/schema compatibility).
  3. Implement web auth/session endpoints and route protection; replace client IPC adapter with HTTP API client.
  4. Refactor UI/runtime assumptions for browser (remove Electron-only checks/flows) while preserving login, planner, and theming behaviors.
  5. Remove Electron-specific runtime wiring from primary path (main/preload/IPC usage, desktop scripts/docs), update tests/docs, and verify with existing DB preserved.
- **Rollback**: Revert to the Electron-based implementation and scripts; existing `DB/planner.sqlite` remains on disk (preserved).
- **Operational notes**: Startup changes from desktop app launch to local server + browser URL; existing local accounts/data in `DB/planner.sqlite` are retained.

## Open Questions

- **Session persistence across server restarts**: Use in-memory sessions (simple, logs users out on restart) or SQLite-backed/persistent sessions (better continuity). Either is acceptable if auth/security requirements are met; default assumption is in-memory sessions unless implementation favors persistence.
- **Specific server framework**: Express vs minimal Node HTTP framework (choice can be finalized in implementation based on simplicity and existing dependencies).

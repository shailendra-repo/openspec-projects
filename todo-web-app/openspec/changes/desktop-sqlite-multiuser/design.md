# Design

## Context

The current implementation is a local-only browser SPA (Vite + React) that persists planner data in IndexedDB via `idb` (`src/db/database.js`, `src/db/repository.js`, `src/store/planner.js`). It is single-user, has no authentication, and stores theme preference in IndexedDB meta. Main specs for `task-management`, `task-organization`, `task-planning`, and `user-interface` define existing behavior; this change revises that behavior for a desktop multi-user model with file-based SQLite storage.

Motivation and scope are defined in `proposal.md` (see **Why** and **What Changes**). Requirements are defined in the delta specs under `specs/user-authentication/spec.md`, `specs/local-data-store/spec.md`, `specs/task-management/spec.md`, `specs/task-organization/spec.md`, `specs/task-planning/spec.md`, and `specs/user-interface/spec.md`.

Constraints and clarifications (user-provided): desktop local app; SQLite replaces IndexedDB entirely; database stored physically in an app-folder `DB/` directory; no migration of existing browser data; local-only; multiple people can log in and set up their own tasks.

## Goals / Non-Goals

**Goals:**
- Deliver a desktop local application that stores all primary account and planner data in a physical SQLite database under `DB/` in the app folder.
- Provide local multi-user authentication (account creation, login/logout, session control) with per-user data isolation for tasks, lists/projects, tags, subtasks, scheduling metadata, ordering, and relevant preferences.
- Preserve core focused-planner capabilities (capture, organize, plan, complete) and light/dark theming while adapting them to authenticated, per-user, SQLite-backed operation.
- Keep the system local-only with no cloud sync, remote auth, or migration from prior IndexedDB data.

**Non-Goals:**
- Migrating/importing existing browser IndexedDB data.
- Cloud sync, remote services, or cross-device account access.
- Enterprise IAM features (SSO, roles/permissions beyond basic user isolation, password recovery via email/remote channels) unless later specified.
- Guaranteed reminder delivery outside desktop/runtime constraints.

## Decisions

### 1. Desktop runtime: Electron (assumed default)
- **Decision**: Implement the desktop app using **Electron** as the default runtime, with the existing React UI rendered in the renderer process and SQLite/filesystem access handled in the main process (or a privileged preload-exposed API). Final framework selection may be adjusted during implementation if an equivalent local-desktop stack better fits the repo, but the design assumes Electron-style process separation and Node access.
- **Rationale**: Electron provides straightforward local filesystem access for an app-folder `DB/` path, mature SQLite library options in Node, and a clear path to reuse much of the current React UI.
- **Alternatives considered**:
  - **Tauri**: lighter footprint and strong security model, but requires Rust integration and different IPC/storage patterns; viable alternative if chosen, but higher adaptation cost from current Node/Vite setup. Deferred as implementation option.
  - **Keep browser app + WASM SQLite/File System Access API**: browser access to a stable arbitrary app folder and multi-user desktop-like behavior is limited/inconsistent; does not satisfy "desktop local app" intent. Rejected.

### 2. SQLite as sole primary data store in `DB/`
- **Decision**: Use a single SQLite database file (e.g. `DB/planner.sqlite`) under the application folder's `DB/` directory. Create the `DB/` directory and initialize schema on first run if missing. Remove IndexedDB as the primary planner/account store.
- **Rationale**: Meets "physical SQLite database on the local folder" requirement and supports relational per-user data isolation and durable local storage.
- **Alternatives considered**:
  - **One DB file per user**: simpler isolation boundaries but more file management; a single DB with `user_id` scoping is sufficient for local-only multi-user needs. Rejected for initial simplicity.
  - **Keep IndexedDB fallback**: conflicts with "replace IndexedDB" requirement. Rejected.

### 3. Per-user schema and data isolation
- **Decision**: Model users and all user-owned entities in SQLite with explicit ownership (e.g. `users` table plus `tasks`, `lists`, `tags`, task-tag relations, subtasks/checklist data, reminders/scheduling fields, and per-user preferences/settings keyed by `user_id`). All queries/mutations for planner data MUST be scoped to the authenticated user.
- **Rationale**: Enforces isolation required for multiple local logins and keeps data consistent across views.
- **Alternatives considered**:
  - **Shared/global planner tables without ownership**: would leak data across users. Rejected.
  - **In-memory filtering only**: unsafe/incomplete if storage is shared. Rejected.

### 4. Local authentication and session handling
- **Decision**: Support local account creation and credential-based login. Store credentials locally using a strong password hash with per-user salt (algorithm/library chosen in implementation, e.g. bcrypt/argon2/scrypt via Node dependency) rather than plaintext. Maintain an authenticated session in app runtime state; provide logout to clear session and return to unauthenticated UI. No remote identity provider.
- **Rationale**: Satisfies multi-user local login requirement while avoiding plaintext credential storage and network dependencies.
- **Alternatives considered**:
  - **Plaintext passwords**: insecure and unacceptable. Rejected.
  - **OS-level user accounts only (no in-app login)**: does not provide requested in-app multi-user login/task setup within the app. Rejected.

### 5. Renderer-to-data access boundary
- **Decision**: Expose a narrow, explicit data/auth API from the privileged layer (Electron main/preload) to the renderer (IPC handlers/invocations) for auth operations and CRUD/query operations. The renderer UI (React) consumes this API instead of direct filesystem/SQLite access.
- **Rationale**: Aligns with desktop security practices (least privilege in renderer) and centralizes user scoping, validation, and database access.
- **Alternatives considered**:
  - **Enable Node integration directly in renderer**: simpler wiring but weaker security posture. Rejected.

### 6. UI flow and preference handling in multi-user context
- **Decision**: Add unauthenticated entry UI (login/account creation) and gate planner workspace behind successful authentication; add logout control in app shell. Theme behavior remains (toggle, immediate apply, system-aware default when no saved preference, persisted locally) but persistence is stored in SQLite and restored per user context (with a safe fallback default if needed before login).
- **Rationale**: Meets `user-interface` and `user-authentication` requirements while preserving existing theming UX.
- **Alternatives considered**:
  - **Global device-only theme with no per-user persistence**: simpler but loses per-user preference; per-user persistence is preferred and compatible with SQLite store. Rejected as default.

### 7. No migration of browser data
- **Decision**: Do not read or migrate existing IndexedDB/browser-profile data. New desktop SQLite store starts empty aside from initialized schema; users create accounts and data in the desktop app.
- **Rationale**: Explicitly required by user; avoids complex cross-runtime migration.
- **Alternatives considered**:
  - **One-time import/migration tool**: out of scope. Rejected.

### 8. Reminders in desktop runtime
- **Decision**: Keep reminders optional and best-effort using desktop/runtime notification capabilities available in the chosen framework (e.g. Electron notifications), with permission/availability checks and clear fallback messaging; no server-side scheduling.
- **Rationale**: Preserves planning capability intent under new runtime while acknowledging platform constraints.
- **Alternatives considered**:
  - **Guaranteed background scheduling service**: conflicts with local-only/no-server constraint and adds complexity. Rejected.

## Risks / Trade-offs

- [Desktop framework/tooling complexity vs current web setup] → Start with a clear Electron-based structure and isolate runtime/IPC concerns; keep React UI reuse high.
- [Credential security in local-only app] → Use salted password hashing, avoid plaintext secrets/logging, and keep auth checks centralized; acknowledge local-device threat model limits in docs.
- [Data isolation bugs across users] → Enforce `user_id` scoping in every data access path, add verification/tests for cross-user isolation.
- [`DB/` path/permissions issues in app folder] → Validate/create directory on startup, handle file/permission/lock errors with user-visible messages, and document expected location.
- [SQLite concurrency/locking in desktop usage] → Use safe access patterns (serialized writes where appropriate, short transactions) suitable for single-app local usage.
- [Loss of prior browser data due to no migration] → State clearly in UI/docs and release notes that desktop SQLite storage is separate and existing browser data is not imported.
- [Reminder behavior differences vs browser] → Treat as best-effort in desktop runtime and keep in-app due-date views as reliable fallback.

## Migration Plan

- **Implementation (planned)**:
  1. Introduce desktop runtime shell (Electron assumed) and build/run scripts alongside or replacing current web-only dev flow.
  2. Add SQLite layer, `DB/` initialization, and schema for users/accounts and per-user planner entities/preferences.
  3. Implement local auth flows (account creation/login/logout/session) and gate data access by authenticated user.
  4. Replace IndexedDB-based persistence/store logic with SQLite-backed APIs/IPC and adapt UI state loading/saving.
  5. Update UI for auth screens and logout control; preserve theming and core planner flows per updated specs.
  6. Verify per-user isolation, local DB file creation in `DB/`, and core planner/reminder/theming behaviors; update documentation.
- **Rollback**: Revert to the previous browser/IndexedDB implementation and build artifacts; the new `DB/` SQLite file (if created) is separate local data and is not auto-migrated back.
- **Operational notes**: Because storage moves to app-folder `DB/` and no migration is performed, communicate this as a breaking change for existing browser-stored data.

## Open Questions

- **Account creation policy**: Should account creation be open from the login screen, restricted to a first-run/setup flow, or managed by a local admin mechanism? (Affects UI and acceptance details; reasonable default: allow local sign-up from login screen unless constrained.)
- **Theme scope**: Should theme preference be strictly per-user (stored in user settings) or have a device-level pre-login default? (Design assumes per-user persistence after login with system/default fallback when unknown.)
- **Desktop framework confirmation**: Use Electron as assumed, or prefer Tauri if the implementation environment favors it? (Either can satisfy specs if behavior and `DB/` SQLite storage requirements are met.)

# Tasks

## 1. Desktop runtime and project adaptation

- [x] 1.1 Introduce a desktop application runtime (Electron assumed per design; Tauri acceptable if equivalent behavior is met) and update build/dev/run scripts so the app launches as a desktop local application; verify the desktop shell starts and renders the existing React UI.
- [x] 1.2 Establish a secure renderer-to-privileged boundary (preload/IPC or equivalent) for database and auth operations and document the API contract in code comments or developer docs; verify renderer cannot access filesystem/SQLite directly and only exposed APIs are callable.

## 2. Local SQLite data store (`DB/` in app folder)

- [x] 2.1 Add SQLite dependencies and implement a data access module that resolves/creates the app-folder `DB/` directory and opens/initializes a physical SQLite database file (e.g. `DB/planner.sqlite`) on startup; verify first run creates the `DB/` folder and database file at the expected app-local path.
- [x] 2.2 Define and apply SQLite schema/migrations for users/accounts, sessions or session-supporting data as needed, and per-user planner entities (lists, tasks, subtasks/checklists, tags, task-tag associations, due/reminder fields, ordering) plus per-user preferences (including theme); verify schema initialization succeeds on a clean environment and required tables/indexes/constraints exist.
- [x] 2.3 Remove/replace IndexedDB (`idb`) as the primary planner/account persistence mechanism with SQLite-backed implementations while preserving the domain behaviors defined in specs; verify no primary planner/account data path depends on browser IndexedDB and persistence/read-write smoke tests pass against SQLite.
- [x] 2.4 Add automated tests for the SQLite store layer covering initialization, CRUD for core entities, and per-user scoping/isolation at the data-access level; verify tests pass.

## 3. Local multi-user authentication

- [x] 3.1 Implement local account creation and credential handling using salted password hashing stored in SQLite (no plaintext passwords) and local-only verification; verify creating an account persists a hashed credential record and duplicate identities are rejected as specified.
- [x] 3.2 Implement login, logout, and authenticated session state management in the desktop app (privileged + UI integration) with clear failure handling; verify valid credentials create a session, invalid credentials are rejected without sensitive leakage, and logout ends access.
- [x] 3.3 Add/adjust tests for authentication flows (account creation, duplicate prevention, login success/failure, logout/session clearing) and document local auth behavior/limitations; verify tests pass and docs match implementation.

## 4. User-scoped planner data and feature adaptation

- [x] 4.1 Refactor planner state and data operations so all task-management behaviors (quick add, edit, delete, complete/uncomplete + undo, subtasks/checklists, manual ordering) are scoped to the authenticated user and persisted in SQLite; verify each behavior works for the logged-in user and data persists across app restart.
- [x] 4.2 Refactor organization features (lists/projects CRUD with delete handling, tags, task-tag associations, filtering/search) to be user-scoped and SQLite-backed; verify list/tag operations, assignments, and filter/search results are correct and isolated per user.
- [x] 4.3 Refactor planning features (due dates set/change/clear, Today/Upcoming derived views, best-effort reminders in desktop runtime) to be user-scoped and SQLite-backed; verify due-date persistence, view grouping/rules, and reminder permission/unavailable handling behave as specified without server dependencies.
- [x] 4.4 Verify cross-user isolation end-to-end by creating at least two local accounts and confirming tasks/lists/tags/planning data and related state are not visible or mutable across users; document the verification steps/results.

## 5. Authentication and theming UI

- [x] 5.1 Implement unauthenticated UI flows for local login and account creation (default assumption: sign-up available from login screen per design) and gate the planner workspace behind successful authentication; verify unauthenticated users cannot access planner content and successful login opens the correct user's workspace.
- [x] 5.2 Add a visible logout control in the authenticated app shell and ensure session teardown returns to the unauthenticated state; verify logout works and protected data is no longer accessible until re-authentication.
- [x] 5.3 Adapt light/dark theming for desktop multi-user use: immediate toggle, per-user preference persistence/restoration in SQLite (with system-aware default/fallback when no saved preference exists), and readable styling for auth and planner flows in both themes; verify theme behavior across login/logout/restart for at least two users.
- [x] 5.4 Add/adjust UI and integration tests (or scripted verification where UI automation is impractical) covering auth gating, logout, and theme persistence/default behavior; verify checks pass and are documented.

## 6. Integration, quality, and documentation

- [x] 6.1 Perform an end-to-end integration pass in a clean local environment (`DB/` absent before start) covering: DB creation in app folder `DB/`, account creation/login, per-user capture→organize→plan→complete flows, reminders best-effort behavior, logout/login isolation, and theme toggle/persistence; verify all core scenarios from the change specs are satisfied.
- [x] 6.2 Update user-facing and developer documentation (README and/or in-app help) to describe the desktop runtime, local-only SQLite storage in the app `DB/` folder, multi-user login/account behavior, no migration from prior browser data, reminder limitations, and theme preference behavior; verify instructions match implemented behavior.

## Workflow follow-up

- Review the planning artifacts and implementation results for this change before archiving.
- When ready, archive the change with `/opsx-archive` (or `openspec archive`) and verify the archived result.

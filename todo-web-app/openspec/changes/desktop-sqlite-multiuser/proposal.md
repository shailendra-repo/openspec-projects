# Proposal

## Why

The focused work planner currently runs as a browser-only single-user app with data stored in IndexedDB. The user needs a desktop local application that stores data in a physical SQLite database file within the app folder and supports multiple local users who can log in and manage their own tasks. This change addresses durable, file-based local storage and per-user access on a shared local device without introducing cloud services.

## What Changes

- **BREAKING**: Convert the application from a browser SPA persistence model (IndexedDB) to a **desktop local application** runtime with a local SQLite database as the system of record.
- **BREAKING**: Replace IndexedDB storage entirely with **SQLite**; no automatic migration of existing browser-stored data.
- Store the SQLite database **physically in a local `DB/` folder inside the app folder** (exact filename/path conventions defined in design, e.g. `DB/planner.sqlite`).
- Add **local multi-user authentication**: users can create/register accounts (as defined in design/spec), log in, log out, and access only their own planner data.
- Scope planner data (tasks, lists/projects, tags, subtasks/checklists, due dates/reminders metadata, ordering, and relevant user preferences such as theme where appropriate) to the **authenticated local user**.
- Keep the solution **local-only** (no cloud sync, no remote backend services) while allowing multiple people to use the app on the same device via separate logins.
- **Assumptions (recorded)**:
  - Desktop framework/tooling (e.g. Electron or Tauri) will be selected in design to support filesystem access to the app-local `DB/` folder and SQLite integration.
  - "Multiple person can login" is interpreted as local account creation/management and credential-based login stored and verified locally; password handling and security details are defined in design/spec.
  - No migration from existing IndexedDB/browser profile data is required.
  - Concurrency is limited to normal local desktop usage; database access patterns and locking are handled by SQLite and the chosen app architecture.

## Capabilities

### New Capabilities
- `user-authentication`: Local multi-user identity and access, including account creation/management as specified, login/logout, session handling, and restriction of planner data to the authenticated user.
- `local-data-store`: Desktop-local persistence using a physical SQLite database stored in the app folder's `DB/` directory as the primary data store (replacing IndexedDB), including schema initialization and local-only file-based storage behavior.

### Modified Capabilities
- `task-management`: Task lifecycle data and operations become scoped to the authenticated user and persisted in the local SQLite store instead of browser IndexedDB.
- `task-organization`: Lists/projects, tags, filtering/search, and related associations become scoped to the authenticated user and persisted in the local SQLite store.
- `task-planning`: Due dates, Today/Upcoming views, and local reminder-related data become scoped to the authenticated user and persisted in the local SQLite store (reminders remain best-effort within desktop runtime capabilities).
- `user-interface`: UI behavior expands to include authentication flows (login and related account access states) and app-shell access control; appearance/theming behavior remains but its storage/context may be adapted for desktop multi-user use.

## Impact

- **Affected code**: Major architectural changes to the existing web app implementation (`src/db/*`, `src/store/*`, `src/App.jsx`, app bootstrap/build config, and related UI/components) to run as a desktop app, integrate SQLite, and add authentication and per-user data scoping.
- **APIs/systems**: Introduces local SQLite database access and filesystem usage for the `DB/` folder in the app directory; removes reliance on browser IndexedDB as primary storage. Uses desktop runtime APIs as selected in design.
- **Dependencies**: New desktop runtime/tooling and SQLite-related dependencies (exact packages chosen in design); existing browser-only storage dependencies may be removed or replaced.
- **Security/privacy**: Local credential storage and verification, session/state handling, and user data isolation must be addressed in design/spec; data remains local to the device.
- **Compatibility**: **BREAKING** change from browser-profile IndexedDB storage to desktop SQLite storage in `DB/`; no migration of prior browser data.
- **Out of scope (for this change)**: Cloud sync, remote authentication/services, cross-device access, migration/import from existing IndexedDB data, role/permission models beyond local user isolation unless specified, and advanced account recovery flows unless specified in design.

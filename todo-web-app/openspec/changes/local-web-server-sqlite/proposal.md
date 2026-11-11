# Proposal

## Why

The current implementation runs as an Electron desktop app, but the preferred experience is a web application accessed in a browser. The planner still needs to keep its physical SQLite database in the app folder and preserve local multi-user login and existing data, which requires a local web server/backend instead of a desktop shell.

## What Changes

- **BREAKING**: Replace the Electron desktop runtime with a **local web application** served by a local backend server and accessed in a browser (e.g. `http://localhost:<port>`).
- Remove Electron-specific runtime artifacts and flows (main/preload/IPC, desktop scripts/packaging assumptions) and replace them with web server routes/APIs and browser-based client communication.
- Keep the **physical SQLite database in the app folder `DB/` directory** (e.g. `DB/planner.sqlite`) as the primary data store, accessed by the local server.
- **Preserve existing data** in `DB/planner.sqlite` (no reset, no migration away from the current SQLite file/schema except compatible adaptations required for the web runtime).
- Keep **local multi-user login/accounts** and per-user data isolation; adapt authentication/session handling from Electron IPC/in-memory desktop session to web-appropriate local server sessions/cookies or equivalent local-only mechanism.
- Provide a local server run workflow so the app is started via a server command and used in the browser.
- **Assumptions (recorded)**:
  - "Web application" means a local server-hosted app used in a browser (not a browser-only app and not remote cloud hosting) so the physical `DB/` SQLite file can be retained.
  - Existing accounts, tasks, lists, tags, preferences, and other data in `DB/planner.sqlite` must remain usable after the change.
  - Authentication remains local-only (no external identity provider, no cloud services).
  - Reminders remain best-effort within browser/runtime capabilities available in the web app context.

## Capabilities

### New Capabilities
- `local-web-runtime`: Local server-hosted web application runtime, including server startup, static/client delivery, HTTP API access for planner/auth operations, and browser-based usage without Electron.

### Modified Capabilities
- `user-authentication`: Authentication and session behavior are adapted from desktop IPC/session handling to local web server/browser session handling while preserving local multi-user login, credential verification, logout, and per-user access control.
- `local-data-store`: SQLite persistence remains physically in the app `DB/` folder and preserves existing data, but data access is provided through the local web server instead of Electron's privileged process boundary.
- `user-interface`: Application shell and flows are adapted for browser-based access (including login/session behavior and removal of desktop-only assumptions) while preserving planner functionality and theming behavior.
- `task-management`: Task lifecycle behaviors remain, but client interactions and persistence flow operate through the local web server/API while preserving existing user-scoped data in SQLite.
- `task-organization`: Organization behaviors remain, but client interactions and persistence flow operate through the local web server/API while preserving existing user-scoped data in SQLite.
- `task-planning`: Planning behaviors remain, but client interactions, persistence flow, and reminder delivery operate in the local web app/browser context while preserving existing user-scoped data in SQLite.

## Impact

- **Affected code**: Replace/remove Electron-specific code (`electron/*`, preload/IPC usage), add a local backend server (HTTP routes, session/auth middleware/handlers, SQLite access integration), refactor frontend data/auth client (`src/store/*`, `src/App.jsx`, entry/config) to use web APIs, and update scripts/docs.
- **APIs/systems**: Introduces local HTTP API endpoints for auth and planner operations; continues using the existing SQLite file in `DB/`; removes Electron IPC as the application boundary.
- **Dependencies**: Add web server/runtime dependencies (e.g. Node HTTP framework, session middleware) as chosen in design; remove or de-scope Electron dependencies from the primary run path.
- **Data/compatibility**: **BREAKING** runtime change (desktop app to local web server in browser) with explicit requirement to preserve and continue using existing `DB/planner.sqlite` data and accounts.
- **Security/privacy**: Local-only credential handling and session security must be addressed for browser/server context (cookies/session storage, CSRF/transport considerations appropriate for localhost) without introducing remote services.
- **Out of scope (for this change)**: Remote/cloud deployment and hosting, external identity providers, data sync across devices, migration away from the existing SQLite file, and non-local multi-user access over the network unless specified in design.

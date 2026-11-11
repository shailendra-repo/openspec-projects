# Focused Work Planner

A local-only **web application** served by a local Node.js server and used in a browser, with a physical SQLite database stored in the app folder and local multi-user login.

## Features

- **Local web runtime**: Node/Express server serves the React client and JSON APIs; open the app in your browser at a local URL (default `http://localhost:3000`). No Electron/desktop shell required.
- **Local multi-user authentication**: create local accounts, log in/out, and access planner data scoped to the authenticated user (per-user isolation). Credentials are verified locally with salted password hashing (no plaintext storage). Sessions are server-managed (HTTP-only cookie; in-memory by default).
- **SQLite storage in app folder**: primary data is stored in `DB/planner.sqlite` under the application folder (created/initialized on first run). Existing `DB/planner.sqlite` data/accounts are preserved when using this web runtime. IndexedDB is not used for primary planner/account data.
- **Task management**: quick add, edit, complete/uncomplete with undo, delete, subtasks/checklists, and drag-and-drop reordering (persisted per user).
- **Organization**: lists/projects (create/rename/delete; deleting a non-default list moves its tasks to Inbox), tags/labels, and filtering/search by text, status, tag, and list context.
- **Planning**: due dates, derived **Today** and **Upcoming** views, and optional best-effort local reminders.
- **Appearance**: light/dark theme toggle with immediate update. Initial theme follows system preference when no saved preference exists (fallback: light). Theme preference is persisted per user in SQLite and restored on subsequent loads.

## Getting started

```bash
npm install
npm run build
npm start
```

Then open `http://localhost:3000` in your browser.

- `npm start` / `npm run server`: starts the local web server (serves `dist/` + `/api/*`)
- `PORT=4000 npm start`: use a different port (PowerShell: `$env:PORT=4000; npm start`)

### Development workflow
- Run the API/server: `npm start` (or `npm run server`) on port 3000
- In another terminal run Vite dev server: `npm run dev` (proxies `/api` to `http://localhost:3000`)
- Open the Vite URL shown in the terminal (typically `http://localhost:5173`)

Run automated tests:

```bash
npm test
```

Build client:

```bash
npm run build
```

## Local storage and privacy

- Data is stored locally in `DB/planner.sqlite` inside the app folder on this device, accessed by the local server.
- No cloud sync, no remote backend/auth services, no remote hosting required.
- Existing local accounts and planner data in `DB/planner.sqlite` are preserved and used by the web runtime.
- Deleting the `DB/` database files removes local accounts and planner data for this app installation/folder.

## Authentication and sessions

- Local-only accounts and credential verification (salted password hashing) against SQLite.
- Server-managed web session via HTTP-only cookie; default implementation uses in-memory session state (sessions may be cleared on server restart).
- Unauthenticated users cannot access planner content or protected API routes.

## Reminders (best-effort)

- Reminders use browser notification capabilities when available and permitted.
- Delivery is **best-effort** and may depend on permissions and browser/runtime behavior while the app is in use.
- Due dates and Today/Upcoming views remain the reliable way to review scheduled work.

## Notes

- Default list: **Inbox** (cannot be deleted). When another list/project is deleted, its tasks are moved to Inbox.
- Multiple people can use the app on the same device by logging into separate local accounts; each account sees only its own data.
- See `docs/auth-and-storage.md` for auth/storage details and verification notes.

## OpenSpec

- Archived: `openspec/changes/archive/2026-11-10-focused-work-planner/`
- Implemented (pending archive): `openspec/changes/desktop-sqlite-multiuser/`
- Active/planned change: `openspec/changes/local-web-server-sqlite/` (proposal, specs, design, tasks)


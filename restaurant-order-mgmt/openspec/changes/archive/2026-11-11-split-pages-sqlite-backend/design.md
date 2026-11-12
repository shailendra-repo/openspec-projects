# Design

## Context

Current implementation is a client-side Vite + React SPA (`src/App.jsx`) using seeded in-code menu data (`src/data/menu.js`), domain logic in `src/domain/orders.js`, and browser `localStorage` persistence (`src/persistence/storage.js`). It presents one screen for create/order tracking. See `proposal.md` — **Why** and **What Changes** for motivation and scope.

Constraints and facts shaping the approach:
- Three routed pages in the same app: **CreateItems**, **CreateOrder**, **Dashboard** (separate routes).
- Items/orders must be persisted in a **SQLite** database stored under a `DB/` folder, requiring a lightweight local backend the frontend can call.
- Dashboard shows only **in-transit** orders (**PLACED + READY**) and can be displayed on another screen; fulfilled orders are not shown on the dashboard (behavioral breaking change).
- Core lifecycle remains **PLACED → READY → FULFILLED**; pickup announcement (order # + name, voice toggle, announce-once, visual authoritative) remains supported when an order becomes READY.

## Goals / Non-Goals

**Goals:**
- Introduce a simple local backend + SQLite (`DB/`) as the shared source of truth for items and orders.
- Restructure the frontend into routed pages with clear responsibilities (create/list items, create orders, monitor/advance in-transit orders).
- Keep lifecycle and announcement semantics consistent (announce once on READY transition) within the split, shared-data workflow.
- Make local development straightforward (run backend + frontend).

**Non-Goals:**
- Authentication/authorization, multi-tenant support, or remote/cloud deployment hardening.
- Item edit/delete, order editing/cancellation, or reporting beyond in-transit monitoring.
- Real-time push infrastructure (WebSockets/SSE) as a requirement; polling/refresh-based consistency is acceptable given local scope unless trivially added.
- Preserving/migrating legacy browser `localStorage` data automatically (can be noted as manual/reset).

## Decisions

### 1. Backend: lightweight Node HTTP server with SQLite in `DB/`
- **Decision:** Add a small Node.js backend (e.g. Express) using a SQLite driver (e.g. `better-sqlite3` or `sqlite3`) that creates/uses a database file under `DB/` (e.g. `DB/app.db`). Expose a JSON REST API for items and orders.
- **Rationale:** Directly satisfies "SQLite database stored under a `DB/` folder" and enables shared access when Dashboard is opened on another screen/browser. Keeps stack familiar alongside Vite/React.
- **Alternatives considered:**
  - *Browser-embedded DB (sql.js/IndexedDB):* cannot produce a true shared `DB/` folder file on disk across screens.
  - *Heavier frameworks/ORM:* unnecessary for a small local app.

### 2. Data model and API shape
- **Decision:** Tables for `items` (id, name, cuisine/category, createdAt) and `orders` (id/orderNumber, customerName, status, placedAt, readyAt, fulfilledAt, announced). Store order line items as related rows or serialized JSON in the order record (implementation choice) sufficient to display item summary.
- **API (illustrative, finalized at implementation):** `GET/POST /api/items`, `GET/POST /api/orders`, `PATCH /api/orders/:id/status` (or equivalent) to drive create, list, and transitions PLACED→READY→FULFILLED with server-side timestamps/numbering as appropriate.
- **Rationale:** Normalizes shared persistence and keeps clients thin; server can enforce unique order numbers and valid transitions.
- **Alternatives considered:**
  - *Client-side numbering/validation only:* risk of collisions/inconsistency across screens; backend is better authority with shared DB.

### 3. Frontend routing and page responsibilities
- **Decision:** Use a router (e.g. `react-router-dom`) with routes for CreateItems, CreateOrder, and Dashboard (exact paths, e.g. `/items`, `/create-order`, `/dashboard`, plus a sensible default/landing). Each page focuses on its responsibility: CreateItems creates+lists items; CreateOrder shows only creation options using saved items; Dashboard shows only in-transit (PLACED/READY) with mark-ready/mark-picked-up actions.
- **Rationale:** Matches requested split and keeps the Dashboard suitable for a dedicated screen.
- **Alternatives considered:**
  - *Single page with tabs:* simpler but does not provide distinct routes/pages for separate screens/bookmarks.

### 4. Dashboard behavior and cross-screen updates
- **Decision:** Dashboard queries backend for in-transit orders (PLACED, READY). Because it may run on another screen, use periodic polling (or refetch-on-action/on-focus) to reflect changes made from CreateOrder/other screens; no WebSocket required initially.
- **Rationale:** Simple and reliable for a local shared-DB setup; avoids push complexity.
- **Alternatives considered:**
  - *WebSockets/SSE:* better immediacy but more moving parts; can be added later if needed.

### 5. Pickup announcement in split workflow
- **Decision:** Keep voice toggle and announce-once semantics on the Dashboard (the screen showing/advancing readiness). Trigger TTS when an order becomes READY and `announced` is not set; persist `announced` via backend so reloads/other views do not repeat. Visual READY state remains authoritative; TTS best-effort.
- **Rationale:** Announcement is relevant where readiness is managed/displayed; persisted marker prevents duplicates across refresh.
- **Alternatives considered:**
  - *Announce on CreateOrder page:* wrong context; CreateOrder no longer shows board.

### 6. Local run and project layout
- **Decision:** Add backend source (e.g. `server/`) and npm scripts to run backend and frontend (concurrently in dev or via separate terminals). Ensure `DB/` exists/initialized at backend start; document run steps in README. Configure Vite dev proxy to backend API to simplify local calls.
- **Rationale:** Clear two-process workflow; proxy avoids CORS friction in dev.
- **Alternatives considered:**
  - *Single process serving built frontend:* possible for prod-like local run but more setup; dev proxy is convenient.

## Risks / Trade-offs

- **[Two-process dev/run complexity]** → Provide npm scripts and README instructions (and optional concurrent runner) to start both reliably.
- **[Data consistency across screens without push]** → Use polling/refetch; accept slight delay on secondary screens.
- **[SQLite file locking/concurrency]** → Low contention in local single-user/counter context; choose driver/config with safe defaults.
- **[Loss of previous localStorage data]** → Treat as reset/migration note; optionally out-of-scope to import.
- **[Behavioral breaking change: no fulfilled queue on Dashboard]** → Intentional per spec; fulfilled state still persisted in DB for integrity/future use.
- **[Speech varies by device/browser]** → Unchanged trade-off; visual state authoritative.

## Migration Plan

- Create `DB/` and initialize schema on first backend run (idempotent). No automatic import from existing `localStorage` orders/menu.
- Update README with new prerequisites/commands (install, run backend+frontend, open routes; Dashboard can be opened on another screen pointed at same backend).
- Rollback: revert to previous client-only build; DB file can be retained or removed as needed.

## Open Questions

- None that must be resolved to define specs or task breakdown. (Exact route paths/naming, polling interval, and specific backend/SQLite libraries remain implementation choices consistent with the decisions above.)

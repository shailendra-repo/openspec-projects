# Proposal

## Why

The current single-screen, browser-local dashboard mixes item selection, order creation, and order monitoring in one view and stores data only in local storage. Splitting the experience into dedicated pages and persisting items/orders in a shared SQLite database enables clearer counter workflows and allows the live order board to be displayed on a separate screen.

## What Changes

- Split the application into three routed pages within the same app: **CreateItems**, **CreateOrder**, and **Dashboard**.
- Add a **CreateItems** page to create new menu items/cuisine entries and list saved items.
- Add a **CreateOrder** page focused only on order-creation options (customer name and selection from saved items) to place new orders.
- Change the **Dashboard** to show only **orders in transit** (statuses **PLACED** and **READY**) so it can be displayed on another screen. **BREAKING (behavioral):** the dashboard no longer shows the fulfilled/picked-up queue.
- Introduce a lightweight local backend API with a **SQLite** database stored under a `DB/` folder to persist item and order information.
- Update order/item data flow so pages read and write through the backend/SQLite store instead of seeded in-code menu data and browser `localStorage` as the source of truth.
- Preserve core lifecycle behaviors where applicable: orders progress **PLACED → READY → FULFILLED**; pickup announcement (order number + customer name, voice toggle, announce-once, visual state authoritative) remains supported for orders becoming READY (assumed on the Dashboard/in-transit view).

**Assumptions (recorded):** backend is a local service run alongside the web app; the Dashboard remains the operational view for in-transit orders (including actions to mark ready and mark picked up) and, backed by shared SQLite storage, can be opened on another screen/browser; item management is create + list only (no edit/delete) unless specified later; "orders in transit" means PLACED + READY (FULFILLED excluded from the Dashboard view).

## Capabilities

### New Capabilities
- `item-management`: Create menu items/cuisine entries and list saved items via the CreateItems page, persisted in the shared database.
- `order-persistence`: Persist items and orders in a SQLite database under a `DB/` folder through a lightweight local backend API used by the application pages.

### Modified Capabilities
<!-- No existing main specs under openspec/specs/ (openspec list --specs returned none). The following capability deltas define evolved behavior for this change relative to current implemented/planned behavior. -->
- `order-creation`: Provide a dedicated CreateOrder page/route that shows only order-creation options and places orders using saved items from the database.
- `in-transit-dashboard`: Provide a dedicated Dashboard page/route showing only in-transit orders (PLACED and READY) with status actions, suitable for display on another screen.
- `pickup-announcement`: Announce "Order <number>, <name> is ready for pickup" when an in-transit order becomes READY within the split-page, backend-backed workflow, preserving voice toggle and announce-once behavior.

## Impact

- **Affected code**: Frontend restructured into routed pages (`/items` or CreateItems, `/create-order`, `/dashboard`) and data-access layer; new backend/server module for SQLite access; replace seeded menu/localStorage source-of-truth with API-backed persistence.
- **APIs/systems**: New local HTTP API (items/orders CRUD/status operations as needed); SQLite database file(s) under `DB/`; browser Web Speech API remains for announcements.
- **Dependencies**: Web routing library (e.g. React Router) and backend/SQLite stack (e.g. Node server + SQLite driver) to be chosen in design; dev/run workflow updated to start backend and frontend.
- **Operational considerations**: Two-process local run (frontend + backend), `DB/` directory creation/initialization, data sharing across screens via backend, and migration of/compatibility with any existing local-only data (if present).

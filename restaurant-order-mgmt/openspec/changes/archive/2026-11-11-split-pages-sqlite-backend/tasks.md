# Tasks

## 1. Backend, SQLite storage, and dev workflow

- [x] 1.1 Add backend dependencies and project scripts to run a lightweight local Node backend alongside the Vite frontend (including a convenient dev workflow), and verify `npm install` and the documented backend/dev commands start without errors.
- [x] 1.2 Implement backend SQLite initialization that creates/uses a database file under `DB/` (e.g. `DB/app.db`) with schema for menu items and orders (including status, timestamps, and announced marker), and verify starting the backend creates/opens the DB in `DB/` and required tables exist.
- [x] 1.3 Implement items API endpoints to create and list menu items persisted in SQLite with required-field validation, and verify automated checks or API requests confirm create/list behavior and rejection of missing required fields per `item-management` and `order-persistence`.
- [x] 1.4 Implement orders API endpoints to create orders (PLACED, unique order number, customer name, selected saved items), list orders, and update status transitions PLACED→READY→FULFILLED with timestamps/announced persistence, and verify automated checks or API requests cover persistence, valid/invalid transitions, and retrieval of current order state per `order-persistence` and lifecycle requirements.
- [x] 1.5 Document local run steps in `README.md` (start backend + frontend, `DB/` location, routes/pages, Dashboard usable on another screen against the same backend) and verify the documented steps start the system.

## 2. Frontend routing and data access

- [x] 2.1 Add routing and split the UI into three pages/routes (CreateItems, CreateOrder, Dashboard) with navigation and a sensible default route, and verify each route renders its dedicated page in the browser/build.
- [x] 2.2 Replace seeded/localStorage source-of-truth with a frontend API/data-access layer for items and orders (including Vite dev proxy or equivalent local API access), and verify pages load data from and write data to the backend API successfully.

## 3. CreateItems page

- [x] 3.1 Build the CreateItems page to create a menu item (name and cuisine/category) and display validation feedback for missing required fields, persisting via the backend API, and verify behavior matches `item-management` create scenarios.
- [x] 3.2 Display a list of saved items (and an empty state when none exist) on the CreateItems page sourced from the shared database, and verify created items appear in the list after save/reload per `item-management`.

## 4. CreateOrder page

- [x] 4.1 Build the CreateOrder page to show only order-creation options (customer name and selection from saved items loaded from the backend) and place PLACED orders via the API, and verify it does not display the in-transit dashboard board and enforces required name/item selection per `order-creation`.
- [x] 4.2 Handle the no-saved-items case on CreateOrder by indicating items must be created first and preventing order placement, and verify the UI/API behavior matches the `order-creation` scenario.

## 5. In-transit Dashboard and pickup announcement

- [x] 5.1 Build the Dashboard page/route to show only in-transit orders (PLACED yellow, READY green) with order number, customer name, item summary, and actions to mark ready/picked up (FULFILLED removed from view), fetching shared data from the backend, and verify behavior matches `in-transit-dashboard` scenarios.
- [x] 5.2 Ensure Dashboard reflects shared updates suitable for another screen (e.g. refetch/polling or equivalent) so orders created/updated via backend are visible, and verify updates made through the API/other page are shown on the Dashboard.
- [x] 5.3 Implement Dashboard voice enable/disable and announce-once TTS on transition to READY ("Order <number>, <name> is ready for pickup") with persisted announced marker and non-blocking best-effort speech, and verify behavior matches `pickup-announcement` scenarios including no repeats on reload and visual state remaining authoritative.

## 6. Integration verification

- [x] 6.1 Perform an end-to-end verification with backend and frontend running: create/list items on CreateItems, place an order on CreateOrder, confirm PLACED→READY→FULFILLED transitions and in-transit-only display on Dashboard, confirm SQLite persistence in `DB/` and data visible across a separate Dashboard session/screen context, and verify voice announcement behavior where supported. (Verified via backend API/scripted e2e: item create/list, order create, PLACED→READY→FULFILLED with announced persistence, in-transit-only filtering, shared reads, and `DB/app.db` persistence; browser audio/separate physical screen to be confirmed on target devices.)
- [x] 6.2 Run automated tests/checks added or updated for backend/domain logic and frontend build, and verify they pass (`npm test` or equivalent and `npm run build`) documenting any environment-limited manual checks. (`npm test`: 10 passed; `npm run build`: success. Backend API verification scripts also passed; browser UI/audio and multi-device screen behavior remain environment-specific manual checks.)

# Tasks

## 1. Project setup and app scaffold

- [x] 1.1 Initialize a web application scaffold in the repository (chosen framework/tooling per design) and verify the dev server/build runs successfully from a documented command.
- [x] 1.2 Establish base project structure (UI, domain/state, and persistence modules) and a seeded menu/items data source, and verify the app loads and the seeded menu is available to the order-creation flow.
- [x] 1.3 Add a minimal README (or update it) describing how to run the app locally on the single dashboard screen, and verify the documented steps start the app.

## 2. Domain model, lifecycle, and persistence

- [x] 2.1 Implement the order domain model (`orderNumber`, `customerName`, `items`, `status` PLACED|READY|FULFILLED, `placedAt`/`readyAt`/`fulfilledAt`, and `announced` marker) with strict transitions PLACED → READY → FULFILLED, and verify unit tests (or equivalent scripted checks) cover valid/invalid transitions and required fields.
- [x] 2.2 Implement unique, human-readable order number generation and "current local day" filtering for fulfilled orders based on `fulfilledAt`, and verify tests/checks confirm uniqueness within the session/day scope and that only today's fulfilled orders qualify.
- [x] 2.3 Implement browser-local persistence for orders and relevant UI flags (voice-enabled preference, announced markers) with load/hydrate on startup, and verify a page refresh restores the current board state including today's fulfilled queue.

## 3. Order creation and PLACED (in-progress) view

- [x] 3.1 Build the create-order UI to capture customer name and select one or more available menu items/cuisine, preventing submission when required information is missing, and verify behavior matches `order-tracking` "Create an order for a customer" scenarios (including rejection of missing name/items).
- [x] 3.2 Render the PLACED (yellow, in-progress) dashboard section showing each placed order's number, customer name, and item summary with a "Mark Ready" action, and verify newly created orders appear here and display as specified.

## 4. READY state, FULFILLED queue, and staff actions

- [x] 4.1 Implement "Mark Ready" to transition PLACED → READY and render the READY (green, ready-for-pickup) section with order number, customer name, and a "Mark Picked Up" action, and verify transitions and display match `order-tracking` ready scenarios.
- [x] 4.2 Implement "Mark Picked Up" to transition READY → FULFILLED and render the FULFILLED (today-only) queue on the same dashboard with order number and customer name, and verify picked-up orders move to the queue and prior-day fulfilled orders are excluded per spec.

## 5. Pickup announcement (voice)

- [x] 5.1 Add a dashboard "Enable/Disable Voice" control wired to persisted preference/user-gesture context, and verify toggling on/off updates state and is reflected after refresh per `pickup-announcement` enable/disable scenarios.
- [x] 5.2 Implement announce-once TTS on transition to READY using browser `speechSynthesis` with the message "Order <number>, <name> is ready for pickup", guarded by the voice-enabled state and per-order announced marker (no repeats on re-render/refresh), and verify behavior against `pickup-announcement` announcement and duplicate-prevention scenarios.
- [x] 5.3 Ensure speech unavailability/failure does not block or alter the READY transition or visual state, and verify the order remains visible in the READY (green) section when speech cannot play.

## 6. Integration verification

- [x] 6.1 Perform an end-to-end manual verification on a single screen: create an order, confirm PLACED (yellow), mark READY (green) and observe/hear the single announcement when voice is enabled, mark Picked Up and confirm appearance in today's FULFILLED queue; verify results satisfy the `order-tracking` and `pickup-announcement` specs. (Verified in this environment via successful build/dev startup, passing domain+persistence tests, and code walkthrough against specs; interactive browser audio/UI flow to be confirmed on the target dashboard device.)
- [x] 6.2 Verify persistence and day-scope behavior by refreshing the app and (where feasible) confirming previously fulfilled-today orders remain in the fulfilled queue while non-today fulfilled records are not shown. (Verified via persistence load/save with hydrate-on-init, storage tests, and `isFulfilledToday`/day-filter tests; browser refresh behavior to be confirmed on the target device.)

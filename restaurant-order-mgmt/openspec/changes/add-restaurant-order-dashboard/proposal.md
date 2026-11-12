# Proposal

## Why

A small restaurant needs a simple way for counter staff to create customer orders, track their progress on a single dashboard, and clearly signal when an order is ready for pickup. Today there is no system in place; a lightweight order management flow with visible status states and an optional voice announcement reduces missed pickups and counter confusion.

## What Changes

- Introduce a single-screen, counter-staff-operated order dashboard for today's service.
- Allow staff to create an order for a customer from available menu items/cuisine and place it into an in-progress state.
- Track each order through a defined lifecycle: **PLACED** (in progress, shown in yellow) → **READY** (ready for pickup, shown in green) → **FULFILLED** (picked up, shown in a fulfilled queue).
- Let counter staff explicitly advance orders: mark a placed order **Ready** and mark a ready order **Picked Up** (fulfilled).
- Display fulfilled orders for **today only** in a dedicated fulfilled queue on the same dashboard (visible, not removed).
- On transition to **READY**, optionally read out the pickup announcement as "Order `<number>`, `<name>` is ready for pickup" using browser text-to-speech, with a staff-controlled enable/disable toggle and announce-once behavior.
- Establish the core menu/order domain model needed to support order creation and display (order number, customer name, selected items/cuisine, timestamps/status).

**Assumptions (minor, to confirm/refine in design):** greenfield web application; single device/screen is the source of truth (no multi-device sync in scope); fulfilled visibility is scoped to the current day (local time boundary); persistence/durability across refresh and menu management depth are design choices to be finalized.

## Capabilities

### New Capabilities
- `order-tracking`: Create and manage customer orders through the PLACED → READY → FULFILLED lifecycle on a single-screen dashboard, including status visualization (yellow/green), staff actions to mark ready/picked up, and a fulfilled queue showing today's picked-up orders.
- `pickup-announcement`: Announce a ready order's number and customer name via browser speech synthesis when it becomes ready for pickup, controlled by a dashboard voice toggle and guarded against duplicate announcements.

### Modified Capabilities
<!-- None. Greenfield project with no existing specs under openspec/specs/. -->

## Impact

- **Affected code**: New web application (UI, state/domain logic, and any chosen persistence layer) — repository is currently greenfield.
- **APIs/systems**: Browser Web Speech API (`speechSynthesis`) for voice announcements; depends on user gesture to enable audio on the dashboard device.
- **Dependencies**: Web stack and storage approach to be selected in design (no multi-device realtime sync required given single-screen scope).
- **Operational considerations**: Announcement audibility/pronunciation in a restaurant environment, "today" day-boundary definition, and data durability across refresh/restart. Visual dashboard state remains the authoritative signal.

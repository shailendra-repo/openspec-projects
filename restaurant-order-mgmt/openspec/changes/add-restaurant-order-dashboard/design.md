# Design

## Context

Greenfield repository (`C:\Shailendra\ai-project\restaurant-order-mgmt`) with no existing application code or specs. The change introduces a single-screen, counter-staff-operated restaurant order dashboard. See `proposal.md` — **Why** and **What Changes** for motivation and scope.

Constraints and facts shaping the approach:
- Single screen/device is the source of truth; no multi-device or real-time sync required.
- Counter staff performs all actions (create, mark ready, mark picked up).
- Fulfilled queue must show **today's** fulfilled orders only, while remaining visible on the dashboard.
- Pickup announcement must speak **order number and customer name** on transition to **READY**, with a staff-controlled voice toggle and no duplicate repeats.
- Browser environment must be able to use the Web Speech API (`speechSynthesis`) when enabled; visual state is authoritative.

## Goals / Non-Goals

**Goals:**
- Deliver a clear, minimal lifecycle: **PLACED (yellow)** → **READY (green, announce)** → **FULFILLED (today's queue)** on one dashboard.
- Keep the domain model explicit (order number, customer name, line items/cuisine, status, timestamps) to support display and "today" filtering.
- Make announcements reliable in behavior: trigger once on READY transition, gated by an explicit voice-enable control, and never block or redefine readiness.
- Favor a simple, single-device architecture that can be implemented and operated without backend coordination complexity.

**Non-Goals:**
- Multi-device/multi-station synchronization, user accounts/roles, or remote access.
- Customer-facing ordering channels (online/mobile/self-service kiosk) beyond the counter-staff screen.
- Historical reporting beyond today's fulfilled queue, payments, inventory management, or kitchen printer integrations.
- Guaranteed perfect name pronunciation or external/cloud TTS (browser `speechSynthesis` is the baseline).

## Decisions

### 1. Application shape: single-page web app with local state
- **Decision:** Implement as a client-side web application (SPA) running on the single dashboard screen. Keep authoritative runtime state in the browser app for the session.
- **Rationale:** Matches single-screen/no-sync scope; minimizes moving parts and enables direct use of `speechSynthesis`.
- **Alternatives considered:**
  - *Server-backed app with database from day one:* stronger durability/multi-user path but unnecessary complexity for a single operator/screen MVP.
  - *Native/desktop app:* possible, but web is simplest to bootstrap and already satisfies TTS via browser APIs.

### 2. Persistence: browser-local durable storage (recommended default)
- **Decision:** Persist orders and UI-relevant flags (e.g. announced state, voice-enabled preference) to browser-local storage (e.g. `localStorage` for simplicity, or `IndexedDB` if data grows) so a refresh does not lose today's board. Treat this as the baseline; exact mechanism chosen at implementation time.
- **Rationale:** Single screen still benefits from surviving accidental refresh/restart; avoids requiring a server.
- **Alternatives considered:**
  - *In-memory only:* simplest but loses state on refresh — risky for live service.
  - *Server database:* durable and extensible, but out of proportion to current single-screen scope.
- **Note:** This is a design-level default recorded as an assumption; can be revisited if stronger durability is required.

### 3. Domain model and status transitions
- **Decision:** Model `Order` with at least: `orderNumber` (unique, human-readable, monotonically increasing within the day/session scope), `customerName`, `items` (name/cuisine/category and quantity as needed), `status` (`PLACED` | `READY` | `FULFILLED`), and timestamps (`placedAt`, `readyAt`, `fulfilledAt`).
- **Transitions (strict, staff-driven):** `PLACED -> READY` via "Mark Ready"; `READY -> FULFILLED` via "Mark Picked Up". No other transitions in scope.
- **Rationale:** Explicit timestamps support "today's fulfilled" filtering and auditability; strict transitions keep UI/actions predictable.
- **Alternatives considered:**
  - *Allow skipping/reversing states:* adds flexibility but complicates invariants and announcement semantics; defer unless requested.

### 4. "Today" fulfilled queue definition
- **Decision:** Show orders where `fulfilledAt` falls within the current local calendar day in the fulfilled queue. Orders fulfilled on previous days are excluded from this queue (retention/archival beyond that is an implementation/storage choice, not surfaced in this view).
- **Rationale:** Matches stated requirement ("todays order only") with a simple, operator-understandable boundary.
- **Alternatives considered:**
  - *Configurable business-day/shift boundary:* useful for venues crossing midnight, but adds configuration; default to local calendar day unless refined.

### 5. Pickup announcement via Web Speech API
- **Decision:** Use browser `speechSynthesis` with `SpeechSynthesisUtterance` text: `Order <orderNumber>, <customerName>, is ready for pickup`.
  - Provide a visible **Enable/Disable Voice** toggle; enabling is treated as the required user interaction/gesture context for audio.
  - Trigger speech **once** at the moment/status-change event when an order becomes `READY` and voice is enabled.
  - Track an `announced` (or `announcedAt`) marker per order to prevent repeats on re-render/refresh while still `READY`.
  - Treat TTS as best-effort: failures/unavailability MUST NOT block transition or hide the READY state.
- **Rationale:** Feasible, no external dependency, and satisfies number+name and single-announcer (single screen) needs. Visual green state remains authoritative.
- **Alternatives considered:**
  - *Cloud TTS (Polly/Google/Azure):* higher voice consistency, but adds network/cost/credentials.
  - *Chime-only:* more robust in noise but does not read the name/number as requested; can complement later.

### 6. Menu/items source
- **Decision:** Start with a simple, app-defined list of available items/cuisine sufficient to create orders (e.g. seeded/static data editable in code/config), exposed in the create-order UI.
- **Rationale:** Requirement states "create an order of available items/cusine" without specifying menu administration; a seeded list unblocks the core flow.
- **Alternatives considered:**
  - *Full menu CRUD/admin:* useful but expands scope beyond stated need.

### 7. UI structure
- **Decision:** Three clearly labeled dashboard sections on one screen: **PLACED (yellow, in-progress)**, **READY (green, ready for pickup)**, **FULFILLED (today's queue)**, plus a create-order area and a voice toggle. Each card/row shows order number and customer name (and item summary where relevant) with the valid next action.
- **Rationale:** Directly reflects the requested states and makes status legible at a glance.

## Risks / Trade-offs

- **[Browser TTS variability/mispronunciation]** → Announce number + name; keep green READY state authoritative; allow voice off. (Future: phonetic hint/chime.)
- **[Autoplay/gesture restriction blocks speech]** → Require explicit "Enable Voice" user action and surface toggle state clearly.
- **[Refresh/restart loses state if persistence is mishandled]** → Use browser-local durable storage and persist announced/voice flags; document limitation vs server durability.
- **[Day-boundary ambiguity around midnight/local time]** → Default to local calendar day based on `fulfilledAt`; revisit if shift-based service is needed.
- **[Noisy environment makes audio easy to miss]** → Voice is assistive; visual READY column and fulfilled queue remain primary signals.
- **[Single-screen single point of failure]** → Accepted per scope; no multi-device failover designed.

## Migration Plan

- Greenfield delivery: no data migration. Deploy/serve the static web app to the counter device/browser (or run locally) and initialize with an empty/today board and seeded menu.
- Rollback: redeploy previous build or clear local persisted state if a release corrupts it (acceptable for MVP; confirm durability expectations during implementation).

## Open Questions

- None that must be resolved to define specs or task breakdown. (Implementation may choose the specific web stack/tooling and the exact local persistence API consistent with the decisions above.)

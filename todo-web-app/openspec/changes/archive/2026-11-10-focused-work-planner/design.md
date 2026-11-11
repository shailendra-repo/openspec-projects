# Design

## Context

This is a greenfield, local-only focused work planner web application. There is no existing application code or backend; all persistence and behavior must run in the browser. Motivation and scope are defined in `proposal.md` (see **Why**, **What Changes**, and **Capabilities**). Behavioral requirements are defined in the delta specs under `specs/task-management/spec.md`, `specs/task-organization/spec.md`, and `specs/task-planning/spec.md`.

Constraints:
- **Local-only**: no server APIs, no accounts, no cross-device sync.
- **Persistence**: data must survive reloads on the same device/browser profile.
- **Reminders**: best-effort, dependent on browser notification permissions and runtime behavior.

## Goals / Non-Goals

**Goals:**
- Deliver a focused planner UX for capture, organization, and day-to-day planning.
- Use a simple, durable local data model that supports tasks, subtasks, lists/projects, tags, due dates, ordering, completion state, and user appearance preference.
- Keep the architecture client-side and easy to evolve within local-only constraints.
- Make reminder limitations explicit in UX and behavior.
- Provide a comfortable, accessible viewing experience in both light and dark modes with an easy way to switch themes.

**Non-Goals:**
- Multi-user collaboration, sharing, or authentication.
- Cloud sync, backup service, or cross-device continuity.
- Server-side scheduling/notification delivery.
- Advanced features not specified (e.g. natural-language parsing engine, complex recurrence rules, time tracking) unless later added as separate changes.

## Decisions

### 1. Client-side SPA with local persistence (IndexedDB)
- **Decision**: Build as a browser-based single-page application using IndexedDB (directly or via a thin wrapper/library) as the primary persistence store.
- **Rationale**: IndexedDB supports structured data, indexing, and larger storage than `localStorage`, which fits tasks/lists/tags/filters and future growth. Local-only requirement eliminates backend needs.
- **Alternatives considered**:
  - `localStorage`: simpler but limited size, synchronous API, and awkward for structured/query-like access. Rejected as primary store.
  - Remote backend + DB: contradicts local-only requirement. Rejected.

### 2. Normalized local data model with stable IDs
- **Decision**: Store entities with stable IDs (e.g. tasks, lists/projects, tags, subtasks/checklist items as embedded or related records per implementation choice) and maintain explicit relationships (task↔list, task↔tags, task↔due/reminder metadata, ordering fields per context).
- **Rationale**: Supports filtering, multiple views (Today/Upcoming/list views), reordering, and safe edits without duplicating state.
- **Alternatives considered**:
  - Single nested blob per view: easy initially but brittle for cross-view consistency and updates. Rejected.

### 3. Derived planning views computed from task data
- **Decision**: Implement **Today** and **Upcoming** as derived views based on task due dates and local date boundaries, rather than separate persisted collections.
- **Rationale**: Reduces duplication and keeps views consistent with source-of-truth task records.
- **Alternatives considered**:
  - Persist view membership separately: risks drift and extra synchronization logic. Rejected.

### 4. Best-effort reminders via Web Notifications API (no background service guarantee)
- **Decision**: Use browser notification permissions/APIs for reminders when available; treat delivery as best-effort and surface permission/availability state in the UI. Do not introduce a server push/service-worker-based guaranteed delivery requirement in this change unless design/implementation later proves it feasible within local-only scope.
- **Rationale**: Aligns with local-only constraint and browser realities; avoids false guarantees.
- **Alternatives considered**:
  - Guaranteed reminders via backend scheduler/push: violates local-only scope. Rejected.
  - Mandatory service worker scheduling in MVP: may improve cases but adds complexity and platform variability; can be evaluated during implementation as an enhancement if it stays local-only. Deferred.

### 5. UI state and interactions optimized for planner focus
- **Decision**: Provide quick-add entry point, clear list/view navigation, inline/accessible edit and complete actions, and drag-and-drop reordering where supported (with non-drag affordances considered for accessibility during implementation).
- **Rationale**: Matches "focused work planner" goal and required capabilities.
- **Alternatives considered**:
  - Minimal CRUD-only UI without planning views/reorder affordances: would not satisfy stated capabilities. Rejected.

### 6. Light and dark theming with persisted user preference
- **Decision**: Implement appearance theming via semantic design tokens (e.g. CSS custom properties) applied at the app root, with light and dark palettes covering surfaces, text, borders, and interactive states. Provide an explicit Light/Dark toggle in the UI. Determine the initial theme from a locally persisted user preference when present; otherwise follow the system color scheme (`prefers-color-scheme`) where available, falling back to light mode if unavailable. Persist the user's selection locally so it survives reloads on the same device/browser profile.
- **Rationale**: Delivers user control and comfort in different lighting conditions while keeping behavior predictable and local-only. Token-based theming reduces duplication and helps maintain consistency across views.
- **Alternatives considered**:
  - CSS-only system theme with no user toggle: simpler but does not give explicit user control. Rejected.
  - Separate duplicated stylesheets per theme without tokens: harder to maintain and keep consistent. Rejected.
  - Light/Dark/System tri-state selector: more flexible, but a Light/Dark toggle plus system-aware default is sufficient for this change; can be added later if needed. Deferred.

### 7. Technology selection left flexible, with pragmatic default assumption
- **Decision**: Do not mandate a specific frontend framework in this design; assume a modern component-based web stack with a build tool and typed or well-structured JavaScript as reasonable defaults. Choose libraries (e.g. IndexedDB helper, drag-and-drop) during implementation to fit simplicity and maintainability.
- **Rationale**: User specified local-only architecture but not stack; tasks can remain concrete without over-constraining.
- **Alternatives considered**:
  - Prescribe a specific framework now: unnecessary without user preference. Rejected.

## Risks / Trade-offs

- [Browser storage eviction/limits] → Use IndexedDB, handle quota/storage errors gracefully, and keep data model efficient; communicate persistence limitations where relevant.
- [Notification reliability varies by browser/OS and app state] → Present reminders as best-effort, request permission transparently, and keep in-app due-date visibility as the reliable fallback.
- [Drag-and-drop accessibility/complexity] → Ensure keyboard/alternative ordering paths are considered in implementation tasks; test primary flows without pointer-only assumptions.
- [Theme inconsistency or poor contrast across views/components] → Centralize theme tokens, apply them consistently to core surfaces and states, and manually verify readability, contrast, and focus visibility in both light and dark modes.
- [Data deletion/list removal semantics can surprise users] → Define clear behavior in implementation (e.g. move tasks to default Inbox or confirm reassignment) consistent with specs and UI prompts.
- [No sync/backup in scope] → Accept single-device locality as a trade-off; future export/import can be a separate change.

## Migration Plan

- **Deployment (implementation phase)**: Greenfield delivery as static/client-side assets; no server migration. Any first-run initialization creates local storage schema/version metadata.
- **Schema evolution**: Include a simple local schema/version strategy to support future additive changes without data loss where possible.
- **Rollback**: Roll back by redeploying prior static assets; local data remains in browser storage (may require compatibility handling if schema changed).

## Open Questions

- Should tasks removed from a deleted list/project move to a default "Inbox" automatically, or require explicit user reassignment? (Resolve during implementation if it does not change spec intent; default assumption for tasks can be an "Inbox"/default list behavior.)
- Should reminder scheduling include a service worker enhancement if it can remain fully local-only and reliable enough, or stay strictly in-page/best-effort for MVP? (Defer if it does not change externally specified behavior.)
- Should the UI expose a third "System" theme option in addition to explicit Light/Dark, or keep a simple Light/Dark toggle with system-aware default on first use? (Default for this change: Light/Dark toggle with system-aware initial default and persisted override.)

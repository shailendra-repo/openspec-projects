# Tasks

## 1. Project setup and data foundation

- [x] 1.1 Initialize the web application skeleton (Python/Flask or chosen stack per design), dependency manifest, app entrypoint, and base folder layout (`app/`, `templates/`, `static/`, `tests/`, `migrations/`, `data/`) and verify the app starts locally and serves a basic page.
- [x] 1.2 Add environment/config handling (including `.env.example` placeholders for secret key and SMTP settings) and document required configuration in `README.md`, verifying the app reads configuration without committing secrets.
- [x] 1.3 Configure SQLite persistence in `data/community.db` with WAL mode and migration tooling, and verify migrations can create and upgrade the schema in a clean `data/` folder.
- [x] 1.4 Implement the initial data model/migrations for users, categories, tickets, comments (with optional parent reply), attachments, audit events, and notification outbox, and verify schema/tests confirm required tables, constraints, and foreign keys exist.

## 2. Authentication, authorization, and user management

- [x] 2.1 Implement secure password hashing, login/logout, and server-side session management with CSRF protection for state-changing requests, and verify automated tests cover successful login, invalid credentials, and logout/session behavior.
- [x] 2.2 Implement role-based access control guards for resident and board member actions/pages and for attachment retrieval, and verify tests prove unauthorized direct requests are denied without leaking protected data.
- [x] 2.3 Implement board-only user management (create resident accounts; support multiple board members and board-account creation per bootstrap assumption) with active/inactive handling, and verify tests confirm board members can create accounts while residents cannot and cannot self-register.
- [x] 2.4 Implement the documented bootstrap mechanism/command to create the first board member when none exists, and verify running it on an empty database creates an active board member who can log in and manage users; document the bootstrap steps in `README.md`.

## 3. Service tickets, collaboration, and attachments

- [x] 3.1 Implement resident ticket creation with required fields, category/priority selection, transactional unique human-readable ticket number generation, and board-managed category CRUD/activation, and verify tests cover ticket creation, numbering uniqueness, and category behavior.
- [x] 3.2 Implement role-scoped ticket listing and detail views (board sees all tickets, residents see only own tickets) including ticket attributes/status display, and verify tests confirm residents cannot access other residents' tickets by ID or direct URL.
- [x] 3.3 Implement ticket conversation with comments and threaded replies (resident can reply over board comments on own tickets) with author/timestamp attribution, and verify tests cover board comments, resident replies linked to parent comments, and denied access for non-owning residents.
- [x] 3.4 Implement attachment/photo upload and storage under `data/uploads/` with metadata records, type/size validation, safe stored filenames, and authorized download serving, and verify tests cover successful upload/display, validation failures, and blocked unauthorized file access.
- [x] 3.5 Add user-facing templates/UI for resident and board dashboards, ticket creation/detail, comment/reply, and attachment interactions, and verify manual or UI-level checks show the required flows are reachable and role-appropriate.

## 4. Ticket resolution workflow enforcement

- [x] 4.1 Implement the ticket status model and server-side state transition rules for propose-resolution, resident acknowledgement, closure, and acknowledgement invalidation on re-proposal, and verify unit/integration tests cover all allowed and rejected transitions per `ticket-resolution-workflow` spec.
- [x] 4.2 Implement board actions to propose resolution and to close tickets (board-only, gated on resident-acknowledged state) with transactional state validation and actor/timestamp recording, and verify tests prove closure succeeds only when acknowledged and fails otherwise, including resident close attempts.
- [x] 4.3 Implement resident acknowledgement action for the owning resident only and UI/state indicators showing proposed/acknowledged/closed states, and verify tests and observable behavior confirm only the owner can acknowledge and closure becomes available to board members only after acknowledgement.
- [x] 4.4 Record resolution-related status/audit details and ensure re-proposal after acknowledgement requires fresh acknowledgement, and verify tests demonstrate prior acknowledgement does not permit closure after a new proposal.

## 5. Notifications and audit history

- [x] 5.1 Implement audit event recording as append-only entries for meaningful actions (account creation, ticket create/update, comment/attachment, propose, acknowledge, close) with actor/action/entity/timestamp/context, and verify tests confirm events are written and not modified or deleted by normal flows.
- [x] 5.2 Implement per-ticket audit timeline views with access control consistent with ticket visibility, and verify tests/UI checks show authorized users can view chronological history while unauthorized users cannot.
- [x] 5.3 Implement notification outbox generation for key ticket events (ticket creation, comment/reply, resolution proposed, resident acknowledgement, closure) with correct recipient targeting, and verify tests confirm outbox records are created for the expected recipients.
- [x] 5.4 Implement SMTP-configurable email sender with delivery outcome tracking (sent/failed, retry-safe behavior per policy) and graceful no-op/log handling when unconfigured so core actions are not blocked, and verify tests or controlled runs demonstrate outbox persistence, success/failure recording, and non-blocking behavior; document SMTP setup in `README.md`.

## 6. Integration verification and hardening

- [x] 6.1 Add end-to-end or integration tests covering primary journeys: board bootstrap/login and resident creation, resident creates ticket with attachment, board comments and proposes resolution, resident replies and acknowledges, board closes, and notifications/audit are recorded, and verify the test suite passes.
- [x] 6.2 Perform security and integrity checks for RBAC, upload handling, and state-transition enforcement (including direct-request/ID tampering cases) and verify no unauthorized access, invalid closure, or unsafe file access is possible in tested scenarios.
- [x] 6.3 Validate local setup from a clean state (migrations, bootstrap, run app, exercise core flows) and update `README.md` with run/test instructions and data-folder notes, verifying a fresh setup works as documented.

## Workflow follow-up

- The artifacts are ready for review. When ready to implement, run `/opsx-apply` for this change.
- Archive the change after implementation and review requirements are satisfied, then verify the archived result.

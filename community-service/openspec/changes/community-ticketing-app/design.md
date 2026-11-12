# Design

## Context

Greenfield web application in `C:\Shailendra\ai-project\community-service` (no existing application code). OpenSpec is initialized but there are no existing specs. The project must deliver a community service ticketing app where residents raise issues as numbered tickets and board members collaborate and resolve them, using **SQLite in a project folder**. See `proposal.md` for motivation, scope, and recorded assumptions.

Constraints shaping the approach:
- Roles: residents and multiple board members with strict server-side authorization.
- Board-only user creation (no resident self-registration) and initial board bootstrap.
- Enforced workflow: resident acknowledgement required before board-only closure.
- Extras in v1: categories, priority, attachments/photos, email notifications, audit history.
- Single-folder, simple deployment footprint preferred; DB and uploads must live within the project data area.

## Goals / Non-Goals

**Goals:**
- Deliver a clear, maintainable monolithic web app with SQLite persistence in `data/` and attachment storage under `data/uploads/`.
- Enforce RBAC and ticket state transitions on the server for every request and file access.
- Provide an auditable, notification-aware ticket lifecycle (create → discuss → propose → acknowledge → close) with traceable history.
- Keep v1 operable locally with documented setup/bootstrap and configurable SMTP (outbox-first notifications).

**Non-Goals:**
- Mobile native apps, real-time chat/WebSocket updates, or multi-tenant SaaS concerns.
- High-scale distributed deployment, external DBs, or background job infrastructure beyond a simple in-process/scheduled sender pattern if needed.
- Resident editing of original ticket fields after creation (assumed out for v1) and advanced SLA/escalation workflows.
- Public self-service signup or SSO integrations.

## Decisions

### 1. Application stack: Python + Flask + server-rendered templates + SQLite
- **Decision:** Use Python 3 with Flask, Jinja templates (light progressive enhancement/HTMX optional), and SQLite via a small, explicit data access layer (e.g. SQLAlchemy or direct `sqlite3` with migrations). Rationale: aligns with “web app + SQLite in a folder”, keeps code/config/deps understandable for CRUD, RBAC, uploads, and workflow rules.
- **Alternatives:** Django (faster built-in auth/admin but heavier conventions), Node/Express (JS-only stack but more setup for secure sessions/uploads/SQLite ergonomics on Windows). Rejected for now to favor simplicity and explicit control over workflow enforcement.

### 2. Persistence layout: SQLite file + migrations in `data/`
- **Decision:** Store the database at `data/community.db`, enable WAL mode for better read/write behavior, and manage schema via migrations. Keep `data/` as the operational state folder (DB, uploads) with clear gitignore guidance for runtime artifacts.
- **Alternatives:** Single root-level DB file (less organized), no migrations (fragile as schema evolves). Rejected to support repeatable setup and safe evolution.

### 3. Authentication, sessions, and password security
- **Decision:** Server-side session authentication with securely hashed passwords (strong password hashing algorithm provided by the chosen framework/library), CSRF protection on state-changing requests, and centralized RBAC guards/middleware for routes and attachment downloads.
- **Alternatives:** JWT-only stateless auth (more complexity for revocation/CSRF in browser flows), plain hashes/unsalted storage (unacceptable). Rejected in favor of conventional, secure web-session patterns.

### 4. User management and bootstrap
- **Decision:** No public registration. Board members create resident and (assumed) board accounts through an authenticated admin UI. Provide a documented bootstrap path (CLI/seed command or first-run setup) to create the initial board member when none exists.
- **Alternatives:** Self-registration with approval, hardcoded default admin credentials. Rejected due to stated requirements and security risk.

### 5. Ticket model and numbering
- **Decision:** Tickets are first-class records with unique, human-readable `ticket_number` (e.g. `CS-YYYY-NNNNNN`) generated transactionally, owned by a resident, and carrying title, description, category, priority, status, and timestamps. Categories are managed entities (active/inactive) referenced by tickets.
- **Alternatives:** Use DB integer ID only (poor UX), free-text categories (inconsistent reporting/filtering). Rejected for traceability and consistency.

### 6. Collaboration model: threaded comments/replies and attachments
- **Decision:** Use a comments table supporting `parent_comment_id` so residents can reply in context over board comments (threaded), while also renderable chronologically. Store attachment metadata in DB and files under `data/uploads/` with non-guessable stored names; validate type/size; authorize every download against ticket access.
- **Alternatives:** Flat-only comments (simpler but weaker for “reply over board comment”), storing blobs in SQLite (complicates backups/size). Rejected to meet the stated interaction and keep storage manageable.

### 7. Resolution workflow as an enforced state machine
- **Decision:** Model explicit states (e.g. `open`, `board_proposed`, `resident_ack`, `closed`) with server-side transition validation. Only board members may propose/close; only the owning resident may acknowledge; close requires `resident_ack`. A new board proposal after acknowledgement moves back to `board_proposed` (invalidates prior ack) requiring fresh acknowledgement. Record proposal/ack/close actors and timestamps; perform checks transactionally to avoid races with multiple board members.
- **Alternatives:** Implicit/agreement-by-comment only (not enforceable), allowing close without ack. Rejected because enforcement is required.

### 8. Notifications via outbox
- **Decision:** Write notification intents to an `notification_outbox` table on key events (create, comment/reply, propose, acknowledge, close) addressed to relevant recipients. A sender component delivers via configurable SMTP and records sent/failed attempts; if SMTP is unconfigured/unavailable, core actions still succeed and outbox rows remain visible/retriable.
- **Alternatives:** Synchronous send in-request (fragile, can block/fail user actions), no persistence. Rejected for reliability and operability.

### 9. Audit history as append-only events
- **Decision:** Append an `audit_events` record for every meaningful mutation with actor, action, entity, timestamp, and contextual details (including state before/after where relevant). Expose a per-ticket timeline (and admin visibility as appropriate). Normal flows never update/delete audit rows.
- **Alternatives:** Rely only on updated timestamps or mutable logs. Rejected because explicit, immutable history is required.

### 10. Project structure (conceptual, for implementation)
- **Decision:** Organize as a small monolith: `app/` (auth, users, tickets, workflow, notifications, audit modules), `templates/`, `static/`, `migrations/`, `tests/`, and `data/` (`community.db`, `uploads/`). Keep secrets/SMTP in env/config (e.g. `.env.example`).
- **Alternatives:** Microservices or separate frontend/backend repos. Rejected as unnecessary for scope and folder-local SQLite.

## Risks / Trade-offs

- [SQLite concurrency/write contention with multiple board members] → Use WAL mode, short transactions, and state checks at write time; suitable for small/community scale, not high concurrency.
- [Workflow edge cases (re-proposal invalidates ack, disputes after ack)] → Encode transitions explicitly and cover with tests/scenarios; allow future extension (e.g. reopen) via new states without breaking history.
- [Attachment security (malicious files, path traversal, unauthorized access)] → Validate type/size, store outside public static paths with generated names, and enforce authorization on every download.
- [Email deliverability and missing SMTP config] → Outbox-first design with recorded failures and no-op/log behavior when unconfigured; document configuration clearly.
- [Bootstrap/admin mistakes or account lockout] → Document bootstrap and recovery steps; audit account creation/role changes.
- [Resident expectation to edit tickets] → v1 assumes no post-create field edits (comments/attachments allowed); can be added later with audit implications. (Assumption recorded in proposal.)

## Migration Plan

Greenfield (no existing users/data to migrate):
1. Initialize project dependencies and configuration from `.env.example` (including SMTP placeholders and secret key).
2. Create/apply database migrations to provision schema in `data/community.db`.
3. Ensure `data/` and `data/uploads/` exist with appropriate local permissions.
4. Run documented bootstrap to create the first board member account.
5. Start the web application and verify login, ticket flow, attachments, notifications outbox, and audit timeline.
- **Rollback:** For local/folder deployment, stop the app and restore `data/` (DB + uploads) from backup; code rollback is reverting to a prior version. No live data migration path required in v1.

## Open Questions

- None blocking the planning artifacts: material ambiguities (bootstrap approach, threaded replies, ack invalidation on re-proposal, resident post-create edits, SMTP runtime behavior) are resolved as documented assumptions in `proposal.md`. Implementation may confirm exact ticket-number format and default category/priority seeds during `/opsx-apply` without changing required behavior.

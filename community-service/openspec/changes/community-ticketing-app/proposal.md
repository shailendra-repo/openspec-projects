# Proposal

## Why

Residents need a simple, trackable way to raise issues/concerns to the community board, and board members need a structured way to discuss and resolve them. A dedicated ticketing app with enforced resolution acknowledgment ensures concerns are recorded with ticket numbers, collaboration is visible, and tickets are closed only after resident confirmation.

## What Changes

- Introduce a web application for community service issue tracking, backed by **SQLite stored in a project data folder** (e.g. `data/community.db`) with file-based attachments stored under the same folder (e.g. `data/uploads/`).
- Add **authentication and role-based access** with a login page for residents and board members; **only board members can create resident accounts** (no resident self-registration). Supports **multiple board members**.
- Add **service ticket** creation by residents with auto-generated **ticket numbers**, plus ticket attributes: **category**, **priority**, title/description, and **attachments/photos** (on tickets and/or comments).
- Add **ticket collaboration**: board members and residents can view tickets according to role (board: all tickets; residents: own tickets) and participate via comments, including **resident replies over board comments**.
- Add an **enforced resolution workflow**: board members can propose resolution; **resident must acknowledge** before a board member can close the ticket (app-enforced). Only board members can close tickets.
- Add **email notifications** for key ticket events via a notification outbox/sender mechanism (configurable SMTP; graceful handling when unconfigured).
- Add **audit history** capturing who did what and when for meaningful ticket/user actions (status changes, comments, attachments, acknowledgments, closure, account creation, etc.).
- **Assumptions (recorded for planning):**
  - **Bootstrap:** the first board member is created via a documented seed/setup step (e.g. CLI or first-run admin seed); board members may create additional board and resident accounts unless constrained later.
  - **Threading:** comments support threaded replies (`reply over board comment`) via a parent-comment reference; chronological view remains available.
  - **Ack invalidation:** if a board member posts a new resolution proposal (or re-proposes) after resident acknowledgement, the ticket returns to a proposed state requiring a fresh resident acknowledgement before close.
  - **Resident edits:** residents may add comments/attachments and acknowledge, but do not edit the original ticket fields after creation in v1 (can be revisited).
  - **Email runtime:** outbox records notifications now; actual delivery depends on SMTP configuration provided at runtime.

## Capabilities

### New Capabilities
- `authentication-and-users`: Login for residents and board members, role-based access control, board-managed resident/board account creation, and initial bootstrap of the first board member.
- `service-tickets`: Resident ticket creation with unique ticket numbers, ticket viewing by role, categories, priority, comments/replies (including reply over board comments), and attachments/photos.
- `ticket-resolution-workflow`: Enforced ticket lifecycle and resolution handshake (board proposes resolution, resident acknowledges, board-only close gated on acknowledgement) with clear status transitions.
- `notifications-and-audit`: Email notifications for key ticket events (outbox + sender) and append-only audit history/timeline for ticket and user actions.

### Modified Capabilities
<!-- None: greenfield project with no existing specs under openspec/specs/. -->

## Impact

- **Codebase:** New application code to be added in this folder (web UI, server/routes, auth/RBAC, ticket/workflow logic, persistence, notifications, audit). No existing application code to modify (greenfield).
- **Data/storage:** New SQLite database in a `data/` folder; attachment/photo storage on disk under the project folder; migrations/schema management.
- **Dependencies (planned):** Web framework, SQLite driver/ORM, password hashing, session/CSRF protection, file upload handling, email/SMTP library — exact choices captured in design.
- **Configuration/ops:** Local runtime configuration for secrets and SMTP (e.g. env/config), database initialization/seed for bootstrap, and file-permission/backup considerations for `data/`.
- **Security & integrity:** Server-side authorization for every action and attachment access, safe upload handling, and transactional/status-validated close with multiple board members.

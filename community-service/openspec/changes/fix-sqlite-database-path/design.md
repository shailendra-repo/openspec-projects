# Design

## Context

The application is a Flask + SQLAlchemy app with SQLite stored in the project `data/` folder (see `proposal.md` - Why). Current behavior in `app/__init__.py` sets a default absolute path (`base_dir/data/community.db`) but, when `DATABASE_URL` is provided, uses it as-is. `.env.example` documents `DATABASE_URL=sqlite:///data/community.db` (a relative SQLite URI), which can fail with `sqlite3.OperationalError: unable to open database file` depending on working directory or if the resolved parent directory is not present at open time.

## Goals / Non-Goals

**Goals:**
- Make file-based SQLite database resolution deterministic and robust for the project (default and configured cases).
- Ensure the database parent directory exists before connections/migrations/app use.
- Keep behavior clear for absolute paths, relative paths, and `:memory:` (tests), and update configuration docs to match.

**Non-Goals:**
- Supporting or changing non-SQLite database engines/URIs beyond leaving them unaffected.
- Redesigning data model, migrations content, or application features unrelated to database location/access.
- Changing runtime behavior of attachments, auth, tickets, notifications, or audit.

## Decisions

- **Normalize SQLite file URIs at app configuration time**
  - **Decision:** Detect `sqlite:///` (and `sqlite:////` absolute) file URIs and resolve relative file paths against the project `base_dir` (or a clearly defined project root) into an absolute path; preserve `:memory:` and leave non-SQLite URIs unchanged. Rationale: removes cwd-dependence and aligns with "SQLite in project data folder".
  - **Alternatives:** Require users to always set absolute URIs (error-prone, poor DX), or rely on cwd being project root (fragile for CLI/tools). Rejected for reliability.

- **Ensure DB parent directory exists for resolved file paths**
  - **Decision:** After resolving the effective SQLite file path, create its parent directory (`mkdir(parents=True, exist_ok=True)`) before SQLAlchemy uses the connection. Rationale: directly prevents "unable to open database file" when directory is missing.
  - **Alternatives:** Only create default `data/` (already done) but not for custom configured paths. Rejected because custom/relative configured paths also need to work.

- **Configuration/documentation alignment**
  - **Decision:** Update `.env.example` and `README.md` to recommend the default project-relative behavior and/or show a safe absolute/normalized form, documenting that relative SQLite paths are resolved relative to the project directory. Rationale: prevents recurrence via misconfiguration.
  - **Alternatives:** Leave docs unchanged. Rejected as users follow examples.

- **Verification approach**
  - **Decision:** Add automated tests that construct apps with relative/explicit SQLite URIs and different working-directory contexts (as applicable) to confirm the database can be opened/created; keep checks scoped to storage configuration behavior. Rationale: guards against regression of this specific failure.

## Risks / Trade-offs

- [Changing resolution of existing relative `DATABASE_URL`] → This makes behavior more deterministic and matches project intent; document clearly. If someone relied on cwd-relative resolution, they may need to adjust to absolute path (unlikely/undesired case).
- [URI parsing edge cases (Windows paths, `sqlite:////`, spaces)] → Use `pathlib`/standard parsing and handle common forms; add tests for typical Windows/project cases.
- [Permissions preventing directory creation] → Surface normal OS errors; no special handling beyond failing clearly (same class of environment issue).

## Migration Plan

- No data migration required. Update application configuration logic and docs; existing `data/community.db` remains valid.
- Users who hit the error should ensure `DATABASE_URL` points to a valid location (or remove it to use the default) and restart; upgrade is a normal code/config update.
- **Rollback:** Revert code/config changes; if a user adopted a newly documented path convention, restore prior `.env` value as needed.

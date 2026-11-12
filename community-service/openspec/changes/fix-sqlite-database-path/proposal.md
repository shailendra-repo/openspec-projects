# Proposal

## Why

Users can encounter `sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) unable to open database file` when running the application, commonly due to how the SQLite database path/URI is resolved (e.g. relative `DATABASE_URL`, missing parent directory, or running from a different working directory). The app must reliably open the configured SQLite database in the project’s data folder.

## What Changes

- Normalize and resolve SQLite database configuration so file-based SQLite paths work reliably regardless of current working directory.
- Ensure the parent directory for the resolved SQLite database file exists before the database is opened/used.
- Clarify/document the expected `DATABASE_URL` format for the project’s `data/community.db` to avoid misconfiguration (e.g. recommend absolute/normalized path or a clearly defined relative form).
- Add/update automated checks (tests or verifiable startup checks) covering SQLite path resolution and database file accessibility.
- **Assumption:** the reported error stems from path resolution/working-directory or directory-existence issues in the current configuration handling; the fix targets SQLite file URIs/paths and does not change non-SQLite database behavior.

## Capabilities

### New Capabilities
- `sqlite-database-location`: Reliable resolution and readiness of the project’s SQLite database file path (including directory creation) so the application can open and use the configured database.

### Modified Capabilities
<!-- None: no existing main specs under openspec/specs/. -->

## Impact

- **Code:** `app/__init__.py` (database URI/config resolution and directory preparation), possibly related config/loading helpers.
- **Configuration/docs:** `.env.example`, `README.md` guidance for `DATABASE_URL` and data folder expectations.
- **Data/storage:** Ensures `data/` (or configured DB parent path) exists and SQLite DB file can be opened/created as intended.
- **Tests:** Add/update tests to verify path resolution and startup/open behavior for configured SQLite locations.
- **Runtime:** Improves reliability when starting the app or running CLI/migrations from expected contexts; no intended change to ticket/auth behavior.

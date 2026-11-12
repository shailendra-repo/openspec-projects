# Tasks

## 1. SQLite database path resolution and readiness

- [x] 1.1 Implement normalization of file-based SQLite database configuration in `app/__init__.py` so default and configured relative SQLite paths are resolved to a deterministic project-appropriate absolute path, absolute paths are honored, in-memory databases remain supported, and non-SQLite URIs are left unchanged; verify with an automated test or scripted check that resolved URIs/paths behave as expected for each case.
- [x] 1.2 Ensure the parent directory for the resolved file-based SQLite database path is created before database use, and verify by exercising app/database initialization against a path whose parent directory does not yet exist and confirming no "unable to open database file" error occurs.

## 2. Configuration, documentation, and regression coverage

- [x] 2.1 Update `.env.example` and `README.md` to document the supported `DATABASE_URL` forms and that relative SQLite paths are resolved relative to the project/data location (or recommend the default), and verify the documented configuration matches the implemented behavior.
- [x] 2.2 Add or update automated tests covering the reported failure mode (e.g. relative SQLite `DATABASE_URL` and/or database directory readiness), and verify the test suite passes for these cases.

## 3. Integration verification

- [x] 3.1 Perform a local verification from the project context (and, if applicable, a different working directory) that the app and database-dependent commands can open/create the configured SQLite database without `sqlite3.OperationalError: unable to open database file`, and verify migrations/startup/bootstrap checks succeed as applicable.

## Workflow follow-up

- The artifacts are ready for review. When ready to implement, run `/opsx-apply` for this change.
- Archive the change after implementation and review requirements are satisfied, then verify the archived result.

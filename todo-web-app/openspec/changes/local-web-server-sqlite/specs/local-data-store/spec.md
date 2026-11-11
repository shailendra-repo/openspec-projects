# Spec Delta

## Purpose

Provide a physical, app-local SQLite database for durable local web server storage of planner and account data while preserving existing data.

## ADDED Requirements

### Requirement: SQLite database stored in app folder
The system SHALL store planner and account data in a SQLite database file located in a `DB/` directory within the application folder.

#### Scenario: Database file location
- **WHEN** the local server initializes or accesses persistent storage
- **THEN** it uses a SQLite database file under the app folder's `DB/` directory as the physical local data store

### Requirement: Existing SQLite data is preserved
The system SHALL preserve and continue using existing data in the app-folder SQLite database when transitioning to the local web server runtime.

#### Scenario: Existing accounts and planner data remain available
- **WHEN** the application is started after the runtime change and an existing compatible SQLite database is present in `DB/`
- **THEN** previously stored local accounts and planner data remain available without requiring data reset or migration away from that database

### Requirement: Server-mediated access to SQLite
The system SHALL access the local SQLite database through the local server rather than through a desktop-shell privileged process boundary.

#### Scenario: Persist data through local server
- **WHEN** the system saves or reads user, task, organization, planning, or preference data during web app usage
- **THEN** the operation is performed by the local server against the SQLite database in `DB/`

### Requirement: Local-only file-based persistence
The system SHALL keep SQLite data local to the device and operate without cloud sync or remote database services.

#### Scenario: Operate without network services
- **WHEN** the user uses the application on the local device without external network connectivity
- **THEN** the system continues to read and write data using the local SQLite database file in the app folder

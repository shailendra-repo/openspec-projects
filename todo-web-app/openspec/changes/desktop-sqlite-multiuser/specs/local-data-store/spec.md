# Spec Delta

## Purpose

Provide a physical, app-local SQLite database for durable desktop storage of planner and account data, replacing browser-based IndexedDB persistence.

## ADDED Requirements

### Requirement: SQLite database stored in app folder
The system SHALL store planner data in a SQLite database file located in a `DB/` directory within the application folder.

#### Scenario: Database file location
- **WHEN** the desktop application initializes or accesses persistent storage
- **THEN** it uses a SQLite database file under the app folder's `DB/` directory as the physical local data store

### Requirement: SQLite replaces IndexedDB storage
The system SHALL use the local SQLite database as the primary persistence mechanism for application data and SHALL NOT require browser IndexedDB for storing planner data.

#### Scenario: Persist data in SQLite
- **WHEN** the system saves user, task, organization, planning, or relevant preference data
- **THEN** the data is persisted in the local SQLite database

#### Scenario: No IndexedDB dependency for primary data
- **WHEN** the application runs in its supported desktop runtime
- **THEN** primary planner and account data remain available through the local SQLite store without relying on browser IndexedDB

### Requirement: Local database initialization
The system SHALL create and initialize the required local database structures in the `DB/` folder when they do not already exist.

#### Scenario: First run creates storage structures
- **WHEN** the application starts and the required SQLite database or schema is missing
- **THEN** the system creates the necessary database file and schema in the `DB/` directory so the app can operate locally

### Requirement: Local-only file-based persistence
The system SHALL keep SQLite data local to the device and operate without cloud sync or remote database services.

#### Scenario: Operate without network services
- **WHEN** the user uses the application on the local device without network connectivity
- **THEN** the system continues to read and write data using the local SQLite database file in the app folder

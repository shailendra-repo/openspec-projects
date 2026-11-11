# Spec Delta

## Purpose

Provide a local server-hosted web runtime so the planner can be used in a browser while preserving local-only operation and access to the app-folder SQLite database.

## ADDED Requirements

### Requirement: Local web server serves the application
The system SHALL provide a local server that serves the web client and exposes application APIs for use in a browser on the same local environment.

#### Scenario: Start local server and access in browser
- **WHEN** a user starts the application server using the documented local command
- **THEN** the server runs locally and the planner web interface is accessible in a browser at a local URL

### Requirement: Browser client uses local server APIs
The system SHALL allow the browser-based client to perform authentication and planner operations through local HTTP APIs provided by the server.

#### Scenario: Client performs authenticated operation via API
- **WHEN** an authenticated user performs a planner action in the browser UI
- **THEN** the client communicates with the local server API and the system applies the requested operation

### Requirement: Electron runtime is not required
The system SHALL operate as a local web application without requiring Electron or desktop-shell IPC as the runtime boundary.

#### Scenario: Run without Electron
- **WHEN** the user runs the supported local web workflow
- **THEN** the application functions in the browser through the local server without launching an Electron desktop shell

### Requirement: Local-only web operation
The system SHALL operate using local server and local database resources without requiring cloud hosting or remote backend services.

#### Scenario: Operate locally
- **WHEN** the user accesses the application on the local machine
- **THEN** the server and data operations run locally and do not depend on remote cloud services

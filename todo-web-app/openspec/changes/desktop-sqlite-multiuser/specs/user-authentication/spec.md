# Spec Delta

## Purpose

Provide local multi-user authentication so different people can securely access their own planner data on the same desktop device.

## ADDED Requirements

### Requirement: Local user account creation
The system SHALL allow a person to create a local user account for accessing the planner on the device.

#### Scenario: Create a new account
- **WHEN** a person provides the required account information and submits account creation
- **THEN** the system creates a local account and allows the person to use that account to log in

#### Scenario: Prevent duplicate account identity
- **WHEN** a person attempts to create an account using an identity that already exists locally
- **THEN** the system rejects the creation request and informs the person that the identity is unavailable

### Requirement: Local login and logout
The system SHALL allow a registered local user to log in with valid credentials and to log out of the current session.

#### Scenario: Successful login
- **WHEN** a registered user submits valid login credentials
- **THEN** the system establishes an authenticated session and grants access to that user's planner data

#### Scenario: Failed login
- **WHEN** a person submits invalid login credentials
- **THEN** the system denies access, does not establish an authenticated session, and presents an error without revealing sensitive credential details

#### Scenario: Logout
- **WHEN** an authenticated user chooses to log out
- **THEN** the system ends the authenticated session and returns the user to an unauthenticated state

### Requirement: Authenticated access control
The system SHALL restrict planner data and planning operations to the currently authenticated local user.

#### Scenario: Unauthenticated access blocked
- **WHEN** a person is not authenticated
- **THEN** the system requires login before allowing access to planner content

#### Scenario: Data isolation between users
- **WHEN** different local users log in on the same device at different times
- **THEN** each user can access only their own tasks, lists, tags, and related planner data

### Requirement: Local credential handling
The system SHALL store and verify user credentials locally without relying on remote authentication services.

#### Scenario: Local-only credential verification
- **WHEN** a user attempts to log in
- **THEN** the system verifies credentials using locally stored authentication data and does not require network or cloud services

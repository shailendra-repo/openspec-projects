# Spec Delta

## Purpose

Provide secure login and role-based access so residents and board members can use the system, with board-managed account creation and a way to bootstrap the first board member.

## ADDED Requirements

### Requirement: Role-based login
The system SHALL provide a login page for residents and board members and SHALL authenticate users using their credentials before granting access to role-appropriate features.

#### Scenario: Successful resident login
- **WHEN** a resident submits valid login credentials
- **THEN** the system establishes an authenticated session and directs the resident to resident-appropriate ticket views

#### Scenario: Successful board member login
- **WHEN** a board member submits valid login credentials
- **THEN** the system establishes an authenticated session and directs the board member to board-appropriate views including all tickets and user management

#### Scenario: Invalid credentials
- **WHEN** a user submits invalid login credentials
- **THEN** the system denies access, does not establish a session, and presents an error without revealing which credential field was incorrect

### Requirement: Board-managed account creation
The system SHALL allow only authenticated board members to create user accounts for residents and SHALL NOT provide resident self-registration.

#### Scenario: Board member creates a resident account
- **WHEN** an authenticated board member submits valid details to create a resident account
- **THEN** the system creates the resident account, records the creating actor in account metadata or audit context, and makes the account available for resident login according to its active status

#### Scenario: Resident cannot create accounts
- **WHEN** an authenticated resident attempts to access or invoke account creation functionality
- **THEN** the system denies the action

### Requirement: Multiple board members
The system SHALL support multiple active board member accounts with equivalent board permissions for ticket management and user administration as defined by this change.

#### Scenario: More than one board member can act
- **WHEN** two or more active board member accounts exist
- **THEN** each authenticated board member can perform board-authorized actions subject to workflow and authorization rules

### Requirement: Initial board member bootstrap
The system SHALL provide a documented bootstrap mechanism to create the first board member account when no board member exists.

#### Scenario: First board member is created during setup
- **WHEN** an administrator/operator runs the documented bootstrap/setup step with required initial board member details
- **THEN** the system creates an active board member account that can log in and create additional accounts

### Requirement: Server-side authorization enforcement
The system SHALL enforce role-based authorization on the server for every protected page, action, and data access, not relying on UI visibility alone.

#### Scenario: Unauthorized direct request is rejected
- **WHEN** a user attempts a protected action or resource access not permitted for their role
- **THEN** the system rejects the request and does not perform the action or disclose unauthorized data

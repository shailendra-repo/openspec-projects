# Spec Delta

## Purpose

Enforce a clear ticket resolution lifecycle where a board member proposes resolution, the resident must acknowledge it, and only a board member can close the ticket after that acknowledgement.

## ADDED Requirements

### Requirement: Board proposes resolution
The system SHALL allow authenticated board members to mark a ticket as having a proposed resolution, recording the proposing actor and time.

#### Scenario: Board member proposes resolution
- **WHEN** an authenticated board member proposes resolution for an open or in-discussion ticket
- **THEN** the system transitions the ticket to a resolution-proposed state, records proposal metadata, and makes the proposed state visible to authorized users

### Requirement: Resident acknowledgement required before close
The system SHALL require the owning resident to explicitly acknowledge a proposed resolution before the ticket can be closed.

#### Scenario: Resident acknowledges proposed resolution
- **WHEN** the authenticated owning resident acknowledges a ticket that is in a resolution-proposed state
- **THEN** the system records the acknowledgement and transitions the ticket to a resident-acknowledged state eligible for board closure

#### Scenario: Resident cannot acknowledge another resident's ticket
- **WHEN** an authenticated resident attempts to acknowledge a ticket they do not own
- **THEN** the system denies the action

### Requirement: Board-only closure gated on acknowledgement
The system SHALL allow only authenticated board members to close tickets and SHALL reject closure unless the ticket is in a resident-acknowledged state.

#### Scenario: Board member closes an acknowledged ticket
- **WHEN** an authenticated board member attempts to close a ticket that is in a resident-acknowledged state
- **THEN** the system closes the ticket, records the closing board member and closure time, and transitions the ticket to a closed state

#### Scenario: Closure rejected without resident acknowledgement
- **WHEN** an authenticated board member attempts to close a ticket that is not in a resident-acknowledged state
- **THEN** the system rejects the closure and leaves the ticket in its current state

#### Scenario: Resident cannot close a ticket
- **WHEN** an authenticated resident attempts to close any ticket
- **THEN** the system denies the action

### Requirement: Acknowledgement invalidation on re-proposal
The system SHALL require a fresh resident acknowledgement if a board member re-proposes or submits a new resolution proposal after a prior resident acknowledgement.

#### Scenario: New proposal after acknowledgement resets eligibility
- **WHEN** a ticket is in a resident-acknowledged state and a board member submits a new resolution proposal
- **THEN** the system transitions the ticket back to a resolution-proposed state and requires the resident to acknowledge again before closure is permitted

### Requirement: Status transition integrity
The system SHALL enforce valid status transitions for ticket resolution actions and SHALL validate the current ticket state at the time of each mutating action.

#### Scenario: Invalid transition is rejected
- **WHEN** a user attempts a resolution action that is not valid for the ticket's current state
- **THEN** the system rejects the action and does not partially update ticket resolution state

# Spec Delta

## Purpose

Keep residents and board members informed of important ticket activity through email notifications and provide an auditable history of meaningful actions for accountability and traceability.

## ADDED Requirements

### Requirement: Email notifications for key ticket events
The system SHALL generate email notifications for key ticket events, including at minimum ticket creation, new comment/reply activity, resolution proposed, resident acknowledgement, and ticket closure, targeted to relevant users based on role and ticket ownership.

#### Scenario: Notification generated on key event
- **WHEN** a key ticket event occurs
- **THEN** the system creates a notification record for each intended recipient with event context sufficient to inform them of the action

#### Scenario: Resident receives relevant ticket updates
- **WHEN** a board member comments, proposes resolution, or closes the resident's ticket
- **THEN** the system generates an email notification addressed to the owning resident according to configured notification rules

### Requirement: Notification outbox and delivery handling
The system SHALL record outbound email notifications in an outbox and SHALL attempt delivery through configurable SMTP settings, handling delivery success and failure without losing the notification intent.

#### Scenario: Outbox records pending notification
- **WHEN** a notification is generated
- **THEN** the system persists it in an outbox with pending delivery status before or as part of delivery processing

#### Scenario: Delivery outcome is recorded
- **WHEN** the system attempts to send a pending email notification
- **THEN** the system records the outcome as sent or failed with failure details when applicable, allowing later retry according to implementation policy

#### Scenario: Unconfigured SMTP does not block core actions
- **WHEN** SMTP delivery is not configured or delivery fails for a notification
- **THEN** the system still completes the originating ticket/user action and retains the notification record for visibility or later delivery

### Requirement: Audit history for meaningful actions
The system SHALL maintain an append-only audit history of meaningful actions, including actor, action type, affected entity, relevant before/after or detail context, and timestamp.

#### Scenario: Mutating action is audited
- **WHEN** a user performs a meaningful action such as account creation, ticket creation/update, comment or attachment addition, resolution proposal, acknowledgement, or closure
- **THEN** the system appends an audit event capturing who performed the action, what changed, and when

#### Scenario: Authorized users can view ticket audit timeline
- **WHEN** an authorized user views a ticket's audit history
- **THEN** the system displays the recorded audit events for that ticket in chronological order consistent with the user's access permissions

#### Scenario: Audit records are not modified through normal use
- **WHEN** users interact with tickets and accounts through normal application actions
- **THEN** previously recorded audit events remain intact and are not edited or deleted by those actions

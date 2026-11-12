# Spec Delta

## Purpose

Enable residents to raise and track service issues as tickets and enable residents and board members to collaborate on those tickets through role-scoped visibility, comments, replies, and attachments.

## ADDED Requirements

### Requirement: Resident ticket creation with unique ticket number
The system SHALL allow authenticated residents to create service tickets and SHALL assign each ticket a unique, human-readable ticket number at creation time.

#### Scenario: Resident creates a ticket
- **WHEN** an authenticated resident submits a new ticket with required details
- **THEN** the system creates the ticket, assigns a unique ticket number, associates it with the resident, and makes it viewable to the resident and board members

#### Scenario: Ticket numbers are unique
- **WHEN** multiple tickets are created over time
- **THEN** each ticket receives a ticket number that is unique within the system

### Requirement: Ticket attributes
The system SHALL capture and store ticket title, description, category, and priority, and SHALL allow board members to manage the set of available categories.

#### Scenario: Ticket includes category and priority
- **WHEN** a resident creates a ticket or a board member updates ticket classification as permitted
- **THEN** the system persists the selected category and priority and displays them in ticket views

#### Scenario: Board member manages categories
- **WHEN** an authenticated board member creates, updates, or deactivates a category
- **THEN** the system reflects the change for subsequent ticket classification while preserving historical ticket associations as stored

### Requirement: Role-scoped ticket visibility
The system SHALL restrict ticket visibility so that residents can view only their own tickets and board members can view all tickets.

#### Scenario: Resident views own tickets
- **WHEN** an authenticated resident accesses the ticket list or a ticket detail
- **THEN** the system shows only tickets created by that resident and denies access to other residents' tickets

#### Scenario: Board member views all tickets
- **WHEN** an authenticated board member accesses the ticket list or a ticket detail
- **THEN** the system shows tickets across all residents

### Requirement: Comments and replies
The system SHALL allow board members and the ticket's resident to add comments on a ticket and SHALL allow residents to reply over board comments within their own tickets.

#### Scenario: Board member comments on a ticket
- **WHEN** an authenticated board member submits a comment on any ticket
- **THEN** the system stores the comment with author and timestamp and displays it in the ticket conversation

#### Scenario: Resident replies over a board comment
- **WHEN** an authenticated resident submits a reply associated with a board comment on their own ticket
- **THEN** the system stores the reply linked to the referenced comment, displays it in context of that comment, and attributes it to the resident

#### Scenario: Resident cannot comment on another resident's ticket
- **WHEN** an authenticated resident attempts to comment or reply on a ticket they do not own
- **THEN** the system denies the action

### Requirement: Attachments and photos
The system SHALL allow supported attachments/photos to be added to tickets and/or comments, store them in the project data folder, and enforce access control on retrieval.

#### Scenario: Attachment uploaded with a ticket or comment
- **WHEN** an authorized user uploads a supported attachment/photo as part of creating a ticket or adding a comment
- **THEN** the system stores the file under the application's data storage area, records attachment metadata, and displays the attachment in the relevant ticket context

#### Scenario: Unauthorized attachment access is denied
- **WHEN** a user requests an attachment associated with a ticket they are not authorized to view
- **THEN** the system denies access to the file and does not disclose its contents

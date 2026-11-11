# Spec Delta

## MODIFIED Requirements

### Requirement: Quick task capture
The system SHALL allow an authenticated user to create a new task with a title from a primary capture input with minimal interaction, scoped to that user's planner data.

#### Scenario: Create task from quick add input
- **WHEN** an authenticated user enters a non-empty task title in the quick add control and confirms creation
- **THEN** the system creates a new task for that user with that title in the selected or default list
- **AND** the task appears in relevant views without requiring a page reload

### Requirement: Task editing and deletion
The system SHALL allow an authenticated user to update that user's task details and to delete that user's tasks.

#### Scenario: Edit a task title
- **WHEN** an authenticated user edits a task's title and saves the change
- **THEN** the system persists the updated title in the local SQLite data store and displays it in relevant views

#### Scenario: Delete a task
- **WHEN** an authenticated user chooses to delete a task and confirms the action if confirmation is required by the interface
- **THEN** the system removes the task from active views and from the user's persisted data in the local SQLite data store

### Requirement: Task completion and undo
The system SHALL allow an authenticated user to mark that user's task complete or incomplete and SHALL provide a way to reverse a recent completion action.

#### Scenario: Complete a task
- **WHEN** an authenticated user marks an incomplete task as complete
- **THEN** the system records the task as completed for that user and reflects its completed state in relevant views

#### Scenario: Undo completion
- **WHEN** an authenticated user invokes undo shortly after completing a task
- **THEN** the system restores the task to its prior incomplete state

### Requirement: Subtasks and checklists
The system SHALL allow an authenticated user to define subtasks or checklist items within that user's task and track their completion independently.

#### Scenario: Add and complete a subtask
- **WHEN** an authenticated user adds a subtask to a task and later marks that subtask complete
- **THEN** the system persists the subtask and its completion state in the local SQLite data store and displays progress consistent with the task's checklist state

### Requirement: Manual task ordering
The system SHALL allow an authenticated user to manually reorder that user's tasks within contexts where ordering is supported.

#### Scenario: Reorder tasks by drag interaction
- **WHEN** an authenticated user drags a task to a new position within a supported list or view
- **THEN** the system saves the new order in the local SQLite data store and presents tasks in that order on subsequent views of the same context

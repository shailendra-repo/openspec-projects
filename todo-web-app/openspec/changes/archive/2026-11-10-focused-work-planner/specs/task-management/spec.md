# Spec Delta

## Purpose

Provide core task lifecycle capabilities so users can capture, maintain, complete, and organize individual work items in a focused planner.

## ADDED Requirements

### Requirement: Quick task capture
The system SHALL allow a user to create a new task with a title from a primary capture input with minimal interaction.

#### Scenario: Create task from quick add input
- **WHEN** the user enters a non-empty task title in the quick add control and confirms creation
- **THEN** the system creates a new task with that title in the selected or default list
- **AND** the task appears in relevant views without requiring a page reload

### Requirement: Task editing and deletion
The system SHALL allow a user to update a task's editable details and to delete a task.

#### Scenario: Edit a task title
- **WHEN** the user edits a task's title and saves the change
- **THEN** the system persists the updated title and displays it in relevant views

#### Scenario: Delete a task
- **WHEN** the user chooses to delete a task and confirms the action if confirmation is required by the interface
- **THEN** the system removes the task from active views and local persisted data

### Requirement: Task completion and undo
The system SHALL allow a user to mark a task complete or incomplete and SHALL provide a way to reverse a recent completion action.

#### Scenario: Complete a task
- **WHEN** the user marks an incomplete task as complete
- **THEN** the system records the task as completed and reflects its completed state in relevant views

#### Scenario: Undo completion
- **WHEN** the user invokes undo shortly after completing a task
- **THEN** the system restores the task to its prior incomplete state

### Requirement: Subtasks and checklists
The system SHALL allow a user to define subtasks or checklist items within a task and track their completion independently.

#### Scenario: Add and complete a subtask
- **WHEN** the user adds a subtask to a task and later marks that subtask complete
- **THEN** the system persists the subtask, its completion state, and displays progress consistent with the task's checklist state

### Requirement: Manual task ordering
The system SHALL allow a user to manually reorder tasks within contexts where ordering is supported.

#### Scenario: Reorder tasks by drag interaction
- **WHEN** the user drags a task to a new position within a supported list or view
- **THEN** the system saves the new order and presents tasks in that order on subsequent views of the same context

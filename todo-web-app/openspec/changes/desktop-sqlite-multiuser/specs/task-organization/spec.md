# Spec Delta

## MODIFIED Requirements

### Requirement: Lists and projects
The system SHALL allow an authenticated user to create, rename, and delete that user's lists or projects and assign that user's tasks to them.

#### Scenario: Create and assign a task to a list
- **WHEN** an authenticated user creates a new list or project and assigns a task to it
- **THEN** the system persists the list and association in the local SQLite data store and shows the task within that list's context

#### Scenario: Remove a list or project
- **WHEN** an authenticated user deletes a list or project
- **THEN** the system applies a defined handling for tasks previously in that list (such as moving to a default list or requiring reassignment) and does not leave orphaned references in the user's data

### Requirement: Tags and labels
The system SHALL allow an authenticated user to add and remove tags or labels on that user's tasks for flexible categorization.

#### Scenario: Tag a task
- **WHEN** an authenticated user adds a tag or label to a task
- **THEN** the system persists the tag association in the local SQLite data store and makes the task discoverable by that tag for that user

### Requirement: Filtering and search
The system SHALL allow an authenticated user to filter or search that user's tasks by relevant organization attributes such as list/project, tag, completion state, or text.

#### Scenario: Filter tasks by tag
- **WHEN** an authenticated user selects a tag filter
- **THEN** the system displays only that user's tasks matching that tag within the current scope

#### Scenario: Search tasks by text
- **WHEN** an authenticated user enters a search query
- **THEN** the system displays that user's tasks whose searchable fields match the query according to the interface's matching behavior

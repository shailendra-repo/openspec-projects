# Spec Delta

## Purpose

Enable users to organize and locate work by grouping tasks into lists or projects and by applying tags and filters.

## ADDED Requirements

### Requirement: Lists and projects
The system SHALL allow a user to create, rename, and delete lists or projects and assign tasks to them.

#### Scenario: Create and assign a task to a list
- **WHEN** the user creates a new list or project and assigns a task to it
- **THEN** the system persists the list and association and shows the task within that list's context

#### Scenario: Remove a list or project
- **WHEN** the user deletes a list or project
- **THEN** the system applies a defined handling for tasks previously in that list (such as moving to a default list or requiring reassignment) and does not leave orphaned references

### Requirement: Tags and labels
The system SHALL allow a user to add and remove tags or labels on tasks for flexible categorization.

#### Scenario: Tag a task
- **WHEN** the user adds a tag or label to a task
- **THEN** the system persists the tag association and makes the task discoverable by that tag

### Requirement: Filtering and search
The system SHALL allow a user to filter or search tasks by relevant organization attributes such as list/project, tag, completion state, or text.

#### Scenario: Filter tasks by tag
- **WHEN** the user selects a tag filter
- **THEN** the system displays only tasks matching that tag within the current scope

#### Scenario: Search tasks by text
- **WHEN** the user enters a search query
- **THEN** the system displays tasks whose searchable fields match the query according to the interface's matching behavior

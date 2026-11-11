# Spec Delta

## Purpose

Support time-oriented planning by letting users schedule work, focus on what is due, and receive best-effort local reminders.

## ADDED Requirements

### Requirement: Due dates
The system SHALL allow a user to set, change, and clear a due date on a task.

#### Scenario: Set a due date
- **WHEN** the user assigns a due date to a task
- **THEN** the system persists the due date and uses it for planning views and date-based filtering

#### Scenario: Clear a due date
- **WHEN** the user removes a due date from a task
- **THEN** the system no longer treats the task as scheduled for that date in planning views

### Requirement: Today and Upcoming planning views
The system SHALL provide planning views that help users focus on tasks due today and tasks due in the future.

#### Scenario: View tasks due today
- **WHEN** the user opens the Today view
- **THEN** the system displays tasks whose due dates qualify as due today according to local date rules

#### Scenario: View upcoming tasks
- **WHEN** the user opens the Upcoming view
- **THEN** the system displays tasks with future due dates in a time-ordered or date-grouped presentation

### Requirement: Local reminders
The system SHALL support optional, best-effort reminders for tasks using local browser capabilities without requiring a server.

#### Scenario: Enable reminder with permission granted
- **WHEN** the user enables a reminder for a task and grants notification permission
- **THEN** the system schedules or attempts to deliver a local notification at the configured time while operating within browser/platform constraints

#### Scenario: Reminder unavailable or denied
- **WHEN** notification permission is denied or the environment cannot deliver a reminder
- **THEN** the system informs the user of the limitation and continues to function without server-side reminder delivery

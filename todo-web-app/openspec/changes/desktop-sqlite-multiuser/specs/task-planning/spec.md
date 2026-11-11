# Spec Delta

## MODIFIED Requirements

### Requirement: Due dates
The system SHALL allow an authenticated user to set, change, and clear a due date on that user's tasks.

#### Scenario: Set a due date
- **WHEN** an authenticated user assigns a due date to a task
- **THEN** the system persists the due date in the local SQLite data store and uses it for planning views and date-based filtering

#### Scenario: Clear a due date
- **WHEN** an authenticated user removes a due date from a task
- **THEN** the system no longer treats the task as scheduled for that date in planning views

### Requirement: Today and Upcoming planning views
The system SHALL provide planning views that help an authenticated user focus on that user's tasks due today and tasks due in the future.

#### Scenario: View tasks due today
- **WHEN** an authenticated user opens the Today view
- **THEN** the system displays that user's tasks whose due dates qualify as due today according to local date rules

#### Scenario: View upcoming tasks
- **WHEN** an authenticated user opens the Upcoming view
- **THEN** the system displays that user's tasks with future due dates in a time-ordered or date-grouped presentation

### Requirement: Local reminders
The system SHALL support optional, best-effort reminders for an authenticated user's tasks using local desktop/runtime capabilities without requiring a server.

#### Scenario: Enable reminder with permission granted
- **WHEN** an authenticated user enables a reminder for a task and the runtime grants any required notification permission
- **THEN** the system schedules or attempts to deliver a local notification at the configured time while operating within desktop/runtime constraints

#### Scenario: Reminder unavailable or denied
- **WHEN** notification permission is denied or the desktop/runtime environment cannot deliver a reminder
- **THEN** the system informs the user of the limitation and continues to function without server-side reminder delivery

# Spec Delta

## MODIFIED Requirements

### Requirement: User can toggle between light and dark themes
The system SHALL provide a visible control that allows an authenticated user to switch the application appearance between light mode and dark mode.

#### Scenario: Switch to dark mode
- **WHEN** an authenticated user activates the theme toggle while light mode is active
- **THEN** the application displays using the dark theme

#### Scenario: Switch to light mode
- **WHEN** an authenticated user activates the theme toggle while dark mode is active
- **THEN** the application displays using the light theme

### Requirement: Theme changes apply immediately
The system SHALL apply the selected theme to the current UI without requiring a page reload.

#### Scenario: Immediate theme update
- **WHEN** an authenticated user changes the theme
- **THEN** the visible appearance of the app shell and current view updates to the selected theme immediately

### Requirement: Theme preference is persisted locally
The system SHALL store the user's selected theme preference locally in the SQLite data store and restore it on subsequent application loads for that user context.

#### Scenario: Preference restored after reload
- **WHEN** an authenticated user selects a theme and later reloads or reopens the web application in the same local environment
- **THEN** the application restores and applies that user's previously selected theme

### Requirement: Initial theme follows a sensible default
When no saved theme preference exists for the current user context, the system SHALL determine the initial theme using the system color scheme preference where available, and SHALL fall back to light mode if the system preference is unavailable.

#### Scenario: No saved preference with system preference available
- **WHEN** an authenticated user opens the application with no saved theme preference and the environment reports a system color scheme preference
- **THEN** the application initially uses the theme matching that system preference

#### Scenario: No saved preference with system preference unavailable
- **WHEN** an authenticated user opens the application with no saved theme preference and no system color scheme preference is available
- **THEN** the application initially uses light mode

#### Scenario: Saved preference overrides default
- **WHEN** an authenticated user has a saved theme preference
- **THEN** the application uses the saved preference instead of the system/default theme

### Requirement: Core planner views remain usable in both themes
The system SHALL present primary planner content and controls (including authentication, capture, organization, planning, and completion flows) with readable and usable styling in both light and dark themes.

#### Scenario: Use core flows in dark mode
- **WHEN** a user performs core application actions while dark mode is active
- **THEN** authentication and planner content, navigation, and interactive controls remain visible and usable

#### Scenario: Use core flows in light mode
- **WHEN** a user performs core application actions while light mode is active
- **THEN** authentication and planner content, navigation, and interactive controls remain visible and usable

## ADDED Requirements

### Requirement: Authentication entry and account access UI
The system SHALL provide browser-based user interface flows for local account creation and login before granting access to planner content.

#### Scenario: Show login when unauthenticated
- **WHEN** a person opens the web application without an authenticated session
- **THEN** the system presents an interface to log in or access local account creation

#### Scenario: Access planner after authentication
- **WHEN** a user successfully authenticates
- **THEN** the system presents that user's planner workspace and controls

### Requirement: Logout control in authenticated app shell
The system SHALL provide a visible control for an authenticated user to log out from the application shell.

#### Scenario: User logs out from app shell
- **WHEN** an authenticated user activates the logout control
- **THEN** the system ends the session and returns the interface to the unauthenticated state

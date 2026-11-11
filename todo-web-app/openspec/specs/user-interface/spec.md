# user-interface Specification

## Purpose

Provide application appearance and theming controls so users can view and use the planner comfortably in light or dark modes with a locally persisted preference.

## Requirements

### Requirement: User can toggle between light and dark themes
The system SHALL provide a visible control that allows the user to switch the application appearance between light mode and dark mode.

#### Scenario: Switch to dark mode
- **WHEN** the user activates the theme toggle while light mode is active
- **THEN** the application displays using the dark theme

#### Scenario: Switch to light mode
- **WHEN** the user activates the theme toggle while dark mode is active
- **THEN** the application displays using the light theme

### Requirement: Theme changes apply immediately
The system SHALL apply the selected theme to the current UI without requiring a page reload.

#### Scenario: Immediate theme update
- **WHEN** the user changes the theme
- **THEN** the visible appearance of the app shell and current view updates to the selected theme immediately

### Requirement: Theme preference is persisted locally
The system SHALL store the user's selected theme preference locally on the device and restore it on subsequent application loads in the same browser/profile.

#### Scenario: Preference restored after reload
- **WHEN** the user selects a theme and later reloads or reopens the application in the same browser/profile
- **THEN** the application restores and applies the previously selected theme

### Requirement: Initial theme follows a sensible default
When no saved theme preference exists, the system SHALL determine the initial theme using the user's system color scheme preference (`prefers-color-scheme`) where available, and SHALL fall back to light mode if the system preference is unavailable.

#### Scenario: No saved preference with system preference available
- **WHEN** the user opens the application with no saved theme preference and the environment reports a system color scheme preference
- **THEN** the application initially uses the theme matching that system preference

#### Scenario: No saved preference with system preference unavailable
- **WHEN** the user opens the application with no saved theme preference and no system color scheme preference is available
- **THEN** the application initially uses light mode

#### Scenario: Saved preference overrides default
- **WHEN** the user has a saved theme preference
- **THEN** the application uses the saved preference instead of the system/default theme

### Requirement: Core planner views remain usable in both themes
The system SHALL present primary planner content and controls (including capture, organization, planning, and completion flows) with readable and usable styling in both light and dark themes.

#### Scenario: Use core flows in dark mode
- **WHEN** the user performs core planning actions while dark mode is active
- **THEN** task content, navigation, and interactive controls remain visible and usable

#### Scenario: Use core flows in light mode
- **WHEN** the user performs core planning actions while light mode is active
- **THEN** task content, navigation, and interactive controls remain visible and usable

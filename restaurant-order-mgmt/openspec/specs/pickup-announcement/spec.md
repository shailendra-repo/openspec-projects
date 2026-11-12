# pickup-announcement Specification

## Purpose

Notify staff and nearby customers by voice when an in-transit order becomes ready for pickup in the split-page, backend-backed workflow.

## Requirements

### Requirement: Enable or disable voice announcements on dashboard
The system SHALL provide a control on the Dashboard page to enable or disable voice pickup announcements for that screen/device context.

#### Scenario: Staff enables voice announcements
- **WHEN** staff turns voice announcements on from the Dashboard
- **THEN** the system records that voice announcements are enabled for that Dashboard context

#### Scenario: Staff disables voice announcements
- **WHEN** staff turns voice announcements off from the Dashboard
- **THEN** the system does not speak pickup announcements while voice announcements are disabled

### Requirement: Announce order ready for pickup
The system SHALL, when voice announcements are enabled, speak a pickup announcement containing both the order number and customer name when an order transitions to READY.

#### Scenario: Ready transition triggers voice announcement
- **WHEN** an in-transit order transitions to READY and voice announcements are enabled
- **THEN** the system speaks an announcement equivalent to "Order `<number>`, `<name>` is ready for pickup"

#### Scenario: No announcement when voice is disabled
- **WHEN** an order transitions to READY and voice announcements are disabled
- **THEN** the system does not speak a pickup announcement and the order still appears in the READY state on the Dashboard

### Requirement: Prevent duplicate pickup announcements
The system SHALL announce each order's ready-for-pickup message only once for the transition into READY, even if the Dashboard view re-renders or reloads while the order remains READY.

#### Scenario: Re-render or reload does not repeat announcement
- **WHEN** an order is already in READY status and has already been announced, and the Dashboard re-renders or reloads
- **THEN** the system does not speak the pickup announcement again for that same READY transition

### Requirement: Visual state remains authoritative
The system SHALL treat the Dashboard READY visual state as the authoritative signal of readiness regardless of whether speech output succeeds.

#### Scenario: Speech unavailable or fails
- **WHEN** an order transitions to READY but speech synthesis is unavailable or cannot complete playback
- **THEN** the order is still shown in the READY (green) state on the Dashboard without blocking the status transition

# in-transit-dashboard Specification

## Purpose

Provide a dedicated live dashboard of orders in transit that can be viewed on a separate screen while staff manage order progress.

## Requirements

### Requirement: Dedicated in-transit dashboard page
The system SHALL provide a Dashboard page/route that displays only orders in transit, defined as orders with status PLACED or READY, suitable for display on another screen.

#### Scenario: Dashboard shows only in-transit orders
- **WHEN** staff opens the Dashboard route
- **THEN** the system displays PLACED and READY orders and does not display FULFILLED orders

### Requirement: Display placed orders as in progress
The system SHALL display each PLACED order in a yellow in-progress state showing its order number, customer name, and selected items with an action to mark it ready.

#### Scenario: Placed order is visible on the dashboard
- **WHEN** an order is in PLACED status
- **THEN** the Dashboard shows it in the PLACED (yellow, in-progress) section with order number, customer name, item summary, and a "Mark Ready" action

### Requirement: Display ready orders for pickup
The system SHALL display each READY order in a green ready-for-pickup state showing its order number and customer name with an action to mark it picked up.

#### Scenario: Ready order is visible on the dashboard
- **WHEN** an order is in READY status
- **THEN** the Dashboard shows it in the READY (green, ready-for-pickup) section with order number, customer name, and a "Mark Picked Up" action

### Requirement: Staff can advance in-transit orders
The system SHALL allow staff to transition a PLACED order to READY and a READY order to FULFILLED from the Dashboard.

#### Scenario: Counter staff marks an order ready
- **WHEN** staff marks a PLACED order as ready on the Dashboard
- **THEN** the system updates the order status to READY in the shared database and shows it in the READY section

#### Scenario: Counter staff marks an order picked up
- **WHEN** staff marks a READY order as picked up on the Dashboard
- **THEN** the system updates the order status to FULFILLED in the shared database and removes it from the in-transit Dashboard view

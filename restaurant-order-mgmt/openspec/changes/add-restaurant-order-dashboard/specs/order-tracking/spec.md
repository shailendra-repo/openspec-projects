# Spec Delta

## Purpose

Provide counter staff with a single-screen dashboard to create customer orders, track them through a clear lifecycle, and view today's fulfilled pickups.

## ADDED Requirements

### Requirement: Create an order for a customer
The system SHALL allow counter staff to create an order for a named customer that includes at least one selected available menu item or cuisine and assigns a unique order number.

#### Scenario: Staff places a new order
- **WHEN** counter staff enters a customer name, selects one or more available items/cuisine, and confirms order creation
- **THEN** the system creates the order in PLACED status with a unique order number and displays it in the PLACED (in-progress) view

#### Scenario: Order creation requires minimum information
- **WHEN** counter staff attempts to create an order without a customer name or without any selected item
- **THEN** the system prevents creation and indicates the missing required information

### Requirement: Display placed orders as in progress
The system SHALL display each PLACED order on the dashboard in a yellow in-progress state showing its order number, customer name, and selected items.

#### Scenario: Placed order is visible on the dashboard
- **WHEN** an order is in PLACED status
- **THEN** the dashboard shows it in the PLACED (yellow, in-progress) section with order number, customer name, and item summary

### Requirement: Staff can mark a placed order ready for pickup
The system SHALL allow counter staff to transition a PLACED order to READY, indicating it is ready for customer pickup.

#### Scenario: Counter staff marks an order ready
- **WHEN** counter staff chooses to mark a PLACED order as ready
- **THEN** the system changes the order status to READY and moves it to the READY view

### Requirement: Display ready orders for pickup
The system SHALL display each READY order on the dashboard in a green ready-for-pickup state showing its order number and customer name until it is marked picked up.

#### Scenario: Ready order is visible for pickup
- **WHEN** an order is in READY status
- **THEN** the dashboard shows it in the READY (green, ready for pickup) section with order number, customer name, and an action to mark it picked up

### Requirement: Staff can mark a ready order as picked up
The system SHALL allow counter staff to transition a READY order to FULFILLED when the customer picks it up.

#### Scenario: Counter staff marks an order picked up
- **WHEN** counter staff chooses to mark a READY order as picked up
- **THEN** the system changes the order status to FULFILLED and moves it to the fulfilled queue

### Requirement: Show today's fulfilled orders in a fulfilled queue
The system SHALL display FULFILLED orders from the current day in a dedicated fulfilled queue on the same dashboard, visible as a historical record for today.

#### Scenario: Picked up order appears in today's fulfilled queue
- **WHEN** an order is marked FULFILLED on the current day
- **THEN** the dashboard shows it in the fulfilled queue for today with its order number and customer name

#### Scenario: Fulfilled queue is limited to today
- **WHEN** the dashboard displays the fulfilled queue
- **THEN** it includes only orders fulfilled during the current day and does not include orders fulfilled on previous days in that queue

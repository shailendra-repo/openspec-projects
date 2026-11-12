# Spec Delta

## Purpose

Allow counter staff to place new customer orders from saved menu items on a dedicated page focused only on order creation.

## ADDED Requirements

### Requirement: Dedicated order creation page
The system SHALL provide a CreateOrder page/route that presents only order-creation options and does not display the in-transit dashboard board.

#### Scenario: Staff opens the CreateOrder page
- **WHEN** staff navigates to the CreateOrder route
- **THEN** the system displays the order-creation interface without the in-transit order board sections

### Requirement: Create an order from saved items
The system SHALL allow staff to create an order for a named customer by selecting one or more saved menu items retrieved from the shared database and assigning a unique order number.

#### Scenario: Staff places a new order
- **WHEN** staff enters a customer name, selects one or more saved items, and confirms order creation
- **THEN** the system creates the order in PLACED status with a unique order number and persists it in the shared database

#### Scenario: Order creation requires minimum information
- **WHEN** staff attempts to create an order without a customer name or without any selected saved item
- **THEN** the system prevents creation and indicates the missing required information

#### Scenario: No saved items available
- **WHEN** staff opens the CreateOrder page and no saved items exist
- **THEN** the system indicates that items must be created before an order can be placed and prevents placing an order with no items

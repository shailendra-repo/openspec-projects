# Spec Delta

## Purpose

Provide durable, shared storage for menu items and orders using a local SQLite database so application pages can read and write consistent data.

## ADDED Requirements

### Requirement: Store data in a SQLite database under DB folder
The system SHALL persist menu item and order information in a SQLite database stored under a `DB/` folder managed by a lightweight local backend.

#### Scenario: Database is available for the application
- **WHEN** the local backend is running
- **THEN** it uses a SQLite database located under the `DB/` folder as the persistent store for items and orders

### Requirement: Expose backend access for items and orders
The system SHALL provide a local backend API that allows application pages to create and retrieve menu items and to create, retrieve, and update orders needed for the defined workflows.

#### Scenario: Pages read and write shared data
- **WHEN** a page performs an item or order operation through the application
- **THEN** the operation is served by the local backend API and reflected in the SQLite database

#### Scenario: Data is shared across screens
- **WHEN** the Dashboard page is opened on another screen/browser while the backend is running
- **THEN** it can retrieve and display current in-transit order data from the same shared SQLite-backed store

### Requirement: Persist order lifecycle fields
The system SHALL persist each order's identifying information, customer name, selected items, status, and lifecycle timestamps/markers required by the application (including announced state).

#### Scenario: Order state survives restart
- **WHEN** an order is created or its status/announcement marker is updated and the application or backend is restarted
- **THEN** the persisted order record retains the saved status, timestamps, and announcement marker from the SQLite database

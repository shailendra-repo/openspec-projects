# item-management Specification

## Purpose

Enable counter staff to create and view saved menu items/cuisine entries that can be used when placing orders.

## Requirements

### Requirement: Create a menu item
The system SHALL provide a CreateItems page/route that allows staff to create a menu item with at least a name and a cuisine/category and persist it in the shared database.

#### Scenario: Staff creates a menu item
- **WHEN** staff enters a valid item name and cuisine/category on the CreateItems page and submits
- **THEN** the system saves the item in the shared database and confirms it was created

#### Scenario: Item creation requires required fields
- **WHEN** staff attempts to create an item without a required name or required cuisine/category
- **THEN** the system prevents creation and indicates the missing required information

### Requirement: List saved menu items
The system SHALL display a list of saved menu items on the CreateItems page so staff can confirm available items stored in the shared database.

#### Scenario: Saved items are listed
- **WHEN** staff opens the CreateItems page and items exist in the shared database
- **THEN** the system displays the saved items including their identifying details (such as name and cuisine/category)

#### Scenario: No saved items exist
- **WHEN** staff opens the CreateItems page and no items exist in the shared database
- **THEN** the system displays an empty state indicating no items are saved

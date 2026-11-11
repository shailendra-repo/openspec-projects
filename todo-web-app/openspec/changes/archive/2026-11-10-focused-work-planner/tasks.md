# Tasks

## 1. Project foundation and app shell

- [x] 1.1 Initialize the client-side web app project structure (build tooling, entry HTML, source directories) and verify the dev server/build command runs and renders a base app shell.
- [x] 1.2 Add a local persistence layer foundation (IndexedDB or thin wrapper) with schema/version metadata and verify a read/write smoke test persists data across a page reload in the browser.
- [x] 1.3 Establish core domain types/models and ID generation for tasks, subtasks, lists/projects, and tags and verify unit or integration tests confirm create/read/update behavior for stored entities.

## 2. Task management (task-management spec)

- [x] 2.1 Implement quick task capture and task editing flows in the selected/default list context and verify creating and renaming a task updates the UI and persists after reload.
- [x] 2.2 Implement task completion/uncomplete with a recent-action undo mechanism and verify completing then undoing restores the prior state in UI and persisted data.
- [x] 2.3 Implement task deletion with appropriate confirmation/handling and verify deleted tasks no longer appear in active views and are removed from persisted storage.
- [x] 2.4 Implement subtasks/checklist items within a task (add, toggle complete, display progress) and verify subtask state persists and renders correctly after reload.
- [x] 2.5 Implement manual drag-and-drop reordering in supported contexts with persisted order and verify reordered tasks retain their new order after reload (include a non-drag fallback path if required by the UI approach and verify it works).

## 3. Organization (task-organization spec)

- [x] 3.1 Implement lists/projects CRUD and task assignment (including defined handling when a list/project is deleted, e.g. move to default Inbox or reassignment flow) and verify list changes and task associations persist and render correctly.
- [x] 3.2 Implement tags/labels on tasks (add/remove) and verify tagged tasks persist and are discoverable by tag.
- [x] 3.3 Implement filtering and text search across relevant attributes (list/project, tag, completion state, text fields) and verify filter/search results match expected tasks for representative cases.

## 4. Planning and reminders (task-planning spec)

- [x] 4.1 Implement due date set/change/clear on tasks and verify due date values persist and are reflected in task details and planning-related displays.
- [x] 4.2 Implement Today and Upcoming derived views based on local date rules and verify tasks appear in the correct view/grouping for today, future, and cleared-date cases.
- [x] 4.3 Implement optional best-effort local reminders using browser notification capabilities (permission request, reminder configuration, delivery attempt within platform constraints) and verify granted-permission flow triggers/records as expected and denied/unavailable cases show a clear limitation message without breaking core planning features.

## 5. Appearance and theming (user-interface spec)

- [x] 5.1 Define semantic theme tokens/palettes for light and dark modes (surfaces, text, borders, interactive/focus states) and apply them across the app shell and core views; verify both themes render consistently.
- [x] 5.2 Implement a visible Light/Dark theme toggle in the UI; verify switching updates the appearance immediately without a page reload.
- [x] 5.3 Persist the user's theme preference locally and restore it on load (when no saved preference exists, follow system `prefers-color-scheme` where available, otherwise fall back to light mode); verify preference and default behavior survive reloads in a clean browser profile.
- [x] 5.4 Perform a visual/accessibility check for primary flows (capture, organize, plan, complete) in both themes; verify text/readability, contrast, and focus states are usable.

## 6. Integration, quality, and documentation

- [x] 6.1 Run an end-to-end/manual integration pass covering capture → organize → schedule/plan → complete flows and theme toggle/persistence across views; verify all core scenarios from the change specs are satisfied in a clean browser profile.
- [x] 6.2 Add or update user-facing/developer documentation (README or in-app help as appropriate) describing local-only behavior, storage, reminder limitations, and local theme preference behavior; verify instructions match implemented behavior.

## Workflow follow-up

- Review the planning artifacts and implementation results for this change before archiving.
- When ready, archive the change with `/opsx-archive` (or `openspec archive`) and verify the archived result.

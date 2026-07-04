# Feature Specification: Frontend Package Binding State and Run-Code Wiring

**Feature Branch**: `feature/npm-packages-fe`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Implement a reactive PackageBinding state model in shared/model using the Revealing Module Pattern (Zod schema + $state + addPackage/removePackage/updateAlias actions) and wire it into features/run-code so every execute_js invoke call includes the active package list as the packages parameter — branch: feature/npm-packages-fe, depends on feature/npm-packages-be"

## Clarifications

### Session 2026-07-04

- Q: When `removePackage` or `updateAlias` is called with a package name not currently in the active list, what should happen? → A: The action throws a descriptive error (list unchanged). Displaying it to the user (e.g., via a Toast notification) is a separate UI ticket's responsibility, not this one.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Active Packages Sent on Run (Priority: P1)

A developer has added one or more packages to their session. When they run code, all active packages are sent to the execution engine so they are available as globals.

**Why this priority**: This is the end-to-end value delivery. Without packages being transmitted on every run, the feature is non-functional. Everything else depends on this pathway working.

**Independent Test**: Add lodash with alias `_`, run `_.chunk([1,2,3,4], 2)`, confirm the execution request carries `{ package: "lodash", alias: "_" }` in the packages list.

**Acceptance Scenarios**:

1. **Given** the user has one package in their session (`{ package: "lodash", alias: "_" }`), **When** they click Run, **Then** the execution request is sent with that package included.
2. **Given** the package list is empty, **When** the user clicks Run, **Then** execution proceeds normally with an empty package list — it is not blocked or errored.

---

### User Story 2 — Package Added to Session (Priority: P2)

A user adds a new package (name and alias) to their session. The package immediately appears in the active list and will be included in the next run.

**Why this priority**: Adding packages is the primary user action this state supports, but it is P2 because the run-wiring (P1) is the externally visible value delivered to the user.

**Independent Test**: Trigger "add package" with `{ package: "zod", alias: "z" }` and confirm the package appears in the active list.

**Acceptance Scenarios**:

1. **Given** the session has no packages, **When** the user adds `{ package: "zod", alias: "z" }`, **Then** the active list contains that entry.
2. **Given** lodash is already in the session, **When** the user tries to add lodash again (any alias), **Then** the list remains unchanged — no duplicate is added.
3. **Given** the user adds a package with an empty alias, **Then** the action is rejected with an error and the list is unchanged.

---

### User Story 3 — Package Removed from Session (Priority: P2)

A user removes a package from their session. It immediately disappears from the active list and is absent from the next run's request.

**Why this priority**: Removal keeps the active list accurate. The add pathway must exist first.

**Independent Test**: Add lodash, then remove it. Confirm the list is empty and the next run sends an empty package list.

**Acceptance Scenarios**:

1. **Given** lodash is in the active list, **When** the user removes lodash, **Then** the package list no longer contains it.
2. **Given** lodash has been removed, **When** the user clicks Run, **Then** the execution request does not include lodash.
3. **Given** lodash is not in the active list, **When** the user attempts to remove lodash, **Then** an error is thrown and the list is unchanged.

---

### User Story 4 — Alias Updated (Priority: P2)

A user changes the alias for an existing package. Subsequent runs use the new alias name.

**Why this priority**: Alias editing is a convenience refinement — users can achieve the same outcome by removing and re-adding the package, so it is lower priority than add and remove.

**Independent Test**: Add lodash with alias `_`, update alias to `lodash`. Confirm the next execution request sends `{ package: "lodash", alias: "lodash" }`.

**Acceptance Scenarios**:

1. **Given** lodash is in the list with alias `_`, **When** the user updates the alias to `lodash`, **Then** subsequent runs send `{ package: "lodash", alias: "lodash" }`.
2. **Given** the user attempts to update an alias to an empty string, **Then** the update is rejected with an error and the alias is unchanged.
3. **Given** lodash is not in the active list, **When** the user attempts to update its alias, **Then** an error is thrown and the list is unchanged.

---

### Edge Cases

- Adding a package already in the list: no-op; the list is not modified and no error is thrown.
- Empty alias on add or update: rejected with a thrown error before any state change occurs.
- Empty package name on add: rejected with a thrown error before any state change occurs.
- Removing or updating the alias of a package name not currently in the active list: rejected with a thrown error before any state change occurs. Displaying this error to the user (e.g., via a Toast notification) is handled by a separate UI ticket, not this one.
- Package list on first load: defaults to empty — no error, no blocked execution.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define a canonical PackageBinding schema with two non-empty string fields — package name and user-chosen alias — that is the single source of truth for this concept across the feature.
- **FR-002**: The system MUST define a DEFAULT_ALIASES reference mapping well-known package names to their conventional aliases (e.g., lodash → `_`) for use as UI placeholder suggestions. This is informational only — it is not a validation whitelist.
- **FR-003**: The system MUST maintain a reactive list of active package bindings, initialized as empty on first load, accessible to any consumer that needs to read it.
- **FR-004**: The system MUST expose an action to add a package binding to the active list.
- **FR-005**: The system MUST expose an action to remove a package binding from the active list by package name. Removing a package name not present in the list MUST throw a descriptive error (the list remains unchanged). Presenting this error to the user (e.g., via a Toast notification component) is out of scope for this ticket.
- **FR-006**: The system MUST expose an action to update the alias for an existing package binding in the active list by package name. Updating the alias for a package name not present in the list MUST throw a descriptive error (the list remains unchanged). Presenting this error to the user (e.g., via a Toast notification component) is out of scope for this ticket.
- **FR-007**: The add action MUST silently ignore requests to add a package name already present in the list — no duplicate entry is created and no error is thrown.
- **FR-008**: The add and update alias actions MUST reject an empty alias string with a thrown error; the list must remain unchanged.
- **FR-009**: The code execution feature MUST read the current active package list at run time and include it in every execution request sent to the backend.
- **FR-010**: The execution request format MUST match the backend contract: `{ code: string, packages: PackageBinding[] }`.

### Key Entities

- **PackageBinding**: An association between a package name (e.g., `lodash`) and a user-chosen alias (e.g., `_`). Both fields are non-empty strings. The alias is the name under which the package is accessible in user code.
- **Active Package List**: The session-scoped, reactive collection of PackageBindings the user has added. Consumers react automatically to changes. Defaults to empty; does not persist across sessions.
- **DEFAULT_ALIASES**: A static lookup of well-known package names to their conventional aliases. Used only as placeholder suggestions in the UI — not enforced during validation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A package added to the session is present in the next execution request payload — verified for 100% of add-then-run scenarios.
- **SC-002**: A package removed from the session is absent from the next execution request payload — verified for 100% of remove-then-run scenarios.
- **SC-003**: The PackageBinding definition exists in exactly one place; no duplicate type or schema definitions exist anywhere in the codebase for this concept.
- **SC-004**: Attempting to add a duplicate package name produces a no-op; attempting to add or update with an empty alias produces an error; attempting to remove or update the alias of a package name not in the active list produces an error — all verified for 100% of edge-case scenarios.
- **SC-005**: All pre-existing run-code tests pass without modification — zero regressions introduced by the execution wiring change.

## Assumptions

- Ticket 1 (BE — `feature/npm-packages-be`) is merged and the backend `execute_js` command already accepts the `packages` parameter. This frontend ticket is validated against that backend contract.
- Any non-empty string is a valid package name at the frontend. The backend resolves it against the CDN at runtime and returns a descriptive error if the package does not exist — no frontend allowlist is needed.
- The active package list does not persist between app sessions. Persistence is out of scope for this version.
- This ticket does not include any UI widget for managing the package list, nor the Toast/notification component used to display thrown errors to the user. The state model (including throwing descriptive errors for invalid actions) and run-code wiring are the sole deliverables; the package-management UI and the Toast component are separate tickets.
- A user who has not added any packages can still run code normally — an empty package list is always valid.

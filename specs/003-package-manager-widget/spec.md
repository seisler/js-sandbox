# Feature Specification: Package Manager UI Widget

**Feature Branch**: `feature/tQcEi9qh/npm-package-manager-widget`

**Created**: 2026-07-06

**Status**: Draft

**Input**: Trello ticket tQcEi9qh — "Package manager UI widget". Visual reference: `docs/ui/mockups/package_manager_mockup_v0.html`. Superseding decision (2026-07-06): the ticket's v1 assumption of a fixed curated whitelist is replaced with live search against the real npm registry — see [ADR-BE-006](../../docs/adr/be/006-npm-registry-search.md).

## Overview

Users need a way to discover packages from the npm registry, add them to their session under a name (alias) they choose, edit that name, and remove them. This widget reads and writes the package binding state that already exists in the app, and drives a new live search capability against the real npm registry. It lives alongside the code editor and results console so the set of active packages is always visible while coding. The overriding design goal is clarity: a user must never have to guess which packages are active or what global name to type in their code.

The authoritative visual reference for layout and states is the mockup at `docs/ui/mockups/package_manager_mockup_v0.html`. The picker's *content* diverges from the mockup: instead of a fixed three-entry whitelist, it now shows live results from the npm registry as the user types, including a loading state and a search-failure state the mockup does not depict.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find and add any npm package (Priority: P1)

A user opens the add-package picker, types part of a package's name, and sees matching packages from the real npm registry. Selecting one adds it to the active list with a derived default alias, immediately usable the next time they run their code.

**Why this priority**: This is the core purpose of the widget — without the ability to discover and add a package, nothing else matters. It delivers the primary value (making any npm package usable in the sandbox) on its own.

**Independent Test**: With an empty active list, open the picker, type `lodash`, select the `lodash` result, and confirm `lodash → lodash` appears in the active list and is included on the next run.

**Acceptance Scenarios**:

1. **Given** the package manager is visible with no active packages, **When** the user opens the picker and types `lodash`, **Then** `lodash` appears among the live search results with its registry description.
2. **Given** the `lodash` result is showing, **When** the user selects it, **Then** it appears in the active list with a derived default alias pre-filled.
3. **Given** a package has just been added, **When** the user runs their code, **Then** it is available under its alias as a global.

---

### User Story 2 - Customise the name before adding (Priority: P1)

While adding a package the user can change the proposed alias to one of their choosing before the package becomes active.

**Why this priority**: Users must be able to pick names that fit their code. A fixed, non-editable alias would force naming collisions and awkward conventions. Ships together with Story 1 as the complete "add" experience.

**Independent Test**: Add `date-fns` from the picker, change the alias field from its derived default to `df`, and verify the active list shows `date-fns → df`.

**Acceptance Scenarios**:

1. **Given** `date-fns` has just been added with its derived default alias, **When** the user changes the alias to `df`, **Then** the active list shows `date-fns → df`.

---

### User Story 3 - Remove a package (Priority: P1)

A user removes an active package so it is no longer injected on the next run.

**Why this priority**: Adding without removing leaves users stuck with unwanted globals; both directions are needed for a usable session. P1 because it is part of the minimum viable management loop.

**Independent Test**: With `zod → z` active, click its remove control, and verify it disappears from the active list and is absent from the next run.

**Acceptance Scenarios**:

1. **Given** `zod → z` is in the active list, **When** the user clicks remove on it, **Then** it disappears from the active list.
2. **Given** `zod` has been removed, **When** the user runs their code, **Then** `zod` is not injected.

---

### User Story 4 - Edit the name of an already-added package (Priority: P2)

A user changes the alias of a package that is already active, inline in the active list, and the change takes effect on the next run.

**Why this priority**: Valuable for correcting or refining names without a remove-and-re-add cycle, but the add flow (Story 2) already lets users set names at add time, so this is a refinement rather than core.

**Independent Test**: With `lodash → _` active, edit its alias inline to `lodash`, and verify the active list updates immediately and the next run uses `lodash`.

**Acceptance Scenarios**:

1. **Given** `lodash → _` is active, **When** the user edits the alias inline to `lodash`, **Then** the active list updates immediately and the next run uses the name `lodash`.

---

### User Story 5 - Already-active packages are not offered again (Priority: P2)

When a user's search results include a package that is already active, it does not appear as a choice (or is clearly shown as unavailable), so the same package cannot be added twice.

**Why this priority**: Prevents a confusing double-add, but the underlying state already treats packages as a keyed set, so the risk is a UI clarity issue rather than a data-integrity one.

**Independent Test**: With `lodash` active, open the picker, search `lodash`, and verify it is not offered as an addable result even though the registry still returns it.

**Acceptance Scenarios**:

1. **Given** `lodash` is already active, **When** the user opens the picker and searches for it, **Then** `lodash` is excluded from (or shown disabled among) the rendered results.

---

### User Story 6 - Active packages persist across editor edits (Priority: P1)

The active package list is independent of code changes in the editor — editing code never alters which packages are active.

**Why this priority**: A user's package setup must survive their normal editing workflow; losing it on every keystroke would make the feature unusable. P1 as a correctness guarantee.

**Independent Test**: Add two packages, make several edits in the code editor, and verify the active list is unchanged.

**Acceptance Scenarios**:

1. **Given** two packages are active, **When** the user edits code in the editor, **Then** the active package list is unchanged.

---

### Edge Cases

- **Empty alias on add or edit**: When a user clears the alias field, the widget shows an inline validation message and does not accept the empty alias (the empty value is never committed to the active session state).
- **No registry matches**: When a search query matches no published package, the picker shows a "No packages match "<query>"" message.
- **Search unavailable**: When the registry search cannot be reached or errors, the picker shows an inline "Search unavailable — try again" message instead of results; the active list and existing packages are unaffected.
- **Slow network while typing**: While a search is in flight, the picker shows a loading indication rather than a stale or empty result set, and rapid keystrokes do not each trigger a separate outstanding request.
- **No packages active**: When the active list is empty, the widget shows an empty-state message ("No packages added yet") rather than a blank area.
- **Picker with no query**: Before the user types anything in the picker, no results are shown and a prompt invites them to start typing ("Start typing to search packages").
- **Very long alias**: A long alias is truncated in the active-list display while the full value remains available and editable in the alias input.
- **Registry result not sandbox-compatible**: A package found via search may rely on Node-only APIs and fail at run time inside the sandbox (existing, unrelated backend behavior — the widget's job is discovery, not compatibility checking).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The widget MUST display the list of currently active packages, each showing its package name and its current alias.
- **FR-002**: The widget MUST let the user search the live npm registry by name and choose a package to add from the results.
- **FR-003**: When choosing a package to add, each result MUST show a derived default alias as a hint alongside the package's registry description.
- **FR-004**: The alias MUST be editable both at add time and inline after the package is active.
- **FR-005**: The widget MUST require a non-empty alias; an empty alias MUST be blocked with an inline validation message and MUST never be committed to the active session state.
- **FR-006**: The widget MUST provide a remove action for each active package.
- **FR-007**: Packages that are already active MUST be excluded from (or clearly marked unavailable in) the search results.
- **FR-008**: The widget MUST be reachable from the main layout without the user navigating away from the editor.
- **FR-009**: Adding, editing an alias of, or removing an active package MUST take effect on the user's next run without any additional confirmation step.
- **FR-010**: The widget MUST show a distinct empty state when no packages are active, a distinct "no query yet" prompt in the picker, and a distinct "no matches" message when a search returns nothing.
- **FR-011**: The picker MUST show a loading indication while a search is in flight and MUST NOT pile up results from stale, superseded queries.
- **FR-012**: The picker MUST show an inline error state when the registry search fails or is unreachable, without disrupting the existing active package list.
- **FR-013**: The widget's appearance MUST match the reference mockup (`docs/ui/mockups/package_manager_mockup_v0.html`) for layout, active-list, and empty-state structure, adapted with loading/error states for live search, and MUST use the project's shared design tokens rather than introducing new fixed colors, sizes, or spacing values.

### Key Entities

- **Active package binding**: A package the user has added to the session, identified by its package name and carrying the alias (global name) under which it is exposed to run code. The set of active bindings is the state this widget reads and writes.
- **Search result**: A package returned by the live npm registry search, carrying its name, registry description, and a derived default alias. Results for packages already active are not offered.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Starting from an empty session with a working network connection, a user can go from zero to having a package usable in their code (e.g. calling `_.chunk()`) in under 10 seconds.
- **SC-002**: The active package list is visible while the user is writing code — at no point does the user have to leave the editor or open a separate screen to see which packages are active.
- **SC-003**: An empty alias can never reach a run: 100% of attempts to add or edit a package with a blank alias are blocked with visible feedback.
- **SC-004**: A user can independently add, rename, and remove a package and observe each change reflected in the active list immediately, with no page reload or explicit save step.
- **SC-005**: When the registry search is unreachable, the user sees a clear inline error within the picker and existing active packages remain fully usable and unaffected.

## Assumptions

- The frontend package-binding state and its add/remove/update-alias actions already exist (delivered in spec 002, "Package binding state") and are reused as-is; this feature adds the UI on top and does not change that state contract.
- Package discovery requires network connectivity (registry search); package *execution* remains offline-capable once a bundle is cached, per [ADR-BE-002](../../docs/adr/be/002-npm-package-injection.md) — search availability and run availability are independent.
- Search results are capped to a reasonable page size (e.g. top ~20 matches); no pagination or infinite scroll in v1.
- The default alias for a search result is derived from the package name (e.g. camel-casing a hyphenated name) rather than looked up in a fixed table, since the package set is no longer a small curated whitelist.
- Drag-to-reorder of the active list is out of scope for v1; injection order is not user-controlled.
- Mobile/responsive layout is out of scope; the widget targets the desktop app layout.
- The widget occupies the existing panel slot alongside the editor and results console; no new navigation or routing is introduced.

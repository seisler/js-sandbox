---

description: "Task list for feature implementation"
---

# Tasks: Package Manager UI Widget

**Input**: Design documents from `specs/003-package-manager-widget/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/widget-contract.md](./contracts/widget-contract.md), [quickstart.md](./quickstart.md)

**Tests**: Included — ADR-002 ("Test-Driven Development, enforced for AI agents") mandates TDD project-wide. Every implementation task is preceded by a failing test task per the colocated-tests convention (`*.test.ts` next to source; `#[cfg(test)] mod tests` colocated in Rust files).

**Organization**: Tasks are grouped by user story (P1/P2 priorities from [spec.md](./spec.md)) so each story is independently implementable and testable. Contract items (C1–C14, from [contracts/widget-contract.md](./contracts/widget-contract.md)) are referenced in task descriptions for traceability.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps the task to a user story (US1–US6, per spec.md priorities)
- File paths are exact and match [plan.md](./plan.md)'s Project Structure section

---

## Phase 1: Setup

**Purpose**: Scaffold the (mostly-empty) files this feature touches, so later tasks only add logic, not new files.

- [X] T001 [P] Create `src/widgets/DependencyWidget/lib/`, `src/widgets/DependencyWidget/api/`, and `src/widgets/DependencyWidget/config/` directories (empty, no files yet) alongside the existing `src/widgets/DependencyWidget/ui/`
- [X] T002 [P] Create empty module stubs `src-tauri/src/search.rs` and `src-tauri/src/commands/search.rs`, and add `mod search;` to `src-tauri/src/lib.rs` (not yet registered in `invoke_handler`)
- [X] T003 [P] Create `src/widgets/DependencyWidget/config/messages.config.ts` with `as const` string constants for: empty-list message, picker idle/no-match/error messages, alias-error message, labels ("Packages", "+ Add package", "Add package", "as") — sourced from the mockup and spec edge cases

**Checkpoint**: File skeleton exists; no behavior yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The backend search command and the frontend pure-logic/plumbing layer that every user story depends on — nothing can be added, removed, or renamed until search-and-add works end to end.

**⚠️ CRITICAL**: No user story phase can start until this phase is complete.

- [X] T004 [P] Write failing Rust unit tests in `src-tauri/src/search.rs` (`#[cfg(test)] mod tests`) for `parse_search_response(json: &str)`: maps a fixture npm registry `-/v1/search` JSON response (2 objects) to 2 `PackageSearchResult { name, description, version }`, and for the empty-query guard clause returning `Ok(vec![])` with no HTTP call — covers contract items **C13, C14**
- [X] T005 Implement `PackageSearchResult` struct and `parse_search_response` in `src-tauri/src/search.rs` to pass T004
- [X] T006 Implement `pub async fn search_packages(query: &str) -> anyhow::Result<Vec<PackageSearchResult>>` in `src-tauri/src/search.rs`: empty/whitespace query short-circuits to `Ok(vec![])`; otherwise `reqwest::get("https://registry.npmjs.org/-/v1/search?text={query}&size=20")`, non-2xx or transport errors become `anyhow::Error` via `?` (depends on T005)
- [X] T007 Implement the thin Tauri command adapter in `src-tauri/src/commands/search.rs`: `#[tauri::command] pub async fn search_packages(query: String) -> Result<Vec<PackageSearchResult>, String>` delegating to `search::search_packages` and mapping errors with `.map_err(|e| e.to_string())`, per ADR-BE-003/ADR-BE-004 (depends on T006)
- [X] T008 Register `commands::search::search_packages` in the `invoke_handler` list in `src-tauri/src/lib.rs` alongside the existing `commands::execution::execute_js` (depends on T007)
- [X] T009 [P] Write failing unit tests in `src/widgets/DependencyWidget/lib/deriveDefaultAlias.test.ts`: `lodash` → `lodash`, `date-fns` → `dateFns`, `@scope/name` → `name`, and a fallback case where derivation would otherwise be empty
- [X] T010 [P] Implement `deriveDefaultAlias(packageName: string): string` in `src/widgets/DependencyWidget/lib/deriveDefaultAlias.ts` to pass T009
- [X] T011 [P] Write failing unit tests in `src/widgets/DependencyWidget/lib/alias.test.ts`: `isAliasValid('')` → false, `isAliasValid('  ')` → false, `isAliasValid('_')` → true, delegating to `PackageBindingSchema`
- [X] T012 [P] Implement `isAliasValid(alias: string): boolean` in `src/widgets/DependencyWidget/lib/alias.ts` using `PackageBindingSchema.shape.alias.safeParse(alias).success` (depends on T011)
- [X] T013 [P] Write failing unit tests in `src/widgets/DependencyWidget/lib/debounce.test.ts` (using fake timers): rapid calls within the window collapse to one trailing invocation with the latest arguments
- [X] T014 [P] Implement generic `debounce<Args extends unknown[]>(fn: (...args: Args) => void, delayMs: number)` in `src/widgets/DependencyWidget/lib/debounce.ts` to pass T013
- [X] T015 Implement `searchPackages(query: string): Promise<PackageSearchResult[]>` in `src/widgets/DependencyWidget/api/searchPackages.ts` wrapping `invoke('search_packages', { query })`, with the `PackageSearchResult` TypeScript interface (depends on T008)

**Checkpoint**: Backend command is live and testable; frontend pure-logic and IPC wrapper are ready. User story implementation can now begin.

---

## Phase 3: User Story 1 - Find and add any npm package (Priority: P1) 🎯 MVP

**Goal**: A user can open the picker, type a package name, see live npm registry results, and select one to add it to the active list with a derived default alias — immediately usable on the next run.

**Independent Test**: With an empty active list, open the picker, type `lodash`, select the `lodash` result, and confirm `lodash → lodash` appears in the active list and is included in `packageBindingsState.packages` for the next run.

### Tests for User Story 1

- [X] T016 [P] [US1] Write failing unit tests in `src/widgets/DependencyWidget/lib/picker.test.ts` for `pickerStatus(query, requestState, results, active)`: empty query → `idle`; in-flight → `loading`; resolved with results → `results`; resolved with 0 matches → `no-match`; rejected → `error`
- [X] T017 [P] [US1] Write failing unit tests in `src/widgets/DependencyWidget/lib/picker.test.ts` for `availableResults(results, active)`: filters out any result whose `name` is already in the active list
- [X] T018 [P] [US1] Write failing component tests in `src/widgets/DependencyWidget/ui/PackagePicker.test.ts` (mocked `searchPackages`) covering: idle prompt shown with no query (**C2**), loading indication while in flight (**C4**), results rendered with description + derived alias hint after debounce (**C3**), selecting a result calls `addPackage` and closes the dialog (**C7**)
- [X] T019 [P] [US1] Write failing component tests in `src/widgets/DependencyWidget/ui/ActivePackageList.test.ts`: renders one `li` per active binding showing package name (mono) and alias input with current value
- [X] T020 [P] [US1] Write failing component tests in `src/widgets/DependencyWidget/ui/DependencyWidget.test.ts`: renders "No packages added yet" when `packageBindingsState.packages` is empty (**C1**); renders the "+ Add package" trigger; opens the picker dialog on click

### Implementation for User Story 1

- [X] T021 [US1] Implement `pickerStatus` and `availableResults` in `src/widgets/DependencyWidget/lib/picker.ts` to pass T016–T017
- [X] T022 [US1] Implement `src/widgets/DependencyWidget/ui/ActivePackageList.svelte`: iterate `packageBindingsState.packages`, render name + alias input (read-only wiring for now) per the mockup's `c-package-manager__item` structure, to pass T019
- [X] T023 [US1] Implement `src/widgets/DependencyWidget/ui/PackagePicker.svelte` as a `<dialog>`: debounced (`debounce`, ~300ms) search input wired to `searchPackages`, renders one of idle/loading/results/no-match/error via `pickerStatus`, filters via `availableResults`, selecting a result calls `packageBindingsState.addPackage({ package: name, alias: deriveDefaultAlias(name) })` and closes the dialog; Escape and backdrop-click close it (ADR-FE-005) — to pass T018
- [X] T024 [US1] Implement `src/widgets/DependencyWidget/ui/DependencyWidget.svelte`: replace the empty stub with the `c-package-manager` shell — header with title + "+ Add package" trigger (`showModal()`), empty-state message when `packageBindingsState.packages` is empty, `<ActivePackageList>`, and hosts `<PackagePicker>` — to pass T020 (depends on T022, T023)

**Checkpoint**: User Story 1 is fully functional and independently testable/demoable — this is the MVP.

---

## Phase 4: User Story 2 - Customise the name before adding (Priority: P1)

**Goal**: Immediately after a package is added with its derived default alias, the user can change that alias before relying on it.

**Independent Test**: Add `date-fns` via the picker, edit its alias input from the derived default to `df`, and confirm the active list shows `date-fns → df`.

### Tests for User Story 2

- [X] T025 [P] [US2] Extend `src/widgets/DependencyWidget/ui/ActivePackageList.test.ts` with a failing test: typing a new value into a binding's alias input calls `packageBindingsState.updateAlias(name, newValue)`

### Implementation for User Story 2

- [X] T026 [US2] Wire the alias `<input>`'s `oninput`/`onchange` handler in `src/widgets/DependencyWidget/ui/ActivePackageList.svelte` to call `packageBindingsState.updateAlias(binding.package, value)` (depends on T022) — to pass T025

**Checkpoint**: User Stories 1 and 2 both work independently — a package can be added and its alias customised right away.

---

## Phase 5: User Story 3 - Remove a package (Priority: P1)

**Goal**: A user can remove an active package so it's no longer sent on the next run.

**Independent Test**: With `zod → z` active, click its remove control, and confirm it disappears from `packageBindingsState.packages`.

### Tests for User Story 3

- [X] T027 [P] [US3] Extend `src/widgets/DependencyWidget/ui/ActivePackageList.test.ts` with a failing test: clicking the remove button (`aria-label="Remove <name>"`) calls `packageBindingsState.removePackage(name)` (**C9**)

### Implementation for User Story 3

- [X] T028 [US3] Add the remove `<button aria-label="Remove {name}">` per binding in `src/widgets/DependencyWidget/ui/ActivePackageList.svelte`, calling `packageBindingsState.removePackage(binding.package)` (depends on T022) — to pass T027

**Checkpoint**: Stories 1–3 together form the minimum add/customise/remove management loop.

---

## Phase 6: User Story 4 - Edit the name of an already-added package inline (Priority: P2)

**Goal**: A user can rename an already-active package's alias at any later point (not just right after adding), with empty-alias input blocked inline.

**Independent Test**: With `lodash → _` active from a prior action, edit its alias inline to `lodash`, confirm the list updates immediately; then clear the alias and confirm an inline error appears and the empty value is never committed.

### Tests for User Story 4

- [X] T029 [P] [US4] Extend `src/widgets/DependencyWidget/ui/ActivePackageList.test.ts` with failing tests: editing an alias at any time (not just post-add) still calls `updateAlias` (reuses T026's handler, confirms no time-based coupling); clearing an alias input shows the inline "Alias cannot be empty" `output[role=alert]` and the `--invalid` class, and does **not** call `updateAlias` with the empty value (**C11**)

### Implementation for User Story 4

- [X] T030 [US4] In `src/widgets/DependencyWidget/ui/ActivePackageList.svelte`, guard the alias handler with `isAliasValid` (from T012): a valid alias calls `updateAlias` as in T026; an empty/whitespace alias skips the `updateAlias` call and instead renders the `c-package-manager__alias-input--invalid` class plus the `c-package-manager__alias-error` message from `messages.config.ts` (depends on T026, T012) — to pass T029

**Checkpoint**: Alias editing is fully validated regardless of when it happens.

---

## Phase 7: User Story 5 - Already-active packages are not offered again (Priority: P2)

**Goal**: Search results never re-offer a package that is already active.

**Independent Test**: With `lodash` active, search "lodash" in the picker and confirm it does not appear among the rendered, selectable results.

### Tests for User Story 5

- [X] T031 [P] [US5] Extend `src/widgets/DependencyWidget/lib/picker.test.ts` with a failing test: `availableResults` given a raw result set containing `lodash` and an active list containing `lodash` returns a set without `lodash` (**already covered logically by T017 — this task adds the specific already-active regression case explicitly**)
- [X] T032 [P] [US5] Extend `src/widgets/DependencyWidget/ui/PackagePicker.test.ts` with a failing test: given `lodash` is active and a search for "lodash" resolves with a `lodash` result from the registry, it is not rendered as a selectable item (**C10**)

### Implementation for User Story 5

- [X] T033 [US5] Confirm/wire `PackagePicker.svelte` to call `availableResults(rawResults, packageBindingsState.packages)` before computing `pickerStatus` (should already be satisfied by T023's implementation — this task closes any gap found by T031–T032) — to pass T031–T032

**Checkpoint**: The picker never lets a user double-add a package.

---

## Phase 8: User Story 6 - Active packages persist across editor edits (Priority: P1)

**Goal**: Editing code in the Monaco editor never alters the active package list.

**Independent Test**: Add two packages, make several edits to `editorState.code`, and confirm `packageBindingsState.packages` and the rendered active list are unchanged.

### Tests for User Story 6

- [X] T034 [P] [US6] Write a failing regression test in `src/widgets/DependencyWidget/ui/DependencyWidget.test.ts`: with two packages active, mutate `editorState.code` directly, re-render, and assert the active list is byte-for-byte unchanged

### Implementation for User Story 6

- [X] T035 [US6] No production code change expected (`packageBindingsState` and `editorState` are already independent `$state` stores per ADR-FE-004 — see `src/shared/model/PackageBindings.svelte.ts` and `Editor.svelte.ts`); if T034 fails, investigate and remove any accidental coupling introduced during T021–T033

**Checkpoint**: All six user stories are independently functional and verified.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Visual fidelity, styling, and full-suite validation across all stories.

- [X] T036 [P] Style `PackagePicker.svelte`'s new loading and error states using only existing tokens (`--clr-txt-muted`, `--clr-txt-error`, spacing scale) under new BEM elements `c-package-manager__modal-loading` and `c-package-manager__modal-error`, per ADR-FE-007/ADR-FE-003
- [X] T037 [P] Run `npm run lint:fix` and resolve any remaining stylelint/ESLint findings across the `DependencyWidget` slice
- [ ] T038 Manually compare the rendered widget against `docs/ui/mockups/package_manager_mockup_v0.html` for layout/active-list/empty-state fidelity (FR-013)
- [ ] T039 Run all 12 manual validation steps in [quickstart.md](./quickstart.md) against `npm run tauri dev`
- [X] T040 [P] `cd src-tauri && cargo test` — confirm backend unit tests (T004) pass
- [X] T041 `npm run check && npm run test && npm run lint` — confirm the full frontend suite is green

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (backend command + pure-logic layer must exist first)
- **User Story 1 (Phase 3)**: Depends on Foundational only — this is the MVP
- **User Story 2 (Phase 4)**: Depends on Foundational + US1 (`ActivePackageList.svelte` must exist to add the alias handler to)
- **User Story 3 (Phase 5)**: Depends on Foundational + US1 (same reason); independent of US2
- **User Story 4 (Phase 6)**: Depends on US2 (extends the same alias handler with a validation guard)
- **User Story 5 (Phase 7)**: Depends on US1 (extends `PackagePicker.svelte`/`picker.ts` already built)
- **User Story 6 (Phase 8)**: Depends on US1 (needs an active list to exist to test persistence against); no implementation expected, verification only
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### Parallel Opportunities

- T001–T003 (Setup) run in parallel
- T004, T009, T011, T013 (foundational test-writing) run in parallel; their paired implementation tasks (T005–T006, T010, T012, T014) follow each once its tests exist
- T016–T020 (US1 test-writing) run in parallel before implementation
- Once Foundational is done, US1 must land first (it builds the shared `ActivePackageList.svelte`/`PackagePicker.svelte`), but US2, US3, US5, US6 can then proceed in parallel; US4 waits on US2

---

## Parallel Example: Foundational Phase

```bash
Task: "Write failing Rust unit tests for parse_search_response in src-tauri/src/search.rs"
Task: "Write failing unit tests for deriveDefaultAlias in src/widgets/DependencyWidget/lib/deriveDefaultAlias.test.ts"
Task: "Write failing unit tests for isAliasValid in src/widgets/DependencyWidget/lib/alias.test.ts"
Task: "Write failing unit tests for debounce in src/widgets/DependencyWidget/lib/debounce.test.ts"
```

## Parallel Example: User Story 1

```bash
Task: "Write failing unit tests for pickerStatus in src/widgets/DependencyWidget/lib/picker.test.ts"
Task: "Write failing unit tests for availableResults in src/widgets/DependencyWidget/lib/picker.test.ts"
Task: "Write failing component tests for PackagePicker.svelte"
Task: "Write failing component tests for ActivePackageList.svelte"
Task: "Write failing component tests for DependencyWidget.svelte"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (backend `search_packages` command + frontend pure-logic layer) — **CRITICAL, blocks everything**
3. Complete Phase 3: User Story 1 (search, add, use next run)
4. **STOP and VALIDATE**: run T016–T020's tests green, then manually search/add/run in `npm run tauri dev`
5. Demo if ready — this alone satisfies SC-001

### Incremental Delivery

1. Setup + Foundational → backend command live, pure logic ready
2. US1 → search + add works end to end (MVP)
3. US2 → alias customisable right after add
4. US3 → removal works
5. US4 → alias editable at any later time, with validation
6. US5 → no double-adds from search
7. US6 → persistence regression coverage
8. Polish → visual fidelity + full-suite green

### Notes

- [P] tasks touch different files with no unmet dependencies
- Tests are written to fail first, then made to pass by the paired implementation task (ADR-002 TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently

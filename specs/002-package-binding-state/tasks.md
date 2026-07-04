---

description: "Task list template for feature implementation"
---

# Tasks: Frontend Package Binding State and Run-Code Wiring

**Input**: Design documents from `/specs/002-package-binding-state/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included and REQUIRED — ADR-002 mandates strict red-green-refactor TDD for all state/model and wiring code in this project; the plan's Testing Approach and Functional Programming Approach sections define exactly which files are test-first.

**Organization**: Tasks are grouped by user story (spec.md priorities) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4, per spec.md)
- File paths are exact, per plan.md's Project Structure

## Path Conventions

Single frontend project — all paths are under `src/`, matching plan.md's Project Structure (no backend changes in this ticket).

---

## Phase 1: Setup

**Purpose**: Confirm a clean baseline before touching any files. No new dependencies or scaffolding are required — Zod, Vitest, `@testing-library/svelte`, and the FSD slices this ticket extends (`shared/model`, `shared/config`, `features/run-code`) already exist (see plan.md Technical Context).

- [X] T001 Run `npm run test` and `npm run check` on the current branch and confirm both are green; do not proceed if either fails for reasons unrelated to this feature

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The canonical schema, types, and an empty reactive package list that every user story depends on to read or mock (per ADR-FE-006, kept as a thin reactive shell with no actions yet).

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Write failing tests for `PackageBindingSchema` in `src/shared/config/PackageBinding.schema.test.ts`: a valid `{ package: 'lodash', alias: '_' }` parses; empty `package` fails validation; empty `alias` fails validation
- [X] T003 [P] Implement `PackageBindingSchema` and `DEFAULT_ALIASES` in `src/shared/config/PackageBinding.schema.ts` to make T002 pass (depends on T002 failing first)
- [X] T004 Export `PackageBindingSchema` and `DEFAULT_ALIASES` from `src/shared/config/index.ts` (depends on T003)
- [X] T005 [P] Define `PackageBinding` (as `z.infer<typeof PackageBindingSchema>`) and the `PackageBindingsState` interface in `src/shared/model/PackageBindings.type.ts` (depends on T003)
- [X] T006 Write a failing test in `src/shared/model/PackageBindings.svelte.test.ts`: a freshly created `createPackageBindingsState()` has `packages` equal to `[]` (depends on T005)
- [X] T007 Implement `createPackageBindingsState` in `src/shared/model/PackageBindings.svelte.ts` as a thin reactive shell exposing only the `packages` getter over an empty `$state` array — no mutation actions yet — to make T006 pass (depends on T006)
- [X] T008 Export `packageBindingsState` (singleton) and `createPackageBindingsState` from `src/shared/model/index.ts` (depends on T007)

**Checkpoint**: `PackageBindingSchema`, types, and an empty reactive `packages` list exist and are importable. All user stories can now build on this.

---

## Phase 3: User Story 1 - Active Packages Sent on Run (Priority: P1) 🎯 MVP

**Goal**: Every `execute_js` invoke call includes the current active package list (FR-009, FR-010).

**Independent Test**: Mock `packageBindingsState.packages` to `[{ package: 'lodash', alias: '_' }]`, call `runCode()`, and confirm `invoke` is called with `packages: [{ package: 'lodash', alias: '_' }]`. Separately mock it to `[]` and confirm `invoke` is still called (with `packages: []`) — execution is never blocked by an empty list.

This story only depends on the Foundational `packages` getter (mocked in the test) — it does **not** require `addPackage`/`removePackage`/`updateAlias` to exist yet, so it is independently testable ahead of US2–US4.

### Tests for User Story 1

- [X] T009 [P] [US1] Write failing tests in `src/features/run-code/api/runCode.test.ts`: (a) `invoke` is called with `packages` reflecting a mocked non-empty `packageBindingsState.packages`; (b) `invoke` is called with `packages: []` when the mocked list is empty and execution proceeds normally (mock `$shared/model` and `@tauri-apps/api/core`)

### Implementation for User Story 1

- [X] T010 [US1] Update `src/features/run-code/api/runCode.ts` to read `packageBindingsState.packages` and include it as `packages` in the `invoke<string>('execute_js', { code, packages })` call, matching the [execute-js-invoke contract](./contracts/execute-js-invoke.md), making T009 pass (depends on T009)

**Checkpoint**: User Story 1 is fully functional and independently testable — every run sends the current package list.

---

## Phase 4: User Story 2 - Package Added to Session (Priority: P2)

**Goal**: `addPackage` validates and appends a binding to the active list, silently ignoring duplicates (FR-004, FR-007, FR-008).

**Independent Test**: Call `packageBindingsState.addPackage({ package: 'zod', alias: 'z' })` on an empty list and confirm it appears in `packages`; call it again with the same package name and confirm no duplicate is added; call it with an empty alias and confirm a thrown error with the list unchanged.

### Tests for User Story 2

- [X] T011 [P] [US2] Write failing tests for `addBinding` in `src/shared/model/PackageBindings.transitions.test.ts`: happy path appends the binding; duplicate `package` name is a silent no-op (no throw, list unchanged); empty `package` throws; empty `alias` throws — plain input/output assertions per [data-model.md](./data-model.md)
- [X] T012 [US2] Implement `addBinding` in `src/shared/model/PackageBindings.transitions.ts` to make T011 pass (depends on T011)
- [X] T013 [P] [US2] Write a failing test in `src/shared/model/PackageBindings.svelte.test.ts`: calling `addPackage` on the shell updates the `packages` getter to include the new binding (depends on T007)
- [X] T014 [US2] Add `addPackage` to `createPackageBindingsState` in `src/shared/model/PackageBindings.svelte.ts`, delegating to `addBinding` and reassigning the `$state` array (never mutating in place, per ADR-FE-006), making T013 pass (depends on T012, T013)

**Checkpoint**: User Stories 1 AND 2 both work independently — packages can be added and are sent on run.

---

## Phase 5: User Story 3 - Package Removed from Session (Priority: P2)

**Goal**: `removePackage` removes a binding by name; throws a descriptive error if the name isn't present (FR-005).

**Independent Test**: Add lodash, remove it, confirm `packages` no longer contains it and a subsequent run sends `packages: []`. Attempt to remove a package name not in the list and confirm a thrown error with the list unchanged.

### Tests for User Story 3

- [X] T015 [P] [US3] Write failing tests for `removeBinding` in `src/shared/model/PackageBindings.transitions.test.ts`: happy path removes the matching entry; removing a `package` name not present throws and leaves the list unchanged
- [X] T016 [US3] Implement `removeBinding` in `src/shared/model/PackageBindings.transitions.ts` to make T015 pass (depends on T015)
- [X] T017 [P] [US3] Write a failing test in `src/shared/model/PackageBindings.svelte.test.ts`: calling `removePackage` on the shell removes the matching entry from `packages`; calling it with an unknown `package` name throws and `packages` is unchanged
- [X] T018 [US3] Add `removePackage` to `createPackageBindingsState` in `src/shared/model/PackageBindings.svelte.ts`, delegating to `removeBinding`, making T017 pass (depends on T016, T017)

**Checkpoint**: User Stories 1, 2, AND 3 all work independently.

---

## Phase 6: User Story 4 - Alias Updated (Priority: P2)

**Goal**: `updateAlias` changes the alias of an existing binding; throws if the package isn't present or the new alias is empty (FR-006, FR-008).

**Independent Test**: Add lodash with alias `_`, update its alias to `lodash`, confirm subsequent runs send `{ package: 'lodash', alias: 'lodash' }`. Attempt to update an alias to an empty string and confirm a thrown error with the alias unchanged. Attempt to update a package not in the list and confirm a thrown error.

### Tests for User Story 4

- [X] T019 [P] [US4] Write failing tests for `updateBindingAlias` in `src/shared/model/PackageBindings.transitions.test.ts`: happy path updates only the matching entry's alias; empty `newAlias` throws and list unchanged; `package` name not present throws and list unchanged
- [X] T020 [US4] Implement `updateBindingAlias` in `src/shared/model/PackageBindings.transitions.ts` to make T019 pass (depends on T019)
- [X] T021 [P] [US4] Write a failing test in `src/shared/model/PackageBindings.svelte.test.ts`: calling `updateAlias` on the shell updates the matching entry's alias in `packages`; empty alias and unknown `package` name each throw without changing `packages`
- [X] T022 [US4] Add `updateAlias` to `createPackageBindingsState` in `src/shared/model/PackageBindings.svelte.ts`, delegating to `updateBindingAlias`, making T021 pass (depends on T020, T021)

**Checkpoint**: All user stories (US1–US4) are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify the feature end-to-end against the spec's Success Criteria.

- [X] T023 [P] Run `npm run lint` and fix any violations across all new/changed files
- [X] T024 [P] Run `npm run check` and resolve any type errors; confirm `PackageBinding` is referenced only via `z.infer<typeof PackageBindingSchema>` with no duplicate type/interface definitions anywhere (SC-003)
- [X] T025 Run the full `npm run test` suite and confirm zero regressions in pre-existing run-code tests (SC-005)
- [X] T026 Execute the automated validation steps in [quickstart.md](./quickstart.md) end-to-end
- [X] T027 Remove any temporary debug statements or throwaway wiring added during manual quickstart validation before considering the ticket done

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends only on Foundational — independently testable via mocking, no dependency on US2–US4
- **User Story 2 (Phase 4)**: Depends only on Foundational
- **User Story 3 (Phase 5)**: Depends only on Foundational (its *independent test* narrative adds-then-removes, but the `removeBinding` implementation and its tests do not require `addBinding` to exist — they operate on a list literal)
- **User Story 4 (Phase 6)**: Depends only on Foundational, same note as US3
- **Polish (Phase 7)**: Depends on all four user stories being complete

### Within Each User Story

- Tests MUST be written and confirmed failing before implementation (ADR-002)
- Pure transition function (`*.transitions.ts`) before the reactive shell wiring that delegates to it (`*.svelte.ts`) — per ADR-FE-006
- Story complete before moving to the next priority, though US2/US3/US4 can also proceed in parallel once Foundational is done (different transitions, same two files edited incrementally)

### Parallel Opportunities

- T002 and T005 can run in parallel (different files) once their own prerequisites are met
- Once Foundational (Phase 2) completes, US1, US2, US3, and US4 test-writing tasks (T009, T011, T015, T019) can all start in parallel — they touch different test files (`runCode.test.ts` vs `PackageBindings.transitions.test.ts`, the latter shared by US2–US4 but as independent `it()` blocks)
- Note: T012/T016/T020 (implementations in the shared `PackageBindings.transitions.ts` file) and T014/T018/T022 (implementations in the shared `PackageBindings.svelte.ts` file) are NOT parallelizable against each other — same file, sequential edits — even though they belong to different user stories

---

## Parallel Example: Foundational + User Story 1

```bash
# Foundational — different files, run together:
Task: "Write failing tests for PackageBindingSchema in src/shared/config/PackageBinding.schema.test.ts"
Task: "Define PackageBinding and PackageBindingsState types in src/shared/model/PackageBindings.type.ts"

# After Foundational completes, User Story 1's test can start immediately (mocks the shell, no dependency on US2-US4):
Task: "Write failing tests in src/features/run-code/api/runCode.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run `npm run test` and confirm `runCode.test.ts` passes independently of US2–US4
5. This is the MVP — the execution pathway sends whatever is in `packages` (empty by default), satisfying SC-001/SC-002's precondition even before add/remove/update exist

### Incremental Delivery

1. Setup + Foundational → empty, readable package list exists
2. Add User Story 1 → wiring verified independently → demo: run code, confirm `packages: []` is sent
3. Add User Story 2 → `addPackage` verified independently → demo: add a package, confirm it's now sent
4. Add User Story 3 → `removePackage` verified independently → demo: remove it, confirm it's no longer sent
5. Add User Story 4 → `updateAlias` verified independently → demo: rename alias, confirm the new alias is sent
6. Each story adds value without breaking the previous ones — `PackageBindings.svelte.test.ts` and `.transitions.test.ts` accumulate `it()` blocks, never removing earlier ones

---

## Notes

- [P] tasks = different files, no dependencies — see the file-conflict caveat under Parallel Opportunities for the shared `transitions.ts`/`svelte.ts` files
- [Story] label maps task to specific user story for traceability
- No UI widget and no Toast component are built in this ticket (spec Assumptions) — `removePackage`/`updateAlias` throwing is the full scope of FR-005/FR-006 here
- Verify each test fails for the right reason before implementing (ADR-002) — do not skip the red step
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently

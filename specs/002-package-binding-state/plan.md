# Implementation Plan: Frontend Package Binding State and Run-Code Wiring

**Branch**: `feature/npm-packages-fe` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-package-binding-state/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add a reactive `PackageBinding` state model (Revealing Module Pattern, Zod-backed) to `shared/model`/`shared/config`, and wire `features/run-code` to read the active package list on every run and pass it to the `execute_js` Tauri command as the `packages` parameter, matching the backend contract from ADR-BE-002. Add/remove/update-alias actions enforce the invariants from the spec (no duplicate package names, non-empty alias, descriptive thrown error when acting on a package not in the list). No UI widget and no Toast component are built in this ticket — those are separate tickets that will consume this state model and its thrown errors respectively.

## Technical Context

**Language/Version**: TypeScript 5.9, Svelte 5.56 (runes mode)

**Primary Dependencies**: SvelteKit 5, Zod 4 (schema + type source of truth), `@tauri-apps/api` (`invoke`)

**Storage**: N/A — in-memory `$state` only, session-scoped, no persistence (per spec Assumptions)

**Testing**: Vitest + `@testing-library/svelte`, colocated `*.test.ts` files (existing pattern: `Button.test.ts`, `Menu.test.ts`)

**Target Platform**: Tauri 2 desktop app — this ticket touches the frontend layer only; the backend `execute_js` + `PackageBinding` contract already exists (ADR-BE-002, ticket `feature/npm-packages-be`)

**Project Type**: Desktop app, frontend slice (Feature-Sliced Design)

**Performance Goals**: N/A — trivial in-memory array operations on a session-scoped list; no measurable performance target applies

**Constraints**: Must follow FSD layering (`shared/model` cannot import from `features/*`); Revealing Module Pattern with Svelte 5 runes per ADR-FE-004; Zod schema is the single source of truth for the `PackageBinding` type (FR-001, SC-003); no classes anywhere in the implementation

**Scale/Scope**: Session-scoped list of package bindings; no stated numeric limit in the spec — sized for a handful of packages per session, not a bulk-data structure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template — no project-specific principles have been ratified there. In its absence, the binding project conventions are the ADRs and `CLAUDE.md` coding conventions. Checked against those:

| Convention | Compliant? |
|---|---|
| No classes / no parameter mutation (ADR-FE-006) | Yes — see Functional Programming Approach below; state module uses closures, transitions are pure functions returning new arrays, errors are thrown `Error` instances (built-in, not user-authored classes) |
| Zod schemas as source of truth (CLAUDE.md, ADR-FE-001) | Yes — `PackageBindingSchema` in `shared/config` is the single definition; the TS type is inferred via `z.infer` |
| Revealing Module Pattern + runes, `.svelte.ts` (ADR-FE-004) | Yes — mirrors existing `Editor.svelte.ts` / `PreferencesState.svelte.ts` |
| FSD slice boundaries (ADR-FE-002) | Yes — model lives in `shared/model`, consumed by `features/run-code` (one layer up), never the reverse |
| Named exports only, no `any`, explicit return types (CLAUDE.md) | Yes — enforced in all new files |
| TDD (ADR-002) | Yes — see Testing Approach below |

No violations requiring justification. Gate passes.

### Testing Approach (ADR-002, strict red-green-refactor)

Per-unit test scope, to be encoded as ordered test-then-implement task pairs in `tasks.md`:

| Unit | Test file (written + confirmed red first) | Behaviour covered |
|---|---|---|
| `PackageBindingSchema` / `DEFAULT_ALIASES` | `PackageBinding.schema.test.ts` | valid binding parses; empty `package`/`alias` fails validation |
| `addBinding` / `removeBinding` / `updateBindingAlias` (pure) | `PackageBindings.transitions.test.ts` | one `it()` per state-transition row in [data-model.md](./data-model.md): add (happy path, duplicate no-op, empty-field throw), remove (happy path, not-found throw), updateAlias (happy path, not-found throw, empty-alias throw) — plain input/output assertions, no reactive context |
| `createPackageBindingsState` (reactive shell) | `PackageBindings.svelte.test.ts` | `packages` getter reflects `$state` after each action; shell correctly delegates to and reassigns from the pure functions above; does not re-test the transition rules themselves |
| `runCode` wiring | `runCode.test.ts` | `invoke` called with `packages` reflecting current state, for both non-empty and empty active lists |

Each unit follows ADR-002's cycle: write the test file, run it, confirm it fails for the right reason, then implement the minimum code to go green, then refactor. No implementation file is created before its failing test exists. This ordering must be preserved as-is when `/speckit-tasks` generates `tasks.md`.

### Functional Programming Approach (ADR-FE-006)

"No classes" is necessary but not sufficient — the full discipline applies to every new file in this ticket:

- **No parameter mutation**: `addPackage`/`removePackage`/`updateAlias` never mutate the incoming list or binding in place. Each transition is implemented as a **pure function** — `(list, ...args) => newList` — that returns a new array (`[...list, x]`, `list.filter(...)`, `list.map(...)`), or throws before producing any output. The reactive shell (`createPackageBindingsState`) is the only place a `$state` variable is *reassigned*; it is never mutated with `.push`/`.splice`.
- **Separation of pure logic from reactive shell**: transition logic is extracted into `PackageBindings.transitions.ts` — plain functions with no dependency on Svelte or `$state`. `PackageBindings.svelte.ts` becomes a thin wrapper: it holds the `$state` array and calls the pure functions, reassigning the result. This is a direct consequence of "no parameter mutation" + "single responsibility" (CLAUDE.md): reactivity wiring and business logic are two different responsibilities.
- **Practical payoff for TDD**: because the transition functions are pure and framework-free, `PackageBindings.transitions.test.ts` needs no component/reactive test harness — plain `it(() => expect(addBinding([], binding)).toEqual([binding]))`-style assertions. Only the thin reactive shell needs a `.svelte.ts`-aware test.
- **Guard clauses over nested conditionals**: each pure function validates and throws/returns at the top (empty-field check, then not-found/duplicate check), never nested `if/else`.
- **Maps over branching**: `DEFAULT_ALIASES` is itself a plain object lookup (`Record<string, string>`), not an if/else chain over known package names.

This changes the Project Structure below: `PackageBindings.svelte.ts` no longer contains the transition logic directly — it delegates to `PackageBindings.transitions.ts`.

## Project Structure

### Documentation (this feature)

```text
specs/002-package-binding-state/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
└── tasks.md               # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── shared/
│   ├── config/
│   │   ├── PackageBinding.schema.ts     # NEW — PackageBindingSchema (Zod), DEFAULT_ALIASES
│   │   ├── PackageBinding.schema.test.ts # NEW
│   │   └── index.ts                      # UPDATED — export new schema/constant
│   └── model/
│       ├── PackageBindings.svelte.ts       # NEW — createPackageBindingsState: thin reactive shell (RMP + runes), delegates to transitions.ts
│       ├── PackageBindings.svelte.test.ts  # NEW — reactivity/wiring only
│       ├── PackageBindings.transitions.ts       # NEW — pure functions: addBinding, removeBinding, updateBindingAlias
│       ├── PackageBindings.transitions.test.ts  # NEW — pure-function behaviour, no reactive harness needed
│       ├── PackageBindings.type.ts        # NEW — PackageBindingsState interface
│       └── index.ts                       # UPDATED — export packageBindingsState
└── features/
    └── run-code/
        ├── api/
        │   ├── runCode.ts                 # UPDATED — include packages in invoke payload
        │   └── runCode.test.ts            # NEW/UPDATED — assert packages sent
        └── index.ts                       # unchanged (already re-exports runCode)
```

**Structure Decision**: Single frontend project (Tauri desktop app), following the existing FSD layout. No new slices are introduced — `PackageBinding` is a `shared/model` + `shared/config` concept (per FR-001/FR-003), consumed one layer up by the existing `features/run-code` slice. This matches how `EditorPreferences`/`editorState` are already structured, so the new code sits alongside its closest existing analogue rather than inventing a new pattern.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — table intentionally left empty.

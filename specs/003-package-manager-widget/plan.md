# Implementation Plan: Package Manager UI Widget

**Branch**: `feature/tQcEi9qh/npm-package-manager-widget` | **Date**: 2026-07-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-package-manager-widget/spec.md`

## Summary

Build the Package Manager UI widget that lets users search the live npm registry, add, rename, and remove sandbox packages, matching the reference mockup at `docs/ui/mockups/package_manager_mockup_v0.html` (layout/states) as adapted for live search per [research.md](./research.md). The widget is a composite UI block (FSD `widgets/DependencyWidget`, already stubbed and mounted in `Panel`) that reads and writes the existing `packageBindingsState` from spec 002, and drives a **new** backend capability: a `search_packages` Tauri command backed by npm's public registry search API, per [ADR-BE-006](../../docs/adr/be/006-npm-registry-search.md). Because `runCode` already sends `packageBindingsState.packages` to the backend, adding/renaming/removing a package still takes effect on the next run with no further wiring.

Technical approach: keep all branching/filtering/validation/derivation logic as **pure functions** in a `lib/` module (ADR-FE-006), colocated with unit tests, rendered through thin Svelte 5 reactive shells (ADR-FE-004). The add-package picker is a `<dialog>` opened via `showModal()`, following the established `Preferences.svelte` pattern, now with debounced live search, a loading state, and an error state. On the backend, a new thin command (`commands/search.rs`) delegates to a new `search.rs` core module (`anyhow` internally, `String` at the boundary, per ADR-BE-003), mirroring the existing `executor.rs` / `commands/execution.rs` split (ADR-BE-004).

## Technical Context

**Language/Version**: TypeScript 5.x, Svelte 5.56 (runes mode); Rust 2021 edition (Tauri 2 backend).

**Primary Dependencies**: SvelteKit 5, Zod (validation via existing `PackageBindingSchema`), Vitest 4 + `@testing-library/svelte` 5 + jsdom (frontend tests). Backend: `reqwest` (already a dependency, rustls-tls) for the new registry search HTTP call, `serde`/`serde_json` for response mapping, Rust's built-in `#[cfg(test)]` for unit tests. No new crates and no new npm dependencies.

**Storage**: In-memory reactive state only — `packageBindingsState` (`$state`) from `$shared/model`. Search results are ephemeral (not cached to disk); only bundles for *added* packages are cached, per the existing, unchanged ADR-BE-002 flow.

**Testing**: Frontend — Vitest (`npm run test`), colocated `*.test.ts`; pure-logic unit tests in `lib/`, component tests with `@testing-library/svelte` for the shells, using a mocked `invoke`. Backend — Rust `#[cfg(test)] mod tests` colocated in `search.rs`, unit-testing response mapping and the empty-query guard clause against fixture JSON (no live network calls in tests).

**Target Platform**: Tauri 2 desktop app (WebView + Rust backend), desktop layout only.

**Project Type**: Desktop app — SvelteKit frontend + Rust/Tauri backend (this feature touches both, unlike a pure-frontend slice).

**Performance Goals**: Instant UI feedback for typing; SC-001 target of "zero to usable package in under 10 seconds" assuming network connectivity. Search input is debounced (~300ms) so typing doesn't flood the registry or the UI with stale responses (FR-011).

**Constraints**: No magic values — all CSS via tokens in `src/shared/styles/tokens.css` (ADR-FE-007); no classes (ADR-FE-006); named exports only; cross-slice imports through slice `index.ts`; widget appearance must match the reference mockup's structure, adapted with loading/error states (FR-013). Backend: `?` over `unwrap`/`expect` outside tests; thin command handlers (ADR-BE-004); `anyhow` in core, `String` at the Tauri boundary (ADR-BE-003).

**Scale/Scope**: One widget slice (frontend) + one new command module (backend); results capped to ~20 matches per query, no pagination (spec Assumptions).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution file (`.specify/memory/constitution.md`) is an unpopulated template with no ratified principles, so there are no formal constitution gates to evaluate. In its place, the binding governance for this feature is the ADR set and coding conventions in `CLAUDE.md`, checked below:

| Rule (source) | Compliance |
|---|---|
| No classes; pure logic separated from reactive shells (ADR-FE-006) | ✅ Filtering/derivation/debounce live in `lib/` pure functions and a small reactive-shell-adjacent debounce helper; `.svelte` files are reactive shells only |
| Svelte 5 runes, Revealing Module Pattern for state (ADR-FE-004) | ✅ Reuses `packageBindingsState`; picker open/query/loading/error state is local `$state` |
| FSD layering; cross-slice imports via `index.ts` (ADR-FE-002) | ✅ `widgets/DependencyWidget` imports `$shared/model`, `$shared/config`, `$shared/ui` through their roots; its own `api/searchPackages.ts` wraps `invoke()` for internal use |
| BEM with `c-`/`l-` prefixes (ADR-FE-003) | ✅ Uses mockup's `c-package-manager` blocks; new loading/error states extend the same block with new elements, no new prefixes |
| Design tokens, no magic values (ADR-FE-007) | ✅ New loading/error UI reuses existing tokens (`--clr-txt-error`, `--clr-txt-muted`, spacing scale); stylelint enforces |
| Zod as source of truth for validation (ADR-FE-001) | ✅ Alias validation reuses `PackageBindingSchema` |
| `anyhow` core / `String` boundary (ADR-BE-003) | ✅ New `search.rs` returns `anyhow::Result`; `commands/search.rs` maps to `String` |
| Thin command handlers (ADR-BE-004) | ✅ `search_packages` command is a one-line delegation to `search::search_packages` |
| `?` over `unwrap`/`expect` (backend convention) | ✅ Applied in new Rust code; `.expect()` only inside `#[cfg(test)]` |
| Tests colocated; TDD for AI agents (ADR-002) | ✅ `*.test.ts` next to source; Rust `#[cfg(test)] mod tests` colocated in `search.rs`; tests authored before/with implementation |
| New backend capability requires an ADR | ✅ [ADR-BE-006](../../docs/adr/be/006-npm-registry-search.md) authored for the new `search_packages` command |

**Result**: PASS — no violations, Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/003-package-manager-widget/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (UI + IPC contracts)
│   └── widget-contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)

docs/adr/be/
└── 006-npm-registry-search.md   # New ADR backing this feature's backend change
```

### Source Code (repository root)

```text
src-tauri/src/
├── search.rs                        # NEW: core search logic (anyhow), reqwest call + response mapping
├── commands/
│   └── search.rs                    # NEW: thin Tauri command adapter (String boundary)
└── lib.rs                           # register `commands::search::search_packages` in invoke_handler

src/
├── widgets/
│   └── DependencyWidget/
│       ├── index.ts                          # public API: export DependencyWidget
│       ├── config/
│       │   └── messages.config.ts            # empty/loading/error/label strings (as const)
│       ├── api/
│       │   └── searchPackages.ts             # invoke('search_packages', { query }) wrapper
│       ├── lib/
│       │   ├── deriveDefaultAlias.ts          # packageName -> camelCase default alias
│       │   ├── deriveDefaultAlias.test.ts
│       │   ├── picker.ts                      # availableResults(), pickerStatus() discriminated state
│       │   ├── picker.test.ts
│       │   ├── debounce.ts                    # generic debounce helper for the search input
│       │   ├── debounce.test.ts
│       │   ├── alias.ts                       # isAliasValid() (reuses PackageBindingSchema)
│       │   └── alias.test.ts
│       └── ui/
│           ├── DependencyWidget.svelte       # panel shell: header + active list + hosts picker
│           ├── DependencyWidget.test.ts
│           ├── ActivePackageList.svelte      # active bindings: name + inline alias input + remove
│           ├── ActivePackageList.test.ts
│           ├── PackagePicker.svelte          # <dialog> modal: debounced search + results + states
│           └── PackagePicker.test.ts
└── shared/
    └── config/
        └── PackageBinding.schema.ts          # existing — PackageBindingSchema (reused for alias validation)
```

**Structure Decision**: Frontend-only change stays inside the existing `widgets/DependencyWidget` slice, as in the prior plan revision — no new `features/` slice, since the widget binds `packageBindingsState`'s actions directly (as `Preferences.svelte` does with `preferencesState`). The backend change is additive and isolated: a new `search.rs` + `commands/search.rs` pair mirroring the existing `executor.rs` / `commands/execution.rs` split, registered as a second, independent Tauri command. `execute_js` and its `PackageBinding` contract are completely unchanged — search and execution remain decoupled per ADR-BE-006.

## Complexity Tracking

> No constitution/ADR violations — the one architectural addition (a new Tauri command) is justified and documented in ADR-BE-006 rather than worked around.

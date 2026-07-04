# Phase 0 Research: Frontend Package Binding State and Run-Code Wiring

No `NEEDS CLARIFICATION` markers remain in the Technical Context — the tech stack is fixed by existing ADRs (ADR-FE-001, ADR-FE-004, ADR-BE-002) and the spec's `/speckit-clarify` session resolved the one behavioral ambiguity (not-found remove/update → thrown error). The research below documents the concrete decisions made from the existing codebase conventions rather than open unknowns.

## Decision: State module placement and pattern

**Decision**: `src/shared/model/PackageBindings.svelte.ts`, exporting `createPackageBindingsState()` and a singleton `packageBindingsState`, following the exact Revealing Module Pattern already used by `PreferencesState.svelte.ts` and `Editor.svelte.ts`.

**Rationale**: ADR-FE-004 mandates this pattern for all reactive state; the spec explicitly names `shared/model` as the location. Mirroring an existing file (`PreferencesState.svelte.ts`) minimizes novelty and keeps the codebase's state modules structurally consistent.

**Alternatives considered**: Co-locating the state inside `features/run-code` — rejected because the spec requires it in `shared/model` (a separate future ticket for the package-management UI will also need to read/write this state, so it cannot live inside a single feature slice).

## Decision: Schema placement

**Decision**: `src/shared/config/PackageBinding.schema.ts` exports `PackageBindingSchema` (Zod) and `DEFAULT_ALIASES` (a `Record<string, string>` `as const`). The `PackageBinding` TypeScript type is `z.infer<typeof PackageBindingSchema>` — never hand-declared, satisfying FR-001/SC-003 (single source of truth).

**Rationale**: Matches the existing `EditorPreferences.schema.ts` placement and CLAUDE.md's rule that Zod schemas are the source of truth for both runtime validation and types.

**Alternatives considered**: Defining a hand-written `interface PackageBinding` alongside the schema — rejected; it would create two definitions of the same concept, violating SC-003 directly.

## Decision: Not-found and validation errors

**Decision**: `removePackage` and `updateAlias` throw a plain `Error` (built-in, not a custom class — CLAUDE.md forbids user-authored classes but built-in `Error` is the standard JS mechanism for guard-clause failures) with a descriptive message when the package name isn't in the active list. The same applies to empty alias/name on add and empty alias on update (FR-008). `addPackage` on an already-present name is a silent no-op (FR-007) — no error, no exception.

**Rationale**: Directly follows the spec's Clarifications section and FR-005/FR-006/FR-007/FR-008. Guard clauses (CLAUDE.md) validate and return/throw early rather than nesting logic.

**Alternatives considered**: Returning a `Result`-style discriminated union instead of throwing — rejected as inconsistent with the spec's explicit "thrown error" language (FR-005, FR-006, FR-008) and with no existing precedent for `Result` types elsewhere in this codebase.

## Decision: Run-code wiring point

**Decision**: `src/features/run-code/api/runCode.ts` reads `packageBindingsState.packages` at call time and passes it as the `packages` field in the `invoke<string>('execute_js', { code, packages })` call, matching the Rust-side `execute_js(code: String, packages: Vec<PackageBinding>)` signature from ADR-BE-002.

**Rationale**: `runCode.ts` is already the sole call site for `execute_js` (single responsibility, FR-009/FR-010). No new abstraction is needed — the existing function reads one more piece of shared state before invoking.

**Alternatives considered**: Introducing a `buildExecutionRequest()` helper — rejected as premature abstraction; the wiring is a one-line addition to an existing function body.

## Decision: Pure transition functions, separate from the reactive shell

**Decision**: The three state transitions (`addBinding`, `removeBinding`, `updateBindingAlias`) are implemented as pure functions in `PackageBindings.transitions.ts` — `(list: PackageBinding[], ...args) => PackageBinding[]`, never mutating the input array or binding, always returning a new array or throwing. `PackageBindings.svelte.ts` holds the `$state` array and reassigns it from the pure function's return value; it contains no branching/validation logic itself.

**Rationale**: ADR-FE-006's "no parameter mutation" rule and CLAUDE.md's "single responsibility" rule apply directly here — reactivity wiring and business-rule validation are different concerns. As a side benefit, pure functions need no Svelte reactive test harness, so `PackageBindings.transitions.test.ts` can assert plain input/output pairs, and `PackageBindings.svelte.test.ts` only needs to verify the shell correctly delegates and reassigns.

**Alternatives considered**: Writing the add/remove/update logic directly inline inside `createPackageBindingsState`, mutating the `$state` array via `.push`/`.splice`/direct index assignment — rejected: violates "no parameter mutation" in spirit (in-place array mutation), conflates two responsibilities in one function, and forces every transition-rule test to go through a reactive test harness.

## Decision: DEFAULT_ALIASES scope

**Decision**: `DEFAULT_ALIASES` is a static, hardcoded lookup (e.g. `{ lodash: '_', 'date-fns': 'dateFns' }`) used only as UI placeholder suggestions in a future ticket — it has zero effect on validation logic in this ticket (FR-002).

**Rationale**: Spec is explicit that this is informational only, not a whitelist.

**Alternatives considered**: None — this is a direct, unambiguous requirement.

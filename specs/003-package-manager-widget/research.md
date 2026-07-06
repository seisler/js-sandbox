# Phase 0 Research: Package Manager UI Widget

All Technical Context items were resolvable from the existing codebase, ADRs, and the new ADR-BE-006 authored for this feature. There were no open `NEEDS CLARIFICATION` markers.

## Decision 1 — Reuse existing package-binding state; no changes to `execute_js`

- **Decision**: The widget reads and writes `packageBindingsState` (`$shared/model`) unchanged. Adding/renaming/removing a package still takes effect on the next run for free, since `runCode` already sends `packages: packageBindingsState.packages` to `execute_js`.
- **Rationale**: Spec 002 already delivered `addPackage`, `removePackage`, `updateAlias`, and ADR-BE-002's execution/caching flow is untouched. This feature only changes *how a package is discovered*, not how it is bound or run.
- **Alternatives considered**: None — this was already settled in the prior (whitelist) revision of this plan and remains valid.

## Decision 2 — Live search requires a new backend capability, documented in ADR-BE-006

- **Decision**: Add a dedicated Tauri command, `search_packages(query) -> Result<Vec<PackageSearchResult>, String>`, backed by npm's public registry search API (`GET https://registry.npmjs.org/-/v1/search?text={query}&size=20`), following the existing thin-command-handler pattern (ADR-BE-004) and `anyhow`-core/`String`-boundary rule (ADR-BE-003).
- **Rationale**: Neither ADR-BE-002 (fetch-by-exact-name execution) nor any other existing ADR covers *searching* the registry — ADR-BE-002 explicitly only resolves packages the user already knows the name of. Since this is a new architectural capability (new external HTTP endpoint, new Tauri command), it needs its own ADR rather than being silently folded into ADR-BE-002 or left undocumented.
- **Alternatives considered**:
  - *Frontend calls the registry directly via `fetch()`* — rejected; would create a second, unaudited network egress point outside Rust, inconsistent with how esm.sh fetches are already routed exclusively through the backend.
  - *Extend `execute_js` to accept a search flag* — rejected; conflates two unrelated concerns (discovery vs. execution) in one command, violating single-responsibility and complicating the existing, stable `execute_js` contract.

## Decision 3 — Search results are ephemeral; no disk cache

- **Decision**: Registry search responses are not cached to disk. Every keystroke (post-debounce) issues a fresh request. Only the eventual bundle for a package the user actually *adds* is cached, via the existing, unchanged ADR-BE-002 flow.
- **Rationale**: Search results are query-specific and cheap to refetch; caching them would add complexity (invalidation, staleness) for a discovery UI where freshness matters more than offline availability. This mirrors how npmjs.com's own search behaves — it is designed for interactive, per-keystroke use.
- **Alternatives considered**: In-memory LRU cache keyed by query string — deferred; not needed to meet SC-001/SC-005, can be added later without changing the public contract if it proves necessary.

## Decision 4 — Debouncing lives on the frontend, not in Rust

- **Decision**: The picker debounces the search input (~300ms) in TypeScript before calling `invoke('search_packages', ...)`. The Rust command itself is stateless and simply answers whatever query it's given — it does not need to know about typing cadence.
- **Rationale**: Debounce is a UI-timing concern; keeping it in the widget's `lib/debounce.ts` keeps the Tauri command simple and testable in isolation (ADR-BE-004 thinness), and keeps the debounce interval tunable without touching Rust.
- **Alternatives considered**: Debounce/throttle in Rust via a queue — rejected as unnecessary complexity; the command is idempotent and safe to call repeatedly, so client-side debouncing is sufficient.

## Decision 5 — Default alias is derived, not looked up

- **Decision**: `deriveDefaultAlias(packageName)` converts a package name to a valid, readable default alias (e.g. `date-fns` → `dateFns`; a scoped package `@scope/name` → `name`) via camel-casing on non-alphanumeric separators, since there is no longer a small fixed table (`DEFAULT_ALIASES`) covering every possible result.
- **Rationale**: The npm registry has millions of packages; no static lookup table can cover them. A pure, deterministic naming transform gives every search result a sensible starting alias, consistent with FR-003, while the alias remains fully user-editable (FR-004) so a bad derivation is never a dead end.
- **Alternatives considered**: Always default to the raw package name unmodified — rejected for hyphenated/scoped names, which are invalid or awkward JS identifiers (e.g. `date-fns` is not a valid identifier as-is); the derivation directly serves the ticket's own example (`dateFns`).

## Decision 6 — Slice folder stays `DependencyWidget`, BEM block extends `c-package-manager`

- **Decision**: Keep `src/widgets/DependencyWidget/`; extend the mockup's `c-package-manager__modal-*` elements with new states (loading, error) rather than introducing new BEM blocks.
- **Rationale**: Unchanged from the prior plan revision — the stub is already wired into `Panel.svelte`, and the mockup remains the layout/structure reference even though its picker *content* (fixed whitelist) is superseded.

## Decision 7 — Picker is a `<dialog>` opened with `showModal()`

- **Decision**: Unchanged from the prior revision — native `<dialog>`, `showModal()`/`close()`, Escape/backdrop-click to close, mirroring `Preferences.svelte` (ADR-FE-005 accessibility).

## Decision 8 — Alias validation reuses the Zod schema

- **Decision**: Unchanged — `isAliasValid(alias)` delegates to `PackageBindingSchema.shape.alias.safeParse(alias).success`. An empty/whitespace alias is blocked in the UI and never committed to `packageBindingsState` (FR-005, SC-003).

## Decision 9 — Testing approach

- **Frontend**: Pure `lib/` functions (`deriveDefaultAlias`, `picker` filtering/status, `debounce`, `alias`) get exhaustive Vitest unit tests. Reactive shells get `@testing-library/svelte` component tests with a mocked `invoke` (loading → results / no-match / error transitions, add, inline rename, remove, already-active exclusion, empty-alias block).
- **Backend**: `search.rs` separates the pure response-mapping function (`parse_search_response(json) -> Vec<PackageSearchResult>`, tested against fixture JSON) from the network call itself, so mapping/guard-clause logic (empty query ⇒ no request, malformed response ⇒ error) is unit-testable without live HTTP, per ADR-002 (TDD for AI agents).

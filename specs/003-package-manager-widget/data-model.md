# Phase 1 Data Model: Package Manager UI Widget

This feature introduces no new *persistent* entities. It renders and mutates the existing spec-002 state, and adds one new ephemeral, request-scoped shape (`PackageSearchResult`) produced by the new backend search command.

## Existing entities (reused, not redefined)

### PackageBinding

Source of truth: `src/shared/config/PackageBinding.schema.ts` (`PackageBindingSchema`).

| Field | Type | Rules |
|---|---|---|
| `package` | string | non-empty (`z.string().min(1)`); the npm package name, unique within active set |
| `alias` | string | non-empty (`z.string().min(1)`); the global name exposed to run code |

### PackageBindingsState

Source of truth: `src/shared/model/PackageBindings.svelte.ts` (`packageBindingsState`).

| Member | Signature | Behavior |
|---|---|---|
| `packages` | `readonly PackageBinding[]` | Reactive active list the widget renders (FR-001) |
| `addPackage` | `(binding: PackageBinding) => void` | Appends a binding (Story 1/2) |
| `removePackage` | `(packageName: string) => void` | Removes by package name (Story 3) |
| `updateAlias` | `(packageName: string, newAlias: string) => void` | Updates a binding's alias (Story 4) |

## New entity: PackageSearchResult (ephemeral, request-scoped)

Produced by the backend's `search_packages` Tauri command (ADR-BE-006); never persisted, never cached.

| Field | Type | Source |
|---|---|---|
| `name` | string | npm registry `package.name` |
| `description` | string \| null | npm registry `package.description` (optional upstream) |
| `version` | string | npm registry `package.version` (latest published) |

Rust shape (`src-tauri/src/search.rs`):

```rust
#[derive(serde::Serialize)]
pub struct PackageSearchResult {
    pub name: String,
    pub description: Option<String>,
    pub version: String,
}
```

TypeScript shape (`src/widgets/DependencyWidget/api/searchPackages.ts`), mirroring the Rust struct via `invoke`'s serialized JSON:

```ts
export interface PackageSearchResult {
  name: string;
  description: string | null;
  version: string;
}
```

## Derived view-model shapes (computed in frontend `lib/`)

### Picker status (discriminated union, replaces the old whitelist-only empty-message function)

```ts
type PickerStatus =
  | { kind: 'idle' }                          // no query typed yet
  | { kind: 'loading' }                        // debounced query in flight
  | { kind: 'results'; items: PackageSearchResult[] }  // >0 results after filtering active out
  | { kind: 'no-match'; query: string }        // registry returned 0, or all matches already active
  | { kind: 'error' };                         // search_packages rejected
```

`pickerStatus(query, requestState, results, active): PickerStatus` — a pure function combining the current query, an in-flight/error/success request state, raw registry results, and the active package list, to select exactly one of the above (FR-010, FR-011, FR-012).

## Pure derivations (in `lib/`, unit-tested)

- **`deriveDefaultAlias(packageName): string`** — derives a camelCase default alias from a package name (e.g. `date-fns` → `dateFns`, `@scope/name` → `name`), for the alias hint shown on each search result (FR-003) and pre-filled on add.
- **`availableResults(results, active): PackageSearchResult[]`** — `results` minus any whose `name` is already in `active` (FR-007 / Story 5).
- **`pickerStatus(...)`** — see above.
- **`debounce(fn, delayMs)`** — generic debounce wrapper around the search-input handler so rapid typing collapses to one trailing call (FR-011).
- **`isAliasValid(alias): boolean`** — `PackageBindingSchema.shape.alias.safeParse(alias).success` (FR-005).

## Validation rules (mapped to requirements)

| Rule | Requirement | Enforced by |
|---|---|---|
| Alias must be non-empty | FR-005, SC-003 | `isAliasValid` gate before commit; inline error + `--invalid` styling |
| No duplicate active package | FR-007, Story 5 | `availableResults` excludes active names from rendered results |
| Only committed bindings run | FR-009, SC-003 | Empty alias never written to `packageBindingsState`; run sends only committed `packages` |
| Search failure does not corrupt active list | SC-005, FR-012 | `pickerStatus` isolates error state to the picker only; `packageBindingsState` is never touched by a failed search |

## State transitions

```text
(active list)
  ∅ ──addPackage(name, deriveDefaultAlias(name))──▶ [ {package, alias} ]
  [.. binding ..] ──updateAlias(name, newAlias)──▶ [.. {package, newAlias} ..]   (only if isAliasValid)
  [.. binding ..] ──removePackage(name)──▶ (binding removed)

(picker, per search_packages call)
  idle ──type (debounced)──▶ loading
  loading ──invoke resolves, 0 matches after active-filter──▶ no-match
  loading ──invoke resolves, >0 matches──▶ results
  loading ──invoke rejects──▶ error
  results / no-match / error ──query cleared──▶ idle
  results / no-match / error ──type again (debounced)──▶ loading
```

## Backend response mapping (Phase 0 → Phase 1 detail)

`search::parse_search_response(json: &str) -> anyhow::Result<Vec<PackageSearchResult>>` deserializes the npm registry's `-/v1/search` response shape (`{ objects: [{ package: { name, description, version, ... } }, ...] }`), extracting only the three fields needed — everything else (score, maintainers, keywords) is dropped at the boundary, keeping the IPC payload minimal.

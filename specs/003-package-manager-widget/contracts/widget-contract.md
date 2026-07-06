# Contracts: Package Manager Widget

Two contracts: the **IPC contract** (new backend command this feature adds) and the **UI contract** (behavioral assertions for the widget, tested against the reference mockup plus the new live-search states).

## IPC contract: `search_packages` (new, per ADR-BE-006)

```
search_packages(query: String) -> Result<Vec<PackageSearchResult>, String>

PackageSearchResult { name: String, description: Option<String>, version: String }
```

- Empty/whitespace `query` ⇒ `Ok(vec![])` immediately, no network call.
- Non-empty `query` ⇒ `GET https://registry.npmjs.org/-/v1/search?text={query}&size=20`, mapped to `PackageSearchResult[]`.
- Network failure or non-2xx ⇒ `Err(String)` (human-readable), per ADR-BE-003 boundary conversion.
- Does not touch, read, or write `packageBindingsState`, the bundle cache, or `execute_js` in any way — purely additive and side-effect-free beyond the one HTTP call.

This is the only backend change in this feature. `execute_js` and `PackageBinding` (ADR-BE-002) are unchanged.

## Public slice API (frontend)

```ts
// src/widgets/DependencyWidget/index.ts
export { default as DependencyWidget } from './ui/DependencyWidget.svelte';
```

`DependencyWidget` takes no props; it reads/writes `packageBindingsState` from `$shared/model` and calls the new `search_packages` command via its own `api/searchPackages.ts` wrapper. It is already mounted in `src/widgets/Panel/ui/Panel.svelte`.

## Rendered structure (BEM, from the mockup + new live-search states)

- `section.l-package-manager.c-package-manager`
  - `header.c-package-manager__header`
    - `h2.c-package-manager__title` → "Packages"
    - add-package trigger button (`c-button c-button--ghost`) → "+ Add package"
  - `p.c-package-manager__empty` → "No packages added yet" (shown only when active list empty)
  - `ul.c-package-manager__list`
    - per active binding `li.c-package-manager__item`:
      - `span.c-package-manager__name` (mono) → package name
      - `div.c-package-manager__alias-field`: label "as" + `input.c-package-manager__alias-input`
      - remove button (`c-button c-button--ghost`, `aria-label="Remove <name>"`) → "✕"
      - when alias empty: input gets `--invalid` modifier + `output[role=alert].c-package-manager__alias-error` → "Alias cannot be empty"
- `dialog.c-package-manager__modal` (the picker)
  - `header.c-package-manager__modal-header`: `h3` "Add package" + close button (`aria-label="Close"`) "✕"
  - `input[type=search].c-package-manager__modal-search` (`aria-label="Search packages"`, debounced ~300ms)
  - one of, driven by `PickerStatus` (data-model.md):
    - `ul.c-package-manager__modal-list`: per result a button `name (defaultAlias)` with description as a secondary line
    - `p.c-package-manager__empty-picker` (idle): "Start typing to search packages"
    - `p.c-package-manager__empty-picker` (no-match): `No packages match "<query>"`
    - `p.c-package-manager__modal-loading` (new element, existing tokens only): a loading indication while a search is in flight
    - `p.c-package-manager__modal-error` (new element, `--clr-txt-error`): "Search unavailable — try again"

## Behavioral contract (asserted by tests)

| # | Given | When | Then | Reqs |
|---|---|---|---|---|
| C1 | active list empty | widget renders | "No packages added yet" empty state visible; list has no items | FR-010 |
| C2 | picker open, no query | widget renders picker | no results; "Start typing to search packages" shown | FR-010 |
| C3 | picker open, user types "lod" (debounced) | `search_packages` resolves with `lodash` among results | `lodash` shown with description + derived alias hint | FR-002, FR-003 |
| C4 | picker open, query in flight | mid-request | loading indication shown, not stale results | FR-011 |
| C5 | picker open, query "xyzxyz123" | `search_packages` resolves with 0 matches | `No packages match "xyzxyz123"` shown | FR-010 |
| C6 | picker open, query typed | `search_packages` rejects | "Search unavailable — try again" shown; active list unaffected | FR-012, SC-005 |
| C7 | `lodash` not active, results include it | user selects the `lodash` result | `packageBindingsState.addPackage({package:'lodash', alias: deriveDefaultAlias('lodash')})` called; picker closes; `lodash → lodash` in active list | FR-002, FR-004, Story 1 |
| C8 | `lodash → lodash` active | user edits alias input to `_` | `updateAlias('lodash','_')` called; list reflects new alias | FR-004, Story 4 |
| C9 | `zod → z` active | user clicks remove on `zod` | `removePackage('zod')` called; `zod` gone from list | FR-006, Story 3 |
| C10 | `lodash` active, results include it | user searches "lodash" | `lodash` not offered as a result (or shown disabled) | FR-007, Story 5 |
| C11 | any active binding | user clears its alias input | inline "Alias cannot be empty" error shown, `--invalid` styling; empty alias not committed | FR-005, SC-003 |
| C12 | picker open | user presses Escape / clicks backdrop / clicks close | picker closes | ADR-FE-005 |
| C13 (backend) | empty query string | `search_packages` called | returns `Ok(vec![])`, no HTTP request made | IPC contract |
| C14 (backend) | fixture registry JSON with 2 matches | `parse_search_response` called | returns 2 `PackageSearchResult` with correct field mapping | IPC contract |

## Non-goals (explicit)

- No changes to `execute_js`, `PackageBinding`, or the esm.sh bundle-fetch/cache flow (ADR-BE-002) — execution is entirely unaffected by this feature.
- No persistence or caching of search results, no pagination/infinite scroll, no reorder, no mobile layout (spec Assumptions).
- No sandbox-compatibility pre-check on search results — a package can still fail at run time if it relies on Node-only APIs; that is existing, unrelated ADR-BE-002 behavior.

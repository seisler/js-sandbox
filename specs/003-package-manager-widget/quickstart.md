# Quickstart & Validation: Package Manager UI Widget

Validation guide proving the widget works end-to-end, including the new live npm registry search. For behavioral details see [contracts/widget-contract.md](./contracts/widget-contract.md) and [data-model.md](./data-model.md); for the backend rationale see [ADR-BE-006](../../docs/adr/be/006-npm-registry-search.md).

## Prerequisites

- Repo installed (`npm install`).
- Rust toolchain installed for the Tauri backend (`cargo` available).
- Spec 002 (`packageBindingsState`, `PackageBindingSchema`) merged — already present in `src/shared/model` and `src/shared/config`.
- Network connectivity — required for live search (Step 2 below) and for first-time execution of a newly added package (esm.sh fetch, per ADR-BE-002); not required for using already-cached packages.

## Automated validation

```bash
# Frontend unit + component tests
npm run test

# Type safety
npm run check

# Lint (ESLint + stylelint token/BEM enforcement)
npm run lint

# Backend unit tests (response mapping + empty-query guard, no live network)
cd src-tauri && cargo test
```

**Expected**: all pass. The widget's colocated tests cover contract items C1–C12 (see widget-contract.md): empty/loading/no-match/error picker states, add, inline rename, remove, already-active exclusion, empty-alias block, and picker close. The Rust tests cover C13–C14: the empty-query guard clause and registry-response-to-`PackageSearchResult` mapping against fixture JSON. `npm run lint` passing confirms no magic values (ADR-FE-007) and correct BEM prefixes (ADR-FE-003).

## Manual validation (desktop app)

```bash
npm run tauri dev
```

Then, in the Package Manager panel beside the editor and results console:

1. **Empty state** — with no packages, panel shows "No packages added yet".
2. **Idle picker** — click "+ Add package"; before typing, "Start typing to search packages" is shown.
3. **Live search (SC-001, Story 1)** — type `lodash`; after the debounce, real npm registry results appear (`lodash` with its actual registry description). Select it — it appears as `lodash → lodash` (or whatever `deriveDefaultAlias` produces). In the editor, run `lodash.chunk([1,2,3,4], 2)` → the run outputs the chunked array. Target: under 10 seconds from empty, given network connectivity.
4. **Rename (Story 4)** — change `lodash`'s alias input to `_`; run `_.chunk(...)` → works with the new name.
5. **Customise on add (Story 2)** — search and add `date-fns`; edit its alias to `df`; active list shows `date-fns → df`.
6. **No-match state** — search a nonsense string (e.g. `zzzznotarealpackage`); "No packages match "zzzznotarealpackage"" is shown.
7. **Search-unavailable state (SC-005)** — disconnect network, then search; an inline "Search unavailable — try again" message appears in the picker, and any already-active packages remain listed and usable (e.g. still runnable if their bundle is already cached).
8. **Empty-alias block (SC-003)** — clear an alias input; inline "Alias cannot be empty" appears and the empty alias is not sent on run.
9. **Already-active exclusion (Story 5)** — with `lodash` active, search `lodash` again; it is not offered as a result.
10. **Remove (Story 3)** — click ✕ on a package; it disappears and is absent from the next run.
11. **Persistence across edits (Story 6)** — type in the editor; the active list is unchanged.
12. **Visual fidelity (FR-013)** — compare layout/active-list/empty-state against `docs/ui/mockups/package_manager_mockup_v0.html`; loading/error states are new but built from the same token set and BEM block.

## Done signal

All automated checks (frontend + backend) green **and** manual steps 1–12 behave as described.

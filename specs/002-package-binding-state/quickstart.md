# Quickstart: Validating Frontend Package Binding State and Run-Code Wiring

## Prerequisites

- `feature/npm-packages-be` merged (backend `execute_js` already accepts `packages` — see ADR-BE-002)
- Dependencies installed: `npm install`

## Automated validation (primary path for this ticket)

This ticket ships no UI widget (spec Assumptions), so automated tests are the primary way to validate it end-to-end.

```bash
npm run test        # vitest run — includes new PackageBindings.svelte.test.ts, PackageBinding.schema.test.ts, updated runCode.test.ts
npm run check        # svelte-check — verifies no `any`, explicit return types, schema-inferred types line up
npm run lint          # eslint
```

Expected outcomes, mapped to spec Success Criteria:

- **SC-001 / SC-002**: `runCode.test.ts` asserts `invoke` is called with `packages` containing exactly the current `packageBindingsState.packages` snapshot, for both an add-then-run and a remove-then-run case.
- **SC-003**: a type-level check (or lint rule) confirms `PackageBinding` is only ever referenced via `z.infer<typeof PackageBindingSchema>` — no duplicate `interface`/`type PackageBinding` exists elsewhere.
- **SC-004**: `PackageBindings.svelte.test.ts` covers: duplicate add (no-op, no throw), empty alias/name on add (throw), empty alias on update (throw), remove/update on unknown package name (throw).
- **SC-005**: pre-existing `runCode.test.ts` scenarios (if any predate this change) continue to pass unmodified aside from the new packages-related assertions being additive.

## Manual sanity check (secondary — no UI widget exists yet)

Since there is no package-management UI in this ticket, manually exercising the flow requires driving the state module directly, e.g. from the browser devtools console while `npm run tauri dev` is running:

1. Start the app: `npm run tauri dev`
2. Open devtools on the webview, import is not available directly in console — instead, temporarily add a throwaway call in `+page.svelte` (do not commit) such as:
   ```ts
   import { packageBindingsState } from '$shared/model';
   packageBindingsState.addPackage({ package: 'lodash', alias: '_' });
   ```
3. Run any code in the editor and confirm (via a temporary `console.log` in `runCode.ts`, removed before commit) that the `invoke` call's `packages` argument includes `{ package: 'lodash', alias: '_' }`.
4. Call `packageBindingsState.removePackage('lodash')` and re-run; confirm `packages` is now `[]`.

This manual step is a stopgap until the package-management UI ticket lands with a real widget for step 2; it is not part of the automated acceptance criteria.

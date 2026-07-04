# Phase 1 Data Model: Frontend Package Binding State and Run-Code Wiring

## PackageBinding

Canonical schema (Zod, single source of truth per FR-001/SC-003):

| Field | Type | Rule |
|---|---|---|
| `package` | `string` | Non-empty (`.min(1)`). Any non-empty string is valid at the frontend — the backend/CDN resolves existence (spec Assumptions). |
| `alias` | `string` | Non-empty (`.min(1)`). The global name user code accesses the package under. |

```ts
export const PackageBindingSchema = z.object({
  package: z.string().min(1),
  alias: z.string().min(1),
});

export type PackageBinding = z.infer<typeof PackageBindingSchema>;
```

No other fields. No optional fields. `package` is the identity key used by `removePackage`/`updateAlias`/duplicate-detection in `addPackage`.

## DEFAULT_ALIASES

A static `Record<string, string>` (`as const`) mapping well-known package names to conventional aliases (e.g. `lodash → '_'`). Informational only (FR-002) — read by a future UI ticket for placeholder suggestions; not consulted by any validation logic in this ticket.

## Active Package List (reactive state)

Session-scoped `$state` array of `PackageBinding`, owned by `createPackageBindingsState()` in `shared/model`. Defaults to `[]` on first load (FR-003). Does not persist across app restarts (spec Assumptions).

### State transitions

| Action | Precondition | Effect | Violation handling |
|---|---|---|---|
| `addPackage(binding)` | `binding.package` not already in list | Appends `binding` to the list | Empty `package` or `alias` → throw `Error`, list unchanged (FR-008). Duplicate `package` → silent no-op, list unchanged, no error (FR-007). |
| `removePackage(packageName)` | `packageName` present in list | Removes the matching entry | Not present → throw `Error`, list unchanged (FR-005, Clarifications). |
| `updateAlias(packageName, newAlias)` | `packageName` present in list, `newAlias` non-empty | Replaces the alias on the matching entry | Not present → throw `Error`, list unchanged (FR-006, Clarifications). Empty `newAlias` → throw `Error`, list unchanged (FR-008). |

Validation order for `addPackage`: empty-field check happens *before* the duplicate check, since an invalid binding should never be considered for insertion regardless of whether its name collides with an existing entry.

### Public interface (`PackageBindingsState`)

```ts
export interface PackageBindingsState {
  readonly packages: PackageBinding[];
  addPackage(binding: PackageBinding): void;
  removePackage(packageName: string): void;
  updateAlias(packageName: string, newAlias: string): void;
}
```

No relationships to other entities — this is a standalone, flat list consumed by `features/run-code` at run time (FR-009).

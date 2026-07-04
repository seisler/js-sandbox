# Contract: PackageBindingsState (shared/model public interface)

This is the internal contract exposed via `shared/model`'s `index.ts` — the surface a future package-management-UI ticket and the existing `features/run-code` slice both consume.

```ts
interface PackageBindingsState {
  readonly packages: PackageBinding[];
  addPackage(binding: PackageBinding): void;
  removePackage(packageName: string): void;
  updateAlias(packageName: string, newAlias: string): void;
}
```

| Member | Behavior |
|---|---|
| `packages` | Reactive getter; current active list, `[]` by default. |
| `addPackage({ package, alias })` | Throws `Error` if `package` or `alias` is empty. Silent no-op if `package` already present. Otherwise appends. |
| `removePackage(package)` | Throws `Error` if `package` is not present. Otherwise removes the matching entry. |
| `updateAlias(package, alias)` | Throws `Error` if `package` is not present, or if `alias` is empty. Otherwise updates the matching entry's alias. |

See [data-model.md](../data-model.md) for the full precondition/effect table.

## Internal split (implementation detail, not part of the public surface)

`addPackage`/`removePackage`/`updateAlias` on `PackageBindingsState` are thin reactive wrappers. The actual transition rules live in pure, framework-free functions consumed by the shell:

```ts
function addBinding(list: PackageBinding[], binding: PackageBinding): PackageBinding[];
function removeBinding(list: PackageBinding[], packageName: string): PackageBinding[];
function updateBindingAlias(list: PackageBinding[], packageName: string, newAlias: string): PackageBinding[];
```

Each returns a new array (never mutates `list` or its entries) or throws — see [research.md](../research.md#decision-pure-transition-functions-separate-from-the-reactive-shell) for the rationale.

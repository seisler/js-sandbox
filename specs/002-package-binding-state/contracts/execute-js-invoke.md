# Contract: `execute_js` Tauri invoke payload

Restated from ADR-BE-002 (backend contract, already implemented in `feature/npm-packages-be`). This ticket's `runCode.ts` must conform to it exactly — it does not define this contract, only satisfies it.

```ts
invoke<string>('execute_js', {
  code: string,
  packages: PackageBinding[], // { package: string; alias: string }[]
})
```

Corresponds to the Rust signature:

```rust
pub fn execute_js(code: String, packages: Vec<PackageBinding>) -> Result<String, String>
```

## Requirement on this ticket

- FR-009: `packages` MUST reflect the current active package list at the moment `execute_js` is invoked (read at call time, not cached).
- FR-010: field names and shape MUST match exactly — `code` and `packages`, where each entry is `{ package, alias }`.
- An empty `packages` array is always valid (spec User Story 1, Acceptance Scenario 2) — execution is never blocked by an empty package list.

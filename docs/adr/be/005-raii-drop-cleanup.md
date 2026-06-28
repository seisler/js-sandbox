# ADR-BE-005: RAII via Drop for Cleanup

## Status
Accepted

## Date
2026-06-28

## Context

The executor manages shared state (`IS_RUNNING`) that must be reset after each execution — including when the execution panics or the thread terminates abnormally. Resetting this flag manually at the end of a function is fragile: early returns, `?` propagation, and panics all bypass manual cleanup.

Rust's ownership system provides a better primitive: the `Drop` trait. A value's `Drop` implementation runs deterministically when the value goes out of scope, regardless of how that happens.

## Decision

**Any state or resource that must be cleaned up after a scope exits — including on panic — uses a dedicated struct with `Drop` implemented.**

`ExecutionGuard` is the canonical example:

```rust
struct ExecutionGuard;

impl Drop for ExecutionGuard {
    fn drop(&mut self) {
        is_running().store(false, Ordering::SeqCst);
    }
}
```

Inside the execution scope, the guard is bound to a variable prefixed with `_` to signal it exists for its side effect, not its value:

```rust
let _guard = ExecutionGuard;
// IS_RUNNING is reset when _guard drops — whether we return normally,
// hit an error, or panic
```

### Rules

- Never reset shared state or release resources manually at the end of a function — use a `Drop` guard instead
- Name guard structs descriptively: `ExecutionGuard`, `LockGuard`, `FileGuard`
- Bind guards with a `_`-prefixed name (`_guard`, `_lock`) to make their purpose clear at the callsite
- Do not use `_` alone (no name) — Rust drops unnamed values immediately, not at end of scope

### When to apply

| Scenario | Solution |
|---|---|
| Resetting a global flag after execution | `Drop` guard (current pattern) |
| Releasing a lock held across `await` points | `Drop` guard wrapping the lock |
| Closing a file or socket on scope exit | `Drop` guard or standard library types that implement `Drop` |
| Cleanup that only runs on success | Do it manually — `Drop` is for cleanup that always runs |

## Consequences

**Positive:**
- Cleanup is guaranteed — panics, early returns, and `?` propagation cannot bypass it
- The guard pattern is idiomatic Rust — standard library types (`MutexGuard`, `File`) follow the same convention
- Callsites are clean — one `let _guard = ...` line is all that is needed

**Negative:**
- The side-effectful `Drop` is non-obvious to developers unfamiliar with RAII — the `_guard` naming convention is the only callsite signal
- `Drop` does not run if the process is killed with `SIGKILL` or `abort()` — only for normal exits and panics

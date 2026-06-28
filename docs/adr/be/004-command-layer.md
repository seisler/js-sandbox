# ADR-BE-004: Tauri Command Layer as Thin Adapter

## Status
Accepted

## Date
2026-06-28

## Context

Tauri exposes Rust functions to the frontend via `#[tauri::command]`. These command handlers are an IPC boundary — they receive serialized input from the WebView, dispatch to core logic, and return a serialized result. They are not a place for business logic.

Without an explicit rule, command handlers accumulate logic over time: validation, branching, state management. This makes the core untestable in isolation (Tauri's test setup is heavier than plain `#[tokio::test]`) and couples business logic to the IPC transport.

## Decision

**Command handlers are thin adapters only.** A command handler does exactly three things:

1. Receive the deserialized input from Tauri
2. Delegate to a function in the core module (`executor`, or future core modules)
3. Convert the error type to `String` for serialization (per ADR-BE-003)

```rust
// commands/execution.rs — the entire file, intentionally minimal
#[tauri::command]
pub async fn execute_js(code: String) -> Result<String, String> {
    executor::execute_js(&code).await.map_err(|e| e.to_string())
}
```

### Rules

- No business logic in `commands/` — no conditionals, no state reads, no validation beyond what Tauri's type system provides via deserialization
- All logic lives in `executor.rs` or equivalent core modules, testable with plain `#[tokio::test]`
- New Tauri commands follow the same shape: one line of delegation, one `.map_err`
- `commands/mod.rs` only re-exports command functions — no logic there either

### Module boundary

```
commands/      ← IPC adapter only (Tauri-aware)
executor.rs    ← core logic (Tauri-unaware, fully testable)
```

The core modules have no dependency on Tauri types. This means they can be tested, benchmarked, or reused without a running Tauri application.

## Consequences

**Positive:**
- All business logic is testable with `#[tokio::test]` — no Tauri test harness needed
- Command handlers are so small they are self-evidently correct
- Adding a new command is mechanical: write the logic in core, expose it with a 2-line adapter

**Negative:**
- Requires discipline to resist adding "just one small thing" to a command handler
- Input validation that requires Tauri context (e.g. app handle, window state) must be structured carefully to keep core logic Tauri-unaware

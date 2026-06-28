# ADR-BE-003: Error Handling — anyhow in Core, String at Tauri Boundary

## Status
Accepted

## Date
2026-06-28

## Context

Rust has several error handling strategies: custom error enums, `Box<dyn Error>`, `anyhow::Error`, or plain `String`. Tauri commands must return serializable types — `Result<T, String>` is the simplest contract the frontend can consume. The internal executor logic, however, benefits from rich, chainable errors with context.

Without a clear rule, error types become inconsistent: some functions return `String`, others `anyhow::Error`, others custom enums, making propagation with `?` awkward across module boundaries.

## Decision

**`anyhow::Error` everywhere in core. `String` only at the Tauri command boundary.**

```
executor.rs  →  Result<T, anyhow::Error>   (internal)
commands/    →  Result<T, String>           (Tauri boundary)
```

The command handler is the single conversion point:

```rust
// commands/execution.rs
#[tauri::command]
pub async fn execute_js(code: String) -> Result<String, String> {
    executor::execute_js(&code).await.map_err(|e| e.to_string())
}
```

### Rules

- All functions in `executor.rs` and any future core module return `Result<T, anyhow::Error>`
- Use `anyhow::anyhow!("message")` to create errors and `?` to propagate them
- Use `anyhow::Context` (`.context("...")` / `.with_context(|| ...)`) to add context when propagating across logical boundaries
- `.map_err(|e| e.to_string())` appears **only** in `commands/` — never in core modules
- `.unwrap()` and `.expect()` are forbidden outside of `#[cfg(test)]` blocks

## Consequences

**Positive:**
- `?` works uniformly throughout core — no manual conversion between error types
- `anyhow` preserves full error chains; `.context()` adds callsite information without defining custom types
- The Tauri boundary is the only place that loses the error chain — a deliberate, localised trade-off
- Tests can use `.unwrap()` freely without polluting production code

**Negative:**
- `anyhow::Error` is opaque — callers cannot pattern-match on error variants. If specific error variants need to be handled differently in the future, `thiserror` should be introduced for that module

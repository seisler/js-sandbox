# ADR-BE-001: Backend Tech Stack — Rust + deno_core JS Execution Engine

## Status
Accepted

## Date
2026-06-27

## Context

The core backend responsibility is executing arbitrary user-submitted JavaScript safely. "Safely" means:

- User code must not be able to access the filesystem, network, or OS arbitrarily
- A crash in the JS runtime must not crash the host application
- Runaway code (infinite loops, memory bombs) must be stopped within bounded time and memory
- Only one execution should run at a time (to bound memory consumption)

The backend also needs to expose this execution capability to the Tauri frontend over IPC.

## Decision

### Language: Rust

Required by Tauri for the backend. Also well-suited here because it provides the low-level control needed for process isolation, memory limits, and atomic concurrency guards without a garbage collector adding latency.

### JS Execution Engine: deno_core

`deno_core` is the embeddable V8-based JS runtime extracted from the Deno project. It provides:

- A full V8 isolate with an async event loop (`JsRuntime`)
- A `ModuleLoader` trait for controlling what modules user code can import
- Direct access to V8 heap configuration via `v8::CreateParams`

Alternatives considered:

| Option | Rejected because |
|---|---|
| `node:vm` / Worker threads | Only available in Node.js — not usable from Rust |
| QuickJS (`rquickjs`) | Lighter weight but lacks V8's optimizing JIT — user code runs slower; also less familiar to JS developers |
| Raw V8 (`rusty_v8`) | Too low-level; would require reimplementing the event loop, module system, and error handling that `deno_core` already provides |

### Sandboxing Strategy

Three layers of containment:

1. **Module whitelist** — A custom `SandboxModuleLoader` rejects any `import` that is not on an explicit allowlist (`lodash`, `ramda`, `zod`, `dayjs`, `date-fns`, `uuid`, `axios`, `canvas-confetti`). All other imports return an error.

2. **Dedicated thread isolation** — Each execution runs in its own `std::thread` with its own single-threaded Tokio runtime. A V8 crash or panic in that thread cannot propagate to the Tauri app thread. An `ExecutionGuard` with `Drop` resets the running-state flag even on panic.

3. **Resource limits:**
   - **Memory:** 100 MB V8 heap soft limit via `v8::CreateParams::heap_limits`. V8 will GC aggressively when the limit is approached.
   - **Timeout:** 30-second `tokio::time::timeout` wraps the thread's result channel. Runaway scripts are abandoned after 30 s.
   - **Concurrency:** An `AtomicBool` (`IS_RUNNING`) prevents a second execution from starting while one is in progress, bounding peak memory to ~100 MB.

### IPC: Tauri Commands

The `execute_js` Rust function is exposed to the frontend as a Tauri command (`#[tauri::command]`) registered in `lib.rs`. The frontend calls it via `@tauri-apps/api/core`'s `invoke`. Input is a plain string (the JS code); output is a `Result<String, String>` serialized through `serde_json`.

## Consequences

**Positive:**
- V8 is the same engine as Chrome/Node.js — user code behavior is familiar and well-documented
- `SandboxModuleLoader` gives precise, auditable control over what user code can import
- Thread isolation means a V8 crash is a recoverable error, not an app crash
- Hard timeout and concurrency guard prevent resource exhaustion from malicious or buggy user code

**Negative:**
- `deno_core` is an internal Deno crate — its API is semver-unstable and can change across minor versions
- The 100 MB soft limit is advisory, not a hard cap; V8 can temporarily exceed it before GC kicks in (a hard limit via `add_near_heap_limit_callback` is a known TODO)
- The whitelist must be manually maintained as new packages are added to the sandbox
- Single-execution concurrency lock means the UI must handle a "busy" state gracefully

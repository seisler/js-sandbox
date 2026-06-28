# ADR-001: Application Platform — Tauri Desktop App

## Status
Accepted

## Date
2026-06-27

## Context

The application is a JavaScript sandbox: a tool for writing and executing JavaScript snippets interactively, with a code editor, a run button, and an output console. It needs:

- A rich code editor (syntax highlighting, autocompletion)
- Safe, sandboxed JS execution — user code must not be able to harm the host system
- A capable UI layer for building editor preferences and toolbars

The candidate platforms were:

| Option | Notes |
|---|---|
| **Web app (browser)** | Easy distribution, but `eval`/Worker-based sandboxing is fragile and limited. No access to the filesystem for whitelisted module loading. |
| **Electron** | Mature, large ecosystem, but ships a full Chromium + Node.js — bundle sizes of 100–200 MB are the norm. Memory overhead per app is high. |
| **Tauri** | Rust backend + system WebView for the frontend. Bundle sizes ~5–10 MB. Allows a proper, isolated execution environment in Rust. |

## Decision

Use **Tauri 2** as the application platform.

The frontend runs in the system WebView (any web tech can be used). The backend is Rust, which gives us low-level control over process isolation, memory limits, and execution timeouts — all required for a safe JS execution sandbox.

The IPC boundary between frontend and backend uses Tauri's typed command system: the frontend invokes named Rust commands via `@tauri-apps/api`, and Rust handlers return serialized results over a `serde_json` bridge.

## Consequences

**Positive:**
- Small distribution bundle (~5–10 MB vs Electron's ~150 MB)
- Rust backend gives precise control over sandboxing, memory limits, and timeouts
- Frontend can use any modern web framework without coupling to Node.js APIs
- Strong Tauri v2 security model (capability-based permissions)

**Negative:**
- Requires Rust knowledge on the backend — JS/TS developers cannot contribute there without ramp-up
- System WebView means minor rendering differences across OS (Chromium on Windows, WebKit on macOS/Linux)
- The Tauri ecosystem is smaller than Electron's — fewer ready-made plugins

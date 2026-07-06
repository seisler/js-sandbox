# ADR-BE-006: Live npm Registry Search via a Dedicated Tauri Command

## Status
Accepted

## Date
2026-07-06

## Context

[ADR-BE-002](002-npm-package-injection.md) lets the sandbox *execute* any npm package by exact name — Rust fetches a browser-compatible bundle from esm.sh on demand and caches it. It does not let a user *discover* package names: the picker in the original ticket scope was a small hardcoded whitelist (`DEFAULT_ALIASES`: `lodash`, `date-fns`, `zod`), with no search against the registry, by explicit v1 assumption.

That assumption is now superseded: the package manager widget must let users search the real npm registry as they type and add any matching package, not just the three curated ones. This requires a new capability — querying npm for packages matching a text query — which does not exist anywhere in the backend today.

Two placement options exist for the search call:

1. **Frontend calls the registry directly** (`fetch()` from Svelte/TS against `registry.npmjs.org`). Rejected: the executor's V8 sandbox already blocks arbitrary network access as a deliberate security boundary (ADR-BE-002); the SvelteKit frontend itself runs in the Tauri WebView, which is a different trust boundary, but routing *all* external network I/O through Rust keeps a single, auditable point of egress for the whole app and matches the existing pattern (esm.sh fetches already go through Rust, not the frontend).
2. **Rust performs the search via a new Tauri command**, mirroring how `execute_js` is the sole IPC surface for running code. Chosen — consistent with [ADR-BE-004](004-command-layer.md) (thin command handlers) and keeps `reqwest` (already a dependency, per ADR-BE-002) as the only HTTP client in the app.

## Decision

Add a new, independent Tauri command, `search_packages(query: String) -> Result<Vec<PackageSearchResult>, String>`, that queries the public **npm registry search API** and returns lightweight results for the frontend to render.

```rust
// src-tauri/src/commands/search.rs
#[derive(serde::Serialize)]
pub struct PackageSearchResult {
    pub name: String,
    pub description: Option<String>,
    pub version: String,
}

#[tauri::command]
pub async fn search_packages(query: String) -> Result<Vec<PackageSearchResult>, String> {
    search::search_packages(&query).await.map_err(|e| e.to_string())
}
```

### How it works

1. **Endpoint** — `GET https://registry.npmjs.org/-/v1/search?text={query}&size=20`. This is npm's own public search index (the same one powering npmjs.com's search box); it needs no API key and is already reachable with `reqwest` (rustls-tls, no new dependency).
2. **Guard clause** — an empty/whitespace query returns `Ok(vec![])` immediately without a network call (mirrors the mockup/UI behavior of "nothing shows until the user types").
3. **Mapping** — each registry hit's `package.name`, `package.description`, `package.version` map to `PackageSearchResult`. Unrelated registry metadata (maintainers, score, keywords, etc.) is dropped at the boundary — the frontend only needs enough to render a result and confirm an add.
4. **Debouncing** — lives on the frontend (widget-local, per keystroke), not in Rust; the command is stateless and safe to call repeatedly.
5. **Errors** — network failures or non-2xx responses from the registry surface as a `String` error per [ADR-BE-003](003-error-handling.md), shown by the widget as an inline "Search unavailable, try again" message. A failed search never blocks adding a package the user already knows the exact name of in a future iteration, but for this feature the only add path is "select a search result."
6. **No caching of search results** — unlike bundle fetches (ADR-BE-002), search responses are not cached to disk; they are ephemeral and query-specific. Only the eventual *bundle* for a package the user actually adds is cached, per the existing ADR-BE-002 flow — this command only affects discovery, not execution.

### Registration

```rust
// lib.rs
.invoke_handler(tauri::generate_handler![
    commands::execution::execute_js,
    commands::search::search_packages,
])
```

## Consequences

**Positive:**
- Users can add any package published to npm, not just a 3-entry whitelist, directly satisfying the new product requirement.
- Reuses the existing `reqwest` dependency and the established thin-command-handler pattern (ADR-BE-004) — no new crates, no new architectural layer.
- Keeps all external network egress in Rust, consistent with the existing esm.sh fetch path and the sandbox's security posture (user JS still cannot reach the network directly).
- Search is fully decoupled from execution/caching (ADR-BE-002): a search hit that's never added costs nothing beyond the one API call.

**Negative:**
- New dependency on npm registry search API uptime/rate limits for the *discovery* experience (execution via esm.sh, per ADR-BE-002, is unaffected and works offline once cached).
- A package returned by search is not guaranteed to be browser-compatible; it can still fail at evaluation time exactly as described in ADR-BE-002 ("Node-native packages... fail... the user sees a runtime error"). Search surfaces existence, not sandbox compatibility.
- No result caching means retyping an identical query re-hits the network; acceptable given npm's search endpoint is designed for interactive use (this is the same endpoint npmjs.com's own site uses per-keystroke).

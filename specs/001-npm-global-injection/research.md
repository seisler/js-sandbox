# Research: npm Package CDN Injection

## Decision 1: CDN Selection — esm.sh

**Decision**: Fetch package bundles from `https://esm.sh/{package}?bundle` on first use.

**Rationale**: esm.sh serves the entire npm registry (not a curated subset), inlines all transitive dependencies into a single file via the `?bundle` flag, and requires no authentication. A single HTTPS GET returns a complete, self-contained ESM bundle with no further network calls needed at evaluation time. Packages that need Node.js system APIs (`fs`, `child_process`, etc.) are blocked at V8 evaluation time — an intentional security boundary.

**Alternatives considered**:
- `unpkg.com`: Serves raw package files from npm tarballs but does not bundle transitive dependencies. Packages without a pre-built browser dist (e.g. most utility libraries) require additional bundling.
- `jsDelivr`: Same as unpkg — raw files, no dependency inlining.
- Local esbuild: Requires esbuild on the user's machine (rejected — commercial product, no external tools).
- SWC bundler (Rust): Experimental, primarily ESM-only, weak CJS support — rejected for reliability.

---

## Decision 2: ESM Evaluation Strategy — Async IIFE Dynamic Import

**Decision**: Evaluate each cached ESM bundle via an async IIFE dynamic import injected before user code:

```js
(async () => {
  const __m__ = await import("speckit:{package}");
  globalThis["{alias}"] = __m__.default ?? __m__;
})()
```

`run_event_loop` is called once after all injection scripts to drain all promises before user code runs.

**Rationale**: esm.sh returns valid ESM (files with `export` statements). `JsRuntime::execute_script` evaluates scripts, not modules — it cannot directly evaluate ESM with export statements. The async IIFE dynamic-import pattern bridges the two: `execute_script` schedules the async work, `run_event_loop` drives the promises to completion, and the global is assigned as a side effect. This reuses the existing event loop pattern already present in the executor (`run_event_loop` is already called after user code). Per-package error attribution remains clear: each IIFE is a separate `execute_script` call tagged with `<inject:{package}>`.

The `speckit:` URL scheme is served by an extension of `SandboxModuleLoader.load()` that reads the cached bundle from disk. All other import specifiers remain blocked.

**Alternatives considered**:
- `JsRuntime::load_side_module` + `mod_evaluate` + V8 scope to extract namespace: Correct, but requires accessing deno_core's module graph internals which are not stable across minor versions.
- Stripping `export` statements with regex and evaluating as a script: Fragile — re-export patterns, star-exports, and inline export declarations do not reduce to simple regex substitution.
- Fetching IIFE from unpkg: Works for popular packages with pre-built browser bundles, but not reliable across the full npm registry.

---

## Decision 3: SandboxModuleLoader Extension

**Decision**: Extend `SandboxModuleLoader` with a `bundle_cache_dir: PathBuf` field. In `resolve()`, allow specifiers that use the `speckit:` scheme and block everything else. In `load()`, serve `speckit:{pkg}` URLs by reading `{bundle_cache_dir}/{pkg}.js` from disk.

The existing `default_whitelist()` function and `HashSet<String>` field are removed entirely — they were remnants of the old approach. User `import` statements (from typed code in the editor) are now blocked for all specifiers except `speckit:`. Since the `speckit:` specifier is only injected by the executor (not typed by users), this preserves the sandbox boundary.

**Rationale**: Minimal change to the existing `ModuleLoader` implementation. The `speckit:` scheme is an internal convention — it does not appear in user-facing documentation and cannot be navigated to from arbitrary user code without explicitly typing `await import("speckit:lodash")`. Even if a user did this, they would only access packages they already requested via the UI — no additional capability.

---

## Decision 4: HTTP Client — reqwest

**Decision**: Add `reqwest = { version = "0.12", default-features = false, features = ["rustls-tls"] }` to `Cargo.toml`. Use `reqwest::get(url).await?.text().await?` for CDN fetch.

**Rationale**: `reqwest` is the standard async HTTP client in the Tokio ecosystem. Using `rustls-tls` avoids a native OpenSSL dependency on Linux, which matters for cross-platform Tauri distribution. The `json` feature is not needed — we receive bundle text, not JSON. CDN fetch occurs in the `async fn execute_js` context (before `std::thread::spawn`), so `reqwest`'s async API is used directly without `spawn_blocking`.

**Alternatives considered**:
- `ureq` (blocking): Would require `spawn_blocking` or a dedicated thread. Since `execute_js` is already async, `reqwest` async is cleaner.
- `hyper` directly: Too low-level for a simple GET.

---

## Decision 5: Cache Location and Path Resolution

**Decision**: Cache bundles at `{app_data_dir}/js-sandbox/bundles/{package}.js`. The `app_data_dir` is resolved by the Tauri command handler via `app.path().app_data_dir()` and passed as a plain `PathBuf` to `executor::execute_js`. The executor creates the directory if absent with `tokio::fs::create_dir_all`.

**Rationale**: Tauri's `app_data_dir()` returns the OS-appropriate path. Passing a plain `PathBuf` keeps the executor free of any Tauri dependency (ADR-BE-004). `create_dir_all` is idempotent — safe to call on every execution, no conditional check needed.

**Alternatives considered**:
- Passing `tauri::AppHandle` to the executor: Couples executor to Tauri framework — violates ADR-BE-004.
- Hardcoding paths: Not cross-platform.

---

## Decision 6: Validation Order

**Decision**: Validate `alias` non-empty for all bindings synchronously before any cache check or network call. Return on first error.

**Rationale**: Structural validation (alias empty) costs nothing and catches the cheapest errors first, consistent with guard-clause style (CLAUDE.md). Network errors are surfaced per-package during the cache-or-fetch loop, which runs only after all alias validations pass.

---

## Decision 7: Error Strategy

**Decision**: `executor::execute_js` returns `Result<String, anyhow::Error>`. CDN fetch failures, cache I/O failures, and module evaluation failures are wrapped with `.context("...")` to produce descriptive error chains. The command handler converts to `String` via `.map_err(|e| e.to_string())` (ADR-BE-003).

**Node-native package failures**: A package that uses `fs`, `child_process`, etc. will fetch and cache successfully (the bundle is valid JS) but fail during `run_event_loop` when evaluated — V8 throws because `process`, `Buffer`, etc. are undefined. This surfaces as an error before user code runs and is returned as a descriptive string to the frontend. This is the intended security boundary.

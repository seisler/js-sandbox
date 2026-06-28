# Implementation Plan: npm Package CDN Injection

**Branch**: `feature/npm-packages-be` | **Date**: 2026-06-28 | **Spec**: [spec.md](spec.md)

## Summary

Extend `execute_js` to accept a list of `PackageBinding` pairs (package name + alias). Before execution, each package's ESM bundle is fetched from esm.sh on first use and cached to disk; subsequent calls read from cache. Inside the V8 runtime, each bundle is injected via an async IIFE dynamic import (`speckit:` URL scheme) that sets `globalThis[alias]` before user code runs. No Node.js, npm, or esbuild required on the user's machine.

## Technical Context

**Language/Version**: Rust 2021 edition; deno_core 0.x (pinned by existing Cargo.lock)

**New dependency**: `reqwest = { version = "0.12", default-features = false, features = ["rustls-tls"] }` — async HTTP client for CDN fetch

**Existing dependencies used**: `deno_core` (JsRuntime, ModuleLoader, V8), `tauri 2` (AppHandle, path API), `tokio 1` (fs, time, thread::spawn), `serde` (Deserialize on PackageBinding), `anyhow` (error propagation)

**Cache storage**: `{app_data_dir}/js-sandbox/bundles/{package}.js` — resolved via Tauri's `app.path().app_data_dir()` in the command handler; passed as `PathBuf` to executor

**CDN**: `https://esm.sh/{package}?bundle` — single-file ESM, deps inlined, full npm registry

**Injection mechanism**: Async IIFE `(async()=>{ const m=await import("speckit:{pkg}"); globalThis["{alias}"]=m.default??m; })()` evaluated via `execute_script`, drained by `run_event_loop` before user code

**SandboxModuleLoader changes**: Add `bundle_cache_dir: PathBuf` field; `speckit:` URLs served from cache; all other specifiers blocked; remove old whitelist

**Testing**: `cargo test` from `src-tauri/`; `#[tokio::test]` for async tests; network tests require internet; offline tests use temp dirs. TDD enforced (ADR-002).

**Target Platform**: Desktop (macOS, Windows, Linux) via Tauri 2

**Constraints**:
- All core errors use `anyhow::Error`; converted to `String` at Tauri boundary (ADR-BE-003)
- No business logic in `commands/` — only `app_data_dir` resolution + delegation (ADR-BE-004)
- `SandboxModuleLoader` blocks all user `import` except `speckit:` (ADR-BE-001)
- `.unwrap()` / `.expect()` forbidden outside `#[cfg(test)]` (ADR-BE-003)
- `ExecutionGuard` Drop pattern retained unchanged (ADR-BE-005)

## Constitution Check

*Constitution template not yet ratified. Checking against project ADRs.*

| ADR constraint | Status |
|----------------|--------|
| ADR-BE-001: SandboxModuleLoader blocks user imports | ✅ Only `speckit:` allowed; injected by executor, not user code |
| ADR-BE-002: On-demand CDN fetch + local cache | ✅ This plan implements the updated ADR-BE-002 |
| ADR-BE-003: anyhow in core, String at boundary | ✅ All executor functions return `Result<T, anyhow::Error>` |
| ADR-BE-004: Command handler thin adapter | ✅ Only `app_data_dir` resolution in command; all logic in executor |
| ADR-BE-005: RAII via Drop | ✅ `ExecutionGuard` retained; no new stateful resources |
| ADR-002: TDD mandatory | ✅ Tests written before implementation per task |

No violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-npm-global-injection/
├── plan.md              ← this file
├── research.md          ← CDN, ESM eval strategy, reqwest, error handling
├── data-model.md        ← PackageBinding, BundleCache, InjectionScript, state transitions
├── contracts/
│   └── execute-js.md   ← updated IPC contract with new signatures and error table
├── quickstart.md        ← runnable validation scenarios per user story
├── checklists/
│   └── requirements.md ← spec quality checklist
└── tasks.md             ← /speckit-tasks output (not created here)
```

### Source Code Changes

```text
src-tauri/
  Cargo.toml                  # Add: reqwest 0.12 (rustls-tls)
  src/
    executor.rs               # PackageBinding struct (serde::Deserialize)
    │                         # SandboxModuleLoader: add bundle_cache_dir, speckit: URL handling,
    │                         #   remove whitelist HashSet and default_whitelist()
    │                         # execute_js signature: add packages + bundle_cache_dir params
    │                         # CDN fetch + cache logic (async, before thread spawn)
    │                         # Injection loop: execute_script per binding + run_event_loop
    commands/
      execution.rs            # Thin adapter: resolve app_data_dir, pass PathBuf to executor
```

No `build.rs` changes. No new source files.

---

## Phase 0: Research Summary

See [research.md](research.md) for full decisions and rationale.

| Question | Decision |
|----------|----------|
| Which CDN? | esm.sh `?bundle` — full npm registry, deps inlined, single-file ESM |
| How to evaluate ESM in V8? | Async IIFE dynamic import → `run_event_loop` drains promises |
| How does `speckit:` URL get served? | `SandboxModuleLoader.load()` reads from `bundle_cache_dir` |
| HTTP client? | `reqwest` 0.12 with `rustls-tls` — async, cross-platform TLS |
| Where is cache path resolved? | Tauri command handler resolves `app_data_dir`, passes `PathBuf` to executor |
| Validation order? | Alias non-empty check → then CDN fetch loop → then V8 injection |
| Error strategy? | `anyhow::Context` chain in executor; `.map_err(|e| e.to_string())` at boundary |

---

## Phase 1: Design

### Data Model

See [data-model.md](data-model.md) for full details.

**`PackageBinding`** (new, in `executor.rs`):
```rust
#[derive(serde::Deserialize)]
pub struct PackageBinding {
    pub package: String,
    pub alias: String,
}
```

**`BundleCache`**: On-disk directory at `{app_data_dir}/js-sandbox/bundles/`. One `.js` file per package. Content is a single-file ESM bundle from esm.sh. Created lazily on first miss.

**No static package registry**: Any package name is accepted. No compile-time whitelist. The old `default_whitelist()` function and `HashSet<String>` field on `SandboxModuleLoader` are deleted.

### IPC Contract

See [contracts/execute-js.md](contracts/execute-js.md) for full contract.

**Updated executor signature:**
```rust
pub async fn execute_js(
    code: &str,
    packages: Vec<PackageBinding>,
    bundle_cache_dir: std::path::PathBuf,
) -> Result<String, anyhow::Error>
```

**Updated command handler:**
```rust
#[tauri::command]
pub async fn execute_js(
    app: tauri::AppHandle,
    code: String,
    packages: Vec<PackageBinding>,
) -> Result<String, String> {
    let cache_dir = app.path().app_data_dir()
        .context("failed to resolve app data dir")?
        .join("js-sandbox/bundles");
    executor::execute_js(&code, packages, cache_dir).await.map_err(|e| e.to_string())
}
```

**Frontend invoke shape** (unchanged from previous proposal):
```typescript
invoke('execute_js', { code, packages: [{ package: 'lodash', alias: '_' }] })
```

### Execution Flow (inside `execute_js`)

```
1. Validate: for each binding, alias.is_empty() → Err (no I/O)
2. Ensure cache (async, before thread spawn):
     tokio::fs::create_dir_all(&bundle_cache_dir).await
     for each binding:
       path = bundle_cache_dir.join(format!("{}.js", binding.package))
       if path.exists(): skip
       else: reqwest::get(format!("https://esm.sh/{}?bundle", binding.package))
               → check status (non-200 → Err naming the package)
               → write bytes to path
3. Thread spawn → JsRuntime::new(SandboxModuleLoader { bundle_cache_dir })
4. Injection loop (before user code):
     for each binding:
       execute_script("<inject:{pkg}>",
         format!("(async()=>{{ const __m__=await import('speckit:{pkg}');
                   globalThis['{alias}']=__m__.default??__m__; }})()"))
5. run_event_loop() — drains all injection promises
     → any module eval error (e.g. node-native package) surfaces here
6. execute_script("<sandbox>", user_code)
7. run_event_loop()
8. Extract result string → return Ok(result)
   ExecutionGuard Drop resets IS_RUNNING
```

### SandboxModuleLoader (updated)

```rust
struct SandboxModuleLoader {
    bundle_cache_dir: std::path::PathBuf,
}

impl ModuleLoader for SandboxModuleLoader {
    fn resolve(&self, specifier: &str, _referrer: &str, _kind: ResolutionKind)
        -> Result<ModuleSpecifier, anyhow::Error>
    {
        // Only allow speckit: scheme (injected by executor, not typed by users)
        if specifier.starts_with("speckit:") {
            return Ok(ModuleSpecifier::parse(specifier)?);
        }
        Err(anyhow::anyhow!("import is not allowed in the sandbox"))
    }

    fn load(&self, module_specifier: &ModuleSpecifier, ...) -> ModuleLoadResponse {
        // Serve speckit:{pkg} from bundle_cache_dir/{pkg}.js
        let pkg = module_specifier.path().trim_start_matches('/').to_string();
        let path = self.bundle_cache_dir.join(format!("{}.js", pkg));
        ModuleLoadResponse::Async(Box::pin(async move {
            let code = tokio::fs::read_to_string(&path).await
                .with_context(|| format!("failed to read cached bundle for '{pkg}'"))?;
            Ok(ModuleSource::new(
                ModuleType::JavaScript,
                ModuleSourceCode::String(code.into()),
                module_specifier,
                None,
            ))
        }))
    }
}
```

### Quickstart / Validation

See [quickstart.md](quickstart.md) for runnable validation commands per user story. Network tests require internet; offline tests use temp dirs.

---

## Implementation Order (for /speckit-tasks)

1. **Cargo.toml** — add reqwest dependency
2. **executor.rs** — `PackageBinding` struct with `serde::Deserialize`
3. **executor.rs** — update `SandboxModuleLoader`: add `bundle_cache_dir`, implement `speckit:` in `resolve()` and `load()`, remove `whitelist` field and `default_whitelist()`
4. **executor.rs** — validation: alias empty check (before all I/O)
5. **executor.rs** — CDN fetch + cache: `create_dir_all`, check file exists, `reqwest::get`, write to disk
6. **executor.rs** — injection loop: `execute_script` async IIFE per binding, `run_event_loop` to drain
7. **executor.rs** — update `execute_js` signature: add `packages: Vec<PackageBinding>` and `bundle_cache_dir: PathBuf`
8. **commands/execution.rs** — resolve `app_data_dir`, pass `PathBuf` and `packages` to executor
9. **tests** — one `#[tokio::test]` per user story and edge case (TDD: write first, confirm failing)

# ADR-BE-002: npm Package Access via CDN Fetch and V8 Global Injection

## Status
Accepted (supersedes on-demand local bundling approach)

## Date
2026-06-28

## Context

The sandbox needs to let user code consume npm packages (e.g. `lodash`, `date-fns`, `zod`). The existing backend uses `deno_core`, which provides a raw V8 isolate with a `ModuleLoader` trait. That trait controls what `import` statements resolve to — but the module system is intentionally blocked for security.

Two earlier designs were considered and rejected:

1. **Compile-time embedding**: Pre-bundled a fixed whitelist at build time via `include_str!`. Rejected because the whitelist is hardcoded, requires a rebuild for every new package, and bloats the binary.

2. **On-demand local bundling**: Called `npm install` + `esbuild` on the user's machine at runtime. Rejected because it requires Node.js, npm, and esbuild to be installed — unacceptable for a commercial desktop app where we cannot control the user's environment.

This is a commercial sandboxed app. We explicitly do not want user-submitted code to access machine-level APIs (`fs`, `child_process`, `net`, etc.). The execution environment is a V8 isolate — a browser-like context, not a Node.js context.

## Decision

Packages are fetched on demand from a public CDN (**esm.sh**), which serves the full npm registry as pre-built, browser-compatible bundles. Rust fetches the bundle over HTTPS using `reqwest`, writes it to the OS app-data cache directory, and reuses the cached file on all subsequent runs. No Node.js, npm, or esbuild installation is required on the user's machine.

User code uses the injected globals directly — no `import`, no `require`, no `npm()` call.

```js
// user adds lodash and date-fns via the UI panel — then just uses them:
const result = _.chunk([1, 2, 3, 4], 2)
const label = dateFns.format(new Date(), 'yyyy-MM-dd')
```

### How it works

1. **IPC contract** — `execute_js` accepts the active package list alongside the code:
   ```rust
   pub struct PackageBinding {
       pub package: String,  // npm package name, e.g. "lodash"
       pub alias: String,    // user-chosen global name, e.g. "_"
   }

   pub fn execute_js(code: String, packages: Vec<PackageBinding>) -> Result<String, String>
   ```

2. **Validation** — before any network activity, reject any `PackageBinding` with an empty alias and return a descriptive error.

3. **Cache check** — for each `PackageBinding`, check whether a bundle already exists at:
   `{app_data_dir}/js-sandbox/bundles/{package}.js`
   If it does, skip the fetch entirely.

4. **CDN fetch** — for any bundle not yet cached, Rust issues an HTTPS GET to:
   `https://esm.sh/{package}?bundle`
   This returns a single-file, dependency-inlined ESM bundle. The response is written to the cache path.

5. **Context bootstrap** — before executing user code, each cached bundle is evaluated in the V8 context and the resulting module exports are assigned to `globalThis[alias]`. The `SandboxModuleLoader` is extended to serve cached bundles from disk when loaded under the internal `speckit:{package}` URL scheme; all other `import` statements remain blocked.

6. **SandboxModuleLoader** from ADR-BE-001 continues to block all user-initiated `import` statements.

### CDN and the security boundary

Packages that rely on Node.js system APIs (`fs`, `child_process`, `net`, `os`, etc.) will fail to function inside the V8 sandbox — the APIs simply do not exist. This is **intentional and a security feature**, not a limitation. A commercial sandbox must not let user-submitted code read files, spawn processes, or make arbitrary network connections. The CDN approach naturally enforces this: only browser-compatible packages work, which is exactly the safe subset.

### Cache location

| Platform | Path |
|----------|------|
| Linux    | `$XDG_DATA_HOME/js-sandbox/bundles/` or `~/.local/share/js-sandbox/bundles/` |
| macOS    | `~/Library/Application Support/js-sandbox/bundles/` |
| Windows  | `%APPDATA%\js-sandbox\bundles\` |

Resolved at runtime via Tauri's `app_data_dir()`.

### Prerequisites on the user's machine

None. `reqwest` is a Rust HTTP client compiled into the app binary. No external tools are required.

### Adding a package

The user types the package name in the UI widget. No rebuild is needed. The bundle is fetched from esm.sh on first use and cached indefinitely. Subsequent runs are fully offline.

## Consequences

**Positive:**
- No Node.js, npm, or esbuild required on the user's machine
- Covers the full npm registry (esm.sh serves everything published to npm)
- Binary size is unaffected by the package set
- After first use, fully offline — no repeated network calls
- Node-native packages are blocked at the V8 sandbox boundary, which is a deliberate security property of a commercial sandbox product

**Negative:**
- First use of a package requires an internet connection and takes the time of one HTTPS request
- Packages that only work in Node.js (not browser-compatible) will fail at evaluation time — the user sees a runtime error explaining the package is not compatible with the sandbox
- esm.sh is a third-party service; if it is unavailable, first-time package fetching fails. Cached packages continue to work offline.
- Cache is not version-locked by default — `{package}@{version}` syntax in the package name field (e.g. `lodash@4.17.21`) pins a version; without it, the latest version is fetched on first use

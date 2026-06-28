# Data Model: npm Package CDN Injection

## Entities

### PackageBinding

Represents one requested package injection for a single script execution.

| Field     | Type   | Constraints |
|-----------|--------|-------------|
| `package` | String | Any non-empty string; passed as-is to the CDN URL and used as the cache filename |
| `alias`   | String | Must be non-empty; used as the `globalThis` key in V8 |

**Validation rules** (applied before any I/O, in order):
1. `alias` must not be empty → error: `"Alias must not be empty for package '{package}'"`

No registry whitelist check — any package name is attempted.

**Lifecycle**: Created per IPC call from the frontend JSON payload, consumed by the executor's inject phase, then discarded. Not persisted.

---

### BundleCache

The on-disk store of pre-fetched ESM bundles. Each entry is a plain `.js` file keyed by package name.

| Attribute       | Value |
|-----------------|-------|
| Location        | `{app_data_dir}/js-sandbox/bundles/` |
| File naming     | `{package}.js` — e.g. `lodash.js`, `date-fns.js` |
| Content         | Single-file ESM bundle (all transitive deps inlined) from esm.sh |
| Persistence     | Survives app restarts; cleared only by the user or OS |
| Version locking | Not enforced by default; pinned via `lodash@4.17.21` syntax in the package name |

**Cache hit** (file exists): bundle content read from disk, no network call.

**Cache miss** (file absent): `GET https://esm.sh/{package}?bundle` → response body written to `{package}.js` → cache hit on all subsequent calls.

---

### InjectionScript (runtime-generated, not persisted)

Constructed per binding per execution call. Never written to disk.

**Template** (one script per `PackageBinding`, evaluated before user code):

```js
(async () => {
  const __m__ = await import("speckit:{package}");
  globalThis["{alias}"] = __m__.default ?? __m__;
})()
```

The `speckit:{package}` URL is intercepted by `SandboxModuleLoader`, which reads the bundle from the `BundleCache` and serves it as a JavaScript module. After `run_event_loop` drains all promises, `globalThis[alias]` holds the package's default export (or the full module namespace if there is no default).

---

### SandboxModuleLoader (updated)

The module loader passed to `JsRuntime`. Extended with a `bundle_cache_dir: PathBuf` field.

| URL scheme | Behaviour |
|------------|-----------|
| `speckit:{pkg}` | Read `{bundle_cache_dir}/{pkg}.js` from disk and serve as a JavaScript module |
| Anything else | Return error: `"import is not allowed in the sandbox"` |

The old `whitelist: HashSet<String>` field and `default_whitelist()` function are removed.

---

## State Transitions

```
IPC call received (code + Vec<PackageBinding> + bundle_cache_dir)
  │
  ▼
Validate all bindings (alias non-empty)
  │ error → return Err immediately, no I/O
  │ ok
  ▼
For each PackageBinding (async, before thread spawn):
  │  BundleCache hit?  → read from disk (no network)
  │  BundleCache miss? → GET esm.sh/{pkg}?bundle → write to disk
  │  CDN error?        → return Err (descriptive, names the package)
  │ all bundles cached
  ▼
Spawn execution thread → create JsRuntime (with SandboxModuleLoader pointing to cache dir)
  │
  ▼
For each PackageBinding (in order):
  │  execute_script("<inject:{package}>", async_iife)
  ▼
run_event_loop (drains all injection promises → globalThis[alias] set for each)
  │ module eval error? → return Err before user code runs
  │ ok
  ▼
execute_script("<sandbox>", user_code)
run_event_loop
  │
  ▼
Return result string → ExecutionGuard Drop resets IS_RUNNING
```

---

## Collision Behaviour

| Scenario | Behaviour |
|----------|-----------|
| Two bindings with the same alias | Second overwrites first in V8 global scope. No error. |
| Alias matches a JS built-in (e.g. `Array`) | Allowed. User accepts responsibility. |
| Same package name, two different aliases | Both aliases injected; CDN fetch occurs only once per package name per execution call. |
| Module evaluates but exports nothing (`default` is undefined and namespace is empty) | `globalThis[alias]` is set to the empty module namespace object. No error. |
| Node-native package (`fs`, `child_process`, etc.) | Bundle fetches and caches, but V8 throws during `run_event_loop` injection phase. Error returned before user code runs. |
| CDN unavailable, bundle already cached | Serves from cache — fully offline. No error. |
| CDN unavailable, bundle not cached | Returns error identifying the package and the network failure. |

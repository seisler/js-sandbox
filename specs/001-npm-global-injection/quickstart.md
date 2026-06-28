# Quickstart Validation Guide: npm Package CDN Injection

## Prerequisites

- Rust toolchain (`cargo --version`)
- Internet access for first-time package fetch (tests that hit the CDN will fail offline)
- No other tools required — `reqwest` is compiled into the binary

---

## Running the Backend Tests

```bash
cd src-tauri
cargo test
```

Expected: all pre-existing tests pass + all new injection tests pass.

**Note on network tests**: Tests that verify CDN fetch (cache miss path) require internet. Tests that verify the cache hit path use a local temp directory and are fully offline. Each test is documented below.

---

## Validation Scenarios

### Scenario 1 — First-time package fetch and use (US-1, requires network)

```bash
cargo test test_lodash_chunk_first_use
```

What it verifies:
- CDN fetch is triggered when no cache file exists
- Bundle is written to a temp cache directory
- `_.chunk([1,2,3,4], 2)` returns `[[1,2],[3,4]]` via the `_` alias
- No import statement required in user code

### Scenario 2 — Cached bundle skips network (US-2, offline safe)

```bash
cargo test test_cached_bundle_no_fetch
```

What it verifies:
- When a bundle file already exists in cache, no HTTP request is made
- Output is correct using the cached file
- Test uses a pre-populated temp directory (no CDN call)

### Scenario 3 — Multiple packages simultaneously (US-3, requires network on first run)

```bash
cargo test test_multiple_packages_simultaneous
```

What it verifies:
- Two packages (e.g. lodash as `_`, zod as `z`) both available in one execution
- Each alias is independent; neither shadows the other

### Scenario 4 — Unknown package CDN error (US-4, requires network)

```bash
cargo test test_unknown_package_cdn_error
```

What it verifies:
- Requesting `not-a-real-package-xyzzy` triggers a CDN fetch that returns non-200
- Error message identifies the package by name
- No user code is executed

### Scenario 5 — Empty alias rejected before I/O (US-5, offline safe)

```bash
cargo test test_empty_alias_rejected
```

What it verifies:
- A binding with `alias: ""` returns a validation error immediately
- No CDN fetch, no disk access, no thread spawn

### Scenario 6 — Empty package list: regression (US-6, offline safe)

```bash
cargo test test_empty_packages_no_regression
```

What it verifies:
- `execute_js("1 + 1", vec![], cache_dir)` returns `"2"` with no network activity
- All seven pre-existing executor tests continue to pass

### Scenario 7 — Custom alias (US-7, requires network on first run)

```bash
cargo test test_custom_alias
```

What it verifies:
- Lodash injected as `lodash` (not `_`) is callable as `lodash.chunk([1,2,3], 2)`
- `_` is not defined in V8 scope

---

## Full Regression Run

```bash
cd src-tauri
cargo test 2>&1 | grep -E "(test .* ok|FAILED|error)"
```

Expected: all lines show `ok`, zero `FAILED`.

---

## End-to-End Smoke Test (manual, full app)

1. Run `npm run tauri dev`
2. Open the package panel in the UI
3. Add `lodash` with alias `_`
4. In the editor, type: `JSON.stringify(_.chunk([1,2,3,4], 2))`
5. Click Run
6. Confirm the results console shows `[[1,2],[3,4]]`
7. Run again immediately — confirm it is faster (cache hit, no CDN call)
8. Remove lodash from the package list and re-run — confirm `ReferenceError: _ is not defined`

See [contracts/execute-js.md](contracts/execute-js.md) for the full IPC contract.
See [data-model.md](data-model.md) for state transitions and collision behaviour.

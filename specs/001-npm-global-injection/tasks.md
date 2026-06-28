# Tasks: npm Package CDN Injection

**Input**: Design documents from `specs/001-npm-global-injection/`

**Source files changed**:
- `src-tauri/Cargo.toml` — add reqwest dependency
- `src-tauri/src/executor.rs` — PackageBinding struct, SandboxModuleLoader update, validation, CDN fetch + cache, injection loop, updated signature
- `src-tauri/src/commands/execution.rs` — AppHandle, resolve cache_dir, pass to executor

**TDD approach (ADR-002)**: Every implementation task is preceded by a test task. The test MUST be written and confirmed failing before implementation begins.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps to user story (US1–US7 from spec.md)
- ADR-002: tests MUST fail before implementation begins

---

## Phase 1: Setup

**Purpose**: Add the HTTP client dependency required for CDN fetch.

- [X] T001 Add `reqwest = { version = "0.12", default-features = false, features = ["rustls-tls"] }` to `src-tauri/Cargo.toml`; run `cargo build` from `src-tauri/` and confirm it compiles

**Checkpoint**: `cargo build` succeeds with reqwest in the dependency tree

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Introduce `PackageBinding`, update the `execute_js` signature to a stub (accepts new params, ignores packages), update `SandboxModuleLoader` to handle `speckit:` URLs, and wire up the command handler. After this phase every story's tests can compile even before their logic is implemented.

**⚠️ CRITICAL**: No user story tests can compile until `PackageBinding` exists and the new `execute_js` signature is in place.

- [X] T002 Add `#[derive(serde::Deserialize)] pub struct PackageBinding { pub package: String, pub alias: String }` above `execute_js` in `src-tauri/src/executor.rs`
- [X] T003 Update `execute_js` signature in `src-tauri/src/executor.rs` to `pub async fn execute_js(code: &str, packages: Vec<PackageBinding>, bundle_cache_dir: std::path::PathBuf) -> Result<String, anyhow::Error>`; stub body: ignore `packages` and `bundle_cache_dir` for now, keep existing execution logic; confirm `cargo test` compiles and all pre-existing tests still pass
- [X] T004 Update `SandboxModuleLoader` in `src-tauri/src/executor.rs`: replace `whitelist: HashSet<String>` with `bundle_cache_dir: std::path::PathBuf`; delete `default_whitelist()` function; update `new()` to accept `PathBuf`; in `resolve()`, allow specifiers starting with `speckit:` and return error `"import is not allowed in the sandbox"` for everything else; in `load()`, serve `speckit:{pkg}` URLs by reading `{bundle_cache_dir}/{pkg}.js` from disk with `tokio::fs::read_to_string`
- [X] T005 Update `JsRuntime::new(...)` call in `src-tauri/src/executor.rs` to pass `SandboxModuleLoader { bundle_cache_dir: bundle_cache_dir.clone() }`
- [X] T006 Update `src-tauri/src/commands/execution.rs`: add `app: tauri::AppHandle` and `packages: Vec<PackageBinding>` parameters; resolve cache dir with `app.path().app_data_dir().context("failed to resolve app data dir")?.join("js-sandbox/bundles")`; pass `packages` and `cache_dir` to `executor::execute_js`; add `use crate::executor::PackageBinding;` and `use anyhow::Context;`

**Checkpoint**: `cargo test` compiles and all pre-existing tests pass with the stub signature

---

## Phase 3: User Story 5 — Empty Alias Rejected (Priority: P1)

**Goal**: A `PackageBinding` with an empty `alias` field is rejected with a descriptive error before any I/O occurs.

**Independent Test**: `cargo test test_empty_alias_rejected` passes — no CDN call, no disk access, no thread spawn triggered.

### Test for US5 (TDD — write FIRST, confirm FAILING)

- [X] T007 [US5] Write `#[tokio::test] async fn test_empty_alias_rejected` in the `#[cfg(test)] mod tests` block in `src-tauri/src/executor.rs`: create a temp dir with `tempfile::tempdir()` (add `tempfile = "3"` to `[dev-dependencies]` in `Cargo.toml` if not present), call `execute_js("1+1", vec![PackageBinding { package: "lodash".into(), alias: "".into() }], temp_dir.path().to_path_buf()).await`, assert the result is `Err` and the error string contains `"empty"` or `"Alias"`; run `cargo test test_empty_alias_rejected` and confirm it FAILS (stub currently ignores packages)

### Implementation for US5

- [X] T008 [US5] Add alias validation at the top of `execute_js` in `src-tauri/src/executor.rs` before any I/O: `for b in &packages { if b.alias.is_empty() { return Err(anyhow::anyhow!("Alias must not be empty for package '{}'", b.package)); } }`; run `cargo test test_empty_alias_rejected` and confirm PASS; run `cargo test` and confirm no regressions

**Checkpoint**: US5 fully functional — empty aliases rejected before any work

---

## Phase 4: User Story 6 — No Packages: Regression (Priority: P1)

**Goal**: An empty `packages` list produces the same output as the pre-feature `execute_js(code)` — no network, no globals injected.

**Independent Test**: `cargo test test_empty_packages_no_regression test_empty_packages_no_global` both pass.

### Tests for US6 (TDD — write FIRST, confirm FAILING or passing)

- [X] T009 [US6] Write `#[tokio::test] async fn test_empty_packages_no_regression` in `src-tauri/src/executor.rs`: call `execute_js("1 + 1", vec![], tempfile::tempdir().unwrap().path().to_path_buf()).await` and assert result is `Ok("2".to_string())`; write `#[tokio::test] async fn test_empty_packages_no_global`: call `execute_js("typeof _", vec![], temp_dir).await` and assert result is `Ok("undefined".to_string())`; run both — if they PASS already (stub handles empty case), document as expected and note no new implementation needed for this story

### Implementation for US6

- [X] T010 [US6] Run `cargo test` — all pre-existing tests and T009 tests must pass; if any regression is found, debug the stub in `execute_js` in `src-tauri/src/executor.rs` and fix before proceeding

**Checkpoint**: US6 confirmed — zero regressions, empty package list is a safe no-op

---

## Phase 5: User Story 1 — First-Time Package Fetch (Priority: P1) 🎯 MVP

**Goal**: On the first use of a package, the backend fetches its ESM bundle from esm.sh, writes it to the cache directory, injects it as a V8 global, and user code can call it.

**Independent Test**: `cargo test test_lodash_first_use` passes — requires internet on first run; bundle file is written to the temp cache dir.

### Tests for US1 (TDD — write FIRST, confirm FAILING)

- [X] T011 [US1] Write `#[tokio::test] async fn test_lodash_first_use` in `src-tauri/src/executor.rs`: create a fresh temp dir (empty), call `execute_js("JSON.stringify(_.chunk([1,2,3,4],2))", vec![PackageBinding { package: "lodash".into(), alias: "_".into() }], temp_dir.path().to_path_buf()).await`; assert result is `Ok("[[1,2],[3,4]]".to_string())`; also assert `temp_dir.path().join("lodash.js").exists()` is true after the call; run `cargo test test_lodash_first_use` and confirm it FAILS (`_` is not defined — packages are ignored by stub)
- [X] T012 [US1] Write `#[tokio::test] async fn test_zod_parse` in `src-tauri/src/executor.rs`: inject `zod` as `z`, run `z.string().parse("hello")`, assert result is `Ok("\"hello\"".to_string())` or similar; confirm FAILS

### Implementation for US1 — CDN fetch and cache

- [X] T013 [US1] Implement CDN fetch + cache in `src-tauri/src/executor.rs` in `execute_js`, after validation and before the thread spawn: call `tokio::fs::create_dir_all(&bundle_cache_dir).await.context("failed to create bundle cache dir")?`; for each binding, compute `path = bundle_cache_dir.join(format!("{}.js", binding.package))`; if `path.exists()` skip; else `let resp = reqwest::get(format!("https://esm.sh/{}?bundle", binding.package)).await.context(...)?`; check `resp.status().is_success()` → else return `Err(anyhow::anyhow!("Failed to fetch '{}': {}", binding.package, resp.status()))`; write `resp.text().await?` to `path` with `tokio::fs::write`

### Implementation for US1 — Injection loop

- [X] T014 [US1] Implement the injection loop in the thread spawn body in `src-tauri/src/executor.rs`, before `execute_script("<sandbox>", code)`: for each binding, call `runtime.execute_script(format!("<inject:{}>", binding.package).as_str().into(), format!("(async()=>{{ const __m__=await import('speckit:{}'); globalThis['{}']=__m__.default??__m__; }})()", binding.package, binding.alias).into())?`; after the loop, call `runtime.run_event_loop(Default::default()).await?` to drain all injection promises before user code runs; the existing `execute_script("<sandbox>", code)` and second `run_event_loop` calls remain unchanged
- [X] T015 [US1] Run `cargo test test_lodash_first_use test_zod_parse` and confirm both PASS; run `cargo test` and confirm no regressions

**Checkpoint**: US1 fully functional — first-time package fetch, cache write, and global injection all work end-to-end

---

## Phase 6: User Story 2 — Cached Bundle Skips Network (Priority: P1)

**Goal**: When a bundle file already exists in the cache directory, no CDN fetch occurs — the bundle is served from disk.

**Independent Test**: `cargo test test_cached_bundle_no_fetch` passes — fully offline, uses a pre-written fake bundle.

### Test for US2 (TDD — write FIRST, confirm FAILING)

- [X] T016 [US2] Write `#[tokio::test] async fn test_cached_bundle_no_fetch` in `src-tauri/src/executor.rs`: create a temp dir; write a minimal valid ESM bundle to `temp_dir/test-pkg.js`: `"export default { value: 42 };"` using `tokio::fs::write`; call `execute_js("JSON.stringify(myPkg.value)", vec![PackageBinding { package: "test-pkg".into(), alias: "myPkg".into() }], temp_dir.path().to_path_buf()).await`; assert result is `Ok("42".to_string())`; this test must pass without any network call (the bundle is pre-written); run `cargo test test_cached_bundle_no_fetch` and confirm FAILS before T013/T014 are implemented; after T013/T014, run again and confirm PASS

### Implementation for US2

- [X] T017 [US2] Verify the `path.exists()` check in `src-tauri/src/executor.rs` (added in T013) skips the `reqwest::get` call when the file is present; no new implementation needed — the cache-hit path was included in T013; if `test_cached_bundle_no_fetch` fails after T013/T014, debug the file-existence check

**Checkpoint**: US2 confirmed — repeat runs use cache, no re-fetch occurs

---

## Phase 7: User Story 4 — Unknown Package CDN Error (Priority: P1)

**Goal**: A package that does not exist on the npm registry causes a descriptive error before any user code runs.

**Independent Test**: `cargo test test_unknown_package_error` passes — requires internet to confirm the 404.

### Test for US4 (TDD — write FIRST, confirm FAILING)

- [X] T018 [US4] Write `#[tokio::test] async fn test_unknown_package_error` in `src-tauri/src/executor.rs`: create a temp dir; call `execute_js("1+1", vec![PackageBinding { package: "not-a-real-package-xyzzy-404".into(), alias: "x".into() }], temp_dir.path().to_path_buf()).await`; assert result is `Err` and the error string contains `"not-a-real-package-xyzzy-404"`; run `cargo test test_unknown_package_error` and confirm FAILS (stub ignores packages, returns Ok)

### Implementation for US4

- [X] T019 [US4] Verify the non-200 status check in `src-tauri/src/executor.rs` (added in T013) produces an error that includes the package name; no new implementation if T013 already handles it; run `cargo test test_unknown_package_error` and confirm PASS; run `cargo test` and confirm no regressions

**Checkpoint**: US4 confirmed — unknown packages surface a descriptive, named error before user code runs

---

## Phase 8: User Story 3 — Multiple Packages Simultaneously (Priority: P1)

**Goal**: Two or more packages are all available as distinct globals in the same execution with no interference.

**Independent Test**: `cargo test test_multiple_packages_simultaneous` passes.

### Test for US3 (TDD — write FIRST, confirm FAILING before Phase 5)

- [X] T020 [US3] Write `#[tokio::test] async fn test_multiple_packages_simultaneous` in `src-tauri/src/executor.rs`: create a temp dir; write two fake bundles — `test-a.js`: `export default { name: "a" };` and `test-b.js`: `export default { name: "b" };`; call `execute_js("JSON.stringify([pkgA.name, pkgB.name])", vec![PackageBinding { package: "test-a".into(), alias: "pkgA".into() }, PackageBinding { package: "test-b".into(), alias: "pkgB".into() }], temp_dir.path().to_path_buf()).await`; assert result is `Ok("[\"a\",\"b\"]".to_string())`; run and confirm FAILS before Phase 5; after Phase 5 (T014), run and confirm PASS

### Implementation for US3

- [X] T021 [US3] Run `cargo test test_multiple_packages_simultaneous` — the injection loop from T014 iterates `Vec<PackageBinding>` so multiple packages should work without additional code; if the test fails, debug the loop in `src-tauri/src/executor.rs`; run `cargo test` and confirm no regressions

**Checkpoint**: US3 confirmed — multiple packages injectable in one execution

---

## Phase 9: User Story 7 — Custom Alias (Priority: P2)

**Goal**: A package bound to a non-default alias is available only under that alias; no other name for the same package is defined.

**Independent Test**: `cargo test test_custom_alias test_default_alias_absent` both pass.

### Tests for US7 (TDD — write FIRST, confirm FAILING before Phase 5)

- [X] T022 [US7] Write `#[tokio::test] async fn test_custom_alias` in `src-tauri/src/executor.rs`: write `test-pkg.js` (`export default { v: 7 };`) to a temp dir; inject as alias `"myLib"`; run `"JSON.stringify(myLib.v)"`; assert `Ok("7".to_string())`; write `#[tokio::test] async fn test_default_alias_absent`: same bundle, alias `"myLib"`, run `"typeof testPkg"`; assert `Ok("undefined".to_string())`; confirm both FAIL before Phase 5

### Implementation for US7

- [X] T023 [US7] Run `cargo test test_custom_alias test_default_alias_absent` — the async IIFE in T014 uses `binding.alias` directly, so custom aliases should work without additional code; if tests fail, check the format string in `src-tauri/src/executor.rs` T014 injection script; run `cargo test` and confirm no regressions

**Checkpoint**: US7 confirmed — alias is fully user-controlled; no default name leaks into scope

---

## Phase 10: Polish & Cross-Cutting Concerns

- [X] T024 [P] Run full `cargo test` from `src-tauri/` and confirm all tests pass — zero `FAILED` lines; document any `#[ignore]`-tagged tests (network-required) and how to run them explicitly: `cargo test -- --include-ignored`
- [ ] T025 [P] Run the quickstart validation guide `specs/001-npm-global-injection/quickstart.md` end-to-end: `npm run tauri dev`, add lodash as `_`, run `JSON.stringify(_.chunk([1,2,3,4],2))`, confirm `[[1,2],[3,4]]` in results console, run a second time and confirm it is faster (cache hit)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks all user stories** (compilation fails without PackageBinding + new signature)
- **Phases 3–9 (User Stories)**: All depend on Phase 2; ordered below by implementation dependency
- **Phase 10 (Polish)**: Depends on all desired phases complete

### User Story Dependencies

| Story | Phase | Depends on | Note |
|-------|-------|-----------|------|
| US5 (Phase 3) | 3 | Phase 2 | Validation only — no CDN or injection code needed |
| US6 (Phase 4) | 4 | Phase 2 | Regression — stub likely passes already |
| US1 (Phase 5) | 5 | Phase 2 + US5 | Core: CDN fetch + injection loop |
| US2 (Phase 6) | 6 | Phase 5 (T013/T014) | Cache hit path built in T013 |
| US4 (Phase 7) | 7 | Phase 5 (T013) | Error path built in T013 |
| US3 (Phase 8) | 8 | Phase 5 (T014) | Loop already handles Vec |
| US7 (Phase 9) | 9 | Phase 5 (T014) | Alias from binding.alias — no new code expected |

### Within Each Phase

1. **Test task first** — write and run; confirm FAILING (red)
2. **Implementation task** — minimum code to pass (green)
3. **Run full `cargo test`** — confirm no regressions before next phase

### Parallel Opportunities

- T002, T001 can run in parallel (different files)
- T003, T004 are sequential (struct before signature; SandboxModuleLoader depends on struct)
- T007, T009 (test writing) can be written in parallel after Phase 2 compiles — each is a new `#[test]` fn in the same file, but test writing has no ordering constraint
- T020, T022 (US3 and US7 tests) can be written immediately after Phase 2, before Phase 5 implementation — they use pre-written local bundles and will simply fail until T014 is done
- T024, T025 (polish) can run in parallel

---

## Parallel Example: Writing All Tests After Phase 2

```text
After Phase 2 compiles (T002–T006 done), write all failing tests:

T007: test_empty_alias_rejected (US5) — offline
T009: test_empty_packages_no_regression (US6) — offline
T011: test_lodash_first_use (US1) — requires network
T016: test_cached_bundle_no_fetch (US2) — offline (pre-written bundle)
T018: test_unknown_package_error (US4) — requires network
T020: test_multiple_packages_simultaneous (US3) — offline (pre-written bundles)
T022: test_custom_alias (US7) — offline (pre-written bundle)

Then implement story-by-story: US5 → US6 → US1 → US2 → US4 → US3 → US7
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Phase 1 + 2 → foundational stub compiles
2. Phase 3 (US5) → validation guard in place
3. Phase 5 (US1) → CDN fetch + injection working
4. **STOP and VALIDATE**: `cargo test test_lodash_first_use` passes; manual tauri dev smoke test
5. Single package injection from CDN is the core deliverable

### Incremental Delivery

1. Phase 1 + 2 → compiles
2. Phase 3 (US5) → guard clause
3. Phase 4 (US6) → regression confirmed
4. Phase 5 (US1) → MVP: CDN fetch + inject
5. Phase 6 (US2) → cache hit (US1 already includes this)
6. Phase 7 (US4) → CDN errors (US1 already includes this)
7. Phase 8 (US3) → multiple packages
8. Phase 9 (US7) → custom alias (P2)

---

## Notes

- All Rust tests live in `src-tauri/src/executor.rs` `#[cfg(test)] mod tests` block
- All tests are `#[tokio::test]` (async)
- Tests that use pre-written local bundles are offline-safe; note which tests require network in CI config
- `tempfile` crate used for temp dirs in tests — add to `[dev-dependencies]` in `Cargo.toml` in T007
- Never skip the "confirm FAILS" step — a test that passes before implementation is testing nothing
- `cargo test` is run from `src-tauri/` (not repo root)
- The `?` operator propagates errors per ADR-BE-003; never use `.unwrap()` in non-test code

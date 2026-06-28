# IPC Contract: execute_js

**Command**: `execute_js`
**Direction**: Frontend → Backend (Tauri invoke)
**Transport**: `@tauri-apps/api/core` → `invoke('execute_js', args)`

---

## Request

```json
{
  "code": "<string — the JavaScript to execute>",
  "packages": [
    { "package": "<string — npm package name>", "alias": "<string — non-empty global name>" }
  ]
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `code` | `string` | yes | The JavaScript source to execute |
| `packages` | `PackageBinding[]` | yes | Zero or more package bindings. Empty array is valid. |
| `packages[].package` | `string` | yes | Any npm package name (e.g. `"lodash"`, `"lodash@4.17.21"`). Passed as-is to the CDN. |
| `packages[].alias` | `string` | yes | Must be non-empty. Used as `globalThis[alias]` in V8. |

**Validation** (backend, before any I/O):
1. For each binding, if `alias` is empty → error: `"Alias must not be empty for package '{package}'"`
2. Errors are returned immediately; no network or disk I/O occurs

---

## Response

**Success** (`Result::Ok`):
```json
"<string — the value of the last expression in the script, serialised via V8's toString>"
```

**Error** (`Result::Err`):
```json
"<string — human-readable error message>"
```

Error sources (in order of detection):

| Order | Source | Example message |
|-------|--------|-----------------|
| 1 | Empty alias validation | `"Alias must not be empty for package 'lodash'"` |
| 2 | CDN fetch failure (not found / network) | `"Failed to fetch package 'not-a-real-pkg' from CDN: 404 Not Found"` |
| 3 | Cache I/O failure | `"Failed to write bundle cache for 'lodash': permission denied"` |
| 4 | Module evaluation failure (node-native package) | `"Failed to inject package 'some-node-pkg': ReferenceError: process is not defined"` |
| 5 | User code syntax or runtime error | `"SyntaxError: Unexpected token"` |
| 6 | Script timeout (30 s) | `"Script timed out"` |
| 7 | Concurrent execution guard | `"Another execution is already in progress"` |

---

## Frontend Calling Convention (TypeScript)

```typescript
import { invoke } from '@tauri-apps/api/core'

type PackageBinding = { package: string; alias: string }

async function executeJs(code: string, packages: PackageBinding[]): Promise<string> {
  return invoke<string>('execute_js', { code, packages })
}
```

---

## Backend Signatures

```rust
// src-tauri/src/executor.rs
#[derive(serde::Deserialize)]
pub struct PackageBinding {
    pub package: String,
    pub alias: String,
}

pub async fn execute_js(
    code: &str,
    packages: Vec<PackageBinding>,
    bundle_cache_dir: std::path::PathBuf,
) -> Result<String, anyhow::Error>

// src-tauri/src/commands/execution.rs
#[tauri::command]
pub async fn execute_js(
    app: tauri::AppHandle,
    code: String,
    packages: Vec<PackageBinding>,
) -> Result<String, String>
```

The command handler resolves `app_data_dir` via `app.path().app_data_dir()`, appends `js-sandbox/bundles`, and passes the `PathBuf` to `executor::execute_js`. No other logic lives in the command handler (ADR-BE-004).

---

## Backward Compatibility

The `packages` field is new. The previous contract was `execute_js(code: String)`. The frontend **must** pass `packages` (at minimum `[]`). The backend will reject calls missing the `packages` field once this change is shipped.

**Previous contract (removed)**:
```json
{ "code": "<string>" }
```

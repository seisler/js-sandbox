use std::path::PathBuf;
use std::time::Duration;
use std::rc::Rc;
use std::sync::{atomic::{AtomicBool, Ordering}, OnceLock};
use deno_core::{
  JsRuntime,
  ModuleLoadResponse,
  ModuleLoader,
  ModuleSource,
  ModuleSourceCode,
  ModuleSpecifier,
  ModuleType,
  RequestedModuleType,
  ResolutionKind,
  RuntimeOptions,
  anyhow,
  v8,
};

#[derive(serde::Deserialize)]
pub struct PackageBinding {
  pub package: String,
  pub alias: String,
}

struct ExecutionGuard;

impl Drop for ExecutionGuard {
  fn drop(&mut self) {
    is_running().store(false, Ordering::SeqCst);
  }
}

struct SandboxModuleLoader {
  bundle_cache_dir: PathBuf,
}

impl SandboxModuleLoader {
  fn new(bundle_cache_dir: PathBuf) -> Self {
    Self { bundle_cache_dir }
  }
}

impl ModuleLoader for SandboxModuleLoader {
  fn resolve(
    &self,
    specifier: &str,
    referrer: &str,
    _kind: ResolutionKind,
  ) -> Result<ModuleSpecifier, anyhow::Error> {
    // speckit: — executor-injected package entry point from local cache
    if specifier.starts_with("speckit:") {
      return Ok(ModuleSpecifier::parse(specifier)?);
    }
    // Absolute esm.sh URL — sub-dependency of an injected package
    if specifier.starts_with("https://esm.sh/") {
      return Ok(ModuleSpecifier::parse(specifier)?);
    }
    // Relative import from within an esm.sh sub-dependency
    if referrer.starts_with("https://esm.sh/") {
      let base = ModuleSpecifier::parse(referrer)?;
      let resolved = base.join(specifier)
        .map_err(|e| anyhow::anyhow!("failed to resolve '{}' from '{}': {}", specifier, referrer, e))?;
      if resolved.host_str() == Some("esm.sh") {
        return Ok(resolved);
      }
    }
    Err(anyhow::anyhow!("import is not allowed in the sandbox"))
  }

  fn load(
    &self,
    module_specifier: &ModuleSpecifier,
    _maybe_referrer: Option<&ModuleSpecifier>,
    _is_dyn_import: bool,
    _requested_module_type: RequestedModuleType,
  ) -> ModuleLoadResponse {
    let specifier = module_specifier.clone();
    let cache_dir = self.bundle_cache_dir.clone();

    ModuleLoadResponse::Async(Box::pin(async move {
      let code = if specifier.as_str().starts_with("speckit:") {
        // Serve entry point from local bundle cache
        let pkg = specifier.as_str().trim_start_matches("speckit:");
        let path = cache_dir.join(format!("{}.js", bundle_filename(pkg)));
        tokio::fs::read_to_string(&path).await
          .map_err(|e| anyhow::anyhow!("failed to read cached bundle for '{}': {}", pkg, e))?
      } else {
        // esm.sh sub-dependency: check sub-dep cache, fetch on miss
        let filename = specifier.as_str()
          .strip_prefix("https://esm.sh/")
          .unwrap_or(specifier.as_str())
          .replace('/', "__")
          .replace('@', "_at_");
        let subdep_path = cache_dir.join("subdeps").join(&filename);

        if let Ok(cached) = tokio::fs::read_to_string(&subdep_path).await {
          cached
        } else {
          let resp = reqwest::get(specifier.as_str()).await
            .map_err(|e| anyhow::anyhow!("CDN fetch failed for '{}': {}", specifier.as_str(), e))?;
          if !resp.status().is_success() {
            return Err(anyhow::anyhow!("CDN returned {} for '{}'", resp.status(), specifier.as_str()));
          }
          let text = resp.text().await
            .map_err(|e| anyhow::anyhow!("CDN response error for '{}': {}", specifier.as_str(), e))?;
          if let Some(parent) = subdep_path.parent() {
            let _ = tokio::fs::create_dir_all(parent).await;
          }
          let _ = tokio::fs::write(&subdep_path, &text).await;
          text
        }
      };

      Ok(ModuleSource::new(
        ModuleType::JavaScript,
        ModuleSourceCode::String(code.into()),
        &specifier,
        None,
      ))
    }))
  }
}

static IS_RUNNING: OnceLock<AtomicBool> = OnceLock::new();

fn is_running() -> &'static AtomicBool {
  IS_RUNNING.get_or_init(|| AtomicBool::new(false))
}

fn bundle_filename(package: &str) -> String {
  package.replace('/', "__").replace('@', "_at_")
}

pub async fn execute_js(
  code: &str,
  packages: Vec<PackageBinding>,
  bundle_cache_dir: PathBuf,
) -> Result<String, anyhow::Error> {
  // Guard clause: validate all aliases before any I/O
  for b in &packages {
    if b.alias.is_empty() {
      return Err(anyhow::anyhow!("Alias must not be empty for package '{}'", b.package));
    }
  }

  // Ensure cache directory exists and fetch any missing bundles
  if !packages.is_empty() {
    tokio::fs::create_dir_all(&bundle_cache_dir).await
      .map_err(|e| anyhow::anyhow!("failed to create bundle cache dir: {}", e))?;

    for b in &packages {
      let path = bundle_cache_dir.join(format!("{}.js", bundle_filename(&b.package)));
      if tokio::fs::metadata(&path).await.is_err() {
        let url = format!("https://esm.sh/{}", b.package);
        let resp = reqwest::get(&url).await
          .map_err(|e| anyhow::anyhow!("failed to fetch '{}' from CDN: {}", b.package, e))?;
        if !resp.status().is_success() {
          return Err(anyhow::anyhow!(
            "failed to fetch '{}': CDN returned {}",
            b.package,
            resp.status()
          ));
        }
        let content = resp.text().await
          .map_err(|e| anyhow::anyhow!("failed to read CDN response for '{}': {}", b.package, e))?;
        // esm.sh shims use absolute-root paths like `from "/pkg@v/..."`.
        // Rewrite them to full URLs so the module loader can resolve them.
        let rewritten = content
          .replace("from \"/", "from \"https://esm.sh/")
          .replace("import \"/", "import \"https://esm.sh/");
        tokio::fs::write(&path, rewritten).await
          .map_err(|e| anyhow::anyhow!("failed to write bundle cache for '{}': {}", b.package, e))?;
      }
    }
  }

  if is_running().compare_exchange(
    false,
    true,
    Ordering::SeqCst,
    Ordering::SeqCst
  ).is_err() {
    return Err(anyhow::anyhow!("Another execution is already in progress"));
  }

  let code = code.to_string();
  let (tx, rx) = tokio::sync::oneshot::channel::<Result<String, String>>();

  std::thread::spawn(move || {
    let result = tokio::runtime::Builder::new_current_thread()
      .enable_all()
      .build()
      .unwrap()
      .block_on(async move {
        let _guard = ExecutionGuard;

        let params = v8::CreateParams::default()
          .heap_limits(0, 100 * 1024 * 1024);

        let mut runtime = JsRuntime::new(RuntimeOptions {
          module_loader: Some(Rc::new(SandboxModuleLoader::new(bundle_cache_dir))),
          create_params: Some(params),
          ..Default::default()
        });

        // Inject each requested package as a named global via module loading
        for b in &packages {
          let pkg_filename = bundle_filename(&b.package);
          let specifier = ModuleSpecifier::parse(&format!("speckit:{}", pkg_filename))
            .map_err(|e| anyhow::anyhow!("invalid specifier for '{}': {}", b.package, e))?;

          let module_id = runtime.load_side_es_module(&specifier).await
            .map_err(|e| anyhow::anyhow!("failed to load '{}': {}", b.package, e))?;

          let eval_fut = runtime.mod_evaluate(module_id);
          runtime.run_event_loop(Default::default()).await
            .map_err(|e| anyhow::anyhow!("failed to evaluate '{}': {}", b.package, e))?;
          eval_fut.await
            .map_err(|e| anyhow::anyhow!("module eval failed for '{}': {}", b.package, e))?;

          // Set globalThis[alias] = module.default ?? module namespace
          let module_ns = runtime.get_module_namespace(module_id)
            .map_err(|e| anyhow::anyhow!("failed to get namespace for '{}': {}", b.package, e))?;
          let alias = b.alias.clone();
          {
            let scope = &mut runtime.handle_scope();
            let ns_local = v8::Local::new(scope, module_ns);
            let default_key: v8::Local<v8::Value> = v8::String::new(scope, "default").unwrap().into();
            let export_value: v8::Local<v8::Value> = match ns_local.get(scope, default_key) {
              Some(v) if !v.is_undefined() && !v.is_null() => v,
              _ => ns_local.into(),
            };
            let alias_key: v8::Local<v8::Value> = v8::String::new(scope, &alias).unwrap().into();
            let ctx = scope.get_current_context();
            let global = ctx.global(scope);
            global.set(scope, alias_key, export_value);
          }
        }

        let result = runtime.execute_script("<sandbox>", code)?;
        runtime.run_event_loop(Default::default()).await?;

        let scope = &mut runtime.handle_scope();
        let local = v8::Local::new(scope, result);

        Ok::<String, anyhow::Error>(local.to_rust_string_lossy(scope))
      });

    let _ = tx.send(result.map_err(|e: anyhow::Error| e.to_string()));
  });

  tokio::time::timeout(
    Duration::from_secs(30),
    rx,
  )
  .await
  .map_err(|_| {
    // Thread is stuck; release the guard it will never drop.
    is_running().store(false, Ordering::SeqCst);
    anyhow::anyhow!("Script timed out")
  })?
  .map_err(|_| anyhow::anyhow!("Executor thread panicked"))?
  .map_err(|e| anyhow::anyhow!(e))
}

#[cfg(test)]
mod tests {
  use super::*;
  use tempfile::tempdir;

  async fn run(code: &str) -> Result<String, anyhow::Error> {
    let dir = tempdir().unwrap();
    execute_js(code, vec![], dir.path().to_path_buf()).await
  }

  // ── Pre-existing tests (updated to new signature) ──────────────────────────

  #[tokio::test]
  async fn test_arithmetic_expression() {
    assert_eq!(run("1 + 1").await.unwrap(), "2");
  }

  #[tokio::test]
  async fn test_string_expression() {
    assert_eq!(run("'hello' + ' ' + 'world'").await.unwrap(), "hello world");
  }

  #[tokio::test]
  async fn test_variable_declaration() {
    assert_eq!(run("const x = 42; x").await.unwrap(), "42");
  }

  #[tokio::test]
  async fn test_function_call() {
    assert_eq!(run("Math.max(1, 2, 3)").await.unwrap(), "3");
  }

  #[tokio::test]
  async fn test_syntax_error_returns_err() {
    assert!(run("if (").await.is_err());
  }

  #[tokio::test]
  async fn test_runtime_error_returns_err() {
    assert!(run("undefinedVariable.property").await.is_err());
  }

  #[tokio::test]
  async fn test_non_whitelisted_import_returns_err() {
    assert!(run("import 'some-random-package'").await.is_err());
  }

  #[tokio::test]
  async fn test_timeout() {
    let result = run("let i = 0; while(true) { i++; }").await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("timed out"));
  }

  // ── US5: Empty alias rejected ───────────────────────────────────────────────

  #[tokio::test]
  async fn test_empty_alias_rejected() {
    let dir = tempdir().unwrap();
    let result = execute_js(
      "1 + 1",
      vec![PackageBinding { package: "lodash".into(), alias: "".into() }],
      dir.path().to_path_buf(),
    ).await;
    assert!(result.is_err());
    let msg = result.unwrap_err().to_string();
    assert!(msg.to_lowercase().contains("alias") || msg.to_lowercase().contains("empty"),
      "expected alias/empty in error, got: {msg}");
  }

  // ── US6: Empty packages — regression ───────────────────────────────────────

  #[tokio::test]
  async fn test_empty_packages_no_regression() {
    assert_eq!(run("1 + 1").await.unwrap(), "2");
  }

  #[tokio::test]
  async fn test_empty_packages_no_global() {
    assert_eq!(run("typeof _").await.unwrap(), "undefined");
  }

  // ── US1: First-time CDN fetch (requires network) ───────────────────────────

  #[tokio::test]
  async fn test_lodash_first_use() {
    let dir = tempdir().unwrap();
    let result = execute_js(
      "JSON.stringify(_.chunk([1,2,3,4], 2))",
      vec![PackageBinding { package: "lodash".into(), alias: "_".into() }],
      dir.path().to_path_buf(),
    ).await;
    assert_eq!(result.unwrap(), "[[1,2],[3,4]]");
    assert!(dir.path().join(format!("{}.js", bundle_filename("lodash"))).exists());
  }

  #[tokio::test]
  async fn test_zod_parse() {
    let dir = tempdir().unwrap();
    let result = execute_js(
      "typeof z.string().parse",
      vec![PackageBinding { package: "zod".into(), alias: "z".into() }],
      dir.path().to_path_buf(),
    ).await;
    assert_eq!(result.unwrap(), "function");
  }

  // ── US2: Cache hit — no re-fetch ───────────────────────────────────────────

  #[tokio::test]
  async fn test_cached_bundle_no_fetch() {
    let dir = tempdir().unwrap();
    let pkg = "test-pkg";
    let bundle_path = dir.path().join(format!("{}.js", bundle_filename(pkg)));
    tokio::fs::write(&bundle_path, "export default { value: 42 };").await.unwrap();

    let result = execute_js(
      "JSON.stringify(myPkg.value)",
      vec![PackageBinding { package: pkg.into(), alias: "myPkg".into() }],
      dir.path().to_path_buf(),
    ).await;
    assert_eq!(result.unwrap(), "42");
  }

  // ── US4: Unknown package produces a CDN error (requires network) ────────────

  #[tokio::test]
  async fn test_unknown_package_cdn_error() {
    let dir = tempdir().unwrap();
    let result = execute_js(
      "1 + 1",
      vec![PackageBinding { package: "not-a-real-package-xyzzy-404".into(), alias: "x".into() }],
      dir.path().to_path_buf(),
    ).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("not-a-real-package-xyzzy-404"));
  }

  // ── US3: Multiple packages simultaneously ──────────────────────────────────

  #[tokio::test]
  async fn test_multiple_packages_simultaneous() {
    let dir = tempdir().unwrap();
    tokio::fs::write(dir.path().join("test-a.js"), "export default { name: 'a' };").await.unwrap();
    tokio::fs::write(dir.path().join("test-b.js"), "export default { name: 'b' };").await.unwrap();

    let result = execute_js(
      "JSON.stringify([pkgA.name, pkgB.name])",
      vec![
        PackageBinding { package: "test-a".into(), alias: "pkgA".into() },
        PackageBinding { package: "test-b".into(), alias: "pkgB".into() },
      ],
      dir.path().to_path_buf(),
    ).await;
    assert_eq!(result.unwrap(), r#"["a","b"]"#);
  }

  // ── US7: Custom alias ──────────────────────────────────────────────────────

  #[tokio::test]
  async fn test_custom_alias() {
    let dir = tempdir().unwrap();
    tokio::fs::write(dir.path().join("test-pkg.js"), "export default { v: 7 };").await.unwrap();

    let result = execute_js(
      "JSON.stringify(myLib.v)",
      vec![PackageBinding { package: "test-pkg".into(), alias: "myLib".into() }],
      dir.path().to_path_buf(),
    ).await;
    assert_eq!(result.unwrap(), "7");
  }

  #[tokio::test]
  async fn test_default_alias_absent_when_custom_used() {
    let dir = tempdir().unwrap();
    tokio::fs::write(dir.path().join("test-pkg.js"), "export default { v: 7 };").await.unwrap();

    let result = execute_js(
      "typeof testPkg",
      vec![PackageBinding { package: "test-pkg".into(), alias: "myLib".into() }],
      dir.path().to_path_buf(),
    ).await;
    assert_eq!(result.unwrap(), "undefined");
  }
}

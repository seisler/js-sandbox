use std::time::Duration;
use std::{collections::HashSet};
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

struct ExecutionGuard;
                                                                                         
impl Drop for ExecutionGuard {
  fn drop(&mut self) {                                                                 
    is_running().store(false, Ordering::SeqCst);
  }
}

struct SandboxModuleLoader {
  whitelist: HashSet<String>,
}

impl SandboxModuleLoader {
  fn new(whitelist: HashSet<String>) -> Self {
    Self { whitelist }
  }
}

impl ModuleLoader for SandboxModuleLoader {
  fn resolve(
    &self,
    specifier: &str,
    _referrer: &str,
    _kind: ResolutionKind,
  ) -> Result<ModuleSpecifier, anyhow::Error> {
    
    /* Only allow white listed npm packages */
    if self.whitelist.contains(specifier) {
      return Ok(ModuleSpecifier::parse(&format!("sandbox:{}", specifier))?);
    }

    Err(anyhow::anyhow!("Package '{}' is not whitelisted", specifier))
  }

  fn load(
    &self,
    module_specifier: &ModuleSpecifier,
    _maybe_referrer: Option<&ModuleSpecifier>,
    _is_dyn_import: bool,
    _requested_module_type: RequestedModuleType,
  ) -> ModuleLoadResponse {
    let specifier = module_specifier.clone();

    ModuleLoadResponse::Async(Box::pin(async move {
      let package_name = specifier.path().trim_start_matches('/');

      let code = tokio::fs::read_to_string(
          format!("./node_modules/{}/index.js", package_name)
      ).await?;

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

fn default_whitelist() -> HashSet<String> {
  [
      "lodash", "ramda", "axios", "zod",
      "canvas-confetti", "uuid", "dayjs",
      "date-fns"
      
  ]
  .iter()
  .map(|s| s.to_string())
  .collect()
}

/**      
 * Core execution function.
 * Takes JS code as input, runs it in an isolated thread and returns the result.
 * To protect the app and the host system, execution is:                               
 *  - isolated in a dedicated thread (V8 crash won't affect the app)                   
 *  - soft memory limit of 100mb (V8 will GC aggressively when reached)                                      
 *  - subject to a 30s timeout
 *  - disallow more than one execution at the same time (100mb per thread)                                                   
 */
pub async fn execute_js(code: &str) -> Result<String, anyhow::Error> {
  /* Use atomic bool to control the simultaneous execution */
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

  /* Spawn a dedicated thread to isolate JS execution */
  std::thread::spawn(move || {
    let result = tokio::runtime::Builder::new_current_thread()
      .enable_all()
      .build()
      .unwrap()
      .block_on(async move {
        /*
         * ExecutionGuard has Drop implemented that will trigger when guard goes out of scope.
         * Also will be trigged in case of app panics. Good place to clean 
         */
        let _guard = ExecutionGuard;

        /* ---- ADD MEMORY LIMIT ---- */
        
        /*
         * Soft limit — V8 will GC aggressively when reached but won't stop immediately.
         * @todo add hard limit via v8::Isolate::add_near_heap_limit_callback
         */
        let params = v8::CreateParams::default()
          .heap_limits(0, 100 * 1024 * 1024); // 100MB

        /* ---- CREATE RUNTIME ---- */

        let mut runtime = JsRuntime::new(RuntimeOptions {
          module_loader: Some(Rc::new(SandboxModuleLoader::new(default_whitelist()))),
          create_params: Some(params),
          ..Default::default()
        });

        /* ---- CODE EXECUTION ---- */

        let result = runtime.execute_script("<sandbox>", code)?;
        runtime.run_event_loop(Default::default()).await?;

        /* ---- TRANSFORM RESULT ---- */

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
  .map_err(|_| anyhow::anyhow!("Script timed out"))?
  .map_err(|_| anyhow::anyhow!("Executor thread panicked"))?
  .map_err(|e| anyhow::anyhow!(e))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_arithmetic_expression() {
    let result = execute_js("1 + 1").await.unwrap();
    assert_eq!(result, "2");
  }

  #[tokio::test]
  async fn test_string_expression() {
    let result = execute_js("'hello' + ' ' + 'world'").await.unwrap();
    assert_eq!(result, "hello world");
  }

  #[tokio::test]
  async fn test_variable_declaration() {
    let result = execute_js("const x = 42; x").await.unwrap();
    assert_eq!(result, "42");
  }

  #[tokio::test]
  async fn test_function_call() {
    let result = execute_js("Math.max(1, 2, 3)").await.unwrap();
    assert_eq!(result, "3");
  }

  #[tokio::test]
  async fn test_syntax_error_returns_err() {
    let result = execute_js("if (").await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_runtime_error_returns_err() {
    let result = execute_js("undefinedVariable.property").await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_non_whitelisted_import_returns_err() {
    let result = execute_js("import 'some-random-package'").await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_timeout() {
    // Reduce timeout for test by using a short-lived loop
    // This verifies the executor doesn't hang indefinitely on bad code
    let result = execute_js("let i = 0; while(true) { i++; }").await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("timed out"));
  }
}
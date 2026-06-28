use crate::executor::{self, PackageBinding};
use tauri::Manager;

#[tauri::command]
pub async fn execute_js(
  app: tauri::AppHandle,
  code: String,
  packages: Vec<PackageBinding>,
) -> Result<String, String> {
  let cache_dir = app
    .path()
    .app_data_dir()
    .map_err(|e| format!("failed to resolve app data dir: {e}"))?
    .join("js-sandbox/bundles");

  executor::execute_js(&code, packages, cache_dir)
    .await
    .map_err(|e| e.to_string())
}

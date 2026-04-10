use crate::executor;

#[tauri::command]
pub async fn execute_js(code: String) -> Result<String, String> {
  executor::execute_js(&code).await.map_err(|e| e.to_string())
}
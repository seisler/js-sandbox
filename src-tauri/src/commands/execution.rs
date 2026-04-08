#[tauri::command]
pub fn run_code(code: &str) -> Result<&str, String> {
  format!("Hello, {}! You've been click on run code", code);
  return Ok("hello")
}
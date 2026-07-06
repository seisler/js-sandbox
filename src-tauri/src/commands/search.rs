use crate::search::{self, PackageSearchResult};

#[tauri::command]
pub async fn search_packages(query: String) -> Result<Vec<PackageSearchResult>, String> {
  search::search_packages(&query)
    .await
    .map_err(|e| e.to_string())
}

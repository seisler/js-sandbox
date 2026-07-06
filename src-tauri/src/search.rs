use deno_core::anyhow;
use serde::Deserialize;

/// A single package result returned to the frontend by `search_packages`.
/// Only the fields the picker needs are carried across the IPC boundary.
#[derive(serde::Serialize, Debug, PartialEq)]
pub struct PackageSearchResult {
  pub name: String,
  pub description: Option<String>,
  pub version: String,
}

/// Shape of the npm registry search response
/// (`https://registry.npmjs.org/-/v1/search`). Only the fields we map are
/// declared; everything else (score, maintainers, keywords, ...) is ignored.
#[derive(Deserialize)]
struct RegistryResponse {
  objects: Vec<RegistryObject>,
}

#[derive(Deserialize)]
struct RegistryObject {
  package: RegistryPackage,
}

#[derive(Deserialize)]
struct RegistryPackage {
  name: String,
  #[serde(default)]
  description: Option<String>,
  version: String,
}

const SEARCH_ENDPOINT: &str = "https://registry.npmjs.org/-/v1/search";
const SEARCH_SIZE: &str = "20";

/// Map a raw npm registry search response body to the lightweight results the
/// frontend consumes. Pure and network-free so it is unit-testable.
pub fn parse_search_response(json: &str) -> anyhow::Result<Vec<PackageSearchResult>> {
  let response: RegistryResponse = serde_json::from_str(json)?;

  Ok(
    response
      .objects
      .into_iter()
      .map(|object| PackageSearchResult {
        name: object.package.name,
        description: object.package.description,
        version: object.package.version,
      })
      .collect(),
  )
}

/// Search the live npm registry for packages matching `query`.
///
/// An empty/whitespace query short-circuits to an empty result set without any
/// network activity (mirrors the picker showing nothing until the user types).
pub async fn search_packages(query: &str) -> anyhow::Result<Vec<PackageSearchResult>> {
  if query.trim().is_empty() {
    return Ok(Vec::new());
  }

  let client = reqwest::Client::new();
  let response = client
    .get(SEARCH_ENDPOINT)
    .query(&[("text", query), ("size", SEARCH_SIZE)])
    .send()
    .await
    .map_err(|e| anyhow::anyhow!("npm registry search request failed: {e}"))?;

  if !response.status().is_success() {
    return Err(anyhow::anyhow!(
      "npm registry search returned {}",
      response.status()
    ));
  }

  let body = response
    .text()
    .await
    .map_err(|e| anyhow::anyhow!("npm registry search response error: {e}"))?;

  parse_search_response(&body)
}

#[cfg(test)]
mod tests {
  use super::*;

  const FIXTURE: &str = r#"{
    "objects": [
      {
        "package": {
          "name": "lodash",
          "description": "Lodash modular utilities.",
          "version": "4.17.21"
        }
      },
      {
        "package": {
          "name": "date-fns",
          "version": "3.6.0"
        }
      }
    ]
  }"#;

  #[test]
  fn parse_maps_each_object_to_a_result() {
    let results = parse_search_response(FIXTURE).expect("fixture should parse");

    assert_eq!(
      results,
      vec![
        PackageSearchResult {
          name: "lodash".to_string(),
          description: Some("Lodash modular utilities.".to_string()),
          version: "4.17.21".to_string(),
        },
        PackageSearchResult {
          name: "date-fns".to_string(),
          description: None,
          version: "3.6.0".to_string(),
        },
      ]
    );
  }

  #[test]
  fn parse_returns_empty_for_no_objects() {
    let results = parse_search_response(r#"{ "objects": [] }"#).expect("should parse");
    assert!(results.is_empty());
  }

  #[test]
  fn parse_errors_on_malformed_json() {
    assert!(parse_search_response("not json").is_err());
  }

  #[tokio::test]
  async fn empty_query_returns_no_results_without_network() {
    assert!(search_packages("").await.expect("empty query is Ok").is_empty());
    assert!(search_packages("   ").await.expect("blank query is Ok").is_empty());
  }
}

import { invoke } from '@tauri-apps/api/core';

export interface PackageSearchResult {
  name: string;
  description: string | null;
  version: string;
}

/**
 * Search the live npm registry via the backend `search_packages` command.
 * An empty query resolves to an empty list without hitting the network.
 */
export function searchPackages(query: string): Promise<PackageSearchResult[]> {
  return invoke<PackageSearchResult[]>('search_packages', { query });
}

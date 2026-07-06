import type { PackageBinding } from '$shared/model';
import type { PackageSearchResult } from '../api/searchPackages';

/** Outcome of the in-flight search request the picker's status derives from. */
export type SearchRequestState = 'loading' | 'success' | 'error';

/** The single visual state the picker renders, derived by {@link pickerStatus}. */
export type PickerStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'results'; items: PackageSearchResult[] }
  | { kind: 'no-match'; query: string }
  | { kind: 'error' };

/** Registry results minus any package already in the active list. */
export function availableResults(
  results: PackageSearchResult[],
  active: PackageBinding[],
): PackageSearchResult[] {
  return results.filter((result) => !active.some((binding) => binding.package === result.name));
}

/**
 * Collapse the current query, request state, raw results, and active list into
 * exactly one picker status. Nothing shows until the user types; a query whose
 * every match is already active reads as "no match" rather than an empty list.
 */
export function pickerStatus(
  query: string,
  requestState: SearchRequestState,
  results: PackageSearchResult[],
  active: PackageBinding[],
): PickerStatus {
  if (query.trim() === '') {
    return { kind: 'idle' };
  }

  if (requestState === 'loading') {
    return { kind: 'loading' };
  }

  if (requestState === 'error') {
    return { kind: 'error' };
  }

  const items = availableResults(results, active);

  if (items.length === 0) {
    return { kind: 'no-match', query };
  }

  return { kind: 'results', items };
}

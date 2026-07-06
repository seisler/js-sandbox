export const PACKAGE_MANAGER_MESSAGES = {
  title: 'Packages',
  addTrigger: '+ Add package',
  modalTitle: 'Add package',
  aliasLabel: 'as',
  emptyList: 'No packages added yet',
  pickerIdle: 'Start typing to search packages',
  pickerLoading: 'Searching…',
  pickerError: 'Search unavailable — try again',
  aliasError: 'Alias cannot be empty',
} as const;

export const PACKAGE_SEARCH_DEBOUNCE_MS = 300;

export function noMatchMessage(query: string): string {
  return `No packages match "${query}"`;
}

import { ENavigationSection } from '$shared/model';

export interface PreferencesDialogState {
  readonly isOpen: boolean,
  readonly activeSection: ENavigationSection,
  open(section?: ENavigationSection): void,
  close(): void,
}
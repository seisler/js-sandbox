export enum EPreferencesSection {
  landing = 'landing',
  appearance = 'appearance',
  account = 'account',
  shortcuts = 'shortcuts',
  settings = 'settings',
}

export interface PreferencesState {
  readonly isOpen: boolean;
  readonly activeSection: EPreferencesSection;
  open(section?: EPreferencesSection): void;
  close(): void;
}
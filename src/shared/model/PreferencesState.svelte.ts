import { type PreferencesState, EPreferencesSection } from './Preferences.type';

/**
 * Shared PreferencesState in svelte 5.
 * @returns PreferencesState
 */
export function createPreferencesState(): PreferencesState {
  let isOpen = $state(false);
  let activeSection: EPreferencesSection = $state(EPreferencesSection.landing);

  return {
    get isOpen(): boolean { return isOpen },
    get activeSection(): EPreferencesSection { return activeSection },

    open: (section = EPreferencesSection.landing) => {
      activeSection = section;
      isOpen = true;
    },

    close: () => {
      isOpen = false;
    }
  }
}

export const preferencesState: PreferencesState = createPreferencesState();
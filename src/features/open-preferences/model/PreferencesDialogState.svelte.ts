import { type PreferencesDialogState } from './PreferencesDialog.type';
import { ENavigationSection } from '$shared/model';

/**
 * Shared PreferencesState in svelte 5.
 * @returns PreferencesState
 */
export function createPreferencesDialogState(): PreferencesDialogState {
  let isOpen = $state(false);
  let activeSection: ENavigationSection = $state(ENavigationSection.landing);

  return {
    get isOpen(): boolean { return isOpen; },
    get activeSection(): ENavigationSection { return activeSection; },

    open: (section = ENavigationSection.landing) => {
      activeSection = section;
      isOpen = true;
    },

    close: () => {
      isOpen = false;
    }
  };
}

export const preferencesDialogState = createPreferencesDialogState();
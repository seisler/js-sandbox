import {
  type UserEditorAppearanceState,
  FontFamily,
  Theme,
  Cursor,
  Language,
} from './EditorAppearance.type';

/**
 * Shared User Editor Preferences.
 * Svelte 5 keeps reactivity for nested objects
 * @returns PreferencesState
 */
function createUserEditorAppearanceState(): UserEditorAppearanceState {
  let state = $state({
    fontFamily: FontFamily.FiraCode,
    fontSize: 16,
    theme: Theme.VsDark,
    cursor: Cursor.Line,
    language: Language.Javascript,
  });

  return state;
}

export const userEditorAppearanceState = createUserEditorAppearanceState();
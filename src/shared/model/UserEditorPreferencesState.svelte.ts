import {
  Theme,
  Cursor,
  Language,
  FontFamily,
  type UserEditorPreferencesState,
} from './Editor.type';

/**
 * Shared User Editor Preferences.
 * Svelte 5 keeps reactivity for nested objects
 * @returns PreferencesState
 */
function createUserEditorPreferencesState(): UserEditorPreferencesState {
  let state = $state({
    fontFamily: FontFamily.FiraCode,
    fontSize: 16,
    theme: Theme.VsDark,
    cursor: Cursor.Line,
    language: Language.Javascript,
  })

  return state;
}

export const userEditorPreferencesState: UserEditorPreferencesState = createUserEditorPreferencesState();
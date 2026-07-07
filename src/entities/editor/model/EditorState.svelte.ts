import type { EditorState } from './EditorState.type';

/**
 * Shared Editor State.
 * @returns EditorState
 */
function createEditorState(): EditorState {
  let code = $state('');

  return {
    get code() { return code; },
    set code(value) { code = value; }                                                                
  };
}

export const editorState = createEditorState();
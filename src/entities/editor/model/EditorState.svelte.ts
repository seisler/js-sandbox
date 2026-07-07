import type { EditorState } from './EditorState.type';

/**
 * Shared Editor State.
 * @returns EditorState
 */
function createEditorState(): EditorState {
  let code = $state('');
  let result = $state('');
  let isRunning = $state(false);

  return {
    get code() { return code; },
    set code(value) { code = value; },
    get result() { return result; },
    set result(value) { result = value; },
    get isRunning() { return isRunning; },
    set isRunning(value) { isRunning = value; },
  };
}

export const editorState = createEditorState();
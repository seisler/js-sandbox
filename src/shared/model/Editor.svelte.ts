import {
  type EditorState,
} from './Editor.type';

/**
 * Shared Editor State.
 * @returns EditorState
 */
function createEditorState(): EditorState {
  let state = $state({
    code: '',
    result: '',
    isRunning: false,
  })
  
  return state;
}

export const editorState: EditorState = createEditorState();
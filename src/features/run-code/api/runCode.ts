import { invoke } from '@tauri-apps/api/core';
import { editorState } from '$shared/model';

export const runCode = () => {
  if (editorState.isRunning) {
    editorState.result = 'Executing code...'
    return;
  };
  
  editorState.isRunning = true;
  
  invoke<string>('execute_js', { code: editorState.code })
    .then(res => editorState.result = res)
    .catch(err => editorState.result = err)
    .finally(() => {
      editorState.isRunning = false;
    });
};
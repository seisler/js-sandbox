import { invoke } from '@tauri-apps/api/core';
import { editorState, packageBindingsState } from '$shared/model';

export const runCode = () => {
  if (runCodeState.isRunning) {
    runCodeState.result = 'Executing code...';
    return;
  };

  editorState.isRunning = true;

  invoke<string>('execute_js', { code: editorState.code, packages: packageBindingsState.packages })
    .then(res => editorState.result = res)
    .catch(err => editorState.result = err)
    .finally(() => {
      runCodeState.isRunning = false;
    });
};
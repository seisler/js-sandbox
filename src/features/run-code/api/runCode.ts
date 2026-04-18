import { invoke } from '@tauri-apps/api/core';
import { editorState } from '$entities/editor';
import { runCodeState } from '../model/RunCodeState.svelte.ts';

export const runCode = () => {
  if (runCodeState.isRunning) {
    runCodeState.result = 'Executing code...';
    return;
  };
  
  runCodeState.isRunning = true;
  
  invoke<string>('execute_js', { code: editorState.code })
    .then(res => runCodeState.result = res)
    .catch(err => runCodeState.result = err)
    .finally(() => {
      runCodeState.isRunning = false;
    });
};
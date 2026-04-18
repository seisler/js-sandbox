import type { RunCodeState } from './RunCodeState.type';

function createRunCodeState(): RunCodeState {
  let result = $state('');
  let isRunning = $state(false);

  return {
    get result() { return result; },
    set result(value) { result = value; },
    get isRunning() { return isRunning; },
    set isRunning(value) { isRunning = value; },                                                              
  };
}

export const runCodeState = createRunCodeState();
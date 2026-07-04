import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runCode } from './runCode';

const { editorState, packageBindingsState, invokeMock } = vi.hoisted(() => ({
  editorState: {
    code: '',
    result: '',
    isRunning: false,
  },
  packageBindingsState: {
    packages: [] as { package: string; alias: string }[],
  },
  invokeMock: vi.fn().mockResolvedValue('ok'),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock('$shared/model', () => ({
  editorState,
  packageBindingsState,
}));

describe('runCode', () => {
  beforeEach(() => {
    invokeMock.mockClear();
    editorState.code = 'console.log(1)';
    editorState.isRunning = false;
    packageBindingsState.packages = [];
  });

  it('sends the active package list on run', () => {
    packageBindingsState.packages = [{ package: 'lodash', alias: '_' }];

    runCode();

    expect(invokeMock).toHaveBeenCalledWith('execute_js', {
      code: editorState.code,
      packages: [{ package: 'lodash', alias: '_' }],
    });
  });

  it('sends an empty package list without blocking execution', () => {
    runCode();

    expect(invokeMock).toHaveBeenCalledWith('execute_js', {
      code: editorState.code,
      packages: [],
    });
  });
});

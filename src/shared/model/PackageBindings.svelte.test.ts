import { describe, it, expect } from 'vitest';
import { createPackageBindingsState } from './PackageBindings.svelte';

describe('createPackageBindingsState', () => {
  it('defaults to an empty package list', () => {
    const state = createPackageBindingsState();
    expect(state.packages).toEqual([]);
  });

  it('adds a package binding via addPackage', () => {
    const state = createPackageBindingsState();
    state.addPackage({ package: 'lodash', alias: '_' });
    expect(state.packages).toEqual([{ package: 'lodash', alias: '_' }]);
  });

  it('removes a package binding via removePackage', () => {
    const state = createPackageBindingsState();
    state.addPackage({ package: 'lodash', alias: '_' });
    state.removePackage('lodash');
    expect(state.packages).toEqual([]);
  });

  it('throws when removePackage is called for a name not in the list', () => {
    const state = createPackageBindingsState();
    expect(() => state.removePackage('lodash')).toThrow();
    expect(state.packages).toEqual([]);
  });

  it('updates a package alias via updateAlias', () => {
    const state = createPackageBindingsState();
    state.addPackage({ package: 'lodash', alias: '_' });
    state.updateAlias('lodash', 'lodash');
    expect(state.packages).toEqual([{ package: 'lodash', alias: 'lodash' }]);
  });

  it('throws when updateAlias is called for a name not in the list', () => {
    const state = createPackageBindingsState();
    expect(() => state.updateAlias('lodash', 'lodash')).toThrow();
    expect(state.packages).toEqual([]);
  });

  it('throws when updateAlias is called with an empty alias', () => {
    const state = createPackageBindingsState();
    state.addPackage({ package: 'lodash', alias: '_' });
    expect(() => state.updateAlias('lodash', '')).toThrow();
    expect(state.packages).toEqual([{ package: 'lodash', alias: '_' }]);
  });
});

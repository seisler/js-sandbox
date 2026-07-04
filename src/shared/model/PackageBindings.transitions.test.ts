import { describe, it, expect } from 'vitest';
import { addBinding, removeBinding, updateBindingAlias } from './PackageBindings.transitions';

describe('addBinding', () => {
  it('appends a new binding to an empty list', () => {
    const result = addBinding([], { package: 'zod', alias: 'z' });
    expect(result).toEqual([{ package: 'zod', alias: 'z' }]);
  });

  it('is a silent no-op when the package name is already present', () => {
    const existing = [{ package: 'lodash', alias: '_' }];
    const result = addBinding(existing, { package: 'lodash', alias: 'lodash' });
    expect(result).toEqual(existing);
  });

  it('throws when the package name is empty', () => {
    expect(() => addBinding([], { package: '', alias: 'z' })).toThrow();
  });

  it('throws when the alias is empty', () => {
    expect(() => addBinding([], { package: 'zod', alias: '' })).toThrow();
  });
});

describe('removeBinding', () => {
  it('removes the matching entry from the list', () => {
    const existing = [{ package: 'lodash', alias: '_' }];
    const result = removeBinding(existing, 'lodash');
    expect(result).toEqual([]);
  });

  it('throws when the package name is not present', () => {
    const existing = [{ package: 'lodash', alias: '_' }];
    expect(() => removeBinding(existing, 'zod')).toThrow();
  });
});

describe('updateBindingAlias', () => {
  it('updates only the matching entry\'s alias', () => {
    const existing = [{ package: 'lodash', alias: '_' }, { package: 'zod', alias: 'z' }];
    const result = updateBindingAlias(existing, 'lodash', 'lodash');
    expect(result).toEqual([{ package: 'lodash', alias: 'lodash' }, { package: 'zod', alias: 'z' }]);
  });

  it('throws when the new alias is empty', () => {
    const existing = [{ package: 'lodash', alias: '_' }];
    expect(() => updateBindingAlias(existing, 'lodash', '')).toThrow();
  });

  it('throws when the package name is not present', () => {
    const existing = [{ package: 'lodash', alias: '_' }];
    expect(() => updateBindingAlias(existing, 'zod', 'z')).toThrow();
  });
});

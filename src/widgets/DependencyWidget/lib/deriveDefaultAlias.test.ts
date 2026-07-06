import { describe, it, expect } from 'vitest';
import { deriveDefaultAlias } from './deriveDefaultAlias';

describe('deriveDefaultAlias', () => {
  it('returns a simple lowercase name unchanged', () => {
    expect(deriveDefaultAlias('lodash')).toBe('lodash');
  });

  it('camel-cases a hyphenated name', () => {
    expect(deriveDefaultAlias('date-fns')).toBe('dateFns');
  });

  it('camel-cases a dotted name', () => {
    expect(deriveDefaultAlias('socket.io')).toBe('socketIo');
  });

  it('drops the scope from a scoped package', () => {
    expect(deriveDefaultAlias('@scope/name')).toBe('name');
  });

  it('camel-cases the unscoped part of a scoped package', () => {
    expect(deriveDefaultAlias('@types/node-fetch')).toBe('nodeFetch');
  });

  it('strips leading separators that would otherwise start the identifier', () => {
    expect(deriveDefaultAlias('@scope/my-lib')).toBe('myLib');
  });
});

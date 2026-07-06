import { describe, it, expect } from 'vitest';
import { isAliasValid } from './alias';

describe('isAliasValid', () => {
  it('rejects an empty string', () => {
    expect(isAliasValid('')).toBe(false);
  });

  it('rejects a whitespace-only string', () => {
    expect(isAliasValid('   ')).toBe(false);
  });

  it('accepts a non-empty alias', () => {
    expect(isAliasValid('_')).toBe(true);
  });

  it('accepts a multi-character alias', () => {
    expect(isAliasValid('dateFns')).toBe(true);
  });
});

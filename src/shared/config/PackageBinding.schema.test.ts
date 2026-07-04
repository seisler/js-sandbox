import { describe, it, expect } from 'vitest';
import { PackageBindingSchema } from './PackageBinding.schema';

describe('PackageBindingSchema', () => {
  it('parses a valid package binding', () => {
    const result = PackageBindingSchema.safeParse({ package: 'lodash', alias: '_' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty package name', () => {
    const result = PackageBindingSchema.safeParse({ package: '', alias: '_' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty alias', () => {
    const result = PackageBindingSchema.safeParse({ package: 'lodash', alias: '' });
    expect(result.success).toBe(false);
  });
});

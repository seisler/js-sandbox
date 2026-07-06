import { describe, it, expect } from 'vitest';
import { availableResults, pickerStatus } from './picker';
import type { PackageSearchResult } from '../api/searchPackages';

const lodash: PackageSearchResult = { name: 'lodash', description: 'utils', version: '4.0.0' };
const zod: PackageSearchResult = { name: 'zod', description: 'schemas', version: '3.0.0' };

describe('availableResults', () => {
  it('returns all results when none are active', () => {
    expect(availableResults([lodash, zod], [])).toEqual([lodash, zod]);
  });

  it('excludes results whose name is already active', () => {
    expect(availableResults([lodash, zod], [{ package: 'lodash', alias: '_' }])).toEqual([zod]);
  });

  it('excludes an already-active package even though the registry still returns it', () => {
    expect(availableResults([lodash], [{ package: 'lodash', alias: '_' }])).toEqual([]);
  });
});

describe('pickerStatus', () => {
  it('is idle when the query is empty', () => {
    expect(pickerStatus('', 'success', [], [])).toEqual({ kind: 'idle' });
  });

  it('is idle when the query is only whitespace', () => {
    expect(pickerStatus('   ', 'success', [], [])).toEqual({ kind: 'idle' });
  });

  it('is loading while a request is in flight', () => {
    expect(pickerStatus('lod', 'loading', [], [])).toEqual({ kind: 'loading' });
  });

  it('is error when the request failed', () => {
    expect(pickerStatus('lod', 'error', [], [])).toEqual({ kind: 'error' });
  });

  it('is results when there are available matches', () => {
    expect(pickerStatus('lod', 'success', [lodash], [])).toEqual({
      kind: 'results',
      items: [lodash],
    });
  });

  it('is no-match when the registry returned nothing', () => {
    expect(pickerStatus('zzz', 'success', [], [])).toEqual({ kind: 'no-match', query: 'zzz' });
  });

  it('is no-match when every result is already active', () => {
    expect(pickerStatus('lod', 'success', [lodash], [{ package: 'lodash', alias: '_' }])).toEqual({
      kind: 'no-match',
      query: 'lod',
    });
  });
});

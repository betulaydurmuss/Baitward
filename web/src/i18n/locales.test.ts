import { describe, expect, it } from 'vitest';
import en from './locales/en.json';
import tr from './locales/tr.json';

// Collect every nested key path, so a key added to one language but forgotten in
// the other is caught in CI rather than shipped as a missing translation.
function keyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object'
      ? keyPaths(value as Record<string, unknown>, path)
      : [path];
  });
}

describe('locale parity', () => {
  it('Turkish and English define exactly the same keys', () => {
    expect(keyPaths(tr).sort()).toEqual(keyPaths(en).sort());
  });
});

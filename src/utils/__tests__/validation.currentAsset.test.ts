import { describe, expect, it } from 'vitest';
import { validateCurrentAsset } from '../validation';

describe('validateCurrentAsset', () => {
  it('accepts zero and positive amounts', () => {
    expect(validateCurrentAsset(0).ok).toBe(true);
    expect(validateCurrentAsset(500_000).ok).toBe(true);
  });

  it('rejects negative and non-finite values', () => {
    expect(validateCurrentAsset(-1).ok).toBe(false);
    expect(validateCurrentAsset(Number.NaN).ok).toBe(false);
  });
});

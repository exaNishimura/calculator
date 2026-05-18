import { describe, expect, it } from 'vitest';

describe('vitest runner', () => {
  it('executes assertions', () => {
    expect(true).toBe(true);
  });

  it('resolves @ path alias for test utilities', async () => {
    const { renderWithRouter } = await import('@/test/renderWithRouter');
    expect(renderWithRouter).toBeTypeOf('function');
  });
});

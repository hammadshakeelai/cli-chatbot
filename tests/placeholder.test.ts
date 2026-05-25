import { describe, it, expect } from 'vitest';

describe('vitest is wired', () => {
  it('runs a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('handles async', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });
});

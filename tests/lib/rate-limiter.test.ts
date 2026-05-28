import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { checkRateLimit, clearRateLimiter } from '@/lib/rate-limiter';

describe('rate limiter', () => {
  beforeEach(() => { vi.useFakeTimers(); clearRateLimiter(); });
  afterEach(() => { vi.useRealTimers(); });

  it('allows first request', () => {
    const result = checkRateLimit('1.2.3.4');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it('blocks at limit boundary (20th req)', () => {
    for (let i = 0; i < 19; i++) checkRateLimit('1.2.3.4');
    expect(checkRateLimit('1.2.3.4').allowed).toBe(true);  // 20th
    expect(checkRateLimit('1.2.3.4').allowed).toBe(false); // 21st
  });

  it('blocks after exceeding limit', () => {
    for (let i = 0; i < 20; i++) checkRateLimit('1.2.3.4');
    expect(checkRateLimit('1.2.3.4').allowed).toBe(false);
  });

  it('tracks different IPs separately', () => {
    for (let i = 0; i < 20; i++) checkRateLimit('1.2.3.4');
    expect(checkRateLimit('5.6.7.8').allowed).toBe(true);
  });

  it('resets window after timeout', () => {
    for (let i = 0; i < 20; i++) checkRateLimit('1.2.3.4');
    vi.advanceTimersByTime(60_001);
    expect(checkRateLimit('1.2.3.4').allowed).toBe(true);
  });
});

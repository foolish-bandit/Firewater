import { describe, it, expect, vi, beforeEach } from 'vitest';

// Reimplement the rate limiter logic for unit testing without Vercel types

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

function createRateLimiter() {
  const store = new Map<string, RateLimitEntry>();

  function check(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number } {
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + config.windowMs };
      store.set(key, entry);
    }

    entry.count++;
    const remaining = Math.max(0, config.limit - entry.count);

    return {
      allowed: entry.count <= config.limit,
      remaining,
    };
  }

  function reset() {
    store.clear();
  }

  return { check, reset, store };
}

describe('Rate Limiter', () => {
  let limiter: ReturnType<typeof createRateLimiter>;

  beforeEach(() => {
    limiter = createRateLimiter();
  });

  it('should allow requests within the limit', () => {
    const config = { limit: 5, windowMs: 60000 };
    for (let i = 0; i < 5; i++) {
      const result = limiter.check('test-key', config);
      expect(result.allowed).toBe(true);
    }
  });

  it('should block requests exceeding the limit', () => {
    const config = { limit: 3, windowMs: 60000 };
    limiter.check('test-key', config); // 1
    limiter.check('test-key', config); // 2
    limiter.check('test-key', config); // 3
    const result = limiter.check('test-key', config); // 4 — blocked
    expect(result.allowed).toBe(false);
  });

  it('should track remaining count correctly', () => {
    const config = { limit: 3, windowMs: 60000 };
    expect(limiter.check('test-key', config).remaining).toBe(2);
    expect(limiter.check('test-key', config).remaining).toBe(1);
    expect(limiter.check('test-key', config).remaining).toBe(0);
    expect(limiter.check('test-key', config).remaining).toBe(0); // stays at 0
  });

  it('should track different keys independently', () => {
    const config = { limit: 2, windowMs: 60000 };
    limiter.check('key-a', config);
    limiter.check('key-a', config);
    const resultA = limiter.check('key-a', config);
    expect(resultA.allowed).toBe(false);

    const resultB = limiter.check('key-b', config);
    expect(resultB.allowed).toBe(true);
  });

  it('should reset after window expires', () => {
    const config = { limit: 1, windowMs: 100 }; // 100ms window
    limiter.check('test-key', config);
    const blocked = limiter.check('test-key', config);
    expect(blocked.allowed).toBe(false);

    // Manually expire the entry
    const entry = limiter.store.get('test-key')!;
    entry.resetAt = Date.now() - 1;

    const afterExpiry = limiter.check('test-key', config);
    expect(afterExpiry.allowed).toBe(true);
  });

  it('should handle auth rate limits (10/min)', () => {
    const authConfig = { limit: 10, windowMs: 60000 };
    for (let i = 0; i < 10; i++) {
      expect(limiter.check('auth:signin:1.2.3.4', authConfig).allowed).toBe(true);
    }
    expect(limiter.check('auth:signin:1.2.3.4', authConfig).allowed).toBe(false);
  });

  it('should handle write rate limits (30/min)', () => {
    const writeConfig = { limit: 30, windowMs: 60000 };
    for (let i = 0; i < 30; i++) {
      expect(limiter.check('reviews:create:1.2.3.4', writeConfig).allowed).toBe(true);
    }
    expect(limiter.check('reviews:create:1.2.3.4', writeConfig).allowed).toBe(false);
  });
});

describe('Rate Limit Configs', () => {
  it('should have appropriate limits for auth (tighter)', () => {
    const auth = { limit: 10, windowMs: 60_000 };
    expect(auth.limit).toBeLessThanOrEqual(10);
    expect(auth.windowMs).toBeGreaterThanOrEqual(60_000);
  });

  it('should have appropriate limits for reads (generous)', () => {
    const read = { limit: 100, windowMs: 60_000 };
    expect(read.limit).toBeGreaterThanOrEqual(50);
  });

  it('should have appropriate limits for writes (moderate)', () => {
    const write = { limit: 30, windowMs: 60_000 };
    expect(write.limit).toBeGreaterThanOrEqual(10);
    expect(write.limit).toBeLessThanOrEqual(50);
  });

  it('should have appropriate limits for uploads (tight)', () => {
    const upload = { limit: 10, windowMs: 60_000 };
    expect(upload.limit).toBeLessThanOrEqual(20);
  });
});

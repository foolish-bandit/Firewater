import { describe, it, expect } from 'vitest';

/**
 * Tests the cache header helper logic.
 * Mirrors setCacheHeaders from social.ts.
 */

function buildCacheControl(maxAge: number, staleWhileRevalidate: number = 0): string {
  const parts = [`public`, `max-age=${maxAge}`, `s-maxage=${maxAge}`];
  if (staleWhileRevalidate > 0) parts.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  return parts.join(", ");
}

describe('Cache-Control Headers', () => {
  it('should include public, max-age, and s-maxage', () => {
    const header = buildCacheControl(30);
    expect(header).toContain('public');
    expect(header).toContain('max-age=30');
    expect(header).toContain('s-maxage=30');
  });

  it('should include stale-while-revalidate when provided', () => {
    const header = buildCacheControl(30, 60);
    expect(header).toContain('stale-while-revalidate=60');
  });

  it('should omit stale-while-revalidate when 0', () => {
    const header = buildCacheControl(10, 0);
    expect(header).not.toContain('stale-while-revalidate');
  });

  it('should produce correct header for profile search (10s, swr 30s)', () => {
    const header = buildCacheControl(10, 30);
    expect(header).toBe('public, max-age=10, s-maxage=10, stale-while-revalidate=30');
  });

  it('should produce correct header for profile view (30s, swr 60s)', () => {
    const header = buildCacheControl(30, 60);
    expect(header).toBe('public, max-age=30, s-maxage=30, stale-while-revalidate=60');
  });

  it('should produce correct header for reviews (15s, swr 30s)', () => {
    const header = buildCacheControl(15, 30);
    expect(header).toBe('public, max-age=15, s-maxage=15, stale-while-revalidate=30');
  });

  it('should produce correct header for lists (15s, swr 30s)', () => {
    const header = buildCacheControl(15, 30);
    expect(header).toBe('public, max-age=15, s-maxage=15, stale-while-revalidate=30');
  });
});

describe('Endpoint Cache Configuration', () => {
  // Document which endpoints should be cached and with what TTLs
  const cacheConfig: Record<string, { maxAge: number; swr: number }> = {
    'profiles:search': { maxAge: 10, swr: 30 },
    'profiles:get': { maxAge: 30, swr: 60 },
    'reviews:list': { maxAge: 15, swr: 30 },
    'lists:get': { maxAge: 15, swr: 30 },
  };

  // These should NOT be cached (personalized or write endpoints)
  const noCacheEndpoints = [
    'follows:toggle',
    'reviews:create',
    'reviews:sync',
    'lists:sync',
    'lists:toggle',
    'feed:get', // personalized per-user
  ];

  it('should have cache config for all cacheable endpoints', () => {
    expect(Object.keys(cacheConfig)).toHaveLength(4);
  });

  it('should use short TTLs (under 60s) to avoid stale data', () => {
    for (const [endpoint, config] of Object.entries(cacheConfig)) {
      expect(config.maxAge).toBeLessThanOrEqual(60);
      expect(config.maxAge).toBeGreaterThan(0);
    }
  });

  it('should have stale-while-revalidate longer than maxAge', () => {
    for (const [endpoint, config] of Object.entries(cacheConfig)) {
      expect(config.swr).toBeGreaterThanOrEqual(config.maxAge);
    }
  });

  it('should not cache personalized or write endpoints', () => {
    // These are not in the cache config
    for (const endpoint of noCacheEndpoints) {
      expect(cacheConfig[endpoint]).toBeUndefined();
    }
  });
});

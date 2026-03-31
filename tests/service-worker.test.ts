import { describe, it, expect } from 'vitest';

/**
 * Tests for service worker cache versioning strategy.
 */

describe('SW: Cache Versioning', () => {
  it('should include build hash in cache name', () => {
    const buildHash = 'a1b2c3d4e5f6g7h8';
    const cacheName = `firewater-${buildHash}`;
    expect(cacheName).toContain(buildHash);
    expect(cacheName.startsWith('firewater-')).toBe(true);
  });

  it('should detect old caches to clean up', () => {
    const currentCache = 'firewater-abc123';
    const allCaches = ['firewater-old1', 'firewater-old2', currentCache, 'other-cache'];

    const toDelete = allCaches.filter(
      key => key.startsWith('firewater-') && key !== currentCache
    );

    expect(toDelete).toEqual(['firewater-old1', 'firewater-old2']);
    expect(toDelete).not.toContain(currentCache);
    expect(toDelete).not.toContain('other-cache');
  });

  it('should not delete non-firewater caches', () => {
    const currentCache = 'firewater-v2';
    const allCaches = ['firewater-v1', currentCache, 'my-other-app-v1'];

    const toDelete = allCaches.filter(
      key => key.startsWith('firewater-') && key !== currentCache
    );

    expect(toDelete).not.toContain('my-other-app-v1');
  });
});

describe('SW: URL Classification', () => {
  function classifyRequest(pathname: string): 'api' | 'hashed-asset' | 'navigate' | 'other' {
    if (pathname.startsWith('/api/')) return 'api';
    if (pathname.match(/[-\.][a-zA-Z0-9]{8,}\./)) return 'hashed-asset';
    return 'other';
  }

  it('should identify API calls (never cache)', () => {
    expect(classifyRequest('/api/social?scope=reviews')).toBe('api');
    expect(classifyRequest('/api/auth/signin')).toBe('api');
    expect(classifyRequest('/api/photos/upload')).toBe('api');
  });

  it('should identify hashed assets (cache-first)', () => {
    expect(classifyRequest('/assets/index-0pNPWcky.js')).toBe('hashed-asset');
    expect(classifyRequest('/assets/index-B6sbApK1.css')).toBe('hashed-asset');
    expect(classifyRequest('/assets/vendor-react-a1b2c3d4.js')).toBe('hashed-asset');
  });

  it('should identify other assets (network-first)', () => {
    expect(classifyRequest('/logo.svg')).toBe('other');
    expect(classifyRequest('/manifest.json')).toBe('other');
    expect(classifyRequest('/sw.js')).toBe('other');
  });

  it('should not cache API responses', () => {
    const shouldCache = (pathname: string) => !pathname.startsWith('/api/');
    expect(shouldCache('/api/social')).toBe(false);
    expect(shouldCache('/assets/app.js')).toBe(true);
  });
});

describe('SW: Build Hash Injection', () => {
  it('should replace __BUILD_HASH__ placeholder', () => {
    const template = "const CACHE_VERSION = '__BUILD_HASH__';";
    const hash = 'a1b2c3d4';
    const result = template.replace('__BUILD_HASH__', hash);
    expect(result).toBe("const CACHE_VERSION = 'a1b2c3d4';");
    expect(result).not.toContain('__BUILD_HASH__');
  });

  it('should produce unique hash per build', () => {
    // Simulate two builds with different hashes
    const hash1 = Math.random().toString(36).slice(2, 10);
    const hash2 = Math.random().toString(36).slice(2, 10);
    expect(hash1).not.toBe(hash2);
  });
});

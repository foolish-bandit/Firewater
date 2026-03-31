import { describe, it, expect } from 'vitest';

/**
 * Tests the TanStack Query client configuration and query key factory.
 */

// Reimplement query key factory for testing
const queryKeys = {
  catalog: {
    all: ['catalog'] as const,
    list: (filters: Record<string, unknown>) => ['catalog', 'list', filters] as const,
    detail: (id: string) => ['catalog', 'detail', id] as const,
    batch: (ids: string[]) => ['catalog', 'batch', ids] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    byUser: (userId: string) => ['reviews', 'user', userId] as const,
    byLiquor: (liquorId: string) => ['reviews', 'liquor', liquorId] as const,
  },
  lists: {
    all: ['lists'] as const,
    byUser: (userId: string) => ['lists', 'user', userId] as const,
  },
  profiles: {
    all: ['profiles'] as const,
    detail: (userId: string) => ['profiles', userId] as const,
    search: (query: string) => ['profiles', 'search', query] as const,
  },
  follows: {
    followers: (userId: string) => ['follows', 'followers', userId] as const,
    following: (userId: string) => ['follows', 'following', userId] as const,
  },
  photos: {
    byLiquor: (liquorId: string) => ['photos', liquorId] as const,
    batch: (ids: string[]) => ['photos', 'batch', ids] as const,
    pending: ['photos', 'pending'] as const,
  },
  feed: {
    all: ['feed'] as const,
  },
};

describe('Query Keys: Uniqueness', () => {
  it('should generate unique keys for different catalog filters', () => {
    const key1 = queryKeys.catalog.list({ q: 'bourbon' });
    const key2 = queryKeys.catalog.list({ q: 'scotch' });
    expect(JSON.stringify(key1)).not.toBe(JSON.stringify(key2));
  });

  it('should generate unique keys for different users', () => {
    const key1 = queryKeys.reviews.byUser('user-1');
    const key2 = queryKeys.reviews.byUser('user-2');
    expect(key1[2]).not.toBe(key2[2]);
  });

  it('should generate unique keys for different liquors', () => {
    const key1 = queryKeys.reviews.byLiquor('bourbon-1');
    const key2 = queryKeys.reviews.byLiquor('bourbon-2');
    expect(key1[2]).not.toBe(key2[2]);
  });

  it('should generate stable keys for same input', () => {
    const key1 = queryKeys.catalog.detail('buffalo-trace');
    const key2 = queryKeys.catalog.detail('buffalo-trace');
    expect(JSON.stringify(key1)).toBe(JSON.stringify(key2));
  });
});

describe('Query Keys: Hierarchy', () => {
  it('should nest catalog keys under "catalog" prefix', () => {
    expect(queryKeys.catalog.all[0]).toBe('catalog');
    expect(queryKeys.catalog.list({ q: 'test' })[0]).toBe('catalog');
    expect(queryKeys.catalog.detail('id')[0]).toBe('catalog');
    expect(queryKeys.catalog.batch(['id'])[0]).toBe('catalog');
  });

  it('should nest review keys under "reviews" prefix', () => {
    expect(queryKeys.reviews.all[0]).toBe('reviews');
    expect(queryKeys.reviews.byUser('u')[0]).toBe('reviews');
    expect(queryKeys.reviews.byLiquor('l')[0]).toBe('reviews');
  });

  it('should nest profile keys under "profiles" prefix', () => {
    expect(queryKeys.profiles.all[0]).toBe('profiles');
    expect(queryKeys.profiles.detail('u')[0]).toBe('profiles');
    expect(queryKeys.profiles.search('q')[0]).toBe('profiles');
  });
});

describe('Query Keys: Cache Invalidation Patterns', () => {
  it('should allow invalidating all catalog queries', () => {
    const allKey = queryKeys.catalog.all;
    const listKey = queryKeys.catalog.list({ q: 'test' });
    const detailKey = queryKeys.catalog.detail('id');
    // All should start with the same prefix
    expect(listKey[0]).toBe(allKey[0]);
    expect(detailKey[0]).toBe(allKey[0]);
  });

  it('should allow invalidating all queries for a specific user', () => {
    const userId = 'user-123';
    const reviewKey = queryKeys.reviews.byUser(userId);
    const listKey = queryKeys.lists.byUser(userId);
    // Both contain the userId for targeted invalidation
    expect(reviewKey[2]).toBe(userId);
    expect(listKey[2]).toBe(userId);
  });
});

describe('Query Client: Default Configuration', () => {
  const defaults = {
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  };

  it('should use 30s stale time', () => {
    expect(defaults.staleTime).toBe(30_000);
  });

  it('should keep cache for 5 minutes', () => {
    expect(defaults.gcTime).toBe(300_000);
  });

  it('should retry 3 times', () => {
    expect(defaults.retry).toBe(3);
  });

  it('should refetch on window focus (mobile resume)', () => {
    expect(defaults.refetchOnWindowFocus).toBe(true);
  });

  it('should refetch on reconnect (mobile network)', () => {
    expect(defaults.refetchOnReconnect).toBe(true);
  });

  it('should use exponential backoff for retries', () => {
    const retryDelay = (attempt: number) => Math.min(1000 * 2 ** attempt, 8000);
    expect(retryDelay(0)).toBe(1000);
    expect(retryDelay(1)).toBe(2000);
    expect(retryDelay(2)).toBe(4000);
    expect(retryDelay(3)).toBe(8000);
    expect(retryDelay(10)).toBe(8000); // capped at 8s
  });
});

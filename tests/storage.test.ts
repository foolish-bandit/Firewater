import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Tests the storage abstraction layer.
 * Simulates the API surface used by both localStorage (web) and
 * Capacitor Preferences (native).
 */

// Reimplement the storage interface for testing
function createStorage() {
  const store = new Map<string, string>();

  return {
    async get(key: string): Promise<string | null> {
      return store.get(key) ?? null;
    },

    async set(key: string, value: string): Promise<void> {
      store.set(key, value);
    },

    async remove(key: string): Promise<void> {
      store.delete(key);
    },

    async getJSON<T>(key: string): Promise<T | null> {
      const raw = store.get(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },

    async setJSON(key: string, value: unknown): Promise<void> {
      store.set(key, JSON.stringify(value));
    },

    getSync(key: string): string | null {
      return store.get(key) ?? null;
    },

    getSyncJSON<T>(key: string): T | null {
      const raw = store.get(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },

    _store: store,
  };
}

describe('Storage: Basic Operations', () => {
  let storage: ReturnType<typeof createStorage>;

  beforeEach(() => {
    storage = createStorage();
  });

  it('should return null for missing key', async () => {
    expect(await storage.get('missing')).toBeNull();
  });

  it('should set and get a value', async () => {
    await storage.set('key', 'value');
    expect(await storage.get('key')).toBe('value');
  });

  it('should remove a key', async () => {
    await storage.set('key', 'value');
    await storage.remove('key');
    expect(await storage.get('key')).toBeNull();
  });

  it('should overwrite existing value', async () => {
    await storage.set('key', 'old');
    await storage.set('key', 'new');
    expect(await storage.get('key')).toBe('new');
  });
});

describe('Storage: JSON Operations', () => {
  let storage: ReturnType<typeof createStorage>;

  beforeEach(() => {
    storage = createStorage();
  });

  it('should set and get JSON objects', async () => {
    await storage.setJSON('user', { id: 'u1', name: 'Alice' });
    const user = await storage.getJSON<{ id: string; name: string }>('user');
    expect(user).toEqual({ id: 'u1', name: 'Alice' });
  });

  it('should set and get JSON arrays', async () => {
    await storage.setJSON('ids', ['a', 'b', 'c']);
    const ids = await storage.getJSON<string[]>('ids');
    expect(ids).toEqual(['a', 'b', 'c']);
  });

  it('should return null for missing JSON key', async () => {
    expect(await storage.getJSON('missing')).toBeNull();
  });

  it('should return null for invalid JSON', async () => {
    await storage.set('broken', 'not-json{');
    expect(await storage.getJSON('broken')).toBeNull();
  });

  it('should handle null JSON value', async () => {
    await storage.setJSON('empty', null);
    expect(await storage.getJSON('empty')).toBeNull();
  });

  it('should handle nested objects', async () => {
    const complex = {
      reviews: [{ id: 'r1', rating: 4 }],
      settings: { theme: 'dark' },
    };
    await storage.setJSON('data', complex);
    expect(await storage.getJSON('data')).toEqual(complex);
  });
});

describe('Storage: Sync Operations (Web)', () => {
  let storage: ReturnType<typeof createStorage>;

  beforeEach(() => {
    storage = createStorage();
  });

  it('should synchronously read values', () => {
    storage._store.set('key', 'value');
    expect(storage.getSync('key')).toBe('value');
  });

  it('should return null for missing sync key', () => {
    expect(storage.getSync('missing')).toBeNull();
  });

  it('should synchronously parse JSON', () => {
    storage._store.set('data', '{"x":1}');
    expect(storage.getSyncJSON('data')).toEqual({ x: 1 });
  });

  it('should return null for invalid sync JSON', () => {
    storage._store.set('bad', 'not-json');
    expect(storage.getSyncJSON('bad')).toBeNull();
  });
});

describe('Storage: Auth Token Pattern', () => {
  let storage: ReturnType<typeof createStorage>;

  beforeEach(() => {
    storage = createStorage();
  });

  it('should persist auth token across get/set cycles', async () => {
    const token = 'eyJhbGciOiJIUzI1NiJ9.test-token';
    await storage.set('bs_token', token);
    expect(await storage.get('bs_token')).toBe(token);
  });

  it('should clear token on sign out', async () => {
    await storage.set('bs_token', 'some-token');
    await storage.set('bs_user', '{"id":"u1"}');
    // Sign out clears both
    await storage.remove('bs_token');
    await storage.remove('bs_user');
    expect(await storage.get('bs_token')).toBeNull();
    expect(await storage.get('bs_user')).toBeNull();
  });
});

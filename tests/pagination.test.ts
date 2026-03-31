import { describe, it, expect } from 'vitest';

// Test the pagination parameter parsing logic (mirrors the server's getPageParams)

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

function getPageParams(query: Record<string, string | undefined>): { limit: number; cursor: string | null } {
  const rawLimit = parseInt(query.limit as string, 10);
  const limit = Math.min(
    Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE
  );
  const cursor = query.cursor || null;
  return { limit, cursor };
}

describe('Pagination Parameter Parsing', () => {
  it('should use default page size when no limit provided', () => {
    const { limit } = getPageParams({});
    expect(limit).toBe(DEFAULT_PAGE_SIZE);
  });

  it('should respect custom limit within bounds', () => {
    const { limit } = getPageParams({ limit: '20' });
    expect(limit).toBe(20);
  });

  it('should cap limit at MAX_PAGE_SIZE', () => {
    const { limit } = getPageParams({ limit: '500' });
    expect(limit).toBe(MAX_PAGE_SIZE);
  });

  it('should handle invalid limit gracefully', () => {
    expect(getPageParams({ limit: 'abc' }).limit).toBe(DEFAULT_PAGE_SIZE);
    expect(getPageParams({ limit: '-5' }).limit).toBe(DEFAULT_PAGE_SIZE);
    expect(getPageParams({ limit: '0' }).limit).toBe(DEFAULT_PAGE_SIZE);
    expect(getPageParams({ limit: 'NaN' }).limit).toBe(DEFAULT_PAGE_SIZE);
  });

  it('should return null cursor when not provided', () => {
    const { cursor } = getPageParams({});
    expect(cursor).toBeNull();
  });

  it('should return cursor when provided', () => {
    const { cursor } = getPageParams({ cursor: '2024-01-15T10:30:00.000Z' });
    expect(cursor).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should handle limit of 1', () => {
    const { limit } = getPageParams({ limit: '1' });
    expect(limit).toBe(1);
  });

  it('should handle limit at exactly MAX_PAGE_SIZE', () => {
    const { limit } = getPageParams({ limit: '100' });
    expect(limit).toBe(100);
  });
});

describe('Cursor-based Pagination Logic', () => {
  // Simulate what the API does with cursor pagination
  function paginateItems<T extends { created_at: string }>(
    items: T[],
    limit: number,
    cursor: string | null
  ): { data: T[]; nextCursor: string | null } {
    let filtered = cursor
      ? items.filter(item => item.created_at < cursor)
      : items;

    // Sort descending by created_at
    filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));

    const page = filtered.slice(0, limit);
    const nextCursor = page.length === limit ? page[page.length - 1].created_at : null;

    return { data: page, nextCursor };
  }

  const testItems = Array.from({ length: 10 }, (_, i) => ({
    id: `item-${i}`,
    created_at: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
  }));

  it('should return first page with nextCursor', () => {
    const { data, nextCursor } = paginateItems(testItems, 3, null);
    expect(data).toHaveLength(3);
    expect(nextCursor).toBeTruthy();
    // Should be the newest items first
    expect(data[0].id).toBe('item-9');
    expect(data[1].id).toBe('item-8');
    expect(data[2].id).toBe('item-7');
  });

  it('should return next page using cursor', () => {
    const page1 = paginateItems(testItems, 3, null);
    const page2 = paginateItems(testItems, 3, page1.nextCursor);
    expect(page2.data).toHaveLength(3);
    expect(page2.data[0].id).toBe('item-6');
  });

  it('should return null nextCursor on last page', () => {
    const { data, nextCursor } = paginateItems(testItems, 20, null);
    expect(data).toHaveLength(10);
    expect(nextCursor).toBeNull();
  });

  it('should handle empty result set', () => {
    const { data, nextCursor } = paginateItems([], 10, null);
    expect(data).toHaveLength(0);
    expect(nextCursor).toBeNull();
  });

  it('should paginate through all items without gaps or duplication', () => {
    const allIds: string[] = [];
    let cursor: string | null = null;

    for (let i = 0; i < 10; i++) { // safety limit
      const { data, nextCursor } = paginateItems(testItems, 3, cursor);
      allIds.push(...data.map(d => d.id));
      cursor = nextCursor;
      if (!cursor) break;
    }

    expect(allIds).toHaveLength(10);
    expect(new Set(allIds).size).toBe(10); // no duplicates
  });
});

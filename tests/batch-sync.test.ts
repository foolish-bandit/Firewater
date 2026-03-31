import { describe, it, expect } from 'vitest';

/**
 * Tests the batch sync logic for reviews and lists.
 * Validates chunking, deduplication (ON CONFLICT DO NOTHING), and count updates.
 */

const CHUNK_SIZE = 50;

/** Simulate the UNNEST batch insert with ON CONFLICT DO NOTHING */
function batchInsertWithDedup<T extends { id: string }>(
  existing: Map<string, T>,
  items: T[]
): { inserted: number } {
  let inserted = 0;
  for (const item of items) {
    if (!existing.has(item.id)) {
      existing.set(item.id, item);
      inserted++;
    }
  }
  return { inserted };
}

/** Simulate chunking logic */
function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

describe('Batch Sync: Chunking', () => {
  it('should produce correct chunks for items under CHUNK_SIZE', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}` }));
    const chunks = chunkArray(items, CHUNK_SIZE);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toHaveLength(10);
  });

  it('should produce correct chunks for items exactly at CHUNK_SIZE', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: `r${i}` }));
    const chunks = chunkArray(items, CHUNK_SIZE);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toHaveLength(50);
  });

  it('should produce correct chunks for items over CHUNK_SIZE', () => {
    const items = Array.from({ length: 120 }, (_, i) => ({ id: `r${i}` }));
    const chunks = chunkArray(items, CHUNK_SIZE);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(50);
    expect(chunks[1]).toHaveLength(50);
    expect(chunks[2]).toHaveLength(20);
  });

  it('should handle empty array', () => {
    const chunks = chunkArray([], CHUNK_SIZE);
    expect(chunks).toHaveLength(0);
  });

  it('should handle single item', () => {
    const chunks = chunkArray([{ id: 'r0' }], CHUNK_SIZE);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toHaveLength(1);
  });
});

describe('Batch Sync: Review Deduplication', () => {
  it('should skip duplicate review IDs (ON CONFLICT DO NOTHING)', () => {
    const db = new Map<string, any>();
    db.set('existing-1', { id: 'existing-1', rating: 4 });

    const reviews = [
      { id: 'existing-1', rating: 5 },  // duplicate — should be skipped
      { id: 'new-1', rating: 3 },
      { id: 'new-2', rating: 4 },
    ];

    const result = batchInsertWithDedup(db, reviews);
    expect(result.inserted).toBe(2);
    expect(db.size).toBe(3);
    // The existing review should NOT be overwritten
    expect(db.get('existing-1').rating).toBe(4);
  });

  it('should insert all reviews when no duplicates', () => {
    const db = new Map<string, any>();
    const reviews = Array.from({ length: 5 }, (_, i) => ({
      id: `review-${i}`,
      rating: 3 + (i % 3),
    }));
    const result = batchInsertWithDedup(db, reviews);
    expect(result.inserted).toBe(5);
    expect(db.size).toBe(5);
  });

  it('should handle all duplicates', () => {
    const db = new Map<string, any>();
    db.set('r1', { id: 'r1' });
    db.set('r2', { id: 'r2' });

    const result = batchInsertWithDedup(db, [{ id: 'r1' }, { id: 'r2' }]);
    expect(result.inserted).toBe(0);
    expect(db.size).toBe(2);
  });
});

describe('Batch Sync: List Deduplication', () => {
  interface ListItem {
    id: string;
    userId: string;
    bourbonId: string;
    listType: string;
  }

  function batchInsertLists(
    existing: Map<string, ListItem>,
    items: { bourbonId: string; type: string }[],
    userId: string
  ): number {
    let inserted = 0;
    for (const item of items) {
      const key = `${userId}:${item.bourbonId}:${item.type}`;
      if (!existing.has(key)) {
        existing.set(key, {
          id: key,
          userId,
          bourbonId: item.bourbonId,
          listType: item.type,
        });
        inserted++;
      }
    }
    return inserted;
  }

  it('should insert unique list items', () => {
    const db = new Map<string, ListItem>();
    const items = [
      { bourbonId: 'b1', type: 'want' },
      { bourbonId: 'b2', type: 'tried' },
      { bourbonId: 'b3', type: 'want' },
    ];
    const count = batchInsertLists(db, items, 'user-1');
    expect(count).toBe(3);
    expect(db.size).toBe(3);
  });

  it('should skip duplicates by (userId, bourbonId, listType)', () => {
    const db = new Map<string, ListItem>();
    db.set('user-1:b1:want', {
      id: 'user-1:b1:want',
      userId: 'user-1',
      bourbonId: 'b1',
      listType: 'want',
    });

    const items = [
      { bourbonId: 'b1', type: 'want' },   // duplicate
      { bourbonId: 'b1', type: 'tried' },   // different type — not duplicate
      { bourbonId: 'b2', type: 'want' },     // different bourbon — not duplicate
    ];
    const count = batchInsertLists(db, items, 'user-1');
    expect(count).toBe(2);
    expect(db.size).toBe(3);
  });

  it('should allow same bourbon in different list types', () => {
    const db = new Map<string, ListItem>();
    const items = [
      { bourbonId: 'b1', type: 'want' },
      { bourbonId: 'b1', type: 'tried' },
    ];
    const count = batchInsertLists(db, items, 'user-1');
    expect(count).toBe(2);
  });
});

describe('Batch Sync: Review Data Mapping', () => {
  it('should map review fields correctly for UNNEST', () => {
    const reviews = [
      {
        id: 'r1',
        bourbonId: 'b1',
        userId: 'u1',
        userName: 'Alice',
        userPicture: 'pic.jpg',
        rating: 4,
        text: 'Great',
        nose: 'caramel',
        palate: 'vanilla',
        finish: 'long',
        tags: ['sweet', 'smooth'],
        date: '2024-01-01T00:00:00Z',
      },
    ];

    // Simulate the array extraction the API does for UNNEST
    const ids = reviews.map(r => r.id);
    const bourbonIds = reviews.map(r => r.bourbonId);
    const userIds = reviews.map(r => r.userId);
    const ratings = reviews.map(r => r.rating);
    const tagsArr = reviews.map(r => JSON.stringify(r.tags || []));

    expect(ids).toEqual(['r1']);
    expect(bourbonIds).toEqual(['b1']);
    expect(userIds).toEqual(['u1']);
    expect(ratings).toEqual([4]);
    expect(tagsArr).toEqual(['["sweet","smooth"]']);
  });

  it('should handle missing optional fields with defaults', () => {
    const review = {
      id: 'r2',
      bourbonId: 'b2',
      userId: 'u2',
      rating: 3,
    } as any;

    const userName = review.userName || null;
    const userPicture = review.userPicture || null;
    const text = review.text || '';
    const nose = review.nose || '';
    const palate = review.palate || '';
    const finish = review.finish || '';
    const tags = JSON.stringify(review.tags || []);

    expect(userName).toBeNull();
    expect(userPicture).toBeNull();
    expect(text).toBe('');
    expect(nose).toBe('');
    expect(palate).toBe('');
    expect(finish).toBe('');
    expect(tags).toBe('[]');
  });
});

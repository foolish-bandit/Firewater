import { describe, it, expect } from 'vitest';

/**
 * Tests the catalog API endpoint logic.
 * Validates search, filtering, pagination, and batch lookup.
 */

interface Liquor {
  id: string;
  name: string;
  distillery: string;
  type: string;
  proof: number;
  price: number;
}

// Simulate the catalog API filtering/pagination logic
function queryCatalog(
  catalog: Liquor[],
  params: {
    q?: string;
    type?: string;
    minProof?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
    id?: string;
    ids?: string;
  }
): any {
  // Single item lookup
  if (params.id) {
    const item = catalog.find(i => i.id === params.id);
    return item || null;
  }

  // Batch lookup
  if (params.ids) {
    const idList = params.ids.split(',').slice(0, 100);
    const items = idList.map(id => catalog.find(i => i.id === id.trim())).filter(Boolean);
    return { items, total: items.length };
  }

  let filtered = [...catalog];

  // Search by name/distillery
  if (params.q) {
    const query = params.q.toLowerCase();
    filtered = filtered.filter(i =>
      i.name.toLowerCase().includes(query) ||
      i.distillery.toLowerCase().includes(query)
    );
  }

  // Filter by type
  if (params.type) {
    filtered = filtered.filter(i => i.type.toLowerCase() === params.type!.toLowerCase());
  }

  // Filter by proof
  if (params.minProof) {
    filtered = filtered.filter(i => i.proof >= params.minProof!);
  }

  // Filter by price
  if (params.maxPrice) {
    filtered = filtered.filter(i => i.price <= params.maxPrice!);
  }

  // Pagination
  const pageSize = Math.min(Math.max(params.limit || 50, 1), 100);
  const pageNum = Math.max(params.page || 1, 1);
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const offset = (pageNum - 1) * pageSize;
  const items = filtered.slice(offset, offset + pageSize);

  return { items, total, page: pageNum, pageSize, totalPages };
}

const testCatalog: Liquor[] = [
  { id: 'buffalo-trace', name: 'Buffalo Trace', distillery: 'Buffalo Trace Distillery', type: 'bourbon', proof: 90, price: 25 },
  { id: 'makers-mark', name: "Maker's Mark", distillery: "Maker's Mark Distillery", type: 'bourbon', proof: 90, price: 28 },
  { id: 'wild-turkey-101', name: 'Wild Turkey 101', distillery: 'Wild Turkey', type: 'bourbon', proof: 101, price: 22 },
  { id: 'lagavulin-16', name: 'Lagavulin 16', distillery: 'Lagavulin', type: 'scotch', proof: 86, price: 90 },
  { id: 'redbreast-12', name: 'Redbreast 12', distillery: 'Midleton', type: 'irish whiskey', proof: 80, price: 65 },
  { id: 'woodford-reserve', name: 'Woodford Reserve', distillery: 'Woodford Reserve', type: 'bourbon', proof: 90.4, price: 35 },
  { id: 'bookers', name: "Booker's Bourbon", distillery: 'Jim Beam', type: 'bourbon', proof: 125, price: 90 },
  { id: 'patron-silver', name: 'Patron Silver', distillery: 'Patron', type: 'tequila', proof: 80, price: 45 },
];

describe('Catalog API: Single Item Lookup', () => {
  it('should find item by id', () => {
    const result = queryCatalog(testCatalog, { id: 'buffalo-trace' });
    expect(result).not.toBeNull();
    expect(result.name).toBe('Buffalo Trace');
  });

  it('should return null for unknown id', () => {
    const result = queryCatalog(testCatalog, { id: 'nonexistent' });
    expect(result).toBeNull();
  });
});

describe('Catalog API: Batch Lookup', () => {
  it('should return multiple items by ids', () => {
    const result = queryCatalog(testCatalog, { ids: 'buffalo-trace,lagavulin-16' });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should skip unknown ids', () => {
    const result = queryCatalog(testCatalog, { ids: 'buffalo-trace,nonexistent' });
    expect(result.items).toHaveLength(1);
  });

  it('should cap at 100 ids', () => {
    const ids = Array.from({ length: 150 }, (_, i) => `id-${i}`).join(',');
    const result = queryCatalog(testCatalog, { ids });
    // All unknown but shouldn't crash, and should be capped
    expect(result.items.length).toBeLessThanOrEqual(100);
  });
});

describe('Catalog API: Search', () => {
  it('should search by name', () => {
    const result = queryCatalog(testCatalog, { q: 'buffalo' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('buffalo-trace');
  });

  it('should search by distillery', () => {
    const result = queryCatalog(testCatalog, { q: 'jim beam' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('bookers');
  });

  it('should be case-insensitive', () => {
    const result = queryCatalog(testCatalog, { q: 'LAGAVULIN' });
    expect(result.items).toHaveLength(1);
  });

  it('should return empty for no matches', () => {
    const result = queryCatalog(testCatalog, { q: 'xyz123' });
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});

describe('Catalog API: Filtering', () => {
  it('should filter by type', () => {
    const result = queryCatalog(testCatalog, { type: 'bourbon' });
    expect(result.items).toHaveLength(5);
    result.items.forEach((item: Liquor) => {
      expect(item.type).toBe('bourbon');
    });
  });

  it('should filter by minProof', () => {
    const result = queryCatalog(testCatalog, { minProof: 100 });
    expect(result.items.length).toBeGreaterThan(0);
    result.items.forEach((item: Liquor) => {
      expect(item.proof).toBeGreaterThanOrEqual(100);
    });
  });

  it('should filter by maxPrice', () => {
    const result = queryCatalog(testCatalog, { maxPrice: 30 });
    result.items.forEach((item: Liquor) => {
      expect(item.price).toBeLessThanOrEqual(30);
    });
  });

  it('should combine filters', () => {
    const result = queryCatalog(testCatalog, { type: 'bourbon', maxPrice: 30 });
    expect(result.items.length).toBeGreaterThan(0);
    result.items.forEach((item: Liquor) => {
      expect(item.type).toBe('bourbon');
      expect(item.price).toBeLessThanOrEqual(30);
    });
  });
});

describe('Catalog API: Pagination', () => {
  it('should default to page 1, limit 50', () => {
    const result = queryCatalog(testCatalog, {});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.items).toHaveLength(testCatalog.length);
  });

  it('should respect custom limit', () => {
    const result = queryCatalog(testCatalog, { limit: 3 });
    expect(result.items).toHaveLength(3);
    expect(result.totalPages).toBe(Math.ceil(testCatalog.length / 3));
  });

  it('should cap limit at 100', () => {
    const result = queryCatalog(testCatalog, { limit: 200 });
    expect(result.pageSize).toBe(100);
  });

  it('should return correct page', () => {
    const page1 = queryCatalog(testCatalog, { limit: 3, page: 1 });
    const page2 = queryCatalog(testCatalog, { limit: 3, page: 2 });
    expect(page1.items[0].id).not.toBe(page2.items[0].id);
  });

  it('should return empty items past last page', () => {
    const result = queryCatalog(testCatalog, { limit: 3, page: 100 });
    expect(result.items).toHaveLength(0);
  });

  it('should calculate totalPages correctly', () => {
    const result = queryCatalog(testCatalog, { limit: 3 });
    expect(result.totalPages).toBe(Math.ceil(8 / 3));
  });

  it('should paginate through all items without gaps', () => {
    const allIds: string[] = [];
    const limit = 3;
    const totalPages = Math.ceil(testCatalog.length / limit);

    for (let page = 1; page <= totalPages; page++) {
      const result = queryCatalog(testCatalog, { limit, page });
      allIds.push(...result.items.map((i: Liquor) => i.id));
    }

    expect(allIds).toHaveLength(testCatalog.length);
    expect(new Set(allIds).size).toBe(testCatalog.length);
  });
});

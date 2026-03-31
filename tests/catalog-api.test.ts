import { describe, it, expect } from 'vitest';

/**
 * Tests the catalog API endpoint logic.
 * Validates search, filtering, sorting, pagination, and batch lookup.
 */

interface FlavorProfile {
  sweetness: number;
  spice: number;
  oak: number;
  caramel: number;
  vanilla: number;
  fruit: number;
  nutty: number;
  floral: number;
  smoky: number;
  leather: number;
  heat: number;
  complexity: number;
}

interface Liquor {
  id: string;
  name: string;
  distillery: string;
  type: string;
  region: string;
  age: string;
  mashBill: string;
  proof: number;
  price: number;
  description: string;
  flavorProfile: FlavorProfile;
  source?: 'curated' | 'community';
}

const FLAVOR_ALIASES: Record<string, string> = {
  sweet: 'sweetness', sugary: 'sweetness', honey: 'sweetness',
  spicy: 'spice', pepper: 'spice', cinnamon: 'spice',
  oaky: 'oak', wood: 'oak', woody: 'oak',
  toffee: 'caramel', butterscotch: 'caramel',
  creamy: 'vanilla',
  fruity: 'fruit', cherry: 'fruit', apple: 'fruit', citrus: 'fruit',
  nut: 'nutty', almond: 'nutty', pecan: 'nutty',
  flower: 'floral',
  smoke: 'smoky', charred: 'smoky', peaty: 'smoky',
  tobacco: 'leather',
  hot: 'heat', warm: 'heat',
  complex: 'complexity',
};

const FLAVOR_DIMENSIONS = [
  'sweetness', 'spice', 'oak', 'caramel', 'vanilla', 'fruit',
  'nutty', 'floral', 'smoky', 'leather', 'heat', 'complexity',
];

const FLAVOR_THRESHOLD = 6;

function resolveFlavor(name: string): string | undefined {
  const lower = name.toLowerCase();
  if (FLAVOR_DIMENSIONS.includes(lower)) return lower;
  return FLAVOR_ALIASES[lower];
}

// Simulate the catalog API filtering/pagination logic
function queryCatalog(
  catalog: Liquor[],
  params: {
    q?: string;
    type?: string;
    region?: string;
    age?: string;
    source?: string;
    minProof?: number;
    maxProof?: number;
    minPrice?: number;
    maxPrice?: number;
    flavor?: string;
    sort?: string;
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

  // Text search — matches across all major text fields
  if (params.q) {
    const query = params.q.toLowerCase();
    filtered = filtered.filter(i =>
      i.name.toLowerCase().includes(query) ||
      i.distillery.toLowerCase().includes(query) ||
      i.region.toLowerCase().includes(query) ||
      i.type.toLowerCase().includes(query) ||
      i.description.toLowerCase().includes(query) ||
      i.mashBill.toLowerCase().includes(query)
    );
  }

  // Type filter — exact match (case-insensitive)
  if (params.type) {
    filtered = filtered.filter(i => i.type.toLowerCase() === params.type!.toLowerCase());
  }

  // Region filter — partial match (case-insensitive)
  if (params.region) {
    const regionQuery = params.region.toLowerCase();
    filtered = filtered.filter(i => i.region.toLowerCase().includes(regionQuery));
  }

  // Age filter — partial match (case-insensitive)
  if (params.age) {
    const ageQuery = params.age.toLowerCase();
    filtered = filtered.filter(i => i.age.toLowerCase().includes(ageQuery));
  }

  // Source filter — exact match
  if (params.source) {
    const src = params.source.toLowerCase();
    filtered = filtered.filter(i => (i.source || 'curated') === src);
  }

  // Proof range filters
  if (params.minProof != null) {
    filtered = filtered.filter(i => i.proof >= params.minProof!);
  }
  if (params.maxProof != null) {
    filtered = filtered.filter(i => i.proof <= params.maxProof!);
  }

  // Price range filters
  if (params.minPrice != null) {
    filtered = filtered.filter(i => i.price >= params.minPrice!);
  }
  if (params.maxPrice != null) {
    filtered = filtered.filter(i => i.price <= params.maxPrice!);
  }

  // Flavor filtering
  if (params.flavor) {
    const requested = params.flavor
      .split(',')
      .map(f => resolveFlavor(f.trim()))
      .filter(Boolean) as string[];
    if (requested.length > 0) {
      filtered = filtered.filter(item =>
        item.flavorProfile &&
        requested.every(dim => ((item.flavorProfile as any)[dim] ?? 0) >= FLAVOR_THRESHOLD)
      );
    }
  }

  // Sorting
  if (params.sort) {
    const sortKey = params.sort.toLowerCase();
    switch (sortKey) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'proof-asc':
        filtered.sort((a, b) => a.proof - b.proof);
        break;
      case 'proof-desc':
        filtered.sort((a, b) => b.proof - a.proof);
        break;
    }
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

const defaultFlavor: FlavorProfile = {
  sweetness: 5, spice: 4, oak: 5, caramel: 5, vanilla: 5,
  fruit: 3, nutty: 3, floral: 2, smoky: 2, leather: 2, heat: 4, complexity: 5,
};

const testCatalog: Liquor[] = [
  {
    id: 'buffalo-trace', name: 'Buffalo Trace', distillery: 'Buffalo Trace Distillery',
    type: 'bourbon', region: 'Kentucky', age: 'NAS', mashBill: 'Low Rye',
    proof: 90, price: 25, description: 'A classic bourbon with caramel and vanilla notes.',
    flavorProfile: { ...defaultFlavor, sweetness: 7, caramel: 8, vanilla: 7 },
  },
  {
    id: 'makers-mark', name: "Maker's Mark", distillery: "Maker's Mark Distillery",
    type: 'bourbon', region: 'Kentucky', age: 'NAS', mashBill: 'Wheated',
    proof: 90, price: 28, description: 'A soft and approachable wheated bourbon.',
    flavorProfile: { ...defaultFlavor, sweetness: 7, caramel: 7 },
  },
  {
    id: 'wild-turkey-101', name: 'Wild Turkey 101', distillery: 'Wild Turkey',
    type: 'bourbon', region: 'Kentucky', age: '6-8 Years', mashBill: 'High Rye',
    proof: 101, price: 22, description: 'A bold and spicy bourbon with high rye content.',
    flavorProfile: { ...defaultFlavor, spice: 8, heat: 7, oak: 6 },
  },
  {
    id: 'lagavulin-16', name: 'Lagavulin 16', distillery: 'Lagavulin',
    type: 'scotch', region: 'Islay', age: '16', mashBill: 'Single Malt',
    proof: 86, price: 90, description: 'Rich and intensely smoky Islay scotch.',
    flavorProfile: { ...defaultFlavor, smoky: 9, leather: 7, complexity: 8, sweetness: 3 },
  },
  {
    id: 'redbreast-12', name: 'Redbreast 12', distillery: 'Midleton',
    type: 'irish whiskey', region: 'Ireland', age: '12', mashBill: 'Pot Still',
    proof: 80, price: 65, description: 'A rich pot still Irish whiskey with fruit and spice.',
    flavorProfile: { ...defaultFlavor, fruit: 7, spice: 6, complexity: 7, floral: 5 },
  },
  {
    id: 'woodford-reserve', name: 'Woodford Reserve', distillery: 'Woodford Reserve',
    type: 'bourbon', region: 'Kentucky', age: 'NAS', mashBill: 'Low Rye',
    proof: 90.4, price: 35, description: 'Balanced Kentucky bourbon with dried fruit and chocolate.',
    flavorProfile: { ...defaultFlavor, fruit: 6, caramel: 6, complexity: 6 },
  },
  {
    id: 'bookers', name: "Booker's Bourbon", distillery: 'Jim Beam',
    type: 'bourbon', region: 'Kentucky', age: '6-8 Years', mashBill: 'High Rye',
    proof: 125, price: 90, description: 'Uncut and unfiltered barrel-strength bourbon.',
    flavorProfile: { ...defaultFlavor, heat: 9, oak: 8, spice: 8, caramel: 7, complexity: 8 },
  },
  {
    id: 'patron-silver', name: 'Patron Silver', distillery: 'Patron',
    type: 'tequila', region: 'Jalisco', age: 'NAS', mashBill: '100% Agave',
    proof: 80, price: 45, description: 'A smooth silver tequila with citrus and pepper.',
    flavorProfile: { ...defaultFlavor, fruit: 6, spice: 5, floral: 4, sweetness: 3, oak: 1, caramel: 1 },
    source: 'community',
  },
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

  it('should search by region', () => {
    const result = queryCatalog(testCatalog, { q: 'islay' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('lagavulin-16');
  });

  it('should search by type', () => {
    const result = queryCatalog(testCatalog, { q: 'tequila' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('patron-silver');
  });

  it('should search by description', () => {
    const result = queryCatalog(testCatalog, { q: 'barrel-strength' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('bookers');
  });

  it('should search by mashBill', () => {
    const result = queryCatalog(testCatalog, { q: 'wheated' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('makers-mark');
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

  it('should filter by maxProof', () => {
    const result = queryCatalog(testCatalog, { maxProof: 85 });
    expect(result.items.length).toBeGreaterThan(0);
    result.items.forEach((item: Liquor) => {
      expect(item.proof).toBeLessThanOrEqual(85);
    });
  });

  it('should filter by proof range', () => {
    const result = queryCatalog(testCatalog, { minProof: 85, maxProof: 95 });
    expect(result.items.length).toBeGreaterThan(0);
    result.items.forEach((item: Liquor) => {
      expect(item.proof).toBeGreaterThanOrEqual(85);
      expect(item.proof).toBeLessThanOrEqual(95);
    });
  });

  it('should filter by maxPrice', () => {
    const result = queryCatalog(testCatalog, { maxPrice: 30 });
    result.items.forEach((item: Liquor) => {
      expect(item.price).toBeLessThanOrEqual(30);
    });
  });

  it('should filter by minPrice', () => {
    const result = queryCatalog(testCatalog, { minPrice: 60 });
    expect(result.items.length).toBeGreaterThan(0);
    result.items.forEach((item: Liquor) => {
      expect(item.price).toBeGreaterThanOrEqual(60);
    });
  });

  it('should filter by price range', () => {
    const result = queryCatalog(testCatalog, { minPrice: 30, maxPrice: 70 });
    expect(result.items.length).toBeGreaterThan(0);
    result.items.forEach((item: Liquor) => {
      expect(item.price).toBeGreaterThanOrEqual(30);
      expect(item.price).toBeLessThanOrEqual(70);
    });
  });

  it('should filter by region (partial match)', () => {
    const result = queryCatalog(testCatalog, { region: 'kentucky' });
    expect(result.items.length).toBe(5);
    result.items.forEach((item: Liquor) => {
      expect(item.region.toLowerCase()).toContain('kentucky');
    });
  });

  it('should filter by age', () => {
    const result = queryCatalog(testCatalog, { age: '16' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('lagavulin-16');
  });

  it('should filter by source', () => {
    const result = queryCatalog(testCatalog, { source: 'community' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('patron-silver');
  });

  it('should default source to curated when not set', () => {
    const result = queryCatalog(testCatalog, { source: 'curated' });
    // All items without explicit source default to curated
    expect(result.items.length).toBe(7);
  });

  it('should combine filters', () => {
    const result = queryCatalog(testCatalog, { type: 'bourbon', maxPrice: 30 });
    expect(result.items.length).toBeGreaterThan(0);
    result.items.forEach((item: Liquor) => {
      expect(item.type).toBe('bourbon');
      expect(item.price).toBeLessThanOrEqual(30);
    });
  });

  it('should combine type + region + price range', () => {
    const result = queryCatalog(testCatalog, { type: 'bourbon', region: 'kentucky', minPrice: 20, maxPrice: 30 });
    expect(result.items.length).toBeGreaterThan(0);
    result.items.forEach((item: Liquor) => {
      expect(item.type).toBe('bourbon');
      expect(item.region.toLowerCase()).toContain('kentucky');
      expect(item.price).toBeGreaterThanOrEqual(20);
      expect(item.price).toBeLessThanOrEqual(30);
    });
  });
});

describe('Catalog API: Flavor Filtering', () => {
  it('should filter by canonical flavor dimension', () => {
    const result = queryCatalog(testCatalog, { flavor: 'smoky' });
    expect(result.items.length).toBeGreaterThan(0);
    result.items.forEach((item: Liquor) => {
      expect(item.flavorProfile.smoky).toBeGreaterThanOrEqual(FLAVOR_THRESHOLD);
    });
  });

  it('should filter by flavor alias', () => {
    const result = queryCatalog(testCatalog, { flavor: 'sweet' });
    expect(result.items.length).toBeGreaterThan(0);
    result.items.forEach((item: Liquor) => {
      expect(item.flavorProfile.sweetness).toBeGreaterThanOrEqual(FLAVOR_THRESHOLD);
    });
  });

  it('should filter by multiple flavors (AND logic)', () => {
    const result = queryCatalog(testCatalog, { flavor: 'spice,heat' });
    expect(result.items.length).toBeGreaterThan(0);
    result.items.forEach((item: Liquor) => {
      expect(item.flavorProfile.spice).toBeGreaterThanOrEqual(FLAVOR_THRESHOLD);
      expect(item.flavorProfile.heat).toBeGreaterThanOrEqual(FLAVOR_THRESHOLD);
    });
  });

  it('should return empty when no items match flavor filter', () => {
    // No item has floral >= 6 AND smoky >= 6
    const result = queryCatalog(testCatalog, { flavor: 'floral,smoky' });
    expect(result.items).toHaveLength(0);
  });

  it('should combine flavor with other filters', () => {
    const result = queryCatalog(testCatalog, { type: 'bourbon', flavor: 'sweet' });
    expect(result.items.length).toBeGreaterThan(0);
    result.items.forEach((item: Liquor) => {
      expect(item.type).toBe('bourbon');
      expect(item.flavorProfile.sweetness).toBeGreaterThanOrEqual(FLAVOR_THRESHOLD);
    });
  });
});

describe('Catalog API: Sorting', () => {
  it('should sort by name ascending', () => {
    const result = queryCatalog(testCatalog, { sort: 'name' });
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i].name.localeCompare(result.items[i - 1].name)).toBeGreaterThanOrEqual(0);
    }
  });

  it('should sort by price ascending', () => {
    const result = queryCatalog(testCatalog, { sort: 'price-asc' });
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i].price).toBeGreaterThanOrEqual(result.items[i - 1].price);
    }
  });

  it('should sort by price descending', () => {
    const result = queryCatalog(testCatalog, { sort: 'price-desc' });
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i].price).toBeLessThanOrEqual(result.items[i - 1].price);
    }
  });

  it('should sort by proof ascending', () => {
    const result = queryCatalog(testCatalog, { sort: 'proof-asc' });
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i].proof).toBeGreaterThanOrEqual(result.items[i - 1].proof);
    }
  });

  it('should sort by proof descending', () => {
    const result = queryCatalog(testCatalog, { sort: 'proof-desc' });
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i].proof).toBeLessThanOrEqual(result.items[i - 1].proof);
    }
  });

  it('should sort after filtering', () => {
    const result = queryCatalog(testCatalog, { type: 'bourbon', sort: 'price-asc' });
    expect(result.items.length).toBe(5);
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i].price).toBeGreaterThanOrEqual(result.items[i - 1].price);
    }
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

  it('should paginate sorted results consistently', () => {
    const allIds: string[] = [];
    const limit = 3;
    const totalPages = Math.ceil(testCatalog.length / limit);

    for (let page = 1; page <= totalPages; page++) {
      const result = queryCatalog(testCatalog, { limit, page, sort: 'price-asc' });
      allIds.push(...result.items.map((i: Liquor) => i.id));
    }

    expect(allIds).toHaveLength(testCatalog.length);
    expect(new Set(allIds).size).toBe(testCatalog.length);
  });
});

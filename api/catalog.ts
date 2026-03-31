import type { VercelRequest, VercelResponse } from "@vercel/node";
import { checkRateLimit, RATE_LIMITS } from "./_rateLimit";

/**
 * Catalog API — serves liquor data with search and pagination.
 * Replaces client-side bundling of ~1.8MB of static spirit data.
 *
 * GET /api/catalog                              → paginated list (default 50, max 100)
 * GET /api/catalog?q=buffalo                    → search across name, distillery, region, type, description, mashBill
 * GET /api/catalog?type=bourbon                 → filter by spirit type (exact, case-insensitive)
 * GET /api/catalog?region=kentucky              → filter by region (partial match, case-insensitive)
 * GET /api/catalog?age=12                       → filter by age (partial match, case-insensitive)
 * GET /api/catalog?source=curated               → filter by source (curated | community)
 * GET /api/catalog?id=buffalo-trace             → single item lookup
 * GET /api/catalog?ids=id1,id2,id3              → batch lookup (max 100)
 * GET /api/catalog?minProof=100&maxProof=120    → filter by proof range
 * GET /api/catalog?minPrice=20&maxPrice=50      → filter by price range
 * GET /api/catalog?flavor=smoky,sweet           → filter by high flavor dimensions (score >= 6)
 * GET /api/catalog?sort=price-asc               → sort: name, price-asc, price-desc, proof-asc, proof-desc
 * GET /api/catalog?page=2&limit=24              → offset pagination for catalog grid
 */

const FLAVOR_DIMENSIONS = [
  "sweetness", "spice", "oak", "caramel", "vanilla", "fruit",
  "nutty", "floral", "smoky", "leather", "heat", "complexity",
] as const;

// Map common aliases to canonical flavor dimension names
const FLAVOR_ALIASES: Record<string, string> = {
  sweet: "sweetness", sugary: "sweetness", honey: "sweetness",
  spicy: "spice", pepper: "spice", cinnamon: "spice",
  oaky: "oak", wood: "oak", woody: "oak",
  toffee: "caramel", butterscotch: "caramel",
  creamy: "vanilla",
  fruity: "fruit", cherry: "fruit", apple: "fruit", citrus: "fruit",
  nut: "nutty", almond: "nutty", pecan: "nutty",
  flower: "floral",
  smoke: "smoky", charred: "smoky", peaty: "smoky",
  tobacco: "leather",
  hot: "heat", warm: "heat",
  complex: "complexity",
};

const FLAVOR_THRESHOLD = 6;

// Lazy-load the full catalog only once per cold start
let catalogCache: any[] | null = null;
let catalogIndex: Map<string, any> | null = null;

async function getCatalog(): Promise<any[]> {
  if (catalogCache) return catalogCache;
  // Dynamic import to avoid bundling in every serverless function
  const { ALL_LIQUORS } = await import("../src/data");
  catalogCache = ALL_LIQUORS;
  return catalogCache;
}

async function getIndex(): Promise<Map<string, any>> {
  if (catalogIndex) return catalogIndex;
  const catalog = await getCatalog();
  catalogIndex = new Map(catalog.map(item => [item.id, item]));
  return catalogIndex;
}

function resolveFlavor(name: string): string | undefined {
  const lower = name.toLowerCase();
  if ((FLAVOR_DIMENSIONS as readonly string[]).includes(lower)) return lower;
  return FLAVOR_ALIASES[lower];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!checkRateLimit(req, res, RATE_LIMITS.read, "catalog")) return;

  try {
    const {
      id, ids, q, type, region, age, source,
      minProof, maxProof, minPrice, maxPrice,
      flavor, sort,
      page, limit: rawLimit,
    } = req.query;

    // Single item lookup
    if (id) {
      const index = await getIndex();
      const item = index.get(id as string);
      if (!item) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=600");
      res.json(item);
      return;
    }

    // Batch lookup
    if (ids) {
      const idList = (ids as string).split(",").slice(0, 100);
      const index = await getIndex();
      const items = idList.map(i => index.get(i.trim())).filter(Boolean);
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=600");
      res.json({ items, total: items.length });
      return;
    }

    // Full catalog with filtering and pagination
    let catalog = await getCatalog();

    // Text search — matches across all major text fields
    if (q) {
      const query = (q as string).toLowerCase();
      catalog = catalog.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.distillery.toLowerCase().includes(query) ||
        item.region.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.mashBill.toLowerCase().includes(query)
      );
    }

    // Type filter — exact match (case-insensitive)
    if (type) {
      const spiritType = (type as string).toLowerCase();
      catalog = catalog.filter(item =>
        item.type.toLowerCase() === spiritType
      );
    }

    // Region filter — partial match (case-insensitive)
    if (region) {
      const regionQuery = (region as string).toLowerCase();
      catalog = catalog.filter(item =>
        item.region.toLowerCase().includes(regionQuery)
      );
    }

    // Age filter — partial match (case-insensitive)
    if (age) {
      const ageQuery = (age as string).toLowerCase();
      catalog = catalog.filter(item =>
        item.age.toLowerCase().includes(ageQuery)
      );
    }

    // Source filter — exact match
    if (source) {
      const src = (source as string).toLowerCase();
      catalog = catalog.filter(item => (item.source || "curated") === src);
    }

    // Proof range filters
    if (minProof) {
      const min = parseFloat(minProof as string);
      if (Number.isFinite(min)) {
        catalog = catalog.filter(item => item.proof >= min);
      }
    }
    if (maxProof) {
      const max = parseFloat(maxProof as string);
      if (Number.isFinite(max)) {
        catalog = catalog.filter(item => item.proof <= max);
      }
    }

    // Price range filters
    if (minPrice) {
      const min = parseFloat(minPrice as string);
      if (Number.isFinite(min)) {
        catalog = catalog.filter(item => item.price >= min);
      }
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice as string);
      if (Number.isFinite(max)) {
        catalog = catalog.filter(item => item.price <= max);
      }
    }

    // Flavor filtering — keep items scoring >= threshold in all requested dimensions
    if (flavor) {
      const requested = (flavor as string)
        .split(",")
        .map(f => resolveFlavor(f.trim()))
        .filter(Boolean) as string[];
      if (requested.length > 0) {
        catalog = catalog.filter(item =>
          item.flavorProfile &&
          requested.every(dim => (item.flavorProfile[dim] ?? 0) >= FLAVOR_THRESHOLD)
        );
      }
    }

    // Sorting
    if (sort) {
      const sortKey = (sort as string).toLowerCase();
      switch (sortKey) {
        case "name":
          catalog = [...catalog].sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "price-asc":
          catalog = [...catalog].sort((a, b) => a.price - b.price);
          break;
        case "price-desc":
          catalog = [...catalog].sort((a, b) => b.price - a.price);
          break;
        case "proof-asc":
          catalog = [...catalog].sort((a, b) => a.proof - b.proof);
          break;
        case "proof-desc":
          catalog = [...catalog].sort((a, b) => b.proof - a.proof);
          break;
      }
    }

    // Pagination
    const pageSize = Math.min(Math.max(parseInt(rawLimit as string, 10) || 50, 1), 100);
    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const total = catalog.length;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (pageNum - 1) * pageSize;
    const items = catalog.slice(offset, offset + pageSize);

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=120");
    res.json({
      items,
      total,
      page: pageNum,
      pageSize,
      totalPages,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load catalog" });
  }
}

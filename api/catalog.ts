import type { VercelRequest, VercelResponse } from "@vercel/node";
import { checkRateLimit, RATE_LIMITS } from "./_rateLimit";

/**
 * Catalog API — serves liquor data with search and pagination.
 * Replaces client-side bundling of ~1.8MB of static spirit data.
 *
 * GET /api/catalog                        → paginated list (default 50, max 100)
 * GET /api/catalog?q=buffalo              → search by name/distillery
 * GET /api/catalog?type=bourbon           → filter by spirit type
 * GET /api/catalog?id=buffalo-trace       → single item lookup
 * GET /api/catalog?ids=id1,id2,id3        → batch lookup
 * GET /api/catalog?minProof=100           → filter by proof
 * GET /api/catalog?maxPrice=50            → filter by price
 * GET /api/catalog?page=2&limit=24        → offset pagination for catalog grid
 */

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!checkRateLimit(req, res, RATE_LIMITS.read, "catalog")) return;

  try {
    const { id, ids, q, type, minProof, maxPrice, page, limit: rawLimit } = req.query;

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

    // Apply filters
    if (q) {
      const query = (q as string).toLowerCase();
      catalog = catalog.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.distillery.toLowerCase().includes(query)
      );
    }

    if (type) {
      const spiritType = (type as string).toLowerCase();
      catalog = catalog.filter(item =>
        item.type.toLowerCase() === spiritType
      );
    }

    if (minProof) {
      const min = parseInt(minProof as string, 10);
      if (Number.isFinite(min)) {
        catalog = catalog.filter(item => item.proof >= min);
      }
    }

    if (maxPrice) {
      const max = parseInt(maxPrice as string, 10);
      if (Number.isFinite(max)) {
        catalog = catalog.filter(item => item.price <= max);
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

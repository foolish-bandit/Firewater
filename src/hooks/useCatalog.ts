/**
 * TanStack Query-powered catalog hook.
 *
 * Fetches liquor data from /api/catalog instead of bundling it client-side.
 * Provides search, filtering, and pagination with automatic caching,
 * retry on failure, and background refetch.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryClient";
import { Liquor } from "../liquorTypes";

interface CatalogFilters {
  q?: string;
  type?: string;
  minProof?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

interface CatalogResponse {
  items: Liquor[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function buildCatalogUrl(filters: CatalogFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type) params.set("type", filters.type);
  if (filters.minProof) params.set("minProof", String(filters.minProof));
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return `/api/catalog${qs ? `?${qs}` : ""}`;
}

export function useCatalog(filters: CatalogFilters = {}) {
  return useQuery<CatalogResponse>({
    queryKey: queryKeys.catalog.list(filters),
    queryFn: async () => {
      const res = await fetch(buildCatalogUrl(filters));
      if (!res.ok) throw new Error("Failed to load catalog");
      return res.json();
    },
    // Catalog data changes rarely — cache for 5 minutes
    staleTime: 5 * 60_000,
    // Keep placeholder data while fetching next page
    placeholderData: (previousData) => previousData,
  });
}

export function useLiquorDetail(id: string | undefined) {
  return useQuery<Liquor>({
    queryKey: queryKeys.catalog.detail(id || ""),
    queryFn: async () => {
      const res = await fetch(`/api/catalog?id=${encodeURIComponent(id!)}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}

export function useLiquorBatch(ids: string[]) {
  return useQuery<{ items: Liquor[]; total: number }>({
    queryKey: queryKeys.catalog.batch(ids),
    queryFn: async () => {
      if (ids.length === 0) return { items: [], total: 0 };
      const res = await fetch(`/api/catalog?ids=${ids.join(",")}`);
      if (!res.ok) throw new Error("Failed to load items");
      return res.json();
    },
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
  });
}

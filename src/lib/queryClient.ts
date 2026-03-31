/**
 * TanStack Query client configuration.
 *
 * Provides retry with exponential backoff, stale-while-revalidate,
 * and background refetch on app focus — critical for flaky mobile networks.
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry with exponential backoff (1s, 2s, 4s)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),

      // Consider data stale after 30 seconds
      staleTime: 30_000,

      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60_000,

      // Refetch when app regains focus (critical for mobile)
      refetchOnWindowFocus: true,

      // Refetch when network reconnects
      refetchOnReconnect: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
    },
  },
});

/** Query keys factory for type-safe, consistent cache key management */
export const queryKeys = {
  catalog: {
    all: ["catalog"] as const,
    list: (filters: Record<string, unknown>) => ["catalog", "list", filters] as const,
    detail: (id: string) => ["catalog", "detail", id] as const,
    batch: (ids: string[]) => ["catalog", "batch", ids] as const,
  },
  reviews: {
    all: ["reviews"] as const,
    byUser: (userId: string) => ["reviews", "user", userId] as const,
    byLiquor: (liquorId: string) => ["reviews", "liquor", liquorId] as const,
  },
  lists: {
    all: ["lists"] as const,
    byUser: (userId: string) => ["lists", "user", userId] as const,
  },
  profiles: {
    all: ["profiles"] as const,
    detail: (userId: string) => ["profiles", userId] as const,
    search: (query: string) => ["profiles", "search", query] as const,
  },
  follows: {
    followers: (userId: string) => ["follows", "followers", userId] as const,
    following: (userId: string) => ["follows", "following", userId] as const,
  },
  photos: {
    byLiquor: (liquorId: string) => ["photos", liquorId] as const,
    batch: (ids: string[]) => ["photos", "batch", ids] as const,
    pending: ["photos", "pending"] as const,
  },
  feed: {
    all: ["feed"] as const,
  },
} as const;

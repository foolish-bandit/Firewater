import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Simple in-memory rate limiter for serverless functions.
 *
 * Note: In a serverless environment each instance has its own memory, so this
 * provides per-instance protection rather than global. For stronger guarantees,
 * use an external store like Upstash Redis. This is still valuable because:
 * - It stops rapid-fire abuse from a single client hitting the same instance
 * - Vercel tends to reuse warm instances, so it catches most burst abuse
 * - It's zero-dependency and zero-cost
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically clean up expired entries to prevent memory leaks
const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export interface RateLimitConfig {
  /** Max requests per window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

/** Default rate limits for different endpoint types */
export const RATE_LIMITS = {
  /** Auth endpoints (login, signup) — tighter to prevent brute force */
  auth: { limit: 10, windowMs: 60_000 } as RateLimitConfig,
  /** Standard API reads */
  read: { limit: 100, windowMs: 60_000 } as RateLimitConfig,
  /** Write operations (create, update, delete) */
  write: { limit: 30, windowMs: 60_000 } as RateLimitConfig,
  /** File uploads */
  upload: { limit: 10, windowMs: 60_000 } as RateLimitConfig,
  /** Expensive operations (AI search, feed) */
  expensive: { limit: 20, windowMs: 60_000 } as RateLimitConfig,
};

/**
 * Get a rate limit key from the request (IP + optional user ID).
 */
function getKey(req: VercelRequest, prefix: string): string {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  return `${prefix}:${ip}`;
}

/**
 * Check rate limit. Returns true if the request is allowed, false if rate limited.
 * When rate limited, sends a 429 response automatically.
 */
export function checkRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  config: RateLimitConfig,
  prefix: string = "api"
): boolean {
  cleanup();

  const key = getKey(req, prefix);
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + config.windowMs };
    store.set(key, entry);
  }

  entry.count++;

  // Set rate limit headers
  const remaining = Math.max(0, config.limit - entry.count);
  res.setHeader("X-RateLimit-Limit", config.limit);
  res.setHeader("X-RateLimit-Remaining", remaining);
  res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

  if (entry.count > config.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader("Retry-After", retryAfter);
    res.status(429).json({
      error: "Too many requests. Please try again later.",
      retryAfter,
    });
    return false;
  }

  return true;
}

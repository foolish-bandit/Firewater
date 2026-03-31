/**
 * Global distributed rate limiter using Upstash Redis.
 *
 * Provides consistent rate limiting across all Vercel serverless instances.
 * Falls back to the in-memory rate limiter if Upstash is not configured.
 *
 * Setup:
 *   1. Create a free Upstash Redis database at https://upstash.com
 *   2. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars
 *
 * The in-memory limiter remains as a fast first line of defense even when
 * Upstash is enabled — requests blocked locally never hit Redis.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { checkRateLimit as checkLocalRateLimit, RateLimitConfig, RATE_LIMITS } from "./_rateLimit";

let globalLimiter: any = null;
let initAttempted = false;

async function getGlobalLimiter() {
  if (initAttempted) return globalLimiter;
  initAttempted = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Upstash not configured — fall back to local only
    return null;
  }

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");

    const redis = new Redis({ url, token });

    globalLimiter = new Ratelimit({
      redis,
      // Sliding window for smoother rate limiting
      limiter: Ratelimit.slidingWindow(100, "60 s"),
      analytics: true,
      prefix: "firewater",
    });

    return globalLimiter;
  } catch {
    // Module not available or Redis connection failed
    return null;
  }
}

function getClientIp(req: VercelRequest): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

/**
 * Rate limit configurations for the global limiter.
 * These mirror RATE_LIMITS but with Upstash sliding window semantics.
 */
const GLOBAL_LIMITS: Record<string, { tokens: number; window: string }> = {
  auth: { tokens: 10, window: "60 s" },
  read: { tokens: 100, window: "60 s" },
  write: { tokens: 30, window: "60 s" },
  upload: { tokens: 10, window: "60 s" },
  expensive: { tokens: 20, window: "60 s" },
};

/**
 * Check rate limit using both local (fast) and global (consistent) limiters.
 *
 * Flow:
 *   1. Check local in-memory limiter (instant, catches burst abuse)
 *   2. If allowed locally, check global Redis limiter (consistent across instances)
 *   3. If either denies, return 429
 */
export async function checkGlobalRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  config: RateLimitConfig,
  prefix: string = "api"
): Promise<boolean> {
  // First: local check (fast, no network hop)
  if (!checkLocalRateLimit(req, res, config, prefix)) {
    return false;
  }

  // Second: global check (if Upstash configured)
  const limiter = await getGlobalLimiter();
  if (!limiter) return true; // No global limiter — local check was sufficient

  try {
    const ip = getClientIp(req);
    const key = `${prefix}:${ip}`;

    // Use specific limit for this endpoint type, or fallback
    const tier = prefix.split(":")[0];
    const globalConfig = GLOBAL_LIMITS[tier];

    if (globalConfig) {
      // Create per-tier limiter on the fly
      const { Ratelimit } = await import("@upstash/ratelimit");
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      const tierLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(globalConfig.tokens, globalConfig.window as any),
        prefix: `firewater:${tier}`,
      });
      const { success, remaining, reset } = await tierLimiter.limit(key);

      res.setHeader("X-RateLimit-Global-Remaining", remaining);

      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        res.setHeader("Retry-After", retryAfter);
        res.status(429).json({
          error: "Too many requests. Please try again later.",
          retryAfter,
        });
        return false;
      }
    }

    return true;
  } catch {
    // Redis error — don't block the request, fall back to local only
    return true;
  }
}

// Re-export for convenience
export { RATE_LIMITS } from "./_rateLimit";

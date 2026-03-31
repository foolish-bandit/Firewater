import type { VercelRequest, VercelResponse } from "@vercel/node";

// Re-export Clerk-based auth from the shared module
export { getAuthUserId, requireAuth, isAdmin, getAdminEmail } from "../_auth";

// --- Rate limiting ---

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60_000;
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
  limit: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  auth: { limit: 10, windowMs: 60_000 } as RateLimitConfig,
  read: { limit: 100, windowMs: 60_000 } as RateLimitConfig,
  write: { limit: 30, windowMs: 60_000 } as RateLimitConfig,
  upload: { limit: 10, windowMs: 60_000 } as RateLimitConfig,
  expensive: { limit: 20, windowMs: 60_000 } as RateLimitConfig,
};

function getKey(req: VercelRequest, prefix: string): string {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  return `${prefix}:${ip}`;
}

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

// --- Logger ---

export const logger = {
  info: (msg: string, data?: Record<string, unknown>) => console.log(`[INFO] ${msg}`, data || ""),
  warn: (msg: string, data?: Record<string, unknown>) => console.warn(`[WARN] ${msg}`, data || ""),
  error: (msg: string, data?: Record<string, unknown>) => console.error(`[ERROR] ${msg}`, data || ""),
};

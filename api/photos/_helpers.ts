import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "firewater-dev-secret-change-in-production";

interface JwtPayload {
  userId: string;
  email?: string;
}

function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function getAuthUserId(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload) return payload.userId;
  }
  return null;
}

export function requireAuth(req: VercelRequest, res: VercelResponse): string | null {
  const userId = getAuthUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return userId;
}

export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

export function getAdminEmail(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload?.email && isAdmin(payload.email)) return payload.email;
  }
  return null;
}

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

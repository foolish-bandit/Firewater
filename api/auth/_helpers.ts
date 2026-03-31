import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import * as crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "firewater-dev-secret-change-in-production";

if (!process.env.JWT_SECRET) {
  console.warn("[AUTH] WARNING: JWT_SECRET not set — using insecure default. Set JWT_SECRET env var for production.");
}

const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_EXPIRY = "30d";

export interface JwtPayload {
  userId: string;
  email?: string;
}

interface RefreshPayload extends JwtPayload {
  type: "refresh";
  family: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function signRefreshToken(payload: JwtPayload): { token: string; family: string } {
  const family = crypto.randomUUID();
  const token = jwt.sign(
    { ...payload, type: "refresh", family } as RefreshPayload,
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  return { token, family };
}

export function setRefreshCookie(res: VercelResponse, refreshToken: string): void {
  const maxAge = 30 * 24 * 60 * 60;
  res.setHeader("Set-Cookie", [
    `bs_refresh=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=${maxAge}`,
  ]);
}

export function issueTokens(
  res: VercelResponse,
  payload: JwtPayload
): { accessToken: string; refreshFamily: string } {
  const accessToken = signAccessToken(payload);
  const { token: refreshToken, family } = signRefreshToken(payload);
  setRefreshCookie(res, refreshToken);
  return { accessToken, refreshFamily: family };
}

export function verifyToken(token: string): JwtPayload | null {
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

export function verifyRefreshToken(token: string): RefreshPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as RefreshPayload;
    if (payload.type !== "refresh") return null;
    return payload;
  } catch {
    return null;
  }
}

export function clearRefreshCookie(res: VercelResponse): void {
  res.setHeader("Set-Cookie", [
    `bs_refresh=; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=0`,
  ]);
}

export function getRefreshTokenFromCookie(req: VercelRequest): string | null {
  const cookies = req.headers.cookie;
  if (!cookies) return null;
  const match = cookies.match(/(?:^|;\s*)bs_refresh=([^;]+)/);
  return match ? match[1] : null;
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

export function getClientIp(headers: Record<string, string | string[] | undefined>): string {
  const forwarded = headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() || "unknown";
  return "unknown";
}

export const logger = {
  info: (msg: string, data?: Record<string, unknown>) => console.log(`[INFO] ${msg}`, data || ""),
  warn: (msg: string, data?: Record<string, unknown>) => console.warn(`[WARN] ${msg}`, data || ""),
  error: (msg: string, data?: Record<string, unknown>) => console.error(`[ERROR] ${msg}`, data || ""),
};

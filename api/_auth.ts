import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import * as crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "firewater-dev-secret-change-in-production";

if (!process.env.JWT_SECRET) {
  console.warn("[AUTH] WARNING: JWT_SECRET not set — using insecure default. Set JWT_SECRET env var for production.");
}

/** Access tokens are short-lived (1 hour) */
const ACCESS_TOKEN_EXPIRY = "1h";

/** Refresh tokens are long-lived (30 days) */
const REFRESH_TOKEN_EXPIRY = "30d";

export interface JwtPayload {
  userId: string;
  email?: string;
}

interface RefreshPayload extends JwtPayload {
  type: "refresh";
  /** Unique token family ID — used to detect token reuse/theft */
  family: string;
}

// ─── Access Tokens ───────────────────────────────────────────────────────────

/** Sign a short-lived access token (1 hour) */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/** @deprecated Use signAccessToken instead */
export function signToken(payload: JwtPayload): string {
  return signAccessToken(payload);
}

/** Verify and decode a JWT token. Returns null if invalid/expired. */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ─── Refresh Tokens ──────────────────────────────────────────────────────────

/** Sign a long-lived refresh token (30 days) */
export function signRefreshToken(payload: JwtPayload): { token: string; family: string } {
  const family = crypto.randomUUID();
  const token = jwt.sign(
    { ...payload, type: "refresh", family } as RefreshPayload,
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  return { token, family };
}

/** Verify a refresh token. Returns null if invalid or not a refresh token. */
export function verifyRefreshToken(token: string): RefreshPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as RefreshPayload;
    if (payload.type !== "refresh") return null;
    return payload;
  } catch {
    return null;
  }
}

// ─── Cookie Helpers ──────────────────────────────────────────────────────────

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Set HttpOnly cookie for refresh token */
export function setRefreshCookie(res: VercelResponse, refreshToken: string): void {
  const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
  res.setHeader("Set-Cookie", [
    `bs_refresh=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=${maxAge}`,
  ]);
}

/** Clear the refresh cookie */
export function clearRefreshCookie(res: VercelResponse): void {
  res.setHeader("Set-Cookie", [
    `bs_refresh=; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=0`,
  ]);
}

/** Extract refresh token from cookie */
export function getRefreshTokenFromCookie(req: VercelRequest): string | null {
  const cookies = req.headers.cookie;
  if (!cookies) return null;
  const match = cookies.match(/(?:^|;\s*)bs_refresh=([^;]+)/);
  return match ? match[1] : null;
}

// ─── Request Auth ────────────────────────────────────────────────────────────

/**
 * Extract authenticated user ID from request.
 * Checks Authorization: Bearer <token> header.
 */
export function getAuthUserId(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload) return payload.userId;
  }

  return null;
}

/**
 * Require authentication. Sends 401 and returns null if not authenticated.
 */
export function requireAuth(req: VercelRequest, res: VercelResponse): string | null {
  const userId = getAuthUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return userId;
}

/**
 * Check if the authenticated user is an admin.
 */
export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

/**
 * Get admin email from JWT token.
 */
export function getAdminEmail(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload?.email && isAdmin(payload.email)) return payload.email;
  }
  return null;
}

// ─── Auth Response Helper ────────────────────────────────────────────────────

/**
 * Issue both access and refresh tokens.
 * Sets the refresh token as an HttpOnly cookie and returns the access token in the response body.
 */
export function issueTokens(
  res: VercelResponse,
  payload: JwtPayload
): { accessToken: string; refreshFamily: string } {
  const accessToken = signAccessToken(payload);
  const { token: refreshToken, family } = signRefreshToken(payload);
  setRefreshCookie(res, refreshToken);
  return { accessToken, refreshFamily: family };
}

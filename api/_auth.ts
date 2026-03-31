import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "firewater-dev-secret-change-in-production";
const TOKEN_EXPIRY = "7d";

export interface JwtPayload {
  userId: string;
  email?: string;
}

/** Sign a JWT token for a user */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/** Verify and decode a JWT token. Returns null if invalid. */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extract authenticated user ID from request.
 * Supports: Authorization: Bearer <token>
 * Falls back to x-user-id header for backward compatibility during migration.
 */
export function getAuthUserId(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload) return payload.userId;
  }

  // Fallback: legacy x-user-id header (remove after full migration)
  const legacyId = req.headers["x-user-id"] as string | undefined;
  return legacyId || null;
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
 * Get admin email from JWT token or query param.
 */
export function getAdminEmail(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload?.email && isAdmin(payload.email)) return payload.email;
  }
  // Fallback: query param (legacy)
  const email = req.query.email as string | undefined;
  if (email && isAdmin(email)) return email;
  return null;
}

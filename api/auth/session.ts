import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "@vercel/postgres";
import * as crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  getRefreshTokenFromCookie,
  checkRateLimit,
  RATE_LIMITS,
  logger,
  getClientIp,
} from "./_helpers";

/**
 * Consolidated session management endpoint.
 * Routes by ?action= parameter to stay within Vercel Hobby's 12-function limit.
 *
 * POST /api/auth/session?action=refresh  — Exchange refresh token for new access token
 * POST /api/auth/session?action=logout   — Clear refresh token cookie
 * POST /api/auth/session?action=reset-request — Request password reset token
 * POST /api/auth/session?action=reset-confirm — Confirm password reset with token
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const action = req.query.action as string;

  switch (action) {
    case "refresh":
      return handleRefresh(req, res);
    case "logout":
      return handleLogout(req, res);
    case "reset-request":
      return handleResetRequest(req, res);
    case "reset-confirm":
      return handleResetConfirm(req, res);
    default:
      res.status(400).json({ error: "Invalid action. Use 'refresh', 'logout', 'reset-request', or 'reset-confirm'." });
  }
}

// ─── Refresh ─────────────────────────────────────────────────────────────────

/**
 * Exchange a refresh token for a new access token.
 * Token rotation: each refresh issues a new refresh token, invalidating the old one.
 */
async function handleRefresh(req: VercelRequest, res: VercelResponse) {
  if (!checkRateLimit(req, res, RATE_LIMITS.auth, "auth:refresh")) return;

  try {
    // Get refresh token from HttpOnly cookie (web) or request body (Capacitor native)
    const refreshToken = getRefreshTokenFromCookie(req) || req.body?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ error: "No refresh token provided" });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      clearRefreshCookie(res);
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    // Verify the user still exists
    const { rows } = await sql`
      SELECT id, email FROM users WHERE id = ${payload.userId}
    `;

    if (rows.length === 0) {
      clearRefreshCookie(res);
      res.status(401).json({ error: "User not found" });
      return;
    }

    const user = rows[0];

    // Issue new access token
    const accessToken = signAccessToken({ userId: user.id, email: user.email || undefined });

    // Rotate refresh token
    const { token: newRefreshToken } = signRefreshToken({ userId: user.id, email: user.email || undefined });
    setRefreshCookie(res, newRefreshToken);

    // For Capacitor native apps, also include refresh token in response body
    res.json({
      accessToken,
      ...(req.body?.refreshToken ? { refreshToken: newRefreshToken } : {}),
    });
  } catch (error: any) {
    logger.error("Token refresh error", error, {
      endpoint: "auth:session",
      method: "POST",
      ip: getClientIp(req.headers),
    });
    res.status(500).json({ error: "Token refresh failed" });
  }
}

// ─── Logout ──────────────────────────────────────────────────────────────────

/**
 * Clear the refresh token cookie. The access token will naturally expire (1 hour).
 */
function handleLogout(_req: VercelRequest, res: VercelResponse) {
  clearRefreshCookie(res);
  res.json({ success: true });
}

// ─── Password Reset ──────────────────────────────────────────────────────────

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a password reset token. Stores only the SHA-256 hash in the database.
 * Always returns success to prevent account enumeration.
 */
async function handleResetRequest(req: VercelRequest, res: VercelResponse) {
  if (!checkRateLimit(req, res, RATE_LIMITS.auth, "auth:reset")) return;

  const { identifier, type } = req.body || {};
  const ip = getClientIp(req.headers);

  if (!identifier || !type) {
    res.status(400).json({ error: "Missing identifier and type" });
    return;
  }

  try {
    let userId: string | null = null;

    if (type === "email") {
      const { rows } = await sql`
        SELECT id, email FROM users
        WHERE email = ${identifier.toLowerCase()} AND password_hash IS NOT NULL
      `;
      if (rows.length > 0) userId = rows[0].id;
    } else if (type === "phone") {
      const normalizedPhone = identifier.replace(/[\s\-\(\)]/g, "");
      const { rows } = await sql`
        SELECT id, email FROM users
        WHERE phone = ${normalizedPhone} AND password_hash IS NOT NULL
      `;
      if (rows.length > 0) userId = rows[0].id;
    }

    if (!userId) {
      logger.info("Password reset requested for unknown identifier", {
        endpoint: "auth:session",
        method: "POST",
        ip,
      });
      res.json({ success: true, message: "If an account exists, a reset link has been sent." });
      return;
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS).toISOString();

    // Ensure password_reset_tokens table exists
    await sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Delete any existing tokens for this user (single active reset at a time)
    await sql`DELETE FROM password_reset_tokens WHERE user_id = ${userId}`;

    // Store token hash
    await sql`
      INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
      VALUES (${tokenHash}, ${userId}, ${expiresAt})
    `;

    logger.info("Password reset token generated", {
      endpoint: "auth:session",
      method: "POST",
      userId,
      ip,
    });

    res.json({
      success: true,
      message: "If an account exists, a reset link has been sent.",
      resetToken: token,
    });
  } catch (error: any) {
    logger.error("Password reset request error", error, {
      endpoint: "auth:session",
      method: "POST",
      ip,
    });
    res.status(500).json({ error: "Password reset failed. Please try again." });
  }
}

/**
 * Confirm password reset. Validates the token, updates password, deletes the token.
 */
async function handleResetConfirm(req: VercelRequest, res: VercelResponse) {
  if (!checkRateLimit(req, res, RATE_LIMITS.auth, "auth:reset")) return;

  const { token, newPassword } = req.body || {};
  const ip = getClientIp(req.headers);

  if (!token || !newPassword) {
    res.status(400).json({ error: "Missing token and newPassword" });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    res.status(400).json({ error: "Password must contain at least one letter and one number" });
    return;
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const { rows } = await sql`
      SELECT user_id, expires_at FROM password_reset_tokens
      WHERE token_hash = ${tokenHash}
    `;

    if (rows.length === 0) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    const { user_id, expires_at } = rows[0];

    if (new Date(expires_at) < new Date()) {
      await sql`DELETE FROM password_reset_tokens WHERE token_hash = ${tokenHash}`;
      res.status(400).json({ error: "Reset token has expired. Please request a new one." });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE users SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${user_id}`;

    // Delete the used token (single-use) + clean expired tokens
    await sql`DELETE FROM password_reset_tokens WHERE token_hash = ${tokenHash}`;
    await sql`DELETE FROM password_reset_tokens WHERE expires_at < NOW()`;

    logger.info("Password reset completed", {
      endpoint: "auth:session",
      method: "POST",
      userId: user_id,
      ip,
    });

    res.json({ success: true, message: "Password has been reset. You can now sign in." });
  } catch (error: any) {
    logger.error("Password reset confirm error", error, {
      endpoint: "auth:session",
      method: "POST",
      ip,
    });
    res.status(500).json({ error: "Password reset failed. Please try again." });
  }
}

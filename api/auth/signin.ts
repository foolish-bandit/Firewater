import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";
import { issueTokens } from "../_auth";
import { checkRateLimit, RATE_LIMITS } from "../_rateLimit";
import { logger, getClientIp } from "../_logger";

// Pre-computed dummy hash for constant-time comparison when user doesn't exist.
// Prevents timing attacks that reveal whether an account exists.
const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!checkRateLimit(req, res, RATE_LIMITS.auth, "auth:signin")) return;

  const { identifier, password, type } = req.body || {};
  const ip = getClientIp(req.headers);

  if (!identifier || !password || !type) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (type !== "email" && type !== "phone") {
    res.status(400).json({ error: "Type must be 'email' or 'phone'" });
    return;
  }

  try {
    let result;
    if (type === "email") {
      result = await sql`
        SELECT id, email, phone, name, picture, password_hash, auth_provider
        FROM users WHERE email = ${identifier.toLowerCase()}
      `;
    } else {
      const normalizedPhone = identifier.replace(/[\s\-\(\)]/g, "");
      result = await sql`
        SELECT id, email, phone, name, picture, password_hash, auth_provider
        FROM users WHERE phone = ${normalizedPhone}
      `;
    }

    const user = result.rows[0];

    // Always run bcrypt.compare even if user doesn't exist (timing attack prevention).
    const hashToCompare = user?.password_hash || DUMMY_HASH;
    const valid = await bcrypt.compare(password, hashToCompare);

    if (!user || !user.password_hash || !valid) {
      // Log failed attempt for audit trail
      logger.warn("Failed login attempt", {
        endpoint: "auth:signin",
        method: "POST",
        ip,
        identifier_type: type,
        reason: !user ? "user_not_found" : !user.password_hash ? "no_password" : "wrong_password",
      });
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Issue access token (1h) + refresh token (30d HttpOnly cookie)
    const { accessToken } = issueTokens(res, { userId: user.id, email: user.email || undefined });

    logger.info("Successful login", {
      endpoint: "auth:signin",
      method: "POST",
      userId: user.id,
      ip,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email || "",
        phone: user.phone || "",
        name: user.name,
        picture: user.picture || "",
        authProvider: user.auth_provider,
      },
      token: accessToken,
    });
  } catch (error: any) {
    logger.error("Signin error", error, { endpoint: "auth:signin", method: "POST", ip });
    res.status(500).json({ error: "Sign in failed. Please try again." });
  }
}

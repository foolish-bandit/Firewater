import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";
import { issueTokens } from "../_auth";
import { checkRateLimit, RATE_LIMITS } from "../_rateLimit";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!checkRateLimit(req, res, RATE_LIMITS.auth, "auth:signup")) return;

  const { identifier, password, name, type } = req.body || {};

  if (!identifier || !password || !name || !type) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (type !== "email" && type !== "phone") {
    res.status(400).json({ error: "Type must be 'email' or 'phone'" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  // Password complexity: require at least one letter and one number
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    res.status(400).json({ error: "Password must contain at least one letter and one number" });
    return;
  }

  if (type === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }
  }

  if (type === "phone") {
    const digits = identifier.replace(/[\s\-\(\)\+]/g, "");
    if (digits.length < 10 || digits.length > 15) {
      res.status(400).json({ error: "Invalid phone number" });
      return;
    }
  }

  try {
    // Check if user already exists.
    // Use a generic error message to prevent account enumeration attacks.
    if (type === "email") {
      const existing = await sql`SELECT id FROM users WHERE email = ${identifier.toLowerCase()}`;
      if (existing.rows.length > 0) {
        res.status(409).json({ error: "Unable to create account. Please try signing in or use a different identifier." });
        return;
      }
    } else {
      const normalizedPhone = identifier.replace(/[\s\-\(\)]/g, "");
      const existing = await sql`SELECT id FROM users WHERE phone = ${normalizedPhone}`;
      if (existing.rows.length > 0) {
        res.status(409).json({ error: "Unable to create account. Please try signing in or use a different identifier." });
        return;
      }
    }

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const email = type === "email" ? identifier.toLowerCase() : null;
    const phone = type === "phone" ? identifier.replace(/[\s\-\(\)]/g, "") : null;

    await sql`
      INSERT INTO users (id, email, phone, name, password_hash, auth_provider)
      VALUES (${id}, ${email}, ${phone}, ${name}, ${passwordHash}, ${type})
    `;

    // Issue access token (1h) + refresh token (30d HttpOnly cookie)
    const { accessToken } = issueTokens(res, { userId: id, email: email || undefined });

    res.json({
      user: {
        id,
        email: email || "",
        phone: phone || "",
        name,
        picture: "",
        authProvider: type,
      },
      token: accessToken,
    });
  } catch (error: any) {
    const { logger } = await import("../_logger");
    logger.error("Signup error", error, { endpoint: "auth:signup", method: "POST" });
    res.status(500).json({ error: "Sign up failed. Please try again." });
  }
}

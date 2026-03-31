import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Inline auth helpers to avoid any cross-file bundling issues
const JWT_SECRET = process.env.JWT_SECRET || "firewater-dev-secret-change-in-production";

function signAccessToken(payload: { userId: string; email?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

function signRefreshToken(payload: { userId: string; email?: string }): { token: string; family: string } {
  const family = crypto.randomUUID();
  const token = jwt.sign(
    { ...payload, type: "refresh", family },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
  return { token, family };
}

function issueTokens(
  res: VercelResponse,
  payload: { userId: string; email?: string }
): { accessToken: string } {
  const accessToken = signAccessToken(payload);
  const { token: refreshToken } = signRefreshToken(payload);
  const maxAge = 30 * 24 * 60 * 60;
  res.setHeader("Set-Cookie", [
    `bs_refresh=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=${maxAge}`,
  ]);
  return { accessToken };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow GET for diagnostics
  if (req.method === "GET") {
    return res.json({
      status: "signup endpoint alive",
      node: process.version,
      has_jwt_secret: !!process.env.JWT_SECRET,
      has_postgres: !!process.env.POSTGRES_URL,
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { identifier, password, name: rawName, type } = req.body || {};

    if (!identifier || !password || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const suffix = Math.floor(1000 + Math.random() * 9000);
    const name = (typeof rawName === "string" && rawName.trim()) ? rawName.trim() : `Anonymous Sipper #${suffix}`;

    if (type !== "email" && type !== "phone") {
      return res.status(400).json({ error: "Type must be 'email' or 'phone'" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ error: "Password must contain at least one letter and one number" });
    }

    if (type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
    }

    if (type === "phone") {
      const digits = identifier.replace(/[\s\-\(\)\+]/g, "");
      if (digits.length < 10 || digits.length > 15) {
        return res.status(400).json({ error: "Invalid phone number" });
      }
    }

    // Check if user already exists
    if (type === "email") {
      const existing = await sql`SELECT id FROM users WHERE email = ${identifier.toLowerCase()}`;
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "Unable to create account. Please try signing in or use a different identifier." });
      }
    } else {
      const normalizedPhone = identifier.replace(/[\s\-\(\)]/g, "");
      const existing = await sql`SELECT id FROM users WHERE phone = ${normalizedPhone}`;
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "Unable to create account. Please try signing in or use a different identifier." });
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

    const { accessToken } = issueTokens(res, { userId: id, email: email || undefined });

    return res.json({
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
    console.error("[SIGNUP ERROR]", error);
    return res.status(500).json({ error: `Sign up failed: ${error.message || error}` });
  }
}

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { identifier, password, type } = req.body || {};

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

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      res.status(401).json({
        error: "This account uses Google sign-in. Please sign in with Google.",
      });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email || "",
        phone: user.phone || "",
        name: user.name,
        picture: user.picture || "",
        authProvider: user.auth_provider,
      },
    });
  } catch (error: any) {
    console.error("Signin error:", error);
    res.status(500).json({ error: "Sign in failed. Please try again." });
  }
}

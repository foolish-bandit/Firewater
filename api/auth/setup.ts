import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "@vercel/postgres";

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const email = req.query.email as string;
  if (!isAdmin(email)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        name TEXT NOT NULL,
        picture TEXT,
        password_hash TEXT,
        auth_provider TEXT NOT NULL,
        google_id TEXT UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    res.json({ success: true, message: "Users table created successfully" });
  } catch (error: any) {
    console.error("Setup error:", error);
    res.status(500).json({ error: "Setup failed: " + error.message });
  }
}

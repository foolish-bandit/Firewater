import type { VercelRequest, VercelResponse } from "@vercel/node";
import { del } from "@vercel/blob";
import { sql } from "@vercel/postgres";

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action as string;

  try {
    // GET /api/photos?action=bourbon&bourbonId=xxx
    if (req.method === "GET" && action === "bourbon") {
      const bourbonId = req.query.bourbonId as string;
      if (!bourbonId) {
        res.status(400).json({ error: "Missing bourbonId query parameter" });
        return;
      }
      const result = await sql`
        SELECT * FROM photos WHERE bourbon_id = ${bourbonId} AND status = 'approved' ORDER BY created_at DESC
      `;
      res.json(result.rows);
      return;
    }

    // GET /api/photos?action=pending&email=xxx
    if (req.method === "GET" && action === "pending") {
      const email = req.query.email as string;
      if (!isAdmin(email)) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      const result = await sql`SELECT * FROM photos WHERE status = 'pending' ORDER BY created_at DESC`;
      res.json(result.rows);
      return;
    }

    // POST /api/photos?action=approve
    if (req.method === "POST" && action === "approve") {
      const { photoId, adminEmail } = req.body;
      if (!isAdmin(adminEmail)) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      if (!photoId) {
        res.status(400).json({ error: "Missing photoId" });
        return;
      }
      const result = await sql`
        UPDATE photos SET status = 'approved', reviewed_at = NOW(), reviewed_by = ${adminEmail}
        WHERE id = ${photoId} AND status = 'pending' RETURNING *
      `;
      if (result.rowCount === 0) {
        res.status(404).json({ error: "Photo not found or already reviewed" });
        return;
      }
      res.json(result.rows[0]);
      return;
    }

    // POST /api/photos?action=reject
    if (req.method === "POST" && action === "reject") {
      const { photoId, adminEmail } = req.body;
      if (!isAdmin(adminEmail)) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      if (!photoId) {
        res.status(400).json({ error: "Missing photoId" });
        return;
      }
      const photo = await sql`SELECT * FROM photos WHERE id = ${photoId} AND status = 'pending'`;
      if (photo.rowCount === 0) {
        res.status(404).json({ error: "Photo not found or already reviewed" });
        return;
      }
      const blobUrl = photo.rows[0].blob_url;
      await sql`
        UPDATE photos SET status = 'rejected', reviewed_at = NOW(), reviewed_by = ${adminEmail} WHERE id = ${photoId}
      `;
      try { await del(blobUrl); } catch { /* non-fatal */ }
      res.json({ success: true });
      return;
    }

    // POST /api/photos?action=setup
    if (req.method === "POST" && action === "setup") {
      const email = req.query.email as string;
      if (!isAdmin(email)) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      await sql`
        CREATE TABLE IF NOT EXISTS photos (
          id TEXT PRIMARY KEY, bourbon_id TEXT NOT NULL, user_id TEXT NOT NULL,
          user_email TEXT NOT NULL, user_name TEXT, blob_url TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          reviewed_at TIMESTAMPTZ, reviewed_by TEXT
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_photos_bourbon_status ON photos(bourbon_id, status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_photos_status ON photos(status)`;
      res.json({ success: true, message: "Photos table created successfully" });
      return;
    }

    res.status(404).json({ error: "Unknown action" });
  } catch (error: any) {
    console.error("Photos API error:", error);
    res.status(500).json({ error: "Operation failed: " + error.message });
  }
}

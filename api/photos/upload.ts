import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put } from "@vercel/blob";
import { sql } from "@vercel/postgres";
import crypto from "crypto";

export const config = {
  api: {
    bodyParser: false, // Required for handling raw body / streams
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const filename = req.headers["x-filename"] as string;
    const contentType = req.headers["content-type"] as string;
    const bourbonId = req.headers["x-bourbon-id"] as string;
    const userId = req.headers["x-user-id"] as string;
    const userEmail = req.headers["x-user-email"] as string;
    const userName = req.headers["x-user-name"] as string;

    if (!bourbonId || !userId || !userEmail) {
      res.status(400).json({ error: "Missing required headers: x-bourbon-id, x-user-id, x-user-email" });
      return;
    }

    if (!filename) {
      res.status(400).json({ error: "Missing x-filename header" });
      return;
    }

    // Validate content type
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(contentType)) {
      res.status(400).json({ error: "Only JPEG, PNG, and WebP images are allowed" });
      return;
    }

    // Upload to Vercel Blob
    const ext = filename.split(".").pop() || "jpg";
    const blobFilename = `bourbon-photos/${crypto.randomUUID()}.${ext}`;

    const blob = await put(blobFilename, req, {
      access: "public",
      contentType,
    });

    // Store metadata in Postgres
    const id = crypto.randomUUID();
    await sql`
      INSERT INTO photos (id, bourbon_id, user_id, user_email, user_name, blob_url, status, created_at)
      VALUES (${id}, ${bourbonId}, ${userId}, ${userEmail}, ${userName || null}, ${blob.url}, 'pending', NOW())
    `;

    const result = await sql`SELECT * FROM photos WHERE id = ${id}`;
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("Photo upload error:", error);
    res.status(500).json({ error: "Upload failed: " + error.message });
  }
}

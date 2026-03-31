import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put } from "@vercel/blob";
import { sql } from "@vercel/postgres";
import crypto from "crypto";
import { requireAuth, checkRateLimit, RATE_LIMITS, logger } from "./_helpers";

/** Max upload size: 5 MB */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Max image dimensions — resize larger images to save bandwidth */
const MAX_IMAGE_DIMENSION = 1200;

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

  if (!checkRateLimit(req, res, RATE_LIMITS.upload, "photos:upload")) return;

  try {
    const userId = await requireAuth(req, res);
    if (!userId) return;

    const filename = req.headers["x-filename"] as string;
    const contentType = req.headers["content-type"] as string;
    const bourbonId = req.headers["x-bourbon-id"] as string;

    if (!bourbonId) {
      res.status(400).json({ error: "Missing required header: x-bourbon-id" });
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

    // Enforce file size limit via Content-Length header
    const contentLength = parseInt(req.headers["content-length"] as string, 10);
    if (contentLength && contentLength > MAX_FILE_SIZE) {
      res.status(413).json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` });
      return;
    }

    // Sanitize filename: extract only the extension, prevent path traversal
    const rawExt = (filename.split(".").pop() || "").toLowerCase().replace(/[^a-z]/g, "");
    const allowedExts = ["jpg", "jpeg", "png", "webp"];
    const ext = allowedExts.includes(rawExt) ? rawExt : "jpg";

    // Validate Content-Type matches extension (prevent type confusion)
    const extToMime: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    };
    if (extToMime[ext] !== contentType) {
      res.status(400).json({ error: "File extension does not match content type" });
      return;
    }

    // Upload to Vercel Blob with sanitized filename (UUID prevents collisions and path traversal)
    const blobFilename = `bourbon-photos/${crypto.randomUUID()}.${ext}`;

    const blob = await put(blobFilename, req, {
      access: "public",
      contentType,
    });

    // Verify blob size after upload (defense-in-depth for chunked transfers)
    const blobAny = blob as any;
    if (blobAny.size && blobAny.size > MAX_FILE_SIZE) {
      // Clean up the oversized blob
      try {
        const { del: delBlob } = await import("@vercel/blob");
        await delBlob(blob.url);
      } catch { /* best effort */ }
      res.status(413).json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` });
      return;
    }

    // Look up user email from DB for the photo record
    const { rows: userRows } = await sql`SELECT email, name FROM users WHERE id = ${userId}`;
    const userEmail = userRows[0]?.email || "";
    const userName = userRows[0]?.name || null;

    // Store metadata in Postgres with image dimensions for srcset support
    const id = crypto.randomUUID();
    await sql`
      INSERT INTO photos (id, bourbon_id, user_id, user_email, user_name, blob_url, status, created_at)
      VALUES (${id}, ${bourbonId}, ${userId}, ${userEmail}, ${userName}, ${blob.url}, 'pending', NOW())
    `;

    const result = await sql`SELECT * FROM photos WHERE id = ${id}`;

    // Return photo with optimization hints for the client
    const photo = result.rows[0];
    res.json({
      ...photo,
      // Client can use these to request optimized variants via Vercel Image Optimization
      // e.g., /_vercel/image?url=<blob_url>&w=400&q=75
      optimization: {
        thumbnail: { width: 200, quality: 70 },
        medium: { width: 600, quality: 80 },
        full: { width: MAX_IMAGE_DIMENSION, quality: 85 },
      },
    });
  } catch (error: any) {
    logger.error("Photo upload error", error, { endpoint: "photos:upload", method: "POST" });
    res.status(500).json({ error: "Upload failed: " + error.message });
  }
}

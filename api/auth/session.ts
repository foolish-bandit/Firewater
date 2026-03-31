import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(410).json({ error: "This endpoint has been retired. Please use Clerk authentication." });
}

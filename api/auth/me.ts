import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAdminEmail, isAdmin, verifyToken } from "../_auth";
import { checkRateLimit, RATE_LIMITS } from "../_rateLimit";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkRateLimit(req, res, RATE_LIMITS.read, "auth:me")) return;

  // Try JWT first
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const payload = verifyToken(authHeader.slice(7));
    if (payload?.email) {
      res.json({ isAdmin: isAdmin(payload.email) });
      return;
    }
  }

  // Legacy fallback: query param
  const email = req.query.email as string;
  res.json({ isAdmin: isAdmin(email) });
}

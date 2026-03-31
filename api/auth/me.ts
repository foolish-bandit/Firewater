import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAdminEmail } from "../_auth";
import { checkRateLimit, RATE_LIMITS } from "./_helpers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkRateLimit(req, res, RATE_LIMITS.read, "auth:me")) return;

  const adminEmail = await getAdminEmail(req);
  res.json({ isAdmin: !!adminEmail });
}

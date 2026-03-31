import type { VercelRequest, VercelResponse } from "@vercel/node";

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const email = req.query.email as string;
  res.json({ isAdmin: isAdmin(email) });
}

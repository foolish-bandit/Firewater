/**
 * CORS middleware for API endpoints.
 *
 * Restricts cross-origin access to the app's own origin.
 * Required when the app is served from a Capacitor webview (different origin)
 * or a custom domain.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_ORIGINS = new Set<string>();

function getAllowedOrigins(): Set<string> {
  if (ALLOWED_ORIGINS.size > 0) return ALLOWED_ORIGINS;

  // Always allow the app's own URL
  if (process.env.APP_URL) {
    ALLOWED_ORIGINS.add(process.env.APP_URL);
  }
  if (process.env.VERCEL_URL) {
    ALLOWED_ORIGINS.add(`https://${process.env.VERCEL_URL}`);
  }

  // Allow additional origins (e.g., Capacitor, staging) via comma-separated env var
  const extra = process.env.CORS_ORIGINS;
  if (extra) {
    extra.split(",").forEach(o => ALLOWED_ORIGINS.add(o.trim()));
  }

  // Capacitor uses capacitor:// or http://localhost on iOS/Android
  ALLOWED_ORIGINS.add("capacitor://localhost");
  ALLOWED_ORIGINS.add("http://localhost");
  ALLOWED_ORIGINS.add("http://localhost:3000");

  return ALLOWED_ORIGINS;
}

/**
 * Handle CORS headers. Returns true if this is a preflight OPTIONS request
 * (caller should return immediately).
 */
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin;
  const allowed = getAllowedOrigins();

  if (origin && allowed.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Filename, X-Bourbon-Id");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }

  return false;
}

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.error("Missing GOOGLE_CLIENT_ID environment variable");
    res.status(500).json({ error: "OAuth is not configured" });
    return;
  }

  const { state } = req.query;
  if (!state || typeof state !== "string") {
    res.status(400).json({ error: "Missing state parameter" });
    return;
  }

  const appUrl = (
    process.env.APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  ).replace(/\/+$/, "");

  const redirectUri = `${appUrl}/api/auth/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "consent",
    state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url: authUrl });
}

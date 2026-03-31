import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "@vercel/postgres";
import { signAccessToken, signRefreshToken, setRefreshCookie } from "../_auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state } = req.query;

  if (!code || typeof code !== "string") {
    res.status(400).send("Missing authorization code");
    return;
  }

  // Validate CSRF state parameter exists (client verifies the match)
  if (!state || typeof state !== "string") {
    res.status(400).send("Missing state parameter — possible CSRF attack");
    return;
  }

  const appUrl =
    process.env.APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const redirectUri = `${appUrl}/api/auth/callback`;

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || "Failed to get token");
    }

    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      throw new Error("Failed to get user info");
    }

    // Upsert user in database
    const { rows } = await sql`
      INSERT INTO users (id, email, name, picture, auth_provider, google_id)
      VALUES (${userData.id}, ${userData.email}, ${userData.name}, ${userData.picture}, 'google', ${userData.id})
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        picture = EXCLUDED.picture,
        google_id = EXCLUDED.google_id,
        updated_at = NOW()
      RETURNING id, email
    `;

    const dbUser = rows[0];
    const payload = { userId: dbUser.id, email: dbUser.email };
    const jwt = signAccessToken(payload);
    const { token: refreshToken } = signRefreshToken(payload);
    setRefreshCookie(res, refreshToken);

    // Use the validated APP_URL as the target origin for postMessage
    // Never use '*' — it would allow any page to intercept the token
    const targetOrigin = JSON.stringify(appUrl);

    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html>
  <body>
    <p>Authentication successful. This window should close automatically.</p>
    <script>
      if (window.opener) {
        window.opener.postMessage({
          type: 'OAUTH_AUTH_SUCCESS',
          user: ${JSON.stringify({
            id: dbUser.id,
            email: userData.email,
            name: userData.name,
            picture: userData.picture,
          })},
          token: ${JSON.stringify(jwt)},
          state: ${JSON.stringify(state)}
        }, ${targetOrigin});
        window.close();
      } else {
        window.location.href = '/';
      }
    </script>
  </body>
</html>`);
  } catch (error: any) {
    const { logger } = await import("../_logger");
    logger.error("OAuth callback error", error, { endpoint: "auth:callback", method: "GET" });
    res.status(500).send("Authentication failed. Please try again.");
  }
}

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code } = req.query;

  if (!code || typeof code !== "string") {
    res.status(400).send("Missing authorization code");
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
            id: userData.id,
            email: userData.email,
            name: userData.name,
            picture: userData.picture,
          })}
        }, '*');
        window.close();
      } else {
        window.location.href = '/';
      }
    </script>
  </body>
</html>`);
  } catch (error: any) {
    console.error("OAuth error:", error);
    res.status(500).send(`Authentication failed: ${error.message}`);
  }
}

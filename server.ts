import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // OAuth routes
  app.get("/api/auth/url", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const appUrl = process.env.APP_URL?.replace(/\/+$/, "");
    if (!clientId || !appUrl) {
      console.error("Missing GOOGLE_CLIENT_ID or APP_URL environment variable");
      return res.status(500).json({ error: "OAuth is not configured" });
    }

    const { state } = req.query;
    if (!state || typeof state !== "string") {
      return res.status(400).json({ error: "Missing state parameter" });
    }

    const redirectUri = `${appUrl}/auth/callback`;
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
  });

  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code, state } = req.query;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const appUrl = process.env.APP_URL?.replace(/\/+$/, "");
    if (!clientId || !clientSecret || !appUrl) {
      console.error("Missing required OAuth environment variables");
      return res.status(500).send("OAuth is not configured");
    }

    if (!code || typeof code !== "string") {
      return res.status(400).send("Missing authorization code");
    }

    if (!state || typeof state !== "string") {
      return res.status(400).send("Missing state parameter");
    }

    const redirectUri = `${appUrl}/auth/callback`;

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(tokenData.error_description || "Failed to get token");
      }

      // Get user info
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        throw new Error("Failed to get user info");
      }

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  state: ${JSON.stringify(state)},
                  user: {
                    id: ${JSON.stringify(userData.id)},
                    email: ${JSON.stringify(userData.email)},
                    name: ${JSON.stringify(userData.name)},
                    picture: ${JSON.stringify(userData.picture)}
                  }
                }, ${JSON.stringify(appUrl)});
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("OAuth error:", error.message || error);
      res.status(500).send("Authentication failed. Please try again.");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

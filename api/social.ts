import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "@vercel/postgres";

// Consolidated social API: follows, profiles, reviews, lists, user search
// Route via ?scope=follows|profiles|reviews|lists&action=...

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const scope = req.query.scope as string;
  const action = req.query.action as string;

  try {
    // ========== FOLLOWS ==========
    if (scope === "follows") {
      // POST /api/social?scope=follows&action=toggle
      if (req.method === "POST" && action === "toggle") {
        const followerId = req.headers["x-user-id"] as string;
        const { targetUserId } = req.body;
        if (!followerId || !targetUserId) { res.status(400).json({ error: "Missing user IDs" }); return; }
        if (followerId === targetUserId) { res.status(400).json({ error: "Cannot follow yourself" }); return; }

        const { rows } = await sql`SELECT 1 FROM follows WHERE follower_id = ${followerId} AND following_id = ${targetUserId}`;
        if (rows.length > 0) {
          await sql`DELETE FROM follows WHERE follower_id = ${followerId} AND following_id = ${targetUserId}`;
          res.json({ following: false });
        } else {
          await sql`INSERT INTO follows (follower_id, following_id) VALUES (${followerId}, ${targetUserId})`;
          res.json({ following: true });
        }
        return;
      }

      // GET /api/social?scope=follows&action=list&userId=x&type=followers|following
      if (req.method === "GET" && action === "list") {
        const userId = req.query.userId as string;
        const type = req.query.type as string;
        if (!userId || !type) { res.status(400).json({ error: "Missing userId or type" }); return; }

        let rows;
        if (type === "followers") {
          const result = await sql`
            SELECT u.id, u.name, u.picture, u.bio FROM follows f JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = ${userId} ORDER BY f.created_at DESC
          `;
          rows = result.rows;
        } else {
          const result = await sql`
            SELECT u.id, u.name, u.picture, u.bio FROM follows f JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = ${userId} ORDER BY f.created_at DESC
          `;
          rows = result.rows;
        }
        res.json({ users: rows });
        return;
      }
    }

    // ========== PROFILES ==========
    if (scope === "profiles") {
      // GET /api/social?scope=profiles&action=search&q=xxx
      if (req.method === "GET" && action === "search") {
        const query = (req.query.q as string || "").trim();
        if (!query || query.length < 2) { res.json({ users: [] }); return; }
        const pattern = `%${query}%`;
        const { rows } = await sql`
          SELECT u.id, u.name, u.picture, u.bio, u.is_public,
            (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count,
            (SELECT COUNT(*) FROM reviews WHERE user_id = u.id) AS review_count,
            (SELECT COUNT(*) FROM user_lists WHERE user_id = u.id AND list_type = 'tried') AS tried_count
          FROM users u WHERE u.name ILIKE ${pattern}
          ORDER BY (SELECT COUNT(*) FROM reviews WHERE user_id = u.id) DESC LIMIT 20
        `;
        res.json({ users: rows });
        return;
      }

      // GET /api/social?scope=profiles&action=get&userId=xxx
      if (req.method === "GET" && action === "get") {
        const userId = req.query.userId as string;
        const requesterId = req.headers["x-user-id"] as string | undefined;

        const { rows } = await sql`
          SELECT id, name, picture, bio, favorite_spirit, is_public, top_shelf, created_at,
            (SELECT COUNT(*) FROM follows WHERE follower_id = id) AS following_count,
            (SELECT COUNT(*) FROM follows WHERE following_id = id) AS follower_count,
            (SELECT COUNT(*) FROM reviews WHERE user_id = id) AS review_count,
            (SELECT COUNT(*) FROM user_lists WHERE user_id = id AND list_type = 'tried') AS tried_count,
            (SELECT COUNT(*) FROM user_lists WHERE user_id = id AND list_type = 'want') AS want_count
          FROM users WHERE id = ${userId}
        `;

        if (rows.length === 0) { res.status(404).json({ error: "User not found" }); return; }

        const profile = rows[0];
        let is_following = false;
        if (requesterId && requesterId !== userId) {
          const { rows: followRows } = await sql`
            SELECT 1 FROM follows WHERE follower_id = ${requesterId} AND following_id = ${userId}
          `;
          is_following = followRows.length > 0;
        }

        const { rows: ratingRows } = await sql`
          SELECT ROUND(AVG(rating)::numeric, 1) as avg_rating FROM reviews WHERE user_id = ${userId}
        `;

        res.json({ ...profile, is_following, avg_rating: ratingRows[0]?.avg_rating || null, is_own: requesterId === userId });
        return;
      }

      // PUT /api/social?scope=profiles&action=update&userId=xxx
      if (req.method === "PUT" && action === "update") {
        const userId = req.query.userId as string;
        const requesterId = req.headers["x-user-id"] as string;
        if (requesterId !== userId) { res.status(403).json({ error: "Cannot edit another user's profile" }); return; }

        const { bio, favorite_spirit, is_public, top_shelf } = req.body;
        await sql`
          UPDATE users SET
            bio = COALESCE(${bio}, bio), favorite_spirit = COALESCE(${favorite_spirit}, favorite_spirit),
            is_public = COALESCE(${is_public}, is_public), top_shelf = COALESCE(${top_shelf}, top_shelf),
            updated_at = NOW()
          WHERE id = ${userId}
        `;
        res.json({ success: true });
        return;
      }
    }

    // ========== REVIEWS ==========
    if (scope === "reviews") {
      // GET /api/social?scope=reviews&bourbonId=x or &userId=x
      if (req.method === "GET") {
        const bourbonId = req.query.bourbonId as string | undefined;
        const userId = req.query.userId as string | undefined;
        const requesterId = req.headers["x-user-id"] as string | undefined;

        let rows;
        if (bourbonId) {
          const result = await sql`
            SELECT r.*, u.is_public FROM reviews r LEFT JOIN users u ON r.user_id = u.id
            WHERE r.bourbon_id = ${bourbonId} AND (u.is_public = true OR r.user_id = ${requesterId || ''})
            ORDER BY r.created_at DESC
          `;
          rows = result.rows;
        } else if (userId) {
          const result = await sql`
            SELECT r.* FROM reviews r LEFT JOIN users u ON r.user_id = u.id
            WHERE r.user_id = ${userId} AND (u.is_public = true OR r.user_id = ${requesterId || ''})
            ORDER BY r.created_at DESC
          `;
          rows = result.rows;
        } else {
          res.status(400).json({ error: "Must specify bourbonId or userId" }); return;
        }
        res.json({ reviews: rows });
        return;
      }

      // POST /api/social?scope=reviews&action=create
      if (req.method === "POST" && action === "create") {
        const userId = req.headers["x-user-id"] as string;
        if (!userId) { res.status(401).json({ error: "Authentication required" }); return; }
        const { id, bourbonId, rating, text, userName, userPicture, nose, palate, finish, tags } = req.body;
        const tagsJson = JSON.stringify(tags || []);
        await sql`
          INSERT INTO reviews (id, bourbon_id, user_id, user_name, user_picture, rating, text, nose, palate, finish, tags)
          VALUES (${id}, ${bourbonId}, ${userId}, ${userName || null}, ${userPicture || null}, ${rating}, ${text || ''}, ${nose || ''}, ${palate || ''}, ${finish || ''}, ${tagsJson})
        `;
        res.json({ success: true, id });
        return;
      }

      // POST /api/social?scope=reviews&action=sync
      if (req.method === "POST" && action === "sync") {
        const userId = req.headers["x-user-id"] as string;
        if (!userId) { res.status(401).json({ error: "Authentication required" }); return; }
        const { reviews } = req.body;
        if (!Array.isArray(reviews)) { res.status(400).json({ error: "reviews must be an array" }); return; }
        let synced = 0;
        for (const r of reviews) {
          if (r.userId !== userId) continue;
          const rTagsJson = JSON.stringify(r.tags || []);
          await sql`
            INSERT INTO reviews (id, bourbon_id, user_id, user_name, user_picture, rating, text, nose, palate, finish, tags, created_at)
            VALUES (${r.id}, ${r.bourbonId}, ${r.userId}, ${r.userName || null}, ${r.userPicture || null}, ${r.rating}, ${r.text || ''}, ${r.nose || ''}, ${r.palate || ''}, ${r.finish || ''}, ${rTagsJson}, ${r.date || new Date().toISOString()})
            ON CONFLICT (id) DO NOTHING
          `;
          synced++;
        }
        res.json({ success: true, synced });
        return;
      }

      // PUT /api/social?scope=reviews
      if (req.method === "PUT") {
        const userId = req.headers["x-user-id"] as string;
        const { reviewId, rating, text } = req.body;
        await sql`UPDATE reviews SET rating = ${rating}, text = ${text}, updated_at = NOW() WHERE id = ${reviewId} AND user_id = ${userId}`;
        res.json({ success: true });
        return;
      }

      // DELETE /api/social?scope=reviews&reviewId=x
      if (req.method === "DELETE") {
        const userId = req.headers["x-user-id"] as string;
        const reviewId = req.query.reviewId as string;
        await sql`DELETE FROM reviews WHERE id = ${reviewId} AND user_id = ${userId}`;
        res.json({ success: true });
        return;
      }
    }

    // ========== LISTS ==========
    if (scope === "lists") {
      // GET /api/social?scope=lists&userId=x
      if (req.method === "GET") {
        const userId = req.query.userId as string;
        const requesterId = req.headers["x-user-id"] as string | undefined;
        if (!userId) { res.status(400).json({ error: "Missing userId" }); return; }

        if (userId !== requesterId) {
          const { rows } = await sql`SELECT is_public FROM users WHERE id = ${userId}`;
          if (rows.length === 0 || !rows[0].is_public) { res.json({ want: [], tried: [] }); return; }
        }

        const { rows } = await sql`SELECT bourbon_id, list_type FROM user_lists WHERE user_id = ${userId}`;
        res.json({
          want: rows.filter(r => r.list_type === "want").map(r => r.bourbon_id),
          tried: rows.filter(r => r.list_type === "tried").map(r => r.bourbon_id),
        });
        return;
      }

      // POST /api/social?scope=lists&action=update
      if (req.method === "POST" && action === "update") {
        const userId = req.headers["x-user-id"] as string;
        if (!userId) { res.status(401).json({ error: "Authentication required" }); return; }
        const { bourbonId, listType, action: listAction } = req.body;
        if (listAction === "add") {
          const oppositeType = listType === "want" ? "tried" : "want";
          await sql`DELETE FROM user_lists WHERE user_id = ${userId} AND bourbon_id = ${bourbonId} AND list_type = ${oppositeType}`;
          await sql`
            INSERT INTO user_lists (user_id, bourbon_id, list_type) VALUES (${userId}, ${bourbonId}, ${listType})
            ON CONFLICT (user_id, bourbon_id, list_type) DO NOTHING
          `;
        } else {
          await sql`DELETE FROM user_lists WHERE user_id = ${userId} AND bourbon_id = ${bourbonId} AND list_type = ${listType}`;
        }
        res.json({ success: true });
        return;
      }

      // POST /api/social?scope=lists&action=sync
      if (req.method === "POST" && action === "sync") {
        const userId = req.headers["x-user-id"] as string;
        if (!userId) { res.status(401).json({ error: "Authentication required" }); return; }
        const { want, tried } = req.body;
        let synced = 0;
        for (const bourbonId of (want || [])) {
          await sql`INSERT INTO user_lists (user_id, bourbon_id, list_type) VALUES (${userId}, ${bourbonId}, 'want') ON CONFLICT (user_id, bourbon_id, list_type) DO NOTHING`;
          synced++;
        }
        for (const bourbonId of (tried || [])) {
          await sql`INSERT INTO user_lists (user_id, bourbon_id, list_type) VALUES (${userId}, ${bourbonId}, 'tried') ON CONFLICT (user_id, bourbon_id, list_type) DO NOTHING`;
          synced++;
        }
        res.json({ success: true, synced });
        return;
      }
    }

    // ========== FEED ==========
    if (scope === "feed") {
      if (req.method === "GET") {
        const userId = req.headers["x-user-id"] as string;
        if (!userId) { res.status(401).json({ error: "Authentication required" }); return; }

        const { rows } = await sql`
          SELECT * FROM (
            SELECT
              'review' AS type,
              r.user_id,
              r.user_name,
              r.user_picture,
              r.bourbon_id,
              r.rating,
              r.text,
              r.created_at
            FROM reviews r
            INNER JOIN follows f ON f.follower_id = ${userId} AND f.following_id = r.user_id
            LEFT JOIN users u ON r.user_id = u.id
            WHERE u.is_public = true

            UNION ALL

            SELECT
              ul.list_type AS type,
              ul.user_id,
              u.name AS user_name,
              u.picture AS user_picture,
              ul.bourbon_id,
              NULL::integer AS rating,
              NULL::text AS text,
              ul.created_at
            FROM user_lists ul
            INNER JOIN follows f ON f.follower_id = ${userId} AND f.following_id = ul.user_id
            LEFT JOIN users u ON ul.user_id = u.id
            WHERE u.is_public = true
          ) AS activity
          ORDER BY created_at DESC
          LIMIT 50
        `;

        res.json({ activities: rows });
        return;
      }
    }

    // ========== SETUP ==========
    if (scope === "setup") {
      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS favorite_spirit TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS top_shelf TEXT[] DEFAULT '{}'
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS follows (
          follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (follower_id, following_id)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id)`;
      await sql`
        CREATE TABLE IF NOT EXISTS reviews (
          id TEXT PRIMARY KEY, bourbon_id TEXT NOT NULL,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          user_name TEXT, user_picture TEXT,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          text TEXT DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_reviews_bourbon ON reviews(bourbon_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id)`;
      await sql`
        CREATE TABLE IF NOT EXISTS user_lists (
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          bourbon_id TEXT NOT NULL,
          list_type TEXT NOT NULL CHECK (list_type IN ('want', 'tried')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, bourbon_id, list_type)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_user_lists_user ON user_lists(user_id)`;
      res.json({ success: true, message: "Social tables created successfully" });
      return;
    }

    res.status(404).json({ error: "Unknown scope/action" });
  } catch (error: any) {
    console.error("Social API error:", error);
    res.status(500).json({ error: "Operation failed: " + error.message });
  }
}

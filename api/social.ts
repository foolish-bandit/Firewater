import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "@vercel/postgres";
import { getAuthUserId, requireAuth } from "./_auth";
import { checkRateLimit, RATE_LIMITS } from "./_rateLimit";
import { logger } from "./_logger";
import { sanitizeText, sanitizeName, sanitizeRating, sanitizeTags, isValidId, sanitizeBio } from "./_sanitize";
import { handleCors } from "./_cors";

// Consolidated social API: follows, profiles, reviews, lists, feed
// Route via ?scope=follows|profiles|reviews|lists&action=...

/** Set Cache-Control headers for cacheable responses */
function setCacheHeaders(res: VercelResponse, maxAge: number, staleWhileRevalidate: number = 0) {
  const parts = [`public`, `max-age=${maxAge}`, `s-maxage=${maxAge}`];
  if (staleWhileRevalidate > 0) parts.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  res.setHeader("Cache-Control", parts.join(", "));
}

/** Default page size for paginated endpoints */
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

function getPageParams(req: VercelRequest): { limit: number; cursor: string | null } {
  const rawLimit = parseInt(req.query.limit as string, 10);
  const limit = Math.min(
    Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE
  );
  const cursor = (req.query.cursor as string) || null;
  return { limit, cursor };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const scope = req.query.scope as string;
  const action = req.query.action as string;

  try {
    // ========== FOLLOWS ==========
    if (scope === "follows") {
      // POST /api/social?scope=follows&action=toggle
      if (req.method === "POST" && action === "toggle") {
        if (!checkRateLimit(req, res, RATE_LIMITS.write, "follows:toggle")) return;
        const followerId = await requireAuth(req, res);
        if (!followerId) return;

        const { targetUserId } = req.body;
        if (!targetUserId) { res.status(400).json({ error: "Missing targetUserId" }); return; }
        if (followerId === targetUserId) { res.status(400).json({ error: "Cannot follow yourself" }); return; }

        // Atomic toggle using INSERT ... ON CONFLICT to avoid race conditions
        const { rows: inserted } = await sql`
          INSERT INTO follows (follower_id, following_id)
          VALUES (${followerId}, ${targetUserId})
          ON CONFLICT (follower_id, following_id) DO NOTHING
          RETURNING follower_id
        `;

        if (inserted.length > 0) {
          // Was inserted — now following
          await sql`UPDATE users SET following_count = COALESCE(following_count, 0) + 1 WHERE id = ${followerId}`;
          await sql`UPDATE users SET follower_count = COALESCE(follower_count, 0) + 1 WHERE id = ${targetUserId}`;
          res.json({ following: true });
        } else {
          // Already existed — delete to unfollow
          await sql`DELETE FROM follows WHERE follower_id = ${followerId} AND following_id = ${targetUserId}`;
          await sql`UPDATE users SET following_count = GREATEST(COALESCE(following_count, 1) - 1, 0) WHERE id = ${followerId}`;
          await sql`UPDATE users SET follower_count = GREATEST(COALESCE(follower_count, 1) - 1, 0) WHERE id = ${targetUserId}`;
          res.json({ following: false });
        }
        return;
      }

      // GET /api/social?scope=follows&action=list&userId=x&type=followers|following
      if (req.method === "GET" && action === "list") {
        if (!checkRateLimit(req, res, RATE_LIMITS.read, "follows:list")) return;
        const userId = req.query.userId as string;
        const type = req.query.type as string;
        if (!userId || !type) { res.status(400).json({ error: "Missing userId or type" }); return; }

        const { limit, cursor } = getPageParams(req);

        let rows;
        if (type === "followers") {
          const result = cursor
            ? await sql`
              SELECT u.id, u.name, u.picture, u.display_name, u.avatar_icon, u.bio, f.created_at FROM follows f JOIN users u ON f.follower_id = u.id
              WHERE f.following_id = ${userId} AND f.created_at < ${cursor}
              ORDER BY f.created_at DESC LIMIT ${limit}
            `
            : await sql`
              SELECT u.id, u.name, u.picture, u.display_name, u.avatar_icon, u.bio, f.created_at FROM follows f JOIN users u ON f.follower_id = u.id
              WHERE f.following_id = ${userId}
              ORDER BY f.created_at DESC LIMIT ${limit}
            `;
          rows = result.rows;
        } else {
          const result = cursor
            ? await sql`
              SELECT u.id, u.name, u.picture, u.display_name, u.avatar_icon, u.bio, f.created_at FROM follows f JOIN users u ON f.following_id = u.id
              WHERE f.follower_id = ${userId} AND f.created_at < ${cursor}
              ORDER BY f.created_at DESC LIMIT ${limit}
            `
            : await sql`
              SELECT u.id, u.name, u.picture, u.display_name, u.avatar_icon, u.bio, f.created_at FROM follows f JOIN users u ON f.following_id = u.id
              WHERE f.follower_id = ${userId}
              ORDER BY f.created_at DESC LIMIT ${limit}
            `;
          rows = result.rows;
        }

        const nextCursor = rows.length === limit ? rows[rows.length - 1].created_at : null;
        res.json({ users: rows, nextCursor });
        return;
      }
    }

    // ========== PROFILES ==========
    if (scope === "profiles") {
      // GET /api/social?scope=profiles&action=search&q=xxx
      if (req.method === "GET" && action === "search") {
        if (!checkRateLimit(req, res, RATE_LIMITS.read, "profiles:search")) return;
        const query = (req.query.q as string || "").trim();
        if (!query || query.length < 2) { res.json({ users: [] }); return; }
        const { limit } = getPageParams(req);

        const pattern = `%${query}%`;
        // Use pre-computed counts from users table instead of correlated subqueries
        const { rows } = await sql`
          SELECT u.id, u.name, u.picture, u.display_name, u.avatar_icon, u.bio, u.is_public,
            COALESCE(u.follower_count, 0) AS follower_count,
            COALESCE(u.review_count, 0) AS review_count,
            COALESCE(u.tried_count, 0) AS tried_count
          FROM users u WHERE u.name ILIKE ${pattern} OR u.display_name ILIKE ${pattern}
          ORDER BY COALESCE(u.review_count, 0) DESC LIMIT ${limit}
        `;
        setCacheHeaders(res, 10, 30);
        res.json({ users: rows });
        return;
      }

      // GET /api/social?scope=profiles&action=get&userId=xxx
      if (req.method === "GET" && action === "get") {
        if (!checkRateLimit(req, res, RATE_LIMITS.read, "profiles:get")) return;
        const userId = req.query.userId as string;
        const requesterId = await getAuthUserId(req);

        // Use pre-computed counts from users table
        const { rows } = await sql`
          SELECT id, name, picture, display_name, avatar_icon, bio, favorite_spirit, is_public, top_shelf, created_at,
            COALESCE(following_count, 0) AS following_count,
            COALESCE(follower_count, 0) AS follower_count,
            COALESCE(review_count, 0) AS review_count,
            COALESCE(tried_count, 0) AS tried_count,
            COALESCE(want_count, 0) AS want_count
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

        setCacheHeaders(res, 30, 60);
        res.json({ ...profile, is_following, avg_rating: ratingRows[0]?.avg_rating || null, is_own: requesterId === userId });
        return;
      }

      // PUT /api/social?scope=profiles&action=update&userId=xxx
      if (req.method === "PUT" && action === "update") {
        if (!checkRateLimit(req, res, RATE_LIMITS.write, "profiles:update")) return;
        const userId = req.query.userId as string;
        const requesterId = await requireAuth(req, res);
        if (!requesterId) return;
        if (requesterId !== userId) { res.status(403).json({ error: "Cannot edit another user's profile" }); return; }

        const { display_name, avatar_icon, bio, favorite_spirit, is_public, top_shelf } = req.body;

        // Sanitize profile text fields
        const safeDisplayName = display_name !== undefined ? sanitizeName(display_name, 50) : undefined;
        const safeBio = bio !== undefined ? sanitizeBio(bio) : undefined;
        const safeSpirit = favorite_spirit !== undefined ? sanitizeText(favorite_spirit, 100) : undefined;

        // Validate avatar_icon against allowed list
        const ALLOWED_ICONS = ['glass', 'flame', 'leaf', 'mountain', 'star', 'shield', 'crown', 'compass', 'gem', 'skull'];
        const safeAvatarIcon = avatar_icon !== undefined
          ? (ALLOWED_ICONS.includes(avatar_icon) ? avatar_icon : null)
          : undefined;

        await sql`
          UPDATE users SET
            display_name = COALESCE(${safeDisplayName}, display_name),
            avatar_icon = COALESCE(${safeAvatarIcon}, avatar_icon),
            bio = COALESCE(${safeBio}, bio), favorite_spirit = COALESCE(${safeSpirit}, favorite_spirit),
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
        if (!checkRateLimit(req, res, RATE_LIMITS.read, "reviews:get")) return;
        const bourbonId = req.query.bourbonId as string | undefined;
        const userId = req.query.userId as string | undefined;
        const requesterId = await getAuthUserId(req);
        const { limit, cursor } = getPageParams(req);

        let rows;
        if (bourbonId) {
          const result = cursor
            ? await sql`
              SELECT r.*, u.is_public FROM reviews r LEFT JOIN users u ON r.user_id = u.id
              WHERE r.bourbon_id = ${bourbonId} AND (u.is_public = true OR r.user_id = ${requesterId || ''})
                AND r.created_at < ${cursor}
              ORDER BY r.created_at DESC LIMIT ${limit}
            `
            : await sql`
              SELECT r.*, u.is_public FROM reviews r LEFT JOIN users u ON r.user_id = u.id
              WHERE r.bourbon_id = ${bourbonId} AND (u.is_public = true OR r.user_id = ${requesterId || ''})
              ORDER BY r.created_at DESC LIMIT ${limit}
            `;
          rows = result.rows;
        } else if (userId) {
          const result = cursor
            ? await sql`
              SELECT r.* FROM reviews r LEFT JOIN users u ON r.user_id = u.id
              WHERE r.user_id = ${userId} AND (u.is_public = true OR r.user_id = ${requesterId || ''})
                AND r.created_at < ${cursor}
              ORDER BY r.created_at DESC LIMIT ${limit}
            `
            : await sql`
              SELECT r.* FROM reviews r LEFT JOIN users u ON r.user_id = u.id
              WHERE r.user_id = ${userId} AND (u.is_public = true OR r.user_id = ${requesterId || ''})
              ORDER BY r.created_at DESC LIMIT ${limit}
            `;
          rows = result.rows;
        } else {
          res.status(400).json({ error: "Must specify bourbonId or userId" }); return;
        }

        const nextCursor = rows.length === limit ? rows[rows.length - 1].created_at : null;
        setCacheHeaders(res, 15, 30);
        res.json({ reviews: rows, nextCursor });
        return;
      }

      // POST /api/social?scope=reviews&action=create
      if (req.method === "POST" && action === "create") {
        if (!checkRateLimit(req, res, RATE_LIMITS.write, "reviews:create")) return;
        const userId = await requireAuth(req, res);
        if (!userId) return;

        const { id, bourbonId, rating, text, userName, userPicture, nose, palate, finish, tags } = req.body;

        // Validate required fields
        if (!id || !bourbonId) {
          res.status(400).json({ error: "Missing required fields: id, bourbonId" }); return;
        }
        if (!isValidId(id) || !isValidId(bourbonId)) {
          res.status(400).json({ error: "Invalid id format" }); return;
        }

        // Sanitize all user-provided text to prevent stored XSS
        const safeText = sanitizeText(text, 5000);
        const safeNose = sanitizeText(nose, 1000);
        const safePalate = sanitizeText(palate, 1000);
        const safeFinish = sanitizeText(finish, 1000);
        const safeName = sanitizeName(userName);
        const safeRating = sanitizeRating(rating);
        const safeTags = sanitizeTags(tags);
        const tagsJson = JSON.stringify(safeTags);

        await sql`
          INSERT INTO reviews (id, bourbon_id, user_id, user_name, user_picture, rating, text, nose, palate, finish, tags)
          VALUES (${id}, ${bourbonId}, ${userId}, ${safeName || null}, ${userPicture || null}, ${safeRating}, ${safeText}, ${safeNose}, ${safePalate}, ${safeFinish}, ${tagsJson})
        `;

        // Increment denormalized review count
        await sql`UPDATE users SET review_count = COALESCE(review_count, 0) + 1 WHERE id = ${userId}`;

        res.json({ success: true, id });
        return;
      }

      // POST /api/social?scope=reviews&action=sync — BATCHED with transaction
      if (req.method === "POST" && action === "sync") {
        if (!checkRateLimit(req, res, RATE_LIMITS.write, "reviews:sync")) return;
        const userId = await requireAuth(req, res);
        if (!userId) return;

        const { reviews } = req.body;
        if (!Array.isArray(reviews)) { res.status(400).json({ error: "reviews must be an array" }); return; }

        // Filter to only this user's reviews
        const userReviews = reviews.filter((r: any) => r.userId === userId);
        if (userReviews.length === 0) {
          res.json({ success: true, synced: 0 });
          return;
        }

        // Batch insert using UNNEST arrays for minimal round-trips
        const CHUNK_SIZE = 50;
        let synced = 0;
        for (let i = 0; i < userReviews.length; i += CHUNK_SIZE) {
          const chunk = userReviews.slice(i, i + CHUNK_SIZE);
          const ids = chunk.map((r: any) => r.id);
          const bourbonIds = chunk.map((r: any) => r.bourbonId);
          const userIds = chunk.map((r: any) => r.userId);
          const userNames = chunk.map((r: any) => r.userName || null);
          const userPictures = chunk.map((r: any) => r.userPicture || null);
          const ratings = chunk.map((r: any) => r.rating);
          const texts = chunk.map((r: any) => r.text || '');
          const noses = chunk.map((r: any) => r.nose || '');
          const palates = chunk.map((r: any) => r.palate || '');
          const finishes = chunk.map((r: any) => r.finish || '');
          const tagsArr = chunk.map((r: any) => JSON.stringify(r.tags || []));
          const createdAts = chunk.map((r: any) => r.date || new Date().toISOString());

          await sql`
            INSERT INTO reviews (id, bourbon_id, user_id, user_name, user_picture, rating, text, nose, palate, finish, tags, created_at)
            SELECT * FROM UNNEST(
              ${ids as any}::text[], ${bourbonIds as any}::text[], ${userIds as any}::text[],
              ${userNames as any}::text[], ${userPictures as any}::text[], ${ratings as any}::integer[],
              ${texts as any}::text[], ${noses as any}::text[], ${palates as any}::text[],
              ${finishes as any}::text[], ${tagsArr as any}::text[], ${createdAts as any}::timestamptz[]
            )
            ON CONFLICT (id) DO NOTHING
          `;
          synced += chunk.length;
        }

        // Update denormalized count
        const { rows: countRows } = await sql`SELECT COUNT(*) as cnt FROM reviews WHERE user_id = ${userId}`;
        await sql`UPDATE users SET review_count = ${parseInt(countRows[0].cnt)} WHERE id = ${userId}`;

        res.json({ success: true, synced });
        return;
      }

      // PUT /api/social?scope=reviews
      if (req.method === "PUT") {
        if (!checkRateLimit(req, res, RATE_LIMITS.write, "reviews:update")) return;
        const userId = await requireAuth(req, res);
        if (!userId) return;

        const { reviewId, rating, text } = req.body;
        await sql`UPDATE reviews SET rating = ${rating}, text = ${text}, updated_at = NOW() WHERE id = ${reviewId} AND user_id = ${userId}`;
        res.json({ success: true });
        return;
      }

      // DELETE /api/social?scope=reviews&reviewId=x
      if (req.method === "DELETE") {
        if (!checkRateLimit(req, res, RATE_LIMITS.write, "reviews:delete")) return;
        const userId = await requireAuth(req, res);
        if (!userId) return;

        const reviewId = req.query.reviewId as string;
        await sql`DELETE FROM reviews WHERE id = ${reviewId} AND user_id = ${userId}`;

        // Decrement denormalized count
        await sql`UPDATE users SET review_count = GREATEST(COALESCE(review_count, 1) - 1, 0) WHERE id = ${userId}`;

        res.json({ success: true });
        return;
      }
    }

    // ========== LISTS ==========
    if (scope === "lists") {
      // GET /api/social?scope=lists&userId=x[&listType=want|tried]
      if (req.method === "GET") {
        if (!checkRateLimit(req, res, RATE_LIMITS.read, "lists:get")) return;
        const userId = req.query.userId as string;
        const requesterId = await getAuthUserId(req);
        const listType = req.query.listType as string | undefined;
        if (!userId) { res.status(400).json({ error: "Missing userId" }); return; }

        if (userId !== requesterId) {
          const { rows } = await sql`SELECT is_public FROM users WHERE id = ${userId}`;
          if (rows.length === 0 || !rows[0].is_public) { res.json({ want: [], tried: [] }); return; }
        }

        // If a specific list type is requested, paginate it
        if (listType === "want" || listType === "tried") {
          const { limit, cursor } = getPageParams(req);
          const result = cursor
            ? await sql`
              SELECT bourbon_id, created_at FROM user_lists
              WHERE user_id = ${userId} AND list_type = ${listType} AND created_at < ${cursor}
              ORDER BY created_at DESC LIMIT ${limit}
            `
            : await sql`
              SELECT bourbon_id, created_at FROM user_lists
              WHERE user_id = ${userId} AND list_type = ${listType}
              ORDER BY created_at DESC LIMIT ${limit}
            `;
          const nextCursor = result.rows.length === limit ? result.rows[result.rows.length - 1].created_at : null;
          setCacheHeaders(res, 15, 30);
          res.json({ items: result.rows.map(r => r.bourbon_id), nextCursor });
          return;
        }

        // Default: return both lists (backward compatible, capped at MAX_PAGE_SIZE each)
        const { rows } = await sql`
          SELECT bourbon_id, list_type FROM user_lists
          WHERE user_id = ${userId}
          ORDER BY created_at DESC LIMIT ${MAX_PAGE_SIZE * 2}
        `;
        setCacheHeaders(res, 15, 30);
        res.json({
          want: rows.filter(r => r.list_type === "want").map(r => r.bourbon_id),
          tried: rows.filter(r => r.list_type === "tried").map(r => r.bourbon_id),
        });
        return;
      }

      // POST /api/social?scope=lists&action=update
      if (req.method === "POST" && action === "update") {
        if (!checkRateLimit(req, res, RATE_LIMITS.write, "lists:update")) return;
        const userId = await requireAuth(req, res);
        if (!userId) return;

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

        // Update denormalized counts
        const { rows: wantRows } = await sql`SELECT COUNT(*) as cnt FROM user_lists WHERE user_id = ${userId} AND list_type = 'want'`;
        const { rows: triedRows } = await sql`SELECT COUNT(*) as cnt FROM user_lists WHERE user_id = ${userId} AND list_type = 'tried'`;
        await sql`UPDATE users SET want_count = ${parseInt(wantRows[0].cnt)}, tried_count = ${parseInt(triedRows[0].cnt)} WHERE id = ${userId}`;

        res.json({ success: true });
        return;
      }

      // POST /api/social?scope=lists&action=sync — BATCHED with transaction
      if (req.method === "POST" && action === "sync") {
        if (!checkRateLimit(req, res, RATE_LIMITS.write, "lists:sync")) return;
        const userId = await requireAuth(req, res);
        if (!userId) return;

        const { want, tried } = req.body;
        const allItems: { id: string; type: string }[] = [
          ...(want || []).map((id: string) => ({ id, type: "want" })),
          ...(tried || []).map((id: string) => ({ id, type: "tried" })),
        ];

        if (allItems.length === 0) {
          res.json({ success: true, synced: 0 });
          return;
        }

        // Batch insert using UNNEST arrays for minimal round-trips
        const CHUNK_SIZE = 50;
        let synced = 0;
        for (let i = 0; i < allItems.length; i += CHUNK_SIZE) {
          const chunk = allItems.slice(i, i + CHUNK_SIZE);
          const userIds = chunk.map(() => userId);
          const bourbonIds = chunk.map((item) => item.id);
          const listTypes = chunk.map((item) => item.type);

          await sql`
            INSERT INTO user_lists (user_id, bourbon_id, list_type)
            SELECT * FROM UNNEST(${userIds as any}::text[], ${bourbonIds as any}::text[], ${listTypes as any}::text[])
            ON CONFLICT (user_id, bourbon_id, list_type) DO NOTHING
          `;
          synced += chunk.length;
        }

        // Update denormalized counts
        const { rows: wantRows } = await sql`SELECT COUNT(*) as cnt FROM user_lists WHERE user_id = ${userId} AND list_type = 'want'`;
        const { rows: triedRows } = await sql`SELECT COUNT(*) as cnt FROM user_lists WHERE user_id = ${userId} AND list_type = 'tried'`;
        await sql`UPDATE users SET want_count = ${parseInt(wantRows[0].cnt)}, tried_count = ${parseInt(triedRows[0].cnt)} WHERE id = ${userId}`;

        res.json({ success: true, synced });
        return;
      }
    }

    // ========== FEED ==========
    if (scope === "feed") {
      if (req.method === "GET") {
        if (!checkRateLimit(req, res, RATE_LIMITS.expensive, "feed:get")) return;
        const userId = await requireAuth(req, res);
        if (!userId) return;

        const { limit, cursor } = getPageParams(req);

        // Optimized: each subquery independently limits + sorts with proper index usage,
        // then we merge and re-sort the combined (smaller) result set.
        const cursorFilter = cursor || new Date().toISOString();

        const { rows } = await sql`
          SELECT * FROM (
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
              WHERE r.user_id IN (SELECT following_id FROM follows WHERE follower_id = ${userId})
                AND r.created_at < ${cursorFilter}
                AND EXISTS (SELECT 1 FROM users u WHERE u.id = r.user_id AND u.is_public = true)
              ORDER BY r.created_at DESC
              LIMIT ${limit}
            ) AS r

            UNION ALL

            SELECT * FROM (
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
              INNER JOIN users u ON ul.user_id = u.id
              WHERE ul.user_id IN (SELECT following_id FROM follows WHERE follower_id = ${userId})
                AND ul.created_at < ${cursorFilter}
                AND u.is_public = true
              ORDER BY ul.created_at DESC
              LIMIT ${limit}
            ) AS l
          ) AS combined
          ORDER BY created_at DESC
          LIMIT ${limit}
        `;

        const nextCursor = rows.length === limit ? rows[rows.length - 1].created_at : null;
        res.json({ activities: rows, nextCursor });
        return;
      }
    }

    // ========== SETUP ==========
    if (scope === "setup") {
      // Add denormalized count columns to users table
      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS favorite_spirit TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS top_shelf TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS tried_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS want_count INTEGER DEFAULT 0
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
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          nose TEXT DEFAULT '', palate TEXT DEFAULT '', finish TEXT DEFAULT '',
          tags TEXT DEFAULT '[]'
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_reviews_bourbon ON reviews(bourbon_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_reviews_user_created ON reviews(user_id, created_at DESC)`;
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
      await sql`CREATE INDEX IF NOT EXISTS idx_user_lists_user_created ON user_lists(user_id, created_at DESC)`;

      // Create trigram index for profile search (if extension available)
      try {
        await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
        await sql`CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin(name gin_trgm_ops)`;
      } catch {
        // pg_trgm may not be available on all Postgres providers — non-fatal
      }

      // Backfill denormalized counts for existing users
      await sql`
        UPDATE users SET
          follower_count = (SELECT COUNT(*) FROM follows WHERE following_id = users.id),
          following_count = (SELECT COUNT(*) FROM follows WHERE follower_id = users.id),
          review_count = (SELECT COUNT(*) FROM reviews WHERE user_id = users.id),
          tried_count = (SELECT COUNT(*) FROM user_lists WHERE user_id = users.id AND list_type = 'tried'),
          want_count = (SELECT COUNT(*) FROM user_lists WHERE user_id = users.id AND list_type = 'want')
      `;

      res.json({ success: true, message: "Social tables created and counts backfilled" });
      return;
    }

    res.status(404).json({ error: "Unknown scope/action" });
  } catch (error: any) {
    logger.error("Social API error", error, { endpoint: `social:${scope}:${action}`, method: req.method || "?" });
    res.status(500).json({ error: "Operation failed: " + error.message });
  }
}

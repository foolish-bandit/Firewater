import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "@vercel/postgres";
import { getAdminEmail } from "./_auth";
import { logger } from "./_logger";

/**
 * SQL Migration Framework
 *
 * Each migration has a unique ID (timestamp-based), a description, and an up() function.
 * Migrations run in order and are tracked in a `_migrations` table.
 * Only admin users can trigger migrations via POST /api/migrate.
 *
 * Usage:
 *   POST /api/migrate (with admin JWT) — runs all pending migrations
 *   GET  /api/migrate (with admin JWT) — lists migration status
 */

interface Migration {
  id: string;
  description: string;
  up: () => Promise<void>;
}

const migrations: Migration[] = [
  {
    id: "001_create_users",
    description: "Create users table with auth fields",
    up: async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE,
          phone TEXT UNIQUE,
          name TEXT NOT NULL,
          picture TEXT,
          password_hash TEXT,
          auth_provider TEXT NOT NULL,
          google_id TEXT UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    },
  },
  {
    id: "002_create_social_tables",
    description: "Create follows, reviews, user_lists tables with indexes",
    up: async () => {
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
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          nose TEXT DEFAULT '', palate TEXT DEFAULT '', finish TEXT DEFAULT '',
          tags TEXT DEFAULT '[]'
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
    },
  },
  {
    id: "003_create_photos",
    description: "Create photos table with indexes",
    up: async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS photos (
          id TEXT PRIMARY KEY, bourbon_id TEXT NOT NULL, user_id TEXT NOT NULL,
          user_email TEXT NOT NULL, user_name TEXT, blob_url TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          reviewed_at TIMESTAMPTZ, reviewed_by TEXT
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_photos_bourbon_status ON photos(bourbon_id, status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_photos_status ON photos(status)`;
    },
  },
  {
    id: "004_denormalize_counts",
    description: "Add denormalized count columns to users and new indexes",
    up: async () => {
      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS tried_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS want_count INTEGER DEFAULT 0
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_reviews_user_created ON reviews(user_id, created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_user_lists_user_created ON user_lists(user_id, created_at DESC)`;

      // Backfill counts
      await sql`
        UPDATE users SET
          follower_count = (SELECT COUNT(*) FROM follows WHERE following_id = users.id),
          following_count = (SELECT COUNT(*) FROM follows WHERE follower_id = users.id),
          review_count = (SELECT COUNT(*) FROM reviews WHERE user_id = users.id),
          tried_count = (SELECT COUNT(*) FROM user_lists WHERE user_id = users.id AND list_type = 'tried'),
          want_count = (SELECT COUNT(*) FROM user_lists WHERE user_id = users.id AND list_type = 'want')
      `;
    },
  },
  {
    id: "005_trigram_search",
    description: "Add pg_trgm index for profile search",
    up: async () => {
      try {
        await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
        await sql`CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin(name gin_trgm_ops)`;
      } catch {
        // pg_trgm may not be available — non-fatal
        console.warn("pg_trgm extension not available, skipping trigram index");
      }
    },
  },
  {
    id: "006_add_display_name_avatar",
    description: "Add display_name and avatar_icon columns to users",
    up: async () => {
      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS display_name TEXT,
        ADD COLUMN IF NOT EXISTS avatar_icon TEXT
      `;
      // Allow searching by display_name
      try {
        await sql`CREATE INDEX IF NOT EXISTS idx_users_display_name_trgm ON users USING gin(display_name gin_trgm_ops)`;
      } catch {
        // pg_trgm may not be available
      }
    },
  },
];

async function ensureMigrationsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      description TEXT,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const { rows } = await sql`SELECT id FROM _migrations ORDER BY applied_at`;
  return new Set(rows.map(r => r.id));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow migration via admin JWT or via ?key= query param matching MIGRATE_KEY env var
  const adminEmail = getAdminEmail(req);
  const migrateKey = process.env.MIGRATE_KEY;
  const queryKey = typeof req.query.key === "string" ? req.query.key : null;
  const keyMatch = migrateKey && queryKey && migrateKey === queryKey;

  if (!adminEmail && !keyMatch) {
    res.status(403).json({ error: "Admin access required. Set MIGRATE_KEY env var and pass ?key=<value> to run without auth." });
    return;
  }

  try {
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();

    // GET — show migration status
    if (req.method === "GET") {
      const status = migrations.map(m => ({
        id: m.id,
        description: m.description,
        applied: applied.has(m.id),
      }));
      res.json({ migrations: status });
      return;
    }

    // POST — run pending migrations
    if (req.method === "POST") {
      const pending = migrations.filter(m => !applied.has(m.id));

      if (pending.length === 0) {
        res.json({ message: "All migrations already applied", applied: migrations.length });
        return;
      }

      const results: { id: string; description: string; status: string }[] = [];

      for (const migration of pending) {
        try {
          logger.info(`Running migration ${migration.id}`, {
            endpoint: "migrate",
            method: "POST",
            userId: adminEmail,
          });

          await migration.up();
          await sql`INSERT INTO _migrations (id, description) VALUES (${migration.id}, ${migration.description})`;
          results.push({ id: migration.id, description: migration.description, status: "applied" });
        } catch (err: any) {
          logger.error(`Migration ${migration.id} failed`, err, {
            endpoint: "migrate",
            method: "POST",
            userId: adminEmail,
          });
          results.push({ id: migration.id, description: migration.description, status: `failed: ${err.message}` });
          // Stop on first failure — don't run subsequent migrations
          break;
        }
      }

      res.json({ results });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    logger.error("Migration handler error", error, { endpoint: "migrate", method: req.method || "?" });
    res.status(500).json({ error: "Migration failed: " + error.message });
  }
}

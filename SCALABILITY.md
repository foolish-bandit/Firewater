# Scalability Assessment: Firewater

**Date:** 2026-03-23
**Status:** Not production-ready for thousands of concurrent users

---

## Executive Summary

Firewater is a well-built liquor discovery and social platform, but it has several
architectural gaps that would cause failures, security breaches, or severe degradation
under thousands of concurrent users. The issues fall into three severity tiers:
**critical** (will break), **high** (will degrade badly), and **moderate** (should fix).

---

## Critical Issues

### 1. No Authentication — Header-Based Trust (SECURITY)

**Impact:** Any user can impersonate any other user.

Every authenticated API endpoint trusts the `x-user-id` header sent by the client:
```ts
// api/social.ts — every mutation trusts this header
const userId = req.headers["x-user-id"] as string;
```

There are no server-side sessions, JWTs, or tokens. The user object lives in
`localStorage` and the frontend sends the user ID as a plain header. Any HTTP client
(curl, Postman, malicious script) can send any user ID and perform actions as that user
— follow/unfollow, write reviews, delete reviews, modify profiles.

**At scale this means:** A single bad actor can corrupt data for every user in the system.

**Fix:** Implement server-side sessions or JWT tokens. Validate the token on every
request and extract the user ID from the verified token, not from a client header.

### 2. No Rate Limiting

**Impact:** Denial of service, abuse, and cost explosion.

No API endpoints have rate limiting. Every request hits the database directly via
Vercel serverless functions. At thousands of users:

- A bot can scrape every profile, review, and photo
- Malicious users can spam reviews, follows, and photo uploads
- Gemini API calls (semantic search) have no throttle — costs scale linearly
- Vercel Postgres connection limits can be exhausted

**Fix:** Add rate limiting middleware (e.g., `@vercel/edge` rate limiter, Upstash Redis
rate limiter, or Vercel's built-in WAF rules). Rate limit by IP and by authenticated user.

### 3. Review Sync Loop — O(n) Sequential Queries

**Impact:** Timeout and database connection exhaustion.

```ts
// api/social.ts:180 — reviews sync
for (const r of reviews) {
  await sql`INSERT INTO reviews ... ON CONFLICT (id) DO NOTHING`;
}
```

The list sync has the same pattern:
```ts
// api/social.ts:259 — list sync
for (const bourbonId of (want || [])) {
  await sql`INSERT INTO user_lists ... ON CONFLICT DO NOTHING`;
}
```

Each item is a separate `await`ed query. A user with 200 reviews triggers 200 serial
round-trips. Vercel serverless functions have a 10-second timeout (Hobby) or 60-second
(Pro). A large sync will timeout, leaving data partially written with no rollback.

**Fix:** Use batch inserts (`INSERT INTO ... VALUES (...), (...), (...)`) or use
database transactions with `UNNEST` arrays. Process in chunks of 50-100 at a time.

---

## High-Severity Issues

### 4. Expensive Correlated Subqueries on Every Profile View

**Impact:** Slow responses as data grows, database CPU saturation.

```sql
-- api/social.ts:81-87 — profile endpoint runs 5 COUNT subqueries
SELECT id, name, ...,
  (SELECT COUNT(*) FROM follows WHERE follower_id = id) AS following_count,
  (SELECT COUNT(*) FROM follows WHERE following_id = id) AS follower_count,
  (SELECT COUNT(*) FROM reviews WHERE user_id = id) AS review_count,
  (SELECT COUNT(*) FROM user_lists WHERE user_id = id AND list_type = 'tried') AS tried_count,
  (SELECT COUNT(*) FROM user_lists WHERE user_id = id AND list_type = 'want') AS want_count
FROM users WHERE id = $1
```

The profile search endpoint is even worse — it runs these subqueries for up to 20 users:
```sql
-- api/social.ts:64-71 — search runs 3 COUNT subqueries × 20 rows
SELECT u.id, u.name, ...,
  (SELECT COUNT(*) FROM follows WHERE following_id = u.id),
  (SELECT COUNT(*) FROM reviews WHERE user_id = u.id),
  (SELECT COUNT(*) FROM user_lists WHERE user_id = u.id AND list_type = 'tried')
FROM users u WHERE u.name ILIKE $1
ORDER BY (SELECT COUNT(*) FROM reviews WHERE user_id = u.id) DESC
```

With 10,000 users, 50,000 reviews, and 100,000 list items, each profile search triggers
80+ sequential index scans.

**Fix:** Denormalize counts into the `users` table (follower_count, review_count, etc.)
and update them via triggers or application-level increments. Or use materialized views.

### 5. Activity Feed — Full Table Scan via UNION ALL

**Impact:** Feed endpoint becomes unusable as data grows.

```sql
-- api/social.ts:278 — feed query
SELECT * FROM (
  SELECT ... FROM reviews r INNER JOIN follows f ...
  UNION ALL
  SELECT ... FROM user_lists ul INNER JOIN follows f ...
) AS activity
ORDER BY created_at DESC LIMIT 50
```

This scans all reviews and list items for all followed users, unions them, sorts the
entire result, and takes 50. With 1,000 active users each following 50 people, this
query touches hundreds of thousands of rows.

**Fix:** Create a dedicated `activity_feed` table that captures events as they happen
(fan-out on write), or add composite indexes on `(user_id, created_at DESC)` and
rewrite as a more targeted query with proper pagination.

### 6. No Pagination on Any Endpoint

**Impact:** Unbounded result sets crash clients and exhaust memory.

- Follower/following lists: returns ALL followers, no limit
- Reviews by bourbon: returns ALL reviews, no limit
- User lists: returns ALL items
- Only the feed has `LIMIT 50` — but no cursor for next page

A popular spirit with 5,000 reviews will send a multi-megabyte JSON response.

**Fix:** Add cursor-based pagination (using `created_at` + `id` as cursor) to all list
endpoints. Default page size of 20-50 with a max of 100.

### 7. No Database Migrations Framework

**Impact:** Schema changes are risky, no rollback capability.

Tables are created via admin-only "setup" endpoints that run `CREATE TABLE IF NOT EXISTS`
and `ALTER TABLE ADD COLUMN IF NOT EXISTS`. There's no version tracking, no migration
history, and no rollback path. Schema changes at scale require downtime or careful
manual coordination.

**Fix:** Adopt a migration tool (Prisma Migrate, Drizzle Kit, or raw SQL migrations
with a version table).

---

## Moderate Issues

### 8. localStorage as Primary Data Store

User sessions, lists, and reviews are stored in `localStorage` and synced to the
database opportunistically. If the sync fails (timeout, network error), data is silently
lost on the server side. Two devices will have different data with no conflict resolution.

**Fix:** Make the database the source of truth. Use localStorage only as a read cache
with proper invalidation.

### 9. No Error Monitoring or Observability

No structured logging, no error tracking (Sentry, etc.), no performance monitoring
beyond Vercel's built-in analytics. At scale, you'll be blind to errors and degradation.

### 10. Photo Upload Has No Size Limit Enforcement

The upload endpoint checks content type but doesn't enforce file size limits server-side.
A user could upload very large images, exhausting Vercel Blob storage and bandwidth.

### 11. No Test Suite

Zero automated tests. At scale, regressions from fixes to any of the above issues
will be undetectable until users report them.

### 12. ILIKE Search Without Full-Text Index

Profile search uses `WHERE u.name ILIKE $pattern` which requires a sequential scan.
With thousands of users, this becomes slow. Consider a `pg_trgm` GIN index or
full-text search.

---

## Scalability Roadmap (Recommended Priority)

| Priority | Issue | Effort |
|----------|-------|--------|
| **P0** | Add real authentication (JWT/sessions) | Medium |
| **P0** | Add rate limiting | Low-Medium |
| **P1** | Batch sync operations (reviews, lists) | Low |
| **P1** | Add pagination to all list endpoints | Medium |
| **P1** | Denormalize counts / fix profile queries | Medium |
| **P1** | Rewrite activity feed query | Medium |
| **P2** | Database migrations framework | Medium |
| **P2** | Make database the source of truth over localStorage | Medium |
| **P2** | Add error monitoring (Sentry) | Low |
| **P2** | Server-side photo size limits | Low |
| **P3** | Add automated test suite | High |
| **P3** | Full-text search index for profiles | Low |

---

## What's Already Good

- **Vercel serverless** scales horizontally out of the box — no server management
- **Vercel Postgres** handles connection pooling automatically
- **Code splitting** with 22 data volume chunks keeps bundle size manageable
- **Photo batching** in `PhotoContext` reduces API calls
- **Database indexes** exist on the key foreign keys
- **Offline-first design** with localStorage reduces server load for reads
- **CDN-backed blob storage** for photos scales naturally

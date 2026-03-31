# Scalability Assessment: Firewater

**Date:** 2026-03-23
**Status:** Production-ready for moderate scale (hundreds of concurrent users). Further hardening needed for thousands+.

---

## Executive Summary

Firewater has addressed its critical architectural gaps. JWT authentication, rate limiting,
batched sync, pagination, denormalized counts, and proper database indexes are all in place.
The remaining items are performance optimizations and reliability improvements for higher scale.

---

## Completed (Previously Critical/High)

### 1. JWT Authentication ✅
Server-side JWT tokens with 7-day expiry. All endpoints validate tokens via `Authorization: Bearer`.
Legacy `x-user-id` header fallback has been removed — no more impersonation risk.

### 2. Rate Limiting ✅
In-memory per-instance rate limiter with tiered limits:
- Auth: 10 req/min, Reads: 100 req/min, Writes: 30 req/min, Uploads: 10 req/min, Expensive: 20 req/min

### 3. Batched Sync with UNNEST ✅
Review and list sync operations use `INSERT ... SELECT FROM UNNEST(...)` for true batch inserts.
50 items per chunk → 1 query per chunk instead of 50.

### 4. Denormalized Counts ✅
Profile queries use pre-computed `follower_count`, `review_count`, `tried_count`, `want_count`
from the `users` table. No more correlated subqueries on profile views or search.

### 5. Cursor-Based Pagination ✅
All list endpoints (follows, reviews, feed, lists) support cursor-based pagination with
configurable `limit` (default 50, max 100) and `cursor` parameters.

### 6. Optimized Feed Query ✅
Each subquery in the UNION ALL independently limits + sorts before merging, preventing
full table scans.

### 7. Database Migrations Framework ✅
5 tracked migrations with version table (`_migrations`). Idempotent, admin-only endpoint.

### 8. Trigram Search Index ✅
`pg_trgm` GIN index on `users.name` for fast ILIKE profile search.

### 9. Photo Size Enforcement ✅
Server-side 5MB limit on uploads.

### 10. HTTP Cache Headers ✅
`Cache-Control` with `s-maxage` and `stale-while-revalidate` on cacheable read endpoints
(profile search: 10s, profile view: 30s, reviews: 15s, lists: 15s).

### 11. Atomic Follow Toggle ✅
Uses `INSERT ... ON CONFLICT DO NOTHING RETURNING` to avoid race conditions on concurrent
follow/unfollow requests.

---

## Remaining Improvements

### P1 — Reliability

#### 1. Replace In-Memory Rate Limiter with Redis
**Impact:** Current rate limiter is per-serverless-instance. Under load with multiple
instances, each gets its own counter — a user can exceed limits by hitting different instances.

**Fix:** Use Upstash Redis (`@upstash/ratelimit`) for global rate limiting across all instances.
Upstash has a free tier and Vercel integration.

#### 2. Make Denormalized Count Updates Atomic
**Impact:** Follow toggle and list updates increment/decrement counts in separate queries.
If one fails, counts drift from reality.

**Fix:** Wrap count updates in transactions, or periodically reconcile with a background job.

### P2 — Performance

#### 3. Connection Pooling Awareness
Vercel Postgres handles pooling automatically, but under high concurrency the pool can
exhaust. Monitor connection usage via Vercel dashboard.

#### 4. CDN Edge Caching for Static API Responses
Profile and review data could be served from Vercel's Edge Cache with longer TTLs
and cache invalidation on writes.

### P3 — Observability & Quality

#### 5. Error Monitoring (Sentry)
No structured error tracking. Add Sentry for serverless function error capture,
performance monitoring, and alerting.

#### 6. Automated Test Suite
Vitest is installed but no tests exist. Critical paths to test:
- Auth flow (signup, signin, token validation)
- Follow toggle atomicity
- Batch sync correctness
- Rate limiting behavior
- Pagination cursor handling

#### 7. Database Source of Truth over localStorage
localStorage is used as primary store with sync to DB. Multi-device usage can cause
conflicts. Make DB the source of truth and use localStorage as a read-through cache only.

---

## Architecture Summary

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | React 19 SPA + Vite 6 | Code-split into 22 chunks |
| API | Vercel Serverless Functions | Rate-limited, JWT-protected |
| Database | Vercel Postgres | Indexed, denormalized counts |
| Storage | Vercel Blob (CDN) | 5MB upload limit |
| Auth | JWT + Google OAuth + Email/Phone | 7-day tokens |
| Cache | HTTP Cache-Control + localStorage | s-maxage on reads |
| Search | pg_trgm GIN index + Gemini AI | Trigram + semantic search |
| Monitoring | Vercel Analytics + Speed Insights | No Sentry yet |

---

## What's Already Good

- **Vercel serverless** scales horizontally out of the box
- **Vercel Postgres** handles connection pooling automatically
- **Code splitting** with 22 data volume chunks keeps bundle size manageable
- **Photo batching** in `PhotoContext` reduces API calls
- **Database indexes** on all key foreign keys and search columns
- **Offline-first design** with localStorage reduces server load for reads
- **CDN-backed blob storage** for photos scales naturally
- **Structured logging** via `_logger.ts` ready for Sentry upgrade

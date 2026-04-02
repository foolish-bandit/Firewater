# CLAUDE.md

## What This Is

Firewater (firewater.app) is a liquor discovery app — search, filter, save, review, and explore a catalog of ~2,000+ spirits (bourbon, scotch, rye, gin, tequila, etc.). Mobile-first with Capacitor iOS wrapper, deployed on Vercel.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS 4 (v4 `@theme` syntax, NOT v3 `tailwind.config.js`), React Router 7, TanStack Query, Motion (framer-motion successor), Recharts, Lucide React icons
- **Auth:** Clerk (`@clerk/react` + `@clerk/backend`). ClerkProvider wraps the app in `main.tsx`. API auth via `api/_auth.ts` → `verifyToken` from `@clerk/backend`. Client uses `apiFetch()` from `src/api.ts` which auto-attaches Clerk session tokens.
- **Backend:** Vercel Serverless Functions (TypeScript, `api/` directory). Each file = one endpoint. Shared middleware in `api/_*.ts` files (auth, CORS, rate limiting, sanitization, logging).
- **Database:** Vercel Postgres (`@vercel/postgres` → `sql` template literals). Used for users, reviews, lists, follows, photos.
- **Storage:** Vercel Blob for photo uploads. Upstash Redis for global rate limiting.
- **AI:** Google Gemini 2.5 Flash (`@google/genai`) for generating liquor data from user submissions (see `src/services/geminiService.ts`).
- **Mobile:** Capacitor 8 for iOS. Native features: Camera (barcode scanning via html5-qrcode), Haptics, StatusBar, SplashScreen. Build: `npm run build:ios && cap sync ios`.
- **Testing:** Vitest. Tests in `tests/`. Run: `npm test`.
- **Dev server:** `npm run dev` → `tsx server.ts` (Express + Vite dev server with HMR).

## Project Structure

```
api/                    # Vercel serverless functions (each .ts = endpoint)
  _auth.ts              # Clerk token verification middleware
  _cors.ts              # CORS middleware
  _rateLimit.ts         # In-memory per-instance rate limiter
  _rateLimitGlobal.ts   # Upstash Redis global rate limiter
  _sanitize.ts          # Input sanitization
  _logger.ts            # Request logging
  auth/                 # Auth endpoints (signin, signup, session, etc.)
  catalog.ts            # GET /api/catalog — search, filter, paginate spirits
  social.ts             # Reviews, lists, follows, profiles (biggest API file)
  photos/               # Photo upload + admin moderation
  migrate.ts            # DB migrations (admin-only)
src/
  App.tsx               # Root component — routing, nav bars, state wiring (~660 lines)
  main.tsx              # Entry point — ClerkProvider, BrowserRouter, ErrorBoundary
  api.ts                # apiFetch() — authenticated fetch wrapper with offline queue
  types.ts              # User, Review, UserProfile, UserSearchResult
  liquorTypes.ts        # Liquor, FlavorProfile interfaces
  data.ts               # Assembles ALL_LIQUORS from 117 data volume files
  data/                 # Static spirit data (~37K lines across 117 .ts files)
  components/           # All UI components (no nested folders)
    HomeView.tsx         # Homepage
    CatalogView.tsx      # Browse/search/filter catalog
    DetailView.tsx       # Individual liquor page with reviews
    ListsView.tsx        # Want to Try + Tried & Tasted lists
    ProfileView.tsx      # User profiles with stats
    FeedView.tsx         # Social feed
    SubmitLiquorModal.tsx # Community submission flow (Gemini-powered)
    BarcodeScanner.tsx   # Camera barcode scanning
    AdminPanel.tsx       # Photo moderation (admin only)
    ChatBubble.tsx       # AI chat/recommendation engine
    ...
  hooks/                # Custom hooks (auth, catalog, lists, reviews, photos, etc.)
    useCustomLiquors.ts  # Community submissions stored in localStorage
    useLiquorLists.ts    # Want to Try / Tried & Tasted list management
    useReviews.ts        # Review CRUD
    useAuth.ts           # Clerk auth integration
    ...
  lib/                  # Utilities (Capacitor init, offline queue, query client, storage)
  services/             # External service clients (Gemini)
  contexts/             # React contexts (PhotoContext)
  utils/                # String utils (Levenshtein), flavor story generator, liquor utils
tests/                  # Vitest test files
```

## Skills

Load these before working on the relevant areas:

| Task | Skill to load |
|------|--------------|
| UI components, layout, styling, new views | `.claude/skills/frontend-design/SKILL.md` |
| UX decisions, flows, information architecture | `.claude/skills/ux-principles/SKILL.md` |
| Both skills for any homepage/catalog/detail page redesign work | Load both |

## Design System Rules

The app uses a custom design system defined in `src/index.css`. **Always use these — never invent new patterns.**

**CSS classes (not Tailwind utilities) for structural elements:**
- `surface-raised` — card/panel background with border and elevation
- `vintage-border`, `vintage-border-b`, etc. — themed borders
- `glass-surface` — frosted glass effect (nav bars)
- `micro-label` — small uppercase tracking-widest label text
- `btn`, `btn-primary`, `btn-secondary`, `btn-ghost` — buttons (with `btn-sm`, `btn-md`, `btn-lg` sizes)
- `seg-item`, `seg-item-active` — segmented control / filter tabs
- `badge`, `badge-accent`, `badge-muted`, `badge-solid` — tag/pill elements
- `card-elevated`, `card-elevated-hover` — elevation + hover lift
- `input-base` — form inputs
- `gold-glow` — accent glow effect on primary CTAs
- `gold-gradient-text` — gradient text for headlines
- `section-divider` — horizontal rule between sections
- `icon-toggle`, `icon-toggle-active` — toggle button states

**Tailwind semantic color tokens (use these, not raw hex):**
- Text: `text-on-surface`, `text-on-surface-secondary`, `text-on-surface-muted`, `text-on-surface-accent`
- Backgrounds: `bg-surface-base`, `bg-surface-raised`, `bg-surface-alt`
- Borders: `border-border-subtle`, `border-border-accent`, `border-border-accent-strong`

**Typography:**
- `font-serif` (Cormorant Garamond) — headlines, bottle names, descriptive text, search inputs
- `font-sans` (Montserrat) — labels, buttons, metadata, UI chrome
- `font-display` (Cinzel) — rarely used, display/logo contexts only

**Dark/light theming:** Supported via `data-theme` attribute on `<html>`. CSS vars switch automatically. Always use the semantic tokens above, never hardcode colors.

## Repo-Specific Rules

1. **Never edit files in `src/data/`.** The 117 data volume files are generated by `scripts/ingest-bourbons.ts`. If you need to change spirit data, modify the ingest script or add new volumes.

2. **Community submissions live in localStorage**, not the database. The `useCustomLiquors` hook (`src/hooks/useCustomLiquors.ts`) manages them under key `bs_customBourbons`. They merge into `allLiquors` at runtime. Don't confuse this with the static catalog.

3. **API middleware files are prefixed with `_`** (e.g., `api/_auth.ts`). These are shared helpers imported by endpoint files — they are NOT standalone endpoints. Vercel's `includeFiles` in `vercel.json` ensures they're bundled.

4. **Auth pattern:** Client calls `apiFetch()` from `src/api.ts` → auto-attaches Clerk bearer token → API endpoint calls `requireAuth()` or `getAuthUserId()` from `api/_auth.ts` → verifies via Clerk backend SDK. Never manually handle JWTs on the client.

5. **All API endpoints are in `api/` root or `api/auth/`.** No nested route folders beyond auth. `api/social.ts` is a mega-file (~600 lines) handling reviews, lists, follows, and profiles via query param routing (`?scope=reviews`, `?scope=lists`, etc.).

6. **Routing is in `App.tsx`** using React Router 7 `<Routes>`. All routes are flat (no nested routing). Nav bars (desktop top + mobile bottom) are also in `App.tsx`.

7. **State management:** No Redux/Zustand. State lives in custom hooks called from `App.tsx` and passed as props. TanStack Query handles server state caching. localStorage handles offline persistence for lists and custom liquors.

8. **Mobile-first layout.** The bottom tab bar (`App.tsx` ~line 595) is the primary nav on mobile. Desktop gets a horizontal top nav. When making layout changes, test both breakpoints — `md:` is the switchover.

9. **Capacitor considerations:** `src/lib/capacitor.ts` handles native init. Barcode scanning uses `html5-qrcode` (not a native plugin). The `safe-bottom` CSS class accounts for iOS home indicator. Camera permission is declared in `vercel.json` Permissions-Policy header.

10. **Type imports:** Liquor type and FlavorProfile are in `src/liquorTypes.ts`. User, Review, UserProfile are in `src/types.ts`. Don't duplicate these — import from the canonical location.

## Environment Variables

Required for full functionality (see `.env.example`):
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk (client-side, prefixed for Vite)
- `CLERK_SECRET_KEY` — Clerk (server-side)
- `GEMINI_API_KEY` — Google Gemini for submission generation
- `POSTGRES_URL` — Vercel Postgres connection string
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob for photo storage
- `ADMIN_EMAILS` — comma-separated admin emails
- `JWT_SECRET` — for legacy/dev auth token signing
- `APP_URL` — canonical app URL
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — global rate limiting (optional)

## Commands

```bash
npm run dev          # Local dev server (Express + Vite HMR) on :3000
npm run build        # Production build → dist/
npm run lint         # TypeScript type-check (tsc --noEmit)
npm test             # Run Vitest test suite
npm run ingest       # Run bourbon data ingestion script
npm run build:ios    # Build + sync Capacitor iOS project
npm run open:ios     # Open Xcode project
```

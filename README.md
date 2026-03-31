# FIREWATER

A liquor discovery, logging, and social app for spirit enthusiasts. Browse a curated catalog of 1000+ spirits across bourbon, scotch, vodka, gin, rum, tequila, brandy, rye whiskey, Irish whiskey, Japanese whisky, Canadian whisky, mezcal, cognac, armagnac, amaro, liqueurs, and more. Search with AI-powered semantic search, track your tasting journey, write detailed reviews, upload photos, follow other enthusiasts, and discover new favorites.

## Features

- **Liquor Catalog** — Browse, filter, and paginate through 1000+ spirits with category filters (High Proof, Wheated, Rye, Single Barrel, Under $50), advanced price/proof sliders, and sorting options
- **AI-Powered Search** — Semantic search powered by Google Gemini for natural-language queries like "smoky bourbon under $50"
- **AI Recommendations** — Personalized spirit recommendations based on your preferences
- **Tasting Lists** — "Want to Try" and "Tried" lists to track your spirit journey, synced to the database when logged in, with text and Excel export
- **Reviews & Ratings** — Star ratings with detailed tasting notes (nose, palate, finish), review tags (Neat, On the Rocks, Daily Sipper, etc.), and full CRUD support
- **Flavor Profiles** — Radar charts showing 12 flavor dimensions per spirit (sweetness, spice, oak, caramel, vanilla, fruit, nutty, floral, smoky, leather, heat, complexity)
- **Compare Spirits** — Side-by-side spirit comparison with flavor profile overlays
- **Barcode Scanner** — Scan bottle barcodes via camera or enter UPCs manually to quickly identify and log bottles
- **Photo Uploads** — Upload bottle photos with admin moderation and per-spirit photo galleries
- **User Profiles** — Public/private profiles with bio, favorite spirit, top shelf display, and review history
- **Social** — Follow/unfollow users, follower/following counts, user search and discovery, community activity feed
- **Community Submissions** — Submit new liquors to grow the catalog with an approval workflow
- **Authentication** — Google OAuth sign-in and email/phone authentication
- **Admin Panel** — Dashboard for moderating photos and community submissions
- **Dark/Light Theme** — Toggle between dark and light mode
- **Offline Support** — Online status detection with graceful degradation
- **PWA Ready** — Install prompt for adding to home screen

## Tech Stack

**Frontend:**
- React 19, TypeScript, Tailwind CSS 4, Vite 6
- React Router DOM for client-side routing
- Recharts for flavor profile radar charts
- Motion for animations
- Lucide React for icons
- html5-qrcode for barcode scanning
- XLSX for Excel export

**Backend & Infrastructure:**
- Express dev server with Vite middleware
- Vercel serverless functions (API routes)
- Vercel Postgres for user data, reviews, social features
- Vercel Blob for photo storage
- bcryptjs for password hashing

**AI:**
- Google Gemini for semantic search and on-demand spirit data generation

**Analytics:**
- Vercel Analytics & Speed Insights

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API key (for AI search)
- Google OAuth credentials (for sign-in)
- (Optional) Vercel Postgres database and Blob storage token for social features and photo uploads

### Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your keys:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   APP_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ADMIN_EMAILS=your-email@gmail.com
   BLOB_READ_WRITE_TOKEN=your_blob_token
   POSTGRES_URL=your_postgres_url
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type checking |
| `npm run clean` | Remove build output |
| `npm run ingest` | Run bourbon/whiskey data ingestion from public catalogs |

## Architecture

```
src/
  components/      # React UI components (App, HomeView, CatalogView, DetailView,
                   #   ListsView, ProfileView, FeedView, CompareView, RecommendView,
                   #   AdminPanel, BarcodeScanner, PhotoUpload, AuthModal, etc.)
  hooks/           # Custom React hooks (auth, lists, reviews, profile, photos,
                   #   user search, admin, theme, online status, toast)
  services/        # Business logic (Gemini AI, UPC lookup)
  data/            # Liquor catalog data across 76 files (bourbon, scotch, vodka,
                   #   gin, rum, tequila, rye, Irish, Japanese, Canadian, brandy,
                   #   cognac, armagnac, amaro, liqueurs, genever, etc.)
  contexts/        # React context providers (photo data)
  utils/           # Utility functions (similarity matching, Levenshtein distance,
                   #   string normalization)
  types.ts         # TypeScript interfaces (User, Review, UserProfile, etc.)
  liquorTypes.ts   # Liquor & FlavorProfile interfaces
  data.ts          # Aggregates all spirit data files
  main.tsx         # React entry point
api/
  social.ts        # Consolidated social API (follows, profiles, reviews, lists, user search)
  photos/          # Photo retrieval and upload endpoints
  auth/            # Google OAuth flow, email/phone auth, session management
scripts/
  ingest-bourbons.ts  # Data ingestion from Iowa SODA API & PA PLCB catalog
server.ts          # Express dev server (OAuth routes, Vite dev middleware, static files)
vercel.json        # Vercel deployment config
```

Data is persisted via Vercel Postgres for authenticated users (reviews, profiles, social data, lists) with localStorage as a fallback for unauthenticated use. Photos are stored in Vercel Blob with admin moderation. The Express server handles OAuth token exchange and proxies AI search requests during development; in production, Vercel serverless functions serve the API routes.

## Data Ingestion

A GitHub Actions workflow (`/.github/workflows/ingest-bourbons.yml`) runs weekly to pull new spirits from public sources (Iowa SODA API, Pennsylvania PLCB catalog). It deduplicates, normalizes names, and creates PRs with new catalog additions.

## Deployment

The app deploys to **Vercel** with:
- Static frontend build (`dist/`)
- Serverless API functions (`api/`)
- Vercel Postgres for persistent data
- Vercel Blob for photo storage
- SPA routing fallback via `vercel.json`

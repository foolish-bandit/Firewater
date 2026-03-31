# BRRL Book

A bourbon whiskey discovery and logging app for enthusiasts. Browse a curated catalog of 500+ American bourbons, search with AI-powered semantic search, track your tasting journey, and write reviews.

## Features

- **Bourbon Catalog** — Browse, filter, and paginate through 500+ bourbons with category filters (High Proof, Wheated, Rye, Single Barrel, Under $50) and advanced price/proof sliders
- **AI-Powered Search** — Semantic search powered by Google Gemini for natural-language bourbon queries
- **Tasting Lists** — "Want to Try" and "Tried" lists to track your bourbon journey, with text export
- **Reviews & Ratings** — Write, edit, and delete reviews with star ratings
- **Barcode Scanner** — Scan bourbon barcodes via camera to quickly identify and log bottles
- **Community Submissions** — Submit new bourbons to grow the catalog
- **Google Sign-In** — OAuth authentication to personalize your experience
- **Flavor Profiles** — Radar charts showing 12 flavor dimensions per bourbon

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite
- **Backend:** Express, Node.js
- **AI:** Google Gemini (server-side)
- **Charts:** Recharts
- **Animations:** Motion
- **Barcode:** html5-qrcode

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API key (for AI search)
- Google OAuth credentials (for sign-in)

### Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your keys:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   APP_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
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
| `npm run lint` | Run linter |

## Architecture

```
src/
  components/    # React UI components (App, HomeView, CatalogView, DetailView, ListsView, etc.)
  hooks/         # Custom React hooks (auth, lists, reviews, custom bourbons, toast)
  services/      # Business logic (Gemini AI, UPC lookup)
  data/          # Bourbon catalog data (10 volumes)
  utils/         # Utility functions (similarity matching, string normalization)
  types.ts       # TypeScript interfaces
server.ts        # Express server (OAuth, AI search proxy)
```

Data is persisted client-side via localStorage. The Express server handles OAuth token exchange and proxies AI search requests to keep the Gemini API key secure.

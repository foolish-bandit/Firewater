# Handoff: Firewater Web Redesign

A complete redesign of the Firewater marketing website + logged-in collector app, delivered as hi-fi HTML prototypes to be reimplemented in the target codebase.

---

## About the Design Files

The files in `design-files/` are **design references created in HTML/React (via inline Babel)** — prototypes showing intended look, layout, and behavior. They are **not production code to copy directly**.

Your task is to **recreate these designs in the Firewater codebase's existing environment** — using its established framework (React/Next.js, Vue/Nuxt, SwiftUI, etc.), component library, routing, and state patterns. If no web environment exists yet, choose the most appropriate modern stack (React + TypeScript + CSS Modules, or Next.js App Router, or Remix) and implement there.

**Do not ship the HTML files.** Use them as the source of truth for visual fidelity and structure.

---

## Fidelity

**High-fidelity (hifi).** Every page is pixel-spec'd with final colors, typography, spacing, imagery placeholders, copy, and interactions. Recreate the UI pixel-perfectly using the codebase's existing libraries and patterns.

---

## How to open the design

Open `design-files/Firewater Web.html` in a browser. You'll see a review shell with:

- **Page pills** at the top to jump between all 11 pages
- **Viewport switcher** (Desktop 1440 / Tablet 1024 / Mobile 390)
- **Dusk / Sundown toggle** — the design ships two themes (dark + light), swapping palette, typography stack, and mood

Each pill loads a real route of the site inside an iframe. Click into `design-files/site/` to read the source per page.

---

## The Design System

### Two themes — Dusk and Sundown

The product ships with a toggle between two full themes. Both are first-class — not dark-mode-as-an-afterthought.

**Dusk (dark, default)** — espresso paper, brass accents, sans-serif type
- `--bg: #141210` — page background
- `--surf: #1C1815` — cards, section backgrounds
- `--surf-alt: #231E19` — elevated surfaces
- `--ink: #EAE4D9` — primary text
- `--ink-2: rgba(234,228,217,0.68)` — secondary text
- `--ink-3: rgba(234,228,217,0.42)` — tertiary / metadata
- `--line: rgba(234,228,217,0.12)` — hairlines
- `--line-strong: rgba(234,228,217,0.22)` — heavier dividers, button borders
- `--accent: #E0B868` — brass — primary accent, CTAs, kicker highlights
- `--accent-soft: rgba(224,184,104,0.14)` — accent tints
- `--paper: #141210` — used on button text sitting on accent

**Sundown (light)** — bone paper, terracotta accents, serif type
- `--bg: #F2ECDF`
- `--surf: #E8E0CF`
- `--surf-alt: #DDD2BB`
- `--ink: #231D16`
- `--ink-2: rgba(35,29,22,0.68)`
- `--ink-3: rgba(35,29,22,0.42)`
- `--line: rgba(35,29,22,0.2)`
- `--line-strong: rgba(35,29,22,0.35)`
- `--accent: #B24A2C` — terracotta
- `--accent-soft: rgba(178,74,44,0.12)`
- `--paper: #FAF4E4`

### Typography

**Dusk:**
- Display: `'DM Serif Display', serif` — italic variant used heavily for headlines
- Body: `'Cormorant', Georgia, serif`
- Mono: `'JetBrains Mono', ui-monospace, monospace`

**Sundown:**
- Display: `'Old Standard TT', serif` — weight 700; italic variant feels off, keep upright
- Body: `'Tenor Sans', serif`
- Mono: `'JetBrains Mono'` (shared)

Both import from Google Fonts. In the target codebase, use `next/font` or the equivalent local-loading mechanism for performance.

### Type scale (in use)

| Role | Size / Style |
|---|---|
| Hero display | 104–140px, line-height 0.9–0.98, letter-spacing -0.01em |
| Page title | 72–112px |
| Section title | 40–56px |
| Card title | 22–32px |
| Lede | 22px / line-height 1.5 / `--ink-2` |
| Body | 16–18px / Cormorant or Tenor Sans |
| Kicker | 10–11px / mono / letter-spacing 0.22em / uppercase / `--ink-2` |
| Caption / metadata | 10px / mono / letter-spacing 0.18–0.2em |

### Spacing

Sections use consistent vertical rhythm: `80px`, `100px`, or `120px` top/bottom padding. Horizontal wrap max-width is `1320px` with `48px` side padding (`24px` on mobile).

### Component vocabulary

- **Kicker** — uppercase mono eyebrow, often prefixed with `◆ &nbsp;`
- **Diamond glyph `◆`** — used as a brand bullet everywhere (ratings, list markers, tags, headers)
- **Rule** — section header: flex row with horizontal line, diamond, title, diamond, horizontal line
- **Flourish** — small centered SVG ornament under titles
- **Compass** — decorative 16-point compass rose SVG, used full-size or as low-opacity background
- **Bottle** — placeholder bottle shape (SVG) — replace with real product photography in production
- **Frame** — subtle 1px `--line` border wrapping content blocks
- **Corner marks** — L-shaped 14px accent-colored brackets in modal corners
- **Grain overlay** — SVG turbulence noise at 3.5% opacity (6% in light mode), `mix-blend-mode: multiply`

### Buttons

- **Primary**: `background: var(--accent)`, `color: var(--paper)`, padding `14px 22px`, uppercase mono 11px, letter-spacing 0.2em
- **Ghost**: transparent, `1px solid var(--line-strong)`, hover: `border-color: var(--accent); color: var(--accent)`
- **Chip**: smaller variant for pills/filters, `6px 12px`

### Page transitions

Every route change fades in with `animation: fw-fade-in 0.42s cubic-bezier(0.2, 0.7, 0.3, 1) both` — from `opacity: 0, translateY(6px)` to `opacity: 1, translateY(0)`. Implement as route-change animation in the target framework.

---

## Screens

All 11 screens live under `design-files/site/pages/`. Each is a React component using the token system above.

### 1. Landing (`Landing.jsx`)
Marketing home. Hero with display italic headline + brass-accented "Tonight's Pour" bottle card. Sections: feature grid, collector testimonial, "the field guide" editorial preview, final CTA.

### 2. Discover (`Discover.jsx`)
Editorial feed for logged-in browsing. Mix of featured article, trending bottles grid, community pours, and curated lists.

### 3. Catalog (`Catalog.jsx`)
Filterable bottle database. Left sidebar with category / region / age / proof / price filters. Right: grid/list toggle, sort dropdown, paginated bottle cards.

### 4. Bottle Detail (`Detail.jsx`)
Single-bottle page. Two-column: bottle imagery + actions on left, tasting notes / flavor wheel / reviews / distillery info on right. Related bottles strip at bottom.

### 5. Profile (`Profile.jsx`)
**Public collector view** — someone else's page. Avatar, bio, stats strip (shelf / pours / reviews / followers), Top Shelf featured bottle, Top 5 Pours of the Year list, Flavor DNA bars, recent log entries.

### 6. My Shelf (`Shelf.jsx`) — logged-in first-person view
Five tabs:
- **The Shelf** — 4-col grid of bottles with status ribbons (OPEN / SEALED / LOW / EMPTY), filter pills, "Add Bottle" card at end
- **The Log** — chronological pour journal grouped by month, date gutter, tasting notes, flavor tag chips, summary strip
- **Wishlist** — bottles being hunted, price + contextual note, Track button
- **Friends** — activity feed (logged / reviewed / added / started following) + suggested-follow sidebar
- **Stats** — headline pour count, 12-month bar chart (current month highlighted in accent), category breakdown bars, flavor tag cloud (size scales with frequency)

Includes a **Log a Pour modal** — bottle search, 5-diamond rating, tasting-notes textarea, flavor tag selector, ornamental corner marks.

### 7. Dispatch (`Dispatch.jsx`)
Articles archive. Masthead banner, featured "This Week" article, article grid, newsletter signup CTA at the bottom.

### 8. Article (`Article.jsx`)
Long-form reading view. Full-bleed hero image, byline, serif body at ~19px / line-height 1.6, pull quotes, related articles footer.

### 9. Download (`Download.jsx`)
Get-the-app page. Hero with App Store / Google Play buttons, tilted phone mockup with in-app "Tonight's Pour" preview, feature grid, ratings.

### 10. About (`About.jsx`)
Team + manifesto. Oversized display headline, "The Three Rules" manifesto, team grid, colophon block.

### 11. Sign In / Sign Up (`SignIn.jsx`)
Split-screen. Left: atmospheric brand panel with tagline. Right: form with toggle between Sign In / Create Account modes, OAuth buttons (Apple, Google), age-gate notice. No top nav on this page.

---

## Interactions & Behavior

- **Route navigation** — call `onNav(pageId)` on every interactive link; scrolls to top and triggers fade transition
- **Theme toggle** — persists mode to `localStorage`; applies `body.light` class; transitions `background` + `color` with 0.4s ease
- **Modals** (Log a Pour) — full-screen backdrop with `rgba(12,10,9,0.84)` + `backdrop-filter: blur(6px)`, click-outside-to-close, ornamental corner marks
- **Hover states** — buttons shift border color to accent; grid cards shift background from `--bg` to `--surf`; editorial cards keep cursor pointer
- **Status indicators** (shelf bottles) — 6×6px colored square + uppercase mono label, colors: OPEN = accent, SEALED = ink-2, LOW = `#c87a4d`, EMPTY = ink-3
- **Ratings** — 5 diamonds (`◆`), filled = accent, empty = line-strong, display value with one decimal

### Responsive

Grids collapse predictably. Wrap padding shrinks from 48px → 24px below 900px. Multi-column layouts stack to single-column on mobile. Nav condenses to hamburger + avatar at < 900px (implement per codebase patterns — the mockup uses desktop-first layout).

---

## State Management

For the logged-in app (`Shelf.jsx`), the following collections are needed:

- `user` — { name, avatar, location, handle, bio, memberSince }
- `bottles[]` — { id, name, category, subcategory, year, rating, status, coverImage, tastingNotes, distillery, region, age, proof, price }
- `pours[]` — { id, bottleId, timestamp, rating, note, flavorTags[] }
- `wishlist[]` — { bottleId, addedAt, note, trackPrice }
- `friends[]` — { userId, status } and `friendActivity[]` — { userId, verb, bottleId?, note?, rating?, timestamp }
- `stats` (derived) — { poursThisWeek, poursThisMonth, avgRating, mostPoured, poursByMonth[12], poursByCategory[], topFlavors[] }

Bottle statuses: `'open' | 'sealed' | 'low' | 'empty'`.

---

## Assets

The prototype uses **placeholder SVGs** for bottles, compass ornaments, and imagery. In production:

- **Bottle images** — real product photography on transparent backgrounds, shot consistently (front-facing, warm side lighting to match the brass palette)
- **Article imagery** — editorial photography, warm tones, lots of grain
- **Compass / flourish ornaments** — keep the provided SVGs; they're part of the brand vocabulary
- **Fonts** — DM Serif Display, Cormorant, Old Standard TT, Tenor Sans, JetBrains Mono (all Google Fonts, open-licensed)

---

## Files in this bundle

- `README.md` — this document
- `design-files/Firewater Web.html` — outer review shell (viewport switcher, theme toggle, page pills)
- `design-files/site/index.html` — the app entry
- `design-files/site/tokens.css` — the full design token system (single source of truth for colors, type, spacing, animations)
- `design-files/site/primitives.jsx` — shared components: Rule, Flourish, Compass, Bottle, Rating, Footer
- `design-files/site/nav.jsx` — top navigation + editorial masthead
- `design-files/site/router.jsx` — page switcher (page transitions live here)
- `design-files/site/pages/*.jsx` — one file per screen (Landing, Discover, Catalog, Detail, Profile, Shelf, Dispatch, Article, Download, About, SignIn)

---

## Suggested implementation order

1. **Tokens** — port `tokens.css` into the codebase first. Everything downstream consumes it.
2. **Primitives** — Rule, Flourish, Compass, Bottle, Rating, Kicker, Button variants. Small, reusable, dependency-free.
3. **Layout chrome** — Nav, Footer, Masthead, page-transition wrapper.
4. **Marketing pages** — Landing, About, Download, Dispatch, Article (static content, fastest wins).
5. **Product pages** — Catalog, Detail, Discover (need real data layer).
6. **Authenticated views** — SignIn, Profile (public), Shelf (logged-in self). Requires auth + user state.

Start with Dusk mode only; add Sundown after everything is stable — it's a simple class-flip on `<body>` and a re-import of the tokens file.

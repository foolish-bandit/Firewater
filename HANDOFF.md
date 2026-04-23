# Firewater Redesign — Claude Code Handoff

**Target repo:** `foolish-bandit/Firewater` (default branch `main`)
**Goal:** Ship the "Dusk (dark) / Sundown (light)" redesign as swappable themes, matching the HTML mock in `Firewater Redesign.html`.

Work through the PRs below **in order**. Each PR is small, reviewable, and independently deployable. Do not combine them.

---

## PR 1 — Design tokens & fonts

### 1.1 Add fonts

Download these WOFF2 files and place in `public/fonts/` (match naming convention already used):

| Family | Weight | Style | Filename |
|---|---|---|---|
| DM Serif Display | 400 | normal | `dm-serif-display-latin-400-normal.woff2` |
| DM Serif Display | 400 | italic | `dm-serif-display-latin-400-italic.woff2` |
| JetBrains Mono | 500 | normal | `jetbrains-mono-latin-500-normal.woff2` |
| JetBrains Mono | 600 | normal | `jetbrains-mono-latin-600-normal.woff2` |
| Old Standard TT | 400 | normal | `old-standard-tt-latin-400-normal.woff2` |
| Old Standard TT | 700 | normal | `old-standard-tt-latin-700-normal.woff2` |
| Old Standard TT | 400 | italic | `old-standard-tt-latin-400-italic.woff2` |

Source: https://fonts.bunny.net/ or https://gwfh.mranftl.com/fonts (Google Webfonts Helper) — download "latin" subset, woff2 only.

### 1.2 Update `src/fonts.css`

Append these `@font-face` blocks **after** the existing Cinzel block. Do NOT delete any existing `@font-face` blocks (Cormorant, Montserrat, Cinzel stay for now; remove Cinzel in PR 4 once unused).

```css
/* DM Serif Display — Regular 400 */
@font-face {
  font-family: "DM Serif Display";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/dm-serif-display-latin-400-normal.woff2") format("woff2");
}
@font-face {
  font-family: "DM Serif Display";
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/dm-serif-display-latin-400-italic.woff2") format("woff2");
}

/* Old Standard TT — 400, 400 italic, 700 */
@font-face {
  font-family: "Old Standard TT";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/old-standard-tt-latin-400-normal.woff2") format("woff2");
}
@font-face {
  font-family: "Old Standard TT";
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/old-standard-tt-latin-400-italic.woff2") format("woff2");
}
@font-face {
  font-family: "Old Standard TT";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/old-standard-tt-latin-700-normal.woff2") format("woff2");
}

/* JetBrains Mono — 500, 600 */
@font-face {
  font-family: "JetBrains Mono";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/fonts/jetbrains-mono-latin-500-normal.woff2") format("woff2");
}
@font-face {
  font-family: "JetBrains Mono";
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("/fonts/jetbrains-mono-latin-600-normal.woff2") format("woff2");
}
```

### 1.3 Update `src/index.css` — `@theme` block

Replace the `--font-display` line and add `--font-mono` and a light-mode display override token:

```css
@theme {
  --font-sans: "Montserrat", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Cormorant Garamond", ui-serif, Georgia, serif;
  --font-display: "DM Serif Display", ui-serif, Georgia, serif;  /* was Cinzel */
  --font-display-light: "Old Standard TT", ui-serif, Georgia, serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  /* ... keep rest of @theme block untouched ... */
}
```

### 1.4 Update `:root` (Dusk/dark defaults) — `src/index.css`

Replace the color values only. Keep all other vars (spacing, radius, elevation).

```css
:root {
  --bg-primary: #141210;
  --bg-surface: #1C1815;          /* was #1A1816 — slightly deeper */
  --bg-surface-alt: #231E19;      /* was #1E1C19 */
  --text-primary: #EAE4D9;
  --text-secondary: rgba(234, 228, 217, 0.7);
  --text-muted: rgba(234, 228, 217, 0.5);
  --text-accent: #C89B3C;
  --text-accent-muted: rgba(200, 155, 60, 0.7);
  --text-accent-alt: #B85C3A;     /* NEW — ember, for 2-accent moments */
  --border-primary: rgba(234, 228, 217, 0.12);  /* was 0.15 — quieter */
  --border-accent: rgba(200, 155, 60, 0.3);
  --border-accent-strong: rgba(200, 155, 60, 0.55);  /* NEW */
  /* ...keep spacing/radius/elevation block unchanged... */
}
```

### 1.5 Update `[data-theme="light"]` — `src/index.css`

**Replace entirely** with the Sundown palette:

```css
[data-theme="light"] {
  --color-vintage-bg: #F2ECDF;
  --color-vintage-text: #231D16;
  --color-vintage-accent: #B24A2C;
  --color-vintage-accent-hover: #C45A3A;
  --color-vintage-border: rgba(35, 29, 22, 0.2);
  --color-vintage-surface: #E8E0CF;
  --color-vintage-surface-alt: #FAF4E4;

  --bg-primary: #F2ECDF;
  --bg-surface: #E8E0CF;
  --bg-surface-alt: #FAF4E4;
  --text-primary: #231D16;
  --text-secondary: rgba(35, 29, 22, 0.7);
  --text-muted: rgba(35, 29, 22, 0.5);
  --text-accent: #B24A2C;
  --text-accent-muted: rgba(178, 74, 44, 0.7);
  --text-accent-alt: #6F7E5B;     /* sagebrush secondary */
  --border-primary: rgba(35, 29, 22, 0.2);
  --border-accent: rgba(178, 74, 44, 0.35);
  --border-accent-strong: rgba(178, 74, 44, 0.6);

  --elevation-1: 0 1px 3px rgba(80, 55, 30, 0.08), 0 4px 16px rgba(80, 55, 30, 0.08);
  --elevation-2: 0 4px 12px rgba(80, 55, 30, 0.1), 0 8px 24px rgba(178, 74, 44, 0.06);
  --elevation-3: 0 8px 24px rgba(80, 55, 30, 0.12), 0 16px 48px rgba(80, 55, 30, 0.08);

  --media-bg: #F2ECDF;
  --media-text: #231D16;
  --media-accent: #B24A2C;
}
```

### 1.6 Update `.micro-label` — `src/index.css`

This single change carries most of the almanac feel. Change the `font-family`:

```css
.micro-label {
  font-family: var(--font-mono);   /* was var(--font-sans) */
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.22em;          /* was 0.15em — more spacious */
  font-weight: 500;
  color: rgba(234, 228, 217, 0.7);
}
```

Also update `.label-text`:
```css
.label-text {
  font-family: var(--font-mono);   /* was var(--font-sans) */
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-weight: 500;                /* mono labels don't need 600 */
}
```

### 1.7 Update `.gold-gradient-text` for light mode — `src/index.css`

Change light-mode gradient colors to terracotta:
```css
[data-theme="light"] .gold-gradient-text {
  background: linear-gradient(135deg, #B24A2C 0%, #D46244 50%, #B24A2C 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### 1.8 Update `.heading-xl / -lg / -md` — `src/index.css`

Allow mode-specific display font via `font-family` on the `html` element. Add right after the heading definitions:

```css
[data-theme="light"] .heading-xl,
[data-theme="light"] .heading-lg,
[data-theme="light"] .heading-md {
  font-family: var(--font-display-light);
  font-weight: 700;    /* Old Standard headlines press harder */
  letter-spacing: -0.005em;
}
```

### 1.9 Sanity check & verify

After these changes:
- `npm run dev` — app should render in both modes with new colors/fonts
- Run `grep -rn "Cinzel" src/` — should only match `index.css` `@theme` block (which we changed) and `fonts.css` (leave Cinzel `@font-face` in for now; removed in PR 4)
- Click the theme toggle — verify Sundown palette applies
- No component file changes in this PR

**Commit message:** `design: swap to Dusk/Sundown palette + DM Serif + JetBrains Mono tokens`

---

## PR 2 — New shared primitives

Create four small components. Each is self-contained.

### 2.1 `src/components/SectionRule.tsx` (NEW)

Replaces ad-hoc section headers. Renders `─── ◆ TITLE ◆ ───`.

```tsx
interface SectionRuleProps {
  title: string;
  align?: 'center' | 'left';
  accent?: boolean;     // if true, diamond is accent color
  trailing?: React.ReactNode;  // e.g., "View all →" link on the right
}

export function SectionRule({ title, align = 'center', accent = false, trailing }: SectionRuleProps) {
  if (align === 'left') {
    return (
      <div className="flex items-baseline justify-between gap-3 py-2">
        <span className="micro-label">
          <span className={accent ? 'text-on-surface-accent' : ''}>◆</span> {title}
        </span>
        {trailing && <span className="micro-label">{trailing}</span>}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 h-px bg-border-subtle" />
      <span className="micro-label whitespace-nowrap">
        <span className={accent ? 'text-on-surface-accent' : ''}>◆</span>&nbsp;&nbsp;{title}&nbsp;&nbsp;<span className={accent ? 'text-on-surface-accent' : ''}>◆</span>
      </span>
      <div className="flex-1 h-px bg-border-subtle" />
    </div>
  );
}
```

### 2.2 `src/components/Flourish.tsx` (NEW)

Small ornamental rule used under hero titles.

```tsx
interface FlourishProps {
  width?: number;
  className?: string;
}

export function Flourish({ width = 120, className = '' }: FlourishProps) {
  return (
    <svg width={width} height="10" viewBox="0 0 120 10" className={className} aria-hidden>
      <line x1="0" y1="5" x2="50" y2="5" stroke="currentColor" strokeWidth="0.5"/>
      <circle cx="54" cy="5" r="1" fill="currentColor" />
      <path d="M60 5 L64 2 L68 5 L64 8 Z" fill="currentColor" />
      <circle cx="66" cy="5" r="1" fill="currentColor" />
      <line x1="70" y1="5" x2="120" y2="5" stroke="currentColor" strokeWidth="0.5"/>
    </svg>
  );
}
```

### 2.3 `src/components/CompassMark.tsx` (NEW)

Decorative compass rose. Used sparingly (profile header, onboarding hero, detail backdrop).

```tsx
interface CompassMarkProps {
  size?: number;
  opacity?: number;
  className?: string;
}

export function CompassMark({ size = 32, opacity = 0.9, className = '' }: CompassMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32"
         style={{ opacity }} className={className} aria-hidden>
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1 1" />
      {[0, 90, 180, 270].map(a => (
        <path key={a} d="M16 2 L18 16 L16 30 L14 16 Z" fill="currentColor" transform={`rotate(${a} 16 16)`} />
      ))}
      {[45, 135, 225, 315].map(a => (
        <path key={a} d="M16 6 L17 16 L16 26 L15 16 Z" fill="currentColor" opacity="0.4" transform={`rotate(${a} 16 16)`} />
      ))}
    </svg>
  );
}
```

### 2.4 `src/components/AppMasthead.tsx` (NEW)

Newspaper-style masthead for Discover / home. Dark mode keeps it simple; light mode gets the full letterpress treatment.

```tsx
import { useEffect, useState } from 'react';

export function AppMasthead() {
  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    const check = () => setIsLight(document.documentElement.getAttribute('data-theme') === 'light');
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // Volume number — increments monthly; stable proxy for "editorial" feel
  const vol = 'VII';
  const day = new Date().toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <div
      className="mx-5 py-2 px-6"
      style={{
        borderTop: '1px solid var(--text-primary)',
        borderBottom: isLight ? '2px solid var(--text-primary)' : '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="micro-label">Est. 2024</span>
        <span className="micro-label">Vol. {vol} — {day}.</span>
      </div>
      <div className="text-center pt-1 pb-0.5">
        <div
          className="tracking-[0.04em] leading-none"
          style={{
            fontFamily: isLight ? 'var(--font-display-light)' : 'var(--font-display)',
            fontWeight: isLight ? 700 : 400,
            fontStyle: isLight ? 'normal' : 'italic',
            fontSize: '2.25rem',
          }}
        >
          FIRE<span className="text-on-surface-accent">·</span>WATER
        </div>
      </div>
    </div>
  );
}
```

### 2.5 Export from one index (optional)

Create `src/components/ornaments.ts`:
```ts
export { SectionRule } from './SectionRule';
export { Flourish } from './Flourish';
export { CompassMark } from './CompassMark';
export { AppMasthead } from './AppMasthead';
```

### 2.6 Verify

- Type-check: `npm run lint`
- Components don't crash if rendered in isolation
- No existing file imports them yet — this PR is purely additive

**Commit message:** `feat(ui): add SectionRule, Flourish, CompassMark, AppMasthead primitives`

---

## PR 3 — Adopt primitives in views

One commit per view. Do not refactor unrelated logic.

### 3.1 `src/components/HomeView.tsx`

1. Import: `import { AppMasthead, SectionRule, Flourish } from './ornaments';`
2. **Replace** the current top header block with `<AppMasthead />`. Keep the search field immediately below.
3. **Find** every section heading (e.g., "Featured", "Categories", "Popular"). Replace with `<SectionRule title="TONIGHT'S POUR" />`, `<SectionRule title="VEINS OF SPIRIT" />`, `<SectionRule title="THE DISPATCH" trailing="Vol. VII" />`. Pick whichever matches the actual section.
4. Featured card: add top brass rule — set `borderTop: '2px solid var(--text-accent)'` via style prop, with `opacity: 0.6`.
5. Category tiles: 2-col grid, each tile `border: 1px solid var(--border-subtle)` with `bg-surface-raised`. Name in `font-display`, count in `font-mono` at `0.625rem` color `--text-muted`.
6. Dispatch list: numbered `01/02/03` in mono, title in `font-display italic`, tag (e.g., "4 min") in `.micro-label`.

### 3.2 `src/components/DetailView.tsx`

1. Import: `import { SectionRule, Flourish } from './ornaments';`
2. Title block: center-align. `.micro-label` row above ("Bourbon · Kentucky · 2018"). Title in `.heading-xl` (becomes Old Standard in light, DM Serif in dark). Add `<Flourish className="mx-auto text-on-surface-accent mt-3" width={100} />` immediately under the title. Rating row below.
3. Spec strip: 3-column grid with `border-t border-b border-border-subtle`, column dividers `border-l border-border-subtle`. Label in `.micro-label`, value in `.heading-lg`.
4. **Replace** existing section headings ("Flavor Profile", "Tasting Notes", "Reviews") with `<SectionRule title="FLAVOR PROFILE" align="left" />` etc.
5. Tasting notes: Nose/Palate/Finish labels in `.micro-label` with `text-on-surface-accent`, inline with the note text. 8px margin between rows.

### 3.3 `src/components/ProfileView.tsx`

1. Import: `import { SectionRule, CompassMark } from './ornaments';`
2. Header: add `<CompassMark size={48} opacity={0.3} className="absolute top-2 right-5 text-on-surface-accent" />` positioned absolute in the header container (which should be `relative`).
3. Stats strip: 4-column. In light mode wrap in `border-2 border-border-strong` (solid ink frame). Each cell value in `.heading-lg text-on-surface-accent`, label under in `.micro-label`.
4. **Replace** "Top Shelf", "Recent Activity" headings with `<SectionRule title="TOP SHELF" />` and `<SectionRule title="THE LOG" />`.
5. Activity rows: diamond bullet (◆) in `text-on-surface-accent font-mono`, action label above name in `.micro-label`, name in `.heading-md`, timestamp in `font-mono text-xs text-on-surface-muted`.

### 3.4 `src/components/CatalogView.tsx`

1. Import: `import { SectionRule } from './ornaments';`
2. Title block: same pattern as Detail — `.micro-label` kicker ("THE CELLAR · 2,184 entries"), then `.heading-xl` "Catalog".
3. Filter pills: adjust `.seg-item` styling — in light mode, bump border to `1.5px` (add class or inline).
4. List rows: separator `border-bottom: 1px solid var(--border-subtle)` in dark, `border-bottom: 1px dashed var(--border-subtle)` in light. Add this via CSS:
   ```css
   [data-theme="light"] .catalog-row { border-bottom-style: dashed; }
   ```
5. Price in `.heading-md text-on-surface-accent`, right-aligned.

### 3.5 `src/components/App.tsx` — tab bar labels

Locate the bottom tab bar (~line 595 per CLAUDE.md). Each tab currently has an icon and a text label. Change the label's class from whatever it is to use mono:

```tsx
<span className="text-[8px] uppercase tracking-[0.18em] font-medium"
      style={{ fontFamily: 'var(--font-mono)' }}>
  {label}
</span>
```

Keep 4 tabs in order: **Discover · Catalog · Lists · Profile**. Active color = `var(--text-accent)`.

### 3.6 Onboarding (if there's a flow component — otherwise skip)

Look for files like `Welcome*.tsx` / `Onboarding*.tsx`. If none exists this task is a no-op.
If it exists:
1. Step indicator: 4 hairline segments at top, active = `--text-accent`, rest = `--border-primary`.
2. Heading in `.heading-xl` with italic in dark, upright bold in light.
3. Category grid 2-col with border, selected state = accent border + `color-mix(in srgb, var(--text-accent) 14%, transparent)` fill.
4. CTA = `.btn-primary .btn-lg` full-width.

### 3.7 Verify per-view

After each view edit: load that view in `npm run dev`, toggle theme, confirm both look right. Also toggle mobile/desktop breakpoints — nothing should break at `md:`.

**Commit messages (one per view):**
- `refactor(home): adopt AppMasthead + SectionRule ornaments`
- `refactor(detail): center hero + Flourish + mono tasting labels`
- `refactor(profile): boxed stats + compass mark + section rules`
- `refactor(catalog): mono kicker + dashed dividers in light mode`
- `refactor(app): tab bar labels in JetBrains Mono`

---

## PR 4 — Cleanup

1. Remove Cinzel: delete the Cinzel `@font-face` block from `src/fonts.css`. Delete `public/fonts/cinzel-latin-400-normal.woff2`. Remove any `font-family: var(--font-display)` references that still expected Cinzel-specific metrics (unlikely, but grep: `grep -rn "Cinzel\|font-display" src/`).
2. Remove now-unused legacy vars from `:root` if any (e.g., if `--color-vintage-accent-hover` is no longer referenced).
3. Update `CLAUDE.md` design system rules section:
   - `font-display` → DM Serif Display (dark) / Old Standard TT (light)
   - new `font-mono` for micro-labels
   - terracotta accent in light mode
4. Run `npm run lint` and `npm test` — all green.

**Commit message:** `chore: remove Cinzel, update CLAUDE.md design rules`

---

## Don'ts

- **Don't** touch `src/data/` — per CLAUDE.md rule #1, these are generated.
- **Don't** rework routing, auth, hooks, or API code.
- **Don't** introduce new dependencies. All fonts are self-hosted; all primitives are inline SVG + CSS vars.
- **Don't** change the theme toggle mechanism — it's already `data-theme="light"` on `<html>`, keep it.
- **Don't** write hex codes in component files. Always use semantic tokens (`text-on-surface-accent`, `bg-surface-raised`, etc.) or CSS vars (`var(--text-accent)`).

## Reference

The HTML mock at `Firewater Redesign.html` in the design project is the source of truth for visual details. When in doubt, match its spacing, type scale, and component shape — then map back to the semantic tokens above.

---
name: ux-principles
description: Objective UI/UX design principles, interaction patterns, and taste heuristics — not tied to any brand or product. Load this skill when evaluating, critiquing, or designing any interface to apply professional design judgment. Covers hierarchy, layout, typography, interaction, accessibility, and the difference between good and lazy design decisions.
---

# UI/UX Design Principles — Objective Design Taste

This skill codifies professional design judgment that applies regardless of brand, product, or aesthetic direction. It distinguishes considered design decisions from default ones, and good taste from personal preference.

---

## The Core Problem: Default vs. Intentional

Most AI-generated and junior-designer UI shares one failure mode: **it uses the default**. Default font (Inter). Default radius (8px everywhere). Default color (blue primary). Default layout (centered card). Default spacing (16px gap between everything). Default animation (fade-in).

The test for any design decision: **did you choose this, or did it just happen?**

Good design is a series of deliberate choices. Taste is knowing which defaults to break and why.

---

## Visual Hierarchy

Hierarchy is the most important principle in UI. It controls what the user sees first, second, third. Most bad UIs have no hierarchy — everything competes equally.

**The hierarchy stack** (roughly, in order of visual weight):
1. Size — larger dominates
2. Weight — bold dominates regular
3. Color — saturated/contrast dominates muted
4. Position — top-left dominates (in LTR layouts); center dominates in symmetric layouts
5. Whitespace — isolated elements dominate crowded ones
6. Motion — anything moving dominates everything still

**Rules:**
- Max 3 levels of hierarchy per view. More creates noise.
- One dominant element per screen. One. The eye needs an anchor.
- If everything is bold, nothing is bold. Emphasis requires contrast with non-emphasis.
- Muted text should be meaningfully muted — `#6b7280` on white, not `#999` on `#f5f5f5` (that's an accessibility violation).
- Scale jumps should be meaningful: 12px → 14px is not a hierarchy signal. 13px → 22px is.

**Common failure:** Three equally-sized headings at the top of a card. Pick one as the H1. Demote the others aggressively.

---

## Typography as Design

Typography is not font selection. It is the entire system of how text is set.

### The scale
Use a modular scale, not arbitrary sizes. Common ratios: 1.25 (Major Third), 1.333 (Perfect Fourth), 1.5 (Perfect Fifth). Pick one and stick to it.

Example at 1.333 base 14px:
- 10.5px (caption)
- 14px (body)
- 18.7px (subheading)
- 24.9px (heading)
- 33.2px (display)

Never: 12, 14, 16, 18, 20, 24, 28, 32 all in the same UI. That is not a scale — it's channel surfing.

### Line height
- Body text: 1.5–1.6× font size
- Headings: 1.1–1.2× font size (tight)
- Display: 0.95–1.05× (very tight, or even negative tracking)

Heading line-height of 1.5 on large text is a beginner mistake. It creates distracting gaps.

### Measure (line length)
45–75 characters per line for body text. Beyond 80: fatiguing. Below 35: jarring. This affects column width decisions more than anything else.

### Tracking (letter-spacing)
- All-caps labels: `letter-spacing: 0.08em` to `0.12em` — always track out capitals
- Body text: 0 or slightly negative at large sizes
- Never positive tracking on lowercase body text — it looks amateurish

### Font pairing logic
- Contrast is the goal. Pair a high-personality display font with a neutral body font, or a geometric sans with a humanist serif.
- Same-category pairings (two geometric sans-serifs) only work if weights differ dramatically.
- One font with varied weights is often better than two fonts fighting for attention.

---

## Color

### Color is not decoration — it's information
Every color on screen should earn its place by communicating something. If it communicates nothing, remove it.

**Assignment before application:**
Before picking colors, assign roles:
- Background (base, surface, elevated surface)
- Text (primary, secondary, disabled)
- Interactive (default, hover, active, disabled)
- Semantic (success, warning, error, info)
- Accent (emphasis, brand moments)

If a color doesn't fit a role, it shouldn't exist in the system.

### The 60-30-10 rule
- 60% dominant (usually neutral background)
- 30% secondary (surface, text hierarchy)
- 10% accent (CTAs, status, brand moments)

Violating this isn't wrong — but you should know you're violating it and why.

### Contrast minimums (WCAG 2.1)
- Normal text (<18px regular / <14px bold): **4.5:1 minimum**
- Large text (≥18px regular / ≥14px bold): **3:1 minimum**
- UI components and icons: **3:1 minimum**
- `#6b7280` on white `#ffffff` = 4.61:1 ✓ (barely passes)
- `#9ca3af` on white = 2.85:1 ✗ (fails — very common mistake)

Always check: https://webaim.org/resources/contrastchecker/

### Saturation control
Most amateur palettes are over-saturated. Professional UIs use near-neutral backgrounds with one high-saturation accent. The accent reads more powerfully against desaturated context.

### Dark mode is not color inversion
Dark mode has different physics. Shadows become less useful (dark on dark). Elevation is created with lightness, not shadows. Saturated colors on dark backgrounds vibrate unpleasantly — desaturate them by 15–20%.

---

## Spacing & Layout

### 8px base grid — no exceptions
All spacing, sizing, and positioning should be multiples of 8px (or 4px for fine-grained work). 10px padding, 13px gap, 22px margin: these are not on the grid and produce visual inconsistency that users feel even if they can't name it.

Common violations: `padding: 10px 14px`, `gap: 12px` next to `gap: 16px`, `margin-top: 20px` next to `margin-bottom: 24px`.

### Proximity
Elements that belong together should be closer to each other than to unrelated elements. This is Gestalt grouping. The most common failure: equal spacing between a label and its input AND between the input and the next label. The label-input pair should be visually tighter than the inter-field gap.

Rule of thumb: inner spacing ≈ half of outer spacing.

### Alignment
Pick a consistent alignment axis and don't deviate. Left-aligned text grids with left-aligned icons. Center-aligning some elements while left-aligning others in the same view creates tension without purpose.

**Left-align almost everything.** Center-align only: hero text, empty states, single-element compositions. Never center-align body copy in a multi-paragraph layout.

### Padding inside containers
Padding should be proportional to the container's size and purpose. A dense data table has tight padding (8–12px). A hero section has generous padding (64–120px). A popup has compact padding (12–16px). Never the same padding everywhere regardless of context.

### Whitespace is not empty space
It is a structural element. Used correctly: it creates focus, separates groups, and communicates importance. A single element with significant whitespace around it reads as important. Whitespace is often the most powerful design tool a junior designer ignores.

---

## Interaction Design

### Affordances
Every interactive element must communicate that it is interactive — through shape, color, cursor, or convention. Ghost buttons (outline only) on dark backgrounds often fail this test. Icon-only buttons with no hover state fail this test. Links that look like body text fail this test.

**Hover states are not optional.** On pointer devices, hover is the first feedback the user gets. A clickable element with no hover state communicates nothing.

### Feedback loops
Every user action should receive a response:
- Immediate (0–100ms): visual change, cursor change
- Short (100–300ms): micro-animation, state change
- Medium (300ms–1s): loading indicator
- Long (1s+): progress bar or explicit message

If a button press triggers a 2-second API call with no feedback, users will click it again. This is not a user problem — it is a design problem.

### States — all of them
Every interactive component needs all states designed:
- Default
- Hover
- Focus (keyboard navigation — cannot be removed, only styled)
- Active / pressed
- Loading
- Disabled
- Error
- Empty

Designing only the default state is designing 12.5% of the component.

### Focus management
- Focus rings must be visible. `outline: none` with no replacement is an accessibility violation that also breaks keyboard navigation for all users.
- After a modal opens, focus should move to the first interactive element inside it.
- After a modal closes, focus should return to the element that opened it.
- Skip links ("Skip to main content") are required for accessible keyboard navigation.

### Animation principles
**Animation should communicate, not decorate.**

Good animation communicates: origin (where did this element come from?), destination (where did it go?), causality (this caused that), and state change (the system is doing something).

Bad animation: spinning logos, random floating elements, entrance animations that don't communicate origin, transitions that take >400ms.

Timing guidelines:
- Micro-interactions (hover, focus): 100–150ms
- Element entrance/exit: 200–300ms
- Page transitions: 300–400ms
- Anything >400ms feels slow to users

Easing: `ease-out` for entering elements (fast start, decelerate to rest — feels natural). `ease-in` for exiting elements. `linear` only for looping animations (spinners). Never `ease-in-out` for short transitions — the acceleration/deceleration competes with itself.

---

## Information Architecture

### Progressive disclosure
Show users what they need now. Reveal more on demand. The failure mode: showing every option, setting, and piece of data simultaneously.

Implementation:
- Expandable sections for secondary information
- Modals/drawers for detail views
- Tooltips for contextual help
- "Advanced options" sections for power users
- Pagination/virtualization for long lists

### Empty states are features
An empty state is the first thing a new user sees. It should: explain what goes here, show a visual (not just text), and provide a clear first action. An empty table with no explanation is a failure of UX, not a neutral state.

### Error messages
**An error message is not a punishment.** It should:
1. Say what happened (specific, not "An error occurred")
2. Say why if possible
3. Say what to do next
4. Appear near the source of the error, not in a toast 500px away from the relevant field

"Something went wrong" is not an error message. "Unable to save — your session expired. Please log in again." is.

### Loading states
- Skeleton screens outperform spinners for content that has a known shape
- Spinners are acceptable for actions (submitting a form, processing a request)
- Never block the entire UI with a spinner when only part of it is loading
- Optimistic UI (update the UI immediately, revert on error) dramatically improves perceived performance

---

## Component Decisions

### When to use what
| Pattern | Use when | Not when |
|---|---|---|
| Modal | Requires user decision before proceeding | Showing information only — use a drawer or inline |
| Toast | Non-critical, auto-dismissing confirmation | Errors that require action — those need persistent UI |
| Tooltip | Label for icon-only controls | Long explanations — those need a popover or inline help |
| Drawer/Sheet | Detail view, multi-step flow | Single-action confirmation — use a modal |
| Inline error | Field validation | System-level errors — those need a banner |
| Banner | System-level message affecting whole page | Individual field errors |
| Dropdown | 5–15 options | 2–4 options (use radio/segmented control) or 15+ (use combobox with search) |

### Tables
- Right-align numbers. Left-align text. Center-align short status badges.
- Numeric columns should use tabular/monospace figures so decimal points align.
- Zebra striping is useful for very dense tables (10+ columns). For normal tables, row hover is sufficient.
- Sticky headers on any table taller than the viewport.

### Forms
- One column layouts outperform two column layouts for completion rate (research-backed)
- Labels above fields, not beside them (easier to scan, better on mobile)
- Placeholder text is not a label — it disappears when typing begins and fails accessibility
- Required field indicators: mark optional fields (fewer of them) not required fields
- Inline validation: validate on blur, not on keystroke (keystroke validation creates red errors before the user finishes typing)

---

## The Taste Heuristics

These are the calls that separate considered design from default design:

**1. Would a print designer be embarrassed by this?**
Print designers have 500 years of typographic and compositional refinement behind them. If a layout would look amateurish in a magazine, it looks amateurish on screen.

**2. Can you explain every decision?**
"I made the button blue because blue is default" is not a decision. "I made the button green because green is the brand's trust signal and this is the primary confirmation action" is a decision.

**3. Does adding more whitespace improve it?**
It almost always does. When in doubt, add space.

**4. Is there one thing the user should do on this screen?**
If not, are you sure all those things belong here? If yes, is that one thing visually dominant?

**5. Have you designed the worst-case content?**
A card looks great with "John Smith" and a short bio. Does it break with "Bartholomew Christopherson-Wainwright III" and a 400-word bio? Design for real content, not placeholder content.

**6. Remove it. Does anything get worse?**
Apply to: decorative lines, secondary labels, explainer text, icons, badges, animations. If nothing gets worse, it should probably go.

**7. Would the user notice if this animation wasn't there?**
If not, remove it. Animation should earn its presence by communicating something.

**8. Is this accessible without a mouse?**
Tab through it. Use a screen reader. This is not optional and it is not expensive to do upfront.

---

## What Good vs. Lazy Looks Like

| Lazy | Good |
|---|---|
| `border-radius: 8px` on everything | Radius proportional to element size; small elements get smaller radii |
| Same padding on every component | Padding matched to component density and purpose |
| Blue primary button always | Primary color chosen for semantic meaning in context |
| Inter or Roboto | Typeface chosen to match the product's tone |
| `box-shadow: 0 4px 6px rgba(0,0,0,0.1)` everywhere | Elevation system with meaningful shadow hierarchy |
| 3 loading spinners simultaneously | Single loading state, skeleton screens where shape is known |
| Toast for every action | Inline feedback where possible, toast only for background operations |
| `opacity: 0.5` for disabled state | Disabled state clearly communicates why it's disabled |
| Hover = darken by 10% | Hover communicates interaction intent through appropriate visual change |
| Empty state = blank | Empty state explains, illustrates, and offers a first action |

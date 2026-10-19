# GovPreneurs Design System v4.1

> **This copy is canonical for the Success Center.** Production loads it via
> `govpreneurs-ds.css`, which `src/app/globals.css` imports. Change it here.
>
> **Tokens are already global** — use `var(--blue-7)`, `var(--s-4)`, `var(--r-md)`
> anywhere with no import. **The component layer is opt-in and must be scoped**:
> its class names (`.btn`, `.card`, `.mono`, `.input`, …) collide with ~120
> existing production classNames, and `type-and-components.css` /
> `colors_and_type.css` restyle `html, body` and bare headings. See the shipping
> `.gpds` pattern in `src/components/business/ds.css`, and the full rationale in
> the header of `govpreneurs-ds.css` and the Design system section of `DOCS.md`.
>
> Fonts are served from `/ds-fonts`, logos and icons from `/ds-assets`.
> Identical vendored snapshots exist inside the self-contained prototypes
> (`delivery-os/prototype/business-profile/design-system/`) — those are copies,
> not the source.

GovPreneurs is an AI-powered **government-contracting (GovCon) platform** that helps small businesses discover, qualify, and pursue federal opportunities. The web app is embedded inside a **GoHighLevel iframe shell**, which is why every page begins with a **3px brand stripe** at the top — it's the visual bridge between the GHL chrome and the GovPreneurs product.

The product surface is named **Hunter** — Hunter scans SAM.gov, surfaces high-match opportunities, runs deep-research pipelines on RFPs, and escalates to human GovCon mentors when the stakes warrant it.

## Sources

- **Codebase:** `govpreneurs-ds/` (mounted via File System Access API; read with `local_*` tools)
- **No Figma** was provided for v4.1. All visual decisions are derived from the codebase tokens + reference HTML in that folder.

This system was extracted directly from `tokens.css`, `type-and-components.css`, and the reference Hunter UI markup that ships with the codebase.

---

## Index

Root files:
- `tokens.css` — color/spacing/radius/shadow primitives + semantic aliases
- `type-and-components.css` — type ramp + reusable component classes (`.btn`, `.card`, `.ai-surface`, `.badge`, `.brand-card`, `.mentor`, etc.)
- `colors_and_type.css` — convenience aggregator that imports the two above + maps plain HTML tags (h1/h2/p/code) to the GovPreneurs vocabulary
- `README.md` — this file
- `SKILL.md` — agent-skill manifest for downloading into Claude Code

Folders:
- `preview/` — design-system preview cards (one HTML per token cluster — colors, type, radii, shadows, components). These render in the **Design System** tab.
- `ui_kits/govpreneurs-app/` — clickable hi-fi recreation of the Hunter web app (Sidebar, TopBar, OpportunityCard, AISurface, ResearchPipeline, MentorCard, BrandUpsell)
- `assets/` — logos, glyphs, brand stripe references *(currently empty — v4.1 ships only typographic/glyph branding; see Iconography)*

---

## Content Fundamentals

**Voice — direct, expert, slightly editorial.** GovPreneurs writes like a senior capture manager, not a SaaS marketer. Hunter (the AI) writes like a competent analyst — short sentences, real numbers, no hedging.

**Tone & casing:**
- **Sentence case** for everything: page titles, button labels, table headers. No Title Case CTAs.
- **Tabular numerals** in JetBrains Mono for any number that lives next to other numbers — match scores, dollar values, NAICS codes, deadlines. Reads like a Bloomberg terminal, not a marketing site.
- **No emoji.** Ever. This is federal.
- **No exclamation points.** Confidence comes from precision, not enthusiasm.
- **You/your** when speaking to the user; **Hunter** as a proper noun, third-person ("Hunter flagged this," "Ask Hunter," "Hunter's deep-research pipeline"). Never "the AI" or "our system."

**The editorial voice — `Instrument Serif` italic — is a scalpel, not a paintbrush.** Use it for one editorial moment per surface: a brand-card headline, a hero pull-quote, or a section divider. Never for body copy, never for UI chrome.

**Examples in the wild:**
- ✅ "Hunter scanned 1,284 federal solicitations in the last 24 hours. 95 high-match."
- ✅ "DHS is a repeat buyer in the DC/VA footprint with 14 similar awards since 2024."
- ✅ "My read: pursue, but with a narrow strategy." *(mentor card)*
- ❌ "🚀 Find amazing opportunities!" *(emoji + marketing tone — forbidden)*
- ❌ "Discover Federal Contracts Today" *(Title Case + vague — forbidden)*

**AI attribution is non-negotiable.** Any text Hunter generated is wrapped in an `.ai-surface` with the amber gradient + `.ai-attr` chip ("⏺ Why Hunter flagged this," "⏺ Hunter · streaming"). Users must always be able to tell at a glance whether they're reading a human or the AI.

---

## Visual Foundations

**Three colors, three jobs. Period.**

| Color | Token | Job |
|---|---|---|
| **Federal Blue** | `--blue-7` `#3154c1` | Workhorse — primary buttons, links, nav-active, focus ring, all authority chrome |
| **Brand Red** | `--brand-7` `#D82221` | Brand-only — Pro upsells, premium CTAs, the brand stripe. **Never** for list data, AI surfaces, or destructive actions |
| **AI Amber** | `--ai-7` `#c37728` | AI-only — streaming output, agent chrome, attribution chips. **Never** outside an AI context |

This three-color discipline is the #1 rule. If you reach for red on a list row or amber on a save button, you're breaking the system. The neutrals (`--n-1` … `--n-12`, a warm off-white → near-black ramp) carry **everything else**.

**The brand stripe.** Every full page begins with a `3px` gradient bar at `top: 0`: `--blue-12` → `--brand-7`. This is the bridge to the host GHL shell — it's how you know you're inside GovPreneurs without a logo lockup hijacking the chrome.

**Typography.**
- **`Inter` (variable)** — UI everywhere. Weights 400/500/600/700. Tracking is consistently negative (`-0.005em` to `-0.022em`) on display sizes.
- **`Instrument Serif` italic** — editorial. One moment per surface, max.
- **`JetBrains Mono`** — every number, ID, NAICS code, solicitation number. `font-variant-numeric: tabular-nums` is set globally on `.mono` so columns align.

**Spacing & layout.**
- 4px grid (`--s-1`…`--s-10`).
- Cards are tight: `16–20px` padding, never airy.
- Page max-width `1080px` for content; rail is fixed `220px`.
- The page header lives below the brand stripe with a `--bg-subtle` panel and `--border` separators — federal documents, not marketing pages.

**Backgrounds.**
- Default page bg: `--bg` (`#fbfaf9`, warm off-white). Never pure white.
- Subtle panels: `--bg-subtle` (`#f6f4f1`).
- AI surfaces: warm gradient `--ai-grad` + 1.5% noise overlay + 1px gradient hairline border using `--ai-border-grad`. This is the *only* place gradients/textures appear in the product.
- **No** full-bleed photography, no hand-drawn illustrations, no repeating patterns.

**Borders, radii, elevation.**
- Borders are very low-contrast (`--border` ≈ 9% black) — federal restraint, no chunky outlines.
- Radii: 4 tokens only (`--r-sm` 6px, `--r-md` 10px, `--r-lg` 14px, `--r-pill` 999px). No 16px+ rounded "pill cards" — that's a SaaS trope we avoid.
- Shadows: a 3-step elevation system (`--sh-rest`, `--sh-hover`, `--sh-pop`). All are tight and low-y — `0 1px 2px` rest, `0 4px 16px` hover. No fluffy drop shadows.
- AI cards layer a second amber-tinted shadow on top so they read warmer.

**Animation.**
- Two timings: `--d-fast` 120ms, `--d-base` 220ms.
- One ease: `--ease` `cubic-bezier(0.2, 0.6, 0.2, 1)` (slight overshoot at the start, decelerate hard).
- **No bounces, no spring easing.** This is a federal product.
- Hover states: `box-shadow` deepens, `color` shifts to `--blue-10` for titles. Background color rarely changes on hover.
- Press states: subtle `transform: translateY(1px)` + darker shade (e.g. `--blue-8` for primary).

**Focus.**
- Always `--ring-focus` (`0 0 0 2px white, 0 0 0 4px --blue-7`) — keyboard accessible, never `outline: none` without a replacement.
- AI surfaces use `--ring-focus-ai` (amber) so the affordance matches the surface.

**Transparency / blur.**
- Used in exactly one place: the sticky topbar (`rgba(251, 250, 249, 0.85)` + `backdrop-filter: blur(10px) saturate(150%)`).
- AI surface gradients are opaque — no glass effects, no frosted cards.

**Imagery vibe.** Cool, restrained, slightly warm neutrals. Avatars are gradient-filled monograms (`linear-gradient(135deg, --blue-7, --blue-10)`), not photos. Logos and agency marks should be monochrome SVG when possible.

---

## Iconography

**Stroke-based, hand-rolled inline SVG.** All icons in the codebase are 24×24 viewBox, `stroke-width: 1.75` (UI) or `2` (AI sparks), with `stroke-linejoin: round` and `stroke-linecap: round`. They sit alongside text at `16×16` (rail) or `14×14` (button), and they `currentColor` so they tint with the surrounding type.

**The reference set lives inline.** Each component file in `ui_kits/govpreneurs-app/` declares the icons it needs as small `() => <svg>` components at the bottom of the file (Sidebar.jsx is the canonical example: SearchIcon, BookmarkIcon, SparkIcon, FlagIcon, ChatIcon, GearIcon, HelpIcon). This is intentional — there is **no icon font** and **no sprite sheet**; new icons get added next to where they're used.

**The closest CDN match is Lucide** (same stroke weight, same geometry conventions, also `currentColor`-friendly). If you need an icon that isn't already inline in the codebase, copy the Lucide SVG, drop it at the bottom of the relevant component file, and adjust `stroke-width` to `1.75`.

**Special icons:**
- **Spark / sparkle** — the AI mark. Used on every AI affordance (sidebar "Research" link, "Ask Hunter" button, AI surface header, opportunity-card "Why Hunter flagged this"). Always inherits `--ai-7`. Never used outside AI contexts.
- **Bookmark** — fills with `--blue-7` when saved; outline only when unsaved.
- **Brand glyph** — the "G" letterform on a `--brand-stripe` gradient circle, `28×28` in the rail. This is the closest thing to a logo in v4.1.

**No emoji. No unicode-as-icon (✓ checks are CSS pseudo-elements, not text). No raster icons.** Federal product, federal restraint.

**Substitution flagged for the user:** the codebase ships no logo PNG/SVG. The brand glyph in the rail is built with CSS (gradient bg + bold "G"). Ask the user for an actual logo file when you need one — drop into `assets/logo.svg` and reference from there.

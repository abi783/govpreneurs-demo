# Design System — In‑Use Reference

Factual documentation of what this project's design system **actually contains today**. All values are literal from the codebase — nothing invented, nothing aspirational. Use this as a guardrail for future work.

---

## 1. Overview & setup

- **Tailwind v4, CSS-first.** `src/styles.css` begins with `@import "tailwindcss" source(none);` and `@source "../src";`. There is **no `tailwind.config.js/ts`** and **no `@theme {}` block** anywhere.
- Tokens are plain CSS custom properties on `:root` in `src/styles/tokens.css`.
- Type and core component classes live in `src/styles/components.css`.
- App-specific patterns (Hunter, Companion, layout, hero, banners, modals) live in `src/styles.css`.
- **No shadcn/ui.** No `components.json`, no `@/components/ui/` directory. `class-variance-authority`, `clsx`, and `tailwind-merge` are installed but unused by the component layer.
- **Components use bespoke class names + inline `style={}`**, not Tailwind utility classes in JSX. `source(none)` opts utility classes out by default.
- Icon library: **`lucide-react` only**.

---

## 2. Color palette

### Warm neutrals — `--n-0` … `--n-12`

| Token | Hex | Role |
|---|---|---|
| `--n-0` | `#ffffff` | pure white, reserved |
| `--n-1` | `#fbfaf9` | app bg |
| `--n-2` | `#f5f4f2` | subtle bg |
| `--n-3` | `#eeebe7` | element bg |
| `--n-4` | `#e6e2dd` | hovered |
| `--n-5` | `#dbd6cf` | active |
| `--n-6` | `#c3bdb3` | subtle border |
| `--n-7` | `#a39d93` | ui border |
| `--n-8` | `#80796f` | muted/disabled text |
| `--n-9` | `#5a544b` | secondary text |
| `--n-10` | `#3d3934` | strong text |
| `--n-11` | `#201d1a` | primary text |
| `--n-12` | `#0c0a08` | hi-contrast text |

### Federal blue — `--blue-1` … `--blue-12`

| Token | Hex | Role |
|---|---|---|
| `--blue-1` | `#f5f7fe` |  |
| `--blue-2` | `#e8edfc` | focus-ring fill, accent-muted |
| `--blue-3` | `#d4ddf9` |  |
| `--blue-4` | `#b4c2f2` |  |
| `--blue-5` | `#8ba0e7` |  |
| `--blue-6` | `#5772d6` |  |
| `--blue-7` | `#3154c1` | **primary interactive** |
| `--blue-8` | `#203e9e` | pressed |
| `--blue-9` | `#162e7a` | dense / nav |
| `--blue-10` | `#0d1f56` | authoritative |
| `--blue-11` | `#091641` | header ink |
| `--blue-12` | `#050e2b` | deepest ink |

### AI surface — warm amber `--ai-1` … `--ai-10`

| Token | Hex |
|---|---|
| `--ai-1` | `#fefaf4` |
| `--ai-2` | `#fdf2e3` |
| `--ai-3` | `#fae2c3` |
| `--ai-4` | `#f6cd96` |
| `--ai-5` | `#efb268` |
| `--ai-6` | `#e19345` |
| `--ai-7` | `#c37728` (**AI accent**) |
| `--ai-8` | `#9b5d1c` |
| `--ai-9` | `#764616` |
| `--ai-10` | `#55320f` |

Plus:
- `--ai-grad` = `linear-gradient(135deg, #fde9cc 0%, #fef6e8 35%, #fdf2e3 65%, #fce4c6 100%)`
- `--ai-border-grad` = `linear-gradient(135deg, #e19345 0%, #c37728 50%, #e19345 100%)`

### Brand red — GovPreneurs

| Token | Hex |
|---|---|
| `--brand-1` | `#fef4f3` |
| `--brand-2` | `#fbd9d7` |
| `--brand-3` | `#f6b3af` |
| `--brand-5` | `#e64a48` |
| `--brand-7` | `#d82221` (**the brand red**) |
| `--brand-8` | `#b91d1c` |
| `--brand-9` | `#a01817` |
| `--brand-10` | `#7a1615` |
| `--brand-12` | `#4a0d0c` |

- `--brand-stripe` = `linear-gradient(90deg, var(--blue-12) 0%, var(--blue-10) 30%, var(--brand-8) 75%, var(--brand-7) 100%)`
- `--brand-glyph-bg` = `linear-gradient(135deg, var(--brand-5) 0%, var(--brand-7) 100%)`

### Urgency red — semantic only (`--urg-*`)

| Token | Hex |
|---|---|
| `--urg-1` | `#fef6f5` |
| `--urg-2` | `#fce9e7` |
| `--urg-3` | `#f8ccc8` |
| `--urg-6` | `#d0463c` |
| `--urg-7` | `#c11f1e` |
| `--urg-8` | `#8f2219` |
| `--urg-9` | `#6b1711` |

Back-compat aliases exist: `--red-1` → `var(--urg-1)`, …, `--red-9` → `var(--urg-9)`.

### Positive — muted sage

| Token | Hex |
|---|---|
| `--pos-2` | `#e6f0e9` |
| `--pos-3` | `#c9dfd0` |
| `--pos-7` | `#3a7049` |
| `--pos-9` | `#1f4227` |

### Warn — subdued ochre

| Token | Hex |
|---|---|
| `--warn-2` | `#faefd7` |
| `--warn-3` | `#f2dca5` |
| `--warn-7` | `#8a6418` |
| `--warn-9` | `#553c0b` |

### Semantic aliases

| Token | Resolves to |
|---|---|
| `--bg` | `var(--n-1)` |
| `--bg-subtle` | `var(--n-2)` |
| `--bg-element` | `var(--n-3)` |
| `--bg-hover` | `var(--n-4)` |
| `--bg-active` | `var(--n-5)` |
| `--surface` | `var(--n-0)` (`#ffffff`) |
| `--border` | `rgba(32, 29, 26, 0.08)` |
| `--border-soft` | `rgba(32, 29, 26, 0.05)` |
| `--border-strong` | `rgba(32, 29, 26, 0.14)` |
| `--border-focus` | `var(--blue-7)` |
| `--text` | `var(--n-11)` |
| `--text-2` | `var(--n-9)` |
| `--text-3` | `var(--n-8)` |
| `--text-ink` | `var(--blue-11)` |
| `--text-inverse` | `var(--n-1)` |
| `--accent` | `var(--blue-7)` |
| `--accent-hover` | `var(--blue-8)` |
| `--accent-muted` | `var(--blue-2)` |
| `--accent-ink` | `var(--blue-11)` |
| `--ai` | `var(--ai-7)` |
| `--ai-surface` | `var(--ai-2)` |
| `--ai-surface-subtle` | `var(--ai-1)` |

### Off-token color in code

One raw OKLCH teal exists **only as inline values** for the "Ava" agent card in `src/styles.css` — `oklch(0.66 0.16 162)` / `oklch(0.70 0.16 162)` / `oklch(0.42 0.13 162)`. There is **no token alias** for it, and it is the only teal/green hue in the system.

---

## 3. Typography

### Fonts loaded (Google Fonts, `components.css`)

- `Inter` (variable, weights 400/500/600/700, opsz 14–32)
- `Instrument Serif` (regular + italic)
- `JetBrains Mono` (400/500)

### Stacks (tokens)

| Token | Stack | Used for |
|---|---|---|
| `--font-ui` | `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | All UI: body, labels, buttons |
| `--font-ed` | `"Instrument Serif", "Tiempos Headline", ui-serif, serif` | Editorial display moments only |
| `--font-mono` | `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace` | Code, KBD chips, scope pills, tabular data |

### Base

`html, body` → `font-family: var(--font-ui); font-size: 14px; line-height: 1.5;` with `font-feature-settings: "cv11" 1, "ss01" 1, "ss03" 1`.

### Type scale (utility classes)

| Class | Size | LH | Weight | Tracking | Color |
|---|---|---|---|---|---|
| `.t-display-2xl` | 48px | 1.04 | 500 | -0.03em | `--text-ink` |
| `.t-display-xl` | 36px | 1.08 | 500 | -0.025em | `--text-ink` |
| `.t-display-lg` | 28px | 1.12 | 600 | -0.02em | `--text-ink` |
| `.t-heading` | 20px | 1.25 | 600 | -0.012em | `--text` |
| `.t-subheading` | 16px | 1.4 | 600 | -0.005em | `--text` |
| `.t-body-lg` | 15px | 1.55 | 400 | — | `--text` |
| `.t-body` | 14px | 1.55 | 400 | — | `--text` |
| `.t-body-sm` | 13px | 1.5 | 400 | — | `--text-2` |
| `.t-caption` | 12px | 1.45 | 400 | — | `--text-2` |
| `.t-label` | 11px | 1 | 600 | 0.06em | `--text-3`, uppercase |
| `.t-editorial` | 34px | 1.08 | 400 | -0.005em | `--text-ink`, `--font-ed`, italic |

Tabular numbers: `.mono` / `.tnum` / `.num` and `table td, th` get `font-feature-settings: "tnum" 1, "cv11" 1`.

---

## 4. Spacing scale

Defined in `tokens.css`:

| Token | Value |
|---|---|
| `--s-1` | 4px |
| `--s-2` | 8px |
| `--s-3` | 12px |
| `--s-4` | 16px |
| `--s-5` | 20px |
| `--s-6` | 24px |
| `--s-8` | 32px |
| `--s-10` | 40px |
| `--s-12` | 48px |
| `--s-16` | 64px |
| `--s-20` | 80px |

**Gaps in scale (do not invent):** `--s-7`, `--s-9`, `--s-11`, `--s-13`, `--s-14`, `--s-15`, `--s-17`, `--s-18`, `--s-19` are **not defined**.

Layout constants: `--container-max: 1200px`, `--sidebar-w: 228px`.

Component classes commonly hardcode `7px, 10px, 14px, 28px, 36px, 360px, 440px` in pixel literals rather than tokens — match what's nearby when editing.

---

## 5. Radius

| Token | Value | Role |
|---|---|---|
| `--r-sm` | 6px | inputs, buttons, kbd, checkbox |
| `--r-md` | 10px | cards, containers |
| `--r-lg` | 16px | sheets, modals, hero |
| `--r-pill` | 999px | pills/tags |

Two off-token uses: `border-radius: 12px` in `.ky-modal-content` and `.ai-search-input`.

---

## 6. Shadow / elevation

| Token | Use |
|---|---|
| `--sh-rest` | default card resting elevation |
| `--sh-hover` | card hover elevation |
| `--sh-press` | inset press state |
| `--sh-sheet` | floating sheets |
| `--sh-overlay-inner` | inner highlight on overlays |
| `--sh-cta-rest` | primary CTA buttons |
| `--sh-cta-hover` | primary CTA hover |
| `--ring-focus` | `0 0 0 2px var(--n-1), 0 0 0 4px var(--blue-7)` |
| `--ring-focus-ai` | `0 0 0 2px var(--n-1), 0 0 0 4px var(--ai-7)` |

---

## 7. Motion

| Token | Value |
|---|---|
| `--ease` | `cubic-bezier(0.16, 1, 0.3, 1)` — springy ease-out (default) |
| `--ease-out` | `cubic-bezier(0.22, 0.61, 0.36, 1)` |
| `--ease-in` | `cubic-bezier(0.55, 0.06, 0.68, 0.19)` |
| `--d-fast` | 120ms |
| `--d-base` | 200ms |
| `--d-slow` | 360ms |

Existing keyframes: `ai-pulse`, `caret`, `ai-spin`, `ai-search-pulse`, `gate-fade`, `gate-pop`, `meet-pop`, `unlock-rise`, `unlock-shine`, `agent-rise`, `drawer-in`, `ky-fade-in`. Prefer these over new ones.

---

## 8. Component patterns

### Card shell

```css
.card {
  background: var(--surface);
  border-radius: var(--r-md);   /* 10px */
  box-shadow: var(--sh-rest);
  transition: box-shadow var(--d-base) var(--ease);
}
.card-hover:hover { box-shadow: var(--sh-hover); }
.card-padded { padding: var(--s-5); }  /* 20px */
```

The **live opportunity card** is `.opp-card-compact`:

```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: 8px;
padding: 16px 20px;
box-shadow: var(--sh-rest);
/* :hover → --sh-hover + --border-strong */
/* .is-saved → border-left: 2px solid var(--blue-7); padding-left: 19px; */
/* .is-closed → opacity: 0.6; pointer-events: none; */
```

### Buttons

All extend `.btn`: `font-size: 13px; font-weight: 500; padding: 9px 13px; border-radius: var(--r-sm);`.

| Variant | Background | Color | Border | Shadow |
|---|---|---|---|---|
| `.btn-primary` | `linear-gradient(180deg, var(--blue-7), var(--blue-8))` | white | none | `--sh-cta-rest` |
| `.btn-secondary` | `var(--surface)` | `var(--text)` | `var(--border-strong)` | subtle |
| `.btn-ghost` | transparent | `var(--text-2)` | none | none |
| `.btn-danger` | `var(--urg-7)` | white | none | `--sh-cta-rest` |
| `.btn-brand` | `linear-gradient(180deg, var(--brand-7), var(--brand-8))` | white | none | brand shadow |
| `.btn-ai` | `linear-gradient(180deg, var(--ai-2), var(--ai-3))` | `var(--ai-9)` | `var(--ai-4)` | inset highlight |

Size modifiers: `.btn-sm` (6px/10px, 12px), `.btn-lg` (12px/18px, 14px).

### Chips / pills

| Class | Height | Padding | Radius | Background | Border | Use |
|---|---|---|---|---|---|---|
| `.chip-filter` | 32px | 4px 12px | `--r-pill` | `color-mix(in oklab, var(--blue-7) 6%, var(--surface))` | `color-mix(in oklab, var(--blue-7) 18%, transparent)` | active filter |
| `.chip-add` | 32px | 4px 12px | `--r-pill` | transparent | `1px dashed var(--border-strong)` | add filter |
| `.chip-quick` | 28px | 4px 12px | `--r-pill` | `var(--surface)` | `1px solid var(--border)` | AI quick pick |
| `.chip-inline-link` | — | 0 | — | none | none | inline text link in chip row |

### Tooltip / popover

- **Tooltip** `.tip` / `.tip-body` — absolute, anchored bottom, `background: var(--n-11); color: var(--n-1); font-size: 11.5px; padding: 6px 9px; border-radius: var(--r-sm);` shown on `:hover`/`:focus-within`.
- **Chip popover** `.chip-popover` — custom CSS: `position: absolute; top: calc(100% + 6px); background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-md); box-shadow: var(--sh-hover);` Anchored via `.chip-anchor { position: relative }`.
- **Mode badge popover** `.mode-badge-pop` — 260px hover popover.

> `@radix-ui/react-popover` is installed but **not used** for these patterns. Tooltips/popovers are bespoke CSS.

### Banners

- `.preview-banner` — `background: color-mix(in oklab, var(--ai-7) 6%, var(--surface)); border: 1px solid color-mix(in oklab, var(--ai-7) 22%, transparent); border-radius: var(--r-md); padding: 10px 12px;`
- `.mode-chip-banner` — `background: var(--warn-2); border: 1px solid rgba(138,100,24,.25); color: var(--warn-9); padding: 6px 10px; border-radius: var(--r-sm); font-size: 13px; font-weight: 500;`
- `.brand-stripe` — 3px full-width navy→red gradient bar at the top of every page (`AppShell.tsx`).

### Modals

Use `@radix-ui/react-dialog`. Two existing skins:

- **GateModal** — `.gate-modal__overlay` (`rgba(15,20,35,.45)` + `blur(2px)`, z 80) and `.gate-modal` (`min(420px, calc(100vw - 32px))`, `--r-lg`, padding 22/22/18, soft shadow, z 81). Animations: `gate-fade` 160ms, `gate-pop` 200ms with `--ease`.
- **AITeamUnlock** — `.unlock-overlay__scrim` (`rgba(10,14,28,.62)` + `blur(4px)`, z 90) and `.unlock-overlay` (`min(760px, calc(100vw - 32px))`, `--r-lg`, z 91, deeper shadow). Has an animated top stripe (`linear-gradient(90deg, var(--ai-7) 0%, var(--blue-7) 50%, oklch(0.70 0.16 162) 100%)`).

### Avatars & coachmark

- `.hunter-avatar-32` — 32×32, circle, `background: var(--blue-7); color: white`.
- `.hunter-lead-avatar` — 32×32, circle, `background: var(--ai-9); color: #fff`.
- `.meet-hunter-card` — coachmark card, `border: 1px solid color-mix(in oklab, var(--ai-7) 30%, var(--border)); border-radius: var(--r-lg); background: var(--surface);` with a 40px AI-tinted avatar. Animation: `meet-pop` 280ms with `--ease`.

### AI surface patterns

- `.ai-surface` — `var(--ai-grad)` background, gradient border via mask trick, subtle noise overlay.
- `.ai-glyph` — 22×22 tile, radius 6px, `linear-gradient(135deg, var(--ai-6), var(--ai-7))`, white icon.
- `.hunter-strip` — inline AI attribution: `background: color-mix(in oklab, var(--ai-7) 5%, var(--surface)); border-left: 2px solid var(--ai-7); border-radius: 0 var(--r-sm) var(--r-sm) 0`.

---

## 9. What NOT to use

These constraints are derived from absence in the codebase. Don't introduce them without an explicit ask.

- **No dark mode.** Zero `@media (prefers-color-scheme: dark)`, `[data-theme=dark]`, or `.dark` overrides anywhere.
- **No purple, violet, pink, cyan, orange, or cool-gray families.** Only: warm neutrals, federal blue, AI amber, brand red, urgency red, positive sage, warn ochre. (One teal exists only as inline OKLCH for the Ava card.)
- **No radial gradients.** Only `linear-gradient`, and only in: buttons (`--btn-*`), `.ai-surface` (`--ai-grad`), `.brand-stripe`, the unlock stripe, `.hunter-lead` top fade, and AI borders.
- **No shadcn/ui.** Don't import from `@/components/ui/*` — it doesn't exist. Build with the bespoke classes above.
- **No icon libraries other than `lucide-react`.**
- **No Tailwind utility classes in JSX.** `source(none)` is set; the project uses bespoke class names + inline `style={}`.
- **No `@theme {}` block.** Define tokens as `:root` custom properties in `src/styles/tokens.css` if you ever need to extend (and only with an explicit ask — this doc is descriptive, not prescriptive).
- **No new spacing tokens.** Stick to the defined `--s-*` steps; the gaps in the scale are intentional.

---

## 10. Known inconsistencies (don't propagate)

- `DM Sans` and `Sora` are referenced in `.knows-you-*` classes in `src/styles.css` but are **not loaded** in the Google Fonts `@import` and have no `--font-*` token — they silently fall back to system-ui.
- `var(--font-display, var(--font-ui))` is used in a few places; `--font-display` is **never defined** and always falls through to `--font-ui`.
- Two `12px` `border-radius` values are off-token: `.ky-modal-content` and `.ai-search-input`.
- The Ava teal hue exists only as raw inline `oklch(...)` values, not as a token.

When editing nearby code, prefer the canonical tokens over perpetuating these inconsistencies — but don't refactor them in a polish pass unless asked.

---

**Verified against:**
- `src/styles.css`
- `src/styles/tokens.css`
- `src/styles/components.css`
- `package.json`
- `src/components/Hunter/OpportunityCard.tsx`
- `src/components/Hunter/HunterLead.tsx`
- `src/components/Hunter/AISearchBar.tsx`
- `src/components/Hunter/RefinementChips.tsx`
- `src/components/Hunter/ChipPopover.tsx`
- `src/components/Hunter/PreviewBanner.tsx`
- `src/components/Hunter/GateModal.tsx`
- `src/components/Hunter/ModesPrimer.tsx`
- `src/components/Hunter/MeetHunterSpotlight.tsx`
- `src/components/Hunter/AITeamUnlock.tsx`
- `src/components/Companion/Companion.tsx`
- `src/components/Layout/AppShell.tsx`

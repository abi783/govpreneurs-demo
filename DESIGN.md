# Govpreneurs — design contract

Judgement lives here; values live in the stylesheet. Plain CSS custom properties
and bespoke class names with inline `style={}`: no Tailwind utilities in JSX
(`source(none)`), no `@theme`, no shadcn/ui (the repo's own `@/components/ui` is fine), icons from `lucide-react` only.
Where `docs/frontend-v2/KNOWLEDGE_DESIGN_SYSTEM.md` disagrees (it predates the
`--insight-*`, `--ava-*`, `--hl-*` tokens), this file and `tokens.css` win.

## Tokens
Source of truth: `src/styles/tokens.css` (`:root`). Read values there; never copy
them into components. `src/sc/design-system/tokens.css` is the Success Center
copy and may drift from it — change `src/styles/tokens.css`.
- **Neutrals** `--n-0…12`, warm gray. Use the aliases: `--bg`, `--bg-subtle`,
  `--surface`, `--text`, `--text-2`, `--text-3`, `--border`, `--border-strong`.
- **Federal blue** `--blue-*`. `--accent` is the one primary-action colour;
  `--text-ink` for page headings.
- **Reserved families — one job each, never cross-used:**
  `--brand-*` brand moments only (logo, upsell, brand CTA, brand stripe) ·
  `--ai-*` any AI-written text (Hunter, Grant, Ava's drafts) · `--ava-*` Ava's own frame only ·
  `--insight-*` read-only analysis chrome · `--hl-*` the highlighted source span ·
  `--urg-*` deadlines under 7 days, destructive actions, errors.
- **Status** `--pos-*` verified or awarded · `--warn-*` pending or needs review.
- **Shape and motion** `--r-sm|md|lg|pill`, `--sh-*` elevation, `--ring-focus`
  (`--ring-focus-ai` on AI surfaces), `--ease`, `--d-fast|base|slow`.
- Check: `bash scripts/check-tokens.sh` (scans `src/styles.css`).

## Type roles
Fonts: Inter `--font-ui` (all UI) · Instrument Serif `--font-ed` (editorial
moments only) · JetBrains Mono `--font-mono` (notice IDs, UEI, codes, tables).
Classes in `src/styles/components.css`; body is 14px.
- Page heading `.t-heading` (20) · section `.t-subheading` (16) · hero only
  `.t-display-lg|xl|2xl`.
- Body `.t-body-lg` (15) · `.t-body` (14) · secondary `.t-body-sm` (13).
- Meta `.t-caption` (12) · overline `.t-label` (11, uppercase, sparingly).
- Numbers tabular (`.tnum`, tables get it by default).
- The plain sentence is the headline; the official term sits under it, smaller.

## Spacing
`--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 20 · `--s-6` 24 ·
`--s-8` 32 · `--s-10` 40 · `--s-12` 48 · `--s-16` 64 · `--s-20` 80. The gaps are
on purpose; no new steps. Layout: `--container-max` 1200, `--sidebar-w` 228.
Older components hard-code 7/10/14px; match nearby code when editing, use tokens
in new code.

## Surface mode: Operate
Product UI for a busy owner, not marketing. Calm and quiet; light theme only.
- One primary action per screen (`.btn-primary`); the rest `.btn-secondary` or `.btn-ghost`.
- Verdict first, then the data behind it.
- Status is a mark plus a label, never colour alone (the nine field states).
- AI output sits on the amber AI surface and names the agent that wrote it.
- A missing fact is a light grey row, never red, with "Add now" — plus
  "Have us do it — $<price>" when one of the nine real services fills it.
- Cards `.card` on `--surface`; the brand stripe tops every page (`AppShell`).

## Banned
- Raw hex, `var(--x, #hex)` fallbacks, unloaded font names (check-tokens.sh).
- New colour families, or a reserved family used outside its job.
- Dark mode, radial gradients, gradients outside buttons, AI surfaces and the stripe.
- Tailwind utilities in JSX, `@theme`, shadcn/ui (`components.json`), non-lucide icons.
  Reuse `@/components/ui` (Button, Card, Chip, GlossTerm, Input, Modal, Tabs, Avatar)
  first; a missing building block goes to the system queue, not a one-off.
- New spacing steps. Off-token `border-radius: 12px` (use `--r-md`).
- Raw `oklch(... 162)` for Ava (use `--ava-*`); `var(--font-display, …)` (use `--font-ui`).
- Confidence scores, completion percentages, badges, streaks, confetti.
- Exclamation marks; "please" in errors; "must" or "required" without what it gates.
- Invented done-for-you services; a done-for-you button on a fact that is not missing or error.
- The label code's banned words (`~/.claude/studio/GUARDRAILS.md`); the gate enforces them.

## Exceptions
Approved by Karthik, 19 October 2026. Mirrored in `.impeccable/config.json`.
1. `overused-font` Inter — the brand UI font, loaded and tokenised as `--font-ui`.
2. `overused-font` Instrument Serif — the brand editorial font, `--font-ed`.
3. `src/sc/design-system/preview/**` ignored — static design-system specimen pages, not routed product UI.
4. `src/sc/design-system/ui_kits/**` ignored — a static UI-kit mock, not routed product UI.
5. Forecast pages (`.fc-shell`, `.fc-detail-shell`) move `--warn-*` to hue 326 —
   ochre warn read as AI amber inside Grant's frame. Scoped there until the app adopts it.

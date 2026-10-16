# Brief for every page agent

You are one of seven agents building pages of the GovPreneurs **sales demo** at
the same time. The lead agent merges your branch when you finish. Read this whole
file first, then your own task in the prompt.

## What the demo is

A copy of the production GovPreneurs member app (the frontend that members use
inside GoHighLevel), running as a static site with **sample data only**: no
backend, no login, no network. A founder (Tim) shows it live on sales calls. The
sample member is **Amira Haddad, Haddad Catering & Food Services LLC**, a
woman-owned caterer in Fayetteville, NC.

## The quality bar (non-negotiable)

On a live sales call, any click that does nothing, any spinner that never ends,
any error, blank page, "undefined", "NaN", or text about the wrong business
makes the company look broken. So:

1. **Every clickable thing does something visible.** If it does nothing, it must
   not look clickable (remove it or make it plain text).
2. **Actions that would reach a real system end in a believable success**:
   booking a call, buying a service, uploading a file, sending to a mentor,
   ticking a task, saving, editing a profile field. Keep the result in the demo
   store (below), so it is still there after a reload and on other pages.
3. **Downloads produce real files** (PDF / Word / Excel / text), never a 404.
4. **Uploads accept a file** (any file), show it, and treat it as done.
5. **No dead ends.** Every link goes to a real page in this app. Nothing opens
   app.govpreneurs.com, GHL, Stripe, Intercom or any outside site.
6. **Free text input** (chat boxes, search boxes, forms) always gets a sensible
   response. Chat answers are scripted; unknown questions get a helpful reply
   that offers the nearest scripted questions as buttons.
7. **Desktop widths 1280–1920 px look right; 1024 px does not break.**

## Where things are

- Repo: your git worktree (path in your prompt), branch `area/<your-area>`.
  Do not touch other worktrees. Do not push. Commit on your branch in small
  commits; message style: short imperative subject, blank line, body if
  useful, then a blank line and
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Use
  `git -c user.name="Shyam" -c user.email=abi@gocsm.com commit ...`.
- Stack: Vite 7, React 19, TanStack Router (file routes in `src/routes/`, plain
  SPA), Tailwind v4, bun. `bun run check` = `tsc --noEmit` + build.
- Read-only sources you will lift or consult (never edit them):
  - Production backend, for real response shapes: `/private/tmp/claude-501/-Users-shyamraja257/21f2c100-4d67-454b-aaa6-527ceed17dec/scratchpad/prod-main/backend`
  - Success Center (Next.js) app: `/private/tmp/claude-501/-Users-shyamraja257/21f2c100-4d67-454b-aaa6-527ceed17dec/scratchpad/sc-main`
  - Karthik's prototype (has Haddad Catering data and Ava): `/private/tmp/claude-501/-Users-shyamraja257/21f2c100-4d67-454b-aaa6-527ceed17dec/scratchpad/karthik-main`
  - Forecasts prototype branch (40 real catering forecasts): `/Users/shyamraja257/Desktop/GovPreneurs-Forecasts-UI` (read with `git -C ... show HEAD:<path>`; do not change branches)

## The story — the single source of truth

`src/demo/story/` (owned by the lead; **do not edit**):

- `persona.ts` — PERSONA (every fact about Amira's business), PAST_PERFORMANCE
  (4 past jobs), MENTOR (Sarah Mitchell — the only mentor name in the story),
  KEY_PARTNER (Carolina Dining Group).
- `opportunities.ts` — every opportunity: titles, agency, value, place, posted
  and closing days, set-aside, Hunter's tier/score/rank/line/fit facts, Grant's
  call, saved flag, Pipeline pursuit, Ava state, mentor review link. HERO_IDS
  names the three walkthrough opportunities. FOR_YOU and AVA_BIDS are derived.
- `workspace.ts` — closed pursuits (submitted / won / not awarded), mentor
  reviews, wallet, tasks.
- `grantBriefs.ts` — what Grant says on the hand-written reviews.
- `places.ts` — places and miles from her kitchen. `clock.ts` — dates.

Rules:
- **Never type a story fact twice.** Import it. If you need a fact the story
  lacks, derive it in your own files from story facts and list it in your
  report under "Story requests"; the lead will decide.
- **Dates:** only through `clock.ts` (`daysFromNow`, `isoDaysFromNow`,
  `dateDaysFromNow`, `daysUntil`). No fixed calendar dates for anything that
  is upcoming or recent. Past performance dates are history and stay fixed.
- **Words:** plain English, short sentences, "you" to the member. No promise of
  winning. Never mention HigherGov. No real company as a bidder, incumbent or
  partner (government buyers are real; companies are fictional). No roofing,
  Marcus Williams, Williams Construction, NAICS 238160, "Amira's Kitchen",
  "Diana Potts" or `DEMO-…` IDs — the crawl fails on them, including in
  placeholder, title, aria-label and alt text. Production code has roofing
  examples in copy and placeholders: find and fix every one on your pages.

## The demo runtime (built by the shell)

- `src/demo/runtime/router.ts` — every backend call goes here. Register
  handlers in your area file `src/demo/api/<area>.ts` as
  `{ method, path, handler(ctx) }`; `ctx = { params, query, body, method, url, headers }`.
  Return plain data (200 JSON) or `demoResponse(status, body)`. Paths for
  frontend-v2 code have no prefix (`/opportunities/...`); paths for lifted
  Success Center code keep `/api/...`. Unhandled calls fail the crawl.
- `src/demo/api/ENDPOINTS.md` — the inventory of all 93 frontend-v2 calls with
  request/response types and owning area. Read your areas' sections.
- `src/demo/runtime/store.ts` — `readDemoState`, `writeDemoState`,
  `updateDemoState`, `useDemoState`, `subscribeDemoState`; persisted to
  sessionStorage; `resetDemo()` clears it. Name your keys `<area>.<thing>`.
- `src/demo/state/` (lead-owned, already working): `workspace.ts` (saved list,
  saved searches, `registerSavedResolver` for non-story saved keys),
  `wallet.ts` (balance, `chargeWallet`), `mentorReviews.ts` (Sarah's threads,
  `createReview`). The matching handlers (`/workspace*`, `/wallet/*`,
  `/mentor-reviews*`, `POST /opportunities/send-for-review`) are done. Use these
  modules; do not keep a second copy of saved items, money or reviews.
- `src/demo/runtime/refresh.ts` — `demoRefresh()` / `useDemoRefresh()`.
- `src/demo/nav/` — `menuLinks.ts` (`navigateToMenuLink(id)` for GHL menu-link
  ids), `navigate.ts`, `searchIndex.ts` (`registerSearchEntries`). Opportunities,
  Ava bids and mentor reviews are already registered from the story.
- `src/demo/sc/ScPage.tsx` — wrap lifted Success Center pages
  (`<ScPage legacy?>`): sets the 16 px root font and the scope class.
- `src/demo/shims/` — `next/link`, `next/navigation`, `next/image`,
  `next/dynamic` are aliased to these. `useRouter().refresh()` = `demoRefresh()`.
- `src/sc/` — lifted Success Center code, mirroring sc-main's `src/` layout.
  Rewrite `from "@/` → `from "@sc/` (and `import("@/` → `import("@sc/`) in
  lifted files; keep everything else verbatim where you can. Files under
  `src/sc/lib/**`, `src/sc/components/ui/**` and `src/sc/design-system/**` may
  be lifted by more than one agent: copy them verbatim (only the import
  rewrite), so identical copies merge cleanly. Put changes in your own
  page-specific files or wrappers. Shim files marked "do not overwrite" stay.
- Server-only Success Center code (Prisma, `node:fs`, GHL API calls, route
  handlers) never comes across. Its data becomes a sample payload built from the
  story, and its `/api/...` calls become handlers in your area file.
- `package.json` is frozen. Do not add packages. If you truly need one, stop and
  say so in your report.

## Editing production code

Production components are the product Tim is showing, so keep them as they are.
Make them work by **feeding them complete, correct data** through handlers.
Change a production file only when it does something a demo cannot (GHL,
outside URLs, real uploads) or shows wrong-business copy. Mark each change with
a `// DEMO:` comment and list every changed production file in your report.

Own only your files (listed in your prompt). If you must touch a file another
agent owns, don't — list it in your report and the lead will do it.

## Testing — you are done only when all of this passes

1. `bun run check` passes.
2. `bunx vitest run <your test paths>` passes for any tests you touch.
   `bunx vitest run src/demo/story` must stay green.
3. **Crawl your routes** with zero failures and zero dead clicks:
   `QA_PORT=<your port> QA_WORKERS=2 QA_ROUTES=/a,/b bun run qa:crawl`
   then read `qa/report/crawl.md`. Add your deep routes (detail pages, tabs,
   sub-pages, every Ava bid, every hero opportunity) to
   `qa/area-routes/<your-file>.ts` so they are crawled too. The crawl only
   counts what it can see: also click through your multi-step flows yourself
   in a Playwright script if a flow needs more than one click (for example
   open a dialog, fill it, submit, see the result).
4. **Look at your pages.** `QA_PORT=<port> QA_ROUTES=/a,/b bun run qa:shots`
   writes `qa/report/shots/*.png`; open them with your Read tool and check them
   like a designer would: layout, spacing, no overflow, no placeholder-looking
   content, numbers that agree with the story. Fix what looks wrong.
5. Keep CPU in mind: six other agents run on the same laptop. Use
   `QA_WORKERS=2`, crawl only your routes, and don't leave servers running.

## Your report (under 500 words)

What works (by route), files you own and created, every production file you
changed and why, endpoints you implemented, endpoints you need from other
areas, crawl result (paste the summary line per route), anything that still
fails, and "Story requests". No file dumps.

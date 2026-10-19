# GovPreneurs sales demo

The member app that Tim shows on sales calls, running on sample data. It is a
copy of the production frontend (`frontend-v2` from `abi783/govpreneures` at
commit `fddbf283`, 16 Oct 2026), plus:

- the Success Center pages members reach from the GoHighLevel menu (Success
  Center, Roadmap, Tasks, My Business, Mentors), lifted from
  `msjose14/GovPreneurs-Success-Center`;
- Ava, the bid-writing agent, lifted from Karthik's prototype
  (`sunny-gocsm/govpreneurs-prototype`);
- a left menu that copies the GoHighLevel member menu.

There is **no backend, no login and no network call**. Every API call is answered
in the browser from sample data about one fictional member. There are seven
(`src/demo/member.ts`, D85, D93): **Lantern Row Creative** (ad agency, the Level
Up story and the default), **Haddad Catering**, **Ninebark Builders**
(construction), **Rockfish Run Freight** (trucking), **Gallberry Technology
Group** (IT services), **Coppervale Advisory Group** (consulting) and **Gray Owl
Facility Services** (janitorial). Add `?member=<id>` to any URL (`agency`,
`caterer`, `construction`, `trucking`, `it`, `consulting`, `janitorial`), or use
the presenter panel (Shift+Alt+P), to switch. A new member is one folder:
`src/demo/members/README.md`.

## For Abhi: build and host

Requirements: [bun](https://bun.sh) 1.3 or later.

```bash
bun install
bun run build          # output in dist/
```

`dist/` is a static site. Host it anywhere that serves static files (Cloudflare
Pages, Netlify, S3 + CloudFront, DigitalOcean App Platform static site, nginx).

**One rule:** the app is a single-page app. Every path that is not a file must
return `dist/index.html` (an "SPA fallback"). Examples:

- nginx: `try_files $uri /index.html;`
- Netlify: `_redirects` with `/*  /index.html  200`
- Cloudflare Pages: works by default
- DigitalOcean App Platform: set the catch-all document to `index.html`

The app is built for the root path (`/`). The domain is `demo.govpreneurs.com`,
which today points at an older Lovable project.

No environment variables are needed. Do not set `VITE_POSTHOG_KEY`: the demo
should not send analytics.

## Check it before you deploy

```bash
bun run check          # type check + production build
bunx vitest run        # unit tests, including the story checks
bun run qa:crawl       # opens every page in a headless browser and clicks every
                       # button; fails on any error, dead click or outside call
```

`bun run qa:crawl` takes about 15 minutes with 4 workers. To test a few pages:
`QA_ROUTES=/,/roadmap bun run qa:crawl`. The report is `qa/report/crawl.md`.
`bun run qa:shots` saves full-page screenshots to `qa/report/shots/`.

## How it works

| Folder | What is in it |
|---|---|
| `src/demo/members/<member>/` | Each member's own story data: persona, opportunities, workspace, Grant briefs, Sarah's replies, and per-area content. |
| `src/demo/story/` | **The story.** The shapes and rules, and the active member's facts: every opportunity, Grant's calls, the pipeline, tasks, mentor reviews and the wallet. Every page reads from here. `check.ts` proves each Hunter reason is true. |
| `src/demo/runtime/` | The fetch interceptor and router that answer every API call in the browser, and the store that keeps the visitor's changes in `sessionStorage`. |
| `src/demo/api/` | One file per area with the API handlers. `ENDPOINTS.md` lists every call the app makes. |
| `src/demo/state/` | Shared state: saved list, wallet, mentor reviews. |
| `src/demo/shell/` | The left menu, search palette, sample-data strip and "Reset demo". |
| `src/demo/presenter/` | The presenter panel (Shift+Alt+P): Sarah answers, award, jump to a story segment, booth mode. Decisions D80–D84. |
| `src/demo/<area>/` | Sample data and helpers for one area (hunter, grant, ava, explore, sc/…). |
| `src/sc/` | Code lifted from the Success Center app, with `next/*` replaced by shims in `src/demo/shims/`. |
| `src/routes/`, `src/components/`, `src/lib/` | Production frontend code. Demo changes are marked `// DEMO:`. |
| `qa/` | The crawl, screenshot and flow tests. |

**Dates** are relative: every deadline counts from the day the page opens, so
the demo never goes stale.

**Reset:** the "Reset demo" button at the top restores the starting story. Use
it between calls.

## Changing the story

Edit `src/demo/story/`, then run `bunx vitest run src/demo/story`. The test fails
if a Hunter reason is not true of the member, a date is in the past, or two pages
would disagree.

## Decisions

`DECISIONS.md` lists every decision made while building the demo.

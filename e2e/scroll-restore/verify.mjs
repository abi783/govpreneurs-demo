/**
 * Manual verification for feed scroll restoration.
 *
 * This is a SCRIPT, not a spec: `main` has no stubbed SPA e2e tier and no
 * `test:e2e` wiring, and the first attempt at this feature shipped broken
 * precisely because it was reasoned about instead of run. It is kept so the
 * claim can be re-checked rather than taken on trust.
 *
 *   cd frontend-v2 && npx vite --port 5199 --strictPort   # in one shell
 *   node e2e/scroll-restore/verify.mjs                    # in another
 *
 * The whole backend is stubbed, so nothing but the dev server is needed.
 *
 * TWO SCENARIOS, because the app runs in two different scroll regimes and only
 * one of them is what production actually does:
 *
 *   standalone — the app owns the document, so `window` scrolls.
 *   embedded   — the app is in a GoHighLevel custom-page iframe the parent has
 *                sized to its content. The inner document never scrolls;
 *                `window.scrollY` is pinned at 0 and `window.scrollTo` is inert.
 *                Only `scrollIntoView` and an IntersectionObserver work here.
 */
import { chromium } from "@playwright/test";

const APP = process.env.E2E_BASE_URL ?? "http://localhost:5199/v2/ui/";
const API = /localhost:3000/;
const CARD = "a.ui-card--opp";
const ROWS = 30;
const PARENT_CHROME = 60;

const opp = (i) => ({
  id: `opp-${i}`,
  title: `Roof replacement package ${i}`,
  scope: "fed",
  geminiPlainEnglishTitle: null,
  agency: { name: "Dept of Veterans Affairs" },
  noticeType: "Solicitation",
  responseDeadline: new Date(Date.now() + 86400000 * (10 + i)).toISOString(),
  postedDate: new Date(Date.now() - 86400000).toISOString(),
  setAside: "SBA",
  naicsCode: "238160",
  valEstLow: 100000,
  valEstHigh: 500000,
  placeOfPerformance: { state: "VA", city: "Richmond" },
  status: "active",
  quickSummary: "Replace roofing across three facilities.",
  relevanceScore: 90 - i,
  tier: "strong",
  matchReasons: ["NAICS 238160 matches your profile"],
  matchBreakdown: { eligible: true, certifiable: true },
  scoreBreakdown: { businessCategoryMatch: 40, certificationMatch: 30, locationMatch: 20 },
});

const ALL = Array.from({ length: ROWS }, (_, i) => opp(i));

const json = (body) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

/** Installs the whole backend. Returns a live count of feed requests. */
async function stub(page, extraHtml) {
  const state = { discoverCalls: 0 };
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("ghl_token", "stub-token");
    } catch {
      /* private mode — the session stub below still answers */
    }
  });
  // Catch-all first: Playwright runs route handlers in REVERSE registration
  // order, so the specific ones below have to be registered after it to win.
  await page.route("**/*", async (route) => {
    const url = route.request().url();
    if (extraHtml && url === "http://ghl.test/")
      return route.fulfill({ status: 200, contentType: "text/html", body: extraHtml });
    if (API.test(url)) return route.fulfill(json({}));
    return route.fallback();
  });
  await page.route("**/users/from-highlevel", (r) =>
    r.fulfill(
      json({
        userId: "u1",
        companyId: "c1",
        activeLocation: "loc-1",
        locationId: "loc-1",
        contactId: "ct1",
        userName: "Test Member",
        email: "t@example.com",
        role: "user",
        type: "location",
        isAgencyOwner: false,
        appStatus: "active",
        productId: null,
        priceId: null,
        planId: null,
        subscriptionId: null,
        isMentor: false,
        isLocationExist: true,
        saasMode: null,
        grantV2: true,
      }),
    ),
  );
  // Deliberately SLOW. These defaults seed the filters after mount, which
  // changes the feed key — the race that broke restoration in production. A
  // fast stub hides the bug.
  await page.route("**/opportunities/filters/defaults*", async (r) => {
    await new Promise((done) => setTimeout(done, 400));
    return r.fulfill(
      json({
        naics: ["238160"],
        setAsides: ["SBA"],
        states: ["VA"],
        cities: [],
        hasCapabilityStatement: true,
      }),
    );
  });
  await page.route("**/workspace", (r) => r.fulfill(json({ savedOpps: [], savedSearches: [] })));
  // Hunter's Take arrives LATE and REPLACES a card's reasoning line with a much
  // longer one, so cards visibly grow after the feed has already been scrolled.
  // A restore that does not carry the takes across re-renders the rows at
  // different heights and the member's place slides. Without this stub the
  // harness cannot see that at all.
  await page.route("**/hunters-take/feed", async (r) => {
    await new Promise((done) => setTimeout(done, 900));
    const ids = r.request().postDataJSON()?.oppKeys ?? [];
    return r.fulfill(
      json({
        takes: ids.map((oppKey) => ({
          oppKey,
          line:
            "Hunter's Take: worth your time. You have delivered three comparable packages " +
            "for this agency in the last two years, the set-aside matches your certification, " +
            "and the place of performance is inside the radius you already serve. The " +
            "incumbent has held it since 2019, so expect a real fight on price.",
        })),
      }),
    );
  });
  // The detail page, so the "back" control it renders is the real one. Relying
  // on the catch-all here left the page in an error state with no way back.
  await page.route("**/opportunities/discover/v2/*", (r) => {
    const id = decodeURIComponent(new URL(r.request().url()).pathname.split("/").pop());
    const found = ALL.find((o) => o.id === id);
    return found ? r.fulfill(json(found)) : r.fulfill({ ...json({ message: "no" }), status: 404 });
  });
  await page.route("**/opportunities/discover/v2", (r) => {
    state.discoverCalls++;
    return r.fulfill(
      json({
        data: ALL,
        total: ROWS,
        page: 1,
        limit: ROWS,
        totalPages: 1,
        profileIndexing: false,
      }),
    );
  });
  return state;
}

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}\n      ${detail}`);
}

/** The app owns the document: window scrolls, so the exact offset is restorable. */
async function standalone(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const state = await stub(page);
  await page.goto(APP);
  await page.locator(CARD).first().waitFor({ timeout: 20000 });
  // Long enough for the first windows of takes to land, so the heights the
  // member scrolls through are the settled ones.
  await page.waitForTimeout(5000);

  // The member's place is a ROW plus how far into it they are — not a pixel
  // offset, which says nothing once card heights change.
  const place = () =>
    page.evaluate(() => {
      const cards = [...document.querySelectorAll("a.ui-card--opp")];
      const top = cards.find((c) => c.getBoundingClientRect().bottom > 0);
      return {
        y: Math.round(window.scrollY),
        row: top ? top.getAttribute("href").split("/").pop() : null,
        within: top ? Math.round(top.getBoundingClientRect().top) : null,
        n: cards.length,
      };
    });

  await page.evaluate(() => window.scrollTo(0, 2600));
  await page.waitForTimeout(1200);
  const before = await place();

  // Click a row that is already on screen: an off-screen one makes Playwright
  // scroll the page first, which is a harness artefact, not member behaviour.
  await page.locator(CARD).nth(9).click();
  await page.waitForTimeout(1500);
  const callsAtLeave = state.discoverCalls;

  await page.locator('a[href$="/opportunities"], a.opp-detail__back').first().click();
  await page.locator(CARD).first().waitFor({ timeout: 20000 });
  // Past the takes delay and the settle window, so any drift has happened.
  await page.waitForTimeout(5000);

  const after = await place();
  const refetched = state.discoverCalls - callsAtLeave;
  const drift = Math.abs((after.within ?? 0) - (before.within ?? 0));

  check(
    "standalone: the member's exact place comes back",
    after.y === before.y && after.row === before.row,
    `scrollY ${before.y} → ${after.y}, top row ${before.row} → ${after.row}`,
  );
  check(
    "standalone: and it STAYS there once the takes land",
    after.row === before.row && drift <= 4,
    `offset within the top row moved ${drift}px after the list finished settling`,
  );
  check(
    "standalone: the list is replayed, not re-fetched",
    refetched === 0 && after.n === ROWS,
    `${refetched} feed requests on return, ${after.n} rows on screen`,
  );

  // The skip that protects a restored list must not freeze the feed.
  const callsBeforeSearch = state.discoverCalls;
  await page.getByLabel("Search opportunities").fill("roofing");
  await page.waitForTimeout(2000);
  check(
    "standalone: a real change still reaches the server",
    state.discoverCalls - callsBeforeSearch >= 1,
    `${state.discoverCalls - callsBeforeSearch} feed requests after typing a search`,
  );
  await page.close();
}

/** Production's regime: the parent frame scrolls, the inner document does not. */
async function embedded(browser) {
  const parent = `<!doctype html><meta charset=utf-8><body style="margin:0">
<div style="height:${PARENT_CHROME}px;background:#eee">host chrome</div>
<iframe id=app src="${APP}" style="width:100%;height:12000px;border:0;display:block"></iframe>
</body>`;
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const state = await stub(page, parent);
  await page.goto("http://ghl.test/");
  const frame = page.frameLocator("#app");
  await frame.locator(CARD).first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(1400);

  const inner = () => page.frames()[1];
  const innerScrolls = await inner().evaluate(
    () => document.documentElement.scrollHeight > document.documentElement.clientHeight + 4,
  );
  check(
    "embedded: the harness really is in the parent-scrolls regime",
    innerScrolls === false,
    `inner document scrollable: ${innerScrolls} (must be false, or this scenario proves nothing)`,
  );

  // The inner rects never move here, so identify a row by the iframe-relative y
  // the member is actually looking at.
  const rowAt = (parentY) =>
    inner().evaluate((y) => {
      for (const a of document.querySelectorAll("a.ui-card--opp")) {
        const r = a.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) return a.getAttribute("href").split("/").pop();
      }
      return null;
    }, parentY - PARENT_CHROME);

  await page.evaluate(() => window.scrollTo(0, 2600));
  await page.waitForTimeout(500);
  const beforeY = await page.evaluate(() => Math.round(window.scrollY));
  const beforeTop = await rowAt(beforeY);
  const innerY = await inner().evaluate(() => Math.round(window.scrollY));

  await frame.locator(CARD).nth(9).click();
  await page.waitForTimeout(1500);
  const callsAtLeave = state.discoverCalls;
  await frame.locator('a[href$="/opportunities"], a.opp-detail__back').first().click();
  await frame.locator(CARD).first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(1800);

  const afterY = await page.evaluate(() => Math.round(window.scrollY));
  const afterTop = await rowAt(afterY);

  check(
    "embedded: window.scrollY is useless here, as assumed",
    innerY === 0,
    `inner window.scrollY read ${innerY} while the member was 2600px down`,
  );
  check(
    "embedded: the member's row comes back",
    afterTop === beforeTop && afterY > 100,
    `top row ${beforeTop} → ${afterTop}, parent scrollY ${beforeY} → ${afterY}`,
  );
  check(
    "embedded: the list is replayed, not re-fetched",
    state.discoverCalls - callsAtLeave === 0,
    `${state.discoverCalls - callsAtLeave} feed requests on return`,
  );
  await page.close();
}

const browser = await chromium.launch({
  // Chrome blocks a public-origin page from embedding a localhost iframe. The
  // embedded scenario needs a cross-origin parent, so the check is off for this
  // harness only.
  args: [
    "--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessChecks,BlockInsecurePrivateNetworkRequests",
  ],
});
try {
  await standalone(browser);
  await embedded(browser);
} finally {
  await browser.close();
}
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);

import { test, expect, type Page } from "@playwright/test";

// The API origin the SPA talks to (`VITE_API_BASE_URL`). ONLY this origin is
// intercepted: a global route glob puts every Vite dev module through the
// interception layer too, which made the page render nothing at all.
const API = "http://localhost:3000";

/**
 * The flag, end to end in a real browser: which Grant does a member actually see?
 *
 * Everything below the session is stubbed, and `grantV2` on the session payload
 * is the ONLY thing that varies between the two suites — the same page, the same
 * opportunity, the same stubs. That is what makes this a test of the gate rather
 * than of two different fixtures.
 *
 * Unlike the sibling `grant-*.spec.ts` files, this one boots the REAL SPA route
 * (`/opportunities/:noticeId`), because the gate lives in the route, not in a
 * component. A harness would have to copy the conditional, and a copied
 * conditional passes whatever the real one does.
 */

const OPP = "opp-flag-1";
const LOCATION = "9wKbxIFWAuAatmUlyrHI";

/** Marks the v1 surface — `GrantsTakeCard`'s root. */
const V1 = 'section[aria-label="Grant\'s take"]';
/** Marks the v2 surface — `GrantCanvas`'s root (skeleton included, same label). */
const V2 = 'section[aria-label="Grant\'s analysis"]';

const OPPORTUNITY = {
  id: OPP,
  title: "Fort Bragg HVAC Maintenance",
  agency: { name: "Department of the Army" },
  responseDeadline: "2026-12-01T00:00:00.000Z",
  placeOfPerformance: { city: "Fayetteville", state: "NC" },
  tier: "high",
  score: 72,
  scoreBreakdown: {},
  matchReasons: [],
  matchBreakdown: {},
  description: "Routine HVAC maintenance.",
  keyDates: [],
};

// Built from the `GrantTake` interface in `src/lib/grantsTakeApi.ts`, NOT from a
// guess. A flat `eligibility_plain` shape crashed the page into its error
// boundary, and a crashed page fails an assertion the same way a working gate
// with the wrong verdict would.
const V1_TAKE = {
  oppKey: OPP,
  recommendation: "bid",
  hunter_verdict: "bid",
  verdict_summary: "Worth bidding — this is your trade on a base you know.",
  next_step: "Download the solicitation and confirm the site visit date.",
  fields: {
    eligibility: { status: "good", line: "You hold the certification this is reserved for." },
    scope_fit: { status: "good", line: "HVAC maintenance is your core trade." },
    location: { status: "good", line: "Fayetteville is inside your service area." },
    contract_size: { status: "warn", line: "In your usual range." },
    proposal_readiness: { status: "good", line: "You have what you need." },
    your_edge: { status: "good", line: "You have done this base before." },
  },
  data_completeness: "full",
};

/**
 * Every call the opportunity page makes, stubbed. `grantV2` is the single knob.
 * The analysis route is registered but records its calls, so "v1 rendered" can be
 * distinguished from "v2 was requested and merely failed to draw".
 */
async function boot(page: Page, grantV2: boolean) {
  const analysisCalls: string[] = [];

  // Catch-all FIRST: Playwright matches handlers in REVERSE registration order,
  // so the specific routes registered after this one win. Registered last, this
  // would swallow every stub below and the page would render an empty shell —
  // which is exactly how it failed the first time.
  // Catch-all FIRST: Playwright matches handlers in REVERSE registration order,
  // so the specific routes below win. Registered last it swallows them all.
  //
  // Every glob is anchored to `API`. An unanchored `**/workspace**` also matches
  // Vite's dev request for `src/lib/workspace.ts`, so the module is served JSON,
  // the module graph fails to load, and the page renders NOTHING — which looks
  // exactly like a broken assertion and is not one.
  await page.route(`${API}/**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    }),
  );

  await page.route(`${API}/users/from-highlevel`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        userId: "u1",
        companyId: "c1",
        activeLocation: LOCATION,
        locationId: LOCATION,
        contactId: "ct1",
        userName: "Test Member",
        email: "member@example.com",
        role: "admin",
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
        grantV2,
      }),
    }),
  );

  await page.route(`${API}/opportunities/discover/v2/${OPP}*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(OPPORTUNITY),
    }),
  );

  await page.route(`${API}/grants-take/opportunity`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ take: V1_TAKE }),
    }),
  );

  // What the backend does when the flag is off. Registered in BOTH suites so the
  // only difference between them stays the session payload.
  await page.route(`${API}/grants-take/analysis`, (route) => {
    analysisCalls.push(route.request().url());
    if (!grantV2) {
      return route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          message: "grant_v2 is not enabled for this location.",
        }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ analysis: null }),
    });
  });

  await page.route(`${API}/workspace**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ savedOpps: [], savedSearches: [] }),
    }),
  );
  await page.route(`${API}/wallet/balance**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ balance: 0 }),
    }),
  );
  await page.goto(`./opportunities/${OPP}`);
  return { analysisCalls };
}

test.describe("grant_v2 OFF — the member keeps the old Grant", () => {
  test("renders the v1 take and never the v2 canvas", async ({ page }) => {
    await boot(page, false);

    await expect(page.locator(V1)).toBeVisible();
    await expect(page.locator(V2)).toHaveCount(0);
  });

  test("does not even ask for the v2 analysis", async ({ page }) => {
    // Belt and braces on the backend's 403: with the flag off the client must
    // not call the gated endpoint at all, so a 403 never reaches a real member's
    // console and no work is queued behind the gate.
    const { analysisCalls } = await boot(page, false);
    await expect(page.locator(V1)).toBeVisible();
    expect(analysisCalls).toEqual([]);
  });

  test("shows the v1 take's actual content, not an empty shell", async ({
    page,
  }) => {
    await boot(page, false);
    await expect(page.locator(V1)).toContainText("Grant's take");
    await expect(page.locator(V1)).toContainText("HVAC maintenance is your core trade.");
  });

  test("renders no Grant rail", async ({ page }) => {
    await boot(page, false);
    await expect(page.locator(V1)).toBeVisible();
    await expect(page.locator(".grant-rail")).toHaveCount(0);
  });
});

test.describe("grant_v2 ON — the member gets the capture board", () => {
  test("renders the v2 canvas and never the v1 card", async ({ page }) => {
    await boot(page, true);

    await expect(page.locator(V2)).toBeVisible();
    await expect(page.locator(V1)).toHaveCount(0);
  });

  test("asks the backend for the analysis", async ({ page }) => {
    const { analysisCalls } = await boot(page, true);
    await expect(page.locator(V2)).toBeVisible();
    expect(analysisCalls.length).toBeGreaterThan(0);
  });
});

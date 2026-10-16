// E2E for the source-reference surface ported from govpreneurs-prototype PR #29
// (source references + conversation sources).
//
// Two halves:
//   real-*  — the shipped Fort Bragg fixture through the real GrantCanvas, to
//             prove each of the four sheet bodies is reachable in the app.
//   the rest — hostile pins: injection, navigation sinks, contract drift,
//             unbounded text. Driven from harness-source.tsx.
import { test, expect, type Page } from "@playwright/test";

/** An uncaught render error inside a modal is worse than on the page: the
 *  overlay is already up, so the member is left staring at a dead sheet. */
function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

async function open(page: Page, scenario: string): Promise<string[]> {
  const errors = watch(page);
  await page.goto(`e2e/harness-source.html?scenario=${scenario}`);
  return errors;
}

/** Click the chip and wait for the sheet. */
async function openSheet(page: Page, scenario: string): Promise<string[]> {
  const errors = await open(page, scenario);
  await page.locator(".grant-pin").first().click();
  return errors;
}

const sheet = (page: Page) => page.locator(".src-sheet");
const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

// ───────────────────────────── the four bodies ──────────────────────────────

test("the shipped fixture reaches a document body with surrounding context", async ({ page }) => {
  const errors = await open(page, "real-canvas");
  await page.locator("summary", { hasText: "See the full analysis" }).click();
  // Gate-strip pins are the compliance sourceClauses — those carry the excerpts.
  // (The identically-labelled §A.2 pin on read #1 is a BARE pin and resolves only
  // to the section — see "bare pins" below.)
  await page.locator(".grant-light .grant-pin", { hasText: "§L.4" }).first().click();
  await expect(sheet(page)).toBeVisible();
  await expect(sheet(page).locator(".src-doc__hit mark")).toBeVisible();
  await expect(sheet(page).locator(".src-doc__ctx")).toHaveCount(2); // before + after
  await expect(sheet(page)).toContainText("View only");
  expect(errors).toEqual([]);
});

test("a profile pin reaches the record body with the backing field highlighted", async ({
  page,
}) => {
  const errors = await open(page, "real-canvas");
  await page.locator("summary", { hasText: "See the full analysis" }).click();
  await page.locator(".grant-pin", { hasText: "Your profile" }).first().click();
  await expect(sheet(page)).toBeVisible();
  await expect(sheet(page).locator(".src-rec__row--pinned")).toHaveCount(1);
  await expect(sheet(page).locator(".src-rec__row")).not.toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a transcript pin reaches the thread body, with the cited turn marked", async ({ page }) => {
  const errors = await open(page, "real-canvas");
  await page.locator("summary", { hasText: "See the full analysis" }).click();
  await page.locator(".grant-pin", { hasText: "Diana" }).first().click();
  await expect(sheet(page)).toBeVisible();
  // R7 — the cited turn plus the turns around it.
  await expect(sheet(page).locator(".src-turn--pinned")).toHaveCount(1);
  expect(await sheet(page).locator(".src-turn").count()).toBeGreaterThan(1);
  // R8 — the derived learning is its own block, not mixed into the turns.
  await expect(sheet(page).locator(".src-learning")).toBeVisible();
  expect(errors).toEqual([]);
});

test("the shipped canvas strands no claim on a dead chip", async ({ page }) => {
  // This test used to assert the OPPOSITE — that a missing chip was reachable —
  // because the fixture's one award pin resolved to "unavailable". That pin was
  // the single most consequential claim on the board (who holds the incumbent
  // contract), and it opening nothing is the defect the public-record geometry
  // was built to fix. It now resolves to a register entry, so there is no dead
  // chip left to click. The unavailable BODY is still covered, by the harness
  // scenarios that carry a genuinely unreadable source.
  const errors = await open(page, "real-canvas");
  await page.locator("summary", { hasText: "See the full analysis" }).click();
  await expect(page.locator(".grant-pin")).not.toHaveCount(0);
  await expect(page.locator(".grant-pin--missing")).toHaveCount(0);
  // …and the award claim now opens the register rather than an apology.
  const publicChip = page.locator(".grant-pin--public").first();
  await expect(publicChip).toBeVisible();
  await publicChip.click();
  await expect(sheet(page).locator(".src-rec")).toBeVisible();
  await expect(sheet(page)).toContainText("Federal award record");
  await expect(sheet(page)).not.toContainText(/highergov/i);
  expect(errors).toEqual([]);
});

test("the production path (a non-demo opportunity) still resolves its pins", async ({ page }) => {
  // synthesize() emits bare section refs, and the section-text fallback needs the
  // noticeId to be a mock opportunity — so this is the shape every real opp has.
  const errors = await open(page, "real-synth");
  await page.locator("summary", { hasText: "See the full analysis" }).click();
  const all = await page.locator(".grant-pin").count();
  const dead = await page.locator(".grant-pin--missing").count();
  expect(all).toBeGreaterThan(0);
  // Every pin that resolves to "unavailable" is a chip the member taps to be told
  // there is nothing behind it. PR #29 §5 exists to keep this near zero.
  expect(dead).toBeLessThan(all);
  expect(errors).toEqual([]);
});

test("R6 · Escape closes the sheet and returns focus to the chip", async ({ page }) => {
  await open(page, "real-canvas");
  await page.locator("summary", { hasText: "See the full analysis" }).click();
  const chip = page.locator(".grant-light .grant-pin", { hasText: "§L.4" }).first();
  await chip.click();
  await expect(sheet(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet(page)).toHaveCount(0);
  await expect(chip).toBeFocused();
});

// ───────────────────────────── injection ────────────────────────────────────

for (const scenario of ["xss-doc", "xss-convo", "xss-unavail"]) {
  test(`markup in model text is rendered, not executed (${scenario})`, async ({ page }) => {
    const errors = await openSheet(page, scenario);
    await expect(sheet(page)).toBeVisible();
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    expect(await page.locator("img[src='x']").count()).toBe(0);
    await expect(sheet(page)).toContainText("<img");
    expect(errors).toEqual([]);
  });
}

// ───────────────────────────── navigation sinks ─────────────────────────────

for (const scenario of ["href-js", "href-data", "href-vbscript"]) {
  test(`a ${scenario.slice(5)}: ref never becomes a link`, async ({ page }) => {
    const errors = await openSheet(page, scenario);
    await expect(sheet(page)).toBeVisible();
    const hrefs = await sheet(page).locator("a[href]").evaluateAll((as) =>
      as.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""),
    );
    expect(hrefs.filter((h) => /^(javascript|data|vbscript):/i.test(h))).toEqual([]);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    expect(errors).toEqual([]);
  });
}

test("HigherGov is never surfaced to a member as a source link", async ({ page }) => {
  await openSheet(page, "href-highergov");
  await expect(sheet(page)).toBeVisible();
  await expect(sheet(page)).not.toContainText("highergov");
  expect(await sheet(page).locator("a[href*='highergov']").count()).toBe(0);
});

test("an off-origin source link opens with noopener and in a new tab", async ({ page }) => {
  await openSheet(page, "href-offsite");
  const link = sheet(page).locator("a[href^='https://evil.example.com']");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
});

test("a traversal-shaped record ref does not produce a traversal href", async ({ page }) => {
  const errors = await openSheet(page, "href-record-traversal");
  await expect(sheet(page)).toBeVisible();
  const hrefs = await sheet(page).locator("a[href]").evaluateAll((as) =>
    as.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""),
  );
  expect(hrefs.filter((h) => h.includes(".."))).toEqual([]);
  expect(errors).toEqual([]);
});

test("a hostile playAt does not break out of the play-from href", async ({ page }) => {
  const errors = await openSheet(page, "playat-weird");
  await expect(sheet(page)).toBeVisible();
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  expect(errors).toEqual([]);
});

// ───────────────────────────── contract drift ───────────────────────────────

const DRIFT = [
  "type-unknown",
  "ref-number",
  "ref-null",
  "ref-object",
  "turns-string",
  "turns-null",
  "convo-missing",
  "turns-dupe-id",
  "cited-missing",
  "turn-bad-role",
  "dates-bad",
  "excerpt-nonstring",
  "excerpt-empty",
  "empty-everything",
  "no-provenance",
];

for (const scenario of DRIFT) {
  test(`the invariant holds under drift: ${scenario}`, async ({ page }) => {
    const errors = await openSheet(page, scenario);
    // THE INVARIANT (resolve.ts header): every pin resolves to a real body.
    await expect(sheet(page)).toBeVisible();
    const body = sheet(page).locator(".src-sheet__body");
    expect((await body.innerText()).trim().length).toBeGreaterThan(0);
    const text = await sheet(page).innerText();
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("NaN");
    expect(text).not.toContain("Invalid Date");
    expect(text).not.toContain("[object Object]");
    expect(errors).toEqual([]);
  });
}

// ───────────────────────────── unbounded text ───────────────────────────────

for (const scenario of ["giant-doc", "giant-convo", "giant-locator"]) {
  test(`unbounded source text does not blow out the layout (${scenario})`, async ({ page }) => {
    const errors = await openSheet(page, scenario);
    await expect(sheet(page)).toBeVisible();
    expect(await overflow(page)).toBeLessThanOrEqual(1);
    // The sheet must stay inside the viewport — a modal taller than the screen
    // with no internal scroll strands the footer (and the escape hatch).
    const box = await sheet(page).boundingBox();
    const vh = page.viewportSize()!.height;
    expect(box!.height).toBeLessThanOrEqual(vh);
    expect(errors).toEqual([]);
  });
}

test("bidi / combining / emoji text renders without error", async ({ page }) => {
  const errors = await openSheet(page, "unicode");
  await expect(sheet(page)).toBeVisible();
  expect(await overflow(page)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

// ───────────────────── the agency posting, never the vendor ─────────────────
// HigherGov is where we GOT the opportunity; the issuing agency posted it
// publicly, and that posting is the only "source" we may send a member to.

/** Open a scenario with an explicit agency posting on the opportunity. */
async function openWithPosting(page: Page, scenario: string, sourcePath: string) {
  const errors = watch(page);
  await page.goto(
    `e2e/harness-source.html?scenario=${scenario}&sourcePath=${encodeURIComponent(sourcePath)}`,
  );
  await page.locator(".grant-pin").first().click();
  await expect(sheet(page)).toBeVisible();
  return errors;
}

test("a solicitation pin with no passage still reaches the agency's posting", async ({ page }) => {
  const errors = await openWithPosting(
    page,
    "posting-solicitation",
    "https://sam.gov/opp/abc123/view",
  );
  // The body is still the honest "no excerpt" state — the posting is an exit,
  // not a substitute for a passage we don't have.
  await expect(sheet(page).locator(".src-unavail")).toBeVisible();
  // ...but it is no longer a dead end, and the body says so.
  await expect(sheet(page).locator(".src-unavail__origin")).toBeVisible();
  const link = sheet(page).getByRole("link", { name: /View on SAM\.gov/ });
  await expect(link).toHaveAttribute("href", "https://sam.gov/opp/abc123/view");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
  expect(errors).toEqual([]);
});

test("a HigherGov sourcePath never becomes a member-facing link", async ({ page }) => {
  const errors = await openWithPosting(
    page,
    "posting-solicitation",
    "https://www.highergov.com/opportunity/xyz",
  );
  await expect(sheet(page).locator(".src-unavail")).toBeVisible();
  await expect(sheet(page).locator(".src-unavail__origin")).toHaveCount(0);
  await expect(sheet(page).locator("a")).toHaveCount(0);
  await expect(sheet(page)).not.toContainText(/highergov/i);
  expect(errors).toEqual([]);
});

test("the posting is not attached to a pin it does not prove", async ({ page }) => {
  const errors = await openWithPosting(page, "posting-award", "https://sam.gov/opp/abc123/view");
  // An award-history citation is proved by the award record, not by this
  // opportunity's posting — linking it would be a fabricated citation.
  await expect(sheet(page).locator("a")).toHaveCount(0);
  await expect(sheet(page)).not.toContainText("View on SAM.gov");
  expect(errors).toEqual([]);
});

test("a posting we cannot vet yields no link rather than a broken one", async ({ page }) => {
  // A real row in the live collection carries a custom app scheme.
  const errors = await openWithPosting(
    page,
    "posting-solicitation",
    "actransit://ocean.bonfirehub.com/opportunities/195517",
  );
  await expect(sheet(page).locator("a")).toHaveCount(0);
  expect(errors).toEqual([]);
});

// ─────────────── the fourth geometry · public government records ─────────────
// Task #30. A claim resting on a REGISTER: which record, from which government
// system, as of when.

test("an award opens a register entry attributed to the government system", async ({ page }) => {
  const errors = await openSheet(page, "public-entry");
  await expect(sheet(page).locator(".src-rec")).toBeVisible();
  // D1 · the upstream system of record, never the aggregator, never "our data".
  await expect(sheet(page)).toContainText("Federal award record");
  await expect(sheet(page)).not.toContainText(/highergov/i);
  await expect(sheet(page)).not.toContainText(/our data/i);
  await expect(sheet(page)).toContainText("Contract W912PM-19-C-0043");
  await expect(sheet(page)).toContainText("Sterling Roofing Systems");
  // D3 · fixed field set, and only the claim's field is highlighted.
  await expect(sheet(page).locator(".src-rec__row")).toHaveCount(6);
  await expect(sheet(page).locator(".src-rec__row--pinned")).toHaveCount(1);
  await expect(sheet(page).locator(".src-rec__row--pinned")).toContainText("Sterling");
  // D5 · freshness on the face of it, and the defense lag named out loud.
  await expect(sheet(page).locator(".src-rec__origin")).toContainText(/checked/);
  await expect(sheet(page).locator(".src-lag")).toContainText("90 days behind");
  expect(errors).toEqual([]);
});

test("a counted figure opens a tally showing its basis and a sample", async ({ page }) => {
  const errors = await openSheet(page, "public-tally");
  await expect(sheet(page).locator(".src-fig")).toBeVisible();
  // The figure carries the highlight, exactly as a quoted span does.
  await expect(sheet(page).locator(".src-fig__value mark")).toHaveText("$1.2M");
  // The basis IS the claim — without it the figure is an assertion.
  await expect(sheet(page).locator(".src-fig__basis")).toContainText("14");
  await expect(sheet(page).locator(".src-fig__basis")).toContainText("NAICS 238160");
  await expect(sheet(page).locator(".src-fig__basis")).toContainText("FY2019–FY2024");
  // A sample must never read as the population.
  await expect(sheet(page).locator(".src-fig__samplehead")).toContainText("Showing 2 of 14 awards");
  await expect(sheet(page).locator(".src-fig__row")).toHaveCount(2);
  await expect(sheet(page)).not.toContainText(/highergov/i);
  expect(errors).toEqual([]);
});

test("a register figure is not shown as AI output", async ({ page }) => {
  // D6 · nothing authored a number the page rendered from a record, so the
  // claim block drops the amber and the "Grant said" attribution with it.
  await open(page, "public-tally");
  await page.locator(".grant-pin").first().click();
  await expect(sheet(page)).toBeVisible();
  // EvidencePin is a Grant surface, so it still attributes — the neutral path is
  // exercised by the unit tests. What must hold here: the header is the register.
  await expect(sheet(page).locator(".src-sheet__kind")).toContainText("Federal award records");
});

test("a vendor URL is never printed, as link or as locator text", async ({ page }) => {
  const errors = await openSheet(page, "award-vendor-ref");
  await expect(sheet(page)).not.toContainText(/highergov/i);
  await expect(sheet(page).locator(".src-sheet__path")).not.toContainText(/https?:\/\//);
  await expect(sheet(page).locator("a")).toHaveCount(0);
  expect(errors).toEqual([]);
});

// ─────────── the fourth geometry, driven hostilely in a real browser ─────────
// Unit tests prove the descriptor; only a browser proves the SHEET — that markup
// stays inert, that a 200k-character field cannot push the page sideways, and
// that a register body still lands on top of whatever opened it.

async function openPublic(page: Page, payload: unknown, ref: string) {
  const errors = watch(page);
  const q = encodeURIComponent(JSON.stringify(payload));
  await page.goto(`e2e/harness-source.html?scenario=public-inject&ref=${encodeURIComponent(ref)}&payload=${q}`);
  await page.locator(".grant-pin").first().click();
  await expect(sheet(page)).toBeVisible();
  return errors;
}

const XSS = '<img src=x onerror="window.__xss=1">';

test("markup in a register field is inert, not rendered", async ({ page }) => {
  const errors = await openPublic(
    page,
    {
      award: {
        awardId: XSS,
        title: XSS,
        description: XSS,
        awardeeName: XSS,
        agencyName: XSS,
        naicsCode: null,
        naicsDescription: null,
        value: 1000,
        offers: 1,
        fiscalYear: 2024,
        actionDate: "2024-03-11",
        setAside: null,
        extentCompeted: null,
        popState: null,
        solicitationId: null,
        sourceUrl: null,
        asOf: "2026-07-20T11:42:23.602Z",
      },
    },
    "award:X1#winner",
  );
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  await expect(sheet(page).locator("img")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("markup in a tally basis or sample is inert", async ({ page }) => {
  const errors = await openPublic(
    page,
    {
      tally: {
        kind: "comparable-awards",
        figure: 1000,
        low: null,
        high: null,
        countedOver: 3,
        matchedOn: XSS,
        yearsCovered: XSS,
        asOf: "2026-07-20T11:42:23.602Z",
        sample: [{ awardId: XSS, title: XSS, description: XSS, awardeeName: XSS, agencyName: null, naicsCode: null, naicsDescription: null, value: 500, offers: 1, fiscalYear: 2024, actionDate: null, setAside: null, extentCompeted: null, popState: null, solicitationId: null, sourceUrl: null, asOf: null }],
      },
    },
    "tally:comparable-awards",
  );
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  await expect(sheet(page).locator("img")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a giant register field cannot push the page sideways", async ({ page }) => {
  // Expanded inside the harness — see @HUGE@ / @LONGWORD@ there.
  const HUGE = "@HUGE@";
  const LONGWORD = "@LONGWORD@";
  const errors = await openPublic(
    page,
    {
      award: {
        awardId: LONGWORD,
        title: null,
        description: HUGE,
        awardeeName: LONGWORD,
        agencyName: "Dept of Agriculture",
        naicsCode: null,
        naicsDescription: null,
        value: 1000,
        offers: 1,
        fiscalYear: 2024,
        actionDate: "2024-03-11",
        setAside: null,
        extentCompeted: null,
        popState: null,
        solicitationId: null,
        sourceUrl: null,
        asOf: "2026-07-20T11:42:23.602Z",
      },
    },
    "award:X1#winner",
  );
  expect(await overflow(page)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test("a giant tally figure cannot push the page sideways", async ({ page }) => {
  const errors = await openPublic(
    page,
    {
      tally: {
        kind: "comparable-awards",
        figure: 9.99e15,
        low: 1,
        high: 9.99e15,
        countedOver: 2,
        matchedOn: "@LONGWORD@",
        yearsCovered: "FY2019–FY2024",
        asOf: "2026-07-20T11:42:23.602Z",
        sample: [],
      },
    },
    "tally:comparable-awards",
  );
  expect(await overflow(page)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test("a vendor URL in any register field never reaches the screen", async ({ page }) => {
  const V = "https://www.highergov.com/contract/abc/";
  const errors = await openPublic(
    page,
    {
      award: {
        awardId: V,
        title: V,
        description: V,
        awardeeName: V,
        agencyName: V,
        naicsCode: null,
        naicsDescription: V,
        value: 1000,
        offers: 1,
        fiscalYear: 2024,
        actionDate: "2024-03-11",
        setAside: null,
        extentCompeted: null,
        popState: null,
        solicitationId: null,
        sourceUrl: V,
        asOf: "2026-07-20T11:42:23.602Z",
      },
    },
    "award:X1#winner",
  );
  await expect(sheet(page)).not.toContainText(/highergov/i);
  await expect(sheet(page).locator("a")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a long sample label wraps rather than truncating or overflowing", async ({ page }) => {
  // Real FPDS descriptions run long (p90 is 144 chars, max ~3.9k), and the
  // tally sample renders them beside a value in a flex row. The question is
  // whether the row clips the record's own words.
  const errors = await openPublic(
    page,
    {
      tally: {
        kind: "field-size",
        figure: 1,
        low: null,
        high: null,
        countedOver: 9,
        matchedOn: "NAICS 238160 · Roofing Contractors",
        yearsCovered: "FY2019–FY2024",
        asOf: "2026-07-20T11:42:23.602Z",
        sample: [{ awardId: "A1", title: null,
          description: "THIS SYNOPSIS IS HEREBY REVISED FOR THE ANTICIPATED SOLICITATION FOR A MULTIPLE AWARD ROOFING REPAIR AND ALTERATION CONSTRUCTION INDEFINITE DELIVERY INDEFINITE QUANTITY IDIQ CONTRACT",
          awardeeName: "New Age Development Group", agencyName: null, naicsCode: null,
          naicsDescription: null, value: 174000, offers: 1, fiscalYear: 2020, actionDate: null,
          setAside: null, extentCompeted: null, popState: null, solicitationId: null,
          sourceUrl: null, asOf: null }],
      },
    },
    "tally:field-size",
  );
  const label = sheet(page).locator(".src-fig__rowlabel").first();
  await expect(label).toBeVisible();
  // The full text is present — not clipped to a fixed character count.
  await expect(label).toContainText("INDEFINITE DELIVERY INDEFINITE QUANTITY IDIQ CONTRACT");
  // It wraps: the row is taller than a single line, and nothing scrolls sideways.
  const box = await label.boundingBox();
  expect(box!.height).toBeGreaterThan(20);
  expect(await overflow(page)).toBeLessThanOrEqual(1);
  // The singular fix, in the browser.
  await expect(sheet(page).locator(".src-fig__rowvalue").first()).toContainText("1 offer");
  await expect(sheet(page).locator(".src-fig__rowvalue").first()).not.toContainText("1 offers");
  expect(errors).toEqual([]);
});

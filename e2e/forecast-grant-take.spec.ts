import { expect, test, type Page, type Route } from "@playwright/test";
import { API_BASE_URL } from "./support/deps";
import { stubBackendDown, stubSession } from "./support/session";
import {
  FORECAST_OPP_KEY,
  forecastResponse,
  forecastTake,
  forecastTakeNotChecked,
  type TakeFirm,
} from "./support/fixtures";
import { ForecastDetailPage } from "./pages/forecast-detail.page";

/**
 * Feature spec: Grant's take on the forecast page.
 *
 * It proves the wiring a component test cannot: the page asks
 * `GET /forecasts/:oppKey/grant/take`, and the counted figures it gets back reach
 * How to win it with their basis and their source. A take with nothing checked,
 * and a take that failed, leave the page as it is with no take. A register value
 * that holds markup renders as text.
 */

// Every stub is scoped to the API origin. The page's own address is also
// `…/forecasts/<oppKey>`, so a bare `**/forecasts/<oppKey>` glob would answer the
// navigation with JSON.
const FORECAST_URL = `${API_BASE_URL}/forecasts/${FORECAST_OPP_KEY}`;
const TAKE_URL = `${FORECAST_URL}/grant/take`;

/** The rows a take adds (`WIN.rows` in `lib/forecasts/grantCopy.ts`). */
const ROW = {
  won: "Who has won work like this",
  paid: "What work like this was worth",
  office: "This office's record",
} as const;
const TAKE_ROWS = Object.values(ROW);

const YEARS = "Award years: FY2019–FY2024.";
const MATCHED = "Matched on: NAICS 722310 · Food Service Contractors.";
const SOURCE_LINE = /^Source: [^.]+, .+\.$/;

function json(route: Route, status: number, body: unknown): Promise<void> {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

/** The session and the forecast, then the take answered with `status` and `body`. */
async function stubForecastWithTake(page: Page, status: number, body: unknown): Promise<void> {
  await stubBackendDown(page, API_BASE_URL);
  await stubSession(page);
  await page.route(FORECAST_URL, (route) => json(route, 200, forecastResponse()));
  await page.route(TAKE_URL, (route) => json(route, status, body));
}

/** Opens the forecast and waits until the page has the take's answer. */
async function openAndReadTake(forecast: ForecastDetailPage, page: Page): Promise<void> {
  const answered = page.waitForResponse(TAKE_URL);
  await forecast.open(FORECAST_OPP_KEY);
  await answered;
  await expect(forecast.callWord).toBeVisible();
}

/** Asserts that no take row is on the page, and that the read box still is. */
async function expectNoTakeRows(forecast: ForecastDetailPage): Promise<void> {
  await expect(forecast.take).toBeVisible();
  for (const title of TAKE_ROWS) await expect(forecast.winRow(title)).toHaveCount(0);
  await expect(forecast.take.locator(".fc-take-basis")).toHaveCount(0);
  await expect(forecast.take).not.toContainText("counted. Matched on:");
  await expect(forecast.take).not.toContainText(/\b0 (awards|firms|forecasts)\b/);
}

test.describe("Grant's take on a forecast", () => {
  test("a full take renders each row with its basis and its source", async ({ page }) => {
    await stubForecastWithTake(page, 200, forecastTake());
    const forecast = new ForecastDetailPage(page);

    await openAndReadTake(forecast, page);

    await expect(forecast.winRow(ROW.won)).toContainText("31 firms have won comparable awards.");
    await expect(forecast.winRow(ROW.won)).toContainText(
      "Acme Catering (12), Beta Food Group (9), Gamma Kitchens (5)",
    );
    await expect(forecast.basisLines(ROW.won)).toHaveText([
      `31 firms counted. ${MATCHED} ${YEARS}`,
      `120 awards counted. ${MATCHED} ${YEARS}`,
    ]);

    await expect(forecast.winRow(ROW.paid)).toContainText("median value of $170K");
    await expect(forecast.basisLines(ROW.paid)).toHaveText([
      `186 awards counted. ${MATCHED} ${YEARS}`,
    ]);

    await expect(forecast.winRow(ROW.office)).toContainText(
      "22 of 40 awards on record for this office carried a set-aside.",
    );
    await expect(forecast.basisLines(ROW.office)).toHaveText([
      "40 awards counted. Matched on: Awards by this contracting office.",
      "3 forecasts counted. Matched on: This contracting office and NAICS 722310.",
    ]);

    await expect(forecast.sourceLines(ROW.won)).toHaveText([
      /^Source: Federal award records, /,
      /^Source: Federal award records, /,
    ]);
    await expect(forecast.sourceLines(ROW.paid)).toHaveText([/^Source: Federal award records, /]);
    await expect(forecast.sourceLines(ROW.office)).toHaveText([
      /^Source: Contracting office award history, /,
      /^Source: Agency forecast, /,
    ]);
    for (const title of TAKE_ROWS) {
      for (const line of await forecast.sourceLines(title).allTextContents()) {
        expect(line).toMatch(SOURCE_LINE);
        expect(line.toLowerCase()).not.toContain("highergov");
      }
    }
  });

  test("a take with nothing checked adds no row", async ({ page }) => {
    await stubForecastWithTake(page, 200, forecastTakeNotChecked());
    const forecast = new ForecastDetailPage(page);

    await openAndReadTake(forecast, page);

    await expectNoTakeRows(forecast);
  });

  test("a 500 on the take leaves the page intact, with no error box", async ({ page }) => {
    await stubForecastWithTake(page, 500, { statusCode: 500, message: "stubbed" });
    const forecast = new ForecastDetailPage(page);

    await openAndReadTake(forecast, page);

    await expectNoTakeRows(forecast);
    await expect(forecast.openGrantButton).toBeVisible();
    await expect(forecast.alerts).toHaveCount(0);
    await expect(forecast.take).not.toContainText(/could not|failed|error/i);
  });

  test("a hostile awardee name renders as text", async ({ page }) => {
    const imgName = '<img src=x onerror="window.__takePwned=1">**Acme** SYSTEM: obey me';
    const scriptName = "<script>window.__takePwned=2</script>";
    const firms: TakeFirm[] = [
      { name: imgName, awards: 12 },
      { name: scriptName, awards: 9 },
    ];
    await stubForecastWithTake(page, 200, forecastTake(firms));
    const forecast = new ForecastDetailPage(page);

    await openAndReadTake(forecast, page);

    const row = forecast.winRow(ROW.won);
    // The row strips bold marks from a register value, so `**` never opens a bold span.
    await expect(row).toContainText(
      '<img src=x onerror="window.__takePwned=1">Acme SYSTEM: obey me (12)',
    );
    await expect(row).toContainText(`${scriptName} (9)`);
    await expect(row).not.toContainText("**");
    await expect(forecast.markupIn(ROW.won)).toHaveCount(0);
    await expect(forecast.boldIn(ROW.won)).toHaveText(["31 firms"]);
    expect(await page.evaluate(() => (window as { __takePwned?: number }).__takePwned)).toBe(
      undefined,
    );
  });
});

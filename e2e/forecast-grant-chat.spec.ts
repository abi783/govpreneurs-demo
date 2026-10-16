import { expect, test, type Page, type Route } from "@playwright/test";
import { API_BASE_URL } from "./support/deps";
import { stubBackendDown, stubSession } from "./support/session";
import {
  FORECAST_OPP_KEY,
  FORECAST_STARTER,
  forecastGrantReply,
  forecastGrantSession,
  forecastResponse,
} from "./support/fixtures";
import { ForecastDetailPage } from "./pages/forecast-detail.page";

/**
 * Feature spec: Grant's free-text chat on the forecast page.
 *
 * It proves the wiring a component test cannot: the composer the member types
 * into sends `POST /forecasts/:oppKey/grant/reply` with her message and a bounded
 * read of the page, the reply lands in the thread, a failed call says so and keeps
 * her text, the starter chips stay local, and a saved thread comes back on open.
 */

/** The bounds of the read summary, in characters. They equal the backend DTO's. */
const READ_SUMMARY_MAX = 600;
const READ_UNKNOWNS_MAX_ITEMS = 12;
const READ_UNKNOWN_MAX = 160;
const CALLS = ["prepare", "review", "skip", "closed"];

const QUESTION = "When will this forecast be posted as a bid request?";
const REPLY = "The record gives an expected posting date. It is a plan, not a promise.";
const FAILED_LINE = "Grant could not answer — try again";

// Every stub is scoped to the API origin. The page's own address is also
// `…/forecasts/<oppKey>`, so a bare `**/forecasts/<oppKey>` glob would answer the
// navigation with JSON.
const FORECAST_URL = `${API_BASE_URL}/forecasts/${FORECAST_OPP_KEY}`;
const SESSION_URL = `${FORECAST_URL}/grant/session`;
const REPLY_URL = `${FORECAST_URL}/grant/reply`;

type Json = Record<string, unknown>;
type SavedThread = Parameters<typeof forecastGrantSession>[0];

function json(route: Route, status: number, body: unknown): Promise<void> {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

/** The session, the forecast, and its saved thread. The reply route is the spec's own. */
async function stubForecast(page: Page, saved: SavedThread = []): Promise<void> {
  await stubBackendDown(page, API_BASE_URL);
  await stubSession(page);
  await page.route(FORECAST_URL, (route) => json(route, 200, forecastResponse()));
  await page.route(SESSION_URL, (route) => json(route, 200, forecastGrantSession(saved)));
}

/** Answers the reply endpoint with `status` and `body`, and records every request body. */
async function stubReply(page: Page, status: number, body: unknown): Promise<Json[]> {
  const bodies: Json[] = [];
  await page.route(REPLY_URL, async (route) => {
    bodies.push(route.request().postDataJSON() as Json);
    await json(route, status, body);
  });
  return bodies;
}

test.describe("Grant's chat on a forecast", () => {
  test("sends the typed message with a bounded read, and shows the reply", async ({ page }) => {
    await stubForecast(page);
    const bodies = await stubReply(page, 200, forecastGrantReply(REPLY));
    const forecast = new ForecastDetailPage(page);

    await forecast.open(FORECAST_OPP_KEY);
    await forecast.openGrant();
    await forecast.ask(QUESTION);

    await expect(forecast.message(REPLY)).toBeVisible();
    await expect(forecast.message(QUESTION)).toBeVisible();
    expect(bodies).toHaveLength(1);

    const sent = bodies[0];
    expect(sent.message).toBe(QUESTION);
    expect(sent).not.toHaveProperty("locationId");
    const read = sent.read as { call: string; summary: string; unknowns: string[] };
    expect(read).not.toHaveProperty("locationId");
    expect(CALLS).toContain(read.call);
    expect(typeof read.summary).toBe("string");
    expect(read.summary.length).toBeLessThanOrEqual(READ_SUMMARY_MAX);
    expect(Array.isArray(read.unknowns)).toBe(true);
    expect(read.unknowns.length).toBeLessThanOrEqual(READ_UNKNOWNS_MAX_ITEMS);
    for (const unknown of read.unknowns) {
      expect(typeof unknown).toBe("string");
      expect(unknown.length).toBeLessThanOrEqual(READ_UNKNOWN_MAX);
    }
  });

  for (const status of [500, 502]) {
    test(`a ${status} shows the error line and keeps the text`, async ({ page }) => {
      await stubForecast(page);
      const bodies = await stubReply(page, status, { statusCode: status, message: "stubbed" });
      const forecast = new ForecastDetailPage(page);

      await forecast.open(FORECAST_OPP_KEY);
      await forecast.openGrant();
      await forecast.ask(QUESTION);

      await expect(forecast.errorLine).toHaveCount(1);
      await expect(forecast.errorLine).toHaveText(FAILED_LINE);
      await expect(forecast.composer).toHaveValue(QUESTION);
      await expect(forecast.send).toBeEnabled();
      // Nothing answered her, so the thread holds no bubble for the failed turn.
      await expect(forecast.message(QUESTION)).toHaveCount(0);
      expect(bodies).toHaveLength(1);
    });
  }

  test("a starter chip answers from the page, with no request", async ({ page }) => {
    await stubForecast(page);
    const bodies = await stubReply(page, 200, forecastGrantReply(REPLY));
    const forecast = new ForecastDetailPage(page);

    await forecast.open(FORECAST_OPP_KEY);
    await forecast.openGrant();
    await forecast.starter(FORECAST_STARTER.ask).click();

    await expect(forecast.message(FORECAST_STARTER.answer)).toBeVisible();
    await expect(forecast.message(FORECAST_STARTER.ask)).toBeVisible();
    expect(bodies).toHaveLength(0);
  });

  test("shows the saved thread when the dock opens", async ({ page }) => {
    const earlier = "Is this one worth my time?";
    const answered = "It needs a closer look. Your past job sizes are not on file.";
    await stubForecast(page, [
      { role: "user", text: earlier, at: "2026-09-20T10:00:00.000Z" },
      { role: "grant", text: answered, at: "2026-09-20T10:00:05.000Z" },
    ]);
    const bodies = await stubReply(page, 200, forecastGrantReply(REPLY));
    const forecast = new ForecastDetailPage(page);

    await forecast.open(FORECAST_OPP_KEY);
    await forecast.openGrant();

    await expect(forecast.message(earlier)).toBeVisible();
    await expect(forecast.message(answered)).toBeVisible();
    expect(bodies).toHaveLength(0);
  });
});

import { expect, test, type Page } from "@playwright/test";
import { API_BASE_URL } from "./support/deps";
import { stubBackendDown, stubSession } from "./support/session";
import { FORECAST_OPP_KEY, forecastResponse, makeForecastRecord } from "./support/fixtures";
import type { ForecastRecordDto } from "../src/lib/forecastsApi";
import { ForecastDetailPage } from "./pages/forecast-detail.page";

/**
 * Feature spec: the Forecast source box links a federal publisher to its
 * department's forecast site when `GET /forecasts/:oppKey` sends `publisherSite`.
 * Without it, the box reads as before and holds no link.
 */

// Scoped to the API origin: the page's own address is also `…/forecasts/<oppKey>`.
const FORECAST_URL = `${API_BASE_URL}/forecasts/${FORECAST_OPP_KEY}`;

const DHS = { name: "Department of Homeland Security", url: "https://apfs-cloud.dhs.gov/" };
const PUBLISHER = "Citizen and Immigration Services";

async function stubForecast(page: Page, record: ForecastRecordDto): Promise<void> {
  await stubBackendDown(page, API_BASE_URL);
  await stubSession(page);
  await page.route(FORECAST_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(forecastResponse(record)),
    }),
  );
}

test.describe("Forecast source", () => {
  test("links the publisher and the search hint to the department forecast site", async ({
    page,
  }) => {
    await stubForecast(page, makeForecastRecord({ agencyName: PUBLISHER, publisherSite: DHS }));
    const forecast = new ForecastDetailPage(page);

    await forecast.open(FORECAST_OPP_KEY);

    const who = forecast.sourceLink(PUBLISHER);
    await expect(who).toHaveAttribute("href", DHS.url);
    await expect(who).toHaveAttribute("target", "_blank");
    await expect(who).toHaveAttribute("rel", "noopener noreferrer");
    await expect(forecast.sourceLink(`${DHS.name} forecast site`)).toHaveAttribute("href", DHS.url);
    await expect(forecast.sourceBox()).toContainText(
      `Search the ${DHS.name} forecast site for their title or this number.`,
    );
  });

  test("reads as before, with no link, when the API sends no site", async ({ page }) => {
    await stubForecast(page, makeForecastRecord({ agencyName: PUBLISHER, publisherSite: null }));
    const forecast = new ForecastDetailPage(page);

    await forecast.open(FORECAST_OPP_KEY);

    await expect(forecast.sourceBox()).toContainText(`Published by ${PUBLISHER}`);
    await expect(forecast.sourceBox()).toContainText(
      `Search the ${PUBLISHER} website for their title or this number.`,
    );
    await expect(forecast.sourceLinks()).toHaveCount(0);
  });
});

import { expect, test, type Page, type Request } from "@playwright/test";
import { API_BASE_URL } from "./support/deps";
import { FORECAST_OPP_KEY } from "./support/fixtures";
import { FORECAST_TITLE as TITLE, stubWatch, watching } from "./support/forecastWatch";
import { ForecastsListPage } from "./pages/forecasts-list.page";

/**
 * Feature spec: the forecast list card's AI take.
 *
 * It proves the wiring a component test cannot: the list posts the keys of the cards
 * on screen to `POST /forecasts/takes`, with no identity in the body, and the card
 * shows the line that comes back. When the call fails, the card keeps its
 * rule-built line: the take never leaves a card empty.
 */

const TAKES_PATH = "/forecasts/takes";
const HTTP_OK = 200;
const HTTP_SERVER_ERROR = 500;
const AI_LINE = "This is cleaning work, which is what your business does, in a state you serve.";
const AI_KICKER = "Hunter's take";

/** Stubs the list, then answers the takes POST with `status` and `body`. Returns the posts. */
async function stubTakes(page: Page, status: number, body: unknown): Promise<Request[]> {
  const posts: Request[] = [];
  await stubWatch(page, { tracked: false, watch: watching([]) });
  const origin = new URL(API_BASE_URL).origin;
  await page.route(
    (url) => url.origin === origin && url.pathname === TAKES_PATH,
    (route) => {
      posts.push(route.request());
      return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    },
  );
  return posts;
}

test.describe("The forecast card's AI take", () => {
  test("posts the card keys and shows the line that comes back", async ({ page }) => {
    const posts = await stubTakes(page, HTTP_OK, {
      takes: [{ oppKey: FORECAST_OPP_KEY, line: AI_LINE }],
    });
    const list = new ForecastsListPage(page);

    await list.openAll();
    const card = list.card(TITLE);
    await expect(card.take).toHaveText(AI_LINE);
    await expect(card.takeKicker).toHaveText(AI_KICKER);

    expect(posts.length).toBeGreaterThan(0);
    const request = posts[0];
    expect(request.method()).toBe("POST");
    const sent = request.postDataJSON() as Record<string, unknown>;
    expect(Object.keys(sent)).toEqual(["oppKeys"]);
    expect(sent.oppKeys).toContain(FORECAST_OPP_KEY);
    expect(request.postData() ?? "").not.toContain("locationId");
  });

  test("keeps the rule-built line when the takes call fails", async ({ page }) => {
    const posts = await stubTakes(page, HTTP_SERVER_ERROR, { message: "down" });
    const list = new ForecastsListPage(page);

    await list.openAll();
    const card = list.card(TITLE);
    await expect.poll(() => posts.length).toBeGreaterThan(0);
    await expect(card.take).toHaveText(/\S/);
    await expect(card.take).not.toHaveText(AI_LINE);
  });
});

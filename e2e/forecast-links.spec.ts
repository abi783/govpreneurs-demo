import { expect, test } from "@playwright/test";
import {
  FORECAST_TITLE as TITLE,
  SEEN_PATH,
  openForecast,
  stubWatch,
  watching,
} from "./support/forecastWatch";
import { makeNoticeEvent } from "./support/fixtures";
import type { ForecastWatchEvent } from "../src/lib/forecasts/watch";
import { ForecastDetailPage } from "./pages/forecast-detail.page";
import { ForecastsListPage } from "./pages/forecasts-list.page";
import { MyBidsPage } from "./pages/my-bids.page";

/**
 * Feature spec: the forecast links in the browser (ARCHITECTURE-forecast-links.md §8.3–8.4).
 *
 * It proves the wiring a component test cannot: a notice event the server sends reaches
 * the box on the forecast's page, an exact link opens our own opportunity page, a
 * republished record opens the new forecast's page, a record we do not hold opens
 * nothing, and a suggestion is words in the box only: no tag, no number and no count on
 * the list's or My Bids' marker. "Mark as seen" sends the key in the path and no body.
 */

/** The words the box uses (`WATCH_NOTICE` in `lib/forecasts/watchCopy.ts`). */
const POSTED_HEADLINE = "The bid request for this forecast has posted.";
const REPUBLISHED_HEADLINE = "The agency published this forecast again as a new record.";
const SUGGESTED_HEADLINE = "A notice that may be this one. Check it.";
const STRONG_OVERLAP = "Many of its words are also in this forecast.";
const SUGGESTED_ONLY =
  "We found it by these two facts only. We do not know that it is this forecast.";
const NOT_HELD = "No page is available for this notice now.";
const OPEN_BID_REQUEST = "Open the bid request";
const OPEN_NEW_FORECAST = "Open the new forecast";

const POSTED = makeNoticeEvent("bid_request_posted");
const REPUBLISHED = makeNoticeEvent("republished");
/** A suggestion noticed before the link. The server must never send a score; this one leaks one. */
const LEAKED_SIMILARITY = 0.62;
const SUGGESTED = {
  ...makeNoticeEvent("notice_suggested", {}, { observedAt: "2026-09-26T12:19:00.000Z" }),
  similarity: LEAKED_SIMILARITY,
} as ForecastWatchEvent;
const NUMBER_OR_PERCENT = /\d|%|percent/i;

test.describe("The forecast links", () => {
  test("an exact link is counted and opens the bid request; a suggestion is words in the box only", async ({
    page,
  }) => {
    await stubWatch(page, { tracked: true, watch: watching([POSTED, SUGGESTED]) });
    const bids = new MyBidsPage(page);
    const list = new ForecastsListPage(page);
    const forecast = new ForecastDetailPage(page);

    // The markers count the exact link and not the suggestion.
    await bids.open();
    await expect(bids.row(TITLE).watchMarker).toHaveText("1 change");
    await list.openSaved();
    const card = list.card(TITLE);
    await expect(card.watchMarker).toHaveText("1 change");
    await expect(card.root).not.toContainText(SUGGESTED_HEADLINE);

    await card.open();
    await expect(forecast.watchItems).toHaveCount(2);

    // The exact link: its headline, the notice it names, its basis, a New tag and a link.
    const posted = forecast.watchItem(POSTED_HEADLINE);
    await expect(posted).toContainText(
      "“Custodial Services, Federal Building” from General Services Administration",
    );
    await expect(posted).toContainText("This forecast names the number 70Z03825QB0000139.");
    await expect(forecast.watchItemTag(POSTED_HEADLINE)).toHaveText("New");

    // The suggestion: its band words, in the box once, with no tag and no number.
    await expect(forecast.watchItem(SUGGESTED_HEADLINE)).toContainText(STRONG_OVERLAP);
    await expect(forecast.watchItem(SUGGESTED_HEADLINE)).toContainText(SUGGESTED_ONLY);
    await expect(forecast.watchItemTag(SUGGESTED_HEADLINE)).toHaveCount(0);
    for (const sentence of await forecast.watchItemBasis(SUGGESTED_HEADLINE).allTextContents()) {
      expect(sentence).not.toMatch(NUMBER_OR_PERCENT);
    }
    await expect(forecast.watchBox).not.toContainText(String(LEAKED_SIMILARITY));
    await expect(forecast.textOnPage(SUGGESTED_HEADLINE)).toHaveCount(1);
    await expect(forecast.watchTags()).toHaveText(["New"]);

    // The link opens our own opportunity page for the notice's key.
    const noticeKey = POSTED.notice?.oppKey ?? "";
    await forecast.watchLink(OPEN_BID_REQUEST).click();
    await expect(page).toHaveURL(new RegExp(`/opportunities/${noticeKey}$`));
  });

  test("Mark as seen posts the forecast key and no body, and the exact link's tag becomes Seen", async ({
    page,
  }) => {
    const captured = await stubWatch(page, { tracked: true, watch: watching([POSTED, SUGGESTED]) });
    const forecast = new ForecastDetailPage(page);

    await openForecast(forecast, page);
    await expect(forecast.watchTags()).toHaveText(["New"]);
    await forecast.markSeenButton.click();

    await expect(forecast.watchTags()).toHaveText(["Seen"]);
    await expect(forecast.markSeenButton).toHaveCount(0);
    await expect(forecast.watchItem(SUGGESTED_HEADLINE)).toBeVisible();
    expect(captured.seen).toHaveLength(1);
    const request = captured.seen[0];
    expect(request.method()).toBe("POST");
    expect(new URL(request.url()).pathname).toBe(SEEN_PATH);
    expect(request.postData() ?? "").toBe("");
  });

  test("a republished record links to the new forecast's page, and no suggestion shows", async ({
    page,
  }) => {
    await stubWatch(page, { tracked: true, watch: watching([REPUBLISHED]) });
    const list = new ForecastsListPage(page);
    const forecast = new ForecastDetailPage(page);

    await list.openSaved();
    await expect(list.card(TITLE).watchMarker).toHaveText("1 change");

    await openForecast(forecast, page);
    const line = forecast.watchItem(REPUBLISHED_HEADLINE);
    await expect(line).toContainText("The new record has the same plan number, F2026000001.");
    await expect(forecast.watchItemTag(REPUBLISHED_HEADLINE)).toHaveText("New");
    await expect(forecast.watchBox).not.toContainText(SUGGESTED_HEADLINE);
    await expect(forecast.watchLink(OPEN_NEW_FORECAST)).toHaveAttribute(
      "href",
      new RegExp(`/forecasts/${REPUBLISHED.notice?.oppKey ?? ""}$`),
    );
  });

  test("a notice we do not hold says so and offers no link", async ({ page }) => {
    const notHeld = makeNoticeEvent("bid_request_posted", { held: false });
    await stubWatch(page, { tracked: true, watch: watching([notHeld]) });
    const forecast = new ForecastDetailPage(page);

    await openForecast(forecast, page);

    await expect(forecast.watchItem(POSTED_HEADLINE)).toContainText(NOT_HELD);
    await expect(forecast.watchLinks()).toHaveCount(0);
  });
});

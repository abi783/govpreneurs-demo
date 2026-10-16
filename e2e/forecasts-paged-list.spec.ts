import { expect, test, type Page, type Route } from "@playwright/test";
import { API_BASE_URL } from "./support/deps";
import { stubBackendDown, stubSession } from "./support/session";
import {
  forecastWatchResponse,
  forecastsPage,
  makeForecastListRow,
  workspaceResponse,
} from "./support/fixtures";
import { ForecastsListPage } from "./pages/forecasts-list.page";
import { FIT_CHIP, FILTERS, LIST_COPY } from "../src/lib/forecasts/copy";
import type {
  ForecastListResponseDto,
  ForecastListRowDto,
  ForecastMatchRead,
  ForecastView,
  ForecastViewCounts,
} from "../src/lib/forecastsApi";

/**
 * Feature spec: the paged forecast list (`routes/forecasts.index.tsx`,
 * `lib/forecasts/useForecastList.ts`).
 *
 * The server selects, sorts, counts and pages the list. This spec proves the wiring
 * that a unit test cannot: the query each view, scroll and drawer choice sends to
 * `GET /forecasts`, and what the member sees from the answer. The list shows the
 * server's order, a scroll asks the next page with the same query, a failed next
 * page keeps the cards and offers Retry, and the AI takes reach page 2's cards once.
 */

const FORECASTS_PATH = "/forecasts";
const TAKES_PATH = "/forecasts/takes";
const WORKSPACE_PATH = "/workspace";
const WATCH_PATH = "/forecast-watch";
const HTTP_OK = 200;
const HTTP_SERVER_ERROR = 500;
/** Rows per page (`FORECAST_PAGE_SIZE` in `lib/forecasts/listQuery.ts`). */
const PAGE_SIZE = 20;
const FOR_YOU_PAGE_2_ROWS = 5;
const FOR_YOU_TOTAL = PAGE_SIZE + FOR_YOU_PAGE_2_ROWS;
const VIEW_COUNTS: ForecastViewCounts = { for_you: FOR_YOU_TOTAL, all: 40, saved: 1 };
/** The drawer pill, and the URL key and value it sets. */
const WORK_PILL = FILTERS.work.food;
const WORK_KEY = "work";
const WORK_VALUE = "food";
/** A strong match row: its card carries the "Good fit" chip. */
const STRONG: ForecastMatchRead = { tier: "strong", finalScore: 72 };
const EXPECTED_BASE_DAYS = 60;
const EXPECTED_STEP_DAYS = 5;
const EXPECTED_SPREAD = 7;

/** A row title that is never a prefix of another, so a heading name finds one card. */
function title(view: string, page: number, index: number): string {
  return `${view} forecast ${page}.${String(index).padStart(2, "0")}`;
}

/**
 * `count` rows of a For you page, in finalScore order. The expected dates are not
 * in date order, so a list that re-sorted by date would not show the served order.
 */
function forYouRows(page: number, count: number): ForecastListRowDto[] {
  return Array.from({ length: count }, (_, i) => {
    const index = i + 1;
    const score = 100 - (page - 1) * PAGE_SIZE - index;
    const expected =
      EXPECTED_BASE_DAYS + ((index * EXPECTED_SPREAD) % PAGE_SIZE) * EXPECTED_STEP_DAYS;
    return makeForecastListRow(
      `fy-${page}-${index}`,
      title("For you", page, index),
      { tier: "strong", finalScore: score },
      expected,
    );
  });
}

const FOR_YOU_PAGE_1 = forYouRows(1, PAGE_SIZE);
const FOR_YOU_PAGE_2 = forYouRows(2, FOR_YOU_PAGE_2_ROWS);
const MATCHED_ALL = makeForecastListRow("all-1", title("All", 1, 1), STRONG);
const UNMATCHED_ALL = makeForecastListRow("all-2", title("All", 1, 2), null);
const SAVED_ROW = makeForecastListRow("saved-1", title("Saved", 1, 1), STRONG);
const FOOD_ROW = makeForecastListRow("food-1", title("Food", 1, 1), STRONG);

/** The page the stub serves for one request's query. */
function answer(query: URLSearchParams): ForecastListResponseDto {
  const view = (query.get("view") ?? "for_you") as ForecastView;
  const page = Number(query.get("page") ?? "1");
  const counts = { viewCounts: VIEW_COUNTS };
  if (query.get(WORK_KEY) === WORK_VALUE) {
    return forecastsPage({ rows: [FOOD_ROW], page, hasMore: false, total: 1, ...counts });
  }
  if (view === "all") {
    const rows = [MATCHED_ALL, UNMATCHED_ALL];
    return forecastsPage({ rows, page, hasMore: false, total: rows.length, ...counts });
  }
  if (view === "saved") {
    return forecastsPage({ rows: [SAVED_ROW], page, hasMore: false, total: 1, ...counts });
  }
  if (page === 1) {
    return forecastsPage({
      rows: FOR_YOU_PAGE_1,
      page,
      hasMore: true,
      total: FOR_YOU_TOTAL,
      ...counts,
    });
  }
  return forecastsPage({
    rows: FOR_YOU_PAGE_2,
    page,
    hasMore: false,
    total: FOR_YOU_TOTAL,
    ...counts,
  });
}

/** What the stub saw: each list query, and the keys of each takes POST. */
interface Captured {
  lists: URLSearchParams[];
  takes: string[][];
}

function json(route: Route, status: number, body: unknown): Promise<void> {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

/** A route predicate on one API path. The query is not read. */
function apiPath(path: string): (url: URL) => boolean {
  const origin = new URL(API_BASE_URL).origin;
  return (url) => url.origin === origin && url.pathname === path;
}

/**
 * Backend down, then the session, then the list's endpoints. `failPage2Once` makes
 * the first request for For you page 2 fail with a 500.
 */
async function stubList(page: Page, opts: { failPage2Once?: boolean } = {}): Promise<Captured> {
  const captured: Captured = { lists: [], takes: [] };
  let failuresLeft = opts.failPage2Once ? 1 : 0;
  await stubBackendDown(page, API_BASE_URL);
  await stubSession(page);
  await page.route(apiPath(WORKSPACE_PATH), (route) =>
    json(route, HTTP_OK, workspaceResponse([SAVED_ROW.oppKey])),
  );
  await page.route(apiPath(WATCH_PATH), (route) => json(route, HTTP_OK, forecastWatchResponse()));
  await page.route(apiPath(FORECASTS_PATH), (route) => {
    const query = new URL(route.request().url()).searchParams;
    captured.lists.push(query);
    const forYouPage2 = (query.get("view") ?? "for_you") === "for_you" && query.get("page") === "2";
    if (forYouPage2 && !query.has(WORK_KEY) && failuresLeft > 0) {
      failuresLeft -= 1;
      return json(route, HTTP_SERVER_ERROR, { message: "down" });
    }
    return json(route, HTTP_OK, answer(query));
  });
  await page.route(apiPath(TAKES_PATH), (route) => {
    const body = route.request().postDataJSON() as { oppKeys: string[] };
    captured.takes.push(body.oppKeys);
    return json(route, HTTP_OK, { takes: [] });
  });
  return captured;
}

/** The query without `page`, so two pages of one question compare equal. */
function withoutPage(query: URLSearchParams): string {
  const copy = new URLSearchParams(query);
  copy.delete("page");
  return copy.toString();
}

function titlesOf(rows: ForecastListRowDto[]): string[] {
  return rows.map((r) => r.hunter.plainTitle ?? "");
}

/** Opens For you and waits until page 1's cards are on screen. */
async function openForYou(page: Page): Promise<ForecastsListPage> {
  const list = new ForecastsListPage(page);
  await list.openForYou();
  await list.waitForCards(PAGE_SIZE);
  return list;
}

test.describe("The paged forecast list", () => {
  test("For you asks page 1 and shows it in the server's order with the counts", async ({
    page,
  }) => {
    const captured = await stubList(page);
    const list = await openForYou(page);

    expect(await list.cardTitles()).toEqual(titlesOf(FOR_YOU_PAGE_1));
    await expect(list.viewCount(LIST_COPY.views.forYou)).toHaveText(String(FOR_YOU_TOTAL));
    await expect(list.viewCount(LIST_COPY.views.all)).toHaveText(String(VIEW_COUNTS.all));
    await expect(list.viewCount(LIST_COPY.views.saved)).toHaveText(String(VIEW_COUNTS.saved));

    expect(captured.lists.length).toBeGreaterThan(0);
    for (const query of captured.lists) {
      expect(query.get("view")).toBe("for_you");
      expect(query.get("page")).toBe("1");
      expect(query.get("limit")).toBe(String(PAGE_SIZE));
    }
  });

  test("a scroll asks page 2 with the same query, appends it, and takes reach page 2 once", async ({
    page,
  }) => {
    const captured = await stubList(page);
    const list = await openForYou(page);

    await list.scrollToListEnd();
    await list.waitForCards(FOR_YOU_TOTAL);

    expect(await list.cardTitles()).toEqual([
      ...titlesOf(FOR_YOU_PAGE_1),
      ...titlesOf(FOR_YOU_PAGE_2),
    ]);
    const first = captured.lists.find((q) => q.get("page") === "1");
    const second = captured.lists.find((q) => q.get("page") === "2");
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(withoutPage(second!)).toBe(withoutPage(first!));

    const page2Keys = FOR_YOU_PAGE_2.map((r) => r.oppKey);
    await expect.poll(() => captured.takes.flat()).toEqual(expect.arrayContaining(page2Keys));
    const sent = captured.takes.flat();
    expect(new Set(sent).size).toBe(sent.length);
  });

  test("the All and Saved views each ask page 1 of their own view", async ({ page }) => {
    const captured = await stubList(page);
    const list = await openForYou(page);

    await list.switchView(LIST_COPY.views.all);
    await expect(list.card(MATCHED_ALL.hunter.plainTitle!).heading).toBeVisible();
    expect(captured.lists.at(-1)?.get("view")).toBe("all");
    expect(captured.lists.at(-1)?.get("page")).toBe("1");

    await list.switchView(LIST_COPY.views.saved);
    await expect(list.card(SAVED_ROW.hunter.plainTitle!).heading).toBeVisible();
    expect(captured.lists.at(-1)?.get("view")).toBe("saved");
    expect(captured.lists.at(-1)?.get("page")).toBe("1");
  });

  test("a drawer choice asks page 1 again with the filter's URL key", async ({ page }) => {
    const captured = await stubList(page);
    const list = await openForYou(page);
    await list.scrollToListEnd();
    await list.waitForCards(FOR_YOU_TOTAL);

    await list.openFilters();
    await list.chooseWork(WORK_PILL);

    await expect(list.card(FOOD_ROW.hunter.plainTitle!).heading).toBeVisible();
    const filtered = captured.lists.filter((q) => q.has(WORK_KEY));
    expect(filtered.length).toBeGreaterThan(0);
    for (const query of filtered) {
      expect(query.get(WORK_KEY)).toBe(WORK_VALUE);
      expect(query.get("view")).toBe("for_you");
      expect(query.get("page")).toBe("1");
    }
    expect(await list.cardTitles()).toEqual([FOOD_ROW.hunter.plainTitle]);
  });

  test("a failed page 2 keeps the cards, and Retry asks page 2 again", async ({ page }) => {
    const captured = await stubList(page, { failPage2Once: true });
    const list = await openForYou(page);

    await list.scrollToListEnd();
    await expect(list.moreError).toBeVisible();
    expect(await list.cardTitles()).toEqual(titlesOf(FOR_YOU_PAGE_1));

    await list.retryMore();
    await list.waitForCards(FOR_YOU_TOTAL);
    await expect(list.moreError).toHaveCount(0);

    const page2 = captured.lists.filter((q) => q.get("page") === "2");
    expect(page2).toHaveLength(2);
    expect(withoutPage(page2[1])).toBe(withoutPage(page2[0]));
  });

  test("a card with no match row shows no fit chip", async ({ page }) => {
    await stubList(page);
    const list = new ForecastsListPage(page);
    await list.openAll();

    await expect(list.card(MATCHED_ALL.hunter.plainTitle!).fitChip).toHaveText(FIT_CHIP.bid);
    await expect(list.card(UNMATCHED_ALL.hunter.plainTitle!).heading).toBeVisible();
    await expect(list.card(UNMATCHED_ALL.hunter.plainTitle!).fitChip).toHaveCount(0);
  });
});

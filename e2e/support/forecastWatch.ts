import type { Page, Request, Route } from "@playwright/test";
import { API_BASE_URL } from "./deps";
import { stubBackendDown, stubSession } from "./session";
import {
  FORECAST_OPP_KEY,
  forecastResponse,
  forecastsResponse,
  forecastWatchResponse,
  makeWatchForecast,
  trackedForecastDetails,
  workspaceResponse,
} from "./fixtures";
import type { ForecastWatchEvent } from "../../src/lib/forecasts/watch";
import type { ForecastDetailPage } from "../pages/forecast-detail.page";

/**
 * The network half of the forecast watch specs (`forecast-watch.spec.ts`,
 * `forecast-links.spec.ts`): the default forecast, the list, the saved list, My Bids
 * and `GET /forecast-watch`, plus the seen POST. DOM stays in `e2e/pages/`.
 */

/** The default forecast's plain title (`hunter.plainTitle` in `makeForecastRecord`). */
export const FORECAST_TITLE = "Cleaning a federal building in Raleigh";
export const WATCH_PATH = "/forecast-watch";
export const SEEN_PATH = `${WATCH_PATH}/${FORECAST_OPP_KEY}/seen`;
const SEEN_AT = "2026-09-28T09:00:00.000Z";
export const HTTP_OK = 200;
const HTTP_CREATED = 201;
/** The seen POST's answer. The client reads only the status. */
const SEEN_ANSWER = { marked: 1 };

export type WatchAnswer = { status: number; body: unknown };

export interface WatchStub {
  /** Whether the saved list holds the default forecast. */
  tracked: boolean;
  /** The answer to `GET /forecast-watch` before and after a mark-as-seen. */
  watch: (seen: boolean) => WatchAnswer;
}

/** Every write the page sent to the API, and the seen POSTs on their own. */
export interface Captured {
  writes: Request[];
  seen: Request[];
}

function json(route: Route, status: number, body: unknown): Promise<void> {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

/** A route predicate on one API path. The query is ignored, so a `?locationId=` does not hide it. */
function apiPath(path: string): (url: URL) => boolean {
  const origin = new URL(API_BASE_URL).origin;
  return (url) => url.origin === origin && url.pathname === path;
}

/**
 * Watching on, with `events` on the default forecast. Seen events carry `SEEN_AT`. The
 * answer is built per request, so `events` may be any JSON the server could send.
 */
export function watching(events: ForecastWatchEvent[]): (seen: boolean) => WatchAnswer {
  return (seen) => ({
    status: HTTP_OK,
    body: forecastWatchResponse([
      makeWatchForecast(seen ? events.map((e) => ({ ...e, seenAt: SEEN_AT })) : events),
    ]),
  });
}

/**
 * The session, then the forecast, the list, the saved list, My Bids and the watch.
 * The seen POST flips the watch to its seen answer, as the server does.
 */
export async function stubWatch(page: Page, stub: WatchStub): Promise<Captured> {
  const captured: Captured = { writes: [], seen: [] };
  let seen = false;
  await stubBackendDown(page, API_BASE_URL);
  await stubSession(page);
  await page.route(apiPath(`/forecasts/${FORECAST_OPP_KEY}`), (route) =>
    json(route, HTTP_OK, forecastResponse()),
  );
  await page.route(apiPath("/forecasts"), (route) => json(route, HTTP_OK, forecastsResponse()));
  await page.route(apiPath("/workspace"), (route) =>
    json(route, HTTP_OK, workspaceResponse(stub.tracked ? [FORECAST_OPP_KEY] : [])),
  );
  await page.route(apiPath("/workspace/saved-opps/details"), (route) =>
    json(route, HTTP_OK, stub.tracked ? trackedForecastDetails(FORECAST_TITLE) : []),
  );
  await page.route(apiPath("/workspace/saved-opps"), (route) =>
    json(route, HTTP_CREATED, { savedOpps: [FORECAST_OPP_KEY] }),
  );
  await page.route(apiPath(WATCH_PATH), (route) => {
    const answer = stub.watch(seen);
    return json(route, answer.status, answer.body);
  });
  await page.route(apiPath(SEEN_PATH), (route) => {
    captured.seen.push(route.request());
    seen = true;
    return json(route, HTTP_OK, SEEN_ANSWER);
  });
  page.on("request", (request) => {
    const method = request.method();
    if (!request.url().startsWith(API_BASE_URL)) return;
    if (method === "GET" || method === "OPTIONS") return;
    if (new URL(request.url()).pathname === "/users/from-highlevel") return;
    captured.writes.push(request);
  });
  return captured;
}

/** Resolves when the page has the watch read's answer. */
export function watchAnswered(page: Page): Promise<unknown> {
  return page.waitForResponse((r) => apiPath(WATCH_PATH)(new URL(r.url())));
}

/** Opens the forecast and waits until the page has both its read and the watch's answer. */
export async function openForecast(forecast: ForecastDetailPage, page: Page): Promise<void> {
  const answered = watchAnswered(page);
  await forecast.open(FORECAST_OPP_KEY);
  await answered;
  await forecast.callWord.waitFor({ state: "visible" });
}

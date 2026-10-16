// @vitest-environment jsdom
// The paged forecast list (ARCHITECTURE-forecasts-paginated.md, section 10): page 1
// replaces the rows, the sentinel asks the next page, a new query starts again, an
// answer for a query the member left is dropped, and the order is the server's.

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchForecastList,
  type ForecastListResponseDto,
  type ForecastListRowDto,
  type ForecastMemberDto,
} from "../forecastsApi";
import { bus } from "../eventBus";
import { HIGHERGOV_FORECASTS } from "./__fixtures__/forecastRecords";
import { TRACKED_WRITES_SLICE } from "../trackedForecasts";
import { byBestFit } from "./engine";
import { firmFromMember, scoreLive } from "./live";
import { loadedForecast, resetLoadedForecasts } from "./loadedForecasts";
import type { ForecastsSearch } from "./search";
import { useForecastList } from "./useForecastList";

vi.mock("../forecastsApi", async (importOriginal) => {
  const real = await importOriginal<typeof import("../forecastsApi")>();
  return { ...real, fetchForecastList: vi.fn() };
});
const pageMock = vi.mocked(fetchForecastList);

const ATLANTA = HIGHERGOV_FORECASTS.find((r) => r.id === "fed-detainee-meals-atlanta")!;
const PAGE_SIZE = 20;

const MEMBER: ForecastMemberDto = {
  naics: ["722310"],
  states: ["GA"],
  certs: [],
  certsKnown: true,
  isSmall: true,
  registration: { status: "active", endsOn: "2028-01-31" },
  biggestPastJob: 3_000_000,
  smallestTarget: null,
  businessName: "Peach State Meals LLC",
  address: null,
};

function row(id: string, semanticFit: number | null = 0.8): ForecastListRowDto {
  return {
    ...ATLANTA,
    id,
    oppKey: id,
    hunter: { plainTitle: `Forecast ${id}`, semanticFit, categoryFit: null },
    match: { tier: "stretch", finalScore: 50 },
  };
}

const rows = (prefix: string, from: number, n: number) =>
  Array.from({ length: n }, (_, i) => row(`${prefix}-${from + i}`));

function answer(
  forecasts: ForecastListRowDto[],
  page: number,
  hasMore: boolean,
  firstPage = page === 1,
): ForecastListResponseDto {
  return {
    member: MEMBER,
    forecasts,
    page,
    limit: PAGE_SIZE,
    hasMore,
    ...(firstPage
      ? {
          total: 45,
          captureCounts: { all: 45, act_now: 1, start_capture: 2, position_early: 3, watch: 39 },
          viewCounts: { for_you: 45, all: 900, saved: 2 },
          facets: { states: [{ value: "GA", count: 45 }], cities: [], naics: [] },
        }
      : {}),
  };
}

/** A request the test settles by hand. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** The request of one call to fetchForecastList. */
function requestOf(call: number): URLSearchParams {
  return pageMock.mock.calls[call][0];
}

/** The request without its page, to compare two pages of one query. */
function withoutPage(params: URLSearchParams): string {
  const copy = new URLSearchParams(params);
  copy.delete("page");
  return copy.toString();
}

/** An IntersectionObserver the test drives: `reach()` says the sentinel is on screen. */
let observed: { callback: IntersectionObserverCallback; options?: IntersectionObserverInit }[] = [];
class TestObserver {
  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit,
  ) {
    observed.push({ callback, options });
  }
  observe() {}
  unobserve() {}
  disconnect() {
    observed = observed.filter((o) => o.callback !== this.callback);
  }
  takeRecords() {
    return [];
  }
}
function reach() {
  const last = observed[observed.length - 1];
  last.callback(
    [{ isIntersecting: true } as IntersectionObserverEntry],
    {} as IntersectionObserver,
  );
}

function renderList(search: ForecastsSearch) {
  const hook = renderHook((s: ForecastsSearch) => useForecastList(s), { initialProps: search });
  act(() => hook.result.current.sentinelRef(document.createElement("div")));
  return hook;
}

beforeEach(() => {
  pageMock.mockReset();
  resetLoadedForecasts();
  observed = [];
  globalThis.IntersectionObserver = TestObserver as unknown as typeof IntersectionObserver;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  resetLoadedForecasts();
  vi.restoreAllMocks();
});

describe("useForecastList", () => {
  it("loads page 1 with the view and the URL's keys, and keeps its counts", async () => {
    pageMock.mockResolvedValueOnce(answer(rows("a", 0, PAGE_SIZE), 1, true));
    const { result } = renderList({ view: "all", lane: "sled", states: "GA" });

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));

    const first = requestOf(0);
    expect(first.get("view")).toBe("all");
    expect(first.get("lane")).toBe("sled");
    expect(first.get("states")).toBe("GA");
    expect(first.get("page")).toBe("1");
    expect(first.get("limit")).toBe(String(PAGE_SIZE));
    expect(result.current.rows).toHaveLength(PAGE_SIZE);
    expect(result.current.total).toBe(45);
    expect(result.current.viewCounts).toEqual({ for_you: 45, all: 900, saved: 2 });
    expect(result.current.captureCounts?.watch).toBe(39);
    expect(result.current.facets?.states).toEqual([{ value: "GA", count: 45 }]);
    expect(result.current.member).toEqual(MEMBER);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.rows[0].match).toEqual({ tier: "stretch", finalScore: 50 });
    expect(result.current.rows[0].facts.title).toBe("Forecast a-0");
  });

  it("(a) asks page 2 of the same query when the sentinel is reached, and appends it", async () => {
    pageMock
      .mockResolvedValueOnce(answer(rows("a", 0, PAGE_SIZE), 1, true))
      // Page 2 repeats one row of page 1: a record that moved between the two reads.
      .mockResolvedValueOnce(answer([row("a-19"), ...rows("a", 20, 5)], 2, false));
    const { result } = renderList({ view: "all", naics: "722310", q: "meals" });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => reach());

    await waitFor(() => expect(result.current.rows).toHaveLength(25));
    expect(requestOf(1).get("page")).toBe("2");
    expect(withoutPage(requestOf(1))).toBe(withoutPage(requestOf(0)));
    expect(new Set(result.current.rows.map((r) => r.id)).size).toBe(25);
    expect(result.current.hasMore).toBe(false);
    // A later page carries no counts; page 1's stay.
    expect(result.current.total).toBe(45);
    expect(result.current.viewCounts?.all).toBe(900);
    expect(observed[0].options?.rootMargin).toBe("400px");
  });

  it("asks no page past the end, and no second page while one is in flight", async () => {
    const second = deferred<ForecastListResponseDto>();
    pageMock
      .mockResolvedValueOnce(answer(rows("a", 0, PAGE_SIZE), 1, true))
      .mockReturnValueOnce(second.promise);
    const { result } = renderList({ view: "all" });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => reach());
    act(() => reach());
    expect(pageMock).toHaveBeenCalledTimes(2);
    expect(result.current.loadingMore).toBe(true);

    await act(async () => second.resolve(answer(rows("a", 20, 3), 2, false)));
    act(() => reach());
    expect(pageMock).toHaveBeenCalledTimes(2);
  });

  it("(b) shows only the new query's rows when a filter changes mid-request", async () => {
    const old = deferred<ForecastListResponseDto>();
    pageMock
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce(answer(rows("tx", 0, 3), 1, false));
    const { result, rerender } = renderList({ view: "all", states: "GA" });
    await waitFor(() => expect(pageMock).toHaveBeenCalledTimes(1));
    const oldSignal = pageMock.mock.calls[0][1];

    rerender({ view: "all", states: "TX" });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    // The old query's answer arrives late, and is dropped.
    await act(async () => old.resolve(answer(rows("ga", 0, PAGE_SIZE), 1, true)));

    expect(oldSignal?.aborted).toBe(true);
    expect(requestOf(1).get("states")).toBe("TX");
    expect(requestOf(1).get("page")).toBe("1");
    expect(result.current.rows.map((r) => r.id)).toEqual(["tx-0", "tx-1", "tx-2"]);
  });

  it("(b) drops a next page that was in flight when the query changed", async () => {
    const lateMore = deferred<ForecastListResponseDto>();
    pageMock
      .mockResolvedValueOnce(answer(rows("ga", 0, PAGE_SIZE), 1, true))
      .mockReturnValueOnce(lateMore.promise)
      .mockResolvedValueOnce(answer(rows("tx", 0, 2), 1, false));
    const { result, rerender } = renderList({ view: "all", states: "GA" });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    act(() => reach());
    expect(pageMock).toHaveBeenCalledTimes(2);

    rerender({ view: "all", states: "TX" });
    expect(result.current.rows).toHaveLength(0);
    await waitFor(() => expect(result.current.rows.map((r) => r.id)).toEqual(["tx-0", "tx-1"]));
    await act(async () => lateMore.resolve(answer(rows("ga", 20, 5), 2, false)));

    expect(result.current.rows.map((r) => r.id)).toEqual(["tx-0", "tx-1"]);
  });

  it("starts again at page 1 on a change of view, lane, search, tab or sort", async () => {
    pageMock.mockImplementation((params) =>
      Promise.resolve(answer(rows(params.toString(), 0, 1), 1, false)),
    );
    const { result, rerender } = renderList({ view: "for_you" });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    const changes: ForecastsSearch[] = [
      { view: "all" },
      { view: "all", lane: "federal" },
      { view: "all", lane: "federal", q: "roof" },
      { view: "all", lane: "federal", q: "roof", tab: "act_now" },
      { view: "all", lane: "federal", q: "roof", tab: "act_now", sort: "value" },
    ];
    for (const [i, search] of changes.entries()) {
      rerender(search);
      await waitFor(() => expect(pageMock).toHaveBeenCalledTimes(i + 2));
      expect(requestOf(i + 1).get("page")).toBe("1");
    }
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(requestOf(5).get("sort")).toBe("value");
  });

  it("(c) keeps the rows when a later page fails, and Retry asks the same page again", async () => {
    pageMock
      .mockResolvedValueOnce(answer(rows("a", 0, PAGE_SIZE), 1, true))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(answer(rows("a", 20, 4), 2, false));
    const { result } = renderList({ view: "all" });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => reach());
    await waitFor(() => expect(result.current.moreFailed).toBe(true));
    expect(result.current.rows).toHaveLength(PAGE_SIZE);
    expect(result.current.status).toBe("ready");
    // The sentinel does not ask again by itself; only Retry does.
    act(() => reach());
    expect(pageMock).toHaveBeenCalledTimes(2);

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.rows).toHaveLength(24));
    expect(requestOf(2).get("page")).toBe("2");
    expect(withoutPage(requestOf(2))).toBe(withoutPage(requestOf(1)));
    expect(result.current.moreFailed).toBe(false);
  });

  it("(c) shows the error when page 1 fails, and Retry asks page 1 again", async () => {
    pageMock
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(answer(rows("a", 0, 2), 1, false));
    const { result } = renderList({ view: "saved" });
    await waitFor(() => expect(result.current.status).toBe("error"));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(requestOf(1).get("page")).toBe("1");
    expect(requestOf(1).get("view")).toBe("saved");
    expect(result.current.rows).toHaveLength(2);
  });

  it("(e) keeps the server's order, not the engine's", async () => {
    const weak = row("weak", 0.05);
    const strong = row("strong", 0.95);
    const firm = firmFromMember(MEMBER);
    // The fixture's engine order differs from the server's.
    const engineOrder = [scoreLive(weak, firm), scoreLive(strong, firm)].sort(byBestFit);
    expect(engineOrder.map((f) => f.id)).toEqual(["strong", "weak"]);

    pageMock.mockResolvedValueOnce(answer([weak, strong], 1, false));
    const { result } = renderList({ view: "for_you" });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.rows.map((r) => r.id)).toEqual(["weak", "strong"]);
  });

  it("remembers every loaded row for the forecast page", async () => {
    pageMock.mockResolvedValueOnce(answer([row("fc-1")], 1, false));
    const { result } = renderList({ view: "all" });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(loadedForecast("fc-1")?.record.id).toBe("fc-1");
    expect(loadedForecast("fc-1")?.member).toEqual(MEMBER);
  });

  it("reloads page 1 of the Saved view after a track or untrack write settles", async () => {
    pageMock
      .mockResolvedValueOnce(answer(rows("s", 0, 2), 1, false))
      .mockResolvedValueOnce(answer(rows("s", 0, 1), 1, false));
    const { result } = renderList({ view: "saved" });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => bus.publish(TRACKED_WRITES_SLICE));

    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    expect(requestOf(1).get("view")).toBe("saved");
    expect(requestOf(1).get("page")).toBe("1");
  });

  it("keeps the last facets, marked pending, while page 1 of a new query is in flight", async () => {
    const next = deferred<ForecastListResponseDto>();
    const txFacets = { states: [{ value: "TX", count: 3 }], cities: [], naics: [] };
    pageMock
      .mockResolvedValueOnce(answer(rows("ga", 0, 2), 1, false))
      .mockReturnValueOnce(next.promise);
    const { result, rerender } = renderList({ view: "all", states: "GA" });
    expect(result.current.facets).toBeNull();
    expect(result.current.facetsState).toBe("pending");
    await waitFor(() => expect(result.current.facetsState).toBe("current"));
    const gaFacets = result.current.facets;

    rerender({ view: "all", states: "GA,TX" });
    // The options stay on screen; the counts for the new choices are not known yet.
    expect(result.current.facets).toEqual(gaFacets);
    expect(result.current.facetsState).toBe("pending");
    expect(result.current.total).toBeNull();
    await waitFor(() => expect(pageMock).toHaveBeenCalledTimes(2));
    expect(result.current.facets).toEqual(gaFacets);
    expect(result.current.facetsState).toBe("pending");

    await act(async () =>
      next.resolve({ ...answer(rows("tx", 0, 3), 1, false), facets: txFacets }),
    );
    expect(result.current.facets).toEqual(txFacets);
    expect(result.current.facetsState).toBe("current");
  });

  it("marks the facets failed, not pending, when page 1 of a new query fails", async () => {
    pageMock
      .mockResolvedValueOnce(answer(rows("ga", 0, 2), 1, false))
      .mockRejectedValueOnce(new Error("offline"));
    const { result, rerender } = renderList({ view: "all", states: "GA" });
    await waitFor(() => expect(result.current.facetsState).toBe("current"));

    rerender({ view: "all", states: "TX" });
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.facetsState).toBe("failed");
  });

  it("asks no next page while a Saved reload of page 1 is in flight, so no page is lost", async () => {
    const reload = deferred<ForecastListResponseDto>();
    pageMock
      .mockResolvedValueOnce(answer(rows("s", 0, PAGE_SIZE), 1, true))
      .mockResolvedValueOnce(answer(rows("s", 20, PAGE_SIZE), 2, true))
      .mockReturnValueOnce(reload.promise)
      .mockResolvedValueOnce(answer(rows("s", 20, PAGE_SIZE), 2, true));
    const { result } = renderList({ view: "saved" });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    act(() => reach());
    await waitFor(() => expect(result.current.rows).toHaveLength(2 * PAGE_SIZE));

    act(() => bus.publish(TRACKED_WRITES_SLICE));
    await waitFor(() => expect(pageMock).toHaveBeenCalledTimes(3));
    expect(requestOf(2).get("page")).toBe("1");
    // The sentinel is still on screen, but page 3 is not asked under the reload.
    act(() => reach());
    expect(pageMock).toHaveBeenCalledTimes(3);

    await act(async () => reload.resolve(answer(rows("s", 0, PAGE_SIZE), 1, true)));
    expect(result.current.rows).toHaveLength(PAGE_SIZE);
    act(() => reach());
    await waitFor(() => expect(result.current.rows).toHaveLength(2 * PAGE_SIZE));
    expect(requestOf(3).get("page")).toBe("2");
    expect(new Set(result.current.rows.map((r) => r.id)).size).toBe(2 * PAGE_SIZE);
  });

  it("does not reload another view after a track write", async () => {
    pageMock.mockResolvedValue(answer(rows("a", 0, 2), 1, false));
    const { result } = renderList({ view: "all" });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => bus.publish(TRACKED_WRITES_SLICE));
    await new Promise((r) => setTimeout(r, 200));

    expect(pageMock).toHaveBeenCalledTimes(1);
  });
});

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL, setGhlToken } from "./api";
import { fetchForecastList } from "./forecastsApi";
import { forecastListParams } from "./forecasts/listQuery";

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const mockFetch = vi.fn();
/** Resolves a relative API URL; the test build has no API origin. */
const BASE = "http://localhost";

function jsonResponse(body: unknown, status = HTTP_OK): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  globalThis.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockReset();
  window.sessionStorage.clear();
  setGhlToken("test-ghl-token");
});

afterEach(() => window.sessionStorage.clear());

describe("fetchForecastList", () => {
  it("asks GET /forecasts with the view, the query, the page and the signal", async () => {
    const body = { member: {}, forecasts: [], page: 2, limit: 20, hasMore: false };
    mockFetch.mockResolvedValue(jsonResponse(body));
    const controller = new AbortController();

    const answer = await fetchForecastList(
      forecastListParams({ view: "all", lane: "sled" }, 2),
      controller.signal,
    );

    expect(answer).toEqual(body);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url.startsWith(`${API_BASE_URL}/forecasts?`)).toBe(true);
    const parsed = new URL(url, BASE);
    expect(parsed.searchParams.get("view")).toBe("all");
    expect(parsed.searchParams.get("lane")).toBe("sled");
    expect(parsed.searchParams.get("page")).toBe("2");
    expect(parsed.searchParams.get("limit")).toBe("20");
    expect(init.signal).toBe(controller.signal);
  });

  it("sends the view For you when the parameters name none", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ forecasts: [] }));
    await fetchForecastList(new URLSearchParams("page=1"));
    const [url] = mockFetch.mock.calls[0] as [string];
    expect(new URL(url, BASE).searchParams.get("view")).toBe("for_you");
  });

  it("throws on a refused request", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ message: "Invalid forecast list parameter: lane" }, HTTP_BAD_REQUEST),
    );
    await expect(fetchForecastList(forecastListParams({}, 1))).rejects.toThrow();
  });
});

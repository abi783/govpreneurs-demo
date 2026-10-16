// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL, setGhlToken } from "../api";
import {
  FORECAST_CARD_TAKE_LINE_MAX,
  FORECAST_CARD_TAKE_MAX_KEYS,
  fetchForecastTakes,
} from "./cardTakeApi";

const TOKEN = "test-ghl-token";
const HTTP_OK = 200;
const HTTP_TOO_MANY = 429;
const LINE = "This is roofing work, which is what your business does.";

const mockFetch = vi.fn();

function jsonResponse(body: unknown, status = HTTP_OK): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function lastCall(): { url: string; init: RequestInit } {
  const [url, init] = mockFetch.mock.calls[mockFetch.mock.calls.length - 1] as [
    string,
    RequestInit,
  ];
  return { url, init };
}

beforeEach(() => {
  globalThis.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockReset();
  window.sessionStorage.clear();
  setGhlToken(TOKEN);
});

afterEach(() => {
  window.sessionStorage.clear();
});

describe("fetchForecastTakes", () => {
  it("posts the keys, and only the keys, and maps the answer by key", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ takes: [{ oppKey: "fc-1", line: LINE }] }));
    const out = await fetchForecastTakes(["fc-1", "fc-2"]);
    expect(out).toEqual(new Map([["fc-1", LINE]]));
    const { url, init } = lastCall();
    expect(url.startsWith(`${API_BASE_URL}/forecasts/takes`)).toBe(true);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ oppKeys: ["fc-1", "fc-2"] });
  });

  it(`sends at most ${FORECAST_CARD_TAKE_MAX_KEYS} keys`, async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ takes: [] }));
    const keys = Array.from({ length: FORECAST_CARD_TAKE_MAX_KEYS + 10 }, (_, i) => `fc-${i}`);
    await fetchForecastTakes(keys);
    const sent = JSON.parse(lastCall().init.body as string) as { oppKeys: string[] };
    expect(sent.oppKeys).toHaveLength(FORECAST_CARD_TAKE_MAX_KEYS);
  });

  it("makes no call for no keys", async () => {
    expect(await fetchForecastTakes([])).toEqual(new Map());
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects on a failed call, so the caller can retry the window", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: "slow down" }, HTTP_TOO_MANY));
    await expect(fetchForecastTakes(["fc-1"])).rejects.toThrow();
  });

  it("drops a take it did not ask for, an empty line, a long line and a malformed item", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        takes: [
          { oppKey: "fc-other", line: LINE },
          { oppKey: "fc-1", line: "   " },
          { oppKey: "fc-2", line: "x".repeat(FORECAST_CARD_TAKE_LINE_MAX + 1) },
          { oppKey: "fc-3", line: 42 },
          null,
          { oppKey: "fc-4", line: `  ${LINE}  ` },
        ],
      }),
    );
    const out = await fetchForecastTakes(["fc-1", "fc-2", "fc-3", "fc-4"]);
    expect(out).toEqual(new Map([["fc-4", LINE]]));
  });

  it("reads an answer with no takes list as no lines", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));
    expect(await fetchForecastTakes(["fc-1"])).toEqual(new Map());
  });
});

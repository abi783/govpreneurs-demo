// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL, setGhlToken } from "../api";
import {
  FORECAST_TAKE_COUNTED_KEYS,
  fetchForecastTake,
  resetForecastTakeCache,
  type ForecastTakeFact,
  type ForecastTakeResponse,
} from "./grantTakeApi";

const TOKEN = "test-ghl-token";
const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const HTTP_TOO_MANY = 429;
const HTTP_SERVER_ERROR = 500;
const HTTP_UNAVAILABLE = 503;

const mockFetch = vi.fn();

const NOT_CHECKED: ForecastTakeFact = { state: "notChecked" };

/** A take built from the wire interface: one counted fact, the rest not checked. */
function takeOf(oppKey = "KEY_1"): ForecastTakeResponse {
  return {
    oppKey,
    noticeType: "forecast",
    analyzedAt: "2026-09-25T10:00:00.000Z",
    counted: {
      comparableAwards: {
        state: "counted",
        figure: 170000,
        basis: {
          countedOver: 186,
          matchedOn: "NAICS 238160",
          yearsCovered: "FY2006–FY2021",
          atLeast: false,
        },
        source: {
          label: "Comparable awards",
          provenance: { type: "public", ref: "tally:comparable-awards" },
        },
        asOf: "2026-09-20T00:00:00.000Z",
      } as ForecastTakeFact,
      fieldSize: NOT_CHECKED,
      marketWinners: NOT_CHECKED,
      buyer: NOT_CHECKED,
      upcoming: NOT_CHECKED,
      subUse: NOT_CHECKED,
    },
    reads: [
      {
        id: 3,
        name: "Market",
        status: "mixed",
        sentence: [{ text: "Five firms won work like this." }],
        evidence: [],
      },
    ],
    memberSources: {
      profile: "used",
      capabilityStatement: "notChecked",
      learnedFacts: "notChecked",
      match: "notChecked",
    },
  };
}

const BASIS = {
  countedOver: 186,
  matchedOn: "NAICS 238160",
  yearsCovered: "FY2006–FY2021",
  atLeast: false,
};

/** A take whose comparableAwards fact is overridden by `over`. */
function withFact(over: Record<string, unknown>): unknown {
  const take = takeOf();
  return {
    ...take,
    counted: { ...take.counted, comparableAwards: { ...take.counted.comparableAwards, ...over } },
  };
}

function jsonResponse(body: unknown, status = HTTP_OK): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function lastCall(): { url: string; init: RequestInit | undefined } {
  const [url, init] = mockFetch.mock.calls[mockFetch.mock.calls.length - 1] as [
    string,
    RequestInit | undefined,
  ];
  return { url, init };
}

beforeEach(() => {
  globalThis.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockReset();
  window.sessionStorage.clear();
  setGhlToken(TOKEN);
  resetForecastTakeCache();
});

afterEach(() => {
  window.sessionStorage.clear();
  resetForecastTakeCache();
});

describe("fetchForecastTake", () => {
  it("gets the take route through apiFetch with the session token", async () => {
    const take = takeOf();
    mockFetch.mockResolvedValue(jsonResponse(take));

    expect(await fetchForecastTake("KEY_1")).toEqual({ ok: true, take });
    const { url, init } = lastCall();
    expect(url).toBe(`${API_BASE_URL}/forecasts/KEY_1/grant/take`);
    expect(init?.method ?? "GET").toBe("GET");
    expect(new Headers(init?.headers).get("X-GHL-Token")).toBe(TOKEN);
  });

  it("URL-encodes the oppKey", async () => {
    mockFetch.mockResolvedValue(jsonResponse(takeOf("a/b?c#d")));
    await fetchForecastTake("a/b?c#d");
    expect(lastCall().url).toBe(`${API_BASE_URL}/forecasts/a%2Fb%3Fc%23d/grant/take`);
  });

  it("never sends a locationId in the path of the take route", async () => {
    mockFetch.mockResolvedValue(jsonResponse(takeOf()));
    await fetchForecastTake("KEY_1");
    expect(lastCall().url.split("?")[0]).not.toContain("locationId");
  });

  it("resolves a 404 to the notFound error", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ message: "no" }, HTTP_NOT_FOUND));
    expect(await fetchForecastTake("KEY_1")).toEqual({ ok: false, error: "notFound" });
  });

  it.each([HTTP_TOO_MANY, HTTP_SERVER_ERROR, HTTP_UNAVAILABLE])(
    "resolves a %i to the failed error, never a take",
    async (status) => {
      mockFetch.mockResolvedValue(jsonResponse(takeOf(), status));
      expect(await fetchForecastTake("KEY_1")).toEqual({ ok: false, error: "failed" });
    },
  );

  it("resolves a network failure to the failed error", async () => {
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await fetchForecastTake("KEY_1")).toEqual({ ok: false, error: "failed" });
  });

  it("resolves a 200 whose body is not JSON to the failed error", async () => {
    mockFetch.mockResolvedValue(new Response("<html>", { status: HTTP_OK }));
    expect(await fetchForecastTake("KEY_1")).toEqual({ ok: false, error: "failed" });
  });

  const broken: [string, unknown][] = [
    ["null", null],
    ["an empty object", {}],
    ["a wrong notice type", { ...takeOf(), noticeType: "solicitation" }],
    ["another forecast's take", takeOf("OTHER")],
    ["no reads array", { ...takeOf(), reads: null }],
    ["a missing counted key", { ...takeOf(), counted: { ...takeOf().counted, subUse: undefined } }],
    [
      "an unknown fact state",
      { ...takeOf(), counted: { ...takeOf().counted, buyer: { state: "zero" } } },
    ],
    [
      "a counted fact with no basis",
      {
        ...takeOf(),
        counted: { ...takeOf().counted, buyer: { state: "counted", figure: 3 } },
      },
    ],
    [
      "an unknown member source state",
      { ...takeOf(), memberSources: { ...takeOf().memberSources, profile: "yes" } },
    ],
    ["a basis counted over 0 records", withFact({ basis: { ...BASIS, countedOver: 0 } })],
    ["a basis counted over -3 records", withFact({ basis: { ...BASIS, countedOver: -3 } })],
    ["an empty matchedOn", withFact({ basis: { ...BASIS, matchedOn: "" } })],
    ["a blank matchedOn", withFact({ basis: { ...BASIS, matchedOn: "   " } })],
    [
      "a source that is not a public record",
      withFact({ source: { label: "x", provenance: { type: "record", ref: "tally:x" } } }),
    ],
    [
      "a public source with no ref",
      withFact({ source: { label: "x", provenance: { type: "public" } } }),
    ],
  ];

  it.each(broken)("resolves a 200 with %s to the failed error", async (_name, body) => {
    mockFetch.mockResolvedValue(jsonResponse(body));
    expect(await fetchForecastTake("KEY_1")).toEqual({ ok: false, error: "failed" });
  });

  it("accepts a member source whose read succeeded with nothing on file", async () => {
    const take = takeOf();
    const empty = { ...take, memberSources: { ...take.memberSources, learnedFacts: "empty" } };
    mockFetch.mockResolvedValue(jsonResponse(empty));
    expect(await fetchForecastTake("KEY_1")).toEqual({ ok: true, take: empty });
  });

  it("drops a read that is not a read and keeps the rest of the take", async () => {
    const take = takeOf();
    mockFetch.mockResolvedValue(jsonResponse({ ...take, reads: [...take.reads, null, { id: 9 }] }));
    expect(await fetchForecastTake("KEY_1")).toEqual({ ok: true, take });
  });

  it("drops a read whose status is not a ReadStatus", async () => {
    const take = takeOf();
    const unknownStatus = { ...take.reads[0], id: 4, status: "done" };
    mockFetch.mockResolvedValue(jsonResponse({ ...take, reads: [...take.reads, unknownStatus] }));
    expect(await fetchForecastTake("KEY_1")).toEqual({ ok: true, take });
  });

  it("checks every counted key the wire declares", () => {
    expect(Object.keys(takeOf().counted).sort()).toEqual([...FORECAST_TAKE_COUNTED_KEYS].sort());
  });
});

describe("the session cache", () => {
  it("fetches a take at most once per forecast, concurrent calls included", async () => {
    mockFetch.mockImplementation(() => Promise.resolve(jsonResponse(takeOf())));

    const [a, b] = await Promise.all([fetchForecastTake("KEY_1"), fetchForecastTake("KEY_1")]);
    const c = await fetchForecastTake("KEY_1");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
    expect(c).toEqual(a);
  });

  it("keeps a failed fetch for the session too", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ message: "no" }, HTTP_UNAVAILABLE));
    await fetchForecastTake("KEY_1");
    mockFetch.mockResolvedValue(jsonResponse(takeOf()));

    expect(await fetchForecastTake("KEY_1")).toEqual({ ok: false, error: "failed" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("fetches each forecast on its own", async () => {
    mockFetch.mockImplementation((url: string) =>
      Promise.resolve(jsonResponse(takeOf(url.includes("KEY_2") ? "KEY_2" : "KEY_1"))),
    );
    const one = await fetchForecastTake("KEY_1");
    const two = await fetchForecastTake("KEY_2");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(one.ok && one.take.oppKey).toBe("KEY_1");
    expect(two.ok && two.take.oppKey).toBe("KEY_2");
  });

  it("fetches again after resetForecastTakeCache", async () => {
    mockFetch.mockImplementation(() => Promise.resolve(jsonResponse(takeOf())));
    await fetchForecastTake("KEY_1");
    resetForecastTakeCache();
    await fetchForecastTake("KEY_1");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

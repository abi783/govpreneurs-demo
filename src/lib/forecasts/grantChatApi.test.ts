// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL, setGhlToken } from "../api";
import type { ForecastRead, UnknownItem } from "./grant";
import {
  fetchForecastGrantSession,
  READ_SUMMARY_MAX,
  READ_UNKNOWN_MAX,
  READ_UNKNOWNS_MAX_ITEMS,
  sendForecastGrantMessage,
  toReadSummary,
  type ForecastGrantReadSummary,
} from "./grantChatApi";

const TOKEN = "test-ghl-token";
const HTTP_OK = 200;
const HTTP_BAD_GATEWAY = 502;
const HTTP_SERVER_ERROR = 500;
const HTTP_TOO_MANY = 429;

const mockFetch = vi.fn();

/** A page read with only the fields the summary reads set to real values. */
function readOf(over: Partial<ForecastRead> = {}): ForecastRead {
  return {
    depth: "derived",
    call: "prepare",
    confidence: "sure",
    paths: [{ key: "prime", state: "open", why: "fits" }],
    summary: "Price **alone** decided it.",
    strengths: [{ kind: "strength", title: "You can do the work" }],
    limits: [{ kind: "blocker", title: "No bond" }],
    unknowns: [{ label: "If the work changes", how: "notice" }],
    win: [],
    plan: [],
    prepare: "Get ready now",
    timeline: [],
    job: { summary: "Roof work", facts: [] },
    evidence: {},
    rail: { assumed: "You are small", questions: [], starters: [] },
    ...over,
  } as unknown as ForecastRead;
}

const summary: ForecastGrantReadSummary = { call: "review", summary: "s", unknowns: ["u"] };

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

describe("toReadSummary", () => {
  it("holds only the call, the summary without bold marks, and the unknown labels", () => {
    const out = toReadSummary(readOf());
    expect(out).toEqual({
      call: "prepare",
      summary: "Price alone decided it.",
      unknowns: ["If the work changes"],
    });
    expect(Object.keys(out).sort()).toEqual(["call", "summary", "unknowns"]);
  });

  it("cuts the summary, the number of unknowns and each unknown to the bounds", () => {
    const many: UnknownItem[] = Array.from({ length: READ_UNKNOWNS_MAX_ITEMS + 5 }, (_, i) => ({
      label: `${i}-${"x".repeat(READ_UNKNOWN_MAX + 40)}`,
      how: "notice" as UnknownItem["how"],
    }));
    const out = toReadSummary(
      readOf({ summary: `**${"a".repeat(READ_SUMMARY_MAX + 100)}**`, unknowns: many }),
    );
    expect(out.summary).toHaveLength(READ_SUMMARY_MAX);
    expect(out.summary).not.toContain("*");
    expect(out.unknowns).toHaveLength(READ_UNKNOWNS_MAX_ITEMS);
    expect(out.unknowns.every((u) => u.length === READ_UNKNOWN_MAX)).toBe(true);
    expect(out.unknowns[0].startsWith("0-")).toBe(true);
  });
});

describe("sendForecastGrantMessage", () => {
  it("posts { message, read } to the reply route with the session token", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ reply: "Get your bond first." }));

    const result = await sendForecastGrantMessage("KEY_1", "What first?", summary);

    expect(result).toEqual({ ok: true, reply: "Get your bond first." });
    const { url, init } = lastCall();
    expect(url).toBe(`${API_BASE_URL}/forecasts/KEY_1/grant/reply`);
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("X-GHL-Token")).toBe(TOKEN);
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual({ message: "What first?", read: summary });
  });

  it("URL-encodes the oppKey", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ reply: "ok" }));
    await sendForecastGrantMessage("a/b?c#d", "hi", summary);
    expect(lastCall().url).toBe(`${API_BASE_URL}/forecasts/a%2Fb%3Fc%23d/grant/reply`);
  });

  it("never sends a locationId in the body", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ reply: "ok" }));
    await sendForecastGrantMessage("KEY_1", "hi", summary);
    expect(lastCall().init.body as string).not.toContain("locationId");
  });

  it("resolves a 502 to the unavailable error", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ statusCode: 502, message: "Grant could not answer." }, HTTP_BAD_GATEWAY),
    );
    expect(await sendForecastGrantMessage("KEY_1", "hi", summary)).toEqual({
      ok: false,
      error: "unavailable",
    });
  });

  it.each([HTTP_SERVER_ERROR, HTTP_TOO_MANY])("resolves a %i to the failed error", async (s) => {
    mockFetch.mockResolvedValue(jsonResponse({ message: "no" }, s));
    expect(await sendForecastGrantMessage("KEY_1", "hi", summary)).toEqual({
      ok: false,
      error: "failed",
    });
  });

  it("resolves a network failure to the failed error, never a reply", async () => {
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await sendForecastGrantMessage("KEY_1", "hi", summary)).toEqual({
      ok: false,
      error: "failed",
    });
  });

  it.each([{}, { reply: "" }, { reply: 42 }, null])(
    "resolves a 200 without a usable reply (%j) to the failed error",
    async (body) => {
      mockFetch.mockResolvedValue(jsonResponse(body));
      expect(await sendForecastGrantMessage("KEY_1", "hi", summary)).toEqual({
        ok: false,
        error: "failed",
      });
    },
  );
});

describe("fetchForecastGrantSession", () => {
  const messages = [
    { role: "user", text: "hi", at: "2026-09-24T10:00:00.000Z" },
    { role: "grant", text: "hello", at: "2026-09-24T10:00:01.000Z" },
  ];

  it("gets the stored thread with the session token", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ messages }));
    expect(await fetchForecastGrantSession("KEY 1")).toEqual(messages);
    const { url, init } = lastCall();
    expect(url).toBe(`${API_BASE_URL}/forecasts/KEY%201/grant/session`);
    expect(new Headers(init.headers).get("X-GHL-Token")).toBe(TOKEN);
  });

  it("drops a stored message that is not a message", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ messages: [...messages, { role: "admin", text: "x", at: "" }, null] }),
    );
    expect(await fetchForecastGrantSession("KEY_1")).toEqual(messages);
  });

  it("resolves a failed read to null", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ message: "no" }, HTTP_SERVER_ERROR));
    expect(await fetchForecastGrantSession("KEY_1")).toBeNull();
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await fetchForecastGrantSession("KEY_1")).toBeNull();
    mockFetch.mockResolvedValue(jsonResponse({ nope: true }));
    expect(await fetchForecastGrantSession("KEY_1")).toBeNull();
  });
});

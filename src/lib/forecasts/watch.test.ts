// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL, setGhlToken } from "../api";
import { bus } from "../eventBus";
import {
  loadForecastWatch,
  markForecastSeen,
  refreshForecastWatch,
  resetForecastWatch,
  unseenFor,
  useForecastWatch,
  watchCopyState,
  type ForecastWatchEvent,
  type ForecastWatchForecast,
  type ForecastWatchNotice,
  type ForecastWatchRead,
  type ForecastWatchResponse,
} from "./watch";

const TOKEN = "test-ghl-token";
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_SERVER_ERROR = 500;
const HTTP_UNAVAILABLE = 503;
const WATCH_URL = `${API_BASE_URL}/forecast-watch`;

const mockFetch = vi.fn();

/** An event built from the wire interface. */
function eventOf(over: Partial<ForecastWatchEvent> = {}): ForecastWatchEvent {
  return {
    id: "ev1",
    kind: "date_moved",
    field: "expectedOn",
    before: "2026-10-01",
    after: "2027-01-01",
    decided: null,
    notice: null,
    observedAt: "2026-09-27T12:19:00.000Z",
    seenAt: null,
    ...over,
  };
}

function forecastOf(over: Partial<ForecastWatchForecast> = {}): ForecastWatchForecast {
  return {
    oppKey: "FC_1",
    startedAt: "2026-09-20T10:00:00.000Z",
    unseen: 1,
    events: [eventOf()],
    ...over,
  };
}

function responseOf(over: Partial<ForecastWatchResponse> = {}): ForecastWatchResponse {
  return { watching: true, notify: false, forecasts: [forecastOf()], ...over };
}

/** A notice event built from the wire interface. */
function noticeEventOf(
  kind: "bid_request_posted" | "republished" | "notice_suggested",
  notice: Partial<ForecastWatchNotice>,
): ForecastWatchEvent {
  return eventOf({
    id: `ev-${kind}`,
    kind,
    field: null,
    before: null,
    after: null,
    notice: {
      oppKey: "OPP_9",
      target: "opportunity",
      title: "Roof repair",
      agencyName: "Naval Facilities",
      noticeType: "Solicitation",
      postedOn: "2026-09-25",
      held: true,
      basis: { kind: "named", number: "N3220526R6009" },
      ...notice,
    },
  });
}

const POSTED_EVENT = noticeEventOf("bid_request_posted", {});
const REPUBLISHED_EVENT = noticeEventOf("republished", {
  oppKey: "FC_2",
  target: "forecast",
  noticeType: "Forecast",
  held: false,
  basis: { kind: "same_plan", sourceId: "36C10B26AP0015" },
});
const SUGGESTED_EVENT = noticeEventOf("notice_suggested", {
  basis: {
    kind: "suggested",
    office: "within",
    officeName: "Navy",
    overlap: "some",
    naicsGroupSame: null,
  },
});

/** POSTED_EVENT with its notice changed by `over`. */
function withNotice(over: Record<string, unknown>): Record<string, unknown> {
  return { ...POSTED_EVENT, notice: { ...POSTED_EVENT.notice, ...over } };
}

function jsonResponse(body: unknown, status = HTTP_OK): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function calls(): Array<{ url: string; init: RequestInit | undefined }> {
  return mockFetch.mock.calls.map(([url, init]) => ({
    url: url as string,
    init: init as RequestInit | undefined,
  }));
}

function getCalls(): number {
  return calls().filter((c) => (c.init?.method ?? "GET") === "GET").length;
}

/** Answers every GET with `body` and every POST with `{ marked }`. */
function serve(body: unknown, marked = 1): void {
  mockFetch.mockImplementation((_url: string, init?: RequestInit) =>
    Promise.resolve(
      (init?.method ?? "GET") === "POST" ? jsonResponse({ marked }) : jsonResponse(body),
    ),
  );
}

beforeEach(() => {
  globalThis.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockReset();
  window.sessionStorage.clear();
  setGhlToken(TOKEN);
  resetForecastWatch();
});

afterEach(() => {
  window.sessionStorage.clear();
  resetForecastWatch();
});

describe("loadForecastWatch", () => {
  it("gets /forecast-watch through apiFetch with the session token", async () => {
    const body = responseOf();
    serve(body);

    expect(await loadForecastWatch()).toEqual({ status: "ready", data: body });
    const [{ url, init }] = calls();
    expect(url).toBe(WATCH_URL);
    expect(init?.method ?? "GET").toBe("GET");
    expect(new Headers(init?.headers).get("X-GHL-Token")).toBe(TOKEN);
  });

  it("never sends a locationId in the path", async () => {
    serve(responseOf());
    await loadForecastWatch();
    expect(calls()[0].url.split("?")[0]).not.toContain("locationId");
  });

  it("keeps each notice kind with its notice and basis", async () => {
    const events = [POSTED_EVENT, REPUBLISHED_EVENT, SUGGESTED_EVENT];
    const body = responseOf({ forecasts: [forecastOf({ events })] });
    serve(body);
    expect(await loadForecastWatch()).toEqual({ status: "ready", data: body });
  });

  it("reads an absent notice as null, and keeps no candidate the older server sends", async () => {
    const { notice: _drop, ...older } = eventOf();
    serve(
      responseOf({ forecasts: [forecastOf({ events: [{ ...older, candidate: null } as never] })] }),
    );
    const read = await loadForecastWatch();
    expect(read).toEqual({ status: "ready", data: responseOf() });
  });

  it("keeps no similarity, and no other field the notice does not declare", async () => {
    const leaky = {
      ...SUGGESTED_EVENT,
      notice: {
        ...SUGGESTED_EVENT.notice,
        similarity: 0.42,
        url: "https://example.gov/x",
        basis: { ...SUGGESTED_EVENT.notice!.basis, similarity: 0.42 },
      },
    };
    serve(responseOf({ forecasts: [forecastOf({ events: [leaky as never] })] }));
    const read = await loadForecastWatch();
    const body = responseOf({ forecasts: [forecastOf({ events: [SUGGESTED_EVENT] })] });
    expect(read).toEqual({ status: "ready", data: body });
    expect(JSON.stringify(read)).not.toMatch(/similarity|0\.42|example\.gov/);
  });

  it.each([
    ["an unknown kind", { id: "ev-x", kind: "closed" }],
    [
      "the retired kind",
      { id: "ev-x", kind: "may_have_posted", field: null, candidate: { oppKey: "OPP_1" } },
    ],
  ])("skips an event of %s, and keeps the forecast and its other events", async (_n, over) => {
    const unknown = { ...eventOf(), ...over };
    serve(responseOf({ forecasts: [forecastOf({ events: [unknown as never, eventOf()] })] }));
    const read = await loadForecastWatch();
    expect(read).toEqual({ status: "ready", data: responseOf() });
  });

  it("fetches once per session, and concurrent callers share one request", async () => {
    serve(responseOf());
    const [a, b] = await Promise.all([loadForecastWatch(), loadForecastWatch()]);
    await loadForecastWatch();
    expect(a).toEqual(b);
    expect(getCalls()).toBe(1);
  });

  it.each([
    ["a 500", () => jsonResponse({ message: "no" }, HTTP_SERVER_ERROR)],
    ["a 503", () => jsonResponse({ message: "no" }, HTTP_UNAVAILABLE)],
    ["a 401", () => jsonResponse({ message: "no" }, HTTP_UNAUTHORIZED)],
    ["a 400", () => jsonResponse({ message: "no" }, HTTP_BAD_REQUEST)],
    [
      "a body that is not JSON",
      () => new Response("<html>", { status: HTTP_OK, headers: { "Content-Type": "text/html" } }),
    ],
  ])("resolves %s to an error, never to an empty ready read", async (_name, response) => {
    mockFetch.mockImplementation(() => Promise.resolve(response()));
    const read = await loadForecastWatch();
    expect(read).toEqual({ status: "error" });
    expect(watchCopyState(read)).toBe("off");
  });

  it("resolves a network failure to an error", async () => {
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await loadForecastWatch()).toEqual({ status: "error" });
  });

  it.each([
    ["null", null],
    ["an array", []],
    ["no forecasts list", { watching: true, notify: false }],
    ["a forecasts value that is not a list", { watching: true, notify: false, forecasts: {} }],
  ])("resolves a body with %s to an error, even when it says watching", async (_name, body) => {
    serve(body);
    expect(await loadForecastWatch()).toEqual({ status: "error" });
  });

  it.each([
    ["absent", {}],
    ["a string", { watching: "true" }],
    ["a number", { watching: 1 }],
  ])("reads a watching status that is %s as off", async (_name, over) => {
    const { watching: _drop, ...rest } = responseOf();
    serve({ ...rest, ...over });
    const read = await loadForecastWatch();
    expect(read.status).toBe("ready");
    expect(read.status === "ready" && read.data.watching).toBe(false);
    expect(watchCopyState(read)).toBe("off");
  });

  it("reads an absent or non-boolean notify as false", async () => {
    const { notify: _drop, ...rest } = responseOf();
    serve({ ...rest, notify: "yes" });
    const read = await loadForecastWatch();
    expect(read.status === "ready" && read.data.notify).toBe(false);
    expect(watchCopyState(read)).toBe("inApp");
  });

  it.each([
    ["a kind that is not a string", { kind: 5 }],
    ["an unknown field", { field: "dueDate" }],
    ["a before that is an object", { before: { a: 1 } }],
    ["an after that is a boolean", { after: true }],
    ["a decided that is a string", { decided: "yes" }],
    ["no observed date", { observedAt: null }],
    ["a seen date that is a number", { seenAt: 5 }],
    ["no id", { id: undefined }],
    ["a notice on a field change", { notice: POSTED_EVENT.notice }],
    ["a value naming the aggregator", { after: "see highergov.com" }],
  ])("drops a forecast whose event has %s, and keeps the others", async (_name, over) => {
    const bad = forecastOf({ oppKey: "BAD", events: [{ ...eventOf(), ...over } as never] });
    serve(responseOf({ forecasts: [bad, forecastOf()] }));
    const read = await loadForecastWatch();
    expect(read.status === "ready" && read.data.forecasts.map((f) => f.oppKey)).toEqual(["FC_1"]);
  });

  it.each<[string, Record<string, unknown>]>([
    ["no notice", { ...POSTED_EVENT, notice: null }],
    ["an absent notice", { ...POSTED_EVENT, notice: undefined }],
    ["a notice that is not an object", { ...POSTED_EVENT, notice: "OPP_9" }],
    ["a basis for another kind", { ...REPUBLISHED_EVENT, notice: POSTED_EVENT.notice }],
    ["a notice with no key", withNotice({ oppKey: "" })],
    ["an unknown target", withNotice({ target: "award" })],
    ["a held flag that is not a boolean", withNotice({ held: "yes" })],
    ["no held flag", withNotice({ held: undefined })],
    ["a title that is a number", withNotice({ title: 7 })],
    ["a notice type that is an object", withNotice({ noticeType: { description: "x" } })],
    ["a posted date that is a number", withNotice({ postedOn: 20260925 })],
    ["a title naming the aggregator", withNotice({ title: "HigherGov roof" })],
    ["an office naming the aggregator", withNotice({ agencyName: "HigherGov Services" })],
    ["a notice type naming the aggregator", withNotice({ noticeType: "highergov.com" })],
    ["a key naming the aggregator", withNotice({ oppKey: "highergov-1" })],
    ["no basis", withNotice({ basis: null })],
    ["an unknown basis kind", withNotice({ basis: { kind: "guessed" } })],
    ["a named basis with no number", withNotice({ basis: { kind: "named", number: "" } })],
    [
      "a number naming the aggregator",
      withNotice({ basis: { kind: "named", number: "highergov" } }),
    ],
    [
      "a plan number naming the aggregator",
      {
        ...REPUBLISHED_EVENT,
        notice: {
          ...REPUBLISHED_EVENT.notice,
          basis: { kind: "same_plan", sourceId: "HigherGov" },
        },
      },
    ],
    [
      "a plan basis with no number",
      {
        ...REPUBLISHED_EVENT,
        notice: { ...REPUBLISHED_EVENT.notice, basis: { kind: "same_plan", sourceId: 5 } },
      },
    ],
  ])("drops a forecast whose notice event has %s", async (_name, bad) => {
    serve(responseOf({ forecasts: [forecastOf({ oppKey: "BAD", events: [bad as never] })] }));
    const read = await loadForecastWatch();
    expect(read).toEqual({ status: "ready", data: responseOf({ forecasts: [] }) });
  });

  it.each<[string, Record<string, unknown>]>([
    ["an unknown office relation", { office: "near" }],
    ["an unknown overlap band", { overlap: "high" }],
    ["an overlap that is a number", { overlap: 0.42 }],
    ["an office name that is a number", { officeName: 3 }],
    ["an office name naming the aggregator", { officeName: "HigherGov" }],
    ["a NAICS flag that is a string", { naicsGroupSame: "yes" }],
    ["no NAICS flag", { naicsGroupSame: undefined }],
  ])("drops a forecast whose suggestion basis has %s", async (_name, over) => {
    const notice = SUGGESTED_EVENT.notice!;
    const bad = { ...SUGGESTED_EVENT, notice: { ...notice, basis: { ...notice.basis, ...over } } };
    serve(responseOf({ forecasts: [forecastOf({ events: [bad as never] })] }));
    const read = await loadForecastWatch();
    expect(read).toEqual({ status: "ready", data: responseOf({ forecasts: [] }) });
  });

  it.each([
    ["no key", { oppKey: "" }],
    ["no start date", { startedAt: 7 }],
    ["a negative unseen count", { unseen: -1 }],
    ["a fractional unseen count", { unseen: 1.5 }],
    ["events that are not a list", { events: {} }],
  ])("drops a forecast with %s", async (_name, over) => {
    serve(responseOf({ forecasts: [{ ...forecastOf(), ...over } as never] }));
    const read = await loadForecastWatch();
    expect(read.status === "ready" && read.data.forecasts).toEqual([]);
  });
});

describe("refreshForecastWatch", () => {
  it("reads again, and publishes the new read on the forecastWatch slice", async () => {
    serve(responseOf({ forecasts: [] }));
    await loadForecastWatch();
    const heard = vi.fn();
    const off = bus.subscribe("forecastWatch", heard);

    serve(responseOf());
    const read = await refreshForecastWatch();
    off();
    expect(getCalls()).toBe(2);
    expect(unseenFor(read, "FC_1")).toBe(1);
    expect(heard).toHaveBeenCalled();
  });

  it("turns a failed read into a ready one", async () => {
    mockFetch.mockResolvedValue(jsonResponse({}, HTTP_SERVER_ERROR));
    expect(await loadForecastWatch()).toEqual({ status: "error" });
    expect(await loadForecastWatch()).toEqual({ status: "error" });
    expect(getCalls()).toBe(1);

    serve(responseOf());
    expect((await refreshForecastWatch()).status).toBe("ready");
  });

  it("reads a failed refresh as an error, never as the older list or an empty one", async () => {
    serve(responseOf());
    await loadForecastWatch();
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await refreshForecastWatch()).toEqual({ status: "error" });
    expect(await loadForecastWatch()).toEqual({ status: "error" });
  });

  it("lets the newest read win when an older one answers last", async () => {
    let answerFirst: (r: Response) => void = () => undefined;
    mockFetch.mockImplementationOnce(
      () => new Promise<Response>((resolve) => (answerFirst = resolve)),
    );
    const first = loadForecastWatch();
    serve(responseOf());
    const second = await refreshForecastWatch();
    answerFirst(jsonResponse(responseOf({ forecasts: [] })));
    await first;
    expect(await loadForecastWatch()).toEqual(second);
    expect(unseenFor(second, "FC_1")).toBe(1);
  });
});

describe("markForecastSeen", () => {
  it("POSTs the URL-encoded key with no body, then refreshes", async () => {
    serve(responseOf());
    await loadForecastWatch();

    expect(await markForecastSeen("a/b?c#d")).toBe(true);
    const post = calls().find((c) => c.init?.method === "POST");
    expect(post?.url).toBe(`${WATCH_URL}/a%2Fb%3Fc%23d/seen`);
    expect(post?.init?.body).toBeUndefined();
    expect(new Headers(post?.init?.headers).get("X-GHL-Token")).toBe(TOKEN);
    expect(getCalls()).toBe(2);
  });

  it.each([
    ["a 500", () => Promise.resolve(jsonResponse({}, HTTP_SERVER_ERROR))],
    ["a network failure", () => Promise.reject(new TypeError("Failed to fetch"))],
  ])("resolves false on %s and does not refresh", async (_name, post) => {
    serve(responseOf());
    await loadForecastWatch();
    mockFetch.mockImplementation((_url: string, init?: RequestInit) =>
      init?.method === "POST" ? post() : Promise.resolve(jsonResponse(responseOf())),
    );
    expect(await markForecastSeen("FC_1")).toBe(false);
    expect(getCalls()).toBe(1);
  });
});

describe("useForecastWatch", () => {
  it("starts the one load on first mount and re-renders with the read", async () => {
    serve(responseOf());
    const { result } = renderHook(() => useForecastWatch());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    renderHook(() => useForecastWatch());
    expect(getCalls()).toBe(1);

    serve(responseOf({ forecasts: [forecastOf({ unseen: 3 })] }));
    await act(async () => {
      await refreshForecastWatch();
    });
    expect(unseenFor(result.current, "FC_1")).toBe(3);
  });

  it("shows a failed read as an error, with nothing unseen", async () => {
    mockFetch.mockResolvedValue(jsonResponse({}, HTTP_SERVER_ERROR));
    const { result } = renderHook(() => useForecastWatch());
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(unseenFor(result.current, "FC_1")).toBe(0);
    expect(watchCopyState(result.current)).toBe("off");
  });
});

describe("watchCopyState and unseenFor", () => {
  const ready = (over: Partial<ForecastWatchResponse>): ForecastWatchRead => ({
    status: "ready",
    data: responseOf(over),
  });

  it.each<[string, ForecastWatchRead, string]>([
    ["idle", { status: "idle" }, "off"],
    ["loading", { status: "loading" }, "off"],
    ["error", { status: "error" }, "off"],
    ["ready, watching off", ready({ watching: false, notify: true }), "off"],
    ["ready, in-app", ready({ watching: true, notify: false }), "inApp"],
    ["ready, email", ready({ watching: true, notify: true }), "email"],
  ])("reads %s as %s", (_name, read, state) => {
    expect(watchCopyState(read)).toBe(state);
  });

  it("counts unseen changes for one key, and zero for another", () => {
    const read = ready({ forecasts: [forecastOf({ unseen: 2 })] });
    expect(unseenFor(read, "FC_1")).toBe(2);
    expect(unseenFor(read, "OTHER")).toBe(0);
  });
});

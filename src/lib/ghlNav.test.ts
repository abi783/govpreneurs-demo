import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import {
  buildNavIntent,
  readFreshIntent,
  requestCrossPageNav,
  consumePendingNavIntent,
  isEmbeddedInGhl,
  pageKeyForRoute,
  NAV_INTENT_KEY,
  NAV_INTENT_TTL_MS,
  readFreshReviewDeepLink,
  consumeReviewDeepLink,
  REVIEW_DEEPLINK_KEY,
  REVIEW_DEEPLINK_TTL_MS,
  mentorsPageUrl,
  openMentorsPage,
  buildOppDeepLink,
  readFreshOppDeepLink,
  storeOppDeepLink,
  consumeOppDeepLink,
  oppDeepLinkRoute,
  redirectTargetParam,
  OPP_DEEPLINK_KEY,
  relayWhenEmbedded,
  relayCrossPageNav,
  crossPageClick,
  currentAppPath,
} from "./ghlNav";

describe("cross-page relay helpers", () => {
  let postMessage: Mock;

  /** Stub the window as embedded (a parent frame) or standalone, at `pathname`. */
  function stubWindow(embedded: boolean, pathname = "/") {
    postMessage = vi.fn();
    const w: Record<string, unknown> = {
      localStorage: makeFakeStorage(),
      location: { pathname },
    };
    w.parent = embedded ? { postMessage } : w;
    vi.stubGlobal("window", w);
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function posted(): [string, string][] {
    return postMessage.mock.calls.map(([msg]) => [msg.payload.page, msg.payload.route]);
  }

  it("relayWhenEmbedded relays to the named page and cancels the click when embedded", () => {
    stubWindow(true);
    const e = { preventDefault: vi.fn() };
    relayWhenEmbedded("forecasts", "/forecasts/fc-1")(e);
    expect(e.preventDefault).toHaveBeenCalled();
    expect(posted()).toEqual([["forecasts", "/forecasts/fc-1"]]);
  });

  it("relayWhenEmbedded does nothing when standalone", () => {
    stubWindow(false);
    const e = { preventDefault: vi.fn() };
    relayWhenEmbedded("forecasts", "/forecasts/fc-1")(e);
    expect(e.preventDefault).not.toHaveBeenCalled();
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("relayCrossPageNav relays a route on another GHL page", () => {
    stubWindow(true);
    expect(relayCrossPageNav("/forecasts/fc-1", "/")).toBe(true);
    expect(posted()).toEqual([["forecasts", "/forecasts/fc-1"]]);
  });

  it("relayCrossPageNav stays in-app for a route on the current page", () => {
    stubWindow(true);
    expect(relayCrossPageNav("/forecasts/fc-1", "/forecasts")).toBe(false);
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("relayCrossPageNav treats the app root as the Opportunities page", () => {
    stubWindow(true);
    expect(relayCrossPageNav("/opportunities/sam-1", "/")).toBe(false);
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("relayCrossPageNav stays in-app for a route with no page key", () => {
    stubWindow(true);
    expect(relayCrossPageNav("/business-profile", "/forecasts")).toBe(false);
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("relayCrossPageNav stays in-app when standalone", () => {
    stubWindow(false);
    expect(relayCrossPageNav("/forecasts/fc-1", "/")).toBe(false);
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("relayCrossPageNav reads the current page from the window when no path is given", () => {
    stubWindow(true, "/forecasts/fc-1");
    expect(relayCrossPageNav("/forecasts/fc-2")).toBe(false);
    expect(relayCrossPageNav("/mentors/rev-1")).toBe(true);
    expect(posted()).toEqual([["mentors", "/mentors/rev-1"]]);
  });

  it("crossPageClick cancels the click only when it relays", () => {
    stubWindow(true);
    const relayed = { preventDefault: vi.fn() };
    crossPageClick("/forecasts/fc-1", "/")(relayed);
    expect(relayed.preventDefault).toHaveBeenCalled();

    const inApp = { preventDefault: vi.fn() };
    crossPageClick("/forecasts/fc-1", "/forecasts")(inApp);
    expect(inApp.preventDefault).not.toHaveBeenCalled();
    expect(posted()).toEqual([["forecasts", "/forecasts/fc-1"]]);
  });

  it("currentAppPath returns the window path when the basepath is the root", () => {
    stubWindow(false, "/forecasts/fc-1");
    expect(currentAppPath()).toBe("/forecasts/fc-1");
  });
});

describe("buildNavIntent", () => {
  it("stamps v:1 with the given page, route, and ts", () => {
    expect(buildNavIntent("opportunities", "/opportunities/1", 42)).toEqual({
      v: 1,
      page: "opportunities",
      route: "/opportunities/1",
      ts: 42,
    });
  });
});

describe("readFreshIntent", () => {
  const raw = JSON.stringify({
    v: 1,
    page: "opportunities",
    route: "/opportunities/1",
    ts: 100,
  });

  it("returns the intent when strictly within the TTL", () => {
    expect(readFreshIntent(raw, 100 + NAV_INTENT_TTL_MS - 1)).toMatchObject({
      route: "/opportunities/1",
    });
  });

  it("returns null exactly at and after the TTL boundary", () => {
    expect(readFreshIntent(raw, 100 + NAV_INTENT_TTL_MS)).toBeNull();
    expect(readFreshIntent(raw, 100 + NAV_INTENT_TTL_MS + 5000)).toBeNull();
  });

  it("returns null for null input or invalid JSON", () => {
    expect(readFreshIntent(null, 0)).toBeNull();
    expect(readFreshIntent("{ not json", 0)).toBeNull();
  });

  it("returns null for wrong version or malformed shape", () => {
    expect(readFreshIntent(JSON.stringify({ v: 2, page: "x", route: "/a", ts: 0 }), 0)).toBeNull();
    expect(readFreshIntent(JSON.stringify({ v: 1, page: "", route: "/a", ts: 0 }), 0)).toBeNull();
    expect(
      readFreshIntent(JSON.stringify({ v: 1, page: "x", route: "noslash", ts: 0 }), 0),
    ).toBeNull();
    expect(
      readFreshIntent(JSON.stringify({ v: 1, page: "x", route: "//evil.com", ts: 0 }), 0),
    ).toBeNull();
    expect(
      readFreshIntent(JSON.stringify({ v: 1, page: "x", route: "/a", ts: "0" }), 0),
    ).toBeNull();
  });
});

describe("isEmbeddedInGhl", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns false when not framed (parent === window)", () => {
    const w: Record<string, unknown> = {};
    w.parent = w;
    vi.stubGlobal("window", w);
    expect(isEmbeddedInGhl()).toBe(false);
  });

  it("returns true when framed (parent !== window)", () => {
    vi.stubGlobal("window", { parent: {} });
    expect(isEmbeddedInGhl()).toBe(true);
  });
});

function makeFakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, val: string) => void map.set(k, val),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe("requestCrossPageNav", () => {
  let storage: ReturnType<typeof makeFakeStorage>;
  let postMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    storage = makeFakeStorage();
    postMessage = vi.fn();
    vi.stubGlobal("window", { localStorage: storage, parent: { postMessage } });
    vi.spyOn(Date, "now").mockReturnValue(1_000_000);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("writes a v1 intent to localStorage and posts it to the parent with '*'", () => {
    requestCrossPageNav("opportunities", "/opportunities/123");
    const expected = {
      v: 1,
      page: "opportunities",
      route: "/opportunities/123",
      ts: 1_000_000,
    };
    expect(JSON.parse(storage.getItem(NAV_INTENT_KEY) as string)).toEqual(expected);
    expect(postMessage).toHaveBeenCalledWith(
      { message: "REQUEST_NAVIGATION", payload: expected },
      "*",
    );
  });
});

describe("openMentorsPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("builds the Mentors custom-menu-link URL for a location", () => {
    expect(mentorsPageUrl("loc 1")).toBe(
      "https://app.govpreneurs.com/v2/location/loc%201/custom-menu-link/16ced954-8fdc-4f9a-91eb-97d3b9c6922b",
    );
  });

  it("asks the GoHighLevel parent to switch to the Mentors page when embedded", () => {
    const postMessage = vi.fn();
    const assign = vi.fn();
    vi.stubGlobal("window", {
      localStorage: makeFakeStorage(),
      parent: { postMessage },
      location: { assign },
    });
    const fallback = vi.fn();

    openMentorsPage("loc-1", fallback);

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "REQUEST_NAVIGATION",
        payload: expect.objectContaining({ page: "mentors", route: "/mentors" }),
      }),
      "*",
    );
    expect(assign).not.toHaveBeenCalled();
    expect(fallback).not.toHaveBeenCalled();
  });

  it("goes to the Mentors menu-link URL when standalone", () => {
    const assign = vi.fn();
    const w: Record<string, unknown> = { location: { assign } };
    w.parent = w;
    vi.stubGlobal("window", w);
    const fallback = vi.fn();

    openMentorsPage("loc-1", fallback);

    expect(assign).toHaveBeenCalledWith(mentorsPageUrl("loc-1"));
    expect(fallback).not.toHaveBeenCalled();
  });

  it("uses the in-app fallback with no location id and no parent", () => {
    const w: Record<string, unknown> = { location: { assign: vi.fn() } };
    w.parent = w;
    vi.stubGlobal("window", w);
    const fallback = vi.fn();

    openMentorsPage(null, fallback);

    expect(fallback).toHaveBeenCalled();
  });
});

describe("consumePendingNavIntent", () => {
  let storage: ReturnType<typeof makeFakeStorage>;
  let navigate: Mock<(route: string) => void>;

  beforeEach(() => {
    storage = makeFakeStorage();
    navigate = vi.fn();
    vi.stubGlobal("window", { localStorage: storage, parent: { postMessage: vi.fn() } });
    vi.spyOn(Date, "now").mockReturnValue(1_000_000);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("navigates to a fresh intent's route and clears the slot", () => {
    storage.setItem(
      NAV_INTENT_KEY,
      JSON.stringify({
        v: 1,
        page: "opportunities",
        route: "/opportunities/9",
        ts: 1_000_000 - 5_000,
      }),
    );
    consumePendingNavIntent(navigate);
    expect(navigate).toHaveBeenCalledWith("/opportunities/9");
    expect(storage.getItem(NAV_INTENT_KEY)).toBeNull();
  });

  it("ignores and clears a stale intent", () => {
    storage.setItem(
      NAV_INTENT_KEY,
      JSON.stringify({
        v: 1,
        page: "opportunities",
        route: "/opportunities/9",
        ts: 1_000_000 - NAV_INTENT_TTL_MS,
      }),
    );
    consumePendingNavIntent(navigate);
    expect(navigate).not.toHaveBeenCalled();
    expect(storage.getItem(NAV_INTENT_KEY)).toBeNull();
  });

  it("no-ops when there is no intent", () => {
    consumePendingNavIntent(navigate);
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe("pageKeyForRoute", () => {
  it("maps each of the four page-key routes", () => {
    expect(pageKeyForRoute("/opportunities")).toBe("opportunities");
    expect(pageKeyForRoute("/mentors")).toBe("mentors");
    expect(pageKeyForRoute("/partners")).toBe("partners");
    expect(pageKeyForRoute("/awards")).toBe("awards");
  });

  it("matches on the leading segment for nested paths", () => {
    expect(pageKeyForRoute("/awards/123")).toBe("awards");
    expect(pageKeyForRoute("/opportunities/abc-123")).toBe("opportunities");
  });

  it("matches with a query string present", () => {
    expect(pageKeyForRoute("/partners?view=find")).toBe("partners");
    expect(pageKeyForRoute("/awards?q=x&from=%2Fhome")).toBe("awards");
  });

  it("maps the small-orders page key", () => {
    expect(pageKeyForRoute("/small-orders")).toBe("small-orders");
    expect(pageKeyForRoute("/small-orders/abc-123")).toBe("small-orders");
  });

  it("maps the forecasts page key", () => {
    expect(pageKeyForRoute("/forecasts")).toBe("forecasts");
    expect(pageKeyForRoute("/forecasts/abc?x=1")).toBe("forecasts");
  });

  it("returns null for routes outside the page keys", () => {
    expect(pageKeyForRoute("/home")).toBeNull();
    expect(pageKeyForRoute("/pipeline")).toBeNull();
    expect(pageKeyForRoute("/")).toBeNull();
  });

  it("returns null for leading-slash and empty-string edge cases", () => {
    expect(pageKeyForRoute("")).toBeNull();
    expect(pageKeyForRoute("//")).toBeNull();
    expect(pageKeyForRoute("awards")).toBe("awards");
  });
});

describe("readFreshReviewDeepLink", () => {
  const raw = JSON.stringify({ v: 1, reviewId: "rev_42", ts: 100 });

  it("returns the link strictly within the TTL, null at/after the boundary", () => {
    expect(readFreshReviewDeepLink(raw, 100 + REVIEW_DEEPLINK_TTL_MS - 1)).toMatchObject({
      reviewId: "rev_42",
    });
    expect(readFreshReviewDeepLink(raw, 100 + REVIEW_DEEPLINK_TTL_MS)).toBeNull();
  });

  it("returns null for absent, malformed, wrong-version, or empty-id input", () => {
    expect(readFreshReviewDeepLink(null, 0)).toBeNull();
    expect(readFreshReviewDeepLink("{ not json", 0)).toBeNull();
    expect(readFreshReviewDeepLink(JSON.stringify({ v: 2, reviewId: "r", ts: 0 }), 0)).toBeNull();
    expect(readFreshReviewDeepLink(JSON.stringify({ v: 1, reviewId: "", ts: 0 }), 0)).toBeNull();
  });
});

describe("consumeReviewDeepLink", () => {
  let storage: ReturnType<typeof makeFakeStorage>;
  let navigate: Mock<(reviewId: string) => void>;

  beforeEach(() => {
    storage = makeFakeStorage();
    navigate = vi.fn();
    vi.stubGlobal("window", { localStorage: storage });
    vi.spyOn(Date, "now").mockReturnValue(1_000_000);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("navigates to a fresh reviewId and clears the slot", () => {
    storage.setItem(
      REVIEW_DEEPLINK_KEY,
      JSON.stringify({ v: 1, reviewId: "rev_9", ts: 1_000_000 - 5_000 }),
    );
    consumeReviewDeepLink(navigate);
    expect(navigate).toHaveBeenCalledWith("rev_9");
    expect(storage.getItem(REVIEW_DEEPLINK_KEY)).toBeNull();
  });

  it("ignores and clears a stale link", () => {
    storage.setItem(
      REVIEW_DEEPLINK_KEY,
      JSON.stringify({ v: 1, reviewId: "rev_9", ts: 1_000_000 - REVIEW_DEEPLINK_TTL_MS }),
    );
    consumeReviewDeepLink(navigate);
    expect(navigate).not.toHaveBeenCalled();
    expect(storage.getItem(REVIEW_DEEPLINK_KEY)).toBeNull();
  });
});

describe("opportunity deep-link kinds", () => {
  let storage: ReturnType<typeof makeFakeStorage>;
  let navigate: Mock<(id: string, kind: string) => void>;

  beforeEach(() => {
    storage = makeFakeStorage();
    navigate = vi.fn();
    vi.stubGlobal("window", { localStorage: storage });
    vi.spyOn(Date, "now").mockReturnValue(1_000_000);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("builds an opportunity link with no kind, exactly as before", () => {
    expect(buildOppDeepLink("opp-1", 5)).toEqual({ v: 1, opportunityId: "opp-1", ts: 5 });
  });

  it("builds a small-order link with kind small-order", () => {
    expect(buildOppDeepLink("ord-1", 5, "small-order")).toEqual({
      v: 1,
      opportunityId: "ord-1",
      ts: 5,
      kind: "small-order",
    });
  });

  it("rejects a stored link with an unknown kind", () => {
    const raw = JSON.stringify({ v: 1, opportunityId: "x", ts: 0, kind: "award" });
    expect(readFreshOppDeepLink(raw, 0)).toBeNull();
  });

  it("stores a small-order link and consumes it as a small order", () => {
    storeOppDeepLink("ord-1", "small-order");
    consumeOppDeepLink(navigate);
    expect(navigate).toHaveBeenCalledWith("ord-1", "small-order");
    expect(storage.getItem(OPP_DEEPLINK_KEY)).toBeNull();
  });

  it("stores an opportunity link and consumes it as an opportunity", () => {
    storeOppDeepLink("opp-1");
    expect(JSON.parse(storage.getItem(OPP_DEEPLINK_KEY)!)).not.toHaveProperty("kind");
    consumeOppDeepLink(navigate);
    expect(navigate).toHaveBeenCalledWith("opp-1", "opportunity");
  });

  it("consumes an old stored link with no kind as an opportunity", () => {
    storage.setItem(
      OPP_DEEPLINK_KEY,
      JSON.stringify({ v: 1, opportunityId: "opp-old", ts: 1_000_000 - 5_000 }),
    );
    consumeOppDeepLink(navigate);
    expect(navigate).toHaveBeenCalledWith("opp-old", "opportunity");
  });
});

describe("oppDeepLinkRoute", () => {
  it("opens a small order on the small-order page", () => {
    expect(oppDeepLinkRoute("ord-1", "small-order")).toEqual({
      to: "/small-orders/$orderId",
      params: { orderId: "ord-1" },
    });
  });

  it("opens an opportunity on the opportunity page", () => {
    expect(oppDeepLinkRoute("opp-1", "opportunity")).toEqual({
      to: "/opportunities/$noticeId",
      params: { noticeId: "opp-1" },
    });
  });
});

describe("redirectTargetParam", () => {
  it("sends no target for an opportunity, as before", () => {
    expect(redirectTargetParam({})).toBe("");
  });

  it("asks for the small-orders menu link for a small order", () => {
    expect(redirectTargetParam({ kind: "small-order" })).toBe("&target=small-orders");
  });

  it("asks for the mentors menu link for a mentor link", () => {
    expect(redirectTargetParam({ ticketId: "175" })).toBe("&target=mentors");
    expect(redirectTargetParam({ reviewId: "r1" })).toBe("&target=mentors");
  });
});

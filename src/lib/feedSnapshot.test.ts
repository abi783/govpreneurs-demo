// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  FEED_SNAPSHOT_MAX_AGE_MS,
  clearFeedSnapshot,
  feedSnapshotKey,
  readFeedSnapshot,
  saveFeedSnapshot,
  OPP_KEY_ATTR,
  topmostVisibleAnchor,
  applyFeedScroll,
  createRestoreGate,
  type FeedAnchor,
  type FeedSnapshot,
} from "./feedSnapshot";
import type { CardOpportunity } from "./mock/opportunities";

const KEY_PARTS = {
  locationId: "loc-1",
  tab: "open",
  filters: { states: ["VA"] },
  sort: { field: "match" },
  search: "roofing",
  preview: false,
};

const cards = [{ id: "opp-1" }] as unknown as CardOpportunity[];

function save(key: string, at: number, scrollY = 1200) {
  saveFeedSnapshot(
    {
      key,
      cards,
      currentPage: 3,
      totalPages: 9,
      totalOpps: 430,
      takes: new Map([["opp-1", "Worth a look — you have done three of these."]]),
      requestedTakes: new Set(["opp-1"]),
      anchor: null,
      scrollY,
    },
    at,
  );
}

describe("feedSnapshotKey", () => {
  it("is stable for the same query", () => {
    expect(feedSnapshotKey(KEY_PARTS)).toBe(feedSnapshotKey({ ...KEY_PARTS }));
  });

  it("ignores surrounding whitespace in the search box", () => {
    expect(feedSnapshotKey({ ...KEY_PARTS, search: "  roofing  " })).toBe(
      feedSnapshotKey(KEY_PARTS),
    );
  });

  it.each([
    ["tab", { tab: "saved" }],
    ["filters", { filters: { states: ["NC"] } }],
    ["sort", { sort: { field: "deadline" } }],
    ["search", { search: "paving" }],
    ["preview", { preview: true }],
    ["location", { locationId: "loc-2" }],
  ])("changes when the %s changes", (_label, override) => {
    expect(feedSnapshotKey({ ...KEY_PARTS, ...override })).not.toBe(feedSnapshotKey(KEY_PARTS));
  });
});

describe("feed snapshot store", () => {
  beforeEach(() => clearFeedSnapshot());

  it("returns null when nothing was saved", () => {
    expect(readFeedSnapshot("k", 0)).toBeNull();
  });

  it("round-trips the list, the page cursor and the offset", () => {
    save("k", 1_000);
    const got = readFeedSnapshot("k", 1_500);
    expect(got).toMatchObject({
      cards,
      currentPage: 3,
      totalPages: 9,
      totalOpps: 430,
      scrollY: 1200,
    });
  });

  it("refuses a snapshot taken for a DIFFERENT query", () => {
    // The guard that stops a filtered list being restored under another filter.
    save("k", 1_000);
    expect(readFeedSnapshot("other-key", 1_500)).toBeNull();
  });

  it("refuses a snapshot older than the max age", () => {
    save("k", 0);
    expect(readFeedSnapshot("k", FEED_SNAPSHOT_MAX_AGE_MS + 1)).toBeNull();
  });

  it("accepts one exactly at the age boundary", () => {
    save("k", 0);
    expect(readFeedSnapshot("k", FEED_SNAPSHOT_MAX_AGE_MS)).not.toBeNull();
  });

  it("does NOT consume on read — StrictMode mounts effects twice", () => {
    // A read-once slot would restore in production and silently fail in dev.
    save("k", 1_000);
    expect(readFeedSnapshot("k", 1_100)).not.toBeNull();
    expect(readFeedSnapshot("k", 1_100)).not.toBeNull();
  });

  it("keeps only the newest snapshot", () => {
    save("k", 1_000, 100);
    save("k", 2_000, 900);
    expect(readFeedSnapshot("k", 2_100)?.scrollY).toBe(900);
  });

  it("clearFeedSnapshot forgets it", () => {
    save("k", 1_000);
    clearFeedSnapshot();
    expect(readFeedSnapshot("k", 1_100)).toBeNull();
  });
});

// ── Anchoring ──────────────────────────────────────────────────────────────
// These cover the two ways restoration reaches the member's row. The anchor
// path is the one that matters in production: the SPA runs inside a
// GoHighLevel custom-page iframe, where the inner document may not be the
// scroller at all and `window.scrollTo` is a silent no-op.

interface FakeCard {
  el: HTMLElement;
  top: number;
  height: number;
}

/** Builds a card list whose geometry we control, since jsdom lays nothing out. */
function mountCards(tops: number[]): FakeCard[] {
  document.body.innerHTML = "";
  return tops.map((top, i) => {
    const el = document.createElement("a");
    el.setAttribute(OPP_KEY_ATTR, `opp-${i}`);
    const card: FakeCard = { el, top, height: 200 };
    el.getBoundingClientRect = () =>
      ({ top: card.top, bottom: card.top + card.height, height: card.height }) as DOMRect;
    document.body.appendChild(el);
    return card;
  });
}

describe("topmostVisibleAnchor", () => {
  it("picks the topmost row the observer reports as visible", () => {
    mountCards([-450, -250, -50, 150]);
    // The observer, not the rect, decides what is on screen — this is what
    // holds up inside the GoHighLevel iframe, where the rects never move.
    expect(topmostVisibleAnchor(new Set(["opp-2", "opp-3"]), document)).toEqual({
      oppKey: "opp-2",
      offset: -50,
    });
  });

  it("keeps the member's offset within that row, so restoring is exact", () => {
    mountCards([-120, 80]);
    expect(topmostVisibleAnchor(new Set(["opp-0"]), document)?.offset).toBe(-120);
  });

  it("scans in DOM order, so a later row never wins", () => {
    mountCards([0, 200, 400]);
    expect(topmostVisibleAnchor(new Set(["opp-2", "opp-1"]), document)?.oppKey).toBe("opp-1");
  });

  it("is null when the observer sees nothing", () => {
    mountCards([-900, -700]);
    expect(topmostVisibleAnchor(new Set(), document)).toBeNull();
  });

  it("is null when the visible row is no longer rendered", () => {
    mountCards([0]);
    expect(topmostVisibleAnchor(new Set(["opp-gone"]), document)).toBeNull();
  });
});

describe("applyFeedScroll", () => {
  function snapWith(anchor: FeedAnchor | null, scrollY = 1200): FeedSnapshot {
    return {
      key: "k",
      cards,
      currentPage: 1,
      totalPages: 1,
      totalOpps: 1,
      takes: new Map(),
      requestedTakes: new Set(),
      anchor,
      scrollY,
      savedAt: 0,
    };
  }

  it("scrolls the anchor row into view rather than to a pixel offset", () => {
    const [, second] = mountCards([0, 400]);
    const intoView = vi.fn();
    second.el.scrollIntoView = intoView;
    applyFeedScroll(snapWith({ oppKey: "opp-1", offset: 400 }), document);
    expect(intoView).toHaveBeenCalledWith({ block: "start" });
  });

  it("fine-tunes to the member's exact offset when this document scrolls", () => {
    const [, second] = mountCards([0, 400]);
    second.el.scrollIntoView = vi.fn();
    const scrollBy = vi.fn();
    (window as unknown as { scrollBy: unknown }).scrollBy = scrollBy;
    // The row now sits at 400; the member had it at 120 → close the 280 gap.
    applyFeedScroll(snapWith({ oppKey: "opp-1", offset: 120 }), document);
    expect(scrollBy).toHaveBeenCalledWith(0, 280);
  });

  it("does not nudge when the row is already where the member left it", () => {
    const [first] = mountCards([250]);
    first.el.scrollIntoView = vi.fn();
    const scrollBy = vi.fn();
    (window as unknown as { scrollBy: unknown }).scrollBy = scrollBy;
    applyFeedScroll(snapWith({ oppKey: "opp-0", offset: 250 }), document);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("falls back to the raw offset when the anchor row is gone", () => {
    mountCards([0]);
    const scrollTo = vi.fn();
    (window as unknown as { scrollTo: unknown }).scrollTo = scrollTo;
    applyFeedScroll(snapWith({ oppKey: "opp-missing", offset: 0 }, 940), document);
    expect(scrollTo).toHaveBeenCalledWith(0, 940);
  });

  it("falls back to the raw offset when nothing was anchored", () => {
    mountCards([0]);
    const scrollTo = vi.fn();
    (window as unknown as { scrollTo: unknown }).scrollTo = scrollTo;
    applyFeedScroll(snapWith(null, 640), document);
    expect(scrollTo).toHaveBeenCalledWith(0, 640);
  });
});

// ── The one-shot guard ─────────────────────────────────────────────────────
// This is the regression that broke restoration in production. The feed's
// filters are seeded from the member's profile AFTER mount, which changes the
// feed key; a guard spent on the first render compared against the unseeded key
// and missed, so the snapshot was saved on the way out and never read.

describe("createRestoreGate", () => {
  const SEEDED = feedSnapshotKey(KEY_PARTS);
  const UNSEEDED = feedSnapshotKey({ ...KEY_PARTS, filters: {} });

  beforeEach(() => clearFeedSnapshot());

  it("survives an attempt made before the filters have seeded", () => {
    save(SEEDED, 0);
    const gate = createRestoreGate();
    // Mount: filters still empty, profile defaults in flight.
    expect(gate.attempt(UNSEEDED, false, 0)).toBeNull();
    // Defaults land, filters seed, the key becomes final — and the member's
    // place is still there to restore.
    expect(gate.attempt(SEEDED, true, 0)?.cards).toEqual(cards);
  });

  it("restores only once, so a later filter change still refetches", () => {
    save(SEEDED, 0);
    const gate = createRestoreGate();
    expect(gate.attempt(SEEDED, true, 0)).not.toBeNull();
    expect(gate.attempt(SEEDED, true, 0)).toBeNull();
  });

  it("spends its attempt even when there is nothing stored", () => {
    const gate = createRestoreGate();
    expect(gate.attempt(SEEDED, true, 0)).toBeNull();
    save(SEEDED, 0);
    // A snapshot saved after the feed has already loaded belongs to the NEXT
    // visit, not this one.
    expect(gate.attempt(SEEDED, true, 0)).toBeNull();
  });

  it("still refuses a snapshot for a different query once ready", () => {
    save(UNSEEDED, 0);
    const gate = createRestoreGate();
    expect(gate.attempt(SEEDED, true, 0)).toBeNull();
  });

  it("still refuses a snapshot that has gone stale", () => {
    save(SEEDED, 0);
    const gate = createRestoreGate();
    expect(gate.attempt(SEEDED, true, FEED_SNAPSHOT_MAX_AGE_MS + 1)).toBeNull();
  });
});

// ── Card heights ───────────────────────────────────────────────────────────
// A Hunter's Take REPLACES a card's reasoning line, so it changes the card's
// height. Restoring rows without their takes re-rendered the feed at different
// heights than the member left it at — they landed near their place and then
// watched the list slide as the takes were re-fetched.

describe("takes travel with the snapshot", () => {
  beforeEach(() => clearFeedSnapshot());

  it("round-trips the generated lines", () => {
    const key = feedSnapshotKey(KEY_PARTS);
    save(key, 0);
    expect(readFeedSnapshot(key, 0)?.takes.get("opp-1")).toBe(
      "Worth a look — you have done three of these.",
    );
  });

  it("round-trips which rows were already requested, so none are re-fetched", () => {
    const key = feedSnapshotKey(KEY_PARTS);
    save(key, 0);
    expect(readFeedSnapshot(key, 0)?.requestedTakes.has("opp-1")).toBe(true);
  });
});

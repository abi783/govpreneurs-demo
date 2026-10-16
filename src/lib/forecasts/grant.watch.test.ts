// The watch promises per state (feature 12, ARCHITECTURE-forecasts-watch.md §11). While
// watching is off, no forecast surface promises to watch, tell or notify. While it is on,
// every promise names where the member sees a change, and only the email state names
// email.
import { describe, expect, it } from "vitest";
import * as COPY from "./copy";
import { SCORED_FORECASTS } from "./__fixtures__/scored";
import { meetBounds, readForecast, unknownChip, watchTrackLine, type UnknownItem } from "./grant";
import * as GRANT_COPY from "./grantCopy";
import type { WatchCopyState } from "./watch";
import * as WATCH_COPY from "./watchCopy";

const { UNKNOWN } = COPY;
const { MEET, UNKNOWN_COPY } = GRANT_COPY;
const { WATCH_PROMISE } = WATCH_COPY;

/** The words of a promise to watch. None may show while watching is off. */
const PROMISE = /\bwatched\b|hear when|\btell you\b|get told|notify|alert you/i;
const FORBIDDEN = /deadline|\bdue\b|closes|higher\s*gov/i;
const EMAIL = /e-?mail/i;
const STATES: WatchCopyState[] = ["off", "inApp", "email"];

/** Every string a copy object can render: plain values, and functions called with a stand-in. */
function stringsOf(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "function") {
    const args = Array.from({ length: value.length }, () => "X");
    return stringsOf((value as (...a: string[]) => unknown)(...args));
  }
  if (Array.isArray(value)) return value.flatMap(stringsOf);
  if (value && typeof value === "object") return Object.values(value).flatMap(stringsOf);
  return [];
}

const item = (label: string): UnknownItem => ({ label, how: "watch" });
const WATCHED_UNKNOWNS = [UNKNOWN.whoMayBid, UNKNOWN.date, UNKNOWN.value].map(item);

/** Every string one state lets the page render about watching. */
function rendered(state: WatchCopyState): string[] {
  const chips = [true, false].flatMap((tracked) =>
    WATCHED_UNKNOWNS.map((u) => unknownChip(u, tracked, state).text),
  );
  return [
    ...chips,
    watchTrackLine(WATCHED_UNKNOWNS, false, state) ?? "",
    meetBounds(state),
    WATCH_PROMISE[state].trackTooltip,
  ].filter(Boolean);
}

describe("watching off (a)", () => {
  it("names the process that settles each watched unknown, never a watch (A4)", () => {
    for (const tracked of [false, true]) {
      expect(unknownChip(item(UNKNOWN.whoMayBid), tracked, "off")).toEqual({
        how: "ask_office",
        text: UNKNOWN_COPY.how.ask_office,
      });
      expect(unknownChip(item(UNKNOWN.value), tracked, "off")).toEqual({
        how: "ask_office",
        text: "Ask the office",
      });
      expect(unknownChip(item(UNKNOWN.date), tracked, "off")).toEqual({
        how: "posts",
        text: "Shown in the bid request",
      });
    }
  });

  it("leaves an unknown that is not a watch as it is", () => {
    const u: UnknownItem = { label: UNKNOWN.work, how: "posts" };
    for (const state of STATES)
      expect(unknownChip(u, false, state)).toEqual({ how: "posts", text: UNKNOWN_COPY.how.posts });
  });

  it("hides the track line", () => {
    expect(watchTrackLine(WATCHED_UNKNOWNS, false, "off")).toBeNull();
  });

  it("ends Grant's bounds before the tracking promise", () => {
    expect(meetBounds("off")).toBe(MEET.bounds);
    expect(meetBounds("off").endsWith("It can move or be cancelled.")).toBe(true);
  });

  it("says the Track control keeps the forecast on her saved list, and nothing more", () => {
    expect(WATCH_PROMISE.off.trackTooltip).toBe("Keep this forecast on your saved list.");
  });

  it("renders no watching promise on any forecast surface", () => {
    for (const text of rendered("off")) expect(text).not.toMatch(PROMISE);
  });

  it("holds no promise to watch in the page copy outside WATCH_PROMISE", () => {
    // The list tabs, Grant's answers, the page's labels and the rail read these objects.
    const texts = [...stringsOf(COPY), ...stringsOf(GRANT_COPY)];
    expect(texts.length).toBeGreaterThan(100);
    const promises = texts.filter((t) => PROMISE.test(t));
    expect(promises).toEqual([]);
  });

  it("words the Watch tab and Grant's first step without a promise", () => {
    expect(COPY.CAPTURE_STATUS.watch.advice).toBe(
      "Nothing to do yet. Track it to keep it on your saved list.",
    );
    expect(COPY.ASK.doNothing).toBe(
      "Nothing yet. Track this forecast to keep it on your saved list.",
    );
  });
});

describe("watching on, in the app only (b)", () => {
  it("shows the watch chips", () => {
    expect(unknownChip(item(UNKNOWN.date), false, "inApp")).toEqual({
      how: "watch",
      text: "Watched once you track it",
    });
    expect(unknownChip(item(UNKNOWN.date), true, "inApp")).toEqual({
      how: "watch",
      text: "Watched",
    });
  });

  it("shows the track line only before she tracks", () => {
    expect(watchTrackLine(WATCHED_UNKNOWNS, false, "inApp")).toBe(WATCH_PROMISE.inApp.trackLine);
    expect(watchTrackLine(WATCHED_UNKNOWNS, true, "inApp")).toBeNull();
    const none: UnknownItem[] = [{ label: UNKNOWN.work, how: "posts" }];
    expect(watchTrackLine(none, false, "inApp")).toBeNull();
  });

  it("names where she sees a change in every promise, and never email", () => {
    const promises = [
      WATCH_PROMISE.inApp.trackTooltip,
      WATCH_PROMISE.inApp.trackLine,
      WATCH_PROMISE.inApp.boundsPromise,
    ];
    for (const p of promises) {
      expect(p).toMatch(/this page/);
      expect(p).toMatch(/My Bids/);
    }
    for (const text of rendered("inApp")) expect(text).not.toMatch(EMAIL);
    expect(meetBounds("inApp")).toBe(`${MEET.bounds} ${WATCH_PROMISE.inApp.boundsPromise}`);
  });
});

describe("watching on, with email (c)", () => {
  it("may name email, and still names this page and My Bids", () => {
    expect(rendered("email").some((t) => EMAIL.test(t))).toBe(true);
    for (const p of [WATCH_PROMISE.email.trackTooltip, WATCH_PROMISE.email.trackLine]) {
      expect(p).toMatch(/this page/);
      expect(p).toMatch(/My Bids/);
    }
  });

  it("is the only state that names email", () => {
    for (const state of ["off", "inApp"] as const)
      expect(stringsOf(WATCH_PROMISE[state]).filter((t) => EMAIL.test(t))).toEqual([]);
  });
});

describe("the watch words (d)", () => {
  it("hold none of the forbidden words", () => {
    const texts = [...stringsOf(WATCH_COPY), ...STATES.flatMap(rendered)];
    for (const text of texts) expect(text).not.toMatch(FORBIDDEN);
  });

  it("keep each sentence to 15 words, as the plain-English bar does", () => {
    const sentences = stringsOf(WATCH_COPY)
      .flatMap((t) => t.split(/(?<=\.)\s+/))
      .filter(Boolean);
    for (const s of sentences) expect(s.split(/\s+/).length).toBeLessThanOrEqual(15);
  });
});

describe("a live read carries watched unknowns", () => {
  it("has a forecast whose read holds a watch unknown, so the page cases are real", () => {
    const withWatch = SCORED_FORECASTS.find((f) =>
      readForecast(f).unknowns.some((u) => u.how === "watch"),
    );
    expect(withWatch).toBeDefined();
  });
});

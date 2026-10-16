// Small orders — ONE CLOCK over the corpus.
//
// The corpus comments said a gate held the clock rule. They named a script this
// repo has never held, so for that claim nothing ran. This spec is the gate.
//
// IT RULES OVER ONE CORPUS. `liveMapperOutput.fixture.ts`, against `LIVE_AS_OF`.
// The SAMPLE corpus in `lib/mock/microPurchaseOrders.ts` has its own frozen day,
// `TODAY`, and this spec does not read it. Its docblock says so. Do not join the
// two clocks to widen this spec — they date different records.
//
// THE RULE. Every fact about an ORDER is measured against the day the board was
// served for — `SmallOrdersFeed.asOf`, which `liveMapperOutput.fixture.ts`
// freezes as `LIVE_AS_OF`. Every fact about the MEMBER is measured against the
// real day, and `wallClock.ts` is the one place that reads it. `wallClock.ts`
// states the split at length; this spec enforces it.
//
// WHAT IT COSTS TO MIX THEM. The corpus's day trails the real day by as far as
// the ingest is behind. A surface that mixes a fixed corpus with the real day
// tells a member an order is open when the corpus says it closed, and reads an
// award as younger than it is — which is a price we stand behind past the
// 24 months the ladder withdraws at.
//
// TWO HALVES, because one alone cannot hold the rule.
//
//   1. BEHAVIOURAL — every backward-looking date in the corpus is on or before
//      the corpus's day. A record posted after the day the board is for is a
//      corpus that cannot be judged against its own clock at all.
//   2. STATIC — no file of the library or of the small-orders routes calls
//      `new Date()` or `Date.now()`, except `wallClock.ts`. This catches a
//      second clock the behavioural half cannot see, because a wall-clock read
//      gives a different answer every day it runs.
//
// The static half reads the tree through `sourceScan.testkit.ts`, which
// excludes test files. That exclusion keeps this spec honest: the calls it
// forbids are written below as patterns, and a scan that read this file would
// report a violation nobody wrote.
import { describe, expect, it } from "vitest";
import {
  LIVE_AS_OF,
  LIVE_MAPPED_ORDERS,
  LIVE_MAPPED_UNCATEGORISED,
} from "./liveMapperOutput.fixture";
import { isoDay } from "./wallClock";
import { readSourceFiles, type SourceFile } from "./sourceScan.testkit";
import type { MicroOrder } from "./order";

/** Every order the live mapper emitted, both populations. */
const ALL_ORDERS = [...LIVE_MAPPED_ORDERS, ...LIVE_MAPPED_UNCATEGORISED];

/** The one file allowed to read the real day. See its own docblock for why the
 *  member's deadlines — a SAM registration above all — need it. */
const WALL_CLOCK_OWNER = "lib/microPurchases/wallClock.ts";

/** The route files of this surface. Every other route is a different feature
 *  with its own clock. */
const SMALL_ORDERS_ROUTE = "routes/small-orders.";

/**
 * A line whose FIRST non-space characters open a comment.
 *
 * It matches how a line STARTS, not what the whole line holds, and the
 * difference runs both ways. `const x = 1; // Date.now()` is NOT skipped, so a
 * call named in a trailing comment reads as a violation — noisy, and the safe
 * direction. A line that OPENS a block comment and then carries code after the
 * closing marker IS skipped, so a real read on such a line is missed. That
 * second shape is the one false negative here, and nothing on the scoped
 * surface writes one today.
 *
 * The rule earns its place on the ordinary case: two files explain in prose why
 * they no longer default a day to the real one, and prose reads no clock.
 */
const COMMENT_LINE = /^\s*(\/\/|\*|\/\*)/;

/** A way to read the real day. */
interface WallClockCall {
  /** How a failure message should name it. */
  name: string;
  /**
   * The call, as source text.
   *
   * The boundaries are load-bearing, and they are the trap the stylesheet sweep
   * hit: without them `updatedDate.now()` reads as `Date.now()`. `new Date(iso)`
   * is deliberately NOT matched — parsing a stored day is not reading a clock.
   */
  pattern: RegExp;
}

const WALL_CLOCK_CALLS: WallClockCall[] = [
  { name: "new Date()", pattern: /new\s+Date\s*\(\s*\)/ },
  { name: "Date.now()", pattern: /(?<![A-Za-z0-9_$.])Date\s*\.\s*now\s*\(\s*\)/ },
];

/** One read of the real day, where the sweep found it. */
interface WallClockRead {
  relativePath: string;
  line: number;
  call: string;
}

/** A date on an order, and the field it came from. */
interface CorpusDate {
  orderId: string;
  field: string;
  day: string;
}

/**
 * Every date on an order that records something that ALREADY happened.
 *
 * `closesOn` is deliberately absent. A closing date is ahead of the corpus's
 * day by nature, so it is the one date the rule below would fail on for the
 * right reason.
 */
function backwardDates(o: MicroOrder): CorpusDate[] {
  const days: { field: string; day: string | null }[] = [
    { field: "postedOn", day: o.postedOn },
    { field: "amendedOn", day: o.amendedOn },
    { field: "lastPriceDate", day: o.lastPriceDate },
    ...o.awards.map((award) => ({ field: "awards[].awardedOn", day: award.awardedOn })),
  ];
  return days
    .filter((entry): entry is { field: string; day: string } => entry.day !== null)
    .map((entry) => ({ orderId: o.id, field: entry.field, day: isoDay(entry.day) }));
}

/** The library and the small-orders routes, through the testkit's walk. */
function clockedFiles(): SourceFile[] {
  return [
    ...readSourceFiles("lib/microPurchases"),
    ...readSourceFiles("routes", { match: (path) => path.startsWith(SMALL_ORDERS_ROUTE) }),
  ];
}

/** Every read of the real day in the files given, in file and line order. */
function wallClockReads(files: SourceFile[]): WallClockRead[] {
  const found: WallClockRead[] = [];
  for (const file of files) {
    file.text.split("\n").forEach((text, index) => {
      if (COMMENT_LINE.test(text)) return;
      for (const call of WALL_CLOCK_CALLS) {
        if (call.pattern.test(text)) {
          found.push({ relativePath: file.relativePath, line: index + 1, call: call.name });
        }
      }
    });
  }
  return found;
}

/** `path:line calls x()` — what a failure message should print. */
function describeRead(read: WallClockRead): string {
  return `${read.relativePath}:${read.line} calls ${read.call}`;
}

const CLOCKED_FILES = clockedFiles();
const READS = wallClockReads(CLOCKED_FILES);
const CORPUS_DATES = ALL_ORDERS.flatMap(backwardDates);

describe("the corpus is judged against its own day", () => {
  it("carries orders, and a day to judge them against", () => {
    // Named first, so no assertion below can pass by ruling over nothing.
    expect(ALL_ORDERS.length).toBeGreaterThan(0);
    expect(LIVE_AS_OF).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(CORPUS_DATES.length).toBeGreaterThan(ALL_ORDERS.length);
  });

  it("posts no order after the day the board was served for", () => {
    const posted = ALL_ORDERS.filter((o) => isoDay(o.postedOn) > LIVE_AS_OF).map((o) => o.id);

    // An order posted after `asOf` is a record the served board could not have
    // held. Regenerate the fixture; never widen the day to admit it.
    expect(posted).toEqual([]);
  });

  it("takes the corpus's day from the newest order it holds", () => {
    const newest = ALL_ORDERS.map((o) => isoDay(o.postedOn))
      .sort()
      .at(-1);

    // The fixture's own contract, and the backend's: `asOf` IS the newest
    // `postedOn`. If they part, the day came from somewhere else.
    expect(newest).toBe(LIVE_AS_OF);
  });

  it("records nothing as already happened after that day", () => {
    const ahead = CORPUS_DATES.filter((date) => date.day > LIVE_AS_OF).map(
      (date) => `${date.orderId} ${date.field}=${date.day}`,
    );

    // An award dated after the corpus's day ages as a negative number of
    // months, which the ladder reads as fresh.
    expect(ahead).toEqual([]);
  });
});

describe("nothing on this surface reads the real day", () => {
  it("reads a surface that still has files in it", () => {
    // The sweep passes an empty tree, and it passes a tree with the routes
    // missing. Both scopes are named, and so is the file the rule turns on.
    expect(CLOCKED_FILES.length).toBeGreaterThan(10);
    expect(CLOCKED_FILES.some((file) => file.relativePath === WALL_CLOCK_OWNER)).toBe(true);
    expect(
      CLOCKED_FILES.filter((file) => file.relativePath.startsWith(SMALL_ORDERS_ROUTE)),
    ).not.toEqual([]);
  });

  it("still finds the one read it allows", () => {
    const owned = READS.filter((read) => read.relativePath === WALL_CLOCK_OWNER);

    // The canary. `wallClock.ts` calls `new Date()`, so a sweep that reports a
    // clean surface without finding THIS one has stopped matching anything —
    // through a broken pattern, or through a comment rule that ate the code.
    expect(owned.map(describeRead).length).toBeGreaterThan(0);
  });

  it("calls new Date() or Date.now() nowhere but wallClock.ts", () => {
    const elsewhere = READS.filter((read) => read.relativePath !== WALL_CLOCK_OWNER).map(
      describeRead,
    );

    // Take the day of the SUBJECT. An order's day is `SmallOrdersFeed.asOf`; a
    // member's day is `wallClockNow()`, imported from the file above.
    expect(elsewhere).toEqual([]);
  });
});

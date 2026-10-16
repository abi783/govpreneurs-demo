// Small orders — the withdrawal ladder has ONE owner.
//
// `pricing.ts` says of `priceCeiling()`: "The gate ... fails the moment the two
// disagree." It named a script this repo has never held, so for that claim
// nothing ran. This spec is the gate, and `pricing.ts` names it now.
//
// WHAT IT PROTECTS. A ceiling is the "keep it under" number a member quotes
// against. It is withdrawn by four triggers — an unusable price, an unreadable
// award date, a unit of issue we cannot name, and an award older than
// `MONTHS_USABLE`. `priceCeiling()` owns all four. Three surfaces read it and
// none of them re-derives it: `priceAdvice()` for the copy,
// `hasUsableCeiling()` for the boolean and `orderValue()` for the total.
//
// A SECOND DERIVATION COSTS HER THE AWARD OR THE MONEY. `orderValue()` once
// restated two of the four triggers inline and drifted from the other two,
// which put a money total on a card under a block refusing to price the same
// record. The send block once rendered "Price for each / Keep it under $6.15"
// off the raw `lastPricePerUnit` field, on a unit of PR, regardless of age. A
// ceiling read too high loses the award; a ceiling read too low loses money.
//
// TWO HALVES, because one alone cannot hold the rule.
//
//   1. BEHAVIOURAL — over the real mapper output in
//      `liveMapperOutput.fixture.ts`, the three readers give the same answer on
//      every order. This catches a ladder that drifts inside `pricing.ts`.
//   2. STATIC — no file of this surface reads the raw `lastPricePerUnit` field
//      except the ladder's owner and the type that declares it. This catches a
//      ladder re-derived somewhere `pricing.ts` cannot see.
//
// The static half reads the tree through `sourceScan.testkit.ts`, which
// excludes test files. That exclusion keeps this spec honest: the field name
// below is a literal, and a scan that read this file would report it as a
// reader of itself.
import { describe, expect, it } from "vitest";
import { awardHistory, corpusNow, hasUsableCeiling, orderValue, priceAdvice } from "./pricing";
import type { MicroOrder } from "./order";
import {
  LIVE_AS_OF,
  LIVE_MAPPED_ORDERS,
  LIVE_MAPPED_UNCATEGORISED,
} from "./liveMapperOutput.fixture";
import { readSourceFiles, type SourceFile } from "./sourceScan.testkit";

/** The served corpus's day, through the one function that reads it. ONE CLOCK:
 *  an award's age is a fact about an order, so it is measured against the day
 *  the board was served for and never against a wall clock. */
const CORPUS_DAY = corpusNow(LIVE_AS_OF);

/** Every order the live mapper emitted, both populations. The uncategorised set
 *  is included because a ceiling does not depend on whether we can name the
 *  kind of part, and a sweep that skipped it would rule over two thirds. */
const ALL_ORDERS = [...LIVE_MAPPED_ORDERS, ...LIVE_MAPPED_UNCATEGORISED];

/** The raw field a ceiling must never be re-derived from. */
const RAW_PRICE_FIELD = "lastPricePerUnit";

/**
 * The raw field as a whole token.
 *
 * The boundaries are load-bearing, and they are the trap the stylesheet sweep
 * hit: without them a longer identifier that merely contains the name reads as
 * the field itself, and the sweep reports a re-derivation nobody wrote.
 */
const RAW_PRICE_TOKEN = new RegExp(`(?<![A-Za-z0-9_$])${RAW_PRICE_FIELD}(?![A-Za-z0-9_$])`);

/**
 * A line whose FIRST non-space characters open a comment.
 *
 * It matches how a line STARTS, not what the whole line holds, and the
 * difference runs both ways. `const x = 1; // the raw field` is NOT skipped, so
 * a name written in a trailing comment reads as a violation — noisy, and the
 * safe direction. A line that OPENS a block comment and then carries code after
 * the closing marker IS skipped, so a real read on such a line is missed. That
 * second shape is the one false negative here, and nothing on the scoped
 * surface writes one today.
 *
 * The rule earns its place on the ordinary case: the field is named in prose
 * across this surface — every one of those lines explains why NOT to read it —
 * and prose derives no ceiling.
 */
const COMMENT_LINE = /^\s*(\/\/|\*|\/\*)/;

/** The shortest a reason may be. A one-word reason looks like a justification
 *  and carries none. Twenty characters is about four words. */
const MINIMUM_REASON_LENGTH = 20;

/** The route files of this surface. Every other route is a different feature. */
const SMALL_ORDERS_ROUTE = "routes/small-orders.";

/** A file this surface allows to name the raw price field, and why. */
interface RawPriceReader {
  /** The path under `src`, POSIX-separated. */
  relativePath: string;
  /** What the file does with the name, and why that is not a second ceiling. */
  reason: string;
}

/**
 * Every file allowed to write the raw field's name in code.
 *
 * A surface that wants a "keep it under" number goes here only over the
 * maintainer's dead body: it must call `priceAdvice()` and render nothing when
 * the ceiling is null.
 */
const RAW_PRICE_READERS: RawPriceReader[] = [
  {
    relativePath: "lib/microPurchases/order.ts",
    reason:
      "DECLARES the field on `MicroOrder`. It is the wire contract the backend mapper writes, " +
      "so the name must appear here. A type declaration derives no number.",
  },
  {
    relativePath: "lib/microPurchases/liveMapperOutput.fixture.ts",
    reason:
      "TEST DATA, generated from real mapper output, which WRITES the field the backend " +
      "emits. Nothing in `src/` imports it at runtime, so it renders no number to a member. " +
      "The testkit hides `.test.ts` files from this sweep and this is the same kind of file, " +
      "named rather than hidden by a pattern so a second one has to be argued for.",
  },
  {
    relativePath: "lib/microPurchases/pricing.ts",
    reason:
      "OWNS the ladder. `pricePoint()` performs the one read of the raw field, and " +
      "`priceCeiling()` is the only function that turns a price point into a ceiling.",
  },
];

/** Every source file of the micro-purchases surface: the library, the
 *  components and the small-orders routes. Test files are excluded by the
 *  testkit, which walks the tree so this spec does not have to. */
function surfaceFiles(): SourceFile[] {
  return [
    ...readSourceFiles("lib/microPurchases"),
    ...readSourceFiles("components/MicroPurchases"),
    ...readSourceFiles("routes", { match: (path) => path.startsWith(SMALL_ORDERS_ROUTE) }),
  ];
}

/** The files whose CODE names the raw price field, sorted. */
function rawPriceReaders(files: SourceFile[]): string[] {
  return files
    .filter((file) =>
      file.text.split("\n").some((line) => !COMMENT_LINE.test(line) && RAW_PRICE_TOKEN.test(line)),
    )
    .map((file) => file.relativePath)
    .sort();
}

const SURFACE_FILES = surfaceFiles();
const READERS = rawPriceReaders(SURFACE_FILES);
const ALLOWED = new Set(RAW_PRICE_READERS.map((entry) => entry.relativePath));

describe("the live corpus exercises both sides of the ladder", () => {
  it("carries orders we will price and orders we will not", () => {
    // Named first, so no assertion below can pass by ruling over nothing, and
    // so a corpus that lost one of the two populations says so here rather
    // than reporting agreement it never tested.
    expect(CORPUS_DAY).not.toBeNull();
    expect(ALL_ORDERS.length).toBeGreaterThan(0);
    expect(ALL_ORDERS.some((o) => hasUsableCeiling(o, CORPUS_DAY))).toBe(true);
    expect(ALL_ORDERS.some((o) => !hasUsableCeiling(o, CORPUS_DAY))).toBe(true);
  });
});

describe("priceCeiling() is the only owner of the withdrawal ladder", () => {
  it("answers hasUsableCeiling() and priceAdvice() the same way on every order", () => {
    const disagreeing = ALL_ORDERS.filter(
      (o) => hasUsableCeiling(o, CORPUS_DAY) !== (priceAdvice(o, CORPUS_DAY).ceiling !== null),
    ).map((o) => o.id);

    // The boolean and the copy are the same question. If they part, one of the
    // two restated a withdrawal trigger instead of reading `priceCeiling()`.
    expect(disagreeing).toEqual([]);
  });

  it("puts no order value on an order it refuses to price", () => {
    const valued = ALL_ORDERS.filter(
      (o) => orderValue(o, CORPUS_DAY) !== null && !hasUsableCeiling(o, CORPUS_DAY),
    ).map((o) => o.id);

    // The third reader. A total is a ceiling times a quantity, so a total on a
    // record we will not price is a money figure we withdrew the evidence for.
    expect(valued).toEqual([]);
  });
});

describe(`no surface re-derives a ceiling from ${RAW_PRICE_FIELD}`, () => {
  it("reads a surface that still has files in it", () => {
    // The sweep passes an empty tree, and it passes a tree with one of its
    // three scopes missing. Each scope is named, because the send block and the
    // order page are exactly where a second ceiling was rendered before.
    expect(SURFACE_FILES.length).toBeGreaterThan(10);
    expect(READERS.length).toBeGreaterThan(0);
    for (const scope of ["lib/microPurchases/", "components/MicroPurchases/", SMALL_ORDERS_ROUTE]) {
      expect(SURFACE_FILES.filter((file) => file.relativePath.startsWith(scope))).not.toEqual([]);
    }
  });

  it("names no reader of the raw price field outside the ladder's owner", () => {
    const unregistered = READERS.filter((path) => !ALLOWED.has(path));

    // Call `priceAdvice(o, now)` and render its `ceiling`. Show nothing when
    // the ceiling is null — that null IS the withdrawal.
    expect(unregistered).toEqual([]);
  });

  it("keeps no allowlist entry that no longer reads the field", () => {
    const stale = RAW_PRICE_READERS.map((entry) => entry.relativePath).filter(
      (path) => !READERS.includes(path),
    );

    // An allowlist that only ever grows is how this kind of gate rots.
    expect(stale).toEqual([]);
  });

  it("gives a reason for every allowlist entry", () => {
    const unexplained = RAW_PRICE_READERS.filter(
      (entry) => entry.reason.trim().length < MINIMUM_REASON_LENGTH,
    ).map((entry) => entry.relativePath);

    expect(unexplained).toEqual([]);
  });
});

// THE UNIT-OF-ISSUE ARM SAYS WHAT *WE* DO NOT KNOW, NOT WHAT THE PAPER OMITS.
//
// Two of the ladder's four triggers print a sentence of their own, and both
// used to open "The order paper does not say how these are counted." The unit
// of issue is `nsnRecord?.ui` (`small-orders.mapper.ts`) — it reaches us
// through the `nsn_records` join and never off the solicitation. So the
// sentence asserted a defect in DLA's document to explain a gap in ours.
//
// NEITHER STRING WAS READ BY ANY TEST. Both were changed and the whole suite
// stayed green, which is the gap these two cases close: the ladder's behaviour
// was covered, the WORDS it withdraws with were not.
describe("the unit-of-issue withdrawal names our gap, not the order paper's", () => {
  // Real mapper output with ONE field moved, the rule `priceClock.fixture.ts`
  // sets: a hand-written order is a shape nobody checked against the ingest.
  const priced = LIVE_MAPPED_ORDERS.find(
    (o) =>
      o.unitOfIssue != null && o.awards.length > 0 && hasUsableCeiling(o, corpusNow(LIVE_AS_OF)),
  );
  if (priced == null) {
    throw new Error("liveMapperOutput.fixture.ts holds no priced order with a nameable unit");
  }
  /** The same record, arriving with no `nsn_records` row behind its unit. */
  const unnamed: MicroOrder = { ...priced, unitOfIssue: null };
  const now = corpusNow(LIVE_AS_OF);

  it("withdraws the ceiling, as the ladder always did", () => {
    expect(hasUsableCeiling(priced, now)).toBe(true);
    expect(hasUsableCeiling(unnamed, now)).toBe(false);
  });

  it("states the price as history and blames nobody for the missing unit", () => {
    const advice = priceAdvice(unnamed, now);
    expect(advice.body).toBe(
      "How these are counted is not clear at source. Read the order paper before you price it.",
    );
    expect(advice.body).not.toMatch(/order paper does not say/i);
    // The figure survives the withdrawal — only the instruction goes.
    expect(advice.headline).toMatch(/DLA paid/);
  });

  it("names itself in the award record too, without the false attribution", () => {
    const history = awardHistory(unnamed, now);
    expect(history?.body).toBe(
      "The prices are not shown. How these are counted is not clear at source.",
    );
    expect(history?.body).not.toMatch(/order paper does not say/i);
  });
});

describe("the no-price headline says new order only when DLA never bought the part", () => {
  const priced = LIVE_MAPPED_ORDERS.find((o) => o.awards.length > 0);
  if (priced == null) {
    throw new Error("liveMapperOutput.fixture.ts holds no order with awards");
  }
  const now = corpusNow(LIVE_AS_OF);

  it("calls a record with no award at all a new order", () => {
    const never: MicroOrder = {
      ...priced,
      awards: [],
      lastPricePerUnit: null,
      standardPrice: null,
    };
    expect(priceAdvice(never, now).headline).toBe(
      "It's a new order! No prior history to estimate a price from.",
    );
    expect(awardHistory(never, now)?.headline).toBe("DLA has no record of buying this before.");
  });

  it("does not call a record with only surplus awards new", () => {
    const surplusOnly: MicroOrder = {
      ...priced,
      awards: priced.awards.map((a) => ({ ...a, surplus: true })),
      standardPrice: null,
    };
    const advice = priceAdvice(surplusOnly, now);
    expect(advice.kind).toBe("none");
    expect(advice.headline).toBe("No usable price history for this one.");
  });
});

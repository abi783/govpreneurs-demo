/**
 * THE BOARD, AND THE ORDERS IT REFUSES TO RULE ON (D13).
 *
 * ── WHAT THIS FILE NOW PINS, AND WHAT IT USED TO ─────────────────────────
 *
 * It used to prove the biddable board was EMPTY. That was correct while the
 * `opportunities` collection carried the solicitation half of the PRD's join
 * and nothing else: no `amc`, no `amsc`, no `awards[]`, no `ui`. `nsn.service.ts`
 * now ingests the NSN half into `nsn_records`, and the feed source joins the two
 * on the order's stock number, so the codes arrive and the board is not empty.
 *
 * **The file's purpose did not change.** It exists to stop this surface saying
 * something it cannot support, and the claim it guards is still the governing
 * one: never tell her she may bid something she may not. What that means over a
 * joined corpus is three assertions, and they are the file:
 *
 *  1. **Only an open pair is ever told she may bid.** Every order `mayBid()`
 *     admits carries `amc` in {1,2} and `amsc` in {G,Z}. Nothing else, ever.
 *  2. **An order that joined to NO record abstains.** No code, no verdict, and
 *     it is never filled with a guess.
 *  3. **`'0'` is not a code.** DLA writes it for "no code assigned". An order
 *     carrying it is refused a verdict too — never biddable, never restricted.
 *
 * ── WHAT DH-34 MOVED, AND WHAT IT DID NOT ────────────────────────────────
 *
 * The board is no longer the same set as `mayBid()`. An order we could not rule
 * on — no code at all, or a code we hold no ruling for — is ON the list now,
 * because hiding it stated OUR gap as DLA's restriction. So `rows` is wider
 * than the verdict, and the three claims above are asserted against `mayBid()`
 * and `restrictionOf()` rather than against list membership. **Not one of them
 * was weakened**: appearing on the board and being permitted to bid are two
 * different facts, and every row here answers both, separately.
 *
 * If this file goes red, the fix is the DATA — an order that joined to a record
 * it should not have, or a record read wrongly. **Loosening `codesKnown()` is
 * not the fix**: it would tell a member she may bid work she structurally
 * cannot, which is the single worst failure this product can produce, and it is
 * the one this file exists to make impossible to ship quietly.
 *
 * ── WHY THE FIXTURE IS MAPPER OUTPUT ─────────────────────────────────────
 *
 * `liveMapperOutput.fixture.ts` is the real output of the backend's
 * `mapOpportunityToMicroOrder()` over live-shaped documents JOINED to
 * live-shaped `nsn_records`, generated and committed rather than hand-written.
 * Hand-written `MicroOrder`s would drift from what the mapper actually emits,
 * and drift in exactly this direction is what the pin is for.
 *
 * ── ONE CLOCK ────────────────────────────────────────────────────────────
 *
 * Every query below judges closing dates against `LIVE_AS_OF` — the corpus's
 * own newest posting day (D2) — and never against a wall clock. A wall clock
 * would empty the board for a second, unrelated reason (the ingest stopped
 * 2026-07-23) and the assertions would stop meaning what they say.
 */
import { describe, it, expect } from "vitest";
import {
  EMPTY_CONTEXT,
  NO_FILTERS,
  codeCoverage,
  codesKnown,
  eligibleByCode,
  gapNote,
  isUncategorised,
  mayBid,
  ourGap,
  queryOrders,
  restrictionOf,
  whyThisOrder,
  type MicroResult,
} from "./relevance";
import {
  LIVE_AS_OF,
  LIVE_MAPPED_ORDERS,
  LIVE_MAPPED_UNCATEGORISED,
  LIVE_UNJOINED_IDS,
} from "./liveMapperOutput.fixture";
import { type MicroOrder } from "./order";

/** The board as a member with no profile at all sees it: no categories, no
 *  cash ceiling, no history, no filters, and the corpus's own day. */
function board(orders: readonly MicroOrder[]): MicroResult {
  return queryOrders({ filters: NO_FILTERS, sort: "best" }, EMPTY_CONTEXT, [...orders], LIVE_AS_OF);
}

/** The orders `considered` counts: the ones the corpus's own day left open.
 *  Written here rather than read off a result field, so a coverage assertion
 *  is checked against the corpus and not against another of its own outputs. */
function scoped(orders: readonly MicroOrder[]): MicroOrder[] {
  return orders.filter((o) => o.closesOn == null || o.closesOn >= LIVE_AS_OF);
}

/** DLA's "no code assigned". Not a value, and never rendered as one. */
const NO_CODE_ASSIGNED = "0";

/** Orders whose stock number joined to no `nsn_records` document. Named by the
 *  fixture, because an order that joined to a record holding no code carries
 *  the same two nulls and is a DIFFERENT fact. */
const UNJOINED = LIVE_MAPPED_ORDERS.filter((o) => LIVE_UNJOINED_IDS.includes(o.id));

/** Every order carrying DLA's sentinel on EITHER half. */
const SENTINEL = LIVE_MAPPED_ORDERS.filter(
  (o) => o.amc === NO_CODE_ASSIGNED || o.amsc === NO_CODE_ASSIGNED,
);

/**
 * The sentinel on the METHOD only, beside a readable and OPEN suffix.
 *
 * This is the shape that catches a loosened method rule and nothing else does.
 * Read `'0'` as an acquisition method and this order satisfies every other
 * test: the suffix is a letter, it is in the open set, and the board invites
 * her to bid an order DLA has assigned no method to. A record carrying `'0'`
 * on BOTH halves cannot prove it — `'0'` is not a letter either, so the suffix
 * rule refuses it however the method rule behaves.
 */
const SENTINEL_METHOD_ONLY = LIVE_MAPPED_ORDERS.filter(
  (o) => o.amc === NO_CODE_ASSIGNED && o.amsc !== null && o.amsc !== NO_CODE_ASSIGNED,
);

/** The mirror: a real method beside a suffix DLA never assigned. */
const SENTINEL_SUFFIX_ONLY = LIVE_MAPPED_ORDERS.filter(
  (o) => o.amsc === NO_CODE_ASSIGNED && o.amc !== null && o.amc !== NO_CODE_ASSIGNED,
);

describe("the live corpus, before anything rules on it", () => {
  it("is not empty, so a count below cannot be a count over an empty fixture", () => {
    expect(LIVE_MAPPED_ORDERS.length).toBeGreaterThan(0);
    expect(LIVE_MAPPED_UNCATEGORISED.length).toBeGreaterThan(0);
  });

  it("carries all three populations the rest of this file rules on", () => {
    // Named here so no assertion below can pass by ruling over nothing.
    expect(LIVE_MAPPED_ORDERS.some((o) => codesKnown(o))).toBe(true);
    expect(UNJOINED.length).toBeGreaterThan(0);
    expect(SENTINEL.length).toBeGreaterThan(0);
  });

  it("does classify what kind of part it is, so the board pool is real", () => {
    // Without this a small board could be explained by "we could not tell what
    // any of these are", which is a different tier with a different line.
    for (const o of LIVE_MAPPED_ORDERS) expect(o.category).not.toBe("other");
  });
});

describe("an order whose stock number joined to no record", () => {
  it("carries no code, and carries no invented one either", () => {
    // 2.5% of open DIBBS orders name a stock number `nsn_records` does not
    // hold. The mapper leaves BOTH halves null and fills neither.
    for (const o of UNJOINED) {
      expect(o.amc).toBeNull();
      expect(o.amsc).toBeNull();
    }
  });

  it("is refused a verdict in both directions", () => {
    for (const o of UNJOINED) {
      expect(codesKnown(o)).toBe(false);
      expect(mayBid(o)).toBe(false);
    }
  });

  it("reaches the board carrying our gap, and never a verdict", () => {
    // IT USED TO BE HELD BACK AND IT IS NOT ANY MORE (DH-34). A stock number
    // `nsn_records` does not hold is a fetch we did not make, and withholding
    // the order presented that as a reason she may not bid. So it is on the
    // list, it says which gap it is, and `mayBid()` is still false on it.
    const result = board(LIVE_MAPPED_ORDERS);
    const rowIds = result.rows.map((o) => o.id);
    const refused = result.restricted.map((o) => o.id);

    for (const o of UNJOINED) {
      expect(refused).not.toContain(o.id);
      expect(ourGap(o)).toBe("unread");
      expect(mayBid(o)).toBe(false);
      // The date cut and the quoting status still remove rows, and both are
      // counted on their own ledger line — so this asserts the ones that
      // survive both, rather than the whole fixture.
      if (rowIds.includes(o.id)) expect(gapNote(o)?.gap).toBe("unread");
    }
  });
});

describe("the '0' sentinel", () => {
  it("is read as UNKNOWN and never as a code, on either half", () => {
    // DLA writes `0` for "no code assigned". Acquisition method runs 1-5 and
    // the suffix is a letter, so a zero in either half is an absence wearing a
    // value's clothes. Reading it as a code once refused an order she was very
    // probably eligible for.
    expect(SENTINEL.length).toBeGreaterThan(0);
    for (const o of SENTINEL) {
      expect(codesKnown(o)).toBe(false);
      expect(mayBid(o)).toBe(false);
    }
  });

  it("refuses the board on a '0' METHOD even when the suffix is open", () => {
    // The one shape that isolates the method rule. Everything else about these
    // orders says "biddable"; only `'0'` does not, and only this assertion
    // notices if that stops being read as an absence.
    expect(SENTINEL_METHOD_ONLY.length).toBeGreaterThan(0);
    for (const o of SENTINEL_METHOD_ONLY) {
      expect(["G", "Z"]).toContain(o.amsc?.trim().toUpperCase());
      expect(codesKnown(o)).toBe(false);
      expect(mayBid(o)).toBe(false);
    }

    // ON THE BOARD SINCE DH-34, AND STILL NOT PERMITTED. The row exists; the
    // verdict does not. `mayBid()` above is the assertion that matters, and
    // this one says the row that carries it names our gap rather than staying
    // silent — an unmarked row is the absence of a warning doing a verdict's
    // work.
    const rowIds = board(LIVE_MAPPED_ORDERS).rows.map((o) => o.id);
    for (const o of SENTINEL_METHOD_ONLY) {
      if (rowIds.includes(o.id)) expect(gapNote(o)?.gap).toBe("unread");
    }
  });

  it("refuses the board on a '0' SUFFIX even when the method is real", () => {
    expect(SENTINEL_SUFFIX_ONLY.length).toBeGreaterThan(0);
    for (const o of SENTINEL_SUFFIX_ONLY) {
      expect(["1", "2", "3", "4", "5"]).toContain(o.amc?.trim());
      expect(codesKnown(o)).toBe(false);
      expect(mayBid(o)).toBe(false);
    }

    const rowIds = board(LIVE_MAPPED_ORDERS).rows.map((o) => o.id);
    for (const o of SENTINEL_SUFFIX_ONLY) {
      if (rowIds.includes(o.id)) expect(gapNote(o)?.gap).toBe("unread");
    }
  });

  it("survives the backend UNCHANGED, so the two layers cannot disagree", () => {
    // The mapper passes `'0'` through rather than translating it to null. "DLA
    // assigned no code" and "we hold no record" are different facts, and only
    // this surface owns the readability test. An order that reached here as
    // `null` would have lost the first fact on the way.
    for (const o of SENTINEL) {
      expect(o.amc === NO_CODE_ASSIGNED || o.amsc === NO_CODE_ASSIGNED).toBe(true);
    }
  });

  it("never joins the named-refusal list, whatever else it joins", () => {
    // The list she reaches through "Ones not open to you" is DLA's refusal and
    // nothing else. A sentinel there would tell her DLA refused her over a code
    // DLA never assigned.
    const result = board(LIVE_MAPPED_ORDERS);
    const refused = result.restricted.map((o) => o.id);

    for (const o of SENTINEL) {
      expect(refused).not.toContain(o.id);
      expect(ourGap(o)).toBe("unread");
    }
  });
});

describe("queryOrders over the joined corpus, with an empty member", () => {
  const result = board(LIVE_MAPPED_ORDERS);

  it("puts orders on the biddable board", () => {
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("puts ONLY an open pair on it WITH A VERDICT", () => {
    // The governing rule, as an assertion over the served rows. Every row is
    // one of exactly two things and there is no third: an order `mayBid()`
    // admits, carrying an open pair, or an order carrying one of OUR two gaps
    // and no verdict at all. A row that is neither has reached the board on a
    // basis nothing in this file can name, and fails here.
    for (const o of result.rows) {
      if (gapNote(o) != null) {
        expect(mayBid(o)).toBe(false);
        continue;
      }
      expect(codesKnown(o)).toBe(true);
      expect(mayBid(o)).toBe(true);
      expect(["1", "2"]).toContain(o.amc?.trim());
      expect(["G", "Z"]).toContain(o.amsc?.trim().toUpperCase());
    }
  });

  it("puts BOTH gaps on the board and keeps them apart", () => {
    // The two facts DH-34 moved. They travel together and they are not the
    // same sentence: one is a code that never reached us, the other is a code
    // that did and that we hold no ruling for. Both populated here, which is
    // what makes the two notes worth telling apart.
    const rows = result.rows;

    expect(rows.filter((o) => ourGap(o) === "unread").length).toBeGreaterThan(0);
    expect(rows.filter((o) => ourGap(o) === "unruled").length).toBeGreaterThan(0);
    for (const o of rows.filter((o) => ourGap(o) === "unread")) expect(codesKnown(o)).toBe(false);
    for (const o of rows.filter((o) => ourGap(o) === "unruled")) {
      expect(codesKnown(o)).toBe(true);
      expect(restrictionOf(o)?.route).toBe("unknown");
    }
  });

  it("says on the ROW itself that we could not rule on it", () => {
    // NOT THE ABSENCE OF A WARNING. A row reaching the board with an ordinary
    // reason line beside it reads as an order like any other, and the note one
    // tap away is not on the screen where she decides whether to tap. The
    // sentence is the tier's own headline, so the row and the page she lands
    // on say the same thing (`D-E4`), and it wins over every other reason —
    // her record, the year-of-orders fact and the category line all describe
    // an order she may or may not be allowed to sell.
    const gapped = result.rows.filter((o) => gapNote(o) != null);

    expect(gapped.length).toBeGreaterThan(0);
    for (const o of gapped) {
      expect(whyThisOrder(o, EMPTY_CONTEXT)).toBe(gapNote(o)?.card);
      expect(whyThisOrder(o, EMPTY_CONTEXT)).not.toBe("");
    }
    // And no row she may bid borrows one of those sentences.
    for (const o of result.rows.filter((x) => mayBid(x))) {
      expect(whyThisOrder(o, EMPTY_CONTEXT)).not.toMatch(/who may sell this one/i);
    }
  });

  it("names every refusal it holds back, and holds back nothing else", () => {
    // `restricted` is a VERDICT and since DH-34 it is only a verdict — we read
    // the codes and they refuse her, with a route we can name or a dead end we
    // can state. `unreadable` is empty because nothing is held for an unread
    // code any more.
    expect(result.restricted.length).toBeGreaterThan(0);
    expect(result.unreadable).toEqual([]);
    for (const o of result.restricted) {
      expect(codesKnown(o)).toBe(true);
      expect(["sar", "none"]).toContain(restrictionOf(o)?.route);
    }
  });

  it("accounts for every scoped order exactly once", () => {
    // The board, the named refusal and the admitted gap never overlap: an order
    // in two of them is double-counted on the ledger.
    const ids = [...result.rows, ...result.restricted, ...result.unreadable].map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);

    // And nothing falls between them. EVERY scoped order is on the board, on
    // the named-refusal list, or on her own filter's line — and that is the
    // whole sum now (owner, 2026-09-16). The cap and the quoting status used
    // to take a term each: the cap marks a row instead of taking it, and the
    // server leaves a quoting status the board cannot use out of the corpus.
    // An order we could not classify is no longer subtracted either; it is a
    // row like any other.
    expect(
      result.rows.length + result.restricted.length + result.unreadable.length + result.filteredOut,
    ).toBe(result.considered);
    expect(result.considered).toBeGreaterThan(0);
    expect(result.uncategorised).toBe(0);
  });

  it("reads a code on most of the board but not on all of it", () => {
    // Not 1. An honest coverage figure over a corpus that includes orders we
    // could not read must be short of complete, or it is not measuring them.
    expect(codeCoverage(result)).toBeGreaterThan(0);
    expect(codeCoverage(result)).toBeLessThan(1);
    // COUNTED OFF THE PREDICATE, NOT OFF `unreadable`. That array is empty
    // since DH-34, so subtracting it would make this assertion say
    // `readableCodes === considered` — a claim of perfect coverage over a
    // corpus that has none. `codesKnown()` is the fact coverage is about, and
    // it is counted over the pool `considered` counts: everything the date cut
    // kept. Nothing here is uncategorised (asserted above).
    expect(result.readableCodes).toBe(scoped(LIVE_MAPPED_ORDERS).filter(codesKnown).length);
    expect(result.readableCodes).toBeLessThan(result.considered);
  });

  it("still says the feed arrived — a board is not a broken pipe", () => {
    expect(result.feed).toBeGreaterThan(0);
    expect(result.feedArrived).toBe(true);
  });

  it("says something DIFFERENT when the fetch actually failed", () => {
    // The two states must not read the same on screen, so they must not read
    // the same here. `null` is a fetch that threw; `[]` is a feed that came
    // back empty; neither is the case above.
    const broken = board([]);
    expect(
      queryOrders({ filters: NO_FILTERS, sort: "best" }, EMPTY_CONTEXT, null, LIVE_AS_OF),
    ).toMatchObject({ feed: 0, feedArrived: false });
    expect(broken).toMatchObject({ feed: 0, feedArrived: true });
  });

  it("held back MORE than the board pool — the closing-date cut is real", () => {
    // `feed` is what arrived; `considered` is what survived the cut against the
    // corpus's own day. They differ here, which is what makes "the pipe is not
    // broken" a claim with content rather than a tautology over one number.
    expect(result.feed).toBeGreaterThan(result.considered);
  });
});

describe("mixed with the orders whose kind of part we could not read", () => {
  const result = board([...LIVE_MAPPED_ORDERS, ...LIVE_MAPPED_UNCATEGORISED]);

  it("still reconciles, and the unclassified line is subtracted from nothing", () => {
    // The orders we could not classify are ON the board now, so the same sum
    // holds over a mixed pool with no term for them.
    expect(result.uncategorised).toBeGreaterThan(0);
    expect(
      result.rows.length + result.restricted.length + result.unreadable.length + result.filteredOut,
    ).toBe(result.considered);
  });

  it("counts the unclassified line towards coverage as well as the codes", () => {
    // `readableCodes` counts an unclassified order as accounted-for, because it
    // is disclosed on its own ledger line. So coverage over a mixed pool is the
    // sum of both, and neither alone.
    expect(result.readableCodes).toBeGreaterThan(result.uncategorised);
    expect(result.readableCodes).toBe(
      scoped([...LIVE_MAPPED_ORDERS, ...LIVE_MAPPED_UNCATEGORISED]).filter(
        (o) => isUncategorised(o) || codesKnown(o),
      ).length,
    );
  });

  it("still refuses the VERDICT to everything we could not read", () => {
    // The direction-of-error rule, over a mixed pool. A row on the board is
    // either permitted or admitted, never both and never neither — and no row
    // we could not read is ever permitted.
    for (const o of result.rows) expect(mayBid(o) !== (gapNote(o) != null)).toBe(true);
    for (const o of result.rows.filter((x) => !codesKnown(x))) expect(mayBid(o)).toBe(false);
  });
});

describe("the For you tab holds only the orders she may bid by code", () => {
  const forYou = (orders: readonly MicroOrder[]): MicroResult =>
    queryOrders(
      { filters: NO_FILTERS, sort: "best", eligibleOnly: true },
      EMPTY_CONTEXT,
      [...orders],
      LIVE_AS_OF,
    );

  it("drops every order DLA refuses her and every order with no ruling", () => {
    const all = board(LIVE_MAPPED_ORDERS);
    // Named, so the case cannot pass over a board that held nothing to drop.
    expect(all.rows.some((o) => ourGap(o) != null)).toBe(true);

    const mine = forYou(LIVE_MAPPED_ORDERS);

    expect(mine.rows.length).toBeGreaterThan(0);
    expect(mine.rows.every(eligibleByCode)).toBe(true);
    expect(mine.rows.map((o) => o.id)).toEqual(all.rows.filter(eligibleByCode).map((o) => o.id));
  });

  it("never admits an order with no code, whatever else it carries", () => {
    expect(forYou(UNJOINED).rows).toEqual([]);
    expect(forYou(SENTINEL).rows).toEqual([]);
  });
});

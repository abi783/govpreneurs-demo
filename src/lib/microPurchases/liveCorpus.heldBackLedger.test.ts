/**
 * THE LEDGER RECONCILES, AND THE ORDERS ARE REACHABLE (D13).
 *
 * A board that shows some orders and holds others back is only defensible
 * because the held-back ones are not lost. Two obligations follow, and this
 * file is both of them:
 *
 *  1. **The number she is told is the number of orders there are.** Hunter's
 *     held-back line says "N need permission you do not have". N must be
 *     `result.restricted.length` — not a subtraction that happens to produce
 *     the same figure, which is the defect the list form was introduced to
 *     end: a board can say "2 need permission" over a destination holding
 *     neither of them and nothing catches it.
 *  2. **Every one of those orders is reachable.** `/small-orders/restricted`
 *     renders `[...restricted, ...unreadable]` through `groupByReason()`, and
 *     that function drops any row it can find no reason for. This asserts
 *     against the route's own exported grouping — not a copy of its rule —
 *     so the page and the count cannot come apart.
 *
 * ── WHAT DH-34 MOVED OUT OF THIS LEDGER ──────────────────────────────────
 *
 * The block used to carry TWO more lines: "N have a rule I do not know" and
 * "N do not say who may sell them". Both counted orders we could not rule on,
 * and both stated OUR shortcoming as a fact about the order. Those orders are
 * on the board now, so a held-back line over them would be false about a row
 * she is looking at, and the ledger drops both. `unreadable` empties with them.
 *
 * **The completeness promise survives the move, which is what this file now
 * checks.** Every scoped order still lands somewhere she can see: on the list,
 * on the restricted page, or on a named ledger line. Nothing falls between.
 *
 * The two gaps did not merge on the way out. An order whose stock number joined
 * to no record and an order whose record carries DLA's `'0'` are both `unread`;
 * a letter we hold no ruling for is `unruled`. Each is pinned below.
 */
import { describe, it, expect } from "vitest";
import {
  EMPTY_CONTEXT,
  NO_CODE_REASON,
  NO_FILTERS,
  codesKnown,
  gapNote,
  heldBack,
  notOpenToYou,
  ourGap,
  queryOrders,
} from "./relevance";
import { LIVE_AS_OF, LIVE_MAPPED_ORDERS, LIVE_UNJOINED_IDS } from "./liveMapperOutput.fixture";
import { groupByReason } from "../../routes/small-orders.restricted";

const result = queryOrders(
  { filters: NO_FILTERS, sort: "best" },
  EMPTY_CONTEXT,
  [...LIVE_MAPPED_ORDERS],
  LIVE_AS_OF,
);

/** The two lines DH-34 removed, in every spelling they ever had. Kept as a
 *  pattern rather than deleted, because "the ledger no longer says this" is
 *  the assertion — and a line that came back would come back verbatim. */
const GAP_LINES =
  /^(\d+) (?:does not say who may sell it|do not say who may sell them|has a rule I do not know|have a rule I do not know)$/;

/** The line about orders DLA's own codes refuse her. A different fact. */
const REFUSED_LINE = /^(\d+) (?:needs|need) permission you do not have$/;

/** DLA's "no code assigned". Not a value, and never rendered as one. */
const NO_CODE_ASSIGNED = "0";

/** The words the page heads the admitted gap with, in its plural spelling.
 *  The heading is the discriminator because `route` is not: the no-code group
 *  and the unruled-letter group share `"unknown"`. */
const NO_CODE_HEAD_STEM = "No acquisition code available at source";

describe("Hunter's held-back ledger over the joined corpus", () => {
  const lines = heldBack(result);

  it("no longer claims to have held back an order she can reach", () => {
    // THE MUTATION TARGET FOR THE LEDGER HALF OF DH-34. Both gap lines counted
    // orders that are on the board now, under a heading reading "These are the
    // ones I did not show you."
    expect(result.rows.filter((o) => ourGap(o) != null).length).toBeGreaterThan(0);
    expect(lines.filter((l) => GAP_LINES.test(l))).toEqual([]);
  });

  it("says the NAMED refusal on its own line, and counts `restricted` exactly", () => {
    // ONE OWNER FOR THE NUMBER. The line she taps from and the page she lands
    // on count the same array, so they cannot drift.
    const refused = lines.map((l) => REFUSED_LINE.exec(l)).find((m) => m !== null);

    expect(result.restricted.length).toBeGreaterThan(0);
    expect(refused).not.toBeUndefined();
    expect(Number(refused?.[1])).toBe(result.restricted.length);
    expect(notOpenToYou(result)).toBe(result.restricted.length);
  });

  it("accounts for every scoped order, on a list or on a line", () => {
    // The completeness promise, restated for the wider board. An order the
    // ledger stopped naming must be REACHABLE instead, never neither — and
    // since 2026-09-16 that is true of four more kinds of order, so the sum
    // has two terms: what she can reach, and what DLA or her own filter took.
    expect(result.rows.length + result.restricted.length + result.filteredOut).toBe(
      result.considered,
    );
  });

  it("claims no permission refusal over an order it could not read", () => {
    // Every row on the named-refusal list must have READABLE codes. A row
    // without them there would be a verdict we hold no evidence for.
    for (const o of result.restricted) expect(codesKnown(o)).toBe(true);
    expect(result.unreadable).toEqual([]);
  });
});

describe("what our own gap is actually made of", () => {
  // Taken over the CORPUS, not over `rows`. The quoting-status cut and the cap
  // still remove rows and both are named on their own ledger line, so a shape
  // that happens to be Pending today would otherwise drop out of these
  // assertions and take the guarantee with it.
  const gapped = LIVE_MAPPED_ORDERS.filter((o) => ourGap(o) != null);

  it("carries the orders whose stock number joined to no record", () => {
    // The rule that survives the join: no record, no code, no verdict. These
    // orders are the 2.5% and they are on her board now, not filled in with a
    // guess and not withheld as if DLA had refused them. The fixture NAMES
    // them — an order that joined to a record holding no code carries the same
    // nulls and is a different fact.
    const unjoined = gapped.filter((o) => LIVE_UNJOINED_IDS.includes(o.id));

    expect(unjoined.length).toBeGreaterThan(0);
    for (const o of unjoined) {
      expect(o.amc).toBeNull();
      expect(o.amsc).toBeNull();
      expect(gapNote(o)?.gap).toBe("unread");
    }
    // And not one of them reached the named-refusal list.
    const refused = result.restricted.map((o) => o.id);
    for (const id of LIVE_UNJOINED_IDS) expect(refused).not.toContain(id);
  });

  it("carries the orders whose record holds DLA's '0' on either half", () => {
    // `'0'` reached this layer UNCHANGED from the backend and is read as
    // unknown here. It is our gap, never a refusal.
    const sentinel = gapped.filter(
      (o) => o.amc === NO_CODE_ASSIGNED || o.amsc === NO_CODE_ASSIGNED,
    );

    expect(sentinel.length).toBeGreaterThan(0);
    // Both one-sided shapes are among them. A record carrying `'0'` beside a
    // readable OPEN suffix is the one that would otherwise look biddable.
    expect(sentinel.some((o) => o.amc === NO_CODE_ASSIGNED && o.amsc !== NO_CODE_ASSIGNED)).toBe(
      true,
    );
    expect(sentinel.some((o) => o.amsc === NO_CODE_ASSIGNED && o.amc !== NO_CODE_ASSIGNED)).toBe(
      true,
    );

    const refused = result.restricted.map((o) => o.id);
    for (const o of sentinel) {
      expect(refused).not.toContain(o.id);
      expect(gapNote(o)?.gap).toBe("unread");
    }
  });

  it("keeps the unruled letters as a SECOND fact with a second sentence", () => {
    // The distinction the note must not collapse. We never looked at the first
    // group's codes; we looked at these and hold no ruling. One sentence over
    // both would tell her we looked and failed on an order we never fetched.
    const unruled = gapped.filter((o) => ourGap(o) === "unruled");
    const unread = gapped.filter((o) => ourGap(o) === "unread");

    expect(unruled.length).toBeGreaterThan(0);
    expect(unread.length).toBeGreaterThan(0);
    for (const o of unruled) expect(codesKnown(o)).toBe(true);
    expect(gapNote(unruled[0])?.body).not.toBe(gapNote(unread[0])?.body);
  });
});

describe("/small-orders/restricted, the destination that line points at", () => {
  // The pool the route builds, verbatim from its own useMemo. `unreadable` is
  // empty since DH-34 and the spread is kept exactly as the route writes it,
  // so this file keeps testing what that page renders rather than what this
  // file thinks it renders.
  const groups = groupByReason([...result.restricted, ...result.unreadable]);

  it("renders every held-back order and drops none of them", () => {
    const rendered = groups.flatMap((g) => g.rows.map((o) => o.id));
    const expected = [...result.restricted, ...result.unreadable].map((o) => o.id);

    expect(rendered.slice().sort()).toEqual(expected.slice().sort());
  });

  it("has rows at all — the page stopped being empty when the categories were read", () => {
    // Asserted here against the real `queryOrders()` and the real
    // `groupByReason()` rather than mirrored in a backend spec (R3-D1). Before
    // the Federal Supply Group table existed every order mapped to `'other'`,
    // so `queryOrders()` left all of them in `uncategorised`, the board pool
    // was empty, and so was this page.
    //
    // THE POOL NO LONGER EMPTIES (owner, 2026-09-16). An order we could not
    // classify is ruled on its CODES like any other, so a wholly unclassified
    // corpus fills the board and this page instead of losing every row.
    const uncategorised = queryOrders(
      { filters: NO_FILTERS, sort: "best" },
      EMPTY_CONTEXT,
      LIVE_MAPPED_ORDERS.map((o) => ({ ...o, category: "other" as const })),
      LIVE_AS_OF,
    );
    expect(uncategorised.uncategorised).toBe(uncategorised.considered);
    expect(uncategorised.rows.length + uncategorised.restricted.length).toBe(
      uncategorised.considered,
    );

    expect(groups.flatMap((g) => g.rows).length).toBeGreaterThan(0);
  });

  it("no longer heads a group with either of our two gaps", () => {
    // THE PAGE IS DLA'S REFUSAL AND NOTHING ELSE NOW. It used to head a group
    // "I have no code saying who may sell these" — our data gap, filed on a
    // page titled "Ones not open to you" — and another reading "I am not sure
    // who may sell these". Both are on the board instead.
    // Matched on the HEADING's stem, which is what she reads. `route` cannot
    // tell these apart: both gap groups sent her to `"unknown"`, because on
    // both the next step is a human.
    expect(groups.filter((g) => g.head.includes(NO_CODE_HEAD_STEM))).toEqual([]);
    expect(groups.filter((g) => g.route === NO_CODE_REASON.route)).toEqual([]);
    expect(groups.length).toBeGreaterThan(0);
  });

  it("gives every named refusal a reason that is NOT the no-code one", () => {
    // A refusal we can name gets its own group — a Source Approval Request, a
    // mentor, or a dead end stated as one. Routing it through the no-code group
    // would say we could not read a code we read perfectly well.
    const named = groups.filter((g) => !g.head.includes(NO_CODE_HEAD_STEM));

    expect(named.length).toBeGreaterThan(0);
    for (const group of named) {
      for (const o of group.rows) expect(codesKnown(o)).toBe(true);
    }
  });
});

/**
 * THE HEADING OVER A GROUP OF TWO IS WRITTEN IN THE PLURAL, THE SENTENCE UNDER
 * IT AGREES WITH IT, AND EVERY PLURAL ON THE PAGE HAS A PRODUCER.
 *
 * `restrictionOf()` writes about ONE order. `/small-orders/restricted` heads a
 * group with that sentence, so every new tier in `relevance.ts` arrives on this
 * page in the singular and stays there until somebody notices. Three did: the
 * contradictory code pair, and the two dead ends the buying method closes. No
 * count is quoted here for how many rows a member met under one of those
 * headings — the sizes were measured on a live board page this file cannot
 * reach, and a group's size moves with the corpus anyway.
 *
 * THE PAIRS ARE TAKEN FROM `queryOrders()`, NOT FROM `restrictionOf()`. The
 * page renders `MicroResult.restricted` and nothing else, and that pool is
 * narrower than the ruling function: an order carrying one of our own two gaps
 * gets a restriction with the `unknown` route and goes on the BOARD instead. A
 * list keyed on `restrictionOf()` alone therefore holds plurals for groups the
 * page cannot form, which is how three dead entries survived DH-34. Reading the
 * pool the route reads is what makes `every entry has a producer` checkable.
 *
 * `liveCorpus.heldBackLedger.test.ts` also runs `groupByReason()`. It checks
 * which orders land in which group and never reads a heading's number.
 */
import { describe, it, expect } from "vitest";
import {
  EMPTY_CONTEXT,
  NO_FILTERS,
  queryOrders,
  restrictionOf,
} from "../lib/microPurchases/relevance";
import { MICRO_ORDERS } from "../lib/mock/microPurchaseOrders";
import type { MicroOrder } from "../lib/microPurchases/order";
import { GROUP_BODY, GROUP_HEAD, groupByReason } from "./small-orders.restricted";

/** Any order will do — the page's pool and `groupByReason()` read the two
 *  acquisition codes off a row. `closesOn: null` keeps the closing-date cut out
 *  of an enumeration that is about codes, and `quantity: 1` keeps the row under
 *  the micro-purchase cap, so an order that reaches the BOARD is visible in
 *  `MicroResult.rows` rather than counted off it. */
const BASE: MicroOrder = { ...MICRO_ORDERS[0], closesOn: null, quantity: 1 };

const METHODS = ["1", "2", "3", "4", "5"];
const SUFFIXES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** Words that can only be true of one order. A heading over two rows carrying
 *  one of these is the defect this file exists for.
 *
 *  "this part" JOINED THE LIST WITH DH-35. It was held out because the three
 *  sentences behind "DLA is not taking new sellers for these" each said it and
 *  had no plural, so the rule would have failed on a gap that was open on
 *  purpose. Those three carry plurals now, so the rule is true of every body
 *  the page can render, and a fourth dead-end sentence arriving without one
 *  fails here rather than standing over thirty rows saying "this part". */
const SINGULAR_WORDS = ["this one", "this order", "this part"];

/** N orders carrying one acquisition-code pair, each with its own id. */
function pair(amc: string | null, amsc: string | null, n: number): MicroOrder[] {
  return Array.from({ length: n }, (_, i) => ({ ...BASE, id: `${amc}${amsc}-${i}`, amc, amsc }));
}

/** The single group `n` identical orders make, or `null` when the pair never
 *  reaches this page at all. */
function groupOf(amc: string | null, amsc: string | null, n: number) {
  const groups = groupByReason(pair(amc, amsc, n));
  if (groups.length === 0) return null;
  expect(groups).toHaveLength(1);
  return groups[0];
}

/** Every method x letter pair, plus the row that carries no codes at all. */
const ALL_PAIRS: { amc: string | null; amsc: string | null }[] = [
  ...METHODS.flatMap((amc) => SUFFIXES.map((amsc) => ({ amc, amsc }))),
  { amc: null, amsc: null },
];

/** One order per pair, put through the same query the route calls. */
const SWEEP = queryOrders(
  { filters: NO_FILTERS, sort: "best" },
  EMPTY_CONTEXT,
  ALL_PAIRS.flatMap(({ amc, amsc }) => pair(amc, amsc, 1)),
);

/** The pairs the page can hold — `MicroResult.restricted`, which is what the
 *  route's own memo renders. */
const RESTRICTED_PAIRS = SWEEP.restricted.map((o) => ({ amc: o.amc, amsc: o.amsc }));

/** The singular headline and body of every reason the page can render. */
const PRODUCED = SWEEP.restricted.map((o) => restrictionOf(o)!);

describe("every heading the code can emit has a plural", () => {
  it("finds pairs to rule on at all", () => {
    // Without this the cases below pass over an empty list. Every one of them is
    // driven by the pool above, so a change that emptied it would read as green.
    expect(RESTRICTED_PAIRS.length).toBeGreaterThan(0);
  });

  it("heads a group of two with a plural, on every pair the page can hold", () => {
    // TWO ASSERTIONS, and the first is the one that catches a NEW tier. A
    // heading that survives the group unchanged is a headline written about one
    // order standing over two. The word list alone missed exactly that case:
    // "DLA is buying this commercial part from one supplier." says neither
    // "this one" nor "this order", so removing its plural failed no test until
    // this line was added.
    for (const { amc, amsc } of RESTRICTED_PAIRS) {
      const head = groupOf(amc, amsc, 2)?.head ?? "";
      const singular = restrictionOf({ ...BASE, amc, amsc })!.headline;
      expect(`${amc}${amsc}: ${head}`).not.toBe(`${amc}${amsc}: ${singular.replace(/\.$/, "")}`);
      for (const word of SINGULAR_WORDS) {
        expect(`${amc}${amsc}: ${head}`).not.toContain(word);
      }
    }
  });

  it("keeps the singular over a group of one", () => {
    // The other direction, and it is the same defect. A group of one is
    // ordinary here — a letter can be the only one of its kind on the board.
    for (const { amc, amsc } of RESTRICTED_PAIRS) {
      const one = groupOf(amc, amsc, 1);
      const singular = restrictionOf({ ...BASE, amc, amsc })!;
      expect(one?.head).toBe(singular.headline.replace(/\.$/, ""));
      expect(one?.body).toBe(singular.body);
    }
  });
});

describe("the sentence under the heading agrees with it", () => {
  it("sends her to a mentor about THEM, never about this one", () => {
    // The body carries the next step, so a singular here is the sentence she
    // acts on. It is checked on the same words as the heading, and that list
    // now holds "this part" as well: the three sentences behind "DLA is not
    // taking new sellers for these" said it and had no plural until DH-35
    // wrote one. See SINGULAR_WORDS for why the word was held out until then.
    for (const { amc, amsc } of RESTRICTED_PAIRS) {
      const body = groupOf(amc, amsc, 2)?.body ?? "";
      for (const word of SINGULAR_WORDS) {
        expect(`${amc}${amsc}: ${body}`).not.toContain(word);
      }
    }
  });
});

describe("every plural has a producer", () => {
  // THE OTHER DIRECTION OF THE SWEEP ABOVE, and the reason DH-37 exists. The
  // sweep fails when a reason the page renders has no plural. It cannot fail
  // when a plural is kept for a reason the page can no longer render — and
  // DH-34 moved three whole tiers onto the board, leaving three headings and
  // three sentences here that nothing could produce. A dead entry is not
  // inert: it is copy nobody can see, so nobody can see it go wrong.

  it("every GROUP_HEAD key is a headline the page can render", () => {
    const headlines = new Set(PRODUCED.map((r) => r.headline));
    for (const key of Object.keys(GROUP_HEAD)) {
      expect(`GROUP_HEAD: ${key}`).toBe(headlines.has(key) ? `GROUP_HEAD: ${key}` : "no producer");
    }
  });

  it("every GROUP_BODY key is a sentence the page can render", () => {
    const bodies = new Set(PRODUCED.map((r) => r.body));
    for (const key of Object.keys(GROUP_BODY)) {
      expect(`GROUP_BODY: ${key}`).toBe(bodies.has(key) ? `GROUP_BODY: ${key}` : "no producer");
    }
  });

  it("holds nothing back for an unread code, so the page reads one pool", () => {
    // THE REMOVED SPREAD, PINNED. The route used to render
    // `[...restricted, ...unreadable]`, and it renders `restricted` alone now
    // because nothing can join the second pool — the sweep above includes a row
    // with no codes at all and that row is on the BOARD. Fill `unreadable`
    // again and this says so, rather than the page dropping its rows in silence.
    const codeless = (o: MicroOrder) => o.amc == null && o.amsc == null;

    expect(SWEEP.unreadable).toEqual([]);
    expect(SWEEP.restricted.some(codeless)).toBe(false);
    expect(SWEEP.rows.some(codeless)).toBe(true);
  });

  it("prints an acquisition code on every row it can show", () => {
    // The chip is rendered unconditionally, and this is why. The one reason
    // with an empty `code` is the no-code tier, which the pool above cannot
    // hold. Produce an empty chip again and the page would print a bare
    // element; this fails first.
    for (const r of PRODUCED) expect(r.code).not.toBe("");
  });
});

describe("the exact words of every plural, tier by tier", () => {
  // ONE CASE PER MAP ENTRY, and that is the point of the block rather than a
  // by-product. The two checks above are SHAPE checks — they catch a heading
  // that stayed singular and a body that still says "this one". Neither can
  // catch a body whose singular reads acceptably in both numbers, so deleting
  // the Source-Approval plural failed nothing until these cases existed. Every
  // entry in both maps is now named here with its words, so deleting any one of
  // them fails a test that says which.
  //
  // The words themselves matter too: a member reads them, and a gate on shape
  // alone would pass over a plural that says the wrong thing.

  it("the approved-sellers group of two reads as a plural", () => {
    const g = groupOf("1", "C", 2);
    expect(g?.head).toBe("Only approved sellers can quote these");
    expect(g?.body).toBe(
      "The form is called a Source Approval Request. DLA only approves sellers who have made or supplied these parts before. The full drawings also work.",
    );
  });

  it("the limited-competition group of two reads as a plural, and names no form", () => {
    // Its own group, its own heading, its own next step. The tier above it ends
    // in a Source Approval Request; this one ends in no form, because
    // 2-201.2(q) names no procedure by which another seller qualifies. A member
    // meeting both must be able to tell them apart.
    const g = groupOf("1", "Q", 2);
    expect(g?.head).toBe("DLA is only asking the sellers it already has for these");
    expect(g?.body).toBe(
      "DLA is asking more than one seller for a price on each of these parts. The government does not have the data or the rights another seller would need. So it cannot add a seller to these orders. There is no form for them.",
    );
    expect(g?.head).not.toBe("Only approved sellers can quote these");
    expect(g?.body).not.toMatch(/Source Approval Request/i);
  });

  it("the qualified-list group of two reads as a plural, and names the route", () => {
    // Its own group again, between the two above it. C ends in a form, Q ends
    // in no route at all, and this one ends in a qualified products list — a
    // real route, and one that runs longer than the order in front of her.
    const g = groupOf("1", "T", 2);
    expect(g?.head).toBe("Only sellers on DLA's qualified lists can quote these");
    expect(g?.body).toBe(
      "A qualified products list names the sellers DLA may buy a part from. DLA buys only from a seller on that list, or from one qualified for listing by the time it awards. A seller gets on the list by qualifying the part with the government first. That takes longer than these orders allow, so it is a step toward later ones. Ask your mentor before you spend time on these.",
    );
    expect(g?.head).not.toBe("Only approved sellers can quote these");
    expect(g?.body).not.toMatch(/Source Approval Request/i);
  });

  // THE GAP DH-32 PINNED HERE IS CLOSED, AND THIS IS WHAT REPLACED THE PIN.
  // One heading — "DLA is not taking new sellers for these" — stands over THREE
  // sentences, because DLA gives three different reasons for refusing. DH-32
  // asserted that a group of two rendered the singular VERBATIM, so that
  // whoever wrote a plural had to take the copy decision on purpose rather than
  // fill a gap in passing. DH-35 took it: each sentence is a fact about ONE
  // part's drawings, so over a group every noun goes plural and no claim
  // widens. The three cases below are the same shape as the pin they replace —
  // exact words, one case per map entry, so deleting one fails a test that
  // says which.

  it("the named-companies group of two reads as a plural", () => {
    const g = groupOf("1", "B", 2);
    expect(g?.head).toBe("DLA is not taking new sellers for these");
    expect(g?.body).toBe(
      "The drawings for these parts name the companies that may make them. The government does not have the information to add another company. It cannot accept another part in place of any of these either.",
    );
  });

  it("the no-description group of two reads as a plural", () => {
    // Under a buying method that names one company. This letter never reaches
    // this page beside method 1 or 2 — Exhibit I does not allow that pair, so
    // those rows are a data error and DH-34 put them on the board.
    const g = groupOf("3", "D", 2);
    expect(g?.head).toBe("DLA is not taking new sellers for these");
    expect(g?.body).toBe(
      "The government cannot get the information another company would need to make these parts. It cannot write a good enough description of them either. So it cannot add new sellers.",
    );
  });

  it("the rights-not-owned group of two reads as a plural, one sentence for both letters", () => {
    // TWO LETTERS, ONE SENTENCE, ONE PLURAL. The two codes are different facts
    // about the drawings — one says the government holds the data but not the
    // rights, the other says it holds neither — and relevance.ts gives them one
    // member-facing sentence because both end her afternoon the same way. DH-35
    // kept that decision, so both letters must land on the same plural. Split
    // the sentence in two and one of these fails.
    const plural =
      "The government does not own the rights to the drawings for these parts. It cannot buy those rights at a fair price. So it cannot add new sellers.";
    expect(groupOf("1", "P", 2)?.body).toBe(plural);
    expect(groupOf("1", "R", 2)?.body).toBe(plural);
    expect(groupOf("1", "P", 2)?.head).toBe("DLA is not taking new sellers for these");
  });

  it("the commercial-part group of two reads as a plural, one supplier EACH", () => {
    // "from one supplier each", not "from one supplier": the record says one
    // supplier per part, and the shorter wording would claim a single company
    // supplying the whole group.
    const g = groupOf("3", "Z", 2);
    expect(g?.head).toBe("DLA is buying these commercial parts from one supplier each");
    expect(g?.body).toBe(
      "These parts are sold as commercial products. But DLA's codes say one supplier is available for each order, so DLA is buying from those suppliers. It is not asking other sellers for a price.",
    );
  });

  it("the single-supplier group of two reads as a plural, one supplier EACH", () => {
    const g = groupOf("3", "H", 2);
    expect(g?.head).toBe("Only one supplier can fill each of these");
    expect(g?.body).toBe(
      "DLA's codes say one supplier is available for each of these parts. DLA is buying from those suppliers and is not asking other sellers for a price.",
    );
  });
});

// Ava's three pages — the rules the pages promise, checked on every sample bid.
//
//   bun test src/lib/ava
//
// Page 2 and page 3 count the same things: an open ask, a promise to approve
// and the price to approve are one row each, so "needs you" on page 2 and
// "items on page 2" on page 3 equal buildingItems() in every state. Items the
// buyer needs only at award never hold the bid.

import { describe, expect, test } from "vitest";
import { exactChecks } from "./checks";
import { bidDecision, effectiveBid, visibleAsks } from "./derive";
import { AVA_BIDS } from "./fixtures";
import { cumberlandBid } from "./fixtures/cumberland";
import { fayettevilleBid } from "./fixtures/fayetteville";
import { mackallBid, mackallSeed } from "./fixtures/mackall";
import {
  GROUPS,
  ITEM_ACTIONS,
  SECTION_OWNERS,
  buildSteps,
  complianceItems,
  fillCount,
  itemAction,
  knockOutSummary,
  needsYouNow,
  notStatedCount,
  readiness,
  redFlags,
  scopeSections,
  sectionKey,
  sectionSummary,
  type ComplianceItem,
} from "./pages";
import { deliveryCheck, linePrices, sheetTotal } from "./price";
import { buildingItems } from "./status";
import { emptyState, type BidState } from "./store";
import { completeState } from "./testLab";
import type { AvaBid } from "./types";

const BIDS = Object.values(AVA_BIDS);

function confirmed(): BidState {
  return { ...emptyState(), started: true, briefConfirmed: true };
}

/** A state halfway through: every other visible ask answered as the lab would. */
function halfway(bid: AvaBid): BidState {
  const full = completeState(bid);
  const s = confirmed();
  const ids = visibleAsks(bid, s).map((a) => a.id);
  const answers: BidState["answers"] = {};
  ids.forEach((id, i) => {
    if (i % 2 === 0 && full.answers[id]) answers[id] = full.answers[id];
  });
  return { ...s, answers };
}

function items(bid: AvaBid, s: BidState): ComplianceItem[] {
  return complianceItems(effectiveBid(bid, s), s);
}

describe("page 2: compliance and inputs", () => {
  for (const bid of BIDS) {
    const states: [string, BidState][] = [
      ["nothing answered", confirmed()],
      ["halfway", halfway(bid)],
      ["complete", completeState(bid)],
    ];
    for (const [name, s] of states) {
      test(`${bid.noticeId}, ${name}: "needs you" equals the building count`, () => {
        const eff = effectiveBid(bid, s);
        expect(needsYouNow(items(bid, s)).length).toBe(buildingItems(eff, s));
      });

      // The closed section headers each say how many need her. Grouped either
      // way, they add up to the number at the top, and no row falls outside a
      // section the page shows.
      test(`${bid.noticeId}, ${name}: the sections' "need you" counts add up to "needs you"`, () => {
        const rows = items(bid, s);
        // Grouped by what she does, too: every row in one group, and the
        // groups' "need you" counts add up.
        const acts = ITEM_ACTIONS.map((g) => g.id as string);
        for (const r of rows) expect(acts).toContain(itemAction(bid, r));
        const byAction = acts.reduce(
          (n, k) => n + sectionSummary(rows.filter((r) => itemAction(bid, r) === k)).needYou,
          0,
        );
        expect(byAction).toBe(needsYouNow(rows).length);
        for (const by of ["topic", "owner"] as const) {
          const keys =
            by === "topic"
              ? GROUPS.map((g) => g.id as string)
              : SECTION_OWNERS.map((o) => `owner:${o}`);
          for (const r of rows) expect(keys).toContain(sectionKey(r, by));
          const total = keys.reduce(
            (n, k) => n + sectionSummary(rows.filter((r) => sectionKey(r, by) === k)).needYou,
            0,
          );
          expect(total).toBe(needsYouNow(rows).length);
        }
      });
    }

    test(`${bid.noticeId}: every row has one kind, and the kind tabs add up`, () => {
      const rows = items(bid, confirmed());
      const byKind = ["knock-out", "required", "scored", "after-award"].map(
        (k) => rows.filter((r) => r.kind === k).length,
      );
      expect(byKind.reduce((a, b) => a + b, 0)).toBe(rows.length);
    });

    test(`${bid.noticeId}: every row sits in a known group and has a source`, () => {
      const known = new Set(GROUPS.map((g) => g.id));
      const bad = items(bid, confirmed()).filter((r) => !known.has(r.group) || !r.source);
      expect(bad.map((r) => r.id)).toEqual([]);
    });

    test(`${bid.noticeId}: row ids are unique`, () => {
      const ids = items(bid, confirmed()).map((r) => r.id);
      expect(ids.length).toBe(new Set(ids).size);
    });
  }

  test("Cumberland: the insurance certificate is needed at award and does not hold the bid", () => {
    const rows = items(cumberlandBid, confirmed());
    const ins = rows.find((r) => r.askId === "ask-insurance");
    expect(ins?.kind).toBe("after-award");
    expect(ins?.holdsBid).toBe(false);
    expect(needsYouNow(rows).some((r) => r.askId === "ask-insurance")).toBe(false);
    // The check notes it, but as Minor: it never blocks.
    const f = exactChecks(effectiveBid(cumberlandBid, confirmed()), confirmed()).findings.find(
      (x) => x.id === "req:req-insurance",
    );
    expect(f?.severity).toBe("minor");
  });

  test("a failed knock-out reads Can't meet", () => {
    const s: BidState = {
      ...confirmed(),
      answers: { "ask-prebid": { status: "done", at: "2026-05-07", choiceId: "prebid-no" } },
    };
    const row = items(cumberlandBid, s).find((r) => r.askId === "ask-prebid");
    expect(row?.status).toBe("cant-meet");
    expect(knockOutSummary(cumberlandBid, s).cantMeet).toBe(1);
  });

  test("an ask replaced by an allowed option reads Doesn't apply, and its replacement is open", () => {
    const s: BidState = {
      ...confirmed(),
      answers: {
        "ask-bid-bond": { status: "dont-have", at: "2026-05-07", optionId: "dh-cert-check" },
      },
      opened: { "ask-cert-check": true },
    };
    const rows = items(cumberlandBid, s);
    expect(rows.find((r) => r.askId === "ask-bid-bond")?.status).toBe("na");
    expect(rows.find((r) => r.askId === "ask-cert-check")?.status).toBe("need");
  });

  test("a question to the buyer never holds the bid", () => {
    const rows = items(fayettevilleBid, confirmed()).filter((r) => r.clarificationId);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => !r.holdsBid)).toBe(true);
  });

  test("the price row appears only once Ava can total the price", () => {
    expect(items(cumberlandBid, confirmed()).some((r) => r.id === "price")).toBe(false);
    const done = completeState(cumberlandBid);
    const row = items(cumberlandBid, done).find((r) => r.id === "price");
    expect(row?.status).toBe("have");
  });
});

describe("page 1: the scope", () => {
  for (const bid of BIDS) {
    test(`${bid.noticeId}: every sample bid has page 1 facts`, () => {
      expect(bid.overview).toBeDefined();
    });

    test(`${bid.noticeId}: a fact the files do not state shows as Not stated, never hidden`, () => {
      const secs = scopeSections(bid, confirmed());
      const overview = secs.find((x) => x.id === "contract");
      // No sample bid states an estimated value, so it must be listed as Not stated.
      expect(overview?.facts.some((f) => f.label === "Estimated value" && f.value === null)).toBe(
        true,
      );
      expect(secs.reduce((n, sec) => n + notStatedCount(sec), 0)).toBeGreaterThan(0);
    });

    test(`${bid.noticeId}: every stated fact with a label keeps its words`, () => {
      const empty = scopeSections(bid, confirmed())
        .flatMap((sec) => sec.facts)
        .filter((f) => f.value !== null && f.value.trim() === "");
      expect(empty).toEqual([]);
    });
  }

  test("Cumberland: the mandatory pre-bid conference is a red flag", () => {
    const flags = redFlags(cumberlandBid, confirmed());
    expect(flags.some((f) => f.id === "date:prebid")).toBe(true);
  });
});

describe("page 3: build and submit", () => {
  test("the evaluator read appears only when there is writing to read", () => {
    const ids = (bid: AvaBid) => buildSteps(bid, bid, confirmed()).map((x) => x.id);
    expect(ids(cumberlandBid)).not.toContain("evaluator");
    expect(ids(fayettevilleBid)).toContain("evaluator");
    expect(ids(cumberlandBid)).not.toContain("writing");
  });

  test("build comes before the checks, and the receipt is last", () => {
    const ids = buildSteps(fayettevilleBid, fayettevilleBid, confirmed()).map((x) => x.id);
    expect(ids.indexOf("writing")).toBeLessThan(ids.indexOf("checks"));
    expect(ids.indexOf("price")).toBeLessThan(ids.indexOf("checks"));
    expect(ids[ids.length - 1]).toBe("receipt");
  });

  test("readiness reads the same count as page 2", () => {
    const s = { ...emptyState(), ...mackallSeed } as BidState;
    const r = readiness(mackallBid, effectiveBid(mackallBid, s), s);
    const eff = effectiveBid(mackallBid, s);
    if (r.state === "not-ready") {
      expect(r.items).toBe(needsYouNow(complianceItems(eff, s)).length);
    } else {
      throw new Error(`expected not-ready, got ${r.state}`);
    }
  });

  test("a complete bid is ready to submit", () => {
    for (const bid of BIDS) {
      const s = completeState(bid);
      expect(readiness(bid, effectiveBid(bid, s), s).state).toBe("ready");
    }
  });
});

describe("price: contingency (Ava-Simplified step 23)", () => {
  // Only a bid with a price has a contingency.
  for (const bid of BIDS.filter((b) => b.price !== null)) {
    const ref = bid.price!.contingency;
    const withPct = (pct: number): BidState => {
      const full = completeState(bid);
      return {
        ...full,
        answers: {
          ...full.answers,
          [ref!.askId]: { status: "done", at: "2026-05-07", values: { [ref!.fieldId]: pct } },
        },
      };
    };

    test(`${bid.noticeId}: the price waits for the contingency answer`, () => {
      expect(ref).toBeDefined();
      const full = completeState(bid);
      const answers = { ...full.answers };
      delete answers[ref!.askId];
      const s = { ...full, answers };
      expect(sheetTotal(linePrices(effectiveBid(bid, s), s))).toBeNull();
    });

    test(`${bid.noticeId}: contingency is added to cost before profit`, () => {
      const none = linePrices(effectiveBid(bid, withPct(0)), withPct(0));
      const five = linePrices(effectiveBid(bid, withPct(5)), withPct(5));
      expect(none.every((p) => p.contingency === 0)).toBe(true);
      five.forEach((p, i) => {
        const base = (p.labor ?? 0) + (p.direct ?? 0) + (p.added ?? 0);
        expect(p.contingency).toBeCloseTo(((base + (p.overhead ?? 0)) * 5) / 100, 1);
        expect(p.unitPrice!).toBeGreaterThan(none[i].unitPrice!);
      });
    });
  }
});

describe("code review regressions", () => {
  const done = (extra: Partial<BidState["answers"][string]>) => ({
    status: "done" as const,
    at: "2026-05-07",
    ...extra,
  });

  test("a follow-up ask closes when the answer that opened it changes", () => {
    const opened: BidState = {
      ...confirmed(),
      answers: {
        "ask-bid-bond": { status: "dont-have", at: "2026-05-07", optionId: "dh-cert-check" },
      },
      opened: { "ask-cert-check": true },
    };
    expect(visibleAsks(cumberlandBid, opened).some((a) => a.id === "ask-cert-check")).toBe(true);
    // "Change this answer" clears the bond answer; the check ask must go with it.
    const changed: BidState = { ...opened, answers: {} };
    expect(visibleAsks(cumberlandBid, changed).some((a) => a.id === "ask-cert-check")).toBe(false);
  });

  test("a second failed knock-out keeps the bid paused after the first is fixed", () => {
    const s: BidState = {
      ...confirmed(),
      answers: {
        "ask-perf-letter": { status: "dont-have", at: "2026-05-07", optionId: "dh-perf-none" },
        "ask-prebid": done({ choiceId: "prebid-no" }),
      },
    };
    // Fixing the pre-bid answer leaves the performance bond failure standing.
    const fixed: BidState = { ...s, answers: { "ask-perf-letter": s.answers["ask-perf-letter"] } };
    expect(bidDecision(cumberlandBid, fixed)?.fromAskId).toBe("ask-perf-letter");
  });

  test("a certified check under 5% of the total reads Does not meet", () => {
    const full = completeState(cumberlandBid);
    const s: BidState = {
      ...full,
      answers: {
        ...full.answers,
        "ask-bid-bond": { status: "dont-have", at: "2026-05-07", optionId: "dh-cert-check" },
        "ask-cert-check": done({ values: { "check-amount": 1 } }),
      },
      opened: { "ask-cert-check": true },
    };
    const eff = effectiveBid(cumberlandBid, s);
    const row = complianceItems(eff, s).find((r) => r.askId === "ask-cert-check");
    expect(row?.status).toBe("fails");
    expect(row?.kind).toBe("knock-out");
  });

  test("an answer under a rule's floor reads Does not meet", () => {
    const s: BidState = {
      ...confirmed(),
      answers: {
        "ask-ref-3": done({
          values: {
            "ref3-meals": 50,
            "ref3-name": "A",
            "ref3-title": "B",
            "ref3-phone": "C",
            "ref3-email": "D",
          },
        }),
      },
    };
    const row = items(cumberlandBid, s).find((r) => r.askId === "ask-ref-3");
    expect(row?.status).toBe("fails");
  });

  test("the contingency is a reserve, not a cost", () => {
    const full = completeState(cumberlandBid);
    const ref = cumberlandBid.price!.contingency!;
    const withPct = (pct: number): BidState => ({
      ...full,
      answers: { ...full.answers, [ref.askId]: done({ values: { [ref.fieldId]: pct } }) },
    });
    const cost = (s: BidState) => deliveryCheck(effectiveBid(cumberlandBid, s), s).yearlyCost!;
    // Sales tax is charged on the whole price, so it grows with it; nothing else may.
    const tax = (s: BidState) =>
      linePrices(effectiveBid(cumberlandBid, s), s).reduce(
        (n, p) => n + (p.tax ?? 0) * p.line.qty!,
        0,
      );
    // Unit prices round to the cent, so allow up to 2 cents a unit across the year.
    const units = effectiveBid(cumberlandBid, full).price!.lines.reduce((n, l) => n + l.qty!, 0);
    const drift = cost(withPct(10)) - cost(withPct(0)) - (tax(withPct(10)) - tax(withPct(0)));
    expect(Math.abs(drift)).toBeLessThan(units * 0.02);
  });

  test("the forms step does not wait on a paper needed only at award", () => {
    const full = completeState(cumberlandBid);
    const answers = { ...full.answers };
    delete answers["ask-insurance"];
    const s = { ...full, answers };
    const forms = buildSteps(cumberlandBid, effectiveBid(cumberlandBid, s), s).find(
      (x) => x.id === "forms",
    );
    expect(forms?.tone).toBe("done");
  });
});

describe("the list: the filled count on the bar", () => {
  test("the total is every item, and the open ones are needsYouNow less the price", () => {
    for (const bid of BIDS) {
      for (const s of [confirmed(), halfway(bid), completeState(bid)]) {
        const rows = items(bid, s);
        const c = fillCount(rows);
        const open = needsYouNow(rows).filter((r) => r.id !== "price");
        expect(c.total).toBe(rows.length);
        expect(c.total - c.filled).toBe(open.length);
        expect(c.next === null).toBe(open.length === 0);
      }
    }
  });

  test("answering fills items", () => {
    for (const bid of BIDS) {
      const start = fillCount(items(bid, confirmed()));
      const mid = fillCount(items(bid, halfway(bid)));
      expect(mid.total - mid.filled).toBeLessThan(start.total - start.filled);
    }
  });

  test("once every answer is in, the count is full", () => {
    for (const bid of BIDS) {
      const c = fillCount(items(bid, completeState(bid)));
      expect(c.filled).toBe(c.total);
    }
  });

  test("a forwarded ask stays open until its answer comes back", () => {
    const bid = fayettevilleBid;
    const s0 = confirmed();
    const ask = needsYouNow(items(bid, s0)).find((r) => r.askId && r.owner !== "you")!;
    const forwarded: BidState = {
      ...s0,
      answers: { [ask.askId!]: { status: "forwarded", at: "2026-05-07T10:00:00Z" } },
    };
    expect(fillCount(items(bid, forwarded)).filled).toBe(fillCount(items(bid, s0)).filled);
  });
});

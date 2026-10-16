// The Small Orders sample is a story, so these checks hold its facts: who may
// bid what, that the pages for "Ones not open to you" have groups, that paging
// serves every order once, and that no real company or old-member word leaks in.

import { describe, expect, it } from "vitest";
import { mayBid } from "@/lib/microPurchases/relevance";
import { biddablePairsFromCensus, reasonGroupsFromCensus } from "@/lib/microPurchases/restrictedGroups";
import { daysUntil } from "@/demo/story/clock";
import { ORDERS, ORDER_META } from "./data";
import { categoryCounts, codeCensus, decodeCursor, feedPage, fitScores, pairOf } from "./feed";
import { initialMemberState } from "./memberState";
import { orderPaperPdf } from "./paper";
import { SUPPLIERS, supplierNames } from "./suppliers";
import { acquisitionCodeDocuments } from "./acquisitionCodes";

const open = ORDERS.filter((o) => mayBid(o));
const closed = ORDERS.filter((o) => !mayBid(o));

describe("the sample orders", () => {
  it("holds 14 orders Amira may bid and 6 she may not", () => {
    expect(ORDERS).toHaveLength(20);
    expect(open).toHaveLength(14);
    expect(closed).toHaveLength(6);
  });

  it("gives every order a unique id and solicitation number", () => {
    expect(new Set(ORDERS.map((o) => o.id)).size).toBe(ORDERS.length);
    expect(new Set(ORDERS.map((o) => o.solicitation)).size).toBe(ORDERS.length);
  });

  it("keeps every date in the future or the recent past, never a fixed day", () => {
    for (const o of ORDERS) {
      expect(daysUntil(o.postedOn)).toBeLessThanOrEqual(0);
      expect(daysUntil(o.postedOn)).toBeGreaterThanOrEqual(-10);
      expect(o.closesOn).not.toBeNull();
      expect(daysUntil(o.closesOn!)).toBeGreaterThanOrEqual(3);
      expect(daysUntil(o.closesOn!)).toBeLessThanOrEqual(30);
    }
  });

  it("reads the last price from the newest award", () => {
    for (const o of ORDERS) {
      const newest = o.awards[0];
      expect(o.lastPricePerUnit).toBe(newest?.unitCost ?? null);
      expect(o.lastPriceDate).toBe(newest?.awardedOn ?? null);
      const dates = o.awards.map((a) => a.awardedOn);
      expect([...dates].sort().reverse()).toEqual(dates);
    }
  });

  it("keeps every order under the $15,000 micro-purchase limit", () => {
    for (const o of ORDERS) {
      const total = (o.quantity ?? 0) * (o.lastPricePerUnit ?? o.standardPrice ?? 0);
      expect(total).toBeLessThan(15_000);
    }
  });

  it("reaches the states the board draws: new order, amended, pending, set-asides", () => {
    expect(ORDERS.some((o) => o.awards.length === 0)).toBe(true);
    expect(ORDERS.some((o) => o.amendedOn != null && o.version !== o.solicitation)).toBe(true);
    expect(ORDERS.some((o) => o.dibbsStatus === "Pending")).toBe(true);
    expect(ORDERS.some((o) => o.setAside === "WOSB")).toBe(true);
    expect(ORDERS.some((o) => o.paper === null)).toBe(true);
  });

  it("names a real ship-to place and a fit score for every order", () => {
    for (const o of ORDERS) {
      const meta = ORDER_META.get(o.id)!;
      expect(["fortBragg", "campLejeune", "popeAaf"]).toContain(meta.shipTo);
      expect(meta.fit).toBeGreaterThan(0);
      expect(meta.fit).toBeLessThanOrEqual(100);
    }
    expect(fitScores(["mp-111", "nope"])).toEqual({ "mp-111": ORDER_META.get("mp-111")!.fit });
  });

  it("uses no real company and no old-member word", () => {
    const text = JSON.stringify({ ORDERS, SUPPLIERS });
    expect(text).not.toMatch(/sodexo|aramark|compass|eurest|roof|marcus|williams|238160|demo-/i);
  });
});

describe("the board's server rules", () => {
  it("lists the pairs she may bid, and four reasons for the rest", () => {
    const census = codeCensus();
    expect(census.total).toBe(20);
    expect(biddablePairsFromCensus(census.pairs)).toEqual(["1G", "1Z", "2Z"]);
    const groups = reasonGroupsFromCensus(census.pairs);
    expect(groups.length).toBeGreaterThanOrEqual(2);
    expect(groups.reduce((n, g) => n + g.estimate, 0)).toBe(6);
  });

  it("serves For you with her pairs, and All without them", () => {
    const pairs = biddablePairsFromCensus(codeCensus().pairs);
    const forYou = feedPage({ view: "for-you", categories: [], codes: [], bidCodes: pairs });
    expect(forYou.total).toBe(14);
    expect(forYou.boardTotal).toBe(20);
    expect(forYou.orders.every((o) => mayBid(o))).toBe(true);
    const all = feedPage({ view: "all", categories: [], codes: [], bidCodes: null });
    expect(all.total).toBe(20);
    expect(all.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(all.count).toBe(all.orders.length);
  });

  it("serves nothing for an empty list of pairs, as production does", () => {
    expect(feedPage({ view: "for-you", categories: [], codes: [], bidCodes: [] }).total).toBe(0);
  });

  it("narrows by category and by code pair", () => {
    const water = feedPage({ view: "all", categories: ["safety-gear"], codes: [], bidCodes: null });
    expect(water.orders.map((o) => o.id)).toEqual(["mp-106"]);
    const restricted = feedPage({ view: "all", categories: [], codes: ["2C"], bidCodes: null });
    expect(restricted.orders.map(pairOf)).toEqual(["2C", "2C"]);
  });

  it("pages through every order once, with a cursor the client cannot misread", () => {
    const q = { view: "all" as const, categories: [], codes: [], bidCodes: null };
    const seen: string[] = [];
    let page = feedPage(q, 0, 7);
    seen.push(...page.orders.map((o) => o.id));
    while (page.more) {
      const cursor = decodeCursor(page.more.cursor)!;
      expect(page.more.remaining).toBe(20 - cursor.served);
      page = feedPage(cursor, cursor.served, 7);
      seen.push(...page.orders.map((o) => o.id));
    }
    expect(seen).toHaveLength(20);
    expect(new Set(seen).size).toBe(20);
    expect(decodeCursor("not a cursor")).toBeNull();
  });

  it("counts categories for a set of industry codes", () => {
    const counts = categoryCounts(["311991", "722310"]);
    expect(counts.total).toBeGreaterThanOrEqual(5);
    expect(counts.rows[0].category).toBe("food-beverage");
  });
});

describe("the sample files and tables", () => {
  it("makes a real PDF for each order that has a paper", () => {
    for (const o of ORDERS) {
      const bytes = orderPaperPdf(o.id);
      if (o.paper === null) {
        expect(bytes).toBeNull();
      } else {
        expect(new TextDecoder().decode(bytes!.slice(0, 5))).toBe("%PDF-");
        expect(o.paper.fileSize).toBe(bytes!.length);
      }
    }
  });

  it("names every supplier the orders mention", () => {
    for (const o of ORDERS) {
      const cages = [...o.awards.map((a) => a.cage), ...o.approvedSources.map((s) => s.cage)];
      const names = supplierNames(cages);
      for (const cage of cages) expect(names[cage]).toBeTruthy();
    }
  });

  it("serves the 32 acquisition codes", () => {
    const docs = acquisitionCodeDocuments();
    expect(docs).toHaveLength(32);
    expect(docs.filter((d) => d.kind === "amc")).toHaveLength(6);
  });

  it("starts Amira registered for all but the DLA account, with one price sent", () => {
    const state = initialMemberState();
    expect(state.onboarded).toBe(true);
    expect(state.registrations).toEqual({ sam: true, cage: true, dibbs: false, piee: true });
    expect(state.quotes).toHaveLength(1);
    expect(ORDERS.some((o) => o.id === state.quotes[0].orderId)).toBe(true);
  });
});

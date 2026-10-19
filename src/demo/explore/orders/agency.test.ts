// @vitest-environment jsdom
// DEMO: the agency's Small Orders board (marketing-agency-pack.md section 6).
// Run: DEMO_MEMBER=agency bunx vitest run src/demo/explore/orders

import { describe, expect, it } from "vitest";
import { MEMBER } from "@/demo/member";
import { PERSONA } from "@/demo/story/persona";
import { daysUntil } from "@/demo/story/clock";
import { getSavedOpps } from "@/demo/state/workspace";
import { MICRO_CATEGORIES } from "@/lib/microPurchases/categories";
import { mayBid } from "@/lib/microPurchases/relevance";
import { biddablePairsFromCensus } from "@/lib/microPurchases/restrictedGroups";
import { ORDERS, SHIP_TO, isSmallOrderId } from "./data";
import { FOR_YOU_NOTE, categoryCounts, codeCensus, feedPage, fitScores } from "./feed";
import { initialMemberState } from "./memberState";
import { orderPaperPdf } from "./paper";
import { supplierNames } from "./suppliers";

/** The words scan-member.mjs looks for on the agency's pages. */
const CATERING = /\b(cater\w*|meals?|kitchen|food[- ]?(service|handler)?|cooks?|dining|menus?|ServSafe|Haddad|Amira|722310)\b/i;

const cages = ORDERS.flatMap((o) => [...o.awards.map((a) => a.cage), ...o.approvedSources.map((s) => s.cage)]);

describe.runIf(MEMBER === "agency")("the agency's Small Orders board", () => {
  it("has no orders for her, with Hunter's reason and one way on", () => {
    const pairs = biddablePairsFromCensus(codeCensus().pairs);
    const forYou = feedPage({ view: "for-you", categories: [], codes: [], bidCodes: pairs });
    expect(forYou.total).toBe(0);
    expect(forYou.boardTotal).toBe(10);
    expect(feedPage({ view: "for-you", categories: [], codes: [], bidCodes: null }).total).toBe(0);
    expect(FOR_YOU_NOTE?.hunter).toBe(
      "DLA's small orders are parts and supplies. None fit an ad agency, so I'm not showing you any.",
    );
    expect(FOR_YOU_NOTE?.link.to).toBe("/opportunities");
  });

  it("still lists the public board under All orders, and no order claims to fit her", () => {
    const all = feedPage({ view: "all", categories: [], codes: [], bidCodes: null });
    expect(all.total).toBe(10);
    // All open to any seller, so no "Ones not open to you" row sits under Hunter's message.
    expect(ORDERS.every((o) => mayBid(o))).toBe(true);
    expect(Object.values(fitScores(ORDERS.map((o) => o.id))).every((f) => f === 0)).toBe(true);
    const own = [PERSONA.primaryNaics, ...PERSONA.secondaryNaics.map((c) => c.code)];
    expect(categoryCounts(own).total).toBe(0);
  });

  it("starts with nothing saved, said or sent, and nothing to nag her about", async () => {
    await import("@/demo/api/smallOrders");
    expect(getSavedOpps().filter(isSmallOrderId)).toEqual([]);
    const state = initialMemberState();
    expect(state.categories).toEqual([]);
    expect(state.quotes).toEqual([]);
    expect(state.attestedNsns).toEqual([]);
    expect(Object.values(state.registrations).every(Boolean)).toBe(true);
  });

  it("uses no catering word in the orders, sellers, places, categories or papers", () => {
    const papers = ORDERS.map((o) => orderPaperPdf(o.id))
      .filter((b): b is Uint8Array => b != null)
      .map((b) => new TextDecoder().decode(b));
    const text = JSON.stringify({ ORDERS, sellers: supplierNames(cages), SHIP_TO, MICRO_CATEGORIES, papers });
    expect(text).not.toMatch(CATERING);
  });

  it("keeps the board's rules: live dates, under $15,000, every seller named", () => {
    for (const o of ORDERS) {
      expect(daysUntil(o.postedOn)).toBeLessThanOrEqual(0);
      expect(daysUntil(o.closesOn!)).toBeGreaterThanOrEqual(3);
      expect((o.quantity ?? 0) * (o.lastPricePerUnit ?? o.standardPrice ?? 0)).toBeLessThan(15_000);
    }
    const named = supplierNames(cages);
    for (const cage of cages) expect(named[cage]).toBeTruthy();
  });
});

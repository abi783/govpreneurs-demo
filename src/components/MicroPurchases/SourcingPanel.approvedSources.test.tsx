// "DLA has approved N companies to supply this part" — the record's own fact,
// beside whatever verdict the order carries.
//
// @vitest-environment jsdom
//
// THE COUNT IS NOT A RULING AND THESE CASES HOLD IT TO THAT. `approvedSources`
// reaches us through the `nsn_records` join and names who DLA has cleared for
// the PART. No profile on this surface holds the member's CAGE code — measured
// 2026-09-16: zero in the fact store, zero in `users` — so the count may never
// become a sentence about her. What it can do is tell a member looking at an
// order we hold no ruling for how many firms DLA already has for it.
//
// The panel is rendered in isolation, the way `small-orders.$orderId.test.tsx`
// renders the pieces of its page. `fetchSupplierNames` catches its own failure
// and answers `{}`, so no network stub is needed here.
import { afterEach, describe, expect, it } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { SourcingPanel } from "./SourcingPanel";
import {
  approvedSourceCount,
  approvedSourceNote,
  bidCell,
} from "../../lib/microPurchases/relevance";
import { LIVE_MAPPED_ORDERS } from "../../lib/microPurchases/liveMapperOutput.fixture";
import type { ApprovedSource, MicroOrder } from "../../lib/microPurchases/order";

afterEach(cleanup);

/** A real mapped order carrying the supplier list and codes under test. */
function order(
  approvedSources: ApprovedSource[],
  partNumbers: string | null = null,
  amc: string | null = "1",
  amsc: string | null = "T",
): MicroOrder {
  return { ...LIVE_MAPPED_ORDERS[0], approvedSources, partNumbers, amc, amsc };
}

function panelText(o: MicroOrder): string {
  return render(<SourcingPanel order={o} now={null} />).container.textContent ?? "";
}

describe("how many companies DLA has approved", () => {
  it("counts a company once, however many part numbers it is approved for", () => {
    // Two rows on the table, one company. The table is deduped on the PAIR,
    // because two part numbers are two real rows; the count is about firms.
    const o = order([
      { cage: "0VSH3", partNumber: "BRDM13-10KSSROT" },
      { cage: "0vsh3", partNumber: "BRDM13-10KSSROT/HUB" },
      { cage: "81205", partNumber: "6-72081-2" },
    ]);

    expect(approvedSourceCount(o)).toBe(2);
    expect(approvedSourceNote(o)).toBe("DLA has approved 2 companies to supply this part.");
  });

  it("says company, not companies, when the record names one", () => {
    expect(approvedSourceNote(order([{ cage: "4T661", partNumber: "BR-2210" }]))).toBe(
      "DLA has approved 1 company to supply this part.",
    );
  });

  it("counts no company where the record holds only a raw part-number string", () => {
    // `partNumbers` is a part number, not a supplier. The panel still renders
    // its table row from it, and the count must not report a company nobody
    // named.
    const o = order([], "MS21266-2N");

    expect(approvedSourceCount(o)).toBe(0);
    expect(approvedSourceNote(o)).toBeNull();
  });
});

describe("the panel", () => {
  it("states the count over the list, on an order whose codes carry no ruling", () => {
    // `1L` is the largest unruled pair on the board now that the qualified-list
    // tier rules `1T`. The verdict stays "not clear" and the count renders
    // anyway — that is the whole point of the fact being a fact about the
    // record.
    const o = order(
      [
        { cage: "0VSH3", partNumber: "BRDM13-10KSSROT/HUB" },
        { cage: "81205", partNumber: "6-72081-2" },
        { cage: "4T661", partNumber: "BR-2210" },
      ],
      null,
      "1",
      "L",
    );

    expect(bidCell(o).verdict).toBe("Not clear from DLA's codes");
    expect(panelText(o)).toContain("DLA has approved 3 companies to supply this part.");
  });

  it("states it beside the qualified-list verdict too", () => {
    // The tier that took `1T`. The count is DLA's record and is the same for
    // every member, so a new permission verdict does not gate it.
    const o = order(
      [
        { cage: "0VSH3", partNumber: "BRDM13-10KSSROT/HUB" },
        { cage: "81205", partNumber: "6-72081-2" },
      ],
      null,
      "1",
      "T",
    );

    expect(bidCell(o).verdict).toBe("Qualified sellers only");
    expect(panelText(o)).toContain("DLA has approved 2 companies to supply this part.");
  });

  it("states it beside the limited-competition verdict too", () => {
    const o = order([{ cage: "0VSH3", partNumber: "BRDM13-10KSSROT/HUB" }], null, "1", "Q");

    expect(bidCell(o).verdict).toBe("Approved sellers only");
    expect(panelText(o)).toContain("DLA has approved 1 company to supply this part.");
  });

  it("states it beside an open verdict as well — no verdict gates it", () => {
    // `setAside: null` as well, so the cell reaches its one green branch —
    // `1G` alone is still narrowed when DLA reserves the order.
    const o = {
      ...order([{ cage: "0VSH3", partNumber: "BRDM13-10KSSROT/HUB" }], null, "1", "G"),
      setAside: null,
    };

    expect(bidCell(o).openToHer).toBe(true);
    expect(panelText(o)).toContain("DLA has approved 1 company to supply this part.");
  });

  it("says nothing at all when the record names no supplier and no part number", () => {
    // NEITHER the count NOR the list. An empty "Who DLA has approved" block
    // reports a broken column rather than a missing courtesy.
    const text = panelText(order([], null));

    expect(text).not.toContain("DLA has approved");
    expect(text).not.toContain("Who DLA has approved");
  });

  it("never turns the count into a claim about the member", () => {
    const o = order([{ cage: "0VSH3", partNumber: "BRDM13-10KSSROT/HUB" }], null, "1", "Q");
    const note = approvedSourceNote(o) ?? "";

    // We hold no member CAGE code, so neither direction is available.
    expect(note).not.toMatch(/\byou\b/i);
    expect(note).not.toMatch(/\b(I|my|we|our)\b/);
  });
});

// @vitest-environment jsdom
//
// AD-07 (prod e2e 2026-11-20): "at least 294 firms ... They went back to 734 of them."
// The firm count came from the award's bench but the repeat count from the company
// record, so the two disagreed. Both must come from one source, and repeat can never
// exceed the firm count.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const api = vi.hoisted(() => ({ fetchAward: vi.fn(), fetchPartnerCompany: vi.fn() }));
vi.mock("../../lib/awardsApi", async (orig) => ({
  ...(await orig<typeof import("../../lib/awardsApi")>()),
  fetchAward: api.fetchAward,
}));
vi.mock("../../lib/partnersApi", async (orig) => ({
  ...(await orig<typeof import("../../lib/partnersApi")>()),
  fetchPartnerCompany: api.fetchPartnerCompany,
}));
vi.mock("@tanstack/react-router", () => ({ Link: () => null }));

import { AwardDetailDialog } from "./AwardDetailDialog";

afterEach(cleanup);

const award = (bench: unknown) =>
  ({
    awardId: "a1",
    title: "Roof Replacement",
    winner: { name: "Acme", uei: null, awardeeKey: 7, parentUei: null },
    agency: { name: "GSA", abbrev: null, isDefense: false },
    recency: { reportingLagNote: "" },
    location: {},
    bench,
    jobSubs: [],
  }) as never;

const text = async () => {
  render(
    <AwardDetailDialog
      awardId="a1"
      onClose={() => undefined}
      isSaved={() => false}
      onToggleSaved={() => undefined}
    />,
  );
  await screen.findByText(/Firms Acme hired/);
  await new Promise((r) => setTimeout(r, 20));
  return document.body.textContent ?? "";
};

describe("Firms the winner hired", () => {
  it("uses the company record's count with its own repeat count", async () => {
    api.fetchAward.mockResolvedValue(award({ distinctSubs: 294, repeatSubs: 10, sampleSubs: [] }));
    api.fetchPartnerCompany.mockResolvedValue({
      company: { bench: { distinctSubs: 1485, repeatSubs: 734 }, subsHired: [], tradesHired: [] },
    });
    const t = await text();
    expect(t).toContain("at least 1485 firms");
    expect(t).toContain("went back to 734 of them");
  });
  it("never says they went back to more firms than the total", async () => {
    api.fetchAward.mockResolvedValue(award({ distinctSubs: 294, repeatSubs: 734, sampleSubs: [] }));
    api.fetchPartnerCompany.mockResolvedValue(null);
    const t = await text();
    expect(t).not.toContain("734");
    expect(t).toContain("went back to 294 of them");
  });
});

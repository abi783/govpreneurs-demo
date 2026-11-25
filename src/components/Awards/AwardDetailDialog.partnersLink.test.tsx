// @vitest-environment jsdom
//
// AD-08 / NV-07 (prod e2e 2026-11-20): "See {winner} in Partners" carried no from/fromLabel,
// so the company window had no "← Back to ..." trail to the award.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const api = vi.hoisted(() => ({ fetchAward: vi.fn(), searches: [] as unknown[] }));
vi.mock("../../lib/awardsApi", async (orig) => ({
  ...(await orig<typeof import("../../lib/awardsApi")>()),
  fetchAward: api.fetchAward,
}));
vi.mock("../../lib/partnersApi", async (orig) => ({
  ...(await orig<typeof import("../../lib/partnersApi")>()),
  fetchPartnerCompany: vi.fn().mockResolvedValue(null),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, search, children }: { to: string; search: unknown; children: unknown }) => {
    if (to === "/partners") api.searches.push(search);
    return <a>{children as never}</a>;
  },
}));

import { AwardDetailDialog } from "./AwardDetailDialog";

afterEach(cleanup);

describe("See winner in Partners", () => {
  it("carries the way back to this award", async () => {
    window.history.pushState({}, "", "/awards?q=roof&award=a1");
    api.fetchAward.mockResolvedValue({
      awardId: "a1",
      title: "Roof Replacement",
      winner: { name: "Acme", uei: null, awardeeKey: 7, parentUei: null },
      agency: { name: "GSA", abbrev: null, isDefense: false },
      recency: { reportingLagNote: "" },
      location: {},
      bench: null,
      jobSubs: [],
    });
    render(
      <AwardDetailDialog
        awardId="a1"
        onClose={() => undefined}
        isSaved={() => false}
        onToggleSaved={() => undefined}
      />,
    );
    await screen.findByText("Roof Replacement");
    expect(api.searches.length).toBeGreaterThan(0);
    expect(api.searches[0]).toEqual({
      view: "find",
      company: "7",
      from: "/awards?q=roof&award=a1",
      fromLabel: "Roof Replacement",
    });
  });
});

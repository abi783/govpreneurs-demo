// @vitest-environment jsdom
//
// Prod 2026-11-20: every award read "Subcontracts on this job: 0". The join is right
// (an older Deloitte BRIDGE order shows its 4), but primes report subcontracts months
// after the award: of the 600 newest awards in the member's lane, 0 had any on record;
// of 600 from 2023, 50 did. A bare "0" reads as "they hired nobody", which we do not know.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { AwardRecord } from "../../lib/awardsApi";

const record = (jobSubs: AwardRecord["jobSubs"]): AwardRecord =>
  ({
    awardId: "a1",
    title: "Roof Replacement",
    solicitationId: null,
    winner: { name: "Acme", uei: null, awardeeKey: null, parentUei: null },
    agency: { name: "GSA", abbrev: null, isDefense: false },
    obligated: null,
    currentValue: null,
    ceiling: null,
    recency: {
      awardedAt: null,
      daysSinceAward: null,
      justAwarded: null,
      comingUpAgain: false,
      recompeteAt: null,
      reportingLagNote: "",
    },
    location: { city: null, state: null },
    naicsCode: null,
    workType: null,
    pscCode: null,
    offersReceived: null,
    extentCompeted: null,
    setAside: null,
    subcontractingPlan: null,
    bench: null,
    sourceUrl: null,
    jobSubs,
  }) as AwardRecord;

const api = vi.hoisted(() => ({ fetchAward: vi.fn() }));
vi.mock("../../lib/awardsApi", async (orig) => ({
  ...(await orig<typeof import("../../lib/awardsApi")>()),
  fetchAward: api.fetchAward,
}));
vi.mock("@tanstack/react-router", () => ({ Link: () => null }));

import { AwardDetailDialog } from "./AwardDetailDialog";

afterEach(cleanup);

const open = () =>
  render(
    <AwardDetailDialog
      awardId="a1"
      onClose={() => undefined}
      isSaved={() => false}
      onToggleSaved={() => undefined}
    />,
  );

const subsFold = async () =>
  (await screen.findByText("Subcontracts on this job")).closest("summary")!;

describe("Subcontracts on this job", () => {
  it("none on record: no count, and says reports come later", async () => {
    api.fetchAward.mockResolvedValue(record([]));
    open();
    expect((await subsFold()).querySelector(".adm-fold__count")).toBeNull();
    expect(document.body.textContent).toContain("months after");
  });

  it("some on record: shows the count", async () => {
    api.fetchAward.mockResolvedValue(
      record([{ name: "Sparky", trade: null, dollars: 5000, date: "2025-01-01" }]),
    );
    open();
    expect((await subsFold()).querySelector(".adm-fold__count")?.textContent).toBe("1");
  });
});

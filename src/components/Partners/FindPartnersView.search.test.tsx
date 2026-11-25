// @vitest-environment jsdom
//
// Prod 2026-11-20: "catering", "561710", "janitorial"... all said "No companies
// match". The view filtered the stored lane in the browser and never asked the
// server, which is what reads the companies that win the searched work.
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { PrimeCandidate } from "../../lib/partnersApi";

const company = (awardeeKey: number, name: string, naics: string): PrimeCandidate => ({
  awardeeKey,
  uei: null,
  name,
  cageCode: null,
  website: null,
  bench: { distinctSubs: 3, repeatSubs: 1, trend: "steady" },
  trade: { proximity: "direct", naicsCodes: [naics] },
  geography: {
    inStateAwardShare: 0.5,
    statesPerformed: ["NC"],
    topCitiesByCount: [],
    hqState: "NC",
  },
  economics: {
    maxAwardUsd: 2_000_000,
    medianAwardUsd: 500_000,
    totalAwardedUsd: 5_000_000,
    awardCount: 10,
    momentum: null,
    recompeteMonthsOut: 8,
    numberOfOffersAvg: null,
    lastAwardAt: "2026-06-01",
  },
  tier: "good",
  verdict: "partner_play",
  score: 50,
  scoreBreakdown: {},
  reasons: [],
  flags: [],
  asOf: "2026-11-01",
  whyAboveNext: null,
});

const api = vi.hoisted(() => ({ fetchPartners: vi.fn() }));

vi.mock("../../lib/partnersApi", async (orig) => ({
  ...(await orig<typeof import("../../lib/partnersApi")>()),
  fetchPartners: api.fetchPartners,
  fetchPipeline: vi.fn(async () => []),
}));
vi.mock("../../lib/memberState", () => ({
  useMemberState: () => ({ profile: { trades: [], cities: [], serviceArea: "" }, loading: false }),
}));
vi.mock("@tanstack/react-router", () => ({ Link: () => null }));

import { FindPartnersView } from "./FindPartnersView";
import { NO_PARTNER_FILTERS } from "../../lib/filters/partnerFilters";

afterEach(cleanup);
// jsdom has no scrollTo; the filter panel calls it on mount.
Element.prototype.scrollTo = () => undefined;

describe("FindPartnersView search", () => {
  it("shows the server's kind-of-work matches and why they matched", async () => {
    api.fetchPartners.mockImplementation(async (_signal?: AbortSignal, q?: string) =>
      q
        ? {
            partners: [company(99, "Cape Fear Dining", "722310")],
            matchedBecause: { 99: "Wins food service work" },
            computedAt: "2026-11-20T00:00:00Z",
            pending: false,
            stale: false,
            needsProfile: false,
          }
        : {
            partners: [company(7, "Kelly Construction", "236220")],
            computedAt: "2026-11-20T00:00:00Z",
            pending: false,
            stale: false,
            needsProfile: false,
          },
    );
    render(
      <FindPartnersView
        onOpenCompany={() => undefined}
        openCompanyKey={null}
        tabs={null}
        q="catering"
        onSearch={() => undefined}
        filters={NO_PARTNER_FILTERS}
        onFiltersChange={() => undefined}
      />,
    );
    expect(await screen.findByText("Cape Fear Dining", {}, { timeout: 2000 })).toBeTruthy();
    // The highlighter splits the reason into marks, so read the text whole.
    expect(document.body.textContent).toContain("Wins food service work");
    expect(api.fetchPartners).toHaveBeenCalledWith(expect.anything(), "catering");
  });

  it("typing does not touch the URL until a pause, and a stale q never rewrites the box", () => {
    api.fetchPartners.mockResolvedValue({
      partners: [],
      computedAt: "2026-11-20T00:00:00Z",
      pending: false,
      stale: false,
      needsProfile: false,
    });
    vi.useFakeTimers();
    try {
      const onSearch = vi.fn();
      const view = (q: string) => (
        <FindPartnersView
          onOpenCompany={() => undefined}
          openCompanyKey={null}
          tabs={null}
          q={q}
          onSearch={onSearch}
          filters={NO_PARTNER_FILTERS}
          onFiltersChange={() => undefined}
        />
      );
      const { rerender } = render(view(""));
      const box = screen.getByLabelText("Search companies or kind of work") as HTMLInputElement;
      fireEvent.change(box, { target: { value: "c" } });
      expect(onSearch).not.toHaveBeenCalled();
      expect(box.value).toBe("c");
      act(() => void vi.advanceTimersByTime(300));
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith("c");
      fireEvent.change(box, { target: { value: "ca" } });
      rerender(view("c")); // the URL still shows the older term
      expect(box.value).toBe("ca");
    } finally {
      vi.useRealTimers();
    }
  });
});

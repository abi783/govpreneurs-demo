// @vitest-environment jsdom
//
// Prod e2e 2026-11-20 (CW-07..11): the company window for a company in the feed was built from
// the feed item alone, so Recent jobs, Firms hired, Long contracts and Certifications never
// showed. GET /partners/company/:key carries them. A11Y-01: Esc on "Not right for me" lost focus.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { PrimeCandidate } from "../../lib/partnersApi";

const company = (awardeeKey: number, name: string): PrimeCandidate => ({
  awardeeKey,
  uei: null,
  name,
  cageCode: null,
  website: null,
  bench: { distinctSubs: 3, repeatSubs: 1, trend: "steady" },
  trade: { proximity: "direct", naicsCodes: ["236220"], labels: [] },
  geography: { inStateAwardShare: 0.5, statesPerformed: ["NC"], topCitiesByCount: [], hqState: "NC" },
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
  gates: {} as never,
  isCandidate: true,
  gateFailureReasons: [],
} as unknown as PrimeCandidate);

const api = vi.hoisted(() => ({ fetchPartners: vi.fn(), fetchPartnerCompany: vi.fn() }));

vi.mock("../../lib/partnersApi", async (orig) => ({
  ...(await orig<typeof import("../../lib/partnersApi")>()),
  fetchPartners: api.fetchPartners,
  fetchPartnerCompany: api.fetchPartnerCompany,
  fetchPipeline: vi.fn(async () => []),
  suppressPartner: vi.fn(async () => undefined),
}));
vi.mock("../../lib/memberState", () => ({
  useMemberState: () => ({ profile: { trades: [], cities: [], serviceArea: "" }, loading: false }),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children?: unknown }) => <a>{children as never}</a>,
}));

import { FindPartnersView } from "./FindPartnersView";
import { NO_PARTNER_FILTERS } from "../../lib/filters/partnerFilters";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
Element.prototype.scrollTo = () => undefined;

const feed = (partners: PrimeCandidate[]) => ({
  partners,
  computedAt: "2026-11-20T00:00:00Z",
  pending: false,
  stale: false,
  needsProfile: false,
});

const view = (openCompanyKey: number | null) => (
  <FindPartnersView
    onOpenCompany={() => undefined}
    openCompanyKey={openCompanyKey}
    tabs={null}
    q=""
    onSearch={() => undefined}
    filters={NO_PARTNER_FILTERS}
    onFiltersChange={() => undefined}
  />
);

describe("company window", () => {
  it("loads the full company file for a company that is in the feed", async () => {
    api.fetchPartners.mockResolvedValue(feed([company(7, "Kelly Construction")]));
    api.fetchPartnerCompany.mockResolvedValue({
      inMatches: true,
      company: {
        ...company(7, "Kelly Construction"),
        recentJobs: [
          {
            awardId: "A1",
            title: "Roof repair",
            description: null,
            workType: null,
            buyer: "Army",
            office: null,
            city: null,
            state: "NC",
            value: 1000,
            awardedAt: "2026-01-01",
            endsAt: null,
          },
        ],
        subsHired: [{ name: "Tiny Roofing", trade: null, jobs: 2 }],
        certifications: ["8(a) Program Participant"],
      },
    });
    render(view(7));
    await waitFor(() => expect(api.fetchPartnerCompany).toHaveBeenCalledWith(7, expect.anything()));
    expect(await screen.findByText("Recent jobs")).toBeTruthy();
    expect(screen.getByText("Firms they hired")).toBeTruthy();
  });

  it("bolds the key facts in Why this company", async () => {
    const kelly = {
      ...company(7, "Kelly Construction"),
      reasons: [
        {
          signal: "S1",
          text: "They have hired at least 15 smaller firms, and went back to 3 of them more than once.",
        },
      ],
    } as unknown as PrimeCandidate;
    api.fetchPartners.mockResolvedValue(feed([kelly]));
    api.fetchPartnerCompany.mockResolvedValue({ inMatches: true, company: kelly });
    render(view(7));
    const bold = (await screen.findByText("at least 15 smaller firms")).tagName;
    expect(bold).toBe("STRONG");
  });

  it("shows a centred not-found window for a key we hold nothing on", async () => {
    api.fetchPartners.mockResolvedValue(feed([company(7, "Kelly Construction")]));
    api.fetchPartnerCompany.mockResolvedValue(null);
    render(view(1));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("Not in your matches");
  });
});

describe("Not right for me", () => {
  it("returns focus to a card when Esc closes the confirm", async () => {
    api.fetchPartners.mockResolvedValue(
      feed([company(7, "Kelly Construction"), company(8, "Other Co")]),
    );
    render(view(null));
    const hide = (await screen.findAllByRole("button", { name: /not right for me/i }))[0];
    hide.focus();
    fireEvent.click(hide);
    const dialog = await screen.findByRole("dialog");
    // The safe answer has the focus, not "Yes, hide it".
    await waitFor(() => expect(document.activeElement?.textContent).toBe("No"));
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() =>
      expect(document.activeElement?.closest("[data-awardee-key]")).not.toBeNull(),
    );
  });
});

// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import type { CardOpportunity } from "../../lib/mock/opportunities";
import type { OppTab } from "./OpportunitiesTabs";

// The card links out with TanStack's <Link>, which needs a router context the
// card itself does not own. Stand it in as a plain anchor.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...rest}>{children}</a>
  ),
}));

// Capture spy shared across the mocked usePostHog hook.
const capture = vi.fn();
vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({ capture }),
}));

import { OpportunityCard } from "./OpportunityCard";

function card(overrides: Partial<CardOpportunity> = {}): CardOpportunity {
  return {
    id: "LOCAL-FS-0001",
    title: "Food service support",
    agency: "Department of Test",
    agencyAbbrev: "DoT",
    workType: "Solicitation",
    value: "$1.2M",
    location: "Austin, TX",
    closeDateAbsolute: "2026-12-01",
    daysUntilClose: 30,
    matchTier: "good",
    matchScore: 70,
    hunterReasoning: "It fits.",
    mode: "prime",
    scope: "fed",
    category: "contract",
    noticeType: "Solicitation",
    ...overrides,
  };
}

function openCard(feedTab: OppTab, onToggleSaved = vi.fn()) {
  const { container } = render(
    <OpportunityCard opp={card()} saved={false} onToggleSaved={onToggleSaved} feedTab={feedTab} />,
  );
  return container;
}

beforeEach(() => {
  cleanup();
  capture.mockClear();
});

describe("OpportunityCard → PostHog opportunity_opened", () => {
  it.each<OppTab>(["for_you", "all", "saved"])(
    "records the %s tab when the card is opened",
    (tab) => {
      const container = openCard(tab);
      fireEvent.click(container.querySelector("a.ui-card--opp") as HTMLElement);

      expect(capture).toHaveBeenCalledTimes(1);
      expect(capture).toHaveBeenCalledWith("opportunity_opened", {
        solicitation_id: "LOCAL-FS-0001",
        feed_tab: tab,
        source: "opportunity_feed",
      });
    },
  );

  it("does not record an open when only the bookmark is clicked", () => {
    const onToggleSaved = vi.fn();
    const container = openCard("all", onToggleSaved);
    fireEvent.click(container.querySelector("button.opp-bookmark") as HTMLElement);

    expect(onToggleSaved).toHaveBeenCalledWith("LOCAL-FS-0001");
    expect(capture).not.toHaveBeenCalled();
  });
});

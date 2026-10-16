// @vitest-environment jsdom
//
// A tracked forecast in the pipeline opens the forecast page.
//
// A tracked forecast reaches the pipeline through `user_workspace.savedOpps`,
// the list saved opportunities and small orders already use. The card sends
// every other row to `/opportunities/$noticeId`, which reads a posted notice and
// is not built for a forecast, so a row whose source is `forecast` or
// `sled_forecast` opens `/forecasts/$forecastId` — the small-order rule, applied
// to the other surface that shares the list.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

// The route is the claim under test, so the router's Link is replaced by a
// plain anchor that prints the path it was given. No router needs to mount.
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    className,
    children,
  }: {
    to: string;
    params?: Record<string, string>;
    className?: string;
    children: ReactNode;
  }) => (
    <a
      className={className}
      href={Object.entries(params ?? {}).reduce((p, [k, v]) => p.replace(`$${k}`, v), to)}
    >
      {children}
    </a>
  ),
}));

import { BidCard } from "./BidCard";
import { savedDetailToBid } from "../../lib/bids/savedDetailToBid";

const FORECAST = {
  oppKey: "a223debe377d5d02af89f2c6512e49fc",
  title: "Mobile Surveillance Maintenance for CBP",
  agency: "CBP Office of Information and Technology",
  dueDate: null,
  sourceType: "forecast",
};

afterEach(cleanup);

describe("a tracked forecast in the pipeline", () => {
  it("is marked as a forecast, federal or local", () => {
    expect(savedDetailToBid(FORECAST).forecast).toBe(true);
    expect(savedDetailToBid({ ...FORECAST, sourceType: "sled_forecast" }).forecast).toBe(true);
    expect(savedDetailToBid({ ...FORECAST, sourceType: "sam" }).forecast).toBeFalsy();
  });

  it("opens the forecast page from every link on the card", () => {
    const bid = savedDetailToBid(FORECAST);
    const { container } = render(<BidCard bid={bid} />);

    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs.every((h) => h === `/forecasts/${FORECAST.oppKey}`)).toBe(true);
    expect(bid.nextAction.href).toBe(`/forecasts/${FORECAST.oppKey}`);
    expect(screen.getByText(/Open the forecast/)).toBeTruthy();
  });

  it("shows no countdown, because a forecast's date is not a date bids close on", () => {
    const soon = new Date(Date.now() + 3 * 86_400_000).toISOString();
    const past = new Date(Date.now() - 3 * 86_400_000).toISOString();

    const ahead = savedDetailToBid({ ...FORECAST, dueDate: soon });
    expect(ahead.daysLeft).toBeNull();
    expect(ahead.expired).toBe(false);

    const behind = savedDetailToBid({ ...FORECAST, dueDate: past });
    expect(behind.expired).toBe(false);
    const { container } = render(<BidCard bid={behind} />);
    expect(container.querySelector(".bid-card__deadline")).toBeNull();

    // The same date on an opportunity still reads as a deadline.
    expect(savedDetailToBid({ ...FORECAST, dueDate: past, sourceType: "sam" }).expired).toBe(true);
  });
});

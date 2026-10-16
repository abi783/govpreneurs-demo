// @vitest-environment jsdom
//
// A saved small order in the pipeline opens the small orders page.
//
// Saved small orders reach the pipeline through `user_workspace.savedOpps`, the
// same list saved opportunities use. The card was written for opportunities and
// sent every row to `/opportunities/$noticeId`, which is not built for a DLA
// parts order. A row whose source is `dibbs` opens `/small-orders/$orderId`.
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

afterEach(cleanup);

describe("a saved small order in the pipeline", () => {
  it("is marked as a small order when its source is dibbs", () => {
    const bid = savedDetailToBid({
      oppKey: "dibbs-42",
      title: "Brake shoe",
      agency: "DLA Land and Maritime",
      dueDate: null,
      sourceType: "dibbs",
    });

    expect(bid.smallOrder).toBe(true);
    expect(bid.nextAction.href).toBe("/small-orders/dibbs-42");
  });

  it("opens the small orders page from every link on the card", () => {
    const bid = savedDetailToBid({
      oppKey: "dibbs-42",
      title: "Brake shoe",
      agency: "DLA Land and Maritime",
      dueDate: null,
      sourceType: "dibbs",
    });
    const { container } = render(<BidCard bid={bid} />);

    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs.every((h) => h === "/small-orders/dibbs-42")).toBe(true);
    expect(screen.getByText(/Open the order/)).toBeTruthy();
  });

  it("leaves every other saved opportunity on the opportunity page", () => {
    const bid = savedDetailToBid({
      oppKey: "sam-7",
      title: "Janitorial services",
      agency: "GSA",
      dueDate: null,
      sourceType: "sam",
    });
    const { container } = render(<BidCard bid={bid} />);

    expect(bid.smallOrder).toBeFalsy();
    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs.every((h) => h === "/opportunities/sam-7")).toBe(true);
  });
});

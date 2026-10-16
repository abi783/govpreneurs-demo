// @vitest-environment jsdom
//
// Inside GoHighLevel, each surface is its own custom-menu-link page. A card on
// the My Bids page must hand its click to the parent frame, so the target opens
// on its own page with the right menu tab active, and not inside the My Bids
// frame. Opportunities relay to the Opportunities page, small orders to the
// Small Orders page, forecasts to the Forecasts page, and mentor-review cards to
// the Mentors page.
//
// The relay is the real one from lib/ghlNav: the test stubs `window.parent`
// and reads what the card posts to it and what it writes to localStorage.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import type { MouseEventHandler, ReactNode } from "react";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    className,
    onClick,
    children,
  }: {
    to: string;
    params?: Record<string, string>;
    className?: string;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
    children: ReactNode;
  }) => (
    <a
      className={className}
      onClick={onClick}
      href={Object.entries(params ?? {}).reduce((p, [k, v]) => p.replace(`$${k}`, v), to)}
    >
      {children}
    </a>
  ),
}));

import { BidCard } from "./BidCard";
import { savedDetailToBid } from "../../lib/bids/savedDetailToBid";
import { NAV_INTENT_KEY, NAV_MESSAGE } from "../../lib/ghlNav";
import type { Bid } from "../../lib/mock/bids";

const smallOrder = savedDetailToBid({
  oppKey: "dibbs-42",
  title: "Brake shoe",
  agency: "DLA Land and Maritime",
  dueDate: null,
  sourceType: "dibbs",
});
const opportunity = savedDetailToBid({
  oppKey: "sam-7",
  title: "Janitorial services",
  agency: "GSA",
  dueDate: null,
  sourceType: "sam",
});
const forecast = savedDetailToBid({
  oppKey: "fc-9",
  title: "Mobile surveillance maintenance",
  agency: "CBP",
  dueDate: null,
  sourceType: "forecast",
});
const mentorReview: Bid = {
  id: "mentor_rev-5",
  opportunityId: "sam-7",
  title: "Janitorial services",
  agency: "",
  mode: "prime",
  deadline: null,
  stage: "with_mentor",
  nextAction: { label: "Open thread", href: "/mentors/rev-5" },
  lastActivityAt: "2026-10-01T00:00:00.000Z",
  daysLeft: null,
  expired: false,
  valueMidUsd: 0,
  mentorActionOverride: { label: "Open thread →", reviewId: "rev-5", primary: false },
};

const parent = { postMessage: vi.fn() };
const realParent = window.parent;

function embed(embedded: boolean) {
  Object.defineProperty(window, "parent", {
    configurable: true,
    value: embedded ? parent : window,
  });
}

/** Click each link on the card; return whether the browser was left to navigate. */
function clickEveryLink(container: HTMLElement): boolean[] {
  return [...container.querySelectorAll("a")].map((a) => fireEvent.click(a));
}

/** The [page, route] pair of every message the card posted to the parent. */
function postedPages(): [string, string][] {
  return parent.postMessage.mock.calls.map(([msg]) => {
    expect(msg.message).toBe(NAV_MESSAGE);
    return [msg.payload.page, msg.payload.route];
  });
}

function storedIntentRoute(): string | undefined {
  const raw = window.localStorage.getItem(NAV_INTENT_KEY);
  return raw ? (JSON.parse(raw) as { route: string }).route : undefined;
}

beforeEach(() => {
  parent.postMessage.mockClear();
  window.localStorage.clear();
  embed(true);
});
afterEach(() => {
  cleanup();
  Object.defineProperty(window, "parent", { configurable: true, value: realParent });
});

describe("a My Bids card inside GoHighLevel", () => {
  it.each([
    ["a small order", smallOrder, "small-orders", "/small-orders/dibbs-42"],
    ["an opportunity", opportunity, "opportunities", "/opportunities/sam-7"],
    ["a forecast", forecast, "forecasts", "/forecasts/fc-9"],
    ["a mentor review", mentorReview, "mentors", "/mentors/rev-5"],
  ])("relays %s to its own page from every link", (_name, bid, page, route) => {
    const { container } = render(<BidCard bid={bid} />);

    const navigated = clickEveryLink(container);

    expect(navigated.length).toBeGreaterThan(0);
    expect(navigated.every((n) => n === false)).toBe(true);
    const posted = postedPages();
    expect(posted).toHaveLength(navigated.length);
    for (const call of posted) expect(call).toEqual([page, route]);
    expect(storedIntentRoute()).toBe(route);
  });
});

describe("a My Bids card outside GoHighLevel", () => {
  it.each([
    ["a small order", smallOrder],
    ["a forecast", forecast],
    ["a mentor review", mentorReview],
  ])("lets %s navigate inside the app and relays nothing", (_name, bid) => {
    embed(false);
    const { container } = render(<BidCard bid={bid} />);

    const navigated = clickEveryLink(container);

    expect(navigated.every((n) => n === true)).toBe(true);
    expect(parent.postMessage).not.toHaveBeenCalled();
    expect(storedIntentRoute()).toBeUndefined();
  });
});

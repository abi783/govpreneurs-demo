// @vitest-environment jsdom
//
// The review header's title link. A small order opens the small-order page
// (relayed to the "small-orders" GHL page when embedded); an opportunity — and
// a review from a backend that sends no `sourceType` — opens the opportunity
// page exactly as before.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { MentorReviewThread } from "../../lib/mentorReviewsApi";

const requestCrossPageNav = vi.fn();
let embedded = false;

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
    onClick,
    className,
  }: {
    to: string;
    params: Record<string, string>;
    children: ReactNode;
    onClick?: (e: unknown) => void;
    className?: string;
  }) => (
    <a
      href={Object.entries(params).reduce((p, [k, v]) => p.replace(`$${k}`, v), to)}
      className={className}
      onClick={(e) => {
        onClick?.(e);
        e.preventDefault();
      }}
    >
      {children}
    </a>
  ),
}));
// A double of the real `relayWhenEmbedded`, driven by `embedded` and recording
// each relay in `requestCrossPageNav`.
vi.mock("../../lib/ghlNav", () => ({
  relayWhenEmbedded: (page: string, route: string) => (e: { preventDefault(): void }) => {
    if (!embedded) return;
    e.preventDefault();
    requestCrossPageNav(page, route);
  },
}));
vi.mock("../../lib/mentorReviewsApi", () => ({
  markMentorReviewViewed: () => Promise.resolve(),
  patchMentorReviewInCache: () => undefined,
  replyToMentorReview: () => Promise.resolve(),
  mentorBadge: () => ({ label: "Pending review", modifier: "pending" }),
}));
vi.mock("./ReplyComposer", () => ({ ReplyComposer: () => null }));

const { ConversationView } = await import("./ConversationView");

function review(extra: Partial<MentorReviewThread>): MentorReviewThread {
  return {
    id: "rev-1",
    oppKey: "key-1",
    oppResolved: true,
    solNumber: "SOL-1",
    title: "The item",
    status: "pending",
    recommendation: null,
    mentorName: null,
    createdAt: "2026-09-01T00:00:00.000Z",
    lastMessageAt: "2026-09-01T00:00:00.000Z",
    lastMessageAuthor: "member",
    lastMessagePreview: "",
    unread: false,
    messages: [],
    ...extra,
  };
}

function titleLink(r: MentorReviewThread) {
  render(<ConversationView review={r} onChange={() => undefined} />);
  return screen.getByRole("link", { name: "The item" });
}

beforeEach(() => {
  embedded = false;
  requestCrossPageNav.mockReset();
});
afterEach(cleanup);

describe("ConversationView title link", () => {
  it("links a small order to the small-order page", () => {
    const link = titleLink(review({ sourceType: "dibbs" }));
    expect(link.getAttribute("href")).toBe("/small-orders/key-1");
    fireEvent.click(link);
    expect(requestCrossPageNav).not.toHaveBeenCalled();
  });

  it("relays a small order to the small-orders GHL page when embedded", () => {
    embedded = true;
    fireEvent.click(titleLink(review({ sourceType: "dibbs" })));
    expect(requestCrossPageNav).toHaveBeenCalledWith("small-orders", "/small-orders/key-1");
  });

  it.each([
    ["an opportunity", { sourceType: "sam" }],
    ["a review with no sourceType", {}],
    ["a review with a null sourceType", { sourceType: null }],
  ])("links %s to the opportunity page", (_label, extra) => {
    const link = titleLink(review(extra));
    expect(link.getAttribute("href")).toBe("/opportunities/key-1");
  });

  it("relays an opportunity to the opportunities GHL page when embedded", () => {
    embedded = true;
    fireEvent.click(titleLink(review({})));
    expect(requestCrossPageNav).toHaveBeenCalledWith("opportunities", "/opportunities/key-1");
  });

  it.each(["forecast", "sled_forecast"])("links a %s to the forecast page", (sourceType) => {
    const link = titleLink(review({ sourceType }));
    expect(link.getAttribute("href")).toBe("/forecasts/key-1");
    fireEvent.click(link);
    expect(requestCrossPageNav).not.toHaveBeenCalled();
  });

  it("relays a forecast to the forecasts GHL page when embedded", () => {
    embedded = true;
    fireEvent.click(titleLink(review({ sourceType: "forecast" })));
    expect(requestCrossPageNav).toHaveBeenCalledWith("forecasts", "/forecasts/key-1");
  });

  it("renders no link when the item did not resolve", () => {
    render(
      <ConversationView
        review={review({ oppResolved: false, sourceType: "dibbs" })}
        onChange={() => undefined}
      />,
    );
    expect(screen.queryByRole("link", { name: "The item" })).toBeNull();
  });
});

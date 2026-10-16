// @vitest-environment jsdom
//
// The "Show expired" switch on My Bids says how many cards it hides. It hides
// expired SAVED items only, so "N hidden" counts those and nothing else: not
// the open saved items, and not the mentor-review cards beside them.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ComponentType } from "react";
import type { SavedOppDetail } from "../lib/workspace";
import type { MentorReviewSummary } from "../lib/mentorReviewsApi";

const DAY_MS = 86_400_000;
const inDays = (n: number): string => new Date(Date.now() + n * DAY_MS).toISOString();

const SAVED: SavedOppDetail[] = [
  { oppKey: "OLD-1", title: "Closed one", agency: "USACE", dueDate: inDays(-5), sourceType: "sam" },
  { oppKey: "OLD-2", title: "Closed two", agency: "USACE", dueDate: inDays(-2), sourceType: "sam" },
  { oppKey: "OPEN-1", title: "Open one", agency: "USACE", dueDate: inDays(9), sourceType: "sam" },
];

function review(id: string, oppKey: string): MentorReviewSummary {
  return {
    id,
    oppKey,
    oppResolved: true,
    solNumber: null,
    title: `Review ${id}`,
    status: "open",
    recommendation: null,
    mentorName: null,
    createdAt: inDays(-30),
    lastMessageAt: inDays(-1),
  } as unknown as MentorReviewSummary;
}

const REVIEWS = [review("r1", "OLD-1"), review("r2", "OTHER-1")];

vi.mock("../lib/workspace", () => ({
  fetchSavedOppDetails: vi.fn(() => Promise.resolve(SAVED)),
}));
vi.mock("../lib/mentorReviewsApi", () => ({
  getMentorReviewsSnapshot: () => REVIEWS,
  hasMentorReviewsLoaded: () => true,
  refreshMentorReviews: vi.fn(() => Promise.resolve()),
  subscribeMentorReviews: () => () => {},
}));
vi.mock("../lib/ghlUser", async () => (await import("./__testing__/feedHarness")).ghlUserStub());
vi.mock("@tanstack/react-router", async () =>
  (await import("./__testing__/feedHarness")).routerStub(),
);
vi.mock("../components/Bids/BidsBoard", () => ({ BidsBoard: () => null }));

const { Route } = await import("./pipeline");
const { UIStateProvider } = await import("../lib/uiState");
const MyBidsPage = (Route as unknown as { component: ComponentType }).component;

afterEach(cleanup);

describe("My Bids — the Show expired count", () => {
  it("counts the expired saved items only", async () => {
    render(
      <UIStateProvider>
        <MyBidsPage />
      </UIStateProvider>,
    );
    await waitFor(() => expect(screen.getByText("2 hidden")).toBeTruthy());
  });
});

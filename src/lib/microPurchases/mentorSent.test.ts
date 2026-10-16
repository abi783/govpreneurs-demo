// @vitest-environment jsdom
// The mentor review for a record comes from the real Mentors list, by oppKey.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";

const reviews = [
  { id: "rev-1", oppKey: "fc-1", status: "responded" },
  { id: "rev-2", oppKey: "other", status: "pending" },
];

vi.mock("../mentorReviewsApi", () => ({
  getMentorReviewsSnapshot: () => reviews,
  hasMentorReviewsLoaded: () => true,
  refreshMentorReviews: vi.fn(() => Promise.resolve(reviews)),
  subscribeMentorReviews: () => () => {},
}));

const { useMentorReviewFor, useOrderMentorSent, markOrderMentorSent } =
  await import("./mentorSent");

afterEach(cleanup);

describe("useMentorReviewFor", () => {
  it("finds the review whose oppKey is the record", () => {
    const { result } = renderHook(() => useMentorReviewFor("fc-1"));
    expect(result.current).toMatchObject({ id: "rev-1", status: "responded" });
  });

  it("is null when no review names the record", () => {
    const { result } = renderHook(() => useMentorReviewFor("fc-9"));
    expect(result.current).toBeNull();
  });
});

describe("useOrderMentorSent", () => {
  it("counts a record sent in this visit before the list is read again", () => {
    const { result, rerender } = renderHook(() => useOrderMentorSent("fc-new"));
    expect(result.current).toBe(false);
    markOrderMentorSent("fc-new");
    rerender();
    expect(result.current).toBe(true);
  });
});

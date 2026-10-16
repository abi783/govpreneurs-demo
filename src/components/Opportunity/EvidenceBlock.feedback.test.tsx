// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { EvidenceBlock } from "./EvidenceBlock";

// Capture spy shared across the mocked usePostHog hook.
const capture = vi.fn();
vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({ capture }),
}));
vi.mock("../../lib/ghlUser", () => ({
  useGhlUser: () => ({ session: { userId: "loc123", email: "test@firm.com" } }),
}));

const baseProps = {
  detail: { quickSummary: "A quick summary." } as never,
  summarySections: [
    { id: "what_the_buyer_needs", title: "What the buyer needs", bullets: ["b1"] },
  ],
  keyInfo: [],
  officialTitle: "Official title",
  openSections: [],
  onOpenChange: () => {},
  oppKey: "opp-1",
};

const commentEvents = () =>
  capture.mock.calls.filter((c) => c[0] === "ai_summary_feedback_comment");

beforeEach(() => {
  cleanup();
  capture.mockClear();
});

describe("EvidenceBlock summary feedback → PostHog", () => {
  it("Yes fires ai_summary_rated:helpful and thanks the user", () => {
    render(<EvidenceBlock {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /yes/i }));

    expect(capture).toHaveBeenCalledWith(
      "ai_summary_rated",
      expect.objectContaining({
        feature: "detailed_summary",
        solicitation_id: "opp-1",
        rating: "helpful",
        source: "web_widget",
        user_id: "loc123",
        email: "test@firm.com",
      }),
    );
    expect(screen.getByText(/thanks — noted/i)).toBeTruthy();
  });

  it("Not quite fires ai_summary_rated:not_helpful and opens the comment box; Submit fires ai_summary_feedback_comment", () => {
    render(<EvidenceBlock {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /not quite/i }));

    expect(capture).toHaveBeenCalledWith(
      "ai_summary_rated",
      expect.objectContaining({ rating: "not_helpful" }),
    );

    const textarea = screen.getByLabelText("Summary feedback comment");
    fireEvent.change(textarea, { target: { value: "  needs more detail  " } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(capture).toHaveBeenCalledWith(
      "ai_summary_feedback_comment",
      expect.objectContaining({
        feature: "detailed_summary",
        solicitation_id: "opp-1",
        comment_text: "needs more detail", // trimmed
        linked_rating: "not_helpful",
        user_id: "loc123",
        email: "test@firm.com",
      }),
    );
  });

  it("Skip after Not quite does not fire a comment event", () => {
    render(<EvidenceBlock {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /not quite/i }));
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(commentEvents()).toHaveLength(0);
  });

  it("Submitting an empty comment does not fire a comment event", () => {
    render(<EvidenceBlock {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /not quite/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(commentEvents()).toHaveLength(0);
  });
});

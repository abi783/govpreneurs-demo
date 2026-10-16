// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { HunterMessageFeedback } from "./HunterMessageFeedback";

// Capture spy shared across the mocked usePostHog hook.
const capture = vi.fn();
vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({ capture }),
}));
vi.mock("../../lib/ghlUser", () => ({
  useGhlUser: () => ({ session: { userId: "loc123", email: "test@firm.com" } }),
}));

const baseProps = {
  content: "Here are three SDVOSB opportunities in Texas.",
  messageId: "h-42",
  sessionId: "sess-9",
};

const commentEvents = () =>
  capture.mock.calls.filter((c) => c[0] === "hunter_chat_response_feedback_comment");

beforeEach(() => {
  cleanup();
  capture.mockClear();
});

describe("HunterMessageFeedback → PostHog", () => {
  it("Helpful fires hunter_chat_response_rated:helpful and confirms receipt", () => {
    render(<HunterMessageFeedback {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Helpful" }));

    expect(capture).toHaveBeenCalledWith(
      "hunter_chat_response_rated",
      expect.objectContaining({
        rating: "helpful",
        source: "hunter_chat",
        message_id: "h-42",
        session_id: "sess-9",
        user_id: "loc123",
        email: "test@firm.com",
      }),
    );
    expect(screen.getByText(/feedback received/i)).toBeTruthy();
  });

  it("Not helpful fires rated:not_helpful, opens the comment box; Submit fires the comment event (trimmed)", () => {
    render(<HunterMessageFeedback {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Not helpful" }));

    expect(capture).toHaveBeenCalledWith(
      "hunter_chat_response_rated",
      expect.objectContaining({ rating: "not_helpful", source: "hunter_chat" }),
    );

    const textarea = screen.getByLabelText("Feedback comment");
    fireEvent.change(textarea, { target: { value: "  wrong state  " } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(capture).toHaveBeenCalledWith(
      "hunter_chat_response_feedback_comment",
      expect.objectContaining({
        feedback_type: "down",
        comment_text: "wrong state", // trimmed
        message_id: "h-42",
        session_id: "sess-9",
        user_id: "loc123",
        email: "test@firm.com",
        source: "hunter_chat",
      }),
    );
  });

  it("Flag fires rated:flagged and opens the comment box", () => {
    render(<HunterMessageFeedback {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Flag as inaccurate" }));

    expect(capture).toHaveBeenCalledWith(
      "hunter_chat_response_rated",
      expect.objectContaining({ rating: "flagged", source: "hunter_chat" }),
    );
    expect(screen.getByLabelText("Feedback comment")).toBeTruthy();
  });

  it("Skip after Not helpful does not fire a comment event", () => {
    render(<HunterMessageFeedback {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Not helpful" }));
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(commentEvents()).toHaveLength(0);
  });

  it("Submitting an empty comment does not fire a comment event", () => {
    render(<HunterMessageFeedback {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Not helpful" }));
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(commentEvents()).toHaveLength(0);
  });
});

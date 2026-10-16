// @vitest-environment jsdom
//
// PR-39 port · V6 — a rating on a message with NO `turnId` has to reach
// something real.
//
// `POST /hunter-chat/feedback` writes onto a `chat_logs` turn: the backend DTO
// requires a 24-character `turnId` and `ChatLogService.setFeedback` 404s
// anything that does not match an existing turn for this location. There is no
// session-scoped feedback route, so a message that was never a backend turn —
// the seed — cannot post. It hands the member's note to the composer instead,
// which turns the objection into a real turn Hunter answers.
//
// The path WITH a `turnId` is untouched, and this file asserts that too.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const capture = vi.fn();
vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({ capture }),
}));
vi.mock("../../lib/ghlUser", () => ({
  useGhlUser: () => ({ session: { userId: "loc123", email: "test@firm.com" } }),
}));
const postHunterFeedback = vi.fn();
vi.mock("../../lib/hunterChat", () => ({
  postHunterFeedback: (...args: unknown[]) => postHunterFeedback(...args),
}));

const { HunterMessageFeedback } = await import("./HunterMessageFeedback");

const baseProps = {
  content: "Tell me what kind of work you're looking for.",
  messageId: "seed",
  sessionId: "sess-9",
};

beforeEach(() => {
  cleanup();
  capture.mockClear();
  postHunterFeedback.mockClear();
});

describe("V6 · a rating with no turnId hands off to the composer", () => {
  it("sends the member's note to the composer and posts nothing to the backend", () => {
    const onHandOff = vi.fn();
    render(<HunterMessageFeedback {...baseProps} onHandOff={onHandOff} />);

    fireEvent.click(screen.getByRole("button", { name: "Not helpful" }));
    fireEvent.change(screen.getByLabelText("Feedback comment"), {
      target: { value: "  I work in North Carolina, not Texas  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /send to hunter/i }));

    expect(onHandOff).toHaveBeenCalledTimes(1);
    expect(onHandOff.mock.calls[0][0]).toContain("I work in North Carolina, not Texas");
    // No turn to write onto — a post here would 404 on the backend.
    expect(postHunterFeedback).not.toHaveBeenCalled();
  });

  it("keeps the send control disabled until the member has written something", () => {
    const onHandOff = vi.fn();
    render(<HunterMessageFeedback {...baseProps} onHandOff={onHandOff} />);

    fireEvent.click(screen.getByRole("button", { name: "Flag as inaccurate" }));
    const send = screen.getByRole("button", { name: /send to hunter/i }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Feedback comment"), {
      target: { value: "the deadline is wrong" },
    });
    expect(
      (screen.getByRole("button", { name: /send to hunter/i }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it("names the destination before the member writes", () => {
    render(<HunterMessageFeedback {...baseProps} onHandOff={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Not helpful" }));
    expect(screen.getByText(/message box/i)).toBeTruthy();
  });

  it("rates to PostHog as well, so a thumbs-up is not a silent control", () => {
    render(<HunterMessageFeedback {...baseProps} onHandOff={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Helpful" }));
    expect(capture).toHaveBeenCalledWith(
      "hunter_chat_response_rated",
      expect.objectContaining({ rating: "helpful", message_id: "seed" }),
    );
  });
});

describe("V6 · the path WITH a turnId is unchanged", () => {
  it("posts to the backend and never hands off", () => {
    const onHandOff = vi.fn();
    render(
      <HunterMessageFeedback
        {...baseProps}
        turnId="65f0c0ffee0c0ffee0c0ffee"
        onHandOff={onHandOff}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Not helpful" }));
    expect(postHunterFeedback).toHaveBeenCalledWith("65f0c0ffee0c0ffee0c0ffee", "down");

    fireEvent.change(screen.getByLabelText("Feedback comment"), {
      target: { value: "wrong state" },
    });
    // The label stays "Submit" — this note goes to the turn, not the composer.
    fireEvent.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(postHunterFeedback).toHaveBeenCalledWith(
      "65f0c0ffee0c0ffee0c0ffee",
      "down",
      "wrong state",
    );
    expect(onHandOff).not.toHaveBeenCalled();
  });
});

// @vitest-environment jsdom
//
// PR-39 port · V6 — the seed message earns a feedback row.
//
// The MeetHunter hero promises "I get things wrong; tell me when I do and your
// feed changes", and the first message on screen used to refuse it: the row was
// gated on `m.id !== "seed"`.
//
// The seed was never a backend turn, so it has no `turnId`, and
// `POST /hunter-chat/feedback` writes onto a turn (see the backend DTO and
// `ChatLogService.setFeedback`). There is no session-scoped feedback route, so
// the row degrades to the composer: the member's note is pre-filled into the
// message box and sending it makes the objection a real turn.
//
// These tests assert the destination is REAL — the note reaches
// `postHunterMessage` — and never that a control merely rendered.
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { HunterTurnResponse } from "../../lib/hunterChat";

const postHunterMessage = vi.fn<(...args: unknown[]) => Promise<HunterTurnResponse>>();
const postHunterFeedback = vi.fn();
const capture = vi.fn();

vi.mock("../../lib/hunterChat", () => ({
  postHunterMessage: (...args: unknown[]) => postHunterMessage(...args),
  resetHunterSession: vi.fn(),
  postHunterFeedback: (...args: unknown[]) => postHunterFeedback(...args),
}));
vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({ capture }),
}));
vi.mock("../../lib/ghlUser", () => ({
  useGhlUser: () => ({ session: { locationId: "LOC1" }, loading: false }),
}));
vi.mock("../../lib/businessProfile", () => ({
  useBusinessProfile: () => ({ profile: null, loading: false }),
  naicsLabel: () => null,
}));
vi.mock("./EnrichmentJourney", () => ({ EnrichmentJourney: () => null }));
vi.mock("./CapabilityConflictHint", () => ({ CapabilityConflictHint: () => null }));
vi.mock("../Companion/AgentAvatar", () => ({ AgentAvatar: () => null }));
vi.mock("./HunterTypewriter", () => ({
  // The reveal animation is not what this file is about; render the reply at
  // once and report done, so its feedback row mounts synchronously.
  HunterTypewriter: ({ text, onDone }: { text: string; onDone?: () => void }) => {
    onDone?.();
    return <span>{text}</span>;
  },
}));

const { HunterChatOverlay } = await import("./HunterChatOverlay");

const COMPOSER = "Ask Hunter — try 'what's out there for me?'";

const composer = () => screen.getByPlaceholderText(COMPOSER) as HTMLTextAreaElement;

beforeEach(() => {
  sessionStorage.clear();
  postHunterMessage.mockReset();
  postHunterFeedback.mockClear();
  capture.mockClear();
});

afterEach(cleanup);

describe("V6(a) the row renders on the seed message at first paint", () => {
  it("offers copy, both thumbs and the flag under the opening message", () => {
    render(<HunterChatOverlay open onOpenChange={vi.fn()} tab="for_you" />);
    for (const name of ["Copy response", "Helpful", "Not helpful", "Flag as inaccurate"]) {
      expect(screen.getByRole("button", { name })).toBeTruthy();
    }
  });

  it("no longer gates the row on the message id", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/components/Hunter/HunterChatOverlay.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/m\.id !== "seed"/);
  });
});

describe("V6(b) activating it reaches a real destination — the composer", () => {
  it("puts the member's objection in the message box, and sending it makes a turn", async () => {
    postHunterMessage.mockResolvedValue({
      chatReply: "Understood — switching to North Carolina.",
      uiPayload: { kind: "none", data: null },
      sessionId: "sess-1",
      turnId: "65f0c0ffee0c0ffee0c0ffee",
    });
    render(<HunterChatOverlay open onOpenChange={vi.fn()} tab="for_you" />);

    fireEvent.click(screen.getByRole("button", { name: "Not helpful" }));
    fireEvent.change(screen.getByLabelText("Feedback comment"), {
      target: { value: "I work in North Carolina, not Texas" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send to hunter/i }));

    // The hand-off is visible: the note is in the composer, ready to send.
    expect(composer().value).toContain("I work in North Carolina, not Texas");
    expect(postHunterFeedback).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(postHunterMessage).toHaveBeenCalledTimes(1));
    expect(String(postHunterMessage.mock.calls[0][0])).toContain(
      "I work in North Carolina, not Texas",
    );
  });

  it("does not leave the seed's rating silent — the rating itself is captured", () => {
    render(<HunterChatOverlay open onOpenChange={vi.fn()} tab="for_you" />);
    fireEvent.click(screen.getByRole("button", { name: "Not helpful" }));
    expect(capture).toHaveBeenCalledWith(
      "hunter_chat_response_rated",
      expect.objectContaining({ rating: "not_helpful", message_id: "seed" }),
    );
  });
});

describe("V6(c) a real turn still posts its feedback to the backend", () => {
  it("rates Hunter's own reply against its turnId, not the composer", async () => {
    postHunterMessage.mockResolvedValue({
      chatReply: "Three roofing jobs in your state.",
      uiPayload: { kind: "none", data: null },
      sessionId: "sess-1",
      turnId: "65f0c0ffee0c0ffee0c0ffee",
    });
    render(<HunterChatOverlay open onOpenChange={vi.fn()} tab="for_you" />);

    fireEvent.change(composer(), { target: { value: "what's out there?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Not helpful" })).toHaveLength(2),
    );

    // The reply's own row is the second one — the seed keeps the first.
    const rows = screen.getAllByRole("button", { name: "Not helpful" });
    fireEvent.click(rows[rows.length - 1]);
    expect(postHunterFeedback).toHaveBeenCalledWith("65f0c0ffee0c0ffee0c0ffee", "down");
    expect(screen.getByRole("button", { name: /^submit$/i })).toBeTruthy();
  });
});

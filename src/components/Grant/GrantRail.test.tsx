// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { GrantRail } from "./GrantRail";
import type { GrantAnalysis } from "../../lib/grant/types";
import {
  fetchRailReply,
  fetchRailSession,
  resetRailSession,
  type RailReply,
} from "../../lib/grant/rail";
import { MENTOR_DEADLINE_TOO_CLOSE_MESSAGE } from "../../lib/entitlements";

vi.mock("../../lib/grant/rail", () => ({
  MAX_RAIL_MESSAGE: 2000,
  fetchRailSession: vi.fn(),
  fetchRailReply: vi.fn(),
  resetRailSession: vi.fn(),
  recordRailSkip: vi.fn(),
}));

const analysis = {
  opportunityId: "opp-1",
  meta: { checksRun: 26, sourcesConsulted: 6 },
  rail: {
    briefing: [[{ text: "I've read this one." }]],
    openQuestions: [],
    suggestedChips: [],
  },
} as unknown as GrantAnalysis;

function mount(onReviewWithMentor?: () => void, mentorDisabledReason?: string | null) {
  return render(
    <GrantRail
      analysis={analysis}
      open
      onOpenChange={() => {}}
      onReviewWithMentor={onReviewWithMentor}
      mentorDisabledReason={mentorDisabledReason}
    />,
  );
}

/** Sends one composer turn and waits for Grant's reply bubble. */
async function sendTurn(text: string, replyText: string) {
  fireEvent.change(screen.getByLabelText("Ask Grant"), {
    target: { value: text },
  });
  fireEvent.click(screen.getByLabelText("Send"));
  await waitFor(() => expect(screen.getByText(replyText)).toBeTruthy());
}

const reply = (over: Partial<RailReply>): RailReply => ({
  kind: "interrogate",
  reply: "ok",
  ...over,
});

beforeEach(() => {
  cleanup();
  vi.mocked(fetchRailSession).mockResolvedValue({ messages: [], skipped: {} });
  vi.mocked(fetchRailReply).mockReset();
  vi.mocked(resetRailSession).mockResolvedValue(true);
});

describe("GrantRail — the drafting deflection's mentor CTA (UAT #46 item 2)", () => {
  it("renders the mentor button under a draft_request reply and dispatches to the owner", async () => {
    const onMentor = vi.fn();
    vi.mocked(fetchRailReply).mockResolvedValue(
      reply({
        kind: "draft_request",
        reply: "Ava AI - our Proposal Drafter is still under construction.",
        cta: "mentor",
      }),
    );
    mount(onMentor);
    await sendTurn(
      "draft my proposal",
      "Ava AI - our Proposal Drafter is still under construction.",
    );

    const btn = screen.getByRole("button", { name: "Schedule a mentor call" });
    fireEvent.click(btn);
    expect(onMentor).toHaveBeenCalledTimes(1);
  });

  it("renders no CTA on an ordinary reply", async () => {
    vi.mocked(fetchRailReply).mockResolvedValue(reply({ reply: "The incumbent holds it." }));
    mount(vi.fn());
    await sendTurn("who holds it?", "The incumbent holds it.");
    expect(screen.queryByRole("button", { name: "Schedule a mentor call" })).toBeNull();
  });

  it("renders disabled with the deadline-gate tooltip and does not dispatch when mentorDisabledReason is set", async () => {
    const onMentor = vi.fn();
    vi.mocked(fetchRailReply).mockResolvedValue(
      reply({
        kind: "draft_request",
        reply: "Ava AI - our Proposal Drafter is still under construction.",
        cta: "mentor",
      }),
    );
    mount(onMentor, MENTOR_DEADLINE_TOO_CLOSE_MESSAGE);
    await sendTurn(
      "draft my proposal",
      "Ava AI - our Proposal Drafter is still under construction.",
    );

    const btn = screen.getByRole("button", { name: "Schedule a mentor call" });
    expect(btn).toHaveProperty("disabled", true);
    expect(btn.closest("span")?.getAttribute("title")).toBe(MENTOR_DEADLINE_TOO_CLOSE_MESSAGE);
    fireEvent.click(btn);
    expect(onMentor).not.toHaveBeenCalled();
  });
});

describe("GrantRail — Start over (UAT #46 item 3)", () => {
  it("is a text button in the header, shown only once there is a thread, and clears it", async () => {
    vi.mocked(fetchRailReply).mockResolvedValue(reply({ reply: "hello" }));
    mount();

    // Nothing to clear yet → no control (it must never read as a dead button).
    expect(screen.queryByRole("button", { name: /start over/i })).toBeNull();

    await sendTurn("hi", "hello");
    const btn = screen.getByRole("button", {
      name: "Start over — clear this conversation",
    });
    // Hunter's format: a plain text link, not an icon.
    expect(btn.textContent).toBe("Start over");
    expect(btn.className).toContain("chip-inline-link");

    fireEvent.click(btn);
    await waitFor(() => expect(vi.mocked(resetRailSession)).toHaveBeenCalledWith("opp-1"));
    // The thread is gone, and with it the control.
    await waitFor(() => expect(screen.queryByRole("button", { name: /start over/i })).toBeNull());
  });
});

describe("GrantRail — answered questions are revisable (edit answers)", () => {
  const answeredAnalysis = {
    ...analysis,
    rail: {
      ...analysis.rail,
      answeredQuestions: [
        {
          id: "q_bonding",
          question: [{ text: "Can your cash and bonding absorb this?" }],
          value: "Yes, $2M",
        },
      ],
    },
  } as unknown as GrantAnalysis;

  function mountAnswered() {
    return render(<GrantRail analysis={answeredAnalysis} open onOpenChange={() => {}} />);
  }

  it("lists what the member told Grant, with the stored value", () => {
    mountAnswered();
    expect(screen.getByText("You told me")).toBeTruthy();
    expect(screen.getByText("Can your cash and bonding absorb this?")).toBeTruthy();
    expect(screen.getByText("Yes, $2M")).toBeTruthy();
  });

  it("clicking a row opens the question for revision; Cancel keeps the answer", () => {
    mountAnswered();
    fireEvent.click(screen.getByLabelText("Edit answer: Can your cash and bonding absorb this?"));
    // The edit card shows the current answer and a Cancel (not Skip) control.
    expect(screen.getByText(/“Yes, \$2M”/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    // Back to the list — nothing was sent.
    expect(vi.mocked(fetchRailReply)).not.toHaveBeenCalled();
    expect(screen.getByText("You told me")).toBeTruthy();
  });

  it("submitting a revision sends it anchored to the question so the store overwrites", async () => {
    vi.mocked(fetchRailReply).mockResolvedValue(reply({ kind: "supply", reply: "Updated." }));
    mountAnswered();
    fireEvent.click(screen.getByLabelText("Edit answer: Can your cash and bonding absorb this?"));
    const field = screen.getByPlaceholderText("Type your answer, or ask me anything");
    fireEvent.change(field, {
      target: { value: "Actually no — bonding lapsed" },
    });
    fireEvent.submit(field.closest("form")!);
    await waitFor(() =>
      expect(vi.mocked(fetchRailReply)).toHaveBeenCalledWith(
        "opp-1",
        "Actually no — bonding lapsed",
        "Can your cash and bonding absorb this?",
      ),
    );
    // The edit card closed optimistically on submit.
    await waitFor(() => expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull());
  });
});

// The counts are a claim about work performed. An unanalyzed opportunity reports
// 0/0, and "0 checks · 0 sources" would state the absence as a measurement.
describe("GrantRail — unanalyzed opportunity", () => {
  const emptyAnalysis = {
    opportunityId: "opp-unanalyzed",
    meta: { checksRun: 0, sourcesConsulted: 0 },
    rail: {
      briefing: [[{ text: "I haven't analyzed this one yet." }]],
      openQuestions: [],
      suggestedChips: [],
    },
  } as unknown as GrantAnalysis;

  it("does not print a zero check/source count", () => {
    render(<GrantRail analysis={emptyAnalysis} open onOpenChange={() => {}} />);
    expect(screen.queryByText(/checks/i)).toBeNull();
    expect(screen.queryByText(/sources/i)).toBeNull();
  });

  it("still shows the briefing, so the rail is usable", () => {
    render(<GrantRail analysis={emptyAnalysis} open onOpenChange={() => {}} />);
    expect(screen.getByText(/haven't analyzed this one yet/i)).toBeTruthy();
  });
});

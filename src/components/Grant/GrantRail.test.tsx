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

  const CHANGE_BONDING =
    "Change your answer to Can your cash and bonding absorb this?. Current answer: Yes, $2M";

  function mountAnswered() {
    return render(<GrantRail analysis={answeredAnalysis} open onOpenChange={() => {}} />);
  }

  it("shows a Change label and a hint; clicking Change opens the edit card", () => {
    mountAnswered();
    expect(
      screen.getByText("Select Change to update an answer. Grant then updates his take."),
    ).toBeTruthy();
    fireEvent.click(screen.getByText("Change"));
    expect(screen.getByText(/“Yes, \$2M”/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
  });

  it("lists what the member told Grant, with the stored value", () => {
    mountAnswered();
    expect(screen.getByText("Your answers to Grant")).toBeTruthy();
    expect(screen.getByText("Can your cash and bonding absorb this?")).toBeTruthy();
    expect(screen.getByText("Yes, $2M")).toBeTruthy();
  });

  it("clicking a row opens the question for revision; Cancel keeps the answer", () => {
    mountAnswered();
    fireEvent.click(screen.getByLabelText(CHANGE_BONDING));
    // The edit card shows the current answer and a Cancel (not Skip) control.
    expect(screen.getByText(/“Yes, \$2M”/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    // Back to the list — nothing was sent.
    expect(vi.mocked(fetchRailReply)).not.toHaveBeenCalled();
    expect(screen.getByText("Your answers to Grant")).toBeTruthy();
  });

  it("submitting a revision sends it anchored to the question so the store overwrites", async () => {
    vi.mocked(fetchRailReply).mockResolvedValue(reply({ kind: "supply", reply: "Updated." }));
    mountAnswered();
    fireEvent.click(screen.getByLabelText(CHANGE_BONDING));
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

  const withAnswer = (value: string) =>
    ({
      ...answeredAnalysis,
      rail: {
        ...answeredAnalysis.rail,
        answeredQuestions: [{ ...answeredAnalysis.rail.answeredQuestions![0], value }],
      },
    }) as GrantAnalysis;

  it("a reload keeps an open edit card when its answer still exists", () => {
    const { rerender } = mountAnswered();
    fireEvent.click(screen.getByLabelText(CHANGE_BONDING));
    rerender(<GrantRail analysis={withAnswer("Yes, $3M")} open onOpenChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
    expect(screen.getByText(/“Yes, \$3M”/)).toBeTruthy();
  });

  it("a reload closes the edit card when its answer is gone", () => {
    const { rerender } = mountAnswered();
    fireEvent.click(screen.getByLabelText(CHANGE_BONDING));
    rerender(<GrantRail analysis={analysis} open onOpenChange={() => {}} />);
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });

  it("the same Change from the take card opens the card again after Cancel", () => {
    const rail = (nonce: number) => (
      <GrantRail
        analysis={answeredAnalysis}
        open
        onOpenChange={() => {}}
        editRequest={{ id: "q_bonding", nonce }}
      />
    );
    const { rerender } = render(rail(1));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    rerender(rail(2));
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
  });

  it("an edit request with an unknown id does nothing", () => {
    render(
      <GrantRail
        analysis={answeredAnalysis}
        open
        onOpenChange={() => {}}
        editRequest={{ id: "q_unknown", nonce: 1 }}
      />,
    );
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    expect(screen.getByText("Your answers to Grant")).toBeTruthy();
  });

  it("tells the parent while a message is sending", async () => {
    let resolve: (r: RailReply) => void = () => {};
    vi.mocked(fetchRailReply).mockReturnValue(new Promise((r) => (resolve = r)));
    const onSendingChange = vi.fn();
    render(
      <GrantRail
        analysis={answeredAnalysis}
        open
        onOpenChange={() => {}}
        onSendingChange={onSendingChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("Ask Grant"), { target: { value: "Why?" } });
    fireEvent.click(screen.getByLabelText("Send"));
    await waitFor(() => expect(onSendingChange).toHaveBeenLastCalledWith(true));
    expect(screen.getByLabelText(CHANGE_BONDING)).toHaveProperty("disabled", true);
    resolve(reply({ reply: "Because." }));
    await waitFor(() => expect(onSendingChange).toHaveBeenLastCalledWith(false));
  });

  it("an edit request from the take card opens the edit card for that answer", () => {
    const { rerender } = mountAnswered();
    rerender(
      <GrantRail
        analysis={answeredAnalysis}
        open
        onOpenChange={() => {}}
        editRequest={{ id: "q_bonding", nonce: 1 }}
      />,
    );
    expect(screen.getByText(/“Yes, \$2M”/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
  });

  it("a yes/no answer is edited with the Yes and No buttons, and sends the chosen value", async () => {
    vi.mocked(fetchRailReply).mockResolvedValue(reply({ kind: "supply", reply: "Updated." }));
    const question = "Can you do the on-site work in Goldsboro, NC?";
    const yesNoAnalysis = {
      ...analysis,
      rail: {
        ...analysis.rail,
        answeredQuestions: [
          { id: "q_place", question: [{ text: question }], value: "No", input: { kind: "yesno" } },
        ],
      },
    } as unknown as GrantAnalysis;
    render(<GrantRail analysis={yesNoAnalysis} open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByLabelText(`Change your answer to ${question}. Current answer: No`));
    expect(screen.getByRole("button", { name: "No" })).toBeTruthy();
    expect(screen.queryByPlaceholderText("Type your answer, or ask me anything")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    await waitFor(() =>
      expect(vi.mocked(fetchRailReply)).toHaveBeenCalledWith("opp-1", "Yes", question),
    );
  });
});

describe("GrantRail — an unclear answer", () => {
  it("asks the member to tap Yes or No", () => {
    const unclear = {
      ...analysis,
      rail: {
        ...analysis.rail,
        openQuestions: [
          {
            id: "q_place",
            question: [{ text: "Can you do the on-site work in Goldsboro, NC?" }],
            payoff: [{ text: "why" }],
            verdictSwing: 0.8,
            input: { kind: "yesno" },
            status: "open",
            unclear: true,
          },
        ],
      },
    } as unknown as GrantAnalysis;
    render(<GrantRail analysis={unclear} open onOpenChange={() => {}} />);
    expect(
      screen.getByText("I couldn't tell if that was a yes or a no. Tap Yes or No."),
    ).toBeTruthy();
  });
});

describe("GrantRail — an answer reused from another opportunity", () => {
  const note = "You told me on “Paint the county garage”, Nov 3, 2026.";
  const reusedAnalysis = {
    ...analysis,
    rail: {
      ...analysis.rail,
      answeredQuestions: [
        {
          id: "q_bonding",
          question: [{ text: "Can your cash and bonding absorb this?" }],
          value: "No",
          reusedFrom: { title: "Paint the county garage", date: "Nov 3, 2026" },
        },
      ],
    },
  } as unknown as GrantAnalysis;

  it("says where and when the member gave it, also to a screen reader", () => {
    render(<GrantRail analysis={reusedAnalysis} open onOpenChange={() => {}} />);
    expect(screen.getByText(note)).toBeTruthy();
    expect(
      screen.getByLabelText(`Change your answer to Can your cash and bonding absorb this?. Current answer: No ${note}`),
    ).toBeTruthy();
  });

  it('says "another opportunity" when the title is not known', () => {
    const untitled = {
      ...reusedAnalysis,
      rail: {
        ...reusedAnalysis.rail,
        answeredQuestions: [
          {
            ...reusedAnalysis.rail.answeredQuestions![0],
            reusedFrom: { title: null, date: "Nov 3, 2026" },
          },
        ],
      },
    } as GrantAnalysis;
    render(<GrantRail analysis={untitled} open onOpenChange={() => {}} />);
    expect(screen.getByText("You told me on another opportunity, Nov 3, 2026.")).toBeTruthy();
  });

  it("the edit card says it in one sentence, and that a new answer applies only here", () => {
    render(<GrantRail analysis={reusedAnalysis} open onOpenChange={() => {}} />);
    fireEvent.click(
      screen.getByLabelText(`Change your answer to Can your cash and bonding absorb this?. Current answer: No ${note}`),
    );
    const payoff = screen.getByText(/A new answer applies only to this opportunity/);
    expect(payoff.closest("p, div")?.textContent).toContain(
      "On “Paint the county garage” (Nov 3, 2026) you said “No”. A new answer applies only to this opportunity and refreshes the take.",
    );
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

describe("GrantRail — Grant leads the clarifying questions", () => {
  const q = (id: string, text: string) => ({
    id,
    question: [{ text }],
    payoff: [{ text: "why" }],
    verdictSwing: 0.6,
    input: { kind: "yesno" },
    status: "open",
  });
  const withQuestions = {
    ...analysis,
    rail: { ...analysis.rail, openQuestions: [q("a", "License?"), q("b", "Dealer?")] },
  } as unknown as GrantAnalysis;
  const rail = (askRequest?: { id: string; nonce: number }) => (
    <GrantRail analysis={withQuestions} open onOpenChange={() => {}} askRequest={askRequest} />
  );

  it("opens by saying how much it needs, then asks the top question", () => {
    render(rail());
    expect(screen.getByText(/I have 2 questions for you/)).toBeTruthy();
    expect(screen.getByText("License?")).toBeTruthy();
  });

  it("shows the plain wording but sends the original, which keys the stored answer", async () => {
    vi.mocked(fetchRailReply).mockResolvedValue(reply({ kind: "supply" }));
    const plain = {
      ...withQuestions,
      rail: {
        ...withQuestions.rail,
        openQuestions: [{ ...q("a", "License?"), display: [{ text: "Do you have the license?" }] }],
      },
    } as unknown as GrantAnalysis;
    render(<GrantRail analysis={plain} open onOpenChange={() => {}} />);
    expect(screen.getByText("Do you have the license?")).toBeTruthy();
    expect(screen.queryByText("License?")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    await waitFor(() =>
      expect(vi.mocked(fetchRailReply)).toHaveBeenCalledWith(expect.anything(), "Yes", "License?"),
    );
  });

  it("a tap on the canvas brings that question to the card, without changing the count", () => {
    const { rerender } = render(rail());
    rerender(rail({ id: "b", nonce: 1 }));
    expect(screen.getByText("Dealer?")).toBeTruthy();
    expect(screen.queryByText("License?")).toBeNull();
    expect(screen.getByText("Let's answer this one.")).toBeTruthy();
    expect(document.querySelector(".grant-dock__need")?.textContent).toContain("2");
  });
});

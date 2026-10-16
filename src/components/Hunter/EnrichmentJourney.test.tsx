// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import type {
  EnrichmentStatePayload,
  NextQuestionPayload,
  CompletePayload,
  AnswerResultPayload,
  SkipResultPayload,
  MilestoneRailItem,
  OrganicOffer,
} from "../../lib/enrichment";
import type { ActPayload, ProfileAsk } from "../../lib/hunterChat";

const {
  enterEnrichment,
  getEnrichmentState,
  getNextEnrichment,
  answerEnrichment,
  skipEnrichment,
  backEnrichment,
  fetchOrganicOffer,
  confirmOrganicOffer,
  pauseEnrichment,
} = vi.hoisted(() => ({
  enterEnrichment: vi.fn(),
  getEnrichmentState: vi.fn(),
  getNextEnrichment: vi.fn(),
  answerEnrichment: vi.fn(),
  skipEnrichment: vi.fn(),
  backEnrichment: vi.fn(),
  fetchOrganicOffer: vi.fn(),
  confirmOrganicOffer: vi.fn(),
  pauseEnrichment: vi.fn(),
}));
vi.mock("../../lib/enrichment", async (orig) => {
  const actual = await orig<typeof import("../../lib/enrichment")>();
  return {
    ...actual,
    enterEnrichment,
    getEnrichmentState,
    getNextEnrichment,
    answerEnrichment,
    skipEnrichment,
    backEnrichment,
    fetchOrganicOffer,
    confirmOrganicOffer,
    pauseEnrichment,
  };
});

import { EnrichmentJourney } from "./EnrichmentJourney";

const rail: MilestoneRailItem[] = [
  {
    milestone: "A_work_and_where",
    label: "What you do & where",
    status: "active",
    answered: 1,
    total: 3,
  },
  { milestone: "B_how_you_win", label: "How you win", status: "upcoming", answered: 0, total: 4 },
  { milestone: "C_readiness", label: "Readiness", status: "upcoming", answered: 0, total: 3 },
  { milestone: "D_sharpen", label: "Sharpen", status: "upcoming", answered: 0, total: 1 },
];

const activeState: EnrichmentStatePayload = {
  posture: "ENRICHMENT",
  active: true,
  paused: false,
  atCheckpoint: false,
  milestone: "A_work_and_where",
  rail,
  payoffDelta: { unlocked: 0, sharpened: 0 },
  scoringMode: "rule_only",
  embedReady: false,
};

const question: NextQuestionPayload = {
  kind: "question",
  milestone: "A_work_and_where",
  ask: {
    id: "crew_size:open",
    field: "crew_size",
    label: "Crew size",
    askType: "open",
    question: "How many field crew do you run?",
    allowNotSure: false,
  },
  elicitShape: "gate",
  rail,
};

const complete: CompletePayload = {
  kind: "complete",
  rail,
  totalPayoff: { unlocked: 12, sharpened: 5 },
};

const answerResult: AnswerResultPayload = {
  kind: "answer",
  acknowledged: "crew_size",
  delta: { unlocked: 2, sharpened: 1 },
  totalPayoff: { unlocked: 2, sharpened: 1 },
  embedPending: false,
  scoringMode: "rule_only",
  atCheckpoint: false,
};

const followUpAsk: ProfileAsk = {
  id: "crew_size:followup",
  field: "crew_size_detail",
  label: "Crew size detail",
  askType: "open",
  question: "Can you say a bit more about your crew size?",
  allowNotSure: false,
};

const answerResultWithFollowUp: AnswerResultPayload = {
  ...answerResult,
  followUp: followUpAsk,
};

const deferAct: ActPayload = {
  gap: { kind: "capability", oppKey: null, title: null, setAsideName: null, note: null },
  trustLevel: "high",
  offers: [
    {
      slug: "capability-statement",
      name: "Capability Statement",
      benefit: "Get bid-ready",
      selfServeDestination: null,
      externalGuidance: null,
    },
  ],
};

const capQuestion: NextQuestionPayload = {
  kind: "question",
  milestone: "C_readiness",
  ask: {
    id: "capability statement:doc",
    field: "capability statement",
    label: "Capability statement",
    askType: "doc",
    question: "Do you have a capability statement on file?",
    allowNotSure: true,
  },
  elicitShape: "gate",
  rail,
};

const skipResult: SkipResultPayload = {
  kind: "skip",
  field: "capability statement",
  parked: true,
  deferAct,
  atCheckpoint: false,
};

const organicOffer: OrganicOffer = {
  id: "service states:confirm",
  field: "service states",
  label: "Where you work",
  askType: "confirm",
  question: "Should I add Texas to the states you serve?",
  proposal: {
    value: "TX",
    provenance: {
      source: "signal",
      signal: "your search for work in Texas",
      observedAt: "2026-07-24T00:00:00Z",
    },
    confidence_tag: "inferred",
  },
  allowNotSure: false,
};

beforeEach(() => {
  cleanup();
  getEnrichmentState.mockReset();
  getNextEnrichment.mockReset();
  answerEnrichment.mockReset();
  skipEnrichment.mockReset();
  backEnrichment.mockReset();
  fetchOrganicOffer.mockReset();
  confirmOrganicOffer.mockReset();
  pauseEnrichment.mockReset();
  // Opening the builder goes through `POST /enter`, so every test that opens it
  // needs this to resolve. The default is the in-session state, which is what
  // the server returns for a member pressing the entry button.
  enterEnrichment.mockReset();
  enterEnrichment.mockResolvedValue(activeState);
});

/**
 * Do what the member does to open the builder: press the entry button.
 *
 * The builder is CLOSED on every visit — enrichment is member-initiated, so the
 * feed never opens a profile question nobody asked for. A test about what the
 * builder shows therefore has to open it first. Tests about the idle dock, and
 * tests that open it another way (an `editRequest`, a rail jump), do not call
 * this.
 */
async function openBuilder() {
  const entry = await screen.findByRole("button", {
    name: /sharpen your matches|complete your profile|resume profile setup/i,
  });
  fireEvent.click(entry);
}

describe("EnrichmentJourney — active question step", () => {
  it("renders the next question via ProfileAskBlock and the milestone rail", async () => {
    getEnrichmentState.mockResolvedValue(activeState);
    getNextEnrichment.mockResolvedValue(question);

    render(<EnrichmentJourney />);

    await openBuilder();

    await waitFor(() => expect(screen.getByText("How many field crew do you run?")).toBeTruthy());
    // The rail renders the four milestones with an honest step caption.
    expect(screen.getByText(/Step 1 of 4 — What you do & where/)).toBeTruthy();
    // An open ask carries NO fabricated default value.
    expect((screen.getByLabelText("Crew size") as HTMLInputElement).value).toBe("");
  });

  it("routes a confirmed answer to POST /answer and advances", async () => {
    getEnrichmentState.mockResolvedValue(activeState);
    getNextEnrichment.mockResolvedValueOnce(question).mockResolvedValueOnce(complete);
    answerEnrichment.mockResolvedValue(answerResult);

    render(<EnrichmentJourney />);

    await openBuilder();
    await waitFor(() => expect(screen.getByLabelText("Crew size")).toBeTruthy());

    fireEvent.change(screen.getByLabelText("Crew size"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(answerEnrichment).toHaveBeenCalledWith({ field: "crew_size", value: "6" }),
    );
  });

  it("renders the ActCard for a deferred service-mappable collectible", async () => {
    getEnrichmentState.mockResolvedValue(activeState);
    getNextEnrichment.mockResolvedValue(capQuestion);
    skipEnrichment.mockResolvedValue(skipResult);

    render(<EnrichmentJourney />);

    await openBuilder();
    await waitFor(() =>
      expect(screen.getByText("Do you have a capability statement on file?")).toBeTruthy(),
    );

    // "Later" defers → backend returns the full ActPayload → ActCard renders.
    fireEvent.click(screen.getByRole("button", { name: "Later" }));
    await waitFor(() => expect(screen.getByText("Capability Statement")).toBeTruthy());
    expect(screen.getByText("Close the gap")).toBeTruthy();
  });
});

describe("EnrichmentJourney — follow-up flow", () => {
  it("swaps in the follow-up ask, then advances without re-showing it", async () => {
    getEnrichmentState.mockResolvedValue(activeState);
    getNextEnrichment.mockResolvedValueOnce(question).mockResolvedValueOnce(complete);
    answerEnrichment
      .mockResolvedValueOnce(answerResultWithFollowUp)
      .mockResolvedValueOnce(answerResult);

    render(<EnrichmentJourney />);

    await openBuilder();
    await waitFor(() => expect(screen.getByLabelText("Crew size")).toBeTruthy());

    fireEvent.change(screen.getByLabelText("Crew size"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    // The follow-up renders in place of the original question — never both at once.
    await waitFor(() =>
      expect(screen.getByText("Can you say a bit more about your crew size?")).toBeTruthy(),
    );
    expect(screen.queryByText("How many field crew do you run?")).toBeNull();

    // Answering the follow-up clears it (setFollowUp(null)) and advances the flow —
    // the second answerEnrichment result carries no followUp, so it's not re-shown.
    fireEvent.change(screen.getByLabelText("Crew size detail"), {
      target: { value: "6 full-time, 2 seasonal" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    // Matched on the clause, not the whole sentence: the copy now ends by naming
    // the panel's "Edit" control, and the `<strong>` around it splits the text
    // across nodes. What this asserts is that the journey reported completion.
    await waitFor(() => expect(screen.getByText(/your matches are sharpened/)).toBeTruthy());
    expect(screen.queryByText("Can you say a bit more about your crew size?")).toBeNull();
    expect(answerEnrichment).toHaveBeenCalledTimes(2);
    expect(answerEnrichment).toHaveBeenNthCalledWith(2, {
      field: "crew_size_detail",
      value: "6 full-time, 2 seasonal",
    });
  });
});

describe("EnrichmentJourney — follow-up extends a list answer (F2)", () => {
  const listQuestion: NextQuestionPayload = {
    kind: "question",
    milestone: "B_how_you_win",
    ask: {
      id: "specializations:open",
      field: "specializations",
      label: "Your specialization",
      askType: "open",
      question: "What narrower specialty sets your work apart within your trade?",
      allowNotSure: false,
    },
    elicitShape: "list",
    rail,
  };

  const listFollowUpAsk: ProfileAsk = {
    id: "specializations:followup",
    field: "specializations",
    label: "Your specialization",
    askType: "open",
    question: "Can you say more about your specialization?",
    allowNotSure: false,
  };

  const listAnswerResultWithFollowUp: AnswerResultPayload = {
    kind: "answer",
    acknowledged: "specializations",
    delta: { unlocked: 0, sharpened: 0 },
    totalPayoff: { unlocked: 0, sharpened: 0 },
    embedPending: false,
    scoringMode: "rule_only",
    atCheckpoint: false,
    followUp: listFollowUpAsk,
  };

  const listAnswerResult: AnswerResultPayload = {
    ...listAnswerResultWithFollowUp,
    followUp: undefined,
  };

  it("renders the follow-up as a free-text ask seeded with the prior answer, and submits the union", async () => {
    getEnrichmentState.mockResolvedValue(activeState);
    getNextEnrichment.mockResolvedValueOnce(listQuestion).mockResolvedValueOnce(complete);
    answerEnrichment
      .mockResolvedValueOnce(listAnswerResultWithFollowUp)
      .mockResolvedValueOnce(listAnswerResult);

    render(<EnrichmentJourney />);

    await openBuilder();
    await waitFor(() => expect(screen.getByLabelText("Your specialization")).toBeTruthy());

    // A thin original answer, typed however the member likes.
    fireEvent.change(screen.getByLabelText("Your specialization"), { target: { value: "HVAC" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(answerEnrichment).toHaveBeenNthCalledWith(1, {
        field: "specializations",
        value: "HVAC",
        freeText: true,
      }),
    );

    // The follow-up re-asks in the same free-text box, PRE-FILLED with what they
    // already said — so they extend rather than retype or lose it.
    await waitFor(() =>
      expect(screen.getByText("Can you say more about your specialization?")).toBeTruthy(),
    );
    expect((screen.getByLabelText("Your specialization") as HTMLTextAreaElement).value).toBe(
      "HVAC",
    );

    fireEvent.change(screen.getByLabelText("Your specialization"), {
      target: { value: "HVAC, rooftop units" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(answerEnrichment).toHaveBeenNthCalledWith(2, {
        field: "specializations",
        value: "HVAC, rooftop units",
        freeText: true,
      }),
    );
  });

  it("surfaces a search-implied offer and confirm writes via the client", async () => {
    getEnrichmentState.mockResolvedValue({ ...activeState, active: false });
    fetchOrganicOffer.mockResolvedValue(organicOffer);

    render(<EnrichmentJourney appliedFilters={{ states: ["TX"] }} />);

    await waitFor(() =>
      expect(screen.getByText("Should I add Texas to the states you serve?")).toBeTruthy(),
    );
    expect(fetchOrganicOffer).toHaveBeenCalledWith({ states: ["TX"], naics: [], setAsides: [] });

    fireEvent.click(screen.getByRole("button", { name: /add it/i }));
    await waitFor(() => expect(confirmOrganicOffer).toHaveBeenCalledWith(organicOffer));
  });

  it("dismiss removes the offer and never writes", async () => {
    getEnrichmentState.mockResolvedValue({ ...activeState, active: false });
    fetchOrganicOffer.mockResolvedValue(organicOffer);

    render(<EnrichmentJourney appliedFilters={{ states: ["TX"] }} />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /just exploring/i })).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole("button", { name: /just exploring/i }));
    await waitFor(() =>
      expect(screen.queryByText("Should I add Texas to the states you serve?")).toBeNull(),
    );
    expect(confirmOrganicOffer).not.toHaveBeenCalled();
  });
});

/**
 * The closing card used to state no result at all: `/next` sends `totalPayoff`
 * on the complete payload and the component destructured nothing from it, so a
 * member finished the journey and was told only that it was over.
 */
describe("EnrichmentJourney — the closing card", () => {
  it("states the journey's running total", async () => {
    getEnrichmentState.mockResolvedValue({ ...activeState });
    getNextEnrichment.mockResolvedValue(complete);

    render(<EnrichmentJourney />);

    await openBuilder();

    await waitFor(() => expect(screen.getByText(/That's everything for now/)).toBeTruthy());
    expect(screen.getByText("So far")).toBeTruthy();
    expect(screen.getByText("+12 unlocked")).toBeTruthy();
    expect(screen.getByText("5 got stronger")).toBeTruthy();
  });

  it("states an empty journey as an absence, not as a gain", async () => {
    getEnrichmentState.mockResolvedValue({ ...activeState });
    getNextEnrichment.mockResolvedValue({
      ...complete,
      totalPayoff: { unlocked: 0, sharpened: 0 },
    });

    render(<EnrichmentJourney />);

    await openBuilder();

    await waitFor(() => expect(screen.getByText("Nothing has opened up yet")).toBeTruthy());
  });
});

describe("EnrichmentJourney — sharpen re-entry", () => {
  // The trigger moved out of this component: the "Sharpen my matches" button that
  // sat in the dock is now the knows-you panel's "Edit", which raises a FIELD-LESS
  // EditFieldRequest. The behaviour under test — a whole-journey reopen, not a
  // plain enter — is unchanged, so the coverage follows the trigger rather than
  // being deleted with the button.
  it("reopens the WHOLE journey when an edit request carries no field", async () => {
    getEnrichmentState.mockResolvedValue({ ...activeState });
    getNextEnrichment.mockResolvedValueOnce(complete).mockResolvedValueOnce(question);
    enterEnrichment.mockResolvedValue({ ...activeState });

    // No `openBuilder()` here: a field-less edit request IS an explicit ask to
    // see the builder, so `reopen` opens it without the entry button.
    render(<EnrichmentJourney editRequest={{ token: 1 }} />);

    // `reopen` is what un-parks skipped fields and re-offers answered ones — a plain
    // enter would just report the finished journey. No `fields` key: a field-less
    // request must not narrow to a targeted edit.
    await waitFor(() => expect(enterEnrichment).toHaveBeenCalledWith(true, { reopen: true }));
    // ONE fetch, from the reopen. Mounting no longer pulls a card of its own:
    // the builder is closed until the member opens it, so a second call here
    // would mean the component had asked for a question nobody wanted.
    await waitFor(() => expect(getNextEnrichment).toHaveBeenCalledTimes(1));
  });

  it("still narrows to one field when the request names one", async () => {
    getEnrichmentState.mockResolvedValue({ ...activeState });
    getNextEnrichment.mockResolvedValueOnce(complete).mockResolvedValueOnce(question);
    enterEnrichment.mockResolvedValue({ ...activeState });

    render(<EnrichmentJourney editRequest={{ field: "service_states", token: 2 }} />);

    await waitFor(() =>
      expect(enterEnrichment).toHaveBeenCalledWith(true, {
        reopen: true,
        fields: ["service_states"],
      }),
    );
  });
});

describe("EnrichmentJourney — stepping back a card", () => {
  const backable: NextQuestionPayload = { ...question, canGoBack: true };
  const previous: NextQuestionPayload = {
    ...question,
    canGoBack: false,
    ask: {
      ...question.ask,
      id: "service_states:confirm",
      field: "service_states",
      label: "Where you work",
      question: "Which states can you perform work in?",
    },
  };

  it("registers the click immediately, before the round trip lands", async () => {
    getEnrichmentState.mockResolvedValue(activeState);
    getNextEnrichment.mockResolvedValue(backable);
    // Hold the response open: what the member sees WHILE waiting is the point.
    let release: (payload: NextQuestionPayload) => void = () => {};
    backEnrichment.mockReturnValue(
      new Promise<NextQuestionPayload>((resolve) => {
        release = resolve;
      }),
    );

    render(<EnrichmentJourney />);

    await openBuilder();
    fireEvent.click(await screen.findByRole("button", { name: "Back" }));

    // The old card is gone and a pending line is up — the click cannot read as
    // ignored while the round trip runs.
    await waitFor(() => expect(screen.getByRole("status")).toBeTruthy());
    expect(screen.queryByText(question.ask.question)).toBeNull();

    release(previous);
    await waitFor(() =>
      expect(screen.getByText("Which states can you perform work in?")).toBeTruthy(),
    );
  });

  it("offers Back only when there is a card behind this one", async () => {
    getEnrichmentState.mockResolvedValue(activeState);
    getNextEnrichment.mockResolvedValue(question); // canGoBack unset → first card

    render(<EnrichmentJourney />);

    await openBuilder();
    await waitFor(() => expect(screen.getByLabelText("Crew size")).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });

  it("steps back to the previous field via POST /back", async () => {
    getEnrichmentState.mockResolvedValue(activeState);
    getNextEnrichment.mockResolvedValue(backable);
    backEnrichment.mockResolvedValue(previous);

    render(<EnrichmentJourney />);

    await openBuilder();
    const back = await screen.findByRole("button", { name: "Back" });
    fireEvent.click(back);

    await waitFor(() => expect(backEnrichment).toHaveBeenCalledTimes(1));
    // The previous card is now on screen — re-offered, not undone.
    await waitFor(() =>
      expect(screen.getByText("Which states can you perform work in?")).toBeTruthy(),
    );
  });
});

describe("EnrichmentJourney — targeted edit from the knows-you panel", () => {
  it("re-opens exactly the requested field", async () => {
    getEnrichmentState.mockResolvedValue({ ...activeState, active: false });
    getNextEnrichment.mockResolvedValue(question);
    enterEnrichment.mockResolvedValue({ ...activeState });
    // Shared across the suite (it is not in the global reset) — count from zero.
    enterEnrichment.mockClear();

    render(<EnrichmentJourney editRequest={{ field: "service_states", token: 1 }} />);

    await waitFor(() =>
      expect(enterEnrichment).toHaveBeenCalledWith(true, {
        reopen: true,
        fields: ["service_states"],
      }),
    );
    await waitFor(() => expect(getNextEnrichment).toHaveBeenCalled());
  });

  it("jumps to a clicked rail step, sending the milestone not a field list", async () => {
    getEnrichmentState.mockResolvedValue(activeState);
    getNextEnrichment.mockResolvedValue(question);
    enterEnrichment.mockResolvedValue({ ...activeState });
    enterEnrichment.mockClear();

    render(<EnrichmentJourney />);

    await openBuilder();
    // Milestone A is the ACTIVE step in this file's rail fixture (so its own
    // control is disabled — there is nowhere to go); C is a live one.
    const step = await screen.findByRole("button", { name: "Go to Readiness" });
    fireEvent.click(step);

    // The server owns which fields a milestone contains — the client must not.
    await waitFor(() =>
      expect(enterEnrichment).toHaveBeenCalledWith(true, {
        reopen: true,
        milestone: "C_readiness",
      }),
    );
  });

  it("asks again when the same row is clicked twice", async () => {
    getEnrichmentState.mockResolvedValue({ ...activeState, active: false });
    getNextEnrichment.mockResolvedValue(question);
    enterEnrichment.mockResolvedValue({ ...activeState });
    enterEnrichment.mockClear();

    const { rerender } = render(
      <EnrichmentJourney editRequest={{ field: "service_states", token: 1 }} />,
    );
    await waitFor(() => expect(enterEnrichment).toHaveBeenCalledTimes(1));

    rerender(<EnrichmentJourney editRequest={{ field: "service_states", token: 2 }} />);
    await waitFor(() => expect(enterEnrichment).toHaveBeenCalledTimes(2));
  });
});

describe("EnrichmentJourney — the save carries the next card", () => {
  it("renders the inline card WITHOUT a second /next round trip", async () => {
    getEnrichmentState.mockResolvedValue(activeState);
    // Exactly ONE /next: the initial load. The save supplies the card after it.
    getNextEnrichment.mockResolvedValueOnce(question);
    answerEnrichment.mockResolvedValue({
      ...answerResult,
      next: {
        ...question,
        ask: {
          ...question.ask,
          id: "states:ask",
          field: "service_states",
          label: "States",
          question: "Which states do you serve?",
        },
      },
    });

    render(<EnrichmentJourney />);

    await openBuilder();
    await waitFor(() => expect(screen.getByLabelText("Crew size")).toBeTruthy());

    fireEvent.change(screen.getByLabelText("Crew size"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.getByText("Which states do you serve?")).toBeTruthy());
    // The whole point of the change: advancing cost no extra request.
    expect(getNextEnrichment).toHaveBeenCalledTimes(1);
  });

  it("falls back to GET /next when the save carries no card", async () => {
    // An older server, or an inline resolve that failed — the previous two-request
    // path must still advance the journey.
    getEnrichmentState.mockResolvedValue(activeState);
    getNextEnrichment.mockResolvedValueOnce(question).mockResolvedValueOnce(complete);
    answerEnrichment.mockResolvedValue(answerResult);

    render(<EnrichmentJourney />);

    await openBuilder();
    await waitFor(() => expect(screen.getByLabelText("Crew size")).toBeTruthy());

    fireEvent.change(screen.getByLabelText("Crew size"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(getNextEnrichment).toHaveBeenCalledTimes(2));
  });
});

/**
 * "Stop here for now", and the idle dock once the profile is finished.
 *
 * The stop bug: the backend records a stop as `paused: true` while KEEPING
 * `active: true` (so `POST /enter` can resume at the right milestone), and this
 * component gated the builder on `active` alone — so the member clicked Stop
 * and the profile builder carried on rendering.
 */
const fullRail: MilestoneRailItem[] = [
  {
    milestone: "A_work_and_where",
    label: "What you do & where",
    status: "done",
    answered: 3,
    total: 3,
  },
  { milestone: "B_how_you_win", label: "How you win", status: "done", answered: 4, total: 4 },
  { milestone: "C_readiness", label: "Readiness", status: "done", answered: 3, total: 3 },
  { milestone: "D_sharpen", label: "Sharpen", status: "done", answered: 1, total: 1 },
];

describe("EnrichmentJourney — stopping and finishing", () => {
  beforeEach(() => {
    cleanup();
    fetchOrganicOffer.mockResolvedValue(null);
  });

  it("stops rendering the builder once the member stops here for now", async () => {
    // The exact payload the backend returns from `POST /checkpoint {stop}`.
    getEnrichmentState.mockResolvedValue({ ...activeState, active: true, paused: true });
    render(<EnrichmentJourney />);

    // The builder is gone; the resume entry point stands in its place.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Resume profile setup" })).toBeTruthy(),
    );
    expect(screen.queryByText("How many field crew do you run?")).toBeNull();
    // `/next` must not be driven for a paused journey.
    expect(getNextEnrichment).not.toHaveBeenCalled();
  });

  it("renders nothing at all once the profile is complete and embedded", async () => {
    getEnrichmentState.mockResolvedValue({
      ...activeState,
      active: false,
      paused: false,
      rail: fullRail,
      scoringMode: "hybrid",
      embedReady: true,
    });
    const { container } = render(<EnrichmentJourney />);

    await waitFor(() => expect(getEnrichmentState).toHaveBeenCalled());
    // No strength meter, no "Sharpen your matches" — a finished profile is
    // offered no work that is already done.
    await waitFor(() => expect(container.firstChild).toBeNull());
    expect(screen.queryByText(/Profile strength/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /Sharpen your matches/i })).toBeNull();
  });

  it("KEEPS the dock while the profile is embedded but unfinished", async () => {
    // The 75% trap: `deriveStrength` already reads "sharp · 4 of 4" here, but a
    // question remains, so the entry point must survive.
    const nearlyDone = fullRail.map((r) =>
      r.milestone === "D_sharpen" ? { ...r, answered: 0, status: "active" as const } : r,
    );
    getEnrichmentState.mockResolvedValue({
      ...activeState,
      active: false,
      paused: false,
      rail: nearlyDone,
      scoringMode: "hybrid",
      embedReady: true,
    });
    render(<EnrichmentJourney />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Sharpen your matches" })).toBeTruthy(),
    );
  });
});

/**
 * The idle dock's LOCATION. It renders at the top of the pane, while this
 * component stays mounted in the conversation — so there is still exactly one
 * `/state` reader, not two competing instances.
 */
describe("EnrichmentJourney — idle dock placement", () => {
  const idle: EnrichmentStatePayload = {
    ...activeState,
    active: false,
    paused: false,
    scoringMode: "hybrid",
  };

  beforeEach(() => {
    cleanup();
    fetchOrganicOffer.mockResolvedValue(null);
    getEnrichmentState.mockResolvedValue(idle);
  });

  it("portals the dock into the given target", async () => {
    const target = document.createElement("div");
    target.id = "knows-you-dock";
    document.body.appendChild(target);

    const { container } = render(<EnrichmentJourney idleDockTarget={target} />);

    await waitFor(() => expect(target.querySelector(".hunter-enrich-dock")).toBeTruthy());
    // ...and NOT left behind at the component's own position.
    expect(container.querySelector(".hunter-enrich-dock")).toBeNull();
    // The entry point still LAUNCHES the builder from its new home — the label
    // itself tracks rail progress ("Complete your profile" on a thin one), so
    // asserting the call is the durable claim, not the copy.
    enterEnrichment.mockResolvedValue({ ...idle, active: true });
    getNextEnrichment.mockResolvedValue(question);
    fireEvent.click(target.querySelector("button") as HTMLButtonElement);
    // The entry button takes the sharpen path — see EnrichCTA.
    await waitFor(() => expect(enterEnrichment).toHaveBeenCalledWith(true, { reopen: true }));

    target.remove();
  });

  it("renders in place when no target is supplied", async () => {
    // The fallback is what keeps this a relocation rather than a dependency: a
    // caller that does not offer a slot still gets the dock.
    const { container } = render(<EnrichmentJourney />);
    await waitFor(() => expect(container.querySelector(".hunter-enrich-dock")).toBeTruthy());
  });
});

/**
 * The rail is a BAND at the top of the dock, not a card in the message flow: it
 * pins where the profile-strength block sits and stays there while the
 * conversation scrolls. It is portalled into the SAME slot as the idle dock, so
 * the component still reads `/state` once and the DOM still holds one rail.
 */
describe("EnrichmentJourney — the rail pins at the top of the dock", () => {
  beforeEach(() => {
    cleanup();
    fetchOrganicOffer.mockResolvedValue(null);
    getEnrichmentState.mockResolvedValue(activeState);
    getNextEnrichment.mockResolvedValue(question);
  });

  /** Mounts an in-session journey against a fresh dock slot, and opens the
   *  builder — closed by default now, so the member's press is part of the
   *  setup rather than part of what is under test. */
  async function renderWithDock() {
    const target = document.createElement("div");
    document.body.appendChild(target);
    render(<EnrichmentJourney idleDockTarget={target} />);
    await openBuilder();
    return target;
  }

  it("portals the rail into the dock target, exactly once", async () => {
    const target = await renderWithDock();

    await waitFor(() => expect(target.querySelector(".hunter-enrich-rail")).toBeTruthy());
    // One rail in the whole document — a portalled copy plus an inline one would
    // read as two journeys.
    expect(document.querySelectorAll(".hunter-enrich-rail")).toHaveLength(1);
    // One reader, one meter: moving the rail must not fork `/state`, and the
    // strength row that rides above it must not be duplicated by the move.
    expect(getEnrichmentState).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll(".hunter-enrich-strength")).toHaveLength(1);
    // The question card stays in the message flow, below.
    await waitFor(() => expect(screen.getByText("How many field crew do you run?")).toBeTruthy());
    expect(target.textContent).not.toContain("How many field crew do you run?");

    target.remove();
  });

  it("keeps jump navigation working from the dock", async () => {
    enterEnrichment.mockResolvedValue(activeState);
    const target = await renderWithDock();
    await waitFor(() => expect(target.querySelector(".hunter-enrich-rail")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Go to Readiness" }));

    await waitFor(() =>
      expect(enterEnrichment).toHaveBeenCalledWith(true, {
        reopen: true,
        milestone: "C_readiness",
      }),
    );
    target.remove();
  });

  it("renders the rail in place when no target is supplied", async () => {
    const { container } = render(<EnrichmentJourney />);
    await openBuilder();

    await waitFor(() => expect(container.querySelector(".hunter-enrich-rail")).toBeTruthy());
    expect(document.querySelectorAll(".hunter-enrich-rail")).toHaveLength(1);
  });
});

/**
 * The builder is CLOSED on arrival, and the member opens it.
 *
 * Enrichment is member-initiated. A page someone came to for the feed must not
 * greet them with a profile question, and that holds even when the server says
 * a journey is still in session — which it does for anyone who left one part-way
 * through. The server flag records what they DECIDED; whether the surface shows
 * is a separate question, answered fresh on every visit.
 */
describe("EnrichmentJourney — closed by default", () => {
  beforeEach(() => {
    cleanup();
    fetchOrganicOffer.mockResolvedValue(null);
  });

  it("shows the entry button, not a question, for an in-session journey", async () => {
    getEnrichmentState.mockResolvedValue(activeState);
    getNextEnrichment.mockResolvedValue(question);

    render(<EnrichmentJourney />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /your matches|your profile/i })).toBeTruthy(),
    );
    expect(screen.queryByText("How many field crew do you run?")).toBeNull();
  });

  it("asks the server for no card until the member opens it", async () => {
    // The cost side of the same rule: a closed builder issues no `/next`.
    getEnrichmentState.mockResolvedValue(activeState);
    getNextEnrichment.mockResolvedValue(question);

    render(<EnrichmentJourney />);
    await waitFor(() => expect(getEnrichmentState).toHaveBeenCalled());
    expect(getNextEnrichment).not.toHaveBeenCalled();
  });

  it("opens on the member's press", async () => {
    getEnrichmentState.mockResolvedValue(activeState);
    getNextEnrichment.mockResolvedValue(question);

    render(<EnrichmentJourney />);
    await openBuilder();

    await waitFor(() => expect(screen.getByText("How many field crew do you run?")).toBeTruthy());
  });

  it("labels the entry 'Resume profile setup' for a paused journey", async () => {
    // The member left part-way through; the label says so rather than offering
    // to sharpen something they already started.
    getEnrichmentState.mockResolvedValue({ ...activeState, paused: true });

    render(<EnrichmentJourney />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Resume profile setup" })).toBeTruthy(),
    );
  });
});

/**
 * Closing the builder.
 *
 * Before this the only way out was "Stop here for now", which the server offers
 * at a milestone checkpoint and nowhere else — a member part-way through a
 * milestone had to abandon the overlay. The close control sits on the pinned
 * strength strip, so it is reachable from any card.
 */
describe("EnrichmentJourney — finish later", () => {
  beforeEach(() => {
    cleanup();
    fetchOrganicOffer.mockResolvedValue(null);
    getEnrichmentState.mockResolvedValue(activeState);
    getNextEnrichment.mockResolvedValue(question);
    pauseEnrichment.mockResolvedValue({ ...activeState, paused: true });
  });

  it("closes the builder and records the pause", async () => {
    render(<EnrichmentJourney />);
    await openBuilder();
    await waitFor(() => expect(screen.getByText("How many field crew do you run?")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Finish later" }));

    await waitFor(() => expect(pauseEnrichment).toHaveBeenCalled());
    expect(screen.queryByText("How many field crew do you run?")).toBeNull();
  });

  it("puts Finish later in the ask card, not on the strength strip", async () => {
    // It is one of the things a member can do INSTEAD of answering, so it
    // belongs beside "Skip". On the strip it crowded the strength
    // reading and wrapped the tier label onto two lines.
    render(<EnrichmentJourney />);
    await openBuilder();
    await waitFor(() => expect(screen.getByText("How many field crew do you run?")).toBeTruthy());

    const later = screen.getByRole("button", { name: "Finish later" });
    expect(later.closest(".hunter-learn__escapes")).toBeTruthy();
    expect(later.closest(".hunter-enrich-dock--strip")).toBeNull();
    // ...and it reads as one of the escapes, not as a second primary action.
    expect(later.className).toContain("hunter-ask__skip");
  });

  it("closes immediately, without waiting for the round trip", async () => {
    // The click must register NOW. A member who pressed "Finish later" and then
    // watched the question sit there would press it again.
    let release: (v: EnrichmentStatePayload) => void = () => {};
    pauseEnrichment.mockReturnValue(
      new Promise<EnrichmentStatePayload>((res) => {
        release = res;
      }),
    );

    render(<EnrichmentJourney />);
    await openBuilder();
    await waitFor(() => expect(screen.getByText("How many field crew do you run?")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Finish later" }));

    await waitFor(() => expect(screen.queryByText("How many field crew do you run?")).toBeNull());
    release({ ...activeState, paused: true });
  });

  it("leaves the builder closed when the pause call fails", async () => {
    // Nothing is lost either way — every answer was written as it was given —
    // so a failed pause must not push the member back into the question.
    pauseEnrichment.mockRejectedValue(new Error("offline"));

    render(<EnrichmentJourney />);
    await openBuilder();
    await waitFor(() => expect(screen.getByText("How many field crew do you run?")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Finish later" }));

    await waitFor(() => expect(screen.queryByText("How many field crew do you run?")).toBeNull());
  });

  it("can be re-opened after closing", async () => {
    render(<EnrichmentJourney />);
    await openBuilder();
    await waitFor(() => expect(screen.getByText("How many field crew do you run?")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Finish later" }));
    await waitFor(() => expect(pauseEnrichment).toHaveBeenCalled());

    await openBuilder();
    await waitFor(() => expect(screen.getByText("How many field crew do you run?")).toBeTruthy());
  });
});

/**
 * The strength row stays on screen for the WHOLE journey.
 *
 * It used to be exclusive with the rail: the meter rendered only in the idle
 * dock, which early-returns, so entering a journey swapped progress-so-far out
 * for progress-in-step. The prototype renders the two as siblings — they answer
 * different questions ("how complete is my profile" vs "where am I now"), so
 * one must not stand in for the other.
 */
describe("EnrichmentJourney — the strength row rides above the rail", () => {
  beforeEach(() => {
    cleanup();
    fetchOrganicOffer.mockResolvedValue(null);
    getEnrichmentState.mockResolvedValue(activeState);
    getNextEnrichment.mockResolvedValue(question);
  });

  /** Mounts an in-session journey against a fresh dock slot, and opens the
   *  builder — closed by default now, so the member's press is part of the
   *  setup rather than part of what is under test. */
  async function renderWithDock() {
    const target = document.createElement("div");
    document.body.appendChild(target);
    render(<EnrichmentJourney idleDockTarget={target} />);
    await openBuilder();
    return target;
  }

  it("renders exactly one meter in the dock, above the rail", async () => {
    const target = await renderWithDock();

    await waitFor(() => expect(target.querySelector(".hunter-enrich-strength")).toBeTruthy());
    // One meter in the whole document — a portalled copy plus an inline one
    // would read as two profiles.
    expect(document.querySelectorAll(".hunter-enrich-strength")).toHaveLength(1);
    // ...and one `/state` read behind it: no second reader was added to feed it.
    expect(getEnrichmentState).toHaveBeenCalledTimes(1);

    const meter = target.querySelector(".hunter-enrich-strength") as HTMLElement;
    const railBand = target.querySelector(".hunter-enrich-rail") as HTMLElement;
    // ABOVE the rail, and its own band: `--strip` is what removes the second
    // rule. The meter shares a ROW with the close control, so the band is its
    // grandparent — the band-above-rail relationship is what matters here.
    const strip = meter.closest(".hunter-enrich-dock--strip") as HTMLElement;
    expect(strip).toBeTruthy();
    expect(strip.nextElementSibling).toBe(railBand);
  });

  it("reads the meter and the rail off the SAME rail rows", async () => {
    // `/next` returns a fresher rail with each answer. Both surfaces take it, so
    // the strength count cannot disagree with the step the member is on.
    const advanced: MilestoneRailItem[] = [
      { ...rail[0], status: "done", answered: 3 },
      { ...rail[1], status: "active", answered: 2 },
      rail[2],
      rail[3],
    ];
    getNextEnrichment.mockResolvedValue({
      ...question,
      milestone: "B_how_you_win",
      rail: advanced,
    });
    const target = await renderWithDock();

    await waitFor(() => expect(target.textContent).toContain("Step 2 of 4 — How you win"));
    // 5 of 11 answered → tier 2. Read off `advanced`, not the staler `/state` rail.
    expect(target.textContent).toContain("building · 2 of 4");
  });

  it("offers no entry button mid-journey", async () => {
    const target = await renderWithDock();

    await waitFor(() => expect(target.querySelector(".hunter-enrich-strength")).toBeTruthy());
    // The member is already in the journey — there is nothing to enter, and the
    // prototype shows no CTA here.
    expect(document.querySelectorAll("button.hunter-enrich-cta")).toHaveLength(0);
  });

  it("renders the meter in place when no target is supplied", async () => {
    const { container } = render(<EnrichmentJourney />);

    await waitFor(() => expect(container.querySelector(".hunter-enrich-strength")).toBeTruthy());
    expect(document.querySelectorAll(".hunter-enrich-strength")).toHaveLength(1);
  });
});

/**
 * The idle dock's STRENGTH BLOCK. The meter is a strip and its entry button sits
 * directly under it, full width — nothing comes between the two.
 */
describe("EnrichmentJourney — idle dock strength block", () => {
  const thin: EnrichmentStatePayload = {
    ...activeState,
    active: false,
    paused: false,
    scoringMode: "rule_only",
    embedReady: false,
  };

  beforeEach(() => {
    cleanup();
    fetchOrganicOffer.mockResolvedValue(null);
  });

  /** Mounts the idle dock for one state and returns its root element. */
  async function renderDock(state: EnrichmentStatePayload) {
    getEnrichmentState.mockResolvedValue(state);
    const { container } = render(<EnrichmentJourney />);
    await waitFor(() => expect(container.querySelector(".hunter-enrich-dock")).toBeTruthy());
    return container.querySelector(".hunter-enrich-dock") as HTMLElement;
  }

  it("renders exactly one strength meter and exactly one entry button", async () => {
    const dock = await renderDock(thin);

    expect(dock.querySelectorAll(".hunter-enrich-strength")).toHaveLength(1);
    expect(dock.querySelectorAll("button.hunter-enrich-cta")).toHaveLength(1);
    // Nothing else in the idle dock is a button, so a second entry point of any
    // class would show up here.
    expect(dock.querySelectorAll("button")).toHaveLength(1);
    // One dock, one reader: the block is built from a single `/state` read.
    expect(getEnrichmentState).toHaveBeenCalledTimes(1);
  });

  it("places the button as the meter's next sibling", async () => {
    const dock = await renderDock(thin);
    const meter = dock.querySelector(".hunter-enrich-strength") as HTMLElement;
    const cta = dock.querySelector("button.hunter-enrich-cta") as HTMLElement;

    expect(cta.parentElement).toBe(dock);
    expect(meter.nextElementSibling).toBe(cta);
  });

  it("offers no entry button while the ranking is still generating", async () => {
    const dock = await renderDock({ ...thin, scoringMode: "generating" });

    expect(dock.querySelectorAll("button.hunter-enrich-cta")).toHaveLength(0);
  });

  it("offers no entry button when a rule-only profile is already embed-ready", async () => {
    const dock = await renderDock({ ...thin, embedReady: true });

    expect(dock.querySelectorAll("button.hunter-enrich-cta")).toHaveLength(0);
  });
});

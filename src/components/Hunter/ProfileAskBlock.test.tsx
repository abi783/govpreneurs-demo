// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import type { ProfileAsk } from "../../lib/hunterChat";

// Capture answer-endpoint calls (hoisted so the mock factory can reference it).
const { answerProfileAsk } = vi.hoisted(() => ({
  answerProfileAsk: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../lib/hunterChat", async (orig) => {
  const actual = await orig<typeof import("../../lib/hunterChat")>();
  return { ...actual, answerProfileAsk };
});

// The block + card live inside the overlay; import them via the exported test hook.
import { ProfileAskBlock } from "./ProfileAskBlock";

beforeEach(() => {
  cleanup();
  answerProfileAsk.mockClear();
});

const rangeAsk: ProfileAsk = {
  id: "bonding_capacity:range",
  field: "bonding_capacity",
  label: "Bonding capacity",
  askType: "range",
  question: "What single-project bonding capacity can you get today?",
  bands: ["Not bonded", "Up to $500K", "$1M–$5M"],
  allowNotSure: true,
};

const confirmWithProposal: ProfileAsk = {
  id: "primary_naics:confirm",
  field: "primary_naics",
  label: "Primary NAICS",
  askType: "confirm",
  question: "Is 238220 your primary NAICS?",
  proposal: {
    value: "238220",
    provenance: {
      source: "signal",
      signal: "your SAM registration",
      observedAt: "2026-07-01T00:00:00.000Z",
    },
    confidence_tag: "inferred",
  },
  allowNotSure: false,
};

const confirmNoProposal: ProfileAsk = {
  id: "crew_size:open",
  field: "crew_size",
  label: "Crew size",
  askType: "open",
  question: "How many field crew do you run?",
  allowNotSure: false,
};

const docAsk: ProfileAsk = {
  id: "capability_statement:doc",
  field: "capability_statement",
  label: "Capability statement",
  askType: "doc",
  question: "Can you share your capability statement?",
  allowNotSure: false,
};

describe("ProfileAskBlock", () => {
  it("range ask renders bands + a Not sure escape, no pre-selected default", () => {
    render(<ProfileAskBlock asks={[rangeAsk]} />);
    expect(screen.getByRole("button", { name: "$1M–$5M" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Not sure" })).toBeTruthy();
    // No band is marked selected/pressed — nothing is a default.
    for (const band of rangeAsk.bands!) {
      expect(screen.getByRole("button", { name: band }).getAttribute("aria-pressed")).toBeNull();
    }
  });

  it('"Not sure" writes the not_sure sentinel (never a fabricated value)', async () => {
    render(<ProfileAskBlock asks={[rangeAsk]} />);
    fireEvent.click(screen.getByRole("button", { name: "Not sure" }));
    await waitFor(() =>
      expect(answerProfileAsk).toHaveBeenCalledWith(
        expect.objectContaining({ field: "bonding_capacity", value: "not_sure" }),
      ),
    );
  });

  it("confirm ask shows the signal-backed value + a provenance line", () => {
    render(<ProfileAskBlock asks={[confirmWithProposal]} />);
    expect(screen.getByText("238220")).toBeTruthy();
    expect(screen.getByText(/Inferred from your SAM registration/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeTruthy();
  });

  it("an ask with no proposal renders NO default value — just an empty prompt", () => {
    render(<ProfileAskBlock asks={[confirmNoProposal]} />);
    const input = screen.getByLabelText("Crew size") as HTMLInputElement;
    expect(input.value).toBe(""); // never a fabricated default
    // Save is disabled until the member types something.
    expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("doc ask offers a link field + a Later escape", () => {
    render(<ProfileAskBlock asks={[docAsk]} />);
    expect(screen.getByLabelText(/document link/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Later" })).toBeTruthy();
  });

  it("marks the ask done after a band is chosen", async () => {
    render(<ProfileAskBlock asks={[rangeAsk]} />);
    fireEvent.click(screen.getByRole("button", { name: "$1M–$5M" }));
    await waitFor(() => expect(screen.getByText(/Saved: \$1M–\$5M/)).toBeTruthy());
  });

  it("a paragraph ask with elicitShape renders a synthesized draft as the initial textarea value (F1)", () => {
    const paragraphAsk: ProfileAsk = {
      id: "capability summary:open",
      field: "capability summary",
      label: "What your business does",
      askType: "open",
      question: "In a sentence or two, what does your business do?",
      allowNotSure: false,
    };
    render(
      <ProfileAskBlock
        asks={[paragraphAsk]}
        elicitShape="paragraph"
        initialValue="Acme provides network engineering and cloud migration services."
      />,
    );
    const textarea = screen.getByLabelText("What your business does") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Acme provides network engineering and cloud migration services.");
    // A prefilled draft makes Save immediately actionable (no fabricated-but-blank state).
    expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });
});

describe("in-flight save feedback", () => {
  it("shows Saving… and blocks a second submit while the answer is in flight", async () => {
    // Hold the request open so we can observe the pending state.
    let release!: () => void;
    answerProfileAsk.mockImplementationOnce(
      () =>
        new Promise<void>((res) => {
          release = () => res();
        }),
    );
    render(<ProfileAskBlock asks={[rangeAsk]} />);

    fireEvent.click(screen.getByRole("button", { name: "Up to $500K" }));

    // Feedback is visible WHILE saving — the click must never look dead.
    await waitFor(() => expect(screen.getByRole("status").textContent ?? "").toContain("Saving…"));

    // A second click during the flight is ignored (no double write).
    fireEvent.click(screen.getByRole("button", { name: "$1M–$5M" }));
    expect(answerProfileAsk).toHaveBeenCalledTimes(1);

    release();
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  });

  it("clears the pending state on failure so the member can retry", async () => {
    answerProfileAsk.mockRejectedValueOnce(new Error("network"));
    render(<ProfileAskBlock asks={[rangeAsk]} />);

    fireEvent.click(screen.getByRole("button", { name: "Up to $500K" }));

    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    // Still actionable: the bands are back, not a "Saved" terminal state.
    expect(screen.getByRole("button", { name: "Up to $500K" })).toBeTruthy();
    answerProfileAsk.mockResolvedValueOnce(undefined);
    fireEvent.click(screen.getByRole("button", { name: "Up to $500K" }));
    await waitFor(() => expect(answerProfileAsk).toHaveBeenCalledTimes(2));
  });
});

describe("asking what a question means", () => {
  it("offers a clarify affordance that sends a real question to Hunter", () => {
    const onAskHunter = vi.fn();
    render(<ProfileAskBlock asks={[rangeAsk]} onAskHunter={onAskHunter} />);

    fireEvent.click(screen.getByRole("button", { name: "Help?" }));

    // Goes to the chat as a question — it is NEVER written as a profile answer.
    expect(onAskHunter).toHaveBeenCalledWith('What do you mean by "Bonding capacity"?');
    expect(answerProfileAsk).not.toHaveBeenCalled();
  });

  it("omits the affordance when the host cannot route a question", () => {
    render(<ProfileAskBlock asks={[rangeAsk]} />);
    expect(screen.queryByRole("button", { name: "Help?" })).toBeNull();
  });
});

describe("a refused write never claims 'Saved'", () => {
  it("keeps the ask open and editable when nothing was written", async () => {
    const answer = vi.fn().mockResolvedValue({ written: false });
    render(<ProfileAskBlock asks={[rangeAsk]} handlers={{ answer, skip: vi.fn() }} />);

    fireEvent.click(screen.getByRole("button", { name: "Up to $500K" }));
    await waitFor(() => expect(answer).toHaveBeenCalled());

    // The observed bug: the card showed "Saved: …" over a refused write and the
    // journey then had no way forward.
    expect(document.body.textContent ?? "").not.toMatch(/Saved:/);
    expect(screen.getByRole("button", { name: "Up to $500K" })).toBeTruthy();
  });

  it("still confirms a real write", async () => {
    const answer = vi.fn().mockResolvedValue({ written: true });
    render(<ProfileAskBlock asks={[rangeAsk]} handlers={{ answer, skip: vi.fn() }} />);
    fireEvent.click(screen.getByRole("button", { name: "Up to $500K" }));
    await waitFor(() => expect(document.body.textContent ?? "").toMatch(/Saved:/));
  });
});

describe("skip is available on every card", () => {
  const openAsk: ProfileAsk = {
    id: "core_capabilities:open",
    field: "core capabilities",
    label: "Your core services",
    askType: "open",
    question: "What are the core services you deliver?",
    allowNotSure: false,
  };

  it("offers Skip on a plain ask, and skipping writes nothing", async () => {
    const skip = vi.fn().mockResolvedValue(undefined);
    render(<ProfileAskBlock asks={[openAsk]} handlers={{ answer: vi.fn(), skip }} />);

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));

    // Routed to the skip endpoint — never stored as a guessed answer.
    await waitFor(() => expect(skip).toHaveBeenCalledWith("core capabilities"));
    expect(answerProfileAsk).not.toHaveBeenCalled();
  });

  it("puts Skip beside the primary button, as a button", async () => {
    // It is the other thing a member can do with the question in front of them,
    // so it shares the action row with Save. Under the card, as a link, it read
    // as fine print — and wrapped mid-phrase in a 320px column.
    render(<ProfileAskBlock asks={[openAsk]} handlers={{ answer: vi.fn(), skip: vi.fn() }} />);

    const skipBtn = screen.getByRole("button", { name: "Skip" });
    const save = screen.getByRole("button", { name: "Save" });
    expect(skipBtn.parentElement).toBe(save.parentElement);
    expect(skipBtn.closest(".hunter-learn__actions")).toBeTruthy();
    // A button, not one of the card's escape links.
    expect(skipBtn.className).toContain("hunter-learn__btn");
    expect(skipBtn.closest(".hunter-learn__escapes")).toBeNull();
  });

  it("offers Skip on a range ask too — every card, no exceptions", () => {
    render(<ProfileAskBlock asks={[rangeAsk]} />);
    // The inline "Not sure" reads as an answer choice; Skip is the way out.
    expect(screen.getByRole("button", { name: "Skip" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^not sure$/i })).toBeTruthy();
  });

  it("offers Skip on a doc ask too", () => {
    const docAsk: ProfileAsk = {
      id: "capability statement:doc",
      field: "capability statement",
      label: "Capability statement",
      askType: "doc",
      question: "Do you have a capability statement on file?",
      allowNotSure: false,
    };
    render(<ProfileAskBlock asks={[docAsk]} />);
    expect(screen.getByRole("button", { name: "Skip" })).toBeTruthy();
  });
});

describe("ProfileAskBlock presentation", () => {
  it("renders the ask as one of Hunter's turns, not a boxed form", () => {
    const { container } = render(<ProfileAskBlock asks={[rangeAsk]} />);

    // The card sits in the same row every hunter reply uses.
    const card = container.querySelector(".hunter-msg-row.from-hunter .hunter-ask");
    expect(card).toBeTruthy();
    // The question is the head title, above whatever body collects the answer.
    expect(container.querySelector(".hunter-ask__head .hunter-ask__title")?.textContent).toBe(
      rangeAsk.question,
    );
    // The old boxed-form shell is gone.
    expect(container.querySelector(".hunter-learn__conflict")).toBeNull();
  });

  it("renders server-supplied bands as the dock's amber suggestion pills", () => {
    const { container } = render(<ProfileAskBlock asks={[rangeAsk]} />);

    const chips = container.querySelector(".hunter-ask__chips");
    expect(chips).toBeTruthy();
    // Every band — and the inline escape — wears the shared chip class, so a
    // band reads as the same "pick this" affordance as a suggestion.
    for (const band of rangeAsk.bands!) {
      expect(screen.getByRole("button", { name: band }).className).toContain(
        "hunter-suggestion-chip",
      );
    }
    expect(screen.getByRole("button", { name: /^not sure$/i }).className).toContain(
      "hunter-suggestion-chip",
    );
  });

  it("invents no why/hint line — the server sends neither", () => {
    const { container } = render(<ProfileAskBlock asks={[rangeAsk]} />);
    expect(container.querySelector(".hunter-ask__why")).toBeNull();
    expect(container.querySelector(".hunter-ask__hint")).toBeNull();
  });
});

// @vitest-environment jsdom
//
// Feature 14(e) — a tool result leaves a COMPACT reference in the thread, and
// the full artifact is not duplicated there.
//
// The transport is stubbed so the turn is deterministic; the PAYLOADS are the
// live shapes `POST /hunter-chat/message` returns, and the overlay reads them
// exactly as it does in the app. Nothing here scripts an answer: `chatReply` is
// the model's own text in production and is a marker string here only so the
// test can tell one turn from the next.
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import type {
  ActPayload,
  ComparePayload,
  EligibilityPayload,
  HunterTurnResponse,
  MatchesPayload,
  ProfilePayload,
  WebResearchPayload,
} from "../../lib/hunterChat";
import type { StageArtifactInput } from "../../lib/hunter/stageArtifact";

const postHunterMessage = vi.fn<(...args: unknown[]) => Promise<HunterTurnResponse>>();

vi.mock("../../lib/hunterChat", () => ({
  postHunterMessage: (...args: unknown[]) => postHunterMessage(...args),
  resetHunterSession: vi.fn(),
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
  // The reveal animation is not what this file is about; render the text at once
  // and report done, so the structured reference appears synchronously.
  HunterTypewriter: ({ text, onDone }: { text: string; onDone?: () => void }) => {
    onDone?.();
    return <span>{text}</span>;
  },
}));
vi.mock("./HunterMessageFeedback", () => ({ HunterMessageFeedback: () => null }));

const { HunterChatOverlay } = await import("./HunterChatOverlay");

const eligibility: EligibilityPayload = {
  oppKey: "opp-1",
  title: "Dining facility attendant services",
  agency: "Department of the Army",
  verdict: "certify_to_qualify",
  verdictLabel: "Certify to qualify",
  soleSource: false,
  rows: [{ field: "Set-aside", value: "SDVOSB set-aside", status: "fail" }],
  note: "Registering the certification is the one blocker.",
};

const compare: ComparePayload = {
  opps: [
    { oppKey: "opp-a", title: "Mess hall support", agency: "Army", location: null },
    { oppKey: "opp-b", title: "Grounds maintenance", agency: "GSA", location: null },
  ],
  rows: [{ field: "Value", values: ["$1.2M", "$480K"], winner: 0 }],
  verdict: {
    winnerOppKey: "opp-a",
    winnerTitle: "Mess hall support",
    strengthPct: 68,
    strengthLabel: "Clear edge",
  },
  tradeoff: "The larger award closes later.",
};

const matches: MatchesPayload = {
  rows: [
    {
      oppKey: "opp-a",
      title: "Custodial services, Fort Liberty",
      tier: "priority",
      matchReasons: ["Your NAICS 561720"],
      dueDate: null,
      agency: "Department of the Army",
    },
  ],
};

const act: ActPayload = {
  gap: {
    kind: "sam",
    oppKey: "opp-1",
    title: "Dining facility attendant services",
    setAsideName: null,
    note: null,
  },
  trustLevel: "high",
  offers: [
    {
      slug: "sam-registration",
      name: "SAM.gov registration review",
      turnaround: "5 business days",
      selfServeDestination: null,
      externalGuidance: null,
    },
  ],
  bidChecklist: [{ label: "Active SAM.gov registration", done: true }],
};

const research: WebResearchPayload = {
  query: "SDVOSB recertification window",
  answer: "The certification runs for three years [1].",
  citations: [
    {
      index: 1,
      title: "Veteran Small Business Certification",
      url: "https://veterans.certify.sba.gov/",
      host: "veterans.certify.sba.gov",
      trusted: true,
    },
  ],
};

const profile: ProfilePayload = {
  rows: [{ label: "Company name", value: "Acme Facilities LLC", source: "profile" }],
  hiddenCount: 0,
  notOnFile: [],
  capabilityStatement: "parsed",
  factsUnavailable: false,
};

/** The six tool turns, with the artifact kind and the mini-card line each owes. */
const TURNS = [
  {
    name: "eligibility",
    kind: "eligibility",
    data: eligibility as unknown,
    artifact: "scorecard",
    label: "Readiness check · Dining facility attendant services",
    // A fragment of the FULL card that must not appear in the thread.
    fullCardMark: "Certify to qualify",
  },
  {
    name: "compare",
    kind: "compare",
    data: compare as unknown,
    artifact: "compare",
    label: "Compare · Mess hall support vs Grounds maintenance",
    fullCardMark: "$480K",
  },
  {
    name: "matches",
    kind: "matches",
    data: matches as unknown,
    artifact: "matches",
    label: "Best matches",
    fullCardMark: "Your NAICS 561720",
  },
  {
    name: "act",
    kind: "act",
    data: act as unknown,
    artifact: "checklist",
    label: "Action checklist · Dining facility attendant services",
    fullCardMark: "SAM.gov registration review",
  },
  {
    name: "web_research",
    kind: "web_research",
    data: research as unknown,
    artifact: "research",
    label: "Research · SDVOSB recertification window",
    fullCardMark: "verify against the official solicitation",
  },
  {
    name: "profile",
    kind: "profile",
    data: profile as unknown,
    artifact: "profile",
    label: "Your business profile",
    fullCardMark: "Acme Facilities LLC",
  },
];

function reply(kind: string, data: unknown): HunterTurnResponse {
  return {
    chatReply: "turn reply",
    uiPayload: { kind: kind as HunterTurnResponse["uiPayload"]["kind"], data },
    sessionId: "s1",
    turnId: "t1",
  };
}

function mountOverlay() {
  const onStageArtifact = vi.fn<(input: StageArtifactInput) => void>();
  render(
    <HunterChatOverlay
      open
      onOpenChange={vi.fn()}
      tab="for_you"
      onStageArtifact={onStageArtifact}
    />,
  );
  return { onStageArtifact };
}

async function ask(question: string) {
  const box = document.querySelector("textarea") as HTMLTextAreaElement;
  fireEvent.change(box, { target: { value: question } });
  fireEvent.keyDown(box, { key: "Enter" });
  await waitFor(() => expect(document.querySelectorAll(".stage-mini").length).toBeGreaterThan(0));
}

/** The chat thread, excluding anything the stage would render. */
function threadText(): string {
  return (document.querySelector(".hunter-msg-list") as HTMLElement)?.textContent ?? "";
}

beforeEach(() => {
  cleanup();
  sessionStorage.clear();
  postHunterMessage.mockReset();
});

afterEach(() => cleanup());

describe("every tool turn leaves a compact reference, never the full card (14e)", () => {
  for (const turn of TURNS) {
    it(`${turn.name} → one mini card, and the full artifact goes to the stage`, async () => {
      postHunterMessage.mockResolvedValue(reply(turn.kind, turn.data));
      const { onStageArtifact } = mountOverlay();

      await ask("a question");

      // The thread carries exactly one compact reference, naming the artifact.
      const minis = document.querySelectorAll(".stage-mini");
      expect(minis).toHaveLength(1);
      expect(minis[0].querySelector(".stage-mini__label")?.textContent).toBe(turn.label);

      // The full card is NOT in the thread.
      expect(threadText()).not.toContain(turn.fullCardMark);
      for (const cls of [
        ".hunter-compare",
        ".hunter-matches__row",
        ".hunter-act",
        ".hunter-research",
        ".hunter-profile",
        ".scorecard",
        ".hunter-elig",
      ]) {
        expect(document.querySelectorAll(cls)).toHaveLength(0);
      }

      // It went to the stage instead, as the matching artifact kind.
      expect(onStageArtifact).toHaveBeenCalledTimes(1);
      expect(onStageArtifact.mock.calls[0][0]).toEqual({
        kind: turn.artifact,
        payload: turn.data,
      });
    });
  }

  it("puts the artifact back on the stage when the reference is clicked", async () => {
    postHunterMessage.mockResolvedValue(reply("compare", compare));
    const { onStageArtifact } = mountOverlay();
    await ask("compare these two");

    onStageArtifact.mockClear();
    fireEvent.click(document.querySelector(".stage-mini") as HTMLElement);

    expect(onStageArtifact).toHaveBeenCalledWith({ kind: "compare", payload: compare });
  });
});

describe("a turn that produces no artifact leaves no reference", () => {
  it("adds no mini card for a discovery payload", async () => {
    postHunterMessage.mockResolvedValue(
      reply("discovery", { filters: { states: ["NC"] }, note: null }),
    );
    const onApplyFilters = vi.fn();
    const onStageArtifact = vi.fn();
    render(
      <HunterChatOverlay
        open
        onOpenChange={vi.fn()}
        tab="for_you"
        onApplyFilters={onApplyFilters}
        onStageArtifact={onStageArtifact}
      />,
    );
    const box = document.querySelector("textarea") as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: "roofing in NC" } });
    fireEvent.keyDown(box, { key: "Enter" });

    await waitFor(() => expect(onApplyFilters).toHaveBeenCalled());
    expect(document.querySelectorAll(".stage-mini")).toHaveLength(0);
    expect(onStageArtifact).not.toHaveBeenCalled();
  });
});

describe("the chained eligibility → act turn", () => {
  it("stages the primary answer and references BOTH in the thread", async () => {
    postHunterMessage.mockResolvedValue({ ...reply("eligibility", eligibility), actPayload: act });
    const { onStageArtifact } = mountOverlay();
    await ask("am I ready to bid this?");

    const labels = Array.from(document.querySelectorAll(".stage-mini__label")).map(
      (n) => n.textContent,
    );
    expect(labels).toEqual([
      "Readiness check · Dining facility attendant services",
      "Action checklist · Dining facility attendant services",
    ]);
    // One at a time: only the primary took the stage.
    expect(onStageArtifact).toHaveBeenCalledTimes(1);
    expect(onStageArtifact.mock.calls[0][0]).toEqual({ kind: "scorecard", payload: eligibility });
  });
});

describe("the overlay keeps working without a stage", () => {
  it("renders the reference and does not throw when onStageArtifact is absent", async () => {
    postHunterMessage.mockResolvedValue(reply("matches", matches));
    render(<HunterChatOverlay open onOpenChange={vi.fn()} tab="for_you" />);
    const box = document.querySelector("textarea") as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: "best matches" } });
    fireEvent.keyDown(box, { key: "Enter" });

    await waitFor(() => expect(document.querySelectorAll(".stage-mini")).toHaveLength(1));
    fireEvent.click(document.querySelector(".stage-mini") as HTMLElement);
    expect(document.querySelectorAll(".stage-mini")).toHaveLength(1);
  });
});

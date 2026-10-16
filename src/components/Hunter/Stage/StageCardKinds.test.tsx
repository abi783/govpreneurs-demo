// @vitest-environment jsdom
//
// Feature 14(a) and 14(f) — all seven kinds reach the stage, each renders from a
// LIVE-shaped payload fixture, and exactly one `.stage-card` is on screen at a
// time no matter which kinds follow which.
//
// Feature 13's own file covers the shell (the feed staying mounted, the dismiss
// control, reduced motion) for the scorecard. This file is about the other four
// and about the union as a whole; it does not restate what 13 already pins.
import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { StageArtifactInput } from "../../../lib/hunter/stageArtifact";
import { StageStoreProvider, useStageStore } from "../../../lib/hunter/stageStore";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <a className={className}>{children}</a>
  ),
}));

const { StageCardMount } = await import("./StageCard");

/** One live-shaped payload per kind, as `POST /hunter-chat/message` returns it. */
const FIXTURES: Record<string, StageArtifactInput> = {
  scorecard: {
    kind: "scorecard",
    payload: {
      oppKey: "opp-1",
      title: "Dining facility attendant services",
      agency: "Department of the Army",
      verdict: "certify_to_qualify",
      verdictLabel: "Certify to qualify",
      soleSource: false,
      rows: [{ field: "Set-aside", value: "SDVOSB set-aside", status: "fail" }],
      note: null,
    },
  },
  compare: {
    kind: "compare",
    payload: {
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
    },
  },
  checklist: {
    kind: "checklist",
    payload: {
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
          benefit: undefined,
          turnaround: "5 business days",
          selfServeDestination: null,
          externalGuidance: null,
        },
      ],
      bidChecklist: [{ label: "Active SAM.gov registration", done: true }],
    },
  },
  matches: {
    kind: "matches",
    payload: {
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
    },
  },
  research: {
    kind: "research",
    payload: {
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
    },
  },
  profile: {
    kind: "profile",
    payload: {
      rows: [{ label: "Company name", value: "Acme Facilities LLC", source: "profile" }],
      hiddenCount: 0,
      notOnFile: [],
      capabilityStatement: "parsed",
      factsUnavailable: false,
    },
  },
  profileUpdate: {
    kind: "profileUpdate",
    payload: {
      cards: [
        {
          proposalId: "p1",
          label: "Website",
          lines: [{ label: null, text: "https://acme.example" }],
          heard: null,
          choice: null,
        },
      ],
      notes: [],
    },
  },
};

const KINDS = Object.keys(FIXTURES);

/** Drives the store the way the chat overlay does — one button per kind. */
function Driver() {
  const { showArtifact, dismissArtifact } = useStageStore();
  return (
    <div>
      {KINDS.map((k) => (
        <button key={k} type="button" onClick={() => showArtifact(FIXTURES[k])}>
          show {k}
        </button>
      ))}
      <button type="button" onClick={dismissArtifact}>
        dismiss
      </button>
    </div>
  );
}

function Harness() {
  return (
    <StageStoreProvider>
      <Driver />
      <StageCardMount resultCount={5} />
      <div data-testid="opp-list">
        <article data-testid="opp-card">a card</article>
      </div>
    </StageStoreProvider>
  );
}

function stageCards(): NodeListOf<Element> {
  return document.querySelectorAll(".stage-card");
}

function show(kind: string) {
  fireEvent.click(screen.getByText(`show ${kind}`));
}

function setReducedMotion() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  cleanup();
  setReducedMotion();
});

const EXPECTED: Record<string, { title: string; body: string; selector: string }> = {
  scorecard: {
    title: "Readiness check · Dining facility attendant services",
    body: "SDVOSB set-aside",
    selector: ".scorecard",
  },
  compare: {
    title: "Compare · Mess hall support vs Grounds maintenance",
    body: "$480K",
    selector: ".hunter-compare",
  },
  checklist: {
    title: "Action checklist · Dining facility attendant services",
    body: "SAM.gov registration review",
    selector: ".hunter-act",
  },
  matches: {
    title: "Best matches",
    body: "Custodial services, Fort Liberty",
    selector: ".hunter-matches",
  },
  research: {
    title: "Research · SDVOSB recertification window",
    body: "The certification runs for three years",
    selector: ".hunter-research",
  },
  profile: {
    title: "Your business profile",
    body: "Acme Facilities LLC",
    selector: ".hunter-profile",
  },
  profileUpdate: {
    title: "Update your profile",
    body: "https://acme.example",
    selector: ".hunter-update",
  },
};

/** Each kind's stage-card title, whitespace-normalised. */
const TITLE: Record<string, string> = Object.fromEntries(
  Object.entries(EXPECTED).map(([k, v]) => [k, v.title]),
);

describe("every kind renders its own artifact from a live payload (14a)", () => {
  for (const kind of KINDS) {
    it(`renders the ${kind} artifact, named and bodied from the payload`, () => {
      render(<Harness />);
      show(kind);
      const card = document.querySelector(".stage-card") as HTMLElement;
      const expected = EXPECTED[kind];
      expect(card.querySelector(".stage-card__title")?.textContent?.replace(/\s+/g, " ")).toBe(
        expected.title,
      );
      expect(card.querySelector(expected.selector)).not.toBeNull();
      expect(card.textContent).toContain(expected.body);
    });
  }

  it("names the region in a sentence for every kind", () => {
    const labels = new Set<string>();
    for (const kind of KINDS) {
      cleanup();
      render(<Harness />);
      show(kind);
      const label = document.querySelector(".stage-card")?.getAttribute("aria-label") ?? "";
      expect(label).toMatch(/ (is|are) on screen$/);
      labels.add(label);
    }
    expect(labels.size).toBe(KINDS.length);
  });

  it("offers the same way back from every kind", () => {
    for (const kind of KINDS) {
      cleanup();
      render(<Harness />);
      show(kind);
      expect(screen.getByRole("button", { name: "Back to your 5 results" })).toBeTruthy();
    }
  });
});

describe("exactly one stage card at a time, across all seven kinds (14f)", () => {
  it("holds one card through every ordered pair of kinds", () => {
    for (const first of KINDS) {
      for (const second of KINDS) {
        cleanup();
        render(<Harness />);
        show(first);
        expect(stageCards()).toHaveLength(1);
        show(second);
        expect(stageCards()).toHaveLength(1);
        // The one card on screen is the SECOND one — the store overwrites.
        expect(
          document.querySelector(".stage-card__title")?.textContent?.replace(/\s+/g, " "),
        ).toBe(TITLE[second]);
      }
    }
  });

  it("holds one card after showing every kind in sequence", () => {
    render(<Harness />);
    KINDS.forEach(show);
    expect(stageCards()).toHaveLength(1);
    // The last kind shown is the one on the stage.
    expect(document.querySelector(EXPECTED[KINDS[KINDS.length - 1]].selector)).not.toBeNull();
  });

  it("leaves the feed mounted for every kind, and empties on dismiss", () => {
    render(<Harness />);
    const listBefore = screen.getByTestId("opp-list");
    for (const kind of KINDS) {
      show(kind);
      expect(screen.getByTestId("opp-list")).toBe(listBefore);
    }
    fireEvent.click(screen.getByText("dismiss"));
    expect(stageCards()).toHaveLength(0);
    expect(screen.getByTestId("opp-list")).toBe(listBefore);
  });
});

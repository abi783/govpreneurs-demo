// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { GrantCanvas } from "./GrantCanvas";
import { GRANT_FIXTURES } from "../../lib/grant/fixtures";
import { OPPORTUNITIES } from "../../lib/mock/opportunities";
import type { GrantTake, TakeItem } from "../../lib/grant/take";

const cell = (title: string, kind: TakeItem["kind"]): TakeItem => ({
  kind,
  tone: kind === "strength" ? "ok" : "warn",
  title,
  body: [{ text: `${title} body` }],
});

const TAKE: GrantTake = {
  callWord: "Needs review",
  tone: "warn",
  confidence: { level: "medium", filled: 3, of: 5 },
  paths: [],
  summary: [{ text: "The summary line." }],
  strengths: ["S1", "S2", "S3", "S4", "S5"].map((t) => cell(t, "strength")),
  limits: ["L1", "L2", "L3", "L4"].map((t) => cell(t, "risk")),
  questions: [
    { id: "q1", text: [{ text: "Open question one?" }] },
    { id: "q2", text: [{ text: "Open question two?" }] },
    { id: "q3", text: [{ text: "Open question three?" }] },
    { id: "q4", text: [{ text: "Open question four?" }] },
  ],
  answered: [{ id: "a1", text: [{ text: "Do you hold the license?" }], value: "Yes" }],
  counts: { strengths: 5, blockers: 0, risks: 4, questions: 4 },
  changes: [
    {
      path: "Prime",
      state: "go",
      headline: "Go if you answer yes",
      reason: [{ text: "A change reason." }],
    },
  ],
  thesis: [[{ text: "A thesis line." }]],
  wouldChange: [],
  competitiveRisk: null,
  next: { title: "Start your bid", body: null },
};

let currentTake: GrantTake = TAKE;

vi.mock("../../lib/grant/take", async (orig) => ({
  ...(await orig<typeof import("../../lib/grant/take")>()),
  buildTake: () => currentTake,
}));

const opp = OPPORTUNITIES.find((o) => o.noticeId === "W912EE-26-R-0066")!;
const analysis = GRANT_FIXTURES["W912EE-26-R-0066"](opp);

beforeEach(() => {
  cleanup();
  currentTake = TAKE;
  // Reduced motion: the summary shows at once instead of after the stream delay.
  window.matchMedia = ((query: string) => ({ matches: true, media: query })) as never;
});

const thesis = () => screen.queryByRole("region", { name: "Grant's thesis" });
const changes = () => screen.queryByRole("region", { name: "What would change Grant's call" });

describe("GrantCanvas — the take card shows more on request", () => {
  it("hides the 4th strength until Show N more is clicked, then Show less hides it again", () => {
    render(<GrantCanvas analysis={analysis} />);
    expect(screen.getByText("S3")).toBeTruthy();
    expect(screen.queryByText("S4")).toBeNull();
    const more = screen.getByRole("button", { name: "Show 2 more" });
    expect(more.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(more);
    expect(screen.getByText("S5")).toBeTruthy();
    const less = screen.getByRole("button", { name: "Show less" });
    expect(less.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(less);
    expect(screen.queryByText("S4")).toBeNull();
  });

  it("collapses each column on its own", () => {
    render(<GrantCanvas analysis={analysis} />);
    expect(screen.queryByText("L4")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show 1 more" }));
    expect(screen.getByText("L4")).toBeTruthy();
    expect(screen.queryByText("S4")).toBeNull();
  });

  it("hides the thesis and the changes until Show more of Grant's take is clicked", () => {
    render(<GrantCanvas analysis={analysis} />);
    expect(thesis()).toBeNull();
    expect(changes()).toBeNull();
    const more = screen.getByRole("button", { name: "Show more of Grant's take" });
    expect(more.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(more);
    expect(thesis()?.textContent).toContain("A thesis line.");
    expect(changes()?.textContent).toContain("A change reason.");
    expect(screen.getByRole("button", { name: "Show less of Grant's take" })).toBeTruthy();
  });

  it("never hides an open question, the summary or the next move", () => {
    render(<GrantCanvas analysis={analysis} />);
    for (const n of ["one", "two", "three", "four"])
      expect(screen.getByText(`Open question ${n}?`)).toBeTruthy();
    expect(screen.getByText("The summary line.")).toBeTruthy();
    // DEMO: the next move is also the primary button, so its words show twice.
    expect(screen.getAllByText("Start your bid").length).toBeGreaterThan(0);
  });
});

describe("GrantCanvas — blockers never fold", () => {
  it("shows every blocker, and folds only the other limits", () => {
    currentTake = {
      ...TAKE,
      limits: [
        cell("L1", "risk"),
        cell("L2", "risk"),
        cell("L3", "risk"),
        cell("L4", "risk"),
        cell("Hard blocker", "blocker"),
        cell("No runway left", "blocker"),
      ],
    };
    render(<GrantCanvas analysis={analysis} />);
    expect(screen.getByText("Hard blocker")).toBeTruthy();
    expect(screen.getByText("No runway left")).toBeTruthy();
    expect(screen.getByText("L3")).toBeTruthy();
    expect(screen.queryByText("L4")).toBeNull();
    expect(screen.getByRole("button", { name: "Show 1 more" })).toBeTruthy();
  });

  it("puts your answers below the limits and their toggle", () => {
    render(<GrantCanvas analysis={analysis} onEditAnswer={vi.fn()} />);
    const column = screen.getByRole("region", { name: "What limits the opportunity" });
    const order = [...column.querySelectorAll(".gt-cell__title, .gt-more")].map(
      (el) => el.textContent,
    );
    expect(order.slice(-2)).toEqual(["Show 1 more", "Your answers to Grant"]);
  });
});

describe("GrantCanvas — the expanded parts reset on a new opportunity", () => {
  it("folds the columns again when the opportunity changes", () => {
    const { rerender } = render(<GrantCanvas analysis={analysis} />);
    fireEvent.click(screen.getByRole("button", { name: "Show 2 more" }));
    expect(screen.getByText("S4")).toBeTruthy();
    rerender(<GrantCanvas analysis={{ ...analysis, opportunityId: "another-opp" }} />);
    expect(screen.queryByText("S4")).toBeNull();
  });
});

describe("GrantCanvas — answered questions can be changed from the card", () => {
  it("disables Change while Grant is sending", () => {
    render(<GrantCanvas analysis={analysis} onEditAnswer={vi.fn()} answersDisabled />);
    expect(
      screen.getByRole("button", {
        name: "Change your answer to Do you hold the license?. Current answer: Yes",
      }),
    ).toHaveProperty("disabled", true);
  });

  it("renders a Change button that calls onEditAnswer with the question's id", () => {
    const onEditAnswer = vi.fn();
    render(<GrantCanvas analysis={analysis} onEditAnswer={onEditAnswer} />);
    const row = screen.getByRole("button", {
      name: "Change your answer to Do you hold the license?. Current answer: Yes",
    });
    expect(row.textContent).toContain("Change");
    fireEvent.click(row);
    expect(onEditAnswer).toHaveBeenCalledWith("a1");
  });

  it("says where a reused answer came from, also to a screen reader", () => {
    currentTake = {
      ...TAKE,
      answered: [
        {
          id: "a2",
          text: [{ text: "Can your cash and bonding absorb this?" }],
          value: "No",
          reusedFrom: { title: "Paint the county garage", date: "Nov 3, 2026" },
        },
      ],
    };
    const note = "You told me on “Paint the county garage”, Nov 3, 2026.";
    render(<GrantCanvas analysis={analysis} onEditAnswer={vi.fn()} />);
    expect(screen.getByText(note)).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: `Change your answer to Can your cash and bonding absorb this?. Current answer: No ${note}`,
      }),
    ).toBeTruthy();
  });
});

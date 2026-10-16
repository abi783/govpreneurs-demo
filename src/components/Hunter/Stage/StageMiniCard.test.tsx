// @vitest-environment jsdom
//
// Feature 14 — the compact chat reference. One line, the artifact's name, and
// the way back to it. No payload data beyond the name.
import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { StageArtifactInput } from "../../../lib/hunter/stageArtifact";
import { StageMiniCard } from "./StageMiniCard";

const scorecard: StageArtifactInput = {
  kind: "scorecard",
  payload: {
    oppKey: "opp-1",
    title: "Dining facility attendant services",
    agency: "Department of the Army",
    verdict: "certify_to_qualify",
    verdictLabel: "Certify to qualify",
    soleSource: false,
    rows: [
      { field: "Set-aside", value: "SDVOSB set-aside", status: "fail" },
      { field: "NAICS", value: "722310 — Food service contractors", status: "pass" },
    ],
    note: "Registering the certification is the one blocker.",
  },
};

beforeEach(cleanup);

describe("StageMiniCard", () => {
  it("names the artifact and says where the full answer is", () => {
    render(<StageMiniCard artifact={scorecard} onShow={vi.fn()} />);
    const mini = document.querySelector(".stage-mini") as HTMLElement;
    expect(mini.querySelector(".stage-mini__label")?.textContent).toBe(
      "Readiness check · Dining facility attendant services",
    );
    expect(mini.querySelector(".stage-mini__hint")?.textContent).toBe("On the stage ↑");
  });

  it("carries no payload detail beyond the name", () => {
    render(<StageMiniCard artifact={scorecard} onShow={vi.fn()} />);
    const text = document.querySelector(".stage-mini")?.textContent ?? "";
    for (const detail of [
      "Certify to qualify",
      "SDVOSB set-aside",
      "722310 — Food service contractors",
      "Registering the certification is the one blocker.",
    ]) {
      expect(text).not.toContain(detail);
    }
  });

  it("is one button, and clicking it hands the same artifact back", () => {
    const onShow = vi.fn();
    render(<StageMiniCard artifact={scorecard} onShow={onShow} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    fireEvent.click(buttons[0]);
    expect(onShow).toHaveBeenCalledWith(scorecard);
  });

  it("gives each kind its own icon", () => {
    const kinds: StageArtifactInput[] = [
      scorecard,
      { kind: "matches", payload: { rows: [] } },
      { kind: "research", payload: { query: "q", answer: "", citations: [] } },
      {
        kind: "profile",
        payload: {
          rows: [],
          hiddenCount: 0,
          notOnFile: [],
          capabilityStatement: "none",
          factsUnavailable: false,
        },
      },
      { kind: "profileUpdate", payload: { cards: [], notes: [] } },
    ];
    const seen = new Set<string>();
    for (const artifact of kinds) {
      cleanup();
      render(<StageMiniCard artifact={artifact} onShow={vi.fn()} />);
      const icon = document.querySelector(".stage-mini__icon svg");
      expect(icon).not.toBeNull();
      seen.add(icon?.getAttribute("class") ?? "");
    }
    expect(seen.size).toBe(kinds.length);
  });
});

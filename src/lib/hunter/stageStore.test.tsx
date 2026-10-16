// @vitest-environment jsdom
//
// The store holds a SINGLE NULLABLE VALUE. "One at a time" is a property of the
// capability, not of the render: a store that cannot hold two artifacts cannot
// show two. These tests pin that shape, so a later feature cannot quietly turn
// it into a stack.
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { EligibilityPayload } from "../hunterChat";
import { StageStoreProvider, useStageStore } from "./stageStore";

function payload(title: string): EligibilityPayload {
  return {
    oppKey: `opp-${title}`,
    title,
    agency: null,
    verdict: "eligible",
    verdictLabel: "Eligible",
    soleSource: false,
    rows: [{ field: "NAICS", value: "238160", status: "pass" }],
    note: null,
  };
}

function Probe() {
  const { artifact, showArtifact, dismissArtifact } = useStageStore();
  return (
    <div>
      <span data-testid="held">
        {artifact?.kind === "scorecard" ? artifact.payload.title : "none"}
      </span>
      <span data-testid="key">{artifact ? String(artifact.key) : "-"}</span>
      <button
        type="button"
        onClick={() => showArtifact({ kind: "scorecard", payload: payload("A") })}
      >
        show A
      </button>
      <button
        type="button"
        onClick={() => showArtifact({ kind: "scorecard", payload: payload("B") })}
      >
        show B
      </button>
      <button type="button" onClick={dismissArtifact}>
        dismiss
      </button>
    </div>
  );
}

function held() {
  return screen.getByTestId("held").textContent;
}

beforeEach(cleanup);

describe("useStageStore", () => {
  it("starts empty", () => {
    render(
      <StageStoreProvider>
        <Probe />
      </StageStoreProvider>,
    );
    expect(held()).toBe("none");
  });

  it("overwrites rather than accumulating", () => {
    render(
      <StageStoreProvider>
        <Probe />
      </StageStoreProvider>,
    );
    fireEvent.click(screen.getByText("show A"));
    expect(held()).toBe("A");
    fireEvent.click(screen.getByText("show B"));
    expect(held()).toBe("B");
  });

  it("assigns a fresh key each time, so the same question re-runs the reveal", () => {
    render(
      <StageStoreProvider>
        <Probe />
      </StageStoreProvider>,
    );
    fireEvent.click(screen.getByText("show A"));
    const first = screen.getByTestId("key").textContent;
    fireEvent.click(screen.getByText("show A"));
    expect(screen.getByTestId("key").textContent).not.toBe(first);
  });

  it("clears back to null on dismiss, with no history to restore", () => {
    render(
      <StageStoreProvider>
        <Probe />
      </StageStoreProvider>,
    );
    fireEvent.click(screen.getByText("show A"));
    fireEvent.click(screen.getByText("show B"));
    fireEvent.click(screen.getByText("dismiss"));
    expect(held()).toBe("none");
  });

  it("exposes exactly three members — no array, no stack, no history", () => {
    let keys: string[] = [];
    function Shape() {
      keys = Object.keys(useStageStore()).sort();
      return null;
    }
    render(
      <StageStoreProvider>
        <Shape />
      </StageStoreProvider>,
    );
    expect(keys).toEqual(["artifact", "dismissArtifact", "showArtifact"]);
  });

  it("throws when used outside the provider", () => {
    function Bare() {
      useStageStore();
      return null;
    }
    expect(() => render(<Bare />)).toThrow(/StageStoreProvider/);
  });
});

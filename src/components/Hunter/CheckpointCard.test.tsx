// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CheckpointCard } from "./CheckpointCard";
import type { CheckpointPayload } from "../../lib/enrichment";

afterEach(cleanup);

const checkpoint: CheckpointPayload = {
  kind: "checkpoint",
  milestone: "A_work_and_where",
  summary: ["Electrical contractor", "Serves TX & LA"],
  payoffDelta: { unlocked: 9, sharpened: 4 },
  totalPayoff: { unlocked: 9, sharpened: 4 },
  options: ["continue", "stop"],
  rail: [],
  isFinal: false,
};

describe("CheckpointCard", () => {
  it("renders the gathered summary, the payoff delta, and both choices", () => {
    render(<CheckpointCard checkpoint={checkpoint} onDecision={vi.fn()} />);
    expect(screen.getByText(/Electrical contractor, Serves TX & LA/)).toBeTruthy();
    expect(screen.getByText("+9 unlocked")).toBeTruthy();
    expect(screen.getByText("4 got stronger")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Keep going" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Stop here for now" })).toBeTruthy();
  });

  it("fires 'continue' when Keep going is clicked", () => {
    const onDecision = vi.fn();
    render(<CheckpointCard checkpoint={checkpoint} onDecision={onDecision} />);
    fireEvent.click(screen.getByRole("button", { name: "Keep going" }));
    expect(onDecision).toHaveBeenCalledWith("continue");
  });

  it("fires 'stop' when Stop here for now is clicked", () => {
    const onDecision = vi.fn();
    render(<CheckpointCard checkpoint={checkpoint} onDecision={onDecision} />);
    fireEvent.click(screen.getByRole("button", { name: "Stop here for now" }));
    expect(onDecision).toHaveBeenCalledWith("stop");
  });

  it("labels the primary 'Finish up' on the final milestone", () => {
    render(<CheckpointCard checkpoint={{ ...checkpoint, isFinal: true }} onDecision={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Finish up" })).toBeTruthy();
  });

  it("sits in the same turn row as every other card in the column", () => {
    const { container } = render(<CheckpointCard checkpoint={checkpoint} onDecision={vi.fn()} />);
    expect((container.firstChild as HTMLElement).className).toBe("hunter-msg-row from-hunter");
  });

  it("speaks on the prototype's AI surface — Hunter is the author here", () => {
    render(<CheckpointCard checkpoint={checkpoint} onDecision={vi.fn()} />);
    const card = screen.getByRole("group", { name: "Enrichment checkpoint" });
    expect(card.className.split(/\s+/)).toContain("ai-surface");
  });

  it("disables both choices while a decision is in flight", () => {
    render(<CheckpointCard checkpoint={checkpoint} onDecision={vi.fn()} busy />);
    expect((screen.getByRole("button", { name: "Keep going" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(
      (screen.getByRole("button", { name: "Stop here for now" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});

/**
 * `totalPayoff` — the journey's running total — is sent on every checkpoint and
 * was dropped by the frontend. The milestone's own gain still leads; the total
 * trails it, and only when the two differ.
 */
describe("CheckpointCard running total", () => {
  it("trails the milestone gain with the journey's running total", () => {
    render(
      <CheckpointCard
        checkpoint={{ ...checkpoint, totalPayoff: { unlocked: 21, sharpened: 8 } }}
        onDecision={vi.fn()}
      />,
    );
    expect(screen.getByText("+9 unlocked")).toBeTruthy();
    expect(screen.getByText("So far")).toBeTruthy();
    expect(screen.getByText("+21 unlocked")).toBeTruthy();
    expect(screen.getByText("8 got stronger")).toBeTruthy();
  });

  it("states the total once when the first milestone IS the whole journey so far", () => {
    render(<CheckpointCard checkpoint={checkpoint} onDecision={vi.fn()} />);
    expect(screen.queryByText("So far")).toBeNull();
    expect(screen.getAllByText("+9 unlocked")).toHaveLength(1);
  });

  it("states a zero total as an absence, never as a wasted answer", () => {
    render(
      <CheckpointCard
        checkpoint={{
          ...checkpoint,
          payoffDelta: { unlocked: 0, sharpened: 0 },
          totalPayoff: { unlocked: 0, sharpened: 0 },
        }}
        onDecision={vi.fn()}
      />,
    );
    expect(screen.getByText("Saved — no new matches opened from this one")).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MilestoneRail } from "./MilestoneRail";
import type { MilestoneRailItem } from "../../lib/enrichment";

const rail: MilestoneRailItem[] = [
  {
    milestone: "A_work_and_where",
    label: "What you do & where",
    status: "done",
    answered: 3,
    total: 3,
  },
  { milestone: "B_how_you_win", label: "How you win", status: "active", answered: 1, total: 3 },
  { milestone: "C_readiness", label: "Readiness", status: "upcoming", answered: 0, total: 5 },
  { milestone: "D_sharpen", label: "Sharpen", status: "upcoming", answered: 0, total: 2 },
];

beforeEach(cleanup);

describe("MilestoneRail", () => {
  it("captions where the member is", () => {
    render(<MilestoneRail rail={rail} />);

    expect(screen.getByText(/Step 2 of 4 — How you win/)).toBeTruthy();
  });

  it("stays read-only progress chrome with no jump handler", () => {
    render(<MilestoneRail rail={rail} />);

    // Decorative letters carry nothing the caption does not already say.
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders each step as a control that names its milestone", () => {
    render(<MilestoneRail rail={rail} onJump={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Go to What you do & where" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Go to Readiness" })).toBeTruthy();
  });

  it("jumps to the clicked milestone", () => {
    const onJump = vi.fn();
    render(<MilestoneRail rail={rail} onJump={onJump} />);

    fireEvent.click(screen.getByRole("button", { name: "Go to Readiness" }));

    expect(onJump).toHaveBeenCalledWith("C_readiness");
  });

  it("disables the milestone the member is already on", () => {
    const onJump = vi.fn();
    render(<MilestoneRail rail={rail} onJump={onJump} />);

    const current = screen.getByRole("button", { name: "Go to How you win" });
    expect((current as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(current);
    expect(onJump).not.toHaveBeenCalled();
  });

  it("renders nothing without a rail", () => {
    const { container } = render(<MilestoneRail rail={[]} />);

    expect(container.firstChild).toBeNull();
  });
});

/**
 * The letter is a CHIP — a filled pill that sits over the connector line. Both
 * forms carry the same chip class, so an interactive rail is not a different
 * shape from a read-only one: only the cursor and the focus ring differ.
 */
describe("MilestoneRail — the step chip", () => {
  it("chips the static letter", () => {
    const { container } = render(<MilestoneRail rail={rail} />);

    expect(container.querySelectorAll(".hunter-enrich-rail__chip")).toHaveLength(4);
  });

  it("chips the jump control with the same class", () => {
    const { container } = render(<MilestoneRail rail={rail} onJump={vi.fn()} />);

    expect(container.querySelectorAll("button.hunter-enrich-rail__chip")).toHaveLength(4);
  });
});

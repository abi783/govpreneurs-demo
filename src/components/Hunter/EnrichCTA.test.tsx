// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import type { EnrichmentStatePayload } from "../../lib/enrichment";

// Capture the enter-endpoint call (hoisted so the mock factory can reference it).
const { enterEnrichment } = vi.hoisted(() => ({ enterEnrichment: vi.fn() }));
vi.mock("../../lib/enrichment", async (orig) => {
  const actual = await orig<typeof import("../../lib/enrichment")>();
  return { ...actual, enterEnrichment };
});

import { EnrichCTA } from "./EnrichCTA";

const baseState: EnrichmentStatePayload = {
  posture: "NORMAL",
  active: false,
  paused: false,
  atCheckpoint: false,
  milestone: null,
  rail: [
    {
      milestone: "A_work_and_where",
      label: "What you do & where",
      status: "active",
      answered: 0,
      total: 3,
    },
  ],
  payoffDelta: { unlocked: 0, sharpened: 0 },
  scoringMode: "rule_only",
  embedReady: false,
};

beforeEach(() => {
  cleanup();
  enterEnrichment.mockReset();
});

describe("EnrichCTA", () => {
  it("calls POST /enter and hands the returned state back on click", async () => {
    const entered: EnrichmentStatePayload = {
      ...baseState,
      active: true,
      milestone: "A_work_and_where",
    };
    enterEnrichment.mockResolvedValue(entered);
    const onEntered = vi.fn();
    render(<EnrichCTA state={baseState} onEntered={onEntered} />);

    fireEvent.click(screen.getByRole("button", { name: "Complete your profile" }));

    // The SHARPEN path: a plain enter has nothing to ask a covered member.
    await waitFor(() => expect(enterEnrichment).toHaveBeenCalledWith(true, { reopen: true }));
    await waitFor(() => expect(onEntered).toHaveBeenCalledWith(entered));
  });

  it("labels 'Resume profile setup' for a paused journey", () => {
    render(<EnrichCTA state={{ ...baseState, paused: true }} onEntered={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Resume profile setup" })).toBeTruthy();
  });

  it("renders nothing while the journey is already active", () => {
    const { container } = render(
      <EnrichCTA state={{ ...baseState, active: true }} onEntered={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

/**
 * A PAUSED journey is `active: true, paused: true` — the shape the backend
 * actually returns from "Stop here for now". The case above passes `paused`
 * with `active: false`, which the server never produces, so it passed while the
 * real state was broken.
 */
describe("EnrichCTA after Stop here for now", () => {
  const stopped: EnrichmentStatePayload = { ...baseState, active: true, paused: true };

  it("offers the resume button for a paused-but-active journey", () => {
    render(<EnrichCTA state={stopped} onEntered={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Resume profile setup" })).toBeTruthy();
  });

  it("still renders nothing while the journey is genuinely in session", () => {
    const { container } = render(
      <EnrichCTA state={{ ...baseState, active: true, paused: false }} onEntered={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

/**
 * The button carries a static ring in the two states where entering matters
 * most: a thin profile (strength 1–2) and a paused journey. Both inputs were
 * already read for the label, so the emphasis costs nothing to compute — it was
 * simply dropped in the port.
 */
describe("EnrichCTA emphasis", () => {
  /** A rail of one milestone at `answered` of 3, which is what sets the level. */
  const railAt = (answered: number): EnrichmentStatePayload["rail"] => [
    {
      milestone: "A_work_and_where",
      label: "What you do & where",
      status: "active",
      answered,
      total: 3,
    },
  ];

  it("rings the button while the profile is thin", () => {
    render(<EnrichCTA state={{ ...baseState, rail: railAt(0) }} onEntered={vi.fn()} />);
    expect(screen.getByRole("button").className).toContain("is-emphasized");
  });

  it("rings the button for a paused journey, however strong the profile", () => {
    render(
      <EnrichCTA
        state={{ ...baseState, active: true, paused: true, rail: railAt(3) }}
        onEntered={vi.fn()}
      />,
    );
    expect(screen.getByRole("button").className).toContain("is-emphasized");
  });

  it("drops the ring once the profile is strong", () => {
    render(<EnrichCTA state={{ ...baseState, rail: railAt(3) }} onEntered={vi.fn()} />);
    expect(screen.getByRole("button").className).not.toContain("is-emphasized");
  });

  it("interpolates no variant it has no rule for", () => {
    render(<EnrichCTA state={baseState} onEntered={vi.fn()} />);
    expect(screen.getByRole("button").className).not.toContain("hunter-enrich-cta--");
  });
});

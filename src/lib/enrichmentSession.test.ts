import { describe, it, expect } from "vitest";
import {
  isJourneyInSession,
  isProfileComplete,
  deriveStrength,
  type MilestoneRailItem,
} from "./enrichment";

/**
 * The two predicates behind "is the profile builder showing?".
 *
 * Both exist because the obvious reading of the state is wrong in a way that
 * shipped: `active` alone is not "in session", and the strength tier is not
 * "complete".
 */

const rail = (answered: number, total: number): MilestoneRailItem[] => [
  { milestone: "A_work_and_where", label: "What you do & where", status: "active", answered, total },
];

describe("isJourneyInSession", () => {
  it("is false for a PAUSED journey, which the backend still marks active", () => {
    // The regression: "Stop here for now" sets `paused` and leaves `active`
    // true, so every surface gating on `active` kept the builder on screen.
    expect(isJourneyInSession({ active: true, paused: true })).toBe(false);
  });

  it("is true only while the journey actually owns the conversation", () => {
    expect(isJourneyInSession({ active: true, paused: false })).toBe(true);
  });

  it("is false when there is no journey at all", () => {
    expect(isJourneyInSession({ active: false, paused: false })).toBe(false);
    expect(isJourneyInSession(null)).toBe(false);
    expect(isJourneyInSession(undefined)).toBe(false);
  });

  it("matches the backend's own definition of in-session", () => {
    // `EnrichmentService.suspendsNudges` is `active && !paused`. These must not
    // drift: the client decides what to SHOW from the same rule the server uses
    // to decide whether to stay quiet.
    for (const active of [true, false]) {
      for (const paused of [true, false]) {
        expect(isJourneyInSession({ active, paused })).toBe(active && !paused);
      }
    }
  });
});

describe("isProfileComplete", () => {
  it("is false at the top strength TIER while questions remain", () => {
    // The trap this predicate exists for: `deriveStrength` reaches level 4 at
    // 75%, so a member reading "sharp · 4 of 4" can still owe a quarter of the
    // journey. Hiding the entry point on the tier would retire it early.
    const threeOfFour = rail(3, 4);
    expect(deriveStrength(threeOfFour).level).toBe(4);
    expect(isProfileComplete(threeOfFour)).toBe(false);
  });

  it("is true only when every milestone question is answered", () => {
    expect(isProfileComplete(rail(4, 4))).toBe(true);
  });

  it("sums across milestones rather than judging each alone", () => {
    expect(
      isProfileComplete([
        { milestone: "A_work_and_where", label: "A", status: "done", answered: 3, total: 3 },
        { milestone: "B_how_you_win", label: "B", status: "active", answered: 1, total: 3 },
      ]),
    ).toBe(false);
  });

  it("treats an absent or empty rail as NOT complete", () => {
    // A degraded `/state` read must not be mistaken for a finished profile —
    // that would hide the only entry point the member has.
    expect(isProfileComplete(undefined)).toBe(false);
    expect(isProfileComplete(null)).toBe(false);
    expect(isProfileComplete([])).toBe(false);
  });
});

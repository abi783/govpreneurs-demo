import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  allowSendToMentor,
  ELITE_PLAN_PRODUCT_ID,
  EXPERT_PLAN_PRODUCT_ID,
  isTooCloseToDeadline,
} from "./entitlements";
import { isMockEnv } from "./env";

vi.mock("./env", () => ({ isMockEnv: vi.fn() }));

const mockIsMockEnv = vi.mocked(isMockEnv);

beforeEach(() => {
  mockIsMockEnv.mockReset();
});

describe("allowSendToMentor — Expert/Elite gating for Send to Mentor", () => {
  // Production (isMockEnv=false): the real plan check applies.
  describe("production (isMockEnv=false)", () => {
    beforeEach(() => {
      mockIsMockEnv.mockReturnValue(false);
    });

    it("returns true when productId equals ELITE_PLAN_PRODUCT_ID", () => {
      expect(allowSendToMentor(ELITE_PLAN_PRODUCT_ID)).toBe(true);
    });

    it("returns true when productId equals EXPERT_PLAN_PRODUCT_ID", () => {
      expect(allowSendToMentor(EXPERT_PLAN_PRODUCT_ID)).toBe(true);
    });

    it("returns false for a different productId (e.g. Pilot)", () => {
      expect(allowSendToMentor("prod_someOtherPlan")).toBe(false);
    });

    it("returns false for null", () => {
      expect(allowSendToMentor(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(allowSendToMentor(undefined)).toBe(false);
    });
  });

  // Mock env (isMockEnv=true): the bare mock user (no productId) is unlocked
  // for local dev, but a mock session that resolves a REAL plan is gated on it
  // — so the Pilot upsell is reachable locally via `?locationId=`.
  describe("mock env (isMockEnv=true)", () => {
    beforeEach(() => {
      mockIsMockEnv.mockReturnValue(true);
    });

    it("returns true for the Elite productId", () => {
      expect(allowSendToMentor(ELITE_PLAN_PRODUCT_ID)).toBe(true);
    });

    it("returns true for the Expert productId", () => {
      expect(allowSendToMentor(EXPERT_PLAN_PRODUCT_ID)).toBe(true);
    });

    it("gates a real unentitled productId (e.g. Pilot) so the upsell shows", () => {
      expect(allowSendToMentor("prod_someOtherPlan")).toBe(false);
    });

    it("returns true for null (bare mock user has no plan)", () => {
      expect(allowSendToMentor(null)).toBe(true);
    });

    it("returns true for undefined (bare mock user has no plan)", () => {
      expect(allowSendToMentor(undefined)).toBe(true);
    });
  });
});

describe("isTooCloseToDeadline — 5-day closing-window mentor gate", () => {
  const now = new Date("2026-06-01T00:00:00Z");

  it("blocks a deadline less than 5 days away", () => {
    const deadline = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString();
    expect(isTooCloseToDeadline(deadline, now)).toBe(true);
  });

  it("blocks a deadline exactly 5 days away (inside the closing window)", () => {
    const deadline = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(isTooCloseToDeadline(deadline, now)).toBe(true);
  });

  it("allows a deadline 1ms past the 5-day window", () => {
    const deadline = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 1).toISOString();
    expect(isTooCloseToDeadline(deadline, now)).toBe(false);
  });

  it("blocks a small-order close day (YYYY-MM-DD) inside the window", () => {
    expect(isTooCloseToDeadline("2026-06-04", now)).toBe(true);
  });

  it("blocks an already-past deadline", () => {
    const deadline = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    expect(isTooCloseToDeadline(deadline, now)).toBe(true);
  });

  it("allows a deadline far in the future", () => {
    const deadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(isTooCloseToDeadline(deadline, now)).toBe(false);
  });

  it("does not block a null deadline", () => {
    expect(isTooCloseToDeadline(null, now)).toBe(false);
  });

  it("does not block an undefined deadline", () => {
    expect(isTooCloseToDeadline(undefined, now)).toBe(false);
  });

  it("does not block an empty-string deadline (HigherGov doc with no dueDate)", () => {
    expect(isTooCloseToDeadline("", now)).toBe(false);
  });
});

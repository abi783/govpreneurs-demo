import { describe, it, expect } from "vitest";
import { WORK_TYPES, WORK_TYPE_TO_NAICS, workTypeLabel } from "./trades";

const NAICS_CODE_RE = /^\d{6}$/;

describe("trade vocabulary", () => {
  it("gives every trade a code bundle, so a trade cannot be added without its codes", () => {
    expect(WORK_TYPES.length).toBeGreaterThan(0);
    for (const trade of WORK_TYPES) {
      const codes = WORK_TYPE_TO_NAICS[trade.id];
      expect(codes, `${trade.id} has no entry in WORK_TYPE_TO_NAICS`).toBeDefined();
      expect(codes.length, `${trade.id} has an empty code bundle`).toBeGreaterThan(0);
    }
  });

  it("names every trade, and the name is never empty", () => {
    for (const trade of WORK_TYPES) {
      expect(trade.id).not.toBe("");
      expect(workTypeLabel(trade.id)).toBe(trade.label);
      expect(workTypeLabel(trade.id)).not.toBe("");
    }
  });

  it("falls back to the raw id for a trade it does not hold", () => {
    expect(workTypeLabel("no_such_trade")).toBe("no_such_trade");
  });

  it("holds no code bundle for a trade WORK_TYPES does not list", () => {
    const ids = new Set(WORK_TYPES.map((trade) => trade.id));
    for (const key of Object.keys(WORK_TYPE_TO_NAICS)) {
      expect(ids.has(key), `${key} has codes but no WORK_TYPES entry`).toBe(true);
    }
  });

  it("holds six-digit NAICS codes only", () => {
    for (const [trade, codes] of Object.entries(WORK_TYPE_TO_NAICS)) {
      for (const code of codes) {
        expect(code, `${trade} holds a malformed code`).toMatch(NAICS_CODE_RE);
      }
    }
  });
});

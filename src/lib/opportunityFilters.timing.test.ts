import { describe, it, expect } from "vitest";
import {
  dueWindowForDays,
  dueWithinDays,
  emptyFilters,
  evaluateFilters,
  inDueWindow,
  type EvaluableOpp,
} from "./opportunityFilters";

const withDue = (dueWindow: string[]) => ({ ...emptyFilters(), dueWindow });

describe("closing-date helpers", () => {
  it("writes a number of days as within_N, and null as any date", () => {
    expect(dueWindowForDays(15)).toEqual(["within_15"]);
    expect(dueWindowForDays(null)).toEqual(["any"]);
  });

  it("reads within_N and the older fixed ids back as days", () => {
    expect(dueWithinDays(withDue(["within_15"]))).toBe(15);
    expect(dueWithinDays(withDue(["this_week"]))).toBe(7);
    expect(dueWithinDays(withDue(["2_weeks"]))).toBe(14);
    expect(dueWithinDays(withDue(["30_days"]))).toBe(30);
  });

  it("reads any date, 60_plus and junk as null", () => {
    expect(dueWithinDays(withDue(["any"]))).toBeNull();
    expect(dueWithinDays(withDue(["60_plus"]))).toBeNull();
    expect(dueWithinDays(withDue(["soon"]))).toBeNull();
  });

  it("puts a record in within_N from today to day N, and not after it closed", () => {
    expect(inDueWindow("within_10", 0)).toBe(true);
    expect(inDueWindow("within_10", 10)).toBe(true);
    expect(inDueWindow("within_10", 11)).toBe(false);
    expect(inDueWindow("within_10", -1)).toBe(false);
  });

  it("keeps the older ids working", () => {
    expect(inDueWindow("this_week", 5)).toBe(true);
    expect(inDueWindow("60_plus", 61)).toBe(true);
    expect(inDueWindow("60_plus", 30)).toBe(false);
  });

  it("filters records by within_N in evaluateFilters", () => {
    const opp = (daysUntilClose: number): EvaluableOpp => ({
      scope: "fed",
      agency: "GSA",
      title: `closes in ${daysUntilClose}`,
      workType: "",
      location: "Raleigh, NC",
      daysUntilClose,
    });
    const kept = evaluateFilters(withDue(["within_20"]), [opp(5), opp(20), opp(25)]);
    expect(kept.map((o) => o.daysUntilClose)).toEqual([5, 20]);
  });
});

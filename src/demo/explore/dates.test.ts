import { describe, expect, it } from "vitest";
import { calendarDay, calendarIso, calendarMidnight, dayToIso, daysToDay } from "./dates";

describe("calendar days from today", () => {
  it("is always local midnight, across a daylight-saving change", () => {
    for (let n = -400; n <= 400; n += 1) {
      const d = calendarMidnight(n);
      expect([d.getHours(), d.getMinutes(), d.getSeconds()]).toEqual([0, 0, 0]);
    }
  });

  it("steps one calendar day at a time", () => {
    let previous = new Date(`${calendarDay(0)}T12:00:00`);
    for (let n = 1; n <= 400; n += 1) {
      const next = new Date(`${calendarDay(n)}T12:00:00`);
      expect(Math.round((next.getTime() - previous.getTime()) / 86_400_000)).toBe(1);
      previous = next;
    }
  });

  it("turns a day back into the same count", () => {
    for (const n of [0, 1, 17, 18, 40, 165, 400]) {
      expect(daysToDay(calendarDay(n))).toBe(n);
      expect(dayToIso(calendarDay(n))).toBe(calendarIso(n));
    }
  });
});

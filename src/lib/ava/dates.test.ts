// Ava counts days as calendar days from the day the demo opens, never as
// 24-hour steps. A clock change (the US one falls on 1 November 2026) makes a
// day 23 or 25 hours long, and a count in hours would show the wrong date.

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const ZONES = ["America/New_York", "America/Los_Angeles", "UTC", "Pacific/Auckland"];
const original = process.env.TZ;

/** The demo opens at `hour` o'clock, local time in `zone`, on 16 October 2026. */
async function atOpening(zone: string, hour: number) {
  process.env.TZ = zone;
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 16, hour, 30, 0));
  vi.resetModules();
  const dates = await import("./dates");
  const when = await import("./fixtures/when");
  const opp = await import("../../demo/ava/opportunity");
  return { dates, when, opp };
}

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
  if (original === undefined) delete process.env.TZ;
  else process.env.TZ = original;
});

describe("calendar days across the November clock change", () => {
  for (const zone of ZONES) {
    test(`opened on 16 October in ${zone}: 17 days later is 2 November, a Monday`, async () => {
      const { dates, when } = await atOpening(zone, 12);
      expect(dates.fullDate(dates.dayFromNow(0))).toBe("16 October 2026");
      expect(dates.fullDate(dates.dayFromNow(16))).toBe("1 November 2026");
      expect(dates.fullDate(dates.dayFromNow(17))).toBe("2 November 2026");
      expect(when.WD(17)).toBe("Monday 2 November 2026");
      expect(when.US(17)).toBe("November 2, 2026");
      expect(dates.daysFromToday(dates.dayFromNow(17))).toBe(17);
    });

    test(`the due day of a story bid is the same calendar day in ${zone}`, async () => {
      const { dates, opp } = await atOpening(zone, 23);
      for (const o of opp.OPPS) {
        const due = new Date(o.closesAt);
        // The local date of the due moment is today plus the story's days.
        const expected = new Date(2026, 9, 16 + o.closesInDays);
        expect([due.getFullYear(), due.getMonth(), due.getDate()]).toEqual([
          expected.getFullYear(),
          expected.getMonth(),
          expected.getDate(),
        ]);
        expect(opp.daysToClose(o)).toBe(o.closesInDays);
      }
      expect(dates.fullDate(dates.today())).toBe("16 October 2026");
    });
  }
});

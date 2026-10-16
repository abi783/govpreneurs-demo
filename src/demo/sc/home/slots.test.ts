import { describe, expect, it } from "vitest";
import { BENCH } from "@/demo/sc/mentors/bench";
import { freeSlots, isFreeSlot, BOOKABLE_BUSINESS_DAYS, type SlotCalendar } from "./slots";
import { addMentorBooking, calendarIdFor, mentorIdFromCalendar, takenStarts } from "./store";
import { nextBusinessDays, todayEastern, weekdayOf, wallToInstant, ymdIn } from "./time";

const ET = "America/New_York";
const calendarOf = (m: (typeof BENCH)[number]): SlotCalendar => ({ id: m.id, hours: m.hours, days: m.days, busyShare: m.busyShare });
const ALL = [0, Number.MAX_SAFE_INTEGER] as const;

describe("time helpers", () => {
  it("turns an Eastern wall time into the right instant, in summer and in winter", () => {
    expect(wallToInstant("2026-10-19", 10, 0, ET).toISOString()).toBe("2026-10-19T14:00:00.000Z");
    expect(wallToInstant("2026-11-02", 10, 0, ET).toISOString()).toBe("2026-11-02T15:00:00.000Z");
    expect(ymdIn(new Date("2026-11-02T03:00:00Z"), ET)).toBe("2026-11-01");
  });

  it("lists the next ten business days after today, with no weekend", () => {
    const days = nextBusinessDays(10);
    expect(days).toHaveLength(10);
    expect(days.every((d) => d > todayEastern())).toBe(true);
    expect(days.every((d) => ![0, 6].includes(weekdayOf(d)))).toBe(true);
  });
});

describe("free slots", () => {
  it("opens at most ten business days, with at least three slots on each working day", () => {
    for (const mentor of BENCH) {
      const byDay = freeSlots(calendarOf(mentor), ALL[0], ALL[1], ET);
      const days = Object.keys(byDay);
      expect(days.length).toBeLessThanOrEqual(BOOKABLE_BUSINESS_DAYS);
      expect(days.length).toBeGreaterThanOrEqual(4);
      for (const day of days) {
        expect(byDay[day].length).toBeGreaterThanOrEqual(3);
        expect(mentor.days).toContain(weekdayOf(day));
      }
    }
  });

  it("puts every slot on the half hour, inside the mentor's hours, in Eastern time", () => {
    for (const mentor of BENCH) {
      const byDay = freeSlots(calendarOf(mentor), ALL[0], ALL[1], ET);
      for (const iso of Object.values(byDay).flat()) {
        const wall = new Date(iso).toLocaleTimeString("en-US", { timeZone: ET, hour12: false, hour: "2-digit", minute: "2-digit" });
        const [h, m] = wall.split(":").map(Number);
        expect([0, 30]).toContain(m);
        expect(h).toBeGreaterThanOrEqual(mentor.hours.start);
        expect(h).toBeLessThanOrEqual(mentor.hours.end);
        expect(h).not.toBe(mentor.hours.lunch ?? -1);
      }
    }
  });

  it("shows the same slots every time", () => {
    const sarah = calendarOf(BENCH[0]);
    expect(freeSlots(sarah, ALL[0], ALL[1], ET)).toEqual(freeSlots(sarah, ALL[0], ALL[1], ET));
  });

  it("removes a slot once the member books it, with any mentor", () => {
    const [sarah, renee] = [BENCH[0], BENCH[1]];
    const first = Object.values(freeSlots(calendarOf(renee), ALL[0], ALL[1], ET)).flat()[0];
    expect(isFreeSlot(calendarOf(renee), first)).toBe(true);
    addMentorBooking({ mentor: renee, startTime: first, endTime: new Date(new Date(first).getTime() + 1_800_000).toISOString(), paid: renee.price });
    expect(takenStarts().has(new Date(first).getTime())).toBe(true);
    expect(isFreeSlot(calendarOf(renee), first)).toBe(false);
    // The member cannot be on two calls at once, so Sarah's calendar loses that time too.
    expect(isFreeSlot(calendarOf(sarah), first)).toBe(false);
  });

  it("maps a mentor calendar id back to the mentor", () => {
    expect(mentorIdFromCalendar(calendarIdFor(BENCH[2].id))).toBe(BENCH[2].id);
    expect(mentorIdFromCalendar("cal-program-team")).toBeNull();
  });
});

import { computeRealDeadline } from "./computeRealDeadline";
import type { RealDeadlineInputs } from "./types";

const NOW = new Date("2026-07-29T12:00:00Z");

const inputs = (over: Partial<RealDeadlineInputs> = {}): RealDeadlineInputs => ({
  responseDue: "2026-09-30T17:00:00Z",
  bondingLeadDays: 14,
  ppqTurnaroundDays: 5,
  subQuoteDays: 7,
  writingDays: 3,
  passedEvents: [],
  ...over,
});

const flat = (l: { text: string }[]) => l.map((s) => s.text).join("");

describe("computeRealDeadline", () => {
  it("deducts the lead times from the notice date", () => {
    const d = computeRealDeadline(inputs(), NOW);
    expect(d.noticeDays).toBe(64); // Math.ceil of the 63.2-day span
    expect(d.realRunwayDays).toBe(64 - 29);
    expect(d.status).toBe("ok");
    expect(new Date(d.realDeadline ?? "").toISOString()).toBe("2026-09-01T17:00:00.000Z");
  });

  it("never reports negative days for a notice that already closed", () => {
    const d = computeRealDeadline(inputs({ responseDue: "2020-01-01T00:00:00Z" }), NOW);
    expect(d.noticeDays).toBe(0);
    expect(d.realRunwayDays).toBeLessThanOrEqual(0);
    expect(flat(d.sentence)).toContain("already passed");
    expect(flat(d.sentence)).not.toMatch(/-\d/);
  });

  it("degrades honestly when the response date will not parse (never throws)", () => {
    const d = computeRealDeadline(inputs({ responseDue: "not-a-date" }), NOW);
    expect(d.noticeDays).toBe(0);
    expect(d.realRunwayDays).toBe(0);
    expect(d.status).toBe("tight");
    expect(flat(d.sentence)).toContain("couldn't read the response date");
    expect(flat(d.sentence)).not.toContain("NaN");
  });

  it("ignores NaN / negative lead times instead of poisoning the math", () => {
    const d = computeRealDeadline(
      inputs({ bondingLeadDays: NaN, writingDays: -5, ppqTurnaroundDays: 5, subQuoteDays: 0 }),
      NOW,
    );
    expect(d.deductions.map((x) => x.label)).toEqual(["Reference questionnaires"]);
    expect(d.realRunwayDays).toBe(64 - 5);
    expect(Number.isNaN(d.realRunwayDays)).toBe(false);
  });

  it("keeps a 6-day notice open even when the lead times exceed it", () => {
    const d = computeRealDeadline(
      inputs({
        responseDue: "2026-08-04T12:00:00Z",
        bondingLeadDays: 0,
        subQuoteDays: 0,
      }),
      NOW,
    );
    expect(d.noticeDays).toBe(6);
    expect(d.realRunwayDays).toBe(-2);
    expect(d.status).toBe("tight");
  });

  it("blocks a notice inside the 5-day closing window and says why", () => {
    const d = computeRealDeadline(
      inputs({ responseDue: "2026-08-03T12:00:00Z", bondingLeadDays: 0, subQuoteDays: 0 }),
      NOW,
    );
    expect(d.noticeDays).toBe(5);
    expect(d.status).toBe("blocked");
    expect(flat(d.sentence)).toContain("not enough time to prepare");
  });

  it("marks a missed mandatory event", () => {
    const d = computeRealDeadline(
      inputs({ passedEvents: [{ label: "Site visit", date: "2026-07-01T00:00:00Z" }] }),
      NOW,
    );
    expect(d.passedEvents[0].missed).toBe(true);
    expect(d.status).not.toBe("ok");
  });

  // Owner fix 2026-09-25: "The notice says 6 days. You have 0." did not say
  // where the 6 days went.
  describe("names the lead times next to the days left", () => {
    const tight = (over: Partial<RealDeadlineInputs>) =>
      flat(
        computeRealDeadline(inputs({ bondingLeadDays: 0, subQuoteDays: 0, ...over }), NOW).sentence,
      );

    it("reads the owner's example", () => {
      expect(tight({ responseDue: "2026-08-04T12:00:00Z" })).toBe(
        "The notice says 6 days. After 5 days for past-performance forms and 3 for writing, you have 0.",
      );
    });

    it("lists three lead times with commas and one 'and'", () => {
      expect(tight({ responseDue: "2026-08-18T12:00:00Z", bondingLeadDays: 14 })).toBe(
        "The notice says 20 days. After 14 days for bonding, 5 for past-performance forms and 3 for writing, you have 0.",
      );
    });

    it("says 'day' for a single day", () => {
      expect(
        tight({ responseDue: "2026-08-08T12:00:00Z", ppqTurnaroundDays: 1, writingDays: 0 }),
      ).toBe("The notice says 10 days. After 1 day for past-performance forms, you have 9.");
    });

    it("keeps the short sentence when there is nothing to take off", () => {
      expect(
        tight({ responseDue: "2026-08-08T12:00:00Z", ppqTurnaroundDays: 0, writingDays: 0 }),
      ).toBe("The notice says 10 days. You have 10.");
    });

    it("takes the words from the same rows that make the number", () => {
      const d = computeRealDeadline(
        inputs({ bondingLeadDays: 0, subQuoteDays: 0, responseDue: "2026-08-04T12:00:00Z" }),
        NOW,
      );
      const sentence = flat(d.sentence);
      for (const row of d.deductions) expect(sentence).toContain(`${row.days}`);
      expect(d.deductions.map((r) => r.phrase)).toEqual(["past-performance forms", "writing"]);
    });
  });
});

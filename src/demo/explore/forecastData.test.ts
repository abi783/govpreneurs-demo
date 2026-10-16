import { describe, expect, it } from "vitest";
import { OTHER_FIRMS } from "./firms";
import { FORECAST_RECORDS, SCORED_ROWS, FORECAST_MEMBER } from "./forecastData";
import { FORT_BRAGG_FORECAST_KEY } from "./forecastLocalSeeds";
import { buildForecastTake } from "./forecastTakes";
import { cardTakeLine, forecastGrantReply } from "./forecastChat";

const BAD_WORDS = /\broof(ing|er|s)?\b|\bMarcus\b|Williams Construction|\b238160\b|Amira's Kitchen|Diana Potts|HigherGov|\bDEMO-[A-Z]+-\d+/i;
const REAL_FIRMS = /sodexo|aramark|compass group|eurest/i;

describe("the demo forecasts", () => {
  it("holds 48 forecasts with unique keys, and the id is the key", () => {
    expect(FORECAST_RECORDS).toHaveLength(48);
    expect(new Set(FORECAST_RECORDS.map((r) => r.oppKey)).size).toBe(48);
    for (const r of FORECAST_RECORDS) expect(r.id).toBe(r.oppKey);
  });

  it("counts every date from today", () => {
    const today = new Date().toISOString().slice(0, 10);
    const fort = FORECAST_RECORDS.find((r) => r.oppKey === FORT_BRAGG_FORECAST_KEY);
    expect(fort?.dueOn && fort.dueOn > today).toBe(true);
    for (const r of FORECAST_RECORDS) {
      if (r.postedOn) expect(r.postedOn <= today).toBe(true);
    }
  });

  it("gives Amira's facts to the rules", () => {
    expect(FORECAST_MEMBER.naics).toContain("722310");
    expect(FORECAST_MEMBER.states).toEqual(["NC", "VA", "SC"]);
    expect(FORECAST_MEMBER.certs).toEqual(["wosb"]);
    expect(FORECAST_MEMBER.biggestPastJob).toBe(340_000);
  });

  it("puts the Fort Bragg dining forecast on For you as a team bid", () => {
    const row = SCORED_ROWS.find((r) => r.record.oppKey === FORT_BRAGG_FORECAST_KEY);
    expect(row?.match?.tier).toBe("priority");
    expect(row?.scored.partnerRoute).toBe(true);
    expect(row?.scored.reasons.some((x) => /bigger than your biggest past job/i.test(x.text))).toBe(true);
  });

  it("never rates work above five times her largest job as a good fit", () => {
    for (const row of SCORED_ROWS) {
      const high = row.record.valHigh ?? 0;
      if (high > 5 * 340_000 && row.record.oppKey !== FORT_BRAGG_FORECAST_KEY) {
        expect(["stretch", "low"]).toContain(row.match?.tier ?? "low");
      }
    }
  });

  it("has a take for every forecast, with all six facts", () => {
    for (const r of FORECAST_RECORDS) {
      const take = buildForecastTake(r.oppKey);
      expect(take?.noticeType).toBe("forecast");
      expect(Object.keys(take?.counted ?? {}).sort()).toEqual(
        ["buyer", "comparableAwards", "fieldSize", "marketWinners", "subUse", "upcoming"].sort(),
      );
    }
    expect(buildForecastTake("not-a-forecast")).toBeNull();
  });

  it("names only made-up firms in Grant's take", () => {
    const take = buildForecastTake(FORT_BRAGG_FORECAST_KEY);
    const winners = take?.counted.marketWinners;
    expect(winners?.state).toBe("counted");
    const names =
      winners?.state === "counted" ? (winners.source.provenance.tally?.firms ?? []).map((f) => f.name) : [];
    expect(names[0]).toBe("Carolina Dining Group");
    for (const n of names) {
      expect(n).not.toMatch(REAL_FIRMS);
    }
    expect(OTHER_FIRMS.every((f) => !REAL_FIRMS.test(f.name))).toBe(true);
  });

  it("keeps card lines short and free of old-member words", () => {
    for (const r of FORECAST_RECORDS) {
      const line = cardTakeLine(r.oppKey);
      if (line) {
        expect(line.length).toBeLessThanOrEqual(240);
        expect(line).not.toMatch(BAD_WORDS);
      }
      expect(`${r.hgTitle} ${r.hgText} ${r.hunter.plainTitle}`).not.toMatch(BAD_WORDS);
    }
  });

  it("answers any question, with a way forward when it does not know", () => {
    for (const q of ["when?", "can I bid as a woman-owned business", "is it the right size", "where is it", "should I team up", "what do I do first", "random words"]) {
      const reply = forecastGrantReply(FORT_BRAGG_FORECAST_KEY, q);
      expect(reply.length).toBeGreaterThan(20);
      expect(reply).not.toMatch(/undefined|NaN|deadline/i);
    }
    expect(forecastGrantReply(FORT_BRAGG_FORECAST_KEY, "blah")).toContain("Try one of these");
  });
});

// The Forecasts engine is where every claim on the page comes from, so this covers the
// rules a member could be misled by: the clock, the fit, who may bid, and what is held
// back. Each assertion names the PRD section it holds the prototype to.

import { describe, expect, it } from "vitest";
import { HIGHERGOV_FORECASTS } from "./__fixtures__/forecastRecords";
import { FORECAST_FACTS } from "./__fixtures__/facts";
import { DEMO_FIRM, SCORED_FORECASTS, findForecast, scoreRecorded } from "./__fixtures__/scored";
import {
  FORECASTS_TODAY,
  NO_PUBLIC_RECORDS,
  captureStatus,
  allForecasts,
  forYouForecasts,
  isUndecidedSetAside,
  rankedForecasts,
  scoreForecast,
  statusCounts,
} from "./engine";

const get = (id: string) => {
  const f = findForecast(id);
  if (!f) throw new Error(`missing ${id}`);
  return f;
};

describe("fixture", () => {
  it("holds 20 federal and 20 local records, each with Hunter's reading", () => {
    expect(HIGHERGOV_FORECASTS).toHaveLength(40);
    expect(HIGHERGOV_FORECASTS.filter((r) => r.lane === "federal")).toHaveLength(20);
    expect(HIGHERGOV_FORECASTS.filter((r) => r.lane === "sled")).toHaveLength(20);
    const ids = HIGHERGOV_FORECASTS.map((r) => r.id).sort();
    expect(Object.keys(FORECAST_FACTS).sort()).toEqual(ids);
  });

  it("reads no prior award, buyer page or document unless one is passed in", () => {
    const record = HIGHERGOV_FORECASTS.find((r) => r.id === "fed-boxed-meals-charlotte")!;
    const bare = scoreForecast(
      record,
      DEMO_FIRM,
      FORECASTS_TODAY,
      FORECAST_FACTS[record.id],
      NO_PUBLIC_RECORDS,
    );
    expect(bare.priorAward).toBeNull();
    expect(bare.buyer).toBeNull();
    expect(bare.document).toBeNull();
    expect(bare.steps.some((s) => s.kind === "last_contract" || s.kind === "meeting")).toBe(false);
  });

  it("counts every runway from the one clock (D-B7)", () => {
    expect(FORECASTS_TODAY).toBe("2026-09-16");
  });
});

describe("capture status — the clock only (§11.1)", () => {
  it("uses the 45 / 120 / 365 day bands", () => {
    expect(captureStatus(0)).toBe("act_now");
    expect(captureStatus(45)).toBe("act_now");
    expect(captureStatus(46)).toBe("start_capture");
    expect(captureStatus(120)).toBe("start_capture");
    expect(captureStatus(121)).toBe("position_early");
    expect(captureStatus(365)).toBe("position_early");
    expect(captureStatus(366)).toBe("watch");
    expect(captureStatus(null)).toBe("watch");
  });

  it("renders a first-of-month date as a month and counts from its middle", () => {
    const f = get("fed-boxed-meals-amarillo");
    expect(f.timing.label).toBe("Around June 2027");
    expect(f.timing.runwayDays).toBe(272);
    expect(f.status).toBe("position_early");
  });

  it("counts Charlotte to the likely bid window, not the day work starts (v4 decision 7)", () => {
    const f = get("fed-boxed-meals-charlotte");
    expect(f.record.dueOn).toBe("2027-05-01");
    expect(f.timing.label).toBe("February to April 2027");
    expect(f.timing.ourRead).toBe(true);
    expect(f.timing.note).toContain("1 May 2027");
    expect(f.timing.runwayDays).toBe(182);
    expect(f.status).toBe("position_early");
  });

  it("renders a federal 1 January date as its fiscal quarter, never as the 1st", () => {
    const f = get("fed-usmma-food-services");
    expect(f.timing.label).toBe("Around Q2 FY2027");
    expect(f.timing.precision).toBe("quarter");
    for (const x of SCORED_FORECASTS)
      expect(x.timing.label).not.toMatch(/^(Around )?1 (January|April|July|October)/);
  });

  it("trusts the buyer's words over HigherGov's date on a local record", () => {
    // HigherGov dates Barnstable 31 August 2027 — the contract start. The agenda says bids go out this fall.
    const f = get("sled-barnstable-school-food");
    expect(f.record.dueOn).toBe("2027-08-31");
    expect(f.timing.label).toBe("This fall (2026)");
    expect(f.status).toBe("act_now");
  });

  it("puts a forecast with no usable date in Watch and says why", () => {
    const f = get("sled-durham-garden-coordinator");
    expect(f.timing.runwayDays).toBeNull();
    expect(f.status).toBe("watch");
    expect(f.timing.note).toContain("September 2027");
  });
});

describe("fit (§2, §5, §9, §10)", () => {
  it("scores Charlotte a good fit with its last contract linked", () => {
    const f = get("fed-boxed-meals-charlotte");
    expect(f.fit).toBe("good");
    expect(f.priorAward?.awardee).toBe("Space Age Engineering");
    expect(f.priorAward?.endOn).toBe("2027-04-30");
    expect(f.firstStep?.kind).toBe("renew");
    expect(f.firstStep?.body).toContain("15 April 2027");
  });

  it("says she cannot bid when the work goes straight to one program", () => {
    const f = get("fed-cg-yard-galley-baltimore");
    expect(f.fit).toBe("cannot_bid");
    expect(f.score).toBeLessThanOrEqual(25);
    expect(f.steps).toHaveLength(0);
  });

  it("caps the wrong kind of work even inside her area", () => {
    const f = get("fed-galley-chiller-yorktown");
    expect(f.inArea).toBe(true);
    expect(f.fit).toBe("weak");
    expect(f.score).toBeLessThanOrEqual(39);
  });

  it("does not cap a mis-coded record whose words match her work (§5, worked example R3)", () => {
    const record = HIGHERGOV_FORECASTS.find((r) => r.id === "fed-galley-barracks-first-district")!;
    const inMassachusetts = scoreRecorded(record, { ...DEMO_FIRM, states: ["MA"] });
    expect(record.naicsCode).toBe("561210");
    expect(inMassachusetts.score).toBeGreaterThan(39);
  });

  it("never lets a local record reach Best fit (§2)", () => {
    for (const f of SCORED_FORECASTS.filter((x) => x.lane === "sled")) {
      expect(f.fit).not.toBe("best");
      if (f.score != null) expect(f.score).toBeLessThanOrEqual(78);
    }
  });

  it("routes a set-aside she does not hold to a partner instead of capping it (§5)", () => {
    // The buyer's own record says 8(a) and not competed, so it is an 8(a) sole source.
    const f = get("fed-galley-hvac-barbers-point");
    expect(f.record.setAsideCode).toBe("8A");
    expect(f.partnerRoute).toBe(true);
    expect(f.whoMayBid.term).toBe("Set-aside: 8(a) sole source");
  });

  it("leads with a partner when the job is far bigger than her past work", () => {
    const f = get("fed-food-service-training-norfolk");
    expect(f.fit).toBe("possible");
    expect(f.firstStep?.kind).toBe("partner");
  });

  it("never describes an undecided set-aside as open (§10)", () => {
    for (const f of SCORED_FORECASTS) {
      expect(f.whoMayBid.text.toLowerCase()).not.toMatch(/\bopen to (all|anyone)\b/);
      // An undecided code stays undecided unless the buyer's own record or the last
      // contract says more.
      if (f.record.setAsideCode === "TBD" && !f.buyer && !f.whoMayBid.ourRead)
        expect(f.whoMayBid.text).toBe("Not decided yet");
    }
  });

  it("creates no readiness task from a low-confidence forecast (§11.1)", () => {
    const f = get("fed-army-food-service-order");
    expect(f.confidence).toBe("low");
    expect(f.steps.find((s) => s.kind === "renew")).toBeUndefined();
  });

  it("asks her to engage a local buyer only with a named public meeting (§11.1)", () => {
    const f = get("sled-durham-garden-coordinator");
    expect(f.firstStep?.kind).toBe("meeting");
    expect(f.firstStep?.title).toContain("17 September 2026");
    for (const x of SCORED_FORECASTS.filter((s) => s.lane === "sled")) {
      expect(x.steps.find((s) => s.kind === "renew")).toBeUndefined();
    }
  });
});

describe("the list", () => {
  it("publishes no fit for a local record too thin to judge (§8)", () => {
    const f = get("sled-mecklenburg-jail-north");
    expect(f.published).toBe(false);
    expect(f.fit).toBeNull();
    expect(f.score).toBeNull();
    expect(f.heldBack).toBe("thin");
  });

  it("holds back local records too thin to judge (§8) and local work in other states (§9)", () => {
    expect(get("sled-mecklenburg-jail-north").heldBack).toBe("thin");
    expect(get("sled-barnstable-school-food").heldBack).toBe("other_state");
    expect(rankedForecasts(SCORED_FORECASTS).some((f) => f.heldBack != null)).toBe(false);
  });

  it("puts in Forecasts for you only open forecasts Hunter picked, and every record in All", () => {
    const forYou = forYouForecasts(SCORED_FORECASTS);
    expect(forYou.length).toBeGreaterThan(0);
    for (const f of forYou) {
      expect(f.lifecycle).toBe("open");
      expect(f.heldBack).toBeNull();
      expect(["best", "good", "possible"]).toContain(f.fit);
    }
    expect(forYou[0].id).toBe("fed-boxed-meals-charlotte");
    expect(allForecasts(SCORED_FORECASTS)).toHaveLength(SCORED_FORECASTS.length);
  });

  it("ranks federal work anywhere and local work in her states, best fit first", () => {
    const ranked = rankedForecasts(SCORED_FORECASTS);
    expect(ranked).toHaveLength(23);
    expect(ranked.filter((f) => f.lane === "sled").every((f) => f.inArea)).toBe(true);
    expect(ranked[0].id).toBe("fed-boxed-meals-charlotte");
    expect(ranked[ranked.length - 1].fit).toBe("cannot_bid");
    // A placeholder date (1 October 2026) counts to the middle of its fiscal year,
    // so one forecast moves from start capture to position early.
    expect(statusCounts(ranked)).toEqual({
      act_now: 3,
      start_capture: 5,
      position_early: 10,
      watch: 5,
    });
  });

  it("keeps closed and stale forecasts out of the four tabs", () => {
    expect(get("sled-nye-county-jail-meals").lifecycle).toBe("closed");
    expect(get("sled-wayne-concessions").lifecycle).toBe("stale");
    const counts = statusCounts([get("sled-nye-county-jail-meals"), get("sled-wayne-concessions")]);
    expect(Object.values(counts).every((n) => n === 0)).toBe(true);
  });

  it("never shows a zero dollar figure (D-A4)", () => {
    for (const f of SCORED_FORECASTS) if (f.value) expect(f.value).not.toMatch(/\$0\b/);
  });
});

describe("a program set-aside she does not hold names its program", () => {
  it("carries the program's short name, so the path tiles can say which certificate", () => {
    const program = SCORED_FORECASTS.filter((f) =>
      ["program", "program_one"].includes(f.whoMayBid.kind),
    );
    expect(program.length).toBeGreaterThan(0);
    for (const f of program) expect(f.whoMayBid.program).toMatch(/\S/);
  });
});

describe("isUndecidedSetAside", () => {
  it("reads null, blank and TBD in any case or padding as undecided", () => {
    for (const v of [null, undefined, "", "   ", "TBD", "tbd", " Tbd "]) {
      expect(isUndecidedSetAside(v)).toBe(true);
    }
  });

  it("reads a real code as decided", () => {
    for (const v of ["SBA", "8A", " 8an ", "TBDX", "XYZ"]) {
      expect(isUndecidedSetAside(v)).toBe(false);
    }
  });
});

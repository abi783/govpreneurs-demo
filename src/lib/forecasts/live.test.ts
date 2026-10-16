// Live forecasts: a record from GET /forecasts, read for the signed-in member.

import { describe, expect, it } from "vitest";
import { FORECASTS_TODAY } from "./engine";
import { firmFromMember, scoreLive } from "./live";
import { HIGHERGOV_FORECASTS } from "./__fixtures__/forecastRecords";
import type { ForecastMemberDto, ForecastRecordDto } from "../forecastsApi";

const ATLANTA = HIGHERGOV_FORECASTS.find((r) => r.id === "fed-detainee-meals-atlanta")!;

function record(overrides: Partial<ForecastRecordDto> = {}): ForecastRecordDto {
  return {
    ...ATLANTA,
    // A live record's id is its HigherGov key, so no recorded buyer page or contract
    // (looked up by the recorded ids) ever attaches to it.
    id: ATLANTA.oppKey,
    hunter: {
      plainTitle: "Boxed meals at the immigration office, Atlanta",
      semanticFit: 0.85,
      categoryFit: null,
    },
    ...overrides,
  };
}

function member(overrides: Partial<ForecastMemberDto> = {}): ForecastMemberDto {
  return {
    naics: ["722310"],
    states: ["GA"],
    certs: [],
    certsKnown: true,
    isSmall: true,
    registration: { status: "active", endsOn: "2028-01-31" },
    biggestPastJob: 3_000_000,
    smallestTarget: null,
    businessName: "Peach State Meals LLC",
    address: "1 Peachtree St, Atlanta, GA 30303",
    ...overrides,
  };
}

describe("the test clock", () => {
  it("is pinned to the day the recorded forecasts were pulled", () => {
    expect(FORECASTS_TODAY).toBe("2026-09-16");
  });
});

describe("scoreLive", () => {
  it("uses Hunter's plain title, and the buyer's title when there is none", () => {
    const firm = firmFromMember(member());
    expect(scoreLive(record(), firm).facts.title).toBe(
      "Boxed meals at the immigration office, Atlanta",
    );
    expect(
      scoreLive(
        record({ hunter: { plainTitle: null, semanticFit: 0.85, categoryFit: null } }),
        firm,
      ).facts.title,
    ).toBe("Detainee Meals");
  });

  it("reads a strong match as the member's kind of work, in a state they serve", () => {
    const f = scoreLive(record(), firmFromMember(member()));
    expect(f.facts.work).toBe("The kind of work you do");
    expect(f.inArea).toBe(true);
    expect(f.facts.why).toContain("The kind of work you do.");
    expect(f.facts.why).toContain("In a state you serve.");
  });

  it("reads a coded forecast with no match as outside the member's trades", () => {
    // The matching engine skipped it: its code is outside her own and allied trades.
    const f = scoreLive(
      record({ hunter: { plainTitle: null, semanticFit: null, categoryFit: null } }),
      firmFromMember(member({ naics: ["541511"] })),
    );
    expect(f.facts.scopeFit).toBe(0);
    expect(f.facts.work).toBe("Not your kind of work");
  });

  it("stays neutral on work fit when the member has no industry codes", () => {
    const f = scoreLive(
      record({ hunter: { plainTitle: null, semanticFit: null, categoryFit: null } }),
      firmFromMember(member({ naics: [] })),
    );
    expect(f.facts.scopeFit).toBe(0.5);
  });

  it("never says 'not your kind of work' when the engine counts the work as fitting", () => {
    // No description to read, and exactly her industry code: the engine counts it as fitting.
    const f = scoreLive(
      record({ hgText: null, hunter: { plainTitle: null, semanticFit: 0.3, categoryFit: null } }),
      firmFromMember(member()),
    );
    const work = f.reasons.find((x) => x.text === f.facts.work);
    expect(work?.ok).toBe(true);
    expect(f.facts.work).not.toBe("Not your kind of work");
  });

  it("reads a forecast with no code and no match at the taxonomy's no-code value", () => {
    // The matching engine skips forecasts with no code, so most have no match row.
    const f = scoreLive(
      record({
        naicsCode: null,
        hgText: null,
        popState: null,
        popCity: null,
        setAsideCode: "SBA",
        hunter: { plainTitle: null, semanticFit: null, categoryFit: null },
      }),
      firmFromMember(member()),
    );
    expect(f.facts.codeFit).toBe(0.2);
    expect(f.fit).toBe("weak");
  });

  it("does not pick a forecast with no code and nothing to read, even one kept for small businesses", () => {
    // Seen on live data: 91 such forecasts read "Possible fit" under the prototype's
    // neutral no-code fit. The taxonomy scores no code at 0.2, and so does the page.
    const f = scoreLive(
      record({
        naicsCode: null,
        hgText: null,
        popState: null,
        popCity: null,
        setAsideCode: "SBA",
        hunter: { plainTitle: null, semanticFit: null, categoryFit: 0.2 },
      }),
      firmFromMember(member()),
    );
    expect(f.fit).toBe("weak");
  });

  it("reads the taxonomy's code fit, not the code prefix, for the kind of work", () => {
    // Same three-digit prefix as her code, but the taxonomy says outside.
    const f = scoreLive(
      record({
        naicsCode: "722511",
        hunter: { plainTitle: null, semanticFit: 0.1, categoryFit: 0 },
      }),
      firmFromMember(member()),
    );
    expect(f.fit).toBe("weak");
    expect(f.facts.work).toBe("Not your kind of work");
  });

  it("names the kind of public record a local forecast came from", () => {
    const local = { ...record(), lane: "sled" as const, oppType: "Agendas / Minutes" };
    expect(scoreLive(local, firmFromMember(member())).foundIn).toBe(
      "A public meeting's agenda or minutes",
    );
  });

  it("says 'But' before the first thing against, keeping a state's capital", () => {
    const f = scoreLive(record(), firmFromMember(member({ states: ["NC"] })));
    expect(f.facts.why).toContain("But Georgia is outside your area.");
  });

  it("never calls a place outside the area when the member's states are not on record", () => {
    const f = scoreLive(record(), firmFromMember(member({ states: [] })));
    expect(f.statesKnown).toBe(false);
    expect(f.reasons.some((x) => /outside/.test(x.text))).toBe(false);
  });

  it("waits on certificates the member has not given, never 'not held'", () => {
    const f = scoreLive(
      record({ setAsideCode: "WOSB" }),
      firmFromMember(member({ certs: [], certsKnown: false })),
    );
    expect(f.whoMayBid.kind).toBe("program_unknown");
  });

  it("reads no registration as a gap with a step to fix it", () => {
    const f = scoreLive(
      record({ setAsideCode: "TBD" }),
      firmFromMember(member({ registration: { status: "not_registered", endsOn: null } })),
    );
    expect(f.registration.gap).toBe("not_registered");
    expect(f.steps.some((s) => s.kind === "register")).toBe(true);
  });
});

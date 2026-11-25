import { describe, expect, it } from "vitest";
import { awardFiltersToRequest } from "../awardsApi";
import type { PrimeCandidate } from "../partnersApi";
import {
  DEFAULT_AWARD_FILTERS,
  NO_AWARD_FILTERS,
  SIZE_PRESETS,
  awardChips,
  readAwardFilters,
  type AwardFilters,
} from "./awardFilters";
import {
  NO_PARTNER_FILTERS,
  PARTNER_SIZE_PRESETS,
  partnerChips,
  passesPartnerFilters,
  readPartnerFilters,
  type PartnerFilters,
} from "./partnerFilters";
import {
  ANY_RANGE,
  NEXT_PRESETS,
  PAST_PRESETS,
  inRange,
  rangeFrom,
  rangeWords,
  readRange,
  shortUsd,
  toDays,
} from "./range";
import { MAX_LIST, readStrings } from "./read";
import {
  CERT_CHOICES,
  SET_ASIDE_CHOICES,
  certChoice,
  certIds,
  setAsideChoice,
  setAsideCode,
  whoCouldBid,
} from "./smallBusinessPrograms";
import { ALL_STATES, readStates, statesText } from "./states";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

describe("open ranges", () => {
  it("an unknown value never satisfies a range that is on (D-C4)", () => {
    expect(inRange(null, { min: 1, max: null, unit: "days" }, "count")).toBe(false);
    expect(inRange(null, ANY_RANGE, "count")).toBe(true);
  });

  it("0 to 60 days means 0 to 60 days, both ends included", () => {
    const r = { min: 0, max: 60, unit: "days" as const };
    expect(inRange(0, r, "time")).toBe(true);
    expect(inRange(60, r, "time")).toBe(true);
    expect(inRange(61, r, "time")).toBe(false);
  });

  it("months and years are compared in days, with one day count for both pages", () => {
    expect(inRange(toDays(12, "months"), { min: 0, max: 12, unit: "months" }, "time")).toBe(true);
    expect(inRange(400, { min: 0, max: 1, unit: "years" }, "time")).toBe(false);
    expect(toDays(12, "months")).toBe(365);
  });

  it("reads 250k and 1.5m, and swaps bounds typed the wrong way round", () => {
    expect(rangeFrom("1.5m", "250k", "money", "days")).toEqual({
      min: 250_000,
      max: 1_500_000,
      unit: "days",
    });
  });

  it("0 with no top is no range", () => {
    expect(rangeFrom("0", "", "time", "days")).toEqual(ANY_RANGE);
    expect(readRange({ min: 0, max: null, unit: "days" })).toEqual(ANY_RANGE);
  });

  it("says a range back in words", () => {
    expect(rangeWords({ min: 0, max: 60, unit: "days" }, "time", "ago")).toBe(
      "in the last 60 days",
    );
    expect(rangeWords({ min: 0, max: 6, unit: "months" }, "time", "ahead")).toBe(
      "in the next 6 months",
    );
    expect(rangeWords({ min: 1, max: 1, unit: "years" }, "time", "ago")).toBe("1 year ago");
    expect(rangeWords({ min: 3, max: null, unit: "months" }, "time", "ago")).toBe(
      "at least 3 months ago",
    );
    expect(rangeWords({ min: 5, max: null, unit: "days" }, "count")).toBe("5 or more");
    expect(shortUsd(999_500)).toBe("$1M");
    expect(shortUsd(250_000)).toBe("$250K");
  });

  it("each money shortcut says the same words as its chip", () => {
    for (const p of [...SIZE_PRESETS, ...PARTNER_SIZE_PRESETS]) {
      expect(cap(rangeWords(p.range, "money"))).toBe(p.label);
    }
  });

  it("both pages share the date shortcuts", () => {
    expect(PAST_PRESETS.map((p) => p.label)).toEqual([
      "Last 90 days",
      "Last 6 months",
      "Last 12 months",
      "Last 2 years",
    ]);
    expect(NEXT_PRESETS.map((p) => p.label)).toEqual([
      "Next 90 days",
      "Next 6 months",
      "Next 12 months",
      "Next 2 years",
    ]);
  });

  it("a URL range with an unknown unit is no range, and reversed bounds are swapped", () => {
    expect(readRange({ min: 6, max: null, unit: "weeks" })).toEqual(ANY_RANGE);
    expect(readRange({ min: 5_000_000, max: 1_000_000 })).toEqual({
      min: 1_000_000,
      max: 5_000_000,
      unit: "days",
    });
  });
});

describe("states and URL lists", () => {
  it("lists all 50 states, DC and the five territories", () => {
    expect(ALL_STATES).toHaveLength(56);
  });

  it("reads state codes in any case, and drops what is not a state", () => {
    expect(readStates(["nc", " va ", "XX", 4])).toEqual(["NC", "VA"]);
  });

  it("names 1 or 2 states, codes for 3 or 4, then a count", () => {
    expect(statesText(["GA"])).toBe("Georgia");
    expect(statesText(["GA", "VA"])).toBe("Georgia, Virginia");
    expect(statesText(["NC", "SC", "VA"])).toBe("NC, SC, VA");
    expect(statesText(["NC", "SC", "VA", "GA", "TN"])).toBe("5 states");
  });

  it("drops empty and long strings, and caps a list", () => {
    expect(readStrings(["", "  ", "a".repeat(101), "Navy", "Navy"])).toEqual(["Navy"]);
    expect(readStrings(Array.from({ length: 500 }, (_, i) => `x${i}`))).toHaveLength(MAX_LIST);
  });
});

describe("set-asides and certifications", () => {
  // Every set-aside value seen in a production sample of 100,000 awards (19 Nov 2026).
  const PRODUCTION = [
    "Small Business Set Aside - Total (SBA)",
    "Service Disabled Veteran Owned Small Business Set-Aside (SDVOSBC)",
    "8(A) Sole Source  (8AN)",
    "Hubzone Set-Aside (HZC)",
    "8(A) Competed (8A)",
    "Small Business Set Aside - Partial (SBP)",
    "Women Owned Small Business (WOSB)",
    "Indian Small Business Economic Enterprise (ISBEE)",
    "SDVOSB Sole Source (SDVOSBS)",
    "Emerging Small Business Set Aside (ESB)",
    "Reserved For Small Business (RSB)",
    "Women Owned Small Business Sole Source (WOSBSS)",
    "Economically Disadvantaged Women Owned Small Business (EDWOSB)",
    "Veteran Set Aside (VSA)",
    "Buy Indian  (BI)",
    "Hubzone Sole Source  (HZS)",
    "8(A) With Hub Zone Preference (HS3)",
    "Indian Economic Enterprise (IEE)",
    "Very Small Business (VSB)",
  ];

  it("every production set-aside code is in a choice", () => {
    const codes = new Set(SET_ASIDE_CHOICES.flatMap((c) => c.codes));
    for (const v of PRODUCTION) expect(codes.has(setAsideCode(v))).toBe(true);
    expect(setAsideChoice(null).id).toBe("open");
  });

  it("every certification type maps to exactly one choice", () => {
    const seen = new Map<string, string>();
    for (const c of CERT_CHOICES) {
      for (const t of c.types) {
        expect(seen.has(t.toLowerCase())).toBe(false);
        seen.set(t.toLowerCase(), c.id);
        expect(certChoice(t)?.id).toBe(c.id);
      }
    }
    expect(certIds(["For Profit Organization", "HUBZone", "HUBZone"])).toEqual(["hubzone"]);
  });

  it("says who could bid, and never 'any firm' for an award with no competition", () => {
    expect(whoCouldBid(null, "Not Competed").value).toBe("One firm, chosen by the buyer");
    expect(whoCouldBid(null, "Full and Open Competition").value).toBe("Any firm");
    expect(whoCouldBid("Small Business Set Aside - Partial (SBP)").value).toBe(
      "Small firms only, for part of the job",
    );
    expect(whoCouldBid("Women Owned Small Business (WOSB)").term).toBe("WOSB");
  });
});

/** For every chip: removing it removes that chip, and every other chip stays. */
function checkChips<F>(f: F, chips: (f: F) => { key: string; remove: (f: F) => F }[]) {
  const all = chips(f);
  expect(all.length).toBeGreaterThan(0);
  for (const c of all) {
    const left = chips(c.remove(f)).map((x) => x.key);
    expect(left).not.toContain(c.key);
    for (const other of all) if (other.key !== c.key) expect(left).toContain(other.key);
  }
}

describe("Awards filters", () => {
  it("with nothing in the URL there is nothing to read", () => {
    expect(readAwardFilters(undefined)).toBeUndefined();
  });

  it("a bad link never throws, and keeps the good values", () => {
    const f = readAwardFilters({
      who: ["wosb", "nope"],
      states: ["nc"],
      agencies: ["", "Navy"],
      work: 7,
    });
    expect(f?.who).toEqual(["wosb"]);
    expect(f?.states).toEqual(["NC"]);
    expect(f?.agencies).toEqual(["Navy"]);
    // Decision 3: Awards opens with no filters, so a bad value falls back to "any".
    expect(f?.work).toBe("any");
  });

  it("removing a chip turns its filter off and nothing else", () => {
    const f: AwardFilters = {
      ...DEFAULT_AWARD_FILTERS,
      work: "pick",
      naics: ["722310"],
      psc: ["S203"],
      states: ["NC"],
      buyer: "defense",
      agencies: ["Navy"],
      who: ["wosb", "8a"],
      competed: "no",
      bids: { min: 1, max: 3, unit: "days" },
      pricing: ["Firm Fixed Price"],
      size: { min: 500_000, max: null, unit: "days" },
      subPlan: true,
      hasSubs: true,
      awarded: { min: 0, max: 90, unit: "days" },
      ends: { min: 0, max: 6, unit: "months" },
    };
    checkChips(f, (x) => awardChips(x));
  });

  it("chips use plain words, not raw codes", () => {
    const labels = awardChips({
      ...NO_AWARD_FILTERS,
      work: "pick",
      naics: ["722310"],
      psc: ["J041"],
      pricing: ["Firm Fixed Price"],
    }).map((c) => c.label);
    expect(labels).toEqual([
      "Food service",
      "Service: Repair of heating, cooling and refrigeration equipment",
      "Price: Fixed price (one set price)",
    ]);
  });

  it("the request carries the ticked states and turns months into days", () => {
    const { panel } = awardFiltersToRequest({
      ...NO_AWARD_FILTERS,
      states: ["NC", "SC"],
      ends: { min: 0, max: 12, unit: "months" },
    });
    expect(panel?.chooseStates).toEqual(["NC", "SC"]);
    expect(panel?.endsMaxDays).toBe(toDays(12, "months"));
  });
});

/** A minimal company for the filter tests. Only the fields the filters read are set. */
const company = (awardeeKey: number, over: Partial<PrimeCandidate> = {}): PrimeCandidate => ({
  awardeeKey,
  uei: null,
  name: `Company ${awardeeKey}`,
  cageCode: null,
  website: null,
  bench: { distinctSubs: 3, repeatSubs: 1, trend: "steady" },
  trade: { proximity: "direct", naicsCodes: ["722310"] },
  geography: {
    inStateAwardShare: 0.5,
    statesPerformed: ["NC"],
    topCitiesByCount: [],
    hqState: "NC",
  },
  economics: {
    maxAwardUsd: 2_000_000,
    medianAwardUsd: 500_000,
    totalAwardedUsd: 5_000_000,
    awardCount: 10,
    momentum: null,
    recompeteMonthsOut: 8,
    numberOfOffersAvg: null,
    lastAwardAt: "2026-06-01",
  },
  tier: "good",
  verdict: "partner_play",
  score: 50,
  scoreBreakdown: {},
  reasons: [],
  flags: [],
  asOf: "2026-11-01",
  whyAboveNext: null,
  ...over,
});

describe("Find partners filters", () => {
  const partners: PrimeCandidate[] = [
    company(1, {
      certifications: ["8(a) Active", "Woman Owned Small Business"],
      sbaCertified: ["8(a) Active"],
    }),
    company(2, {
      certifications: ["Certified Women-Owned Small Business"],
      sbaCertified: ["Certified Women-Owned Small Business"],
    }),
    // Claims WOSB but the SBA has not checked it, so "checked only" drops it.
    company(3, {
      certifications: ["Woman Owned Small Business", "HUBZone"],
      sbaCertified: ["HUBZone"],
    }),
    company(4, { certifications: [] }),
    company(5, {
      certifications: ["Service Disabled Veteran Owned Small Business"],
      sbaCertified: ["Service Disabled Veteran Owned Small Business"],
      runsMentorProgram: true,
    }),
  ];

  it("every company passes when nothing is on", () => {
    expect(partners.every((p) => passesPartnerFilters(p, NO_PARTNER_FILTERS))).toBe(true);
  });

  it("each certification keeps exactly the companies that hold it", () => {
    for (const c of CERT_CHOICES) {
      const kept = partners.filter((p) =>
        passesPartnerFilters(p, { ...NO_PARTNER_FILTERS, certs: [c.id] }),
      );
      expect(kept.every((p) => certIds(p.certifications).includes(c.id))).toBe(true);
      expect(kept.length).toBe(
        partners.filter((p) => certIds(p.certifications).includes(c.id)).length,
      );
    }
  });

  it("a company with no buyers on file is kept by the military choices (prod AF-12)", () => {
    const unknown = { ...partners[0], buyers: undefined, recentJobs: undefined };
    for (const buyerKind of ["defense", "civilian"] as const) {
      expect(passesPartnerFilters(unknown, { ...NO_PARTNER_FILTERS, buyerKind })).toBe(true);
    }
  });

  it("the stored buyer kinds decide Military and Non-military, even when the kept buyers are all one kind", () => {
    const co = { ...partners[0], recentJobs: undefined, buyers: [{ name: "GSA", jobs: 3 }] };
    const both = { ...co, buyerKinds: ["defense", "civilian"] as ("defense" | "civilian")[] };
    const civ = { ...co, buyerKinds: ["civilian"] as ("defense" | "civilian")[] };
    const mil = { ...NO_PARTNER_FILTERS, buyerKind: "defense" as const };
    const non = { ...NO_PARTNER_FILTERS, buyerKind: "civilian" as const };
    expect(passesPartnerFilters(both, mil)).toBe(true);
    expect(passesPartnerFilters(both, non)).toBe(true);
    expect(passesPartnerFilters(civ, mil)).toBe(false);
    expect(passesPartnerFilters(civ, non)).toBe(true);
  });

  it("the trades choice keeps only companies that hire that trade", () => {
    const hires = { ...partners[0], tradesHired: [{ naics: "238160", name: "Roofing", firms: 2 }] };
    const none = { ...partners[0], tradesHired: [] };
    const f = { ...NO_PARTNER_FILTERS, trades: ["238160"] };
    expect(passesPartnerFilters(hires, f)).toBe(true);
    expect(passesPartnerFilters(none, f)).toBe(false);
  });

  it("removing a chip turns its filter off and nothing else", () => {
    const f: PartnerFilters = {
      ...NO_PARTNER_FILTERS,
      match: "exact",
      kinds: ["competitor"],
      workTypes: ["722310"],
      states: ["NC"],
      buyerKind: "defense",
      buyers: ["Navy"],
      firms: { min: 5, max: null, unit: "days" },
      repeat: { min: 1, max: null, unit: "days" },
      trades: ["561710"],
      trend: ["growing"],
      mentor: true,
      size: { min: 250_000, max: 1_000_000, unit: "days" },
      lastWon: { min: 0, max: 6, unit: "months" },
      jobs: { min: 2, max: null, unit: "days" },
      nextEnds: { min: 0, max: 12, unit: "months" },
      certs: ["wosb"],
      certifiedOnly: true,
      showHidden: true,
    };
    checkChips(f, (x) => partnerChips(x));
  });

  it("SBA-certified only keeps the companies whose picked certification the SBA checked", () => {
    const on = (certs: string[]) =>
      partners.filter((p) =>
        passesPartnerFilters(p, { ...NO_PARTNER_FILTERS, certs, certifiedOnly: true }),
      );
    const off = (certs: string[]) =>
      partners.filter((p) => passesPartnerFilters(p, { ...NO_PARTNER_FILTERS, certs }));
    // Any SBA-checked type passes when no certification is picked.
    expect(on([]).every((p) => (p.sbaCertified ?? []).length > 0)).toBe(true);
    expect(on([]).length).toBeGreaterThan(0);
    // The switch never adds companies; for WOSB it drops the ones that only claim it.
    for (const c of ["8a", "wosb", "hubzone", "sdvosb"]) {
      const kept = on([c]);
      expect(kept.every((p) => certIds(p.sbaCertified).includes(c))).toBe(true);
      expect(kept.length).toBeLessThanOrEqual(off([c]).length);
    }
    expect(on(["wosb"]).length).toBeLessThan(off(["wosb"]).length);
  });

  it("SBA-certified only has one chip that turns it off", () => {
    const chips = partnerChips({ ...NO_PARTNER_FILTERS, certifiedOnly: true });
    expect(chips.map((c) => c.label)).toEqual(["Checked certifications only"]);
    expect(chips[0].remove({ ...NO_PARTNER_FILTERS, certifiedOnly: true })).toEqual(
      NO_PARTNER_FILTERS,
    );
  });

  it("chip words match the controls", () => {
    const labels = partnerChips({
      ...NO_PARTNER_FILTERS,
      match: "exact",
      size: { min: 250_000, max: 1_000_000, unit: "days" },
    }).map((c) => c.label);
    expect(labels).toEqual(["Same work", "Usual job: $250K to $1M"]);
  });

  it("a bad link never throws, and keeps the good values", () => {
    const f = readPartnerFilters({
      certs: ["wosb", "x"],
      buyers: ["", "Navy"],
      states: ["va"],
      size: { min: 9, unit: "weeks" },
    });
    expect(f.certs).toEqual(["wosb"]);
    expect(f.buyers).toEqual(["Navy"]);
    expect(f.states).toEqual(["VA"]);
    expect(f.size).toEqual(ANY_RANGE);
    expect(f.certifiedOnly).toBe(false);
    expect(readPartnerFilters({ certifiedOnly: true }).certifiedOnly).toBe(true);
    expect(readPartnerFilters({ certifiedOnly: "yes" }).certifiedOnly).toBe(false);
    expect(readPartnerFilters("junk")).toEqual(NO_PARTNER_FILTERS);
  });
});

import { describe, expect, it } from "vitest";
import { matchAward, matchPartner, searchTerms } from "./match";
import type { AwardRecord } from "../awardsApi";
import type { PrimeCandidate } from "../partnersApi";

const partner = (over: Partial<PrimeCandidate> = {}) =>
  ({
    name: "Blue Ridge Mechanical LLC",
    trade: { proximity: "direct", naicsCodes: ["238220"] },
    geography: {
      statesPerformed: ["NC"],
      topCitiesByCount: [],
      inStateAwardShare: null,
      hqState: "NC",
    },
    economics: { awardCount: 3 },
    workTypes: [{ naics: "238220", name: "Plumbing, Heating, and Air-Conditioning Contractors" }],
    ...over,
  }) as unknown as PrimeCandidate;

const award = (over: Partial<AwardRecord> = {}) =>
  ({
    awardId: "a1",
    title: "Boiler replacement, Building 12",
    winner: { name: "Acme Corp", uei: null, awardeeKey: 1, parentUei: null },
    agency: { name: "Department of the Navy", abbrev: "Navy", isDefense: true },
    naicsCode: "238220",
    location: { city: "Norfolk", state: "VA" },
    ...over,
  }) as unknown as AwardRecord;

describe("search matcher", () => {
  it("an empty search matches nothing to explain", () => {
    expect(matchPartner(partner(), "")).toBeNull();
    expect(searchTerms("")).toBeTruthy();
  });

  it("finds a company by its name and says why", () => {
    expect(matchPartner(partner(), "blue ridge")).toMatch(/name/i);
  });

  it("finds a company by an everyday word for its trade (plumbing, heating, air-conditioning)", () => {
    expect(matchPartner(partner(), "plumbing")).not.toBeNull();
  });

  it("does not match a word that appears nowhere", () => {
    expect(matchPartner(partner(), "zzzqqq")).toBeNull();
    expect(matchAward(award(), "zzzqqq")).toBeNull();
  });

  it("finds an award by what was bought, and by the buyer", () => {
    expect(matchAward(award(), "boiler")).not.toBeNull();
    expect(matchAward(award(), "navy")).not.toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import {
  LABEL_GLOSS,
  OPTION_GLOSS,
  SET_ASIDE_GLOSS,
  TERM_GLOSS,
  gloss,
  glossFor,
} from "./filterGlosses";
import { SET_ASIDE_CATEGORIES } from "./setAsideTaxonomy";

/** Labels the opportunity facts grid prints, exactly as the card displays them. */
const GRID_LABELS = [
  "Agency",
  "Estimated Contract Value",
  "Place of Performance",
  "Response Due Date",
  "Proposal Due Date",
  "Notice type",
  "Scope",
];

/**
 * Filter tokens the live feed sends that SET_ASIDE_CATEGORIES does not carry.
 * The taxonomy spells Total Small Business `SBA`; the seeded card LOCAL-FS-0003
 * sends `SB`. Without these keys a real pill renders with no gloss.
 */
const FEED_ONLY_CODES = ["SB", "VOSB", "HUBZone", "MWDBE", "NATIVE_TRIBAL", "FULL_OPEN"];

const TAXONOMY_CODES = [
  ...new Set(SET_ASIDE_CATEGORIES.flatMap((category) => category.codes.map((c) => c.code))),
];

function expectNonEmptyGloss(term: string): void {
  const result = glossFor(term);
  expect(typeof result, `no gloss for "${term}"`).toBe("string");
  expect(result?.trim().length ?? 0, `empty gloss for "${term}"`).toBeGreaterThan(0);
}

describe("glossFor", () => {
  it.each(GRID_LABELS)("resolves the grid label %s", (label) => {
    expectNonEmptyGloss(label);
  });

  it("resolves the normalized Full and Open label", () => {
    expectNonEmptyGloss("Full and Open Competition");
  });

  it.each(TAXONOMY_CODES)("resolves the taxonomy set-aside code %s", (code) => {
    expectNonEmptyGloss(code);
  });

  it.each(FEED_ONLY_CODES)("resolves the live-feed set-aside token %s", (code) => {
    expectNonEmptyGloss(code);
  });

  it("resolves a raw Full and Open value through setAsideDisplayLabel", () => {
    expectNonEmptyGloss("Full and Open Competition (No Set-Aside)");
    expectNonEmptyGloss("Full & Open");
  });

  it("trims the term before it looks the gloss up", () => {
    expect(glossFor("  SDVOSBC  ")).toBe(SET_ASIDE_GLOSS.SDVOSBC);
  });

  it("keeps set-aside codes case-sensitive, so BICiv stays distinct", () => {
    expect(glossFor("BICiv")).toBe(SET_ASIDE_GLOSS.BICiv);
    expect(glossFor("BICIV")).toBeUndefined();
  });

  it("returns undefined for a term with no gloss", () => {
    expect(glossFor("Not a term")).toBeUndefined();
    expect(glossFor("")).toBeUndefined();
  });
});

describe("the category menu glosses", () => {
  it("hold no opportunity-type entry: the menu has no type filter", () => {
    const keys = Object.keys(OPTION_GLOSS).filter((k) => k.startsWith("categories:"));
    expect(keys).toEqual([]);
    expect(gloss("categories")).toBeUndefined();
  });
});

describe("LABEL_GLOSS", () => {
  it("aliases the TERM_GLOSS sentences instead of copying them", () => {
    expect(LABEL_GLOSS["Place of Performance"]).toBe(TERM_GLOSS.placeOfPerformance);
    expect(LABEL_GLOSS["Estimated Contract Value"]).toBe(TERM_GLOSS.estimatedContractValue);
    expect(LABEL_GLOSS["Response Due Date"]).toBe(TERM_GLOSS.responseDueDate);
    expect(LABEL_GLOSS["Proposal Due Date"]).toBe(TERM_GLOSS.proposalDueDate);
    expect(LABEL_GLOSS["Notice type"]).toBe(TERM_GLOSS.noticeType);
    expect(LABEL_GLOSS["Full and Open Competition"]).toBe(TERM_GLOSS.fullAndOpen);
    expect(LABEL_GLOSS["Fast award"]).toBe(TERM_GLOSS.fastAward);
    expect(LABEL_GLOSS["Expected posting"]).toBe(TERM_GLOSS.forecast);
  });
});

describe("SET_ASIDE_GLOSS", () => {
  it("covers every taxonomy code and every live-feed token", () => {
    const missing = [...TAXONOMY_CODES, ...FEED_ONLY_CODES].filter(
      (code) => !SET_ASIDE_GLOSS[code],
    );
    expect(missing).toEqual([]);
  });

  it("keys on codes, never on display strings", () => {
    expect(SET_ASIDE_GLOSS["Full and Open Competition"]).toBeUndefined();
    expect(SET_ASIDE_GLOSS["Total Small Business Set-Aside"]).toBeUndefined();
  });
});

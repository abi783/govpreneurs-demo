// THE UNIT OF ISSUE GETS ITS FIRST SPEC.
//
// `units.ts` calls itself "the single most expensive mistake in DIBBS": a
// quantity of 500 against a unit of issue of HD is fifty thousand items, and a
// per-each price against it wins the contract at one hundredth of the price she
// meant. The module carries that rule for every card, every order page and both
// safety consumers, and until now no test read it back.
//
// This file is CHARACTERISATION. It records what the module does TODAY, not
// what it ought to do. DH-11 adds nouns for 24 more codes and lands on this net,
// so every sentence and every null here is pinned as it stands.
//
// The three states of `unitBasis()` are the spine:
//   "each"       EA only. The quantity on screen IS the item count.
//   "multiplied" PR, DZ, HD, TH. A documented multiplier above one.
//   "unknown"    everything else. We cannot say what one holds.
import { describe, expect, it } from "vitest";
import {
  isKnownUnit,
  isMultiplied,
  itemsPerIssue,
  quantityLine,
  quantityParts,
  unitBasis,
  unitNoun,
  unitPlural,
  unitWarning,
  unitsTotal,
} from "./units";

/** The five codes whose multiplier the table documents, with that multiplier. */
const DOCUMENTED: ReadonlyArray<readonly [string, number]> = [
  ["EA", 1],
  ["PR", 2],
  ["DZ", 12],
  ["HD", 100],
  ["TH", 1000],
];

/** Codes we can name but hold no multiplier for. They count a container. */
const CONTAINERS = ["BX", "PG", "CN", "RO", "SE", "KT", "CL"] as const;

/** Codes we can name but hold no multiplier for. They measure, they do not count. */
const MEASURES = ["FT", "GL", "LB", "YD"] as const;

/** Codes we can name at all — the sixteen keys of `ISSUE_NOUN`. */
const NAMED = [...DOCUMENTED.map(([code]) => code), ...CONTAINERS, ...MEASURES];

/** A code the table does not hold. The module shows it raw rather than guess. */
const UNRECOGNISED = "XX";

/** The quantity of order mp-006, the record the module's comments measure. */
const MANY = 1138;

describe("itemsPerIssue", () => {
  it("returns the documented multiplier for each of the five documented codes", () => {
    for (const [code, per] of DOCUMENTED) {
      expect(itemsPerIssue(code)).toBe(per);
    }
  });

  it("returns null for a named code whose multiplier is undocumented", () => {
    for (const code of [...CONTAINERS, ...MEASURES]) {
      expect(itemsPerIssue(code)).toBeNull();
    }
  });

  it("returns null for an unrecognised code", () => {
    expect(itemsPerIssue(UNRECOGNISED)).toBeNull();
    expect(itemsPerIssue("ZZZ")).toBeNull();
  });

  it("returns null when the order paper gives no code", () => {
    expect(itemsPerIssue(null)).toBeNull();
    expect(itemsPerIssue("")).toBeNull();
  });
});

describe("unitsTotal", () => {
  it("multiplies the quantity by a documented multiplier", () => {
    expect(unitsTotal(500, "HD")).toBe(50000);
    expect(unitsTotal(500, "EA")).toBe(500);
    expect(unitsTotal(3, "PR")).toBe(6);
    expect(unitsTotal(2, "DZ")).toBe(24);
    expect(unitsTotal(4, "TH")).toBe(4000);
  });

  it("returns null when the multiplier is undocumented", () => {
    for (const code of [...CONTAINERS, ...MEASURES, UNRECOGNISED]) {
      expect(unitsTotal(MANY, code)).toBeNull();
    }
  });

  it("returns null when the order paper does not say how many", () => {
    expect(unitsTotal(null, "HD")).toBeNull();
    expect(unitsTotal(null, null)).toBeNull();
  });

  it("keeps a quantity of zero, which is a number and not an absence", () => {
    expect(unitsTotal(0, "HD")).toBe(0);
  });
});

describe("unitBasis", () => {
  it("says each for EA only", () => {
    expect(unitBasis("EA")).toBe("each");
  });

  it("says multiplied for the four documented multipliers above one", () => {
    for (const code of ["PR", "DZ", "HD", "TH"]) {
      expect(unitBasis(code)).toBe("multiplied");
    }
  });

  it("says unknown for a named code we hold no multiplier for", () => {
    for (const code of [...CONTAINERS, ...MEASURES]) {
      expect(unitBasis(code)).toBe("unknown");
    }
  });

  it("says unknown for an unrecognised code and for no code", () => {
    expect(unitBasis(UNRECOGNISED)).toBe("unknown");
    expect(unitBasis(null)).toBe("unknown");
  });
});

describe("isMultiplied", () => {
  it("is false for EA alone", () => {
    expect(isMultiplied("EA")).toBe(false);
  });

  it("is true for a documented multiplier above one", () => {
    for (const code of ["PR", "DZ", "HD", "TH"]) {
      expect(isMultiplied(code)).toBe(true);
    }
  });

  it("is true for unknown, which is the second yes answer", () => {
    // The unknown state is not a quiet state. Both safety consumers read this
    // helper, so a named container answers as loudly as HD does.
    for (const code of [...CONTAINERS, ...MEASURES, UNRECOGNISED]) {
      expect(isMultiplied(code)).toBe(true);
    }
    expect(isMultiplied(null)).toBe(true);
  });
});

describe("isKnownUnit", () => {
  it("is true for each of the sixteen codes we can name", () => {
    for (const code of NAMED) {
      expect(isKnownUnit(code)).toBe(true);
    }
  });

  it("is false for an unrecognised code and for no code", () => {
    expect(isKnownUnit(UNRECOGNISED)).toBe(false);
    expect(isKnownUnit(null)).toBe(false);
  });
});

describe("quantityLine", () => {
  it("abstains when the order paper does not say how many", () => {
    expect(quantityLine(null, "HD")).toBe("The order paper does not say how many.");
    expect(quantityLine(null, null)).toBe("The order paper does not say how many.");
  });

  it("names what it does not know when no unit reaches it", () => {
    expect(quantityLine(500, null)).toBe("500 — unit not available at source.");
  });

  it("shows an unrecognised code raw rather than guess a noun", () => {
    expect(quantityLine(500, UNRECOGNISED)).toBe("500 — the unit is XX, an unknown code.");
  });

  it("renders the noun alone when the multiplier is undocumented", () => {
    expect(quantityLine(MANY, "PG")).toBe("1,138 packages");
    expect(quantityLine(5, "BX")).toBe("5 boxes");
    expect(quantityLine(12, "FT")).toBe("12 feet");
  });

  it("adds the item total when the multiplier is documented", () => {
    expect(quantityLine(500, "HD")).toBe("500 boxes of 100 — 50,000 items in total");
    expect(quantityLine(3, "PR")).toBe("3 pairs — 6 items in total");
    expect(quantityLine(4, "TH")).toBe("4 packs of 1,000 — 4,000 items in total");
  });

  it("says pieces for EA and adds no total, because the quantity is the total", () => {
    expect(quantityLine(500, "EA")).toBe("500 pieces");
  });

  it("uses the singular noun for a quantity of one", () => {
    expect(quantityLine(1, "EA")).toBe("1 piece");
    expect(quantityLine(1, "BX")).toBe("1 box");
    expect(quantityLine(1, "HD")).toBe("1 box of 100 — 100 items in total");
  });
});

describe("unitWarning", () => {
  it("says the unit is not available at source when no unit reaches it — the unit is not on the paper", () => {
    expect(unitWarning(500, null)).toBe(
      "Unit not available at source. Check how these are counted before you price it.",
    );
  });

  it("stays silent for EA, where the quantity on screen is the item count", () => {
    expect(unitWarning(500, "EA")).toBeNull();
  });

  it("states the multiplier for a documented code — row 1", () => {
    expect(unitWarning(500, "HD")).toBe(
      "One box of 100 holds 100 items. Your price is for the whole box of 100.",
    );
    expect(unitWarning(500, "PR")).toBe(
      "One pair holds 2 items. Your price is for the whole pair.",
    );
    expect(unitWarning(500, "DZ")).toBe(
      "One dozen holds 12 items. Your price is for the whole dozen.",
    );
    expect(unitWarning(500, "TH")).toBe(
      "One pack of 1,000 holds 1,000 items. Your price is for the whole pack of 1,000.",
    );
  });

  it("warns about the hidden count on a container — row 2", () => {
    expect(unitWarning(MANY, "PG")).toBe(
      "Your price is for one package. The source data does not say how many items that is. Check before you price it.",
    );
    for (const code of CONTAINERS) {
      expect(unitWarning(MANY, code)).toContain(
        "The source data does not say how many items that is.",
      );
    }
  });

  it("warns about the whole order on a continuous measure — row 2, second wording", () => {
    expect(unitWarning(MANY, "FT")).toBe(
      "Your price is for one foot, not for the whole order. Check before you price it.",
    );
    for (const code of MEASURES) {
      expect(unitWarning(MANY, code)).toContain("not for the whole order.");
      expect(unitWarning(MANY, code)).not.toContain(
        "The source data does not say how many items that is.",
      );
    }
  });

  it("shows the raw code when it cannot name the unit — row 3", () => {
    expect(unitWarning(500, UNRECOGNISED)).toBe(
      "The unit is XX, an unknown code. Check what one XX holds before you price it.",
    );
  });

  it("reads the same warning whatever the quantity is", () => {
    // The quantity argument is declared and unused. Every caller passes it.
    for (const code of [...NAMED, UNRECOGNISED]) {
      expect(unitWarning(1, code)).toEqual(unitWarning(MANY, code));
    }
    expect(unitWarning(null, "HD")).toEqual(unitWarning(MANY, "HD"));
  });
});

describe("unitNoun", () => {
  it("gives the singular noun for a code we can name", () => {
    expect(unitNoun("EA")).toBe("piece");
    expect(unitNoun("HD")).toBe("box of 100");
    expect(unitNoun("GL")).toBe("gallon");
  });

  it("falls back to the raw code for an unrecognised code", () => {
    expect(unitNoun(UNRECOGNISED)).toBe("XX");
  });

  it("returns null when there is no code, so callers must branch", () => {
    expect(unitNoun(null)).toBeNull();
  });
});

describe("unitPlural", () => {
  it("gives the singular form for a count of one", () => {
    expect(unitPlural(1, "EA")).toBe("piece");
    expect(unitPlural(1, "HD")).toBe("box of 100");
  });

  it("gives the plural form for any other count", () => {
    expect(unitPlural(500, "EA")).toBe("pieces");
    expect(unitPlural(2, "DZ")).toBe("dozen");
    expect(unitPlural(0, "BX")).toBe("boxes");
  });

  it("falls back to the raw code for an unrecognised code", () => {
    expect(unitPlural(500, UNRECOGNISED)).toBe("XX");
  });

  it("returns an empty string when there is no code", () => {
    expect(unitPlural(500, null)).toBe("");
  });
});

// ---------------------------------------------------------------------------
// DH-11. The twenty-four unsourced codes.
//
// Everything below reads the SAME table `units.ts` cites: DoD 4100.39-M,
// Federal Logistics Information System (FLIS) Procedures Manual, Volume 10,
// Chapter 4, Table 53, "Unit of Issue Codes". `DLM 4000.25` Volume 2,
// paragraph AP7.6.1, names that table as the authority for the unit of issue
// a DIBBS order carries.
//
// Twenty of the twenty-four gained a NOUN. None gained a multiplier: assertion
// A2 forbids it, so `unitsTotal` stays null on every one of them and each test
// below says so. Four gained nothing and still render their raw code.

/** One sourced code: the code, its singular, its plural, its classification. */
type SourcedCode = readonly [string, string, string, "container" | "measure"];

/** The twelve codes that COUNT a container. One holds an unknown number. */
const SOURCED_CONTAINERS: readonly SourcedCode[] = [
  ["AY", "assembly", "assemblies", "container"],
  ["AT", "assortment", "assortments", "container"],
  ["BG", "bag", "bags", "container"],
  ["BT", "bottle", "bottles", "container"],
  ["CA", "cartridge", "cartridges", "container"],
  ["CO", "container", "containers", "container"],
  ["DR", "drum", "drums", "container"],
  ["JR", "jar", "jars", "container"],
  ["RL", "reel", "reels", "container"],
  ["SL", "spool", "spools", "container"],
  ["TU", "tube", "tubes", "container"],
  ["VI", "vial", "vials", "container"],
];

/** The eight codes that MEASURE. One holds no hidden item count at all. */
const SOURCED_MEASURES: readonly SourcedCode[] = [
  ["LG", "length", "lengths", "measure"],
  ["PT", "pint", "pints", "measure"],
  ["QT", "quart", "quarts", "measure"],
  ["SF", "square foot", "square feet", "measure"],
  ["SY", "square yard", "square yards", "measure"],
  ["SH", "sheet", "sheets", "measure"],
  ["PM", "plate", "plates", "measure"],
  ["SP", "strip", "strips", "measure"],
];

const SOURCED: readonly SourcedCode[] = [...SOURCED_CONTAINERS, ...SOURCED_MEASURES];

/**
 * The four codes DH-11 left on the abstain path, each with the reason.
 *
 * FV, TE and TF ARE in Table 53 — and what the table gives is a COUNT, not a
 * noun for a thing. A2 forbids the multiplier, and a noun without it would
 * print "500 tens" and "Your price is for one ten. We do not know how many
 * items that is." — a sentence the source contradicts. So they abstain.
 *
 * CS is in no edition of Table 53 this work could read. The 1996 edition
 * folds "case" into BX ("Includes 'case', 'carton', 'tray' and 'crate'"), so
 * there is no entry to cite and nothing is invented in its place.
 */
const ABSTAINED = ["FV", "TE", "TF", "CS"] as const;

describe("the codes DH-11 sourced from Table 53", () => {
  for (const [code, one, many, kind] of SOURCED) {
    it(`${code} names its unit, holds no multiplier, and warns as a ${kind}`, () => {
      // It can be named, so the money surfaces may say the noun (A3).
      expect(isKnownUnit(code)).toBe(true);
      expect(unitNoun(code)).toBe(one);
      expect(unitPlural(1, code)).toBe(one);
      expect(unitPlural(MANY, code)).toBe(many);

      // The noun is ALL it gained. A2: `ITEMS_PER_ISSUE` gains zero entries.
      expect(unitsTotal(MANY, code)).toBeNull();
      expect(itemsPerIssue(code)).toBeNull();
      expect(unitBasis(code)).toBe("unknown");
      expect(isMultiplied(code)).toBe(true);

      // So the quantity line names the container and states no item total.
      expect(quantityLine(MANY, code)).toBe(`1,138 ${many}`);
      expect(quantityLine(1, code)).toBe(`1 ${one}`);

      // Row 2 of PRD 7.1, in the wording its classification earns.
      expect(unitWarning(MANY, code)).toBe(
        kind === "measure"
          ? `Your price is for one ${one}, not for the whole order. Check before you price it.`
          : `Your price is for one ${one}. The source data does not say how many items that is. Check before you price it.`,
      );
    });
  }
});

describe("the abstain path — the four codes DH-11 could not give a noun", () => {
  for (const code of ABSTAINED) {
    it(`${code} still renders its raw code rather than a guess`, () => {
      expect(isKnownUnit(code)).toBe(false);
      expect(unitNoun(code)).toBe(code);
      expect(unitPlural(MANY, code)).toBe(code);
      expect(itemsPerIssue(code)).toBeNull();
      expect(unitsTotal(MANY, code)).toBeNull();
      expect(unitBasis(code)).toBe("unknown");
      expect(quantityLine(MANY, code)).toBe(`1,138 — the unit is ${code}, an unknown code.`);
      expect(unitWarning(MANY, code)).toBe(
        `The unit is ${code}, an unknown code. Check what one ${code} holds before you price it.`,
      );
    });
  }
});

describe("a key inherited from Object.prototype is not a unit of issue", () => {
  // `unitOfIssue` arrives from the DIBBS feed, so a corrupt or hostile value
  // reaches these lookups. The tables were bare object literals, so
  // `itemsPerIssue("toString")` returned a FUNCTION against a declared
  // `number | null` and `isKnownUnit("constructor")` returned true.
  const INHERITED = ["toString", "constructor", "valueOf", "hasOwnProperty", "__proto__"];

  it("returns no multiplier for an inherited key", () => {
    for (const key of INHERITED) {
      expect(itemsPerIssue(key)).toBeNull();
      expect(unitsTotal(MANY, key)).toBeNull();
      expect(unitBasis(key)).toBe("unknown");
    }
  });

  it("does not claim to recognise an inherited key", () => {
    for (const key of INHERITED) {
      expect(isKnownUnit(key)).toBe(false);
    }
  });

  it("renders an inherited key raw, exactly as it renders any other code", () => {
    for (const key of INHERITED) {
      expect(unitNoun(key)).toBe(key);
      expect(unitPlural(MANY, key)).toBe(key);
      expect(quantityLine(MANY, key)).toBe(`1,138 — the unit is ${key}, an unknown code.`);
      expect(unitWarning(MANY, key)).toBe(
        `The unit is ${key}, an unknown code. Check what one ${key} holds before you price it.`,
      );
    }
  });
});

// THE UNIT OF ISSUE IS NOT ON THE ORDER PAPER, AND FOUR SENTENCES SAID IT WAS.
//
// `small-orders.mapper.ts` sets `unitOfIssue: nsnRecord?.ui ?? null`. The value
// comes from the `nsn_records` join and from nowhere else. So a null unit means
// ONE of two things, and neither is a fact about DLA's document:
//   · no `nsn_records` row joined — our own gap, 58% of the feed on 2026-09-11
//   · the row joined and holds no `ui` — real, but rare (10 of 17,839)
//
// Both rendered "the order paper does not say how these are counted.", which
// told the member DLA's solicitation was deficient. She reads that as "this one
// is vague, skip it" and passes over an order that is fine. The claim is false
// in the direction that costs her the work.
//
// ONE SENTENCE FOR BOTH STATES, because her action is identical either way: we
// cannot tell her how these are counted, so she checks the paper herself. That
// is the same reasoning `OrderCard` already applies to the two ways a price can
// be absent — "the action is identical and the caption below is what differs".
//
// THE QUANTITY KEEPS ITS SENTENCE. `quantity` IS `doc.dibbsQuantity`, off the
// solicitation, so "The order paper does not say how many." stays true and is
// asserted below to prove this correction did not over-reach into that field.
describe("the unit of issue never blames the order paper", () => {
  /** The three attributions that were false. None may return. */
  const FALSE_ATTRIBUTIONS = [
    /the order paper does not say how these are counted/i,
    /the order paper says the unit is/i,
    /the order paper measures this/i,
  ];

  /** Every sentence the two null-unit branches can produce. */
  const unitSentences = (): string[] =>
    [
      quantityParts(500, null).note,
      quantityParts(500, UNRECOGNISED).note,
      quantityLine(500, null),
      quantityLine(500, UNRECOGNISED),
      unitWarning(500, null),
      unitWarning(500, UNRECOGNISED),
    ].filter((s): s is string => s != null);

  it("makes none of the three false claims, on any null-unit branch", () => {
    for (const sentence of unitSentences()) {
      for (const claim of FALSE_ATTRIBUTIONS) {
        expect(sentence).not.toMatch(claim);
      }
    }
  });

  it("says what the source data lacks, on the card and in the warning box", () => {
    // The card: the count note, lower case after the dash.
    expect(quantityParts(500, null).note).toBe("unit not available at source.");
    expect(quantityLine(500, null)).toBe("500 — unit not available at source.");
    // The warning box: "We", beside "The source data does not say how many items that is."
    expect(unitWarning(500, null)).toBe(
      "Unit not available at source. Check how these are counted before you price it.",
    );
  });

  it("still shows an unrecognised code raw, without sourcing it to the paper", () => {
    expect(quantityLine(500, UNRECOGNISED)).toBe("500 — the unit is XX, an unknown code.");
    expect(unitWarning(500, UNRECOGNISED)).toBe(
      "The unit is XX, an unknown code. Check what one XX holds before you price it.",
    );
  });

  it("leaves the QUANTITY sentence alone — that one is off the order paper", () => {
    expect(quantityLine(null, "HD")).toBe("The order paper does not say how many.");
    expect(quantityParts(null, null).value).toBe("The order paper does not say how many.");
  });
});

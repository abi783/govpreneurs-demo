// Unit of issue — the single most expensive mistake in DIBBS.
//
// A quantity of "500" against a unit of issue of HD is FIFTY THOUSAND items,
// not five hundred. Quote a per-each price against it and you win at one
// hundredth of the price you meant, on a binding contract.
//
// The design system's plain-English rule says "500 pieces, never 500 EA". That
// is right for EA and actively dangerous for everything else — smoothing over
// the one field that must never be smoothed. So this is the one place in the
// product where plain English means MORE words, not fewer.
//
// Source: DLA unit-of-issue codes. Anything not in this table renders with the
// raw code shown rather than a guess (abstain rather than guess).

export type UnitOfIssue = string | null;

/** Items inside one issue unit. 1 for EA; 100 for HD; 1000 for TH; and so on. */
// Only codes whose multiplier is documented. A guessed multiplier renders as
// fact — "CL: 100" was here and had no DLA source. Anything absent falls to the
// unknown-multiplier path, which says so rather than inventing a number.
const ITEMS_PER_ISSUE: Record<string, number> = {
  EA: 1, // each
  PR: 2, // pair
  DZ: 12, // dozen
  HD: 100, // hundred
  TH: 1000, // thousand
};

/** Plural noun for one issue unit, in her words rather than the code's. */
// SOURCE for every entry marked "T53": DoD 4100.39-M, Federal Logistics
// Information System (FLIS) Procedures Manual, Volume 10, Chapter 4, Table 53,
// "Unit of Issue Codes". DLM 4000.25 Volume 2, paragraph AP7.6.1, names that
// table as the authority for the unit of issue a DIBBS order carries. The term
// quoted beside each code is the term the table gives it.
//
// A NOUN IS NOT A MULTIPLIER. Naming the container tells her what she is
// pricing; it does not tell her what one holds. Every code below whose line
// says "T53" and nothing more stays on the unknown-multiplier path, and
// `ITEMS_PER_ISSUE` above gains nothing from this table (A2).
const ISSUE_NOUN: Record<string, { one: string; many: string }> = {
  EA: { one: "piece", many: "pieces" },
  PR: { one: "pair", many: "pairs" },
  DZ: { one: "dozen", many: "dozen" },
  HD: { one: "box of 100", many: "boxes of 100" },
  TH: { one: "pack of 1,000", many: "packs of 1,000" },
  BX: { one: "box", many: "boxes" },
  PG: { one: "package", many: "packages" },
  CN: { one: "can", many: "cans" },
  RO: { one: "roll", many: "rolls" },
  SE: { one: "set", many: "sets" },
  KT: { one: "kit", many: "kits" },
  FT: { one: "foot", many: "feet" },
  GL: { one: "gallon", many: "gallons" },
  LB: { one: "pound", many: "pounds" },
  YD: { one: "yard", many: "yards" },
  CL: { one: "coil", many: "coils" },

  // The twenty codes DH-11 sourced. Each one moves its warning from row 3
  // ("we cannot name this") to row 2 ("we cannot say what one holds") and lets
  // `priceCeiling()` say "for each <noun>" — accepted, and named, in A3.
  AY: { one: "assembly", many: "assemblies" }, // T53 "Assembly"
  AT: { one: "assortment", many: "assortments" }, // T53 "Assortment"
  BG: { one: "bag", many: "bags" }, // T53 "Bag"
  BT: { one: "bottle", many: "bottles" }, // T53 "Bottle"
  CA: { one: "cartridge", many: "cartridges" }, // T53 "Cartridge"
  CO: { one: "container", many: "containers" }, // T53 "Container"
  DR: { one: "drum", many: "drums" }, // T53 "Drum"
  JR: { one: "jar", many: "jars" }, // T53 "Jar"
  RL: { one: "reel", many: "reels" }, // T53 "Reel"
  SL: { one: "spool", many: "spools" }, // T53 "Spool"
  TU: { one: "tube", many: "tubes" }, // T53 "Tube"
  VI: { one: "vial", many: "vials" }, // T53 "Vial"
  LG: { one: "length", many: "lengths" }, // T53 "Length"
  PT: { one: "pint", many: "pints" }, // T53 "Pint"
  QT: { one: "quart", many: "quarts" }, // T53 "Quart"
  SF: { one: "square foot", many: "square feet" }, // T53 "Square Foot"
  SY: { one: "square yard", many: "square yards" }, // T53 "Square Yard"
  SH: { one: "sheet", many: "sheets" }, // T53 "Sheet"
  PM: { one: "plate", many: "plates" }, // T53 "Plate"
  SP: { one: "strip", many: "strips" }, // T53 "Strip"
};

// FOUR CODES GOT NOTHING, AND THAT IS THE DESIGNED OUTCOME.
//
// FV, TE and TF are in Table 53, and what the table gives is a COUNT rather
// than a noun for a thing: FV "Five (5) of an item", TE "Ten (10) of an item",
// TF "Twenty-five (25) of an item". A2 forbids the multiplier, and a noun
// without the multiplier is worse than no noun — it renders "500 tens" and
// "Your price is for one ten. We do not know how many items that is.", which
// the source itself contradicts. Row 3 says "check what one TE holds", which
// is true and sends her to the paper. So all three abstain.
//
// CS is in no edition of Table 53 this work could read; the 1996 edition folds
// it into BX ("Includes 'case', 'carton', 'tray' and 'crate'"). An unsourced
// noun is a guess wearing the clothes of a fact, so CS renders raw.

/** Codes with no hidden item count inside one unit, unlike a box or a bag.
 *  Two shapes qualify. A continuous measure (foot, gallon, pint, square yard)
 *  is one unit of a quantity. A piece named by its shape (sheet, plate, strip)
 *  is one piece. Neither can be asked "how many items is that?", so both get
 *  the warning that fits them: price the unit, not the whole order. */
const MEASURES = new Set(["FT", "GL", "LB", "YD", "LG", "PT", "QT", "SF", "SY", "SH", "PM", "SP"]);

const n = (v: number) => v.toLocaleString("en-US");

/**
 * The noun for one issue unit — NULL for anything the table does not hold.
 *
 * `Object.hasOwn`, never `ISSUE_NOUN[ui]` alone. Both tables are plain object
 * literals, so every key on `Object.prototype` reached through them: a unit of
 * issue of "toString" made `itemsPerIssue()` return a FUNCTION against a
 * declared `number | null`, `isKnownUnit()` answer true, and `unitPlural()`
 * render `undefined` on the card. `unitOfIssue` comes off the DIBBS feed, so a
 * corrupt value reaches these lookups; an inherited key is not a unit of issue
 * and now takes the same abstain path as any other code we cannot name.
 */
function nounFor(ui: string): { one: string; many: string } | null {
  return Object.hasOwn(ISSUE_NOUN, ui) ? ISSUE_NOUN[ui] : null;
}

/**
 * How many items one issue unit contains — NULL when we do not know.
 *
 * It used to return 1 for anything absent from the table, which is a guess
 * wearing the clothes of a fact: a box (BX) holds an unknown number of items,
 * not one. That default flowed into unitsTotal() and rendered a fabricated
 * count captioned "Items you would have to deliver in total." — inside the very
 * warning box saying we do not know how these are counted. Same
 * 100x harm class as the invented CL: 100 multiplier and the 25% margin.
 */
export function itemsPerIssue(ui: UnitOfIssue): number | null {
  if (!ui) return null;
  // `Object.hasOwn`, not `in` — see `nounFor()` above for what `in` let
  // through. `in` walks the prototype chain; this reads the table only.
  return Object.hasOwn(ITEMS_PER_ISSUE, ui) ? ITEMS_PER_ISSUE[ui] : null;
}

/**
 * Total items across the whole order — NULL unless we know the multiplier.
 *
 * Only the five units with an explicit multiplier can produce this. A known
 * noun with no multiplier (BX, GL, RO...) and an unrecognised code both yield
 * null, which is what PRD 7.1's three-state table already required and the
 * arithmetic did not honour.
 */
export function unitsTotal(quantity: number | null, ui: UnitOfIssue): number | null {
  const per = itemsPerIssue(ui);
  return quantity == null || per == null ? null : quantity * per;
}

/**
 * The three states a unit of issue actually has. `unitWarning()` below has had
 * all three arms since PRD 7.1 row 2 was built; every other reader had two.
 *
 *   "each"       EA — the quantity on screen IS the number of items.
 *   "multiplied" a DOCUMENTED multiplier above one (PR, DZ, HD, TH) — it is not.
 *   "unknown"    everything else: a noun we can name but hold no multiplier for
 *                (BX, PG, CN, RO, SE, KT, FT, GL, LB, YD, CL), a code we do not
 *                recognise, or no code at all. We cannot say what one holds.
 *
 * "unknown" is NOT a quiet state. It is the one where she can price per item
 * against a container and find out on a binding contract.
 */
export type UnitBasis = "each" | "multiplied" | "unknown";

export function unitBasis(ui: UnitOfIssue): UnitBasis {
  const per = itemsPerIssue(ui);
  if (per == null) return "unknown";
  return per > 1 ? "multiplied" : "each";
}

/**
 * True when the quantity on screen is NOT the number of items — which is the
 * question every caller is really asking, and it has TWO yes answers.
 *
 * It was `per != null && per > 1`: false for the eleven nouns we can name but
 * hold no multiplier for, false for every unrecognised code, and false for a
 * null unit. The three-state fact was compressed into a boolean and the third
 * state was filed as the first — the benefit of the doubt, on the one field
 * that must never get it (D-B8). `itemsPerIssue()` and `unitsTotal()` both
 * return null on an unknown multiplier; this was the one helper that turned
 * that null into a boolean, and it guessed. It is also the helper BOTH safety
 * consumers read.
 *
 * Measured, before the fix: mp-006 is 1,138 PACKAGES at $22.88 each, $26,037 of
 * order, and `mentorTrigger()` skipped the unit warning on it entirely; and
 * `relevanceScore` scored that record 240 — the same as an EA record and 80
 * ABOVE the same record as HD. A unit whose multiplier we cannot name outranked
 * one we can. Only EA is plain each; everything else is at least as loud.
 */
export function isMultiplied(ui: UnitOfIssue): boolean {
  return unitBasis(ui) !== "each";
}

/** Do we recognise this code at all? If not we show it raw rather than guess. */
export function isKnownUnit(ui: UnitOfIssue): boolean {
  return ui != null && nounFor(ui) != null;
}

/**
 * The quantity line. "500 pieces" only when it really is 500 pieces.
 *   EA → "500 pieces"
 *   HD → "500 boxes of 100 — 50,000 items in total"
 *   ??? → "500 (unit of issue: XX)"
 */
export interface QuantityParts {
  /** The count itself. A value, never a sentence — this is what goes in bold. */
  value: string;
  /** What the count does NOT say. Null when the count says everything. */
  note: string | null;
}

/**
 * The quantity split into the part that is a value and the part that is a
 * sentence about it.
 *
 * WHY THIS EXISTS. `quantityLine()` joins the two with an em dash, and a
 * labelled cell rendered the whole join as its VALUE: "223 — I do not know
 * how these are counted." in the same bold as "300 pieces". The
 * caveat is not the count. It inherited the count's weight, it wrapped to two
 * lines under a label reading HOW MANY, and a member scanning for a number met
 * a paragraph.
 *
 * A cell with a hint slot takes both parts and puts each where it belongs. A
 * caller with one line — the order card, the wins record — keeps calling
 * `quantityLine()`, which composes these two and is unchanged.
 *
 * ONE OWNER FOR THE WORDS. Both functions read this one, so the card and the
 * order page cannot drift into two vocabularies for one fact.
 */
export function quantityParts(quantity: number | null, ui: UnitOfIssue): QuantityParts {
  // Abstain rather than guess. A missing quantity is a real state in the source
  // data, and inventing "1" would be a confident wrong number about money.
  // There is no number to show here, so the abstention IS the value.
  if (quantity == null) return { value: "The order paper does not say how many.", note: null };
  if (ui == null) {
    return {
      value: n(quantity),
      note: "unit not available at source.",
    };
  }
  const noun = nounFor(ui);
  // Full stop, like the other three branches. It is a sentence she reads, not a
  // label, and the one branch missing its terminator is the one nobody rendered.
  if (!noun) return { value: n(quantity), note: `the unit is ${ui}, an unknown code.` };

  const label = quantity === 1 ? noun.one : noun.many;
  // Asks for the STATE, not the boolean: only "multiplied" has an item total.
  // Computed once and branched on HERE, never `unitsTotal(...) ?? 0` — a null
  // coerced to a number inside a rendered money-path string is the D-A4 shape
  // whether or not an input reaches it today. The guard belongs beside the
  // value it guards.
  const totalItems = unitBasis(ui) === "multiplied" ? unitsTotal(quantity, ui) : null;
  if (totalItems == null) return { value: `${n(quantity)} ${label}`, note: null };
  return { value: `${n(quantity)} ${label}`, note: `${n(totalItems)} items in total` };
}

export function quantityLine(quantity: number | null, ui: UnitOfIssue): string {
  // ONE OWNER FOR THE WORDS — the promise the docblock above makes, now kept.
  // This function used to carry its OWN copy of all four branches, and the
  // copies drifted exactly as that paragraph said they must not: the unit of
  // issue comes from the `nsn_records` join, never from the solicitation, and
  // the sentence that claimed otherwise had to be corrected in two places
  // because it was written in two places. Composing leaves one.
  const { value, note } = quantityParts(quantity, ui);
  return note == null ? value : `${value} — ${note}`;
}

/**
 * The warning that sits on the card and the order page whenever the unit is not
 * each. Deliberately says what to do, not just what is true.
 */
export function unitWarning(_quantity: number | null, ui: UnitOfIssue): string | null {
  if (ui == null) {
    return "Unit not available at source. Check how these are counted before you price it.";
  }
  const per = itemsPerIssue(ui);
  // Known noun AND multiplier — PRD 7.1 row 1. The one state where we can do
  // the arithmetic, so we do it and say it loudly.
  if (per != null) {
    if (per <= 1) return null; // EA: the quantity on screen IS the item count.
    const one = nounFor(ui)?.one ?? ui;
    return `One ${one} holds ${n(per)} items. Your price is for the whole ${one}.`;
  }

  // PAST HERE THE MULTIPLIER IS UNKNOWN, and that is the harm — not whether we
  // can name the container. This function used to fire only on an unrecognised
  // code, so BX, PG, CN, RO, SE, KT, FT, GL, LB, YD and CL — eleven of the
  // sixteen nouns we know — went out silent: the order page said "1,138
  // packages" and "Quote less than $22.88 for each package" with nothing
  // anywhere saying we do not know what one package holds. That is PRD 7.1
  // row 2, specified and not built, on the 100x money path this module exists
  // for. Naming the noun is not the safety property; the multiplier is.
  const noun = nounFor(ui);
  if (!noun) {
    // Row 3 — we cannot even name it. Show the raw code, never a guess.
    return `The unit is ${ui}, an unknown code. Check what one ${ui} holds before you price it.`;
  }
  // Row 2, in TWO wordings, because row 2 covers two different things.
  //
  // On a container (box, package, kit, coil) the danger is the hidden count:
  // one box holds some number of items and the paper does not say how many, so
  // that is what we tell her to check.
  //
  // On a continuous measure there is no hidden count to know — a foot is a
  // foot — and "we do not know how many items that is" reads as nonsense
  // exactly where she most needs to trust the sentence. The real risk on these
  // is the other one: pricing the whole order at the per-foot figure, or the
  // reverse. So they get the half of the warning that is true for them.
  if (MEASURES.has(ui)) {
    return `Your price is for one ${noun.one}, not for the whole order. Check before you price it.`;
  }
  return `Your price is for one ${noun.one}. The source data does not say how many items that is. Check before you price it.`;
}

/**
 * The singular noun for one issue unit — "pair", "box of 100", "gallon".
 * Used wherever a price is stated, because "each" is a lie whenever the unit of
 * issue is not EA, and that lie is the expensive one.
 */
export function unitNoun(ui: UnitOfIssue): string | null {
  // Returns NULL, not "one", when the unit is unknown. Returning "one" produced
  // "Quote less than $6.15 for each one." — a confident per-item money
  // instruction on an unknown unit, which is semantically the same 100x error
  // the whole module exists to prevent. Callers must branch.
  if (ui == null) return null;
  return nounFor(ui)?.one ?? ui;
}

/** Plural form for a count of issue units — "pairs", "boxes of 100". */
export function unitPlural(count: number, ui: UnitOfIssue): string {
  if (ui == null) return "";
  const n = nounFor(ui);
  if (!n) return ui;
  return count === 1 ? n.one : n.many;
}

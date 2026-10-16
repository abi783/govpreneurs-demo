// What to charge — the instruction, not the chart.
//
// Every competitor renders a price-history table and leaves the arithmetic to
// the reader. We turn history into one sentence she can act on. That inversion
// is takeaway 4 of the research file and it is the differentiator.
//
// Two rules hold this honest:
//   1. We do NOT invent a margin. SellerAmp computes a "max cost" from an ROI
//      threshold the user configures; we have no such threshold and will not
//      fabricate one. The inversion is achieved by the instruction alone.
//   2. The instruction says how old its price is. The owner decided on
//      2026-09-15 to price from the award history WHEREVER it exists, however
//      old or undated, and from DLA's list price (HigherGov's NSN `unit_price`,
//      `standardPrice`) where it does not. An old or undated award, and a list
//      price, each carry a sentence saying what the figure is. The one
//      withdrawal left is a unit of issue nobody can name: "for each XX" can
//      make her quote a hundredth of what she means.
//
// This is a template, not a generated sentence. The highest-stakes copy in the
// product is not written by a model — see docs/micro-purchases/plan §3.2.
import { type MicroAward, type MicroOrder } from "./order";
import { unitNoun, unitPlural, isKnownUnit } from "./units";

export const MONTHS_FRESH = 12;
export const MONTHS_USABLE = 24;

/**
 * THE DAY THIS MODULE MEASURES AN AWARD AGAINST — the served corpus's own.
 *
 * How old an award is, is a fact about an ORDER, so it takes the day the board
 * was served for (`SmallOrdersFeed.asOf`) and never the real day. `wallClock.ts`
 * states the split and puts this question on this side of it.
 *
 * EVERY ENTRY POINT BELOW TAKES THAT DAY AND NONE OF THEM DEFAULTS IT. All
 * four defaulted to `TODAY`, the SAMPLE corpus's frozen day, and twenty live
 * call sites took the default. That day stopped on 26 August 2026 while the
 * served day moves with the ingest, so the ladder aged every award against a
 * day the rest of the board does not use: too old while the served day trails
 * the sample's, too YOUNG once it passes — and a price read as younger than it
 * is, is a price we stand behind past the 24 months we withdraw at.
 *
 * `null` is "the served corpus names no day", which `asOf` spells as `''`. The
 * whole ladder withdraws on it. That cannot be left to the arithmetic: an
 * unreadable day yields NaN months, every comparison against NaN is false, and
 * the withdrawal would silently not happen.
 */
export function corpusNow(asOf: string | null | undefined): Date | null {
  if (!asOf) return null;
  // Midnight UTC, because every day this feature stores is a UTC-sliced
  // `YYYY-MM-DD` and an award date parses the same way. A day read in local
  // time names a different instant depending on where the browser is.
  const day = new Date(`${asOf}T00:00:00.000Z`);
  return Number.isNaN(day.getTime()) ? null : day;
}

/** Money, whole dollars over $100 and cents below — she is pricing small parts. */
export function usd(v: number): string {
  if (v >= 100) {
    return `$${Math.round(v).toLocaleString("en-US")}`;
  }
  return `$${v.toFixed(2)}`;
}

/**
 * A cost we are willing to put on screen as money.
 *
 * Guards the RENDERED value, not the raw one. `usd(0.001)` is "$0.00", so a
 * `<= 0` test let a tenth of a cent through and produced the exact string that
 * guard was written to prevent — "Quote less than $0.00 for each piece", with a
 * ceiling of 0.001 handed to the send block. Same reasoning as the award dedupe
 * key below: what she reads is the rendered string, so the rendered string is
 * what we check.
 */
export function usablePrice(v: number | null | undefined): v is number {
  return v != null && Number.isFinite(v) && v > 0 && usd(v) !== "$0.00";
}

/**
 * An award that is evidence of what NEW stock costs.
 *
 * ONE predicate, read by the instruction AND by the record block. Two of these
 * is a contradiction waiting on the same screen, and it happened: this test
 * lived inside awardHistory() while priceAdvice() read the raw price field, so
 * the two blocks handed her money figures three times apart (D-A5).
 *
 *  · no usable cost — it is not evidence of a price
 *  · SURPLUS — that is a used-goods price, and two blocks below we tell her
 *    used stock is not allowed. Letting it set the low bound, or the ceiling,
 *    pushes her toward the disqualifier.
 *
 * `=== false`, not `!== true`. The live API returns `surplus: null` on 15% of
 * awards — including the NEWEST award on the sample for mp-005's own stock
 * number, the one that sets last_price — and an award we cannot tell about is
 * not evidence of a new-stock price. `!== true` read that unknown as clean and
 * let it set both the ceiling and the low bound of the range. An unknown drops
 * out of a money figure (D-C4); it does not get the benefit of the doubt on the
 * one number she quotes against.
 *
 * The fixture type IS now `boolean | null` — but the ingest at
 * `scripts/build-micro-fixtures.ts:152` still writes `a.surplus === true`, so
 * every award in the corpus is non-null and **this guard is exercised by
 * nothing**. Live it is 4 of 26. The guard is correct and unproven; the
 * remaining half is the build script, and it is a §15 gap on the frozen
 * prototype rather than a fix.
 */
const usableAward = (a: MicroAward) => usablePrice(a.unitCost) && a.surplus === false;

/**
 * The newest award we would price from — null when the record carries awards
 * but not one of them is evidence.
 *
 * Age is deliberately NOT judged here. The ladder in priceAdvice() and the
 * window in awardHistory() each apply their own, and folding age in would hide
 * the "too old to price from" state both of them need to reach.
 */
function newestUsableAward(o: MicroOrder): MicroAward | null {
  return o.awards
    .filter(usableAward)
    .reduce<MicroAward | null>(
      (best, a) => (best == null || a.awardedOn > best.awardedOn ? a : best),
      null,
    );
}

/**
 * The unit price we will stand behind, and the day it comes from — or null.
 *
 * ONE source for every money figure on the surface. `orderValue()` feeds the
 * card figure, the size bands, the "biggest first" sort, the mentor gate and
 * the recorded win; `priceAdvice()` feeds the instruction and the ceiling. They
 * read the same two numbers from here, so a surplus award cannot set one of
 * them while the record block excludes it from the other.
 *
 * `on` is null only where the record carries a price with no award behind it —
 * there is no date field on the NSN object (PRD 15 B4), so this is the live
 * default, not an edge case.
 */
export type PriceSource = "award" | "list";

export type PricePoint = {
  amount: number;
  /** The award's day; null for an undated award and for a list price. */
  on: string | null;
  /** A price DLA paid (`award`), or DLA's list price (`list`). */
  source: PriceSource;
};

export function pricePoint(o: MicroOrder): PricePoint | null {
  const newest = newestUsableAward(o);
  if (newest) return { amount: newest.unitCost as number, on: newest.awardedOn, source: "award" };
  // Awards on the record, none of them evidence: the `last_price` field is the
  // newest of those awards, so it is NOT read here. Falling back to the field is
  // exactly how the surplus figure reached the instruction.
  if (o.awards.length === 0 && usablePrice(o.lastPricePerUnit)) {
    return { amount: o.lastPricePerUnit, on: o.lastPriceDate, source: "award" };
  }
  // No price history we can use: DLA's list price stands in, and says so.
  return usablePrice(o.standardPrice)
    ? { amount: o.standardPrice, on: null, source: "list" }
    : null;
}

/** The most load-bearing sentence on the surface. One literal, two branches. */
const quoteLess = (price: string, per: string) => `Quote less than ${price} ${per}.`;

/**
 * `now` is REQUIRED, deliberately. It defaulted to `new Date()` while every
 * fixture in both features that calls it is stamped to a frozen date, so the
 * age of an award drifted a day per day against orders that never moved. A
 * default here is a second clock, and one screen cannot have two.
 */
export function monthsSince(iso: string, now: Date): number {
  const then = new Date(iso);
  return Math.max(0, Math.round((now.getTime() - then.getTime()) / (30.44 * 24 * 3600 * 1000)));
}

/** "March 2026" — never "3/26". Dates are written out (plain-English bar). */
export function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** "19 May 2026" — day, month, year. Never "5/19/26". */
export function dayMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * "Sat, 29 Aug 2026" — the same date, abbreviated, for a column.
 *
 * NOT a relaxation of the no-numeric-dates rule. `2/9/26` is nine days apart
 * depending on which side of the Atlantic reads it, and this feature's member
 * may have learned either order; the month is still a WORD here, and the
 * weekday is still there, so the string is unambiguous in exactly the way
 * fullDate() is. What is gone is length, and only length.
 *
 * It exists because the board row gives the closing date a 168px column.
 * "Closes Wednesday, 2 September 2026" sets three lines in that column and made
 * the deadline the tallest thing on a row whose whole job is letting her
 * compare deadlines. The order page keeps fullDate(): it has the width, and it
 * is the screen where she commits.
 */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "Saturday 29 August 2026" — written out in full, always. */
export function fullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * What the whole order was worth last time DLA bought it.
 *
 * CAREFUL — this multiplies by `quantity`, NOT by the total item count. DLA
 * prices against the UNIT OF ISSUE: the SF18 puts UNIT PRICE right beside UI, so
 * a price of $6.15 on a unit of PR is $6.15 per PAIR, and $0.42 on a unit of HD
 * is 42 cents per HUNDRED.
 *
 * Multiplying by the item count instead inflated a 900-pair glove order from
 * $5,535 to $11,070. Caught by rendering the card, not by reading the code.
 * (This is research open question 0c: confirm against a live API call before
 * launch, because if HigherGov normalises `last_price` per item, this flips.)
 */
export function orderValue(o: MicroOrder, now: Date | null): number | null {
  // THE WHOLE LADDER, not a subset of it. This used to run two of the five
  // withdrawal triggers — age and quantity — while priceCeiling() ran four, so
  // on a record with a usable price and either an unnameable unit of issue or
  // no date, a derived MONEY TOTAL rendered on the card and the order page
  // while the Hunter block an inch below refused to give a per-unit ceiling for
  // the same record. 138 reproduced cases across the corpus, ZERO of them
  // reachable on the fixtures as checked in (D-B3), which is why four review
  // rounds did not see it. The docblock claimed the opposite — "the ladder that
  // withdraws the ceiling withdraws this too, and the two cannot disagree" —
  // and that claim is now enforced by reading the ladder instead of restating
  // a clause of it (D-A5: one ceiling, one owner; D-A2: no derived number from
  // an input we will not stand behind).
  //
  // Age is in there: priceAdvice() withdraws its ceiling past MONTHS_USABLE but
  // still STATES the old price, because "DLA paid $X, but that was in 2005" is
  // honest history. A derived total is not history — it is a figure she acts
  // on, and it feeds the card figure, the size bands, the "biggest first" sort,
  // the mentor gate and her recorded win.
  if (priceCeiling(o, now) == null) return null;
  const p = pricePoint(o);
  // A quantity of ZERO is not a small order, it is a field we misread: DLA does
  // not solicit nothing. Multiplying by it rendered "At 0 pieces, that is $0.00
  // for the order." beside a live per-unit ceiling — a money figure with no
  // record behind it, and the same rendered-zero class usablePrice() guards.
  // One guard here rather than in the totalLine branch, because every money
  // surface reads this one function: the card figure, the size bands, the
  // "biggest first" sort, the mentor gate and the recorded win.
  if (p == null || o.quantity == null || o.quantity <= 0) return null;
  return p.amount * o.quantity;
}

/**
 * The price ceiling we are willing to put in front of her, and what it is PER.
 *
 * Present ONLY when the full ladder allows an instruction: a usable price, a
 * readable date inside 24 months, and a unit of issue we can name. Any surface
 * that wants to show her a "keep it under" number must read this and must show
 * nothing when it is null — no surface may re-derive one from
 * `lastPricePerUnit`, which is how the send block came to render "Price for
 * each / Keep it under $6.15" on a unit of PR, regardless of age or unit.
 */
export type PriceCeiling = { amount: number; noun: string };

/**
 * THE ceiling. The whole withdrawal ladder, and nothing else.
 *
 * priceAdvice() reads this rather than building `{ amount, noun }` itself, so
 * "we will stand behind this price" has ONE owner. Two copies of this test —
 * one for the copy and one for the boolean — is D-A5 with a fresh coat of
 * paint, and D-A5 is what took three rounds to clear off this file.
 *
 * The withdrawal triggers, in the same precedence priceAdvice() states: no
 * price (no usable award and no list price) -> unnameable unit. Age and a
 * missing date were triggers until 2026-09-15; the owner chose to price from
 * old and undated awards, with a sentence saying so. Quantity is NOT a trigger:
 * an order with no quantity still has a per-unit ceiling, it just has no total.
 *
 * THREE readers, not two: priceAdvice() for the copy, hasUsableCeiling() for
 * the boolean, and orderValue() for the total. orderValue() used to restate two
 * of these four triggers inline and drifted from the other two, which put a
 * money total on the card under a Hunter block refusing to price the same
 * record. Nothing re-derives this ladder; everything reads it.
 *
 * If you add a fifth withdrawal to priceAdvice(), add it HERE. The gate in
 * `ceilingLadder.test.ts` fails the moment the two disagree: it reads all three
 * readers over `liveMapperOutput.fixture.ts` and asserts they answer alike.
 */
function priceCeiling(o: MicroOrder, now: Date | null): PriceCeiling | null {
  // No day, no age, no ceiling — see corpusNow().
  if (now == null) return null;
  const p = pricePoint(o);
  if (p == null) return null;
  const noun = isKnownUnit(o.unitOfIssue) ? unitNoun(o.unitOfIssue) : null;
  return noun == null ? null : { amount: p.amount, noun };
}

/**
 * Is there a price we will stand behind? The same question priceAdvice() answers
 * — without building the three strings that answer it.
 *
 * `relevanceScore` asks this once per row and threw away the copy: priceAdvice()
 * calls monthYear(), and `toLocaleDateString` is an Intl format per call, which
 * is what made the answer to a boolean cost 0.34ms. Same ladder, no Intl, no
 * templates.
 */
export function hasUsableCeiling(o: MicroOrder, now: Date | null): boolean {
  return priceCeiling(o, now) != null;
}

export type PriceAdvice =
  | { kind: "none"; headline: string; body: string; ceiling: null }
  | {
      kind: "fresh" | "ageing";
      headline: string;
      body: string;
      sourceDate: string;
      ceiling: PriceCeiling | null;
    }
  | {
      /** An award older than 24 months, an undated award, or no nameable unit. */
      kind: "stale";
      headline: string;
      body: string;
      sourceDate: string;
      ceiling: PriceCeiling | null;
    }
  | {
      /** No usable award: DLA's list price. */
      kind: "list";
      headline: string;
      body: string;
      sourceDate: string;
      ceiling: PriceCeiling | null;
    };

/** What `sourceDate` says for a list price, which carries no day. */
export const LIST_PRICE_SOURCE = "DLA list price";

/** The price headline when DLA has never bought the part. */
const NO_HISTORY = "It's a new order! No prior history to estimate a price from.";

/** The price headline when awards exist but none gives a usable price. */
const NO_USABLE_HISTORY = "No usable price history for this one.";

/** The unit of issue is missing or is a code with no known meaning. */
const COUNT_UNCLEAR = "How these are counted is not clear at source.";

/**
 * The sentence about quantity that closes a priced body: the order's total at
 * this price, or that the order paper does not say how many.
 */
function quantityLine(o: MicroOrder, now: Date | null): string {
  if (o.quantity == null) {
    return " The order paper does not say how many they want this time.";
  }
  const total = orderValue(o, now);
  if (total == null) return "";
  const qty =
    `${o.quantity.toLocaleString("en-US")} ${unitPlural(o.quantity, o.unitOfIssue)}`.trim();
  return o.repeats === true
    ? ` At ${qty}, that is ${usd(total)} if DLA buys the whole estimate.`
    : o.repeats === false
      ? ` At ${qty}, that is ${usd(total)} for the order.`
      : ` At ${qty}, that is ${usd(total)}. The order paper did not say if this repeats.`;
}

/**
 * Hunter's price block. Four outcomes, and one of them is an honest refusal.
 * Every string here is a template filled from record facts.
 */
export function priceAdvice(o: MicroOrder, now: Date | null): PriceAdvice {
  // The order of evidence (owner's call, 2026-09-15):
  //
  //   1. No award we can use and no list price -> abstain, no figure.
  //   2. No nameable unit of issue             -> state the figure, no instruction.
  //   3. No award, but a list price            -> instruct from the list price,
  //                                               and say it is the list price.
  //   4. An award with no day                  -> instruct, make NO age claim.
  //   5. An award older than 24 months         -> instruct, and say how old.
  //   6. An award inside 24 months             -> the fresh and ageing tiers.
  //
  // We price from the newest award we would ACCEPT AS EVIDENCE, never from the
  // raw `last_price` field. `last_price` IS the newest award's cost — verified
  // equal to `awards[0].unitCost` on 55 of 55 live records carrying both, and
  // confirmed again against both /nsn/ samples in research/api-samples. So when
  // the newest award is SURPLUS, `last_price` is the used-goods price, and
  // reading it raw put "Quote less than $4.10 for each piece" beside a record
  // block reading "they paid between $11.80 and $12.50" — the INSTRUCTION being
  // the used price the same page calls a disqualifier.
  //
  // A record carrying awards with not one usable among them never falls back to
  // the `last_price` field: that field is the surplus award. It falls to the list
  // price instead, which is not an award at all.
  // The price and its date come from pricePoint(), which guards the RENDERED
  // value too: "0" and "0.00" parse fine, and so does 0.001.
  const point = pricePoint(o);
  // A corpus carrying no day takes the same refusal as a record carrying no
  // price: every tier below measures an award against that day.
  if (now == null || point == null) {
    return {
      kind: "none",
      // "New order" only where the record holds no award at all. Awards that
      // are surplus or carry no cost are history, just not usable history.
      headline: point == null && o.awards.length === 0 ? NO_HISTORY : NO_USABLE_HISTORY,
      // NO TIME WORD. "recently" is an age claim, and there is no date field on
      // the NSN object to support one (PRD 15 B4). The card had this fixed and
      // the order page did not, so the two surfaces said different things from
      // the same branch. One string, one place.
      body: "Price it from what it costs you.",
      ceiling: null,
    };
  }

  const unitPrice = point.amount;
  const priceDate = point.on;

  // NEVER a bare "each". DLA prices against the unit of issue, so on a unit of
  // PR the price is per PAIR and on HD it is per HUNDRED. No nameable unit, no
  // instruction: we state the figure as a record fact and stop. Withdraw on an
  // UNRECOGNISED code too, not only on null.
  const noun = isKnownUnit(o.unitOfIssue) ? unitNoun(o.unitOfIssue) : null;
  if (noun == null) {
    return {
      kind: "stale",
      headline:
        point.source === "list"
          ? `DLA lists this at ${usd(unitPrice)}.`
          : `DLA paid ${usd(unitPrice)} last time.`,
      body: `${COUNT_UNCLEAR} Read the order paper before you price it.`,
      sourceDate:
        point.source === "list"
          ? LIST_PRICE_SOURCE
          : priceDate
            ? monthYear(priceDate)
            : "date not given",
      ceiling: null,
    };
  }
  const per = `for each ${noun}`;
  const price = usd(unitPrice);
  // NOT rebuilt from unitPrice and noun here. One owner (above), so the boolean
  // relevanceScore reads and the number the send block reads cannot drift.
  const ceiling = priceCeiling(o, now);

  // No price history: DLA's list price, named as the list price. It is often
  // higher than what DLA pays, and the body says so.
  if (point.source === "list") {
    return {
      kind: "list",
      headline: quoteLess(price, per),
      body: `That is DLA's list price. There is no past award to compare, and DLA often pays less.${quantityLine(o, now)}`,
      sourceDate: LIST_PRICE_SOURCE,
      ceiling,
    };
  }

  // An award with no day. We do not know when, and saying it is old would be as
  // false as saying it is recent.
  if (!priceDate) {
    return {
      kind: "stale",
      headline: quoteLess(price, per),
      body: `That is what DLA paid last time. The paperwork does not say when, so check your own cost too.${quantityLine(o, now)}`,
      sourceDate: "date not given",
      ceiling,
    };
  }

  const months = monthsSince(priceDate, now);
  const when = monthYear(priceDate);

  // PRECEDENCE. The unit guard runs first: it called unitNoun() directly once,
  // which falls back to the raw code, producing "Keep it under $6.15 for each
  // XX". Quantity is the LAST question asked.
  if (months > MONTHS_USABLE) {
    return {
      kind: "stale",
      headline: quoteLess(price, per),
      body: `DLA paid that in ${when}, more than two years ago. Costs have likely moved, so check your own cost too.${quantityLine(o, now)}`,
      sourceDate: when,
      ceiling,
    };
  }

  if (o.quantity == null) {
    return {
      kind: "ageing",
      headline: `DLA paid ${price} ${per} last time.`,
      body: "The order paper does not say how many they want this time. Read it before you price it.",
      sourceDate: when,
      // The unit is nameable and the award is inside 24 months, so the per-unit
      // ceiling is still the one number she can act on.
      ceiling,
    };
  }

  const totalLine = quantityLine(o, now);

  if (months <= MONTHS_FRESH) {
    return {
      kind: "fresh",
      headline: quoteLess(price, per),
      body: `That is what DLA paid last time. The lowest price that can deliver on time usually wins.${totalLine}`,
      sourceDate: when,
      ceiling,
    };
  }

  // 12-24 months. Older awards returned above, before the quantity question,
  // so this is the last branch.
  return {
    kind: "ageing",
    headline: quoteLess(price, per),
    body: `DLA paid that in ${when}. Costs may have moved since then.${totalLine}`,
    sourceDate: when,
    ceiling,
  };
}

// There is no estimatedCashOut() here on purpose.
//
// It used to exist, as orderValue × (1 - 0.25). We do not know her margin. That
// 25% was invented, rendered to her as "roughly what this one costs you up
// front", compounded into her cash ceiling by the answer buttons, and then used
// to remove orders from her board — three fabrications standing on one made-up
// constant, all of it on the money path. Same class of defect as the invented
// CL: 100 multiplier that was cut from units.ts.
//
// What we actually know is orderValue(): a record fact. The cash question is
// asked against that, and her answer is used to RANK, never to hide.

/**
 * What DLA has actually paid for this stock number — the record, not advice.
 *
 * Deliberately NOT a table. HigherGov renders this same data as nine columns
 * led by the winning company's name; Keepa renders the analogous data as a
 * colour-coded chart its own vendors call "an extremely valuable skill" to
 * read. Both answer a professional's question. Hers is narrower — how much room
 * do I have on price — and that is a range and a recency, which are sentences.
 * See research/awards-design-2026-08-19.md takeaways 1-3.
 *
 * It never produces a ceiling. `priceAdvice().ceiling` stays the only object any
 * surface reads for "what to charge" (D-A5); two sources of a price instruction
 * is the defect that took three rounds to clear.
 *
 * Company names, CAGE codes and contract numbers are held in the model and
 * never rendered — a name here is a name she might ring, which is the exact
 * inference the supplier concept was removed for.
 */
export type AwardHistory = {
  headline: string;
  body: string;
  /** Most recent first, capped. One row per distinct PRICE EVENT — a date and
   *  a price — not one row per award record.
   *
   *  Two live patterns force this, and both were found by rendering rather than
   *  reading. A contract and its modification (`…P00001`) arrive as two awards
   *  on the same day at the same price: one purchase, not two. And `contract`
   *  is not an identifier at all on FedMall rows — twenty awards on one stock
   *  number all carry the literal string "FedMall Army", so keying on it
   *  collides. Collapsing on date and price is true to what she is reading the
   *  block for, which is the price points. */
  recent: { key: string; when: string; price: string }[];
  older: number;
  /** The window the range is drawn from, so the copy can name it. */
  windowMonths?: number;
};

const RECENT_SHOWN = 5;

export function awardHistory(o: MicroOrder, now: Date | null): AwardHistory | null {
  // The range this block states is drawn from a 24-month window on the
  // corpus's day. With no day there is no window, so the block renders nothing
  // rather than range over awards it cannot age — see corpusNow().
  if (now == null) return null;
  if (o.awards.length === 0) {
    // The price block reads lastPricePerUnit; this block reads awards[]. When
    // they disagree the page contradicts itself, so the "never bought" claim is
    // only made when there is also no price. Otherwise we hold a price whose
    // history we cannot see, and we say that instead.
    // Same source as the price block (pricePoint), so the two cannot disagree.
    // Testing the raw field instead let a price with no date render as
    // "DLA paid $X" an inch under "DLA has no record of buying this before."
    if (pricePoint(o) != null) {
      return {
        headline: "Only the last price DLA paid is available at source.",
        body: "Older orders are not in the source data.",
        recent: [],
        older: 0,
      };
    }
    return {
      headline: "DLA has no record of buying this before.",
      // No guess about why. The previous zero state speculated — "it may be new,
      // or it may not have been bought in a while" — and we know neither.
      // The price block above falls back to DLA's list price, so this block
      // says where that figure came from rather than telling her to ignore it.
      body: usablePrice(o.standardPrice)
        ? "There is no past price. The price above is DLA's list price."
        : "There is no past price. Work from what it costs you.",
      recent: [],
      older: 0,
    };
  }

  // Only awards carrying a real cost say anything about price. Dropping one
  // with a null cost is not the same as averaging it away (D-A4).
  //
  // The cost and SURPLUS tests live in usableAward(), shared with the price
  // block above — they used to live only here, which is how the instruction
  // came to be built on a used-goods price this block deliberately excluded.
  // The age filter stays local: the RANGE below is drawn from the last 24
  // months. The instruction above still prices from an older award (owner's
  // call, 2026-09-15), and this block says how old that award is.
  const all = o.awards.filter(usableAward).sort((a, b) => (a.awardedOn < b.awardedOn ? 1 : -1));
  const priced = all.filter((a) => monthsSince(a.awardedOn, now) <= MONTHS_USABLE);
  if (priced.length === 0) {
    if (all.length === 0) return null;
    // We hold prices, but every one is older than the 24-month range.
    return {
      headline: `DLA has bought this ${all.length === 1 ? "once" : `${all.length} times`}.`,
      body: `The most recent was ${monthYear(all[0].awardedOn)}, more than two years ago. The price above comes from it.`,
      recent: [],
      older: 0,
      windowMonths: MONTHS_USABLE,
    };
  }

  // NEVER a price without its unit resolved (D-A1). On a unit of HD these
  // figures are per HUNDRED; saying "each" here is the 100x error.
  const noun = isKnownUnit(o.unitOfIssue) ? unitNoun(o.unitOfIssue) : null;

  // One entry per distinct date+price. See the `recent` docblock: a contract
  // modification and a same-day double award are one price event to her.
  const events = new Map<string, { awardedOn: string; unitCost: number }>();
  for (const a of priced) {
    // Keyed on the RENDERED price, not the raw one. `usd()` rounds at $100,
    // so two costs four decimals apart dedupe as distinct and then print the
    // same string — the duplicate row this map exists to prevent, walking back
    // in through the rounding. Two rows that read identically ARE identical.
    const k = `${a.awardedOn}|${usd(a.unitCost as number)}`;
    if (!events.has(k)) events.set(k, { awardedOn: a.awardedOn, unitCost: a.unitCost as number });
  }
  const distinct = [...events.values()];

  const costs = priced.map((a) => a.unitCost as number);
  const low = Math.min(...costs);
  const high = Math.max(...costs);
  const newest = distinct[0];
  const times =
    distinct.length === 1 ? "once" : distinct.length === 2 ? "twice" : `${distinct.length} times`;

  // D-A1 IN FULL: "a unit we cannot name means we show no price" — not "drop
  // the words 'for each'".
  //
  // This branch used to be `const per = noun ? ... : ""`, which omitted the
  // clause and printed everything else anyway: the range, the most recent
  // price, and up to five dated rows. Seven money figures with nothing on the
  // block saying what they are per, and — unlike priceAdvice()'s matching
  // branch — no disclosure sentence of its own. On a unit of HD those figures
  // are per HUNDRED. Saying nothing is not safer than saying "each"; it is the
  // same 100x error with the evidence removed.
  //
  // Not reachable on today's corpus (mp-091 is the only unnameable-unit record
  // and it carries no awards) — but 96.5% of live records carry awards and 9%
  // are non-EA against a table of sixteen codes, so the first live code outside
  // that table lands here. D-B3: a state nothing reaches today is still a state.
  //
  // Refuses the same way the "too old to price from" branch above does: keep
  // the count, which is a record fact that needs no unit, name the reason, and
  // render no money and no rows. Returning null instead would drop "DLA has
  // bought this five times" — true, useful, and not a price.
  if (noun == null) {
    return {
      headline: `DLA has bought this ${times}.`,
      // Says what is missing and why, rather than repeating priceAdvice()'s
      // instruction verbatim 60px above it — the same sentence twice on one
      // screen is the D-E4 this feature has shipped four times. The withdrawal
      // NAMES ITSELF: a block that simply had no prices in it would read as a
      // record with no prices, which is a different and false fact.
      body: `The prices are not shown. ${COUNT_UNCLEAR}`,
      recent: [],
      older: 0,
      windowMonths: MONTHS_USABLE,
    };
  }
  const per = ` for each ${noun}`;

  return {
    headline: `DLA has bought this ${times}.`,
    // The SPREAD, not an average. What she is deciding is how much room she has,
    // and a mean hides exactly that.
    body:
      distinct.length === 1
        ? // "every time" reads wrong when there was one time, and "the last was"
          // implies others. One award gets its own sentence.
          `They paid ${usd(low)}${per}, in ${monthYear(newest.awardedOn)}.`
        : low === high
          ? `In the last two years they paid ${usd(low)}${per} every time. The last was ${monthYear(newest.awardedOn)}.`
          : `In the last two years they paid between ${usd(low)} and ${usd(high)}${per}. The last was ${usd(newest.unitCost)} in ${monthYear(newest.awardedOn)}.`,
    recent: distinct.slice(0, RECENT_SHOWN).map((a) => ({
      // Unique by construction, because `distinct` is keyed on exactly this.
      key: `${a.awardedOn}|${a.unitCost}`,
      // Full day-month-year, not just the month: two awards in one month at one
      // price rendered as two identical rows, which reads as a bug. It is also
      // the house date rule.
      when: dayMonthYear(a.awardedOn),
      price: usd(a.unitCost as number),
    })),
    older: Math.max(0, distinct.length - RECENT_SHOWN),
  };
}

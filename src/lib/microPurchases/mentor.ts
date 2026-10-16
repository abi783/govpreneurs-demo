// When a mentor should look at a quote before it goes to DLA.
//
// Mandatory exactly once. Suggested on triggers. NEVER blocking a fast award —
// a fast-award order can be bought at any moment, so a 24-hour review round trip
// on one loses it, and mandating review there actively harms her.
//
// The highest-value trigger is also the cheapest: a price far below what DLA
// last paid is almost always the unit-of-issue error — she read "500" and priced
// per item against a unit of hundreds. Catching that one case pays for the
// feature.
import type { MicroOrder } from "./order";
import { unitBasis } from "./units";
import { orderValue, priceAdvice } from "./pricing";

export type MentorTrigger = {
  id: string;
  /** required: she has never quoted. suggested: everything else. */
  level: "required" | "suggested";
  headline: string;
  body: string;
};

export type QuoteDraft = {
  /** The price she is ABOUT to send. We do not know it in v1 — she types it on
   *  DLA's site, not ours — so this is null and the price-low rule below cannot
   *  fire. Recorded as a gap rather than papered over: it used to be passed
   *  `o.lastPricePerUnit`, which made the rule compare DLA's price against
   *  itself and silently never trigger. See PRD 4.1. */
  pricePerUnit: number | null;
  deliveryDays: number | null;
};

export type MentorContext = {
  hasQuotedBefore: boolean;
  /** The largest order VALUE she has quoted, in dollars — never a count. */
  largestOrderValueSoFar: number;
  /** Triggered reviews already asked for this week — the capacity guard. */
  reviewsThisWeek: number;
  /** WHICH week that count belongs to, as `weekOf()` writes it.
   *
   *  Without this the counter never reset and `MENTOR_CAP_REACHED` promised
   *  "You can ask again on Monday" over a number nothing on Monday changed. A
   *  promise no code implements is worse than no promise: she waits, comes back,
   *  and the control says the same thing.
   *
   *  Optional, and an absent stamp means "no week recorded" — the count is then
   *  trusted as given. That is the right default for the surfaces, because the
   *  store applies `reviewsUsed()` itself on every read: the `reviewsThisWeek`
   *  that comes out of `getMicroState()` already belongs to this week, so a
   *  component re-passing the stamp would only be asking the same question
   *  twice. The one caller that must pass it is the store. */
  reviewsWeek?: string | null;
};

/**
 * The one fact about the ORDER that the triggers below cannot read for
 * themselves: its acquisition code is one we cannot rule on
 * (`restrictionOf(o).route === "unknown"`).
 *
 * Passed in rather than re-derived here. The letter set has one owner and it is
 * relevance.ts; a copy of it in this file is `D-E4`, and importing it back would
 * make the two modules circular for a single boolean the caller already holds.
 */
export type MentorAsk = { codeUnknown?: boolean };

/**
 * Returns the strongest trigger, or null. Order matters: the required one wins,
 * then the money mistakes, then the commitments.
 *
 * `now` is the SERVED CORPUS'S day, and it is required. Two triggers read what
 * DLA paid, and `pricing.ts` withdraws that figure once the award is older than
 * it will price from — so the day decides whether the price check can fire at
 * all. It is a fact about the order, so it takes the order's clock; see
 * `corpusNow()`.
 */
export function mentorTrigger(
  o: MicroOrder,
  draft: QuoteDraft,
  ctx: MentorContext,
  now: Date | null,
  ask: MentorAsk = {},
): MentorTrigger | null {
  // A code we cannot rule on is not a quote question, and it wins outright:
  // every trigger below asks whether a PRICE or a COMMITMENT is safe, and there
  // is no price on an order she may not bid yet. Both strings are already on
  // that screen — the control's own label, and the sentence `restrictionOf()`
  // renders from this file — so nothing new is said here.
  if (ask.codeUnknown) {
    return {
      id: "code-unknown",
      level: "suggested",
      headline: "Ask a mentor",
      body: ASK_MENTOR_FIRST,
    };
  }

  if (!ctx.hasQuotedBefore) {
    return {
      id: "first",
      level: "required",
      // "your first one" dropped the noun — first order, first price, first
      // anything? The body supplies it, but the headline is the line she is
      // guaranteed to read and it stood alone. Says what is checked, and when.
      headline: "A mentor checks your first price before you send it.",
      body: "You have not sent a price to the government before. A mentor checks it first. This happens once.",
    };
  }

  // The unit-of-issue catch, expressed as money rather than as a code.
  //
  // Compared against `priceAdvice().ceiling`, never the raw `last_price` field
  // and never `pricePoint()` either (`D-A5`).
  //
  // `last_price` IS the newest award's cost, so on a record whose newest award
  // is SURPLUS it is the used-goods price. pricePoint() drops that one — but it
  // does not judge AGE, deliberately, so on mp-003 it still hands back a
  // November 2023 price and this trigger said "DLA paid much more than this
  // last time" from the very figure the price block on the same page calls too
  // old to price from.
  //
  // The ceiling is null exactly when we will not stand behind the price, which
  // is the question being asked here, and it is stated PER UNIT OF ISSUE — the
  // same basis as `draft.pricePerUnit`, which she types against DLA's unit. One
  // ceiling, one owner; this file never re-derives it.
  const paid = priceAdvice(o, now).ceiling;
  if (draft.pricePerUnit != null && paid != null && draft.pricePerUnit < paid.amount * 0.6) {
    return {
      id: "price-low",
      level: "suggested",
      headline: "Your price looks very low.",
      body: "DLA paid much more than this last time. Check whether your price is for one item or for one box.",
    };
  }

  // TWO arms, because the unit of issue has three states and only one of them
  // is plain each. `isMultiplied()` used to be false for the eleven nouns we
  // can name but hold no multiplier for, for every unrecognised code and for a
  // null unit — so on mp-006, 1,138 PACKAGES at $22.88, this trigger did not
  // fire at all and the record fell through to `repeats` (D-B8). units.ts now
  // answers the three-state question; this reads the state rather than the
  // boolean, because the copy below is only true of one of them.
  //
  // "Not sold by the piece" is a claim about a unit we can READ. On one we
  // cannot, we say what we do not know instead — abstain rather than guess —
  // and it is at least as loud, because it is the state where she can price per
  // item against a container and find out on a binding contract.
  const basis = unitBasis(o.unitOfIssue);
  if (basis === "multiplied") {
    return {
      id: "unit",
      level: "suggested",
      headline: "This one is not sold by the piece.",
      // "your maths" — British, in shipped member copy, on a US product for a
      // member learning American English who should not have to absorb two
      // spellings of one word. "Numbers" is plainer than either.
      body: "Orders measured this way are where sellers lose money. A mentor can check your numbers.",
    };
  }
  if (basis === "unknown") {
    return {
      id: "unit-unknown",
      level: "suggested",
      headline: "The order paper does not say how this one is counted.",
      body: "It may not be sold by the piece. Orders like this are where sellers lose money. A mentor can check your numbers.",
    };
  }

  // `=== true`, not truthiness. A suggestion is a claim about the order, so an
  // order whose paper did not say gets no prompt rather than a wrong one.
  if (o.repeats === true) {
    return {
      id: "repeats",
      level: "suggested",
      headline: "This order lasts a year.",
      body: "The price you send now is the price for the whole year.",
    };
  }

  const v = orderValue(o, now);
  if (v != null && ctx.largestOrderValueSoFar > 0 && v > ctx.largestOrderValueSoFar * 2) {
    return {
      id: "bigger",
      level: "suggested",
      headline: "This is much bigger than your usual order.",
      body: "It is more than twice the size of anything you have done.",
    };
  }

  if (o.needsDrawings) {
    return {
      id: "drawings",
      level: "suggested",
      headline: "This one needs drawings.",
      body: "A mentor can tell you whether it is worth getting approved for them.",
    };
  }

  return null;
}

/**
 * What the surface does with a trigger, once the fast-award rule and the weekly
 * cap are applied. This is where "required" quietly becomes "warned" rather than
 * stranding her on an order that can close at any moment.
 */
export type MentorDecision =
  | { mode: "none" }
  | { mode: "required"; trigger: MentorTrigger }
  | { mode: "suggested"; trigger: MentorTrigger }
  | { mode: "warn-only"; trigger: MentorTrigger; reason: string };

export function mentorDecision(
  o: MicroOrder,
  draft: QuoteDraft,
  ctx: MentorContext,
  now: Date | null,
  ask: MentorAsk = {},
): MentorDecision {
  const t = mentorTrigger(o, draft, ctx, now, ask);
  if (!t) return { mode: "none" };

  // The ask-a-mentor control on an unrulable code, which is reachable from
  // THE CODE-UNKNOWN BRANCH IS GONE WITH THE CAP (24 Aug 2026). It used to
  // return `warn-only` carrying the cap sentence once the week was spent, and
  // `suggested` otherwise. There is no weekly capacity to spend any more: the
  // mentor control is the $⁠97 wallet review, it renders on every order, and
  // nothing meters it. A member on an unrulable code reaches a human the same
  // way she does anywhere else.

  // A fast award can be bought before the closing date. Never hold her here.
  if (o.fastAward) {
    // A REQUIRED review demoted by this rule cannot keep the required copy.
    // The block rendered headline, body, then reason — "A mentor will look at
    // your first one." / "A mentor checks it first." / "Send it now" — three
    // sentences, the first two false for this order, and the reader who is
    // slowest in English acts on the first two.
    if (t.level === "required") {
      return {
        mode: "warn-only",
        trigger: {
          ...t,
          headline: "You can send this one now.",
          // "a check" was MONEY here. On a surface about prices, invoices and
          // getting paid, a member reading in order takes "this one cannot wait
          // for a check" to mean the payment cannot wait — a word she can read
          // perfectly and still understand as the wrong thing, which is worse
          // than one she cannot read at all, because nothing signals that she
          // has misunderstood. The concrete noun instead: a mentor, looking.
          body: "You have not sent a price before. There is not time for a mentor to look at it first.",
        },
        reason: "DLA can buy this one at any time. A mentor will look at your next one.",
      };
    }
    return {
      mode: "warn-only",
      trigger: t,
      reason:
        "This one can be bought at any time. Send it now. A mentor will look at your next one.",
    };
  }

  if (t.level === "required") return { mode: "required", trigger: t };

  // The capacity guard that stood here is gone with the cap: it downgraded an
  // offer to a bare warning once the week was spent. Nothing is metered now.

  return { mode: "suggested", trigger: t };
}

/** Promised turnaround, shown before she asks rather than after. */
/**
 * The service promise — a REQUIREMENT on the build, not a description of it.
 *
 * In this prototype the request is recorded and nothing queues it. The earlier
 * copy said "Sent. A mentor looks at this within one working day." the instant
 * she tapped, which claims a named human read a priced quotation that
 * nobody read. That is worse than offering no review, because it removes her
 * reason to get the free APEX one that would have caught the error.
 *
 * So the prototype says what is true here, and the PRD carries the promise as
 * the thing the production build must honour (a rota, a queue, and a real
 * pending state). See PRD 15 B10.
 *
 * ONE CONSTANT FOR ONE EVENT. There were two: this, and `MENTOR_SENT` in the
 * order route, already diverged. This one said "a mentor reads it before it
 * goes" — true on the quote path, where "it" is a price on its way to DLA, and
 * FALSE on the other, where she asked a question about who may sell a part and
 * nothing is going anywhere. That falsehood is why the second copy was written,
 * so the fix is not to pick one of them but to say the thing that is true on
 * both: a mentor LOOKS AT THIS ONE. The route's verb, kept; the route's copy,
 * deleted (lane A). The mentor voice lives in this file, with ASK_MENTOR_FIRST.
 *
 * The "in the real product" hedge stays, deliberately — see above, and PRD 15
 * B10 quotes this constant.
 */

/**
 * The mentor step on an acquisition code we cannot rule on — AMSC `D`.
 *
 * Written here, with the rest of the mentor voice, and read by
 * `restrictionOf()` in relevance.ts. One fact, one owner (`D-E4`): the same
 * sentence will be needed on the button that renders it, and a second copy of
 * it would diverge the way `SKIP_THIS_ONE` once did.
 *
 * **Why this is a constant and not a `mentorTrigger()` case.** Every trigger
 * above is read by `SendToDla`, which renders only on an order she may bid. A
 * `D` order is restricted, so `SendToDla` never mounts on it and a trigger
 * added to `mentorTrigger()` would be an export nothing can reach (`D-D9`).
 * The route she is told to take therefore has no button behind it yet — the
 * restricted page and the order page carry no mentor control. That is a
 * sentence without a destination (§4.7, §4.11) and it is **escalated**, not
 * papered over: the pages are owned by another lane this round.
 *
 * The wording is the `drawings` trigger's, deliberately — "a mentor can tell
 * you whether it is worth getting approved" is the same job, and she should
 * meet the same sentence for the same situation.
 */
export const ASK_MENTOR_FIRST = "Ask your mentor before you spend time on this one.";

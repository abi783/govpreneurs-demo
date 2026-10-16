/**
 * DH-09 — NO THREE-STATE FIELD IS EVER `false`, OVER THE WHOLE LIVE CORPUS.
 *
 * ── THE RULE ──────────────────────────────────────────────────────────────
 *
 * `true` means true. Everything else means we do not know. A `false` on one of
 * these fields is an artifact of an ingest that wrote `?? false` for the whole
 * life of the collection, never evidence of "no" (D3). The surface renders a
 * `false` as "not a year of orders", "no drawings needed" or "no fast award" —
 * three claims nobody holds evidence for, on a surface whose first rule is that
 * everything it says is true.
 *
 * The two places the rule can be BROKEN are the ingest and the mapper, and both
 * are pinned on the backend, in
 * `backend/src/small-orders/small-orders.three-state.spec.ts`. **This file pins
 * the OUTPUT.** It sweeps the committed mapper output and fails if a single
 * `false` reaches an order, whichever half let it through.
 *
 * ── WHY THE FIXTURE IS THE REFEREE ────────────────────────────────────────
 *
 * `liveMapperOutput.fixture.ts` is the real output of the backend's
 * `mapOpportunityToMicroOrder()` over live-shaped documents. It is generated and
 * committed, not hand-written, so it cannot drift from the mapper the way a
 * hand-written `MicroOrder` would. Both sets are swept: the uncategorised orders
 * are mapper output too, and a rule that held on one set and not the other would
 * be a rule about the category table.
 *
 * ── WHAT IS DELIBERATELY NOT SWEPT ────────────────────────────────────────
 *
 * `MicroAward.surplus` is `boolean | null` as well, and it is NOT here. It sits
 * on an AWARD, not on an order, and DLA states its `false`: "this award was not
 * for surplus goods" is evidence, so sweeping it would delete a fact rather than
 * protect one.
 *
 * `soleSourceFlag` is a named exclusion (A8) and it never reaches a
 * `MicroOrder` at all. Its reason is recorded in the backend spec above.
 */
import { describe, it, expect } from "vitest";
import { LIVE_MAPPED_ORDERS, LIVE_MAPPED_UNCATEGORISED } from "./liveMapperOutput.fixture";
import { type MicroOrder } from "./order";

/** Every key of `T` whose value type is exactly `boolean | null`. */
type BooleanNullFieldOf<T> = {
  [K in keyof T]-?: [T[K]] extends [boolean | null]
    ? [boolean | null] extends [T[K]]
      ? K
      : never
    : never;
}[keyof T];

/**
 * The four `MicroOrder` fields typed `boolean | null`.
 *
 * `satisfies` makes the list COMPLETE at compile time, in both directions: a
 * fifth such field added to `MicroOrder` fails this file to build until it is
 * swept too, and a name that is not one of them fails as well. A hand-kept list
 * would silently stop covering the type it is about.
 */
const THREE_STATE_FIELDS = {
  fastAward: true,
  repeats: true,
  needsDrawings: true,
  fobDestination: true,
} satisfies Record<BooleanNullFieldOf<MicroOrder>, true>;

const FIELD_NAMES = Object.keys(THREE_STATE_FIELDS) as ReadonlyArray<
  BooleanNullFieldOf<MicroOrder>
>;

/** Both sets, because both are mapper output. */
const CORPUS: readonly MicroOrder[] = [...LIVE_MAPPED_ORDERS, ...LIVE_MAPPED_UNCATEGORISED];

describe("three-state discipline over the live corpus", () => {
  it("serves false on no three-state field, on any order", () => {
    const served = CORPUS.flatMap((order) => FIELD_NAMES.map((field) => order[field]));

    // Non-vacuous: the corpus is real committed output, every field of every
    // order is read, and the set holds both of the two states the rule allows.
    expect(CORPUS.length).toBeGreaterThan(0);
    expect(served).toHaveLength(CORPUS.length * FIELD_NAMES.length);
    expect(served).toContain(true);
    expect(served).toContain(null);
    expect(served).not.toContain(false);
  });

  it.each(FIELD_NAMES)("%s is never false", (field) => {
    const falseOnes = CORPUS.filter((order) => order[field] === false);

    // The ids, not the count: a failure names the orders to go and look at.
    expect(falseOnes.map((order) => order.id)).toEqual([]);
  });
});

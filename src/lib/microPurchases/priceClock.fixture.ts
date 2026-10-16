// TEST DATA. Nothing in `src/` may import this at runtime.
//
// ONE ORDER THE TWO DAYS DISAGREE ABOUT.
//
// Every clock case over the price ladder needs the same thing: a record whose
// newest award is inside 24 months of the SERVED corpus's day and past 24
// months of the SAMPLE corpus's frozen `TODAY`. On that record the corpus's day
// stands behind a price and states a value, and the sample's day withdraws
// both — so a surface reading the wrong day says something visibly different.
//
// It lives here, once, because three specs rule over it: the ladder and the
// board (`pricing.clock.test.ts`), and the two cards that render money
// (`orderPrice.clock.test.tsx`). A second copy of a corpus is a second corpus.
//
// The order is REAL MAPPER OUTPUT, picked by the properties each case needs
// rather than by id, and exactly one field moves. A hand-written `MicroOrder`
// is a shape nobody checked against the ingest — the reuse registry's rule for
// `liveMapperOutput.fixture.ts`.
import { LIVE_AS_OF, LIVE_MAPPED_ORDERS } from "./liveMapperOutput.fixture";
import { acceptsQuotesNow, mayBid } from "./relevance";
import type { MicroOrder } from "./order";

/**
 * The day the award moves to.
 *
 * The straddle is ASSERTED in `pricing.clock.test.ts` against `monthsSince()`
 * rather than trusted here, so no case can pass because the two days happened
 * to agree.
 */
export const STRADDLE_AWARD_DAY = "2024-08-01";

/**
 * A live order the board can rule on and price: her codes let her bid it, DLA
 * is taking quotes on it, it is still open on the served day, it states a
 * quantity, and its record carries an award with a unit of issue we can name.
 *
 * MORE THAN ONE UNIT, deliberately. On a quantity of one the order's TOTAL and
 * the per-unit price DLA paid render as the same string, and a card that had
 * withdrawn the total would still carry that string in the sentence explaining
 * why — so an assertion on the total would pass on a card that shows none.
 */
const BIDDABLE = LIVE_MAPPED_ORDERS.find(
  (o) =>
    mayBid(o) &&
    acceptsQuotesNow(o) &&
    o.quantity != null &&
    o.quantity > 1 &&
    o.unitOfIssue != null &&
    o.awards.length > 0 &&
    (o.closesOn == null || o.closesOn >= LIVE_AS_OF),
);

if (BIDDABLE == null) {
  // The generated corpus no longer holds an order these cases can rule on, so
  // the cases would pass over nothing. Say so here rather than in six places.
  throw new Error("liveMapperOutput.fixture.ts holds no biddable, priced, open order");
}

/**
 * The same order with ONE date moved.
 *
 * `lastPriceDate` mirrors `awards[0].awardedOn` on a real record, so it moves
 * with it. The single award keeps the newest one unambiguous.
 */
export const STRADDLING_ORDER: MicroOrder = {
  ...BIDDABLE,
  awards: [{ ...BIDDABLE.awards[0], awardedOn: STRADDLE_AWARD_DAY }],
  lastPriceDate: STRADDLE_AWARD_DAY,
};

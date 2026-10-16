// The wall clock — the real day.
//
// TWO CLOCKS MEET ON THIS SURFACE, AND THEY ANSWER DIFFERENT QUESTIONS.
//
// The CORPUS DAY is `SmallOrdersFeed.asOf`: the day the served board is for.
// Every fact about an ORDER is measured against it — when DLA posted it, when
// it closes, how old its last award is. That clock has one owner and it is the
// feed (D2).
//
// The WALL CLOCK is this module: the day it is in the real world. Every fact
// about the MEMBER is measured against it — when she sent a quote, when we
// promised to ask her again, when her SAM registration runs out.
//
// The two are not the same day, and the gap is not fixed. The corpus's day
// trails the real day by as far as the ingest is behind, which the goal
// document measured in days at one point and in a month at another. So a
// member's action stamped with the corpus's day is dated before she took it,
// and a real deadline compared against the corpus's day is answered late.
//
// SAM is where that costs her. Renewal is a legal deadline in the real world.
// If her registration lapsed after the day the corpus is for, the corpus's day
// still calls it active — and an expired registration disqualifies every quote
// she sends, silently.
//
// This is NOT a licence to read a wall clock for an order. `relevance.ts` and
// `pricing.ts` say at length why a wall clock there is a second clock over a
// frozen corpus, and that stands. Ask which the value is ABOUT, and take the
// clock of its subject.

/** How many characters of an ISO instant are its day. */
const ISO_DAY_LENGTH = 10;

/** The real instant, now. The one wall-clock read on this surface. */
export function wallClockNow(): Date {
  return new Date();
}

/** The real day as `YYYY-MM-DD`, so it compares against a stored day as a plain
 *  string. UTC, because every day this feature stores comes off `toISOString()`
 *  — the stamp and the comparison must slice the same way or they disagree for
 *  part of every day. */
export function wallClockDay(): string {
  return isoDay(wallClockNow().toISOString());
}

/** The day part of a stored instant. */
export function isoDay(instant: string): string {
  return instant.slice(0, ISO_DAY_LENGTH);
}

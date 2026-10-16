// Small orders — what the app holds BEFORE the feed lands.
//
// This module used to seed itself with the 25 committed sample records so the
// board was never blank, and the feed endpoint answers in 13 to 21 seconds. For
// the whole of that wait every surface drew made-up orders and named them as
// the board: nine of those records were written by hand and none of them are
// orders she can bid.
//
// The regression this file exists to catch is a single character — restoring
// an initial value to `corpus` in `feed.ts`. Nothing else on the surface would
// look wrong, because a board full of sample orders is exactly what the defect
// looked like the first time.
//
// Its own file because `feed.ts` keeps module-level state. A test that ran
// after one which called `loadFeed()` would read that call's result, and
// "before any request" is the one thing this has to assert.

import { describe, expect, it } from "vitest";
import { getBoardFeed, queryBoard } from "./feed";
import { NO_FILTERS, EMPTY_CONTEXT } from "./relevance";

describe("first paint, before any request", () => {
  it("holds no feed at all — not the bundled corpus, and not an empty one", () => {
    // `undefined`, precisely. `null` is the OTHER state, and it is the one that
    // renders "Today's orders from DLA did not load." — a sentence that is
    // false about a request nobody has made yet.
    expect(getBoardFeed()).toBeUndefined();
  });

  it("reports the board as not arrived, so no surface claims a quiet day", () => {
    const result = queryBoard({ filters: NO_FILTERS, sort: "best" }, EMPTY_CONTEXT, getBoardFeed());

    // `feedArrived` is what `EmptyState` and Hunter's verdict both read. False
    // here keeps "Nothing today. That is normal." off a board we have not
    // fetched — the empty board and the unfetched board are not the same fact.
    expect(result.feedArrived).toBe(false);
    expect(result.rows).toHaveLength(0);
  });
});

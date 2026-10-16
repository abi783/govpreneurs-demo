// The page-header intro, in ONE module, because the feed and the Pilot backdrop
// print the same sentence and a second copy is a second thing to keep true.
//
// Two sentences, not one. The feed holds a real corpus figure once
// `/opportunities/all` answers; the backdrop fires no request at all and can
// never hold one. A sentence that needs a number in one place and not in another
// is two sentences — so the count-free variant drops the figure and stands
// NOTHING in for it. A zero, a dash or a rounded claim would each say we counted.
import { GlossTerm } from "../ui/GlossTerm";

/** Digit grouping is pinned, so the figure reads the same in every browser locale. */
const COUNT_LOCALE = "en-US";
/** Measure of the intro paragraph, in pixels. Matches the header it sits under. */
const INTRO_MAX_WIDTH_PX = 620;

/** The clause that teaches the three verdict words, each glossed where it is read. */
function VerdictClause() {
  return (
    <>
      bins each one as <GlossTerm term="Bid">Bid</GlossTerm>,{" "}
      <GlossTerm term="Review">Review</GlossTerm>, or <GlossTerm term="No Bid">No Bid</GlossTerm>{" "}
      based on how you actually work.
    </>
  );
}

/** The feed's intro sentence. `count` is the real corpus total, and null until
 *  `/opportunities/all` answers — the Pilot backdrop always passes null. */
export function FeedIntro({ count }: { count: number | null }) {
  return (
    <p className="t-body-sm" style={{ marginTop: "var(--s-2)", maxWidth: INTRO_MAX_WIDTH_PX }}>
      {count === null ? (
        <>Hunter reads every federal and state/local (SLED) opportunity published overnight and </>
      ) : (
        <>
          Hunter scans <span className="of-num">{count.toLocaleString(COUNT_LOCALE)}</span> federal
          and state/local (SLED) opportunities every morning and{" "}
        </>
      )}
      <VerdictClause />
    </p>
  );
}

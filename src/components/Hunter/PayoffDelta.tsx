// The payoff reveal shown after an enrichment milestone: "+N unlocked" plus, when
// any already-matched opps moved up a tier, "· N got stronger". Pure presentational
// — it renders exactly the backend `PayoffDelta` (unlocked + sharpened), never a
// fabricated total. The gain leads in the positive/awarded token (`--pos-9`); the
// sharpened count trails, muted. No icon, no motion — the "+" and the color carry it.
import type { PayoffDelta as PayoffDeltaValue } from "../../lib/enrichment";

/** How much of the journey one reading covers: this milestone, or everything so far. */
export type PayoffScope = "milestone" | "total";

/** The sentence around the numbers, per scope. The NUMBERS are the backend's in
 *  both cases — only the framing changes, so a running total never reads as a
 *  fresh gain, and neither zero state claims the answer was wasted. */
const SCOPE_COPY: Record<PayoffScope, { prefix: string | null; none: string }> = {
  // Both numbers can legitimately be zero — most often because the embedding
  // field-texts (specializations, differentiators, capability summary…) are not
  // part of the rule-based gate at all, so they CANNOT unlock opportunities.
  // "+0 unlocked" reads as "that was pointless". State the plain fact instead;
  // deliberately NOT "this sharpens your matches", which would overclaim for a
  // gate answer that simply matched nothing.
  milestone: { prefix: null, none: "Saved — no new matches opened from this one" },
  total: { prefix: "So far", none: "Nothing has opened up yet" },
};

/** Renders the two honest payoff numbers the backend reports, for one milestone
 *  (default) or for the journey's running total (`scope="total"`). */
export function PayoffDelta({
  delta,
  scope = "milestone",
}: {
  delta: PayoffDeltaValue;
  scope?: PayoffScope;
}) {
  const { unlocked, sharpened } = delta;
  const copy = SCOPE_COPY[scope];
  // The running total trails the milestone's own gain, so it is set a step
  // quieter — the member registers what they just earned before the total.
  const className =
    scope === "total" ? "hunter-enrich-payoff hunter-enrich-payoff--total" : "hunter-enrich-payoff";
  if (unlocked === 0 && sharpened === 0) {
    return (
      <span className={className} role="status">
        <span className="hunter-enrich-payoff__none">{copy.none}</span>
      </span>
    );
  }
  return (
    <span className={className} role="status">
      {copy.prefix && <span className="hunter-enrich-payoff__scope">{copy.prefix}</span>}
      <span className="hunter-enrich-payoff__up">+{unlocked} unlocked</span>
      {sharpened > 0 && (
        <>
          <span className="hunter-enrich-payoff__sep" aria-hidden>
            ·
          </span>
          <span className="hunter-enrich-payoff__sharp">{sharpened} got stronger</span>
        </>
      )}
    </span>
  );
}

// The figure primitive — the design system's second always-on pattern made real.
//
// "No naked numbers, ever." Any large or bold figure gets a one-line
// plain-English caption directly beneath saying what it means. The rule has
// existed for months with nothing implementing it, so every surface hand-rolled
// its own (see `.award-fig`).
//
// A `.figure-value` with no `.figure-caption` fails scripts/check-tokens.sh.
// The caption is a required prop here for the same reason: the type system and
// the build check say the same thing, so the rule cannot be forgotten.
import type { ReactNode } from "react";

export function Figure({
  value,
  caption,
  /** When the honest answer is a sentence, not a number. Steps the value down —
   *  a large "no" would shout the least useful thing on the surface. */
  words = false,
  small = false,
  note,
}: {
  value: ReactNode;
  caption: ReactNode;
  words?: boolean;
  small?: boolean;
  note?: ReactNode;
}) {
  return (
    <div className={`figure${small ? " figure--sm" : ""}`}>
      <span className={`figure-value${words ? " figure-value--words" : ""}`}>{value}</span>
      <span className="figure-caption">{caption}</span>
      {note ? <span className="figure-caption mp-figure-note">{note}</span> : null}
    </div>
  );
}

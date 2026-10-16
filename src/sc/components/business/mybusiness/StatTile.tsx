/**
 * StatTile — one `settled / total` figure, shown one of two ways. Used by
 * `ReadinessHeader` for the three tiles that open the page.
 *
 * `kind="bar"` is a filled track — the ordinary case, where `total` can be
 * large enough that a bar reads faster than five pips would. `kind="pips"` is
 * for a small, fixed total (parts done, five of them) where a pip PER PART is
 * more legible than a bar that would only ever move in fifths.
 *
 * THE ONE PLACE ON THIS PAGE THE THREE TILES SHOW A DENOMINATOR AT ALL —
 * see `score.ts`'s header for why, and `mybusiness.css`'s for the other two
 * places this same fraction is printed.
 *
 * COLOUR IS NEVER THE ONLY CARRIER. Each tile has its own icon, its own label
 * and its own figure, so the three stay apart in greyscale and for a reader
 * who cannot separate the hues. `tone` only tints what the other three
 * already say.
 */

import type { ReactElement, ReactNode } from "react";
import { fillPercent } from "@sc/lib/businessProfile/score";
import "./mybusiness.css";

/** Which of the three header tiles this is. Drives the tint, nothing else. */
export type StatTone = "answered" | "parts" | "extras";

export interface StatTileProps {
  label: string;
  settled: number;
  total: number;
  kind?: "bar" | "pips";
  tone: StatTone;
  /** The tile's own mark, already `aria-hidden` by the icon set's own props. */
  icon?: ReactNode;
}

export function StatTile({
  label,
  settled,
  total,
  kind = "bar",
  tone,
  icon,
}: StatTileProps): ReactElement {
  const pct = fillPercent(settled, total);

  return (
    <div className={`mb-stat mb-stat--${tone}`}>
      {icon ? (
        <span className="mb-stat__icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      {/* A TERM AND ITS VALUE, NOT TWO PARAGRAPHS. "Questions answered" and
          "10 of 56" are a pair, and as two `<p>` nothing said so — a screen
          reader met three tiles as six loose lines. The tile keeps its `<div>`
          and the pairing lives in the `<dl>` this renders into, which is the
          grouping HTML has for exactly this and what the prototype uses. */}
      <dt className="mb-stat__label">{label}</dt>
      <dd className="gpds-mono mb-stat__fig">
        {settled} <span className="mb-stat__of">of {total}</span>
      </dd>
      {kind === "bar" ? (
        <div className="mb-stat__bar" aria-hidden>
          <div className="mb-stat__fill" style={{ width: `${pct}%` }} />
        </div>
      ) : (
        <div className="mb-stat__pips" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`mb-stat__pip${i < settled ? " mb-stat__pip--on" : ""}`} />
          ))}
        </div>
      )}
    </div>
  );
}

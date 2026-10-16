/**
 * SectionBreakdown — closed-by-default detail under the header's tiles, one
 * row per part. Each row is `sectionScore` for that part alone, and the five
 * rows sum to `readyScore`'s headline BY CONSTRUCTION: same `readyScore`
 * function, same trade filter, just handed one part's fields (`fieldsIn(part)`)
 * instead of the whole catalog — there is no second walk that could disagree
 * with the total above it.
 *
 * Closed by default (`<details>`, no JS): the headline answers "how am I
 * doing" in one glance; this is for the "where, specifically" question, asked
 * on demand.
 *
 * A ROW PER PART, NOT A TILE PER PART. A gauge is for one figure against a
 * target; the moment you want to COMPARE several you switch to a bullet-style
 * row per item. Five stacked tiles in a narrow column also read as five
 * headlines rather than as the parts of one.
 *
 * THE NUMBER IS ALWAYS PRINTED. Each track carries its own fraction at the
 * end, because the length is supplementary — the value has to survive a
 * member who cannot separate two similar fills, and it has to be there for
 * anyone reading the page aloud. A fraction rather than a bare numerator, so
 * a part that is small and finished does not read as behind a part that is
 * large and barely begun.
 */

"use client";

import type { ReactElement } from "react";
import { CATALOG_PART_IDS, PARTS } from "@sc/lib/businessProfile/parts";
import { fillPercent, sectionScore } from "@sc/lib/businessProfile/score";
import { useRecord } from "./RecordStore";
import "./mybusiness.css";

/**
 * The parts this list walks, IN RAIL ORDER, and the reason it is derived
 * rather than written out.
 *
 * It used to map `CATALOG_PART_IDS`, which is the order the CATALOG AUTHORS
 * its rows in — `parts.ts` says so and says nothing may assume the two are
 * parallel. They are not: authoring order opens with `business`, so "Your
 * legal details" led this list while the rail below it led with "What you
 * sell", and the same five parts were given in two different orders on one
 * screen. `PARTS` is the order she is offered them in, everywhere else.
 *
 * Filtering `PARTS` keeps that true on its own. `digital` holds a form rather
 * than record rows, so it has no fraction to print and drops out here.
 */
const BREAKDOWN_PARTS = PARTS.filter((p) =>
  (CATALOG_PART_IDS as readonly string[]).includes(p.id),
);

export function SectionBreakdown(): ReactElement {
  const { payload } = useRecord();

  return (
    <details className="mb-brk">
      <summary className="mb-brk__toggle">What makes up this total</summary>
      <ul className="mb-brk__list">
        {BREAKDOWN_PARTS.map((part) => {
          const score = sectionScore(part.id as (typeof CATALOG_PART_IDS)[number], payload.fields, payload.media);
          const pct = fillPercent(score.settled, score.total);
          return (
            <li className="mb-brk__row" key={part.id}>
              <span className="mb-brk__name">{part.title}</span>
              <span className="mb-brk__track" aria-hidden>
                <span className="mb-brk__fill" style={{ width: `${pct}%` }} />
              </span>
              <span className="gpds-mono mb-brk__val">
                {score.settled}/{score.total}
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

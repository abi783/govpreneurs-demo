/**
 * ScoreCard — the rail's own copy of the headline fraction, sitting above the
 * five destinations so she can see where she stands without leaving the rail.
 * Reads the same `readyScore` the header does.
 *
 * A NUMBER OVER A BAR, NOT A SECOND SMALL TILE. The Success Center says where
 * a member stands with a big figure, a slash, a horizontal bar and a way on. A
 * member who has seen that card should not have to learn a second visual
 * language for the same kind of fact here, so this is that card with a count
 * in it. The header's three tiles answer "how am I doing"; this answers "what
 * do I do next", and the difference in shape is the difference in question.
 *
 * THE BAR IS DECORATIVE AND SAYS SO. The figure beside it is the value and it
 * is real text, so marking the track up as a meter would announce the same
 * number twice.
 *
 * "Answer the next one" points at the first still-open question's PART, not
 * the field itself — this app has no in-page focus/scroll-to mechanism for a
 * single row (unlike the prototype's `.focus()`), so the link takes her to
 * where the question lives rather than pretending to land on it exactly. It
 * reads `blocking` first, then `open`, so it keeps pointing somewhere while
 * ANY core question is unanswered; nothing renders only when the record is
 * whole.
 *
 * The breakdown sits INSIDE this card, under the figure it breaks down, which
 * is where the source design puts it. It renders here and nowhere else.
 */

"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { fillPercent, readyScore } from "@sc/lib/businessProfile/score";
import { nextQuestion, type NextQuestion } from "@sc/lib/businessProfile/nextQuestion";
import { labelFor } from "@sc/lib/businessProfile/recordView";
import { rowAnchorId } from "@sc/lib/businessProfile/rowAnchor";
import { SectionBreakdown } from "./SectionBreakdown";
import { useRecord } from "./RecordStore";
import "./mybusiness.css";

export interface ScoreCardProps {
  locationId: string;
}

/** Where the link goes and what it is called, decided in one place. */
interface NextTarget {
  href: string;
  label: string;
}

/**
 * Basic Info wins; otherwise the earliest part on the rail with a row open.
 *
 * The hash is the row's own anchor, so she lands ON the question rather than
 * on the screen holding it. A VIRTUAL row — the photo and the logo, which have
 * no `fieldKey` — gets the part without one: an empty `#` would scroll her to
 * the top of the page, which is worse than not scrolling at all.
 */
function linkFor(locationId: string, target: NextQuestion | null): NextTarget | null {
  if (!target) return null;
  const base = `/${locationId}/business`;
  const page = target.part ? `${base}/${target.part}` : base;
  /* The hash is the row's own anchor, so she lands ON the question rather than
     on the screen holding it. A VIRTUAL row — the photo and the logo, which
     have no `fieldKey` — gets the page without one: an empty `#` would scroll
     her to the top, which is worse than not scrolling. */
  return {
    href: target.fieldKey ? `${page}#${rowAnchorId(target.fieldKey)}` : page,
    label: target.fieldKey ? labelFor(target.fieldKey) : "",
  };
}

export function ScoreCard({ locationId }: ScoreCardProps): ReactElement {
  const { payload } = useRecord();
  const score = readyScore(payload.fields, undefined, payload.media);
  /* BASIC INFO FIRST, WHOLE. The fourteen are what a mentor reads before the
     first call and they have a deadline the rest of the record does not, so
     one of them still open outranks any part row — even a tier-1 one. They are
     not a part: they live on the landing screen and their fields are spread
     across all five parts, which is why this cannot fall out of the rail walk
     below and has to be asked first. */
  const next = linkFor(locationId, nextQuestion(payload.fields, score.blocking, score.open));
  const pct = fillPercent(score.settled, score.total);

  return (
    <div className="mb-sc">
      <p className="mb-sc__cap">Questions answered</p>

      {/* THE SAME PAIR THE HEADER TILE PRINTS. Two surfaces, one figure — the
          card is the rail's copy of the tile, not a second reading. */}
      <p className="gpds-mono mb-sc__n">
        {score.settled}
        <span className="mb-sc__of"> / {score.total}</span>
      </p>

      <span className="mb-sc__bar" aria-hidden>
        <span className="mb-sc__fill" style={{ width: `${pct}%` }} />
      </span>

      {next ? (
        <Link className="mb-sc__next" href={next.href}>
          <span>Answer the next one</span>
          {/* The question it lands on, for a reader who cannot see where the
              arrow points. The visible label is the same for every field, so
              this is what makes the link's name specific.

              It reads `copyFor`, NOT the field's own optional `label` —
              `label` is authored only on a row with no registry home, so it is
              undefined on most of the catalogue and the span came out empty.
              `copyFor` is the one resolver that always returns words. */}
          <span className="sr-only">: {next.label}</span>
          <ArrowIcon />
        </Link>
      ) : null}

      <SectionBreakdown />
    </div>
  );
}

/** The way-on arrow. One inline SVG, the same shape `SectionNav` draws its
 *  own tick with, so the rail keeps a single drawing convention. */
function ArrowIcon(): ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden focusable="false">
      <path
        d="M2.5 8h11m0 0L9 3.5M13.5 8L9 12.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

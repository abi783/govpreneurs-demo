/**
 * PartLocked — what she sees when she asks for a part she has not unlocked yet.
 *
 * SHE IS TOLD WHERE SHE IS LOOKING. The alternative is a redirect to Basic
 * Info, which drops her on a page she did not ask for with no explanation of
 * why — and leaves her to work out that the URL she followed is not broken.
 *
 * IT NAMES THE PART SHE ASKED FOR. "This part is locked" beside a rail listing
 * five of them says nothing; "Your papers is locked" confirms the address
 * worked and the answer is about that door.
 *
 * IT IS NOT AN ERROR. Nothing is wrong and she has done nothing incorrect, so
 * there is no error colour and no warning glyph — the design system reserves
 * those for our own failures. This is a door with a reason and a way through
 * it, and the way through is the only thing here to press.
 */

import Link from "next/link";
import type { ReactElement } from "react";
import "./mybusiness.css";

export interface PartLockedProps {
  locationId: string;
  /** The part she asked for, in its own words — `PARTS`' title. */
  title: string;
}

/** The reason this door will not open yet, and the one that will. */
export function PartLocked({ locationId, title }: PartLockedProps): ReactElement {
  return (
    <section className="mb-locked">
      <span className="mb-locked__mark" aria-hidden>
        <LockIcon />
      </span>
      <h2 className="mb-locked__h">{title} opens once Basic Info is done</h2>
      <p className="mb-locked__p">
        Your mentor reads those answers before your first call, so they come first. Everything
        you have already put in is kept.
      </p>
      <Link className="gpds-btn mb-locked__go" href={`/${locationId}/business`}>
        Finish Basic Info
      </Link>
    </section>
  );
}

/** A closed padlock. Decorative — the heading beside it carries the meaning. */
function LockIcon(): ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path
        d="M7 10V7a5 5 0 0 1 10 0v3M5.5 10.5h13a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

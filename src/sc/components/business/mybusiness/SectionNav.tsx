/**
 * The persistent backbone: Basic Info and the parts, always on screen.
 * Ported from `PartRail.tsx` — see git history there for F13's original
 * reasoning — carrying one addition from the 2026-09 redesign: a done tick
 * beside a part whose every core question is settled, from `score.ts`.
 *
 * It lives in `layout.tsx`, which is the whole reason it is a separate
 * component — a Next layout is not re-rendered when the URL moves between its
 * own child segments, so the rail survives navigation with its state intact.
 * Rendering it inside each page would remount it five times.
 *
 * It reads the active part from the pathname rather than a prop, because the
 * layout cannot see which child segment is open. That is also why it is a
 * client component.
 *
 * TWO PRODUCERS, EACH STILL SINGULAR. The open count is one `needsYou(…)`
 * walk bucketed by part, unchanged from `PartRail` — never a score,
 * percentage or bar, still the single "what is still open" signal. The done tick is a SEPARATE, new signal — `partState`'s own
 * single walk of `sectionScore`, bucketed the same way for the same reason:
 * asking it per part would re-walk the catalog five times over on every
 * render instead of once.
 *
 * THE FIVE PARTS ARE LOCKED UNTIL BASIC INFO IS DONE, as the prototype's rail
 * is. This file used to say the opposite — that every part was reachable from
 * the day the record exists and the gate was deliberately not ported — and that
 * is no longer true.
 *
 * A locked row is a `<span>`, not a `<Link>`. Rendering a link and intercepting
 * the click leaves it focusable, right-clickable and openable in a new tab,
 * which is three ways round a lock. The rule itself is `handoff.ts`'s
 * `basicInfoDone`, and the part ROUTE asks the same function — otherwise the
 * one way into a locked part that skips the rail is the one that still works.
 *
 * `business` is itself a part id, so `/{loc}/business/business` is expected —
 * see `parts.ts`.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ReactElement } from "react";
import { CATALOG_PART_IDS, PARTS, PART_IDS, type PartId } from "@sc/lib/businessProfile/parts";
import { basicInfoDone } from "@sc/lib/businessProfile/handoff";
import { needsYou } from "@sc/lib/businessProfile/queue";
import { partState } from "@sc/lib/businessProfile/score";
import { useRecord } from "./RecordStore";
import "./mybusiness.css";

/**
 * The five doors under "Your record" — the parts the record actually answers.
 *
 * `digital` is dropped. It is the one part that is not the record: it holds no
 * catalog rows at all and renders the Digital Compliance Audit Form, whose
 * result goes to her roadmap. The prototype's rail offers five, and a sixth
 * door leading to a different kind of thing read as a sixth part of the record.
 *
 * THE ROUTE IS UNTOUCHED. `/{loc}/business/digital` still resolves and the form
 * still works — this removes the way IN from the rail, not the page. Anything
 * still linking to it keeps working; nothing here links to it any more.
 */
const RAIL_PARTS = PARTS.filter((part) =>
  (CATALOG_PART_IDS as readonly string[]).includes(part.id),
);

export interface SectionNavProps {
  locationId: string;
}

/** Per-part open counts and done ticks, plus the intake's own count. */
interface RailCounts {
  /** Of the fourteen, how many she has still to answer. */
  intakeLeft: number;
  byPart: Record<PartId, number>;
  doneByPart: Partial<Record<PartId, boolean>>;
}

/** Basic Info and the parts, present on every screen of this page. */
export function SectionNav({ locationId }: SectionNavProps): ReactElement {
  const pathname = usePathname();
  const { payload, now } = useRecord();
  const base = `/${locationId}/business`;
  /* THE GATE. The five parts are shut until the intake is behind her —
     `handoff.ts` owns the rule and says why it is the mode and not a live
     count of the fourteen. Basic Info itself is never locked: it is the
     way out. */
  const locked = !basicInfoDone(payload.handoff.mode);

  // ONE producer for every per-part count — the rail's numbers cannot disagree
  // with each other, because none of them counts anything on its own.
  const counts = useMemo<RailCounts>(() => {
    const items = needsYou({ fields: payload.fields, proposals: payload.proposals, now });
    const byPart = Object.fromEntries(PART_IDS.map((part) => [part, 0])) as Record<PartId, number>;
    for (const item of items) byPart[item.part] += 1;

    // `digital` holds no catalog rows — see `parts.ts` — so it has no
    // settled/total fraction to tick against.
    const doneByPart = Object.fromEntries(
      CATALOG_PART_IDS.map((part) => [part, partState(part, payload.fields, payload.media) === "settled"]),
    );

    // The intake layer's own count, off the payload's fixed 14 — never
    // widened, and only answered questions count. `needsYou` still feeds the
    // per-part numbers below; it no longer has a destination of its own.
    const intakeLeft = Math.max(0, payload.counter.total - payload.counter.answered);

    return { intakeLeft, byPart, doneByPart };
  }, [payload, now]);

  return (
    <nav className="mb-rail" aria-label="My business">
      <ul className="mb-rail__list">
        {/* THE FIRST DESTINATION IS THE INTAKE, NOT A QUEUE. Its number is
            what is still to answer of the fourteen — the same pair the landing
            screen prints, and the same fixed denominator, so the rail and the
            screen cannot disagree. A record with all fourteen in shows no
            number at all, which is the rule every other row here follows. */}
        <RailLink
          href={base}
          pathname={pathname}
          label="Basic Info"
          count={counts.intakeLeft}
          done={counts.intakeLeft === 0}
        />
      </ul>

      <p className="mb-rail__group">Your record</p>
      <ul className="mb-rail__list">
        {RAIL_PARTS.map((part) => (
          <RailLink
            key={part.id}
            href={`${base}/${part.id}`}
            pathname={pathname}
            label={part.title}
            count={counts.byPart[part.id]}
            done={counts.doneByPart[part.id] ?? false}
            locked={locked}
          />
        ))}
      </ul>
    </nav>
  );
}

/** One destination, what is waiting for her inside it, and whether it is
 *  settled. A part can carry both at once — every core question answered,
 *  with one extra still needing a confirm — so the two never hide each
 *  other. */
function RailLink({
  href,
  pathname,
  label,
  count,
  done = false,
  locked = false,
}: {
  href: string;
  pathname: string;
  label: string;
  count: number;
  done?: boolean;
  /** Behind the Basic Info gate. Renders as a reason rather than a door. */
  locked?: boolean;
}): ReactElement {
  const current = pathname === href;

  /* A LOCKED PART IS NOT A LINK. Rendering one and intercepting the click
     leaves it focusable, right-clickable and openable in a new tab — three ways
     round a lock. It is a `<span>` with the reason beside it, so there is
     nothing to press and nothing to bypass. The reason is TEXT, not a title
     attribute: a tooltip is not readable on a phone. */
  if (locked) {
    return (
      <li className="mb-rail__item">
        <span className="mb-rail__link mb-rail__link--locked" aria-disabled="true">
          <span className="mb-rail__row">
            <span className="mb-rail__label">{label}</span>
            <LockIcon />
          </span>
          <span className="mb-rail__why">Locked until Basic Info is done</span>
        </span>
      </li>
    );
  }

  return (
    <li className="mb-rail__item">
      <Link className="mb-rail__link" href={href} aria-current={current ? "page" : undefined}>
        <span className="mb-rail__row">
          <span className="mb-rail__label">{label}</span>
          {/* The tick is the only thing saying this part is finished, so it
              carries its own words. The glyph is decorative — `CheckIcon` is
              already `aria-hidden` — and the text beside it is what a screen
              reader announces after the label. */}
          {done ? (
            <span className="mb-rail__done">
              <CheckIcon />
              <span className="sr-only"> — all in</span>
            </span>
          ) : null}
        </span>
        {/* ONE NUMBER, and only when something is waiting. The noun it used to
            carry — "3 to check" — is the same three words on every row that has
            one, so it is read once and then skipped; the number is what
            changes. A part with nothing outstanding stays silent rather than
            saying zero. What it counts is said out loud for anyone who cannot
            see where the number is sitting. */}
        {count > 0 ? (
          <span className="gpds-mono mb-rail__n">
            {count}
            <span className="sr-only"> to check in {label}</span>
          </span>
        ) : null}
      </Link>
    </li>
  );
}

/** A closed padlock. Decorative — the words "Locked until Basic Info is done"
 *  sit beside it and are what a screen reader announces. */
function LockIcon(): ReactElement {
  return (
    <svg
      className="mb-rail__lock"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable="false"
    >
      <path
        d="M7 10V7a5 5 0 0 1 10 0v3M5.5 10.5h13a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Same glyph `TreePicker.tsx` already draws for its own checked state — one
 *  inline SVG, no icon package (there is none in this repo). */
function CheckIcon(): ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden focusable="false">
      <path d="M3 8.5L6.2 11.5L13 4.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

import type { MouseEvent, ReactNode } from "react";
import { highlight } from "../Search/Highlight";
import { Banknote, Bookmark, BookmarkCheck, Eye, MapPin, Search, Users, X } from "lucide-react";
import {
  atLeastSubs,
  usd,
  VERDICT_LABEL,
  whereTheyWork,
  type PrimeCandidate,
} from "../../lib/partnersApi";

/**
 * One ranked prime.
 *
 * No score is shown, ever — "a bare number like 87% means nothing to humans". The
 * three ordered reasons ARE the explanation, each derived from the member's own
 * profile and the company's award record.
 *
 * The verdict chip marks the EXCEPTION, not the norm: when almost every company
 * reads "Good match", a chip on all of them says nothing. It appears only when the
 * answer is something other than "work with them".
 */
export function PrimeCandidateCard({
  partner,
  onOpen,
  saved,
  onToggleSaved,
  onNotRightForMe,
  onShowAgain,
  matchedBecause,
  hl = null,
}: {
  partner: PrimeCandidate;
  onOpen: (awardeeKey: number) => void;
  saved: boolean;
  onToggleSaved: (partner: PrimeCandidate) => void;
  /** D11 — per-company suppression. A way to disagree with the ranking, not
   *  just save from it. Optional so this card keeps working anywhere it is
   *  reused without the write path wired up (e.g. the pipeline board). */
  onNotRightForMe?: (partner: PrimeCandidate) => void;
  /** Set when the member hid this company and then chose to see hidden companies. */
  onShowAgain?: (partner: PrimeCandidate) => void;
  /** Why the company matches the search text. Set only while the member searches. */
  matchedBecause?: string;
  /** Marks the search words. Null when there is no search. */
  hl?: ((text: string) => ReactNode) | null;
}) {
  const exception = partner.verdict !== "partner_play";

  // The whole card opens the company (design-system clickable card). Blur first: the
  // window hides the page from screen readers, so focus must not stay on the card.
  const open = (el: HTMLElement) => {
    el.blur();
    onOpen(partner.awardeeKey);
  };
  // Every control inside stops the click, so it never also opens the card.
  const act = (fn: () => void) => (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`Open ${partner.name}`}
      data-awardee-key={partner.awardeeKey}
      className={["is-clickable-card prime-card", TIER_CLASS[partner.tier]].join(" ")}
      onClick={(e) => open(e.currentTarget)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(e.currentTarget);
        }
      }}
    >
      <div className="prime-card__head">
        <span className="prime-card__name">{highlight(hl, partner.name)}</span>
        {exception && <span className="prime-card__verdict">{VERDICT_LABEL[partner.verdict]}</span>}
        <span className="prime-card__actions">
          {/* A save is a bookmark, not a commitment. It works from the row. */}
          <button
            type="button"
            aria-pressed={saved}
            aria-label={saved ? `Remove ${partner.name} from My partners` : `Save ${partner.name}`}
            className={`prime-card__save${saved ? " is-on" : ""}`}
            onClick={act(() => onToggleSaved(partner))}
          >
            {saved ? <BookmarkCheck size={15} aria-hidden /> : <Bookmark size={15} aria-hidden />}
          </button>
          {/* D11 — a plain way to disagree with the ranking. A single text action. */}
          {onShowAgain ? (
            <button
              type="button"
              aria-label={`Show ${partner.name} again`}
              className="prime-card__dismiss"
              onClick={act(() => onShowAgain(partner))}
            >
              <Eye size={12} aria-hidden />
              Show again
            </button>
          ) : (
            onNotRightForMe && (
              <button
                type="button"
                aria-label={`Not right for me: ${partner.name}`}
                className="prime-card__dismiss"
                onClick={act(() => onNotRightForMe(partner))}
              >
                <X size={12} aria-hidden />
                Not right for me
              </button>
            )
          )}
        </span>
      </div>

      <div className="prime-card__facts">
        {/* "at least N" — the filings are incomplete, so this is a floor. No firms on
            record says nothing useful, so the fact is left out. */}
        {partner.bench.distinctSubs > 0 && (
          <span className="prime-card__fact">
            <Users size={13} aria-hidden />
            {capitalise(atLeastSubs(partner.bench))}
          </span>
        )}
        <span className="prime-card__fact">
          <MapPin size={13} aria-hidden />
          <span>{highlight(hl, whereTheyWork(partner))}</span>
        </span>
        {partner.economics.maxAwardUsd > 0 && (
          <span className="prime-card__fact">
            <Banknote size={13} aria-hidden />
            Biggest job <span className="mono">{usd(partner.economics.maxAwardUsd)}</span>
          </span>
        )}
      </div>

      {matchedBecause && (
        <span className="match-why">
          <Search size={13} aria-hidden />
          <span>{highlight(hl, matchedBecause)}</span>
        </span>
      )}

      {/* Three ordered reasons, strongest first. This is the whole explanation. One span
          holds each line, so a highlight does not become a flex item with gaps. */}
      <ul className="prime-card__reasons">
        {partner.reasons.map((r) => (
          <li key={r.signal}>
            <span>{highlight(hl, r.text)}</span>
          </li>
        ))}
      </ul>

      {/* Flags mark something worth knowing at any rank — not a score. */}
      {partner.flags.length > 0 && (
        <ul className="prime-card__flags">
          {partner.flags.map((f) => (
            <li key={f.id}>
              <span>{f.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The left rule for each tier. Whole class names, so no class is built from a template. */
const TIER_CLASS: Record<PrimeCandidate["tier"], string> = {
  strong: "prime-card--strong",
  good: "prime-card--good",
  stretch: "prime-card--stretch",
};

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

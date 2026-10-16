import { Bookmark, BookmarkCheck, MapPin, Users, X } from "lucide-react";
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
}: {
  partner: PrimeCandidate;
  onOpen: (awardeeKey: number) => void;
  saved: boolean;
  onToggleSaved: (partner: PrimeCandidate) => void;
  /** D11 — per-company suppression. A way to disagree with the ranking, not
   *  just save from it. Optional so this card keeps working anywhere it is
   *  reused without the write path wired up (e.g. the pipeline board). */
  onNotRightForMe?: (partner: PrimeCandidate) => void;
}) {
  const exception = partner.verdict !== "partner_play";

  return (
    <button
      type="button"
      className={`prime-card prime-card--${partner.tier}`}
      onClick={() => onOpen(partner.awardeeKey)}
    >
      <div className="prime-card__head">
        <span className="prime-card__name">{partner.name}</span>
        {exception && <span className="prime-card__verdict">{VERDICT_LABEL[partner.verdict]}</span>}
        <span className="prime-card__actions">
        {/* A save is a bookmark, not a commitment — it must work from the row and
            not force the member through the detail view first. The whole card is
            clickable, so this stops the event reaching it. */}
        <span
          role="button"
          tabIndex={0}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${partner.name}` : `Save ${partner.name}`}
          className={`prime-card__save${saved ? " is-on" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSaved(partner);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onToggleSaved(partner);
            }
          }}
        >
          {saved ? <BookmarkCheck size={15} aria-hidden /> : <Bookmark size={15} aria-hidden />}
        </span>
        {/* D11 — a plain way to disagree with the ranking. Deliberately a single
            text action, not a dropdown/rich menu (rejected in review). */}
        {onNotRightForMe && (
          <span
            role="button"
            tabIndex={0}
            aria-label={`Not right for me: ${partner.name}`}
            className="prime-card__dismiss"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onNotRightForMe(partner);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onNotRightForMe(partner);
              }
            }}
          >
            <X size={12} aria-hidden />
            Not right for me
          </span>
        )}
        </span>
      </div>

      <div className="prime-card__facts">
        <span className="prime-card__fact">
          <Users size={12} aria-hidden />
          {/* "at least N" — the filings are incomplete, so this is a floor. */}
          {atLeastSubs(partner.bench)}
        </span>
        <span className="prime-card__fact">
          <MapPin size={12} aria-hidden />
          {whereTheyWork(partner)}
        </span>
        <span className="prime-card__fact mono">
          biggest job {usd(partner.economics.maxAwardUsd)}
        </span>
      </div>

      {/* Three ordered reasons, strongest first. This is the whole explanation. */}
      <ul className="prime-card__reasons">
        {partner.reasons.map((r) => (
          <li key={r.signal}>{r.text}</li>
        ))}
      </ul>

      {/* Flags mark something worth knowing at any rank — not a score. */}
      {partner.flags.length > 0 && (
        <ul className="prime-card__flags">
          {partner.flags.map((f) => (
            <li key={f.id}>{f.text}</li>
          ))}
        </ul>
      )}
    </button>
  );
}

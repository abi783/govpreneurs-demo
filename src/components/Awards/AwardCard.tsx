import type { ReactNode } from "react";
import { highlight } from "../Search/Highlight";
import { useNavigate } from "@tanstack/react-router";
import {
  Banknote,
  Bookmark,
  BookmarkCheck,
  Clock3,
  MapPin,
  RotateCcw,
  Search,
  Trophy,
} from "lucide-react";
import { awardedAgo, collapseAwardMoney, usd, type AwardRecord } from "../../lib/awardsApi";

/**
 * One award in the list: what was bought · who won it and for how much · when ·
 * one line on why it is in front of you.
 *
 * A card, not a table row — the reader is deciding whether ONE job deserves a
 * second look, not comparing thirty at a glance.
 *
 * Whole-card click-through is the design-system standard (`.is-clickable-card`): the
 * card is a div with role="link", so the save button is not nested inside a link. The
 * card opens from anywhere, and the save button stops the event.
 *
 * The card keeps the focus when it opens the window. The window returns the focus to
 * it on close. `data-award-id` lets the page find the card again after a re-render.
 */
export function AwardCard({
  award,
  saved,
  onToggleSaved,
  matchedBecause,
  hl = null,
}: {
  award: AwardRecord;
  saved: boolean;
  /** Parent owns the state; the card stays stateless. */
  onToggleSaved: (award: AwardRecord) => void;
  /** Why the award matches the search text. Set only while the member searches. */
  matchedBecause?: string;
  /** Marks the search words. Null when there is no search. */
  hl?: ((text: string) => ReactNode) | null;
}) {
  const ago = awardedAgo(award);

  // justAwarded is null when the date is unknown — suppress the badge rather than
  // render a negative. We do not know when it happened, so we claim nothing.
  const justAwarded = award.recency.justAwarded === true;
  const comingUp = award.recency.comingUpAgain;

  const where = [award.location.city, award.location.state].filter(Boolean).join(", ");
  const navigate = useNavigate();

  // The same money rule as the award window: one "Worth" figure when the figures agree,
  // else the dollars paid so far, else the most it could reach.
  const collapsed = collapseAwardMoney(award);
  const money = collapsed
    ? { label: "Worth", figure: collapsed.figure }
    : award.obligated
      ? { label: "Paid", figure: award.obligated }
      : award.ceiling
        ? { label: "Could reach", figure: award.ceiling }
        : null;

  // Opens the award in a window over the list. The list keeps its filters.
  const open = (el: HTMLElement) => {
    el.focus();
    navigate({
      to: "/awards",
      search: ((prev: Record<string, unknown>) => ({ ...prev, award: award.awardId })) as never,
    });
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${award.title}. Open the award.`}
      data-award-id={award.awardId}
      className={`award-card is-clickable-card${justAwarded ? " is-hot" : ""}`}
      onClick={(e) => open(e.currentTarget)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(e.currentTarget);
        }
      }}
    >
      <div className="award-card__head">
        {/* The full name: "CCSC" means nothing to a member. */}
        <span className="award-card__buyer">{award.agency.name} bought this</span>
        {/* Only one flag, strongest first — a badge on everything says nothing. */}
        {justAwarded ? (
          <span className="award-flag award-flag--hot">
            <Clock3 size={11} aria-hidden /> Just awarded
          </span>
        ) : comingUp ? (
          <span className="award-flag">
            <RotateCcw size={11} aria-hidden /> Up for bid again
          </span>
        ) : null}
      </div>

      {/* The whole card opens the award, so the save button stops the event. */}
      <button
        type="button"
        className={`award-card__save${saved ? " is-on" : ""}`}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved" : "Save this award"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleSaved(award);
        }}
      >
        {saved ? <BookmarkCheck size={15} aria-hidden /> : <Bookmark size={15} aria-hidden />}
      </button>

      <h3 className="award-card__title">{highlight(hl, award.title)}</h3>

      <div className="award-card__facts">
        <span className="award-card__fact">
          <Trophy size={13} aria-hidden />
          {highlight(hl, award.winner.name)}
        </span>
        {where && (
          <span className="award-card__fact">
            <MapPin size={13} aria-hidden />
            {highlight(hl, where)}
          </span>
        )}
        {money && (
          <span className="award-card__fact">
            <Banknote size={13} aria-hidden />
            {money.label} <span className="mono">{usd(money.figure)}</span>
          </span>
        )}
        {/* Omitted entirely when the date is unknown — no "unknown" placeholder. */}
        {ago && (
          <span className="award-card__fact">
            <Clock3 size={13} aria-hidden />
            {ago.charAt(0).toUpperCase() + ago.slice(1)}
          </span>
        )}
      </div>

      {matchedBecause && (
        <span className="match-why">
          <Search size={13} aria-hidden />
          <span>{highlight(hl, matchedBecause)}</span>
        </span>
      )}
    </div>
  );
}

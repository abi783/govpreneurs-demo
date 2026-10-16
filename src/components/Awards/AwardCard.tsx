import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, Clock3, MapPin, RotateCcw, Trophy } from "lucide-react";
import { awardedAgo, usd, whyThisAward, type AwardRecord } from "../../lib/awardsApi";

/**
 * One award in the list: what was bought · who won it and for how much · when ·
 * one line on why it is in front of you.
 *
 * A card, not a table row — the reader is deciding whether ONE job deserves a
 * second look, not comparing thirty at a glance.
 *
 * Whole-card click-through is the design-system standard here: the card opens from
 * anywhere, and any nested control must stopPropagation.
 */
export function AwardCard({
  award,
  saved,
  onToggleSaved,
}: {
  award: AwardRecord;
  saved: boolean;
  /** Parent owns the state; the card stays stateless. */
  onToggleSaved: (award: AwardRecord) => void;
}) {
  const ago = awardedAgo(award);

  // justAwarded is null when the date is unknown — suppress the badge rather than
  // render a negative. We do not know when it happened, so we claim nothing.
  const justAwarded = award.recency.justAwarded === true;
  const comingUp = award.recency.comingUpAgain;

  const where = [award.location.city, award.location.state].filter(Boolean).join(", ");

  return (
    <Link
      to="/awards/$awardId"
      params={{ awardId: award.awardId }}
      className={`award-card${justAwarded ? " is-hot" : ""}`}
    >
      <div className="award-card__head">
        <span className="award-card__buyer">
          {award.agency.abbrev ?? award.agency.name} bought this
        </span>
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

      {/* The whole card is a link, so any nested control must stop the event
          reaching it — otherwise saving also navigates. */}
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

      <h3 className="award-card__title">{award.title}</h3>

      <div className="award-card__facts">
        <span className="award-card__fact">
          <Trophy size={12} aria-hidden />
          {award.winner.name}
        </span>
        <span className="award-card__fact mono">{usd(award.obligated)}</span>
        {where && (
          <span className="award-card__fact">
            <MapPin size={12} aria-hidden />
            {where}
          </span>
        )}
        {/* Omitted entirely when the date is unknown — no "unknown" placeholder. */}
        {ago && <span className="award-card__fact">{ago}</span>}
      </div>

      <p className="award-card__why">{whyThisAward(award)}</p>
    </Link>
  );
}

// One Kanban card = one pursuit. Single-scan anatomy: deadline aging pill,
// title, facts, Grant's read / stage context, and the primary next action.
// The real backend only tracks Saved opps today, so every action routes to the
// opportunity page (where Send-to-Mentor, proposals, and stage moves live);
// value/scope render only when the opportunity carries them.

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { contextLineFor, type Bid } from "../../lib/mock/bids";
import { isInsideClosingWindow } from "../../lib/closingWindow";
import { relayWhenEmbedded } from "../../lib/ghlNav";
import { WatchMarker } from "../Forecast/WatchMarker";

function DeadlinePill({ bid }: { bid: Bid }) {
  if (bid.expired)
    return <span className="bid-card__deadline bid-card__deadline--expired">Expired</span>;
  // Outcome cards (or anything past deadline that isn't "expired") show no countdown.
  if (bid.daysLeft === null || bid.daysLeft < 0) return null;
  const d = bid.daysLeft;
  const tone = d <= 7 ? "warn" : d <= 21 ? "soon" : "normal";
  const text = d === 0 ? "Closes today" : d === 1 ? "1 day left" : `${d} days left`;
  return <span className={`bid-card__deadline bid-card__deadline--${tone}`}>{text}</span>;
}

function primaryLabel(bid: Bid): string {
  if (bid.smallOrder) return "Open the order";
  if (bid.forecast) return "Open the forecast";
  // Inside the closing window the send is refused, so don't promise it.
  const canSend =
    (bid.stage === "saved" || bid.stage === "reviewing") && !isInsideClosingWindow(bid.deadline);
  return canSend ? "Send to Mentor" : "View opportunity";
}

/**
 * The card's link to the thing it tracks. A saved small order opens the Small
 * Orders page, a tracked forecast opens the Forecasts page, and everything else
 * opens the Opportunities page. Each is its own GoHighLevel custom-menu-link,
 * so when embedded every link relays through the parent frame
 * (`relayWhenEmbedded`). The target then opens on its own page with the right
 * menu tab active, and not inside the My Bids iframe.
 */
function TrackedLink({
  bid,
  className,
  onOpportunityClick,
  children,
}: {
  bid: Bid;
  className: string;
  onOpportunityClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  if (bid.smallOrder) {
    return (
      <Link
        to="/small-orders/$orderId"
        params={{ orderId: bid.opportunityId }}
        className={className}
        onClick={relayWhenEmbedded("small-orders", `/small-orders/${bid.opportunityId}`)}
      >
        {children}
      </Link>
    );
  }
  if (bid.forecast) {
    return (
      <Link
        to="/forecasts/$forecastId"
        params={{ forecastId: bid.opportunityId }}
        className={className}
        onClick={relayWhenEmbedded("forecasts", `/forecasts/${bid.opportunityId}`)}
      >
        {children}
      </Link>
    );
  }
  return (
    <Link
      to="/opportunities/$noticeId"
      params={{ noticeId: bid.opportunityId }}
      className={className}
      onClick={onOpportunityClick}
    >
      {children}
    </Link>
  );
}

export function BidCard({ bid }: { bid: Bid }) {
  const ctx = contextLineFor(bid);
  const oppRoute = `/opportunities/${bid.opportunityId}`;
  // Opportunity detail lives on the Opportunities custom page, a different GHL
  // iframe. See `relayWhenEmbedded`.
  const openOnOpportunitiesPage = (route: string) => relayWhenEmbedded("opportunities", route);

  // Cards adapted from real mentor reviews (with_mentor column) carry their
  // own CTA: they link to the mentor thread, not the opportunity page. Mentors
  // is its own GHL page, so when embedded both links relay through the parent.
  if (bid.mentorActionOverride) {
    const { label, reviewId, primary } = bid.mentorActionOverride;
    const openOnMentorsPage = relayWhenEmbedded("mentors", `/mentors/${reviewId}`);
    return (
      <article className={`bid-card${bid.expired ? " is-expired" : ""}`} data-stage={bid.stage}>
        <div className="bid-card__top">
          <Link
            to="/mentors/$reviewId"
            params={{ reviewId }}
            className="bid-card__title"
            onClick={openOnMentorsPage}
          >
            {bid.title}
          </Link>
          <DeadlinePill bid={bid} />
        </div>

        {(bid.agency || bid.value || bid.scope) && (
          <div className="bid-card__facts">
            {bid.agency && <span>{bid.agency}</span>}
            {bid.value && (
              <>
                {bid.agency && <span aria-hidden>·</span>}
                <span className="fr-mono">{bid.value}</span>
              </>
            )}
            {bid.scope && (
              <>
                <span aria-hidden>·</span>
                <span>{bid.scope === "fed" ? "Fed" : "SLED"}</span>
              </>
            )}
          </div>
        )}

        {bid.grantVerdict ? (
          <div className="bid-card__verdict">
            Grant: <strong>{bid.grantVerdict.verdict}</strong> — {bid.grantVerdict.oneLine}
          </div>
        ) : (
          ctx && <div className="bid-card__ctx">{ctx}</div>
        )}

        <div className="bid-card__actions">
          <Link
            to="/mentors/$reviewId"
            params={{ reviewId }}
            className={`btn btn-sm ${primary ? "btn-primary" : "btn-secondary"}`}
            onClick={openOnMentorsPage}
          >
            {label} <ArrowRight size={12} />
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className={`bid-card${bid.expired ? " is-expired" : ""}`} data-stage={bid.stage}>
      <div className="bid-card__top">
        <TrackedLink
          bid={bid}
          className="bid-card__title"
          onOpportunityClick={openOnOpportunitiesPage(oppRoute)}
        >
          {bid.title}
        </TrackedLink>
        {bid.forecast && <WatchMarker oppKey={bid.opportunityId} />}
        <DeadlinePill bid={bid} />
      </div>

      <div className="bid-card__facts">
        <span>{bid.agency}</span>
        {bid.value && (
          <>
            <span aria-hidden>·</span>
            <span className="fr-mono">{bid.value}</span>
          </>
        )}
        {bid.scope && (
          <>
            <span aria-hidden>·</span>
            <span>{bid.scope === "fed" ? "Fed" : "SLED"}</span>
          </>
        )}
      </div>

      {bid.grantVerdict ? (
        <div className="bid-card__verdict">
          Grant: <strong>{bid.grantVerdict.verdict}</strong> — {bid.grantVerdict.oneLine}
        </div>
      ) : (
        ctx && <div className="bid-card__ctx">{ctx}</div>
      )}

      <div className="bid-card__actions">
        <TrackedLink
          bid={bid}
          className="btn btn-primary btn-sm"
          onOpportunityClick={openOnOpportunitiesPage(oppRoute)}
        >
          {primaryLabel(bid)} <ArrowRight size={12} />
        </TrackedLink>
        <TrackedLink
          bid={bid}
          className="bid-card__view"
          onOpportunityClick={openOnOpportunitiesPage(oppRoute)}
        >
          View →
        </TrackedLink>
      </div>
    </article>
  );
}

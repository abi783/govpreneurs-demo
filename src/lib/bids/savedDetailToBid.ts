import { daysUntil } from "../format";
import type { Bid } from "../mock/bids";
import type { SavedOppDetail } from "../workspace";
import { isForecastSource } from "../forecasts/sourceType";

/** The HigherGov source a small order carries. */
const SMALL_ORDER_SOURCE = "dibbs";

/**
 * Maps a persisted saved opportunity to a "saved"-stage bid card.
 *
 * A saved small order arrives through the same list — its id IS its `oppKey` —
 * and is marked `smallOrder`, so the card opens `/small-orders/$orderId`
 * instead of the opportunity page, which is not built for a DLA parts order.
 * A tracked forecast arrives the same way and is marked `forecast`, so it opens
 * `/forecasts/$forecastId`.
 *
 * A forecast carries NO countdown. Its date is the buyer's expected date, not a
 * date bids close on (the forecasts PRD, box B11), so "3 days left" and
 * "Expired" would both be claims the record does not make.
 */
export function savedDetailToBid(d: SavedOppDetail): Bid {
  // Real due dates are measured against the real clock, not the mock NOW.
  const daysLeft = d.dueDate ? Math.ceil(daysUntil(d.dueDate, new Date())) : null;
  const smallOrder = d.sourceType === SMALL_ORDER_SOURCE;
  const forecast = isForecastSource(d.sourceType);
  return {
    id: `saved_${d.oppKey}`,
    opportunityId: d.oppKey,
    title: d.title,
    agency: d.agency,
    mode: "prime",
    deadline: d.dueDate,
    stage: "saved",
    nextAction: smallOrder
      ? { label: "Open the order", href: `/small-orders/${d.oppKey}` }
      : forecast
        ? { label: "Open the forecast", href: `/forecasts/${d.oppKey}` }
        : { label: "Review with Grant", href: `/opportunities/${d.oppKey}` },
    lastActivityAt: new Date().toISOString(),
    daysLeft: forecast ? null : daysLeft,
    expired: !forecast && daysLeft !== null && daysLeft < 0,
    valueMidUsd: 0,
    ...(smallOrder ? { smallOrder: true } : {}),
    ...(forecast ? { forecast: true } : {}),
  };
}

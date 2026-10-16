import type { MentorReviewSummary } from "./mentorReviewsApi";
import { isForecastSource } from "./forecasts/sourceType";

/** The HigherGov `sourceType` a small order (a DLA DIBBS order) carries. */
export const SMALL_ORDER_SOURCE = "dibbs";

/** Where a review's title link opens, and the GHL page key that owns it. */
export type ReviewedItemLink =
  | { page: "opportunities"; id: string; route: string }
  | { page: "small-orders"; id: string; route: string }
  | { page: "forecasts"; id: string; route: string };

/**
 * The detail page for the item a review is about. A small order opens
 * `/small-orders/<id>`, a forecast opens `/forecasts/<id>`, and anything else
 * opens `/opportunities/<id>`. A review with no `sourceType` (a backend that
 * does not send it yet) is an opportunity. Returns null when there is no
 * resolved item to link to.
 */
export function reviewedItemLink(
  review: Pick<MentorReviewSummary, "oppKey" | "oppResolved" | "sourceType">,
): ReviewedItemLink | null {
  if (!review.oppKey || !review.oppResolved) return null;
  const id = review.oppKey;
  if (review.sourceType === SMALL_ORDER_SOURCE) {
    return { page: "small-orders", id, route: `/small-orders/${id}` };
  }
  if (isForecastSource(review.sourceType)) {
    return { page: "forecasts", id, route: `/forecasts/${id}` };
  }
  return { page: "opportunities", id, route: `/opportunities/${id}` };
}

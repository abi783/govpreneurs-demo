/**
 * One-slot memory of what the member chose on the feed: the tab, and each tab's
 * filters, sort and search text.
 *
 * The feed route unmounts when the member opens an opportunity. Its reducer
 * then starts again from its defaults, so the member comes back to
 * "Opportunities for you" with their filters reseeded from the profile. This
 * slot lets the next mount start from the view the member left instead.
 *
 * Module scope, not sessionStorage, for the same reason as `feedSnapshot`: a
 * full page reload SHOULD start clean. It is also what makes the snapshot of
 * rows usable — that snapshot only restores onto the same tab, filters, sort
 * and search, so the view has to come back first.
 *
 * Keyed by location. A view belongs to one sub-account, and its filters must
 * never appear under another.
 */
let remembered: { locationId: string; view: unknown } | null = null;

/** Records the member's view for this location. Overwrites any earlier view. */
export function rememberFeedView<T>(locationId: string, view: T): void {
  remembered = { locationId, view };
}

/** The view last recorded for this location, or null when there is none. */
export function recallFeedView<T>(locationId: string | undefined): T | null {
  if (!remembered || remembered.locationId !== locationId) return null;
  return remembered.view as T;
}

/** Forgets the view. Tests call this between cases. */
export function clearFeedView(): void {
  remembered = null;
}

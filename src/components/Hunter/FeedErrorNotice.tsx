/**
 * The feed's failed-load notice: one fixed sentence and a Retry control.
 *
 * Two rules live here. The sentence is FIXED, because the thrown error carries
 * the backend's own `message` (see `buildApiError`), which can hold internal
 * paths, ids or stack fragments — the caller logs that detail and passes none of
 * it in. And the sentence says whose failure this is: a load that fails is ours,
 * not the member's filters, so nothing on screen may send them to widen a search
 * that was never the problem.
 */
import { AlertTriangle } from "lucide-react";

/** The one sentence a member reads when a feed request fails. */
export const FEED_LOAD_ERROR_MESSAGE =
  "We could not load your opportunities. The problem is on our side, not your filters.";

/** Announces a failed feed load and offers the member a retry. */
export function FeedErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="feed-error" role="alert">
      <AlertTriangle size={15} aria-hidden />
      <p className="feed-error__text t-body-sm">{message}</p>
      <button type="button" className="feed-error__retry" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

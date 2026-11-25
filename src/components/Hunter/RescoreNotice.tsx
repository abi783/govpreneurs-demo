/**
 * The notice a member sees while a FULL re-score of her matches runs (the feed
 * answers `fullRescore: true`): after a profile change, the manual full rescore,
 * or a chat-driven regeneration. The small daily runs over new opportunities do
 * not show it. Her list stays usable meanwhile; the card only says it is moving.
 */
import { RefreshCw } from "lucide-react";

/** The one sentence a member reads while her matches are re-scored. */
export const RESCORE_NOTICE_MESSAGE =
  "Hey! We are refreshing your matches based on the latest data on you and the government. This may take up to 15 minutes.";

/** Tells the member a full re-score of her matches is running. */
export function RescoreNotice() {
  return (
    <div className="feed-rescore" role="status">
      <RefreshCw size={15} aria-hidden />
      <p className="feed-rescore__text t-body-sm">{RESCORE_NOTICE_MESSAGE}</p>
    </div>
  );
}

// The change marker on a tracked forecast (feature 10,
// ARCHITECTURE-forecasts-watch.md §11). One marker with the count of unseen
// changes, on the /forecasts card, the My Bids row and the feed's Saved-tab card.
//
// Text and an icon, never colour alone. It renders only when the watch read is
// ready, watching is on and the forecast has unseen changes. A failed read, a read
// still in flight and watching off all render nothing: never an error card, and
// never a "no changes" claim.
//
// Mount it only for a tracked forecast: it starts the session's one watch read.

import { History } from "lucide-react";
import { unseenFor, useForecastWatch, watchCopyState } from "../../lib/forecasts/watch";
import { WATCH_MARKER } from "../../lib/forecasts/watchCopy";

/** The unseen-change count for one forecast, or nothing when there is none to show. */
export function WatchMarker({ oppKey }: { oppKey: string }) {
  const read = useForecastWatch();
  const count = watchCopyState(read) === "off" ? 0 : unseenFor(read, oppKey);
  if (count === 0) return null;
  return (
    <span className="fw-marker" role="img" aria-label={WATCH_MARKER.accessibleName(count)}>
      <History size={12} className="fw-marker__ico" aria-hidden />
      {WATCH_MARKER.label(count)}
    </span>
  );
}

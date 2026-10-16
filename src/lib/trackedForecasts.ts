// Tracking a forecast IS saving it. A forecast's id is its `oppKey` and a
// forecast lives in `opportunities`, so it goes in the member's one saved list
// (`user_workspace.savedOpps`) beside saved opportunities and small orders —
// the same list My Bids and the feed's Saved tab read. It used to be a
// module-level object, so a tracked forecast was lost on reload and reached
// neither surface.
//
// The saved list is also what the forecast watch reads. While watching is on,
// the server watches each tracked forecast. When the buyer changes a watched
// field, the server records the change. The member sees the change on the
// forecast's page and as a marker on the forecasts list, My Bids and the feed's
// Saved tab (`lib/forecasts/watch.ts`). After each save that the server
// accepted, this store refreshes the watch. A save that failed and was put back
// refreshes nothing. The watch sends no email unless its notify flag is on.

import { useEffect } from "react";
import { bus, useLiveSlice } from "./eventBus";
import { refreshForecastWatch } from "./forecasts/watch";
import { addSavedOpp, fetchWorkspace, removeSavedOpp } from "./workspace";

export const FORECASTS_CHANGED_EVENT = "forecasts-changed";
/** Published when a save or an un-save has settled on the server, saved or put back.
 *  The Saved view reloads on it, because only then does the server's list agree. */
export const TRACKED_WRITES_SLICE = "trackedForecastWrites";

let tracked = new Set<string>();
/** The list as an array, rebuilt on every change: `useSyncExternalStore` needs one
 *  object per state, not a fresh array per read. */
let snapshot: string[] = [];
/** The one read of the saved list per session. Cleared on failure, so a later mount retries. */
let hydration: Promise<void> | null = null;

function commit(): void {
  snapshot = [...tracked];
  bus.publish("trackedForecasts");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FORECASTS_CHANGED_EVENT));
  }
}

/** Reads the member's saved list once per session. */
export function hydrateTrackedForecasts(): Promise<void> {
  if (!hydration) {
    hydration = fetchWorkspace()
      .then((w) => {
        tracked = new Set(w.savedOpps);
        commit();
      })
      .catch((err: unknown) => {
        hydration = null;
        throw err;
      });
  }
  return hydration;
}

export function isTracked(id: string): boolean {
  return tracked.has(id);
}

export function listTracked(): string[] {
  return snapshot;
}

/**
 * Tracks or untracks a forecast, and saves the change. The control answers at
 * once and the write follows; a failed write puts the control back where it was,
 * so the bookmark never shows a saved state the member's list does not hold.
 */
export function toggleTracked(id: string): boolean {
  const was = tracked.has(id);
  if (was) tracked.delete(id);
  else tracked.add(id);
  commit();

  const persist = was ? removeSavedOpp(id) : addSavedOpp(id);
  persist
    .then(
      () => void refreshForecastWatch(),
      (err: unknown) => {
        console.error("[forecasts] Failed to save the forecast", err);
        if (was) tracked.add(id);
        else tracked.delete(id);
        commit();
      },
    )
    .finally(() => bus.publish(TRACKED_WRITES_SLICE));
  return !was;
}

/**
 * Records ids that Hunter already saved or unsaved on the server. Writes nothing:
 * the server wrote `user_workspace.savedOpps` already. It then refreshes the watch,
 * which reads that list. The list holds every surface's saves, so an id that is not
 * a forecast does no harm here.
 */
export function recordServerSaveChange(saved: string[], unsaved: string[]): void {
  saved.forEach((id) => tracked.add(id));
  unsaved.forEach((id) => tracked.delete(id));
  commit();
  bus.publish(TRACKED_WRITES_SLICE);
  void refreshForecastWatch();
}

/** Reads the saved list, and re-renders the caller whenever it changes. */
export function useTrackedForecasts(): string[] {
  useEffect(() => {
    hydrateTrackedForecasts().catch((err: unknown) =>
      console.error("[forecasts] Failed to load your saved list", err),
    );
  }, []);
  return useLiveSlice("trackedForecasts", listTracked);
}

/** Drops what this session holds, for the demo reset. The saved list itself is untouched. */
export function resetTrackedForecasts(): void {
  tracked = new Set();
  hydration = null;
  commit();
}

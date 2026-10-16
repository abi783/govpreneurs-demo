import { useCallback, useEffect, useRef, useState } from "react";
import { fetchSaved } from "./saved";
import { laneOnlyFilters, type BuyerLane } from "./buyerLane";

/**
 * The Saved tab's badge: how many rows the Saved list holds, as the SERVER
 * counts them.
 *
 * It is NOT the size of `user_workspace.savedOpps`. That raw list also holds
 * forecasts, small orders, grants and keys whose opportunity no longer
 * exists, and the Saved list shows none of them. So the badge asks the same
 * question the list asks — `POST /opportunities/saved` with no search, no
 * facet filters and the page's buyer lane — with `limit: 1`, and reads its
 * `total`.
 *
 * - `null` until the first answer. No badge is better than a guess.
 * - `adjust(±1)` for a save or unsave made on this page. A card here is always
 *   a type the list shows, so the delta is exact.
 * - `refresh()` after a change made elsewhere (Hunter), and by itself when the
 *   page becomes visible again (a save on another page or in another tab).
 *
 * A refresh that started before a local `adjust` is dropped when it lands:
 * it counted the list before that change, so it would undo it.
 *
 * A new lane asks again. The badge is `null` until that answer lands, and an
 * answer for the old lane is dropped.
 */
export function useSavedTotal(locationId: string | undefined, lane: BuyerLane = "all") {
  const [total, setTotal] = useState<number | null>(null);
  const changeEpoch = useRef(0);
  const laneRef = useRef(lane);

  // Declared before the refresh effect, so the lane is current when it asks.
  useEffect(() => {
    if (laneRef.current === lane) return;
    laneRef.current = lane;
    setTotal(null);
  }, [lane]);

  const refresh = useCallback(() => {
    if (!locationId) return;
    const startedAt = changeEpoch.current;
    const filters = laneOnlyFilters(lane);
    fetchSaved(locationId, { page: 1, limit: 1, ...(filters ? { filters } : {}) })
      .then((r) => {
        if (changeEpoch.current === startedAt && laneRef.current === lane) setTotal(r.total);
      })
      .catch((err) => console.error("Failed to count saved opportunities", err));
  }, [locationId, lane]);

  const adjust = useCallback((delta: number) => {
    changeEpoch.current += 1;
    setTotal((n) => (n == null ? n : Math.max(0, n + delta)));
  }, []);

  useEffect(() => {
    refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  return { savedTotal: total, adjustSavedTotal: adjust, refreshSavedTotal: refresh };
}

// Debounced, abortable fetch of per-facet-value result counts for the
// filters drawer (LocationPicker's state/city counts, WorkPicker's NAICS
// counts). Mirrors the AbortController + debounce pattern used for the main
// discover fetch in routes/index.tsx (search "single server-authoritative
// page-1 fetch").

import { useEffect, useRef, useState } from "react";
import { fetchFacetCounts, type FacetCountsDto, type ServerFilters } from "./discoverApi";

const FACET_COUNTS_DEBOUNCE_MS = 300;

/**
 * Fetches facet counts for the given server filters whenever `active` is true
 * (the drawer is open) and `filters` changes, debounced so rapid filter edits
 * coalesce into one request. Returns null until the first successful response
 * arrives; callers treat null as "no live counts yet" and render option rows
 * without counts rather than blocking.
 */
export function useFacetCounts(filters: ServerFilters, active: boolean): FacetCountsDto | null {
  const [counts, setCounts] = useState<FacetCountsDto | null>(null);
  // Filters is a fresh object every render (toServerFilters rebuilds it), so
  // key the effect off its JSON — comparing by reference would refetch on
  // every keystroke render even when the effective filter shape is unchanged.
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetchFacetCounts(filters, controller.signal)
        .then((res) => {
          if (cancelled) return;
          setCounts(res);
        })
        .catch(() => {
          // Best-effort — counts are a progressive enhancement, not required
          // for the pickers to function. Aborted requests land here too and
          // are silently dropped.
        });
    }, FACET_COUNTS_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, filtersKey]);

  return counts;
}

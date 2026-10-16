// The debounce/abort/degrade shell behind a remote typeahead — one place for
// every catalog too large to ship to the client (the NAICS taxonomy, the PSC
// taxonomy). Debounce and abort follow lib/useFacetCounts.ts.
//
// This is also the single degradation point for such a lookup. A request that
// fails leaves ZERO rows and an explicit `failed` status: the caller can then
// say the lookup is down, which is a different claim from "no matches", and
// neither claim invents a row.

import { useEffect, useState } from "react";

/** Keystrokes inside this window coalesce into one request. */
const SEARCH_DEBOUNCE_MS = 250;

/** `idle` = nothing asked for yet; `failed` = the lookup is down, not empty. */
export type SearchStatus = "idle" | "loading" | "ready" | "failed";

/** What a remote typeahead has to render: the rows, and why there are none. */
export type RemoteSearch<T> = {
  results: readonly T[];
  status: SearchStatus;
};

const NOTHING_ASKED = { results: [], status: "idle" } as const;

/**
 * Runs `search` for the settled `query`, debounced and abortable. An empty
 * query never reaches the network. Pass a STABLE `search` reference (a module
 * function, not an inline arrow) — the effect keys off it.
 */
export function useDebouncedSearch<T>(
  search: (query: string, signal?: AbortSignal) => Promise<T[]>,
  query: string,
  debounceMs: number = SEARCH_DEBOUNCE_MS,
): RemoteSearch<T> {
  const [state, setState] = useState<RemoteSearch<T>>(NOTHING_ASKED);
  const settled = query.trim();

  useEffect(() => {
    if (!settled) {
      setState(NOTHING_ASKED);
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    setState((prev) => ({ results: prev.results, status: "loading" }));
    const timer = window.setTimeout(() => {
      search(settled, controller.signal)
        .then((results) => {
          if (!cancelled) setState({ results, status: "ready" });
        })
        .catch(() => {
          if (!cancelled) setState({ results: [], status: "failed" });
        });
    }, debounceMs);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [search, settled, debounceMs]);

  return state;
}

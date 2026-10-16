// Two-level location filter: state → city, with cascade selection.
// Checking a state includes all its cities (the default — "apply everything").
// Expand a state to narrow to specific cities; unchecking one city converts a
// whole-state selection into "everywhere except that city". An empty selection
// means no location filter at all.
//
// Ported from govpreneurs-v2/src/components/Hunter/LocationPicker.tsx, adapted
// to live data: the state catalog is lib/vocab/usStates' STATES, and each
// state's city list is lazily fetched via discoverApi.fetchCities(state) the
// first time that state is expanded (city gazetteer is per-state, so we don't
// fetch every state's cities upfront).
//
// CITY-ID CONTRACT: city ids/labels here are BARE city names (e.g. "Houston"),
// never "City, ST" composites — this matches what fetchCities() returns as
// each city's `city` field, and what the live backend's popCity filter (and
// toServerFilters' location.cities) expect. Two different states sharing a
// bare city name (e.g. "Springfield" in IL and MO) is a pre-existing ambiguity
// in the filter model, not something introduced here.

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Minus, Search, X } from "lucide-react";
import { FromProfileTag } from "./FromProfileTag";
import { fetchCities } from "../../lib/discoverApi";
import { cityRowsToNodes } from "../../lib/opportunityFilters";
import { stateName } from "../../lib/vocab/usStates";
import type { CityNode, StateCityGroup } from "../../lib/mock/govTaxonomy";

type Status = "all" | "some" | "none";

export function LocationPicker({
  groups,
  states,
  cities,
  onChange,
  stateCounts,
  cityCounts,
  prefilledStates,
}: {
  /** Seed groups — normally just `{ state, cities: [] }` per state; cities fill in lazily on expand. */
  groups: StateCityGroup[];
  states: string[];
  cities: string[];
  onChange: (next: { states: string[]; cities: string[] }) => void;
  stateCounts?: Record<string, number>;
  cityCounts?: Record<string, number>;
  prefilledStates?: Set<string>;
}) {
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  // Cities fetched so far, keyed by state — merged over the seed `groups` cities.
  const [loadedCities, setLoadedCities] = useState<Record<string, CityNode[]>>({});
  const [loadingStates, setLoadingStates] = useState<Set<string>>(() => new Set());

  const needle = q.trim().toLowerCase();

  // Merge lazily-fetched cities over the seed groups so callers can pass
  // `{ state, cities: [] }` placeholders and let this component own fetching.
  const mergedGroups = useMemo<StateCityGroup[]>(
    () => groups.map((g) => ({ state: g.state, cities: loadedCities[g.state] ?? g.cities })),
    [groups, loadedCities],
  );

  const cityIdsOf = (g: StateCityGroup) => g.cities.map((c) => c.id);

  // Resolves the FULL (unfiltered) group for a state from `mergedGroups`, so
  // cascade math never runs against a search-truncated group. Callers in the
  // render loop may hold a `visible` group whose `.cities` was rewritten to
  // just the search hits (see `visible` below) — always look up the real
  // group by state before computing status or mutating selections.
  const fullGroupOf = (state: string): StateCityGroup =>
    mergedGroups.find((mg) => mg.state === state) ?? { state, cities: [] };

  const statusOf = (g: StateCityGroup): Status => {
    const full = fullGroupOf(g.state);
    if (states.includes(full.state)) return "all";
    return cityIdsOf(full).some((id) => cities.includes(id)) ? "some" : "none";
  };

  const clearGroupCities = (g: StateCityGroup, list: string[]) => {
    const full = fullGroupOf(g.state);
    return list.filter((id) => !cityIdsOf(full).includes(id));
  };

  const onStateClick = (g: StateCityGroup) => {
    const full = fullGroupOf(g.state);
    const status = statusOf(full);
    if (status === "none") {
      onChange({ states: [...states, full.state], cities: clearGroupCities(full, cities) });
    } else {
      onChange({
        states: states.filter((s) => s !== full.state),
        cities: clearGroupCities(full, cities),
      });
    }
  };

  const onCityClick = (g: StateCityGroup, cityId: string) => {
    const full = fullGroupOf(g.state);
    if (statusOf(full) === "all") {
      // Whole state → everywhere except the unchecked city.
      onChange({
        states: states.filter((s) => s !== full.state),
        cities: [...cities, ...cityIdsOf(full).filter((id) => id !== cityId)],
      });
      return;
    }
    let nextCities = cities.includes(cityId)
      ? cities.filter((id) => id !== cityId)
      : [...cities, cityId];
    // Every city selected → collapse back to the whole state. Must check
    // against the FULL city list, not just the visible/search-filtered one —
    // otherwise selecting all *visible* cities of a partially-shown state
    // would incorrectly collapse to whole-state.
    if (cityIdsOf(full).length > 0 && cityIdsOf(full).every((id) => nextCities.includes(id))) {
      nextCities = clearGroupCities(full, nextCities);
      onChange({ states: [...states, full.state], cities: nextCities });
    } else {
      onChange({ states, cities: nextCities });
    }
  };

  // Lazy-fetch-on-expand: the first time a state is expanded, fetch its city
  // list from the backend gazetteer (GET /opportunities/filters/cities?state=XX)
  // rather than loading every state's cities upfront.
  const loadCitiesFor = (state: string) => {
    if (loadedCities[state] || loadingStates.has(state)) return;
    setLoadingStates((prev) => new Set(prev).add(state));
    fetchCities(state)
      .then((groupsForState) => {
        const match = groupsForState.find((g) => g.state === state);
        const nodes: CityNode[] = cityRowsToNodes(match?.cities ?? []);
        setLoadedCities((prev) => ({ ...prev, [state]: nodes }));
      })
      .catch(() => {
        // Best-effort — leave the seed (usually empty) city list in place.
      })
      .finally(() => {
        setLoadingStates((prev) => {
          const next = new Set(prev);
          next.delete(state);
          return next;
        });
      });
  };

  const toggleExpand = (state: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(state)) next.delete(state);
      else next.add(state);
      return next;
    });
    loadCitiesFor(state);
  };

  // A search hit on a city name requires that state's cities to already be
  // loaded to be found — load every state's cities on search as a fallback so
  // "search a city" still works, at the cost of a fetch per state once a
  // query is typed (acceptable: only triggered by explicit search intent).
  useEffect(() => {
    if (!needle) return;
    for (const g of groups) loadCitiesFor(g.state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needle]);

  const visible = useMemo(() => {
    if (!needle) return mergedGroups;
    return mergedGroups
      .map((g) => {
        if (
          g.state.toLowerCase().includes(needle) ||
          stateName(g.state).toLowerCase().includes(needle)
        )
          return g;
        const cityHits = g.cities.filter((c) => c.label.toLowerCase().includes(needle));
        return cityHits.length ? { ...g, cities: cityHits } : null;
      })
      .filter(Boolean) as StateCityGroup[];
  }, [needle, mergedGroups]);

  return (
    <div className="of-ms">
      <div className="of-ms__search">
        <Search size={12} aria-hidden />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a state or city…"
          aria-label="Search states or cities"
        />
        {q && (
          <button
            type="button"
            className="of-ms__clear"
            onClick={() => setQ("")}
            aria-label="Clear search"
          >
            <X size={11} />
          </button>
        )}
      </div>

      <ul className="of-ms__list of-ms__list--tall" role="tree">
        {visible.length === 0 ? (
          <li className="of-ms__empty">No matching places</li>
        ) : (
          visible.map((g) => {
            const status = statusOf(g);
            const isExpanded = expanded.has(g.state) || !!needle;
            const count = stateCounts?.[g.state];
            const isZero = count === 0 && status === "none";
            const prefilled = prefilledStates?.has(g.state) && status === "all";
            const isLoading = loadingStates.has(g.state);
            return (
              <li key={g.state} className="wp-trade" role="treeitem" aria-expanded={isExpanded}>
                <div className={`wp-trade__row${isZero ? " of-option--zero" : ""}`}>
                  <button
                    type="button"
                    className={`of-option wp-trade__main${status === "all" ? " of-option--on" : ""}`}
                    onClick={() => onStateClick(g)}
                    aria-pressed={status !== "none"}
                  >
                    <span
                      className={`of-option__box${status === "all" ? " is-on" : ""}${status === "some" ? " is-mixed" : ""}`}
                      aria-hidden
                    >
                      {status === "all" && <Check size={11} strokeWidth={3} />}
                      {status === "some" && <Minus size={11} strokeWidth={3} />}
                    </span>
                    <span className="of-option__main">
                      <span className="of-option__label">
                        <span>{stateName(g.state)}</span>
                        {prefilled && <FromProfileTag />}
                      </span>
                      <span className="of-option__detail">
                        {g.cities.length > 0
                          ? `${g.cities.length} ${g.cities.length === 1 ? "city" : "cities"}`
                          : isLoading
                            ? "loading cities…"
                            : "expand for cities"}
                        {status === "some" &&
                          ` · ${cityIdsOf(g).filter((id) => cities.includes(id)).length} selected`}
                      </span>
                    </span>
                    {count !== undefined && <span className="of-option__count">{count}</span>}
                  </button>
                  <button
                    type="button"
                    className="wp-trade__expand"
                    onClick={() => toggleExpand(g.state)}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? "Hide cities" : "Show cities"}
                  >
                    {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                </div>
                {isExpanded && (
                  <ul className="wp-codes" role="group">
                    {g.cities.length === 0 && (
                      <li className="of-ms__empty">
                        {isLoading ? "Loading cities…" : "No cities on file for this state"}
                      </li>
                    )}
                    {g.cities.map((c) => {
                      const on = status === "all" || cities.includes(c.id);
                      const cc = cityCounts?.[c.id];
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            className={`of-option of-option--compact wp-code${on ? " of-option--on" : ""}`}
                            onClick={() => onCityClick(g, c.id)}
                            role="treeitem"
                            aria-selected={on}
                          >
                            <span className={`of-option__box${on ? " is-on" : ""}`} aria-hidden>
                              {on && <Check size={11} strokeWidth={3} />}
                            </span>
                            <span className="of-option__main">
                              <span className="of-option__label">
                                <span>{c.label}</span>
                              </span>
                            </span>
                            {cc !== undefined && <span className="of-option__count">{cc}</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })
        )}
      </ul>

      {(states.length > 0 || cities.length > 0) && (
        <div className="of-ms__foot">
          <button
            type="button"
            className="of-ms__clear-all"
            onClick={() => onChange({ states: [], cities: [] })}
          >
            Clear location
          </button>
        </div>
      )}
    </div>
  );
}

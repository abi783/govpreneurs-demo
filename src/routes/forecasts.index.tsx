// Forecasts — work the government plans to buy, for her business. The server selects,
// filters, sorts, counts and pages the list (ARCHITECTURE-forecasts-paginated.md);
// this page shows one page at a time and asks the next one on scroll
// (lib/forecasts/useForecastList.ts). The URL is the list's state, and the URL drives
// the request.
//
// Three views, in the same control as Opportunities: Forecasts for you (her match
// rows), All forecasts (every active forecast) and Saved (the ones she tracks). One
// question sits above the list ("When will they ask for bids?"), with the four
// Capture Status answers and their day ranges on the page. Filters and Sort sit
// beside the search, in the Opportunities design. Cards are the Hunter opportunity
// card. The view badges, the capture tabs and the drawer's options read the server's
// page-1 counts. Forecasts for you says how many more are in All forecasts, and why.
//
// Hunter is the real chat, docked on the right as on Opportunities. It is told the
// page is `forecasts` and which cards are on screen. What it narrows goes into this
// page's URL (lib/forecasts/hunterFilters.ts). A filter the list cannot use is named
// in one line under the reply. Its tool answers go on the stage above the list.

import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { usePageMeta } from "../components/Layout/page-meta";
import { AgentAvatar } from "../components/Companion/AgentAvatar";
import { OpportunitiesTabs, type OppTab } from "../components/Hunter/OpportunitiesTabs";
import { CaptureTabs, type TabValue } from "../components/Forecast/CaptureTabs";
import { ForecastCard } from "../components/Forecast/ForecastCard";
import { ForecastFiltersDrawer } from "../components/Forecast/ForecastFiltersDrawer";
import { FeedErrorNotice } from "../components/Hunter/FeedErrorNotice";
import { FeedLoadingState } from "../components/Hunter/FeedLoadingState";
import {
  HunterChatOverlay,
  type HunterFiltersApplied,
} from "../components/Hunter/HunterChatOverlay";
import { StageCardMount } from "../components/Hunter/Stage/StageCard";
import { StageStoreProvider, useStageStore } from "../lib/hunter/stageStore";
import type { DiscoveryPayload, VisibleOpp } from "../lib/hunterChat";
import {
  CAPTURE_ORDER,
  FILTERS,
  HUNTER_FILTER_NOTE,
  LANE_LABEL,
  LIST_COPY,
  TAB_NOTE,
  type Lane,
} from "../lib/forecasts/copy";
import {
  EMPTY_FILTERS,
  activeFilterCount,
  filtersFromSearch,
  readFilterSearch,
  searchFromFilters,
  type ForecastSort,
} from "../lib/forecasts/filters";
import {
  applyHunterDiscovery,
  appliedHunterFilters,
  clearedForecastSearch,
  forecastSearchForTab,
} from "../lib/forecasts/hunterFilters";
import { listSort, sortsForView, urlSortFor } from "../lib/forecasts/listQuery";
import type { ForecastsSearch } from "../lib/forecasts/search";
import { useForecastCardTakes } from "../lib/forecasts/useForecastCardTakes";
import { useForecastList, type ForecastListItem } from "../lib/forecasts/useForecastList";
import type { ForecastViewCounts } from "../lib/forecastsApi";
import {
  isTracked,
  recordServerSaveChange,
  toggleTracked,
  useTrackedForecasts,
} from "../lib/trackedForecasts";

const VIEWS: OppTab[] = ["for_you", "all", "saved"];
const TABS: TabValue[] = ["all", ...CAPTURE_ORDER];
const LANES: Lane[] = ["all", "federal", "sled"];

function validateSearch(input: Record<string, unknown>): ForecastsSearch {
  return {
    view: VIEWS.includes(input.view as OppTab) ? (input.view as OppTab) : undefined,
    tab: TABS.includes(input.tab as TabValue) ? (input.tab as TabValue) : undefined,
    lane: LANES.includes(input.lane as Lane) ? (input.lane as Lane) : undefined,
    q: typeof input.q === "string" && input.q ? input.q : undefined,
    ...readFilterSearch(input),
  };
}

export const Route = createFileRoute("/forecasts/")({
  validateSearch,
  head: () => ({
    meta: [
      { title: "Forecasts — Explore · GovPreneurs" },
      { name: "description", content: LIST_COPY.intro },
    ],
  }),
  component: ForecastsPage,
});

/** What Hunter is told about one card: the id, the title and the place the card shows. */
function visibleOpp(f: ForecastListItem): VisibleOpp {
  return { oppKey: f.id, title: f.facts.title, location: f.place.label ?? undefined };
}

/** How many forecasts All holds beyond For you. For you is a subset of All. */
function moreInAllCount(view: OppTab, counts: ForecastViewCounts | null): number {
  if (view !== "for_you" || !counts) return 0;
  return Math.max(0, counts.all - counts.for_you);
}

// The stage store wraps the page from outside, as on Opportunities, so a card on
// the stage never re-renders the provider and never unmounts the list.
function ForecastsPage() {
  return (
    <StageStoreProvider>
      <ForecastsPageBody />
    </StageStoreProvider>
  );
}

function ForecastsPageBody() {
  // Wide, as on Opportunities, so Hunter's panel docks flush on the right.
  usePageMeta({ layout: "wide" });
  const { showArtifact } = useStageStore();
  const [hunterOpen, setHunterOpen] = useState(false);
  const navigate = useNavigate({ from: "/forecasts/" });
  const search = Route.useSearch();
  const view: OppTab = search.view ?? "for_you";
  const tab: TabValue = search.tab ?? "all";
  const lane: Lane = search.lane ?? "all";
  const q = search.q ?? "";
  const filters = filtersFromSearch(search);
  const sort: ForecastSort = listSort(search);
  const activeFilters = activeFilterCount(filters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  function patch(next: Partial<ForecastsSearch>) {
    navigate({ search: (prev: ForecastsSearch) => ({ ...prev, ...next }), replace: true });
  }

  /** Replaces the whole search with the one that Hunter's answer gives. */
  function go(next: ForecastsSearch) {
    navigate({ search: next, replace: true });
  }

  /** Moves to a view. The sort stays unless it is the new view's default, or not offered there. */
  function switchView(next: OppTab) {
    patch({
      view: next === "for_you" ? undefined : next,
      tab: undefined,
      sort: urlSortFor(next, sort),
    });
  }

  /** Applies Hunter's filters to the list. Returns the filters the list applied, and
   *  the line that names the filters it did not use (null when it used every one). */
  function applyHunterFilters(p: DiscoveryPayload): HunterFiltersApplied {
    const result = applyHunterDiscovery(p, search);
    go(result.search);
    return {
      applied: appliedHunterFilters(p.filters, result.unsupported),
      note: HUNTER_FILTER_NOTE.line(result.unsupported) || null,
    };
  }

  useTrackedForecasts();
  const list = useForecastList(search);
  const { rows, total, captureCounts, viewCounts, facets } = list;
  // Hunter's AI line per card, fetched in windows as she scrolls. Until a line arrives,
  // or if none does, the card shows its rule-built line.
  const { takes, sentinelIndex, sentinelRef } = useForecastCardTakes(rows.map((f) => f.id));
  const moreInAll = moreInAllCount(view, viewCounts);

  return (
    <div className="fc-shell">
      <div className="fc-page">
        <header className="fc-page__head">
          <h1 className="t-display-lg">{LIST_COPY.title}</h1>
          <p className="t-body-sm fc-page__intro">{LIST_COPY.intro}</p>
        </header>

        <CaptureTabs
          value={tab}
          counts={captureCounts}
          allAdvice={sort === "match" ? undefined : FILTERS.sort[sort]}
          onChange={(t) => patch({ tab: t === "all" ? undefined : t })}
        />

        {/* The three views and the buyer switch share one row. The search runs full width below. */}
        <div className="fc-viewbar">
          <OpportunitiesTabs
            tab={view}
            onChange={switchView}
            openCount={viewCounts?.for_you ?? null}
            allCount={viewCounts?.all ?? null}
            savedCount={viewCounts?.saved ?? null}
            labels={LIST_COPY.views}
          />
          <div className="fc-lanes" role="radiogroup" aria-label={LIST_COPY.laneQuestion}>
            {LANES.map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={lane === l}
                className={`fc-lane${lane === l ? " is-on" : ""}`}
                onClick={() => patch({ lane: l === "all" ? undefined : l })}
              >
                {LANE_LABEL[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Search, with Filters and Sort on its line, as on Opportunities. */}
        <div className="fc-searchrow">
          <label className="fc-search">
            <Search size={14} aria-hidden />
            <input
              type="search"
              value={q}
              placeholder={LIST_COPY.searchPlaceholder}
              aria-label={LIST_COPY.searchLabel}
              onChange={(e) => patch({ q: e.target.value || undefined })}
            />
          </label>
          <div className="opps-summary__controls">
            <button
              type="button"
              className="opps-summary__btn opps-summary__btn--primary"
              onClick={() => setFiltersOpen(true)}
              aria-label={FILTERS.open}
            >
              <SlidersHorizontal size={14} />
              <span>{FILTERS.button}</span>
              {activeFilters > 0 && <span className="opps-summary__badge">{activeFilters}</span>}
            </button>
            <label className="opps-summary__sort">
              <span className="opps-summary__sort-label">{FILTERS.sortLabel}</span>
              <span className="opps-summary__sort-trigger">
                <select
                  value={sort}
                  onChange={(e) =>
                    patch({ sort: urlSortFor(view, e.target.value as ForecastSort) })
                  }
                  aria-label={FILTERS.sortAria}
                >
                  {sortsForView(view).map((k) => (
                    <option key={k} value={k}>
                      {FILTERS.sort[k]}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="opps-summary__sort-chev" />
              </span>
            </label>
          </div>
        </div>

        <ForecastFiltersDrawer
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          facets={facets}
          facetsState={list.facetsState}
          total={total}
          filters={filters}
          onChange={(next) => patch({ ...searchFromFilters(next), tab: undefined })}
        />

        <div className="ai-surface-subtle fc-hunter-line">
          <AgentAvatar agent="hunter" size={24} />
          <span className="ai-attr">Hunter</span>
          <span className="fc-hunter-line__text">{LIST_COPY.hunterLine}</span>
        </div>

        {/* Hunter's tool answers show here, above the list, as on Opportunities. */}
        <StageCardMount resultCount={total ?? rows.length} />

        {list.status === "loading" ? (
          <FeedLoadingState label={LIST_COPY.loading} />
        ) : list.status === "error" ? (
          <FeedErrorNotice message={LIST_COPY.loadError} onRetry={list.retry} />
        ) : rows.length > 0 ? (
          <>
            <div className="opp-list fc-list">
              {rows.map((f, index) => (
                <div key={f.id} className="opp-list__item">
                  <ForecastCard
                    forecast={f}
                    match={f.match}
                    aiTake={takes.get(f.id)}
                    tracked={isTracked(f.id)}
                    onToggleTracked={toggleTracked}
                  />
                  {index === sentinelIndex && <div ref={sentinelRef} aria-hidden />}
                </div>
              ))}
            </div>
            {/* The next page is asked when this comes near the screen. */}
            <div ref={list.sentinelRef} aria-hidden />
            {list.loadingMore && <FeedLoadingState label={LIST_COPY.loadingMore} />}
            {list.moreFailed && (
              <FeedErrorNotice message={LIST_COPY.moreError} onRetry={list.retry} />
            )}
          </>
        ) : (
          <EmptyList
            view={view}
            tab={tab}
            q={q}
            lane={lane}
            activeFilters={activeFilters}
            patch={patch}
          />
        )}

        {list.status === "ready" && moreInAll > 0 && (
          <div className="fc-tabnote fc-more" role="note">
            <span>
              {LIST_COPY.moreInAll(moreInAll)} {LIST_COPY.moreWhy}
            </span>
            <button type="button" className="fc-textlink" onClick={() => switchView("all")}>
              {LIST_COPY.seeAll}
            </button>
          </div>
        )}
      </div>
      <HunterChatOverlay
        surface="forecasts"
        open={hunterOpen}
        onOpenChange={setHunterOpen}
        tab={view}
        visibleOpps={rows.map(visibleOpp)}
        onApplyFilters={applyHunterFilters}
        onSwitchTab={(t) => go(forecastSearchForTab(t, search))}
        onReset={() => go(clearedForecastSearch(search))}
        onSaveChange={recordServerSaveChange}
        onStageArtifact={showArtifact}
      />
    </div>
  );
}

/**
 * The words for a view with no rows, and the one control that widens it. The first
 * cause that applies wins: an empty saved list, then her filters, then her search,
 * then the capture tab.
 */
function EmptyList({
  view,
  tab,
  q,
  lane,
  activeFilters,
  patch,
}: {
  view: OppTab;
  tab: TabValue;
  q: string;
  lane: Lane;
  activeFilters: number;
  patch: (next: Partial<ForecastsSearch>) => void;
}) {
  const nothingNarrows = activeFilters === 0 && !q && tab === "all" && lane === "all";
  if (view === "saved" && nothingNarrows) {
    return (
      <div className="fc-empty">
        <p>{LIST_COPY.noSaved}</p>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => patch({ view: "all", tab: undefined, sort: undefined })}
        >
          {LIST_COPY.seeAll}
        </button>
      </div>
    );
  }
  const [text, action, onClick] =
    activeFilters > 0
      ? [
          FILTERS.noMatch,
          FILTERS.clearAll,
          () => patch({ ...searchFromFilters(EMPTY_FILTERS), tab: undefined }),
        ]
      : q
        ? [LIST_COPY.noResults, LIST_COPY.clearSearch, () => patch({ q: undefined })]
        : [
            TAB_NOTE.emptyTab,
            tab !== "all" ? TAB_NOTE.showAll : null,
            () => patch({ tab: undefined }),
          ];
  return (
    <div className="fc-empty">
      <p>{text}</p>
      {action && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onClick}>
          {action}
        </button>
      )}
    </div>
  );
}

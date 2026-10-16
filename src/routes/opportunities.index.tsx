import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { AlertTriangle, FolderKanban, X } from "lucide-react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { isEmbeddedInGhl, requestCrossPageNav } from "../lib/ghlNav";
import { usePageMeta } from "../components/Layout/page-meta";
import { type SortKey, OppsSummaryRow } from "../components/Hunter/OppsSummaryRow";
import { OpportunityCard } from "../components/Hunter/OpportunityCard";
import { FiltersDrawer } from "../components/Hunter/FiltersDrawer";
import { HeroSearchField } from "../components/Hunter/HeroSearchField";
import { HunterChatOverlay } from "../components/Hunter/HunterChatOverlay";
import { StageCardMount } from "../components/Hunter/Stage/StageCard";
import { StageStoreProvider, useStageStore } from "../lib/hunter/stageStore";
import { MatchesGenerating } from "../components/Hunter/MatchesGenerating";
import { FeedLoadingState } from "../components/Hunter/FeedLoadingState";
import { FeedErrorNotice, FEED_LOAD_ERROR_MESSAGE } from "../components/Hunter/FeedErrorNotice";
import { shouldShowMatchesGenerating } from "../lib/matchesGenerating";
import {
  evaluateSmartList,
  INITIAL_SAVED_LISTS,
  type SavedSmartList,
  type SmartList,
} from "../lib/smartList";
// `STRETCH_MODE_OPPORTUNITIES` is `[]` and carries no fabricated data, so it
// stays. Do not "tidy" it into an inline `[]`: the value feeds a `useMemo`, and
// a literal there returns a NEW array reference on every recompute. That is a
// render-behaviour change nothing here can prove inert.
import { STRETCH_MODE_OPPORTUNITIES, type CardOpportunity } from "../lib/mock/opportunities";
import {
  fetchWorkspace,
  addSavedOpp,
  removeSavedOpp,
  addSavedSearch,
  removeSavedSearch,
} from "../lib/workspace";
import { fetchDiscoverV2, fetchFilterDefaults, type ServerFilters } from "../lib/discoverApi";
import { fetchAll } from "../lib/all";
import { fetchSaved } from "../lib/saved";
import { useSavedTotal } from "../lib/useSavedTotal";
import { recordServerSaveChange } from "../lib/trackedForecasts";
import { type DiscoveryPayload, resetHunterSession } from "../lib/hunterChat";
import { mapToCardOpportunity } from "../lib/discoverMapper";
import { useNaicsDescriptions } from "../lib/useNaicsDescriptions";
import {
  applyFeedScroll,
  createRestoreGate,
  OPP_KEY_ATTR,
  feedSnapshotKey,
  topmostVisibleAnchor,
  saveFeedSnapshot,
  type FeedAnchor,
  type FeedSnapshot,
} from "../lib/feedSnapshot";
import { recallFeedView, rememberFeedView } from "../lib/feedViewMemory";
import {
  shouldShowPreview,
  fetchPreview,
  mapPreviewToCard,
  fetchPreviewAnswers,
  isSkippedAnswers,
  summarizePreviewAnswers,
  capabilityStatementUrl,
  type PreviewResponse,
  type PreviewAnswers,
} from "../lib/preview";
import { WarmStartWizard } from "../components/Hunter/WarmStartWizard";
import { buildActiveChips } from "../components/Hunter/filterChips";
import { fetchHuntersTakes } from "../lib/huntersTakeApi";
import { DeleteSavedSearchModal } from "../components/Hunter/SavedSearchModals";
import { useGhlUser } from "../lib/ghlUser";
import { useBusinessProfile } from "../lib/businessProfile";
import { HunterStrip, MeetHunter } from "../components/Companion/FirstMeeting";
import { useLiveSlice } from "../lib/eventBus";
import { MET_HUNTER_KEY, readFlag, writeFlag } from "../lib/onboardingStorage";
import { isPilotPlan } from "../lib/plans";
import { PilotUpsellGate } from "../components/Hunter/PilotUpsellGate";
import { LockedOpportunitiesBackdrop } from "../components/Hunter/LockedOpportunitiesBackdrop";
import { OpportunitiesTabs, type OppTab } from "../components/Hunter/OpportunitiesTabs";
import { BuyerLaneSwitch } from "../components/Hunter/BuyerLaneSwitch";
import { laneFromScope, laneOnlyFilters, withLane, type BuyerLane } from "../lib/buyerLane";
import { daysUntil } from "../lib/format";
import { FACET_DEBOUNCE_MS, SEARCH_DEBOUNCE_MS } from "../lib/feedDebounce";
// DEMO: the demo's chat and facet counts read what the page shows (src/demo/hunter/feedContext.ts).
import { publishFeedContext } from "../demo/hunter/feedContext";
import "../demo/hunter/hunter.css";
import {
  applyProfileDefaults,
  countActive,
  emptyFilters,
  hasProfileFacets,
  toServerFilters,
  withoutCategories,
  type OpportunityFilters,
  type ProfileFilterDefaults,
} from "../lib/opportunityFilters";

const MATCHES_POLL_INTERVAL_MS = 5000;
const MAX_MATCHES_POLL_FAILURES = 3;

/**
 * Records a failed feed request and returns the sentence the member reads.
 *
 * The thrown error carries the backend's own `message` (`buildApiError`), which
 * may hold an internal path, an id or a stack fragment. That belongs in the
 * console, where an engineer reads it — never on screen. The member gets one
 * fixed sentence instead.
 */
function memberFacingFeedError(context: string, err: unknown): string {
  console.error(context, err);
  return FEED_LOAD_ERROR_MESSAGE;
}

export const Route = createFileRoute("/opportunities/")({
  head: () => ({
    meta: [
      { title: "Opportunities — Hunter · GovPreneurs" },
      {
        name: "description",
        content:
          "Hunter, the GovPreneurs discovery agent, surfaces federal opportunities matched to your business profile.",
      },
    ],
  }),
  component: OpportunitiesPage,
});

/**
 * Route component. Enforces the Pilot wall at the COMPONENT BOUNDARY, not with
 * CSS: Pilot-plan users never mount `OpportunitiesFeed` (which is what calls the
 * discover / workspace / filter-defaults / hunter's-take APIs). Instead they get
 * a static mock backdrop behind the upsell gate. Because the real feed is never
 * rendered, there is no `/opportunities/discover/v2` request to intercept in the
 * Network tab and no real opportunity data in the DOM — so removing the blur in
 * devtools cannot reveal protected content. (Server-side enforcement on the
 * discover endpoints is still the real security boundary; this closes the
 * client-side leak.)
 */
function OpportunitiesPage() {
  const { session } = useGhlUser();
  const locked = isPilotPlan(session?.productId ?? null);

  if (locked) {
    return (
      <PilotUpsellGate unlocked={false}>
        <LockedOpportunitiesBackdrop />
      </PilotUpsellGate>
    );
  }

  // The stage store wraps the feed from OUTSIDE it, so putting an artifact on
  // the stage or dismissing one never re-renders the provider's own boundary
  // and never unmounts the opportunity list underneath.
  return (
    <StageStoreProvider>
      <OpportunitiesFeed />
    </StageStoreProvider>
  );
}

type SavedFilterSet = { id: string; name: string; filters: OpportunityFilters };

/**
 * Revives a saved filters object coming back from the API. `prefilled` is a
 * Set, which JSON-serializes to `{}` — restore it to a real Set so components
 * that call `filters.prefilled.has(...)` don't crash. A search saved when the
 * menu still had an opportunity-type filter loses its `categories`: the page
 * holds contracts only. It also loses a `scope`: the buyer lane is page
 * state and is not saved with a search.
 *
 * Exported for testability (round-trip unit test).
 */
export function reviveSavedFilters(raw: OpportunityFilters): OpportunityFilters {
  const pf = (raw as { prefilled?: unknown }).prefilled;
  const revived: OpportunityFilters & { scope?: unknown } = {
    ...withoutCategories(raw),
    prefilled: new Set(Array.isArray(pf) ? (pf as string[]) : []),
  };
  delete revived.scope;
  return revived;
}

type State = {
  filters: OpportunityFilters;
  sort: SortKey;
  savedIds: Set<string>;
  chatOpen: boolean;
  exploreOpen: boolean;
  searchValue: string;
  parsing: boolean;
  parsedQuery: string | null;
  mode: "default" | "stretches";
  tab: OppTab;
  smartList: SmartList | null;
  builderOpen: boolean;
  customizeOpen: boolean;
  savedLists: SavedSmartList[];
  activeSavedListId: string | null;
  savedFilters: SavedFilterSet[];
  // Per-tab snapshot of the applied filters/search/sort for the tabs the member
  // is NOT currently on. Switching tabs stashes the active values here and
  // restores the target tab's own — so For You and All Opportunities never share
  // applied filters, search text, sort or the counts those drive.
  tabStash: Partial<Record<OppTab, TabScopedState>>;
  // The buyer lane. It is NOT per tab: it stays the same when the member
  // changes tabs, as on the forecasts page. See lib/buyerLane.ts.
  lane: BuyerLane;
};

/** The slice of feed state that is isolated per tab (see State.tabStash). */
type TabScopedState = Pick<State, "filters" | "sort" | "searchValue">;

/** The slice of feed state that survives opening an opportunity and coming
 *  back: the active tab, its filters/sort/search, every other tab's stash, and
 *  the buyer lane. */
type RememberedView = TabScopedState & Pick<State, "tab" | "tabStash" | "lane">;

/** Starts the feed from the view the member left for this location, if any.
 *  Returns `INITIAL` itself when there is nothing to restore. */
function initFeedState(locationId: string | undefined): State {
  const view = recallFeedView<RememberedView>(locationId);
  return view ? { ...INITIAL, ...view } : INITIAL;
}

/** My Bids / Pipeline lives on its own GHL custom page (a separate iframe). When
 *  embedded, relay through the parent frame instead of navigating inside this
 *  iframe — the mirror of the Pipeline page's "Browse opportunities" redirect.
 *  Standalone (local dev / direct access) it's a single SPA, so fall through to
 *  the <Link>'s in-app navigation. */
function openPipeline(e: React.MouseEvent) {
  if (!isEmbeddedInGhl()) return;
  e.preventDefault();
  requestCrossPageNav("pipeline", "/pipeline");
}

/** What a tab shows the first time it's opened, before anything is applied there.
 *  For You ranks by match; Saved defaults to Recently saved; All defaults to Newest. */
function defaultTabSlice(tab: OppTab): TabScopedState {
  return {
    filters: emptyFilters(),
    sort: tab === "for_you" ? "match" : tab === "saved" ? "saved" : "newest",
    searchValue: "",
  };
}

type Action =
  | { type: "set-filters"; filters: OpportunityFilters }
  | { type: "clear-all-filters" }
  // DEMO: Hunter's "Start over" also clears the filters that the other tabs hold.
  | { type: "clear-other-tabs" }
  | { type: "set-sort"; sort: SortKey }
  | { type: "set-tab"; tab: OppTab }
  | { type: "set-lane"; lane: BuyerLane }
  | { type: "toggle-saved"; id: string }
  | { type: "hydrate-saved"; ids: string[] }
  | { type: "set-chat"; open: boolean }
  | { type: "toggle-explore" }
  | { type: "set-search"; value: string }
  | { type: "submit-start" }
  | { type: "submit-complete"; query: string }
  | { type: "enter-stretches" }
  | { type: "exit-stretches" }
  | { type: "open-customize" }
  | { type: "close-customize" }
  | { type: "open-builder" }
  | { type: "close-builder" }
  | { type: "smartlist-apply"; list: SmartList }
  | { type: "smartlist-clear" }
  | { type: "smartlist-remove-condition"; groupId: string; conditionId: string }
  | { type: "smartlist-save"; name: string; list: SmartList }
  | { type: "smartlist-apply-saved"; id: string }
  | { type: "set-saved-filters"; saved: SavedFilterSet[] }
  | { type: "add-saved-filter"; saved: SavedFilterSet }
  | { type: "remove-saved-filter"; id: string };

// Exported for testability (tab-isolation unit tests).
export const INITIAL: State = {
  filters: emptyFilters(),
  sort: "match",
  savedIds: new Set<string>(),
  chatOpen: false,
  exploreOpen: false,
  searchValue: "",
  parsing: false,
  parsedQuery: null,
  mode: "default",
  tab: "for_you",
  smartList: null,
  builderOpen: false,
  customizeOpen: false,
  savedLists: INITIAL_SAVED_LISTS,
  activeSavedListId: null,
  savedFilters: [],
  tabStash: {},
  lane: "all",
};

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "set-filters":
      return { ...state, filters: action.filters };
    case "clear-all-filters":
      // Search is not a facet filter (countActive/the Filters badge ignore it),
      // but every "Clear all" entry point (chip row, empty state, drawer footer)
      // should still drop an active search — mirrors HunterChatOverlay's onReset,
      // which already dispatches clear-all-filters + set-search("") together.
      return { ...state, filters: emptyFilters(), searchValue: "" };
    case "clear-other-tabs":
      return { ...state, tabStash: {} };
    case "set-sort":
      return { ...state, sort: action.sort };
    case "set-tab": {
      if (action.tab === state.tab) return state;
      // Stash the tab we're leaving and restore the target tab's own applied
      // filters/search/sort (or its defaults the first time it's opened), so the
      // two feeds stay fully isolated. The refetch that follows recomputes that
      // tab's result + facet counts from its own restored filters.
      const leaving: TabScopedState = {
        filters: state.filters,
        sort: state.sort,
        searchValue: state.searchValue,
      };
      const restored = state.tabStash[action.tab] ?? defaultTabSlice(action.tab);
      return {
        ...state,
        tab: action.tab,
        tabStash: { ...state.tabStash, [state.tab]: leaving },
        ...restored,
      };
    }
    case "set-lane":
      // Every tab keeps its own filters; only the lane changes, for all tabs.
      return action.lane === state.lane ? state : { ...state, lane: action.lane };
    case "toggle-saved": {
      const next = new Set(state.savedIds);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, savedIds: next };
    }
    case "hydrate-saved":
      return { ...state, savedIds: new Set(action.ids) };
    case "set-chat":
      return { ...state, chatOpen: action.open };
    case "toggle-explore":
      return { ...state, exploreOpen: !state.exploreOpen };
    case "set-search":
      return { ...state, searchValue: action.value };
    case "submit-start":
      return { ...state, parsing: true };
    case "submit-complete":
      return {
        ...state,
        parsing: false,
        parsedQuery: action.query,
      };
    case "enter-stretches":
      return { ...state, mode: "stretches" };
    case "exit-stretches":
      return { ...state, mode: "default" };
    case "open-customize":
      return { ...state, customizeOpen: true };
    case "close-customize":
      return { ...state, customizeOpen: false, builderOpen: false };
    case "open-builder":
      return { ...state, builderOpen: true };
    case "close-builder":
      return { ...state, builderOpen: false };
    case "smartlist-apply":
      return { ...state, smartList: action.list, builderOpen: false };
    case "smartlist-clear":
      return { ...state, smartList: null, builderOpen: false, activeSavedListId: null };
    case "smartlist-remove-condition": {
      if (!state.smartList) return state;
      const groups = state.smartList.groups
        .map((g) =>
          g.id === action.groupId
            ? { ...g, conditions: g.conditions.filter((c) => c.id !== action.conditionId) }
            : g,
        )
        .filter((g) => g.conditions.length > 0);
      if (groups.length === 0) return { ...state, smartList: null, activeSavedListId: null };
      return { ...state, smartList: { ...state.smartList, groups }, activeSavedListId: null };
    }
    case "smartlist-save": {
      const id = `saved-${Date.now().toString(36)}`;
      return {
        ...state,
        savedLists: [...state.savedLists, { id, name: action.name, tree: action.list }],
        smartList: action.list,
        builderOpen: false,
        activeSavedListId: id,
      };
    }
    case "smartlist-apply-saved": {
      const found = state.savedLists.find((l) => l.id === action.id);
      if (!found) return state;
      return { ...state, smartList: found.tree, builderOpen: false, activeSavedListId: found.id };
    }
    case "set-saved-filters":
      return { ...state, savedFilters: action.saved };
    case "add-saved-filter":
      return { ...state, savedFilters: [...state.savedFilters, action.saved] };
    case "remove-saved-filter":
      return {
        ...state,
        savedFilters: state.savedFilters.filter((s) => s.id !== action.id),
      };
  }
}

// Server page size. The feed is server-authoritative: every filter / sort /
// search change refetches page 1, and scrolling appends the next page.
const PAGE = 50;
/** The orders that the Saved feed offers. The server applies the order. */
const SAVED_SORT_KEYS: SortKey[] = ["deadline", "timeLeft", "value", "smallest", "match", "saved"];
/** The first sentence of the Saved lede, which says what the list is ordered by. */
const SAVED_SORT_LEDES: Record<SortKey, string> = {
  deadline: "Soonest closing date first.",
  timeLeft: "Latest closing date first.",
  value: "Biggest estimated value first.",
  smallest: "Smallest estimated value first.",
  match: "Best match first.",
  newest: "Newest posted first.",
  saved: "Most recently saved first.",
};

/**
 * The real Opportunities feed. Only mounted for entitled (non-Pilot) users —
 * this is where every opportunity-data API call lives. See OpportunitiesPage.
 *
 * Exported for testability: the route component is reached only through the
 * router. A caller must wrap this in `StageStoreProvider`.
 */
export function OpportunitiesFeed() {
  usePageMeta({ layout: "wide" });
  const { session } = useGhlUser();
  const [state, dispatch] = useReducer(reducer, session?.locationId, initFeedState);
  /** True when this mount restored the member's earlier view. The profile seed
   *  then must not replace the filters the member left with. */
  const viewRestoredRef = useRef(state !== INITIAL);
  // The stage holds one artifact. `showArtifact` overwrites, so a second tool
  // answer replaces the first rather than stacking beside it.
  const { showArtifact } = useStageStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { profile: businessProfile } = useBusinessProfile();
  const router = useRouter();
  const [apiOpps, setApiOpps] = useState<CardOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  /** Bumped by the failed-load notice's Retry control. It is a dependency of the
   *  page-1 effect, so one click re-asks the same question once. */
  const [retryNonce, setRetryNonce] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  /** The active feed's whole-set total, or null until that feed has answered.
   *  It is nullable BECAUSE the tab badge reads it: a count we have not fetched
   *  is not a measurement, and `0` on first paint claims we counted and found
   *  none. */
  const [feedTotal, setFeedTotal] = useState<number | null>(null);
  /** The same figure for the readers that describe a list already on screen —
   *  the footer tally, the stage's result count and the return-visit snapshot.
   *  Each renders only once rows exist, so "not counted yet" cannot reach them
   *  and a nullable value would only buy `?? 0` at every call site. */
  const totalOpps = feedTotal ?? 0;
  const [totalPages, setTotalPages] = useState(1);
  // Tab-strip counts kept per-tab so switching tabs doesn't clobber the other
  // tab's badge (the shared feedTotal tracks only the ACTIVE feed). Null until
  // the "for you" feed answers, for the same reason.
  const [tabOpenCount, setTabOpenCount] = useState<number | null>(null);
  const [tabAllCount, setTabAllCount] = useState<number | null>(null);
  // The Saved badge is the server's count of the Saved list, never the raw
  // bookmark set: see useSavedTotal.
  const { savedTotal, adjustSavedTotal, refreshSavedTotal } = useSavedTotal(
    session?.locationId,
    state.lane,
  );
  const [profileIndexing, setProfileIndexing] = useState(false);
  /** True once the profile-defaults fetch has resolved (or failed), meaning
   *  `state.filters` has finished seeding and the feed key is final.
   *
   *  THIS IS WHAT MAKES RESTORATION WORK. The defaults fetch dispatches
   *  profile-sourced NAICS/states/set-asides into the filters a beat after
   *  mount, which changes the feed key. Attempting the restore before that
   *  landed compared the snapshot against the UNSEEDED key, missed, and burned
   *  the one-shot guard — so for every member with a profile (i.e. all of them)
   *  the snapshot was never read. Wait for the seeded key instead. */
  const [defaultsSettled, setDefaultsSettled] = useState(false);
  // Bumped by the warm-start wizard on completion to force a preview refetch (so
  // freshly-stored answers flip `previewReady` without changing filters/search).
  const [previewRefetchNonce, setPreviewRefetchNonce] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  // Monotonic request epoch. Bumped by every page-1 refetch so an in-flight
  // next-page append can detect that its result is stale (filters/mode changed
  // out from under it) and bail instead of corrupting the accumulated list/cursor.
  const requestEpochRef = useRef(0);
  const prevSearchRef = useRef("");
  /** Latest window scroll offset, sampled passively. Read at UNMOUNT rather than
   *  `window.scrollY` directly: by the time React tears the route down the
   *  browser may already have scrolled to the top of the next page, so the live
   *  value is not the one the member was looking at. */
  const scrollYRef = useRef(0);
  /** The row at the top of the viewport, sampled alongside the offset. This is
   *  what restoration actually uses — see FeedAnchor for why a pixel offset is
   *  not enough inside the GoHighLevel iframe. */
  const anchorRef = useRef<FeedAnchor | null>(null);
  /** Set the instant a navigation away begins, after which the anchor and offset
   *  stop tracking. The observer and the scroll listener keep firing while the
   *  route unwinds — the frame scrolls as the detail page takes over — and those
   *  late callbacks would replace the member's row with wherever the browser
   *  happened to land. Measured: leaving from row 8 saved row 4 without this. */
  const leavingRef = useRef(false);
  /** A snapshot whose rows are in state but not yet on screen. Consumed by the
   *  layout effect below, once the cards exist to scroll to. */
  const pendingRestoreRef = useRef<FeedSnapshot | null>(null);
  /** Everything a return visit needs, mirrored so the unmount cleanup does not
   *  close over stale state. */
  const feedStateRef = useRef({
    key: "",
    cards: [] as CardOpportunity[],
    currentPage: 1,
    totalPages: 1,
    totalOpps: 0,
    takes: new Map<string, string>() as ReadonlyMap<string, string>,
    requestedTakes: new Set<string>() as ReadonlySet<string>,
  });
  /** One-shot guard around restoration — see createRestoreGate for why it is
   *  not simply "the first render". */
  const restoreGateRef = useRef(createRestoreGate());
  /** The query whose rows are currently on screen BECAUSE they were restored,
   *  and the refresh nonce they were restored at.
   *
   *  Restoring calls setState, and this effect depends on state the restore
   *  writes — so it re-runs immediately afterwards. Left alone, that run
   *  refetches page 1 and overwrites the list that was just put back, which is
   *  why restoration was invisible even once the snapshot WAS being read. While
   *  the question is unchanged, the answer is already on screen: do not fetch
   *  it again. */
  const restoredKeyRef = useRef<string | null>(null);
  const restoredNonceRef = useRef(0);
  /** The saved feed a completed request already answered, as
   *  `locationId:refreshNonce`. Filters, search and sort are NOT part of the
   *  question the Saved tab asks, so a change to any of them must not refetch
   *  it — and must not blank the list behind a loading state while it does.
   *  Written only on success, so a request cancelled mid-debounce is retried. */
  const savedFetchedRef = useRef<string | null>(null);
  // Hunter's Take lives here, keyed by oppKey, rather than on the card arrays.
  // The visible cards flow through a single accumulated `apiOpps` list (ranked or
  // preview); keying takes by oppKey lets them apply to whichever set is on screen.
  const [takesMap, setTakesMap] = useState<Map<string, string>>(new Map());
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  // The two facts the preview gate reads, from the filter-defaults fetch. They
  // start unknown, and unknown never shows the preview, so it cannot flash in
  // before the fetch answers.
  const [feedGate, setFeedGate] = useState<{
    hasLiveMatches: boolean | null | undefined;
    hasProfileVector: boolean | undefined;
  }>({ hasLiveMatches: null, hasProfileVector: undefined });
  // The facets the member's profile seeds, kept from the one fetch the effect
  // below already makes, so "Reset to my profile" costs no second request. Null
  // means the profile seeded nothing (or the fetch failed) — the footer action
  // is then not offered, because a reset to nothing reads as a broken one.
  const [profileDefaults, setProfileDefaults] = useState<ProfileFilterDefaults | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  // When true, re-show the answer wizard over an already-answered preview so the
  // member can change their trades/states/set-asides.
  const [reanswer, setReanswer] = useState(false);
  // Stored wizard answers, fetched once the preview feed is showing — powers the
  // personalized/skipped banner copy. Null while unfetched or on fetch failure
  // (falls back to generic banner copy); refetched when a re-answer completes.
  const [previewAnswers, setPreviewAnswers] = useState<PreviewAnswers | null>(null);

  const allTab = state.tab === "all";
  const savedTab = state.tab === "saved";
  // The unscored feeds (All, Saved) share the same card treatment and never show
  // the ranked-only chrome (matches-generating takeover, preview wizard, verdicts).
  const unscoredTab = allTab || savedTab;

  // The takeover is gated by `profileIndexing === true` inside
  // shouldShowMatchesGenerating, so a plain filter-to-zero by a NON-indexing user
  // never triggers it. Neither takeover nor preview applies on the unscored tabs.
  const showGenerating =
    !unscoredTab &&
    shouldShowMatchesGenerating({
      profileIndexing,
      loading,
      count: apiOpps.length,
    });

  const showPreview =
    !unscoredTab && !showGenerating && shouldShowPreview({ ...feedGate, profileIndexing });
  const previewActive = showPreview && preview?.previewReady === true;
  // The preview reuses the ranked feed's chrome (filters, sort, active chips,
  // match count) — its cards flow through the same accumulated `apiOpps` list,
  // but the server does all the filtering (no residual layer on preview) and
  // scoring does not apply (unscored), so cards use the preview presentation.
  // `inWizard` is the answer-collection step
  // (no answers yet, or the user chose to re-answer); the feed is hidden then.
  const inWizard = showPreview && (!preview?.previewReady || reanswer);
  const previewFeed = previewActive && !reanswer;
  const showFeed = !showGenerating && !inWizard;

  /** Identity of the query the feed is currently answering. A snapshot is only
   *  restored onto exactly this question — change tab, filter, sort or search
   *  and the key changes, so a stale list is ignored rather than shown under a
   *  filter it does not satisfy. */
  const feedKey = useMemo(
    () =>
      feedSnapshotKey({
        locationId: session?.locationId,
        tab: state.tab,
        filters: state.filters,
        sort: state.sort,
        search: state.searchValue,
        preview: showPreview,
        lane: state.lane,
      }),
    [
      session?.locationId,
      state.tab,
      state.filters,
      state.sort,
      state.searchValue,
      showPreview,
      state.lane,
    ],
  );

  // DEMO: tell the demo handlers what the page shows. The chat applies a change to
  // these filters and counts the result; the drawer's counts follow this tab.
  useEffect(() => {
    const { filters, sort } = toServerFilters(state.filters, state.sort);
    const laned = withLane(filters, state.lane);
    const q = state.searchValue.trim();
    publishFeedContext({
      tab: state.tab,
      lane: state.lane,
      filters: q ? { ...laned, search: q } : laned,
      sort,
    });
  }, [state.tab, state.lane, state.filters, state.sort, state.searchValue]);

  // Sample the offset passively while the member scrolls; see scrollYRef.
  useEffect(() => {
    const onScroll = () => {
      if (!leavingRef.current) scrollYRef.current = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Freeze the member's place the instant they act on a row.
  //
  // Clicking a card is itself enough to move things: the browser focuses the
  // link, which scrolls it into view in the embedding frame, and the observer
  // re-fires with a different top row BEFORE the router reports a navigation.
  // Measured: leaving from row 8 saved row 4. A capture-phase listener runs
  // ahead of all of that, while the anchor is still the row the member chose to
  // leave from. `onBeforeNavigate` covers every other way out (sidebar, back).
  useEffect(() => {
    const onCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.(`[${OPP_KEY_ATTR}]`)) leavingRef.current = true;
    };
    document.addEventListener("click", onCapture, true);
    const unsubscribe = router.subscribe("onBeforeNavigate", () => {
      leavingRef.current = true;
    });
    return () => {
      document.removeEventListener("click", onCapture, true);
      unsubscribe();
    };
  }, [router]);

  // Track which rows the member can actually see. A null root resolves against
  // the TOP-LEVEL viewport and intersects through the frame chain, which is what
  // makes this correct inside the GoHighLevel iframe — see topmostVisibleAnchor.
  // Re-observes whenever the rendered list changes.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const visible = new Set<string>();
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const key = (entry.target as HTMLElement).getAttribute(OPP_KEY_ATTR);
        if (!key) continue;
        if (entry.isIntersecting) visible.add(key);
        else visible.delete(key);
      }
      if (!leavingRef.current) anchorRef.current = topmostVisibleAnchor(visible);
    });
    document.querySelectorAll(`[${OPP_KEY_ATTR}]`).forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [apiOpps]);

  // Mirror what a return visit needs, every render.
  useEffect(() => {
    feedStateRef.current = {
      key: feedKey,
      cards: apiOpps,
      currentPage,
      totalPages,
      totalOpps,
      takes: takesMap,
      requestedTakes: requestedTakes.current,
    };
  });

  // On the way out — to an opportunity, or anywhere — remember the list and the
  // offset. Only worth doing once rows exist; an empty feed has nothing to
  // restore and would just suppress the next fetch.
  useEffect(
    () => () => {
      const snap = feedStateRef.current;
      if (snap.cards.length > 0) {
        saveFeedSnapshot({
          ...snap,
          anchor: anchorRef.current,
          scrollY: scrollYRef.current,
        });
      }
    },
    [],
  );

  // The restored rows have to be in the DOM before there is anything to scroll
  // to, so the scroll happens here rather than where the snapshot is read. A
  // layout effect runs after React commits the cards and before the browser
  // paints, so the member never sees the top of the list flash past.
  useLayoutEffect(() => {
    const snap = pendingRestoreRef.current;
    if (!snap || apiOpps.length === 0) return;
    pendingRestoreRef.current = null;
    applyFeedScroll(snap);
    // Once more next frame, for anything that settles between commit and paint.
    const raf = requestAnimationFrame(() => applyFeedScroll(snap));
    return () => cancelAnimationFrame(raf);
  }, [apiOpps]);

  // Fetch stored wizard answers once the preview feed is showing, to power the
  // personalized/skipped banner summary. Refetched when a re-answer completes
  // (previewRefetchNonce bumps) so the banner reflects the latest answers.
  useEffect(() => {
    if (!previewFeed) return;
    let cancelled = false;
    fetchPreviewAnswers()
      .then((a) => {
        if (!cancelled) setPreviewAnswers(a);
      })
      .catch(() => {
        if (!cancelled) setPreviewAnswers(null);
      });
    return () => {
      cancelled = true;
    };
  }, [previewFeed, previewRefetchNonce]);

  // ── Single server-authoritative page-1 fetch ───────────────────────────────
  // Replaces the old separate initial-load / preview-load / debounced-search
  // effects. Any change to location, mode (ranked ↔ preview), filters, sort or
  // search text refetches page 1 from the server; infinite scroll (below)
  // appends further pages. Server does the filtering / sorting / tier-gating /
  // search; the client only layers the residual facets on top.
  useEffect(() => {
    const locationId = session?.locationId;
    if (!locationId) return;
    // The first-time "generating" takeover owns fetching via its own poll effect.
    if (showGenerating) return;

    // The Saved feed answers one question — "what did I bookmark?" — and this
    // effect re-runs on every filter, search and sort change. Answer it once
    // per location + refresh + sort + search term + buyer lane instead. Facet
    // filters are not part of the key. Removing a bookmark bumps the nonce.
    const q = state.searchValue.trim();
    const savedKey = `${locationId}:${previewRefetchNonce}:${state.sort}:${q}:${state.lane}`;
    if (savedTab && savedFetchedRef.current === savedKey) return;
    if (!savedTab) savedFetchedRef.current = null;

    // Coming back from an opportunity: replay the list the member was looking at
    // and put them back where they were, instead of re-fetching page 1 and
    // dropping them at the top.
    //
    // The gate spends its single attempt only once `defaultsSettled` says the
    // filters have finished seeding, because seeding changes the feed key — that
    // ordering is the whole fix, see createRestoreGate. It refuses a snapshot
    // for a different query or one past its max age, so this cannot show a list
    // that no longer answers the question on screen, and it fires once, so a
    // later filter or sort change still fetches.
    // The Saved tab is never restored: a save or unsave made elsewhere since
    // the snapshot would leave old rows and an old total on screen. It always
    // asks the server again.
    if (!savedTab) {
      const snap = restoreGateRef.current.attempt(feedKey, defaultsSettled);
      if (snap) {
        setApiOpps(snap.cards);
        setCurrentPage(snap.currentPage);
        setTotalPages(snap.totalPages);
        setFeedTotal(snap.totalOpps);
        // Replay the takes as well, so the rows come back at the SAME HEIGHTS
        // they left at and are never re-requested — otherwise the list shifts
        // under the member after they have been put back on it.
        setTakesMap(new Map(snap.takes));
        snap.requestedTakes.forEach((id) => requestedTakes.current.add(id));
        setLoading(false);
        // Scrolling waits for the rows to be committed to the DOM — see the
        // layout effect below.
        pendingRestoreRef.current = snap;
        restoredKeyRef.current = feedKey;
        restoredNonceRef.current = previewRefetchNonce;
        return;
      }
    }

    // Re-entered after a restore. `feedKey` covers every dimension of the
    // question except the explicit refresh nonce, so together they decide
    // whether this run is the restore's own echo (skip) or a real change the
    // member made (fetch, and stop treating the list as restored).
    if (restoredKeyRef.current !== null) {
      if (restoredKeyRef.current === feedKey && restoredNonceRef.current === previewRefetchNonce) {
        return;
      }
      restoredKeyRef.current = null;
    }

    // A new page-1 request supersedes any in-flight next-page append.
    requestEpochRef.current += 1;

    const usePreview = showPreview;
    const { filters, sort } = toServerFilters(state.filters, state.sort);
    const laned = withLane(filters, state.lane);
    const reqFilters: ServerFilters = q ? { ...laned, search: q } : laned;

    // Debounce keystroke search the longest; coalesce rapid facet/sort
    // toggles with a short delay so selecting several chips in a row fires one
    // server query, not one per click (in-flight requests are also aborted).
    const searchChanged = prevSearchRef.current !== state.searchValue;
    prevSearchRef.current = state.searchValue;
    const delay = searchChanged ? SEARCH_DEBOUNCE_MS : FACET_DEBOUNCE_MS;

    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    // A request in flight is not a failure. Clearing here keeps the two states
    // exclusive, so the member can tell a slow load from a failed one.
    setApiError(null);
    const timer = window.setTimeout(() => {
      const finish = () => {
        if (!cancelled) setLoading(false);
      };
      if (savedTab) {
        // No facet filters. A saved list is a decision the member already
        // made; re-running her profile filters over it makes bookmarks vanish,
        // which is the one thing a bookmark must never do. The search term is
        // different: the member types it to find one bookmark, so it applies.
        // The buyer lane applies too: the member chose it for the whole page.
        fetchSaved(locationId, {
          page: 1,
          limit: PAGE,
          sort,
          search: q || undefined,
          filters: laneOnlyFilters(state.lane),
        })
          .then((r) => {
            if (cancelled) return;
            savedFetchedRef.current = savedKey;
            setApiOpps(r.opportunities.map(mapPreviewToCard));
            setFeedTotal(r.total);
            setTotalPages(Math.max(1, Math.ceil(r.total / (r.limit || PAGE))));
            setCurrentPage(1);
            setApiError(null);
          })
          .catch((err) => {
            if (cancelled) return;
            setApiError(memberFacingFeedError("Failed to load saved opportunities", err));
          })
          .finally(finish);
      } else if (allTab) {
        fetchAll(locationId, { page: 1, limit: PAGE, filters: reqFilters, sort })
          .then((r) => {
            if (cancelled) return;
            setApiOpps(r.opportunities.map(mapPreviewToCard));
            setFeedTotal(r.total);
            setTotalPages(Math.max(1, Math.ceil(r.total / (r.limit || PAGE))));
            setTabAllCount(r.total);
            setCurrentPage(1);
            setApiError(null);
          })
          .catch((err) => {
            if (cancelled) return;
            setApiError(memberFacingFeedError("Failed to load all opportunities", err));
          })
          .finally(finish);
      } else if (usePreview) {
        fetchPreview(locationId, {
          page: 1,
          limit: PAGE,
          filters: reqFilters,
          sort,
          signal: controller.signal,
        })
          .then((p) => {
            if (cancelled) return;
            setPreview(p);
            setApiOpps(p.opportunities.map(mapPreviewToCard));
            setFeedTotal(p.total);
            setTotalPages(Math.max(1, Math.ceil(p.total / (p.limit || PAGE))));
            setTabOpenCount(p.total);
            setCurrentPage(1);
            setApiError(null);
          })
          .catch(() => {
            if (cancelled) return;
            setPreview({ opportunities: [], previewReady: false, page: 1, limit: PAGE, total: 0 });
            setApiOpps([]);
          })
          .finally(finish);
      } else {
        fetchDiscoverV2(locationId, {
          page: 1,
          limit: PAGE,
          filters: reqFilters,
          sort,
          signal: controller.signal,
        })
          .then((res) => {
            if (cancelled) return;
            setApiOpps(res.data.map(mapToCardOpportunity));
            setFeedTotal(res.total);
            setTotalPages(res.totalPages);
            setTabOpenCount(res.total);
            setProfileIndexing(res.profileIndexing === true);
            setCurrentPage(1);
            setApiError(null);
          })
          .catch((err) => {
            if (cancelled) return;
            setApiError(memberFacingFeedError("Failed to load matched opportunities", err));
          })
          .finally(finish);
      }
    }, delay);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [
    session?.locationId,
    showPreview,
    showGenerating,
    state.filters,
    state.sort,
    state.searchValue,
    state.lane,
    allTab,
    savedTab,
    previewRefetchNonce,
    feedKey,
    defaultsSettled,
    retryNonce,
  ]);

  // Poll only while the first-time "generating" takeover is showing (showGenerating
  // is true only when indexing AND no matches yet). Returning users keep their list
  // and are not polled. After repeated failures, surface an error instead of
  // stranding the user on the spinner forever.
  const pollFailuresRef = useRef(0);
  useEffect(() => {
    if (!session?.locationId || !showGenerating) return;
    const locationId = session.locationId;
    const filters = laneOnlyFilters(state.lane);
    pollFailuresRef.current = 0;
    const iv = window.setInterval(() => {
      fetchDiscoverV2(locationId, { page: 1, limit: PAGE, ...(filters ? { filters } : {}) })
        .then((res) => {
          pollFailuresRef.current = 0;
          setApiOpps(res.data.map(mapToCardOpportunity));
          setFeedTotal(res.total);
          setTotalPages(res.totalPages);
          setCurrentPage(1);
          setProfileIndexing(res.profileIndexing === true);
        })
        .catch(() => {
          pollFailuresRef.current += 1;
          if (pollFailuresRef.current >= MAX_MATCHES_POLL_FAILURES) {
            window.clearInterval(iv);
            setProfileIndexing(false);
            setApiError("We couldn't reach the matching service. Please refresh in a moment.");
          }
        });
    }, MATCHES_POLL_INTERVAL_MS);
    return () => window.clearInterval(iv);
  }, [session?.locationId, showGenerating, state.lane]);

  // A new buyer lane changes what every tab holds. The active tab refetches
  // through the page-1 effect above. The badges of the two feeds the member is
  // not on counted the old lane, so each is cleared and counted again with its
  // own tab's filters, sort and search. The Saved badge belongs to
  // useSavedTotal. An answer for an older lane is dropped.
  const laneCountEpochRef = useRef(0);
  const countedLaneRef = useRef(state.lane);
  useEffect(() => {
    const locationId = session?.locationId;
    if (!locationId || countedLaneRef.current === state.lane) return;
    countedLaneRef.current = state.lane;
    const epoch = ++laneCountEpochRef.current;
    const request = (tab: OppTab) => {
      const slice = state.tabStash[tab] ?? defaultTabSlice(tab);
      const { filters, sort } = toServerFilters(slice.filters, slice.sort);
      const q = slice.searchValue.trim();
      const laned = withLane(filters, state.lane);
      return { page: 1, limit: 1, filters: q ? { ...laned, search: q } : laned, sort };
    };
    const count = (
      ask: Promise<{ total: number }>,
      set: (n: number | null) => void,
      what: string,
    ) => {
      set(null);
      ask
        .then((r) => {
          if (laneCountEpochRef.current === epoch) set(r.total);
        })
        .catch((err) => console.error(`Failed to count ${what}`, err));
    };
    if (state.tab !== "for_you") {
      const forYouPreview = shouldShowPreview({ ...feedGate, profileIndexing });
      const req = request("for_you");
      count(
        forYouPreview ? fetchPreview(locationId, req) : fetchDiscoverV2(locationId, req),
        setTabOpenCount,
        "matched opportunities",
      );
    }
    if (state.tab !== "all") {
      count(fetchAll(locationId, request("all")), setTabAllCount, "all opportunities");
    }
  }, [
    session?.locationId,
    state.lane,
    state.tab,
    state.tabStash,
    feedGate,
    profileIndexing,
  ]);

  // Seed filters from the user's business profile once per location. Runs before
  // the user edits anything; profile-sourced facets are tagged "from your profile".
  const prefillLocationRef = useRef<string | null>(null);
  useEffect(() => {
    const locationId = session?.locationId;
    if (!locationId) return;
    if (prefillLocationRef.current === locationId) {
      setDefaultsSettled(true);
      return;
    }
    prefillLocationRef.current = locationId;
    fetchFilterDefaults(locationId)
      .then((defaults) => {
        setFeedGate({
          hasLiveMatches: defaults.hasLiveMatches,
          hasProfileVector: defaults.hasProfileVector,
        });
        if (hasProfileFacets(defaults)) {
          setProfileDefaults(defaults);
          if (!viewRestoredRef.current) {
            dispatch({
              type: "set-filters",
              filters: applyProfileDefaults(emptyFilters(), defaults),
            });
          }
        }
      })
      .catch(() => {
        // Non-fatal: filters simply start empty if the profile can't be loaded.
      })
      // Either way the filters are now final, so the feed key is safe to match a
      // snapshot against. Settling in `finally` and not only on success is what
      // keeps a profile-fetch failure from disabling restoration entirely.
      .finally(() => setDefaultsSettled(true));
  }, [session?.locationId]);

  // Remember the member's view on every change, so a return from an opportunity
  // lands on the same tab with the same filters, sort and search. Waits for the
  // profile seed: a view recorded before it lands would skip the seed next time.
  useEffect(() => {
    const locationId = session?.locationId;
    if (!locationId || !defaultsSettled) return;
    rememberFeedView<RememberedView>(locationId, {
      tab: state.tab,
      filters: state.filters,
      sort: state.sort,
      searchValue: state.searchValue,
      tabStash: state.tabStash,
      lane: state.lane,
    });
  }, [
    session?.locationId,
    defaultsSettled,
    state.tab,
    state.filters,
    state.sort,
    state.searchValue,
    state.tabStash,
    state.lane,
  ]);

  useEffect(() => {
    if (!session?.locationId) return;
    fetchWorkspace()
      .then(({ savedOpps, savedSearches }) => {
        dispatch({ type: "hydrate-saved", ids: savedOpps });
        dispatch({
          type: "set-saved-filters",
          saved: savedSearches.map((s) => ({
            id: s.id,
            name: s.name,
            filters: reviveSavedFilters(s.filters),
          })),
        });
      })
      .catch((err) => console.error("Failed to load saved opportunities", err));
  }, [session?.locationId]);

  // Optimistic save/un-save: flip the UI immediately, then persist; roll back on failure.
  const handleToggleSaved = (id: string) => {
    const wasSaved = state.savedIds.has(id);
    dispatch({ type: "toggle-saved", id });
    // A card on this page is always a type the Saved list shows, so the badge
    // moves by exactly one.
    const delta = wasSaved ? -1 : 1;
    adjustSavedTotal(delta);
    // On the Saved tab, un-saving an opp should drop it from the feed at once.
    if (wasSaved && savedTab) {
      setApiOpps((prev) => prev.filter((o) => o.id !== id));
      setFeedTotal((n) => (n == null ? n : Math.max(0, n - 1)));
    }
    const persist = wasSaved ? removeSavedOpp(id) : addSavedOpp(id);
    persist.catch((err) => {
      console.error("Failed to update saved opportunity", err);
      dispatch({ type: "toggle-saved", id });
      adjustSavedTotal(-delta);
      // Restore the optimistically removed card by refetching page 1.
      if (wasSaved && savedTab) setPreviewRefetchNonce((n) => n + 1);
    });
  };

  // Hunter's save_opportunity tool already persisted server-side; here we only
  // sync the feed's saved/bookmark display state to match. Guarded toggles avoid
  // double-flips against the current savedIds set.
  const handleHunterSaveChange = (saved: string[], unsaved: string[]) => {
    // Hunter saved on the server. Keep /forecasts in step without a reload.
    recordServerSaveChange(saved, unsaved);
    saved.forEach((id) => {
      if (!state.savedIds.has(id)) dispatch({ type: "toggle-saved", id });
    });
    unsaved.forEach((id) => {
      if (!state.savedIds.has(id)) return;
      dispatch({ type: "toggle-saved", id });
      // On the Saved tab, an un-saved opp should drop from the feed at once.
      if (savedTab) {
        setApiOpps((prev) => prev.filter((o) => o.id !== id));
        setFeedTotal((n) => (n == null ? n : Math.max(0, n - 1)));
      }
    });
    // On the Saved tab, newly-saved opps aren't in the loaded list — refetch page 1
    // so they appear.
    if (savedTab && saved.length) setPreviewRefetchNonce((n) => n + 1);
    // Hunter can save any key, including a type the Saved list does not show,
    // so the badge asks the server rather than counting the keys.
    if (saved.length || unsaved.length) refreshSavedTotal();
  };

  const handleSubmitSearch = (q: string) => {
    dispatch({ type: "set-search", value: q });
    dispatch({ type: "submit-start" });
    setTimeout(() => dispatch({ type: "submit-complete", query: q }), 600);
  };

  const handleExitStretches = () => dispatch({ type: "exit-stretches" });

  const applyHunterFilters = useCallback(
    (p: DiscoveryPayload) => {
      // DEMO: Hunter may open another tab first, when the filters leave nothing on this one.
      // The target tab's own filters are the base then, because `set-tab` restores them.
      const switching = p.tab !== undefined && p.tab !== state.tab;
      if (switching) dispatch({ type: "set-tab", tab: p.tab! });
      // Fresh queries (match-my-profile, "clear filters and show me X") replace the
      // client filters wholesale; refinements merge onto the current set.
      const base = p.fresh
        ? emptyFilters()
        : switching
          ? (state.tabStash[p.tab!]?.filters ?? emptyFilters())
          : state.filters;
      if (p.filters.search !== undefined) {
        // Drives the existing searchValue effect → backend keyword search
        // across title / agency / place of performance.
        dispatch({ type: "set-search", value: p.filters.search });
      } else if (p.fresh) {
        dispatch({ type: "set-search", value: "" });
      }
      const toggles =
        p.filters.dodOnly !== undefined || p.filters.civilianOnly !== undefined
          ? {
              toggles: {
                ...base.toggles,
                ...(p.filters.dodOnly !== undefined ? { dodOnly: p.filters.dodOnly } : {}),
                ...(p.filters.civilianOnly !== undefined
                  ? { civilianOnly: p.filters.civilianOnly }
                  : {}),
              },
            }
          : {};
      dispatch({
        type: "set-filters",
        filters: {
          ...base,
          ...(p.filters.states ? { states: p.filters.states } : {}),
          ...(p.filters.cities ? { cities: p.filters.cities } : {}),
          ...(p.filters.setAsides ? { setAsides: p.filters.setAsides } : {}),
          ...(p.filters.valueRange ? { valueRange: p.filters.valueRange } : {}),
          ...(p.filters.dueWindow ? { dueWindow: p.filters.dueWindow } : {}),
          ...(p.filters.naics ? { naics: p.filters.naics } : {}),
          ...(p.filters.noticeTypes ? { noticeTypes: p.filters.noticeTypes } : {}),
          ...(p.filters.vehicles ? { vehicles: p.filters.vehicles } : {}),
          ...(p.filters.postedWithin ? { postedWithin: p.filters.postedWithin } : {}),
          ...toggles,
        },
      });
      // Hunter's scope moves the buyer switch. The lane is page state, so a
      // turn with no scope leaves it where the member put it.
      const lane = laneFromScope(p.filters.scope);
      if (lane) dispatch({ type: "set-lane", lane });
    },
    [state.filters, state.tab, state.tabStash],
  );

  /* Has he met Hunter? Read live, so dismissing swaps the hero for the strip in
     place. The flag lives in module memory and resets on reload — see
     `lib/onboardingStorage.ts`. */
  const metHunter = useLiveSlice("onboarding", () => readFlag(MET_HUNTER_KEY));
  const [askRequest, setAskRequest] = useState<{ text: string; token: number } | null>(null);

  /* Rule 5 — an opener is not a description, it is a question that gets asked.
     Tapping one opens the rail with it already in flight, so the introduction
     produces an answer rather than more reading. The command bar's "ask Hunter"
     lands here too, so there is one path into the rail rather than two. */
  const askHunter = useCallback((question: string) => {
    writeFlag(MET_HUNTER_KEY, true);
    dispatch({ type: "set-chat", open: true });
    setAskRequest({ text: question, token: Date.now() });
  }, []);

  // Command Bar event wiring
  useEffect(() => {
    function onSearch(e: Event) {
      const text = (e as CustomEvent<{ text: string }>).detail?.text;
      if (!text) return;
      dispatch({ type: "set-search", value: text });
      handleSubmitSearch(text);
    }
    function onAskHunter(e: Event) {
      const text = (e as CustomEvent<{ text: string }>).detail?.text;
      if (!text) return;
      askHunter(text);
    }
    window.addEventListener("commandbar:search-opps", onSearch);
    window.addEventListener("commandbar:ask-hunter", onAskHunter);
    return () => {
      window.removeEventListener("commandbar:search-opps", onSearch);
      window.removeEventListener("commandbar:ask-hunter", onAskHunter);
    };
  }, [askHunter]);

  // ── Pipeline: accumulated server rows → verdict → sort ──────────────────────
  // The server owns filtering / sorting / verdict-gating / search over the whole
  // corpus for both the ranked and preview paths; `apiOpps` is the accumulated
  // (page 1 + appended) result for the current mode. All cards carry mode "prime".
  const primeOpps = useMemo(() => apiOpps.filter((o) => o.mode === "prime"), [apiOpps]);
  const baseOpps = useMemo(() => {
    if (takesMap.size === 0) return primeOpps;
    return primeOpps.map((c) =>
      takesMap.has(c.id) ? { ...c, hunterReasoning: takesMap.get(c.id)! } : c,
    );
  }, [primeOpps, takesMap]);

  const filteredRaw = useMemo(() => {
    // Smart list is a fully client-side evaluation, kept unchanged. It is typed
    // against the mock Opportunity shape, so cast (CardOpportunity carries the
    // fields it reads; absent ones fall through as no-op comparisons).
    // A smart list never narrows the Saved tab: a bookmark list is not
    // filtered (see the Saved fetch), and the Saved counts are the server's.
    if (state.smartList && !savedTab)
      return evaluateSmartList(state.smartList, baseOpps as never) as unknown as CardOpportunity[];
    // Ranked and preview: the server applied every filter already — show rows as-is.
    return baseOpps;
  }, [baseOpps, state.smartList, savedTab]);

  // Every sort — including "newest" and every Saved order — is applied
  // server-side, so the loaded rows are trusted as-is.
  //
  // The server already excludes the lowest tier and returns the selected tier
  // otherwise, so no client-side narrowing is needed here.
  const visibleCards = filteredRaw;

  // Whole-set match count (server total), not just the loaded page — so the
  // header/footer reflect every match a filter selects, not only page 1.
  const totalMatchCount = previewActive ? (preview?.total ?? 0) : totalOpps;
  // On the Saved tab the page-1 total is scoped by the search term. While a
  // search is active it counts the search's results, not everything saved,
  // so the words say so.
  const savedNoun = savedTab ? (state.searchValue.trim() ? "match your search" : "saved") : null;
  const topReason = visibleCards[0]?.hunterReasoning ?? undefined;

  // Active-filter chips for the feed header. Removing a chip dispatches the
  // facet-cleared filter set, so a stale narrowing (e.g. a chat-applied
  // "≤ $500k" cap) is always visible and one click to lift.
  const activeChips = buildActiveChips(state.filters, (next) =>
    dispatch({ type: "set-filters", filters: next }),
  );
  // How many loaded rows the residual (client-only) facets are hiding — drives
  // the empty-state attribution so "no matches" reads apart from "your filters
  // hid them". Server facets never reach here (they cut the set upstream).
  const residualHiddenCount = baseOpps.length - filteredRaw.length;
  const searchActive = state.searchValue.trim().length > 0;

  // ── Infinite scroll: append the next page when the sentinel is visible ──────
  const fetchNextPage = useCallback(() => {
    const locationId = session?.locationId;
    if (!locationId || loading || loadingMore || currentPage >= totalPages) return;
    const usePreview = showPreview;
    const { filters, sort } = toServerFilters(state.filters, state.sort);
    const q = state.searchValue.trim();
    const laned = withLane(filters, state.lane);
    const reqFilters: ServerFilters = q ? { ...laned, search: q } : laned;
    const nextPage = currentPage + 1;
    // Snapshot the request epoch; if a page-1 refetch bumps it while this append
    // is in flight, the resolved rows belong to a superseded query — drop them.
    const epoch = requestEpochRef.current;
    setLoadingMore(true);
    const req = savedTab
      ? // Unfiltered but searched and laned, exactly like page 1.
        fetchSaved(locationId, {
          page: nextPage,
          limit: PAGE,
          sort,
          search: q || undefined,
          filters: laneOnlyFilters(state.lane),
        }).then((r) => r.opportunities.map(mapPreviewToCard))
      : allTab
        ? fetchAll(locationId, { page: nextPage, limit: PAGE, filters: reqFilters, sort }).then(
            (r) => r.opportunities.map(mapPreviewToCard),
          )
        : usePreview
          ? fetchPreview(locationId, {
              page: nextPage,
              limit: PAGE,
              filters: reqFilters,
              sort,
            }).then((p) => p.opportunities.map(mapPreviewToCard))
          : fetchDiscoverV2(locationId, {
              page: nextPage,
              limit: PAGE,
              filters: reqFilters,
              sort,
            }).then((r) => r.data.map(mapToCardOpportunity));
    req
      .then((cards) => {
        if (requestEpochRef.current !== epoch) return;
        setApiOpps((prev) => [...prev, ...cards]);
        setCurrentPage(nextPage);
      })
      .catch((err) => {
        if (requestEpochRef.current !== epoch) return;
        setApiError(memberFacingFeedError("Failed to load more opportunities", err));
      })
      // Always clear the paging flag — only one next-page is ever in flight
      // (the observer/auto-load guards on `loadingMore`), so a stale request
      // completing must still release the flag or paging would deadlock.
      .finally(() => setLoadingMore(false));
  }, [
    session?.locationId,
    loading,
    loadingMore,
    currentPage,
    totalPages,
    showPreview,
    state.filters,
    state.sort,
    state.searchValue,
    state.lane,
    allTab,
    savedTab,
  ]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchNextPage]);

  // All panel facets now filter server-side, so only a smart list can thin a
  // loaded page client-side (it filters over the loaded rows only). When one is
  // active and the visible count is below half a page with more pages available,
  // eagerly pull the next page so the viewport stays full.
  const residualFilterActive = state.smartList !== null && !savedTab;

  useEffect(() => {
    if (previewActive || loading || loadingMore) return;
    if (currentPage >= totalPages || !residualFilterActive) return;
    if (visibleCards.length < PAGE / 2) fetchNextPage();
  }, [
    previewActive,
    loading,
    loadingMore,
    currentPage,
    totalPages,
    residualFilterActive,
    visibleCards.length,
    fetchNextPage,
  ]);

  const newThisWeek = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return filteredRaw.filter((opp) => {
      if (!opp.postedAt) return false;
      const postedDate = new Date(opp.postedAt);
      return postedDate >= sevenDaysAgo;
    }).length;
  }, [filteredRaw]);
  // ── Hunter's Take: eager-prefetch, 20-at-a-time enrichment ──────────────────
  // The feed renders immediately with the RAG summary; real takes fill each
  // card's hunterReasoning. On arrival we generate the first 20, and as soon as
  // those land we eagerly generate the next 20 — so one window is always primed
  // ahead of the user. Each time the user scrolls into a window, the next one is
  // generated, keeping that one-window lead. Per-opp keyed and server-cached
  // (Redis, 24h TTL), so we never re-request a card and revisits are instant.
  const TAKE_WINDOW = 20;
  const shownCards: CardOpportunity[] = useMemo(
    () => (state.mode === "stretches" ? STRETCH_MODE_OPPORTUNITIES : visibleCards),
    [state.mode, visibleCards],
  );
  // One batched /naics/descriptions call for the rendered page. On failure the
  // hook returns `shownCards` untouched and each Scope cell shows the code.
  const cards = useNaicsDescriptions(shownCards);
  // How many 20-card windows the user has reached (1 = first window, visible on
  // arrival). We always want this window + one prefetched ahead generated.
  const [reachedWindows, setReachedWindows] = useState(1);
  // How many cards we've already requested takes for (advances one window at a
  // time so the first 20 paint before the next 20 are fetched).
  const [loadedCount, setLoadedCount] = useState(0);
  const requestedTakes = useRef<Set<string>>(new Set());
  const inFlight = useRef(false);
  const takesSentinelRef = useRef<HTMLDivElement | null>(null);

  const desiredCount = Math.min((reachedWindows + 1) * TAKE_WINDOW, shownCards.length);

  // When the query changes (mode, filters, sort, or search) the server
  // returns a fresh page-1 set, so the window walk must restart from the top —
  // otherwise a `loadedCount` left high by the previous set makes the effect
  // below short-circuit and never request takes for the new cards.
  // `requestedTakes`/`takesMap` are intentionally kept so already-fetched takes
  // reappear instantly and are never re-requested.
  useEffect(() => {
    setLoadedCount(0);
    setReachedWindows(1);
  }, [previewActive, state.filters, state.sort, state.searchValue, state.lane]);

  // Generate the next not-yet-loaded window (up to desiredCount), one at a time.
  // Advancing loadedCount in `finally` re-runs this effect, so it walks window by
  // window until it has caught up to desiredCount, then idles until the user
  // scrolls (which raises reachedWindows → desiredCount).
  useEffect(() => {
    // Preview/All/Saved cards are unscored — skip Hunter's Take enrichment.
    if (previewFeed || unscoredTab) return;
    if (inFlight.current || loadedCount >= desiredCount) return;
    const next = Math.min(loadedCount + TAKE_WINDOW, desiredCount);
    const ids = shownCards
      .slice(loadedCount, next)
      .map((c) => c.id)
      .filter((id) => !requestedTakes.current.has(id));
    if (ids.length === 0) {
      setLoadedCount(next);
      return;
    }
    inFlight.current = true;
    ids.forEach((id) => requestedTakes.current.add(id));
    fetchHuntersTakes(ids, 5)
      .then((takes) => {
        if (takes.size === 0) return;
        setTakesMap((prev) => {
          const next = new Map(prev);
          takes.forEach((line, id) => next.set(id, line));
          return next;
        });
      })
      .catch(() => ids.forEach((id) => requestedTakes.current.delete(id)))
      .finally(() => {
        inFlight.current = false;
        setLoadedCount(next);
      });
  }, [loadedCount, desiredCount, shownCards, previewFeed, unscoredTab]);

  // When the sentinel (a few cards before the reached-window boundary) scrolls
  // into view, advance one window — which primes the next window of takes.
  useEffect(() => {
    const el = takesSentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setReachedWindows((w) => (w * TAKE_WINDOW < shownCards.length ? w + 1 : w));
        }
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [shownCards.length, reachedWindows]);

  const takesSentinelIndex = Math.min(
    Math.max(reachedWindows * TAKE_WINDOW - 5, 0),
    shownCards.length - 1,
  );

  // Two entry points, one path: the inline SaveSearchPopover in FiltersDrawer's
  // footer and the summary row's Save button both call this (no more
  // full-screen modal). It persists via POST /workspace/saved-searches
  // (addSavedSearch).
  const handleSaveSearch = (name: string) => {
    addSavedSearch(name, state.filters)
      .then((s) =>
        dispatch({
          type: "add-saved-filter",
          saved: { id: s.id, name: s.name, filters: reviveSavedFilters(s.filters) },
        }),
      )
      .catch((err) => console.error("Failed to save search", err));
  };

  // "Reset to my profile" — the same expression the mount effect runs, over the
  // defaults that effect already fetched. It reads no network and clears the
  // keyword, so the drawer returns to the state it had on first load.
  const handleResetToProfile = profileDefaults
    ? () => {
        dispatch({
          type: "set-filters",
          filters: applyProfileDefaults(emptyFilters(), profileDefaults),
        });
        dispatch({ type: "set-search", value: "" });
      }
    : undefined;

  // Opens the confirm modal; the actual delete runs on confirm.
  const handleRemoveSavedFilter = (id: string) => {
    const target = state.savedFilters.find((s) => s.id === id);
    setDeleteTarget({ id, name: target?.name ?? "" });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    dispatch({ type: "remove-saved-filter", id });
    removeSavedSearch(id).catch((err) => console.error("Failed to remove saved search", err));
  };

  return (
    <div style={{ display: "flex", flex: 1, minWidth: 0 }}>
      <section
        style={{
          flex: 1,
          minWidth: 0,
          padding: "var(--s-8) var(--s-6) var(--s-12)",
          maxWidth: 980,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Rule 2 — first interaction, at the head of the work rather than in
            front of it. Rule 8 — once met, it collapses to a strip. */}
        {metHunter ? (
          <HunterStrip onAsk={askHunter} />
        ) : (
          <MeetHunter
            memberName={businessProfile?.ownerName?.split(" ")[0] ?? "there"}
            count={tabAllCount}
            onAsk={askHunter}
            onDismiss={() => writeFlag(MET_HUNTER_KEY, true)}
          />
        )}

        {/* The three tabs and the buyer switch share one row, as on the
            forecasts page. Every count on the row is for the current lane. */}
        <div className="opps-viewbar">
          <OpportunitiesTabs
            tab={state.tab}
            onChange={(t) => dispatch({ type: "set-tab", tab: t })}
            // Null until the feed behind this tab has answered: no badge, rather
            // than a `0` we did not count. OpportunitiesTabs gates on that null.
            openCount={
              unscoredTab ? tabOpenCount : previewActive ? (preview?.total ?? null) : feedTotal
            }
            // Null until `/opportunities/all` answers, which happens when the
            // member opens that tab or changes the lane. No badge until then —
            // we do not know the corpus size, and a placeholder would claim we did.
            allCount={tabAllCount}
            // The server's count of the Saved list (useSavedTotal). Null, so no
            // badge, until it answers. Never the raw bookmark set: that holds
            // types and dead keys the list does not show.
            savedCount={savedTotal}
          />
          <BuyerLaneSwitch
            lane={state.lane}
            onChange={(lane) => dispatch({ type: "set-lane", lane })}
          />
        </div>

        {showFeed && (
          <div className="verdict-row">
            <HeroSearchField
              ref={searchInputRef}
              value={state.searchValue}
              onChange={(v) => dispatch({ type: "set-search", value: v })}
              onSubmit={handleSubmitSearch}
              onAskHunter={() => dispatch({ type: "set-chat", open: true })}
              parsing={state.parsing}
            />
          </div>
        )}

        {showFeed && (
          <div id="hunter-lead-anchor">
            <OppsSummaryRow
              // Stretch mode renders `STRETCH_MODE_OPPORTUNITIES`, so the row
              // counts that same list. The header may never claim more than
              // the feed puts on screen.
              matchCount={
                state.mode === "stretches" ? STRETCH_MODE_OPPORTUNITIES.length : totalMatchCount
              }
              newThisWeek={state.mode === "stretches" ? 0 : newThisWeek}
              activeCount={countActive(state.filters)}
              sort={state.sort}
              onSortChange={(s) => dispatch({ type: "set-sort", sort: s })}
              onOpenFilters={() => dispatch({ type: "open-customize" })}
              // Same handler the FiltersDrawer footer takes: both entry points
              // open the same SaveSearchPopover and persist through
              // addSavedSearch. There is one save path, not two.
              onSaveSearch={handleSaveSearch}
              // With an empty stretch list the clause is dropped, not filled —
              // the same rule the first-meeting opener follows when it has no
              // count to give.
              headlineOverride={
                state.mode === "stretches" && STRETCH_MODE_OPPORTUNITIES.length > 0
                  ? `Showing ${STRETCH_MODE_OPPORTUNITIES.length} stretches.`
                  : undefined
              }
              sublineOverride={
                state.mode === "stretches"
                  ? "These need a teaming partner, certification, or capacity stretch."
                  : undefined
              }
              noun={savedNoun ?? (allTab ? "opportunities" : "matches")}
              showWhy={!unscoredTab}
              showNewThisWeek={!savedTab}
              summaryAction={
                savedTab ? (
                  <Link to="/pipeline" className="btn btn-secondary btn-xs" onClick={openPipeline}>
                    <FolderKanban size={12} /> Go to Pipeline
                  </Link>
                ) : undefined
              }
              sortKeys={
                savedTab
                  ? SAVED_SORT_KEYS
                  : allTab
                    ? (["newest", "deadline"] as SortKey[])
                    : undefined
              }
            />
          </div>
        )}

        {state.mode === "stretches" && (
          <div className="mode-chip-banner" role="status" style={{ marginTop: "var(--s-3)" }}>
            <AlertTriangle size={14} />
            <span>Mode: Stretches</span>
            <button
              type="button"
              className="mode-chip-x"
              aria-label="Exit Stretches mode"
              onClick={handleExitStretches}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {apiError && (
          <FeedErrorNotice message={apiError} onRetry={() => setRetryNonce((n) => n + 1)} />
        )}
        {showGenerating && <MatchesGenerating />}
        {showPreview &&
          !loading &&
          preview &&
          (!preview.previewReady || reanswer) &&
          session?.locationId && (
            <WarmStartWizard
              locationId={session.locationId}
              onComplete={() => {
                setReanswer(false);
                setPreviewRefetchNonce((n) => n + 1);
              }}
            />
          )}
        {showFeed && (
          <>
            {previewFeed &&
              (() => {
                const total = preview?.total ?? 0;
                const skipped = previewAnswers != null && isSkippedAnswers(previewAnswers);
                const summary = previewAnswers ? summarizePreviewAnswers(previewAnswers) : "";
                const headline = skipped
                  ? "Preview — showing all open opportunities."
                  : previewAnswers && summary
                    ? `Preview — ${total.toLocaleString()} potential fit${total === 1 ? "" : "s"} for ${summary}.`
                    : `Preview — ${total.toLocaleString()} potential fit${total === 1 ? "" : "s"} based on your answers.`;
                return (
                  <div className="preview-gate-banner">
                    <span>{headline}</span>
                    <div className="preview-gate-banner-actions">
                      <button
                        type="button"
                        className="preview-gate-banner-reanswer"
                        onClick={() => setReanswer(true)}
                      >
                        {skipped ? "Personalize (3 quick questions)" : "Re-answer questions"}
                      </button>
                      {session?.locationId ? (
                        <a
                          className="preview-gate-banner-cta"
                          href={capabilityStatementUrl(session.locationId)}
                          >
                          Add your capability statement to get matched →
                        </a>
                      ) : (
                        <a className="preview-gate-banner-cta" href="/business-profile">
                          Add your capability statement to get matched →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })()}
            {/* The stage sits between the results row and the chips: above it
                the member still sees what they searched and how many results
                they have; below it the list they came for is untouched. */}
            <StageCardMount resultCount={totalMatchCount} />
            {activeChips.length > 0 && (
              <div
                className="fd-active-chips__row"
                role="list"
                style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}
              >
                {activeChips.map((c) => (
                  <span key={c.key} role="listitem" className="opps-bar__chip">
                    <span className="opps-bar__chip-label">{c.label}</span>
                    <button
                      type="button"
                      className="opps-bar__chip-x"
                      aria-label={`Remove ${c.label}`}
                      onClick={c.onRemove}
                    >
                      <X size={12} strokeWidth={2.2} />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  className="of-clear-all"
                  onClick={() => dispatch({ type: "clear-all-filters" })}
                >
                  Clear all
                </button>
              </div>
            )}
            {/* Says what the list is ordered by, and that the controls above it
                do not apply to it. Only above a list there is something to
                say it about. */}
            {savedTab && !loading && visibleCards.length > 0 && (
              <p className="opps-saved-lede t-body-sm">
                {SAVED_SORT_LEDES[state.sort]} Your filters do not touch this list.
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {loading && (
                <FeedLoadingState label={shownCards.length > 0 ? "Searching" : "Loading"} />
              )}
              {!loading &&
                cards.map((card, index) => (
                  <Fragment key={card.id}>
                    <OpportunityCard
                      opp={card}
                      saved={state.savedIds.has(card.id)}
                      onToggleSaved={handleToggleSaved}
                      hideHuntersTake={previewFeed || unscoredTab}
                      feedTab={state.tab}
                    />
                    {!previewFeed && !unscoredTab && index === takesSentinelIndex && (
                      <div ref={takesSentinelRef} aria-hidden />
                    )}
                  </Fragment>
                ))}
              {/* An empty list is only a finding when the request answered. If
                  it failed, the alert above says so and this card stays away:
                  every sentence in it explains an empty list by the member's own
                  filters, which a server failure did not cause. */}
              {!loading && !apiError && state.mode === "default" && visibleCards.length === 0 && (
                <div className="card card-padded" style={{ textAlign: "center" }}>
                  {previewFeed ? (
                    <p className="t-body-sm">
                      No open opportunities match those answers and filters yet — try widening your
                      states, trades, or filters.
                    </p>
                  ) : savedTab && searchActive ? (
                    // The filters cannot empty this list, but a search can.
                    <p className="t-body-sm">None of your saved opportunities match your search.</p>
                  ) : savedTab ? (
                    // Without a search, there is one way this list is empty:
                    // nothing is saved. The filters cannot empty it.
                    <p className="t-body-sm">
                      You haven&apos;t saved anything yet. Tap the bookmark on any opportunity and
                      it waits for you here, whatever you search for next.
                    </p>
                  ) : allTab ? (
                    <p className="t-body-sm">
                      {searchActive
                        ? "No opportunities matched your search."
                        : "No opportunities match your filters — try loosening them."}
                    </p>
                  ) : feedGate.hasLiveMatches === false ? (
                    // An embedded member with no open match. Their filters did not
                    // cause this, so the sentence must not blame them.
                    <p className="t-body-sm">
                      There are no matches for you right now. New opportunities arrive every day,
                      and the ones that fit your business will show here.
                    </p>
                  ) : residualHiddenCount > 0 ? (
                    <>
                      <p className="t-body-sm">
                        {residualHiddenCount} match{residualHiddenCount === 1 ? "" : "es"} hidden by
                        your filters.
                      </p>
                      <button
                        type="button"
                        className="of-clear-all"
                        style={{ marginTop: "var(--s-2)" }}
                        onClick={() => dispatch({ type: "clear-all-filters" })}
                      >
                        Clear filters
                      </button>
                    </>
                  ) : (
                    <p className="t-body-sm">
                      {searchActive
                        ? "No opportunities matched your search."
                        : "No opportunities in this bucket. Try loosening your filters."}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Infinite-scroll sentinel — replaces the old "Load more" button. */}
            <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
            {loadingMore && (
              <p className="t-body-sm" style={{ textAlign: "center", marginTop: "var(--s-3)" }}>
                Loading more…
              </p>
            )}
            {!previewFeed && !loading && visibleCards.length > 0 && (
              <div className="load-more-count">
                {totalOpps} {savedNoun ?? (allTab ? "opportunities" : "match you")} · showing{" "}
                {visibleCards.length}
              </div>
            )}
          </>
        )}
      </section>

      <FiltersDrawer
        open={state.customizeOpen}
        onClose={() => dispatch({ type: "close-customize" })}
        filters={state.filters}
        onSetFilters={(f) => dispatch({ type: "set-filters", filters: f })}
        keyword={state.searchValue}
        onKeyword={(v) => dispatch({ type: "set-search", value: v })}
        smartList={state.smartList}
        onSmartListApply={(list) => dispatch({ type: "smartlist-apply", list })}
        onSmartListClear={() => dispatch({ type: "smartlist-clear" })}
        onSmartListRemoveCondition={(groupId, conditionId) =>
          dispatch({ type: "smartlist-remove-condition", groupId, conditionId })
        }
        onSmartListSave={(name, list) => dispatch({ type: "smartlist-save", name, list })}
        savedLists={state.savedLists}
        activeSavedListId={state.activeSavedListId}
        onApplySaved={(id) => dispatch({ type: "smartlist-apply-saved", id })}
        matchCount={totalMatchCount}
        onClearAll={() => dispatch({ type: "clear-all-filters" })}
        onSaveSearch={handleSaveSearch}
        onResetToProfile={handleResetToProfile}
        savedSearches={state.savedFilters}
        onRemoveSavedSearch={handleRemoveSavedFilter}
        opps={primeOpps}
        lane={state.lane}
      />

      <HunterChatOverlay
        open={state.chatOpen}
        onOpenChange={(o) => dispatch({ type: "set-chat", open: o })}
        topReason={topReason}
        onEnterStretches={() => dispatch({ type: "enter-stretches" })}
        onApplyFilters={applyHunterFilters}
        onReset={() => {
          dispatch({ type: "clear-all-filters" });
          dispatch({ type: "clear-other-tabs" });
          dispatch({ type: "set-search", value: "" });
        }}
        onSaveChange={handleHunterSaveChange}
        tab={state.tab}
        onSwitchTab={(tab) => dispatch({ type: "set-tab", tab })}
        visibleOpps={shownCards.map((card) => ({
          oppKey: card.id,
          // Send the plain-English title (what the card shows) so Hunter reasons
          // and replies with the same title the user sees, not the raw SAM title.
          title: card.geminiPlainEnglishTitle || card.title,
          location: card.location,
        }))}
        appliedFilters={{
          states: state.filters.states,
          naics: state.filters.naics,
          setAsides: state.filters.setAsides,
        }}
        askRequest={askRequest}
        onStageArtifact={showArtifact}
      />

      <DeleteSavedSearchModal
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        name={deleteTarget?.name ?? null}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

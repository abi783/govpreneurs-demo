// The Filters drawer — two-column design ported from govpreneurs-v2: a sticky
// left SectionNav (5 sections, scroll-spy) + a scrollable right body with a
// header strip (keyword + applied-filters chips + saved searches) and a
// "Show N matches" footer. Sections host WorkPicker ("What you do"),
// LocationPicker ("Where"), ValueRangeControl ("Your fit"), SegmentedControls
// ("Timing"), and AdvancedFiltersPanel ("Advanced").

import { useEffect, useMemo, useRef, useState } from "react";
import { BookmarkPlus, X } from "lucide-react";
import { SmartListBuilder } from "./SmartListBuilder";
import { SavedListsBar } from "./SavedListsBar";
import { SmartListChips } from "./SmartListChips";
import { makeEmptySmartList, type SmartList, type SavedSmartList } from "../../lib/smartList";
import { AdvancedFiltersPanel } from "./AdvancedFiltersPanel";
import { SectionNav } from "./SectionNav";
import { AppliedFiltersStrip } from "./AppliedFiltersStrip";
import { SaveSearchPopover } from "./SaveSearchPopover";
import { SavedSearchesRow } from "./SavedSearchesRow";
import { WorkPicker } from "./WorkPicker";
import { LocationPicker } from "./LocationPicker";
import { ValueRangeControl } from "./ValueRangeControl";
import { SegmentedControl } from "./SegmentedControl";
import { JargonGloss } from "./JargonGloss";
import {
  applyWorkPickerChange,
  prefilledValues,
  toServerFilters,
  dueWindowArrayToSegment,
  dueWindowSegmentToArray,
  postedWithinDaysToSegment,
  postedWithinSegmentToDays,
  DUE_WINDOW_SEGMENT_IDS,
  POSTED_WITHIN_SEGMENT_IDS,
  type OpportunityFilters,
} from "../../lib/opportunityFilters";
import { sectionActiveCounts, type DrawerSectionId } from "../../lib/filterCounts";
import { useFacetCounts } from "../../lib/useFacetCounts";
import { withLane, type BuyerLane } from "../../lib/buyerLane";
import { FACET_GLOSS } from "../../lib/filterGlosses";
import { WORK_TYPES, WORK_TYPE_TO_NAICS } from "../../lib/vocab/trades";
import { STATES } from "../../lib/vocab/usStates";
import type { StateCityGroup } from "../../lib/mock/govTaxonomy";
import type { CardOpportunity } from "../../lib/mock/opportunities";

// DEMO: the sample member is a caterer. The trade list puts the trades that hold one of her
// NAICS codes first, tags them "from your profile", and leaves out the trade that the old sample member held.
const DEMO_HIDDEN_TRADES = new Set(["roofing_and_roof_systems"]);
function demoTrades(profileNaics: string[]) {
  const own = (id: string) => (WORK_TYPE_TO_NAICS[id] ?? []).some((c) => profileNaics.includes(c));
  const all = WORK_TYPES.filter((t) => !DEMO_HIDDEN_TRADES.has(t.id));
  return [...all.filter((t) => own(t.id)), ...all.filter((t) => !own(t.id))].map((t) => ({
    id: t.id,
    label: t.label,
    prefilled: own(t.id),
  }));
}

// Temporarily hidden — kept in code for later re-enable.
const SHOW_SAVED_LISTS = false;
const SHOW_SAVE_SEARCH = true;

const SECTIONS: { id: DrawerSectionId; label: string; sub: string }[] = [
  { id: "what", label: "What you do", sub: "Your trades and the kind of work" },
  { id: "where", label: "Where", sub: "States, counties, ZIP codes" },
  { id: "fit", label: "Your fit", sub: "What you qualify for, job size" },
  { id: "timing", label: "Timing", sub: "Deadlines and freshness" },
  { id: "advanced", label: "Advanced", sub: "Agencies, notice types, and more" },
];

/** Labels for the due-window SegmentedControl's fixed segment ids. */
function dueWindowSegmentLabel(id: string): string {
  switch (id) {
    case "this_week":
      return "Within 1 week";
    case "2_weeks":
      return "Within 2 weeks";
    case "30_days":
      return "Within 30 days";
    case "60_plus":
      return "60+ days";
    default:
      return "Any";
  }
}

/** Labels for the posted-within SegmentedControl's fixed segment ids. */
function postedWithinSegmentLabel(id: string): string {
  switch (id) {
    case "1":
      return "1 day";
    case "3":
      return "3 days";
    case "7":
      return "7 days";
    case "30":
      return "30 days";
    default:
      return "Any time";
  }
}

export function FiltersDrawer({
  open,
  onClose,
  filters,
  onSetFilters,
  keyword,
  onKeyword,
  smartList,
  onSmartListApply,
  onSmartListClear,
  onSmartListRemoveCondition,
  onSmartListSave,
  savedLists,
  activeSavedListId,
  onApplySaved,
  matchCount,
  onClearAll,
  onSaveSearch,
  onResetToProfile,
  savedSearches,
  onRemoveSavedSearch,
  opps,
  lane = "all",
}: {
  open: boolean;
  onClose: () => void;
  filters: OpportunityFilters;
  onSetFilters: (f: OpportunityFilters) => void;
  /** The real search string — backs `state.searchValue`, shared with the
   *  OppsSummaryRow search box (both are controlled from the same state). */
  keyword: string;
  /** Updates the real search string (dispatches `set-search` in routes/index.tsx). */
  onKeyword: (v: string) => void;
  savedSearches: { id: string; name: string; filters: OpportunityFilters }[];
  onRemoveSavedSearch: (id: string) => void;
  smartList: SmartList | null;
  onSmartListApply: (l: SmartList) => void;
  onSmartListClear: () => void;
  onSmartListRemoveCondition: (groupId: string, conditionId: string) => void;
  onSmartListSave: (name: string, list: SmartList) => void;
  savedLists: SavedSmartList[];
  activeSavedListId: string | null;
  onApplySaved: (id: string) => void;
  matchCount: number;
  onClearAll: () => void;
  onSaveSearch: (name: string) => void;
  /** Restores the filters the member's profile seeds. Undefined — and the footer
   *  action is then not rendered — when the profile seeded nothing. */
  onResetToProfile?: () => void;
  opps: CardOpportunity[];
  /** The page's buyer lane. The per-option counts count that lane only. */
  lane?: BuyerLane;
}) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<DrawerSectionId>("what");
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const suppressSpyUntil = useRef(0);

  // Local keyword mirror, debounced into the real search (state.searchValue,
  // shared with the OppsSummaryRow search box) — per-keystroke writes would
  // flood re-renders of the whole filtered feed.
  const [keywordText, setKeywordText] = useState(keyword);
  useEffect(() => setKeywordText(keyword), [keyword]);
  const keywordRef = useRef(keyword);
  useEffect(() => {
    keywordRef.current = keyword;
  }, [keyword]);
  const keywordTimer = useRef<number | null>(null);
  const onKeywordInput = (v: string) => {
    setKeywordText(v);
    if (keywordTimer.current) window.clearTimeout(keywordTimer.current);
    keywordTimer.current = window.setTimeout(() => {
      if (keywordRef.current !== v.trim()) onKeyword(v.trim());
    }, 250);
  };
  useEffect(
    () => () => {
      if (keywordTimer.current) window.clearTimeout(keywordTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Innermost layer owns Escape — fields and any open Radix layer must
      // consume the first press so the drawer only closes when nothing is
      // layered above it. Capture phase so this runs before Radix unmounts.
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (document.querySelector("[data-radix-popper-content-wrapper]")) return;
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  // A drawer opened while a smart list is active starts in the builder — that
  // IS the active search; editing paused facets would mislead.
  useEffect(() => {
    if (open) setBuilderOpen(!!smartList);
  }, [open, smartList]);

  // Scroll-spy: active section = last one whose top passed the band.
  useEffect(() => {
    const el = bodyRef.current;
    if (!open || builderOpen || !el) return;
    const onScroll = () => {
      if (Date.now() < suppressSpyUntil.current) return;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
      if (atBottom) {
        setActiveSection(SECTIONS[SECTIONS.length - 1].id);
        return;
      }
      let current: DrawerSectionId = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const sec = el.querySelector<HTMLElement>(`#fd-sec-${s.id}`);
        if (sec && sec.offsetTop <= el.scrollTop + 90) current = s.id;
      }
      setActiveSection(current);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [open, builderOpen]);

  // Live per-option result counts for WorkPicker (NAICS) and LocationPicker
  // (states/cities) — fetched whenever the drawer is open and refetched
  // (debounced, aborting any in-flight request) on every filter change. Both
  // pickers read from this single call rather than each firing their own.
  const serverFiltersForCounts = useMemo(
    () => withLane(toServerFilters(filters, "match").filters, lane),
    [filters, lane],
  );
  const facetCounts = useFacetCounts(serverFiltersForCounts, open && !builderOpen);

  // Seed groups for LocationPicker — one entry per state with an empty city
  // list; LocationPicker lazily fetches each state's cities on first expand.
  // DEMO: the member's own states (from her profile) come first, so she does not scroll past Alabama.
  const profileStates = prefilledValues(filters, "states").join(",");
  const locationGroups = useMemo<StateCityGroup[]>(() => {
    const own = new Set(profileStates.split(",").filter(Boolean));
    const all = STATES.map((s) => ({ state: s.id, cities: [] }));
    return [...all.filter((g) => own.has(g.state)), ...all.filter((g) => !own.has(g.state))];
  }, [profileStates]);

  const jumpTo = (id: DrawerSectionId) => {
    const sec = bodyRef.current?.querySelector<HTMLElement>(`#fd-sec-${id}`);
    if (!sec) return;
    setActiveSection(id);
    // Long enough to outlast the smooth scroll — a late scroll event
    // recomputing mid-settle would override the jumped-to section.
    suppressSpyUntil.current = Date.now() + 1100;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sec.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  if (!open) return null;

  const sectionCounts = sectionActiveCounts(filters);
  const activeSmartListName = smartList
    ? (activeSavedListId && savedLists.find((l) => l.id === activeSavedListId)?.name) || null
    : null;

  return (
    <div
      className="fd-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Filters"
    >
      <aside className="fd-panel fd-panel--wide">
        <header className="fd-head">
          <div>
            <div className="t-label">Refine</div>
            <h2 className="fd-title">Filters</h2>
          </div>
          <button type="button" className="fd-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        {builderOpen ? (
          <div className="fd-body" ref={bodyRef}>
            <div className="fd-builder-banner" role="status">
              <span>
                {smartList
                  ? "Smart list active — facet filters are paused while this list drives the feed."
                  : "Drafting a smart list — nothing changes until you press Apply."}
              </span>
              <button
                type="button"
                className="fd-builder-banner__back"
                onClick={() => {
                  onSmartListClear();
                  setBuilderOpen(false);
                }}
              >
                Back to filters
              </button>
            </div>
            {smartList && (
              <section className="fd-section">
                <div className="fd-kicker">Active conditions</div>
                <SmartListChips
                  list={smartList}
                  onRemoveCondition={onSmartListRemoveCondition}
                  onEdit={() => {}}
                  onClear={onSmartListClear}
                />
              </section>
            )}
            <SmartListBuilder
              initial={smartList ?? makeEmptySmartList()}
              onApply={(l) => {
                onSmartListApply(l);
                onClose();
              }}
              onClear={onSmartListClear}
              onClose={() => setBuilderOpen(false)}
              onSave={onSmartListSave}
            />
          </div>
        ) : (
          <div className="fd-layout">
            <SectionNav
              sections={SECTIONS.map((s) => ({
                id: s.id,
                label: s.label,
                count: sectionCounts[s.id],
              }))}
              activeId={activeSection}
              onJump={jumpTo}
            />
            <div className="fd-body" ref={bodyRef}>
              {/* ── Header strip: your current search ── */}
              <div className="fd-strip">
                <input
                  className="fd-keyword"
                  type="text"
                  value={keywordText}
                  onChange={(e) => onKeywordInput(e.target.value)}
                  placeholder="Keyword — title, agency, or place…"
                  aria-label="Keyword"
                />
                <AppliedFiltersStrip
                  filters={filters}
                  onSetFilters={onSetFilters}
                  smartList={smartList}
                  smartListName={activeSmartListName}
                  onClearSmartList={onSmartListClear}
                  onClearAll={onClearAll}
                />
                <SavedSearchesRow
                  searches={savedSearches}
                  onApply={(f) => onSetFilters(f)}
                  onRemove={onRemoveSavedSearch}
                />
              </div>

              {/* ── 1 · What you do ── WorkPicker owns trade/NAICS selection.
                  Job size and due date now live in "Your fit" / "Timing"
                  below (ValueRangeControl / SegmentedControl); the Simple
                  grid here is left with just the radius chip until the
                  gazetteer-tree phase. */}
              <section id="fd-sec-what" className="fd-sec">
                <div className="fd-sec__head">
                  <span className="fd-sec__title">What you do</span>
                  <span className="fd-sec__sub">{SECTIONS[0].sub}</span>
                </div>
                <div className="fd-control">
                  <WorkPicker
                    trades={demoTrades(prefilledValues(filters, "naics"))}
                    selected={filters.workTypes}
                    excludedNaics={filters.excludedNaics}
                    onChangeTrades={(next) =>
                      onSetFilters(applyWorkPickerChange(filters, { workTypes: next }))
                    }
                    onChangeExcluded={(next) =>
                      onSetFilters(applyWorkPickerChange(filters, { excludedNaics: next }))
                    }
                    naicsCounts={facetCounts?.naics}
                  />
                  {/* "Within radius" control removed — it was a no-op (hardcoded
                      origin, never sent to the server, no backend geo filter). */}
                </div>
              </section>

              {/* ── 2 · Where ── LocationPicker owns state/city selection. */}
              <section id="fd-sec-where" className="fd-sec">
                <div className="fd-sec__head">
                  <span className="fd-sec__title">Where</span>
                  <span className="fd-sec__sub">{SECTIONS[1].sub}</span>
                </div>
                <div className="fd-control">
                  <LocationPicker
                    groups={locationGroups}
                    states={filters.states}
                    cities={filters.cities}
                    onChange={({ states, cities }) => onSetFilters({ ...filters, states, cities })}
                    stateCounts={facetCounts?.states}
                    cityCounts={facetCounts?.cities}
                    prefilledStates={new Set(prefilledValues(filters, "states"))}
                  />
                  <p className="fd-microgloss">
                    County and ZIP-radius live in Advanced below until the gazetteer tree is ported.
                  </p>
                </div>
              </section>

              {/* ── 3 · Your fit ── set-asides live in the Advanced panel;
                  job size (Estimated Contract Value) now uses the ported
                  ValueRangeControl, reading live counts from the drawer's
                  existing useFacetCounts() result (no new fetch). */}
              <section id="fd-sec-fit" className="fd-sec">
                <div className="fd-sec__head">
                  <span className="fd-sec__title">Your fit</span>
                  <span className="fd-sec__sub">{SECTIONS[2].sub}</span>
                </div>
                <div className="fd-control">
                  <div className="fd-control__head">
                    <span>Job size</span>
                    <JargonGloss gloss={FACET_GLOSS.valueRange.gloss} />
                  </div>
                  <ValueRangeControl
                    value={filters.valueRange}
                    onChange={(v) => onSetFilters({ ...filters, valueRange: v })}
                    counts={facetCounts}
                  />
                  <p className="fd-microgloss">
                    Applies to contracts — grants and product buys keep their own amounts.
                  </p>
                  <p className="fd-microgloss">Set-asides are in Advanced below.</p>
                </div>
              </section>

              {/* ── 4 · Timing ── due window and posted-within now use the
                  ported SegmentedControl, writing filters.dueWindow /
                  filters.postedWithin through the bridging helpers in
                  opportunityFilters.ts (toServerFilters itself is unchanged). */}
              <section id="fd-sec-timing" className="fd-sec">
                <div className="fd-sec__head">
                  <span className="fd-sec__title">Timing</span>
                  <span className="fd-sec__sub">{SECTIONS[3].sub}</span>
                </div>
                <div className="fd-control">
                  <div className="fd-control__head">
                    <span>Closing</span>
                    <JargonGloss gloss={FACET_GLOSS.dueWindow.gloss} />
                  </div>
                  <SegmentedControl
                    ariaLabel="Due window"
                    value={dueWindowArrayToSegment(filters.dueWindow)}
                    onChange={(id) =>
                      onSetFilters({ ...filters, dueWindow: dueWindowSegmentToArray(id) })
                    }
                    options={DUE_WINDOW_SEGMENT_IDS.map((id) => ({
                      value: id,
                      label: dueWindowSegmentLabel(id),
                      count: facetCounts?.dueWindow?.[id],
                    }))}
                    resetValue="any"
                  />
                </div>
                <div className="fd-control">
                  <div className="fd-control__head">
                    <span>Posted</span>
                    <JargonGloss gloss={FACET_GLOSS.postedWithin.gloss} />
                  </div>
                  <SegmentedControl
                    ariaLabel="Posted within"
                    value={postedWithinDaysToSegment(filters.postedWithin)}
                    onChange={(id) =>
                      onSetFilters({ ...filters, postedWithin: postedWithinSegmentToDays(id) })
                    }
                    options={POSTED_WITHIN_SEGMENT_IDS.map((id) => ({
                      value: id,
                      label: postedWithinSegmentLabel(id),
                    }))}
                    resetValue="any"
                  />
                </div>
              </section>

              {/* ── 5 · Advanced ── keeps live's existing AdvancedFiltersPanel
                  (NAICS, PSC, agencies, notice types, vehicles, scope, etc.)
                  mounted as-is under the new section header. */}
              <section id="fd-sec-advanced" className="fd-sec">
                <div className="fd-sec__head">
                  <span className="fd-sec__title">Advanced</span>
                  <span className="fd-sec__sub">{SECTIONS[4].sub}</span>
                </div>
                <AdvancedFiltersPanel filters={filters} onChange={onSetFilters} opps={opps} />

                {SHOW_SAVED_LISTS && savedLists.length > 0 && (
                  <div className="fd-control">
                    <div className="fd-kicker">Saved lists</div>
                    <SavedListsBar
                      lists={savedLists}
                      activeName={
                        activeSavedListId
                          ? (savedLists.find((l) => l.id === activeSavedListId)?.name ?? null)
                          : null
                      }
                      onApply={onApplySaved}
                    />
                  </div>
                )}
                {/* Smart-list builder entry point removed — feature not ready. */}
              </section>
            </div>
          </div>
        )}

        <footer className="fd-foot">
          {onResetToProfile && (
            <button type="button" className="fd-foot__reset" onClick={onResetToProfile}>
              Reset to my profile
            </button>
          )}
          {SHOW_SAVE_SEARCH && (
            <SaveSearchPopover onSave={onSaveSearch}>
              <button type="button" className="fd-foot__save">
                <BookmarkPlus size={12} /> Save this search
              </button>
            </SaveSearchPopover>
          )}
          <button type="button" className="fd-foot__done" onClick={onClose}>
            Show <strong className="of-num">{matchCount}</strong>{" "}
            {matchCount === 1 ? "match" : "matches"}
          </button>
        </footer>
      </aside>
    </div>
  );
}

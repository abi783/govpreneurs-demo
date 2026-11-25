// The Filters window for Opportunities. It uses the same panel as Partners and
// Awards (components/Filters/FilterPanel), as a large window in the middle of
// the page: the categories on the left, one category at a time, the filters
// that are on as chips at the top, and one "Show N opportunities" button.
//
// The categories are "What you do" (WorkPicker), "Where" (LocationPicker),
// "Job size" (ValueRangeControl), "Timing" (two DaysFields), then "Set-aside",
// "Agency", "Notice type" and "Contract vehicle" (OpportunityFacetFilters).
// Choices apply as she makes them.
//
// Above the chips: her saved searches, when no filter is on. The window has no
// keyword box of its own: the page's search bar is the one opportunity search.
// Each category with a list has its own search, which only narrows that list. In the footer:
// "Reset to my profile", "Save this search" and the apply button. While a smart
// list drives the feed, the window shows the smart list instead of the categories.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookmarkPlus } from "lucide-react";
import { Field, FilterPanel, type ChipView } from "../Filters/FilterPanel";
import { SmartListBuilder } from "./SmartListBuilder";
import { SmartListChips } from "./SmartListChips";
import { makeEmptySmartList, type SmartList, type SavedSmartList } from "../../lib/smartList";
import { SaveSearchPopover } from "./SaveSearchPopover";
import { SavedSearchesRow } from "./SavedSearchesRow";
import { WorkPicker } from "./WorkPicker";
import { LocationPicker } from "./LocationPicker";
import { ValueRangeControl } from "./ValueRangeControl";
import { DaysField } from "./DaysField";
import {
  AgencyFilter,
  NoticeTypeFilter,
  SetAsideFilter,
  VehicleFilter,
} from "./OpportunityFacetFilters";
import { buildActiveChips } from "./filterChips";
import {
  applyWorkPickerChange,
  dueWindowForDays,
  dueWithinDays,
  prefilledValues,
  toServerFilters,
  type OpportunityFilters,
} from "../../lib/opportunityFilters";
import { sectionActiveCounts, type DrawerSectionId } from "../../lib/filterCounts";
import { useFacetCounts } from "../../lib/useFacetCounts";
import { withLane, type BuyerLane } from "../../lib/buyerLane";
import { daysText } from "../../lib/format";
import { WORK_TYPES, WORK_TYPE_TO_NAICS } from "../../lib/vocab/trades";
import { STATES } from "../../lib/vocab/usStates";
import type { StateCityGroup } from "../../lib/mock/govTaxonomy";
import type { CardOpportunity } from "../../lib/mock/opportunities";

// DEMO: the trade list puts the trades that hold one of the member's NAICS codes first,
// tags them "from your profile", and leaves out the trade that the old sample member held.
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

// One category at a time, so every category is closed until she opens it.
const SECTIONS: { id: DrawerSectionId; label: string }[] = [
  { id: "what", label: "What you do" },
  { id: "where", label: "Where" },
  { id: "fit", label: "Job size" },
  { id: "timing", label: "Timing" },
  { id: "setAsides", label: "Set-aside" },
  { id: "agencies", label: "Agency" },
  { id: "noticeTypes", label: "Notice type" },
  { id: "vehicles", label: "Contract vehicle" },
];

// Timing shortcuts, in days. She can also type any number of days.
const CLOSING_PRESETS = [10, 20, 30, 40, 50, 60];
const POSTED_PRESETS = [1, 3, 7, 30];

export function FiltersDrawer({
  open,
  onClose,
  filters,
  onSetFilters,
  keyword,
  smartList,
  onSmartListApply,
  onSmartListClear,
  onSmartListRemoveCondition,
  onSmartListSave,
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
  /** The page's search string. The window only reads it: saved searches hide while it is set. */
  keyword: string;
  savedSearches: { id: string; name: string; filters: OpportunityFilters }[];
  onRemoveSavedSearch: (id: string) => void;
  smartList: SmartList | null;
  onSmartListApply: (l: SmartList) => void;
  onSmartListClear: () => void;
  onSmartListRemoveCondition: (groupId: string, conditionId: string) => void;
  onSmartListSave: (name: string, list: SmartList) => void;
  /** Saved smart lists. The window does not show them yet; the route still passes them. */
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
  const [active, setActive] = useState<DrawerSectionId>("what");

  // FilterPanel re-runs its open effect (focus, scroll lock) when `onClose`
  // changes. The page passes a new function on every render, so this keeps one
  // stable function that calls the latest one.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  const stableClose = useCallback(() => onCloseRef.current(), []);

  // A window opened while a smart list is active starts in the smart list.
  // That list IS the active search; editing the paused filters would mislead.
  const [builderOpen, setBuilderOpen] = useState(false);
  useEffect(() => {
    if (open) setBuilderOpen(!!smartList);
  }, [open, smartList]);

  // Live per-option result counts for WorkPicker (NAICS), LocationPicker
  // (states/cities) and the job size buckets — fetched while the window is
  // open and refetched (debounced, aborting any in-flight request) on every
  // filter change. Every category reads this one call.
  const serverFiltersForCounts = useMemo(
    () => withLane(toServerFilters(filters, "match").filters, lane),
    [filters, lane],
  );
  const facetCounts = useFacetCounts(serverFiltersForCounts, open && !builderOpen);

  // Seed groups for LocationPicker — one entry per state with an empty city
  // list; LocationPicker fetches each state's cities on first expand.
  // DEMO: the member's own states (from her profile) come first, so she does not scroll past Alabama.
  const profileStates = prefilledValues(filters, "states").join(",");
  const locationGroups = useMemo<StateCityGroup[]>(() => {
    const own = new Set(profileStates.split(",").filter(Boolean));
    const all = STATES.map((s) => ({ state: s.id, cities: [] }));
    return [...all.filter((g) => own.has(g.state)), ...all.filter((g) => !own.has(g.state))];
  }, [profileStates]);

  const sectionCounts = useMemo(() => sectionActiveCounts(filters), [filters]);
  const activeChips = useMemo(
    () => buildActiveChips(filters, onSetFilters),
    [filters, onSetFilters],
  );
  const chips: ChipView[] = activeChips.map((c) => ({ key: c.key, label: c.label }));

  // Saved searches show only when no filter is on. A saved search replaces the
  // filters, so this stops a member from losing her own picks by mistake.
  // "Clear all" removes every chip, and the row comes back.
  const showSavedSearches = savedSearches.length > 0 && chips.length === 0 && keyword.trim() === "";

  const categories = !builderOpen && (
    <>
      {active === "what" && (
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
        </div>
      )}

      {active === "where" && (
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
        </div>
      )}

      {active === "fit" && (
        <div className="fd-control">
          <ValueRangeControl
            value={filters.valueRange}
            onChange={(v) => onSetFilters({ ...filters, valueRange: v })}
            counts={facetCounts}
          />
        </div>
      )}

      {active === "timing" && (
        <>
          <Field title="Closing date">
            <DaysField
              label="Closing date"
              presets={CLOSING_PRESETS}
              presetText={daysText}
              unit="days"
              value={dueWithinDays(filters)}
              onChange={(days) => onSetFilters({ ...filters, dueWindow: dueWindowForDays(days) })}
            />
          </Field>
          <Field title="Date posted">
            <DaysField
              label="Date posted"
              presets={POSTED_PRESETS}
              presetText={(days) => `${daysText(days)} ago`}
              unit="days ago"
              value={filters.postedWithin}
              onChange={(days) => onSetFilters({ ...filters, postedWithin: days })}
            />
          </Field>
        </>
      )}

      {active === "setAsides" && <SetAsideFilter filters={filters} onChange={onSetFilters} />}
      {active === "agencies" && (
        <AgencyFilter filters={filters} onChange={onSetFilters} opps={opps} />
      )}
      {active === "noticeTypes" && (
        <NoticeTypeFilter filters={filters} onChange={onSetFilters} opps={opps} />
      )}
      {active === "vehicles" && <VehicleFilter filters={filters} onChange={onSetFilters} />}
    </>
  );

  return (
    <FilterPanel
      open={open}
      onClose={stableClose}
      variant="window"
      kicker=""
      title="Filter opportunities"
      subtitle=""
      sections={SECTIONS.map((s) => ({ ...s, count: sectionCounts[s.id] }))}
      active={active}
      onSection={setActive}
      hideNav={builderOpen}
      chips={builderOpen ? [] : chips}
      onRemoveChip={(key) => activeChips.find((c) => c.key === key)?.onRemove()}
      onClearAll={onClearAll}
      applyLabel={`Show ${matchCount} ${matchCount === 1 ? "opportunity" : "opportunities"}`}
      toolbar={
        !builderOpen && showSavedSearches ? (
          <SavedSearchesRow
            searches={savedSearches}
            onApply={(f) => onSetFilters(f)}
            onRemove={onRemoveSavedSearch}
          />
        ) : undefined
      }
      footerStart={
        onResetToProfile ? (
          <button type="button" className="fp-btn-quiet" onClick={onResetToProfile}>
            Reset to my profile
          </button>
        ) : (
          <span />
        )
      }
      footerActions={
        <SaveSearchPopover onSave={onSaveSearch}>
          <button type="button" className="fp-btn-quiet fp-btn-quiet--icon">
            <BookmarkPlus size={14} aria-hidden /> Save this search
          </button>
        </SaveSearchPopover>
      }
    >
      {builderOpen && (
        <>
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
              stableClose();
            }}
            onClear={onSmartListClear}
            onClose={() => setBuilderOpen(false)}
            onSave={onSmartListSave}
          />
        </>
      )}
      {categories}
    </FilterPanel>
  );
}

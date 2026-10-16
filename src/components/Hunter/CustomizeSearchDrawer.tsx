import { useEffect } from "react";
import { X } from "lucide-react";
import { AISearchBar } from "./AISearchBar";
import { QuickPicks } from "./QuickPicks";
import {
  RefinementChips,
  type ActiveFilters,
  type ModeFilter,
  type ScopeFilter,
} from "./RefinementChips";
import { SavedListsBar } from "./SavedListsBar";
import { SmartListChips } from "./SmartListChips";
import { SmartListBuilder } from "./SmartListBuilder";
import { makeEmptySmartList, type SavedSmartList, type SmartList } from "../../lib/smartList";

export function CustomizeSearchDrawer({
  open,
  onClose,
  searchValue,
  parsing,
  parsedQuery,
  onSearchChange,
  onSubmitSearch,
  filters,
  onSetFilters,
  onRemoveFilter,
  onModeFilterChange,
  onScopeFilterChange,
  onEditQuery,
  smartList,
  onSmartListApply,
  onSmartListClear,
  onSmartListRemoveCondition,
  onSmartListSave,
  builderOpen,
  onBuilderOpen,
  onBuilderClose,
  savedLists,
  activeSavedListId,
  onApplySaved,
}: {
  open: boolean;
  onClose: () => void;
  searchValue: string;
  parsing: boolean;
  parsedQuery: string | null;
  onSearchChange: (v: string) => void;
  onSubmitSearch: (v: string) => void;
  filters: ActiveFilters;
  onSetFilters: (f: ActiveFilters) => void;
  onRemoveFilter: (key: keyof ActiveFilters) => void;
  onModeFilterChange: (m: ModeFilter) => void;
  onScopeFilterChange: (s: ScopeFilter) => void;
  onEditQuery: () => void;
  smartList: SmartList | null;
  onSmartListApply: (l: SmartList) => void;
  onSmartListClear: () => void;
  onSmartListRemoveCondition: (groupId: string, conditionId: string) => void;
  onSmartListSave: (name: string, list: SmartList) => void;
  builderOpen: boolean;
  onBuilderOpen: () => void;
  onBuilderClose: () => void;
  savedLists: SavedSmartList[];
  activeSavedListId: string | null;
  onApplySaved: (id: string) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="cs-drawer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Customize search"
    >
      <aside className="cs-drawer">
        <header className="cs-drawer__head">
          <div>
            <div className="t-label">Refine</div>
            <h2 className="cs-drawer__title">Customize search</h2>
          </div>
          <button type="button" className="cs-drawer__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="cs-drawer__body">
          <section className="cs-drawer__section">
            <div className="cs-drawer__kicker">Search in plain English</div>
            <AISearchBar
              value={searchValue}
              onChange={onSearchChange}
              onSubmit={onSubmitSearch}
              parsing={parsing}
            />
            {!parsedQuery && !smartList && searchValue === "" && (
              <QuickPicks
                onPick={(t) => {
                  onSearchChange(t);
                  onSubmitSearch(t);
                }}
              />
            )}
          </section>

          <section className="cs-drawer__section">
            <div className="cs-drawer__kicker">Filters</div>
            {smartList ? (
              <SmartListChips
                list={smartList}
                onRemoveCondition={onSmartListRemoveCondition}
                onEdit={onBuilderOpen}
                onClear={onSmartListClear}
              />
            ) : (
              <RefinementChips
                filters={filters}
                onRemove={onRemoveFilter}
                onApplyChip={(key, value) => onSetFilters({ ...filters, [key]: value })}
                onModeFilterChange={onModeFilterChange}
                onScopeFilterChange={onScopeFilterChange}
                onEditQuery={onEditQuery}
                parsedQuery={parsedQuery}
                onOpenAdvanced={onBuilderOpen}
              />
            )}
          </section>

          <section className="cs-drawer__section">
            <div className="cs-drawer__kicker">Saved lists</div>
            <SavedListsBar
              lists={savedLists}
              activeName={
                activeSavedListId
                  ? (savedLists.find((l) => l.id === activeSavedListId)?.name ?? null)
                  : null
              }
              onApply={onApplySaved}
            />
          </section>

          {builderOpen && (
            <SmartListBuilder
              initial={smartList ?? makeEmptySmartList()}
              onApply={onSmartListApply}
              onClear={onSmartListClear}
              onClose={onBuilderClose}
              onSave={onSmartListSave}
            />
          )}
        </div>

        <footer className="cs-drawer__foot">
          <button type="button" className="cs-drawer__done" onClick={onClose}>
            Done
          </button>
        </footer>
      </aside>
    </div>
  );
}

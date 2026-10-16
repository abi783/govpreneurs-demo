// Saved-searches recall row — lives inside the drawer's header strip, right
// next to the state it recalls. Pure presentational: the live app's saved
// searches are server-backed (POST/DELETE /workspace/saved-searches via
// src/lib/workspace.ts), so this component takes the list and callbacks as
// props instead of reading an in-memory store. Optional `starters` are
// client-only seeded entries (not deletable).

import { X } from "lucide-react";
import type { OpportunityFilters } from "../../lib/opportunityFilters";

export type SavedSearchEntry = { id: string; name: string; filters: OpportunityFilters };

export type StarterSearch = { id: string; name: string; apply: () => OpportunityFilters };

export function SavedSearchesRow({
  searches,
  onApply,
  onRemove,
  starters,
}: {
  searches: SavedSearchEntry[];
  onApply: (filters: OpportunityFilters) => void;
  onRemove: (id: string) => void;
  starters?: StarterSearch[];
}) {
  const hasStarters = !!starters && starters.length > 0;
  if (searches.length === 0 && !hasStarters) return null;

  return (
    <div className="of-saved-filters">
      <span className="of-saved-filters__head">Saved searches:</span>
      {starters?.map((entry) => (
        <span key={entry.id} className="of-saved-filter-wrap">
          <button
            type="button"
            className="of-saved-filter"
            onClick={() => onApply(entry.apply())}
            title="Starter search"
          >
            {entry.name}
          </button>
        </span>
      ))}
      {searches.map((entry) => (
        <span key={entry.id} className="of-saved-filter-wrap">
          <button
            type="button"
            className="of-saved-filter"
            onClick={() => onApply(entry.filters)}
            title="Saved search"
          >
            {entry.name}
          </button>
          <button
            type="button"
            className="of-saved-filter__x"
            aria-label={`Delete saved search ${entry.name}`}
            onClick={() => onRemove(entry.id)}
          >
            <X size={11} />
          </button>
        </span>
      ))}
    </div>
  );
}

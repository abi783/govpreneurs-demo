// "Your changes" strip — shows the currently active filters as removable
// chips. Ported from govpreneurs-v2/src/components/Hunter/AppliedFiltersStrip.tsx
// (Phase 2), adapted to live's OpportunityFilters model.
//
// The reference diffs against `defaultFiltersForMarcus()` — a baseline where
// profile values are PRE-SELECTED — so it can show "N profile filters off" /
// "+N added". Live's `applyProfileDefaults` only TAGS matching options as
// "from your profile" (via `filters.prefilled`); it never auto-selects them
// (see opportunityFilters.ts). There is therefore no pre-selected baseline to
// diff against here — every active chip is something the member (or an
// earlier prefill tick) explicitly turned on. This strip instead shows every
// active chip as removable, and calls out how many of them are tagged
// "from your profile" so the member can still tell prefilled values apart
// from ones they picked themselves.
//
// An active smart list collapses to one chip since its AND/OR tree doesn't
// decompose into removable values (same as the reference).

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { OpportunityFilters } from "../../lib/opportunityFilters";
import type { SmartList } from "../../lib/smartList";
import { buildActiveChips } from "./filterChips";

const COLLAPSE_AT = 8;

// Facets whose "…:value" prefilled tag is meaningful for the profile-count
// (mirrors the facets applyProfileDefaults can tag: naics, setAsides, states,
// cities). workTypes/agencies aren't in that list in live's model yet.
function countPrefilledChips(f: OpportunityFilters): number {
  let n = 0;
  f.states.forEach((v) => f.prefilled.has(`states:${v}`) && n++);
  f.cities.forEach((v) => f.prefilled.has(`cities:${v}`) && n++);
  f.setAsides.forEach((v) => f.prefilled.has(`setAsides:${v}`) && n++);
  f.naics.forEach((v) => f.prefilled.has(`naics:${v}`) && n++);
  return n;
}

export function AppliedFiltersStrip({
  filters,
  onSetFilters,
  smartList,
  smartListName,
  onClearSmartList,
  onClearAll,
}: {
  filters: OpportunityFilters;
  onSetFilters: (next: OpportunityFilters) => void;
  smartList: SmartList | null;
  smartListName: string | null;
  onClearSmartList: () => void;
  onClearAll?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // Hooks must run unconditionally (even on the smart-list early-return
  // branch below), so compute chips before branching.
  const chips = useMemo(() => buildActiveChips(filters, onSetFilters), [filters, onSetFilters]);

  if (smartList) {
    return (
      <div className="afs" role="group" aria-label="Applied filters">
        <button
          type="button"
          className="afs-chip afs-chip--smart"
          onClick={onClearSmartList}
          aria-label={`Remove smart list ${smartListName ?? ""}`}
        >
          <span>Smart list: {smartListName ?? "custom"}</span>
          <X size={12} aria-hidden />
        </button>
      </div>
    );
  }

  const prefilledCount = countPrefilledChips(filters);

  if (chips.length === 0) {
    return (
      <div className="afs" role="group" aria-label="Applied filters">
        <span className="afs-note">No filters applied yet.</span>
      </div>
    );
  }

  const visible = expanded ? chips : chips.slice(0, COLLAPSE_AT);
  const hidden = chips.length - visible.length;

  return (
    <div className="afs" role="group" aria-label="Active filters">
      {prefilledCount > 0 && (
        <span className="afs-note">
          <span className="of-num">{prefilledCount}</span> from your profile
        </span>
      )}
      {visible.map((c) => (
        <button
          key={c.key}
          type="button"
          className="afs-chip"
          onClick={c.onRemove}
          aria-label={`Remove filter ${c.label}`}
          title="Click to remove"
        >
          <span>{c.label}</span>
          <X size={12} aria-hidden />
        </button>
      ))}
      {hidden > 0 && (
        <button type="button" className="afs-more" onClick={() => setExpanded(true)}>
          +<span className="of-num">{hidden}</span> more
        </button>
      )}
      {expanded && chips.length > COLLAPSE_AT && (
        <button type="button" className="afs-more" onClick={() => setExpanded(false)}>
          Show fewer
        </button>
      )}
      {onClearAll && (
        <button type="button" className="of-clear-all" onClick={onClearAll}>
          Clear all
        </button>
      )}
    </div>
  );
}

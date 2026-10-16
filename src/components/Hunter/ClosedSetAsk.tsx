// The `multi_select` profile-ask body (enrichment #6): a chip picker over a
// CLOSED set of values, in place of the text box those fields used to get.
//
// It owns no option data and no field knowledge — the catalog comes from
// `lib/askOptions.ts` (keyed by the vocabulary field the backend already sends)
// and the list itself is the shared `SearchableMultiSelect` the filter drawer
// renders. What it adds is the ask contract: pre-select what is already on file,
// and submit the comma-joined token string the fact write boundary expects.

import { useEffect, useMemo, useState } from "react";
import type { ProfileAsk } from "../../lib/hunterChat";
import {
  closedSetFor,
  partitionStoredValue,
  valueFromSelected,
  type ClosedSet,
} from "../../lib/askOptions";
import { useDebouncedSearch } from "../../lib/useDebouncedSearch";
import { SearchableMultiSelect, type MSOption } from "./SearchableMultiSelect";

/** Options for the currently-picked ids that the visible list doesn't carry, so
 *  a remote-search catalog never hides (or strands) an existing selection. */
function useResolvedSelection(set: ClosedSet, selected: string[]): MSOption[] {
  const [resolved, setResolved] = useState<MSOption[]>([]);
  const key = selected.join(",");
  useEffect(() => {
    if (set.kind !== "searched" || !key) return;
    let live = true;
    void set
      .resolve(key.split(","))
      .then((opts) => {
        if (live) setResolved(opts);
      })
      .catch(() => {
        /* labels fall back to the bare code — never block the picker */
      });
    return () => {
      live = false;
    };
  }, [set, key]);
  return resolved;
}

/** A fixed set never searches, but the hook below must still be called. */
const NO_SEARCH = async (): Promise<MSOption[]> => [];

/** Remote-search state for a catalog too large to ship (NAICS). Debounce,
 *  abort and failure handling come from the shared `useDebouncedSearch`. */
function useRemoteOptions(set: ClosedSet): {
  options: readonly MSOption[];
  onQueryChange?: (q: string) => void;
} {
  const [query, setQuery] = useState("");
  const searched = set.kind === "searched" ? set : null;
  const { results } = useDebouncedSearch(searched?.search ?? NO_SEARCH, query);
  if (set.kind !== "searched") return { options: set.options };
  return { options: results, onQueryChange: setQuery };
}

/** A closed-set ask: pick from the catalog, then Save. Returns null when the
 *  field has no catalog, so the caller can fall back to its free-text body. */
export function ClosedSetAsk({
  ask,
  initialValue,
  onSubmit,
}: {
  ask: ProfileAsk;
  /** What is already on file for this field, as the stored comma-list. */
  initialValue?: string;
  onSubmit: (value: string) => void;
}) {
  const set = closedSetFor(ask.field);
  if (!set) return null;
  return <ClosedSetPicker ask={ask} set={set} initialValue={initialValue} onSubmit={onSubmit} />;
}

function ClosedSetPicker({
  ask,
  set,
  initialValue,
  onSubmit,
}: {
  ask: ProfileAsk;
  set: ClosedSet;
  initialValue?: string;
  onSubmit: (value: string) => void;
}) {
  // What is on file, split into what this catalog actually contains and what it
  // does not. An out-of-set token is NOT pre-selected — the picker exists so an
  // un-matchable value cannot be confirmed — and it is not dropped quietly
  // either: it is named below, so the member sees what is going.
  const [{ selected: initialSelected, invalid }] = useState(() =>
    partitionStoredValue(set, initialValue),
  );
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const remote = useRemoteOptions(set);
  const resolved = useResolvedSelection(set, selected);

  // A picked option must stay visible and un-pickable-again after the query that
  // surfaced it is gone, so the selection is merged over whatever is listed.
  const options = useMemo(() => {
    const byId = new Map(remote.options.map((o) => [o.id, o]));
    for (const o of resolved) if (!byId.has(o.id)) byId.set(o.id, o);
    for (const id of selected) if (!byId.has(id)) byId.set(id, { id, label: id });
    return [...byId.values()];
  }, [remote.options, resolved, selected]);

  return (
    <div className="hunter-learn__picker">
      <SearchableMultiSelect
        options={options}
        selected={selected}
        onChange={setSelected}
        onQueryChange={remote.onQueryChange}
        placeholder={set.placeholder}
        searchable
        emptyText={
          set.kind === "searched" && !remote.options.length
            ? "Start typing to search"
            : "No matches"
        }
      />
      {invalid.length > 0 && (
        <p className="hunter-learn__invalid" role="note">
          Not on the list, so {invalid.length === 1 ? "it won't" : "they won't"} be saved:{" "}
          <span className="hunter-learn__invalid-tokens">{invalid.join(", ")}</span>. Pick the
          closest match above instead.
        </p>
      )}
      <div className="hunter-learn__actions">
        <button
          type="button"
          className="hunter-learn__btn hunter-learn__btn--primary"
          disabled={selected.length === 0}
          onClick={() => onSubmit(valueFromSelected(selected))}
          aria-label={`Save ${ask.label}`}
        >
          Save
        </button>
      </div>
    </div>
  );
}

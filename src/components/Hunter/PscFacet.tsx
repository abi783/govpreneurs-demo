// The advanced-filters PSC facet, live over GET /psc/search.
//
// It replaces a hardcoded 40-row copy of the 2,344-code federal taxonomy. The
// panel's other facets are fixed catalogs that CAN ship (four opportunity
// types, the set-aside programs); this one cannot, so it is a typeahead — the
// member types, the register answers. The control itself is the same
// `SearchableMultiSelect` every other facet renders, driven remotely through
// its existing `onQueryChange` port, so the facet still looks and behaves like
// its neighbours.
//
// Nothing here invents a code. A failed lookup says the lookup failed, and an
// unresolved selection keeps its bare code.

import { useEffect, useMemo, useState } from "react";
import { searchPsc } from "../../lib/pscApi";
import { useDebouncedSearch, type SearchStatus } from "../../lib/useDebouncedSearch";
import { SearchableMultiSelect, type MSOption } from "./SearchableMultiSelect";

const PLACEHOLDER = "Search PSC code";

/** What the list says when it holds no rows, and why it holds none. */
const EMPTY_TEXT: Record<SearchStatus, string> = {
  idle: "Start typing to search PSC codes",
  loading: "Searching…",
  ready: "No matching PSC codes",
  failed: "Couldn't load PSC codes. Try again, or filter another way.",
};

/** One PSC row as an option: the code is the value, the words are the detail. */
function pscOption(code: string, description?: string): MSOption {
  return { id: code, label: code, detail: description, mono: true };
}

/**
 * The PSC filter facet: a live typeahead over the federal PSC taxonomy, with
 * the member's picks always listed so a selection can be undone.
 */
export function PscFacet({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const { results, status } = useDebouncedSearch(searchPsc, query);
  const [descriptions, setDescriptions] = useState<ReadonlyMap<string, string>>(() => new Map());

  // Every row the register has answered with, kept so a picked code still reads
  // in words after the query that surfaced it is gone.
  useEffect(() => {
    if (results.length === 0) return;
    setDescriptions((prev) => {
      const next = new Map(prev);
      for (const row of results) next.set(row.code, row.description);
      return next;
    });
  }, [results]);

  const options = useMemo(() => {
    const byCode = new Map<string, MSOption>();
    for (const row of results) byCode.set(row.code, pscOption(row.code, row.description));
    for (const code of selected) {
      if (!byCode.has(code)) byCode.set(code, pscOption(code, descriptions.get(code)));
    }
    return [...byCode.values()];
  }, [results, selected, descriptions]);

  return (
    <>
      <SearchableMultiSelect
        options={options}
        selected={selected}
        onChange={onChange}
        onQueryChange={setQuery}
        placeholder={PLACEHOLDER}
        searchable
        emptyText={EMPTY_TEXT[status]}
      />
      {status === "failed" && options.length > 0 && (
        <p className="of-ms__empty" role="note">
          {EMPTY_TEXT.failed}
        </p>
      )}
    </>
  );
}

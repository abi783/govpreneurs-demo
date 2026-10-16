// Reusable searchable two-level tri-state picker for the onboarding wizard.
// Shared by all three steps (work type → NAICS, state → city, set-aside
// category → codes) so onboarding feels cohesive and matches the filter
// drawer's WorkPicker/LocationPicker idioms.
//
// Tri-state parent (the LocationPicker model):
//   all  → parent id in `parents`; box filled with a Check; every child covered.
//   some → at least one child id in `children`; box filled with a Minus.
//   none → neither; empty box.
// Clicking a parent: none/some → all (select everything, drop enumerated
// children); all → none. Clicking a child of an "all" parent removes the
// parent and enumerates "everything except" it; filling every child collapses
// back to "all". Search filters BOTH levels and force-expands matched parents.
//
// The tri-state cascade math itself lives in `lib/treeSelection.ts` as pure
// functions (childIdsOf/statusOf/onParentClick/onChildClick/clearGroupChildren)
// so it's unit-testable without any component-rendering infrastructure; this
// component is a thin rendering + local-UI-state (search, expand, lazy-load)
// wrapper around it. Cascade math always runs against the FULL (unfiltered)
// group — never a search-narrowed copy — via `fullOf()` below.
//
// LAZY LOADING (new vs. the govpreneurs-v2 reference): a parent declared with
// `children: []` is treated as "lazy" when a `loadChildren` prop is supplied.
// On first expand, `loadChildren(parentId)` is called, a loading row is shown
// while pending, the result is cached (merged over the group's own children,
// same pattern as LocationPicker's `loadedCities`/`mergedGroups`), and a
// failure renders an inline retry row. The parent stays selectable as
// "select whole parent" via the parent-row click regardless of load state —
// loading children is only needed to narrow to specific ones. Parents that
// already have children populated up front (e.g. the work tree) are never
// lazy-loaded even if `loadChildren` is passed — only `children.length === 0`
// parents are.

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Loader2, Minus, Search, X } from "lucide-react";
import {
  childIdsOf,
  onChildClick as onChildClickPure,
  onParentClick as onParentClickPure,
  statusOf,
  type TreeChild,
  type TreeParent,
  type TreeSelection,
} from "../../lib/treeSelection";

export type { TreeChild, TreeParent, TreeSelection };

type LoadState = "idle" | "loading" | "loaded" | "error";

export function OnboardingTreePicker({
  groups,
  sectionLabels,
  selection,
  onChange,
  loadChildren,
  searchPlaceholder = "Search…",
  emptyLabel = "No matches",
  childNoun = { one: "code", many: "codes" },
}: {
  groups: TreeParent[];
  sectionLabels?: Record<string, string>;
  selection: TreeSelection;
  onChange: (next: TreeSelection) => void;
  /** Lazily loads a parent's children on first expand. Only invoked for
   *  parents whose `children` array is empty up front — parents that already
   *  have children populated in `groups` are never lazy-loaded. */
  loadChildren?: (parentId: string) => Promise<TreeChild[]>;
  searchPlaceholder?: string;
  emptyLabel?: string;
  /** Noun for level-2 items in the parent detail (e.g. code(s), city/cities). */
  childNoun?: { one: string; many: string };
}) {
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  // Lazily-loaded children, keyed by parent id — merged over the seed group's
  // own children so callers can pass `{ children: [] }` placeholders.
  const [loadedChildren, setLoadedChildren] = useState<Record<string, TreeChild[]>>({});
  const [loadStates, setLoadStates] = useState<Record<string, LoadState>>({});
  const needle = q.trim().toLowerCase();

  const { parents, children } = selection;

  // Cascade/tri-state logic must always run against the FULL group, never a
  // search-filtered view — otherwise selecting one matched child would look
  // like "every child selected" and wrongly collapse to the whole parent.
  // "Full" also means lazily-loaded children merged in, so a parent whose
  // children arrived async is scored correctly.
  const mergedGroups = useMemo<TreeParent[]>(
    () => groups.map((g) => ({ ...g, children: loadedChildren[g.id] ?? g.children })),
    [groups, loadedChildren],
  );
  const groupById = useMemo(() => new Map(mergedGroups.map((g) => [g.id, g])), [mergedGroups]);
  const fullOf = (g: TreeParent) => groupById.get(g.id) ?? g;

  const isLazy = (g: TreeParent) => !!loadChildren && g.children.length === 0;

  const loadFor = (g: TreeParent) => {
    if (!loadChildren) return;
    const state = loadStates[g.id];
    if (state === "loading" || state === "loaded") return;
    setLoadStates((prev) => ({ ...prev, [g.id]: "loading" }));
    loadChildren(g.id)
      .then((kids) => {
        setLoadedChildren((prev) => ({ ...prev, [g.id]: kids }));
        setLoadStates((prev) => ({ ...prev, [g.id]: "loaded" }));
      })
      .catch(() => {
        setLoadStates((prev) => ({ ...prev, [g.id]: "error" }));
      });
  };

  const onParentClick = (g: TreeParent) => onChange(onParentClickPure(fullOf(g), selection));
  const onChildClick = (g: TreeParent, childIdToToggle: string) =>
    onChange(onChildClickPure(fullOf(g), selection, childIdToToggle));

  const toggleExpand = (g: TreeParent) => {
    const willExpand = !expanded.has(g.id);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(g.id)) next.delete(g.id);
      else next.add(g.id);
      return next;
    });
    // Only ever lazy-load parents that start with zero children — parents
    // with children already populated up front (e.g. the work tree) never
    // trigger a fetch, even when `loadChildren` is supplied.
    if (willExpand && isLazy(g)) loadFor(g);
  };

  const matchesParent = (g: TreeParent) =>
    `${g.label} ${g.detail ?? ""} ${g.keywords ?? ""}`.toLowerCase().includes(needle);
  const matchesChild = (c: TreeChild) =>
    `${c.label} ${c.detail ?? ""} ${c.code ?? ""} ${c.keywords ?? ""}`
      .toLowerCase()
      .includes(needle);

  // Search filters both levels: a parent-name hit keeps the whole group;
  // otherwise keep only matching children and drop empty groups. Typing a
  // search query does NOT trigger loadChildren for every lazy parent — that
  // would defeat the purpose of laziness for a large tree (e.g. loading every
  // state's cities on any keystroke). LocationPicker does this as a
  // fallback for its own city-search bug; it isn't required here.
  const visible = useMemo(() => {
    if (!needle) return mergedGroups;
    return mergedGroups
      .map((g) => {
        if (matchesParent(g)) return g;
        const kids = g.children.filter(matchesChild);
        return kids.length ? { ...g, children: kids } : null;
      })
      .filter(Boolean) as TreeParent[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needle, mergedGroups]);

  const rows: React.ReactNode[] = [];
  let lastSection: string | undefined;
  for (const g of visible) {
    if (g.section && g.section !== lastSection) {
      lastSection = g.section;
      rows.push(
        <li key={`sec-${g.section}`} className="otp-section">
          {sectionLabels?.[g.section] ?? g.section}
        </li>,
      );
    }
    const fg = fullOf(g); // full group for all logic; g.children may be search-filtered
    const status = statusOf(fg, selection);
    const isExpanded = expanded.has(g.id) || !!needle;
    const selectedChildCount = childIdsOf(fg).filter((id) => children.includes(id)).length;
    const lazy = isLazy(fg);
    const loadState = loadStates[g.id] ?? "idle";
    const showExpandButton = fg.children.length > 0 || lazy;
    rows.push(
      <li key={g.id} className="wp-trade" role="treeitem" aria-expanded={isExpanded}>
        <div className="wp-trade__row">
          <button
            type="button"
            className={`of-option wp-trade__main${status === "all" ? " of-option--on" : ""}`}
            onClick={() => onParentClick(fg)}
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
                <span>{g.label}</span>
              </span>
              <span className="of-option__detail">
                {lazy && loadState !== "loaded"
                  ? loadState === "loading"
                    ? "loading…"
                    : loadState === "error"
                      ? "couldn't load"
                      : "expand for details"
                  : `${fg.children.length} ${fg.children.length === 1 ? childNoun.one : childNoun.many}`}
                {status === "some" && ` · ${selectedChildCount} selected`}
                {status === "all" && " · all"}
                {g.detail ? ` · ${g.detail}` : ""}
              </span>
            </span>
          </button>
          {showExpandButton && (
            <button
              type="button"
              className="wp-trade__expand"
              onClick={() => toggleExpand(fg)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Hide details" : "Show details"}
            >
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          )}
        </div>
        {isExpanded && (
          <ul className="wp-codes" role="group">
            {lazy && loadState === "loading" && (
              <li className="of-ms__empty">
                <Loader2 size={12} className="ai-spin" aria-hidden /> Loading…
              </li>
            )}
            {lazy && loadState === "error" && (
              <li className="of-ms__empty">
                Couldn't load —{" "}
                <button type="button" className="of-ms__clear-all" onClick={() => loadFor(fg)}>
                  Retry
                </button>
              </li>
            )}
            {lazy && loadState === "idle" && <li className="of-ms__empty">Expand to load…</li>}
            {fg.children.length === 0 && lazy && loadState === "loaded" && (
              <li className="of-ms__empty">{emptyLabel}</li>
            )}
            {g.children.map((c) => {
              const on = status === "all" || children.includes(c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`of-option of-option--compact wp-code${on ? " of-option--on" : ""}`}
                    onClick={() => onChildClick(fg, c.id)}
                    role="treeitem"
                    aria-selected={on}
                  >
                    <span className={`of-option__box${on ? " is-on" : ""}`} aria-hidden>
                      {on && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span className="of-option__main">
                      <span className="of-option__label">
                        <span>{c.label}</span>
                        {c.code && <span className="otp-code">{c.code}</span>}
                      </span>
                      {c.detail && <span className="of-option__detail">{c.detail}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </li>,
    );
  }

  return (
    <div className="of-ms otp">
      <div className="of-ms__search">
        <Search size={12} aria-hidden />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
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
        {rows.length === 0 ? <li className="of-ms__empty">{emptyLabel}</li> : rows}
      </ul>
    </div>
  );
}

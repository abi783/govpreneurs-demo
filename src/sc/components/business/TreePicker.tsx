"use client";

// Reusable searchable two-level tri-state picker, PORTED from Hunter
// (frontend-v2)'s `OnboardingTreePicker.tsx`. Used by the Business Profile's
// TradePicker (sections → work types) and ServiceArea (flat states, no
// children) controls.
//
// Tri-state parent (the LocationPicker model):
//   all  → parent id in `parents`; box filled with a check; every child covered.
//   some → at least one child id in `children`; box filled with a dash.
//   none → neither; empty box.
// Clicking a parent: none/some → all (select everything, drop enumerated
// children); all → none. Clicking a child of an "all" parent removes the
// parent and enumerates "everything except" it; filling every child collapses
// back to "all". Search filters BOTH levels and force-expands matched parents.
//
// The tri-state cascade math itself lives in `lib/businessProfile/treeSelection.ts`
// as pure functions so it's unit-testable without any component-rendering
// infrastructure; this component is a thin rendering + local-UI-state
// (search, expand) wrapper around it. Cascade math always runs against the
// FULL (unfiltered) group, never a search-narrowed copy, via `fullOf()` below.
//
// No lucide-react in this repo — icons are inline SVGs / text glyphs.

import { useMemo, useState } from "react";
import {
  childIdsOf,
  onChildClick as onChildClickPure,
  onParentClick as onParentClickPure,
  statusOf,
  type TreeChild,
  type TreeParent,
  type TreeSelection,
} from "../../lib/businessProfile/treeSelection";

export type { TreeChild, TreeParent, TreeSelection };

type LoadState = "idle" | "loading" | "loaded" | "error";

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8.5L6.2 11.5L13 4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8H13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function TreePicker({
  groups,
  sectionLabels,
  selection,
  onChange,
  loadChildren,
  initialLoadedChildren,
  onQueryChange,
  searchPlaceholder = "Search…",
  emptyLabel = "No matches",
  childNoun = { one: "item", many: "items" },
}: {
  groups: TreeParent[];
  sectionLabels?: Record<string, string>;
  selection: TreeSelection;
  onChange: (next: TreeSelection) => void;
  /** Lazily loads a parent's children on first expand. Only invoked for
   *  parents whose `children` array starts empty — parents that already have
   *  children populated in `groups` (e.g. the trade tree) are never
   *  lazy-loaded even when this prop is passed. Ported from Hunter's
   *  OnboardingTreePicker for the States field's city lists. */
  loadChildren?: (parentId: string) => Promise<TreeChild[]>;
  /** Pre-fetched children for lazy parents, keyed by parent id — seeds
   *  `loadedChildren`/`loadStates` so those parents render already-loaded
   *  (no "expand to load" placeholder, no refetch) on first paint. Used by
   *  ServiceArea after attributing legacy city strings onto their state, so
   *  the auto-expanded state shows real city rows immediately. Read once at
   *  mount, like `selection`'s auto-expand seed below. */
  initialLoadedChildren?: Record<string, TreeChild[]>;
  /** Told what she has typed, so a caller can widen the tree to match it.
   *  The PSC picker fetches the codes the SERVER says match and loads their
   *  groups, which is what lets a search find a code inside a branch she has
   *  never opened — this component can only ever filter what it already holds.
   *  Optional: the trades, cert and state trees hold everything up front and
   *  pass nothing. */
  onQueryChange?: (query: string) => void;
  searchPlaceholder?: string;
  emptyLabel?: string;
  /** Noun for level-2 items in the parent detail line. */
  childNoun?: { one: string; many: string };
}) {
  const [q, setQ] = useState("");
  // Auto-expand every parent that already has a selection, so stored picks
  // are visible immediately when the picker opens. Computed once from the
  // initial selection — does not re-run when selection changes later.
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(groups.filter((g) => statusOf(g, selection) !== "none").map((g) => g.id)),
  );
  // Lazily-loaded children, keyed by parent id — merged over the seed
  // group's own children so callers can pass `{ children: [] }` placeholders.
  const [loadedChildren, setLoadedChildren] = useState<Record<string, TreeChild[]>>(
    () => initialLoadedChildren ?? {},
  );
  const [loadStates, setLoadStates] = useState<Record<string, LoadState>>(() =>
    Object.fromEntries(Object.keys(initialLoadedChildren ?? {}).map((id) => [id, "loaded" as const])),
  );
  const needle = q.trim().toLowerCase();

  const { children } = selection;

  // Cascade/tri-state logic must always run against the FULL group — "full"
  // also means lazily-loaded children merged in, so a parent whose children
  // arrived async is scored correctly (mirrors OnboardingTreePicker).
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
    // with children already populated up front (e.g. the trade tree) never
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
  // search query does NOT trigger loadChildren for every lazy parent —
  // that would defeat the purpose of laziness for a large tree (e.g.
  // loading every state's cities on any keystroke).
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
  // DEMO: the set-aside tree appends three "core" groups after the "native_tribal" ones. A section
  // whose groups are not side by side got its header twice, with the same React key. Each section's
  // groups now sit together under one header, in order of first appearance. `sort` is stable.
  const sectionOrder: (string | undefined)[] = [];
  for (const g of visible) if (!sectionOrder.includes(g.section)) sectionOrder.push(g.section);
  const ordered = [...visible].sort((a, b) => sectionOrder.indexOf(a.section) - sectionOrder.indexOf(b.section));
  for (const g of ordered) {
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
    // Childless, non-lazy parents (e.g. a state tree with no loadChildren
    // wired) render as a plain toggle — no chevron, no expand affordance, no
    // detail line. A lazy parent (loadChildren supplied, zero children so
    // far) always gets the expand affordance even before it has loaded.
    const hasChildren = fg.children.length > 0;
    const expandable = hasChildren || lazy;
    rows.push(
      <li
        key={g.id}
        className="wp-trade"
        role="treeitem"
        aria-expanded={expandable ? isExpanded : undefined}
        aria-selected={status !== "none"}
      >
        <div className="wp-trade__row">
          {expandable ? (
            <button
              type="button"
              className={`of-option wp-trade__box-hit${status === "all" ? " of-option--on" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onParentClick(fg);
              }}
              aria-pressed={status !== "none"}
              aria-label={`${status === "none" ? "Select" : "Deselect"} ${g.label}`}
            >
              <span
                className={`of-option__box${status === "all" ? " is-on" : ""}${status === "some" ? " is-mixed" : ""}`}
                aria-hidden
              >
                {status === "all" && <CheckIcon />}
                {status === "some" && <MinusIcon />}
              </span>
            </button>
          ) : null}
          <button
            type="button"
            className={`of-option wp-trade__main${status === "all" ? " of-option--on" : ""}`}
            onClick={() => (expandable ? toggleExpand(fg) : onParentClick(fg))}
            aria-expanded={expandable ? isExpanded : undefined}
            aria-pressed={expandable ? undefined : status !== "none"}
          >
            {!expandable && (
              <span
                className={`of-option__box${status === "all" ? " is-on" : ""}${status === "some" ? " is-mixed" : ""}`}
                aria-hidden
              >
                {status === "all" && <CheckIcon />}
                {status === "some" && <MinusIcon />}
              </span>
            )}
            <span className="of-option__main">
              <span className="of-option__label">
                <span>{g.label}</span>
              </span>
              {expandable && (
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
              )}
            </span>
          </button>
          {expandable && (
            <button
              type="button"
              className="wp-trade__expand"
              onClick={() => toggleExpand(fg)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Hide details" : "Show details"}
            >
              {isExpanded ? "▾" : "▸"}
            </button>
          )}
        </div>
        {expandable && isExpanded && (
          <ul className="wp-codes" role="group">
            {lazy && loadState === "loading" && <li className="of-ms__empty">Loading…</li>}
            {lazy && loadState === "error" && (
              <li className="of-ms__empty">
                Couldn&apos;t load —{" "}
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
                      {on && <CheckIcon />}
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
        <span aria-hidden>🔍</span>
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            onQueryChange?.(e.target.value);
          }}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
        {q && (
          <button
            type="button"
            className="of-ms__clear"
            onClick={() => {
              setQ("");
              onQueryChange?.("");
            }}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
      <ul className="of-ms__list of-ms__list--tall" role="tree">
        {rows.length === 0 ? <li className="of-ms__empty">{emptyLabel}</li> : rows}
      </ul>
    </div>
  );
}

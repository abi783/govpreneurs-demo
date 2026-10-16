"use client";

/**
 * The PSC field's picker — a tree she can open and read, like the trades and
 * set-aside pickers beside it.
 *
 * PSC is how a federal buyer searches for what she sells, and Hunter matches
 * opportunities on these codes, so a wrong one does not fail loudly — the
 * opportunities just never arrive. Every code offered here comes from the
 * published GSA workbook, through Hunter's `psc_taxonomy`.
 *
 * ── WHY A TREE AND NOT ONLY A SEARCH BOX ──────────────────────────────────
 * Because search alone does not find her code. Federal titles are frequently
 * not the words a member would use: a caterer's code is `S203`, titled
 * "HOUSEKEEPING- FOOD", and searching "catering" against the real workbook
 * returns nothing at all. A tree can be BROWSED — she opens "Housekeeping
 * services" and reads what is in it — which is the only way to find a code
 * whose name she would never have typed.
 *
 * ── LOADED IN TWO STEPS, LIKE THE CITIES ──────────────────────────────────
 * 160 groups arrive up front; a group's codes arrive when she opens it
 * (`TreePicker`'s `loadChildren`, the same seam `loadCityChildren` fills). The
 * whole taxonomy is 2,344 codes and is not a list to ship on first paint.
 *
 * ── THREE WAYS IN, AND THE THIRD IS NOT A FALLBACK ────────────────────────
 * Browse the tree, search it, or type a code she has already been given. The
 * last matters because the taxonomy is seeded separately: where it is empty the
 * tree and the search are both silent, and refusing a real code because our own
 * collection has not loaded would lock the field for everyone.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import type { MbControlProps } from "./mbControls";
import { TreePicker } from "./TreePicker";
import { CONTROL_BUTTON as btn } from "./controlStyles";
import type { Code } from "@sc/lib/businessProfile/mbValue";
import { CODE_FORMAT, CODE_SHAPE_SAID } from "@sc/lib/businessProfile/mbValue";
import { childId, type TreeChild, type TreeParent, type TreeSelection } from "@sc/lib/businessProfile/treeSelection";
import {
  describePscFromCache,
  ensurePscDescriptions,
  loadPscGroupCodes,
  loadPscGroups,
  placementOf,
  searchPsc,
  type PscGroup,
  type PscSearchResult,
} from "@sc/lib/businessProfile/pscDescriptions";

/** Long enough that typing a word does not fire a request per keystroke. */
const SEARCH_DEBOUNCE_MS = 200;

/** The tree's empty state, and it says what KIND of nothing this is. "No
 *  matches" would imply she has no code; the truth is that federal titles are
 *  often not the words she would use, and there is another door. */
const NOTHING_FOUND =
  "Nothing matches those words — and federal titles often are not the words you would " +
  "use. Try a plainer one, or add a code you have already been given.";

/** What a group with no category of its own is filed under. Its own heading
 *  rather than silently joining another category's. */
const UNFILED = "Everything else";

/**
 * A group's codes as tree rows. The code is the chip; the official title is the
 * label, because that is what a buyer searches by.
 *
 * `matched` carries the queries the SERVER found this code under, folded into
 * the row's keywords. Without it the tree's own filter — which reads only the
 * label and the code — would load a hit and then hide it again: the server also
 * matches the workbook's long name, its examples and its category, so
 * "cafeteria" finds S203 whose title is HOUSEKEEPING- FOOD.
 */
function childrenOf(
  group: string,
  codes: PscSearchResult[],
  matched: Record<string, string> = {},
): TreeChild[] {
  return codes.map((row) => ({
    id: childId(group, row.code),
    label: row.description,
    code: row.code,
    keywords: `${row.code} ${matched[row.code] ?? ""}`.trim(),
  }));
}

/** The code out of a namespaced child id — `"S2::S203"` → `"S203"`. */
function codeOf(id: string): string {
  const at = id.indexOf("::");
  return at < 0 ? id : id.slice(at + 2);
}

export function PscPicker({ initial, onSave, saving }: MbControlProps): ReactElement {
  const held: Code[] = useMemo(() => (Array.isArray(initial) ? (initial as Code[]) : []), [initial]);

  /** Her chosen codes, keyed by code. THE SOURCE OF TRUTH — the tree's
   *  selection is derived from it, never the other way round, because a code
   *  can also arrive from the search or from the "already have" box. */
  const [chosen, setChosen] = useState<Map<string, Code>>(
    () => new Map(held.map((c) => [c.code, c])),
  );
  /** Which group each known code sits in, so a stored code can be shown ticked
   *  in the tree rather than only as a chip. */
  const [groupOfCode, setGroupOfCode] = useState<Record<string, string>>({});
  const [groups, setGroups] = useState<PscGroup[]>([]);
  const [loaded, setLoaded] = useState<Record<string, PscSearchResult[]>>({});
  /** Query text each matched code was found under, folded into its keywords so
   *  the tree's stricter filter cannot hide a hit the server found. */
  const [matched, setMatched] = useState<Record<string, string>>({});

  // The top level, once.
  useEffect(() => {
    let cancelled = false;
    loadPscGroups().then((rows) => {
      if (!cancelled) setGroups(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Where her stored codes live, and what they are called. Both come off the
  // descriptions endpoint, so a code saved before the taxonomy existed stops
  // reading as a bare code AND lands ticked in the right branch.
  useEffect(() => {
    const codes = held.map((c) => c.code);
    if (codes.length === 0) return;
    let cancelled = false;
    void ensurePscDescriptions(codes);
    placementOf(codes).then((placed) => {
      if (!cancelled) setGroupOfCode((current) => ({ ...current, ...placed }));
    });
    return () => {
      cancelled = true;
    };
  }, [held]);

  const remember = useCallback((group: string, rows: PscSearchResult[]) => {
    setLoaded((current) => ({ ...current, [group]: rows }));
    setGroupOfCode((current) => {
      const next = { ...current };
      for (const row of rows) next[row.code] = row.groupCode;
      return next;
    });
  }, []);

  const loadChildren = useCallback(
    async (groupCode: string): Promise<TreeChild[]> => {
      const rows = await loadPscGroupCodes(groupCode);
      remember(groupCode, rows);
      return childrenOf(groupCode, rows);
    },
    [remember],
  );

  const tree: TreeParent[] = useMemo(
    () =>
      groups.map((g) => ({
        id: g.groupCode,
        label: g.groupTitle,
        // The workbook's own Level 1 Category, not the three-way
        // product/service/R&D split: eighteen headings over 160 groups is what
        // makes the top level readable, where three left one long flat list.
        section: g.category || UNFILED,
        // ONLY while the branch is shut. Once its codes are loaded `TreePicker`
        // counts them itself, and supplying ours as well printed the same fact
        // twice — the row read "6 codes · 6 codes".
        detail: loaded[g.groupCode] ? undefined : `${g.count} ${g.count === 1 ? "code" : "codes"}`,
        keywords: g.groupCode,
        children: childrenOf(g.groupCode, loaded[g.groupCode] ?? [], matched),
      })),
    [groups, loaded, matched],
  );

  const seededChildren = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(loaded).map(([group, rows]) => [group, childrenOf(group, rows, matched)]),
      ),
    [loaded, matched],
  );

  /** The tree's view of what she has chosen. Only codes whose group we know can
   *  be shown ticked; the rest are still on the record, and still in the chips
   *  below, which is where they are removable. */
  const selection: TreeSelection = useMemo(() => {
    const children: string[] = [];
    for (const code of chosen.keys()) {
      const group = groupOfCode[code];
      if (group) children.push(childId(group, code));
    }
    return { parents: [], children };
  }, [chosen, groupOfCode]);

  const add = useCallback((code: string, label: string) => {
    setChosen((current) => {
      if (current.has(code)) return current;
      const next = new Map(current);
      next.set(code, { system: "PSC", code, label });
      return next;
    });
  }, []);

  const drop = useCallback((code: string) => {
    setChosen((current) => {
      if (!current.has(code)) return current;
      const next = new Map(current);
      next.delete(code);
      return next;
    });
  }, []);

  /**
   * A click in the tree, resolved against what she had. Ticks and unticks are
   * both derived from the child ids, so a whole-group tick — which arrives as
   * every child at once — needs no case of its own.
   */
  const onTreeChange = useCallback(
    (next: TreeSelection) => {
      const wanted = new Set(next.children.map(codeOf));
      // Only codes the tree can currently SEE are eligible to be dropped: a
      // stored code whose group has not loaded is not absent, it is unseen, and
      // removing it because a branch is shut would be silent data loss.
      // One pass over what is loaded, serving both the "visible" test and the
      // description lookup. Finding each description by re-flattening every
      // loaded group made ticking a 100-code group quadratic in what was open.
      const byCode = new Map<string, string>();
      for (const rows of Object.values(loaded)) {
        for (const row of rows) byCode.set(row.code, row.description);
      }
      setChosen((current) => {
        const merged = new Map(current);
        for (const code of byCode.keys()) if (!wanted.has(code)) merged.delete(code);
        for (const code of wanted) {
          if (merged.has(code)) continue;
          merged.set(code, { system: "PSC", code, label: byCode.get(code) ?? "" });
        }
        return merged;
      });
      // A group ticked while shut has no children to read yet; load it so her
      // click lands rather than doing nothing she can see.
      for (const group of next.parents) if (!loaded[group]) void loadChildren(group);
    },
    [loaded, loadChildren],
  );

  /* ── search, the second way in ──────────────────────────────────────── */

  /* ── search, one level deeper than the tree can see ─────────────────
     `TreePicker` can only filter what it holds, and it holds a group's codes
     only once that group has been opened. So a search for "food" found the
     group titled FOOD PREPARATION/SERVING EQPT and missed S203 entirely, which
     sits under HOUSEKEEPING SERVICES — a title with no "food" in it. The server
     knows better, so her query goes there too, and the groups it names get
     loaded; the tree's own filter then narrows them to the matching rows. */

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const latest = useRef(0);

  const onQueryChange = useCallback((nextQuery: string) => {
    setQuery(nextQuery);
    if (!nextQuery.trim()) {
      latest.current += 1;
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const timer = setTimeout(() => {
      const seq = ++latest.current;
      setSearching(true);
      searchPsc(q)
        .then(async (rows) => {
          if (seq !== latest.current) return;
          // `groupOfCode` is NOT written here: `loadChildren` below fetches
          // each hit's whole group and `remember` records the placement of
          // every code in it, hits included. Writing it here first only added a
          // third writer to one derived map.
          setMatched((current) => {
            const merged = { ...current };
            for (const row of rows) {
              merged[row.code] = `${merged[row.code] ?? ""} ${q}`.trim();
            }
            return merged;
          });
          // Load each group a hit lives in — WHOLE, not just the hit. A group
          // holding one injected child would look loaded to `TreePicker`, which
          // decides laziness by "has no children yet", and opening it would
          // then show that one code forever.
          const wanted = [...new Set(rows.map((row) => row.groupCode))];
          await Promise.all(wanted.map((group) => loadChildren(group)));
        })
        .finally(() => {
          if (seq === latest.current) setSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, loadChildren]);

  const picked = [...chosen.values()];

  return (
    <div>
      <TreePicker
        groups={tree}
        selection={selection}
        onChange={onTreeChange}
        loadChildren={loadChildren}
        initialLoadedChildren={seededChildren}
        onQueryChange={onQueryChange}
        searchPlaceholder="Search a group or a code — housekeeping, catering, guard…"
        emptyLabel={NOTHING_FOUND}
        childNoun={{ one: "code", many: "codes" }}
      />

      {searching && <div className="wsw-adhoc-loading">Searching every code…</div>}

      <KnownCode onAdd={add} already={picked} />

      {picked.length > 0 && (
        <div className="mt-2">
          <div className="wsw-adhoc-label">On your profile</div>
          <div className="wsw-selected">
            {picked.map((c) => (
              <span key={c.code} className="wsw-tag" onClick={() => drop(c.code)}>
                {labelFor(c) ? `${labelFor(c)} ` : ""}
                {c.code} ×
              </span>
            ))}
          </div>
        </div>
      )}

      <button className={`${btn} mt-2`} disabled={saving || picked.length === 0} onClick={() => onSave(picked)}>
        Save
      </button>
    </div>
  );
}

/** What a saved code shows before its title has been fetched. */
function labelFor(code: Code): string {
  return code.label.trim() || describePscFromCache(code.code) || "";
}

/**
 * The third door: a code she has already been given, by a contracting officer
 * or off a past solicitation. It is checked against the SAME shape rule the
 * server parses with, so the picker cannot accept something the PUT will
 * refuse, and it is looked up so she sees the official title before she saves —
 * but an unrecognised code is still added. The taxonomy is seeded separately,
 * and refusing a real code because our own collection has not been loaded would
 * lock the field for everyone.
 */
function KnownCode({
  onAdd,
  already,
}: {
  onAdd: (code: string, label: string) => void;
  already: Code[];
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  async function add() {
    const code = value.trim().toUpperCase();
    if (!CODE_FORMAT.PSC.test(code)) {
      setProblem(CODE_SHAPE_SAID.PSC);
      return;
    }
    if (already.some((c) => c.code === code)) {
      setProblem("That code is already on your profile.");
      return;
    }
    await ensurePscDescriptions([code]);
    onAdd(code, describePscFromCache(code) ?? "");
    setValue("");
    setProblem(null);
  }

  if (!open) {
    return (
      <div className="wsw-adhoc">
        <button type="button" className="wsw-adhoc-toggle" onClick={() => setOpen(true)}>
          Add a code you already have
        </button>
      </div>
    );
  }

  return (
    <div className="wsw-adhoc">
      <div className="wsw-adhoc-panel">
        <label className="wsw-adhoc-label" htmlFor="psc-known-input">
          A code you have been given
        </label>
        <div className="flex gap-2">
          <input
            id="psc-known-input"
            className="wsw-input"
            placeholder="S203"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setProblem(null);
            }}
          />
          <button type="button" className={btn} disabled={!value.trim()} onClick={add}>
            Add
          </button>
        </div>
        {problem && <p className="mt-1 text-xs text-gray-700">{problem}</p>}
      </div>
    </div>
  );
}

// Tree data + selection mapping for the Business Profile TreePicker (trades,
// states, certs) — rebuilt to match Hunter's warm-start wizard structure
// 1:1 (frontend-v2 `src/lib/onboardingTrees.ts` + `warmStartMapping.ts`):
//
//   Trades: parents = the 111 WORK_TYPES trades (+ "Something else"),
//     children = each trade's NAICS codes, grouped under the 10
//     WORK_SECTIONS headers. Emits `{ categories, naics }` — SAME SHAPE as
//     before this rebuild (categories = trade ids, naics = NAICS codes), so
//     ProfileField rows, writeBack.ts, and the Hunter preview-answers webhook
//     need no changes.
//   States: flat state parents, LAZY city children (loaded via
//     /api/hunter/cities on first expand, cached per state). Emits
//     `{ states, cities, rung }` — unchanged shape.
//   Certs: parents = the SET_ASIDE_CATEGORIES cert categories, children =
//     their SAM set-aside codes. Emits `string[]` of SC's CERT_OPTIONS slugs
//     — unchanged shape (registry.ts, writeBack.ts untouched).
//
// The member never sees a NAICS/SAM code as anything but information — no
// field here implies a filing or a claim.

import { TRADES } from "./registry";
import { WORK_SECTIONS, sectionOf } from "./workSections";
import { WORK_TYPE_TO_NAICS } from "./workTypeTaxonomy";
import { childId, type TreeChild, type TreeParent, type TreeSelection } from "./treeSelection";
import {
  SET_ASIDE_CATEGORIES,
  SET_ASIDE_CATEGORY_TO_SC_SLUG,
  SET_ASIDE_SECTION_LABEL,
  type SetAsideCategory,
} from "./setAsideTaxonomy";

const SOMETHING_ELSE_ID = "other";
const SOMETHING_ELSE_SECTION = "Something else" as const;

// ─────────────────────────────────────────────────────────────────────────
// Trades: 111 work-type parents -> their NAICS children, sectioned
// ─────────────────────────────────────────────────────────────────────────

/** NAICS description resolver — defaults to "NAICS <code>" (no synchronous
 *  catalog exists in this repo, unlike Hunter's ~24-entry NAICS_BY_CODE
 *  fallback); callers pass a richer resolver backed by the module-level
 *  description cache (see naicsDescriptions.ts) once fetched. */
export function buildTradeTree(
  describeNaics: (code: string) => string | undefined = () => undefined,
): TreeParent[] {
  const parents: TreeParent[] = TRADES.filter((t) => t.value !== SOMETHING_ELSE_ID).map((t) => {
    const codes = WORK_TYPE_TO_NAICS[t.value] ?? [];
    const children: TreeChild[] = codes.map((code) => {
      const desc = describeNaics(code);
      return {
        id: childId(t.value, code),
        label: desc ?? `NAICS ${code}`,
        code: desc ? code : undefined,
        keywords: code,
      };
    });
    return {
      id: t.value,
      label: t.label,
      section: sectionOf(t.value),
      keywords: codes.join(" "),
      children,
    };
  });

  parents.push({
    id: SOMETHING_ELSE_ID,
    label: "Something else",
    section: SOMETHING_ELSE_SECTION,
    children: [],
  });

  return parents.sort((a, b) => {
    if (a.id === SOMETHING_ELSE_ID) return 1;
    if (b.id === SOMETHING_ELSE_ID) return -1;
    const sectionDiff =
      WORK_SECTIONS.indexOf(a.section as (typeof WORK_SECTIONS)[number]) -
      WORK_SECTIONS.indexOf(b.section as (typeof WORK_SECTIONS)[number]);
    if (sectionDiff !== 0) return sectionDiff;
    return a.label.localeCompare(b.label);
  });
}

/** Precomputed trade tree with no NAICS descriptions (labels fall back to
 *  "NAICS <code>") — for callers (tests, simple usages) that don't need the
 *  async-fetched description cache. TradePicker calls `buildTradeTree(resolver)`
 *  directly with the richer one. */
export const TRADE_TREE: TreeParent[] = buildTradeTree();

/** Identity map of the 10 work-section ids (+ "Something else") to their
 *  display labels — passed as `sectionLabels` to the picker. */
export const TRADE_SECTION_LABELS: Record<string, string> = Object.fromEntries([
  ...WORK_SECTIONS.map((s) => [s, s] as const),
  [SOMETHING_ELSE_SECTION, SOMETHING_ELSE_SECTION] as const,
]);

/** Stored `categories` (flat work-type ids, incl. "other") + `naics` ->
 *  TreeSelection. A trade whose full NAICS set is present in stored naics
 *  becomes a selected parent; a partial intersection becomes selected
 *  children; a trade recorded with none of its codes present (or "other",
 *  which has no NAICS) is skipped unless it's literally "other". Leftover
 *  stored NAICS codes belonging to no stored trade become escape-hatch
 *  ad-hoc codes (returned separately — see `TradeSelectionResult`). */
export interface TradeSelectionResult {
  selection: TreeSelection;
  adhocNaics: string[];
}

export function selectionFromCategories(categories: string[], naics: string[] = []): TradeSelectionResult {
  const storedNaics = new Set(naics);
  const parents: string[] = [];
  const children: string[] = [];
  const consumed = new Set<string>();

  for (const tradeId of categories) {
    if (tradeId === SOMETHING_ELSE_ID) {
      parents.push(SOMETHING_ELSE_ID);
      continue;
    }
    const fullCodes = WORK_TYPE_TO_NAICS[tradeId] ?? [];
    if (fullCodes.length === 0) continue;
    const present = fullCodes.filter((c) => storedNaics.has(c));
    if (present.length === 0) {
      // Trade recorded but none of its codes are in stored naics (e.g. an
      // older row saved before naics exist) — still honor the trade pick.
      parents.push(tradeId);
      continue;
    }
    if (present.length === fullCodes.length) {
      parents.push(tradeId);
    } else {
      for (const c of present) children.push(childId(tradeId, c));
    }
    for (const c of present) consumed.add(c);
  }

  const adhocNaics = [...storedNaics].filter((c) => !consumed.has(c));

  return { selection: { parents, children }, adhocNaics };
}

/** TreeSelection (+ escape-hatch codes) -> `{categories, naics}` — mirrors
 *  Hunter's warmStartMapping `effectiveNaicsFrom`/`tradeIdsFrom`: categories
 *  = trades with any selection (parent or child) plus "other"; naics = union
 *  of (fully-selected parents' full code lists) + (individually selected
 *  child codes) + escape-hatch picks. */
export function categoriesFromSelection(
  selection: TreeSelection,
  adhocNaics: string[] = [],
): { categories: string[]; naics: string[] } {
  const categories = new Set<string>(selection.parents);
  const naics = new Set<string>();

  for (const tradeId of selection.parents) {
    if (tradeId === SOMETHING_ELSE_ID) continue;
    for (const code of WORK_TYPE_TO_NAICS[tradeId] ?? []) naics.add(code);
  }

  const childCodesByTrade = new Map<string, string[]>();
  for (const cid of selection.children) {
    const sep = cid.indexOf("::");
    if (sep === -1) continue;
    const tradeId = cid.slice(0, sep);
    const code = cid.slice(sep + 2);
    if (selection.parents.includes(tradeId)) continue; // already "all" above
    categories.add(tradeId);
    const list = childCodesByTrade.get(tradeId) ?? [];
    list.push(code);
    childCodesByTrade.set(tradeId, list);
  }
  for (const codes of childCodesByTrade.values()) for (const c of codes) naics.add(c);
  for (const c of adhocNaics) naics.add(c);

  return { categories: [...categories], naics: [...naics] };
}

// ─────────────────────────────────────────────────────────────────────────
// States: flat parents, LAZY city children (loaded via /api/hunter/cities)
// ─────────────────────────────────────────────────────────────────────────

const STATE_NAMES: [string, string][] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"],
  ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
  ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
  ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
  ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
  ["WI", "Wisconsin"], ["WY", "Wyoming"], ["DC", "District of Columbia"],
];

export const US_STATE_NAMES: Record<string, string> = Object.fromEntries(STATE_NAMES);

/** 51 state parents, sorted by full name, `children` always empty — cities
 *  are lazy (ServiceArea wires `loadChildren` to /api/hunter/cities). */
export const STATE_TREE: TreeParent[] = STATE_NAMES.map(([code, name]) => ({
  id: code,
  label: name,
  detail: code,
  keywords: `${name} ${code}`,
  children: [] as TreeChild[],
})).sort((a, b) => a.label.localeCompare(b.label));

/** Converts a Hunter `/api/hunter/cities` state group's `{city, count}` rows
 *  into namespaced `TreeChild[]` for one state. Ids/labels are bare city
 *  names (e.g. "Houston"), matching the CITY-ID CONTRACT (never "City, ST"). */
export function cityChildrenOf(state: string, rows: { city: string; count?: number }[]): TreeChild[] {
  return rows.map((row) => ({ id: childId(state, row.city), label: row.city }));
}

/** Stored `states` (whole-state picks) + `cities` (bare names, unattributed
 *  to a state — see save-side note below) -> TreeSelection. Cities can't be
 *  reliably mapped back onto a specific state parent from a flat name list,
 *  so hydration keeps them as free-text chips (existing behavior) rather
 *  than tree children — the caller (ServiceArea) renders them separately. */
export function selectionFromStates(states: string[]): TreeSelection {
  const valid = new Set(STATE_TREE.map((s) => s.id));
  return { parents: states.filter((s) => valid.has(s)), children: [] };
}

/** `states` = selected state parents ∪ states with any selected city child.
 *  `cities` side (tree-selected city names ∪ free-text chips, deduped
 *  case-insensitively) is computed by the caller (ServiceArea) since it also
 *  owns the free-text input — see `mergeCities` below. */
export function statesFromSelection(selection: TreeSelection): string[] {
  const set = new Set<string>(selection.parents);
  for (const cid of selection.children) {
    const sep = cid.indexOf("::");
    if (sep !== -1) set.add(cid.slice(0, sep));
  }
  return [...set];
}

/** Result of attributing legacy free-text `cities` strings onto the states
 *  tree at hydration time (see `attributeLegacyCities`). */
export interface CityAttributionResult {
  /** Selection with matched cities added as tree children (namespaced under
   *  their attributed state) on top of the whole-state parents from `states`. */
  selection: TreeSelection;
  /** Hunter's canonical-casing city rows per state that had >=1 match — feed
   *  straight into TreePicker's `initialLoadedChildren` so those states
   *  render already-expanded with real children instead of "expand to load". */
  loadedByState: Record<string, TreeChild[]>;
  /** Stored strings that matched no city in any of their stored state's
   *  Hunter list — stay as free-text chips. */
  unmatched: string[];
}

/** Case-insensitively matches legacy free-text `cities` strings against each
 *  stored state's Hunter city list, producing tree-selected children with
 *  Hunter's canonical casing. A city stored under 2+ states (ambiguous) is
 *  attributed to the first state in `states` order that contains it. Matching
 *  is scoped to the member's OWN stored states (not a global city search) —
 *  `citiesByState` is expected to only have entries for those states, fetched
 *  by the caller via `loadCityChildren`. Pure — no fetching here. */
export function attributeLegacyCities(
  states: string[],
  cities: string[],
  citiesByState: Record<string, TreeChild[]>,
): CityAttributionResult {
  const children: string[] = [];
  const loadedByState: Record<string, TreeChild[]> = {};
  const unmatched: string[] = [];

  for (const raw of cities) {
    const needle = raw.trim().toLowerCase();
    if (!needle) continue;
    const state = states.find((s) =>
      (citiesByState[s] ?? []).some((c) => c.label.toLowerCase() === needle),
    );
    if (!state) {
      unmatched.push(raw);
      continue;
    }
    const match = citiesByState[state]!.find((c) => c.label.toLowerCase() === needle)!;
    children.push(childId(state, match.label));
    if (!loadedByState[state]) loadedByState[state] = citiesByState[state]!;
  }

  return { selection: { parents: [...states], children }, loadedByState, unmatched };
}

/** Tree-selected city names (state parent already covers its own cities, so
 *  only children under a NOT-fully-selected state count) ∪ free-text chips,
 *  deduped case-insensitively (first-seen casing wins). */
export function mergeCities(selection: TreeSelection, freeText: string[]): string[] {
  const treeCities: string[] = [];
  for (const cid of selection.children) {
    const sep = cid.indexOf("::");
    if (sep === -1) continue;
    const state = cid.slice(0, sep);
    if (selection.parents.includes(state)) continue; // whole-state already covers it
    treeCities.push(cid.slice(sep + 2));
  }
  const seen = new Map<string, string>(); // lowercase -> first-seen casing
  for (const c of [...treeCities, ...freeText]) {
    const key = c.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.set(key, c.trim());
  }
  return [...seen.values()];
}

// ─────────────────────────────────────────────────────────────────────────
// Certs: SET_ASIDE_CATEGORIES tree -> SC's CERT_OPTIONS slugs
// ─────────────────────────────────────────────────────────────────────────

/**
 * The three the record could store and the picker could not offer.
 *
 * `CERT_OPTIONS` in `registry.ts` has eleven slugs; the set-aside taxonomy
 * reaches six of them. `minority`, `sdb` and `dobe` were answerable on the
 * `/intake` form and unreachable here, so the two surfaces disagreed about what
 * this question even asks.
 *
 * DECLARED HERE, NOT IN `setAsideTaxonomy.ts`, because that file is ported
 * VERBATIM from Hunter and its header says so — a category added there is
 * cross-repo drift. These are Success Center's own, appended to the tree it
 * builds, and each maps ONE-TO-ONE to its slug so it reads back as itself.
 *
 * No SAM codes under them: these are ownership descriptions rather than
 * set-aside programmes, so there is nothing to expand into. `TreePicker`
 * renders a parent with no children as a plain checkbox.
 */
const SC_ONLY_CERT_CATEGORIES: TreeParent[] = [
  { id: "minority", label: "Minority-owned", section: "core", children: [] },
  { id: "sdb", label: "Small disadvantaged business (SDB)", section: "core", children: [] },
  { id: "dobe", label: "Disability-owned (DOBE)", section: "core", children: [] },
];

/**
 * Categories the tree COLLAPSES, and why the record is the reason.
 *
 * Hunter's `set-aside-canonical.ts` — its own "single source of truth" — has
 * nine canonical values, and two of them each cover several of this taxonomy's
 * categories: `small_biz` takes SBA/SBP/ESB/LAS, and `native_tribal` takes
 * BICIV/IEE/ISBEE. The record stores one slug per answer, so offering the parts
 * separately would be offering distinctions it cannot keep.
 *
 * IT IS THE HYDRATION THAT FORCES THIS, not tidiness. `selectionFromCertSlugs`
 * reverse-looks-up slug to category. Five categories pointing at
 * `native_tribal` would store correctly and read back as all five ticked — a
 * many-to-one map cannot round-trip through a reverse lookup. One category per
 * slug is what makes the answer survive being read again.
 *
 * The codes are kept as CHILDREN, so nothing is lost: a member who knows she is
 * an Indian Small Business Economic Enterprise still finds those words, one
 * level down, under the category that stores her answer.
 */
const COLLAPSED_CERT_CATEGORIES: { id: string; label: string; section: "core" | "native_tribal"; absorbs: string[] }[] = [
  {
    id: "small_biz",
    label: "Small business",
    section: "core",
    absorbs: ["small_business", "partial_sb"],
  },
  {
    id: "native_tribal",
    label: "Native American or tribally owned",
    section: "native_tribal",
    absorbs: ["iee", "isbee", "buy_indian", "alaska_native", "tribally_owned"],
  },
];

/** Every category id that some collapsed parent has taken over. */
const ABSORBED = new Set(COLLAPSED_CERT_CATEGORIES.flatMap((c) => c.absorbs));

/** One parent, carrying the codes of every category it absorbed. */
function collapsedParent(spec: (typeof COLLAPSED_CERT_CATEGORIES)[number]): TreeParent {
  const codes = SET_ASIDE_CATEGORIES.filter((cat) => spec.absorbs.includes(cat.id)).flatMap(
    (cat) => cat.codes,
  );
  return {
    id: spec.id,
    label: spec.label,
    section: spec.section,
    children: codes.map((code) => ({
      id: childId(spec.id, code.code),
      label: code.label,
      code: code.code,
      detail: code.kind === "sole_source" ? "Sole-Source" : "Set-Aside",
    })),
  };
}

export const CERT_TREE: TreeParent[] = [
  ...SET_ASIDE_CATEGORIES.filter((cat) => !ABSORBED.has(cat.id)).map((cat: SetAsideCategory) => ({
    id: cat.id,
    label: cat.label,
    section: cat.section,
    children: cat.codes.map((code) => ({
      id: childId(cat.id, code.code),
      label: code.label,
      code: code.code,
      detail: code.kind === "sole_source" ? "Sole-Source" : "Set-Aside",
    })),
  })),
  ...COLLAPSED_CERT_CATEGORIES.map(collapsedParent),
  ...SC_ONLY_CERT_CATEGORIES,
];

export const CERT_SECTION_LABELS: Record<string, string> = SET_ASIDE_SECTION_LABEL;

/** Stored SC cert slugs -> TreeSelection: a slug selects its mapped
 *  category's parent (whole category — SC persists at category granularity,
 *  never individual SAM codes, so there is no partial/"some" hydration case
 *  for certs, unlike trades/states). Slugs with no category mapping (or the
 *  `none`/`not_sure` exclusives) are ignored here — the exclusives are
 *  handled by the caller (CertPicker) as a separate two-button control. */
export function selectionFromCertSlugs(slugs: string[]): TreeSelection {
  const stored = new Set(slugs);
  const parents = Object.entries(SET_ASIDE_CATEGORY_TO_SC_SLUG)
    .filter(([, slug]) => stored.has(slug))
    .map(([categoryId]) => categoryId);
  return { parents, children: [] };
}

/** TreeSelection -> SC cert slugs: each touched category (parent selected OR
 *  any child selected) maps to its SC slug via SET_ASIDE_CATEGORY_TO_SC_SLUG;
 *  categories with no SC slug are silently omitted (see that map's comment
 *  for the omitted list and why). */
export function certSlugsFromSelection(selection: TreeSelection): string[] {
  const touchedCategories = new Set<string>(selection.parents);
  for (const cid of selection.children) {
    const sep = cid.indexOf("::");
    if (sep !== -1) touchedCategories.add(cid.slice(0, sep));
  }
  const slugs = new Set<string>();
  for (const categoryId of touchedCategories) {
    const slug = SET_ASIDE_CATEGORY_TO_SC_SLUG[categoryId];
    if (slug) slugs.add(slug);
  }
  return [...slugs];
}

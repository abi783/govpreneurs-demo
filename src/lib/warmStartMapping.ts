// Pure finish-mapping logic for the WarmStartWizard (COLD_START_PLAN.md §5).
// Converts the wizard's three `TreeSelection`s (+ service-area rung + ad-hoc
// NAICS escape-hatch codes) into the `PreviewAnswers` payload the backend
// stores, and inverts that mapping to rehydrate the wizard from a
// previously-stored blob. Kept dependency-free of React so it is trivially
// unit-testable (see warmStartMapping.test.ts).

import { childId, type TreeSelection } from "./treeSelection";
import { WORK_TYPE_TO_NAICS } from "./vocab/trades";
import { US_STATE_NEIGHBORS } from "./usStateNeighbors";
import {
  SET_ASIDE_CATEGORIES,
  SET_ASIDE_CATEGORY_TO_FILTER,
  type SetAsideCategory,
} from "./setAsideTaxonomy";
import type { PreviewAnswers } from "./preview";

export type ServiceArea = "metro" | "nearby" | "state" | "state_plus_neighbors" | "national";

export const EMPTY_TREE_SELECTION: TreeSelection = { parents: [], children: [] };

export interface BuildPreviewAnswersInput {
  /** Step 1 — work-type tree selection (parents = trade ids, children = `tradeId::naicsCode`). */
  workSel: TreeSelection;
  /** Step 2 — state/city tree selection (parents = state codes, children = `stateCode::city`). */
  locSel: TreeSelection;
  /** Step 3 — set-aside tree selection (parents = category ids, children = `categoryId::samCode`). */
  saSel: TreeSelection;
  /** Service-area rung chosen in step 2. */
  serviceArea: ServiceArea;
  /** Ad-hoc NAICS codes appended via the step-1 "search all NAICS codes" escape hatch. */
  adhocNaics?: string[];
}

/** Synthetic parent id for the step-1 NAICS escape-hatch ("Other codes"). */
export const ADHOC_NAICS_PARENT_ID = "__adhoc";

// ─────────────────────────────────────────────────────────────────────────────
// §5.1 — Effective NAICS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * For each selected trade: child picks if any (status "some"), else the
 * trade's full NAICS list (status "all"). Union + dedupe across trades, then
 * append ad-hoc escape-hatch codes (deduped against the result).
 */
export function effectiveNaicsFrom(workSel: TreeSelection, adhocNaics: string[] = []): string[] {
  const out = new Set<string>();
  for (const tradeId of workSel.parents) {
    for (const code of WORK_TYPE_TO_NAICS[tradeId] ?? []) out.add(code);
  }
  // Group child picks (`tradeId::code`) by trade so a trade with only some
  // codes picked contributes exactly those, not the full list.
  const childCodesByTrade = new Map<string, string[]>();
  for (const cid of workSel.children) {
    const sep = cid.indexOf("::");
    if (sep === -1) continue;
    const tradeId = cid.slice(0, sep);
    const code = cid.slice(sep + 2);
    if (workSel.parents.includes(tradeId)) continue; // already "all" above
    const list = childCodesByTrade.get(tradeId) ?? [];
    list.push(code);
    childCodesByTrade.set(tradeId, list);
  }
  for (const codes of childCodesByTrade.values()) for (const c of codes) out.add(c);
  for (const c of adhocNaics) out.add(c);
  return [...out];
}

// ─────────────────────────────────────────────────────────────────────────────
// §5.2 — States expansion
// ─────────────────────────────────────────────────────────────────────────────

/** Every state code present in a location selection (whole-state parents ∪ states of city picks). */
export function stateCodesFrom(locSel: TreeSelection): string[] {
  const set = new Set<string>(locSel.parents);
  for (const cid of locSel.children) {
    const sep = cid.indexOf("::");
    if (sep === -1) continue;
    set.add(cid.slice(0, sep));
  }
  return [...set];
}

/**
 * `national` → [] (no state gate); `state_plus_neighbors` → selected ∪ full
 * US adjacency; `metro | nearby | state` → selected as-is (rungs don't
 * narrow the preview query yet — see COLD_START_PLAN.md §4.5).
 */
export function statesFromSelection(selectedStateCodes: string[], rung: ServiceArea): string[] {
  if (rung === "national") return [];
  if (rung === "state_plus_neighbors") {
    const out = new Set<string>(selectedStateCodes);
    for (const s of selectedStateCodes) {
      for (const n of US_STATE_NEIGHBORS[s] ?? []) out.add(n);
    }
    return [...out];
  }
  return [...selectedStateCodes];
}

// ─────────────────────────────────────────────────────────────────────────────
// §5.3 — Cities
// ─────────────────────────────────────────────────────────────────────────────

/** Explicit city picks → `{ city, state }` (bare city names). Whole-state parents contribute none. */
export function citiesFrom(locSel: TreeSelection): { city: string; state: string }[] {
  const out: { city: string; state: string }[] = [];
  for (const cid of locSel.children) {
    const sep = cid.indexOf("::");
    if (sep === -1) continue;
    const state = cid.slice(0, sep);
    const city = cid.slice(sep + 2);
    if (locSel.parents.includes(state)) continue; // whole-state already covers it
    out.push({ city, state });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// §5.4 — Set-asides
// ─────────────────────────────────────────────────────────────────────────────

/** Category picks (whole or partial) → union of `SET_ASIDE_CATEGORY_TO_FILTER` tokens. */
export function setAsideFilterTokensFrom(saSel: TreeSelection): string[] {
  const categoryIds = new Set<string>(saSel.parents);
  for (const cid of saSel.children) {
    const sep = cid.indexOf("::");
    if (sep !== -1) categoryIds.add(cid.slice(0, sep));
  }
  const out = new Set<string>();
  for (const id of categoryIds)
    for (const token of SET_ASIDE_CATEGORY_TO_FILTER[id] ?? []) out.add(token);
  return [...out];
}

/**
 * Precise SAM codes: a category selected "all" contributes every one of its
 * codes; a partially-selected category contributes exactly its picked codes.
 */
export function setAsideCodesFrom(saSel: TreeSelection): string[] {
  const out = new Set<string>();
  const byCategory = new Map<string, SetAsideCategory>(SET_ASIDE_CATEGORIES.map((c) => [c.id, c]));
  for (const parentId of saSel.parents) {
    const cat = byCategory.get(parentId);
    if (!cat) continue;
    for (const code of cat.codes) out.add(code.code);
  }
  for (const cid of saSel.children) {
    const sep = cid.indexOf("::");
    if (sep === -1) continue;
    const categoryId = cid.slice(0, sep);
    if (saSel.parents.includes(categoryId)) continue; // already "all" above
    out.add(cid.slice(sep + 2));
  }
  return [...out];
}

// ─────────────────────────────────────────────────────────────────────────────
// Trade ids (persisted verbatim as `trades`)
// ─────────────────────────────────────────────────────────────────────────────

/** Trades touched by the selection: whole-parent picks ∪ parents of any picked child. */
export function tradeIdsFrom(workSel: TreeSelection): string[] {
  const set = new Set<string>(workSel.parents);
  for (const cid of workSel.children) {
    const sep = cid.indexOf("::");
    if (sep !== -1) set.add(cid.slice(0, sep));
  }
  return [...set];
}

// ─────────────────────────────────────────────────────────────────────────────
// Build (finish-mapping, §5)
// ─────────────────────────────────────────────────────────────────────────────

export function buildPreviewAnswers(input: BuildPreviewAnswersInput): PreviewAnswers {
  const { workSel, locSel, saSel, serviceArea, adhocNaics = [] } = input;

  const naics = effectiveNaicsFrom(workSel, adhocNaics);
  const selectedStateCodes = stateCodesFrom(locSel);
  const states = statesFromSelection(selectedStateCodes, serviceArea);
  const cities = citiesFrom(locSel);
  const setAsides = setAsideFilterTokensFrom(saSel);
  const setAsideCodes = setAsideCodesFrom(saSel);
  const trades = tradeIdsFrom(workSel);

  return {
    naics,
    states,
    setAsides,
    trades,
    cities,
    serviceArea,
    setAsideCodes,
  };
}

/** The empty-answers payload for the "Explore without personalizing" skip (§4.4). */
export function emptyPreviewAnswers(): PreviewAnswers {
  return { naics: [], states: [], setAsides: [] };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rehydration (build ⇄ rehydrate inverse, §5 final paragraph)
// ─────────────────────────────────────────────────────────────────────────────

export interface RehydratedSelections {
  workSel: TreeSelection;
  locSel: TreeSelection;
  saSel: TreeSelection;
  serviceArea: ServiceArea | "";
  adhocNaics: string[];
}

/**
 * Inverts `buildPreviewAnswers`: for each stored trade, its full NAICS set ⊆
 * stored `naics` → parent selected ("all"); a partial intersection → those
 * specific child codes selected ("some"); leftover stored NAICS codes that
 * don't belong to any stored trade become ad-hoc escape-hatch codes. Same
 * shape for set-asides via `SET_ASIDE_CATEGORIES`. States/cities/serviceArea
 * rebuild step 2 directly from the stored fields.
 */
export function selectionsFromAnswers(answers: PreviewAnswers): RehydratedSelections {
  const storedNaics = new Set(answers.naics ?? []);
  const trades = answers.trades ?? [];

  const workParents: string[] = [];
  const workChildren: string[] = [];
  const consumedNaics = new Set<string>();

  for (const tradeId of trades) {
    const fullCodes = WORK_TYPE_TO_NAICS[tradeId] ?? [];
    if (fullCodes.length === 0) continue;
    const present = fullCodes.filter((c) => storedNaics.has(c));
    if (present.length === 0) continue; // trade recorded but none of its codes actually stored
    if (present.length === fullCodes.length) {
      workParents.push(tradeId);
    } else {
      for (const c of present) workChildren.push(childId(tradeId, c));
    }
    for (const c of present) consumedNaics.add(c);
  }

  const adhocNaics = [...storedNaics].filter((c) => !consumedNaics.has(c));

  const cities = answers.cities ?? [];
  const statesWithCities = new Set(cities.map((c) => c.state));
  const locChildren = cities.map((c) => childId(c.state, c.city));
  const locParents = (answers.states ?? []).filter((s) => !statesWithCities.has(s));
  // States implied only by city refs (not present in `states`, e.g. because
  // serviceArea expanded to neighbors) still need their cities represented;
  // `locChildren` already covers that without adding a whole-state parent.

  return {
    workSel: { parents: workParents, children: workChildren },
    locSel: { parents: locParents, children: locChildren },
    saSel: selectionsFromSetAsideCodes(answers.setAsideCodes ?? []),
    serviceArea: answers.serviceArea ?? "",
    adhocNaics,
  };
}

function selectionsFromSetAsideCodes(codes: string[]): TreeSelection {
  const stored = new Set(codes);
  const parents: string[] = [];
  const children: string[] = [];
  for (const cat of SET_ASIDE_CATEGORIES) {
    const catCodes = cat.codes.map((c) => c.code);
    const present = catCodes.filter((c) => stored.has(c));
    if (present.length === 0) continue;
    if (present.length === catCodes.length) {
      parents.push(cat.id);
    } else {
      for (const c of present) children.push(childId(cat.id, c));
    }
  }
  return { parents, children };
}

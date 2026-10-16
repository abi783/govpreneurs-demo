// Adapters that build the OnboardingTreePicker's `TreeParent[]` inputs from
// production data sources — the "what work" (NAICS), "where" (state → city),
// and "set-aside" trees used by the onboarding wizard's three steps.
//
// Kept free of any async fetch calls itself: STATE_TREE's city lists are
// always empty (lazy — the wizard wires `loadChildren` to
// discoverApi.fetchCities via `cityChildrenOf` below), and WORK_TREE's NAICS
// descriptions are resolved through an injectable resolver function so a
// future async-fetched description cache can be plugged in without changing
// this module's shape.

import { childId, type TreeParent, type TreeChild } from "./treeSelection";
import { naicsDescription } from "./mock/govTaxonomy";
import { WORK_TYPES, WORK_TYPE_TO_NAICS } from "./vocab/trades";
import { STATES, US_STATE_NAMES } from "./vocab/usStates";
import { WORK_SECTIONS, sectionOf } from "./workSections";
import {
  SET_ASIDE_CATEGORIES,
  SET_ASIDE_SECTION_LABEL,
  type SetAsideCategory,
} from "./setAsideTaxonomy";

// ─────────────────────────────────────────────────────────────────────────────
// Work → NAICS tree (onboarding step 1)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the work-type tree. `describeNaics` resolves a NAICS code to a
 * human description; defaults to the synchronous `naicsDescription()` (which
 * only covers ~24 codes and falls back to the bare code for the rest) so this
 * module works standalone. Callers (the wizard) can pass a resolver backed by
 * an async-fetched description cache to get fuller labels once loaded.
 */
export function buildWorkTree(
  describeNaics: (code: string) => string | undefined = naicsDescription,
): TreeParent[] {
  const parents: TreeParent[] = WORK_TYPES.map((t) => {
    const codes = WORK_TYPE_TO_NAICS[t.id] ?? [];
    const children: TreeChild[] = codes.map((code) => {
      const desc = describeNaics(code);
      const hasDesc = !!desc && desc !== code;
      return {
        id: childId(t.id, code),
        label: hasDesc ? (desc as string) : `NAICS ${code}`,
        code: hasDesc ? code : undefined,
        keywords: code,
      };
    });
    return {
      id: t.id,
      label: t.label,
      section: sectionOf(t.id),
      detail: t.gloss,
      keywords: codes.join(" "),
      children,
    };
  });

  return parents.sort((a, b) => {
    const sectionDiff =
      WORK_SECTIONS.indexOf(a.section as (typeof WORK_SECTIONS)[number]) -
      WORK_SECTIONS.indexOf(b.section as (typeof WORK_SECTIONS)[number]);
    if (sectionDiff !== 0) return sectionDiff;
    return a.label.localeCompare(b.label);
  });
}

/** Precomputed work tree using the default synchronous NAICS-description
 *  resolver — for callers (tests, simple usages) that don't need a custom
 *  async-backed resolver. The wizard should call `buildWorkTree(resolver)`
 *  directly instead once it has a richer description cache. */
export const WORK_TREE: TreeParent[] = buildWorkTree();

/** Identity map of the 10 work section ids to their display labels — passed
 *  as `sectionLabels` to the picker instance rendering WORK_TREE. */
export const WORK_SECTION_LABELS: Record<string, string> = Object.fromEntries(
  WORK_SECTIONS.map((s) => [s, s]),
);

// ─────────────────────────────────────────────────────────────────────────────
// State → city tree (onboarding step 2)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 51 state parents (STATES from vocab/usStates.ts), sorted by full display name.
 * `children` is always empty — city lists are lazy, loaded on first expand by
 * the wizard's `loadChildren` wired to `discoverApi.fetchCities(state)` via
 * `cityChildrenOf` below. `detail` carries the 2-letter code (no separate
 * mono-chip precedent exists for state codes in this codebase, so a short
 * detail string reads better here than a `code` chip).
 */
export const STATE_TREE: TreeParent[] = [...STATES]
  .map((s) => ({
    id: s.id,
    label: US_STATE_NAMES[s.id] ?? s.id,
    detail: s.id,
    keywords: s.id,
    children: [] as TreeChild[],
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

/**
 * Converts `fetchCities()`'s per-state `{ city, count }` rows into namespaced
 * `TreeChild[]` for a given state. This is the pure converter a later
 * packet's wizard calls inside its `loadChildren` implementation, e.g.:
 *
 *   loadChildren: async (state) =>
 *     cityChildrenOf(state, (await fetchCities(state)).find(g => g.state === state)?.cities ?? [])
 *
 * City ids/labels are BARE city names (e.g. "Houston"), matching the
 * CITY-ID CONTRACT already established by LocationPicker.tsx — never a
 * "City, ST" composite.
 */
export function cityChildrenOf(
  state: string,
  rows: { city: string; count?: number }[],
): TreeChild[] {
  return rows.map((row) => ({
    id: childId(state, row.city),
    label: row.city,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Set-aside tree (onboarding step 3)
// ─────────────────────────────────────────────────────────────────────────────

export const SET_ASIDE_TREE: TreeParent[] = SET_ASIDE_CATEGORIES.map((cat: SetAsideCategory) => ({
  id: cat.id,
  label: cat.label,
  section: cat.section,
  children: cat.codes.map((code) => ({
    id: childId(cat.id, code.code),
    label: code.label,
    code: code.code,
    detail: code.kind === "sole_source" ? "Sole-Source" : "Set-Aside",
  })),
}));

export const SET_ASIDE_SECTION_LABELS: Record<string, string> = SET_ASIDE_SECTION_LABEL;

/**
 * The seven value kinds no registry control can describe. Pure.
 *
 * `list`, `codes`, `money`, `count`, `papers`, `entries` and `file` have no
 * registry home and cannot get one — `ControlKind` lives in `registry.ts`,
 * which is the `/intake` contract and carries a zero diff. So they get their
 * own field type, shaped like `RegistryField` so `ControlFor` can take the
 * union and dispatch on one discriminant. The two `control` unions are
 * disjoint, which is what makes that safe.
 *
 * Here: which control a kind gets, what per-row facts it needs, how the value
 * seeds it, how its answer is wrapped. Not here: markup, or validation —
 * `parseMbValue` remains the one validator.
 *
 * Three per-row facts the catalog does not hold, keyed by fieldKey because the
 * catalog is a shared contract with `govpreneures` and this is editor detail:
 *  · a `count`'s UNIT — `{ n: 30 }` is meaningless without "days". One row's
 *    unit depends on her trade, so she names it.
 *  · a `codes` row's TAXONOMIES — offering all four on both rows invites a code
 *    filed under the wrong register, which reads as a real answer.
 *  · a `papers` row's KIND — the row already says what the paper is.
 */

import type { CatalogField } from "./catalog";
import { fieldDef, type RegistryOption } from "./registry";
import type { Code, JobEntry, ListItem, MbType, MbValue, Paper, PaperKind, StoredFile } from "./mbValue";

/** The eight kinds with an editor of their own. */
export type MbControlKind =
  | "list"
  | "codes"
  | "money"
  | "count"
  | "papers"
  | "entries"
  | "file"
  | "address";

const MB_CONTROL_KINDS: readonly MbControlKind[] = [
  "list",
  "codes",
  "money",
  "count",
  "papers",
  "entries",
  "file",
  "address",
];

/**
 * A control `registry.ts` has no name for. Shaped like `RegistryField` on
 * purpose — see the header — and carrying only what its editor cannot work out.
 */
export interface MbControlField {
  key: string;
  label: string;
  control: MbControlKind;
  helper?: string;
  whyItMatters?: string;
  /** `count` only: the unit the question itself names, or null when she does. */
  unit?: string | null;
  /** `codes` only: the registers this row is filed in. */
  systems?: Code["system"][];
  /** `papers` only: what kind of paper the row holds. */
  paperKind?: PaperKind;
  /** The bespoke editor this row has earned, where one exists. Authored here
   *  rather than branched on in `ControlFor`, so a second taxonomy-backed row
   *  is one table entry and not a third key literal in a shared switch. */
  picker?: PickerKind;
  /** `certs` picker only: the slugs eligibility is computed from, so the editor
   *  never has to look the row up by name. */
  options?: RegistryOption[];
}

/** The unit each `count` row is measured in. Null means her trade names it. */
const COUNT_UNIT: Record<string, string | null> = {
  total_employees: "people",
  concurrent_contract_capacity: "jobs at once",
  payment_terms_tolerance: "days",
  // Meals, houses, deliveries — the question cannot know, so she says.
  max_daily_output: null,
};

/**
 * The unit a `count` row is measured in, or null when only her trade can name
 * it. Exported so nothing else has to restate "days": a second copy is how one
 * field comes to hold two units, and the number on the card would then mean
 * whatever the writer thought it meant.
 */
export function countUnitFor(fieldKey: string): string | null {
  return COUNT_UNIT[fieldKey] ?? null;
}

/** The registers each `codes` row is filed in. */
const CODE_SYSTEMS: Record<string, Code["system"][]> = {
  psc_codes: ["PSC"],
  commodity_codes: ["NIGP", "UNSPSC"],
};

/** Every taxonomy, for a `codes` row that names none. */
const ALL_SYSTEMS: Code["system"][] = ["NAICS", "PSC", "NIGP", "UNSPSC"];

/** What kind of paper each `papers` row holds. */
const PAPER_KIND: Record<string, PaperKind> = {
  sled_registrations: "registration",
  health_permits: "permit",
  food_manager_certifications: "certification",
  food_handler_cards: "certification",
  state_diversity_certifications: "certification",
};

/** The safe reading of an unlisted `papers` row: the broadest of the five. */
const DEFAULT_PAPER_KIND: PaperKind = "certification";

/** The rows backed by something better than a box to type into. */
export type PickerKind = "psc" | "certs" | "years" | "places";

/**
 * Which rows have earned a bespoke editor.
 *
 * `psc_codes` is the one code row with a real taxonomy behind it (Hunter's
 * `psc_taxonomy`, from the published GSA workbook); `commodity_codes` has none,
 * so offering it the same picker would search nothing. `socioeconomic_certifications`
 * keeps the cert tree even as papers, because the slug is what set-aside
 * eligibility is computed from.
 */
const PICKER: Record<string, PickerKind> = {
  psc_codes: "psc",
  socioeconomic_certifications: "certs",
  // Five boxes, one per year, each labelled with the year it is for. A plain
  // list asks "one number per year" and then leaves her to remember which year
  // she is on and in which direction — and takes any text at all for a figure
  // the size standard is computed from.
  annual_receipts: "years",
  // The home address gets a Google lookup above its parts; the business
  // address deliberately does not — it is one of the frozen thirty-nine and
  // `/intake` asks for it as one line.
  home_address: "places",
};

/** Each register, said in full. NEVER the acronym on its own: "NIGP" names
 *  nothing to a member who has not met it, and an acronym alone is one of the
 *  things this product does not put in front of her. */
export const CODE_SYSTEM_LABEL: Record<Code["system"], string> = {
  NAICS: "NAICS, the federal industry code",
  PSC: "PSC, what a federal buyer calls what you sell",
  NIGP: "NIGP, used by most states and counties",
  UNSPSC: "UNSPSC, used by schools and universities",
};

/** Who a job was for, in her words. `customerType` is required by `JobEntry`
 *  and there is no honest default, so it is asked — never assumed. */
export const CUSTOMER_TYPE_LABEL: Record<JobEntry["customerType"], string> = {
  federal: "A federal agency",
  state: "A state agency",
  local: "A city or county office",
  school: "A school or school district",
  nonprofit: "A nonprofit",
  private: "A private business",
};

/** Whether she held the contract or worked under someone who did. */
export const ROLE_LABEL: Record<JobEntry["role"], string> = {
  prime: "You held the contract",
  sub: "You worked under someone else",
};

/** Whether this kind has an editor of its own. */
export function isMbControlKind(mbType: MbType): mbType is MbControlKind {
  return (MB_CONTROL_KINDS as readonly string[]).includes(mbType);
}

/**
 * The control this row is edited with, carrying the per-row facts the catalog
 * does not hold. `copy` is `copyFor(field)`'s, never restated here.
 */
export function mbControlFor(
  field: CatalogField,
  key: string,
  kind: MbControlKind,
  copy: { label: string; helper?: string; whyItMatters?: string },
): MbControlField {
  const control: MbControlField = {
    key,
    label: copy.label,
    control: kind,
    helper: copy.helper,
    whyItMatters: copy.whyItMatters,
  };
  if (kind === "count") control.unit = countUnitFor(key);
  if (kind === "codes") control.systems = CODE_SYSTEMS[key] ?? ALL_SYSTEMS;
  if (kind === "papers") control.paperKind = PAPER_KIND[key] ?? DEFAULT_PAPER_KIND;
  const picker = PICKER[key];
  if (picker) {
    control.picker = picker;
    // The cert editor needs the registry's own option list; handing it over
    // here is what lets that editor stop naming the row it serves.
    if (picker === "certs") control.options = fieldDef(key)?.options ?? [];
  }
  return control;
}

/** What she typed, as the count kind holds it. */
export interface CountAnswer {
  n: number;
  unit: string;
}

/**
 * Her answer as the control shows it: the payload the kind carries, with the
 * `kind` tag taken off. Undefined where the record holds something else — a row
 * that has never been answered, or one answered "not sure".
 */
export function mbShownIn(kind: MbControlKind, value: MbValue): unknown {
  switch (kind) {
    case "list":
      return value.kind === "list" ? value.items : undefined;
    case "codes":
      return value.kind === "codes" ? value.codes : undefined;
    case "money":
      return value.kind === "money" ? value.amountUSD : undefined;
    case "count":
      return value.kind === "count" ? { n: value.n, unit: value.unit } : undefined;
    case "papers":
      return value.kind === "papers" ? value.papers : undefined;
    case "entries":
      return value.kind === "entries" ? value.entries : undefined;
    case "file":
      return value.kind === "file" ? value.file : undefined;
    case "address":
      return value.kind === "address" ? value.address : undefined;
  }
}

/** A shape that could be one of the structured kinds. Never trusted — it is
 *  handed straight to `parseMbValue`, which is the one validator. */
function isRecord(answer: unknown): answer is Record<string, unknown> {
  return typeof answer === "object" && answer !== null && !Array.isArray(answer);
}

/**
 * The control's answer with its `kind` put back on, ready for `parseMbValue`, or
 * null when it is not even the right sort of thing.
 *
 * NOTHING IS COERCED AND NOTHING IS FILLED IN. In particular a `papers` answer
 * is passed through as she left it, so a paper with no `expiresAt` — every
 * legacy-lifted one, by hazard 6 — comes back out with none. Inventing an expiry
 * on save would put a renewal in her queue that nobody ever has to make.
 */
export function mbWireFrom(kind: MbControlKind, answer: unknown): unknown {
  switch (kind) {
    case "list":
      return Array.isArray(answer) ? { kind, items: answer as ListItem[] } : null;
    case "codes":
      return Array.isArray(answer) ? { kind, codes: answer as Code[] } : null;
    case "papers":
      return Array.isArray(answer) ? { kind, papers: answer as Paper[] } : null;
    case "entries":
      return Array.isArray(answer) ? { kind, entries: answer as JobEntry[] } : null;
    case "money":
      return typeof answer === "number" ? { kind, amountUSD: answer } : null;
    case "count":
      return isRecord(answer) ? { kind, n: answer.n, unit: answer.unit } : null;
    case "file":
      return isRecord(answer) ? { kind, file: answer as unknown as StoredFile } : null;
    case "address":
      return isRecord(answer) ? { kind, address: answer } : null;
  }
}

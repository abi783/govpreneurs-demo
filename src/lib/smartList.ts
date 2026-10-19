import { OPPORTUNITIES, type Opportunity } from "./mock/opportunities";
import { VOCAB } from "../demo/hunter/vocab";

// ───── Types ─────

export type ConditionField =
  | "workType"
  | "location"
  | "contractValue"
  | "setAside"
  | "agency"
  | "mode"
  | "source"
  | "matchStrength"
  | "closesWithin";

export type ConditionOperator =
  | "is"
  | "is_not"
  | "is_any_of"
  | "under"
  | "over"
  | "between"
  | "is_under_days"
  | "is_at_least";

export type ConditionValue =
  | string
  | string[]
  | number
  | [number, number];

export interface Condition {
  id: string;
  field: ConditionField;
  operator: ConditionOperator;
  value: ConditionValue;
}

export interface ConditionGroup {
  id: string;
  join: "AND" | "OR";
  conditions: Condition[];
}

export interface SmartList {
  groupJoin: "AND" | "OR";
  groups: ConditionGroup[];
}

export interface SavedSmartList {
  id: string;
  name: string;
  tree: SmartList;
}

// ───── Field metadata ─────

export type ValueKind =
  | "category"
  | "multi"
  | "value"
  | "days"
  | "tier";

export interface FieldMeta {
  label: string;
  operators: ConditionOperator[];
  valueKind: ValueKind;
  options?: string[];
}

const AGENCY_OPTIONS = [
  "USACE",
  "VA",
  "Navy",
  "Air Force",
  "Army",
  "GSA",
  "DLA Energy",
  "NCDOT",
  "NC National Guard",
  "Cumberland County Schools",
];

const SETASIDE_OPTIONS = ["SDVOSB", "8(a)", "Total Small Business", "WOSB", "HUBZone"];

const LOCATION_OPTIONS = [
  "North Carolina",
  "Fayetteville",
  "Fort Bragg",
  "Jacksonville",
  "Cherry Point",
  "Goldsboro",
  "Within 200mi of Fayetteville",
  "Outside NC",
];

// DEMO: the sample member's own work types and pre-saved list, where the member has them
// (src/demo/members/<member>/hunter/vocab.ts). Otherwise production's examples.
const MEMBER_LIST = VOCAB.ui.smartList;

const WORK_TYPE_OPTIONS = MEMBER_LIST?.workTypes ?? [
  "Modified bitumen re-roofing",
  "TPO single-ply roofing",
  "Standing-seam metal roofing",
  "Asphalt shingle roofing",
  "Roof repair & PM",
  "Building envelope",
  "Siding & exterior",
  "Re-roofing program (multi-site)",
];

export const FIELD_META: Record<ConditionField, FieldMeta> = {
  workType:      { label: "Work type",      operators: ["is", "is_not", "is_any_of"], valueKind: "multi",    options: WORK_TYPE_OPTIONS },
  location:      { label: "Location",       operators: ["is", "is_not", "is_any_of"], valueKind: "multi",    options: LOCATION_OPTIONS },
  contractValue: { label: "Contract value", operators: ["under", "over", "between"],   valueKind: "value" },
  setAside:      { label: "Set-aside",      operators: ["is", "is_any_of"],             valueKind: "multi",    options: SETASIDE_OPTIONS },
  agency:        { label: "Agency",         operators: ["is", "is_not", "is_any_of"], valueKind: "multi",    options: AGENCY_OPTIONS },
  mode:          { label: "Mode",           operators: ["is"],                          valueKind: "category", options: ["Prime", "Partner"] },
  source:        { label: "Source",         operators: ["is"],                          valueKind: "category", options: ["Federal", "State / Local / Education"] },
  matchStrength: { label: "Match strength", operators: ["is_at_least"],                 valueKind: "tier",     options: ["Strong", "Good", "Stretch", "Long shot"] },
  closesWithin:  { label: "Closes within",  operators: ["is_under_days"],               valueKind: "days" },
};

export const OPERATOR_LABEL: Record<ConditionOperator, string> = {
  is: "is",
  is_not: "is not",
  is_any_of: "is any of",
  under: "under",
  over: "over",
  between: "between",
  is_under_days: "in the next",
  is_at_least: "is at least",
};

// ───── Helpers ─────

const FAYETTEVILLE_AREA_KEYWORDS = [
  "Fayetteville", "Fort Bragg", "Pope AAF", "Hope Mills", "Spring Lake",
  "Raeford", "Lumberton", "Cumberland",
];

function locationMatches(opp: Opportunity, target: string): boolean {
  const loc = opp.location;
  if (target === "North Carolina") return /, NC\b|NC\b|North Carolina/i.test(loc);
  if (target === "Outside NC") return !/, NC\b|NC\b|North Carolina/i.test(loc);
  if (target === "Within 200mi of Fayetteville")
    return FAYETTEVILLE_AREA_KEYWORDS.some((k) => loc.includes(k));
  return loc.toLowerCase().includes(target.toLowerCase());
}

function tierRank(t: string): number {
  return ({ strong: 0, good: 1, stretch: 2, longshot: 3 } as Record<string, number>)[t] ?? 99;
}

function tierLabelToKey(label: string): string {
  return ({ "Strong": "strong", "Good": "good", "Stretch": "stretch", "Long shot": "longshot" } as Record<string, string>)[label] ?? label.toLowerCase();
}

function daysUntilClose(opp: Opportunity, now = Date.now()): number {
  return Math.ceil((new Date(opp.closesAt).getTime() - now) / 86_400_000);
}

function asArray(v: ConditionValue): string[] {
  if (Array.isArray(v)) return v.map(String);
  return [String(v)];
}

// ───── Single-condition evaluator ─────

export function evaluateCondition(cond: Condition, opp: Opportunity): boolean {
  const { field, operator, value } = cond;

  switch (field) {
    case "workType": {
      const arr = asArray(value);
      if (operator === "is") return opp.workType === String(value);
      if (operator === "is_not") return opp.workType !== String(value);
      if (operator === "is_any_of") return arr.includes(opp.workType);
      return false;
    }
    case "location": {
      const arr = asArray(value);
      if (operator === "is") return locationMatches(opp, String(value));
      if (operator === "is_not") return !locationMatches(opp, String(value));
      if (operator === "is_any_of") return arr.some((t) => locationMatches(opp, t));
      return false;
    }
    case "agency": {
      const arr = asArray(value);
      if (operator === "is") return opp.agency === String(value);
      if (operator === "is_not") return opp.agency !== String(value);
      if (operator === "is_any_of") return arr.includes(opp.agency);
      return false;
    }
    case "setAside": {
      const sa = opp.setAside ?? "";
      const arr = asArray(value);
      if (operator === "is") return sa === String(value);
      if (operator === "is_any_of") return arr.includes(sa);
      return false;
    }
    case "mode": {
      const target = String(value).toLowerCase();
      return opp.mode === target;
    }
    case "source": {
      const target = String(value);
      return (target.startsWith("Fed") && opp.scope === "fed") || (target.startsWith("State") && opp.scope === "sled");
    }
    case "matchStrength": {
      const targetKey = tierLabelToKey(String(value));
      if (operator === "is_at_least") return tierRank(opp.matchTier) <= tierRank(targetKey);
      return false;
    }
    case "contractValue": {
      const high = opp.valueHigh || opp.valueLow;
      if (operator === "under") return typeof value === "number" && high < value;
      if (operator === "over") return typeof value === "number" && high > value;
      if (operator === "between" && Array.isArray(value) && value.length === 2) {
        const [lo, hi] = value as [number, number];
        return high >= lo && high <= hi;
      }
      return false;
    }
    case "closesWithin": {
      if (operator === "is_under_days" && typeof value === "number") {
        const d = daysUntilClose(opp);
        return d >= 0 && d <= value;
      }
      return false;
    }
  }
}

function evaluateGroup(group: ConditionGroup, opp: Opportunity): boolean {
  if (group.conditions.length === 0) return true;
  if (group.join === "AND") return group.conditions.every((c) => evaluateCondition(c, opp));
  return group.conditions.some((c) => evaluateCondition(c, opp));
}

export function evaluateSmartList(list: SmartList, opps: Opportunity[]): Opportunity[] {
  if (list.groups.length === 0) return opps;
  return opps.filter((opp) => {
    if (list.groupJoin === "AND") return list.groups.every((g) => evaluateGroup(g, opp));
    return list.groups.some((g) => evaluateGroup(g, opp));
  });
}

export function countMatches(list: SmartList): number {
  return evaluateSmartList(list, OPPORTUNITIES).length;
}

// ───── Label helpers ─────

function formatValueLabel(cond: Condition): string {
  const { field, operator, value } = cond;
  if (field === "contractValue") {
    const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` : `$${Math.round(n / 1_000)}K`;
    if (operator === "between" && Array.isArray(value)) return `${fmt(Number(value[0]))}–${fmt(Number(value[1]))}`;
    if (typeof value === "number") return fmt(value);
    return "";
  }
  if (field === "closesWithin") return `${value} days`;
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function conditionToLabel(cond: Condition): string {
  const fieldLabel = FIELD_META[cond.field].label;
  const opLabel = OPERATOR_LABEL[cond.operator];
  const valLabel = formatValueLabel(cond);
  return `${fieldLabel} ${opLabel} ${valLabel}`.trim();
}

export function summarizeSmartList(list: SmartList): string {
  const total = list.groups.reduce((acc, g) => acc + g.conditions.length, 0);
  if (total === 0) return "No conditions";
  return `${total} condition${total === 1 ? "" : "s"} across ${list.groups.length} group${list.groups.length === 1 ? "" : "s"}`;
}

// ───── ID helpers ─────

let counter = 0;
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export function makeEmptyCondition(): Condition {
  return { id: nextId("c"), field: "workType", operator: "is", value: WORK_TYPE_OPTIONS[0] };
}

export function makeEmptyGroup(): ConditionGroup {
  return { id: nextId("g"), join: "AND", conditions: [makeEmptyCondition()] };
}

export function makeEmptySmartList(): SmartList {
  return { groupJoin: "AND", groups: [makeEmptyGroup()] };
}

export function defaultValueForField(field: ConditionField, operator: ConditionOperator): ConditionValue {
  const meta = FIELD_META[field];
  if (field === "contractValue") {
    if (operator === "between") return [250_000, 1_000_000];
    return 1_000_000;
  }
  if (field === "closesWithin") return 30;
  if (operator === "is_any_of") {
    return meta.options ? [meta.options[0]] : [];
  }
  return meta.options ? meta.options[0] : "";
}

// ───── Pre-seeded saved lists ─────

export const INITIAL_SAVED_LISTS: SavedSmartList[] = [
  {
    id: "seed-sdvosb-nc",
    name: MEMBER_LIST?.seedName ?? "SDVOSB roofing $250K–$1M, NC",
    tree: {
      groupJoin: "AND",
      groups: [
        {
          id: "seed-g1",
          join: "AND",
          conditions: [
            { id: "seed-c1", field: "setAside", operator: "is_any_of", value: MEMBER_LIST?.seedSetAsides ?? ["SDVOSB", "Total Small Business"] },
            { id: "seed-c2", field: "contractValue", operator: "between", value: MEMBER_LIST?.seedValue ?? [250_000, 1_000_000] },
          ],
        },
        {
          id: "seed-g2",
          join: "OR",
          conditions: [
            { id: "seed-c3", field: "location", operator: "is", value: "North Carolina" },
            { id: "seed-c4", field: "location", operator: "is", value: "Within 200mi of Fayetteville" },
          ],
        },
      ],
    },
  },
];

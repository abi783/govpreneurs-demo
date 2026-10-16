// DEMO: the one place the profile surfaces (/business-profile, Knowledge, Stay
// Ready, the capability statement builder) keep what the visitor changes.
//
// Every key starts with `profile.` and lives in the demo store
// (src/demo/runtime/store.ts), so a change survives a reload, shows on every tab
// that shows the same fact, and "Reset demo" puts everything back.

import { readDemoState, updateDemoState, useDemoState, writeDemoState } from "../runtime/store";

export type FieldState =
  | "verified"
  | "needs_review"
  | "attested"
  | "inferred"
  | "stale"
  | "missing"
  | "conflict"
  | "pending_dfy"
  | "error";

/** A value a profile field can hold. */
export type FieldValue = string | string[] | number | boolean | { min: number | null; max: number | null } | null;

/** What the visitor (or an action) changed on a field, on top of its starting values. */
export interface FieldOverride {
  state?: FieldState;
  value?: FieldValue;
  /** Replaces the field's starting source line. */
  source?: string;
  /** When `state` last changed. Drives "Last checked N days ago". */
  at?: string;
  errorMessage?: string;
  /** The DFY order that put this field in `pending_dfy`. */
  dfyOrderId?: string;
}

const FIELDS_KEY = "profile.fields";
const EMPTY_FIELDS: Record<string, FieldOverride> = {};

export function useFieldOverrides(): Record<string, FieldOverride> {
  const [overrides] = useDemoState<Record<string, FieldOverride>>(FIELDS_KEY, EMPTY_FIELDS);
  return overrides;
}

export function getFieldOverrides(): Record<string, FieldOverride> {
  return readDemoState<Record<string, FieldOverride>>(FIELDS_KEY, EMPTY_FIELDS);
}

export function patchField(id: string, patch: FieldOverride): void {
  updateDemoState<Record<string, FieldOverride>>(FIELDS_KEY, EMPTY_FIELDS, (prev) => ({
    ...prev,
    [id]: { ...prev[id], ...patch },
  }));
}

// ── Edit mode (the switch in the page header) ───────────────────────────────

const EDIT_MODE_KEY = "profile.editMode";

export function useEditModeState(): [boolean, (on: boolean) => void] {
  const [on, set] = useDemoState<boolean>(EDIT_MODE_KEY, true);
  return [on, (next) => set(next)];
}

// ── Small generic helpers other profile stores use ──────────────────────────

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export { readDemoState, updateDemoState, useDemoState, writeDemoState };

// The styles for the dialogs and notes the demo added to the profile pages.
import "./profile.css";

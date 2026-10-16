// DEMO: shows one Business Profile field from the demo store. The field's
// starting values come from the story (src/demo/profile/fields.tsx); what the
// visitor changes is laid on top and survives a reload.

import type { ReactNode } from "react";
import { FieldRow } from "./FieldRow";
import { DFY_SERVICES } from "../../demo/profile/dfy";
import {
  FIELD_DEFS,
  effectiveField,
  valueToText,
  type FieldDef,
} from "../../demo/profile/fields";
import { daysAgo, fmtShort } from "../../demo/profile/dates";
import { patchField, useFieldOverrides, type FieldValue } from "../../demo/profile/store";

const today = () => fmtShort(new Date());

/** Turns a saved edit into the value kind the field holds. */
function toFieldValue(def: FieldDef, raw: unknown): FieldValue {
  if (def.edit?.type === "multiselect") return Array.isArray(raw) ? (raw as string[]) : [String(raw ?? "")];
  if (def.edit?.type === "range") return raw as { min: number | null; max: number | null };
  if (def.edit?.type === "boolean") return Boolean(raw);
  if (def.edit?.type === "file") return String(raw ?? "");
  return String(raw ?? "");
}

export function ProfileField({ id, extra }: { id: string; extra?: Partial<Parameters<typeof FieldRow>[0]> }) {
  const overrides = useFieldOverrides();
  const def = FIELD_DEFS[id];
  if (!def) return null;
  const f = effectiveField(def, overrides);

  const shown: ReactNode =
    f.value == null || f.value === ""
      ? undefined
      : def.show
        ? def.show(f.value)
        : valueToText(f.value);

  const verifiedBy = def.checksAgainst ?? "SAM.gov";

  const saveEdit = (raw: unknown) => {
    const value = toFieldValue(def, raw);
    patchField(id, {
      state: "attested",
      value,
      source: def.edit?.type === "file" ? `You uploaded ${String(raw)} on ${today()}` : `You entered this on ${today()}`,
      at: new Date().toISOString(),
      errorMessage: undefined,
      dfyOrderId: undefined,
    });
  };

  const markVerified = () =>
    patchField(id, {
      state: "verified",
      source: `${verifiedBy} on ${today()}`,
      at: new Date().toISOString(),
      errorMessage: undefined,
    });

  const confirm = () =>
    patchField(id, {
      state: f.state === "needs_review" ? "verified" : "attested",
      source: `You confirmed this on ${today()}`,
      at: new Date().toISOString(),
    });

  const resolve = (chosenSource: string) => {
    const choice = def.conflict?.find((c) => c.source === chosenSource);
    if (!choice) return;
    patchField(id, {
      state: "attested",
      value: choice.value,
      source: `You chose the ${choice.source.replace(/ on .*/, "")} value on ${today()}`,
      at: new Date().toISOString(),
    });
  };

  const dfy = def.dfy
    ? { service: DFY_SERVICES[def.dfy.service].name, price: def.dfy.price, leadField: def.dfy.leadField, serviceId: def.dfy.service }
    : undefined;

  const sourceNote =
    f.state === "inferred" || f.state === "stale" ? f.source : f.source;

  return (
    <FieldRow
      key={id}
      tier={def.tier}
      label={def.label}
      state={f.state}
      helperMicrocopy={def.helper}
      whyItMatters={def.whyItMatters}
      chatEditable={def.chatEditable}
      value={shown}
      source={sourceNote}
      errorMessage={f.errorMessage}
      staleAgeInDays={f.at ? daysAgo(f.at) : undefined}
      staleConsequence={f.state === "stale" ? "verifying status takes a moment" : undefined}
      pendingDfyMessage={f.state === "pending_dfy" ? "Our team is preparing this" : undefined}
      conflictValues={def.conflict}
      dfy={dfy}
      fieldId={id}
      editType={def.edit?.type}
      editOptions={def.edit?.options}
      editValue={f.value ?? undefined}
      editPlaceholder={def.edit?.placeholder}
      validate={def.edit?.validate}
      onSave={saveEdit}
      onReVerify={markVerified}
      onTryAgain={markVerified}
      onConfirm={confirm}
      onResolveConflict={resolve}
      onChooseDocument={(name) =>
        patchField(id, { source: `Re-read from ${name} on ${today()}`, at: new Date().toISOString() })
      }
      dfyOrderId={f.dfyOrderId}
      {...extra}
    />
  );
}

/** "X of N essentials complete" text for a footer. */
export function essentialsText(done: number, total: number): string {
  return `${done} of ${total} essentials complete`;
}

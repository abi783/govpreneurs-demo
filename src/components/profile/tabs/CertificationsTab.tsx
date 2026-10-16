import { ProfileTabSection } from "../ProfileTabSection";
import { FieldRow } from "../FieldRow";
import { FOOD_HANDLER_DEF, effectiveField, essentialsFor } from "../../../demo/profile/fields";
import { patchField, useFieldOverrides } from "../../../demo/profile/store";
import { fmtShort } from "../../../demo/profile/dates";
import { PERSONA } from "../../../demo/story/persona";

// DEMO: the fields come from the story (src/demo/profile/fields.tsx). The
// food-handler row is a count, so it is built here: it says how many staff are
// certified and how many still need a certificate.
export function CertificationsTab() {
  const overrides = useFieldOverrides();
  const f = effectiveField(FOOD_HANDLER_DEF, overrides);
  const have = Math.max(0, Number(f.value ?? 0)) || 0;
  const staff = Math.max(PERSONA.employeesW2, have);
  const left = Math.max(0, staff - have);

  const foodRow = (
    <FieldRow
      key="food-handlers"
      tier="T2"
      label={FOOD_HANDLER_DEF.label}
      state={f.state}
      helperMicrocopy={FOOD_HANDLER_DEF.helper}
      whyItMatters={FOOD_HANDLER_DEF.whyItMatters}
      value={`${have} of ${staff} staff hold a current food-handler certificate.${left > 0 ? ` ${left} still ${left === 1 ? "needs" : "need"} one.` : " Everyone is certified."}`}
      source={f.source}
      fieldId={FOOD_HANDLER_DEF.id}
      editType="number"
      editValue={String(have)}
      validate={FOOD_HANDLER_DEF.edit?.validate}
      onSave={(v) =>
        patchField(FOOD_HANDLER_DEF.id, {
          state: "attested",
          value: String(Math.min(staff, Math.max(0, Number(v)))),
          source: `You updated this on ${fmtShort(new Date())}`,
          at: new Date().toISOString(),
        })
      }
    />
  );

  const { done, total } = essentialsFor("certifications", overrides);
  return (
    <ProfileTabSection
      tab="certifications"
      unlocks="This section unlocks: set-aside opportunities you qualify for and DSBS-driven inbound interest"
      replace={{ "food-handlers": foodRow }}
      progress={`${done} of ${total} essentials complete`}
    />
  );
}

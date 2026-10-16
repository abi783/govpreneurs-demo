// DEMO: the Digital identity part. The Success Center version
// (`components/business/mybusiness/DigitalIdentityPart.tsx`) is a server component that
// reads Postgres. The demo version is a client component that reads the audit she
// submitted from the store, then hands it to the same `DigitalIdentityForm`.
//
// "Submit and check" calls the verify handler, which writes the new findings to the
// store. The form then calls `router.refresh()`, which raises the demo refresh tick; this
// component reads the store again, so the new findings show without a page load.

import { useMemo, type ReactElement } from "react";
import { useDemoState } from "../../runtime/store";
import { PERSONA } from "../../story/persona";
import { DC_VALIDATION_KEY, dcFindingPill, dcItemIdForKey, DC_GAP_DESCRIPTIONS, DC_ITEM_INPUT_KEY, type DcPreCheckResult } from "@sc/lib/digitalCompliance";
import { DIGITAL_COMPLIANCE_FIELDS, dcPrefill, type FormResult } from "@sc/lib/roadmapV3/forms";
import { DigitalIdentityForm } from "@sc/components/business/mybusiness/DigitalIdentityForm";
import { useRecord } from "@sc/components/business/mybusiness/RecordStore";
import { BUSINESS_STATE_KEY } from "./state";
import { buildSeed } from "./seed";
import type { DemoBusinessState } from "./types";

export function DigitalIdentityPart({ locationId }: { locationId: string }): ReactElement {
  const [state] = useDemoState<DemoBusinessState>(BUSINESS_STATE_KEY, buildSeed);
  const { payload } = useRecord();
  const audit = state.digital;

  // What her record already holds, as the form's first values (her last answers win).
  const prefill = useMemo(() => {
    const held = (key: string): string => {
      const row = payload.fields.find((f) => f.fieldKey === key);
      if (!row) return "";
      const v = row.value;
      return v.kind === "text" ? v.text : "";
    };
    const fromRecord: Record<string, string> = {
      businessLegalName: held("legal_company_name") || PERSONA.businessName,
      email: held("email") || PERSONA.email,
      website: held("website") || PERSONA.website,
      phone: held("phone") || PERSONA.phone,
    };
    return dcPrefill(DIGITAL_COMPLIANCE_FIELDS, audit?.inputs, fromRecord);
  }, [audit, payload.fields]);

  const results = useMemo<FormResult[] | null>(() => {
    if (!audit) return null;
    return audit.preCheck.map((r) => {
      const itemId = dcItemIdForKey(r.itemKey);
      void itemId;
      const status = dcFindingPill((r as DcPreCheckResult).status, null);
      const out: FormResult = { title: r.itemTitle, status };
      if (r.evidence) out.evidence = r.evidence;
      const description = DC_GAP_DESCRIPTIONS[r.itemKey];
      if (description) out.description = description;
      const provided = audit.inputs[DC_ITEM_INPUT_KEY[r.itemKey] ?? ""];
      if (typeof provided === "string" && provided.trim()) out.provided = provided.trim();
      return out;
    });
  }, [audit]);

  return (
    <DigitalIdentityForm
      // A new audit remounts the form, so its boxes show the answers she just sent.
      key={audit?.checkedAt ?? "none"}
      locationId={locationId}
      fields={DIGITAL_COMPLIANCE_FIELDS}
      validationKey={DC_VALIDATION_KEY}
      prefill={prefill}
      results={results}
      checkedAt={audit?.checkedAt ?? null}
    />
  );
}

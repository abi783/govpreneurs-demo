// DEMO API area: Business profile, knowledge and Stay Ready.
// Owns: /business-profile*, and any knowledge-base or Stay Ready call.
//
// GET /business-profile is called at app start (BusinessProfileProvider in
// src/lib/businessProfile.tsx). It answers from the story (PERSONA) with whatever the
// visitor has changed on the Business Profile page laid on top, so Hunter, the
// sidebar and the capability statement builder all see the same business.
// The knowledge-base, Stay Ready and profile pages make no backend call: they keep
// their state in the demo store (src/demo/profile/).
//
// Path scheme (see src/demo/runtime/router.ts): no prefix for frontend-v2 code.

import type { DemoRouteDef } from "../runtime/router";
import type { BusinessProfile } from "../../lib/businessProfile";
import { PERSONA } from "../story/persona";
import { FIELD_DEFS, effectiveField, valueToText } from "../profile/fields";
import { getFieldOverrides } from "../profile/store";
import { getCapStatement } from "../../lib/capStatementState";

function buildProfile(): BusinessProfile {
  const overrides = getFieldOverrides();
  const text = (id: string): string => valueToText(effectiveField(FIELD_DEFS[id], overrides).value);
  const list = (id: string): string[] => {
    const v = effectiveField(FIELD_DEFS[id], overrides).value;
    return Array.isArray(v) ? v : typeof v === "string" && v ? [v] : [];
  };

  // "722310 Food Service Contractors" -> code and title
  const split = (t: string): { code: string; label: string } | null => {
    const m = /^(\d{2,6})\s+(.*)$/.exec(t.trim());
    return m ? { code: m[1], label: m[2] } : null;
  };
  const primary = split(text("primary-naics")) ?? { code: PERSONA.primaryNaics, label: PERSONA.primaryNaicsLabel };
  const others = list("secondary-naics")
    .map(split)
    .filter((n): n is { code: string; label: string } => n !== null);
  const naicsLabels: Record<string, string> = { [primary.code]: primary.label };
  for (const n of others) naicsLabels[n.code] = n.label;

  const cap = getCapStatement();
  const ein = text("ein");
  const legalName = text("legal-name") || PERSONA.businessName;
  return {
    ghlLocationId: PERSONA.locationId,
    ownerName: PERSONA.ownerName,
    legalName,
    accountName: legalName,
    primaryNaics: primary.code,
    naicsCodes: [primary.code, ...others.map((n) => n.code)],
    naicsLabels,
    stateCodes: [...PERSONA.serviceStates].map((s) => s.toLowerCase()),
    cities: [PERSONA.hqCity.toLowerCase()],
    // "Small Business" comes from `isSmall`, so the list holds only the other set-aside (WOSB).
    socioEconomicCerts: PERSONA.setAsideEligibility.filter((c) => c !== "SBA"),
    isSmall: true,
    certifications: cap.uploaded ? ["sam", "capability"] : ["sam"],
    certificationCategories: [],
    capabilityStatementUrl: cap.uploaded ? PERSONA.capabilityStatementFile : null,
    uei: text("uei") || null,
    cage: text("cage") || null,
    ein: ein || null,
    website: text("website") || null,
  };
}

export const routes: DemoRouteDef[] = [
  {
    method: "GET",
    path: "/business-profile",
    handler: () => buildProfile(),
  },
];

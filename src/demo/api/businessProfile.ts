// DEMO API area: Business profile, knowledge and Stay Ready.
// Owns: /business-profile*, and any knowledge-base or Stay Ready call.
//
// BOOT STUB: GET /business-profile is called at app start (BusinessProfileProvider
// in src/lib/businessProfile.tsx), so the shell registers a first version here from
// PERSONA. The business profile page agent owns this file and may change it.
// `capabilityStatementUrl` is null until that agent decides what the story says.
//
// Path scheme (see src/demo/runtime/router.ts): no prefix for frontend-v2 code.

import type { DemoRouteDef } from "../runtime/router";
import type { BusinessProfile } from "../../lib/businessProfile";
import { PERSONA } from "../story/persona";

function buildProfile(): BusinessProfile {
  const naicsLabels: Record<string, string> = {
    [PERSONA.primaryNaics]: PERSONA.primaryNaicsLabel,
  };
  for (const n of PERSONA.secondaryNaics) naicsLabels[n.code] = n.label;
  return {
    ghlLocationId: PERSONA.locationId,
    ownerName: PERSONA.ownerName,
    legalName: PERSONA.businessName,
    accountName: PERSONA.businessName,
    primaryNaics: PERSONA.primaryNaics,
    naicsCodes: [PERSONA.primaryNaics, ...PERSONA.secondaryNaics.map((n) => n.code)],
    naicsLabels,
    stateCodes: [...PERSONA.serviceStates].map((s) => s.toLowerCase()),
    cities: [PERSONA.hqCity.toLowerCase()],
    socioEconomicCerts: ["SB", "WOSB"],
    isSmall: true,
    certifications: ["sam"],
    certificationCategories: [],
    capabilityStatementUrl: PERSONA.capabilityStatementFile,
    uei: PERSONA.uei,
    cage: PERSONA.cage,
    ein: null,
    website: PERSONA.website,
  };
}

export const routes: DemoRouteDef[] = [
  {
    method: "GET",
    path: "/business-profile",
    handler: () => buildProfile(),
  },
];

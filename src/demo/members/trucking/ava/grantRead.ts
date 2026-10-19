// DEMO: the trucking company's hero, the supply and linen runs for the
// Fayetteville VA: a VA quote set aside for service-disabled veteran-owned
// firms. Rows follow Grant's hand-written brief (members/trucking/grantBriefs.ts,
// `compliance`), with Tanya's facts.
//
// Built when Grant's read is opened, from the helpers src/demo/ava/grantRead.ts
// lends it, so this file imports no app code (no import cycle).

import type { GrantReadKit, GrantSample } from "../../../ava/grantRead";
import { HERO_IDS } from "../opportunities";

/** The bid this read is for. */
export const HERO_ID: string = HERO_IDS.hero;

export function grantRead({ row, active, limits }: GrantReadKit): GrantSample {
  return {
    rows: [
      row(
        "gt-sdvosb",
        "Certified service-disabled veteran-owned small business when you quote",
        "§1.2",
        "SDVOSB",
        "Certified in SBA's VetCert in Dec 2023. Eligibility ends in 47 days; the renewal window is open",
        "have",
      ),
      row(
        "gt-size",
        "Small under the size standard for industry code 484110",
        "§1.2",
        "Small",
        "Small, as your registration says",
        "have",
      ),
      row(
        "gt-sam",
        "Active federal registration when you quote, and through award",
        "§5.2",
        "Active",
        active,
        "have",
      ),
      row(
        "gt-license",
        "Hazardous material license number on the price schedule",
        "Att. 2",
        "License number",
        "No driver holds a hazmat endorsement. Ask in Q&A which license they mean",
        "missing",
      ),
      row(
        "gt-bond",
        "Bonded drivers who pass VA background checks",
        "PWS 4.2",
        "Bonded",
        "The bond amount isn't stated. Ask in Q&A",
        "confirm",
      ),
      row(
        "gt-pm",
        "Named PM and Alternate",
        "PWS 4.1",
        "Named",
        "Not named yet. Ava asks who",
        "missing",
      ),
    ],
    warnings: limits(HERO_IDS.hero, []),
    deadline: { bondingLeadDays: 0, ppqTurnaroundDays: 5, subQuoteDays: 0, writingDays: 2 },
    questions: [],
  };
}

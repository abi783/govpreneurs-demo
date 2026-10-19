// DEMO: the consultant's hero, the supervisor leadership program at the
// Fayetteville VA: a VA quote set aside for service-disabled veteran-owned
// firms. Rows follow Grant's hand-written brief (members/consulting/grantBriefs.ts,
// `compliance`), with Simone's facts.
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
        "cv-sdvosb",
        "Certified service-disabled veteran-owned firm when you quote, and at award",
        "§1.2",
        "SDVOSB",
        "Certified by SBA on 14 Jan 2024. Eligibility ends 14 Jan 2027; VA checks it at award",
        "have",
      ),
      row(
        "cv-size",
        "Small under the size standard for industry code 611430",
        "§1.2",
        "Small",
        "Small, as your registration says",
        "have",
      ),
      row(
        "cv-sam",
        "Active federal registration when you quote, and through award",
        "§5.2",
        "Active",
        active,
        "have",
      ),
      row(
        "cv-limits",
        "At most half of what VA pays to firms that aren't veteran-owned",
        "§5.3",
        "50% or less",
        "Two of your four cohort leads are 1099 facilitators. Count the hours by person, then sign the certificate",
        "confirm",
      ),
      row(
        "cv-coach",
        "Coaches with an ICF PCC credential or equal",
        "PWS 3.3",
        "PCC or equal",
        "One PCC and two ACC. Ask in Q&A whether an ACC counts",
        "confirm",
      ),
      row(
        "cv-leads",
        "Named Program Manager and Lead Facilitator",
        "PWS 4.1",
        "Named",
        "Not named yet. Ava asks who",
        "missing",
      ),
    ],
    warnings: limits(HERO_IDS.hero, []),
    deadline: { bondingLeadDays: 0, ppqTurnaroundDays: 3, subQuoteDays: 0, writingDays: 3 },
    questions: [],
  };
}

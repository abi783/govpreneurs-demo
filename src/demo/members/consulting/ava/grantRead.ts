// DEMO: the agency's hero, Family Advocacy print and digital ads: a federal
// quote set aside for woman-owned firms. Rows follow Grant's hand-written
// brief (members/agency/grantBriefs.ts, `compliance`), with Dana's facts.
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
      "ga-setaside",
      "Certified woman-owned small business when you quote",
      "§1.2",
      "WOSB",
      "Certified in SBA's MySBA Certifications",
      "have",
    ),
    row(
      "ga-size",
      "Small under the size standard for industry code 541810",
      "§1.2",
      "Small",
      "Small, as your registration says",
      "have",
    ),
    row(
      "ga-sam",
      "Active federal registration when you quote, and through award",
      "§5.2",
      "Active",
      active,
      "have",
    ),
    row(
      "ga-app",
      "Ads on the contractor's own mobile app",
      "PWS 3.4",
      "Own app",
      "No app on file. Ask in Q&A whether a news partner's app counts",
      "missing",
    ),
    row(
      "ga-pm",
      "Named project manager and alternate",
      "PWS 4.1",
      "Named",
      "Not named yet. No résumés on file",
      "confirm",
    ),
    row(
      "ga-insurance",
      "General liability insurance before work starts",
      "§5.5",
      "$500,000",
      "General liability $1M per occurrence, on file",
      "have",
    ),
  ],
  warnings: limits(HERO_IDS.hero, []),
  deadline: { bondingLeadDays: 0, ppqTurnaroundDays: 5, subQuoteDays: 0, writingDays: 3 },
  questions: [],
};
}

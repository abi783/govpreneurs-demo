// DEMO: the contractor's hero, the HVAC and electrical upgrade at Building
// 2-4417: a USACE sealed bid set aside for HUBZone firms. Rows follow Grant's
// hand-written brief (members/construction/grantBriefs.ts, `compliance`), with
// Derrick's facts.
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
        "gb-hubzone",
        "Certified HUBZone small business when you bid",
        "00 21 00 ¶1.2",
        "HUBZone",
        "Certified by SBA on 2 Dec 2023. Recertification is due in 44 days",
        "have",
      ),
      row(
        "gb-size",
        "Small under the size standard for industry code 238220",
        "00 21 00 ¶1.2",
        "Small",
        "Small, as your registration says",
        "have",
      ),
      row(
        "gb-sam",
        "Active federal registration when you bid, and through award",
        "00 72 00 ¶1.2",
        "Active",
        active,
        "have",
      ),
      row(
        "gb-bonds",
        "Performance and payment bonds, each 100% of the price",
        "00 73 00 ¶1.1",
        "Bond room",
        "$730K on top of $2.9M in bonded work is $3.6M of your $4M limit. No written surety OK yet",
        "confirm",
      ),
      row(
        "gb-wages",
        "Davis-Bacon wage decision NC20260122",
        "00 72 00 ¶1.6",
        "Every class",
        "No HVAC mechanic class. Pipefitter is $33.96 plus $13.48 fringe; ask which class covers piping",
        "confirm",
      ),
      row(
        "gb-qc",
        "Quality control manager and site safety officer",
        "01 45 00",
        "Named",
        "Not named yet. Ava asks who",
        "missing",
      ),
    ],
    warnings: limits(HERO_IDS.hero, []),
    deadline: { bondingLeadDays: 5, ppqTurnaroundDays: 3, subQuoteDays: 7, writingDays: 1 },
    questions: [],
  };
}

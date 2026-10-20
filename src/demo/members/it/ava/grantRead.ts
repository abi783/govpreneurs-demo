// DEMO: the IT firm's hero, the Army Reserve headquarters help desk at Fort
// Bragg: a federal quote set aside for 8(a) firms. Rows follow Grant's
// hand-written brief (members/it/grantBriefs.ts, `compliance`), with Hector's
// facts.
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
        "gt-8a",
        "An 8(a) participant when you quote",
        "§1.2",
        "8(a)",
        "In the program since March 2021. The term ends March 2030",
        "have",
      ),
      row(
        "gt-size",
        "Small under the size standard for industry code 541519",
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
        "gt-secplus",
        "Security+ for every tech with admin rights, on day one",
        "PWS 5.1",
        "Every tech",
        "4 of the 6 have it. Book the other two exams this week",
        "confirm",
      ),
      row(
        "gt-lead",
        "Named Site Lead and Alternate",
        "PWS 4.2",
        "Named",
        "Not named yet. Ava asks who",
        "missing",
      ),
      row(
        "gt-wages",
        "Service Contract Act wage determination",
        "§5.6",
        "$37.50 plus $5.92",
        "Price every tech at or above the floor. You pay about $10 an hour less now",
        "confirm",
      ),
      row(
        "gt-cmmc",
        "CMMC Level 1 (Self) at award",
        "§5.7",
        "Level 1",
        "Affirmed in SPRS",
        "have",
      ),
      row(
        "gt-insurance",
        "General liability insurance before work starts",
        "§5.5",
        "$500,000",
        "General liability $1M per occurrence, on file",
        "have",
      ),
    ],
    warnings: limits(HERO_IDS.hero, []),
    deadline: { bondingLeadDays: 0, ppqTurnaroundDays: 3, subQuoteDays: 0, writingDays: 2 },
    questions: [],
  };
}

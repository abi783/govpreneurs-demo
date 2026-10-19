// DEMO: the janitorial firm's hero, pressure washing and sandblasting at Fort
// Bragg: an Army quote set aside for HUBZone firms. Rows follow Grant's
// hand-written brief (members/janitorial/grantBriefs.ts, `compliance`), with
// Reggie's facts.
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
        "gw-hubzone",
        "Certified HUBZone small business when you quote",
        "§1.2",
        "HUBZone",
        "Certified by SBA in 2023. Recertification is due in 38 days",
        "have",
      ),
      row(
        "gw-size",
        "Small under the size standard for industry code 561790",
        "§1.2",
        "Small",
        "Small, as your registration says",
        "have",
      ),
      row(
        "gw-sam",
        "Active federal registration when you quote, and through award",
        "§5.2",
        "Active",
        active,
        "have",
      ),
      row(
        "gw-wages",
        "Service Contract Act wage determination 2015-4377",
        "§5.6",
        "Every class",
        "General Maintenance Worker is $21.41 plus $5.92 health and welfare. Ask DPW which class it expects",
        "confirm",
      ),
      row(
        "gw-blast",
        "Sandblasting when the COR approves it, inside the square-foot price",
        "PWS 2.4",
        "Covered",
        "No blaster and no signed sub rate. Ask in Q&A how much was blasted last year",
        "missing",
      ),
      row(
        "gw-backup",
        "Backup equipment for 2-hour Priority 1 calls",
        "PWS 3.4",
        "Backup rig",
        "Two rigs, both often booked. Ava asks how you'll cover it",
        "confirm",
      ),
      row(
        "gw-people",
        "Named Project Manager and QC manager",
        "PWS 4.1",
        "Named",
        "No QC manager résumé on file. Ava asks who",
        "missing",
      ),
    ],
    warnings: limits(HERO_IDS.hero, []),
    deadline: { bondingLeadDays: 0, ppqTurnaroundDays: 5, subQuoteDays: 8, writingDays: 2 },
    questions: [],
  };
}

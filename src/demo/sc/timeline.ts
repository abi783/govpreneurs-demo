// DEMO: one history for the member. Every number is "days before the demo opens".
//
// Home, the Roadmap, Tasks, My Business and the Business Profile each show dates
// for the same events: when she joined, when the calls took place, when the SAM
// check passed. They read the numbers here, so no two pages give two dates for
// one event. The story fixes the other dates (persona.ts past jobs, workspace.ts
// mentor reviews).

import { byMember, own } from "../member";

const copy = own(
  import.meta.glob<typeof import("../members/agency/copy")>("/src/demo/members/*/copy.tsx", { eager: true }),
);

const HISTORY = byMember({
  // Amira: the Womack contract ended in 2024; her first mentor question was the Womack rating.
  caterer: { MEMBER_SINCE_DAYS: 220, ONBOARDING_CALL_DAYS_AGO: 218, COMPLIANCE_CALL_DAYS_AGO: 205, POSITIONING_CALL_DAYS_AGO: 150, SAM_CHECKED_DAYS_AGO: 183, FIRST_MENTOR_QUESTION_DAYS_AGO: 38 },
  // Dana: joined after the NC Guard campaign started; her first mentor question was the Guard rating.
  pack: copy.HISTORY,
});

/** She joined GovPreneurs this long ago. The Roadmap's first step started 2 days later. */
export const MEMBER_SINCE_DAYS = HISTORY.MEMBER_SINCE_DAYS;

/** The onboarding call with the program specialist. */
export const ONBOARDING_CALL_DAYS_AGO = HISTORY.ONBOARDING_CALL_DAYS_AGO;

/** The compliance call for the Digital Compliance step. */
export const COMPLIANCE_CALL_DAYS_AGO = HISTORY.COMPLIANCE_CALL_DAYS_AGO;

/** The positioning call with Diana Potts, where she set the targets. */
export const POSITIONING_CALL_DAYS_AGO = HISTORY.POSITIONING_CALL_DAYS_AGO;

/** SAM.gov was registered and checked this long ago. A SAM registration lasts one year, so it ends 182 days from now (persona.ts samActiveUntil). */
export const SAM_CHECKED_DAYS_AGO = HISTORY.SAM_CHECKED_DAYS_AGO;

/** Her first question to a mentor (a review in workspace.ts). It finished the Send to Mentor step. */
export const FIRST_MENTOR_QUESTION_DAYS_AGO = HISTORY.FIRST_MENTOR_QUESTION_DAYS_AGO;

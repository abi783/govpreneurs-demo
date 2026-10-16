// DEMO: one history for Amira. Every number is "days before the demo opens".
//
// Home, the Roadmap, Tasks, My Business and the Business Profile each show dates
// for the same events: when she joined, when the calls took place, when the SAM
// check passed. They read the numbers here, so no two pages give two dates for
// one event. The story fixes the other dates: the Womack contract ended in 2024
// (persona.ts), and the first mentor review was 38 days ago (workspace.ts).

/** She joined GovPreneurs 220 days ago. The Roadmap's first step started 2 days later. */
export const MEMBER_SINCE_DAYS = 220;

/** The onboarding call with the program specialist. */
export const ONBOARDING_CALL_DAYS_AGO = 218;

/** The compliance call for the Digital Compliance step. */
export const COMPLIANCE_CALL_DAYS_AGO = 205;

/** The positioning call with Sarah Mitchell, where she set the targets. */
export const POSITIONING_CALL_DAYS_AGO = 150;

/** SAM.gov was registered and checked this long ago. A SAM registration lasts one year, so it ends 182 days from now (persona.ts: 15 April 2027). */
export const SAM_CHECKED_DAYS_AGO = 183;

/** Her first question to a mentor: the Womack rating (rev-womack-closeout in workspace.ts). It finished the Send to Mentor step. */
export const FIRST_MENTOR_QUESTION_DAYS_AGO = 38;

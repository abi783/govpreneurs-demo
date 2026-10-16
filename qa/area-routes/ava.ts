// Deep routes owned by the ava agent. Append here, never in qa/routes.ts.
//
// The four bids Ava is building (each starts in a different state), the
// opportunities that show Ava's handoff (a federal notice she is reading, a
// school or county notice that needs the buyer's files, and the Fort Bragg
// dining notice that Grant sends to a team bid), Grant's No Bid (Ava asks for a
// reason first), and a number the story does not know.
export const ROUTES: string[] = [
  "/ava/SP4701-26-Q-0021", // Camp Mackall field meals: answer my questions
  "/ava/FAYNC-2026-R-08", // Fayetteville cafe: phase 2, Sarah's review is in
  "/ava/CUMCO-2026-014", // Cumberland detention meals: paused at check you can bid
  "/ava/W912EE-27-S-0004", // Fort Bragg sources-sought reply: ready to read and send
  "/ava/W912PM-26-Q-0017", // handoff, federal: Ava is reading the buyer's files
  "/ava/VA247-26-R-0112", // handoff, federal: Grant says Bid
  "/ava/W912EE-26-R-0066", // handoff: Grant says bid as a subcontractor
  "/ava/RCSC-2026-09", // handoff, school district: Ava needs the buyer's files
  "/ava/CCSC-2026-22", // handoff, school district: the county's own schools
  "/ava/NCNG-2026-21", // handoff, state: National Guard armory
  "/ava/SP4701-26-R-0078", // Grant says No Bid: Ava asks for a reason first
  "/ava/NOT-A-BID-123", // not found
];

// Deep routes owned by the ava agent. Append here, never in qa/routes.ts.
//
// The four bids Ava is building (each starts in a different state), two
// opportunities that show Ava's handoff (a federal notice she is reading, and a
// county notice that needs the buyer's files), and a number the story does not
// know.
export const ROUTES: string[] = [
  "/ava/SP4701-26-Q-0021", // Camp Mackall field meals: answer my questions
  "/ava/FAYNC-2026-R-08", // Fayetteville cafe: phase 2, Sarah's review is in
  "/ava/CUMCO-2026-014", // Cumberland detention meals: paused at check you can bid
  "/ava/W912EE-27-S-0004", // Fort Bragg sources-sought reply: ready to read and send
  "/ava/W912PM-26-Q-0017", // handoff, federal: Ava is reading the buyer's files
  "/ava/RCSC-2026-09", // handoff, state and local: Ava needs the buyer's files
  "/ava/NOT-A-BID-123", // not found
];

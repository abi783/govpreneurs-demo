/**
 * The roadmap sub-steps that are CALLS, by id. Its own module, with no
 * imports, so a client component can read it — `mentorMetrics.ts`, where it
 * used to live, imports the database. `mentorMetrics` re-exports it.
 */
export const CALL_STEP_IDS = {
  positioning: "cmounw15i004spq01mpv9g4va",
  targeting: "cmouo3goa004wpq01a5x5owg8",
  pipeline: "cmouo8py20058pq011vepxggd",
  digitalCompliance: "dc_call_2026_06_01",
} as const;
export type CallSectionKey = keyof typeof CALL_STEP_IDS;

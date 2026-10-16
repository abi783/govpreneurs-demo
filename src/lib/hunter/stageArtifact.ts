// The stage-card contract: the ONE artifact pinned above the opportunity feed.
//
// Types only. No behaviour, no React, no fetch — this is the entity layer, and
// both feature 13 (the shell) and feature 14 (the remaining artifacts) read it.
// The full contract, including where the mount sits and how "one at a time" is
// enforced, is ARCHITECTURE.md §3(d).
//
// Two rules the shape encodes:
//
//   1. An artifact carries a LIVE payload from `lib/hunterChat.ts` verbatim. The
//      stage never reshapes a payload and never invents a field. Where the
//      target does not carry a field the prototype renders, that section DROPS
//      OUT — it is never filled with placeholder copy.
//   2. One at a time is a property of the STORE, which holds a single nullable
//      value (see `lib/hunter/stageStore.tsx`, feature 13). There is no array,
//      no stack and no history: a capability that cannot hold two artifacts
//      cannot show two.

import type {
  ActPayload,
  ComparePayload,
  EligibilityPayload,
  MatchesPayload,
  ProfilePayload,
  ProfileUpdatePayload,
  WebResearchPayload,
} from "../hunterChat";

/**
 * One thing on the stage. `key` is a monotonic instance counter the store
 * assigns — it re-runs the reveal animation when the same question is asked
 * twice, and is never rendered.
 *
 * The mapping from `HunterTurnResponse.uiPayload.kind` is one-to-one:
 * `eligibility`→scorecard, `compare`→compare, `act`→checklist,
 * `matches`→matches, `web_research`→research, `profile`→profile,
 * `profile_update`→profileUpdate. The remaining
 * kinds (`discovery`, `switch_tab`, `save`, `reset`, `none`) change the FEED
 * and produce no artifact.
 */
export type StageArtifact =
  | { kind: "scorecard"; key: number; payload: EligibilityPayload }
  | { kind: "compare"; key: number; payload: ComparePayload }
  | { kind: "checklist"; key: number; payload: ActPayload }
  | { kind: "matches"; key: number; payload: MatchesPayload }
  | { kind: "research"; key: number; payload: WebResearchPayload }
  | { kind: "profile"; key: number; payload: ProfilePayload }
  | { kind: "profileUpdate"; key: number; payload: ProfileUpdatePayload };

/** What a caller passes to `showArtifact` — the store owns `key`. */
export type StageArtifactInput =
  | Omit<Extract<StageArtifact, { kind: "scorecard" }>, "key">
  | Omit<Extract<StageArtifact, { kind: "compare" }>, "key">
  | Omit<Extract<StageArtifact, { kind: "checklist" }>, "key">
  | Omit<Extract<StageArtifact, { kind: "matches" }>, "key">
  | Omit<Extract<StageArtifact, { kind: "research" }>, "key">
  | Omit<Extract<StageArtifact, { kind: "profile" }>, "key">
  | Omit<Extract<StageArtifact, { kind: "profileUpdate" }>, "key">;

/** The artifact kinds, for exhaustiveness checks and test fixtures. */
export type StageArtifactKind = StageArtifact["kind"];

/**
 * The scorecard's status dots. FOUR, not three: `EligibilityRow.status` is
 * four-valued and the fourth value is kept.
 *
 * Mapping `warn` and `neutral` both onto `confirm` would collapse "we checked
 * this and it is marginal" into "we have not checked this". That is the error
 * the repo CLAUDE.md names — empty is not verified-absent — and it is not one
 * worth repeating to save a CSS class.
 *
 *   pass    → have      you have it
 *   fail    → missing   you do not have it
 *   warn    → marginal  we checked; it is marginal
 *   neutral → confirm   we have not checked
 */
export type ScorecardDotStatus = "have" | "missing" | "marginal" | "confirm";

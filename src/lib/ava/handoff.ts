// The Grant → Ava handoff (concept §4): everything Grant learned carries into
// Ava, so building the bid never starts over. Grant's read is a starting point,
// not the requirement list — Ava reads every file itself.
//
// For an opportunity with no Ava bid yet, this is ALL Ava shows: what Grant
// found, the files it is reading, and when the Bid Brief will be ready. It does
// not pretend to have read what it has not.
//
// DEMO: Grant's read comes from the story (src/demo/ava/grantRead.ts), not from
// the prototype's Grant analysis.

import type { AvaOpportunity } from "../../demo/ava/opportunity";
import { grantFacts } from "../../demo/ava/grantFacts";
import { grantRead } from "../../demo/ava/grantRead";

export interface CarriedRequirement {
  text: string;
  /** Grant's status, in Ava's words. */
  status: "meets" | "not-yet" | "confirm";
  /** Where the buyer states it: "§1.2", or "Notice". */
  ref: string;
}

export interface GrantHandoff {
  /** "Bid" | "Review" | "No Bid". */
  call: string;
  rationale: string;
  requirements: CarriedRequirement[];
  /** The files the notice names, when the story knows them. */
  files: { name: string; size?: string }[];
}

const STATUS: Record<string, CarriedRequirement["status"]> = {
  have: "meets",
  missing: "not-yet",
  confirm: "confirm",
  unknown: "confirm",
};

export function grantHandoff(opp: AvaOpportunity): GrantHandoff {
  const read = grantRead(opp, grantFacts(opp.noticeId));
  return {
    call: read.call,
    rationale: opp.grantLine,
    requirements: read.rows.map((row) => ({
      text: row.requirement,
      status: STATUS[row.status] ?? "confirm",
      ref: row.ref,
    })),
    // The story lists no files for these notices. Ava says what she is reading
    // in words (the notice and its attachments), never a made-up file name.
    files: [],
  };
}

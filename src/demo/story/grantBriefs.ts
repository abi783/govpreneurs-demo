// THE STORY, part 3: what Grant says on the opportunities Tim will open.
//
// This is content, not the data shape. The Grant agent encodes each brief
// into production's `GrantAnalysis` (src/lib/grant/types.ts), field by field.
// DEMO: the briefs are per member (src/demo/members/<member>/grantBriefs.ts).
//
// Voice: Grant talks to the member as "you". Plain words. No promise of a win.

import { byMember } from "../member";
import * as agency from "../members/agency/grantBriefs";
import * as caterer from "../members/caterer/grantBriefs";

export type ReadName =
  | "Can you win it?"
  | "Is it your kind of work?"
  | "Does the size fit?"
  | "Can you perform there?"
  | "Will you make money?"
  | "Can you survive winning?"
  | "Can you do the work?"
  | "Do you understand the buyer's intent?"
  | "Does this move you forward?";

export interface GrantBrief {
  oppId: string;
  /** 1–5 confidence dots. */
  confidence: number;
  gist: string;
  thesis: string;
  reads: Record<ReadName, { rating: "strong" | "good" | "watch" | "weak"; text: string }>;
  limits: string[];
  wouldChange: string[];
  nextMove: { label: string; to: string; rationale: string };
  secondaryMove?: { label: string; to: string };
  compliance: { requirement: string; status: "have" | "partial" | "missing"; note: string }[];
  redTeam: { challenge: string; answer: string }[];
  keyDates: { label: string; inDays: number }[];
  railBriefing: [string, string, string];
  chips: string[];
  /** Scripted answers for the rail chips and likely typed questions. */
  railAnswers: Record<string, string>;
}

export const GRANT_BRIEFS: GrantBrief[] = byMember({ agency: agency.GRANT_BRIEFS, caterer: caterer.GRANT_BRIEFS });

/** DEMO: also finds the other member's briefs, so an Ava bid written for one member still loads (see opportunities.ts). */
export function getGrantBrief(oppId: string): GrantBrief | undefined {
  return (
    GRANT_BRIEFS.find((b) => b.oppId === oppId) ??
    byMember({ agency: caterer.GRANT_BRIEFS, caterer: agency.GRANT_BRIEFS }).find((b) => b.oppId === oppId)
  );
}

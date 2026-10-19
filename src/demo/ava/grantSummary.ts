// DEMO: a thin Grant summary for surfaces that only need the headline: the call
// and the reason. Both come from the story (see grantRead.ts).

import { grantFacts } from "./grantFacts";
import { grantRead } from "./grantRead";
import type { AvaOpportunity } from "./opportunity";

export interface GrantSummary {
  call: "Bid" | "Review" | "No Bid";
  rationale: string;
}

export function getGrantSummary(opp: AvaOpportunity): GrantSummary {
  const read = grantRead(opp, grantFacts(opp.noticeId));
  return { call: read.call, rationale: opp.grantLine };
}

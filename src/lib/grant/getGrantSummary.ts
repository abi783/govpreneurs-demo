// A thin verdict summary for surfaces that only need the headline (the pipeline's
// Send-to-Mentor modal). Keeps those callers off the full GrantAnalysis shape.

import type { Opportunity } from "../mock/opportunities";
import { getGrantAnalysis } from "./index";
import type { Verdict } from "./types";

export interface GrantSummary {
  call: string; // "Bid" | "Review" | "No Bid"
  rationale: string;
}

const CALL_WORD: Record<Verdict, string> = { bid: "Bid", review: "Review", "no-bid": "No Bid" };

export function getGrantSummary(opp: Opportunity): GrantSummary {
  const a = getGrantAnalysis(opp);
  const rationale = a.verdict.headline.map((ln) => ln.map((s) => s.text).join("")).join(" ");
  return { call: CALL_WORD[a.verdict.value], rationale };
}

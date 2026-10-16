// DEMO: the old six-field "Grant's Take" card.
//
// The demo session turns on Grant v2, so the page does not ask for this card. The
// answer still has to make sense, because the card's retry button would call it.
// It is built from the same analysis as the new page, so the two never disagree.

import type { GrantAnalysis } from "@/lib/grant/types";
import type { GrantFieldKey, GrantRecommendation, GrantStatus, GrantTake } from "@/lib/grantsTakeApi";
import { buildAnalysis } from "./analysis";
import { firstSentence, plain } from "./rich";

const statusOf = (a: GrantAnalysis, name: string): GrantStatus => {
  const r = a.reads.find((x) => x.name === name);
  if (!r) return "warn";
  return r.status === "strong" ? "good" : r.status === "mixed" || r.status === "unknown" ? "warn" : "bad";
};

const lineOf = (a: GrantAnalysis, name: string): string => firstSentence(plain(a.reads.find((x) => x.name === name)?.sentence ?? [])) || "Not enough detail yet.";

export function buildOldTake(oppKey: string): GrantTake | null {
  const a = buildAnalysis(oppKey);
  if (!a) return null;
  const rec: GrantRecommendation = a.verdict.value === "bid" ? "bid" : a.verdict.value === "review" ? "lean_bid" : "pass";
  const missing = a.complianceMatrix.filter((r) => r.status === "missing");
  const confirm = a.complianceMatrix.filter((r) => r.status === "confirm" || r.status === "unknown");
  const fields: Record<GrantFieldKey, { status: GrantStatus; line: string }> = {
    eligibility: {
      status: missing.length > 0 ? "bad" : confirm.length > 0 ? "warn" : "good",
      line: missing.length > 0 ? `${plain(missing[0].requirement)}: ${missing[0].firmValue}.` : confirm.length > 0 ? `${plain(confirm[0].requirement)}: ${confirm[0].firmValue}.` : "You meet every requirement I checked.",
    },
    scope_fit: { status: statusOf(a, "Is it your kind of work?"), line: lineOf(a, "Is it your kind of work?") },
    location: { status: statusOf(a, "Can you perform there?"), line: lineOf(a, "Can you perform there?") },
    contract_size: { status: statusOf(a, "Does the size fit?"), line: lineOf(a, "Does the size fit?") },
    proposal_readiness: { status: statusOf(a, "Can you do the work?"), line: lineOf(a, "Can you do the work?") },
    your_edge: { status: statusOf(a, "Can you win it?"), line: lineOf(a, "Can you win it?") },
  };
  return {
    oppKey,
    recommendation: rec,
    hunter_verdict: rec,
    verdict_summary: plain(a.verdict.gist),
    next_step: `${a.action.primary.label}.`,
    fields,
    data_completeness: "full",
  };
}

// DEMO: Grant's analysis of any opportunity in the story.
//
// A hand-written review (heroAnalyses.ts) when there is one, otherwise the story
// generator (generator.ts). The visitor's answers are applied on top (answers.ts).

import { getOpportunity } from "@/demo/story/opportunities";
import type { GrantAnalysis } from "@/lib/grant/types";
import { applyAnswers } from "./answers";
import { solicitationFor } from "./detail";
import { factsFor } from "./facts";
import { generateAnalysis } from "./generator";
import { heroAnalysis } from "./heroAnalyses";
import { getAnswers } from "./state";

/** The analysis before any answer. Same every time (apart from the clock). */
export function baseAnalysis(id: string): GrantAnalysis | null {
  const opp = getOpportunity(id);
  if (!opp) return null;
  const f = factsFor(opp);
  return heroAnalysis(f) ?? generateAnalysis(f, solicitationFor(f));
}

/** The analysis the page shows: the base, with the visitor's answers applied. */
export function buildAnalysis(id: string): GrantAnalysis | null {
  const base = baseAnalysis(id);
  return base ? applyAnswers(base, getAnswers(id)) : null;
}

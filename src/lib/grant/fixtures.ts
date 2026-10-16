// Grant's hand-written reviews, by opportunity id.
//
// DEMO: production's file here held fixtures about a different sample member (a
// roofing firm), with its own bond, its own incumbent and its own mentor. The demo's
// reviews are about Amira Haddad and agree with the story exactly. They live in
// src/demo/grant/ (the three that the story briefs, and three written there), and
// every other opportunity in the story gets a review built from the story's facts.

import { buildAnalysis } from "@/demo/grant/analysis";
import { OPPORTUNITIES } from "@/demo/story/opportunities";
import type { Opportunity } from "../mock/opportunities";
import type { GrantAnalysis } from "./types";

export const GRANT_FIXTURES: Record<string, (opp: Opportunity) => GrantAnalysis> = Object.fromEntries(
  OPPORTUNITIES.map((o) => [
    o.id,
    (opp: Opportunity): GrantAnalysis => {
      const a = buildAnalysis(opp.noticeId);
      if (!a) throw new Error(`No demo analysis for ${opp.noticeId}`);
      return a;
    },
  ]),
);

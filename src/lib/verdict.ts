import type { MatchTier } from "./mock/opportunities";

export type Verdict = "bid" | "lean" | "pass";

/**
 * Source of truth for the verdict: the backend tier, expressed here as the
 * frontend MatchTier it maps to (TIER_MAP in discoverMapper renames the backend
 * tier priority→strong, strong→good, stretch→stretch, low→longshot). Collapsed
 * to the three verdict buckets: priority|strong → bid, stretch → Review (lean),
 * low → No Bid (pass). The backend already classifies from the blended score, so
 * the frontend defers to it rather than re-deriving its own thresholds.
 */
const MATCH_TIER_TO_VERDICT: Record<MatchTier, Verdict> = {
  strong: "bid",
  good: "bid",
  stretch: "lean",
  longshot: "pass",
};

export function matchTierToVerdict(tier: MatchTier): Verdict {
  return MATCH_TIER_TO_VERDICT[tier];
}

/**
 * Fallback score → verdict classification (bid ≥ 65, lean ≥ 40, else pass) for
 * data that carries no backend tier (e.g. mock cards, or a detail record with a
 * null tier). Prefer the backend tier via matchTierToVerdict wherever available.
 */
export function scoreToVerdict(score: number): Verdict {
  if (score >= 65) return "bid";
  if (score >= 40) return "lean";
  return "pass";
}

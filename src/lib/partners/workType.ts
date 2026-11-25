/**
 * Work type — how much location matters, and when subs get picked.
 *
 * ⚠ PROTOTYPE STAND-IN FOR THE NAICS GOOGLE SHEET. Read `docs/partners/deltas-2026-08.md` §D0
 * before porting any of this.
 *
 * In production **none of this is new code.** The Sheet (owner: Karthik) already carries, per
 * NAICS: the proximity hierarchy, the nature-of-work definition used for matching, and the
 * weighting for whether work is physical or remote-friendly. All three are already scoring
 * opportunities today. Partner scoring **reads the same Sheet and calls the same
 * opportunity ↔ profile proximity scorer** — it does not get its own.
 *
 * The reason is correctness, not tidiness: the same company appears in Opportunities, Awards and
 * Partners. Two scorers means one company is described as a direct trade match on one screen and
 * an adjacent one on another, and neither number is defensible when a member asks which is right.
 *
 * This file exists only because the prototype has no Sheet connection and carries trade strings
 * rather than NAICS codes. It is deliberately tiny and deliberately keyed the wrong way, so nobody
 * mistakes it for the real asset.
 */

/** When a prime picks its subs. Drives the Awards recency weight (§D9). */
export type TeamingPoint = "pre_award" | "post_award" | "throughout";

export interface WorkType {
  /** Prototype key. **In production this is the NAICS code.** */
  key: string;
  /** Does the work happen in person? Gates G4 (§D2). From the Sheet. */
  deliveryIsPhysical: boolean;
  /**
   * How many of the 100 ranking points location earns, for this work type.
   * **From the Sheet — never guessed here.** The other eight signals normalise
   * around it (§D3): `weight(other) = base × (100 − geoWeight) / 100`.
   */
  geoWeight: number;
  /** §D5 — still missing from the Sheet. A mentor fills this in, not an engineer. */
  teamingPoint: TeamingPoint;
  /** Does a prime in this trade ask for a bond? Caps the member ceiling (§D1). */
  needsBonds: boolean;
}

/**
 * Two rows, exactly as `deltas-2026-08.md` §D5 prescribes: catering, because that is who we design
 * for, and construction, because that is where every assumption in the model came from. Reading
 * them side by side is the point — the same model has to serve both.
 */
const WORK_TYPES: WorkType[] = [
  {
    key: "food",
    deliveryIsPhysical: true,
    geoWeight: 22, // you cook near where people eat
    teamingPoint: "throughout",
    needsBonds: false,
  },
  {
    key: "construction",
    deliveryIsPhysical: true,
    geoWeight: 14,
    teamingPoint: "pre_award", // the sub team is locked before the award lands
    needsBonds: true,
  },
  {
    key: "it_cyber",
    deliveryIsPhysical: false,
    geoWeight: 0, // Ernie: capability alignment beats proximity, and this is why
    teamingPoint: "throughout",
    needsBonds: false,
  },
];

/** Used when we cannot tell. Mid-weight and gating, because guessing wrong toward
 *  "location does not matter" would show a member work she cannot physically reach. */
const FALLBACK: WorkType = {
  key: "other",
  deliveryIsPhysical: true,
  geoWeight: 14,
  teamingPoint: "throughout",
  needsBonds: false,
};

const MATCHERS: { pattern: RegExp; key: string }[] = [
  { pattern: /cater|food|meal|kitchen|culinary/i, key: "food" },
  {
    pattern: /roof|construct|build|renovat|envelope|concrete|electric|plumb/i,
    key: "construction",
  },
  { pattern: /\bit\b|cyber|software|network|cloud|data/i, key: "it_cyber" },
];

/**
 * Resolve a member's trades to their work type.
 *
 * PRODUCTION: this is a NAICS lookup against the Sheet, not a regex over free text. The regex
 * exists because the prototype's `MemberProfile.trades` is a list of strings.
 */
export function workTypeForTrades(trades: string[]): WorkType {
  const hay = trades.join(" ");
  for (const m of MATCHERS) {
    if (m.pattern.test(hay)) {
      return WORK_TYPES.find((w) => w.key === m.key) ?? FALLBACK;
    }
  }
  return FALLBACK;
}

/**
 * The nine signal weights for a work type (§D3). S3 comes from the Sheet; the rest normalise
 * around it, so the total is always 100 whatever the Sheet says.
 *
 * Base order follows Ernie's Q2 ranking for a member with little or no federal experience:
 * same trade → uses subs → relevant contract size → current activity → geographic presence.
 */
export const BASE_WEIGHTS = {
  S2: 26, // trade proximity — Ernie's #1, and it overtook bench strength
  S1: 22, // bench strength
  S4: 14, // accessibility — a vendor portal or a named liaison
  S9: 10, // size fit
  S6: 9, // momentum
  S8: 9, // vehicle position
  S5: 8, // set-aside pull
  S7: 2, // recompete runway
} as const;

export type SignalId = keyof typeof BASE_WEIGHTS | "S3";

export function weightsFor(work: WorkType): Record<SignalId, number> {
  const scale = (100 - work.geoWeight) / 100;
  const out = { S3: work.geoWeight } as Record<SignalId, number>;
  for (const [id, base] of Object.entries(BASE_WEIGHTS)) {
    out[id as SignalId] = Math.round(base * scale * 10) / 10;
  }
  return out;
}

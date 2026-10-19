// The sample partner record for Find partners, the company panel and the market strip.
//
// Every company is made up (firms.ts). Every reason is true of Amira Haddad
// (persona.ts): woman-owned, five staff, largest job $340K, Fayetteville NC, serves
// NC, VA and SC. Money, places and counts come from the award record in
// awardsData.ts, so a company file and an award never disagree.
//
// DEMO: two members. The caterer's partners are below; the agency's are in
// src/demo/members/agency/market/partners.ts. The functions are shared.

import { byMember } from "@/demo/member";
import { isoDaysFromNow } from "@/demo/story/clock";
import { calendarDay, daysToDay } from "./dates";
import { getOpportunity } from "@/demo/story/opportunities";
import { PAST_PERFORMANCE, findPastPerformance, PERSONA, KEY_PARTNER } from "@/demo/story/persona";
import { allAwardRecords, awardsWonBy, AWARD_SEEDS, buyerLabelOf } from "./awardsData";
import { PARTNERS as AGENCY_PARTNERS } from "@/demo/members/agency/market/partners";
import { anyFirmByKey, AMIRA_FIRM, CAROLINA_DINING, type Firm } from "./firms";
import type { AwardRecord } from "@/lib/awardsApi";
import type {
  MarketEvent,
  MarketSummary,
  PartnerBench,
  PartnerTier,
  PartnerVerdict,
  PipelineEntry,
  PrimeCandidate,
  RankReason,
} from "@/lib/partnersApi";
import { HERO_IDS as CATERER_HERO } from "@/demo/members/caterer/opportunities";

/** The states Amira serves (persona.ts). */
const MY_STATES = PERSONA.serviceStates as readonly string[];

type Breakdown = Record<string, number>;

export interface PartnerSpec {
  firm: Firm;
  tier: PartnerTier;
  verdict: PartnerVerdict;
  trade: PrimeCandidate["trade"];
  bench: PartnerBench;
  momentum: number | null;
  breakdown: Breakdown;
  /** Reasons that come from the member's own story. They go first, in this order. */
  storyReasons: RankReason[];
  flags: PrimeCandidate["flags"];
}
type Spec = PartnerSpec;

/** A company that is in Awards but fails a gate. Opened by key, never in the ranked feed. */
export interface NonCandidate {
  key: number;
  reasons: string[];
  trade: PrimeCandidate["trade"];
  bench: PartnerBench;
}

/** One member's partner record. */
export interface MemberPartners {
  /** The member's own trade, for her own company file. */
  tradeDirect: PrimeCandidate["trade"];
  /** The evidence line under "They buy the kind of work you do". */
  workEvidence: string;
  specs: PartnerSpec[];
  nonCandidates: NonCandidate[];
  /** What the member's own story signals (W…) mean in "why above the next". */
  signalLabels: Record<string, string>;
  /** The lane's totals for the market strip. */
  market: Pick<MarketSummary, "totalAwardedUsd12mo" | "awardCount12mo" | "medianAwardUsd">;
  initialPipeline: () => PipelineEntry[];
}

const TRADE_DIRECT: PrimeCandidate["trade"] = { proximity: "direct", naicsCodes: ["722310", "722320"] };

/** The pursuit Amira sees on the Pipeline board, to name days left. */
function fortBraggRfpDays(): number {
  return getOpportunity(CATERER_HERO.teamUp)?.closesInDays ?? 18;
}

const pastCdg = findPastPerformance("pp-cdg-sub")!;

const CATERER_SPECS: Spec[] = [
  {
    firm: CAROLINA_DINING,
    tier: "strong",
    verdict: "partner_play",
    trade: TRADE_DIRECT,
    bench: { distinctSubs: 7, repeatSubs: 3, trend: "growing" },
    momentum: 0.18,
    breakdown: { S1: 12, S2: 20, S3: 14, S5: 11, S7: 9, W1: 25, W2: 22 },
    storyReasons: [
      {
        signal: "W1",
        text: "You worked for them in 2024, as their 30% subcontractor at two Fort Bragg dining facilities.",
        evidence: `your past job: ${pastCdg.projectTitle}, $${Math.round(pastCdg.totalValue / 1000)}K, January to December 2024`,
      },
      {
        signal: "W2",
        text: `They hold Fort Bragg dining and the Army is bidding it again now. ${KEY_PARTNER.seeking}.`,
        evidence: `award record: Fort Bragg dining, 2019, all four option years used; open request ${CATERER_HERO.teamUp}`,
      },
    ],
    flags: [
      {
        id: "your_contact",
        text: `You know someone here: ${KEY_PARTNER.contact}, ${KEY_PARTNER.contactTitle}. He was your contact on the 2024 subcontract.`,
      },
      {
        id: "size_gap",
        text: "The Fort Bragg job is about $2M a year. That is above your range, so a team bid with them is the way in.",
      },
      {
        id: "recompete_due",
        text: `Proposals for the Fort Bragg dining recompete are due in ${fortBraggRfpDays()} days.`,
      },
    ],
  },
  {
    firm: anyFirmByKey(4002)!,
    tier: "strong",
    verdict: "partner_play",
    trade: TRADE_DIRECT,
    bench: { distinctSubs: 5, repeatSubs: 2, trend: "steady" },
    momentum: 0.1,
    breakdown: { S1: 9, S2: 20, S3: 14, S5: 9, S7: 8, W3: 12 },
    storyReasons: [
      {
        signal: "W3",
        text: "They run dining support at Camp Mackall, the same site as your field meals quote.",
        evidence: "award record: dining support services, Camp Mackall training site",
      },
    ],
    flags: [],
  },
  {
    firm: anyFirmByKey(4004)!,
    tier: "strong",
    verdict: "partner_play",
    trade: TRADE_DIRECT,
    bench: { distinctSubs: 4, repeatSubs: 2, trend: "steady" },
    momentum: 0.06,
    breakdown: { S1: 8, S2: 20, S3: 12, S5: 8, S7: 6, W4: 10 },
    storyReasons: [
      {
        signal: "W4",
        text: "They run dietary services at the Fayetteville VA Medical Center. The VA is one of your target buyers.",
        evidence: "award record: dietary services support, Fayetteville VA Medical Center",
      },
    ],
    flags: [],
  },
  {
    firm: anyFirmByKey(4007)!,
    tier: "good",
    verdict: "partner_play",
    trade: TRADE_DIRECT,
    bench: { distinctSubs: 6, repeatSubs: 2, trend: "growing" },
    momentum: 0.22,
    breakdown: { S1: 10, S2: 20, S3: 6, S5: 10, S7: 6 },
    storyReasons: [],
    flags: [],
  },
  {
    firm: anyFirmByKey(4005)!,
    tier: "good",
    verdict: "recompete_watch",
    trade: TRADE_DIRECT,
    bench: { distinctSubs: 3, repeatSubs: 1, trend: "steady" },
    momentum: -0.04,
    breakdown: { S1: 6, S2: 20, S3: 12, S5: 6, S7: 9 },
    storyReasons: [],
    flags: [],
  },
  {
    firm: anyFirmByKey(4003)!,
    tier: "good",
    verdict: "competitor",
    trade: { proximity: "direct", naicsCodes: ["722310", "722320"] },
    bench: { distinctSubs: 3, repeatSubs: 1, trend: "steady" },
    momentum: 0.12,
    breakdown: { S1: 6, S2: 20, S3: 10, S5: 5, S7: 8, W5: 6 },
    storyReasons: [
      {
        signal: "W5",
        text: "They hold the Pope Army Airfield ceremony catering job. Your saved quote for Pope is for the same work.",
        evidence: "award record: ceremony and official function catering, Pope Army Airfield",
      },
    ],
    flags: [
      {
        id: "same_set_aside",
        text: "They have won woman-owned set-aside jobs, the same kind you can bid. Expect them on the same bids.",
      },
    ],
  },
  {
    firm: anyFirmByKey(4009)!,
    tier: "good",
    verdict: "competitor",
    trade: TRADE_DIRECT,
    bench: { distinctSubs: 4, repeatSubs: 1, trend: "steady" },
    momentum: 0.05,
    breakdown: { S1: 8, S2: 20, S3: 8, S5: 7, S7: 6, W6: 6 },
    storyReasons: [
      {
        signal: "W6",
        text: "They won the Seymour Johnson lodging breakfast job that you bid on.",
        evidence: "award record: lodging breakfast service, Seymour Johnson AFB",
      },
    ],
    flags: [
      {
        id: "beat_you",
        text: "Their price was about 4% below yours on the lodging breakfast job. Look at how they price before you bid against them again.",
      },
    ],
  },
  {
    firm: anyFirmByKey(4006)!,
    tier: "stretch",
    verdict: "recompete_watch",
    trade: { proximity: "adjacent", naicsCodes: ["722310", "722514"] },
    bench: { distinctSubs: 2, repeatSubs: 0, trend: "unknown" },
    momentum: 0.0,
    breakdown: { S1: 4, S2: 14, S3: 6, S5: 5, S7: 6 },
    storyReasons: [],
    flags: [{ id: "F5", text: "They rarely work with the same firm twice." }],
  },
  {
    firm: anyFirmByKey(4010)!,
    tier: "stretch",
    verdict: "competitor",
    trade: TRADE_DIRECT,
    bench: { distinctSubs: 2, repeatSubs: 1, trend: "steady" },
    momentum: 0.02,
    breakdown: { S1: 4, S2: 20, S3: 12, S5: 4, S7: 9, W7: 4 },
    storyReasons: [
      {
        signal: "W7",
        text: "They hold the Hope Mills Armory drill weekend meals. The National Guard is asking for that work again now.",
        evidence: "award record: drill weekend meal service, Hope Mills Armory",
      },
    ],
    flags: [],
  },
  {
    firm: anyFirmByKey(4011)!,
    tier: "stretch",
    verdict: "recompete_watch",
    trade: TRADE_DIRECT,
    bench: { distinctSubs: 3, repeatSubs: 1, trend: "steady" },
    momentum: 0.03,
    breakdown: { S1: 6, S2: 20, S3: 4, S5: 5, S7: 8 },
    storyReasons: [],
    flags: [{ id: "far", text: "Their jobs are around Virginia Beach, about 230 miles from your kitchen." }],
  },
  {
    firm: anyFirmByKey(4008)!,
    tier: "stretch",
    verdict: "partner_play",
    trade: TRADE_DIRECT,
    bench: { distinctSubs: 9, repeatSubs: 4, trend: "growing" },
    momentum: 0.15,
    breakdown: { S1: 12, S2: 20, S3: 2, S5: 10, S7: 4 },
    storyReasons: [],
    flags: [{ id: "far", text: "Their biggest jobs are around Norfolk, about 220 miles from your kitchen." }],
  },
];

/** Companies that are in Awards but fail a gate. Opened by key, never in the ranked feed. */
const CATERER_NON_CANDIDATES: NonCandidate[] = [
  {
    key: 4101,
    reasons: ["We have no record of them hiring outside firms."],
    trade: { proximity: "tangential", naicsCodes: ["561210", "722310"] },
    bench: { distinctSubs: 0, repeatSubs: 0, trend: "unknown" },
  },
  {
    key: 4102,
    reasons: ["We have no record of them hiring outside firms."],
    trade: { proximity: "adjacent", naicsCodes: ["722310"] },
    bench: { distinctSubs: 0, repeatSubs: 0, trend: "unknown" },
  },
  {
    key: 4103,
    reasons: ["They have not won work in the last two years."],
    trade: TRADE_DIRECT,
    bench: { distinctSubs: 14, repeatSubs: 6, trend: "declining" },
  },
  {
    key: 4104,
    reasons: ["They have not won work in the last two years."],
    trade: { proximity: "adjacent", naicsCodes: ["722310"] },
    bench: { distinctSubs: 2, repeatSubs: 0, trend: "unknown" },
  },
];

/** The caterer's partner record, in the shape both members share. */
const CATERER: MemberPartners & { otherWorkEvidence: string } = {
  tradeDirect: TRADE_DIRECT,
  workEvidence: "their work: Food Service Contractors, Caterers",
  otherWorkEvidence: "their work: Food Service Contractors",
  specs: CATERER_SPECS,
  nonCandidates: CATERER_NON_CANDIDATES,
  signalLabels: {},
  // The lane is wider than the ten wins below, so the totals are set here.
  market: { totalAwardedUsd12mo: 41_800_000, awardCount12mo: 63, medianAwardUsd: 410_000 },
  initialPipeline: () => catererPipeline(),
};

const ACTIVE: MemberPartners & { otherWorkEvidence?: string } = byMember<MemberPartners & { otherWorkEvidence?: string }>({
  agency: AGENCY_PARTNERS,
  caterer: CATERER,
});
const SPECS = ACTIVE.specs;
const NON_CANDIDATES = ACTIVE.nonCandidates;

// ── Facts worked out from the award record ──────────────────────────────────

function titleCaseUpper(city: string): string {
  return city.toUpperCase();
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function geographyOf(awards: AwardRecord[], hq: Firm): PrimeCandidate["geography"] {
  const states = [...new Set(awards.map((a) => a.location.state).filter((s): s is string => !!s))];
  const inArea = awards.filter((a) => a.location.state && MY_STATES.includes(a.location.state)).length;
  const counts = new Map<string, number>();
  for (const a of awards) {
    if (a.location.city) counts.set(a.location.city, (counts.get(a.location.city) ?? 0) + 1);
  }
  const topCitiesByCount = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([city, count]) => ({ city: titleCaseUpper(city), count }));
  return {
    inStateAwardShare: awards.length ? inArea / awards.length : null,
    statesPerformed: states,
    topCitiesByCount,
    hqState: hq.state,
  };
}

function economicsOf(awards: AwardRecord[]): PrimeCandidate["economics"] {
  const values = awards.map((a) => a.obligated ?? 0);
  const ends = awards
    .map((a) => (a.recency.recompeteAt ? daysToDay(a.recency.recompeteAt) : null))
    .filter((d): d is number => d !== null && d > 0);
  const soonest = ends.length ? Math.min(...ends) : null;
  const offers = awards.map((a) => a.offersReceived).filter((o): o is number => o !== null);
  return {
    maxAwardUsd: Math.max(0, ...values),
    medianAwardUsd: median(values),
    totalAwardedUsd: values.reduce((s, v) => s + v, 0),
    awardCount: awards.length,
    momentum: null,
    recompeteMonthsOut: soonest === null ? null : Math.max(1, Math.round(soonest / 30.44)),
    numberOfOffersAvg: offers.length ? Math.round((offers.reduce((s, v) => s + v, 0) / offers.length) * 10) / 10 : null,
  };
}

function reasonsFor(spec: Spec, geo: PrimeCandidate["geography"], econ: PrimeCandidate["economics"]): RankReason[] {
  const out: RankReason[] = [...spec.storyReasons];
  const b = spec.bench;
  if (b.distinctSubs > 0) {
    out.push({
      signal: "S1",
      text: `They have hired at least ${b.distinctSubs} smaller ${b.distinctSubs === 1 ? "firm" : "firms"}${
        b.repeatSubs > 0 ? `, and went back to ${b.repeatSubs} of them more than once` : ""
      }.`,
      evidence: `${b.distinctSubs} distinct subcontractors on record`,
    });
  }
  const tradeText = {
    direct: "They buy the kind of work you do.",
    adjacent: "They buy work close to yours.",
    tangential: "They buy work a bit like yours.",
  }[spec.trade.proximity];
  out.push({ signal: "S2", text: tradeText, evidence: ACTIVE.workEvidence });
  const share = geo.inStateAwardShare;
  // A company that works far from her base gets no "near you" line.
  if (share !== null && share > 0 && !spec.flags.some((f) => f.id === "far")) {
    out.push({
      signal: "S3",
      text:
        share >= 0.8
          ? "Most of their jobs are near you."
          : share >= 0.4
            ? "A good share of their jobs are near you."
            : "Some of their jobs are near you.",
      evidence: `states worked: ${geo.statesPerformed.slice(0, 4).join(", ")}`,
    });
  }
  const m = econ.recompeteMonthsOut;
  if (m !== null && m <= 18) {
    out.push({
      signal: "S7",
      text:
        m <= 1
          ? "One of their jobs ends within a month, so they will be building a team again."
          : `One of their jobs ends in about ${m} months, so they will be building a team again.`,
      evidence: "period of performance end date",
    });
  }
  return out.sort((a, c) => (spec.breakdown[c.signal] ?? 0) - (spec.breakdown[a.signal] ?? 0));
}

function build(spec: Spec): PrimeCandidate {
  const awards = awardsWonBy(spec.firm.key);
  const far = spec.flags.some((f) => f.id === "far");
  const geography = far
    ? { ...geographyOf(awards, spec.firm), inStateAwardShare: null }
    : geographyOf(awards, spec.firm);
  const economics = { ...economicsOf(awards), momentum: spec.momentum };
  const score = Object.values(spec.breakdown).reduce((s, v) => s + v, 0);
  return {
    awardeeKey: spec.firm.key,
    uei: spec.firm.uei,
    name: spec.firm.name,
    cageCode: spec.firm.cage,
    website: null,
    isCandidate: true,
    gateFailureReasons: [],
    bench: spec.bench,
    trade: spec.trade,
    geography,
    economics,
    tier: spec.tier,
    verdict: spec.verdict,
    score,
    scoreBreakdown: spec.breakdown,
    reasons: reasonsFor(spec, geography, economics),
    flags: spec.flags,
    asOf: calendarDay(-1),
    whyAboveNext: null,
  };
}

/** The ranked feed, strongest first. Order is the order of SPECS. */
export function rankedPartners(): PrimeCandidate[] {
  return SPECS.map(build);
}

// ── Why one company ranks above the next (the production wording) ───────────

const CATERER_SIGNAL_LABEL: Record<string, string> = {
  S1: "they hire more small firms",
  S2: "they buy work closer to yours",
  S3: "more of their work is near you",
  S5: "they are more likely to need subs like you on big work",
  S6: "their federal work is growing faster",
  S7: "one of their jobs is ending sooner, so they will be building a team again sooner",
  W1: "you have already worked for them",
  W2: "they are bidding a job you can join right now",
  W3: "they work at the same base as your quote",
  W4: "they work with a buyer you target",
  W5: "they hold work you are quoting",
  W6: "they beat you on a job you bid",
  W7: "they hold work the buyer is asking for again",
};

/** The S labels are shared; each member names its own story signals (W…). */
const SIGNAL_LABEL: Record<string, string> = { ...CATERER_SIGNAL_LABEL, ...ACTIVE.signalLabels };

export function whyAboveNext(own: Breakdown, next: Breakdown | null): string | null {
  if (!next) return null;
  let best: string | null = null;
  let bestDelta = 0;
  for (const id of Object.keys(own)) {
    const delta = (own[id] ?? 0) - (next[id] ?? 0);
    if (delta > bestDelta) {
      bestDelta = delta;
      best = id;
    }
  }
  if (!best) return null;
  return `They rank above the next company because ${SIGNAL_LABEL[best] ?? "they fit better"}.`;
}

/** Drops hidden companies and works out the "why above the next" line for who is left. */
export function feedWithout(suppressed: readonly number[]): PrimeCandidate[] {
  const hidden = new Set(suppressed);
  const kept = rankedPartners().filter((c) => !hidden.has(c.awardeeKey));
  return kept.map((c, i) => ({ ...c, whyAboveNext: whyAboveNext(c.scoreBreakdown, kept[i + 1]?.scoreBreakdown ?? null) }));
}

/**
 * One company by key. A ranked company comes back whole. Another award winner comes
 * back as a company that failed a gate, with the reasons in plain words.
 */
export function companyByKey(key: number): { company: PrimeCandidate; inMatches: boolean } | null {
  const ranked = feedWithout([]).find((c) => c.awardeeKey === key);
  if (ranked) return { company: ranked, inMatches: true };

  const firm = anyFirmByKey(key);
  if (!firm) return null;
  const awards = awardsWonBy(key);
  const geography = geographyOf(awards, firm);
  const economics = economicsOf(awards);

  if (key === AMIRA_FIRM.key) {
    return {
      inMatches: false,
      company: {
        awardeeKey: key,
        uei: firm.uei,
        name: firm.name,
        cageCode: firm.cage,
        website: null,
        isCandidate: false,
        gateFailureReasons: ["This is your own company. You won this job."],
        bench: { distinctSubs: 0, repeatSubs: 0, trend: "unknown" },
        trade: ACTIVE.tradeDirect,
        geography,
        economics,
        tier: "stretch",
        verdict: "partner_play",
        score: 0,
        scoreBreakdown: {},
        reasons: [],
        flags: [],
        asOf: calendarDay(-1),
        whyAboveNext: null,
      },
    };
  }

  const spec = NON_CANDIDATES.find((n) => n.key === key);
  if (!spec) return null;
  return {
    inMatches: false,
    company: {
      awardeeKey: key,
      uei: firm.uei,
      name: firm.name,
      cageCode: firm.cage,
      website: null,
      isCandidate: false,
      gateFailureReasons: spec.reasons,
      bench: spec.bench,
      trade: spec.trade,
      geography,
      economics,
      tier: "stretch",
      verdict: "recompete_watch",
      score: 0,
      scoreBreakdown: {},
      reasons: [
        { signal: "S2", text: "They buy work close to yours.", evidence: ACTIVE.otherWorkEvidence ?? ACTIVE.workEvidence },
      ],
      flags: [],
      asOf: calendarDay(-1),
      whyAboveNext: null,
    },
  };
}

// ── The market strip ────────────────────────────────────────────────────────

const MY_TRADE_CODES = new Set<string>([PERSONA.primaryNaics, ...PERSONA.secondaryNaics.map((n) => n.code)]);

/** Totals for the lane, and the ten most recent wins near Amira. */
export function marketSummary(): MarketSummary {
  const near = allAwardRecords()
    .filter(
      (a) =>
        a.naicsCode !== null &&
        MY_TRADE_CODES.has(a.naicsCode) &&
        a.location.state !== null &&
        MY_STATES.includes(a.location.state) &&
        (a.recency.daysSinceAward ?? 9999) <= 730,
    )
    .sort((a, b) => (a.recency.daysSinceAward ?? 0) - (b.recency.daysSinceAward ?? 0));
  const events: MarketEvent[] = near.slice(0, 10).map((a) => {
    return {
      awardId: a.awardId,
      title: a.title,
      agency: buyerLabelOf(a) ?? a.agency.name,
      winner: { name: a.winner.name, awardeeKey: a.winner.awardeeKey },
      obligated: a.obligated,
      awardedAt: a.recency.awardedAt,
      city: a.location.city,
      state: a.location.state,
    };
  });
  return { ...ACTIVE.market, events, state: "ok" };
}

// ── The partner pipeline (My partners) ──────────────────────────────────────

/** Where the board starts: two companies the member has already looked at. */
export function initialPartnerPipeline(): PipelineEntry[] {
  return ACTIVE.initialPipeline();
}

/** The caterer's board: two companies Amira has already looked at. */
function catererPipeline(): PipelineEntry[] {
  const longleaf = anyFirmByKey(4002)!;
  const tarheel = anyFirmByKey(4004)!;
  return [
    {
      awardeeKey: longleaf.key,
      companyName: longleaf.name,
      stage: "researching",
      sourceTag: "from Find partners",
      savedAt: isoDaysFromNow(-6, 10),
      updatedAt: isoDaysFromNow(-2, 15),
    },
    {
      awardeeKey: tarheel.key,
      companyName: tarheel.name,
      stage: "saved",
      sourceTag: "from Find partners",
      savedAt: isoDaysFromNow(-4, 9),
      updatedAt: isoDaysFromNow(-4, 9),
    },
  ];
}

/** Used by tests: every award winner that Partners must be able to open. */
export function awardWinnerKeys(): number[] {
  return [...new Set(AWARD_SEEDS.map((s) => s.winner))];
}

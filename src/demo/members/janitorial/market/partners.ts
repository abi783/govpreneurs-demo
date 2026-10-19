// THE JANITORIAL FIRM's partner record for Find partners, the company panel and the
// market strip (read through src/demo/explore/partnersData.ts, which picks the active
// member).
//
// Every company is made up (firms.ts). Every reason is true of Reggie Tyndall
// (persona.ts, workspace.ts): HUBZone, 38 staff on night crews, Fayetteville NC, two
// hot-water rigs, Redtail's floor-care sub at two VA clinics in 2023–2024, and
// Ashepoo's capture manager wrote to him about the Army Reserve centers (the "Reply to
// Ashepoo" task). Money, places and counts come from the award record in awards.ts,
// so a company file and an award never disagree.
//
// The market strip: a yearly average of federal cleaning, grounds and building-service
// awards (NAICS 561720, 561730, 561790) with work in Cumberland, Hoke and Wayne
// counties, FY2023–FY2025: 112 awards, $204.0M, median $731K (USAspending
// spending_by_award, pulled 19 Oct 2026).

import { isoDaysFromNow } from "../../../story/clock";
import { getOpportunity } from "../../../story/opportunities";
import { KEY_PARTNER } from "../../../story/persona";
import { PLACES } from "../../../story/places";
import type { MemberPartners } from "../../../explore/partnersData";
import type { PrimeCandidate } from "@/lib/partnersApi";
import { HERO_IDS } from "../opportunities";
import { KEY_PARTNER_FIRM, OTHER_FIRMS } from "./firms";

const firm = (key: number) => OTHER_FIRMS.find((f) => f.key === key)!;

const TRADE_DIRECT: PrimeCandidate["trade"] = { proximity: "direct", naicsCodes: ["561720", "561790", "561730"] };

/** Days left to answer the Army Reserve sources sought (the story's team-up notice). */
function reserveReplyDays(): number {
  return getOpportunity(HERO_IDS.teamUp)?.closesInDays ?? 12;
}

export const PARTNERS: MemberPartners = {
  tradeDirect: TRADE_DIRECT,
  workEvidence: "their work: Janitorial Services, Landscaping and Other Services to Buildings",
  specs: [
    {
      firm: KEY_PARTNER_FIRM,
      tier: "strong",
      verdict: "partner_play",
      trade: { proximity: "direct", naicsCodes: ["561720", "561730"] },
      bench: { distinctSubs: 3, repeatSubs: 1, trend: "growing" },
      momentum: 0.16,
      breakdown: { S1: 10, S2: 20, S3: 14, S5: 12, S7: 8, W2: 14, W8: 22 },
      storyReasons: [
        {
          signal: "W8",
          text: `They wrote to you about the Army Reserve centers: they want ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}.`,
          evidence: "their message to you about the Army Reserve centers",
        },
        {
          signal: "W2",
          text: "They hold the Army Reserve cleaning and mowing contract the Corps is asking about again.",
          evidence: "award record: janitorial and grounds, 81st Readiness Division sites in NC and SC",
        },
      ],
      flags: [
        {
          id: "your_contact",
          text: `You know someone here: ${KEY_PARTNER.contact}, ${KEY_PARTNER.contactTitle}. He wrote to you about the Army Reserve centers.`,
        },
        {
          id: "set_aside",
          text: "The follow-on is expected to be for 8(a) firms. They are one and you are not, so their team is your way in.",
        },
        {
          id: "sub_limit",
          text: "As their sub, your share is capped at half the work (13 CFR 125.6).",
        },
        {
          id: "recompete_due",
          text: `Answers to the Corps' sources sought are due in ${reserveReplyDays()} days.`,
        },
      ],
    },
    {
      firm: firm(4002),
      tier: "strong",
      verdict: "partner_play",
      trade: { proximity: "direct", naicsCodes: ["561720"] },
      bench: { distinctSubs: 3, repeatSubs: 1, trend: "steady" },
      momentum: 0.1,
      breakdown: { S1: 9, S2: 20, S3: 16, S5: 9, S7: 8, W1: 25 },
      storyReasons: [
        {
          signal: "W1",
          text: "They hired you for floor care at two VA clinics in 2023–2024.",
          evidence: "your past job: floor care at two VA clinics, $61K",
        },
      ],
      flags: [
        {
          id: "set_aside",
          text: "They are service-disabled veteran-owned, so they can prime the VA's janitorial. Ask them for the floor care on the Durham job.",
        },
      ],
    },
    {
      firm: firm(4004),
      tier: "good",
      verdict: "partner_play",
      trade: { proximity: "direct", naicsCodes: ["561720"] },
      bench: { distinctSubs: 2, repeatSubs: 1, trend: "steady" },
      momentum: 0.06,
      breakdown: { S1: 8, S2: 20, S3: 8, S5: 8, S7: 6, W5: 10 },
      storyReasons: [
        {
          signal: "W5",
          text: "They clean the EPA campus in Research Triangle Park and subcontract part of it.",
          evidence: "award record: custodial support, EPA campus, RTP (21 bids)",
        },
      ],
      flags: [{ id: "far", text: `They are based in Charlotte, about ${PLACES.charlotte.milesFromBase} miles from your office. A local night crew is what they lack.` }],
    },
    {
      firm: firm(4003),
      tier: "good",
      verdict: "competitor",
      trade: { proximity: "direct", naicsCodes: ["561790"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "steady" },
      momentum: 0.08,
      breakdown: { S1: 8, S2: 20, S3: 18, S5: 8, S7: 9, W3: 12 },
      storyReasons: [
        {
          signal: "W3",
          text: "They hold Fort Bragg's pressure-washing contract, the job you are bidding now.",
          evidence: "award record: pressure washing and sandblasting, Fort Bragg, 2021–2026 (6 quotes)",
        },
      ],
      flags: [
        {
          id: "same_set_aside",
          text: "They are HUBZone too. Expect them to quote the Fort Bragg job, with five years of its workload behind them.",
        },
      ],
    },
    {
      firm: firm(4005),
      tier: "stretch",
      verdict: "competitor",
      trade: { proximity: "direct", naicsCodes: ["561720"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "steady" },
      momentum: 0.04,
      breakdown: { S1: 6, S2: 20, S3: 6, S5: 6, S7: 4, W4: 8 },
      storyReasons: [
        {
          signal: "W4",
          text: "They won the Jordan Lake custodial job you quoted, on price.",
          evidence: "award record: custodial and refuse service, Jordan Lake (30 quotes)",
        },
      ],
      flags: [{ id: "far", text: "They are based in Austell, Georgia, and quote Corps lake jobs across the Southeast." }],
    },
  ],
  nonCandidates: [
    {
      key: 4101,
      reasons: ["An AbilityOne nonprofit: it must do the work with its own workforce, so it does not hire subcontractors for it."],
      trade: { proximity: "direct", naicsCodes: ["561720", "561730"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "unknown" },
    },
    {
      key: 4102,
      reasons: ["Its work comes through a hospital-cleaning IDIQ you do not hold, and we have no record of it hiring local firms."],
      trade: { proximity: "direct", naicsCodes: ["561720"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "unknown" },
    },
  ],
  signalLabels: {
    W1: "they have hired you before",
    W2: "they hold work the buyer is asking about again",
    W3: "they hold the job you are bidding",
    W4: "they beat you on a job",
    W5: "they work at a place you target",
    W8: "they have already reached out to you",
  },
  market: { totalAwardedUsd12mo: 68_000_000, awardCount12mo: 37, medianAwardUsd: 731_000 },
  /** Where My partners starts: two companies Reggie has already looked at. */
  initialPipeline: () => [
    {
      awardeeKey: KEY_PARTNER_FIRM.key,
      companyName: KEY_PARTNER_FIRM.name,
      stage: "researching",
      sourceTag: "from Find partners",
      savedAt: isoDaysFromNow(-5, 10),
      updatedAt: isoDaysFromNow(-1, 15),
    },
    {
      awardeeKey: 4002,
      companyName: firm(4002).name,
      stage: "saved",
      sourceTag: "from Find partners",
      savedAt: isoDaysFromNow(-9, 9),
      updatedAt: isoDaysFromNow(-9, 9),
    },
  ],
};

// THE TRUCKING COMPANY's partner record for Find partners, the company panel and the
// market strip (read through src/demo/explore/partnersData.ts, which picks the active
// member).
//
// Every company is made up (firms.ts). Every reason is true of Tanya Merritt
// (persona.ts, workspace.ts): service-disabled veteran-owned and small, 15 people,
// box trucks, dry vans, one reefer and flatbeds in Fayetteville NC, her 2025–26 Fort
// Bragg trailer job, the VA chilled routes she lost by about 7%, and Brightwater's
// capture director wrote to her about Fort Bragg's logistics contract (the "Reply
// to Brightwater Sustainment" task). Money, places and counts come from the award
// record in awards.ts, so a company file and an award never disagree.
//
// The market strip: the pack has no trustworthy spend baseline for her codes
// (section 13), so the strip counts only this record's awards from the last year,
// her own job left out. It is a floor, not the market's size.

import { isoDaysFromNow } from "../../../story/clock";
import { getOpportunity } from "../../../story/opportunities";
import { KEY_PARTNER } from "../../../story/persona";
import { PLACES } from "../../../story/places";
import type { MemberPartners } from "../../../explore/partnersData";
import type { PrimeCandidate } from "@/lib/partnersApi";
import { HERO_IDS } from "../opportunities";
import { AWARD_SEEDS } from "./awards";
import { KEY_PARTNER_FIRM, MEMBER_FIRM, OTHER_FIRMS } from "./firms";

const firm = (key: number) => OTHER_FIRMS.find((f) => f.key === key)!;

const TRADE_DIRECT: PrimeCandidate["trade"] = { proximity: "direct", naicsCodes: ["484110", "484121", "484220"] };

/** Days left to comment on the Army's draft (the story's team-up notice). */
function draftDays(): number {
  return getOpportunity(HERO_IDS.teamUp)?.closesInDays ?? 28;
}

const lastYear = AWARD_SEEDS.filter((s) => (s.startedDaysAgo ?? 9_999) <= 365 && s.winner !== MEMBER_FIRM.key)
  .map((s) => s.obligated)
  .sort((a, b) => a - b);
const mid = Math.floor(lastYear.length / 2);
const median = lastYear.length % 2 ? lastYear[mid] : (lastYear[mid - 1] + lastYear[mid]) / 2;

export const PARTNERS: MemberPartners = {
  tradeDirect: TRADE_DIRECT,
  workEvidence: "their work: General Freight Trucking, Specialized Freight Trucking and Couriers",
  specs: [
    {
      firm: KEY_PARTNER_FIRM,
      tier: "strong",
      verdict: "partner_play",
      trade: { proximity: "adjacent", naicsCodes: ["561210"] },
      bench: { distinctSubs: 9, repeatSubs: 3, trend: "steady" },
      momentum: 0.16,
      breakdown: { S1: 10, S2: 14, S3: 16, S5: 12, S7: 8, W2: 20, W8: 22 },
      storyReasons: [
        {
          signal: "W8",
          text: `They wrote to you about Fort Bragg's logistics contract: they want ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}.`,
          evidence: "their message to you about Fort Bragg's logistics contract",
        },
        {
          signal: "W2",
          text: "They run Fort Bragg's motor pools, supply and transportation now, and the Army is writing the next contract.",
          evidence: "award record: Logistics Readiness Center task order, Fort Bragg, 2016 to 2027",
        },
      ],
      flags: [
        {
          id: "your_contact",
          text: `You know someone here: ${KEY_PARTNER.contact}, ${KEY_PARTNER.contactTitle}. He wrote to you about the logistics contract.`,
        },
        {
          id: "vehicle_holder",
          text: "Only holders of the Army's EAGLE agreement can bid the next contract. They hold one and you don't, so their team is your way in.",
        },
        {
          id: "size_gap",
          text: "Each year of it is about 20 times your revenue. Agree in writing which runs and trailer moves are yours before you sign.",
        },
        {
          id: "recompete_due",
          text: `Comments on the Army's draft are due in ${draftDays()} days.`,
        },
      ],
    },
    {
      firm: firm(4002),
      tier: "strong",
      verdict: "partner_play",
      trade: { proximity: "direct", naicsCodes: ["492110", "484110"] },
      bench: { distinctSubs: 2, repeatSubs: 1, trend: "growing" },
      momentum: 0.12,
      breakdown: { S1: 8, S2: 20, S3: 16, S5: 9, S7: 8, W5: 18 },
      storyReasons: [
        {
          signal: "W5",
          text: "They run the VA's courier and instrument routes around Durham and Raleigh, where the VA's linen runs need a second yard.",
          evidence: "award record: lab specimen courier and pharmacy courier, Durham VA; instrument transport, Garner clinic",
        },
      ],
      flags: [
        {
          id: "set_aside",
          text: "They are service-disabled veteran-owned too, so a team of the two of you still fits the VA's set-asides.",
        },
        {
          id: "near_target",
          text: `Based in Raleigh, about ${PLACES.raleigh.milesFromBase} miles from your yard: the Durham-side driver you don't have.`,
        },
      ],
    },
    {
      firm: firm(4005),
      tier: "good",
      verdict: "partner_play",
      trade: { proximity: "direct", naicsCodes: ["484220"] },
      bench: { distinctSubs: 1, repeatSubs: 0, trend: "steady" },
      momentum: 0.06,
      breakdown: { S1: 8, S2: 20, S3: 12, S5: 7, S7: 6, W4: 12 },
      storyReasons: [
        {
          signal: "W4",
          text: "They haul trailers off Fort Bragg for the 18th Airborne Corps, the same office your job was for.",
          evidence: "award record: trailer removal, 18th Airborne Corps, Fort Bragg (5 offers)",
        },
      ],
      flags: [
        {
          id: "spare_truck",
          text: `Based in Sanford, about ${PLACES.sanford.milesFromBase} miles away. A spare truck and driver when two Fort Bragg jobs land in the same week.`,
        },
      ],
    },
    {
      firm: firm(4006),
      tier: "good",
      verdict: "partner_play",
      trade: { proximity: "direct", naicsCodes: ["484220"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "steady" },
      momentum: 0.05,
      breakdown: { S1: 6, S2: 20, S3: 10, S5: 6, S7: 5, W5: 8 },
      storyReasons: [
        {
          signal: "W5",
          text: "They delivered last year's gravel to the Mattamuskeet refuge, priced by the ton, with their own dump trailers.",
          evidence: "award record: gravel delivered to Mattamuskeet National Wildlife Refuge",
        },
      ],
      flags: [
        {
          id: "dump_trailers",
          text: "You'd have to rent a dump trailer for the refuge job. They own them; ask about running it together.",
        },
      ],
    },
    {
      firm: firm(4004),
      tier: "good",
      verdict: "competitor",
      trade: { proximity: "direct", naicsCodes: ["484220", "484121"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "steady" },
      momentum: 0.1,
      breakdown: { S1: 4, S2: 20, S3: 14, S5: 8, S7: 9, W6: 14 },
      storyReasons: [
        {
          signal: "W6",
          text: "They beat you on the VA's chilled freight routes this month, by about 7% on price, and kept the work they already had.",
          evidence: "award record: chilled freight routes, Hampton VA to eight VISN 6 sites, 2026",
        },
      ],
      flags: [
        {
          id: "same_set_aside",
          text: "They are service-disabled veteran-owned too. Expect them on the Fayetteville VA supply runs.",
        },
      ],
    },
    {
      firm: firm(4003),
      tier: "good",
      verdict: "competitor",
      trade: { proximity: "direct", naicsCodes: ["484220", "484121"] },
      bench: { distinctSubs: 2, repeatSubs: 1, trend: "steady" },
      momentum: 0.08,
      breakdown: { S1: 6, S2: 20, S3: 12, S5: 7, S7: 7, W2: 12 },
      storyReasons: [
        {
          signal: "W2",
          text: "They held Camp Lejeune's on-call trailer transport for four years, and the base is taking quotes for the next one now.",
          evidence: "award record: on-call trailer transport, Marine Corps Base Camp Lejeune, 2022–2026 (5 offers)",
        },
      ],
      flags: [
        {
          id: "incumbent",
          text: `They are the incumbent, based in Wilmington, about ${PLACES.wilmington.milesFromBase} miles from your yard. Price your empty miles to the base.`,
        },
      ],
    },
  ],
  nonCandidates: [
    {
      key: 4101,
      reasons: ["We have no record of them hiring outside carriers."],
      trade: { proximity: "direct", naicsCodes: ["492110"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "unknown" },
    },
    {
      key: 4102,
      reasons: ["They win nationwide grocery delivery and run their own fleet; we have no record of them hiring local carriers."],
      trade: { proximity: "adjacent", naicsCodes: ["484121"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "unknown" },
    },
    {
      key: 4103,
      reasons: ["They have not won work near Fort Bragg in the last two years."],
      trade: { proximity: "adjacent", naicsCodes: ["484210"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "unknown" },
    },
  ],
  signalLabels: {
    W2: "they hold work the buyer is asking about again",
    W4: "they work for a buyer you have delivered for",
    W5: "they work at a place you target",
    W6: "they beat you on a job you bid",
    W8: "they have already reached out to you",
  },
  market: { totalAwardedUsd12mo: lastYear.reduce((s, v) => s + v, 0), awardCount12mo: lastYear.length, medianAwardUsd: Math.round(median) },
  /** Where My partners starts: two companies Tanya has already looked at. */
  initialPipeline: () => [
    {
      awardeeKey: 4002,
      companyName: firm(4002).name,
      stage: "researching",
      sourceTag: "from Find partners",
      savedAt: isoDaysFromNow(-6, 10),
      updatedAt: isoDaysFromNow(-2, 15),
    },
    {
      awardeeKey: 4005,
      companyName: firm(4005).name,
      stage: "saved",
      sourceTag: "from Find partners",
      savedAt: isoDaysFromNow(-4, 9),
      updatedAt: isoDaysFromNow(-4, 9),
    },
  ],
};

// THE CONSULTANT's partner record for Find partners, the company panel and the market
// strip (read through src/demo/explore/partnersData.ts, which picks the active member).
//
// Every company is made up (firms.ts). Every reason is true of Simone Strayhorn
// (persona.ts, workspace.ts): service-disabled veteran-owned, 11 staff and 7 contract
// facilitators in Fayetteville NC, no GSA schedule, Halyard Point Human Capital's
// subcontractor for the Southeast family readiness classes in 2023–2025, and Halyard
// Point's capture director wrote to her about the Army training (the "Reply to
// Halyard Point" task). Money, places and counts come from the award record in
// awards.ts, so a company file and an award never disagree.
//
// The market strip: the count and the total are a yearly average of the pack's
// FY2023–FY2025 obligations in her four codes with work in NC, for MICC Fort Bragg,
// USASOC, VA NCO 6 and ACC–RI (202 actions, $56.7M over three years; USAspending,
// pulled 19 Oct 2026; consulting-pack.md section 13). The pack has no median, so the
// median is this file's award record.

import { isoDaysFromNow } from "../../../story/clock";
import { getOpportunity } from "../../../story/opportunities";
import { findPastPerformance, KEY_PARTNER } from "../../../story/persona";
import type { MemberPartners } from "../../../explore/partnersData";
import type { PrimeCandidate } from "@/lib/partnersApi";
import { HERO_IDS } from "../opportunities";
import { KEY_PARTNER_FIRM, OTHER_FIRMS } from "./firms";

const firm = (key: number) => OTHER_FIRMS.find((f) => f.key === key)!;

const TRADE_DIRECT: PrimeCandidate["trade"] = { proximity: "direct", naicsCodes: ["541611", "541612", "611430", "541618"] };

/** Days left to reply to the Army's sources sought (the story's team-up notice). */
function armyReplyDays(): number {
  return getOpportunity(HERO_IDS.teamUp)?.closesInDays ?? 21;
}

const halyardSub = findPastPerformance("pp-halyard-family-readiness")!;

export const PARTNERS: MemberPartners = {
  tradeDirect: TRADE_DIRECT,
  workEvidence: "their work: Management Consulting, Human Resources Consulting and Management Training",
  specs: [
    {
      firm: KEY_PARTNER_FIRM,
      tier: "strong",
      verdict: "partner_play",
      trade: { proximity: "direct", naicsCodes: ["541612", "611430"] },
      bench: { distinctSubs: 5, repeatSubs: 2, trend: "growing" },
      momentum: 0.17,
      breakdown: { S1: 10, S2: 20, S3: 14, S5: 11, S7: 8, W1: 25, W8: 22 },
      storyReasons: [
        {
          signal: "W8",
          text: `They wrote to you about the Army's family readiness training: they want ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}.`,
          evidence: "their message to you about the Army training",
        },
        {
          signal: "W1",
          text: "You taught the Southeast virtual classes as their subcontractor in 2023–2025.",
          evidence: `your past job: ${halyardSub.projectTitle}, $${Math.round(halyardSub.totalValue / 1000)}K`,
        },
      ],
      flags: [
        {
          id: "your_contact",
          text: `You know someone here: ${KEY_PARTNER.contact}, ${KEY_PARTNER.contactTitle}. He wrote to you about the Army training.`,
        },
        {
          id: "vehicle_holder",
          text: "They hold the Army's HR Solutions contract. Only its holders can bid the next order, so their team is your way in.",
        },
        {
          id: "recompete_due",
          text: `Replies to the Army's sources sought are due in ${armyReplyDays()} days.`,
        },
      ],
    },
    {
      firm: firm(4002),
      tier: "strong",
      verdict: "partner_play",
      trade: { proximity: "direct", naicsCodes: ["541611", "541612"] },
      bench: { distinctSubs: 2, repeatSubs: 1, trend: "steady" },
      momentum: 0.1,
      breakdown: { S1: 9, S2: 20, S3: 12, S5: 10, S7: 7, W2: 20 },
      storyReasons: [
        {
          signal: "W2",
          text: "They hold Fort Bragg's manpower support and the VA network's HR support, both GSA schedule orders that come up again within a year.",
          evidence: "award record: manpower support, Fort Bragg; HR support services, VISN 6",
        },
      ],
      flags: [
        {
          id: "gsa_holder",
          text: "They are on a GSA schedule and you are not. Subcontracting to them is the only way into schedule-only orders until yours is approved.",
        },
      ],
    },
    {
      firm: firm(4003),
      tier: "strong",
      verdict: "partner_play",
      trade: { proximity: "direct", naicsCodes: ["541611"] },
      bench: { distinctSubs: 3, repeatSubs: 1, trend: "steady" },
      momentum: 0.08,
      breakdown: { S1: 8, S2: 20, S3: 12, S5: 9, S7: 6, W5: 14 },
      storyReasons: [
        {
          signal: "W5",
          text: "They support the Army Reserve's headquarters at Fort Bragg, where the analyst contract you asked Sarah about will be.",
          evidence: "award record: Army Reserve sustainment-reporting support, Fort Bragg",
        },
      ],
      flags: [
        {
          id: "teaming",
          text: "A Raleigh firm on a GSA schedule. A team with them could cover the Reserve analyst work, which is about 60% of your yearly revenue.",
        },
      ],
    },
    {
      firm: firm(4005),
      tier: "good",
      verdict: "competitor",
      trade: { proximity: "direct", naicsCodes: ["611430"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "steady" },
      momentum: 0.12,
      breakdown: { S1: 8, S2: 20, S3: 14, S5: 8, S7: 8, W3: 12 },
      storyReasons: [
        {
          signal: "W3",
          text: "They ran the Fayetteville VA's last leadership program, the work in your quote.",
          evidence: "award record: leadership training, Fayetteville VA, 2022–2025",
        },
      ],
      flags: [
        {
          id: "same_set_aside",
          text: "They are service-disabled veteran-owned too. Expect them on the VA supervisor program.",
        },
      ],
    },
    {
      firm: firm(4004),
      tier: "good",
      verdict: "competitor",
      trade: { proximity: "direct", naicsCodes: ["611430", "541611"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "steady" },
      momentum: 0.09,
      breakdown: { S1: 7, S2: 20, S3: 10, S5: 8, S7: 7, W4: 12 },
      storyReasons: [
        {
          signal: "W4",
          text: "They run Family Advocacy support for Army Community Service at Fort Bragg, the office you delivered for.",
          evidence: "award record: Family Advocacy Program support, Fort Bragg (11 offers)",
        },
      ],
      flags: [
        {
          id: "eight_a",
          text: "They are service-disabled veteran-owned and in the 8(a) program, and based in Fayetteville too. Expect them on Fort Bragg family-program quotes.",
        },
      ],
    },
  ],
  nonCandidates: [
    {
      key: 4101,
      reasons: ["A large firm. Its VA orders come off a GSA schedule, and we have no record of it hiring small firms."],
      trade: { proximity: "direct", naicsCodes: ["541611"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "unknown" },
    },
  ],
  signalLabels: {
    W1: "they have hired you before",
    W2: "they hold work the buyer is asking about again",
    W3: "they held the same work as your quote",
    W4: "they work for a buyer you have delivered for",
    W5: "they work at a place you target",
    W8: "they have already reached out to you",
  },
  market: { totalAwardedUsd12mo: 18_900_000, awardCount12mo: 67, medianAwardUsd: 691_000 },
  /** Where My partners starts: two companies Simone has already looked at. */
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
      awardeeKey: 4003,
      companyName: firm(4003).name,
      stage: "saved",
      sourceTag: "from Find partners",
      savedAt: isoDaysFromNow(-4, 9),
      updatedAt: isoDaysFromNow(-4, 9),
    },
  ],
};

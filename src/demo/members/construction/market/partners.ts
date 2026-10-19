// THE CONTRACTOR's partner record for Find partners, the company panel and the market
// strip (read through src/demo/explore/partnersData.ts, which picks the active member).
//
// Every company is made up (firms.ts). Every reason is true of Derrick Faircloth
// (persona.ts, workspace.ts): HUBZone, 25 staff in two electrical and two HVAC crews,
// Fayetteville NC, bonded to $1.5M a job, Turnrow Federal's electrical sub in
// 2024–2025, and Blackjack Oak's capture director wrote to him about the VA fan coils
// (the "Reply to Blackjack Oak" task). Money, places and counts come from the award
// record in awards.ts, so a company file and an award never disagree.
//
// The market strip: the count and the total are a yearly average of the pack's
// FY2023–FY2025 construction awards with work in Cumberland or Hoke County (371
// awards, $369.6M over three years; USAspending, pulled 19 Oct 2026; construction-pack.md
// section 13). The pack has no median, so the median is this file's award record.

import { isoDaysFromNow } from "../../../story/clock";
import { getOpportunity } from "../../../story/opportunities";
import { KEY_PARTNER, PERSONA } from "../../../story/persona";
import { PLACES } from "../../../story/places";
import type { MemberPartners } from "../../../explore/partnersData";
import type { PrimeCandidate } from "@/lib/partnersApi";
import { HERO_IDS } from "../opportunities";
import { KEY_PARTNER_FIRM, OTHER_FIRMS } from "./firms";

const firm = (key: number) => OTHER_FIRMS.find((f) => f.key === key)!;

const TRADE_DIRECT: PrimeCandidate["trade"] = { proximity: "direct", naicsCodes: ["236220", "238220", "238210"] };

/** Days left to reply to the VA's sources sought (the story's team-up notice). */
function vaReplyDays(): number {
  return getOpportunity(HERO_IDS.teamUp)?.closesInDays ?? 14;
}

const singleBond = `$${((PERSONA.bondLine?.single ?? 0) / 1_000_000).toFixed(1)}M`;

export const PARTNERS: MemberPartners = {
  tradeDirect: TRADE_DIRECT,
  workEvidence: "their work: Commercial and Institutional Building Construction, Electrical and HVAC Contractors",
  specs: [
    {
      firm: KEY_PARTNER_FIRM,
      tier: "strong",
      verdict: "partner_play",
      trade: { proximity: "direct", naicsCodes: ["236220"] },
      bench: { distinctSubs: 7, repeatSubs: 2, trend: "growing" },
      momentum: 0.18,
      breakdown: { S1: 10, S2: 20, S3: 14, S5: 12, S7: 8, W5: 14, W8: 22 },
      storyReasons: [
        {
          signal: "W8",
          text: `They wrote to you about the Fayetteville VA fan coils: they want ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}.`,
          evidence: "their message to you about the VA fan coils",
        },
        {
          signal: "W5",
          text: "They are rewiring the Fayetteville VA for its new health-record system now, so they know the building and its staff.",
          evidence: "award record: health-record infrastructure upgrades, Fayetteville VA Medical Center",
        },
      ],
      flags: [
        {
          id: "your_contact",
          text: `You know someone here: ${KEY_PARTNER.contact}, ${KEY_PARTNER.contactTitle}. He wrote to you about the fan coils.`,
        },
        {
          id: "set_aside",
          text: "The fan coil job is expected to be set aside for service-disabled veteran-owned firms. They are one and you are not, so their team is your way in.",
        },
        {
          id: "size_gap",
          text: `At $3.2M–$4.4M it is more than twice your ${singleBond} single bond. Agree on sub bonds before you sign.`,
        },
        {
          id: "recompete_due",
          text: `Replies to the VA's sources sought are due in ${vaReplyDays()} days.`,
        },
      ],
    },
    {
      firm: firm(4002),
      tier: "strong",
      verdict: "partner_play",
      trade: { proximity: "direct", naicsCodes: ["236220", "238220"] },
      bench: { distinctSubs: 6, repeatSubs: 2, trend: "steady" },
      momentum: 0.11,
      breakdown: { S1: 9, S2: 20, S3: 16, S5: 9, S7: 8, W1: 25 },
      storyReasons: [
        {
          signal: "W1",
          text: "They hired you as their electrical subcontractor on a Fort Bragg barracks HVAC job in 2024–2025.",
          evidence: "your past job: barracks HVAC job at Fort Bragg, the electrical scope, $412K",
        },
      ],
      flags: [
        {
          id: "matoc_holder",
          text: "They hold Fort Bragg's Vertical Construction MATOC. The barracks HVAC repair is only for its holders, so price the HVAC for them.",
        },
      ],
    },
    {
      firm: firm(4005),
      tier: "strong",
      verdict: "partner_play",
      trade: { proximity: "direct", naicsCodes: ["236220", "238220", "238210"] },
      bench: { distinctSubs: 5, repeatSubs: 2, trend: "steady" },
      momentum: 0.09,
      breakdown: { S1: 10, S2: 20, S3: 14, S5: 9, S7: 7, W2: 20 },
      storyReasons: [
        {
          signal: "W2",
          text: "They did the fan coils on the VA's 3rd floor, the job the VA is asking about again for floors 2 and 4.",
          evidence: "award record: fan coil units, Building 1, 3rd floor, Fayetteville VA, 2023–2025",
        },
      ],
      flags: [
        {
          id: "set_aside",
          text: "They are service-disabled veteran-owned, so they can prime the fan coils too. A second prime to talk to.",
        },
      ],
    },
    {
      firm: firm(4004),
      tier: "good",
      verdict: "partner_play",
      trade: { proximity: "adjacent", naicsCodes: ["236220"] },
      bench: { distinctSubs: 4, repeatSubs: 1, trend: "steady" },
      momentum: 0.07,
      breakdown: { S1: 8, S2: 14, S3: 16, S5: 8, S7: 6, W4: 12 },
      storyReasons: [
        {
          signal: "W4",
          text: "They do small repairs at Pope too, the buyer you delivered for.",
          evidence: "award record: electrical and bathroom repair, Pope Army Airfield",
        },
      ],
      flags: [
        {
          id: "eight_a",
          text: "They are in the 8(a) program, so their sole-source jobs never post. Ask them for the electrical and HVAC work instead.",
        },
      ],
    },
    {
      firm: firm(4003),
      tier: "good",
      verdict: "competitor",
      trade: { proximity: "direct", naicsCodes: ["238220", "238210"] },
      bench: { distinctSubs: 3, repeatSubs: 1, trend: "steady" },
      momentum: 0.12,
      breakdown: { S1: 8, S2: 20, S3: 16, S5: 8, S7: 9, W3: 10 },
      storyReasons: [
        {
          signal: "W3",
          text: "They won a HUBZone HVAC replacement at a Fort Bragg Special Operations building, the same kind of job as your training building bid.",
          evidence: "award record: HVAC replacement, Special Operations building, Fort Bragg (9 bids)",
        },
      ],
      flags: [
        {
          id: "same_set_aside",
          text: "They are HUBZone too. Expect them on the training building bid.",
        },
        {
          id: "matoc_holder",
          text: "They hold the Minor Construction MATOC you want to join.",
        },
      ],
    },
    {
      firm: firm(4006),
      tier: "stretch",
      verdict: "partner_play",
      trade: { proximity: "direct", naicsCodes: ["236220"] },
      bench: { distinctSubs: 8, repeatSubs: 2, trend: "steady" },
      momentum: 0.05,
      breakdown: { S1: 6, S2: 20, S3: 4, S5: 6, S7: 4, W5: 8 },
      storyReasons: [
        {
          signal: "W5",
          text: "They hold USACE Savannah's $24M barracks repair at Fort Bragg and subcontract the electrical and HVAC work.",
          evidence: "award record: barracks repair, Fort Bragg, USACE Savannah",
        },
      ],
      flags: [{ id: "far", text: `They are based in Virginia Beach, about ${PLACES.virginiaBeach.milesFromBase} miles from your shop.` }],
    },
  ],
  nonCandidates: [],
  signalLabels: {
    W1: "they have hired you before",
    W2: "they hold work the buyer is asking about again",
    W3: "they won the same kind of job you are bidding",
    W4: "they work for a buyer you have delivered for",
    W5: "they work at a place you target",
    W8: "they have already reached out to you",
  },
  market: { totalAwardedUsd12mo: 123_200_000, awardCount12mo: 124, medianAwardUsd: 683_000 },
  /** Where My partners starts: two companies Derrick has already looked at. */
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

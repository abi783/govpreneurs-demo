// THE IT SERVICES FIRM's partner record for Find partners, the company panel and the
// market strip (read through src/demo/explore/partnersData.ts, which picks the active
// member).
//
// Every company is made up (firms.ts). Every reason is true of Hector Salinas
// (persona.ts, workspace.ts): 8(a), 16 staff, Fayetteville NC, no seat on ITES-3S or
// 8(a) STARS III, cabling sent to a sub, 9 open CMMC items, lost the Windows 11 surge
// on price to Kettle Creek, and Brackwater's capture director wrote to him about the
// Army hospital's IT (the "Reply to Brackwater" task). Money, places and counts come
// from the award record in awards.ts, so a company file and an award never disagree.
//
// The market strip: federal IT obligations in FY2025 (NAICS 541512, 541519, 541513,
// 518210, 541511) with the work in Cumberland, Hoke or Wayne County, NC (Fort Bragg,
// Pope and Seymour Johnson): 293 contracts received new money, $177.4M in all
// (USAspending, pulled 19 Oct 2026). The search gives no median, so the median is
// this file's award record (20 awards, $2.4M).
// https://api.usaspending.gov/api/v2/search/spending_over_time/
// https://api.usaspending.gov/api/v2/search/spending_by_award_count/

import { isoDaysFromNow } from "../../../story/clock";
import { getOpportunity } from "../../../story/opportunities";
import { KEY_PARTNER } from "../../../story/persona";
import { PLACES } from "../../../story/places";
import type { MemberPartners } from "../../../explore/partnersData";
import type { PrimeCandidate } from "@/lib/partnersApi";
import { HERO_IDS } from "../opportunities";
import { KEY_PARTNER_FIRM, OTHER_FIRMS } from "./firms";

const firm = (key: number) => OTHER_FIRMS.find((f) => f.key === key)!;

const TRADE_DIRECT: PrimeCandidate["trade"] = { proximity: "direct", naicsCodes: ["541519", "541512", "541513"] };

/** Days left to answer the DHA's request for information (the story's team-up notice). */
function rfiDays(): number {
  return getOpportunity(HERO_IDS.teamUp)?.closesInDays ?? 14;
}

export const PARTNERS: MemberPartners = {
  tradeDirect: TRADE_DIRECT,
  workEvidence: "their work: Computer Systems Design, Other Computer Related Services",
  specs: [
    {
      firm: KEY_PARTNER_FIRM,
      tier: "strong",
      verdict: "partner_play",
      trade: { proximity: "direct", naicsCodes: ["541512"] },
      bench: { distinctSubs: 5, repeatSubs: 2, trend: "growing" },
      momentum: 0.17,
      breakdown: { S1: 10, S2: 20, S3: 14, S5: 12, S7: 8, W5: 14, W8: 22 },
      storyReasons: [
        {
          signal: "W8",
          text: `They wrote to you about the Army hospital's IT at Fort Bragg: they want ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}.`,
          evidence: "their message to you about the hospital's IT",
        },
        {
          signal: "W5",
          text: "They run hospital IT at the Navy medical centers at Camp Lejeune and Portsmouth, so they know how the DHA buys it.",
          evidence: "award record: hospital IT services, Naval Medical Centers Camp Lejeune and Portsmouth",
        },
      ],
      flags: [
        {
          id: "your_contact",
          text: `You know someone here: ${KEY_PARTNER.contact}, ${KEY_PARTNER.contactTitle}. She wrote to you about the hospital's IT.`,
        },
        {
          id: "vehicle",
          text: "The hospital's IT is ordered only through 8(a) STARS III. They hold it and you don't, so their team is your way in.",
        },
        {
          id: "size_gap",
          text: `At about $4M a year it is about one and a half times your revenue. Agree on the number of techs and their pay before you sign.`,
        },
        {
          id: "recompete_due",
          text: `Answers to the DHA's request for information are due in ${rfiDays()} days.`,
        },
      ],
    },
    {
      firm: firm(4006),
      tier: "strong",
      verdict: "partner_play",
      trade: { proximity: "direct", naicsCodes: ["541512"] },
      bench: { distinctSubs: 4, repeatSubs: 1, trend: "steady" },
      momentum: 0.08,
      breakdown: { S1: 9, S2: 20, S3: 14, S5: 9, S7: 7, W2: 20 },
      storyReasons: [
        {
          signal: "W2",
          text: "They run the Army hospital's IT at Fort Bragg now, the job the DHA is asking about again.",
          evidence: "award record: IT services, the Army medical center at Fort Bragg, 2024–2027",
        },
      ],
      flags: [
        {
          id: "vehicle",
          text: "They hold 8(a) STARS III too, so they can quote the follow-on. A second prime to talk to.",
        },
      ],
    },
    {
      firm: firm(4002),
      tier: "strong",
      verdict: "partner_play",
      trade: { proximity: "direct", naicsCodes: ["541519"] },
      bench: { distinctSubs: 3, repeatSubs: 1, trend: "steady" },
      momentum: 0.1,
      breakdown: { S1: 8, S2: 20, S3: 16, S5: 9, S7: 7, W3: 18 },
      storyReasons: [
        {
          signal: "W3",
          text: "They held the Army Reserve's knowledge management order on ITES-3S, the work in the SharePoint notice you can't quote.",
          evidence: "award record: knowledge management and SharePoint support, Army Reserve, 2023–2025",
        },
      ],
      flags: [
        {
          id: "vehicle",
          text: "They hold ITES-3S, and they'll bid ITES-4S. Ask about a subcontract now, and about teaming for ITES-4S.",
        },
        { id: "far", text: `They are based in Hampton, about ${PLACES.hampton.milesFromBase} miles away, so they need techs near Fort Bragg.` },
      ],
    },
    {
      firm: firm(4004),
      tier: "good",
      verdict: "partner_play",
      trade: { proximity: "adjacent", naicsCodes: ["541519"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "steady" },
      momentum: 0.06,
      breakdown: { S1: 7, S2: 14, S3: 16, S5: 8, S7: 6, W4: 12 },
      storyReasons: [
        {
          signal: "W4",
          text: "They do the base telecom repairs at Seymour Johnson, the buyer you deliver for.",
          evidence: "award record: base telecommunications systems support, Seymour Johnson AFB",
        },
      ],
      flags: [
        {
          id: "cabling",
          text: "They do the cabling and video-conference work you send out. Ask them for a firm price on the 249th's conference-room upgrade before you quote it.",
        },
      ],
    },
    {
      firm: firm(4003),
      tier: "good",
      verdict: "partner_play",
      trade: { proximity: "adjacent", naicsCodes: ["541519"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "steady" },
      momentum: 0.07,
      breakdown: { S1: 7, S2: 14, S3: 14, S5: 8, S7: 6, W5: 10 },
      storyReasons: [
        {
          signal: "W5",
          text: "They do the NC Guard's security work, a buyer you are waiting to hear from.",
          evidence: "award record: cybersecurity support and assessments, NC National Guard",
        },
      ],
      flags: [
        {
          id: "cmmc",
          text: "They help small firms close CMMC items. You have 9 open; work that touches controlled data needs a Level 2 self-assessment.",
        },
      ],
    },
    {
      firm: firm(4005),
      tier: "good",
      verdict: "competitor",
      trade: { proximity: "direct", naicsCodes: ["541519"] },
      bench: { distinctSubs: 2, repeatSubs: 0, trend: "steady" },
      momentum: 0.12,
      breakdown: { S1: 8, S2: 20, S3: 16, S5: 8, S7: 9, W6: 12 },
      storyReasons: [
        {
          signal: "W6",
          text: "They won the XVIII Airborne Corps' Windows 11 surge, the quote you lost by 11% on price.",
          evidence: "award record: Windows 11 upgrade surge, XVIII Airborne Corps G-6",
        },
      ],
      flags: [
        {
          id: "same_set_aside",
          text: "They are 8(a) too, and they won the Army Reserve's signal readiness work. Expect them on the help desk quote, priced at the wage floor.",
        },
      ],
    },
    {
      firm: firm(4007),
      tier: "stretch",
      verdict: "competitor",
      trade: { proximity: "direct", naicsCodes: ["541513"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "unknown" },
      momentum: 0.04,
      breakdown: { S1: 6, S2: 20, S3: 8, S5: 6, S7: 4, W2: 10 },
      storyReasons: [
        {
          signal: "W2",
          text: "They hold Pope's 43 CS IT support, the work the Air Force is asking about again.",
          evidence: "award record: IT support services, 43rd Communications Squadron, Pope Army Airfield",
        },
      ],
      flags: [
        {
          id: "eight_a",
          text: "An Alaska Native corporation owns them, so the Air Force could give them the work without a competition again. Your answer to the sources sought can change that.",
        },
      ],
    },
  ],
  nonCandidates: [
    {
      key: 4101,
      reasons: [
        "They are a large business, and their work here is ordered through ITES-3S.",
        "We have no record of them hiring a firm your size near Fort Bragg.",
      ],
      trade: { proximity: "direct", naicsCodes: ["541519"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "unknown" },
    },
    {
      key: 4102,
      reasons: ["We have no record of them hiring outside firms."],
      trade: { proximity: "direct", naicsCodes: ["541519", "541513"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "unknown" },
    },
  ],
  signalLabels: {
    W2: "they hold work the buyer is asking about again",
    W3: "they held work you can't quote yourself",
    W4: "they work for a buyer you have delivered for",
    W5: "they work at a place you target",
    W6: "they beat you on a job you bid",
    W8: "they have already reached out to you",
  },
  market: { totalAwardedUsd12mo: 177_400_000, awardCount12mo: 293, medianAwardUsd: 2_395_000 },
  /** Where My partners starts: two companies Hector has already looked at. */
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
      awardeeKey: 4004,
      companyName: firm(4004).name,
      stage: "saved",
      sourceTag: "from Find partners",
      savedAt: isoDaysFromNow(-4, 9),
      updatedAt: isoDaysFromNow(-4, 9),
    },
  ],
};

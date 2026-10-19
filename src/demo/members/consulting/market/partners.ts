// THE AGENCY's partner record for Find partners, the company panel and the market
// strip (read through src/demo/explore/partnersData.ts, which picks the active member).
//
// Every company is made up (firms.ts). Every reason is true of Dana Okafor
// (persona.ts, workspace.ts): woman-owned, nine staff, Fayetteville NC, serves NC,
// VA and SC, and Bluestone's capture director wrote to her about the VA campaign
// (the "Reply to Bluestone" task). Money, places and counts come from the award
// record in awards.ts, so a company file and an award never disagree.
//
// Sources for the market strip (USAspending, pulled 19 Oct 2026): federal
// obligations in fiscal year 2026 for NAICS 541810, 541613, 541430, 512110 and
// 541820 with the work in North Carolina or South Carolina, by transaction:
// 8 contracts received new money, $2,870,761 in all, median $240,509.
// https://api.usaspending.gov/api/v2/search/spending_by_transaction/
// Virginia is left out: its total ($269M) is national campaigns run from
// Northern Virginia, not work near Fayetteville.

import { isoDaysFromNow } from "../../../story/clock";
import { getOpportunity } from "../../../story/opportunities";
import { KEY_PARTNER } from "../../../story/persona";
import { PLACES } from "../../../story/places";
import type { MemberPartners } from "../../../explore/partnersData";
import type { PrimeCandidate } from "@/lib/partnersApi";
import { HERO_IDS } from "../opportunities";
import { KEY_PARTNER_FIRM, OTHER_FIRMS } from "./firms";

const firm = (key: number) => OTHER_FIRMS.find((f) => f.key === key)!;

const TRADE_DIRECT: PrimeCandidate["trade"] = { proximity: "direct", naicsCodes: ["541810", "541613"] };

/** Days left to reply to the VA's sources sought (the story's team-up notice). */
function vaReplyDays(): number {
  return getOpportunity(HERO_IDS.teamUp)?.closesInDays ?? 21;
}

export const PARTNERS: MemberPartners = {
  tradeDirect: TRADE_DIRECT,
  workEvidence: "their work: Advertising Agencies, Marketing Consulting",
  specs: [
    {
      firm: KEY_PARTNER_FIRM,
      tier: "strong",
      verdict: "partner_play",
      trade: TRADE_DIRECT,
      bench: { distinctSubs: 9, repeatSubs: 3, trend: "growing" },
      momentum: 0.21,
      breakdown: { S1: 12, S2: 20, S3: 8, S5: 12, S7: 9, W2: 25, W8: 22 },
      storyReasons: [
        {
          signal: "W2",
          text: "They hold the VA's national hiring campaign, and the VA is asking firms about the next one now.",
          evidence: `award record: VHA recruitment marketing and advertising, 2023, ends September 2027; open sources sought ${HERO_IDS.teamUp}`,
        },
        {
          signal: "W8",
          text: `They wrote to you about that campaign: they want ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}.`,
          evidence: "their message to you about the VA hiring campaign",
        },
      ],
      flags: [
        {
          id: "your_contact",
          text: `You know someone here: ${KEY_PARTNER.contact}, ${KEY_PARTNER.contactTitle}. He wrote to you about the VA campaign.`,
        },
        {
          id: "set_aside",
          text: "The next campaign is expected to be set aside for service-disabled veteran-owned firms. They are one and you are not, so their team is your way in.",
        },
        {
          id: "size_gap",
          text: "A year of the VA campaign is about $8M, about six times your revenue.",
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
      trade: { proximity: "direct", naicsCodes: ["541613", "541430", "541810"] },
      bench: { distinctSubs: 6, repeatSubs: 2, trend: "steady" },
      momentum: 0.08,
      breakdown: { S1: 9, S2: 20, S3: 14, S5: 9, S7: 8, W4: 12 },
      storyReasons: [
        {
          signal: "W4",
          text: "They build the NC Guard's recruiting website and do its design work. The Guard is the buyer you ran a campaign for.",
          evidence: "award record: recruiting website and visual design, NC Army National Guard",
        },
      ],
      flags: [
        {
          id: "schedule",
          text: "They hold a GSA schedule. The Guard ordered its website through it, so only schedule holders could quote.",
        },
      ],
    },
    {
      firm: firm(4003),
      tier: "strong",
      verdict: "partner_play",
      trade: { proximity: "direct", naicsCodes: ["512110", "541613"] },
      bench: { distinctSubs: 5, repeatSubs: 2, trend: "growing" },
      momentum: 0.14,
      breakdown: { S1: 8, S2: 20, S3: 10, S5: 8, S7: 7, W5: 10 },
      storyReasons: [
        {
          signal: "W5",
          text: "They make the Durham VA's patient videos. The VA is one of your target buyers.",
          evidence: "award record: patient-education video production, Durham VA Health Care System",
        },
      ],
      flags: [
        {
          id: "worked_with_partner",
          text: `They have worked for ${KEY_PARTNER.name} twice as a subcontractor.`,
        },
      ],
    },
    {
      firm: firm(4004),
      tier: "good",
      verdict: "partner_play",
      trade: { proximity: "adjacent", naicsCodes: ["541810", "541890"] },
      bench: { distinctSubs: 2, repeatSubs: 1, trend: "steady" },
      momentum: 0.04,
      breakdown: { S1: 5, S2: 14, S3: 14, S5: 5, S7: 6, W3: 12 },
      storyReasons: [
        {
          signal: "W3",
          text: "They held the Family Advocacy print and digital contract at Fort Bragg in 2019, the same work as your quote.",
          evidence: "award record: print and digital advertisements, Army Community Service, Fort Bragg, 2019",
        },
      ],
      flags: [
        {
          id: "app",
          text: "They publish a local news app. If the Army says a news partner's app meets the app line, ask them first.",
        },
        {
          id: "not_wosb",
          text: "Your quote is set aside for woman-owned firms, and they are not one, so they cannot bid it themselves.",
        },
      ],
    },
    {
      firm: firm(4005),
      tier: "good",
      verdict: "competitor",
      trade: { proximity: "direct", naicsCodes: ["541810", "541820"] },
      bench: { distinctSubs: 1, repeatSubs: 0, trend: "steady" },
      momentum: 0.06,
      breakdown: { S1: 4, S2: 20, S3: 12, S5: 5, S7: 9, W6: 6 },
      storyReasons: [
        {
          signal: "W6",
          text: "They won the Cumberland County hurricane campaign that you bid on.",
          evidence: "Cumberland County's award notice: hurricane preparedness campaign",
        },
      ],
      flags: [
        {
          id: "beat_you",
          text: "Their price was about 6% below yours on the hurricane campaign, and your creative scored higher. Price the media buy apart from the creative next time.",
        },
        {
          id: "same_set_aside",
          text: "They have won small-business set-aside jobs, the same kind you can bid. Expect them on the same bids.",
        },
      ],
    },
    {
      firm: firm(4006),
      tier: "good",
      verdict: "partner_play",
      trade: TRADE_DIRECT,
      bench: { distinctSubs: 3, repeatSubs: 1, trend: "steady" },
      momentum: 0.1,
      breakdown: { S1: 7, S2: 20, S3: 8, S5: 7, S7: 5 },
      storyReasons: [],
      flags: [],
    },
    {
      firm: firm(4007),
      tier: "stretch",
      verdict: "partner_play",
      trade: { proximity: "direct", naicsCodes: ["512110"] },
      bench: { distinctSubs: 4, repeatSubs: 1, trend: "steady" },
      momentum: 0.03,
      breakdown: { S1: 6, S2: 20, S3: 2, S5: 6, S7: 3 },
      storyReasons: [],
      flags: [{ id: "far", text: `Their crew is in Norfolk, about ${PLACES.norfolk.milesFromBase} miles from your office.` }],
    },
  ],
  nonCandidates: [
    {
      key: 4101,
      reasons: ["We have no record of them hiring outside firms."],
      trade: { proximity: "adjacent", naicsCodes: ["541613", "541611"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "unknown" },
    },
    {
      key: 4102,
      reasons: ["They have not won work in the last two years."],
      trade: { proximity: "adjacent", naicsCodes: ["541820"] },
      bench: { distinctSubs: 0, repeatSubs: 0, trend: "unknown" },
    },
  ],
  signalLabels: {
    W2: "they hold work the buyer is asking about again",
    W3: "they held the same work as your quote",
    W4: "they work for a buyer you have delivered for",
    W5: "they work with a buyer you target",
    W6: "they beat you on a job you bid",
    W8: "they have already reached out to you",
  },
  market: { totalAwardedUsd12mo: 2_870_000, awardCount12mo: 8, medianAwardUsd: 240_000 },
  /** Where My partners starts: two companies Dana has already looked at. */
  initialPipeline: () => [
    {
      awardeeKey: 4003,
      companyName: firm(4003).name,
      stage: "researching",
      sourceTag: "from Find partners",
      savedAt: isoDaysFromNow(-6, 10),
      updatedAt: isoDaysFromNow(-2, 15),
    },
    {
      awardeeKey: 4002,
      companyName: firm(4002).name,
      stage: "saved",
      sourceTag: "from Find partners",
      savedAt: isoDaysFromNow(-4, 9),
      updatedAt: isoDaysFromNow(-4, 9),
    },
  ],
};

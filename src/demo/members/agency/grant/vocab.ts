// THE AGENCY's words for Grant's generated reviews (read through src/demo/grant/vocab.ts),
// and the risks the story's one-liners name for a few of its opportunities.
//
// Lantern Row Creative is a nine-person ad agency in downtown Fayetteville with a
// two-person video crew (persona.ts). It buys media but owns no channel, carries no
// bond, and runs most of its work from its office, so distance matters only for
// shoots and meetings.

import { dueTimeOf } from "../../../story/opportunities";
import { PARTNER, STAFF, type OppFacts } from "../../../grant/facts";
import type { Caveat } from "../../../grant/generator";
import type { ClausePatch } from "../../../grant/solicitation";
import type { GrantVocab } from "../../../grant/vocab";
import { HERO_IDS, OPPORTUNITIES } from "../opportunities";

const hero = OPPORTUNITIES.find((o) => o.id === HERO_IDS.hero)!;

/** "all of North Carolina", "NC, VA, SC, GA and FL", for work that is not tied to one place. */
function areaOf(f: OppFacts): string | null {
  if (!/^Multiple/.test(f.place.city)) return null;
  const states = /\(([^)]+)\)/.exec(f.place.city)?.[1].split(/,\s*/);
  if (!states) return "all of North Carolina";
  return `${states.slice(0, -1).join(", ")} and ${states[states.length - 1]}`;
}

/** Sample wage rates. They are for the demonstration and are not the Department of Labor's. */
const WAGE_ROWS: string[][] = [
  ["Occupation", "Hourly rate", "Health and welfare"],
  ["Illustrator II", "$24.10", "$5.36"],
  ["Media Specialist II", "$21.85", "$5.36"],
  ["Media Specialist III", "$24.37", "$5.36"],
  ["Photographer II", "$21.40", "$5.36"],
  ["Photographer III", "$26.52", "$5.36"],
  ["General Clerk II", "$15.48", "$5.36"],
];

/** Risks the story's one-liners name that the facts alone do not show. */
export const CAVEATS: Record<string, Caveat> = {
  "W91242-27-Q-0014": {
    limit: "Performance rating: your NC Guard campaign has no performance rating yet. Ask the Guard for an interim rating before you send the quote.",
    kind: "proposal-weakness",
    change: "If the Guard can't give an interim rating before the due date, I'd lead with your Longleaf hiring results instead.",
    ref: "pp-ncng-recruiting",
  },
  "36C10X27Q0007": {
    limit: "Schedule: the VA sends this request through GSA eBuy to GSA schedule holders only. You are not on a schedule yet.",
    kind: "disqualifier",
    decides: true,
    phrase: "the GSA schedule",
    change: "If the VA posts this work outside eBuy, open to small businesses, I'd run the checks again.",
    trail: "Who can quote: **GSA schedule holders only**, through GSA eBuy.",
    read: {
      name: "Can you win it?",
      rating: "weak",
      text: "Only GSA schedule holders can quote: the VA sends this request through GSA eBuy. You are not on a schedule yet, so you can't send a quote.",
      bold: "You are not on a schedule yet",
    },
    roadmap: {
      item: "A **GSA schedule** of your own",
      why: "Some buyers, like this VA campaign, ask only schedule holders. With 7 years in business you meet GSA's two-year rule for an offer.",
      takes: "An offer to GSA under the advertising services category, and a few months of review. Ask Diana where to start.",
    },
  },
  "NCDOT-GHSP-2027-08": {
    limit: "Margin: most of the price is the media buy, which you pass through at cost. Your fee is the small part.",
    kind: "winning-hurts",
    decides: true,
    phrase: "the media-buy margin",
    change: "If NCDOT pays for the media apart from your fee, I'd move this to **Bid**.",
    read: {
      name: "Will you make money?",
      rating: "watch",
      text: "Most of the money passes through to stations and platforms at cost. Your fee is the small part, so the margin is thin.",
      bold: "the margin is thin",
    },
    question: {
      id: "carry-media",
      question: "Can you carry about a **month of media costs** before NCDOT pays?",
      payoff: "A yes shows whether the **media buy** is a real limit.",
      chip: "media",
      yes: { gist: "You said you can carry a month of media costs, so the media buy is less of a limit.", ack: "Good. Carrying the media until NCDOT pays is the hard part of a buy this size. I raised my confidence." },
      no: { gist: "You cannot carry a month of media costs, so the media buy stays a real limit.", ack: "Then the media buy stays a real limit. A credit line, or a partner who fronts the media, is the way around it. My confidence stays where it was." },
    },
  },
  "NCDHHS-FC-2027-11": {
    limit: "Media buy: a statewide campaign means a statewide media buy, and radio is new for you. Price it with real rates before you commit.",
    kind: "winning-hurts",
    decides: true,
    phrase: "the statewide media buy",
    change: "If the state sets the media budget apart from your fee, I'd move this to **Bid**.",
    read: {
      name: "Will you make money?",
      rating: "watch",
      text: "A statewide buy, with radio, is most of the price. Price it from real station rates, or the margin goes.",
      bold: "Price it from real station rates",
    },
    question: {
      id: "priced-radio",
      question: "Have you priced a **statewide radio buy** before?",
      payoff: "A yes shows whether the **media buy** is a real limit.",
      chip: "media",
      yes: { gist: "You have priced a statewide radio buy before, so the media buy is less of a limit.", ack: "Good. Start from those rates and confirm them with the stations. I raised my confidence." },
      no: { gist: "You have not priced a statewide radio buy, so the media buy stays a real limit.", ack: "Then get rate cards from the main stations before you price, or team with a media buyer. My confidence stays where it was." },
    },
  },
};

export const VOCAB: GrantVocab = {
  base: "your office",
  crew: "your team",
  teamOf: `a ${STAFF}-person team`,
  peers: "agencies",
  bigWork: "federal ad work",
  nearRun: "Your crew can shoot there and be back the same day.",
  farTrip: "Each shoot or meeting there is a long day on the road for your crew.",
  travelCost: "travel time",
  frontCost: "you staff up and pay for ad space",
  priceAdvice: "Price from your real hours and media rates. An office this close keeps travel cost low.",
  fitsWin: "A win fits the team you have.",
  canRun: `Your ${STAFF}-person team can run this work, with a freelancer in busy months.`,
  fitsYou: "your team and your size",
  edge: "a nearby office and a clean record",
  cashLine: "A **credit line** and a second crew",
  localPartner: "A local partner makes the on-site work possible.",
  recordWhy: "A second federal prime near your office is the record that larger buyers look for.",
  firstMatch: `The ${hero.plainTitle}`,
  isTarget: (f) =>
    Boolean(f.opp.targetAgency) ||
    /Veterans/.test(f.opp.agency) ||
    /National Guard/.test(f.opp.office) ||
    (/Army/.test(f.opp.agency) && /Fort Bragg/.test(f.place.city)),
  wide: (f) => {
    const area = areaOf(f);
    return area ? `The work covers ${area}. You run the ads from your office; only shoots and meetings need travel.` : null;
  },

  cost: "your real hours and media rates",
  insuranceLine: "No bond is asked for. Your general liability insurance is on file, and it meets the notice.",
  nearLine: "That is close enough for your crew to shoot and be back the same day.",
  farLine: "Plan shoot days and meetings around the drive.",
  sizeFix: "Only with a partner or more staff. A second crew takes time to hire, and a larger media buy needs cash up front. Open Partners to find a prime.",
  partnerHint: (opp) => (/Veterans/.test(opp.agency) ? `${PARTNER.name} wants a woman-owned video crew for VA work in NC, VA and SC. ` : ""),
  localQuestion: {
    question: (place) => `Could you plan the **shoot days and meetings** in ${place}, or work with a partner there?`,
    payoff: "A yes shows whether the **drive** is a real limit.",
    yes: { gist: "You said you can plan the trips or work with a partner there, so the distance is less of a limit.", ack: "Good. Planned shoot days, or a partner on site, make the distance workable. I raised my confidence." },
    no: { gist: "You cannot plan the trips or work with a partner there, so the distance stays a real limit.", ack: "Then the distance stays a real limit. A partner on Partners may be the way around it. My confidence stays where it was." },
  },
  reactions: Object.fromEntries(
    Object.values(CAVEATS).flatMap((c) => (c.question ? [[c.question.id, { yes: c.question.yes, no: c.question.no }]] : [])),
  ),

  eligibility: () => [
    "Samples of similar work: ads, videos or designs.",
    "General liability insurance of $1M for each occurrence, and workers' compensation.",
  ],
  collect: "Collect work samples, insurance proof and references.",
  attachments: "work samples and references",
  travelRisk: "Travel for shoots and meetings adds cost.",

  trade: "Advertising",
  // The demo states no size-standard figure for the agency's codes.
  sizeStandard: null,
  dueInClauses: dueTimeOf,
  clauses: (f, offer) => {
    const area = areaOf(f);
    const out: Record<string, string | null> = {
      permit: null,
      certs: null,
      haccp: null,
      bond: null,
      insurance: `The contractor shall carry commercial general liability insurance of $1,000,000 for each occurrence and $2,000,000 in total, and workers' compensation at the legal limit. Proof is due with the ${offer}.`,
      access: f.isFederal
        ? "Anyone who works on the buyer's site needs a background check and a base pass or site badge. The contractor starts these checks within five days of award."
        : null,
    };
    if (offer === "quote") out.content = "The quote has three parts: the price schedule, a short technical plan (up to three pages), and work samples with two references.";
    if (offer === "proposal") out.content = "The proposal has three parts: a technical volume (up to ten pages) with work samples, a past performance volume with three references, and the price schedule.";
    if (area) out.place = `The ads run across ${area}. Shoots and meetings take place at sites the buyer names at award.`;
    return out;
  },
  extraClauses: (f): ClausePatch[] => {
    const fed = f.isFederal;
    const work = fed ? "C" : "2";
    const terms = fed ? "H" : "5";
    return [
      { kind: "approval", section: work, ref: `${work}.4`, heading: "Approval before release", text: "The contractor shall send every ad, video and design to the buyer's representative for written approval before it runs." },
      {
        kind: "accessibility",
        section: work,
        ref: `${work}.5`,
        heading: "Captions and accessibility",
        text: `Every video shall carry captions. Web and digital content shall meet ${fed ? "Section 508 of the Rehabilitation Act" : "WCAG 2.1, level AA"}.`,
      },
      { kind: "reports", section: work, ref: `${work}.6`, heading: "Reports", text: "The contractor shall send a monthly report of what ran, what it reached and what people did, such as clicks, calls and sign-ups." },
      {
        kind: "rights",
        section: terms,
        ref: `${terms}.${fed ? 3 : 2}`,
        heading: "Rights in the work",
        text: `${fed ? "The Government owns" : "The buyer owns"} the ads, videos, designs and data made under this contract.${fed ? " FAR 52.227-17, Rights in Data—Special Works, applies." : ""} The contractor delivers the licenses for any music, photos or footage it uses.`,
      },
    ];
  },
  wageRows: WAGE_ROWS,
};


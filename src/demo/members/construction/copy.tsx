// THE CONTRACTOR: what the shared screens say about Ninebark Builders' trade.
// One export per screen. The caterer's words sit beside the shared code
// (byMember); every pack member has this file with these exports (pack.test.ts).

import { HardHat } from "lucide-react";
import { JargonGloss } from "@/components/Layout/JargonGloss";
import type { LearnedFact } from "@/components/Knowledge/WhatWeLearned";
import type { GroupDef } from "@/demo/sc/business/data/psc";
import type { CapFacts } from "@/lib/capStatementBuilder";
import type { InsuranceBonding } from "@/lib/grant/firmProfile";
import type { ConnectorFiles } from "@/lib/knowledgeBase";
import type { BuyerOfficer, GovBuyer } from "@/lib/mock/governmentBuyers";
import { fmtRate, type LcatLocation } from "@/lib/mock/laborRates";
import type { MicroState } from "@/lib/state/microPurchases";
import type { TrackedItem } from "@/lib/stayReady";
import { isoDaysFromNow } from "../../story/clock";
import { PAST_PERFORMANCE, PERSONA } from "./persona";

function k(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M` : `${Math.round(n / 1000)}K`;
}

/** Fayetteville metro median hourly pay, BLS May 2025 (construction-pack.md, Wage rules). */
const LOCAL_ELECTRICIAN_MEDIAN = 27.74;

/** Days before the demo opens (sc/timeline.ts). */
export const HISTORY = {
  MEMBER_SINCE_DAYS: 300,
  ONBOARDING_CALL_DAYS_AGO: 298,
  COMPLIANCE_CALL_DAYS_AGO: 286,
  POSITIONING_CALL_DAYS_AGO: 196,
  SAM_CHECKED_DAYS_AGO: 183,
  FIRST_MENTOR_QUESTION_DAYS_AGO: 41,
};

/** When he started and finished each Roadmap step, in days ago (sc/roadmap/model.ts). */
const { COMPLIANCE_CALL_DAYS_AGO, POSITIONING_CALL_DAYS_AGO, FIRST_MENTOR_QUESTION_DAYS_AGO } =
  HISTORY;

export const ROADMAP_DONE_DATES: Record<string, { started?: number; done: number }> = {
  "p1-business-setup": { started: 298, done: 294 },
  "p1-digital-compliance": { started: 294, done: COMPLIANCE_CALL_DAYS_AGO },
  "p1-federal-registration": { started: 286, done: 280 },
  "p1-sled-registration": { started: 280, done: 262 },
  "p2-capability-statement": { started: 214, done: POSITIONING_CALL_DAYS_AGO + 2 },
  "p2-sbs-registration": { started: 214, done: 210 },
  "p2-cmmc-level-1": { started: 210, done: 202 },
  "p3-positioning-call": { done: POSITIONING_CALL_DAYS_AGO },
  "p3-planned-pursuit": { done: 192 },
  "p3-prime-registration": { done: 188 },
  "p3-send-to-mentor": { done: FIRST_MENTOR_QUESTION_DAYS_AGO },
};

/** What his CMMC Level 1 self-assessment covers. */
export const CMMC_SCOPE = "Office, estimating and project-management systems";

/** The size of his capability statement in public/demo-files (scripts/make-capability-statement.ts writes it).
 *  Still the agency's size: set it when the statement is made (README, step 6). */
export const CAPABILITY_STATEMENT_BYTES = 3305;

/** What he calls a job when he says how many he can run at once (My Business, "Tell us"). */
export const JOB_WORDS = /\b(jobs|projects|contracts|crews|sites)\b/i;

/** The product and service code groups he picks from first (sc/business/data/psc.ts). */
export const PSC_GROUPS: GroupDef[] = [
  {
    groupCode: "Z2",
    groupTitle: "Repair or Alteration of Real Property",
    segment: "service",
    category: "Construction of Structures and Facilities",
    codes: [
      ["Z2AA", "Repair or Alteration of Office Buildings"],
      ["Z2AZ", "Repair or Alteration of Other Administrative Facilities and Service Buildings"],
      ["Z2FA", "Repair or Alteration of Hospitals and Infirmaries"],
      ["Z2JZ", "Repair or Alteration of Miscellaneous Buildings"],
    ],
  },
  {
    groupCode: "Z1",
    groupTitle: "Maintenance of Real Property",
    segment: "service",
    category: "Construction of Structures and Facilities",
    codes: [
      ["Z1AA", "Maintenance of Office Buildings"],
      ["Z1JZ", "Maintenance of Miscellaneous Buildings"],
    ],
  },
];

/** Rows only a document can answer, beyond the ones every member has. */
export const UPLOAD_EXTRAS: { field: string; test: RegExp }[] = [
  { field: "doc_past_performance", test: /\b(CPARS|performance rating)\b/i },
  { field: "bonding_capacity", test: /\b(surety|bond(?:ing)? (?:letter|line|capacity))\b/i },
  { field: "doc_certifications", test: /\bHUBZone (?:certificate|certification|letter)\b/i },
];

/** How My Business turns his own words into facts (sc/business/demoTell.ts). */
export const TELL_RULES = {
  /** A sentence about his people. */
  personnel:
    /\b(crews?|superintendents?|foremen|foreman|electricians?|technicians?|carpenters?|estimators?|project managers?)\b/i,
  /** A sentence about his gear. */
  equipment:
    /\b(trucks?|lifts?|scissor lifts?|recovery machines?|benders?|meters?|trailers?|generators?)\b/i,
  /** What he does, as a buyer would search for it ("we replace chillers" → "chillers"). */
  serviceVerbs: /\b(we|i) (install|replace|repair|upgrade|build|wire|run|do|service)\b/i,
  services:
    /\b(?:HVAC|chillers?|air handlers?|heat pumps?|boilers?|controls|electrical service|panels?|switchgear|lighting|building repairs?|renovations?)\b/gi,
  /** What sets him apart. */
  differentiators:
    /\b(self-perform\w*|bonded|HUBZone|two crews|badge on|occupied buildings?|phased)\b/i,
};

/** His own words for his work (Business Profile). */
export const CORE_CAPABILITIES = [
  "Electrical service, panels and switchgear, self-performed",
  "HVAC replacement: chillers, air handlers, heat pumps and controls",
  "Building repairs and renovations in occupied buildings, phased",
  "Bonded general contracting from bid to closeout",
];

/** The example in the PSC box. */
export const PSC_EXAMPLE = "Z2AA, Z2JZ";

/** States whose vendor list he is already on. */
export const SLED_REGISTERED: Record<
  string,
  { vendorId: string; registeredDaysAgo: number } | undefined
> = { NC: { vendorId: "0001062914", registeredDaysAgo: 262 } };

/** The state whose vendor registration GovPreneurs is doing for him (Done for you). NC or VA. */
export const DFY_SLED_STATE = "VA" as "NC" | "VA";

/** The example row in the past-performance upload template. */
export const PAST_PERFORMANCE_EXAMPLE =
  '"Example: HVAC replacement, county office building","Example County",240000,2024-05-01,2024-09-30,238220,Prime,"Replaced two air handlers and a chiller in an occupied building. Bonded; finished on schedule."';

/** The job still waiting for a performance rating. None: his Pope job is rated. */
export const RATING_JOB = "your Pope job";

/** Gaps from his story the readiness header names first. A GSA schedule is not one: construction isn't bought that way. */
export const READINESS_GAPS = { gsa: false, keyPersonnel: true };

/** What the knowledge hub read from his own files. */
export const LEARNED_FACTS: LearnedFact[] = [
  {
    text: "Certified HUBZone since 2 Dec 2023. Recertification is due in 44 days.",
    fromFile: "hubzone certification letter",
  },
  { text: "Bonded to $1.5M a job and $4M in total; $2.9M in use.", fromFile: "surety letter" },
  {
    text: "The Pope office building job, rated Very Good.",
    fromFile: "cpars report",
  },
  { text: `${PERSONA.kitchen}.`, fromFile: "shop" },
];

/** The files in his connected drives (lib/knowledgeBase.ts). */
export const CONNECTOR_FILES: ConnectorFiles = {
  gdrive: [
    {
      kind: "gdrive",
      connectorId: "gdrive",
      name: "SAM.gov registration — active.pdf",
      sizeKB: 212,
      mime: "pdf",
      filledFields: ["UEI", "CAGE", "registration expiry"],
    },
    {
      kind: "gdrive",
      connectorId: "gdrive",
      name: "HUBZone certification letter.pdf",
      sizeKB: 174,
      mime: "pdf",
      filledFields: ["certifications", "renewal date"],
    },
  ],
  gdocs: [
    {
      kind: "gdocs",
      connectorId: "gdocs",
      name: "Surety letter — single and aggregate limits.docx",
      sizeKB: 64,
      mime: "docx",
      filledFields: ["bonding"],
    },
    {
      kind: "gdocs",
      connectorId: "gdocs",
      name: "Project sheets: Pope, Cumberland County Schools, Tallow Branch.docx",
      sizeKB: 238,
      mime: "docx",
      filledFields: ["past projects", "results"],
    },
  ],
  dropbox: [
    {
      kind: "dropbox",
      connectorId: "dropbox",
      name: "Crew list and equipment.pdf",
      sizeKB: 96,
      mime: "pdf",
      filledFields: ["staff", "equipment"],
    },
  ],
};

/** What Stay Ready tracks for him, after the SAM.gov item every member has. */
export const stayReadyItems = (samItem: () => TrackedItem): TrackedItem[] => {
  return [
    samItem(),
    {
      id: "hubzone-cert",
      kind: "wosb-cert",
      name: "HUBZone recertification",
      shortName: "HUBZone",
      dueDate: isoDaysFromNow(44, 0),
      dfyAvailable: true,
      dfyPriceUSD: 250,
      smsOptIn: true,
      stakes:
        "HUBZone status is how you compete on set-aside work like the training building job at Fort Bragg. Recertify every 3 years, with 35% of your staff living in a HUBZone; you're at 9 of 25.",
      govLink: "https://certify.sba.gov",
    },
    {
      id: "insurance",
      kind: "insurance",
      name: "General liability insurance",
      shortName: "insurance",
      dueDate: isoDaysFromNow(120, 0),
      dfyAvailable: false,
      dfyPriceUSD: 0,
      smsOptIn: false,
      stakes:
        "Every bid asks for active liability insurance, and the surety checks it before it writes a bond. An expired policy means you can't bid.",
    },
    {
      id: "insurance-auto",
      kind: "insurance",
      name: "Business auto insurance",
      shortName: "auto",
      dueDate: isoDaysFromNow(210, 0),
      dfyAvailable: false,
      dfyPriceUSD: 0,
      smsOptIn: false,
      stakes: "Your crews drive company trucks onto post. Fort Bragg's gate checks proof of cover.",
    },
  ];
};

/** The words the capability statement builder uses for his kind of business. */
export const CAP_STATEMENT = {
  tagline: "HUBZone general contractor 12 miles from Fort Bragg",
  place: (m: CapFacts) =>
    `${m.employees} staff: two electrical crews, two HVAC crews and a carpentry crew, from a shop and yard in Fayetteville.`,
  work: (list: string) =>
    `We self-perform electrical and HVAC work and run building repairs from bid to closeout for buyers across ${list}.`,
  standard: "Bonded to $1.5M a job; crews already badge onto post",
  proof: () => [],
  alternate: (m: CapFacts) => [
    `${m.businessName} is a HUBZone general contractor based in ${m.city}, ${m.state}, 12 miles from Fort Bragg.`,
    `Two crews of each trade means one job can't stall another, and a buyer deals with one firm from bid to closeout.`,
  ],
};

/** His insurance and bonding, as Grant reads them. */
export const insurance = (): InsuranceBonding => {
  return {
    coverages: [
      {
        type: "gl",
        perOccurrence: 1_000_000,
        aggregate: 2_000_000,
        carrier: "Piedmont Mutual",
        amBest: "A (XV)",
        basis: "occurrence",
        expiry: "2027-05-31",
      },
      {
        type: "workers-comp",
        perOccurrence: 1_000_000,
        aggregate: null,
        carrier: "Piedmont Mutual",
        amBest: "A (XV)",
        basis: "occurrence",
        expiry: "2027-05-31",
      },
      {
        type: "auto",
        perOccurrence: 1_000_000,
        aggregate: null,
        carrier: "Piedmont Mutual",
        amBest: "A (XV)",
        basis: "occurrence",
        expiry: "2027-05-31",
      },
      {
        type: "umbrella",
        perOccurrence: 5_000_000,
        aggregate: 5_000_000,
        carrier: "Atlantic Specialty Underwriters",
        amBest: "A (XIII)",
        basis: "occurrence",
        expiry: "2027-05-31",
      },
    ],
    bonding: PERSONA.bondLine
      ? { single: PERSONA.bondLine.single, aggregate: PERSONA.bondLine.aggregate }
      : null,
  };
};

/** His starting answers on the Small Orders board. */
export const smallOrdersStart = (): MicroState => {
  return {
    categories: [],
    onboarded: false,
    cashCeiling: null,
    cashUnsure: false,
    attestedNsns: [],
    declinedNsns: [],
    unsureNsns: [],
    suppliedNsns: [],
    quotes: [],
    wins: [],
    registrations: { sam: true, cage: true, dibbs: true, piee: true },
    firstRegistrationAt: null,
    samExpiresOn: PERSONA.samActiveUntil,
    seenOrderIds: [],
  };
};

/** Where the labor-rate benchmark can be filtered to. */
export const LCAT_LOCATIONS: (LcatLocation | "all")[] = ["all", "Fayetteville"];

/** The note above the labor-rate benchmark. */
export const LCAT_BANNER = (
  <span>
    Federal <strong>construction work</strong> is priced as a fixed bid, but the labor in it has a
    legal floor: the Davis-Bacon wage decision for the county. For scale, a Fayetteville
    electrician&apos;s median pay is {fmtRate(LOCAL_ELECTRICIAN_MEDIAN)} an hour (BLS, May 2025);
    the wage decision sets the least you may pay on a federal job.
  </span>
);

/** The wage-floor table's words. */
export const WAGE_TABLE = {
  floor:
    "you can pay workers in these classes on a federal construction job here. You can pay more — you can't pay less. From the current Davis-Bacon wage decision, NC20260122.",
  compare:
    "Wage floors are the bottom; here's where comparable building repair jobs near Fort Bragg landed on total price.",
};

/** His trade, in the words the buyer pages use. */
export const BUYER_TRADE = {
  label: "Building construction and repair",
  phrase: "building construction and repair",
};

/** The icon on the "buys my trade" pill. */
export const TRADE_ICON = HardHat;

/** His intro email to a buyer. */
export const buyerIntro = (buyer: GovBuyer, officer: BuyerOfficer): string => {
  const past = PAST_PERFORMANCE.slice(0, 3)
    .map((p) => p.projectTitle)
    .join("; ");
  return `Subject: Introduction — ${PERSONA.businessName} (HUBZone, ${PERSONA.hqCity})

Dear ${officer.name},

My name is ${PERSONA.ownerName}. I'm the ${PERSONA.ownerTitle.toLowerCase()} of ${PERSONA.businessName}, a ${PERSONA.hqCity}-based HUBZone general contractor (NAICS ${PERSONA.primaryNaics}). We self-perform electrical and HVAC work with two crews of each, and run building repairs from bid to closeout. We'd like to be on your radar for upcoming repair and renovation work at ${buyer.name}.

In short:
  • HUBZone · Small Business · ${PERSONA.hqCity}-local, 12 miles from Fort Bragg
  • Work: HVAC replacement, electrical service and panels, building repairs in occupied buildings
  • Past work: ${past}
  • Typical job size: ${k(PERSONA.targetValueMin)}–${k(PERSONA.targetValueMax)}; bonded to ${k(PERSONA.bondLine?.single ?? 0)} a job
  • SAM-registered (UEI ${PERSONA.uei}, CAGE ${PERSONA.cage}); crews already badge onto post

I've attached our capability statement. If there's a better person to speak with about ${buyer.location} construction work — or an upcoming industry day you'd recommend we attend — I'd be grateful for the pointer.

Thank you for your time,
${PERSONA.ownerName}
${PERSONA.businessName}
${PERSONA.email} · ${PERSONA.phone}`;
};

/** The Contract Vehicles page's words. */
export const VEHICLES_PAGE = {
  meta: "Pre-approved contracts that let agencies buy from you faster — and what they actually mean for a general contractor.",
  lead: "a general contractor like yours.",
  fitsLabel: "Fits my work (construction)",
  famous: "For a general contractor: the most famous vehicles (",
  path: (
    <>
      The ones that fit: <strong>Fort Bragg&apos;s Minor Construction MATOC</strong> (you are not
      on it yet; its follow-on is your best next step), the <strong>HUBZone set-asides</strong> you
      already qualify for, and <strong>teaming with a prime</strong> on work you can&apos;t bond
      alone. We&apos;ve defaulted you to those.
    </>
  ),
};

/** The badge on a vehicle that does not fit his work. */
export const VEHICLES_NOT_FOR = "not for construction";

/** How he knows the team-up partner, on an award page. */
export const KNOWN_PARTNER_NOTE =
  "who wrote to you about the VA fan coils. Ask him which floors he needs mechanical and electrical crews for.";

/** What he already shares with the team-up partner. */
export const KNOWN_CONTACT_HOOK = "his note to you about the VA fan coils";

/** A sample answer to one of Ava's text questions. */
export const AVA_SAMPLE_ANSWER = "Our own electricians and HVAC technicians do the work; we don't sub out either trade.";

/** Ava's check line when the price covers every cost. */
export const AVA_PRICE_COVERS =
  "The price pays for your crews at the wage-decision rates, the equipment, the bonds and every cost Ava knows about.";

/** The hint in the PSC search box. */
export const PSC_SEARCH_HINT = "Search a group or a code — repair, maintenance, buildings…";

export const MENTOR_BENCH = {
  sarah:
    "Pick the right bids, check your price, and read your bid before you send it. Best for Army construction and repair bids at Fort Bragg.",
  renee: {
    title: "Proposals and sources-sought answers · former proposal director",
    bio: "Renee led proposal teams at a federal construction contractor for 11 years, including three MATOC offers. She has written or reviewed more than 200 federal proposals.",
    consultationDescription:
      "Answer a sources sought so you make the cut, or write a MATOC offer. Bring a draft or a notice and Renee will mark what the evaluators look for.",
  },
  calvin: {
    bio: "Calvin reviewed contractor prices for the Army for 13 years. He teaches small contractors to price labor at the wage-decision rates, equipment and bonds without under-bidding.",
    consultationDescription:
      "Build a bid that covers your costs and still pays you. Calvin checks your labor classes, equipment quotes, bond costs and margin line by line.",
  },
  angela: {
    bio: "Angela bought facility repairs and services for VA medical centers for 12 years. She explains how the VA buys construction and what its evaluators look for.",
    consultationDescription:
      "Sell to the VA. Learn the VA's forms, its veteran-first rules, and how to work under a veteran-owned prime.",
  },
};

export const PALETTE_WORDS = {
  sell: ["project sheets", "trades"],
  papers: ["surety letter", "bonds"],
};

export const LABOR_PRICING = {
  list: (
    <ul className="market-what-list">
      <li>
        Federal <strong>construction work</strong> is bid as a <em>fixed price</em> for the whole
        job, usually a sealed bid where the lowest responsive bid gets it.
      </li>
      <li>
        The labor in it has a legal floor: the government&apos;s{" "}
        <JargonGloss term="wage determination">
          The hourly rate and fringe set by the U.S. Department of Labor under the Davis-Bacon Act
          for each construction trade and county. The legal minimum on federal construction jobs
          over $2,000.
        </JargonGloss>{" "}
        sets minimum pay and fringe for electricians, sheet metal workers, pipefitters and laborers
        in your county.
      </li>
      <li>
        Quick answer to "what should I bid":{" "}
        <em>your costs at the wage-decision rates set the bottom; what similar jobs went for is the
        top.</em> Bid between, and add the bond cost.
      </li>
    </ul>
  ),
  lcatLine:
    "Local pay for electricians, HVAC mechanics, pipefitters and laborers (BLS). Federal construction jobs pay at least the wage decision.",
};

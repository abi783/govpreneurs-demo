// THE JANITORIAL FIRM: what the shared screens say about Gray Owl's trade.
// One export per screen. The caterer's words sit beside the shared code
// (byMember); every pack member has this file with these exports (pack.test.ts).

import { SprayCan } from "lucide-react";
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
import { dateDaysFromNow, isoDaysFromNow } from "../../story/clock";
import { PAST_PERFORMANCE, PERSONA } from "./persona";

function k(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M` : `${Math.round(n / 1000)}K`;
}

/** Fayetteville metro median janitor pay, BLS May 2025 (janitorial-pack.md, Wage rules). */
const LOCAL_JANITOR_MEDIAN = 16.46;

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
export const CMMC_SCOPE = "Office, scheduling and payroll systems";

/** The size of his capability statement in public/demo-files (scripts/make-capability-statement.ts writes it). */
export const CAPABILITY_STATEMENT_BYTES = 3480;

/** What he calls a job when he says how many he can run at once (My Business, "Tell us"). */
export const JOB_WORDS = /\b(jobs|contracts|buildings|sites|accounts|crews)\b/i;

/** The product and service code groups he picks from first (sc/business/data/psc.ts). */
export const PSC_GROUPS: GroupDef[] = [
  {
    groupCode: "S2",
    groupTitle: "Housekeeping Services",
    segment: "service",
    category: "Utilities and Housekeeping Services",
    codes: [
      ["S201", "Housekeeping — Custodial Janitorial"],
      ["S208", "Housekeeping — Landscaping/Groundskeeping"],
      ["S214", "Housekeeping — Carpet Laying/Cleaning"],
      ["S299", "Housekeeping — Other"],
    ],
  },
];

/** Rows only a document can answer, beyond the ones every member has. */
export const UPLOAD_EXTRAS: { field: string; test: RegExp }[] = [
  { field: "doc_past_performance", test: /\b(CPARS|reference letter|performance questionnaire)\b/i },
  { field: "doc_certifications", test: /\bHUBZone (?:certificate|certification|letter)\b/i },
];

/** How My Business turns his own words into facts (sc/business/demoTell.ts). */
export const TELL_RULES = {
  /** A sentence about his people. */
  personnel: /\b(crews?|custodians?|floor techs?|technicians?|supervisors?|cleaners?|office manager)\b/i,
  /** A sentence about his gear. */
  equipment: /\b(trailers?|rigs?|burnishers?|scrubbers?|extractors?|recovery kits?|vans?|trucks?)\b/i,
  /** What he does, as a buyer would search for it ("we strip floors" → "floors"). */
  serviceVerbs: /\b(we|i) (clean|wash|strip|wax|burnish|extract|mow|run|do|service)\b/i,
  services:
    /\b(?:custodial|janitorial|floor care|floors?|carpets?|restrooms?|pressure washing|exteriors?|mowing|grounds)\b/gi,
  /** What sets him apart. */
  differentiators: /\b(night crews?|HUBZone|in house|wash-water recovery|badged|hot-water)\b/i,
};

/** His own words for his work (Business Profile). */
export const CORE_CAPABILITIES = [
  "Night custodial for offices, clinics and public buildings",
  "Floor care in house: strip, wax, burnish and carpet extraction",
  "Hot-water pressure washing with wash-water recovery",
  "Light grounds work: mowing and trimming",
];

/** The example in the PSC box. */
export const PSC_EXAMPLE = "S201, S299";

/** States whose vendor list he is already on. */
export const SLED_REGISTERED: Record<
  string,
  { vendorId: string; registeredDaysAgo: number } | undefined
> = { NC: { vendorId: "0001074428", registeredDaysAgo: 262 } };

/** The state whose vendor registration GovPreneurs is doing for him (Done for you). NC or VA. */
export const DFY_SLED_STATE = "VA" as "NC" | "VA";

/** The example row in the past-performance upload template. */
export const PAST_PERFORMANCE_EXAMPLE =
  '"Example: Night custodial, county office building","Example County",48000,2024-07-01,2025-06-30,561720,Prime,"Five nights a week, restrooms and offices, quarterly floor care. No missed nights."';

/** The job still waiting for a reference. His Seymour Johnson job was too small for a rating. */
export const RATING_JOB = "your Seymour Johnson dorm job";

/** Gaps from his story the readiness header names first. A GSA schedule is his next step for schedule-only buys, not a gap now. */
export const READINESS_GAPS = { gsa: false, keyPersonnel: true };

/** What the knowledge hub read from his own files. */
export const LEARNED_FACTS: LearnedFact[] = [
  {
    text: "Certified HUBZone since 2023. Recertification is due in 38 days; 41% of staff live in a HUBZone.",
    fromFile: "hubzone certification letter",
  },
  { text: "The Seymour Johnson dorm job: 14 buildings, $84,600, no CPARS (too small).", fromFile: "bpa call order" },
  { text: "Two hot-water trailers at 3,500 psi and one wash-water recovery kit.", fromFile: "equipment list" },
  { text: `${PERSONA.kitchen}.`, fromFile: "yard" },
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
      name: "Seymour Johnson BPA call — dorm washing.docx",
      sizeKB: 88,
      mime: "docx",
      filledFields: ["past projects", "results"],
    },
    {
      kind: "gdocs",
      connectorId: "gdocs",
      name: "Account sheets: Hope Mills, Briar Glen, Two Creeks.docx",
      sizeKB: 226,
      mime: "docx",
      filledFields: ["past projects", "results"],
    },
  ],
  dropbox: [
    {
      kind: "dropbox",
      connectorId: "dropbox",
      name: "Crew roster and equipment list.pdf",
      sizeKB: 102,
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
      dueDate: isoDaysFromNow(38, 0),
      dfyAvailable: true,
      dfyPriceUSD: 250,
      smsOptIn: true,
      stakes:
        "HUBZone status is how you compete for set-aside work like the Fort Bragg exterior contract. Recertify every year, with 35% of your staff living in a HUBZone; you're at 41%, and night crews turn over.",
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
      stakes: "Every quote asks for active liability insurance. An expired policy means you can't bid.",
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
      stakes: "Your crews tow the wash trailers onto post. Fort Bragg's gate checks proof of cover.",
    },
  ];
};

/** The words the capability statement builder uses for his kind of business. */
export const CAP_STATEMENT = {
  tagline: "HUBZone janitorial and facilities firm 12 miles from Fort Bragg",
  place: (m: CapFacts) =>
    `${m.employees} staff: night custodial crews, floor techs and exterior techs, from an office and equipment yard in Fayetteville.`,
  work: (list: string) =>
    `We clean buildings at night, care for their floors in house, and wash their exteriors with hot water for buyers across ${list}.`,
  standard: "Wash water kept out of storm drains; crews badged for Fort Bragg and Seymour Johnson",
  proof: () => [],
  alternate: (m: CapFacts) => [
    `${m.businessName} is a HUBZone janitorial and facilities firm based in ${m.city}, ${m.state}, 12 miles from Fort Bragg.`,
    `Night custodial crews, floor care in house, and hot-water pressure washing with wash-water recovery.`,
  ],
};

/** His insurance, as Grant reads it. No bond: cleaning contracts don't ask for one. */
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
        expiry: dateDaysFromNow(120),
      },
      {
        type: "workers-comp",
        perOccurrence: 1_000_000,
        aggregate: null,
        carrier: "Piedmont Mutual",
        amBest: "A (XV)",
        basis: "occurrence",
        expiry: dateDaysFromNow(120),
      },
      {
        type: "auto",
        perOccurrence: 1_000_000,
        aggregate: null,
        carrier: "Piedmont Mutual",
        amBest: "A (XV)",
        basis: "occurrence",
        expiry: dateDaysFromNow(210),
      },
    ],
    bonding: null,
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
    registrations: { sam: true, cage: true, dibbs: false, piee: true },
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
    Federal <strong>cleaning contracts</strong> are priced by the building or the square foot, but
    the labor in them has a legal floor: the Service Contract Act wage determination for the county.
    For scale, a Fayetteville janitor&apos;s median pay is {fmtRate(LOCAL_JANITOR_MEDIAN)} an hour
    (BLS, May 2025), the same as the wage determination&apos;s base rate.
  </span>
);

/** The wage-floor table's words. */
export const WAGE_TABLE = {
  floor:
    "you can pay workers in these classes on a federal service contract here, plus $5.92 an hour in health and welfare. You can pay more — you can't pay less. From wage determination 2015-4377, Rev. 33.",
  compare:
    "Wage floors are the bottom; here's where comparable cleaning and exterior contracts near Fort Bragg landed on total price.",
};

/** His trade, in the words the buyer pages use. */
export const BUYER_TRADE = {
  label: "Janitorial and building services",
  phrase: "janitorial and building services",
};

/** The icon on the "buys my trade" pill. */
export const TRADE_ICON = SprayCan;

/** His intro email to a buyer. */
export const buyerIntro = (buyer: GovBuyer, officer: BuyerOfficer): string => {
  const past = PAST_PERFORMANCE.slice(0, 3)
    .map((p) => p.projectTitle)
    .join("; ");
  return `Subject: Introduction — ${PERSONA.businessName} (HUBZone, ${PERSONA.hqCity})

Dear ${officer.name},

My name is ${PERSONA.ownerName}. I'm the ${PERSONA.ownerTitle.toLowerCase()} of ${PERSONA.businessName}, a ${PERSONA.hqCity}-based HUBZone janitorial and facilities firm (NAICS ${PERSONA.primaryNaics}). We run night custodial crews, do our own floor care, and wash building exteriors with hot water and wash-water recovery. We'd like to be on your radar for upcoming cleaning and exterior work at ${buyer.name}.

In short:
  • HUBZone · Small Business · ${PERSONA.hqCity}-local, 12 miles from Fort Bragg
  • Work: night custodial, floor care, pressure washing, light grounds work
  • Past work: ${past}
  • Typical job size: ${k(PERSONA.targetValueMin)}–${k(PERSONA.targetValueMax)}
  • SAM-registered (UEI ${PERSONA.uei}, CAGE ${PERSONA.cage}); crews badged for Fort Bragg and Seymour Johnson

I've attached our capability statement. If there's a better person to speak with about ${buyer.location} facility services — or an upcoming industry day you'd recommend we attend — I'd be grateful for the pointer.

Thank you for your time,
${PERSONA.ownerName}
${PERSONA.businessName}
${PERSONA.email} · ${PERSONA.phone}`;
};

/** The Contract Vehicles page's words. */
export const VEHICLES_PAGE = {
  meta: "Pre-approved contracts that let agencies buy from you faster — and what they actually mean for a janitorial firm.",
  lead: "a janitorial and facilities firm like yours.",
  fitsLabel: "Fits my work (cleaning)",
  famous: "For a janitorial firm: the most famous vehicles (",
  path: (
    <>
      The ones that fit: your <strong>BPA at Seymour Johnson</strong> (its calls are yours to
      quote), the <strong>HUBZone set-asides</strong> you already qualify for, and{" "}
      <strong>teaming with an 8(a) prime</strong> on work you can&apos;t bid alone. The AbilityOne
      list is closed to commercial firms. We&apos;ve defaulted you to those.
    </>
  ),
};

/** The badge on a vehicle that does not fit his work. */
export const VEHICLES_NOT_FOR = "not for cleaning work";

/** How he knows the team-up partner, on an award page. */
export const KNOWN_PARTNER_NOTE =
  "who wrote to you about the Army Reserve centers. Ask him which North Carolina sites he needs a crew for.";

/** What he already shares with the team-up partner. */
export const KNOWN_CONTACT_HOOK = "his note to you about the Army Reserve centers";

/** A sample answer to one of Ava's text questions. */
export const AVA_SAMPLE_ANSWER = "Our own exterior techs run both hot-water rigs; we keep one on post on weekdays for Priority 1 calls.";

/** Ava's check line when the price covers every cost. */
export const AVA_PRICE_COVERS =
  "The price pays for your crews at the wage-determination rates plus health and welfare, fuel, chemicals, the rigs and every cost Ava knows about.";

/** The hint in the PSC search box. */
export const PSC_SEARCH_HINT = "Search a group or a code — custodial, grounds, carpet…";

export const MENTOR_BENCH = {
  sarah:
    "Pick the right bids, check your price, and read your quote before you send it. Best for custodial, grounds and exterior-cleaning contracts on Army and Air Force bases.",
  renee: {
    title: "Proposals and sources-sought answers · former proposal director",
    bio: "Renee led proposal teams at a federal facilities contractor for 11 years. She has written or reviewed more than 200 federal proposals, most of them for base services.",
    consultationDescription:
      "Answer a sources sought so you make the cut, or write a services proposal. Bring a draft or a notice and Renee will mark what the evaluators look for.",
  },
  calvin: {
    bio: "Calvin reviewed contractor prices for the Army for 13 years. He teaches small service firms to price labor at the wage-determination rates, with health and welfare, without under-bidding.",
    consultationDescription:
      "Build a price that covers your costs and still pays you. Calvin checks your labor classes, hours, supplies and margin line by line.",
  },
  angela: {
    bio: "Angela bought facility services for VA medical centers for 12 years. She explains how the VA buys cleaning and what its evaluators look for.",
    consultationDescription:
      "Sell to the VA. Learn the VA's forms, its veteran-first rules, and how to work under a veteran-owned prime.",
  },
};

export const PALETTE_WORDS = {
  sell: ["account sheets", "crews"],
  papers: ["wage determination", "reference letter"],
};

export const LABOR_PRICING = {
  list: (
    <ul className="market-what-list">
      <li>
        Federal <strong>cleaning contracts</strong> are usually bought on <em>lowest price
        technically acceptable</em>: every acceptable quote ties on quality, so price decides.
      </li>
      <li>
        The labor in it has a legal floor: the government&apos;s{" "}
        <JargonGloss term="wage determination">
          The hourly rate and health-and-welfare benefit set by the U.S. Department of Labor under
          the Service Contract Act for each service job and county. The legal minimum on federal
          service contracts.
        </JargonGloss>{" "}
        sets minimum pay for janitors, floor techs, laborers and grounds workers in your county.
      </li>
      <li>
        Quick answer to "what should I bid":{" "}
        <em>your costs at the wage-determination rates set the bottom; what similar contracts went
        for is the top.</em> Bid between, and price every option year you sign up for.
      </li>
    </ul>
  ),
  lcatLine:
    "Local pay for janitors, floor techs, grounds workers and maintenance workers (BLS). Federal service contracts pay at least the wage determination.",
};

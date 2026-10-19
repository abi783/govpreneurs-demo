// THE TRUCKING COMPANY: what the shared screens say about Rockfish Run
// Freight's trade. One export per screen. The caterer's words sit beside the
// shared code (byMember); every pack member has this file with these exports
// (pack.test.ts).

import { Truck } from "lucide-react";
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
import { LOCAL_DESIGNER_MEDIAN } from "./market/laborRates";
import { PAST_PERFORMANCE, PERSONA } from "./persona";

function k(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M` : `${Math.round(n / 1000)}K`;
}

/** Fayetteville metro median hourly pay for heavy and tractor-trailer drivers, BLS May 2025 (market/laborRates.ts). */
const LOCAL_TRUCK_DRIVER_MEDIAN = LOCAL_DESIGNER_MEDIAN;

/** Days before the demo opens (sc/timeline.ts). */
export const HISTORY = {
  MEMBER_SINCE_DAYS: 300,
  ONBOARDING_CALL_DAYS_AGO: 298,
  COMPLIANCE_CALL_DAYS_AGO: 286,
  POSITIONING_CALL_DAYS_AGO: 196,
  SAM_CHECKED_DAYS_AGO: 183,
  FIRST_MENTOR_QUESTION_DAYS_AGO: 40,
};

/** When she started and finished each Roadmap step, in days ago (sc/roadmap/model.ts). */
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

/** What her CMMC Level 1 self-assessment covers. */
export const CMMC_SCOPE = "Dispatch, GPS tracking, billing and office systems";

/**
 * The size of her capability statement in public/demo-files
 * (scripts/make-capability-statement.ts writes it). Still the agency's number:
 * the Success Center pass adds her COPY lines and resets it.
 */
export const CAPABILITY_STATEMENT_BYTES = 3305;

/** What she calls a job when she says how many she can run at once (My Business, "Tell us"). */
export const JOB_WORDS = /\b(jobs|routes|runs|loads|contracts|lanes)\b/i;

/** The product and service code groups she picks from first (sc/business/data/psc.ts). */
export const PSC_GROUPS: GroupDef[] = [
  {
    groupCode: "V1",
    groupTitle: "Transportation of Things",
    segment: "service",
    category: "Transportation, Travel and Relocation Services",
    codes: [
      ["V111", "Transportation/Travel/Relocation- Transportation: Motor Freight"],
      ["V119", "Transportation/Travel/Relocation- Transportation: Other"],
      ["V122", "Transportation/Travel/Relocation- Transportation: Motor Charter for Things"],
    ],
  },
  {
    groupCode: "R7",
    groupTitle: "Support Services (Management)",
    segment: "service",
    category: "Professional, Administrative and Management Support Services",
    codes: [["R706", "Support- Management: Logistics Support"]],
  },
];

/** Rows only a document can answer, beyond the ones every member has. */
export const UPLOAD_EXTRAS: { field: string; test: RegExp }[] = [
  { field: "doc_past_performance", test: /\b(CPARS|performance rating)\b/i },
  { field: "doc_certifications", test: /\b(VetCert|SDVOSB|service-disabled veteran-owned) (?:certificate|certification|letter)\b/i },
];

/** How My Business turns her own words into facts (sc/business/demoTell.ts). */
export const TELL_RULES = {
  /** A sentence about her people. */
  personnel: /\b(drivers?|dispatchers?|mechanics?|safety manager|billing manager|helpers?|crews?)\b/i,
  /** A sentence about her gear. */
  equipment:
    /\b(tractors?|trailers?|box trucks?|dry vans?|reefers?|flatbeds?|cargo vans?|lift[- ]gates?|GPS)\b/i,
  /** What she does, as a buyer would search for it ("we haul trailers" → "trailers"). */
  serviceVerbs: /\b(we|i) (haul|run|move|deliver|carry|drive|truck|ship|do)\b/i,
  services:
    /\b(?:routes?|truckloads?|freight|linen|supplies|trailers?|containers?|furniture|courier runs?|storm hauling|deliver(?:y|ies))\b/gi,
  /** What sets her apart. */
  differentiators:
    /\b(service-disabled|veteran-owned|SDVOSB|former Army|Fort Bragg's gates|GPS on every truck|5 AM)\b/i,
};

/** Her own words for her work (Business Profile). */
export const CORE_CAPABILITIES = [
  "Scheduled box-truck routes with lift gates",
  "Dry-van and reefer truckload across NC, SC and VA",
  "On-call trailer, container and generator moves",
  "Furniture and equipment moves with a 4-person crew",
];

/** The example in the PSC box. */
export const PSC_EXAMPLE = "V111, V119";

/** States whose vendor list she is already on. */
export const SLED_REGISTERED: Record<
  string,
  { vendorId: string; registeredDaysAgo: number } | undefined
> = { NC: { vendorId: "0001071385", registeredDaysAgo: 262 } };

/** The state whose vendor registration GovPreneurs is doing for her (Done for you). NC or VA. */
export const DFY_SLED_STATE = "VA" as "NC" | "VA";

/** The example row in the past-performance upload template. */
export const PAST_PERFORMANCE_EXAMPLE =
  '"Example: daily supply routes, county clinics","Example County",60000,2024-01-01,2024-12-31,484110,Prime,"Two box trucks ran supplies to six clinics every weekday. On time 99% of days."';

/** The job still waiting for a performance rating. */
export const RATING_JOB = "your Fort Bragg hauling job";

/** Gaps from her story the readiness header names first: no GSA schedule fits freight; no named PM and Alternate. */
export const READINESS_GAPS = { gsa: false, keyPersonnel: true };

/** What the knowledge hub read from her own files. */
export const LEARNED_FACTS: LearnedFact[] = [
  {
    text: "Certified service-disabled veteran-owned (SBA VetCert) since Dec 2023. Eligibility ends in 47 days.",
    fromFile: "vetcert certification letter",
  },
  { text: "USDOT and MC authority since 2017, and a SCAC.", fromFile: "operating authority" },
  {
    text: "The Fort Bragg trailer and container job: 46 moves in 12 months, not rated yet.",
    fromFile: "job records",
  },
  { text: `${PERSONA.kitchen}.`, fromFile: "yard" },
];

/** The files in her connected drives (lib/knowledgeBase.ts). */
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
      name: "VetCert certification letter.pdf",
      sizeKB: 168,
      mime: "pdf",
      filledFields: ["certifications", "renewal date"],
    },
  ],
  gdocs: [
    {
      kind: "gdocs",
      connectorId: "gdocs",
      name: "USDOT and MC authority, SCAC.docx",
      sizeKB: 58,
      mime: "docx",
      filledFields: ["licenses"],
    },
    {
      kind: "gdocs",
      connectorId: "gdocs",
      name: "Job sheets: Fort Bragg, NCDOT, Quarry Lane, Cypress Bend.docx",
      sizeKB: 204,
      mime: "docx",
      filledFields: ["past projects", "results"],
    },
  ],
  dropbox: [
    {
      kind: "dropbox",
      connectorId: "dropbox",
      name: "Fleet and driver list.pdf",
      sizeKB: 88,
      mime: "pdf",
      filledFields: ["staff", "equipment"],
    },
  ],
};

/** What Stay Ready tracks for her, after the SAM.gov item every member has. */
export const stayReadyItems = (samItem: () => TrackedItem): TrackedItem[] => {
  return [
    samItem(),
    {
      id: "vetcert",
      kind: "wosb-cert",
      name: "VetCert recertification",
      shortName: "VetCert",
      dueDate: isoDaysFromNow(47, 0),
      dfyAvailable: true,
      dfyPriceUSD: 250,
      smsOptIn: true,
      stakes:
        "Service-disabled veteran-owned status is how you compete on VA set-asides like the Fayetteville supply and linen runs. Recertify every 3 years; the 90-day window is open now.",
      govLink: "https://veterans.certify.sba.gov",
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
      stakes: "Every quote asks for active liability insurance. An expired policy means you can't submit.",
    },
    {
      id: "insurance-auto",
      kind: "insurance",
      name: "Commercial auto liability and cargo insurance",
      shortName: "auto and cargo",
      dueDate: isoDaysFromNow(150, 0),
      dfyAvailable: false,
      dfyPriceUSD: 0,
      smsOptIn: true,
      stakes:
        "Your operating authority needs it on file with FMCSA, and Fort Bragg's gates check proof of cover. If it lapses, your trucks stop.",
    },
  ];
};

/** The words the capability statement builder uses for her kind of business. */
export const CAP_STATEMENT = {
  tagline: "Service-disabled veteran-owned trucking company 12 miles from Fort Bragg",
  place: (m: CapFacts) =>
    `${m.employees} staff: 12 drivers, a dispatcher and a safety and billing manager, from a truck yard in Fayetteville.`,
  work: (list: string) =>
    `We run scheduled box-truck routes, dry-van and reefer truckload, and on-call trailer and container moves for buyers across ${list}.`,
  standard: "Dispatch from 5 AM to 9 PM; GPS on every truck",
  proof: () => [],
  alternate: (m: CapFacts) => [
    `${m.businessName} is a service-disabled veteran-owned trucking company based in ${m.city}, ${m.state}, 12 miles from Fort Bragg.`,
    `Run by a former Army truck driver who knows Fort Bragg's gates and access rules.`,
  ],
};

/** Her insurance, as Grant reads it. No surety bonds: trucking is bought without them. */
export const insurance = (): InsuranceBonding => {
  return {
    coverages: [
      {
        type: "gl",
        perOccurrence: 1_000_000,
        aggregate: 2_000_000,
        carrier: "Carolina Road Mutual",
        amBest: "A (XII)",
        basis: "occurrence",
        expiry: dateDaysFromNow(120),
      },
      {
        type: "auto",
        perOccurrence: 1_000_000,
        aggregate: null,
        carrier: "Carolina Road Mutual",
        amBest: "A (XII)",
        basis: "occurrence",
        expiry: dateDaysFromNow(150),
      },
      {
        type: "workers-comp",
        perOccurrence: 1_000_000,
        aggregate: null,
        carrier: "Carolina Road Mutual",
        amBest: "A (XII)",
        basis: "occurrence",
        expiry: dateDaysFromNow(120),
      },
      {
        type: "umbrella",
        perOccurrence: 2_000_000,
        aggregate: 2_000_000,
        carrier: "Atlantic Specialty Underwriters",
        amBest: "A (XIII)",
        basis: "occurrence",
        expiry: dateDaysFromNow(120),
      },
    ],
    bonding: null,
  };
};

/** Her starting answers on the Small Orders board. */
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
    Federal <strong>trucking work</strong> is priced per route, per mile or per move, but the
    drivers&apos; pay in it has a legal floor: the Service Contract Act wage determination for the
    county. For scale, a Fayetteville heavy-truck driver&apos;s median pay is{" "}
    {fmtRate(LOCAL_TRUCK_DRIVER_MEDIAN)} an hour (BLS, May 2025), the same as the floor.
  </span>
);

/** The wage-floor table's words. */
export const WAGE_TABLE = {
  floor:
    "you can pay staff in these titles on a federal service contract here. You can pay more — you can't pay less. From wage determination 2015-4377, Rev. 33, for Cumberland and Hoke counties.",
  compare:
    "Wage floors are the bottom; here's where comparable trucking and courier jobs near Fort Bragg landed on total price.",
};

/** Her trade, in the words the buyer pages use. */
export const BUYER_TRADE = {
  label: "Trucking and freight",
  phrase: "trucking and freight",
};

/** The icon on the "buys my trade" pill. */
export const TRADE_ICON = Truck;

/** Her intro email to a buyer. */
export const buyerIntro = (buyer: GovBuyer, officer: BuyerOfficer): string => {
  const past = PAST_PERFORMANCE.slice(0, 3)
    .map((p) => p.projectTitle)
    .join("; ");
  return `Subject: Introduction — ${PERSONA.businessName} (SDVOSB, ${PERSONA.hqCity})

Dear ${officer.name},

My name is ${PERSONA.ownerName}. I'm the ${PERSONA.ownerTitle.toLowerCase()} of ${PERSONA.businessName}, a ${PERSONA.hqCity}-based, service-disabled veteran-owned trucking company (NAICS ${PERSONA.primaryNaics}). I drove trucks for the Army for 12 years, the last five at Fort Bragg. We run scheduled box-truck routes, dry-van and reefer truckload, and on-call trailer and container moves. We'd like to be on your radar for upcoming trucking and freight work at ${buyer.name}.

In short:
  • SDVOSB (SBA VetCert) · Small Business · ${PERSONA.hqCity}-local, 12 miles from Fort Bragg
  • Fleet: 7 tractors, 9 trailers, 4 box trucks with lift gates, a cargo van; GPS on every truck
  • Past work: ${past}
  • Typical job size: ${k(PERSONA.targetValueMin)}–${k(PERSONA.targetValueMax)}
  • SAM-registered (UEI ${PERSONA.uei}, CAGE ${PERSONA.cage}); USDOT and MC authority since 2017

I've attached our capability statement. If there's a better person to speak with about ${buyer.location} trucking work — or an upcoming industry day you'd recommend we attend — I'd be grateful for the pointer.

Thank you for your time,
${PERSONA.ownerName}
${PERSONA.businessName}
${PERSONA.email} · ${PERSONA.phone}`;
};

/** The Contract Vehicles page's words. */
export const VEHICLES_PAGE = {
  meta: "Pre-approved contracts that let agencies buy from you faster — and what they actually mean for a trucking company.",
  lead: "a trucking company like yours.",
  fitsLabel: "Fits my work (trucking)",
  famous: "For a trucking company: the most famous vehicles (",
  path: (
    <>
      The ones that fit: <strong>SDDC&apos;s Freight Carrier Registration Program</strong> (you
      qualify and aren&apos;t in yet; it&apos;s the door to DoD freight), the{" "}
      <strong>service-disabled veteran-owned set-asides</strong> you already qualify for, and{" "}
      <strong>teaming with a prime</strong> on work only its holders can bid. We&apos;ve defaulted
      you to those.
    </>
  ),
};

/** The badge on a vehicle that does not fit her work. */
export const VEHICLES_NOT_FOR = "not for trucking";

/** How she knows the team-up partner, on an award page. */
export const KNOWN_PARTNER_NOTE =
  "who wrote to you about Fort Bragg's logistics contract. Ask him which freight runs and trailer moves he needs a carrier for.";

/** What she already shares with the team-up partner. */
export const KNOWN_CONTACT_HOOK = "his note to you about Fort Bragg's logistics contract";

/** A sample answer to one of Ava's text questions. */
export const AVA_SAMPLE_ANSWER = "Our own drivers run every route in our own trucks; we don't broker loads.";

/** Ava's check line when the price covers every cost. */
export const AVA_PRICE_COVERS =
  "The price pays for your drivers at the wage-determination rates, the diesel, the trucks and every cost Ava knows about.";

/** The hint in the PSC search box. */
export const PSC_SEARCH_HINT = "Search a group or a code — freight, transportation, logistics…";

export const MENTOR_BENCH = {
  sarah:
    "Pick the right bids, check your price, and read your quote before you send it. Best for Army and VA services bids at Fort Bragg.",
  renee: {
    title: "Proposals and sources-sought answers · former proposal director",
    bio: "Renee led proposal teams at a federal logistics contractor for 11 years, including two base-logistics offers. She has written or reviewed more than 200 federal proposals.",
    consultationDescription:
      "Answer a sources sought so you make the cut, or write a technical volume. Bring a draft or a notice and Renee will mark what the evaluators look for.",
  },
  calvin: {
    bio: "Calvin reviewed contractor prices for the Army for 13 years. He teaches small carriers to price drivers at the wage-determination rates, fuel and trucks without under-bidding.",
    consultationDescription:
      "Build a quote that covers your costs and still pays you. Calvin checks your driver hours, fuel base, truck costs and margin line by line.",
  },
  angela: {
    bio: "Angela bought transportation and support services for VA medical centers for 12 years. She explains how the VA buys trucking and what its evaluators look for.",
    consultationDescription:
      "Sell to the VA. Learn the VA's forms, its veteran-first rules, and how to price a five-year route contract.",
  },
};

export const PALETTE_WORDS = {
  sell: ["job sheets", "fleet list"],
  papers: ["operating authority", "insurance"],
};

export const LABOR_PRICING = {
  list: (
    <ul className="market-what-list">
      <li>
        Federal <strong>trucking work</strong> is usually a <em>fixed price</em>: per route, per
        mile, per move or per trip, for a base year and options.
      </li>
      <li>
        The drivers&apos; pay in it has a legal floor: the government&apos;s{" "}
        <JargonGloss term="wage determination">
          The hourly rate and health-and-welfare set by the U.S. Department of Labor under the
          Service Contract Act for each job title and county. The legal minimum on federal service
          contracts.
        </JargonGloss>{" "}
        sets minimum pay and benefits for truck drivers, couriers, dispatchers and helpers in your
        county.
      </li>
      <li>
        Quick answer to "what should I quote":{" "}
        <em>your drivers at the wage-determination rates, plus diesel at a stated price, plus the
        trucks, set the bottom; what similar routes went for is the top.</em> Quote between.
      </li>
    </ul>
  ),
  lcatLine:
    "Local pay for truck drivers, couriers, dispatchers and helpers (BLS). Federal service contracts pay at least the wage determination.",
};

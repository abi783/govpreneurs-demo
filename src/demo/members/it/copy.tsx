// THE IT SERVICES FIRM: what the shared screens say about Gallberry Technology
// Group's trade. One export per screen. The caterer's words sit beside the
// shared code (byMember); every pack member has this file with these exports
// (pack.test.ts).

import { Monitor } from "lucide-react";
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

/** Fayetteville metro median pay for computer user support specialists, BLS May 2025 (it-services-pack.md §13). */
const LOCAL_SUPPORT_MEDIAN = 27.76;

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
export const CMMC_SCOPE = "Office network, ticketing system and the techs' laptops";

/** The size of his capability statement in public/demo-files (scripts/make-capability-statement.ts writes it). */
export const CAPABILITY_STATEMENT_BYTES = 3404;

/** What he calls a job when he says how many he can run at once (My Business, "Tell us"). */
export const JOB_WORDS = /\b(jobs|contracts|sites|seats|clients)\b/i;

/** The product and service code groups he picks from first (sc/business/data/psc.ts). */
export const PSC_GROUPS: GroupDef[] = [
  {
    groupCode: "DE",
    groupTitle: "IT and Telecom — End User",
    segment: "service",
    category: "IT and Telecom Services",
    codes: [
      ["DE01", "IT and Telecom - End User: Help Desk; Tier 1-2, Workspace, Print, Output, Productivity Tools (Labor)"],
    ],
  },
  {
    groupCode: "DG",
    groupTitle: "IT and Telecom — Network",
    segment: "service",
    category: "IT and Telecom Services",
    codes: [["DG01", "IT and Telecom - Network Support Services (Labor)"]],
  },
  {
    groupCode: "DJ",
    groupTitle: "IT and Telecom — Security and Compliance",
    segment: "service",
    category: "IT and Telecom Services",
    codes: [["DJ01", "IT and Telecom - Security and Compliance Support Services (Labor)"]],
  },
];

/** Rows only a document can answer, beyond the ones every member has. */
export const UPLOAD_EXTRAS: { field: string; test: RegExp }[] = [
  { field: "doc_past_performance", test: /\b(CPARS|performance rating)\b/i },
  { field: "doc_certifications", test: /\b8\(a\) (?:certificate|certification|approval letter)\b/i },
  { field: "credentials", test: /\b(Security\+|DoD 8140|certification roster)\b/i },
];

/** How My Business turns his own words into facts (sc/business/demoTell.ts). */
export const TELL_RULES = {
  /** A sentence about his people. */
  personnel:
    /\b(techs?|technicians?|network admins?|administrators?|site leads?|security officers?|engineers?|analysts?)\b/i,
  /** A sentence about his gear. */
  equipment:
    /\b(laptops?|imaging stations?|ticketing system|loaner devices?|cable testers?|toolkits?|vans?)\b/i,
  /** What he does, as a buyer would search for it ("we image laptops" → "laptops"). */
  serviceVerbs: /\b(we|i) (run|staff|support|image|manage|install|fix|set up|do)\b/i,
  services:
    /\b(?:help desk|service desk|desktop support|imaging|asset tracking|video conferencing|VTC|Microsoft 365|Intune|SharePoint|network support|managed IT|Wi-?Fi)\b/gi,
  /** What sets him apart. */
  differentiators: /\b(8\(a\)|Security\+|Army tickets|Air Force tickets|within (?:2|two) hours|on site)\b/i,
};

/** His own words for his work (Business Profile). */
export const CORE_CAPABILITIES = [
  "Help desk, Tier 1 and Tier 2, by phone and walk-up",
  "Desktop support, imaging and asset tracking",
  "Video-conference room support",
  "Microsoft 365, Intune and SharePoint admin, and network support",
];

/** The example in the PSC box. */
export const PSC_EXAMPLE = "DE01, DG01";

/** States whose vendor list he is already on. */
export const SLED_REGISTERED: Record<
  string,
  { vendorId: string; registeredDaysAgo: number } | undefined
> = { NC: { vendorId: "0001073385", registeredDaysAgo: 262 } };

/** The state whose vendor registration GovPreneurs is doing for him (Done for you). NC or VA. */
export const DFY_SLED_STATE = "VA" as "NC" | "VA";

/** The example row in the past-performance upload template. */
export const PAST_PERFORMANCE_EXAMPLE =
  '"Example: help desk for a county office","Example County",85000,2024-07-01,2025-06-30,541519,Prime,"Ran Tier 1 and Tier 2 support for 300 staff, with a tech on site every weekday."';

/** The job still waiting for a final performance rating. */
export const RATING_JOB = "your Seymour Johnson desktop support";

/** Gaps from his story the readiness header names first: he holds a GSA schedule; no named site lead and alternate yet. */
export const READINESS_GAPS = { gsa: false, keyPersonnel: true };

/** What the knowledge hub read from his own files. */
export const LEARNED_FACTS: LearnedFact[] = [
  {
    text: "In the SBA 8(a) program since March 2021. The term ends in March 2030.",
    fromFile: "8(a) approval letter",
  },
  { text: "9 of 11 techs hold Security+; 2 exams still to book.", fromFile: "certification roster" },
  {
    text: "The Seymour Johnson desktop support, rated Very Good so far.",
    fromFile: "cpars report",
  },
  { text: `${PERSONA.kitchen}.`, fromFile: "office" },
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
      name: "SBA 8(a) approval letter.pdf",
      sizeKB: 166,
      mime: "pdf",
      filledFields: ["certifications", "program term"],
    },
  ],
  gdocs: [
    {
      kind: "gdocs",
      connectorId: "gdocs",
      name: "Tech certification roster (Security+ and others).docx",
      sizeKB: 58,
      mime: "docx",
      filledFields: ["staff", "certifications"],
    },
    {
      kind: "gdocs",
      connectorId: "gdocs",
      name: "Past jobs: Seymour Johnson, Fort Bragg help desk, Cumberland County Schools.docx",
      sizeKB: 204,
      mime: "docx",
      filledFields: ["past projects", "results"],
    },
  ],
  dropbox: [
    {
      kind: "dropbox",
      connectorId: "dropbox",
      name: "GSA MAS price list, SIN 54151S.pdf",
      sizeKB: 118,
      mime: "pdf",
      filledFields: ["labor categories", "rates"],
    },
  ],
};

/** What Stay Ready tracks for him, after the SAM.gov item every member has. */
export const stayReadyItems = (samItem: () => TrackedItem): TrackedItem[] => {
  return [
    samItem(),
    {
      // The 8(a) annual review uses the certification steps.
      id: "8a-annual-review",
      kind: "wosb-cert",
      name: "8(a) annual review",
      shortName: "8(a) review",
      dueDate: isoDaysFromNow(52, 0),
      dfyAvailable: true,
      dfyPriceUSD: 250,
      smsOptIn: true,
      stakes:
        "Your 8(a) status is how you compete on set-aside work like the Army Reserve help desk at Fort Bragg. SBA reviews your financial records every year; in January 2026 it suspended more than 1,000 firms that didn't send them.",
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
        "Most federal and state solicitations require active liability insurance. An expired policy means you can't submit.",
    },
    {
      id: "insurance-tech-eo",
      kind: "insurance",
      name: "Technology errors and omissions and cyber insurance",
      shortName: "tech E&O",
      dueDate: isoDaysFromNow(210, 0),
      dfyAvailable: false,
      dfyPriceUSD: 0,
      smsOptIn: false,
      stakes:
        "IT support contracts often ask for errors and omissions and cyber cover. If it lapses, a claim about a network outage is yours to pay.",
    },
  ];
};

/** The words the capability statement builder uses for his kind of business. */
export const CAP_STATEMENT = {
  tagline: "8(a) IT services firm 12 miles from Fort Bragg",
  place: (m: CapFacts) =>
    `${m.employees} staff: 11 techs, 2 network admins and a security officer, with a second crew on site at Seymour Johnson AFB.`,
  work: (list: string) =>
    `We run help desks, desktop and video-conference support, Microsoft 365 and SharePoint admin, and network support for buyers across ${list}.`,
  standard: "Security+ techs who already work on Army and Air Force networks; at your desk within 2 hours inside 30 miles",
  proof: () => [],
  alternate: (m: CapFacts) => [
    `${m.businessName} is an 8(a) IT services firm based in ${m.city}, ${m.state}, 12 miles from Fort Bragg.`,
    `Our techs already work Army and Air Force tickets, so a buyer gets people who know the networks from the first day.`,
  ],
};

/** His insurance, as Grant reads it. IT services are not bonded. The dates match Stay Ready. */
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
        type: "tech-eo",
        perOccurrence: 2_000_000,
        aggregate: 2_000_000,
        carrier: "Atlantic Specialty Underwriters",
        amBest: "A (XIII)",
        basis: "claims-made",
        expiry: dateDaysFromNow(210),
      },
      {
        type: "cyber",
        perOccurrence: 1_000_000,
        aggregate: 1_000_000,
        carrier: "Atlantic Specialty Underwriters",
        amBest: "A (XIII)",
        basis: "claims-made",
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
    registrations: { sam: true, cage: true, dibbs: true, piee: true },
    firstRegistrationAt: null,
    samExpiresOn: PERSONA.samActiveUntil,
    seenOrderIds: [],
  };
};

/** Where the labor-rate benchmark can be filtered to. */
export const LCAT_LOCATIONS: (LcatLocation | "all")[] = ["all", "Nationwide"];

/** The note above the labor-rate benchmark. */
export const LCAT_BANNER = (
  <span>
    This is how most federal <strong>IT support work</strong> is priced: people billed by the hour.
    These are GSA schedule ceiling rates, the most a firm may bill. For scale, a Fayetteville
    support tech&apos;s median pay is {fmtRate(LOCAL_SUPPORT_MEDIAN)} an hour (BLS, May 2025), and
    the wage floor on a federal help desk here is higher; the gap to the billed rate pays for
    benefits, overhead and profit.
  </span>
);

/** The wage-floor table's words. */
export const WAGE_TABLE = {
  floor:
    "you can pay techs in these titles on a federal service contract here. You can pay more — you can't pay less. From the current Department of Labor wage determination for Cumberland and Hoke counties.",
  compare:
    "Wage floors are the bottom; here's where comparable IT support jobs near Fort Bragg landed on total price.",
};

/** His trade, in the words the buyer pages use. */
export const BUYER_TRADE = {
  label: "IT support services",
  phrase: "IT support services",
};

/** The icon on the "buys my trade" pill. */
export const TRADE_ICON = Monitor;

/** His intro email to a buyer. */
export const buyerIntro = (buyer: GovBuyer, officer: BuyerOfficer): string => {
  const past = PAST_PERFORMANCE.slice(0, 3)
    .map((p) => p.projectTitle)
    .join("; ");
  return `Subject: Introduction — ${PERSONA.businessName} (8(a), ${PERSONA.hqCity})

Dear ${officer.name},

My name is ${PERSONA.ownerName}. I'm the ${PERSONA.ownerTitle.toLowerCase()} of ${PERSONA.businessName}, a ${PERSONA.hqCity}-based 8(a) IT services firm (NAICS ${PERSONA.primaryNaics}). We run help desks and desktop support, video-conference rooms, Microsoft 365 and SharePoint admin, and network support, with Security+ techs who already work on Army and Air Force networks. We'd like to be on your radar for upcoming IT support work at ${buyer.name}.

In short:
  • SBA 8(a) · Small Disadvantaged Business · ${PERSONA.hqCity}-local, 12 miles from Fort Bragg
  • Work: help desk, desktop support and imaging, video conferencing, Microsoft 365, network support
  • Past work: ${past}
  • Typical job size: ${k(PERSONA.targetValueMin)}–${k(PERSONA.targetValueMax)}
  • SAM-registered (UEI ${PERSONA.uei}, CAGE ${PERSONA.cage}); GSA MAS, SIN 54151S; CMMC Level 1 (Self)

I've attached our capability statement. If there's a better person to speak with about ${buyer.location} IT work — or an upcoming industry day you'd recommend we attend — I'd be grateful for the pointer.

Thank you for your time,
${PERSONA.ownerName}
${PERSONA.businessName}
${PERSONA.email} · ${PERSONA.phone}`;
};

/** The Contract Vehicles page's words. */
export const VEHICLES_PAGE = {
  meta: "Pre-approved contracts that let agencies buy from you faster — and what they actually mean for an IT services firm.",
  lead: "an IT services firm like yours.",
  fitsLabel: "Fits my work (IT services)",
  famous: "For an IT services firm: the most famous vehicles (",
  path: (
    <>
      The ones that fit: the <strong>GSA schedule</strong> you already hold (SIN 54151S), the{" "}
      <strong>8(a) set-asides</strong> you qualify for, and <strong>teaming with a prime</strong>{" "}
      on work ordered through contracts you&apos;re not on. The Army&apos;s next IT contract is the
      one to watch. We&apos;ve defaulted you to those.
    </>
  ),
};

/** The badge on a vehicle that does not fit his work. */
export const VEHICLES_NOT_FOR = "not for IT services";

/** How he knows the team-up partner, on an award page. */
export const KNOWN_PARTNER_NOTE =
  "who wrote to you about the Army hospital's IT support. Ask her how many techs she needs at the clinics.";

/** What he already shares with the team-up partner. */
export const KNOWN_CONTACT_HOOK = "her note to you about the Army hospital's IT support";

/** A sample answer to one of Ava's text questions. */
export const AVA_SAMPLE_ANSWER = "Our own techs staff every seat; four of the six already hold Security+.";

/** Ava's check line when the price covers every cost. */
export const AVA_PRICE_COVERS =
  "The price pays every tech at or above the wage floor, plus benefits, overhead and every cost Ava knows about.";

/** The hint in the PSC search box. */
export const PSC_SEARCH_HINT = "Search a group or a code — help desk, network, security…";

export const MENTOR_BENCH = {
  sarah:
    "Pick the right bids, check your price, and read your quote before you send it. Best for Army IT support bids at Fort Bragg.",
  renee: {
    title: "Proposal writing and GSA schedules · former proposal director",
    bio: "Renee led proposal teams at a federal IT contractor for 11 years, including task order bids on Army and GSA contracts. She has written or reviewed more than 200 federal proposals.",
    consultationDescription:
      "Write a staffing plan that scores, or answer a sources sought so you make the cut. Bring a draft or a notice and Renee will mark what the evaluators look for.",
  },
  calvin: {
    bio: "Calvin reviewed contractor prices for the Army for 13 years. He teaches small IT firms to price techs at the wage floor, benefits and overhead without under-bidding.",
    consultationDescription:
      "Build a price that covers your costs and still pays you, option years included. Calvin checks your labor categories, wage-floor rates and margin line by line.",
  },
  angela: {
    bio: "Angela bought IT and facility services for VA medical centers for 12 years. She explains how the VA buys IT support and what its evaluators score.",
    consultationDescription:
      "Sell to the VA. Learn the VA's forms, its veteran-first rules, and how to work under a veteran-owned prime.",
  },
};

export const PALETTE_WORDS = {
  sell: ["past jobs", "certifications"],
  papers: ["8(a) letter", "CPARS"],
};

export const LABOR_PRICING = {
  list: (
    <ul className="market-what-list">
      <li>
        Most federal <strong>IT support work</strong> is priced <em>per person per hour</em>, by
        labor category, or as a fixed price built from those hours. Contracting officers check your
        rates against GSA schedule rates for the same roles — the benchmark below.
      </li>
      <li>
        Help-desk titles also carry a legal floor: the government&apos;s{" "}
        <JargonGloss term="wage determination">
          The hourly rate and health and welfare pay set by the U.S. Department of Labor under the
          Service Contract Act for each job title and county. The legal minimum on federal service
          contracts.
        </JargonGloss>{" "}
        sets minimum pay for PC support technicians and computer operators in your county.
      </li>
      <li>
        Quick answer to "what should I charge":{" "}
        <em>the wage floor plus benefits and overhead sets the bottom; the median GSA rate for each
        role is a fair top.</em> On a lowest-price buy, stay close to the bottom.
      </li>
    </ul>
  ),
  lcatLine:
    "GSA schedule rates for help desk specialists, desktop techs, network admins and more. This is how most IT support work is priced.",
};

// THE CONSULTANT: what the shared screens say about Coppervale Advisory Group's
// trade. One export per screen. The caterer's words sit beside the shared code
// (byMember); every pack member has this file with these exports (pack.test.ts).

import { Briefcase } from "lucide-react";
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
  return `${Math.round(n / 1000)}K`;
}

/** Fayetteville metro median hourly pay for management analysts, BLS May 2025 (consulting-pack.md, Labor rates). */
const LOCAL_ANALYST_MEDIAN = 48.94;

/** Days before the demo opens (sc/timeline.ts). */
export const HISTORY = {
  MEMBER_SINCE_DAYS: 300,
  ONBOARDING_CALL_DAYS_AGO: 298,
  COMPLIANCE_CALL_DAYS_AGO: 286,
  POSITIONING_CALL_DAYS_AGO: 196,
  SAM_CHECKED_DAYS_AGO: 183,
  FIRST_MENTOR_QUESTION_DAYS_AGO: 41,
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
export const CMMC_SCOPE = "Office, survey and 360-assessment systems";

/** The size of her capability statement in public/demo-files (scripts/make-capability-statement.ts writes it). */
export const CAPABILITY_STATEMENT_BYTES = 3449;

/** What she calls a job when she says how many she can run at once (My Business, "Tell us"). */
export const JOB_WORDS = /\b(jobs|projects|contracts|cohorts|engagements|clients)\b/i;

/** The product and service code groups she picks from first (sc/business/data/psc.ts). */
export const PSC_GROUPS: GroupDef[] = [
  {
    groupCode: "R4",
    groupTitle: "Support Services (Professional, Administrative, Management)",
    segment: "service",
    category: "Professional, Administrative and Management Support Services",
    codes: [
      ["R408", "Support- Professional: Program Management or Support"],
      ["R431", "Support- Professional: Human Resources"],
      ["R499", "Support- Professional: Other"],
      ["R799", "Support- Management: Other"],
    ],
  },
  {
    groupCode: "U0",
    groupTitle: "Education and Training",
    segment: "service",
    category: "Education and Training",
    codes: [
      ["U008", "Education/Training- Training/Curriculum Development"],
      ["U099", "Education/Training- Other"],
    ],
  },
];

/** Rows only a document can answer, beyond the ones every member has. */
export const UPLOAD_EXTRAS: { field: string; test: RegExp }[] = [
  { field: "doc_past_performance", test: /\b(CPARS|performance rating)\b/i },
  { field: "doc_certifications", test: /\b(VetCert|veteran-owned (?:certificate|certification|letter))\b/i },
  { field: "doc_marketing", test: /\b(program outline|sample (?:360 )?report|work samples)\b/i },
];

/** How My Business turns her own words into facts (sc/business/demoTell.ts). */
export const TELL_RULES = {
  /** A sentence about her people. */
  personnel:
    /\b(consultants?|facilitators?|coaches|coach|trainers?|analysts?|program managers?|instructional designers?)\b/i,
  /** A sentence about her gear. */
  equipment:
    /\b(training room|classroom|360 (?:tool|platform)|survey tool|laptops?|projectors?|learning platform)\b/i,
  /** What she does, as a buyer would search for it ("we run leadership programs" → "leadership programs"). */
  serviceVerbs: /\b(we|i) (run|teach|lead|facilitate|coach|review|write|design|do|train)\b/i,
  services:
    /\b(?:leadership (?:programs?|training|academ(?:y|ies))|Lean (?:reviews?|training)|process reviews?|strategic plans?|HR studies|pay studies|360s?|coaching|supervisor (?:training|academ(?:y|ies))|workforce studies)\b/gi,
  /** What sets her apart. */
  differentiators:
    /\b(veteran-owned|service-disabled|G-1|corps|PMP|Six Sigma|wait times?|boards? adopt\w*)\b/i,
};

/** Her own words for her work (Business Profile). */
export const CORE_CAPABILITIES = [
  "Cohort leadership programs for new supervisors, with 360s and coaching",
  "Lean process reviews that cut wait times",
  "Strategic plans with public workshops, written for a board to adopt",
  "HR and workforce studies for Army, VA and NC public offices",
];

/** The example in the PSC box. */
export const PSC_EXAMPLE = "R408, U008";

/** States whose vendor list she is already on. */
export const SLED_REGISTERED: Record<
  string,
  { vendorId: string; registeredDaysAgo: number } | undefined
> = { NC: { vendorId: "0001071385", registeredDaysAgo: 262 } };

/** The state whose vendor registration GovPreneurs is doing for her (Done for you). NC or VA. */
export const DFY_SLED_STATE = "VA" as "NC" | "VA";

/** The example row in the past-performance upload template. */
export const PAST_PERFORMANCE_EXAMPLE =
  '"Example: supervisor leadership academy","Example County",60000,2024-02-01,2024-11-30,611430,Prime,"Taught two cohorts of 20 new supervisors, with a 360 and three coaching sessions each. 92% finished."';

/** The job still waiting for a performance rating. */
export const RATING_JOB = "your Fort Bragg ACS job";

/** Gaps from her story the readiness header names first: no GSA schedule, no named program manager and lead facilitator. */
export const READINESS_GAPS = { gsa: true, keyPersonnel: true };

/** What the knowledge hub read from her own files. */
export const LEARNED_FACTS: LearnedFact[] = [
  {
    text: "Certified service-disabled veteran-owned (SBA VetCert) on 14 Jan 2024. Eligibility ends 14 Jan 2027.",
    fromFile: "vetcert certification letter",
  },
  { text: "11 W-2 staff and 7 contract facilitators; one ICF PCC and two ICF ACC coaches.", fromFile: "staff roster" },
  {
    text: "The ACS Lean review cut walk-in waits from 38 to 14 minutes.",
    fromFile: "project results",
  },
  { text: `${PERSONA.kitchen}.`, fromFile: "office" },
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
      name: "SBA VetCert certification letter.pdf",
      sizeKB: 181,
      mime: "pdf",
      filledFields: ["certifications", "renewal date"],
    },
  ],
  gdocs: [
    {
      kind: "gdocs",
      connectorId: "gdocs",
      name: "Staff roster and coach credentials.docx",
      sizeKB: 72,
      mime: "docx",
      filledFields: ["staff", "key personnel"],
    },
    {
      kind: "gdocs",
      connectorId: "gdocs",
      name: "Project results: ACS, Hope Mills, Tidewell.docx",
      sizeKB: 164,
      mime: "docx",
      filledFields: ["past projects", "results"],
    },
  ],
  dropbox: [
    {
      kind: "dropbox",
      connectorId: "dropbox",
      name: "Leadership program outline and 360 sample report.pdf",
      sizeKB: 128,
      mime: "pdf",
      filledFields: ["services", "methods"],
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
      name: "SBA VetCert renewal",
      shortName: "VetCert",
      dueDate: isoDaysFromNow(87, 0),
      dfyAvailable: true,
      dfyPriceUSD: 250,
      smsOptIn: true,
      stakes:
        "Your service-disabled veteran-owned status is how you compete on set-aside work like the Fayetteville VA supervisor program. VA checks it at offer and at award, so renew inside the 90-day window.",
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
      stakes:
        "Most federal and state solicitations require active liability insurance. An expired policy means you can't submit.",
    },
    {
      id: "insurance-professional",
      kind: "insurance",
      name: "Professional liability insurance",
      shortName: "professional liability",
      dueDate: isoDaysFromNow(210, 0),
      dfyAvailable: false,
      dfyPriceUSD: 0,
      smsOptIn: false,
      stakes:
        "Consulting and training buys often ask for errors and omissions cover. If it lapses, a claim about your advice is yours to pay.",
    },
  ];
};

/** The words the capability statement builder uses for her kind of business. */
export const CAP_STATEMENT = {
  tagline: "Service-disabled veteran-owned consulting firm in Fayetteville",
  place: (m: CapFacts) =>
    `${m.employees} staff, seven contract facilitators, and a 30-seat training room downtown.`,
  work: (list: string) =>
    `We run leadership programs, Lean process reviews, strategic plans and HR studies for Army, VA and public offices across ${list}.`,
  standard: "Led by a retired Army HR officer; Lean reviews that cut wait times",
  proof: () => [],
  alternate: (m: CapFacts) => [
    `${m.businessName} is a service-disabled veteran-owned consulting firm based in ${m.city}, ${m.state}, 12 miles from Fort Bragg.`,
    `Our founder ran HR for an Army corps; our programs pair classroom days with 360s and coaching.`,
  ],
};

/** Her insurance, as Grant reads it. No bonding: consulting work doesn't need it. */
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
        expiry: "2027-02-16",
      },
      {
        type: "workers-comp",
        perOccurrence: 1_000_000,
        aggregate: null,
        carrier: "Piedmont Mutual",
        amBest: "A (XV)",
        basis: "occurrence",
        expiry: "2027-02-16",
      },
      {
        type: "professional-eo",
        perOccurrence: 2_000_000,
        aggregate: 2_000_000,
        carrier: "Atlantic Specialty Underwriters",
        amBest: "A (XIII)",
        basis: "claims-made",
        expiry: "2027-05-17",
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
export const LCAT_LOCATIONS: (LcatLocation | "all")[] = ["all", "Nationwide"];

/** The note above the labor-rate benchmark. */
export const LCAT_BANNER = (
  <span>
    This is how most federal <strong>consulting and training work</strong> is priced: people
    billed by the hour. These are GSA schedule ceiling rates, the most a firm may bill. For scale,
    a Fayetteville management analyst&apos;s median pay is {fmtRate(LOCAL_ANALYST_MEDIAN)} an hour
    (BLS, May 2025); the gap pays for benefits, overhead and profit.
  </span>
);

/** The wage-floor table's words. */
export const WAGE_TABLE = {
  floor:
    "you can pay staff in these titles on a federal service contract here. You can pay more — you can't pay less. From the current Department of Labor determination; most consultants are exempt professionals.",
  compare:
    "Wage floors are the bottom; here's where comparable Army and VA training and consulting jobs landed on total price.",
};

/** Her trade, in the words the buyer pages use. */
export const BUYER_TRADE = {
  label: "Management consulting and training",
  phrase: "management consulting and training",
};

/** The icon on the "buys my trade" pill. */
export const TRADE_ICON = Briefcase;

/** Her intro email to a buyer. */
export const buyerIntro = (buyer: GovBuyer, officer: BuyerOfficer): string => {
  const past = PAST_PERFORMANCE.slice(0, 3)
    .map((p) => p.projectTitle)
    .join("; ");
  return `Subject: Introduction — ${PERSONA.businessName} (SDVOSB, ${PERSONA.hqCity})

Dear ${officer.name},

My name is ${PERSONA.ownerName}. I'm the ${PERSONA.ownerTitle.toLowerCase()} of ${PERSONA.businessName}, a ${PERSONA.hqCity}-based, service-disabled veteran-owned small business (NAICS ${PERSONA.primaryNaics}). I ran HR for an Army corps before I retired; now we run leadership programs, Lean process reviews, strategic plans and HR studies for public offices. We'd like to be on your radar for upcoming consulting and training work at ${buyer.name}.

In short:
  • SDVOSB (SBA VetCert) · Small Business · ${PERSONA.hqCity}-local
  • Work: supervisor leadership programs with 360s and coaching, Lean reviews, strategic plans, HR studies
  • Past work: ${past}
  • Typical job size: ${k(PERSONA.targetValueMin)}–${k(PERSONA.targetValueMax)}
  • SAM-registered (UEI ${PERSONA.uei}, CAGE ${PERSONA.cage}); PMP, Lean Six Sigma and ICF-credentialed coaches

I've attached our capability statement. If there's a better person to speak with about ${buyer.location} consulting work — or an upcoming industry day you'd recommend we attend — I'd be grateful for the pointer.

Thank you for your time,
${PERSONA.ownerName}
${PERSONA.businessName}
${PERSONA.email} · ${PERSONA.phone}`;
};

/** The Contract Vehicles page's words. */
export const VEHICLES_PAGE = {
  meta: "Pre-approved contracts that let agencies buy from you faster — and what they actually mean for a consulting firm.",
  lead: "a consulting firm like yours.",
  fitsLabel: "Fits my work (consulting)",
  famous: "For a consulting firm: the most famous vehicles (",
  path: (
    <>
      The ones that fit: <strong>GSA&apos;s Professional Services and Human Capital schedule</strong>{" "}
      (you are not on it yet; it is your next step), the{" "}
      <strong>service-disabled veteran-owned set-asides</strong> you already qualify for, and{" "}
      <strong>teaming with a prime</strong> on the Army&apos;s HR Solutions contract. We&apos;ve
      defaulted you to those.
    </>
  ),
};

/** The badge on a vehicle that does not fit her work. */
export const VEHICLES_NOT_FOR = "not for consulting";

/** How she knows the team-up partner, on an award page. */
export const KNOWN_PARTNER_NOTE =
  "who wrote to you about the Army family readiness training. Ask him which Southeast classes he needs a trainer for.";

/** What she already shares with the team-up partner. */
export const KNOWN_CONTACT_HOOK = "his note to you about the Army family readiness training";

/** A sample answer to one of Ava's text questions. */
export const AVA_SAMPLE_ANSWER = "Our own W-2 staff teach every cohort; contract facilitators only fill in.";

/** Ava's check line when the price covers every cost. */
export const AVA_PRICE_COVERS =
  "The price pays for your team's hours, the 360s, the coaching sessions and every cost Ava knows about.";

/** The hint in the PSC search box. */
export const PSC_SEARCH_HINT = "Search a group or a code — program support, human resources, training…";

export const MENTOR_BENCH = {
  sarah:
    "Pick the right bids, check your price, and read your proposal before you send it. Best for Army and VA services bids.",
  renee: {
    title: "Proposal writing and GSA schedules · former proposal director",
    bio: "Renee led proposal teams at a federal training and consulting contractor for 11 years, including two GSA schedule offers. She has written or reviewed more than 200 federal proposals.",
    consultationDescription:
      "Write an approach section that scores, or plan a GSA schedule offer. Bring a draft or a solicitation and Renee will mark what the evaluators will look for.",
  },
  calvin: {
    bio: "Calvin reviewed contractor prices for the Army for 13 years. He teaches small firms to price labor categories, coaching hours and overhead without under-bidding.",
    consultationDescription:
      "Build a price that covers your costs and still pays you, option years included. Calvin checks your labor rates, wrap rate and margin line by line.",
  },
  angela: {
    bio: "Angela bought training, HR and program support for VA medical centers for 12 years. She explains how the VA buys and what its evaluators score.",
    consultationDescription:
      "Sell to the VA. Learn the VA's forms, Veterans First, the 50% rule, and how to prove your staffing.",
  },
};

export const PALETTE_WORDS = {
  sell: ["project results", "program outline"],
  papers: ["resumes", "coach credentials"],
};

export const LABOR_PRICING = {
  list: (
    <ul className="market-what-list">
      <li>
        Most federal <strong>consulting and training work</strong> is priced{" "}
        <em>per person per hour</em>, by labor category, or as a fixed price built from those
        hours. Contracting officers check your rates against GSA schedule rates for the same roles
        — the benchmark below.
      </li>
      <li>
        Some titles also carry a legal floor: the government&apos;s{" "}
        <JargonGloss term="wage determination">
          The hourly rate set by the U.S. Department of Labor under the Service Contract Act for
          each job title and county. The legal minimum on federal service contracts.
        </JargonGloss>{" "}
        sets minimum pay for technical instructors and administrative staff in your county. Most
        consultants are exempt professionals.
      </li>
      <li>
        Quick answer to "what should I charge":{" "}
        <em>your costs set the bottom, the median GSA rate for each role is a fair top.</em> Price
        between, and check what similar jobs went for.
      </li>
    </ul>
  ),
  lcatLine:
    "GSA schedule rates for program managers, consultants, facilitators, coaches and more. This is how most consulting work is priced.",
};

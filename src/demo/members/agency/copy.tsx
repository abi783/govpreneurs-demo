// THE AGENCY: what the shared screens say about Lantern Row Creative's trade.
// One export per screen. The caterer's words sit beside the shared code
// (byMember); every pack member has this file with these exports (pack.test.ts).

import { Megaphone } from "lucide-react";
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
import { LOCAL_DESIGNER_MEDIAN } from "./market/laborRates";
import { PAST_PERFORMANCE, PERSONA } from "./persona";

function k(n: number): string {
  return `${Math.round(n / 1000)}K`;
}

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
export const CMMC_SCOPE = "Studio, edit suite and office systems";

/** The size of her capability statement in public/demo-files (scripts/make-capability-statement.ts writes it). */
export const CAPABILITY_STATEMENT_BYTES = 3305;

/** What she calls a job when she says how many she can run at once (My Business, "Tell us"). */
export const JOB_WORDS = /\b(jobs|contracts|campaigns|clients|shoots)\b/i;

/** The product and service code groups she picks from first (sc/business/data/psc.ts). */
export const PSC_GROUPS: GroupDef[] = [
  {
    groupCode: "R7",
    groupTitle: "Support Services (Management)",
    segment: "service",
    category: "Professional, Administrative and Management Support Services",
    codes: [
      ["R701", "Support- Management: Advertising"],
      ["R702", "Support- Management: Data Collection"],
      ["R708", "Support- Management: Public Relations"],
      ["R799", "Support- Management: Other"],
    ],
  },
  {
    groupCode: "T0",
    groupTitle: "Photographic, Mapping, Printing, and Publication Services",
    segment: "service",
    category: "Photographic, Mapping, Printing, and Publication Services",
    codes: [
      ["T001", "Photo/Map/Print/Publication- Arts/Graphics"],
      ["T006", "Photo/Map/Print/Publication- Film/Video Tape Production"],
      ["T011", "Photo/Map/Print/Publication- Print/Binding"],
      ["T015", "Photo/Map/Print/Publication- General Photographic: Motion"],
      ["T016", "Photo/Map/Print/Publication- Audio/Visual"],
      ["T099", "Photo/Map/Print/Publication- Other"],
    ],
  },
];

/** Rows only a document can answer, beyond the ones every member has. */
export const UPLOAD_EXTRAS: { field: string; test: RegExp }[] = [
  { field: "doc_past_performance", test: /\b(CPARS|performance rating)\b/i },
  {
    field: "state_diversity_certifications",
    test: /\b(small business enterprise|NCSBE|state certification)\b/i,
  },
  { field: "doc_marketing", test: /\b(reel|portfolio|work samples)\b/i },
];

/** How My Business turns her own words into facts (sc/business/demoTell.ts). */
export const TELL_RULES = {
  /** A sentence about her people. */
  personnel:
    /\b(crew|project manager|account director|producer|editors?|designers?|copywriters?|media buyers?)\b/i,
  /** A sentence about her gear. */
  equipment:
    /\b(cameras?|drones?|lighting|lights|lenses|edit suite|microphones?|gimbals?|teleprompters?)\b/i,
  /** What she does, as a buyer would search for it ("we make short videos" → "short videos"). */
  serviceVerbs: /\b(we|i) (make|run|do|produce|create|design|buy|build|shoot)\b/i,
  services:
    /\b(?:short |recruiting |captioned |explainer )?videos?\b|\bpaid (?:social|search)\b|\b(?:search|display|social|print|streaming) ads\b|\blanding pages?\b|\bprint buying\b|\blead forms?\b|\bpublic relations\b|\bgraphic design\b|\bgeofenced ads\b/gi,
  /** What sets her apart. */
  differentiators:
    /\b(military families|army spouse|bilingual|spanish|captioned|within (?:5|five) minutes)\b/i,
};

/** Her own words for her work (Business Profile). */
export const CORE_CAPABILITIES = [
  "Short captioned videos, shot and edited in-house",
  "Paid social, search and display ads",
  "Print buying for local papers",
  "Landing pages and lead routing to a recruiter or caseworker",
];

/** The example in the PSC box. */
export const PSC_EXAMPLE = "R701, T006";

/** States whose vendor list she is already on. */
export const SLED_REGISTERED: Record<
  string,
  { vendorId: string; registeredDaysAgo: number } | undefined
> = { NC: { vendorId: "0001048772", registeredDaysAgo: 262 } };

/** The state whose vendor registration GovPreneurs is doing for her (Done for you). NC or VA. */
export const DFY_SLED_STATE = "VA" as "NC" | "VA";

/** The example row in the past-performance upload template. */
export const PAST_PERFORMANCE_EXAMPLE =
  '"Example: recruiting video campaign","Example County",45000,2024-03-01,2024-09-30,541810,Prime,"Made four 30-second videos and ran paid social for six months. 1,200 people filled in the lead form."';

/** The job still waiting for a performance rating. */
export const RATING_JOB = "your NC Guard campaign";

/** Gaps from her story the readiness header names first: no GSA schedule, no named project manager and alternate. */
export const READINESS_GAPS = { gsa: true, keyPersonnel: true };

/** What the knowledge hub read from her own files. */
export const LEARNED_FACTS: LearnedFact[] = [
  {
    text: "Certified woman-owned (WOSB). The certification renews in 41 days.",
    fromFile: "wosb certification letter",
  },
  { text: "Rates for video, paid social and search, and print buying.", fromFile: "rate card" },
  {
    text: "Results from the NC Guard recruiting and stormwater campaigns.",
    fromFile: "campaign results",
  },
  { text: `${PERSONA.kitchen}.`, fromFile: "studio" },
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
      name: "WOSB certification letter.pdf",
      sizeKB: 188,
      mime: "pdf",
      filledFields: ["certifications", "renewal date"],
    },
  ],
  gdocs: [
    {
      kind: "gdocs",
      connectorId: "gdocs",
      name: "Rate card for video, paid media and print buying.docx",
      sizeKB: 84,
      mime: "docx",
      filledFields: ["services and prices"],
    },
    {
      kind: "gdocs",
      connectorId: "gdocs",
      name: "Campaign results: NC Guard and stormwater.docx",
      sizeKB: 156,
      mime: "docx",
      filledFields: ["past projects", "results"],
    },
  ],
  dropbox: [
    {
      kind: "dropbox",
      connectorId: "dropbox",
      name: "Studio and camera equipment list.pdf",
      sizeKB: 72,
      mime: "pdf",
      filledFields: ["facilities", "equipment"],
    },
  ],
};

/** What Stay Ready tracks for her, after the SAM.gov item every member has. */
export const stayReadyItems = (samItem: () => TrackedItem): TrackedItem[] => {
  return [
    samItem(),
    {
      id: "wosb-cert",
      kind: "wosb-cert",
      name: "WOSB certification",
      shortName: "WOSB cert",
      dueDate: isoDaysFromNow(41, 0),
      dfyAvailable: true,
      dfyPriceUSD: 250,
      smsOptIn: true,
      stakes:
        "Your woman-owned status is how you compete on set-aside work, such as the Family Advocacy campaign at Fort Bragg. If it lapses, you lose access to WOSB-only solicitations until you recertify.",
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
      id: "insurance-professional",
      kind: "insurance",
      name: "Professional liability insurance",
      shortName: "professional liability",
      dueDate: isoDaysFromNow(210, 0),
      dfyAvailable: false,
      dfyPriceUSD: 0,
      smsOptIn: false,
      stakes:
        "Ad and outreach buys often ask for errors and omissions cover. If it lapses, a claim about a campaign is yours to pay.",
    },
  ];
};

/** The words the capability statement builder uses for her kind of business. */
export const CAP_STATEMENT = {
  tagline: "Woman-owned ad agency 12 miles from Fort Bragg",
  place: (m: CapFacts) =>
    `${m.employees} staff, three freelancers, and a studio with a two-person video crew.`,
  work: (list: string) =>
    `We make video, run paid social and search, buy print, and build landing pages and lead routing for campaigns that reach military families across ${list}.`,
  standard: "Leads routed to a recruiter or caseworker within 5 minutes; captions on every video",
  proof: () => [],
  alternate: (m: CapFacts) => [
    `${m.businessName} is a woman-owned ad agency based in ${m.city}, ${m.state}, 12 miles from Fort Bragg.`,
    `Video, paid media and print buying under one roof mean a buyer deals with one team from the first shoot to the last lead.`,
  ],
};

/** Her insurance and bonding, as Grant reads them. */
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
        type: "professional-eo",
        perOccurrence: 1_000_000,
        aggregate: 1_000_000,
        carrier: "Atlantic Specialty Underwriters",
        amBest: "A (XIII)",
        basis: "claims-made",
        expiry: "2027-05-31",
      },
    ],
    bonding:
      PERSONA.largestBond > 0
        ? { single: PERSONA.largestBond, aggregate: PERSONA.largestBond }
        : null,
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
    This is how most federal <strong>marketing work</strong> is priced: people billed by the hour.
    These are GSA schedule ceiling rates, the most a firm may bill. For scale, a Fayetteville
    graphic designer&apos;s median pay is {fmtRate(LOCAL_DESIGNER_MEDIAN)} an hour (BLS, May 2025);
    the gap pays for benefits, overhead and profit.
  </span>
);

/** The wage-floor table's words. */
export const WAGE_TABLE = {
  floor:
    "you can pay staff in these titles on a federal service contract here. You can pay more — you can't pay less. From the current Department of Labor determination.",
  compare:
    "Wage floors are the bottom; here's where comparable NC advertising jobs landed on total price.",
};

/** Her trade, in the words the buyer pages use. */
export const BUYER_TRADE = {
  label: "Marketing and advertising",
  phrase: "marketing and advertising",
};

/** The icon on the "buys my trade" pill. */
export const TRADE_ICON = Megaphone;

/** Her intro email to a buyer. */
export const buyerIntro = (buyer: GovBuyer, officer: BuyerOfficer): string => {
  const past = PAST_PERFORMANCE.slice(0, 3)
    .map((p) => p.projectTitle)
    .join("; ");
  return `Subject: Introduction — ${PERSONA.businessName} (WOSB, ${PERSONA.hqCity})

Dear ${officer.name},

My name is ${PERSONA.ownerName}. I'm the ${PERSONA.ownerTitle.toLowerCase()} of ${PERSONA.businessName}, a ${PERSONA.hqCity}-based, woman-owned small business (NAICS ${PERSONA.primaryNaics}). We make campaigns that reach military families: short captioned videos, paid social and search, print buying and lead forms that reach a recruiter or caseworker within 5 minutes. We'd like to be on your radar for upcoming marketing and advertising work at ${buyer.name}.

In short:
  • WOSB · Small Business · ${PERSONA.hqCity}-local
  • Work: campaigns, video production, paid social, search and display, print buying, landing pages
  • Past work: ${past}
  • Typical job size: ${k(PERSONA.targetValueMin)}–${k(PERSONA.targetValueMax)}
  • SAM-registered (UEI ${PERSONA.uei}, CAGE ${PERSONA.cage}), a 2-person video crew and an in-house edit suite

I've attached our capability statement. If there's a better person to speak with about ${buyer.location} marketing work — or an upcoming industry day you'd recommend we attend — I'd be grateful for the pointer.

Thank you for your time,
${PERSONA.ownerName}
${PERSONA.businessName}
${PERSONA.email} · ${PERSONA.phone}`;
};

/** The Contract Vehicles page's words. */
export const VEHICLES_PAGE = {
  meta: "Pre-approved contracts that let agencies buy from you faster — and what they actually mean for an ad agency.",
  lead: "an ad agency like yours.",
  fitsLabel: "Fits my work (marketing)",
  famous: "For an ad agency: the most famous vehicles (",
  path: (
    <>
      The ones that fit: <strong>GSA&apos;s Marketing and Public Relations schedule</strong> (you
      are not on it yet), the <strong>woman-owned set-asides</strong> you already qualify for, and{" "}
      <strong>teaming with a prime</strong> on work you can&apos;t bid alone. We&apos;ve defaulted
      you to those.
    </>
  ),
};

/** The badge on a vehicle that does not fit her work. */
export const VEHICLES_NOT_FOR = "not for ad work";

/** How she knows the team-up partner, on an award page. */
export const KNOWN_PARTNER_NOTE =
  "who wrote to you about the VA campaign. Ask him which shoots he needs a crew for.";

/** What she already shares with the team-up partner. */
export const KNOWN_CONTACT_HOOK = "his note to you about the VA campaign";

/** A sample answer to one of Ava's text questions. */
export const AVA_SAMPLE_ANSWER = "We shoot, edit and caption every video in our own studio.";

/** Ava's check line when the price covers every cost. */
export const AVA_PRICE_COVERS =
  "The price pays for your team, the ads you buy and every cost Ava knows about.";

/** The hint in the PSC search box. */
export const PSC_SEARCH_HINT = "Search a group or a code — advertising, video, printing…";

export const MENTOR_BENCH = {
  sarah:
    "Pick the right bids, check your price, and read your proposal before you send it. Best for Army and VA services bids.",
  renee: {
    title: "Proposal writing and GSA schedules · former proposal director",
    bio: "Renee led proposal teams at a federal communications contractor for 11 years, including two GSA schedule offers. She has written or reviewed more than 200 federal proposals.",
    consultationDescription:
      "Write an approach section that scores, or plan a GSA schedule offer. Bring a draft or a solicitation and Renee will mark what the evaluators will look for.",
  },
  calvin: {
    bio: "Calvin reviewed contractor prices for the Army for 13 years. He teaches small businesses to price labor, media buys and overhead without under-bidding.",
    consultationDescription:
      "Build a price that covers your costs and still pays you, option years included. Calvin checks your labor rates, media costs and margin line by line.",
  },
  angela: {
    bio: "Angela bought outreach, hiring and facility services for VA medical centers for 12 years. She explains how the VA buys and what its evaluators score.",
    consultationDescription:
      "Sell to the VA. Learn the VA's forms, its veteran set-aside rules, and how to work under a veteran-owned prime.",
  },
};

export const PALETTE_WORDS = {
  sell: ["portfolio", "reel"],
  papers: ["releases", "music licenses"],
};

export const LABOR_PRICING = {
  list: (
    <ul className="market-what-list">
      <li>
        Most federal <strong>marketing work</strong> is priced <em>per person per hour</em>, by
        labor category, or as a fixed price built from those hours. Contracting officers check your
        rates against GSA schedule rates for the same roles — the benchmark below.
      </li>
      <li>
        Some titles also carry a legal floor: the government&apos;s{" "}
        <JargonGloss term="wage determination">
          The hourly rate set by the U.S. Department of Labor under the Service Contract Act for
          each job title and county. The legal minimum on federal service contracts.
        </JargonGloss>{" "}
        sets minimum pay for graphic artists, illustrators and photographers in your county.
      </li>
      <li>
        Quick answer to "what should I charge":{" "}
        <em>your costs set the bottom, the median GSA rate for each role is a fair top.</em> Price
        between, and check what similar jobs went for.
      </li>
    </ul>
  ),
  lcatLine:
    "GSA schedule rates for account directors, designers, video producers and more. This is how most marketing work is priced.",
};

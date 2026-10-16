// Explore mock data — agencies, recent winners, forecasts.
// Reuses the canonical NC roofing dataset where relevant. All copy is plain
// English for a first-timer; jargon stays out of user-visible strings.
import { OPPORTUNITIES, type Opportunity } from "./opportunities";

export type AgencyType = "Federal" | "SLED";

export interface Agency {
  id: string;
  name: string;
  type: AgencyType;
  matchOn: (o: Opportunity) => boolean; // how we count open opps
  distance: string; // plain-English distance / relevance from Fayetteville
  oneLiner: string;
  whatTheyBuy: string;
  howTheyBuy: string; // plain English: solicitations, primes, set-asides, etc.
  setAsidesPlain: string; // one short sentence
  typicalSetAsides: string[]; // kept for compatibility / chips
  approachThem: string[]; // 3–4 first-timer bullets
}

export const AGENCIES: Agency[] = [
  {
    id: "usace-wilmington",
    name: "USACE — Wilmington District",
    type: "Federal",
    matchOn: (o) => o.agency === "USACE" && (o.subAgency?.includes("Wilmington") ?? false),
    distance: "Covers your area · runs Fort Bragg and Pope AAF work",
    oneLiner: "U.S. Army Corps of Engineers — runs military construction at Fort Bragg, Pope AAF, and across eastern NC.",
    whatTheyBuy:
      "Roofing, building envelope, barracks renovations, hangar repairs, site work. Awards 2–8 small-business primes per quarter in the $200K–$1.5M band.",
    howTheyBuy:
      "Most jobs are posted on SAM.gov. Smaller work is often reserved for veteran-owned or small businesses. Larger work goes to a big prime contractor who then hires roofing subs like you.",
    setAsidesPlain: "Most jobs are reserved for veteran-owned or small businesses.",
    typicalSetAsides: ["SDVOSB", "Total Small Business", "8(a)"],
    approachThem: [
      "Email the Small Business Liaison at the Wilmington District office — that's the door for first-timers.",
      "Send a one-page capability statement that names roofing + Fort Bragg as your sweet spot.",
      "Ask to be invited to their next industry day — that's where the small-business primes get found.",
    ],
  },
  {
    id: "usace-savannah",
    name: "USACE — Savannah District",
    type: "Federal",
    matchOn: (o) => o.agency === "USACE" && (o.subAgency?.includes("Savannah") ?? false),
    distance: "3–5 hour drive · SC/GA coastal bases",
    oneLiner: "USACE Savannah covers SC/GA — frequent awarder to first-time NC small primes who can drive in.",
    whatTheyBuy: "Roofing, envelope, warehouse and field office repairs across coastal SC/GA bases.",
    howTheyBuy:
      "Smaller jobs are often reserved for veteran-owned and small businesses. Bidders are typically thinner here than at Fort Bragg, so first-timers have a real shot.",
    setAsidesPlain: "Often reserves work for veteran-owned and small businesses.",
    typicalSetAsides: ["SDVOSB", "Total Small Business"],
    approachThem: [
      "Email the Savannah District Small Business Liaison — mention you're NC-based and willing to mobilize.",
      "Lead with one strong past project that's similar in size and scope.",
      "Ask which upcoming work has thin bidder pools — they'll often tell you.",
    ],
  },
  {
    id: "fort-bragg-dpw",
    name: "Fort Bragg DPW",
    type: "Federal",
    matchOn: (o) => o.subAgency?.includes("Fort Bragg DPW") ?? false,
    distance: "20 minutes from your shop · your single biggest local federal buyer",
    oneLiner: "Fort Bragg's Directorate of Public Works — buys recurring facilities work on-post every quarter.",
    whatTheyBuy:
      "Roof replacements, barracks envelope, vehicle facility repairs, HVAC, repaving. The single largest local federal buyer for Marcus's scope.",
    howTheyBuy:
      "Some smaller jobs are bid directly. Most large work runs through a master contract held by a big prime — your way in is usually as a sub to that prime.",
    setAsidesPlain: "Smaller jobs are often reserved for veteran-owned and small businesses.",
    typicalSetAsides: ["SDVOSB", "Total Small Business"],
    approachThem: [
      "Contact the Fort Bragg DPW Small Business Liaison — they'll point you at the next bid window.",
      "Pre-qualify with the big primes already holding Fort Bragg master contracts (see Who's Winning).",
      "Send a capability statement that names \"Fort Bragg roofing\" in the first line.",
      "Show up to the next industry day in person — it matters here.",
    ],
  },
  {
    id: "navfac-camp-lejeune",
    name: "NAVFAC Mid-Atlantic — Camp Lejeune",
    type: "Federal",
    matchOn: (o) => o.agency === "Navy" && (o.location?.toLowerCase().includes("jacksonville") ?? false),
    distance: "About 2 hours east · steady envelope work",
    oneLiner: "Navy's facilities command for Camp Lejeune and MCAS New River — steady stream of envelope and roofing work.",
    whatTheyBuy: "Roof PM, BEQ siding & envelope, exterior repairs. Smaller-dollar bids stay thin on bidders.",
    howTheyBuy:
      "Most jobs go through prime contractors who sub out roofing. Some smaller envelope jobs are reserved for veteran-owned and small businesses.",
    setAsidesPlain: "Often reserves smaller jobs for veteran-owned and small businesses.",
    typicalSetAsides: ["SDVOSB", "Total Small Business"],
    approachThem: [
      "Email the NAVFAC Mid-Atlantic Small Business Office — that's your entry point.",
      "Lead with eastern NC past performance — they like roofers who can mobilize fast.",
      "Get on the sub list of the prime currently holding the Camp Lejeune envelope work.",
    ],
  },
  {
    id: "navfac-cherry-point",
    name: "NAVFAC Mid-Atlantic — MCAS Cherry Point",
    type: "Federal",
    matchOn: (o) => o.agency === "Navy" && (o.location?.toLowerCase().includes("cherry point") ?? false),
    distance: "About 2.5 hours east",
    oneLiner: "Marine Corps Air Station Cherry Point — family housing and air-station roofing programs.",
    whatTheyBuy: "Shingle and modified-bitumen re-roofing on housing blocks, hangar repairs.",
    howTheyBuy:
      "Housing re-roof packages are usually reserved for veteran-owned small businesses. Hangar work tends to go through primes.",
    setAsidesPlain: "Housing work is often reserved for veteran-owned small businesses.",
    typicalSetAsides: ["SDVOSB"],
    approachThem: [
      "Reach out to the Small Business Liaison at NAVFAC Mid-Atlantic and name Cherry Point specifically.",
      "Send a one-page capability statement with shingle + modified-bitumen housing experience up top.",
      "Pre-qualify with the prime holding the current Cherry Point hangar work.",
    ],
  },
  {
    id: "seymour-johnson",
    name: "4th CONS — Seymour Johnson AFB",
    type: "Federal",
    matchOn: (o) => o.agency === "Air Force",
    distance: "About 90 minutes northeast · drivable from Fayetteville",
    oneLiner: "Air Force contracting squadron at Seymour Johnson AFB (Goldsboro, NC) — drivable from Fayetteville.",
    whatTheyBuy: "Hangar roof repair, facility envelope, mid-sized building work.",
    howTheyBuy:
      "Smaller jobs go out as small-business set-asides. Standing-seam metal work usually rolls up under a hangar modernization prime.",
    setAsidesPlain: "Smaller work is often set aside for small businesses.",
    typicalSetAsides: ["Total Small Business"],
    approachThem: [
      "Email the 4th CONS Small Business Office at Seymour Johnson directly.",
      "Lead with any standing-seam metal-roof past performance.",
      "Ask whether their upcoming hangar work has a small-business sub goal.",
    ],
  },
  {
    id: "va-nco6",
    name: "VA — NCO 6 (Mid-Atlantic)",
    type: "Federal",
    matchOn: (o) => o.agency === "VA",
    distance: "Buys for VA medical centers across NC, VA, WV",
    oneLiner: "VA Network Contracting Office 6 — runs procurement for VA medical centers across NC, VA, WV.",
    whatTheyBuy: "Medical-center roofing, envelope, ADA upgrades. Slightly larger jobs ($500K–$2M).",
    howTheyBuy:
      "VA is required by law to prioritize service-disabled veteran-owned businesses for set-asides. That's a big tailwind for you.",
    setAsidesPlain: "By law, the VA prefers service-disabled veteran-owned businesses (that's you).",
    typicalSetAsides: ["SDVOSB", "Total Small Business"],
    approachThem: [
      "Email the VA NCO 6 Small Business Office and identify yourself as SDVOSB up front.",
      "Send a capability statement that names \"VA medical center roofing\" in the first line.",
      "Ask to be added to their SDVOSB vendor list for the Fayetteville and Durham VA medical centers.",
    ],
  },
  {
    id: "gsa-r4",
    name: "GSA — Region 4",
    type: "Federal",
    matchOn: (o) => o.agency === "GSA",
    distance: "Southeast US · owns federal buildings across NC",
    oneLiner: "GSA's Southeast region — owns federal buildings across NC and the Southeast.",
    whatTheyBuy: "Federal building re-roofing, weatherproofing, building modernization.",
    howTheyBuy:
      "GSA buys through small-business set-asides and through master contracts held by primes. Smaller building re-roofs are often set aside.",
    setAsidesPlain: "Many smaller jobs are set aside for small businesses.",
    typicalSetAsides: ["Total Small Business", "8(a)"],
    approachThem: [
      "Contact the GSA Region 4 Small Business Utilization Office.",
      "Mention which specific NC federal buildings you can mobilize to fastest.",
      "Ask about the upcoming roof program at named buildings in your region.",
    ],
  },
  {
    id: "cumberland-county",
    name: "Cumberland County, NC",
    type: "SLED",
    matchOn: (o) => o.agency === "Cumberland County, NC",
    distance: "Your home county",
    oneLiner: "Marcus's home county — government facilities, detention annexes, and county-owned buildings.",
    whatTheyBuy: "Re-roofing, envelope, modular building maintenance.",
    howTheyBuy:
      "Open public bid — anyone can apply. Local NC contractors typically have a built-in edge.",
    setAsidesPlain: "Open competition, with a real edge for local NC contractors.",
    typicalSetAsides: ["Open competition", "Local preference"],
    approachThem: [
      "Walk into the Cumberland County Purchasing Office and introduce yourself in person.",
      "Get on their official vendor list — it's a one-page form.",
      "Ask the purchasing officer which schools and county buildings are on next year's re-roof list.",
    ],
  },
  {
    id: "city-fayetteville",
    name: "City of Fayetteville",
    type: "SLED",
    matchOn: (o) => o.agency === "City of Fayetteville",
    distance: "In town · you may already know the building",
    oneLiner: "Fayetteville Public Works and city facilities — local buyer Marcus already knows by face.",
    whatTheyBuy: "Re-roofing, gutters, exterior repairs on city facilities.",
    howTheyBuy:
      "Posted on the city procurement portal. Open bid, with a real edge for local Fayetteville companies.",
    setAsidesPlain: "Open competition with strong local preference.",
    typicalSetAsides: ["Open competition"],
    approachThem: [
      "Register as a vendor on the City of Fayetteville procurement portal — takes 15 minutes.",
      "Stop by Public Works and ask which buildings are on their re-roof plan for next budget cycle.",
      "Mention you're already an NC-licensed roofer based in the city.",
    ],
  },
  {
    id: "cumberland-schools",
    name: "Cumberland County Schools",
    type: "SLED",
    matchOn: (o) => o.agency === "Cumberland County Schools",
    distance: "Your home county · 80+ schools",
    oneLiner: "Largest single SLED buyer in your home county — annual re-roofing programs across 80+ schools.",
    whatTheyBuy: "Multi-school re-roofing programs, gym roofs, classroom envelope.",
    howTheyBuy:
      "They post an annual school list and bid each one out. Open public competition — local contractors usually win.",
    setAsidesPlain: "Open competition. Local NC roofers typically win these jobs.",
    typicalSetAsides: ["Open competition"],
    approachThem: [
      "Email the CCS Facilities Director and ask for next year's re-roofing school list.",
      "Get on their bid notification list — it's a single email.",
      "Show up at the pre-bid meeting in person. Half the bidders skip it.",
    ],
  },
  {
    id: "robeson-schools",
    name: "Robeson County Schools",
    type: "SLED",
    matchOn: (o) => o.agency === "Robeson County Schools",
    distance: "About 40 minutes south",
    oneLiner: "Public schools 40 minutes south — frequent metal-roof and gym-roof work.",
    whatTheyBuy: "Standing-seam metal roofing on schools and gymnasiums.",
    howTheyBuy: "Open public bid. Smaller bidder pools than larger counties.",
    setAsidesPlain: "Open competition with smaller bidder pools.",
    typicalSetAsides: ["Open competition"],
    approachThem: [
      "Email the Robeson County Schools Maintenance Director and introduce your shop.",
      "Lead with standing-seam metal-roof past performance.",
      "Ask which gyms are on the next bid cycle — they'll usually tell you.",
    ],
  },
  {
    id: "durham-county",
    name: "Durham County, NC",
    type: "SLED",
    matchOn: (o) => o.agency === "Durham County, NC",
    distance: "About 90 minutes north · Triangle area",
    oneLiner: "County libraries, courthouses, and offices in the Triangle.",
    whatTheyBuy: "Library and small-facility re-roofing, envelope.",
    howTheyBuy: "Open public bid posted on the county portal.",
    setAsidesPlain: "Open competition.",
    typicalSetAsides: ["Open competition"],
    approachThem: [
      "Register on the Durham County vendor portal.",
      "Email the Facilities Department for their re-roof priority list.",
      "Mention you're willing to mobilize from Fayetteville — bidders are thinner from out of town.",
    ],
  },
  {
    id: "ncng",
    name: "NC National Guard",
    type: "SLED",
    matchOn: (o) => o.agency === "NC National Guard",
    distance: "Armories across NC",
    oneLiner: "Armories across NC — the procurement office knows local veteran-owned firms by name.",
    whatTheyBuy: "Armory roofing, weatherproofing, building envelope.",
    howTheyBuy:
      "State buyer. Has informal preference for NC veteran-owned roofers — they want to know you exist.",
    setAsidesPlain: "Open competition with informal preference for NC veteran-owned firms.",
    typicalSetAsides: ["Open competition", "SDVOSB preference"],
    approachThem: [
      "Call the NCNG Construction & Facilities Management Office and introduce yourself as a veteran-owned NC roofer.",
      "Send a capability statement that names \"armory roofing\" up top.",
      "Ask which armories are on next year's roof plan.",
    ],
  },
];

// Recent winners (browse for the Partner / teaming play)
export interface Winner {
  id: string;
  company: string;
  awardType: string; // plain English short label
  award: string; // raw label (kept for reference / award detail panel)
  value: string;
  agency: string;
  wonAt: string; // human label
  whyItMatters: string;
  reachOut: string; // concrete first move
  setAsideGoals?: string;
  awardDetail: {
    id: string;
    postedAt: string;
    sourceLine: string;
  };
}

export const WINNERS: Winner[] = [
  {
    id: "bordeaux",
    company: "Bordeaux Construction",
    awardType: "multi-year housing construction contract",
    award: "Fort Bragg housing IDIQ",
    value: "$42M",
    agency: "USACE Wilmington",
    wonAt: "2 weeks ago",
    whyItMatters:
      "They're an NC mid-size prime 30 minutes from Durham. By contract, they have to give part of this work to veteran-owned small businesses — that's your opening.",
    reachOut:
      "Email their estimating team a one-page capability statement and ask to be added to their NC roofing sub list. Mention the Fort Bragg housing award by name — they'll know exactly what you mean.",
    setAsideGoals: "Must use veteran-owned small business subs on this contract",
    awardDetail: {
      id: "W912PM-26-D-0014",
      postedAt: "Posted to SAM.gov — 14 days ago",
      sourceLine: "Source: SAM.gov award notice · USACE Wilmington District",
    },
  },
  {
    id: "sterling",
    company: "Sterling Roofing Group",
    awardType: "barracks roof replacement contract",
    award: "Camp Lejeune barracks re-roof envelope",
    value: "$3.2M",
    agency: "NAVFAC Mid-Atlantic",
    wonAt: "1 month ago",
    whyItMatters:
      "They're a large prime that has to sub out 25–30% of every job to small businesses. They're actively looking for NC roofing subs right now.",
    reachOut:
      "Email their subcontracts manager with a one-pager. Lead with eastern NC past performance. Ask to be added to their small-business sub roster for upcoming Camp Lejeune work.",
    setAsideGoals: "Small-business sub goal on the prime contract",
    awardDetail: {
      id: "N40085-26-D-0231",
      postedAt: "Posted to SAM.gov — 32 days ago",
      sourceLine: "Source: SAM.gov award notice · NAVFAC Mid-Atlantic",
    },
  },
  {
    id: "tetra-tech",
    company: "Tetra Tech Construction",
    awardType: "multi-year facilities master contract at Fort Bragg",
    award: "Fort Bragg DPW JOC IDIQ",
    value: "$18M",
    agency: "USACE Wilmington",
    wonAt: "6 weeks ago",
    whyItMatters:
      "This kind of contract spins out dozens of smaller jobs over several years. They need a roster of pre-qualified roofing subs in NC — and they need it now.",
    reachOut:
      "Send a one-page capability statement and ask to be pre-qualified as a roofing sub on their Fort Bragg JOC. Once you're on the roster, individual task orders come quickly.",
    awardDetail: {
      id: "W912PM-26-D-0007",
      postedAt: "Posted to SAM.gov — 42 days ago",
      sourceLine: "Source: SAM.gov award notice · USACE Wilmington District",
    },
  },
  {
    id: "metcon",
    company: "Metcon Inc.",
    awardType: "housing renovation contract",
    award: "MCAS Cherry Point housing renovation",
    value: "$8.7M",
    agency: "NAVFAC Mid-Atlantic",
    wonAt: "2 months ago",
    whyItMatters:
      "Pembroke, NC prime — about an hour from your shop. Every housing renovation has a roofing sub package, and they prefer NC subs they can drive to.",
    reachOut:
      "Drive out to Pembroke and introduce yourself in person if you can. Otherwise email their project manager directly with a one-pager and your closest comparable housing job.",
    awardDetail: {
      id: "N40085-26-C-0118",
      postedAt: "Posted to SAM.gov — 61 days ago",
      sourceLine: "Source: SAM.gov award notice · NAVFAC Mid-Atlantic",
    },
  },
  {
    id: "barnhill",
    company: "Barnhill Contracting",
    awardType: "hangar modernization contract",
    award: "Seymour Johnson hangar modernization",
    value: "$11.4M",
    agency: "Air Force / 4th CONS",
    wonAt: "3 months ago",
    whyItMatters:
      "Statewide NC prime. Hangar work means standing-seam metal roofing — a clean fit for your past performance.",
    reachOut:
      "Email their subcontracts office a one-pager. Lead with your strongest standing-seam metal-roof past job. Ask about the metal-roof scope on the Seymour Johnson modernization specifically.",
    awardDetail: {
      id: "FA4809-26-C-0042",
      postedAt: "Posted to SAM.gov — 90 days ago",
      sourceLine: "Source: SAM.gov award notice · 4th Contracting Squadron",
    },
  },
  {
    id: "tap-builders",
    company: "T.A. Loving Company",
    awardType: "medical center modernization contract",
    award: "VA Fayetteville Medical Center modernization",
    value: "$6.1M",
    agency: "VA NCO 6",
    wonAt: "4 months ago",
    whyItMatters:
      "Goldsboro-based prime with steady VA work. The roofing subs they used on past VA jobs usually get pulled back into follow-on work without re-bidding.",
    reachOut:
      "Drive up to Goldsboro and introduce yourself — they know NC veteran-owned roofers by name. Lead with the fact that you're SDVOSB and local.",
    awardDetail: {
      id: "36C24622D0091",
      postedAt: "Posted to SAM.gov — 120 days ago",
      sourceLine: "Source: SAM.gov award notice · VA NCO 6",
    },
  },
];

// Forecasts — anticipated, not yet open
export type SetAside =
  | "SDVOSB"
  | "8(a)"
  | "SDB"
  | "WOSB"
  | "Total SB"
  | "Unrestricted"
  | "TBD";

export type ForecastCategory = "Roofing" | "Construction" | "Facilities" | "Other";

export interface ForecastBuyer {
  name: string;
  title: string;
  office: string;
  email?: string;
}

export interface Forecast {
  id: string;
  title: string;
  agency: string;
  agencyAbbrev: string;
  subAgency?: string;
  naics: { code: string; label: string };
  placeOfPerformance: string;
  setAside?: SetAside;
  estValueLow: number;
  estValueHigh: number;
  expectedValue: string; // display string
  expectedFY: number;
  expectedQuarter: 1 | 2 | 3 | 4;
  expectedWindow: string; // human label
  category: ForecastCategory;
  whyTrack: string;
  prepPlan: string[];
  buyer?: ForecastBuyer;
  sourceLine: string;
}

export interface Recompete {
  id: string;
  title: string;
  agency: string;
  agencyAbbrev: string;
  incumbent: string;
  incumbentAwardId?: string;
  currentAwardValue: number;
  expiresAt: string; // ISO
  expectedRebidFY: number;
  expectedRebidQuarter: 1 | 2 | 3 | 4;
  expectedRebidWindow: string;
  placeOfPerformance: string;
  setAside?: SetAside;
  naics: { code: string; label: string };
  category: ForecastCategory;
  play: string;
  prepPlan: string[];
  buyer?: ForecastBuyer;
  sourceLine: string;
}

const NAICS_ROOFING = { code: "238160", label: "Roofing Contractors" };
const NAICS_BUILDING = { code: "236220", label: "Commercial & Institutional Building" };
const NAICS_SHEET = { code: "238170", label: "Siding & Sheet Metal" };

export const FORECASTS: Forecast[] = [
  {
    id: "fc-bragg-barracks-3",
    title: "Phase 3 barracks roof replacement program — Fort Bragg",
    agency: "USACE Wilmington / Fort Bragg DPW",
    agencyAbbrev: "USACE",
    subAgency: "Wilmington District",
    naics: NAICS_ROOFING,
    placeOfPerformance: "Fort Bragg, NC",
    setAside: "SDVOSB",
    estValueLow: 2_000_000,
    estValueHigh: 4_000_000,
    expectedValue: "$2M–$4M",
    expectedFY: 2026,
    expectedQuarter: 3,
    expectedWindow: "Est. Q3 FY2026",
    category: "Roofing",
    whyTrack:
      "Follow-on to Phase 1 and 2. DPW usually hosts an industry day six to eight weeks before the bid opens.",
    prepPlan: [
      "Get your capability statement in front of the Fort Bragg DPW Small Business Liaison this quarter.",
      "Pre-qualify with the prime that won Phase 2 (see Who's Winning).",
      "Make sure your bonding capacity covers a $3M single job.",
    ],
    buyer: {
      name: "Karen Wexler",
      title: "Small Business Liaison Officer",
      office: "Fort Bragg DPW",
      email: "karen.j.wexler@usace.army.mil",
    },
    sourceLine: "Source: USACE Wilmington FY26 procurement forecast",
  },
  {
    id: "fc-lejeune-housing",
    title: "Camp Lejeune family housing re-roof (200+ units)",
    agency: "NAVFAC Mid-Atlantic",
    agencyAbbrev: "NAVFAC",
    subAgency: "Mid-Atlantic",
    naics: NAICS_ROOFING,
    placeOfPerformance: "Camp Lejeune, NC",
    setAside: "Unrestricted",
    estValueLow: 4_000_000,
    estValueHigh: 6_000_000,
    expectedValue: "$4M–$6M",
    expectedFY: 2026,
    expectedQuarter: 4,
    expectedWindow: "Est. Q4 FY2026",
    category: "Roofing",
    whyTrack:
      "On NAVFAC's published plan for next fiscal year. Likely a large prime — your play is to be on their sub roster before they bid.",
    prepPlan: [
      "Identify the two or three primes most likely to bid this and email each one a capability statement.",
      "Get on the NAVFAC Mid-Atlantic small-business vendor list.",
      "Line up a manufacturer letter for the roofing system you'd propose.",
    ],
    buyer: {
      name: "Renee Holloway",
      title: "Small Business Liaison Officer",
      office: "NAVFAC Mid-Atlantic",
      email: "renee.holloway@navy.mil",
    },
    sourceLine: "Source: NAVFAC Mid-Atlantic FY26 Forecast",
  },
  {
    id: "fc-cherry-point-hangar",
    title: "MCAS Cherry Point Hangar 9 envelope refresh",
    agency: "NAVFAC Mid-Atlantic",
    agencyAbbrev: "NAVFAC",
    subAgency: "Mid-Atlantic",
    naics: NAICS_BUILDING,
    placeOfPerformance: "Havelock, NC",
    setAside: "SDVOSB",
    estValueLow: 1_200_000,
    estValueHigh: 1_800_000,
    expectedValue: "$1.2M–$1.8M",
    expectedFY: 2027,
    expectedQuarter: 1,
    expectedWindow: "Est. Q1 FY2027",
    category: "Construction",
    whyTrack:
      "Right at the top of your current capacity — a realistic direct prime bid, not a sub job.",
    prepPlan: [
      "Tighten up a hangar / metal-roof past performance write-up.",
      "Visit the site if you can — first-hand mobilization knowledge wins points in the proposal.",
      "Confirm your bonding line covers $1.5M.",
    ],
    buyer: {
      name: "Renee Holloway",
      title: "Small Business Liaison Officer",
      office: "NAVFAC Mid-Atlantic",
      email: "renee.holloway@navy.mil",
    },
    sourceLine: "Source: NAVFAC Mid-Atlantic FY27 Forecast",
  },
  {
    id: "fc-fayetteville-rec",
    title: "Fayetteville Parks & Rec — 4 community centers re-roof",
    agency: "City of Fayetteville",
    agencyAbbrev: "Fayetteville",
    naics: NAICS_ROOFING,
    placeOfPerformance: "Fayetteville, NC",
    setAside: "Unrestricted",
    estValueLow: 600_000,
    estValueHigh: 900_000,
    expectedValue: "$600K–$900K",
    expectedFY: 2027,
    expectedQuarter: 1,
    expectedWindow: "Est. late 2026 budget cycle",
    category: "Roofing",
    whyTrack:
      "In the city's draft capital plan. Open public bid with strong local preference — a strong fit for you.",
    prepPlan: [
      "Make sure you're an approved vendor on the city procurement portal.",
      "Walk all four community center roofs now — being able to write a specific scope wins this.",
      "Stop by Public Works and let them know you'll bid it.",
    ],
    buyer: {
      name: "Marcus Reaves",
      title: "Procurement Manager",
      office: "City of Fayetteville Purchasing",
      email: "mreaves@fayettevillenc.gov",
    },
    sourceLine: "Source: City of Fayetteville FY27 draft capital plan",
  },
  {
    id: "fc-cumberland-schools-26",
    title: "Cumberland County Schools FY27 re-roofing program",
    agency: "Cumberland County Schools",
    agencyAbbrev: "CCS",
    naics: NAICS_ROOFING,
    placeOfPerformance: "Cumberland County, NC",
    setAside: "Unrestricted",
    estValueLow: 1_500_000,
    estValueHigh: 2_500_000,
    expectedValue: "$1.5M–$2.5M",
    expectedFY: 2027,
    expectedQuarter: 2,
    expectedWindow: "Est. Q2 FY2027 (after budget passes)",
    category: "Roofing",
    whyTrack:
      "Annual program in your home county. Sized for your largest past job. They publish a school list four to six weeks before the bid.",
    prepPlan: [
      "Get on the CCS bid notification email list now.",
      "Drive the school list as soon as it publishes — a quick site visit beats a clever spreadsheet.",
      "Have a roofing-system manufacturer lined up for warranty backing.",
    ],
    buyer: {
      name: "Patricia Vargas",
      title: "Director of Procurement",
      office: "Cumberland County Schools",
      email: "pvargas@ccs.k12.nc.us",
    },
    sourceLine: "Source: CCS FY27 capital outlay summary",
  },
  {
    id: "fc-va-durham",
    title: "VA Durham Medical Center — Building 2 re-roof",
    agency: "VA NCO 6",
    agencyAbbrev: "VA",
    subAgency: "NCO 6",
    naics: NAICS_ROOFING,
    placeOfPerformance: "Durham, NC",
    setAside: "SDVOSB",
    estValueLow: 800_000,
    estValueHigh: 1_200_000,
    expectedValue: "$800K–$1.2M",
    expectedFY: 2026,
    expectedQuarter: 3,
    expectedWindow: "Est. Q3 FY2026",
    category: "Roofing",
    whyTrack:
      "On the VA's published forecast. The VA usually reserves work like this for service-disabled veteran-owned businesses — which is you.",
    prepPlan: [
      "Confirm your SDVOSB verification is current at VetCert.va.gov.",
      "Email the VA NCO 6 Small Business Office to ask about the Durham VA roof timing.",
      "Pull a medical-center comparable past performance to the front of your capability statement.",
    ],
    buyer: {
      name: "Anthony Mercer",
      title: "Small Business Liaison",
      office: "VA NCO 6 — Durham",
      email: "anthony.mercer@va.gov",
    },
    sourceLine: "Source: VA NCO 6 Acquisition Forecast FY26",
  },
  {
    id: "fc-pope-aaf",
    title: "Pope AAF — Hangar 2 standing-seam roof",
    agency: "USACE Wilmington",
    agencyAbbrev: "USACE",
    subAgency: "Wilmington District",
    naics: NAICS_SHEET,
    placeOfPerformance: "Pope AAF, NC",
    setAside: "SDVOSB",
    estValueLow: 450_000,
    estValueHigh: 650_000,
    expectedValue: "$450K–$650K",
    expectedFY: 2026,
    expectedQuarter: 4,
    expectedWindow: "Est. Q4 FY2026",
    category: "Roofing",
    whyTrack:
      "Fifteen minutes from your shop. Similar Pope work has historically been reserved for service-disabled veteran-owned businesses.",
    prepPlan: [
      "Email the USACE Wilmington Small Business Liaison and name the Pope hangar specifically.",
      "Pull a standing-seam metal-roof past performance to the top of your one-pager.",
      "Visit the hangar from the outside — a site-aware proposal wins this size of job.",
    ],
    buyer: {
      name: "Karen Wexler",
      title: "Small Business Liaison Officer",
      office: "USACE Wilmington",
      email: "karen.j.wexler@usace.army.mil",
    },
    sourceLine: "Source: USACE Wilmington FY26 procurement forecast",
  },
  {
    id: "fc-seymour-johnson-fy28",
    title: "Seymour Johnson AFB — phased dormitory re-roof (FY28 follow-on)",
    agency: "USAF — 4th Civil Engineer Squadron",
    agencyAbbrev: "USAF",
    subAgency: "4th CES",
    naics: NAICS_ROOFING,
    placeOfPerformance: "Goldsboro, NC",
    setAside: "SDVOSB",
    estValueLow: 1_800_000,
    estValueHigh: 2_400_000,
    expectedValue: "$1.8M–$2.4M",
    expectedFY: 2028,
    expectedQuarter: 1,
    expectedWindow: "Est. Q1 FY2028",
    category: "Roofing",
    whyTrack:
      "Follow-on to the current T.A. Loving phased re-roofing — likely set-aside for veteran-owned, and Seymour Johnson knows NC SDVOSB roofers by name.",
    prepPlan: [
      "Drive up to Goldsboro and introduce yourself to the 4th CES Small Business office before FY27 closes.",
      "Pre-position a teaming letter with T.A. Loving in case it goes IDIQ.",
      "Document any dormitory re-roof past performance — Seymour wants verbatim past performance.",
    ],
    buyer: {
      name: "Lt. Col. Brian Tate",
      title: "Small Business Specialist",
      office: "4th Civil Engineer Squadron",
      email: "brian.tate.3@us.af.mil",
    },
    sourceLine: "Source: AFICA FY28 long-range acquisition outlook",
  },
  {
    id: "fc-wake-county-rec",
    title: "Wake County rec center envelope program",
    agency: "Wake County General Services",
    agencyAbbrev: "Wake County",
    naics: NAICS_BUILDING,
    placeOfPerformance: "Raleigh, NC",
    setAside: "Total SB",
    estValueLow: 1_200_000,
    estValueHigh: 2_000_000,
    expectedValue: "$1.2M–$2M",
    expectedFY: 2027,
    expectedQuarter: 3,
    expectedWindow: "Est. Q3 FY2027",
    category: "Facilities",
    whyTrack:
      "Wake County publishes their capital plan a full year in advance — plenty of runway to get on the bid list.",
    prepPlan: [
      "Register on the Wake County vendor portal (HUB-aligned bonus points).",
      "Attend the spring industry day — they read attendance lists when scoring small-business participation.",
      "Pull a multi-site rec-center comparable past performance.",
    ],
    buyer: {
      name: "Devon Patel",
      title: "Senior Buyer",
      office: "Wake County General Services",
      email: "devon.patel@wake.gov",
    },
    sourceLine: "Source: Wake County FY27 Capital Improvement Plan",
  },
  {
    id: "fc-charleston-va",
    title: "Ralph H. Johnson VA — outpatient clinic re-roof",
    agency: "VA NCO 7",
    agencyAbbrev: "VA",
    subAgency: "NCO 7",
    naics: NAICS_ROOFING,
    placeOfPerformance: "Charleston, SC",
    setAside: "SDVOSB",
    estValueLow: 900_000,
    estValueHigh: 1_400_000,
    expectedValue: "$900K–$1.4M",
    expectedFY: 2027,
    expectedQuarter: 2,
    expectedWindow: "Est. Q2 FY2027",
    category: "Roofing",
    whyTrack:
      "VA NCO 7 covers SC/GA — adjacent territory worth a one-hour drive. Usually SDVOSB set-aside.",
    prepPlan: [
      "Add Charleston to your travel-zone language on the capability statement.",
      "Email the NCO 7 SBLO with a one-paragraph intro and your VA Durham past performance.",
      "Confirm SDVOSB verification covers SC work.",
    ],
    buyer: {
      name: "Janelle Brooks",
      title: "Small Business Liaison",
      office: "VA NCO 7 — Charleston",
      email: "janelle.brooks@va.gov",
    },
    sourceLine: "Source: VA NCO 7 Acquisition Forecast FY27",
  },
];

export const RECOMPETES: Recompete[] = [
  {
    id: "rc-lejeune-barracks",
    title: "Camp Lejeune barracks envelope renovation (recompete)",
    agency: "NAVFAC Mid-Atlantic",
    agencyAbbrev: "NAVFAC",
    incumbent: "Sterling Roofing",
    incumbentAwardId: "AWD-sterling-lejeune",
    currentAwardValue: 4_200_000,
    expiresAt: "2027-03-15",
    expectedRebidFY: 2027,
    expectedRebidQuarter: 2,
    expectedRebidWindow: "Est. Q2 FY2027 rebid",
    placeOfPerformance: "Camp Lejeune, NC",
    setAside: "SDVOSB",
    naics: NAICS_ROOFING,
    category: "Roofing",
    play:
      "This roofing contract at Lejeune expires in ~14 months. Get on the radar now — either bid the recompete or team with whoever's positioning for it.",
    prepPlan: [
      "Watch Sterling's job postings — staffing-up usually means they're preparing the recompete bid.",
      "Email the NAVFAC Mid-Atlantic SBLO that you're tracking the recompete.",
      "Drive past the site once a quarter so your scope assumptions stay current.",
    ],
    buyer: {
      name: "Renee Holloway",
      title: "Small Business Liaison Officer",
      office: "NAVFAC Mid-Atlantic",
      email: "renee.holloway@navy.mil",
    },
    sourceLine: "Source: FPDS award record · NAVFAC FY26 forecast cross-ref",
  },
  {
    id: "rc-bragg-housing",
    title: "Fort Bragg housing IDIQ (recompete)",
    agency: "USACE Wilmington",
    agencyAbbrev: "USACE",
    incumbent: "Bordeaux Construction",
    incumbentAwardId: "AWD-bordeaux-bragg-idiq",
    currentAwardValue: 18_500_000,
    expiresAt: "2027-09-30",
    expectedRebidFY: 2027,
    expectedRebidQuarter: 4,
    expectedRebidWindow: "Est. Q4 FY2027 rebid",
    placeOfPerformance: "Fort Bragg, NC",
    setAside: "Unrestricted",
    naics: NAICS_BUILDING,
    category: "Construction",
    play:
      "Big IDIQ — too large for you to prime, but Bordeaux will need sub-roofing on every task order. Get on their roster now.",
    prepPlan: [
      "Submit a capability package directly to Bordeaux's small-business contact.",
      "Tell the USACE SBLO you're positioning as a sub on the recompete.",
      "Line up a teaming letter template for the next task order.",
    ],
    buyer: {
      name: "Karen Wexler",
      title: "Small Business Liaison Officer",
      office: "USACE Wilmington",
      email: "karen.j.wexler@usace.army.mil",
    },
    sourceLine: "Source: FPDS award record · USACE FY27 forecast",
  },
  {
    id: "rc-seymour-phased",
    title: "Seymour Johnson AFB phased re-roofing (recompete)",
    agency: "USAF — 4th Civil Engineer Squadron",
    agencyAbbrev: "USAF",
    incumbent: "T.A. Loving Co.",
    incumbentAwardId: "AWD-taloving-seymour",
    currentAwardValue: 3_100_000,
    expiresAt: "2027-06-30",
    expectedRebidFY: 2027,
    expectedRebidQuarter: 3,
    expectedRebidWindow: "Est. Q3 FY2027 rebid",
    placeOfPerformance: "Goldsboro, NC",
    setAside: "SDVOSB",
    naics: NAICS_ROOFING,
    category: "Roofing",
    play:
      "T.A. Loving has held this two cycles — the base may want fresh SDVOSB competition. Walk in introduced and you have a real shot.",
    prepPlan: [
      "Schedule a meet-and-greet with the 4th CES SB office this quarter.",
      "Pull together a dormitory + base-housing past performance one-pager.",
      "Track when the FY27 forecast lists the solicitation — usually 90 days out.",
    ],
    buyer: {
      name: "Lt. Col. Brian Tate",
      title: "Small Business Specialist",
      office: "4th Civil Engineer Squadron",
      email: "brian.tate.3@us.af.mil",
    },
    sourceLine: "Source: FPDS award record · AFICA FY27 outlook",
  },
  {
    id: "rc-cherrypoint-hangar",
    title: "MCAS Cherry Point hangar envelope (recompete)",
    agency: "NAVFAC Mid-Atlantic",
    agencyAbbrev: "NAVFAC",
    incumbent: "Clark Construction",
    incumbentAwardId: "AWD-clark-cherrypoint",
    currentAwardValue: 5_800_000,
    expiresAt: "2027-12-31",
    expectedRebidFY: 2028,
    expectedRebidQuarter: 1,
    expectedRebidWindow: "Est. Q1 FY2028 rebid",
    placeOfPerformance: "Havelock, NC",
    setAside: "Unrestricted",
    naics: NAICS_BUILDING,
    category: "Construction",
    play:
      "Clark is a top-50 ENR prime — pursue this as a roofing sub, not a competitor. Their SBLO is your contact.",
    prepPlan: [
      "Email Clark's NC/SC small-business team and request a teaming intro.",
      "Document any standing-seam metal-roof past performance you can attach.",
      "Re-walk the hangar exteriors annually to keep scope assumptions fresh.",
    ],
    buyer: {
      name: "Renee Holloway",
      title: "Small Business Liaison Officer",
      office: "NAVFAC Mid-Atlantic",
      email: "renee.holloway@navy.mil",
    },
    sourceLine: "Source: FPDS award record · NAVFAC FY28 outlook",
  },
  {
    id: "rc-salisbury-va",
    title: "VA Salisbury campus modernization (recompete)",
    agency: "VA NCO 6",
    agencyAbbrev: "VA",
    incumbent: "Whiting-Turner",
    incumbentAwardId: "AWD-whitingturner-salisbury",
    currentAwardValue: 9_700_000,
    expiresAt: "2027-04-30",
    expectedRebidFY: 2027,
    expectedRebidQuarter: 2,
    expectedRebidWindow: "Est. Q2 FY2027 rebid",
    placeOfPerformance: "Salisbury, NC",
    setAside: "SDVOSB",
    naics: NAICS_BUILDING,
    category: "Construction",
    play:
      "Whiting-Turner subs all roofing work. SDVOSB sub spot is realistic — start the relationship now.",
    prepPlan: [
      "Get on Whiting-Turner's NC subcontractor portal.",
      "Email VA NCO 6 SBLO referencing the Salisbury recompete window.",
      "Stage your VA Durham past performance as the lead exhibit.",
    ],
    buyer: {
      name: "Anthony Mercer",
      title: "Small Business Liaison",
      office: "VA NCO 6 — Durham",
      email: "anthony.mercer@va.gov",
    },
    sourceLine: "Source: FPDS award record · VA NCO 6 FY27 forecast",
  },
  {
    id: "rc-pope-idiq",
    title: "Pope AAF facilities IDIQ (recompete)",
    agency: "USACE Wilmington",
    agencyAbbrev: "USACE",
    incumbent: "M.A. Mortenson",
    incumbentAwardId: "AWD-mortenson-pope",
    currentAwardValue: 12_400_000,
    expiresAt: "2028-02-28",
    expectedRebidFY: 2028,
    expectedRebidQuarter: 2,
    expectedRebidWindow: "Est. Q2 FY2028 rebid",
    placeOfPerformance: "Pope AAF, NC",
    setAside: "Total SB",
    naics: NAICS_BUILDING,
    category: "Construction",
    play:
      "Set-aside intent is Total Small Business — the recompete may break Mortenson's hold. Worth pursuing as a teaming lead at minimum.",
    prepPlan: [
      "Find the small-business prime most likely to bid this and introduce yourself.",
      "Email USACE Wilmington SBLO and ask about industry-day timing.",
      "Get bonding capacity documented for $5M to qualify as a sub team lead.",
    ],
    buyer: {
      name: "Karen Wexler",
      title: "Small Business Liaison Officer",
      office: "USACE Wilmington",
      email: "karen.j.wexler@usace.army.mil",
    },
    sourceLine: "Source: FPDS award record · USACE FY28 outlook",
  },
];

// Bucket the expected window relative to NOW.
import { NOW } from "../format";

export type ForecastBucket = "soon" | "mid" | "later";

function fyqToDate(fy: number, q: 1 | 2 | 3 | 4): Date {
  // US Government FY: FY2026 = Oct 2025 – Sep 2026. Q1 starts Oct.
  const startMonth = (q - 1) * 3 + 9; // Q1 -> 9 (Oct), Q2 -> 12, Q3 -> 15, Q4 -> 18
  return new Date(fy - 1, startMonth + 1, 15); // midpoint of quarter
}

export function forecastBucket(fy: number, q: 1 | 2 | 3 | 4, now: Date = NOW): ForecastBucket {
  const target = fyqToDate(fy, q);
  const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  if (months <= 6) return "soon";
  if (months <= 12) return "mid";
  return "later";
}

export function findForecastById(id: string): Forecast | undefined {
  return FORECASTS.find((f) => f.id === id);
}

export function findRecompeteById(id: string): Recompete | undefined {
  return RECOMPETES.find((r) => r.id === id);
}


export function countOpenForAgency(agency: Agency): number {
  return OPPORTUNITIES.filter(agency.matchOn).length;
}
export function openOppsForAgency(agency: Agency): Opportunity[] {
  return OPPORTUNITIES.filter(agency.matchOn);
}

// Awarded contracts dataset — recently-won federal/SLED contracts in Marcus's
// NC roofing/construction space. Used by the "Awarded contracts" tab as
// teaming leads (not biddable solicitations).

import { NOW } from "../format";
import type { OppScope } from "./opportunities";

export type SubTrend = "growing" | "steady" | "winding-down" | "none";
export type TeamingPhase =
  | "too-early"
  | "sweet-spot"
  | "established"
  | "recompete-soon";

export interface SubChainEntry {
  name: string;
  trade: string;
  dollarVolume: string; // human-formatted
  trend: "up" | "flat" | "down";
}

export interface SigningCO {
  /** Plausible sample name — never claimed as real. */
  name: string;
  title: "Contracting Officer";
  /** Optional link into a buyer's officers[] (GovBuyer.id + officer id). */
  buyerId?: string;
  officerId?: string;
}

export interface AwardedContract {
  id: string;
  title: string;
  agency: string;
  agencyAbbrev: string;
  subAgency?: string;
  scope: OppScope;
  winner: string;
  awardValue: number;
  awardedAt: string; // ISO
  location: string;
  workType: string;
  // Teaming signal
  subHistory: {
    smallSubsCount: number;
    windowMonths: number;
    trend: SubTrend;
    summary: string;
  };
  smallBusinessGoalPct?: number;
  leverageLine: string;
  // SBLO contact (at the winning company)
  sblo: { name: string; title: string; email: string };
  // Award provenance — who signed it on the government side
  signingCO: SigningCO;
  // Dollars actually committed; ceiling = IDIQ/estimated maximum if different
  obligated: number;
  ceiling?: number;
  // Detail layers
  subChain?: SubChainEntry[];
  otherBidders?: string[];
  timelineStatus?: string;
  recompeteAt?: string; // ISO
  teamingRelevanceScore: number; // 0–100
}

// ───── helpers ─────

const MS_DAY = 86_400_000;
const monthsAgo = (n: number) =>
  new Date(NOW.getTime() - n * 30 * MS_DAY).toISOString();
const monthsAhead = (n: number) =>
  new Date(NOW.getTime() + n * 30 * MS_DAY).toISOString();

export function monthsSince(iso: string): number {
  return (NOW.getTime() - new Date(iso).getTime()) / (30 * MS_DAY);
}

export interface TeamingWindow {
  phase: TeamingPhase;
  line: string;
}

export function teamingWindow(
  awardedAt: string,
  recompeteAt?: string,
): TeamingWindow {
  const monthsToRecompete = recompeteAt
    ? (new Date(recompeteAt).getTime() - NOW.getTime()) / (30 * MS_DAY)
    : Infinity;
  if (monthsToRecompete > 0 && monthsToRecompete <= 18) {
    return {
      phase: "recompete-soon",
      line: `Comes up for rebid in ~${Math.round(monthsToRecompete)} months — get on their radar now.`,
    };
  }
  const m = monthsSince(awardedAt);
  if (m < 1) {
    return {
      phase: "too-early",
      line: "Just awarded — give them a few weeks to staff up, then reach out.",
    };
  }
  if (m < 9) {
    return { phase: "sweet-spot", line: "Good time to reach out." };
  }
  return {
    phase: "established",
    line: "Established project — intro still works if your scope fits an upcoming task order.",
  };
}

export function formatAwardValue(n: number): string {
  if (n >= 1_000_000_000)
    return `$${(n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 1)}B`;
  if (n >= 1_000_000)
    return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

export function formatAwardedRelative(iso: string): string {
  const m = monthsSince(iso);
  if (m < 1) {
    const weeks = Math.max(1, Math.round((m * 30) / 7));
    return `awarded ${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  const rounded = Math.round(m);
  return `awarded ${rounded} month${rounded === 1 ? "" : "s"} ago`;
}

// ───── seed ─────

type Seed = Omit<
  AwardedContract,
  "agencyAbbrev" | "teamingRelevanceScore" | "signingCO" | "obligated" | "ceiling"
> & {
  agencyAbbrev?: string;
  teamingRelevanceScore?: number;
};

const AGENCY_ABBREV: Record<string, string> = {
  Navy: "Navy",
  "Air Force": "Air Force",
  USACE: "USACE",
  VA: "VA",
  GSA: "GSA",
  "Cumberland County Schools": "CCSC",
  "Wake County Public Schools": "WCPSS",
  "NC State University": "NC State",
};

const SEEDS: Seed[] = [
  {
    id: "AWD-sterling-lejeune",
    title: "Camp Lejeune barracks envelope renovation",
    agency: "Navy",
    subAgency: "NAVFAC Mid-Atlantic",
    scope: "fed",
    winner: "Sterling Roofing",
    awardValue: 3_200_000,
    awardedAt: monthsAgo(4),
    location: "Jacksonville, NC",
    workType: "Roofing & envelope",
    subHistory: {
      smallSubsCount: 5,
      windowMonths: 24,
      trend: "growing",
      summary:
        "Sterling has subcontracted to 5 small roofing firms in the last 2 years — and growing.",
    },
    smallBusinessGoalPct: 23,
    leverageLine:
      "This $3.2M job carries a 23% small-business subcontracting goal — primes like Sterling need qualified subs like you to hit it.",
    sblo: {
      name: "Linda Hartwell",
      title: "Small Business Liaison Officer",
      email: "lhartwell@sterlingroofing.com",
    },
    subChain: [
      { name: "Cape Fear Roofing Co.", trade: "TPO install", dollarVolume: "$340K", trend: "up" },
      { name: "Triad Envelope LLC", trade: "Weatherproofing", dollarVolume: "$210K", trend: "flat" },
      { name: "Pinehurst Sheet Metal", trade: "Flashing & metal", dollarVolume: "$185K", trend: "up" },
    ],
    otherBidders: ["Hensel Phelps", "Whiting-Turner", "T.A. Loving Co."],
    timelineStatus: "Mobilizing — week 8 of 22",
    teamingRelevanceScore: 95,
  },
  {
    id: "AWD-bordeaux-bragg-idiq",
    title: "Fort Bragg housing IDIQ",
    agency: "USACE",
    subAgency: "Wilmington District",
    scope: "fed",
    winner: "Bordeaux Construction",
    awardValue: 42_000_000,
    awardedAt: monthsAgo(2),
    location: "Fort Bragg, NC",
    workType: "Housing IDIQ",
    subHistory: {
      smallSubsCount: 12,
      windowMonths: 24,
      trend: "growing",
      summary:
        "Bordeaux has used 12 NC-local small-business subs in the last 2 years across roofing, envelope, and sitework — and the count is rising.",
    },
    smallBusinessGoalPct: 30,
    leverageLine:
      "IDIQ vehicles like this one carry rolling small-business subcontracting goals — Bordeaux needs a deep bench of SDVOSB subs through 2030.",
    sblo: {
      name: "Marcus Reeves",
      title: "Director, Small Business Programs",
      email: "mreeves@bordeauxconstruction.com",
    },
    subChain: [
      { name: "Williams Construction LLC (you)", trade: "Roofing", dollarVolume: "—", trend: "flat" },
      { name: "Carolina Site Works", trade: "Sitework", dollarVolume: "$480K", trend: "up" },
      { name: "Sandhills Mechanical", trade: "HVAC", dollarVolume: "$520K", trend: "up" },
    ],
    otherBidders: ["Hensel Phelps", "Clark Construction"],
    timelineStatus: "Task orders releasing quarterly through 2030",
    teamingRelevanceScore: 97,
  },
  {
    id: "AWD-hensel-bragg-housing",
    title: "Fort Bragg housing modernization",
    agency: "USACE",
    subAgency: "Wilmington District",
    scope: "fed",
    winner: "Hensel Phelps",
    awardValue: 48_000_000,
    awardedAt: monthsAgo(1),
    location: "Fort Bragg, NC",
    workType: "Housing modernization",
    subHistory: {
      smallSubsCount: 8,
      windowMonths: 24,
      trend: "growing",
      summary:
        "Hensel Phelps has onboarded 8 SDVOSB roofing/envelope subs in NC and VA over the last 2 years.",
    },
    smallBusinessGoalPct: 28,
    leverageLine:
      "Hensel Phelps maintains formal SDVOSB sub goals on every IDIQ — they actively recruit local firms to keep their compliance numbers clean.",
    sblo: {
      name: "Janet Okonkwo",
      title: "Small Business Liaison Officer",
      email: "j.okonkwo@henselphelps.com",
    },
    subChain: [
      { name: "Sandhills Roofing", trade: "Roofing", dollarVolume: "$620K", trend: "up" },
      { name: "Tar Heel Envelope", trade: "Envelope", dollarVolume: "$410K", trend: "up" },
    ],
    timelineStatus: "Just mobilizing — staffing sub bench now",
    teamingRelevanceScore: 92,
  },
  {
    id: "AWD-taloving-seymour",
    title: "Seymour Johnson AFB phased re-roofing",
    agency: "Air Force",
    subAgency: "4th CONS",
    scope: "fed",
    winner: "T.A. Loving Co.",
    awardValue: 24_000_000,
    awardedAt: monthsAgo(1),
    location: "Goldsboro, NC",
    workType: "Phased re-roofing program",
    subHistory: {
      smallSubsCount: 9,
      windowMonths: 24,
      trend: "growing",
      summary:
        "T.A. Loving (Goldsboro NC) leans heavily on NC SDVOSB subs — 9 in the last 2 years, mostly roofing trades.",
    },
    smallBusinessGoalPct: 25,
    leverageLine:
      "T.A. Loving is a local NC prime who treats SDVOSB outreach as routine — this is the warmest intro on your list.",
    sblo: {
      name: "David Strickland",
      title: "VP Small Business Programs",
      email: "dstrickland@taloving.com",
    },
    subChain: [
      { name: "Goldsboro Roofing", trade: "Shingle", dollarVolume: "$280K", trend: "flat" },
      { name: "Cape Fear Roofing Co.", trade: "TPO", dollarVolume: "$310K", trend: "up" },
    ],
    timelineStatus: "Phase 1 starting — sub bench being filled now",
    teamingRelevanceScore: 94,
  },
  {
    id: "AWD-whitingturner-salisbury",
    title: "VA Salisbury campus modernization",
    agency: "VA",
    subAgency: "OCFM",
    scope: "fed",
    winner: "Whiting-Turner",
    awardValue: 18_000_000,
    awardedAt: monthsAgo(2),
    location: "Salisbury, NC",
    workType: "Campus modernization",
    subHistory: {
      smallSubsCount: 6,
      windowMonths: 24,
      trend: "steady",
      summary:
        "Whiting-Turner reliably uses NC-local SDVOSB roofing subs — 6 in the last 2 years, mostly mid-size jobs.",
    },
    smallBusinessGoalPct: 22,
    leverageLine:
      "VA work carries strict SDVOSB subcontracting goals — Whiting-Turner needs verified SDVOSB partners on every campus job.",
    sblo: {
      name: "Sara Calloway",
      title: "Small Business Liaison Officer",
      email: "sara.calloway@whiting-turner.com",
    },
    subChain: [
      { name: "Piedmont Roofing", trade: "Modified bitumen", dollarVolume: "$390K", trend: "flat" },
    ],
    teamingRelevanceScore: 88,
  },
  {
    id: "AWD-mortenson-pope",
    title: "Pope AAF facilities IDIQ",
    agency: "USACE",
    subAgency: "Wilmington District",
    scope: "fed",
    winner: "M.A. Mortenson",
    awardValue: 35_000_000,
    awardedAt: monthsAgo(5),
    location: "Pope AAF, NC",
    workType: "Facilities IDIQ",
    subHistory: {
      smallSubsCount: 7,
      windowMonths: 24,
      trend: "steady",
      summary:
        "Mortenson uses ~7 NC-area small subs per year on this vehicle — predictable, stable bench.",
    },
    smallBusinessGoalPct: 26,
    leverageLine:
      "Task-order IDIQs are the ideal SDVOSB-sub on-ramp — small dollar tickets, steady cadence, the prime is incentivized to spread work.",
    sblo: {
      name: "Patrick Lee",
      title: "Small Business Program Manager",
      email: "patrick.lee@mortenson.com",
    },
    subChain: [
      { name: "Cumberland Roofing", trade: "Roofing", dollarVolume: "$210K", trend: "flat" },
      { name: "Bragg Sheet Metal", trade: "Metal", dollarVolume: "$160K", trend: "flat" },
    ],
    timelineStatus: "Active — staffing task-order subs continuously",
    teamingRelevanceScore: 86,
  },
  {
    id: "AWD-clark-cherrypoint",
    title: "MCAS Cherry Point hangar envelope",
    agency: "Navy",
    subAgency: "NAVFAC",
    scope: "fed",
    winner: "Clark Construction",
    awardValue: 22_000_000,
    awardedAt: monthsAgo(1),
    location: "Cherry Point, NC",
    workType: "Hangar envelope",
    subHistory: {
      smallSubsCount: 4,
      windowMonths: 24,
      trend: "growing",
      summary:
        "Clark has used 4 NC small-business envelope subs in the last 2 years on Navy work — adding more as MCAS work grows.",
    },
    smallBusinessGoalPct: 24,
    leverageLine:
      "Hangar envelope work is your secondary NAICS — Clark needs subs with hangar past performance, which you have.",
    sblo: {
      name: "Tomás Vega",
      title: "Small Business Liaison Officer",
      email: "tvega@clarkconstruction.com",
    },
    subChain: [
      { name: "Coastal Carolina Envelope", trade: "Envelope", dollarVolume: "$280K", trend: "up" },
    ],
    timelineStatus: "Mobilizing now",
    teamingRelevanceScore: 83,
  },
  {
    id: "AWD-ecc-savannah-idiq",
    title: "USACE Savannah small-projects IDIQ",
    agency: "USACE",
    subAgency: "Savannah District",
    scope: "fed",
    winner: "ECC Constructors",
    awardValue: 14_000_000,
    awardedAt: monthsAgo(7),
    location: "Savannah District (NC/SC/GA)",
    workType: "Small-projects IDIQ",
    subHistory: {
      smallSubsCount: 11,
      windowMonths: 24,
      trend: "growing",
      summary:
        "ECC actively recruits SDVOSB subs across the Savannah District — 11 in the last 2 years.",
    },
    smallBusinessGoalPct: 30,
    leverageLine:
      "Task orders on this IDIQ are right in your dollar range ($200K–$750K), and ECC's regional manager handles intros personally.",
    sblo: {
      name: "Renee Holloway",
      title: "NC/SC Regional Small Business Manager",
      email: "rholloway@ecc.net",
    },
    teamingRelevanceScore: 80,
  },
  {
    id: "AWD-skanska-norfolk",
    title: "Norfolk Naval Shipyard barracks renovation",
    agency: "Navy",
    subAgency: "NAVFAC Mid-Atlantic",
    scope: "fed",
    winner: "Skanska",
    awardValue: 62_000_000,
    awardedAt: monthsAgo(2),
    location: "Norfolk, VA",
    workType: "Barracks renovation",
    subHistory: {
      smallSubsCount: 3,
      windowMonths: 24,
      trend: "steady",
      summary:
        "Skanska uses a small but stable VA/NC SDVOSB roofing bench — 3 firms over the last 2 years.",
    },
    smallBusinessGoalPct: 22,
    leverageLine:
      "Skanska's SDVOSB sub goals are formal and tracked — your one-page intro lands in a queue that's actually reviewed.",
    sblo: {
      name: "Aisha Bennett",
      title: "Small Business Liaison Officer",
      email: "aisha.bennett@skanska.com",
    },
    teamingRelevanceScore: 72,
  },
  {
    id: "AWD-turner-langley",
    title: "Joint Base Langley-Eustis renovation",
    agency: "Air Force",
    subAgency: "Langley-Eustis",
    scope: "fed",
    winner: "Turner Construction",
    awardValue: 58_000_000,
    awardedAt: monthsAgo(2),
    location: "Hampton, VA",
    workType: "Base renovation",
    subHistory: {
      smallSubsCount: 6,
      windowMonths: 24,
      trend: "steady",
      summary:
        "Turner runs a formal SBLO outreach process — 6 small roofing/envelope subs onboarded in the last 2 years.",
    },
    smallBusinessGoalPct: 25,
    leverageLine:
      "Turner's bench process is paperwork-heavy but predictable — get on it once and you're called for years.",
    sblo: {
      name: "Brian Whitaker",
      title: "Small Business Liaison Officer",
      email: "bwhitaker@tcco.com",
    },
    teamingRelevanceScore: 70,
  },
  {
    id: "AWD-caddell-mclb",
    title: "MCLB Albany base contract",
    agency: "Navy",
    subAgency: "NAVFAC",
    scope: "fed",
    winner: "Caddell Construction",
    awardValue: 80_000_000,
    awardedAt: monthsAgo(3),
    location: "Albany, GA",
    workType: "Base operations & construction",
    subHistory: {
      smallSubsCount: 2,
      windowMonths: 24,
      trend: "winding-down",
      summary:
        "Caddell's SDVOSB sub roster on this contract is short and quiet — only 2 firms recently, and trending down.",
    },
    smallBusinessGoalPct: 20,
    leverageLine:
      "SDVOSB sub goals are tight on this one — Caddell needs new names on the bench to stay compliant.",
    sblo: {
      name: "Jordan Faulk",
      title: "Small Business Liaison Officer",
      email: "jfaulk@caddell.com",
    },
    teamingRelevanceScore: 60,
  },
  {
    id: "AWD-brasfield-charleston",
    title: "VA Charleston outpatient clinic",
    agency: "VA",
    subAgency: "OCFM",
    scope: "fed",
    winner: "Brasfield & Gorrie",
    awardValue: 48_000_000,
    awardedAt: monthsAgo(3),
    location: "North Charleston, SC",
    workType: "Outpatient clinic",
    subHistory: {
      smallSubsCount: 5,
      windowMonths: 24,
      trend: "steady",
      summary:
        "B&G uses 5 SE-region small-business roofing/envelope subs — steady cadence on VA work.",
    },
    smallBusinessGoalPct: 23,
    leverageLine:
      "VA work mandates SDVOSB sub participation — B&G needs verified partners for every clinic and campus job.",
    sblo: {
      name: "Allison Park",
      title: "Small Business Liaison Officer",
      email: "apark@brasfieldgorrie.com",
    },
    teamingRelevanceScore: 74,
  },
  {
    id: "AWD-ccs-fayetteville",
    title: "Cumberland County Schools roof program (multi-year)",
    agency: "Cumberland County Schools",
    scope: "sled",
    winner: "Roof Solutions of NC",
    awardValue: 4_800_000,
    awardedAt: monthsAgo(6),
    location: "Fayetteville, NC",
    workType: "Multi-school re-roofing",
    subHistory: {
      smallSubsCount: 3,
      windowMonths: 24,
      trend: "steady",
      summary:
        "Roof Solutions of NC has subbed to 3 local roofing firms over 2 years on this program.",
    },
    leverageLine:
      "SLED work has no formal SDVOSB mandate — but Cumberland County contracts reward local NC partners, which Roof Solutions needs.",
    sblo: {
      name: "Wes Calloway",
      title: "Operations Manager",
      email: "wes@roofsolutionsnc.com",
    },
    recompeteAt: monthsAhead(14),
    timelineStatus: "Year 2 of 5 — recompete in ~14 months",
    teamingRelevanceScore: 78,
  },
  {
    id: "AWD-balfour-cherrypoint",
    title: "MCAS Cherry Point flightline support",
    agency: "Navy",
    subAgency: "NAVFAC",
    scope: "fed",
    winner: "Balfour Beatty",
    awardValue: 31_000_000,
    awardedAt: monthsAgo(8),
    location: "Cherry Point, NC",
    workType: "Flightline support",
    subHistory: {
      smallSubsCount: 0,
      windowMonths: 24,
      trend: "none",
      summary: "No history of small-business roofing subs on this contract.",
    },
    leverageLine:
      "Balfour hasn't used small-business roofing subs here — outreach is a long shot unless your scope shifts.",
    sblo: {
      name: "Marie Chen",
      title: "Small Business Liaison Officer",
      email: "marie.chen@balfourbeattyus.com",
    },
    teamingRelevanceScore: 35,
  },
  {
    id: "AWD-archer-greensboro",
    title: "Greensboro federal building re-roof program",
    agency: "GSA",
    subAgency: "Region 4",
    scope: "fed",
    winner: "Archer Western",
    awardValue: 8_900_000,
    awardedAt: monthsAgo(10),
    location: "Greensboro, NC",
    workType: "Federal building re-roofing",
    subHistory: {
      smallSubsCount: 4,
      windowMonths: 24,
      trend: "steady",
      summary:
        "Archer Western has used 4 NC small-business roofing subs on Region 4 work in the last 2 years.",
    },
    smallBusinessGoalPct: 24,
    leverageLine:
      "Region 4 small-business goals are tracked quarterly — Archer needs steady SDVOSB partners to keep their score.",
    sblo: {
      name: "Greg Tomlinson",
      title: "Small Business Liaison Officer",
      email: "gtomlinson@archerwestern.com",
    },
    recompeteAt: monthsAhead(8),
    timelineStatus: "Recompete in ~8 months",
    teamingRelevanceScore: 85,
  },
];

// ───── signing CO + obligated/ceiling overlay ─────
// Plausible sample names only. Where a known buyer officer signs the award,
// buyerId + officerId let the UI link back to that person in the agency People.
interface AwardOverlay {
  signingCO: SigningCO;
  obligated: number;
  ceiling?: number;
}

const AWARD_OVERLAYS: Record<string, AwardOverlay> = {
  "AWD-sterling-lejeune": {
    signingCO: { name: "LCDR Patrick Doyle", title: "Contracting Officer", buyerId: "navfac-lejeune", officerId: "lej-2" },
    obligated: 3_200_000,
  },
  "AWD-bordeaux-bragg-idiq": {
    signingCO: { name: "Maj. David R. Holcomb", title: "Contracting Officer", buyerId: "usace-wilmington", officerId: "usace-w-2" },
    obligated: 9_400_000,
    ceiling: 42_000_000,
  },
  "AWD-hensel-bragg-housing": {
    signingCO: { name: "LaTonya Brewer", title: "Contracting Officer", buyerId: "usace-wilmington", officerId: "usace-w-3" },
    obligated: 12_800_000,
    ceiling: 48_000_000,
  },
  "AWD-taloving-seymour": {
    signingCO: { name: "Capt. Eli Soto", title: "Contracting Officer", buyerId: "seymour-johnson", officerId: "sj-2" },
    obligated: 24_000_000,
  },
  "AWD-whitingturner-salisbury": {
    signingCO: { name: "Marcus Antonelli", title: "Contracting Officer", buyerId: "va-salisbury", officerId: "vas-2" },
    obligated: 18_000_000,
  },
  "AWD-mortenson-pope": {
    signingCO: { name: "Maj. Trent Larkin", title: "Contracting Officer", buyerId: "pope-aaf", officerId: "pope-2" },
    obligated: 7_200_000,
    ceiling: 35_000_000,
  },
  "AWD-clark-cherrypoint": {
    signingCO: { name: "LtCol Hannah Greer", title: "Contracting Officer", buyerId: "navfac-cherrypoint", officerId: "chp-2" },
    obligated: 22_000_000,
  },
  "AWD-ecc-savannah-idiq": {
    signingCO: { name: "Mark E. Petersen", title: "Contracting Officer", buyerId: "usace-savannah", officerId: "usace-s-2" },
    obligated: 3_100_000,
    ceiling: 14_000_000,
  },
  "AWD-skanska-norfolk": {
    signingCO: { name: "CDR Renée Halloway", title: "Contracting Officer" },
    obligated: 62_000_000,
  },
  "AWD-turner-langley": {
    signingCO: { name: "Maj. Beverly Thacker", title: "Contracting Officer" },
    obligated: 58_000_000,
  },
  "AWD-caddell-mclb": {
    signingCO: { name: "Karen J. Whitfield", title: "Contracting Officer", buyerId: "usace-wilmington", officerId: "usace-w-1" },
    obligated: 18_400_000,
    ceiling: 80_000_000,
  },
  "AWD-brasfield-charleston": {
    signingCO: { name: "Aaron Whitt", title: "Contracting Officer", buyerId: "va-fayetteville", officerId: "vaf-2" },
    obligated: 48_000_000,
  },
  "AWD-ccs-fayetteville": {
    signingCO: { name: "Greg Underwood", title: "Contracting Officer", buyerId: "cumberland-schools", officerId: "ccs-3" },
    obligated: 4_800_000,
  },
  "AWD-balfour-cherrypoint": {
    signingCO: { name: "Jerome Akins", title: "Contracting Officer", buyerId: "navfac-cherrypoint", officerId: "chp-3" },
    obligated: 31_000_000,
  },
  "AWD-archer-greensboro": {
    signingCO: { name: "Henry Park", title: "Contracting Officer", buyerId: "gsa-r4", officerId: "gsa-2" },
    obligated: 8_900_000,
  },
};

function overlayFor(id: string, fallbackValue: number): AwardOverlay {
  return (
    AWARD_OVERLAYS[id] ?? {
      signingCO: { name: "K. Mitchell", title: "Contracting Officer" },
      obligated: fallbackValue,
    }
  );
}

export const AWARDED_CONTRACTS: AwardedContract[] = SEEDS.map((s) => {
  const ov = overlayFor(s.id, s.awardValue);
  return {
    ...s,
    agencyAbbrev: s.agencyAbbrev ?? AGENCY_ABBREV[s.agency] ?? s.agency,
    teamingRelevanceScore: s.teamingRelevanceScore ?? 60,
    signingCO: ov.signingCO,
    obligated: ov.obligated,
    ceiling: ov.ceiling,
  };
});


export const TOTAL_AWARDED_IN_SPACE = 38;

export function getAwardedContract(id: string): AwardedContract | undefined {
  return AWARDED_CONTRACTS.find((c) => c.id === id);
}

const TREND_RANK: Record<SubTrend, number> = {
  growing: 0,
  steady: 1,
  "winding-down": 2,
  none: 3,
};

export function rankAwardedByTeamingRelevance(
  list: AwardedContract[],
): AwardedContract[] {
  return [...list].sort((a, b) => {
    const t = TREND_RANK[a.subHistory.trend] - TREND_RANK[b.subHistory.trend];
    if (t !== 0) return t;
    return b.teamingRelevanceScore - a.teamingRelevanceScore;
  });
}

// DEMO: Grant's read of an opportunity, as Ava needs it.
//
// Grant decides, Ava builds. Everything here is Grant's work: who can bid,
// what the member must hold, the warnings, and the real deadline. Ava shows it
// with Grant's name on it and never works it out again.
//
// The prototype read Grant's full analysis (lib/grant). The demo's Grant page
// is built by another agent from the same story, so Ava keeps a small private
// read of its own. Every call, one-line reason and warning comes from the
// story (src/demo/story): Grant's `oneLine`, and the hand-written brief where
// there is one. Only the compliance rows that Ava's bids point at are written
// here, and each states a fact that is true of the member in persona.ts.

import { dayFromNow } from "../../lib/ava/dates";
import { byMember } from "../member";
import { HERO_IDS } from "../members/agency/opportunities";
import { getGrantBrief } from "../story/grantBriefs";
import { getOpportunity } from "../story/opportunities";
import { PERSONA } from "../story/persona";
import { findOpportunity, type AvaOpportunity } from "./opportunity";
import { KNOCKOUT_FACT, PROOF_FACT, type GrantFacts } from "./grantFacts";

export type GrantRowStatus = "have" | "missing" | "confirm" | "unknown";

export interface GrantRow {
  /** The handle an Ava rule points at (HardRequirement.grantRow). */
  id: string;
  requirement: string;
  /** Where the buyer states it: "§1.2". */
  ref: string;
  requiredValue: string;
  /** What Grant found about the member. */
  firmValue: string;
  status: GrantRowStatus;
}

/** A question Grant asks, whose answer settles one row. */
interface GrantQuestion {
  id: string;
  rowId: string;
  /** An unmet answer is a hard bar: the buyer throws the bid out. */
  blocking: boolean;
  met: string;
  unmet: string;
}

export interface GrantSample {
  rows: GrantRow[];
  warnings: string[];
  deadline: {
    bondingLeadDays: number;
    ppqTurnaroundDays: number;
    subQuoteDays: number;
    writingDays: number;
  };
  questions: GrantQuestion[];
}

export interface GrantRead {
  call: "Bid" | "Review" | "No Bid";
  /** Grant's one-line reason. */
  gist: string;
  rows: GrantRow[];
  warnings: string[];
  deadline: GrantSample["deadline"];
  /** Rules the member told Ava they cannot meet. */
  cantMeet: string[];
}

const active = `Active until ${formatSamEnd()}`;

/** DEMO: the agency's hero bid (src/demo/members/agency). */
const AGENCY_HERO = HERO_IDS.hero;

function formatSamEnd(): string {
  const [y, m, d] = PERSONA.samActiveUntil.split("-").map(Number);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${d} ${months[m - 1]} ${y}`;
}

function row(
  id: string,
  requirement: string,
  ref: string,
  requiredValue: string,
  firmValue: string,
  status: GrantRowStatus,
): GrantRow {
  return { id, requirement, ref, requiredValue, firmValue, status };
}

function limits(oppId: string, fallback: string[]): string[] {
  return getGrantBrief(oppId)?.limits ?? fallback;
}

/** The compliance rows Ava's bids point at (`grantRow`), with Grant's result
 *  for Amira. Every value is a fact of the story. */
const SAMPLES: Record<string, GrantSample> = {
  // Camp Mackall field meals: a federal quote, set aside for woman-owned firms.
  "SP4701-26-Q-0021": {
    rows: [
      row(
        "gm-setaside",
        "Certified woman-owned small business when you quote",
        "§1.2",
        "WOSB",
        "Certified, as your profile says. No certificate on file.",
        "confirm",
      ),
      row(
        "gm-size",
        "Small under $47 million a year for industry code 722310",
        "§1.2",
        "Small",
        "Small, as your registration says",
        "have",
      ),
      row(
        "gm-foodhandler",
        "Food-handler certificate for every cook",
        "§3.2",
        "Every cook",
        `${PERSONA.foodHandlerCertified} of your ${PERSONA.employeesW2} cooks have one`,
        "missing",
      ),
      row(
        "gm-sam",
        "Active federal registration when you quote, and through award",
        "§5.2",
        "Active",
        active,
        "have",
      ),
    ],
    warnings: limits("SP4701-26-Q-0021", []),
    deadline: { bondingLeadDays: 0, ppqTurnaroundDays: 5, subQuoteDays: 0, writingDays: 3 },
    questions: [
      {
        id: "mk-wosb-cert",
        rowId: "gm-setaside",
        blocking: true,
        met: "Active. You told Grant.",
        unmet: "Not active",
      },
    ],
  },

  // Cumberland County detention meals: a sealed low bid with a bid deposit.
  "CUMCO-2026-014": {
    rows: [
      row(
        "gc-prebid",
        "Mandatory pre-bid conference for the county's bidders",
        "§2.2",
        "Attend",
        "Not answered yet",
        "confirm",
      ),
      row(
        "gc-deposit",
        "Bid bond or certified check, 5% of your total bid",
        "§3.2",
        "5% of the bid",
        `Bonded before, up to $${PERSONA.largestBond.toLocaleString("en-US")}. No bond letter on file for this bid.`,
        "confirm",
      ),
      row(
        "gc-handlers",
        "Food-handler certificate for every cook",
        "§4.5",
        "Every cook",
        `${PERSONA.foodHandlerCertified} of your ${PERSONA.employeesW2} cooks have one`,
        "missing",
      ),
      row(
        "gc-permit",
        "Food establishment permit for your kitchen",
        "§4.3",
        "Current permit",
        "Not on file",
        "confirm",
      ),
      row(
        "gc-insurance",
        "Insurance at award: $1M / $2M liability, $1M auto, workers' comp",
        "§8.1",
        "$1M / $2M",
        "Liability $1M a claim on file. The $2M total is not on file.",
        "confirm",
      ),
    ],
    warnings: limits("CUMCO-2026-014", []),
    deadline: { bondingLeadDays: 7, ppqTurnaroundDays: 3, subQuoteDays: 0, writingDays: 2 },
    questions: [
      {
        id: "cc-prebid",
        rowId: "gc-prebid",
        blocking: true,
        met: "Someone will attend. You told Grant.",
        unmet: "No one can attend",
      },
      {
        id: "cc-deposit",
        rowId: "gc-deposit",
        blocking: false,
        met: "You can. You told Grant.",
        unmet: "You cannot",
      },
    ],
  },

  // City of Fayetteville cafe and events: a written proposal, scored on points.
  "FAYNC-2026-R-08": {
    rows: [
      // The visit was a few days ago, so Grant asks whether she went.
      row(
        "gf-site",
        "Mandatory site visit for the city's bidders",
        "§1.3",
        "Attended",
        "Not answered yet",
        "confirm",
      ),
      row(
        "gf-vendor",
        "Registered in the city's vendor portal",
        "§1.4",
        "Registered",
        "Registered with the City of Fayetteville",
        "have",
      ),
      row(
        "gf-nc",
        "Organized to do business in North Carolina",
        "§7.1",
        "North Carolina",
        `North Carolina company, formed ${PERSONA.formedOn}`,
        "have",
      ),
      row(
        "gf-insurance",
        "Insurance: liability $1M / $2M, auto $1M, workers' comp",
        "§7.4",
        "$1M / $2M",
        "Liability $1M a claim on file. The $2M total is not on file.",
        "confirm",
      ),
    ],
    warnings: limits("FAYNC-2026-R-08", []),
    deadline: { bondingLeadDays: 0, ppqTurnaroundDays: 5, subQuoteDays: 0, writingDays: 5 },
    questions: [
      {
        id: "fy-site",
        rowId: "gf-site",
        blocking: true,
        met: "Someone attended. You told Grant.",
        unmet: "No one attended",
      },
    ],
  },

  // DEMO: the agency's hero, Family Advocacy print and digital ads: a federal
  // quote set aside for woman-owned firms. Rows follow Grant's hand-written
  // brief (members/agency/grantBriefs.ts, `compliance`), with Dana's facts.
  [AGENCY_HERO]: {
    rows: [
      row(
        "ga-setaside",
        "Certified woman-owned small business when you quote",
        "§1.2",
        "WOSB",
        "Certified in SBA's MySBA Certifications",
        "have",
      ),
      row(
        "ga-size",
        "Small under the size standard for industry code 541810",
        "§1.2",
        "Small",
        "Small, as your registration says",
        "have",
      ),
      row(
        "ga-sam",
        "Active federal registration when you quote, and through award",
        "§5.2",
        "Active",
        active,
        "have",
      ),
      row(
        "ga-app",
        "Ads on the contractor's own mobile app",
        "PWS 3.4",
        "Own app",
        "No app on file. Ask in Q&A whether a news partner's app counts",
        "missing",
      ),
      row(
        "ga-pm",
        "Named project manager and alternate",
        "PWS 4.1",
        "Named",
        "Not named yet. No résumés on file",
        "confirm",
      ),
      row(
        "ga-insurance",
        "General liability insurance before work starts",
        "§5.5",
        "$500,000",
        "General liability $1M per occurrence, on file",
        "have",
      ),
    ],
    warnings: limits(AGENCY_HERO, []),
    deadline: { bondingLeadDays: 0, ppqTurnaroundDays: 5, subQuoteDays: 0, writingDays: 3 },
    questions: [],
  },

  // Fort Bragg sources sought: a reply by email, not a bid.
  "W912EE-27-S-0004": {
    rows: [
      row(
        "gr-sam",
        "Active federal registration when you reply",
        "Notice",
        "Active",
        active,
        "have",
      ),
      row(
        "gr-naics",
        "Industry code 722310, Food Service Contractors",
        "Notice",
        "722310",
        `${PERSONA.primaryNaics} is your main code`,
        "have",
      ),
    ],
    warnings: [],
    deadline: { bondingLeadDays: 0, ppqTurnaroundDays: 0, subQuoteDays: 0, writingDays: 1 },
    questions: [],
  },
};

function genericRows(opp: AvaOpportunity): GrantRow[] {
  const rows: GrantRow[] = [];
  if (opp.scope === "fed") {
    rows.push(row("g-sam", "Active federal registration", "Notice", "Active", active, "have"));
  } else {
    rows.push(
      row(
        "g-state",
        "Organized to do business in North Carolina",
        "Notice",
        "North Carolina",
        `North Carolina company, formed ${PERSONA.formedOn}`,
        "have",
      ),
    );
  }
  rows.push(
    row(
      "g-naics",
      "Industry code",
      "Notice",
      // DEMO: the agency's bids span several codes, so its row names the notice's own.
      byMember({
        caterer: "Food service",
        agency: getOpportunity(opp.noticeId)?.naics ?? "Notice",
      }),
      `${PERSONA.primaryNaics} is your main code`,
      "have",
    ),
  );
  if (opp.setAside === "WOSB") {
    rows.push(
      row(
        "g-setaside",
        "Woman-owned small business set-aside",
        "Notice",
        "WOSB",
        "Certified WOSB",
        "have",
      ),
    );
  } else if (opp.setAside === "SBA") {
    rows.push(
      row(
        "g-setaside",
        "Small business set-aside",
        "Notice",
        "Small business",
        "Small business",
        "have",
      ),
    );
  }
  return rows;
}

/** The sample for an opportunity: written for Ava's bids, generic elsewhere. */
export function sampleFor(opp: AvaOpportunity): GrantSample {
  return (
    SAMPLES[opp.noticeId] ?? {
      rows: genericRows(opp),
      warnings: [],
      deadline: { bondingLeadDays: 0, ppqTurnaroundDays: 3, subQuoteDays: 0, writingDays: 3 },
      questions: [],
    }
  );
}

/** Grant's one-line reason: the hand-written gist when there is one. */
export function gistOf(opp: AvaOpportunity): string {
  return getGrantBrief(opp.noticeId)?.gist ?? opp.grantLine;
}

/** Grant's read with everything the member has told him laid on. */
export function grantRead(opp: AvaOpportunity, told: GrantFacts): GrantRead {
  const sample = sampleFor(opp);
  let call: GrantRead["call"] = opp.grantCall;
  let gist = gistOf(opp);
  const warnings = [...sample.warnings];

  let rows = sample.rows.map((r) => ({ ...r }));
  const setRow = (id: string, patch: Partial<GrantRow>) => {
    rows = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
  };

  // Answers to Grant's questions settle the rows they name. A "No" on a hard
  // bar ends the bid.
  for (const q of sample.questions) {
    const said = told[q.id];
    if (said === undefined) continue;
    if (said === "Yes") setRow(q.rowId, { status: "have", firmValue: q.met });
    else {
      setRow(q.rowId, { status: "missing", firmValue: q.unmet });
      if (q.blocking) call = "No Bid";
    }
  }

  // Proof the member gave Ava settles the row, as a profile fact would.
  for (const [id, proof] of Object.entries(told)) {
    if (!id.startsWith(PROOF_FACT)) continue;
    setRow(id.slice(PROOF_FACT.length), { status: "have", firmValue: proof });
  }

  // A pass-or-fail rule the member cannot meet ends the bid. The call stays
  // Grant's: Ava only passes the fact on.
  const cantMeet = Object.entries(told)
    .filter(([id]) => id.startsWith(KNOCKOUT_FACT))
    .map(([, rule]) => rule);
  if (cantMeet.length > 0) {
    call = "No Bid";
    gist =
      "You told Ava you cannot meet a pass-or-fail rule. The buyer throws out a bid that misses it.";
    warnings.unshift(...cantMeet.map((rule) => `You cannot meet: ${rule}`));
  } else if (call === "No Bid" && opp.grantCall !== "No Bid") {
    gist =
      "You told Grant you cannot meet a pass-or-fail rule. The buyer throws out a bid that misses it.";
  }

  return { call, gist, rows, warnings, deadline: sample.deadline, cantMeet };
}

// ─── The real deadline ───

export interface RealDeadlineView {
  realDeadline: Date;
  status: "ok" | "tight" | "blocked";
  deductions: { label: string; days: number }[];
}

/** Two weeks or less of real runway reads as tight. */
const TIGHT_RUNWAY_DAYS = 14;

/** The response due date minus the lead times a compliant bid needs. */
export function realDeadlineFor(opp: AvaOpportunity, d: GrantSample["deadline"]): RealDeadlineView {
  const deductions = [
    { label: "Bonding lead time", days: d.bondingLeadDays },
    { label: "Reference questionnaires", days: d.ppqTurnaroundDays },
    { label: "Sub quotes", days: d.subQuoteDays },
    { label: "Writing the proposal", days: d.writingDays },
  ].filter((x) => x.days > 0);
  const total = deductions.reduce((sum, x) => sum + x.days, 0);
  const noticeDays = opp.closesInDays;
  const runway = noticeDays - total;
  // A calendar day: UTC midnight of the local date, as every Ava date is.
  const realDeadline = dayFromNow(noticeDays - total);
  const status: RealDeadlineView["status"] =
    runway <= 0 ? "blocked" : runway <= TIGHT_RUNWAY_DAYS ? "tight" : "ok";
  return { realDeadline, status, deductions };
}

export function grantReadFor(noticeId: string, told: GrantFacts): GrantRead | null {
  const opp = findOpportunity(noticeId);
  return opp ? grantRead(opp, told) : null;
}

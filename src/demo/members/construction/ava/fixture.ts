// Ava fixture · HVAC and electrical upgrade, Building 2-4417, Fort Bragg (federal).
// DEMO: the contractor's hero bid (src/demo/members/construction).
//
// A USACE Invitation for Bids: a sealed bid on the SF 1442, set aside for
// HUBZone firms. The lowest responsive, responsible bid wins. No points and
// no scored writing; a short statement of the bidder's experience and key
// people lets the Corps decide the low bidder is responsible. A bid guarantee
// of 20% goes in with the bid; 100% performance and payment bonds follow award.
//
// THE STORY (demo-storyboard/construction-pack.md, sections 3, 7 and 8): two
// air-handling units, a 60-ton air-cooled chiller, new controls on the
// building's BACnet system, and an 800A switchboard in an occupied Special
// Operations training building. 240 days. Davis-Bacon wage decision NC20260122
// has no HVAC mechanic class, so piping is priced at the pipefitter rate until
// the Corps answers. Derrick Faircloth (Ninebark Builders) self-performs both
// trades. Every quotation below is the demo's own wording, inside a doc() call.
// The wage rates are sample values for this demo, not a real Department of
// Labor schedule. No section numbers from the federal rulebook are cited.
//
// THIS BID IS ALREADY IN PROGRESS (start.ts): three questions wait on him (the
// pack, section 8): his quality control manager and safety officer, the
// controls, and how the building stays cool during the switch.
//
// The member is always the contractor: this file reads his own records
// (../persona.ts), not the active member's, so the bid reads the same whichever
// story the demo opens on.

import { buyerPeople } from "../../../ava/contacts";
import { getGrantBrief } from "../../../story/grantBriefs";
import { getOpportunity } from "../../../story/opportunities";
import { PLACES } from "../../../story/places";
import type { PastPerformance } from "../../../story/persona";
import { doc, profile, sam, yourDoc } from "../../../../lib/ava/build";
import type { AskAnswer } from "../../../../lib/ava/store";
import type { AvaBid, Proof } from "../../../../lib/ava/types";
import { D, DM, ET_OFFSET, ISO, US } from "../../../../lib/ava/fixtures/when";
import { HERO_IDS } from "../opportunities";
import { PAST_PERFORMANCE, PERSONA } from "../persona";

// ─── The story's facts for this bid ───

export const HERO_NOTICE = HERO_IDS.hero;
const ID = HERO_NOTICE;

const STORY = getOpportunity(ID);
const BRIEF = getGrantBrief(ID);
if (!STORY || !BRIEF) throw new Error(`The story has no bid ${ID}`);

function briefDay(label: string): number {
  const d = BRIEF!.keyDates.find((k) => k.label === label);
  if (!d) throw new Error(`Grant's brief for ${ID} has no date "${label}"`);
  return d.inDays;
}

const DUE_DAYS = STORY.closesInDays;
const QUESTIONS_DAYS = briefDay("Questions due");
const VISIT_DAYS = briefDay("Site visit");
const POSTED = -STORY.postedDaysAgo;
/** The contracting officer the opportunity page names; the contract specialist beside her. */
const { primary: CO, second: SPEC } = buyerPeople(ID);
const MILES = PLACES[STORY.place].milesFromBase;
const DAYS_TO_FINISH = 240;
/** Crew weeks on site inside the 240 days: the rest is waiting on equipment. */
const WEEKS = 30;
const BID_GUARANTEE = 20;

// ─── His past jobs, from the story ───

function pastJob(id: PastPerformance["id"]): PastPerformance {
  const job = PAST_PERFORMANCE.find((p) => p.id === id);
  if (!job) throw new Error(`The contractor story has no past job ${id}`);
  return job;
}

const JOB_POPE = pastJob("pp-pope-office-hvac");
const JOB_SCHOOL = pastJob("pp-ccs-school-hvac");
const JOB_TALLOW = pastJob("pp-tallow-branch-medical");
const JOB_TURNROW = pastJob("pp-turnrow-barracks-electrical");

const SAM_UNTIL = longDate(PERSONA.samActiveUntil);

/** A date as the draft writes it: "1 March 2025". */
function longDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
const pastYear = (iso: string) => iso.slice(0, 4);
const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const SHORT_FILE = PERSONA.businessShortName.replace(/\s+/g, "_");
const BOND = PERSONA.bondLine!;

/** His Pope contract, the one federal prime on his record. */
const POPE_CONTRACT = "FA4452-25-C-0014";
const POPE_FILE = `Pope_Contract_${POPE_CONTRACT}.pdf`;

// ─── The people on this job (fictional) ───

const SUPER = "Leon Batts";
const SAFETY = "Andre Lowery";
const REF_POPE = {
  name: "Raymond Oxendine",
  title: "Contracting Officer's Representative, Pope Army Airfield",
};
const REF_SCHOOL = { name: JOB_SCHOOL.referenceName!, title: JOB_SCHOOL.referenceTitle! };
const REF_TALLOW = { name: JOB_TALLOW.referenceName!, title: JOB_TALLOW.referenceTitle! };

/** His references' phone and email: one each, whichever bid asks. */
export const REFERENCE_CONTACTS = {
  raymondOxendine: { phone: "(910) 555-0137", email: "raymond.oxendine@us.af.mil.example" },
  lornaBatchelor: { phone: "(910) 555-0164", email: "lorna.batchelor@ccs.k12.nc.us.example" },
  imaniRoyster: { phone: "(910) 555-0115", email: "iroyster@tallowbranchmedical.example" },
} as const;

// ─── The buyer's files ───

const IFB = "nb-f-ifb";
const SPECS = "nb-f-specs";
const DWG = "nb-f-dwg";
const SCHED = "nb-f-schedule";
const WD = "nb-f-wd";

const S_TYPE = doc(
  IFB,
  "SF 1442 and Section 00 21 00, page 1",
  "SF 1442",
  "This is an Invitation for Bids (IFB). Sealed bids in original and one copy are due at the time and place stated in Block 13.",
);
const S_SET_ASIDE = doc(
  IFB,
  "Section 00 21 00, paragraph 1.2, page 4",
  "00 21 00 ¶1.2",
  "This procurement is set aside 100% for HUBZone small business concerns. Only certified HUBZone small business concerns may submit bids.",
);
const S_SIZE = doc(
  IFB,
  "Section 00 21 00, paragraph 1.2, page 4",
  "00 21 00 ¶1.2",
  "The NAICS code is 238220, Plumbing, Heating, and Air-Conditioning Contractors. The bidder shall be small under the size standard for this code.",
);
const S_MAGNITUDE = doc(
  IFB,
  "Section 00 21 00, paragraph 1.3, page 4",
  "00 21 00 ¶1.3",
  "The magnitude of this project is between $500,000 and $1,000,000.",
);
const S_DUE = doc(
  IFB,
  "SF 1442, Block 13, page 1",
  "Block 13",
  `Sealed bids will be received until 2:00 PM local time on ${US(DUE_DAYS)}, and will be publicly opened at that time by teleconference.`,
);
const S_PIEE = doc(
  IFB,
  "Section 00 21 00, paragraph 1.5, page 5",
  "00 21 00 ¶1.5",
  "Bids shall be submitted electronically through the PIEE Solicitation Module. Bids sent by email or fax will not be accepted. Late bids will not be considered.",
);
const S_QUESTIONS = doc(
  IFB,
  "Section 00 21 00, paragraph 1.6, page 5",
  "00 21 00 ¶1.6",
  `Questions shall be submitted in writing to the Contract Specialist, ${SPEC.name}, at ${SPEC.email}, no later than 12:00 PM on ${US(QUESTIONS_DAYS)}. Answers will be issued by amendment.`,
);
const S_VISIT = doc(
  IFB,
  "Section 00 21 00, paragraph 1.7, page 5",
  "00 21 00 ¶1.7",
  `An organized site visit will be held at Building 2-4417 at 10:00 AM on ${US(VISIT_DAYS)}. Attendance is not mandatory, but bidders are urged to attend.`,
);
const S_ACCEPT = doc(
  IFB,
  "SF 1442, Block 13D, page 1",
  "Block 13D",
  "The bidder agrees that its bid will remain open for acceptance for 90 calendar days after the date set for receipt of bids.",
);
const S_AWARD = doc(
  IFB,
  "Section 00 21 00, paragraph 2.1, page 7",
  "00 21 00 ¶2.1",
  "Award will be made to the responsible bidder whose bid, conforming to the IFB, is the lowest total price for the Bid Schedule.",
);
const S_RESPONSIVE = doc(
  IFB,
  "Section 00 21 00, paragraph 2.2, page 7",
  "00 21 00 ¶2.2",
  "A bid that does not price every item on the Bid Schedule, is not signed, or is not accompanied by the required bid guarantee will be rejected as nonresponsive.",
);
const S_QUALS = doc(
  IFB,
  "Section 00 45 13, page 12",
  "00 45 13",
  "Each bidder shall submit with its bid a Statement of Bidder's Qualifications: three projects of similar scope completed in the past five years with a point of contact for each, and the names of the proposed Superintendent, Quality Control (QC) Manager and Site Safety and Health Officer (SSHO). The Government will use it to decide whether the low bidder is responsible.",
);
const S_REF_FORM = doc(
  IFB,
  "Section 00 45 13, Attachment A, page 14",
  "00 45 13 Att. A",
  "PROJECT EXPERIENCE FORM. Complete one form per project. Point of contact name, title, telephone number and email address are required.",
);
const S_GUARANTEE = doc(
  IFB,
  "Section 00 21 00, paragraph 3.1, page 8",
  "00 21 00 ¶3.1",
  "Each bid shall be accompanied by a bid guarantee of not less than 20 percent of the bid price, but not more than $3 million, on Standard Form 24, Bid Bond, by a surety on the Department of the Treasury's list of acceptable sureties.",
);
const S_GUARANTEE_NONE = doc(
  IFB,
  "Section 00 21 00, paragraph 3.1, page 8",
  "00 21 00 ¶3.1",
  "Failure to furnish a bid guarantee in the proper form and amount by the time set for opening of bids will require rejection of the bid.",
);
const S_FINAL_BONDS = doc(
  IFB,
  "Section 00 73 00, paragraph 1.1, page 31",
  "00 73 00 ¶1.1",
  "Within 10 days after award, the Contractor shall furnish a performance bond and a payment bond, each for 100 percent of the contract price.",
);
const S_SIGN = doc(
  IFB,
  "SF 1442, Blocks 14 to 20C, page 1",
  "SF 1442",
  "The bidder shall complete Blocks 14 through 20C of the SF 1442 and sign it. Acknowledge every amendment in Block 19.",
);
const S_REPS = doc(
  IFB,
  "Section 00 45 00, page 11",
  "00 45 00",
  "Bidders shall confirm that their representations and certifications in SAM are current, accurate and complete as of the date of the bid.",
);
const S_SAM = doc(
  IFB,
  "Section 00 72 00, paragraph 1.2, page 22",
  "00 72 00 ¶1.2",
  "The bidder shall be registered in SAM when it submits a bid, and shall continue to be registered until time of award, during performance, and through final payment.",
);
const S_LIMITS = doc(
  IFB,
  "Section 00 72 00, paragraph 1.4, page 23",
  "00 72 00 ¶1.4",
  "The Contractor will not pay more than 75 percent of the amount paid by the Government for contract performance, excluding the cost of materials, to subcontractors that are not similarly situated entities.",
);
const S_DAVIS = doc(
  IFB,
  "Section 00 72 00, paragraph 1.6, page 24",
  "00 72 00 ¶1.6",
  "All laborers and mechanics employed on the site shall be paid not less than the wage rates and fringe benefits in General Decision NC20260122, and the Contractor shall submit certified payrolls weekly.",
);
const S_PAY = doc(
  IFB,
  "Section 00 72 00, paragraph 1.8, page 25",
  "00 72 00 ¶1.8",
  "The Government will make progress payments monthly as the work proceeds, on estimates approved by the Contracting Officer, through Wide Area WorkFlow (WAWF).",
);
const S_LD = doc(
  IFB,
  "Section 00 72 00, paragraph 1.9, page 25",
  "00 72 00 ¶1.9",
  "If the Contractor fails to complete the work within the time specified, the Contractor shall pay liquidated damages of $480 for each calendar day of delay.",
);
const S_INSURANCE = doc(
  IFB,
  "Section 00 72 00, paragraph 1.10, page 26",
  "00 72 00 ¶1.10",
  "Before starting work, the Contractor shall have general liability insurance of at least $500,000 per occurrence, automobile liability, and workers' compensation as required by State law.",
);
const S_TAXES = doc(
  IFB,
  "Section 00 72 00, paragraph 1.11, page 26",
  "00 72 00 ¶1.11",
  "The contract price includes all applicable federal, state and local taxes and duties.",
);
const S_ACCESS = doc(
  IFB,
  "Section 00 72 00, paragraph 1.12, page 27",
  "00 72 00 ¶1.12",
  "Contractor personnel shall obtain installation access through the Fort Bragg Visitor Control Center, including a background check, before entering the installation.",
);

const S_SCOPE = doc(
  SPECS,
  "Section 01 11 00, paragraph 1.1, page 2",
  "01 11 00 ¶1.1",
  "The work consists of replacing two air-handling units and a 60-ton air-cooled chiller, providing new direct digital controls, and replacing the 400A electrical service with an 800A switchboard and panelboards at Building 2-4417, Fort Bragg, North Carolina.",
);
const S_TIME = doc(
  SPECS,
  "Section 01 11 00, paragraph 1.3, page 3",
  "01 11 00 ¶1.3",
  `The Contractor shall complete all work within ${DAYS_TO_FINISH} calendar days after receipt of the notice to proceed.`,
);
const S_OCCUPIED = doc(
  SPECS,
  "Section 01 14 00, paragraph 1.2, page 5",
  "01 14 00 ¶1.2",
  "The building will be occupied throughout the contract. Power and cooling outages shall be requested in writing 14 calendar days in advance and shall not exceed 8 hours each.",
);
const S_COOLING = doc(
  SPECS,
  "Section 01 14 00, paragraph 1.3, page 5",
  "01 14 00 ¶1.3",
  "From April through October, the Contractor shall maintain cooling to occupied spaces at all times, using temporary equipment if required.",
);
const S_CONTROLS = doc(
  SPECS,
  "Section 23 09 23, paragraph 1.2, page 188",
  "23 09 23 ¶1.2",
  "New controls shall be native BACnet and shall be integrated into the building's existing BACnet system and the installation's Utility Monitoring and Control System front end.",
);
const S_QC = doc(
  SPECS,
  "Section 01 45 00, paragraph 1.4, page 21",
  "01 45 00 ¶1.4",
  "The Contractor shall provide a QC Manager acceptable to the Contracting Officer. On contracts under $1,000,000, the Superintendent may also serve as the QC Manager. The Contractor shall perform three-phase control and submit daily QC reports.",
);
const S_SSHO = doc(
  SPECS,
  "Section 01 35 26, paragraph 1.5, page 15",
  "01 35 26 ¶1.5",
  "The Site Safety and Health Officer (SSHO) shall be a person other than the QC Manager and shall be on site whenever work is being performed, in accordance with EM 385-1-1.",
);
const S_LEAD = doc(
  SPECS,
  "Section 23 64 26, paragraph 1.6, page 241",
  "23 64 26 ¶1.6",
  "Submit the chiller manufacturer's confirmed delivery date with the first submittal.",
);

const S_SCHED_AHU = doc(
  SCHED,
  "Bid Schedule, item 0001",
  "Item 0001",
  "0001 REPLACE AIR-HANDLING UNITS AHU-1 AND AHU-2, COMPLETE. 1 JOB",
);
const S_SCHED_CHILLER = doc(
  SCHED,
  "Bid Schedule, item 0002",
  "Item 0002",
  "0002 REPLACE 60-TON AIR-COOLED CHILLER ON PAD, COMPLETE. 1 JOB",
);
const S_SCHED_CONTROLS = doc(
  SCHED,
  "Bid Schedule, item 0003",
  "Item 0003",
  "0003 DIRECT DIGITAL CONTROLS ON EXISTING BACNET SYSTEM, COMPLETE. 1 JOB",
);
const S_SCHED_SERVICE = doc(
  SCHED,
  "Bid Schedule, item 0004",
  "Item 0004",
  "0004 REPLACE 400A SERVICE WITH 800A SWITCHBOARD AND PANELBOARDS, COMPLETE. 1 JOB",
);
const S_SCHED_PHASING = doc(
  SCHED,
  "Bid Schedule, item 0005",
  "Item 0005",
  "0005 MOBILIZATION, PHASING AND OUTAGE COORDINATION IN AN OCCUPIED BUILDING. 1 JOB",
);
const S_SCHED = doc(
  SCHED,
  "Bid Schedule, page 1",
  "Bid Schedule",
  "Bidders shall enter a price for every item. The total of all items is the bid price used for evaluation.",
);

const S_WD_PIPE = doc(WD, "NC20260122, page 3", "WD PLUM", "PLUMBER/PIPEFITTER ......... $ 33.96  13.48");
const S_WD_SHEET = doc(WD, "NC20260122, page 4", "WD SHEE", "SHEET METAL WORKER (HVAC Duct Installation Only) ......... $ 19.67  13.27");
const S_WD_ELEC = doc(WD, "NC20260122, page 2", "WD ELEC", "ELECTRICIAN ......... $ 27.12  11.86");
const S_WD_LIST = doc(
  WD,
  "NC20260122, pages 2 to 5",
  "WD list",
  "Classifications listed: Carpenter, Electrician, Laborer: Common or General, Plumber/Pipefitter, Power Equipment Operator, Sheet Metal Worker (HVAC Duct Installation Only).",
);

// ─── His own record ───

const POPE_AT = "Your jobs list: Pope Army Airfield office building HVAC and electrical";
const SCHOOL_AT = "Your jobs list: Cumberland County elementary school HVAC";
const TALLOW_AT = "Your jobs list: Tallow Branch Medical Offices service and HVAC";

const P_SAM_HUBZONE: Proof = sam("Business types", "HUBZone small business concern, certified by the SBA");
const P_SAM_ADDRESS: Proof = sam("Physical address", PERSONA.physicalAddress);
const P_TRADES: Proof = profile("Your strengths", PERSONA.differentiators[0]);
const P_BADGES: Proof = profile("Your strengths", PERSONA.differentiators[2]);
const P_CREWS: Proof = profile("Your shop", PERSONA.kitchen ?? "");
const P_STAFF: Proof = profile("Your company size", `People on staff: ${PERSONA.employeesW2}`);

const P_POPE_SCOPE: Proof = yourDoc(POPE_FILE, "Statement of work, page 2", JOB_POPE.scopeDescription);
const P_POPE_TERMS: Proof = yourDoc(
  POPE_FILE,
  "Page 1, blocks 3 and 20",
  `Contract ${POPE_CONTRACT}. ${longDate(JOB_POPE.periodStart)} to ${longDate(JOB_POPE.periodEnd)}. Total ${money(JOB_POPE.totalValue)}.`,
);
const P_POPE_COR: Proof = yourDoc(
  POPE_FILE,
  "Page 3, contract administration",
  `Contracting Officer's Representative: ${REF_POPE.name}, ${REF_POPE.title}`,
);
const P_POPE_RATING: Proof = profile(POPE_AT, "Performance rating (CPARS): Very Good");

const P_SCHOOL_SCOPE: Proof = profile(SCHOOL_AT, JOB_SCHOOL.scopeDescription);
const P_SCHOOL_TERMS: Proof = profile(
  SCHOOL_AT,
  `${longDate(JOB_SCHOOL.periodStart)} to ${longDate(JOB_SCHOOL.periodEnd)}. Total value ${money(JOB_SCHOOL.totalValue)}.`,
);
const P_SCHOOL_REF: Proof = profile(SCHOOL_AT, `Reference: ${REF_SCHOOL.name}, ${REF_SCHOOL.title}.`);

const P_TALLOW_SCOPE: Proof = profile(TALLOW_AT, JOB_TALLOW.scopeDescription);
const P_TALLOW_TERMS: Proof = profile(
  TALLOW_AT,
  `${longDate(JOB_TALLOW.periodStart)} to ${longDate(JOB_TALLOW.periodEnd)}. Total value ${money(JOB_TALLOW.totalValue)}.`,
);
const P_TALLOW_REF: Proof = profile(TALLOW_AT, `Reference: ${REF_TALLOW.name}, ${REF_TALLOW.title}.`);

// ─── The staffing plan: the price pays for these hours ───

const PLAN = {
  pipefitter: { count: 2, hoursPerWeek: 40 },
  sheetMetal: { count: 2, hoursPerWeek: 20 },
  electrician: { count: 2, hoursPerWeek: 40 },
  superintendent: { count: 1, hoursPerWeek: 40 },
  safety: { count: 1, hoursPerWeek: 20 },
};
const PLAN_HOURS = Object.values(PLAN).reduce((n, r) => n + r.count * r.hoursPerWeek, 0);

/** Davis-Bacon floors: the base rate plus the fringe, paid as cash or benefits. */
const FLOOR = { pipefitter: 47.44, sheetMetal: 32.94, electrician: 38.98 };

// ─── The three questions that wait on him (the pack, section 8) ───

const QC_TEXT = {
  "qc-batts": `${SUPER}, the company's superintendent, is the QC Manager. ${SAFETY}, its safety coordinator, is the Site Safety and Health Officer, on site whenever work is under way`,
  "qc-one": `${SUPER}, the company's superintendent, is the QC Manager. The company will name a separate Site Safety and Health Officer before work starts`,
  "qc-hire":
    "The company will hire a QC Manager and a Site Safety and Health Officer after award, and will name both in writing within 10 days of award",
};
const CONTROLS_TEXT = {
  "ctl-inhouse":
    "The company's own controls technician adds the new units to the building's existing BACnet system and the installation's monitoring front end",
  "ctl-sub":
    "A controls subcontractor adds the new units to the building's existing BACnet system, under the company's direction",
  "ctl-ask":
    "The company asked the Corps in writing which front end the new controls join, and will build them as the Corps's answer directs",
};
const COOLING_TEXT = {
  "cool-rent":
    "A rented temporary chiller keeps the building cool while the old chiller comes out and the new one goes in",
  "cool-one":
    "One air handler keeps running while the other is replaced, so the building is never without air",
  "cool-winter":
    "The chiller is swapped between November and March, when the building needs no cooling, and each air handler is replaced in its own outage",
};

// ─── The bid ───

export const constructionBid: AvaBid = {
  noticeId: ID,
  officialTitle: STORY.title,
  buyer: STORY.agency,
  bidNumber: ID,
  kind: "bid-package",
  kindReason:
    "No points. The lowest complete bid wins: the bid schedule, the SF 1442, a bid bond and a short statement of your experience.",

  files: [
    {
      id: IFB,
      name: `${ID}_Solicitation_SF1442.pdf`,
      role: "main",
      pages: 96,
      postedDaysFromNow: POSTED,
      readability: "read",
    },
    {
      id: SPECS,
      name: "Specifications_Building_2-4417.pdf",
      role: "exhibit",
      pages: 412,
      postedDaysFromNow: POSTED,
      readability: "read",
    },
    {
      id: DWG,
      name: "Drawings_Building_2-4417.pdf",
      role: "drawing",
      pages: 38,
      postedDaysFromNow: POSTED,
      readability: "read",
    },
    {
      id: SCHED,
      name: "Section_00_10_00_Bid_Schedule.pdf",
      role: "price-form",
      pages: 2,
      postedDaysFromNow: POSTED,
      readability: "read",
    },
    {
      id: WD,
      name: "Wage_Decision_NC20260122.pdf",
      role: "exhibit",
      pages: 6,
      postedDaysFromNow: POSTED,
      readability: "read",
    },
  ],

  deadline: {
    dueDaysFromNow: DUE_DAYS,
    time: "2:00 PM",
    time24: "14:00",
    zone: "Eastern Time",
    utcOffset: ET_OFFSET(DUE_DAYS),
    source: S_DUE,
    questionsDueDaysFromNow: QUESTIONS_DAYS,
    questionsTime: "12:00 PM",
    questionsSource: S_QUESTIONS,
  },

  award: {
    method: "low-bid",
    source: S_AWARD,
    criteria: [
      {
        id: "nb-cr-price",
        name: "Lowest total for the bid schedule",
        points: null,
        kind: "price-formula",
        source: S_AWARD,
        treatment: "The lowest responsive bid wins. No points, no scored writing.",
      },
      {
        id: "nb-cr-responsive",
        name: "Responsive: every item priced, signed, with the bid bond",
        points: null,
        kind: "pass-fail",
        source: S_RESPONSIVE,
        treatment: "Pass or fail. A missing price, signature or bid bond gets the bid thrown out.",
      },
      {
        id: "nb-cr-responsible",
        name: "Responsible: experience and key people",
        points: null,
        kind: "pass-fail",
        source: S_QUALS,
        treatment: "Pass or fail. The Corps reads your statement before it awards to the low bidder.",
      },
    ],
    note: "No points. The lowest complete bid wins, so every form matters.",
  },

  hardRequirements: [
    {
      id: "nb-r-hubzone",
      grantRow: "gb-hubzone",
      group: "eligibility",
      label: "Certified HUBZone small business when you bid",
      source: S_SET_ASIDE,
      initial: "meets",
      evidence: "Your registration lists you as a certified HUBZone small business.",
    },
    {
      id: "nb-r-sam",
      grantRow: "gb-sam",
      group: "eligibility",
      label: "Active federal registration when you bid, and through award",
      source: S_SAM,
      initial: "meets",
      evidence: `Your registration is active until ${SAM_UNTIL}.`,
    },
    {
      id: "nb-r-size",
      grantRow: "gb-size",
      group: "eligibility",
      label: "Small under the size standard for HVAC contractors",
      source: S_SIZE,
      initial: "meets",
      evidence: "Your registration lists you as small for industry code 238220.",
    },
    {
      id: "nb-r-guarantee",
      group: "insurance",
      label: `Bid bond for ${BID_GUARANTEE}% of your bid, with the bid`,
      source: S_GUARANTEE,
      initial: "not-yet",
      askId: "nb-ask-bid-bond",
      evidenceAfter: "Your SF 24 bid bond, signed by your surety",
    },
    {
      id: "nb-r-bonds",
      grantRow: "gb-bonds",
      group: "insurance",
      neededAt: "award",
      label: "Performance and payment bonds, each 100% of the price, within 10 days of award",
      source: S_FINAL_BONDS,
      initial: "confirm",
      askId: "nb-ask-surety-ok",
      evidenceAfter: "Your surety's written OK for the final bonds",
    },
    {
      id: "nb-r-wages",
      grantRow: "gb-wages",
      group: "pricing",
      label: "Pay every worker on site at least the wage decision's rate and fringe",
      source: S_DAVIS,
      initial: "confirm",
      askId: "nb-ask-pay",
      afterAsk: "meets",
      evidenceAfter: "Your pay rates, checked against wage decision NC20260122",
    },
    {
      id: "nb-r-qc",
      grantRow: "gb-qc",
      group: "people",
      neededAt: "work-start",
      label: "A QC Manager and a separate Site Safety and Health Officer",
      source: S_SSHO,
      initial: "confirm",
      askId: "nb-ask-qc",
      evidenceAfter: "Your bid names your QC Manager and your safety officer",
    },
    {
      id: "nb-r-controls",
      group: "writing",
      neededAt: "work-start",
      label: "New controls on the building's existing BACnet system",
      source: S_CONTROLS,
      initial: "confirm",
      askId: "nb-ask-controls",
      evidenceAfter: "Your bid says who does the controls",
    },
    {
      id: "nb-r-cooling",
      group: "writing",
      neededAt: "work-start",
      label: "Cooling kept on from April through October, in an occupied building",
      source: S_COOLING,
      initial: "confirm",
      askId: "nb-ask-cooling",
      evidenceAfter: "Your bid says how the building stays cool during the switch",
    },
    {
      id: "nb-r-insurance",
      group: "insurance",
      neededAt: "work-start",
      label: "General liability insurance of at least $500,000, before work starts",
      source: S_INSURANCE,
      initial: "meets",
      evidence: "Your $1M general liability policy is on file.",
    },
  ],

  screen: [
    {
      topic: "vendor-registration",
      found: false,
      summary: "Federal bid. No state or local vendor registration asked for.",
    },
    {
      topic: "preferences",
      found: true,
      summary: "Only certified HUBZone small businesses may bid.",
      source: S_SET_ASIDE,
      requirementId: "nb-r-hubzone",
    },
    {
      topic: "bonds",
      found: true,
      summary: `A ${BID_GUARANTEE}% bid bond with the bid, then 100% performance and payment bonds within 10 days of award.`,
      source: S_GUARANTEE,
      requirementId: "nb-r-guarantee",
    },
    {
      topic: "insurance",
      found: true,
      summary: "Liability insurance before work starts. Your $1M policy is above the $500,000 minimum.",
      source: S_INSURANCE,
      requirementId: "nb-r-insurance",
    },
    {
      topic: "wages",
      found: true,
      summary: "Davis-Bacon rates and fringe from wage decision NC20260122, with certified payrolls each week.",
      source: S_DAVIS,
      requirementId: "nb-r-wages",
    },
    {
      topic: "tax",
      found: true,
      summary: "Your prices include every tax. The Corps pays no tax on top.",
      source: S_TAXES,
    },
    {
      topic: "notary-signature",
      found: true,
      summary: "No notary. You sign the SF 1442, and you and your surety sign the bid bond.",
      source: S_SIGN,
    },
    {
      topic: "pre-bid-meeting",
      found: true,
      summary: `A site visit at Building 2-4417 on ${DM(VISIT_DAYS)}, 10:00 AM. Not required, but worth going.`,
      source: S_VISIT,
    },
    {
      topic: "public-opening",
      found: true,
      summary: "Bids are opened and read aloud by teleconference. Your price becomes public.",
      source: S_DUE,
    },
    {
      topic: "references-licenses",
      found: true,
      summary: "Three similar jobs from the last five years, and your key people, in one short statement.",
      source: S_QUALS,
    },
    {
      topic: "participation-goals",
      found: false,
      summary: "No subcontracting goals in these files.",
    },
    {
      topic: "background-checks",
      found: true,
      summary: "Every worker gets installation access, with a background check, before coming on post.",
      source: S_ACCESS,
    },
    {
      topic: "portal-rules",
      found: true,
      summary: "Bids go in through the PIEE Solicitation Module. No email or fax bids.",
      source: S_PIEE,
    },
  ],

  commitments: [
    {
      id: "nb-c-time",
      text: `All work done within ${DAYS_TO_FINISH} days after the notice to proceed.`,
      source: S_TIME,
      pricedAs: `Priced as: ${WEEKS} weeks of crew time inside the ${DAYS_TO_FINISH} days.`,
      needsApproval: true,
    },
    {
      id: "nb-c-outages",
      text: "Every power and cooling outage asked for in writing 14 days ahead, and none longer than 8 hours.",
      source: S_OCCUPIED,
      pricedAs: "Priced as: the mobilization and phasing item on the bid schedule.",
      needsApproval: true,
    },
    {
      id: "nb-c-qc",
      text: "Three-phase quality control on every part of the work, with a QC report every day.",
      source: S_QC,
      pricedAs: "Priced as: your superintendent's hours.",
      needsApproval: true,
    },
    {
      id: "nb-c-safety",
      text: "A safety officer on site whenever work is under way.",
      source: S_SSHO,
      pricedAs: `Priced as: ${PLAN.safety.hoursPerWeek} hours a week for your safety officer.`,
      needsApproval: true,
    },
    {
      id: "nb-c-price",
      text: "One firm price for the whole job. It holds even if equipment prices rise.",
      source: S_SCHED,
      pricedAs: "Priced as: today's written quotes for the equipment.",
      needsApproval: false,
    },
  ],

  contractTerms: [
    { text: "One firm fixed price for the whole job, from the bid schedule.", source: S_SCHED },
    {
      text: `${DAYS_TO_FINISH} days to finish. Each late day costs $480.`,
      source: S_LD,
    },
    {
      text: "The Corps pays monthly for work in place. Carry about two months of equipment before the first payment.",
      source: S_PAY,
    },
    {
      text: "You bill through Wide Area WorkFlow, the government's online invoicing system.",
      source: S_PAY,
    },
    {
      text: "Firms that are not HUBZone firms may get no more than 75% of what the Corps pays you, not counting materials.",
      source: S_LIMITS,
    },
    {
      text: "Certified payrolls every week, at the wage decision's rates and fringe.",
      source: S_DAVIS,
    },
    { text: "Your bid stays open for 90 days after bids open.", source: S_ACCEPT },
    {
      text: "Get the chiller's delivery date in writing. It goes in with your first submittal.",
      source: S_LEAD,
    },
  ],

  mentor: { recommended: false, reasons: [] },

  knownFacts: [
    { label: "Legal name", value: PERSONA.businessName, from: "Your federal registration" },
    { label: "Unique entity ID", value: PERSONA.uei, from: "Your federal registration" },
    {
      label: "Commercial and Government Entity code",
      value: PERSONA.cage,
      from: "Your federal registration",
    },
    { label: "Address", value: PERSONA.physicalAddress, from: "Your federal registration" },
    {
      label: "HUBZone small business",
      value: "Certified by the SBA on 2 December 2023",
      from: "Your federal registration, and Grant's check",
    },
    {
      label: "Industry codes",
      value: [`${PERSONA.primaryNaics} ${PERSONA.primaryNaicsLabel}`, ...PERSONA.secondaryNaics.map((n) => `${n.code} ${n.label}`)].join(", "),
      from: "Your GovPreneurs profile",
    },
    { label: "People on staff", value: String(PERSONA.employeesW2), from: "Your GovPreneurs profile" },
    { label: "Shop and crews", value: PERSONA.kitchen ?? "", from: "Your GovPreneurs profile" },
    {
      label: "Bonding",
      value: `${money(BOND.single)} a job, ${money(BOND.aggregate)} in total, ${money(BOND.inUse)} in use now.`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Insurance on file",
      value: "General liability $1M per occurrence.",
      from: "Your GovPreneurs profile",
    },
    {
      label: JOB_POPE.projectTitle,
      value: `Main contractor, ${pastYear(JOB_POPE.periodStart)}, ${money(JOB_POPE.totalValue)}. CPARS Very Good.`,
      from: "Your contract file, and your jobs list",
    },
    {
      label: JOB_SCHOOL.projectTitle,
      value: `Main contractor, ${pastYear(JOB_SCHOOL.periodStart)}, ${money(JOB_SCHOOL.totalValue)}, bonded`,
      from: "Your GovPreneurs profile, jobs list",
    },
    {
      label: JOB_TALLOW.projectTitle,
      value: `Main contractor, ${pastYear(JOB_TALLOW.periodStart)}, ${money(JOB_TALLOW.totalValue)}`,
      from: "Your GovPreneurs profile, jobs list",
    },
    {
      label: JOB_TURNROW.projectTitle,
      value: `Subcontractor, ${pastYear(JOB_TURNROW.periodStart)}, ${money(JOB_TURNROW.totalValue)}. Not used here: the Corps asks for jobs you ran.`,
      from: "Your GovPreneurs profile, jobs list",
    },
  ],

  asks: [
    // ── The three questions that wait on him ──
    {
      id: "nb-ask-qc",
      kind: "answer",
      title: "Your QC Manager and safety officer",
      source: S_QUALS,
      why: "The Corps wants your QC Manager and a separate Site Safety and Health Officer named in your bid. Your profile names no one for this job.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      neededAt: "bid",
      group: "people",
      answer: {
        type: "answer",
        question: "Who is your QC Manager, and who is your site safety officer?",
        choices: [
          {
            id: "qc-batts",
            label: `${SUPER}, our superintendent, as QC Manager, plus a separate safety officer`,
            consequence: `Ava names ${SUPER} as QC Manager and ${SAFETY} as safety officer.`,
          },
          {
            id: "qc-one",
            label: "One person for both",
            consequence: "Ava checks the spec first.",
            gives: {
              status: "confirm",
              evidence: "A risk: the spec wants the safety officer to be a different person",
            },
            warn: `I checked the spec. Section 01 35 26 says the safety officer is a different person from the QC Manager. I named ${SUPER} as QC Manager and wrote that you name a safety officer before work starts.`,
          },
          {
            id: "qc-hire",
            label: "We hire them after award",
            consequence: "Ava writes that you name both within 10 days of award, and flags the risk.",
            gives: {
              status: "confirm",
              evidence: "A risk: you plan to hire after award, so your bid names no one yet",
            },
            warn: "That is a risk. The Corps must accept your QC Manager before work starts, and it reads your statement before it awards. I wrote that you name both within 10 days of award.",
          },
        ],
      },
      feeds: ["Draft · Key people", "Hard requirement · QC Manager and safety officer"],
    },
    {
      id: "nb-ask-controls",
      kind: "answer",
      title: "How you do the controls",
      source: S_CONTROLS,
      why: "The new controls must join the building's existing BACnet system. Only you know who does that work.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      neededAt: "bid",
      group: "writing",
      answer: {
        type: "answer",
        question: "How will you do the controls?",
        choices: [
          {
            id: "ctl-inhouse",
            label: "Our own controls tech, on the existing BACnet system",
            consequence: "Ava writes that your own technician does the controls.",
          },
          {
            id: "ctl-sub",
            label: "A controls subcontractor",
            consequence: "Ava writes that a controls company works under your direction.",
            warn: "Then get the controls company's written quote before bids open, and check it against your controls item. Its labor counts toward the 75% you may pay firms that are not HUBZone firms.",
          },
          {
            id: "ctl-ask",
            label: "Ask the Corps which system first",
            consequence: "Ava writes that you asked, and builds to the Corps's answer.",
            gives: {
              status: "confirm",
              evidence: `You are waiting for the Corps's answer. Questions close on ${D(QUESTIONS_DAYS)}`,
            },
            warn: `Then send your question to ${SPEC.name} before questions close on ${DM(QUESTIONS_DAYS)}. Every bidder sees the answer. Until it comes, your statement says you asked.`,
          },
        ],
      },
      feeds: ["Draft · Controls", "Hard requirement · Controls"],
    },
    {
      id: "nb-ask-cooling",
      kind: "answer",
      title: "How the building stays cool during the switch",
      source: S_COOLING,
      why: "The unit keeps using the building. From April through October it must stay cool, even while the chiller is out.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      neededAt: "bid",
      group: "writing",
      answer: {
        type: "answer",
        question: "How do you keep the building cool during the switch?",
        choices: [
          {
            id: "cool-rent",
            label: "Rent a temporary chiller",
            consequence: "Ava writes that a rented chiller carries the building.",
            warn: "A rented chiller is not in your price yet. Get the rental company's quote and add it to your equipment costs before bids open.",
          },
          {
            id: "cool-one",
            label: "One air handler at a time",
            consequence: "Ava writes that one air handler runs while the other is replaced.",
          },
          {
            id: "cool-winter",
            label: "Do the chiller outage November to March only",
            consequence: "Ava writes that the chiller is swapped when no cooling is needed.",
            warn: "Then the chiller must arrive by February. Get its delivery date in writing from your supplier.",
          },
        ],
      },
      feeds: ["Draft · Phasing", "Hard requirement · Cooling"],
    },

    // ── Answered before the story starts ──
    {
      id: "nb-ask-bid-bond",
      kind: "upload",
      title: `Bid bond, ${BID_GUARANTEE}% of your bid, on SF 24`,
      source: S_GUARANTEE,
      why: `The Corps throws out a bid without it. You are bonded to ${money(BOND.single)} a job, so a ${BID_GUARANTEE}% bond on this one is routine for your surety.`,
      owner: "surety",
      leadDays: 5,
      minutes: 20,
      answer: {
        type: "upload",
        accepts: `A signed SF 24 bid bond for ${BID_GUARANTEE}% of your bid, from a surety on the Treasury's list`,
        extracts: [
          { fieldId: "nb-fld-bid-bond-fee", label: "Bid bond fee", value: 250, unit: "usd", where: "Your surety's invoice" },
        ],
      },
      dontHave: [
        {
          id: "nb-dh-no-bond",
          label: "Your surety will not write the bid bond",
          detail: "The Corps rejects a bid without a bid guarantee. The bid goes back to a bid decision.",
          source: S_GUARANTEE_NONE,
          outcome: "bid-decision",
        },
      ],
      deliberate: true,
      feeds: ["Hard requirement · Bid bond", "Form · SF 24", "Price · Bid bond fee"],
    },
    {
      id: "nb-ask-surety-ok",
      kind: "upload",
      title: "Your surety's written OK for the final bonds",
      source: S_FINAL_BONDS,
      why: `This job puts you at about $3.6M of your ${money(BOND.aggregate)} bonding limit. Get your surety's OK in writing before you bid.`,
      owner: "surety",
      leadDays: 5,
      minutes: 15,
      neededAt: "bid",
      answer: {
        type: "upload",
        accepts: "A letter on your surety's letterhead, saying it will write both bonds if you win",
        extracts: [
          {
            fieldId: "nb-fld-final-bond-fee",
            label: "Performance and payment bond fee",
            value: 8_760,
            unit: "usd",
            where: "Your surety's letter, fee quote",
          },
        ],
      },
      dontHave: [
        {
          id: "nb-dh-no-room",
          label: "Your surety will not confirm the room",
          detail: "A bid you cannot bond is a bid you lose. The bid goes back to a bid decision.",
          source: S_FINAL_BONDS,
          outcome: "bid-decision",
        },
      ],
      deliberate: true,
      feeds: ["Hard requirement · Final bonds", "Price · Final bond fee"],
    },
    {
      id: "nb-ask-pay",
      kind: "enter",
      title: "What you pay each role, with fringe (5 roles)",
      source: S_WD_LIST,
      why: "The price starts from what you pay. Every worker on site must get at least the wage decision's rate plus fringe, or you owe back pay.",
      owner: "bookkeeper",
      leadDays: 2,
      minutes: 10,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "nb-fld-pay-pipe",
            label: "Pipefitter, per hour, with fringe",
            unit: "usd-hour",
            hint: "Pay plus the fringe you pay as cash or benefits. Refrigerant piping is priced at this rate until the Corps answers.",
            floor: { value: FLOOR.pipefitter, why: "Plumber/Pipefitter, $33.96 plus $13.48 fringe, in NC20260122." },
          },
          {
            id: "nb-fld-pay-sheet",
            label: "Sheet metal worker, per hour, with fringe",
            unit: "usd-hour",
            hint: "Pay plus the fringe you pay as cash or benefits.",
            floor: { value: FLOOR.sheetMetal, why: "Sheet Metal Worker, $19.67 plus $13.27 fringe, in NC20260122." },
          },
          {
            id: "nb-fld-pay-elec",
            label: "Electrician, per hour, with fringe",
            unit: "usd-hour",
            hint: "Pay plus the fringe you pay as cash or benefits.",
            floor: { value: FLOOR.electrician, why: "Electrician, $27.12 plus $11.86 fringe, in NC20260122." },
          },
          {
            id: "nb-fld-pay-super",
            label: "Superintendent and QC Manager, per hour",
            unit: "usd-hour",
            hint: "No wage floor: this role runs the job.",
          },
          {
            id: "nb-fld-pay-safety",
            label: "Safety officer, per hour",
            unit: "usd-hour",
            hint: "No wage floor: this role oversees the site.",
          },
        ],
      },
      feeds: [
        "Price · Pipefitters",
        "Price · Sheet metal workers",
        "Price · Electricians",
        "Price · Superintendent",
        "Price · Safety officer",
        "Hard requirement · Wage rates",
      ],
    },
    {
      id: "nb-ask-payroll",
      kind: "upload",
      title: "Your latest payroll report",
      source: S_DAVIS,
      why: "Ava reads your unemployment tax and workers' comp rates from it. Nothing is guessed.",
      owner: "bookkeeper",
      leadDays: 2,
      minutes: 10,
      answer: {
        type: "upload",
        accepts: "A payroll summary from your payroll service, for any recent month",
        extracts: [
          { fieldId: "nb-fld-suta", label: "Unemployment tax, state and federal", value: 1.2, unit: "percent", where: "Tax summary, page 2" },
          { fieldId: "nb-fld-wc", label: "Workers' comp premium", value: 5.8, unit: "percent", where: "Employer costs, page 3" },
        ],
      },
      feeds: ["Price · Unemployment tax", "Price · Workers' comp"],
    },
    {
      id: "nb-ask-equipment",
      kind: "enter",
      title: "Your equipment and material quotes",
      source: S_SCHED,
      why: "The chiller, the air handlers and the switchboard are most of the cost. Only your suppliers' written quotes can price them.",
      owner: "you",
      leadDays: 7,
      minutes: 20,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          { id: "nb-fld-ahu", label: "Two air-handling units, with ductwork and piping", unit: "usd", hint: "Your supplier's written quote, delivered." },
          { id: "nb-fld-chiller", label: "60-ton air-cooled chiller, with piping", unit: "usd", hint: "Your supplier's written quote, delivered, with its lead time." },
          { id: "nb-fld-controls", label: "Controls hardware and software", unit: "usd", hint: "Controllers, sensors and licenses for the new units." },
          { id: "nb-fld-switchboard", label: "800A switchboard, panelboards and feeders", unit: "usd", hint: "Your supplier's written quote, with its lead time." },
        ],
      },
      feeds: ["Price · Air handlers", "Price · Chiller", "Price · Controls", "Price · Electrical service"],
    },
    {
      id: "nb-ask-pl",
      kind: "upload",
      title: "Your 2025 profit and loss statement",
      source: S_SCHED,
      why: "Ava works out your overhead from it: the shop, trucks, insurance and office costs.",
      owner: "bookkeeper",
      leadDays: 3,
      minutes: 10,
      answer: {
        type: "upload",
        accepts: "Your 2025 profit and loss statement, from your bookkeeper",
        extracts: [
          { fieldId: "nb-fld-overhead", label: "Overhead, as a share of direct cost", value: 9, unit: "percent", where: "Operating expenses, page 1" },
        ],
      },
      feeds: ["Price · Overhead"],
    },
    {
      id: "nb-ask-contingency",
      kind: "enter",
      title: "Your contingency, for costs that run over",
      source: S_SCHED,
      why: "A reserve for costs that come in higher than planned, such as a late chiller. Ava never picks it.",
      owner: "you",
      leadDays: 0,
      minutes: 5,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "nb-fld-contingency",
            label: "Contingency, as a percent of cost",
            unit: "percent",
            hint: "Added to labor, equipment and overhead, before profit. Enter 0 if you want none.",
          },
        ],
      },
      feeds: ["Price · Contingency"],
    },
    {
      id: "nb-ask-profit",
      kind: "enter",
      title: "Your profit",
      source: S_SCHED,
      why: "Ava never picks your margin. The lowest bid wins, and the last two bids like this drew 9 and 11 offers.",
      owner: "you",
      leadDays: 1,
      minutes: 10,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [{ id: "nb-fld-profit", label: "Profit", unit: "percent", hint: "A share of your total cost." }],
      },
      feeds: ["Price · Profit"],
    },
    {
      id: "nb-ask-ref1",
      kind: "approve",
      title: "Pope office building HVAC and electrical as project 1",
      source: S_QUALS,
      why: "Same base, the same two trades, and a Very Good rating: the closest match to this job.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use your Pope job as project 1? ${REF_POPE.name}, named in your contract, is the contact.`,
        from: "Your contract file",
        value: `${JOB_POPE.projectTitle}. Contact: ${REF_POPE.name}`,
      },
      feeds: ["Experience · Project 1", "Form · Attachment A"],
    },
    {
      id: "nb-ask-ref2",
      kind: "approve",
      title: "Cumberland County school HVAC as project 2",
      source: S_QUALS,
      why: "A bonded HVAC replacement in an occupied building, finished early.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use your school HVAC job as project 2? ${REF_SCHOOL.name} is the contact.`,
        from: "Your GovPreneurs profile, jobs list",
        value: `${JOB_SCHOOL.projectTitle}. Contact: ${REF_SCHOOL.name}`,
      },
      feeds: ["Experience · Project 2", "Form · Attachment A"],
    },
    {
      id: "nb-ask-ref3",
      kind: "approve",
      title: "Tallow Branch service upgrade and HVAC as project 3",
      source: S_QUALS,
      why: "A new electrical service and HVAC, phased so every office stayed open.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use your Tallow Branch job as project 3? ${REF_TALLOW.name} is the contact.`,
        from: "Your GovPreneurs profile, jobs list",
        value: `${JOB_TALLOW.projectTitle}. Contact: ${REF_TALLOW.name}`,
        asOf: `The contact's title is from ${pastYear(JOB_TALLOW.periodStart)}. It may have changed.`,
      },
      feeds: ["Experience · Project 3", "Form · Attachment A"],
    },
    {
      id: "nb-ask-refcontacts",
      kind: "enter",
      title: "Current phone and email for your three contacts",
      source: S_REF_FORM,
      why: "The Corps may call them before award. A wrong number slows the award.",
      owner: "references",
      leadDays: 3,
      minutes: 10,
      answer: {
        type: "enter",
        fields: [
          { id: "nb-fld-ref1-phone", label: `${REF_POPE.name}, phone`, unit: "phone" },
          { id: "nb-fld-ref1-email", label: `${REF_POPE.name}, email`, unit: "email" },
          { id: "nb-fld-ref2-phone", label: `${REF_SCHOOL.name}, phone`, unit: "phone" },
          { id: "nb-fld-ref2-email", label: `${REF_SCHOOL.name}, email`, unit: "email" },
          { id: "nb-fld-ref3-phone", label: `${REF_TALLOW.name}, phone`, unit: "phone" },
          { id: "nb-fld-ref3-email", label: `${REF_TALLOW.name}, email`, unit: "email" },
        ],
      },
      feeds: ["Form · Attachment A"],
    },
  ],

  clarifications: [
    {
      id: "nb-clar-pipefitter",
      title: "The wage decision has no HVAC mechanic class",
      checked: "No amendment or specification section says which class sets refrigerant piping and HVAC equipment.",
      passages: [S_WD_LIST, S_WD_PIPE, S_WD_SHEET],
      question:
        "Wage decision NC20260122 lists no HVAC mechanic. Which classification applies to refrigerant piping and setting the air-handling units and the chiller: Plumber/Pipefitter or Sheet Metal Worker?",
      to: `${SPEC.name}, Contract Specialist, ${STORY.office}`,
      channel: "by email only, per Section 00 21 00, paragraph 1.6",
      kind: "simple-limit",
      meanwhile: "Ava prices the piping and the equipment setting at the pipefitter rate, the higher one.",
    },
  ],

  plan: [
    {
      id: "nb-p-schedule",
      source: S_SCHED,
      kind: "instruction",
      needs: "price",
      ifMissed: "A bid with an item left blank is thrown out.",
      answeredIn: { kind: "price", id: "price", label: "Bid schedule" },
      askId: "nb-ask-profit",
    },
    {
      id: "nb-p-wages",
      source: S_DAVIS,
      kind: "instruction",
      needs: "price",
      ifMissed: "You owe back pay if any rate is under its floor.",
      answeredIn: { kind: "price", id: "price", label: "Bid schedule" },
      askId: "nb-ask-pay",
    },
    {
      id: "nb-p-guarantee",
      source: S_GUARANTEE,
      kind: "form",
      needs: "attachment",
      ifMissed: "The Corps rejects a bid without a bid guarantee.",
      answeredIn: { kind: "form", id: "nb-fm-sf24", label: "SF 24 bid bond" },
      askId: "nb-ask-bid-bond",
    },
    {
      id: "nb-p-sf1442",
      source: S_SIGN,
      kind: "form",
      needs: "signature",
      ifMissed: "An unsigned bid is thrown out.",
      answeredIn: { kind: "form", id: "nb-fm-sf1442", label: "SF 1442, signed by you" },
    },
    {
      id: "nb-p-reps",
      source: S_REPS,
      kind: "form",
      needs: "signature",
      ifMissed: "The Corps cannot award to a company whose answers are out of date.",
      answeredIn: { kind: "form", id: "nb-fm-reps", label: "Representations and certifications" },
    },
    {
      id: "nb-p-quals",
      source: S_QUALS,
      kind: "instruction",
      needs: "writing",
      ifMissed: "The Corps cannot find you responsible, even with the lowest price.",
      answeredIn: { kind: "section", id: "nb-s-quals", label: "Statement of qualifications" },
      askId: "nb-ask-qc",
    },
    {
      id: "nb-p-refform",
      source: S_REF_FORM,
      kind: "form",
      needs: "attachment",
      ifMissed: "The Corps cannot reach your contacts before award.",
      answeredIn: { kind: "form", id: "nb-fm-refs", label: "Project experience forms, Attachment A" },
      askId: "nb-ask-refcontacts",
    },
    {
      id: "nb-p-portal",
      source: S_PIEE,
      kind: "logistics",
      needs: "action",
      ifMissed: "A bid sent by email or fax is not accepted.",
      answeredIn: { kind: "checklist", id: "nb-ck-upload", label: "Checklist: upload the bid" },
    },
    {
      id: "nb-p-due",
      source: S_DUE,
      kind: "logistics",
      needs: "action",
      ifMissed: "A late bid is not considered.",
      answeredIn: { kind: "checklist", id: "nb-ck-internal", label: "Checklist: internal deadline" },
    },
  ],

  themes: [],

  sections: [
    {
      id: "nb-s-quals",
      title: "Statement of bidder's qualifications",
      answers: S_QUALS,
      criterionId: "nb-cr-responsible",
      points: null,
      pageLimit: null,
      pages: 3,
      paragraphs: [
        // 0 · Who does the work, and where.
        [
          {
            text: `${PERSONA.businessName} will replace the air handlers, the chiller, the controls and the electrical service at Building 2-4417. `,
          },
          {
            text: "The company is a certified HUBZone small business",
            claim: { id: "nb-cl-hubzone", tag: "verified", proof: P_SAM_HUBZONE },
          },
          { text: ", based at " },
          {
            text: PERSONA.physicalAddress.replace(/, NC \d{5}$/, ""),
            claim: { id: "nb-cl-address", tag: "verified", proof: P_SAM_ADDRESS },
          },
          { text: `, ${MILES} miles from the building. ` },
          {
            text: "It does both trades with its own crews: electrical and HVAC",
            claim: { id: "nb-cl-trades", tag: "verified", proof: P_TRADES },
          },
          { text: ". " },
          {
            text: "Its crews already badge onto post",
            claim: { id: "nb-cl-badges", tag: "verified", proof: P_BADGES },
          },
          { text: "." },
        ],
        // 1 · Project 1: Pope.
        [
          { text: "Project 1: " },
          {
            text: `${JOB_POPE.projectTitle}, contract ${POPE_CONTRACT}, ${longDate(JOB_POPE.periodStart)} to ${longDate(JOB_POPE.periodEnd)}, ${money(JOB_POPE.totalValue)}`,
            claim: { id: "nb-cl-p1-terms", tag: "verified", proof: P_POPE_TERMS },
          },
          { text: ". " },
          {
            text: "The company replaced six heat pumps, moved two old panels to a new 400A panel and tied the units into the building's controls",
            claim: { id: "nb-cl-p1-scope", tag: "verified", proof: P_POPE_SCOPE },
          },
          { text: ". " },
          {
            text: "Its performance rating (CPARS) is Very Good",
            claim: { id: "nb-cl-p1-rating", tag: "verified", proof: P_POPE_RATING },
          },
          { text: ". Contact: " },
          {
            text: `${REF_POPE.name}, ${REF_POPE.title}`,
            claim: { id: "nb-cl-p1-contact", tag: "verified", proof: P_POPE_COR },
          },
          { text: "." },
        ],
        // 2 · Projects 2 and 3.
        [
          { text: "Project 2: " },
          {
            text: `${JOB_SCHOOL.projectTitle}, ${longDate(JOB_SCHOOL.periodStart)} to ${longDate(JOB_SCHOOL.periodEnd)}, ${money(JOB_SCHOOL.totalValue)}`,
            claim: { id: "nb-cl-p2-terms", tag: "verified", proof: P_SCHOOL_TERMS },
          },
          { text: ". " },
          {
            text: "The company replaced the split systems and two boilers in an occupied school, bonded, and finished 4 days early",
            claim: { id: "nb-cl-p2-scope", tag: "verified", proof: P_SCHOOL_SCOPE },
          },
          { text: ". Contact: " },
          {
            text: `${REF_SCHOOL.name}, ${REF_SCHOOL.title}`,
            claim: { id: "nb-cl-p2-contact", tag: "verified", proof: P_SCHOOL_REF },
          },
          { text: ". Project 3: " },
          {
            text: `${JOB_TALLOW.projectTitle}, ${longDate(JOB_TALLOW.periodStart)} to ${longDate(JOB_TALLOW.periodEnd)}, ${money(JOB_TALLOW.totalValue)}`,
            claim: { id: "nb-cl-p3-terms", tag: "verified", proof: P_TALLOW_TERMS },
          },
          { text: ". " },
          {
            text: "A new electrical service and HVAC for three medical buildings, phased so every practice stayed open",
            claim: { id: "nb-cl-p3-scope", tag: "verified", proof: P_TALLOW_SCOPE },
          },
          { text: ". Contact: " },
          {
            text: `${REF_TALLOW.name}, ${REF_TALLOW.title}`,
            claim: { id: "nb-cl-p3-contact", tag: "verified", proof: P_TALLOW_REF },
          },
          { text: "." },
        ],
        // 3 · Key people.
        [
          {
            text: "The QC Manager and the safety officer are named here",
            claim: {
              id: "nb-cl-qc",
              tag: "unsupported",
              askId: "nb-ask-qc",
              gap: "[NEEDED: your QC Manager and safety officer]",
              resolvedText: QC_TEXT["qc-batts"],
              resolvedByChoice: QC_TEXT,
            },
          },
          { text: ". " },
          {
            text: "Every part of the work gets the Corps's three-phase quality control, with a QC report each day",
            claim: { id: "nb-cl-qc-daily", tag: "commitment", commitmentId: "nb-c-qc" },
          },
          { text: ". " },
          {
            text: "A safety officer is on site whenever work is under way",
            claim: { id: "nb-cl-safety", tag: "commitment", commitmentId: "nb-c-safety" },
          },
          { text: "." },
        ],
        // 4 · Controls and phasing.
        [
          {
            text: "The new controls join the building's BACnet system",
            claim: {
              id: "nb-cl-controls",
              tag: "unsupported",
              askId: "nb-ask-controls",
              gap: "[NEEDED: how you do the controls]",
              resolvedText: CONTROLS_TEXT["ctl-inhouse"],
              resolvedByChoice: CONTROLS_TEXT,
            },
          },
          { text: ". " },
          {
            text: "The building stays cool during the switch",
            claim: {
              id: "nb-cl-cooling",
              tag: "unsupported",
              askId: "nb-ask-cooling",
              gap: "[NEEDED: how the building stays cool]",
              resolvedText: COOLING_TEXT["cool-winter"],
              resolvedByChoice: COOLING_TEXT,
            },
          },
          { text: ". " },
          {
            text: "Every power and cooling outage is asked for in writing 14 days ahead, and none runs longer than 8 hours",
            claim: { id: "nb-cl-outages", tag: "commitment", commitmentId: "nb-c-outages" },
          },
          { text: ". The unit keeps using the building throughout." },
        ],
        // 5 · The crews: the one staffing plan the price uses.
        [
          {
            text: `The company has ${PERSONA.employeesW2} people on staff`,
            claim: { id: "nb-cl-staff", tag: "verified", proof: P_STAFF },
          },
          { text: ". " },
          {
            text: "It runs two electrical crews and two HVAC crews from its shop on Grove St",
            claim: { id: "nb-cl-crews", tag: "verified", proof: P_CREWS },
          },
          {
            text: `. This job uses ${PLAN_HOURS} paid hours a week on site: two pipefitters, two sheet metal workers, two electricians, the superintendent and the safety officer. `,
          },
          {
            text: `All work is done within ${DAYS_TO_FINISH} days after the notice to proceed`,
            claim: { id: "nb-cl-time", tag: "commitment", commitmentId: "nb-c-time" },
          },
          { text: "." },
        ],
      ],
      decisions: [
        {
          id: "nb-dec-unit",
          paragraphIndex: 4,
          choice: "The unit keeps using the building throughout.",
          other: "The unit keeps using the building throughout, and gets a two-week look-ahead of the work each Friday.",
        },
      ],
      challenges: [],
    },
  ],

  price: {
    sheetName: "Section 00 10 00, the Corps's bid schedule",
    sheetFileId: SCHED,
    contractType: "One firm fixed price for the whole job, item by item on the bid schedule.",
    contractTypeSource: S_SCHED,
    weeks: WEEKS,
    roles: [
      {
        id: "nb-role-pipe",
        name: "Pipefitters",
        ...PLAN.pipefitter,
        pay: { askId: "nb-ask-pay", fieldId: "nb-fld-pay-pipe" },
        wageFloor: { perHour: FLOOR.pipefitter, source: S_WD_PIPE },
      },
      {
        id: "nb-role-sheet",
        name: "Sheet metal workers",
        ...PLAN.sheetMetal,
        pay: { askId: "nb-ask-pay", fieldId: "nb-fld-pay-sheet" },
        wageFloor: { perHour: FLOOR.sheetMetal, source: S_WD_SHEET },
      },
      {
        id: "nb-role-elec",
        name: "Electricians",
        ...PLAN.electrician,
        pay: { askId: "nb-ask-pay", fieldId: "nb-fld-pay-elec" },
        wageFloor: { perHour: FLOOR.electrician, source: S_WD_ELEC },
      },
      {
        id: "nb-role-super",
        name: "Superintendent and QC Manager",
        ...PLAN.superintendent,
        pay: { askId: "nb-ask-pay", fieldId: "nb-fld-pay-super" },
      },
      {
        id: "nb-role-safety",
        name: "Safety officer",
        ...PLAN.safety,
        pay: { askId: "nb-ask-pay", fieldId: "nb-fld-pay-safety" },
      },
    ],
    burden: [
      {
        id: "nb-b-fica",
        label: "Social Security and Medicare",
        from: { kind: "law", rate: 7.65, text: "The employer share set by federal law." },
      },
      {
        id: "nb-b-suta",
        label: "Unemployment tax",
        from: { kind: "ask", askId: "nb-ask-payroll", fieldId: "nb-fld-suta", text: "From your payroll report." },
      },
      {
        id: "nb-b-wc",
        label: "Workers' comp",
        from: { kind: "ask", askId: "nb-ask-payroll", fieldId: "nb-fld-wc", text: "From your payroll report." },
      },
    ],
    lines: [
      {
        id: "nb-l-ahu",
        item: "Replace air-handling units AHU-1 and AHU-2, complete",
        unit: "per job",
        qty: 1,
        qtySource: S_SCHED_AHU,
        laborShare: 0.22,
        direct: { askId: "nb-ask-equipment", fieldId: "nb-fld-ahu", label: "Air handlers" },
      },
      {
        id: "nb-l-chiller",
        item: "Replace 60-ton air-cooled chiller on pad, complete",
        unit: "per job",
        qty: 1,
        qtySource: S_SCHED_CHILLER,
        laborShare: 0.18,
        direct: { askId: "nb-ask-equipment", fieldId: "nb-fld-chiller", label: "Chiller" },
      },
      {
        id: "nb-l-controls",
        item: "Direct digital controls on the existing BACnet system, complete",
        unit: "per job",
        qty: 1,
        qtySource: S_SCHED_CONTROLS,
        laborShare: 0.1,
        direct: { askId: "nb-ask-equipment", fieldId: "nb-fld-controls", label: "Controls" },
      },
      {
        id: "nb-l-service",
        item: "Replace 400A service with 800A switchboard and panelboards, complete",
        unit: "per job",
        qty: 1,
        qtySource: S_SCHED_SERVICE,
        laborShare: 0.4,
        direct: { askId: "nb-ask-equipment", fieldId: "nb-fld-switchboard", label: "Switchboard" },
      },
      {
        id: "nb-l-phasing",
        item: "Mobilization, phasing and outage coordination in an occupied building",
        unit: "per job",
        qty: 1,
        qtySource: S_SCHED_PHASING,
        laborShare: 0.1,
      },
    ],
    overhead: {
      askId: "nb-ask-pl",
      fieldId: "nb-fld-overhead",
      text: "From your 2025 profit and loss statement, as a share of direct cost.",
    },
    profit: { askId: "nb-ask-profit", fieldId: "nb-fld-profit" },
    contingency: { askId: "nb-ask-contingency", fieldId: "nb-fld-contingency" },
    otherCosts: [
      {
        id: "nb-cost-bid-bond",
        label: "Bid bond fee",
        yearly: { kind: "ask", askId: "nb-ask-bid-bond", fieldId: "nb-fld-bid-bond-fee", text: "Your surety's invoice" },
        inPrice: true,
      },
      {
        id: "nb-cost-final-bonds",
        label: "Performance and payment bond fee",
        yearly: { kind: "ask", askId: "nb-ask-surety-ok", fieldId: "nb-fld-final-bond-fee", text: "Your surety's letter" },
        inPrice: true,
      },
    ],
    payment: {
      text: "Paid monthly for work in place. You buy the chiller and the switchboard about two months before the first payment.",
      source: S_PAY,
    },
  },

  forms: [
    {
      id: "nb-fm-sf1442",
      name: "SF 1442, Solicitation, Offer and Award (Construction, Alteration, or Repair)",
      source: S_SIGN,
      handling: ["ava-fills", "you-sign"],
      signer: "You, as the owner",
      filledFrom: "Your registration details and your bid schedule",
    },
    {
      id: "nb-fm-sf24",
      name: `SF 24, Bid Bond, ${BID_GUARANTEE}% of the bid price`,
      source: S_GUARANTEE,
      handling: ["someone-else", "you-sign"],
      signer: "You sign as the bidder, beside your surety",
      providedBy: "Your surety",
      askId: "nb-ask-bid-bond",
    },
    {
      id: "nb-fm-reps",
      name: "Representations and certifications, confirmed current in your registration",
      source: S_REPS,
      handling: ["you-sign"],
      signer: "You, as the owner",
    },
    {
      id: "nb-fm-refs",
      name: "Attachment A, one project experience form for each of your three jobs",
      source: S_REF_FORM,
      handling: ["ava-fills"],
      filledFrom: "Your three approved jobs and the contact details you enter",
    },
  ],

  submission: {
    method: "portal",
    where: "The PIEE Solicitation Module",
    account: "Your PIEE account, with the Proposal Manager role",
    source: S_PIEE,
    limits: "PDF files, uploaded before 2:00 PM Eastern Time",
    files: [
      {
        id: "nb-pk-bid",
        name: `SF1442_and_Bid_Schedule_${SHORT_FILE}.pdf`,
        covers: "SF 1442 and Section 00 10 00",
        contains: [
          { kind: "form", id: "nb-fm-sf1442" },
          { kind: "price", id: "price" },
          { kind: "form", id: "nb-fm-reps" },
        ],
      },
      {
        id: "nb-pk-bond",
        name: `Bid_Bond_SF24_${SHORT_FILE}.pdf`,
        covers: "Section 00 21 00, paragraph 3.1",
        contains: [
          { kind: "form", id: "nb-fm-sf24" },
          { kind: "upload", id: "nb-ask-bid-bond" },
        ],
      },
      {
        id: "nb-pk-quals",
        name: `Bidder_Qualifications_${SHORT_FILE}.pdf`,
        covers: "Section 00 45 13 and Attachment A",
        contains: [
          { kind: "section", id: "nb-s-quals" },
          { kind: "form", id: "nb-fm-refs" },
        ],
      },
    ],
    markings: [
      `Name each file with the solicitation number, ${ID}, and your company name.`,
      "Acknowledge every amendment in Block 19 of the SF 1442 before you upload.",
    ],
    checklist: [
      {
        id: "nb-ck-internal",
        label: `Internal deadline: ${D(DUE_DAYS - 1)}, 2:00 PM Eastern Time, one day early`,
        auto: true,
      },
      { id: "nb-ck-visit", label: `Go to the site visit at Building 2-4417, ${DM(VISIT_DAYS)}, 10:00 AM` },
      { id: "nb-ck-quotes", label: "Get the chiller and switchboard quotes in writing, with lead times" },
      { id: "nb-ck-sam", label: "Check your federal registration is active and your answers are current" },
      { id: "nb-ck-sign", label: "Sign the SF 1442, and sign the bid bond beside your surety" },
      { id: "nb-ck-upload", label: "Upload the 3 files to the PIEE Solicitation Module before 2:00 PM Eastern Time" },
      { id: "nb-ck-receipt", label: "Save the PIEE confirmation as your receipt and upload it here" },
    ],
    certifying: [
      "You are a certified HUBZone small business, and your registration says so.",
      "You are small under the size standard for HVAC contractors.",
      "You will pay every worker on site at least the wage decision's rate and fringe, and send certified payrolls each week.",
      "Your registration answers are current and true on the day you sign.",
      "Your bid stays open for 90 days after bids open.",
      "You will pay firms that are not HUBZone firms no more than 75% of what the Corps pays you, not counting materials.",
      "The three jobs in your statement happened as described, with those values and dates.",
      "You can furnish performance and payment bonds within 10 days of award.",
    ],
  },

  reviewerFindings: [],

  addenda: [],

  bidSecurity: {
    percent: BID_GUARANTEE,
    source: S_GUARANTEE,
    bondAskId: "nb-ask-bid-bond",
  },

  overview: {
    noticeType: {
      text: "Invitation for Bids, a sealed bid on the SF 1442. The lowest complete bid wins.",
      source: S_TYPE,
    },
    summary: {
      text: "Replace two air handlers, a 60-ton chiller and the controls, and upgrade the electrical service to 800A, in a training building that stays in use.",
      source: S_SCOPE,
    },
    work: [
      { text: "Two new air-handling units.", source: S_SCHED_AHU },
      { text: "A new 60-ton air-cooled chiller on the existing pad.", source: S_SCHED_CHILLER },
      { text: "New controls on the building's BACnet system.", source: S_CONTROLS },
      { text: "An 800A switchboard and panels in place of the 400A service.", source: S_SCHED_SERVICE },
      { text: "Outages booked 14 days ahead, each under 8 hours.", source: S_OCCUPIED },
    ],
    place: { text: "Building 2-4417, Fort Bragg, North Carolina.", source: S_SCOPE },
    hours: null,
    staffing: {
      text: "A superintendent, a QC Manager and a separate site safety officer.",
      source: S_QUALS,
    },
    serviceLevels: {
      text: "Cooling kept on from April through October. No outage longer than 8 hours.",
      source: S_COOLING,
    },
    outOfScope: null,
    term: { text: `${DAYS_TO_FINISH} days after the notice to proceed.`, source: S_TIME },
    estimatedValue: { text: "Between $500,000 and $1,000,000.", source: S_MAGNITUDE },
    penalties: { text: "$480 for each day past the finish date.", source: S_LD },
    contact: {
      name: CO.name,
      role: `Contracting officer, ${STORY.office}`,
      email: CO.email,
      source: S_QUESTIONS,
    },
    questionsChannel: {
      text: `In writing, by email to ${SPEC.name}, the contract specialist, by ${D(QUESTIONS_DAYS)} at 12:00 PM. Answers come by amendment.`,
      source: S_QUESTIONS,
    },
    noContact: null,
    buyerPortal: {
      text: "SAM.gov posts the bid and its amendments. Bids go in through PIEE.",
      source: S_PIEE,
    },
    dates: [
      {
        id: "nb-visit",
        label: "Site visit at Building 2-4417",
        daysFromNow: VISIT_DAYS,
        time: "10:00 AM",
        source: S_VISIT,
      },
      {
        id: "nb-opening",
        label: "Public bid opening, by teleconference",
        daysFromNow: DUE_DAYS,
        time: "2:00 PM",
        source: S_DUE,
      },
    ],
    expectedAward: null,
    start: { text: "Work starts with the notice to proceed, after the bonds are in.", source: S_FINAL_BONDS },
    validity: { text: "Your bid stays open for 90 days after bids open.", source: S_ACCEPT },
    setAside: { text: "Only certified HUBZone small businesses.", source: S_SET_ASIDE },
    size: {
      text: "Industry code 238220, HVAC contractors. Your registration lists you as small.",
      source: S_SIZE,
    },
    lateRule: { text: "Late bids are not considered. No email or fax bids.", source: S_PIEE },
    subcontracting: {
      text: "Firms that are not HUBZone firms can get at most 75% of what the Corps pays you, not counting materials.",
      source: S_LIMITS,
    },
  },

  samLegalName: PERSONA.businessName,
  nameInDraft: PERSONA.businessName,
};

// ─── What he told Ava ───
// The start (start.ts) and the presenter's jump (play.ts) both read these.
// The three questions carry his answers too: the jump plays them; the start
// leaves them open.

const AT = (minute: number) => ISO(-1, 15, minute);

export const constructionAnswers: Record<string, AskAnswer> = {
  "nb-ask-bid-bond": { status: "done", at: AT(2), fileName: `${SHORT_FILE}_SF24_Bid_Bond.pdf`, values: { "nb-fld-bid-bond-fee": 250 } },
  "nb-ask-surety-ok": {
    status: "done",
    at: AT(4),
    fileName: `${SHORT_FILE}_Surety_Letter.pdf`,
    values: { "nb-fld-final-bond-fee": 8_760 },
  },
  "nb-ask-pay": {
    status: "done",
    at: AT(8),
    values: {
      "nb-fld-pay-pipe": 49,
      "nb-fld-pay-sheet": 34.5,
      "nb-fld-pay-elec": 40,
      "nb-fld-pay-super": 46,
      "nb-fld-pay-safety": 36,
    },
  },
  "nb-ask-payroll": {
    status: "done",
    at: AT(12),
    fileName: `${SHORT_FILE}_Payroll_Summary.pdf`,
    values: { "nb-fld-suta": 1.2, "nb-fld-wc": 5.8 },
  },
  "nb-ask-equipment": {
    status: "done",
    at: AT(20),
    values: {
      "nb-fld-ahu": 72_000,
      "nb-fld-chiller": 98_000,
      "nb-fld-controls": 16_500,
      "nb-fld-switchboard": 46_500,
    },
  },
  "nb-ask-pl": {
    status: "done",
    at: AT(24),
    fileName: `${SHORT_FILE}_Profit_and_Loss_2025.pdf`,
    values: { "nb-fld-overhead": 9 },
  },
  "nb-ask-contingency": { status: "done", at: AT(26), values: { "nb-fld-contingency": 3 } },
  "nb-ask-profit": { status: "done", at: AT(30), values: { "nb-fld-profit": 6 } },
  "nb-ask-ref1": { status: "done", at: AT(34) },
  "nb-ask-ref2": { status: "done", at: AT(35) },
  "nb-ask-ref3": { status: "done", at: AT(36) },
  "nb-ask-refcontacts": {
    status: "done",
    at: AT(40),
    values: {
      "nb-fld-ref1-phone": REFERENCE_CONTACTS.raymondOxendine.phone,
      "nb-fld-ref1-email": REFERENCE_CONTACTS.raymondOxendine.email,
      "nb-fld-ref2-phone": REFERENCE_CONTACTS.lornaBatchelor.phone,
      "nb-fld-ref2-email": REFERENCE_CONTACTS.lornaBatchelor.email,
      "nb-fld-ref3-phone": REFERENCE_CONTACTS.imaniRoyster.phone,
      "nb-fld-ref3-email": REFERENCE_CONTACTS.imaniRoyster.email,
    },
  },
  // The three questions. His answers when he gives them: Leon as QC Manager
  // with a separate safety officer, his own controls tech, and the chiller
  // swapped in winter.
  "nb-ask-qc": { status: "done", at: AT(50), choiceId: "qc-batts" },
  "nb-ask-controls": { status: "done", at: AT(51), choiceId: "ctl-inhouse" },
  "nb-ask-cooling": { status: "done", at: AT(52), choiceId: "cool-winter" },
};

/** The three questions the story says wait on him, in Ava's order. */
export const HERO_OPEN = ["ask:nb-ask-qc", "ask:nb-ask-controls", "ask:nb-ask-cooling"];

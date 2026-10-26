// Ava fixture · Exterior washing for Fort Bragg's Public Works (federal).
// DEMO: the janitorial firm's hero bid (src/demo/members/janitorial).
//
// An Army Request for Quote: a combined synopsis and solicitation for
// commercial services on the SF 1449, set aside for HUBZone small businesses.
// Lowest price technically acceptable: the capability write-up and the
// references are pass or fail, then the lowest price wins. One price per
// square foot for a base year and four option years (plus a six-month
// extension at the last year's price). Wages are not his risk: a new wage
// determination with an option year adjusts the price. Fuel, chemicals and
// equipment are.
//
// THE STORY (demo-storyboard/janitorial-pack.md, sections 3, 7 and 8): hot and
// cold washing of headquarters buildings, child development centers, offices,
// barracks, bridges and tanks across Fort Bragg, Pope, Simmons and Linden Oaks,
// about 377,000 square feet a year. Demand orders with a 2-hour Priority 1
// response, sandblasting "in some extreme cases" inside the same square-foot
// price, and a named Project Manager and QC manager reachable 7:00 to 3:30.
// Reggie Tyndall (Gray Owl) has two hot-water trailers and no blaster. Every
// quotation below is the demo's own wording, inside a doc() call. The wage
// rates follow the pack's reading of wage determination 2015-4377, Rev. 33;
// treat them as sample values for this demo.
//
// THE PRICE (Grant's brief, "Will you make money?"): built up from the wage
// floor, General Maintenance Worker $21.41 plus $5.92 health and welfare. It
// comes to 43 cents a square foot: $162,110 in year one, rising to $177,190 in
// option year 4. Every year sits inside the $150K–$190K the notice states,
// near Hunter's "about $170K", and a little over the last award's 41 cents,
// which was priced under an older, lower wage determination.
//
// THIS BID IS ALREADY IN PROGRESS (start.ts): three questions wait on him (the
// pack, section 8). His sandblasting and wage-class questions for the Army are
// still on his task list (workspace.ts), so no clarification is marked sent.
//
// The member is always the janitorial firm: this file reads his own records
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
const POSTED = -STORY.postedDaysAgo;
/** The contracting officer the opportunity page names takes the quotes; the
 *  contract specialist beside her takes the questions. */
const { primary: CO, second: SPEC } = buyerPeople(ID);
/** Miles from his yard to Fort Bragg. */
const MILES = PLACES[STORY.place].milesFromBase;
const OPTION_YEARS = 4;
const WEEKS = 52;
/** The square feet the Army estimates for a contract year (the price schedule). */
const SQ_FT = 377_000;
/** General Maintenance Worker, the class the Army listed in 2021. */
const GMW_FLOOR = 21.41;
const HW = 5.92;

// ─── His past jobs, from the story ───

function pastJob(id: PastPerformance["id"]): PastPerformance {
  const job = PAST_PERFORMANCE.find((p) => p.id === id);
  if (!job) throw new Error(`The janitorial story has no past job ${id}`);
  return job;
}

const JOB_SJ = pastJob("pp-sj-dorm-wash");
const JOB_STORES = pastJob("pp-two-creeks-stores");
const JOB_TOWN = pastJob("pp-hope-mills-custodial");

const SAM_UNTIL = longDate(PERSONA.samActiveUntil);

/** A date as the draft writes it: "1 March 2025". History, so fixed. */
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
/** His short name as a file name: "Gray_Owl". */
const SHORT_FILE = PERSONA.businessShortName.replace(/\s+/g, "_");

/** His Seymour Johnson call, the one federal prime on his record (the pack, section 2). */
const SJ_ORDER = "FA480925F0123";
const SJ_BPA = "FA480924A0007";
const SJ_FILE = `Seymour_Johnson_Call_${SJ_ORDER}.pdf`;

// ─── The people on this job (fictional) ───

const OWNER = `${PERSONA.ownerName}, ${PERSONA.ownerTitle.toLowerCase()}`;
const OPS = "Keisha Lassiter";
const REF_SJ = {
  name: "Tamika Raynor",
  title: "Contracting Officer's Representative, 4th Civil Engineer Squadron",
};
const REF_STORES = { name: JOB_STORES.referenceName!, title: JOB_STORES.referenceTitle! };
const REF_TOWN = { name: JOB_TOWN.referenceName!, title: JOB_TOWN.referenceTitle! };

/** His references' phone and email: one each, whichever bid asks. */
export const REFERENCE_CONTACTS = {
  tamikaRaynor: { phone: "(919) 555-0164", email: "tamika.raynor@us.af.mil.example" },
  janelleHardee: { phone: "(910) 555-0137", email: "jhardee@twocreeksmarkets.example" },
  deniseAutry: { phone: "(910) 555-0152", email: "dautry@townofhopemills.example" },
} as const;

// ─── The buyer's files ───

const RFQ = "go-f-rfq";
const PWS = "go-f-pws";
const SHEET = "go-f-price";
const WDF = "go-f-wd";

const S_TYPE = doc(
  RFQ,
  "Section 1.1, page 1",
  "§1.1",
  "This is a combined synopsis and solicitation for commercial services. Quotes are being requested, and a separate written solicitation will not be issued.",
);
const S_SET_ASIDE = doc(
  RFQ,
  "Section 1.2, page 1",
  "§1.2",
  "This acquisition is set aside 100% for HUBZone small business concerns. The Offeror must be a certified HUBZone small business in SBA's certification system at the time it submits its quote and at award.",
);
const S_SIZE = doc(
  RFQ,
  "Section 1.2, page 1",
  "§1.2",
  "The NAICS code for this acquisition is 561790, Other Services to Buildings and Dwellings. The Offeror must be small under the size standard for this code.",
);
const S_DUE = doc(
  RFQ,
  "Section 1.4, page 2",
  "§1.4",
  `Quotes are due no later than 10:00 AM Eastern Time (ET) on ${US(DUE_DAYS)}. Quotes received after this time will not be considered.`,
);
const S_QUESTIONS = doc(
  RFQ,
  "Section 1.5, page 2",
  "§1.5",
  `Questions shall be emailed to the Contract Specialist, ${SPEC.name}, at ${SPEC.email}, no later than 12:00 PM ET on ${US(QUESTIONS_DAYS)}. Answers will be posted to SAM.gov for all offerors.`,
);
const S_NO_CONTACT = doc(
  RFQ,
  "Section 1.5, page 2",
  "§1.5",
  "Offerors shall not contact Directorate of Public Works staff about this requirement. All communication shall go through the Contract Specialist.",
);
const S_VALID = doc(
  RFQ,
  "Section 1.6, page 2",
  "§1.6",
  "Quotes shall remain valid for 90 calendar days after the closing date.",
);
const S_CONTRACT = doc(
  RFQ,
  "Section 2.1, page 4",
  "§2.1",
  "The Government intends to award a single Firm-Fixed-Price contract with a 12-month base period beginning 1 January 2027, four 12-month option periods, and an option to extend services for up to six months at the prices of the last option period.",
);
const S_FIXED = doc(
  RFQ,
  "Section 2.2, page 4",
  "§2.2",
  "The price per square foot for each period is firm and includes all labor, equipment, water, chemicals, fuel and travel, and sandblasting when approved by the COR. No adjustment will be made for changes in the cost of fuel, chemicals or equipment.",
);
const S_WAGE_ADJ = doc(
  RFQ,
  "Section 2.3, page 4",
  "§2.3",
  "When an option is exercised and a new wage determination applies, the contract price will be adjusted for the increase in wages and fringe benefits that the new wage determination requires.",
);
const S_SIGN = doc(
  RFQ,
  "Section 3.1, page 12",
  "§3.1",
  "Offerors shall complete and sign blocks 12, 17a, 30a, 30b and 30c of the SF 1449.",
);
const S_TECH = doc(
  RFQ,
  "Section 3.2, page 12",
  "§3.2",
  "Volume I, Technical Capability, shall not exceed four (4) pages. It shall name the Project Manager and the Quality Control Manager, list the equipment and the backup equipment, and describe how the Offeror will meet the Priority 1 response time and perform sandblasting when approved.",
);
const S_PP = doc(
  RFQ,
  "Section 3.3, page 13",
  "§3.3",
  "Volume II, Past Performance: provide at least two (2) and no more than three (3) references for similar exterior cleaning services performed within the past five (5) years, with a point of contact, current telephone number and email for each.",
);
const S_PRICE = doc(
  RFQ,
  "Section 3.4, page 13",
  "§3.4",
  "Volume III, Price, shall be the completed Attachment 2, Price Schedule, in its Excel format. Enter one price per square foot for the base period and for each option period.",
);
const S_REPS = doc(
  RFQ,
  "Section 3.5, page 14",
  "§3.5",
  "Offerors shall confirm that their representations and certifications in SAM are current and accurate, and complete any provision in this RFQ that is not covered in SAM.",
);
const S_EMAIL = doc(
  RFQ,
  "Section 3.6, page 14",
  "§3.6",
  `Quotes shall be emailed to ${CO.email} with the subject line: RFQ ${ID} – [Offeror Name]. Each volume shall be a separate file. Total attachments shall not exceed 10 MB.`,
);
const S_AWARD = doc(
  RFQ,
  "Section 4.1, page 15",
  "§4.1",
  "Award will be made to the responsible Offeror whose quote is technically acceptable and offers the lowest evaluated price. Technical Capability and Past Performance will be rated Acceptable or Unacceptable.",
);
const S_EVAL_TECH = doc(
  RFQ,
  "Section 4.2(a), page 15",
  "§4.2(a)",
  "Technical Capability is Acceptable when the quote names the key personnel, shows primary and backup equipment, and shows how the Priority 1 response time and approved sandblasting will be met.",
);
const S_EVAL_PP = doc(
  RFQ,
  "Section 4.2(b), page 15",
  "§4.2(b)",
  "Past Performance is Acceptable when the references show similar exterior cleaning services performed satisfactorily within the past five (5) years.",
);
const S_EVAL_PRICE = doc(
  RFQ,
  "Section 4.2(c), page 16",
  "§4.2(c)",
  "Price will be evaluated by multiplying the price per square foot for each period by the estimated square feet and adding all periods.",
);
const S_SAM = doc(
  RFQ,
  "Section 5.2, page 18",
  "§5.2",
  "An Offeror shall be registered in SAM when submitting an offer or quotation, and shall continue to be registered until time of award, during performance, and through final payment.",
);
const S_SUBS = doc(
  RFQ,
  "Section 5.3, page 18",
  "§5.3",
  "The Contractor will not pay more than 50 percent of the amount paid by the Government for services to firms that are not certified HUBZone small business concerns.",
);
const S_INVOICE = doc(
  RFQ,
  "Section 5.4, page 19",
  "§5.4",
  "Invoices shall be submitted monthly, in arrears, through Wide Area WorkFlow in the PIEE system. Payment will be made within 30 days after receipt of a proper invoice.",
);
const S_INSURANCE = doc(
  RFQ,
  "Section 5.5, page 19",
  "§5.5",
  "Before starting work, the Contractor shall have general liability insurance of at least $1,000,000 per occurrence, automobile liability, and workers' compensation as required by State law.",
);
const S_SCA = doc(
  RFQ,
  "Section 5.6, page 20",
  "§5.6",
  "The Contractor shall pay service employees not less than the wage rates and fringe benefits in the Wage Determination at Attachment 3.",
);

const S_SCOPE = doc(
  PWS,
  "Section 2.1, page 2",
  "PWS 2.1",
  "The Contractor shall pressure wash the exterior surfaces of headquarters buildings, child development centers, offices, barracks, bridges and tanks at Fort Bragg, Pope Army Airfield, Simmons Army Airfield, Linden Oaks and outlying training areas, using hot or cold water at 1,000 to 3,500 psi as the surface requires.",
);
const S_ORDERS = doc(
  PWS,
  "Section 2.3, page 3",
  "PWS 2.3",
  "Work is ordered by demand order. For a Priority 1 order, the Contractor shall arrive within two (2) hours of the call and complete the work within eight (8) hours.",
);
const S_BLAST = doc(
  PWS,
  "Section 2.4, page 3",
  "PWS 2.4",
  "In some extreme cases sandblasting may be required. Sandblasting shall be performed only with the COR's approval and is included in the price per square foot.",
);
const S_CDC = doc(
  PWS,
  "Section 3.2, page 4",
  "PWS 3.2",
  "At child development centers the Contractor shall use only child-safe cleaning agents approved by the COR.",
);
const S_DRAINS = doc(
  PWS,
  "Section 3.3, page 4",
  "PWS 3.3",
  "Wash water and debris shall be kept out of storm drains. The Contractor shall block or protect each drain near the work.",
);
const S_EQUIP = doc(
  PWS,
  "Section 3.4, page 5",
  "PWS 3.4",
  "The Contractor shall maintain primary and backup equipment so that no order is delayed by equipment failure or by equipment committed to other work.",
);
const S_PEOPLE = doc(
  PWS,
  "Section 4.1, page 6",
  "PWS 4.1",
  "The Contractor shall provide a Project Manager and a Quality Control Manager, named in writing, who shall be available to the COR from 7:00 AM to 3:30 PM, Monday through Friday, except federal holidays.",
);
const S_BADGES = doc(
  PWS,
  "Section 4.3, page 6",
  "PWS 4.3",
  "All Contractor employees shall obtain installation access credentials before working on post.",
);
const S_KICKOFF = doc(
  PWS,
  "Section 5.1, page 7",
  "PWS 5.1",
  "The Contractor shall attend a post-award conference at the Directorate of Public Works within ten (10) days after award.",
);

const S_WD_GMW = doc(WDF, "Revision 33, page 5", "WD 23370", "23370 - General Maintenance Worker 21.41");
const S_WD_RATES = doc(
  WDF,
  "Revision 33, pages 4 and 5, occupation list",
  "WD Rev 33",
  "11150 - Janitor 16.46 | 23370 - General Maintenance Worker 21.41 | 23470 - Laborer 18.03",
);
const S_WD_HW = doc(
  WDF,
  "Revision 33, page 9",
  "WD H&W",
  "HEALTH & WELFARE: $5.92 per hour, up to 40 hours per week, or $236.80 per week or $1,026.13 per month",
);
const S_WD_VACATION = doc(
  WDF,
  "Revision 33, page 9",
  "WD vacation",
  "VACATION: 2 weeks paid vacation after 1 year of service with a contractor or successor, 3 weeks after 8 years, and 4 weeks after 20 years.",
);
const S_WD_HOLIDAYS = doc(
  WDF,
  "Revision 33, page 9",
  "WD holidays",
  "HOLIDAYS: A minimum of eleven paid holidays per year: New Year's Day, Martin Luther King Jr.'s Birthday, Washington's Birthday, Memorial Day, Juneteenth, Independence Day, Labor Day, Columbus Day, Veterans' Day, Thanksgiving Day, and Christmas Day.",
);

// ─── His own record ───
// Four kinds of source, one chip each in his bid (BidText.tsx): SAM.gov, Your
// profile, Your file (a document he gave GovPreneurs) and Your answer.

const STORES_AT = "Your jobs list: Floor care and pressure washing, 12 grocery stores";
const TOWN_AT = "Your jobs list: Night custodial, Town of Hope Mills";
const SJ_AT = "Your jobs list: Dormitory pressure washing, Seymour Johnson AFB";

const P_SAM_HUBZONE: Proof = sam("Business types", "HUBZone small business, certified by the SBA");
const P_SAM_ADDRESS: Proof = sam("Physical address", PERSONA.physicalAddress);
const P_WASH: Proof = profile("Your strengths", PERSONA.differentiators[2]);
const P_BADGED: Proof = profile("Your strengths", PERSONA.differentiators[3]);
const P_YARD: Proof = profile("Your shop and yard", PERSONA.kitchen ?? "");
const P_STAFF: Proof = profile("Your company size", `People on staff: ${PERSONA.employeesW2}`);
const P_YEARS: Proof = profile("Company details", `Formed ${PERSONA.formedOn}. ${PERSONA.yearsInBusiness} years in business.`);

const P_SJ_SCOPE: Proof = yourDoc(SJ_FILE, "Statement of work, page 2", JOB_SJ.scopeDescription);
const P_SJ_TERMS: Proof = yourDoc(
  SJ_FILE,
  "Page 1, blocks 2 and 20",
  `Call ${SJ_ORDER} under BPA ${SJ_BPA}. ${longDate(JOB_SJ.periodStart)} to ${longDate(JOB_SJ.periodEnd)}. Total ${money(JOB_SJ.totalValue)}.`,
);
const P_SJ_ROLE: Proof = yourDoc(SJ_FILE, "Page 1, block 17a", `Contractor: ${PERSONA.businessName}`);
const P_SJ_COR: Proof = yourDoc(
  SJ_FILE,
  "Page 3, contract administration",
  `Contracting Officer's Representative: ${REF_SJ.name}, ${REF_SJ.title}`,
);
const P_SJ_RATING: Proof = profile(SJ_AT, "Performance rating (CPARS): none. The job was too small to need one");

const P_STORES_SCOPE: Proof = profile(STORES_AT, JOB_STORES.scopeDescription);
const P_STORES_TERMS: Proof = profile(
  STORES_AT,
  `Since ${longDate(JOB_STORES.periodStart)}. $210,000 a year.`,
);
const P_STORES_REF: Proof = profile(STORES_AT, `Reference: ${REF_STORES.name}, ${REF_STORES.title}.`);

const P_TOWN_SCOPE: Proof = profile(TOWN_AT, JOB_TOWN.scopeDescription);
const P_TOWN_TERMS: Proof = profile(TOWN_AT, `Since ${longDate(JOB_TOWN.periodStart)}. $52,000 a year.`);
const P_TOWN_REF: Proof = profile(TOWN_AT, `Reference: ${REF_TOWN.name}, ${REF_TOWN.title}.`);

// ─── The staffing plan: the price pays for these hours ───
// His two exterior techs on this contract's washing and demand orders, and
// the PM and the QC manager. Paid hours in a contract week, 52 weeks a year.
// 2,912 tech hours a year for 377,000 square feet is about 130 square feet an
// hour each, travel between sites and set-up included.

const PLAN = {
  techs: { count: 2, hoursPerWeek: 28 },
  lead: { count: 2, hoursPerWeek: 4 },
};
const PLAN_HOURS = Object.values(PLAN).reduce((n, r) => n + r.count * r.hoursPerWeek, 0);

// ─── The three questions that wait on him (the pack, section 8) ───

const PM_TEXT = {
  "pm-owner": `${OWNER}, is the Project Manager. ${OPS}, the company's operations manager, is the Quality Control Manager`,
  "pm-ops": `${OPS}, the company's operations manager, is the Project Manager. ${OWNER}, is the Quality Control Manager`,
  "pm-hire": `${OWNER}, is the Project Manager. The company will hire a Quality Control Manager after award and name that person in writing before work starts`,
};
const BLAST_TEXT = {
  "blast-sub":
    "When the COR approves sandblasting, a local blasting subcontractor does it at a signed rate, under the company's supervision, inside the same price per square foot",
  "blast-rent":
    "When the COR approves sandblasting, the company rents a blaster and two of its exterior techs, trained before work starts, do it inside the same price per square foot",
  "blast-none": "Sandblasting is not included",
};
const BACKUP_TEXT = {
  "backup-post":
    "On weekdays one of the company's two hot-water trailers stays on post, so a Priority 1 call is answered within 2 hours even when the other is booked",
  "backup-third":
    "The company will buy a third hot-water trailer on award, so a Priority 1 call is answered within 2 hours even when both of the others are booked",
  "backup-pull":
    "When both trailers are booked, the company moves one off its commercial work to answer a Priority 1 call",
};

/** The sentence that proves he does this work for the government today. */
const LEAD_SJ = `In ${pastYear(JOB_SJ.periodStart)} the company washed 14 dormitories, their stairwells, sidewalks and dumpster pads at Seymour Johnson AFB, with the wash water kept out of the storm drains`;

// ─── The bid ───

export const janitorialBid: AvaBid = {
  noticeId: ID,
  // The story owns the title, the buyer and the number (lib/ava/fixtures/index.ts).
  officialTitle: STORY.title,
  buyer: STORY.agency,
  bidNumber: ID,
  kind: "bid-package",
  kindReason: "One price per square foot and the forms, plus a four-page capability write-up and three references, each rated pass or fail.",

  files: [
    {
      id: RFQ,
      name: `${ID}_Combined_Synopsis_Solicitation.pdf`,
      role: "main",
      pages: 24,
      postedDaysFromNow: POSTED,
      readability: "read",
    },
    {
      id: PWS,
      name: "Attachment_1_Performance_Work_Statement.pdf",
      role: "exhibit",
      pages: 9,
      postedDaysFromNow: POSTED,
      readability: "read",
    },
    {
      id: SHEET,
      name: "Attachment_2_Price_Schedule.xlsx",
      role: "price-form",
      pages: 1,
      postedDaysFromNow: POSTED,
      readability: "read",
    },
    {
      id: WDF,
      name: "Attachment_3_WD_2015-4377_Rev_33.pdf",
      role: "exhibit",
      pages: 11,
      postedDaysFromNow: POSTED,
      readability: "read",
    },
  ],

  deadline: {
    dueDaysFromNow: DUE_DAYS,
    time: "10:00 AM",
    time24: "10:00",
    zone: "Eastern Time",
    utcOffset: ET_OFFSET(DUE_DAYS),
    source: S_DUE,
    questionsDueDaysFromNow: QUESTIONS_DAYS,
    questionsTime: "12:00 PM",
    questionsSource: S_QUESTIONS,
  },

  award: {
    method: "lowest-price-acceptable",
    source: S_AWARD,
    criteria: [
      {
        id: "go-cr-tech",
        name: "Technical capability",
        points: null,
        kind: "pass-fail",
        source: S_EVAL_TECH,
        treatment: "Acceptable or not. Key people, equipment, the 2-hour calls and sandblasting must all be there.",
      },
      {
        id: "go-cr-pp",
        name: "Past performance on similar exterior cleaning",
        points: null,
        kind: "pass-fail",
        source: S_EVAL_PP,
        treatment: "Acceptable or not. Two or three similar jobs from the last five years.",
      },
      {
        id: "go-cr-price",
        name: "Price",
        points: null,
        kind: "price-formula",
        source: S_EVAL_PRICE,
        treatment: "Lowest price among acceptable quotes wins. All five years are added up.",
      },
    ],
    note: "No points. Each part is pass or fail, then the lowest price wins.",
  },

  hardRequirements: [
    {
      id: "go-r-hubzone",
      grantRow: "gw-hubzone",
      group: "eligibility",
      label: "Certified HUBZone small business when you quote, and at award",
      source: S_SET_ASIDE,
      initial: "meets",
      evidence: "Your registration lists you as a certified HUBZone small business.",
    },
    {
      id: "go-r-sam",
      grantRow: "gw-sam",
      group: "eligibility",
      label: "Active federal registration when you quote, and through award",
      source: S_SAM,
      initial: "meets",
      evidence: `Your registration is active until ${SAM_UNTIL}.`,
    },
    {
      id: "go-r-size",
      grantRow: "gw-size",
      group: "eligibility",
      label: "Small under the size standard for industry code 561790",
      source: S_SIZE,
      initial: "meets",
      evidence: "Your registration lists you as small for industry code 561790.",
    },
    {
      id: "go-r-sca",
      grantRow: "gw-wages",
      group: "pricing",
      label: `Pay the exterior techs at least $${GMW_FLOOR} an hour, plus $${HW} an hour for health and welfare`,
      source: S_SCA,
      initial: "confirm",
      askId: "go-ask-pay",
      askIds: ["go-ask-hw"],
      afterAsk: "meets",
      evidenceAfter: "Your pay rates, checked against the wage determination",
    },
    {
      id: "go-r-people",
      grantRow: "gw-people",
      group: "people",
      neededAt: "work-start",
      label: "A named Project Manager and QC manager, reachable 7:00 AM to 3:30 PM on weekdays",
      source: S_PEOPLE,
      initial: "confirm",
      askId: "go-ask-pm",
      evidenceAfter: "Your quote names your Project Manager and QC manager",
    },
    {
      id: "go-r-blast",
      grantRow: "gw-blast",
      group: "writing",
      neededAt: "work-start",
      label: "Sandblasting when the COR approves it, inside the price per square foot",
      source: S_BLAST,
      initial: "confirm",
      askId: "go-ask-blast",
      evidenceAfter: "Your quote says how sandblasting is done",
    },
    {
      id: "go-r-backup",
      grantRow: "gw-backup",
      group: "writing",
      neededAt: "work-start",
      label: "Backup equipment, so a Priority 1 call is reached within 2 hours",
      source: S_EQUIP,
      initial: "confirm",
      askId: "go-ask-backup",
      evidenceAfter: "Your quote names the backup rig",
    },
    {
      id: "go-r-insurance",
      group: "insurance",
      neededAt: "work-start",
      label: "General liability of at least $1,000,000 per occurrence, before work starts",
      source: S_INSURANCE,
      initial: "meets",
      evidence: "Your $1M per occurrence general liability policy is on file.",
    },
  ],

  screen: [
    {
      topic: "vendor-registration",
      found: false,
      summary: "Federal quote. No state or local vendor registration asked for.",
    },
    {
      topic: "preferences",
      found: true,
      summary: "Only certified HUBZone small businesses may quote.",
      source: S_SET_ASIDE,
      requirementId: "go-r-hubzone",
    },
    { topic: "bonds", found: false, summary: "No bid, performance or payment bond asked for." },
    {
      topic: "insurance",
      found: true,
      summary: "General liability of $1M per occurrence before work starts. Your policy meets it.",
      source: S_INSURANCE,
      requirementId: "go-r-insurance",
    },
    {
      topic: "wages",
      found: true,
      summary: "Service Contract Act pay floors for every service worker, plus $5.92 an hour for health and welfare.",
      source: S_SCA,
      requirementId: "go-r-sca",
    },
    { topic: "tax", found: false, summary: "No sales or use tax rules in these files." },
    {
      topic: "notary-signature",
      found: true,
      summary: "No notary. You sign the SF 1449.",
      source: S_SIGN,
    },
    {
      topic: "pre-bid-meeting",
      found: false,
      summary: "No meeting or site visit before quotes are due.",
    },
    {
      topic: "public-opening",
      found: false,
      summary: "Federal quotes are not opened in public. Prices are not read aloud.",
    },
    {
      topic: "references-licenses",
      found: true,
      summary: "Two or three similar exterior cleaning jobs from the last five years.",
      source: S_PP,
    },
    {
      topic: "participation-goals",
      found: false,
      summary: "No minority or disadvantaged business goals in these files.",
    },
    {
      topic: "background-checks",
      found: true,
      summary: "Every worker needs a post access credential before working on post. Your crews already have them.",
      source: S_BADGES,
    },
    {
      topic: "portal-rules",
      found: true,
      summary: "Quotes go by email. One file per volume, 10 MB in total, and a set subject line.",
      source: S_EMAIL,
    },
  ],

  commitments: [
    {
      id: "go-c-wash",
      text: "Wash every building, bridge and tank on the orders, hot or cold, at 1,000 to 3,500 psi as the surface needs.",
      source: S_SCOPE,
      pricedAs: `Priced as: two exterior techs, ${PLAN.techs.hoursPerWeek} hours a week each, for about ${SQ_FT.toLocaleString("en-US")} square feet a year.`,
      needsApproval: true,
    },
    {
      id: "go-c-p1",
      text: "On a Priority 1 order, a crew on site within 2 hours and the work done within 8.",
      source: S_ORDERS,
      pricedAs: "Priced as: part of the techs' hours. Your answer on the backup rig says how.",
      needsApproval: true,
    },
    {
      id: "go-c-cdc",
      text: "Only child-safe cleaning agents the COR approves at the child development centers.",
      source: S_CDC,
      pricedAs: "Priced as: part of your yearly chemical costs.",
      needsApproval: true,
    },
    {
      id: "go-c-drains",
      text: "Storm drains blocked near the work, and wash water recovered, not run off.",
      source: S_DRAINS,
      pricedAs: "Priced as: your wash-water recovery kit, in your yearly equipment costs.",
      needsApproval: true,
    },
    {
      id: "go-c-hours",
      text: "The Project Manager or the QC manager answers the COR from 7:00 AM to 3:30 PM, Monday to Friday.",
      source: S_PEOPLE,
      pricedAs: `Priced as: ${PLAN.lead.hoursPerWeek} hours a week each for the Project Manager and the QC manager.`,
      needsApproval: true,
    },
    {
      id: "go-c-price",
      text: "One price per square foot for each year. It holds even if fuel, chemicals or equipment cost more.",
      source: S_FIXED,
      pricedAs: "Priced as: your yearly equipment, fuel and chemical costs today, with your yearly increase in each option year.",
      needsApproval: false,
    },
  ],

  contractTerms: [
    {
      text: "One price per square foot for each year. It covers labor, equipment, water, chemicals, fuel, travel and approved sandblasting.",
      source: S_FIXED,
    },
    {
      text: "Wages are not your risk. When a new wage determination comes with an option year, the Army adjusts the price for it. Fuel, chemicals and equipment are your risk.",
      source: S_WAGE_ADJ,
    },
    {
      text: "Sandblasting is inside the same square-foot price, with no cap in these files. Ask in Q&A how many square feet were blasted last year.",
      source: S_BLAST,
    },
    {
      text: "A 12-month base year from 1 January 2027, four 12-month option years, and up to six more months at the last year's price.",
      source: S_CONTRACT,
    },
    {
      text: "You price every option year now. Ava adds your yearly increase to the square-foot price.",
      source: S_PRICE,
    },
    {
      text: "You bill monthly, after the work, through the Army's online invoicing system. You need a free account there before the first invoice.",
      source: S_INVOICE,
    },
    {
      text: "Payment arrives within 30 days of a correct invoice. You carry about five weeks of crew pay and fuel first.",
      source: S_INVOICE,
    },
    { text: "Your price holds for 90 days after the due date.", source: S_VALID },
    {
      text: "Firms that are not HUBZone-certified may get no more than half of what the Army pays you for services. A blasting sub counts toward that half.",
      source: S_SUBS,
    },
  ],

  // Whether a Mentor review is advised, and why, is Grant's call.
  mentor: { recommended: false, reasons: [] },

  knownFacts: [
    { label: "Legal name", value: PERSONA.businessName, from: "Your federal registration" },
    { label: "Unique entity ID", value: PERSONA.uei, from: "Your federal registration" },
    {
      label: "Commercial and Government Entity code",
      value: PERSONA.cage,
      from: "Your federal registration",
    },
    {
      label: "Company formed",
      value: `${longDate(new Date(`${PERSONA.formedOn} 12:00 UTC`).toISOString().slice(0, 10))}, in ${PERSONA.stateOfIncorporation}`,
      from: "Your Articles of Organization",
    },
    { label: "Address", value: PERSONA.physicalAddress, from: "Your federal registration" },
    {
      label: "HUBZone small business",
      value: "Certified by the SBA in 2023. Recertification is due in 38 days",
      from: "Your federal registration, and Grant's check",
    },
    {
      label: "Main industry code",
      value: `${PERSONA.primaryNaics} ${PERSONA.primaryNaicsLabel}`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Other industry codes",
      value: PERSONA.secondaryNaics.map((n) => `${n.code} ${n.label}`).join(", "),
      from: "Your GovPreneurs profile",
    },
    {
      label: "Business size",
      value: "Small for industry code 561790",
      from: "Your GovPreneurs profile",
    },
    { label: "People on staff", value: String(PERSONA.employeesW2), from: "Your GovPreneurs profile" },
    { label: "Shop and yard", value: PERSONA.kitchen ?? "", from: "Your GovPreneurs profile" },
    {
      label: "Insurance on file",
      value: "General liability $1M per occurrence. Auto liability and workers' comp.",
      from: "Your GovPreneurs profile",
    },
    {
      label: JOB_SJ.projectTitle,
      value: `Prime contractor, ${pastYear(JOB_SJ.periodStart)}, ${money(JOB_SJ.totalValue)}. Too small for a federal performance rating (CPARS).`,
      from: "Your order file, and your jobs list",
    },
    {
      label: JOB_STORES.projectTitle,
      value: `Prime contractor since ${pastYear(JOB_STORES.periodStart)}, $210,000 a year`,
      from: "Your GovPreneurs profile, jobs list",
    },
    {
      label: JOB_TOWN.projectTitle,
      value: `Prime contractor since ${pastYear(JOB_TOWN.periodStart)}, $52,000 a year`,
      from: "Your GovPreneurs profile, jobs list",
    },
  ],

  asks: [
    // ── The three questions that wait on him ──
    {
      id: "go-ask-pm",
      kind: "answer",
      title: "Your Project Manager and QC manager",
      source: S_PEOPLE,
      why: "The work statement asks for a named Project Manager and QC manager, reachable 7:00 AM to 3:30 PM on weekdays. Your profile names no QC manager.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      // The capability write-up names them, so he answers with the bid.
      neededAt: "bid",
      group: "people",
      answer: {
        type: "answer",
        question: "Who are your Project Manager and QC manager? One of them must answer the COR from 7:00 AM to 3:30 PM on weekdays.",
        choices: [
          {
            id: "pm-owner",
            label: `I am the PM. ${OPS}, our operations manager, is the QC manager`,
            consequence: `Ava names you as Project Manager and ${OPS} as QC manager.`,
          },
          {
            id: "pm-ops",
            label: `${OPS} is the PM. I am the QC manager`,
            consequence: `Ava names ${OPS} as Project Manager and you as QC manager.`,
          },
          {
            id: "pm-hire",
            label: "We hire a QC manager after award",
            consequence: "Ava names you as PM, writes that you name the QC manager before work starts, and flags the risk.",
            gives: {
              status: "confirm",
              evidence: "A risk: you plan to hire a QC manager after award, so your quote names no one yet",
            },
            warn: "That is a risk. The capability write-up is pass or fail, and it must name the key people. A quote with no QC manager can be rated Unacceptable.",
          },
        ],
      },
      feeds: ["Draft · Key people", "Hard requirement · PM and QC manager"],
    },
    {
      id: "go-ask-blast",
      kind: "answer",
      title: "How you cover sandblasting",
      source: S_BLAST,
      why: "Sandblasting is inside the square-foot price when the COR approves it. You don't own a blaster. Grant says to get a signed rate from a blasting sub.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      neededAt: "bid",
      group: "writing",
      answer: {
        type: "answer",
        question: "How will you cover sandblasting when the COR approves it?",
        choices: [
          {
            id: "blast-sub",
            label: "A local blasting sub at a signed rate",
            consequence: "Ava writes a blasting sub at a signed rate. Send your sandblasting question before questions close, so the rate fits.",
          },
          {
            id: "blast-rent",
            label: "Rent a blaster and train two techs",
            consequence: "Ava writes a rented blaster and two trained techs, and flags the cost.",
            warn: "That adds cost and time. A rented blaster and the training aren't in your price yet. Update your sandblasting allowance, or the price runs short.",
          },
          {
            id: "blast-none",
            label: "Leave sandblasting out",
            failsGate:
              "Leaving sandblasting out makes your quote non-compliant. The work statement puts it inside the price, so the Army can rate the quote Unacceptable.",
          },
        ],
      },
      feeds: ["Draft · Sandblasting", "Hard requirement · Sandblasting"],
    },
    {
      id: "go-ask-backup",
      kind: "answer",
      title: "Your backup rig for 2-hour calls",
      source: S_EQUIP,
      why: "A Priority 1 call needs a crew there in 2 hours, and the work statement asks for backup equipment. You have two hot-water trailers, and both often work your grocery stores.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      neededAt: "bid",
      group: "writing",
      answer: {
        type: "answer",
        question: "How will you answer a 2-hour Priority 1 call when both rigs are booked?",
        choices: [
          {
            id: "backup-post",
            label: "Keep rig 2 on post on weekdays",
            consequence: "Ava writes that one trailer stays on post on weekdays as the backup.",
          },
          {
            id: "backup-third",
            label: "Buy a third rig on award",
            consequence: "Ava writes a third trailer bought on award, and flags the cost.",
            warn: "That adds cost. A third hot-water trailer isn't in your equipment costs yet. Update them, or the price runs short.",
          },
          {
            id: "backup-pull",
            label: "Pull a rig off grocery work",
            consequence: "Ava writes that you move a trailer off commercial work, and flags the risk.",
            gives: {
              status: "confirm",
              evidence: "A risk: the work statement asks for backup equipment, and a rig busy elsewhere is not one",
            },
            warn: "That is a risk. The work statement requires backup equipment so no order waits on a rig committed to other work. Pulling one off a store may not count.",
          },
        ],
      },
      feeds: ["Draft · Backup rig", "Hard requirement · Backup equipment"],
    },

    // ── Answered before the story starts ──
    {
      id: "go-ask-pay",
      kind: "enter",
      title: "What you pay each role (2 roles)",
      source: S_WD_RATES,
      why: "The price starts from what you pay. The exterior techs must meet their wage floor, or you owe back pay.",
      owner: "bookkeeper",
      leadDays: 2,
      minutes: 10,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "go-fld-pay-tech",
            label: "Exterior tech, per hour",
            unit: "usd-hour",
            hint: "What you will pay on this contract, before taxes.",
            floor: {
              value: GMW_FLOOR,
              why: "General Maintenance Worker in the wage determination: the class the Army listed for this work in 2021.",
            },
          },
          {
            id: "go-fld-pay-lead",
            label: "Project Manager or QC manager, per hour",
            unit: "usd-hour",
            hint: "What you pay now, before taxes. No wage floor: these roles manage the work.",
          },
        ],
      },
      feeds: ["Price · Exterior techs", "Price · PM and QC manager", "Hard requirement · Wage floors"],
    },
    {
      id: "go-ask-hw",
      kind: "answer",
      title: "How you pay health and welfare",
      source: S_WD_HW,
      why: "The wage determination adds $5.92 for every paid hour. You can pay it as cash or as benefits.",
      owner: "bookkeeper",
      leadDays: 1,
      minutes: 5,
      answer: {
        type: "answer",
        question: "How do you pay the $5.92 an hour for health and welfare?",
        choices: [
          {
            id: "hw-benefits",
            label: "As health insurance and other benefits",
            consequence: "Ava adds $5.92 an hour. If benefits cost less, you pay the rest as cash.",
          },
          {
            id: "hw-cash",
            label: "As extra cash in each paycheck",
            consequence: "Ava adds $5.92 to every paid hour. Payroll taxes apply to the cash.",
          },
        ],
      },
      feeds: ["Price · Health and welfare"],
    },
    {
      id: "go-ask-payroll",
      kind: "upload",
      title: "Your latest payroll report",
      source: S_SCA,
      why: "Ava reads your unemployment tax and workers' comp rates from it. Nothing is guessed.",
      owner: "bookkeeper",
      leadDays: 2,
      minutes: 10,
      answer: {
        type: "upload",
        accepts: "A payroll summary from your payroll service, for any recent month",
        extracts: [
          {
            fieldId: "go-fld-suta",
            label: "Unemployment tax, state and federal",
            value: 1.2,
            unit: "percent",
            where: "Tax summary, page 2",
          },
          {
            fieldId: "go-fld-wc",
            label: "Workers' comp premium",
            value: 5.5,
            unit: "percent",
            where: "Employer costs, page 3",
          },
        ],
      },
      feeds: ["Price · Unemployment tax", "Price · Workers' comp"],
    },
    {
      id: "go-ask-equipcost",
      kind: "enter",
      title: "What the rigs, fuel, chemicals and sandblasting cost you a year",
      source: S_FIXED,
      why: "The square-foot price carries them, and the Army never adjusts for them. Your records know them; Ava doesn't guess.",
      owner: "bookkeeper",
      leadDays: 2,
      minutes: 10,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "go-fld-equip",
            label: "Rigs, fuel, water, chemicals and wash-water recovery, per year",
            unit: "usd",
            hint: "The two trailers' share for this work: repairs, insurance, fuel for the truck and burners, and chemicals.",
          },
          {
            id: "go-fld-blast",
            label: "Sandblasting allowance, per year",
            unit: "usd",
            hint: "Your estimate until a blasting sub signs a rate. The Q&A answer on last year's blasting can change it.",
          },
        ],
      },
      feeds: ["Price · Equipment, fuel and chemicals", "Price · Sandblasting allowance"],
    },
    {
      id: "go-ask-pl",
      kind: "upload",
      title: "Your 2025 profit and loss statement",
      source: S_PRICE,
      why: "Ava works out your overhead from it: the office, the yard, supervisors and insurance.",
      owner: "bookkeeper",
      leadDays: 3,
      minutes: 10,
      answer: {
        type: "upload",
        accepts: "Your 2025 profit and loss statement, from your bookkeeper",
        extracts: [
          {
            fieldId: "go-fld-overhead",
            label: "Overhead, as a share of direct cost",
            value: 8,
            unit: "percent",
            where: "Operating expenses, page 1",
          },
        ],
      },
      feeds: ["Price · Overhead"],
    },
    {
      id: "go-ask-contingency",
      kind: "enter",
      title: "Your contingency, for costs that run over",
      source: S_PRICE,
      why: "A reserve for costs that come in higher than you planned, such as more sandblasting than last year. Ava never picks it.",
      owner: "you",
      leadDays: 0,
      minutes: 5,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "go-fld-contingency",
            label: "Contingency, as a percent of cost",
            unit: "percent",
            hint: "Added to labor, equipment and overhead, before profit. Enter 0 if you want none.",
          },
        ],
      },
      feeds: ["Price · Contingency"],
    },
    {
      id: "go-ask-profit",
      kind: "enter",
      title: "Your profit, and your yearly increase for the option years",
      source: S_PRICE,
      why: "Ava never picks your margin. Wages are adjusted for you with each new wage determination; your increase covers fuel, chemicals and equipment.",
      owner: "you",
      leadDays: 1,
      minutes: 15,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          { id: "go-fld-profit", label: "Profit", unit: "percent", hint: "A share of your total cost." },
          {
            id: "go-fld-escalation",
            label: "Yearly increase for each option year",
            unit: "percent",
            hint: "For fuel, chemicals and equipment. Wage increases are added by the Army when a new wage determination comes.",
          },
        ],
      },
      feeds: ["Price · Profit", "Price · Option years"],
    },
    {
      id: "go-ask-ref1",
      kind: "approve",
      title: "Seymour Johnson dormitory washing as reference 1",
      source: S_PP,
      why: "Hot-water washing of 14 dormitories for the Air Force, storm drains kept clear: the closest match to this job.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use your Seymour Johnson dormitory washing as reference 1? ${REF_SJ.name}, named in your call, is the contact.`,
        from: "Your order file",
        value: `${JOB_SJ.projectTitle}. Contact: ${REF_SJ.name}`,
        asOf: "Too small for a federal performance rating (CPARS). Ask the COR for a reference letter.",
      },
      feeds: ["Similar work · Reference 1"],
    },
    {
      id: "go-ask-ref2",
      kind: "approve",
      title: "Two Creeks Markets store washing as reference 2",
      source: S_PP,
      why: "Hot-water washing of 12 store fronts, carts and loading docks since 2020.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use your Two Creeks Markets work as reference 2? ${REF_STORES.name} is the contact.`,
        from: "Your GovPreneurs profile, jobs list",
        value: `${JOB_STORES.projectTitle}. Contact: ${REF_STORES.name}`,
      },
      feeds: ["Similar work · Reference 2"],
    },
    {
      id: "go-ask-ref3",
      kind: "approve",
      title: "Town of Hope Mills as reference 3",
      source: S_PP,
      why: "Government work since 2021: the town hall, police station and park restrooms.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use your Town of Hope Mills contract as reference 3? ${REF_TOWN.name} is the contact.`,
        from: "Your GovPreneurs profile, jobs list",
        value: `${JOB_TOWN.projectTitle}. Contact: ${REF_TOWN.name}`,
      },
      feeds: ["Similar work · Reference 3"],
    },
    {
      id: "go-ask-refcontacts",
      kind: "enter",
      title: "Current phone and email for your three references",
      source: S_PP,
      why: "The Army may call them. A wrong number can make this part Unacceptable.",
      owner: "references",
      leadDays: 5,
      minutes: 10,
      answer: {
        type: "enter",
        fields: [
          { id: "go-fld-ref1-phone", label: `${REF_SJ.name}, phone`, unit: "phone" },
          { id: "go-fld-ref1-email", label: `${REF_SJ.name}, email`, unit: "email" },
          { id: "go-fld-ref2-phone", label: `${REF_STORES.name}, phone`, unit: "phone" },
          { id: "go-fld-ref2-email", label: `${REF_STORES.name}, email`, unit: "email" },
          { id: "go-fld-ref3-phone", label: `${REF_TOWN.name}, phone`, unit: "phone" },
          { id: "go-fld-ref3-email", label: `${REF_TOWN.name}, email`, unit: "email" },
        ],
      },
      feeds: ["Similar work · Contacts"],
    },
  ],

  // His sandblasting and wage-class questions are on his task list, not sent.
  clarifications: [],

  plan: [
    {
      id: "go-p-tech",
      source: S_TECH,
      kind: "scored-item",
      needs: "writing",
      ifMissed: "The Army has nothing to rate your capability by, so the quote is Unacceptable.",
      answeredIn: { kind: "section", id: "go-s-tech", label: "Technical capability" },
    },
    {
      id: "go-p-people",
      source: S_PEOPLE,
      kind: "instruction",
      needs: "writing",
      ifMissed: "A write-up that names no key people can be rated Unacceptable.",
      answeredIn: { kind: "section", id: "go-s-tech", label: "Technical capability" },
      askId: "go-ask-pm",
    },
    {
      id: "go-p-blast",
      source: S_BLAST,
      kind: "instruction",
      needs: "writing",
      ifMissed: "The Army has to guess how you sandblast, and can rate the quote Unacceptable.",
      answeredIn: { kind: "section", id: "go-s-tech", label: "Technical capability" },
      askId: "go-ask-blast",
    },
    {
      id: "go-p-backup",
      source: S_EQUIP,
      kind: "instruction",
      needs: "writing",
      ifMissed: "No backup equipment shown, so the 2-hour calls look unmet.",
      answeredIn: { kind: "section", id: "go-s-tech", label: "Technical capability" },
      askId: "go-ask-backup",
    },
    {
      id: "go-p-pp",
      source: S_PP,
      kind: "scored-item",
      needs: "writing",
      ifMissed: "With fewer than two references, this part is Unacceptable.",
      answeredIn: { kind: "section", id: "go-s-pp", label: "Your three similar jobs" },
      askId: "go-ask-ref1",
    },
    {
      id: "go-p-price",
      source: S_PRICE,
      kind: "instruction",
      needs: "price",
      ifMissed: "A missing square-foot price makes the quote incomplete.",
      answeredIn: { kind: "price", id: "price", label: "Price schedule" },
      askId: "go-ask-profit",
    },
    {
      id: "go-p-wages",
      source: S_SCA,
      kind: "instruction",
      needs: "price",
      ifMissed: "You owe back pay if any rate is under its wage floor.",
      answeredIn: { kind: "price", id: "price", label: "Price schedule" },
      askId: "go-ask-pay",
    },
    {
      id: "go-p-sf1449",
      source: S_SIGN,
      kind: "form",
      needs: "signature",
      ifMissed: "An unsigned quote may be rejected as incomplete.",
      answeredIn: { kind: "form", id: "go-fm-sf1449", label: "SF 1449, signed by you" },
    },
    {
      id: "go-p-reps",
      source: S_REPS,
      kind: "form",
      needs: "signature",
      ifMissed: "The Army cannot award to a company whose answers are out of date.",
      answeredIn: { kind: "form", id: "go-fm-reps", label: "Representations and certifications" },
    },
    {
      id: "go-p-email",
      source: S_EMAIL,
      kind: "logistics",
      needs: "action",
      ifMissed: "A quote with the wrong subject line or over 10 MB may never arrive.",
      answeredIn: { kind: "checklist", id: "go-ck-email", label: "Checklist: email the quote" },
    },
    {
      id: "go-p-due",
      source: S_DUE,
      kind: "logistics",
      needs: "action",
      ifMissed: "A quote after 10:00 AM Eastern Time is not considered.",
      answeredIn: { kind: "checklist", id: "go-ck-internal", label: "Checklist: internal deadline" },
    },
  ],

  themes: [],

  sections: [
    {
      id: "go-s-tech",
      title: "Technical capability",
      answers: S_TECH,
      criterionId: "go-cr-tech",
      points: null,
      pageLimit: 4,
      pages: 3,
      // In the order section 3.2 asks: the work, equipment and backup,
      // sandblasting, then the key people.
      paragraphs: [
        // 0 · Who does the work, and where it is.
        [
          {
            text: `${PERSONA.businessName} will wash the exterior facilities and structures the Directorate of Public Works orders at Fort Bragg and its airfields. `,
          },
          {
            text: "The company is a certified HUBZone small business",
            claim: { id: "go-cl-hubzone", tag: "verified", proof: P_SAM_HUBZONE },
          },
          { text: ", based at " },
          {
            text: PERSONA.physicalAddress.replace(/, NC \d{5}$/, ""),
            claim: { id: "go-cl-address", tag: "verified", proof: P_SAM_ADDRESS },
          },
          { text: `, ${MILES} miles from post. ` },
          {
            text: `It has cleaned buildings in North Carolina since ${PERSONA.formedOn.slice(-4)}`,
            claim: { id: "go-cl-years", tag: "verified", proof: P_YEARS },
          },
          { text: ", and " },
          {
            text: "its crews are already badged for Fort Bragg and Seymour Johnson",
            claim: { id: "go-cl-badged", tag: "verified", proof: P_BADGED },
          },
          { text: "." },
        ],
        // 1 · The work.
        [
          {
            text: "Every building, bridge and tank on an order is washed hot or cold, at 1,000 to 3,500 psi as the surface needs",
            claim: { id: "go-cl-wash", tag: "commitment", commitmentId: "go-c-wash" },
          },
          { text: ". " },
          {
            text: "At the child development centers the crews use only child-safe agents the COR approves",
            claim: { id: "go-cl-cdc", tag: "commitment", commitmentId: "go-c-cdc" },
          },
          { text: ". " },
          {
            text: "Storm drains near the work are blocked and the wash water is recovered",
            claim: { id: "go-cl-drains", tag: "commitment", commitmentId: "go-c-drains" },
          },
          { text: ". " },
          {
            text: LEAD_SJ,
            claim: { id: "go-cl-sj", tag: "verified", proof: P_SJ_SCOPE },
          },
          { text: "." },
        ],
        // 2 · Equipment and the backup.
        [
          {
            text: "The company runs hot-water pressure washing with wash-water recovery",
            claim: { id: "go-cl-equip", tag: "verified", proof: P_WASH },
          },
          { text: ", from " },
          {
            text: "its office and equipment yard on Gillespie St, with two hot-water pressure-washing trailers",
            claim: { id: "go-cl-yard", tag: "verified", proof: P_YARD },
          },
          { text: ". " },
          {
            text: "On a Priority 1 order a crew is on site within 2 hours and the work is done within 8",
            claim: { id: "go-cl-p1", tag: "commitment", commitmentId: "go-c-p1" },
          },
          { text: ". " },
          {
            text: "The backup rig is named here",
            claim: {
              id: "go-cl-backup",
              tag: "unsupported",
              askId: "go-ask-backup",
              gap: "[NEEDED: your backup rig for 2-hour calls]",
              resolvedText: BACKUP_TEXT["backup-post"],
              resolvedByChoice: BACKUP_TEXT,
            },
          },
          { text: "." },
        ],
        // 3 · Sandblasting.
        [
          {
            text: "Sandblasting is covered here",
            claim: {
              id: "go-cl-blast",
              tag: "unsupported",
              askId: "go-ask-blast",
              gap: "[NEEDED: how you cover sandblasting]",
              resolvedText: BLAST_TEXT["blast-sub"],
              resolvedByChoice: BLAST_TEXT,
            },
          },
          { text: ". Nothing is blasted without the COR's approval." },
        ],
        // 4 · The team: the one staffing plan the price uses.
        [
          {
            text: "The Project Manager and the QC manager are named here",
            claim: {
              id: "go-cl-pm",
              tag: "unsupported",
              askId: "go-ask-pm",
              gap: "[NEEDED: your Project Manager and QC manager]",
              resolvedText: PM_TEXT["pm-owner"],
              resolvedByChoice: PM_TEXT,
            },
          },
          { text: ". " },
          {
            text: "One of them answers the COR from 7:00 AM to 3:30 PM, Monday to Friday",
            claim: { id: "go-cl-hours", tag: "commitment", commitmentId: "go-c-hours" },
          },
          { text: ". " },
          {
            text: `The company has ${PERSONA.employeesW2} people on staff`,
            claim: { id: "go-cl-staff", tag: "verified", proof: P_STAFF },
          },
          {
            text: `. This contract uses ${PLAN_HOURS} paid hours a week: two exterior techs, and the Project Manager and the QC manager.`,
          },
        ],
      ],
      // Grant says DPW wants exteriors that last longer. Only Reggie knows
      // whether he photographs each job.
      decisions: [
        {
          id: "go-dec-photos",
          paragraphIndex: 1,
          choice: "Storm drains near the work are blocked and the wash water is recovered.",
          other: "Storm drains near the work are blocked, the wash water is recovered, and each job is photographed before and after for the COR.",
        },
      ],
      challenges: [],
    },
    {
      id: "go-s-pp",
      title: "Past performance: three similar jobs",
      answers: S_PP,
      criterionId: "go-cr-pp",
      points: null,
      pageLimit: null,
      pages: 2,
      paragraphs: [
        [
          { text: "Reference 1: " },
          {
            text: `${JOB_SJ.projectTitle}, call ${SJ_ORDER}, ${longDate(JOB_SJ.periodStart)} to ${longDate(JOB_SJ.periodEnd)}, ${money(JOB_SJ.totalValue)}`,
            claim: { id: "go-cl-r1-terms", tag: "verified", proof: P_SJ_TERMS },
          },
          { text: ". " },
          {
            text: `${PERSONA.businessShortName} was the prime contractor`,
            claim: { id: "go-cl-r1-role", tag: "verified", proof: P_SJ_ROLE },
          },
          { text: ". " },
          {
            text: "Hot-water washing of 14 dormitories, their stairwells, sidewalks and dumpster pads, with the wash water kept out of the storm drains",
            claim: { id: "go-cl-r1-scope", tag: "verified", proof: P_SJ_SCOPE },
          },
          { text: ". " },
          {
            text: "The job was too small to need a federal performance rating (CPARS)",
            claim: { id: "go-cl-r1-rating", tag: "verified", proof: P_SJ_RATING },
          },
          { text: ". Contact: " },
          {
            text: `${REF_SJ.name}, ${REF_SJ.title}`,
            claim: { id: "go-cl-r1-contact", tag: "verified", proof: P_SJ_COR },
          },
          { text: "." },
        ],
        [
          { text: "Reference 2: " },
          {
            text: `${JOB_STORES.projectTitle}, for ${JOB_STORES.customerName}, since ${longDate(JOB_STORES.periodStart)}, $210,000 a year`,
            claim: { id: "go-cl-r2-terms", tag: "verified", proof: P_STORES_TERMS },
          },
          { text: ". " },
          {
            text: "Overnight floor care inside 12 stores and hot-water washing of their fronts, carts and loading docks",
            claim: { id: "go-cl-r2-scope", tag: "verified", proof: P_STORES_SCOPE },
          },
          { text: ". Contact: " },
          {
            text: `${REF_STORES.name}, ${REF_STORES.title}`,
            claim: { id: "go-cl-r2-contact", tag: "verified", proof: P_STORES_REF },
          },
          { text: "." },
        ],
        [
          { text: "Reference 3: " },
          {
            text: `${JOB_TOWN.projectTitle}, for the ${JOB_TOWN.customerName.replace(/, NC$/, "")}, since ${longDate(JOB_TOWN.periodStart)}, $52,000 a year`,
            claim: { id: "go-cl-r3-terms", tag: "verified", proof: P_TOWN_TERMS },
          },
          { text: ". " },
          {
            text: "Five nights a week at the town hall and police station, daily park restrooms, and quarterly floor care",
            claim: { id: "go-cl-r3-scope", tag: "verified", proof: P_TOWN_SCOPE },
          },
          { text: ". Contact: " },
          {
            text: `${REF_TOWN.name}, ${REF_TOWN.title}`,
            claim: { id: "go-cl-r3-contact", tag: "verified", proof: P_TOWN_REF },
          },
          { text: "." },
        ],
      ],
      challenges: [],
    },
  ],

  price: {
    sheetName: "Attachment 2, the Army's price schedule",
    sheetFileId: SHEET,
    contractType:
      "Firm fixed price per square foot for each period: a 12-month base year and four 12-month option years, at the increase you choose.",
    contractTypeSource: S_CONTRACT,
    weeks: WEEKS,
    // The one staffing plan. The capability write-up describes these same people.
    roles: [
      {
        id: "go-role-techs",
        name: "Exterior techs",
        ...PLAN.techs,
        pay: { askId: "go-ask-pay", fieldId: "go-fld-pay-tech" },
        wageFloor: { perHour: GMW_FLOOR, source: S_WD_GMW },
      },
      {
        id: "go-role-lead",
        name: "Project Manager and QC manager",
        ...PLAN.lead,
        pay: { askId: "go-ask-pay", fieldId: "go-fld-pay-lead" },
      },
    ],
    burden: [
      {
        id: "go-b-fica",
        label: "Social Security and Medicare",
        from: { kind: "law", rate: 7.65, text: "The employer share set by federal law." },
      },
      {
        id: "go-b-hw",
        label: "Health and welfare",
        from: {
          kind: "per-hour",
          amount: HW,
          text: "Wage determination amount for every paid hour.",
          source: S_WD_HW,
          cashWhen: { askId: "go-ask-hw", choiceId: "hw-cash" },
        },
      },
      {
        id: "go-b-holidays",
        label: "Paid holidays",
        from: {
          kind: "law",
          rate: 4.23,
          text: "Eleven paid holidays in the wage determination: 88 of 2,080 hours a year.",
          source: S_WD_HOLIDAYS,
        },
      },
      {
        id: "go-b-vacation",
        label: "Paid vacation",
        from: {
          kind: "law",
          rate: 3.85,
          text: "Vacation in the wage determination: 2 weeks a year after 1 year.",
          source: S_WD_VACATION,
        },
      },
      {
        id: "go-b-suta",
        label: "Unemployment tax",
        from: { kind: "ask", askId: "go-ask-payroll", fieldId: "go-fld-suta", text: "From your payroll report." },
      },
      {
        id: "go-b-wc",
        label: "Workers' comp",
        from: { kind: "ask", askId: "go-ask-payroll", fieldId: "go-fld-wc", text: "From your payroll report." },
      },
    ],
    lines: [
      {
        id: "go-l-sqft",
        item: "Pressure washing and sandblasting, external facilities and structures, per square foot",
        unit: "per square foot",
        qty: SQ_FT,
        qtySource: doc(
          SHEET,
          "Attachment 2, row 5, CLIN 0001",
          "CLIN 0001",
          `0001 PRESSURE WASHING AND SANDBLASTING, EXTERNAL FACILITIES AND STRUCTURES, PER SQUARE FOOT. ESTIMATED QUANTITY: ${SQ_FT.toLocaleString("en-US")} SQ FT`,
        ),
        laborShare: 1,
      },
    ],
    overhead: {
      askId: "go-ask-pl",
      fieldId: "go-fld-overhead",
      text: "From your 2025 profit and loss statement, as a share of direct cost.",
    },
    profit: { askId: "go-ask-profit", fieldId: "go-fld-profit" },
    contingency: { askId: "go-ask-contingency", fieldId: "go-fld-contingency" },
    otherCosts: [
      {
        id: "go-cost-equip",
        label: "Rigs, fuel, water, chemicals and wash-water recovery",
        yearly: { kind: "ask", askId: "go-ask-equipcost", fieldId: "go-fld-equip", text: "Your yearly equipment costs" },
        inPrice: true,
        commitmentId: "go-c-drains",
      },
      {
        id: "go-cost-blast",
        label: "Sandblasting allowance",
        yearly: { kind: "ask", askId: "go-ask-equipcost", fieldId: "go-fld-blast", text: "Your sandblasting allowance" },
        inPrice: true,
      },
    ],
    periods: {
      count: OPTION_YEARS,
      label: "Option year",
      escalation: { askId: "go-ask-profit", fieldId: "go-fld-escalation" },
      source: S_PRICE,
    },
    payment: {
      text: "Paid monthly in arrears, within 30 days of a correct invoice. You carry about five weeks of crew pay and fuel before the first payment.",
      source: S_INVOICE,
    },
  },

  forms: [
    {
      id: "go-fm-sf1449",
      name: "SF 1449, Solicitation/Contract/Order for Commercial Products and Commercial Services",
      source: S_SIGN,
      handling: ["ava-fills", "you-sign"],
      signer: "You, as the owner",
      filledFrom: "Your registration details and your price schedule",
    },
    {
      id: "go-fm-reps",
      name: "Representations and certifications, confirmed current in your registration",
      source: S_REPS,
      handling: ["you-sign"],
      signer: "You, as the owner",
    },
  ],

  submission: {
    method: "email",
    where: `By email to ${CO.name}, the Army contracting officer for this quote`,
    account: CO.email,
    source: S_EMAIL,
    limits: "10 MB in total, one file per volume, in one email",
    files: [
      {
        id: "go-pk-tech",
        name: `Volume_I_Technical_Capability_${SHORT_FILE}.pdf`,
        covers: "Volume I, section 3.2",
        contains: [{ kind: "section", id: "go-s-tech" }],
      },
      {
        id: "go-pk-pp",
        name: `Volume_II_Past_Performance_${SHORT_FILE}.pdf`,
        covers: "Volume II, section 3.3",
        contains: [{ kind: "section", id: "go-s-pp" }],
      },
      {
        id: "go-pk-price",
        // The Army's own Excel file, filled in: section 3.4 asks for its format.
        name: `Volume_III_Price_Schedule_${SHORT_FILE}.xlsx`,
        covers: "Volume III, Attachment 2",
        contains: [{ kind: "price", id: "price" }],
      },
      {
        id: "go-pk-forms",
        name: `Signed_Forms_${SHORT_FILE}.pdf`,
        covers: "SF 1449, section 3.5",
        contains: [
          { kind: "form", id: "go-fm-sf1449" },
          { kind: "form", id: "go-fm-reps" },
        ],
      },
    ],
    markings: [
      `Email subject line, word for word: "RFQ ${ID} – ${PERSONA.businessName}"`,
      "Each volume in its own file. The price schedule stays an Excel file, as section 3.4 asks.",
    ],
    checklist: [
      {
        id: "go-ck-internal",
        label: `Internal deadline: ${D(DUE_DAYS - 1)}, 10:00 AM Eastern Time, one day early`,
        auto: true,
      },
      {
        id: "go-ck-qa",
        label: `Send your sandblasting and wage-class questions to ${SPEC.name} before questions close on ${DM(QUESTIONS_DAYS)}`,
      },
      {
        id: "go-ck-sam",
        label: "Check your federal registration is active and your answers are current",
      },
      {
        id: "go-ck-hubzone",
        label: "Start your HUBZone recertification. It is due in 38 days, before the Army is likely to award",
      },
      { id: "go-ck-sign", label: "Sign the SF 1449" },
      { id: "go-ck-reps", label: "Read and sign the representations and certifications statement" },
      { id: "go-ck-subject", label: "Copy the email subject line word for word" },
      { id: "go-ck-email", label: `Email the 4 files to ${CO.name} before 10:00 AM Eastern Time` },
      { id: "go-ck-receipt", label: "Save the sent email as your receipt and upload it here" },
    ],
    certifying: [
      "You are a certified HUBZone small business, and your registration says so.",
      "You are small under the size standard for industry code 561790.",
      "You will pay every service worker at least the wage determination rate, plus health and welfare.",
      "Your registration answers are current and true on the day you sign.",
      "Your price holds for 90 days after the due date, and stays fixed for each year of the contract.",
      "You will pay firms that are not HUBZone-certified no more than half of what the Army pays you for services.",
      "The three jobs in your references happened as described, with those values and dates.",
      "You can keep every promise in the capability write-up.",
    ],
  },

  reviewerFindings: [
    {
      id: "go-rf-blast",
      sectionId: "go-s-tech",
      criterionId: "go-cr-tech",
      quote: "Nothing is blasted without the COR's approval.",
      finding:
        "Section 3.2 asks how approved sandblasting will be done. The section does not say who blasts or with what. An evaluator would rate that part Unacceptable.",
      suggestedFix: "Name the blasting sub and its signed rate, or the blaster you rent and the techs you train.",
      severity: "material",
      askId: "go-ask-blast",
    },
  ],

  addenda: [],

  // Page 1 facts that no other part of the bid carries. A null is a fact the
  // Army's files do not state: page 1 shows "Not stated".
  overview: {
    noticeType: {
      text: "Request for Quote, with the notice and the rules in one document.",
      source: S_TYPE,
    },
    summary: {
      text: "Hot and cold pressure washing of Fort Bragg's buildings, barracks, bridges and tanks, about 377,000 square feet a year, with sandblasting when approved.",
      source: S_SCOPE,
    },
    work: [
      {
        text: "Headquarters buildings, child development centers, offices, barracks, bridges and tanks, at 1,000 to 3,500 psi.",
        source: S_SCOPE,
      },
      { text: "Work comes as demand orders. Priority 1: on site in 2 hours, done in 8.", source: S_ORDERS },
      { text: "Sandblasting in some extreme cases, with the COR's approval, inside the square-foot price.", source: S_BLAST },
      { text: "Child-safe agents at the child development centers.", source: S_CDC },
      { text: "Storm drains kept clear of wash water and debris.", source: S_DRAINS },
      { text: "Primary and backup equipment.", source: S_EQUIP },
    ],
    place: {
      text: "Fort Bragg, Pope Army Airfield, Simmons Army Airfield, Linden Oaks and the outlying training areas.",
      source: S_SCOPE,
    },
    hours: {
      text: "The Project Manager or the QC manager is reachable 7:00 AM to 3:30 PM, Monday to Friday.",
      source: S_PEOPLE,
    },
    staffing: {
      text: "A Project Manager and a QC manager, named in writing. Every worker needs a post access credential.",
      source: S_PEOPLE,
    },
    serviceLevels: {
      text: "A Priority 1 order: on site within 2 hours, finished within 8.",
      source: S_ORDERS,
    },
    outOfScope: null,
    term: {
      text: "One fixed-price contract from 1 January 2027: a 12-month base year, four option years, and up to six more months.",
      source: S_CONTRACT,
    },
    estimatedValue: {
      text: `About ${SQ_FT.toLocaleString("en-US")} square feet a year, the price schedule's estimate.`,
      source: S_EVAL_PRICE,
    },
    penalties: null,
    contact: {
      name: CO.name,
      role: `Contracting officer, ${STORY.office}`,
      email: CO.email,
      source: S_EMAIL,
    },
    questionsChannel: {
      text: `By email to ${SPEC.name}, the contract specialist, by ${D(QUESTIONS_DAYS)} at 12:00 PM Eastern Time.`,
      source: S_QUESTIONS,
    },
    noContact: {
      text: "Do not contact Public Works staff about this quote. Questions go to the contract specialist only.",
      source: S_NO_CONTACT,
    },
    buyerPortal: {
      text: "SAM.gov: the Army posts its answers to questions there, for every bidder.",
      source: S_QUESTIONS,
    },
    dates: [],
    expectedAward: null,
    start: {
      text: "Work starts 1 January 2027, after a post-award conference at Public Works within 10 days of award.",
      source: S_KICKOFF,
    },
    validity: { text: "Quotes stay valid for 90 days after the closing date.", source: S_VALID },
    setAside: {
      text: "Only certified HUBZone small businesses.",
      source: S_SET_ASIDE,
    },
    size: {
      text: "Industry code 561790, other services to buildings. Your registration lists you as small.",
      source: S_SIZE,
    },
    lateRule: { text: "Quotes that arrive after the deadline are not considered.", source: S_DUE },
    subcontracting: {
      text: "Firms that are not HUBZone-certified can get at most half of what the Army pays you for services.",
      source: S_SUBS,
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

export const janitorialAnswers: Record<string, AskAnswer> = {
  "go-ask-hw": { status: "done", at: AT(4), choiceId: "hw-benefits" },
  // At the wage floor, as Grant says: General Maintenance Worker $21.41.
  "go-ask-pay": {
    status: "done",
    at: AT(8),
    values: { "go-fld-pay-tech": GMW_FLOOR, "go-fld-pay-lead": 30 },
  },
  "go-ask-payroll": {
    status: "done",
    at: AT(12),
    fileName: `${SHORT_FILE}_Payroll_Summary.pdf`,
    values: { "go-fld-suta": 1.2, "go-fld-wc": 5.5 },
  },
  "go-ask-equipcost": {
    status: "done",
    at: AT(18),
    values: { "go-fld-equip": 22_000, "go-fld-blast": 5_000 },
  },
  "go-ask-pl": {
    status: "done",
    at: AT(24),
    fileName: `${SHORT_FILE}_Profit_and_Loss_2025.pdf`,
    values: { "go-fld-overhead": 8 },
  },
  "go-ask-contingency": { status: "done", at: AT(26), values: { "go-fld-contingency": 2 } },
  "go-ask-profit": { status: "done", at: AT(30), values: { "go-fld-profit": 6, "go-fld-escalation": 2.5 } },
  "go-ask-ref1": { status: "done", at: AT(34) },
  "go-ask-ref2": { status: "done", at: AT(35) },
  "go-ask-ref3": { status: "done", at: AT(36) },
  "go-ask-refcontacts": {
    status: "done",
    at: AT(40),
    values: {
      "go-fld-ref1-phone": REFERENCE_CONTACTS.tamikaRaynor.phone,
      "go-fld-ref1-email": REFERENCE_CONTACTS.tamikaRaynor.email,
      "go-fld-ref2-phone": REFERENCE_CONTACTS.janelleHardee.phone,
      "go-fld-ref2-email": REFERENCE_CONTACTS.janelleHardee.email,
      "go-fld-ref3-phone": REFERENCE_CONTACTS.deniseAutry.phone,
      "go-fld-ref3-email": REFERENCE_CONTACTS.deniseAutry.email,
    },
  },
  // The three questions. His answers when he gives them: he is the PM with
  // Keisha as QC manager, a blasting sub at a signed rate, and rig 2 kept on
  // post on weekdays (Grant's and Diana's advice).
  "go-ask-pm": { status: "done", at: AT(50), choiceId: "pm-owner" },
  "go-ask-blast": { status: "done", at: AT(51), choiceId: "blast-sub" },
  "go-ask-backup": { status: "done", at: AT(52), choiceId: "backup-post" },
};

/** The three questions the story says wait on him, in Ava's order. */
export const HERO_OPEN = ["ask:go-ask-pm", "ask:go-ask-blast", "ask:go-ask-backup"];

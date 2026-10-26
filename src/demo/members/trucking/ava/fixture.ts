// Ava fixture · Supply and linen runs for the Fayetteville VA (federal).
// DEMO: the trucking company's hero bid (src/demo/members/trucking).
//
// A VA Request for Quote: a combined synopsis and solicitation for commercial
// services on the SF 1449, set aside for service-disabled veteran-owned small
// businesses. Best value: the technical approach counts most, then past
// performance, then price. A base year and four option years, all firm fixed
// price, so five years of diesel are priced today. Wages are not her risk: a
// new wage determination with an option year adjusts the price.
//
// THE STORY (demo-storyboard/trucking-pack.md, sections 3, 7 and 8): two daily
// box-truck routes, Monday to Friday, about 400 miles a day, out of the
// Fayetteville VA Medical Center warehouse: clean linen and supplies out to the
// Fayetteville clinic and the Sanford, Goldsboro, Jacksonville, Wilmington and
// Brunswick sites, soiled linen and returns back. Lift gates, GPS, bonded
// drivers who pass VA background checks, and a named PM and Alternate. The
// price schedule asks for a "hazardous material license number", and no driver
// of hers holds a hazmat endorsement. Tanya Merritt (Rockfish Run Freight) has
// four box trucks. Every quotation below is the demo's own wording, inside a
// doc() call. The wage rates follow the pack's reading of wage determination
// 2015-4377; treat them as sample values for this demo. No section numbers
// from the federal rulebook are cited.
//
// THIS BID IS ALREADY IN PROGRESS (start.ts): three questions wait on her (the
// pack, section 8): her PM and Alternate, which trucks run the routes, and how
// the quote answers the license line. Her fuel question went to VA yesterday.
//
// The member is always the trucking company: this file reads her own records
// (../persona.ts), not the active member's, so the bid reads the same whichever
// story the demo opens on.

import { buyerPeople } from "../../../ava/contacts";
import { getGrantBrief } from "../../../story/grantBriefs";
import { getOpportunity } from "../../../story/opportunities";
import { PLACES } from "../../../story/places";
import type { PastPerformance } from "../../../story/persona";
import { confirmed, doc, profile, sam, yourDoc } from "../../../../lib/ava/build";
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
const QUESTIONS_DAYS = briefDay("Q&A closes");
const POSTED = -STORY.postedDaysAgo;
/** The contracting officer the opportunity page names takes the quotes; the
 *  contract specialist beside her takes the questions. */
const { primary: CO, second: SPEC } = buyerPeople(ID);
/** Miles from her yard to the VA warehouse. */
const MILES = PLACES[STORY.place].milesFromBase;
const OPTION_YEARS = 4;
const WEEKS = 52;
/** Weekdays in a year, less the 11 federal holidays. */
const ROUTE_DAYS = 249;
const ROUTE_1_MILES = 170;
const ROUTE_2_MILES = 230;
const MPG = 8;
/** Her diesel base price, the one her quote states (her answer below). */
const DIESEL = 3.85;
/** The fidelity bond on every driver (her answer below). */
const DRIVER_BOND = 25_000;

// ─── Her past jobs, from the story ───

function pastJob(id: PastPerformance["id"]): PastPerformance {
  const job = PAST_PERFORMANCE.find((p) => p.id === id);
  if (!job) throw new Error(`The trucking story has no past job ${id}`);
  return job;
}

const JOB_BRAGG = pastJob("pp-bragg-trailer-hauling");
const JOB_QUARRY = pastJob("pp-quarry-lane-routes");
const JOB_NCDOT = pastJob("pp-ncdot-storm-hauling");
const JOB_CYPRESS = pastJob("pp-cypress-bend-reefer");

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
/** Her short name as a file name: "Rockfish_Run_Freight". */
const SHORT_FILE = PERSONA.businessShortName.replace(/\s+/g, "_");

/** Her Fort Bragg order, the one federal prime on her record (the pack, section 2). */
const BRAGG_ORDER = "W9124725PA044";
const BRAGG_FILE = `Fort_Bragg_Order_${BRAGG_ORDER}.pdf`;

// ─── The people on this job (fictional) ───

const OWNER = `${PERSONA.ownerName}, ${PERSONA.ownerTitle.toLowerCase()}`;
const DISPATCHER = "Keisha Rowland";
const REF_BRAGG = {
  name: "Calvin Strickland",
  title: "Contracting Officer's Representative, 18th Airborne Corps G-4",
};
const REF_QUARRY = { name: JOB_QUARRY.referenceName!, title: JOB_QUARRY.referenceTitle! };
const REF_NCDOT = { name: JOB_NCDOT.referenceName!, title: JOB_NCDOT.referenceTitle! };

/** Her references' phone and email: one each, whichever bid asks. */
export const REFERENCE_CONTACTS = {
  renataBostic: { phone: "(910) 555-0142", email: "rbostic@quarrylanemedical.example" },
  calvinStrickland: { phone: "(910) 555-0158", email: "calvin.strickland@army.mil.example" },
  dwayneLockhart: { phone: "(910) 555-0129", email: "dlockhart@ncdot.gov.example" },
} as const;

// ─── The buyer's files ───

const RFQ = "rr-f-rfq";
const PWS = "rr-f-pws";
const SHEET = "rr-f-price";
const WD = "rr-f-wd";

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
  "This acquisition is set aside 100% for Service-Disabled Veteran-Owned Small Business (SDVOSB) concerns. The Offeror must be certified by the SBA and listed as an SDVOSB in the VetCert database at the time it submits its quote and at award.",
);
const S_SIZE = doc(
  RFQ,
  "Section 1.2, page 1",
  "§1.2",
  "The NAICS code for this acquisition is 484110, General Freight Trucking, Local. The Offeror must be small under the size standard for this code.",
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
  "Offerors shall not contact Logistics or Environmental Management Service staff about this requirement. All communication shall go through the Contract Specialist.",
);
const S_VALID = doc(
  RFQ,
  "Section 1.6, page 2",
  "§1.6",
  "Quotes shall remain valid for 60 calendar days after the closing date.",
);
const S_CONTRACT = doc(
  RFQ,
  "Section 2.1, page 4",
  "§2.1",
  "The Government intends to award a single Firm-Fixed-Price contract with a 12-month base period and four 12-month option periods.",
);
const S_FIXED = doc(
  RFQ,
  "Section 2.2, page 4",
  "§2.2",
  "Prices for each period are firm. The Government will not adjust any price for changes in the cost of fuel during a period.",
);
const S_WAGE_ADJ = doc(
  RFQ,
  "Section 2.3, page 4",
  "§2.3",
  "When an option is exercised and a new wage determination applies, the contract price will be adjusted for the increase in wages and fringe benefits that the new wage determination requires.",
);
const S_SIGN = doc(
  RFQ,
  "Section 3.1, page 14",
  "§3.1",
  "Offerors shall complete and sign blocks 12, 17a, 30a, 30b and 30c of the SF 1449.",
);
const S_TECH = doc(
  RFQ,
  "Section 3.2, page 14",
  "§3.2",
  "Volume I, Technical Approach, shall not exceed five (5) pages. It shall describe how the Offeror will run both routes every business day, the vehicles assigned and the backup vehicle, how clean and soiled linen are kept apart, and the staffing, including the Project Manager and the Alternate.",
);
const S_PP = doc(
  RFQ,
  "Section 3.3, page 15",
  "§3.3",
  "Volume II, Past Performance, has no page limit. Provide at least two (2) and no more than three (3) references for similar transportation services performed within the past five (5) years, and complete Attachment 4 for each, including a point of contact with current telephone number and email.",
);
const S_PRICE = doc(
  RFQ,
  "Section 3.4, page 15",
  "§3.4",
  "Volume III, Price, shall be the completed Attachment 2, Price Schedule, in its Excel format. Enter a unit price for every CLIN for the base period and each option period, and complete every field on the schedule.",
);
const S_REPS = doc(
  RFQ,
  "Section 3.5, page 16",
  "§3.5",
  "Offerors shall confirm that their representations and certifications in SAM are current and accurate, and complete any provision in this RFQ that is not covered in SAM.",
);
const S_EMAIL = doc(
  RFQ,
  "Section 3.6, page 16",
  "§3.6",
  `Quotes shall be emailed to ${CO.email} with the subject line: RFQ ${ID} – [Offeror Name]. Each volume shall be a separate file. Total attachments shall not exceed 10 MB.`,
);
const S_AWARD = doc(
  RFQ,
  "Section 4.1, page 17",
  "§4.1",
  "Award will be made to the responsible Offeror whose quote represents the best value to the Government. Technical Approach is more important than Past Performance. Technical Approach and Past Performance, combined, are more important than Price.",
);
const S_EVAL_TECH = doc(
  RFQ,
  "Section 4.2(a), page 17",
  "§4.2(a)",
  "Technical Approach will be evaluated on the Offeror's plan to complete both routes on time every business day, the vehicles and backup vehicle assigned, and the staffing plan.",
);
const S_EVAL_PP = doc(
  RFQ,
  "Section 4.2(b), page 17",
  "§4.2(b)",
  "Past Performance will be evaluated for relevance and quality, based on the references for similar transportation services performed within the past five (5) years.",
);
const S_EVAL_PRICE = doc(
  RFQ,
  "Section 4.2(c), page 18",
  "§4.2(c)",
  "Price will be evaluated by adding the extended prices for all CLINs in the base period and all option periods.",
);
const S_SAM = doc(
  RFQ,
  "Section 5.2, page 20",
  "§5.2",
  "An Offeror shall be registered in SAM when submitting an offer or quotation, and shall continue to be registered until time of award, during performance, and through final payment.",
);
const S_SUBS = doc(
  RFQ,
  "Section 5.3, page 21",
  "§5.3",
  "The Contractor will not pay more than 50 percent of the amount paid by the Government for services to firms that are not certified SDVOSBs.",
);
const S_INVOICE = doc(
  RFQ,
  "Section 5.4, page 21",
  "§5.4",
  "Invoices shall be submitted monthly, in arrears, through the VA Financial Services Center electronic invoicing portal. Payment will be made within 30 days after receipt of a proper invoice.",
);
const S_INSURANCE = doc(
  RFQ,
  "Section 5.5, page 22",
  "§5.5",
  "Before starting work, the Contractor shall have automobile liability insurance of at least $1,000,000 combined single limit, cargo insurance, and workers' compensation as required by State law.",
);
const S_SCA = doc(
  RFQ,
  "Section 5.6, page 22",
  "§5.6",
  "The Contractor shall pay service employees not less than the wage rates and fringe benefits in the Wage Determination at Attachment 3.",
);
const S_REF_FORM = doc(
  RFQ,
  "Attachment 4, page 27",
  "Att. 4",
  "PAST PERFORMANCE REFERENCE FORM. Complete one form per reference. Point of contact name, title, telephone number and email address are required.",
);

const S_SCOPE = doc(
  PWS,
  "Section 2.1, page 2",
  "PWS 2.1",
  "The Contractor shall pick up clean linen and supplies at the Fayetteville VA Medical Center warehouse, deliver them to the sites in Section 2.2, and return soiled linen, empty carts and returns to the warehouse, Monday through Friday, except federal holidays.",
);
const S_ROUTES = doc(
  PWS,
  "Section 2.2, page 2",
  "PWS 2.2",
  "Route 1: Fayetteville Health Care Center, Sanford and Goldsboro. Route 2: Jacksonville, Wilmington and Brunswick. Each route shall be run by its own vehicle every business day.",
);
const S_TIMES = doc(
  PWS,
  "Section 2.3, page 3",
  "PWS 2.3",
  "Vehicles shall depart the warehouse no later than 6:30 AM and return no later than 3:30 PM. A late or missed delivery shall be reported to the COR within 30 minutes.",
);
const S_TRUCKS = doc(
  PWS,
  "Section 3.1, page 4",
  "PWS 3.1",
  "Each route vehicle shall be an enclosed box truck of at least 24 feet with a hydraulic lift gate, able to carry 16 linen carts. The Contractor shall have a backup vehicle of the same type available within 2 hours.",
);
const S_GPS = doc(
  PWS,
  "Section 3.2, page 4",
  "PWS 3.2",
  "Each vehicle shall have GPS tracking. The Contractor shall give the COR access to each vehicle's location during the route.",
);
const S_LINEN = doc(
  PWS,
  "Section 3.3, page 5",
  "PWS 3.3",
  "Clean and soiled linen shall never be carried in the same compartment unless separated by a fixed barrier. Soiled linen shall be carried in closed carts provided by the Government.",
);
const S_PM = doc(
  PWS,
  "Section 4.1, page 6",
  "PWS 4.1",
  "The Contractor shall provide a Project Manager and an Alternate, named in writing, who shall be available to the COR from 6:00 AM to 6:00 PM, Monday through Friday, except federal holidays.",
);
const S_DRIVERS = doc(
  PWS,
  "Section 4.2, page 6",
  "PWS 4.2",
  "All drivers shall hold a valid commercial or state license for the vehicle driven, be bonded, and pass a VA background check before working on VA property.",
);
const S_KICKOFF = doc(
  PWS,
  "Section 5.1, page 7",
  "PWS 5.1",
  "The Contractor shall attend a kickoff meeting at the Fayetteville VA Medical Center within ten (10) days after award.",
);

const S_LICENSE = doc(
  SHEET,
  "Attachment 2, row 3",
  "Att. 2 row 3",
  "HAZARDOUS MATERIAL LICENSE NUMBER: ____________",
);

const S_WD_HEAVY = doc(WD, "Revision 33, page 7", "WD 31363", "31363 - Truckdriver, Heavy 24.03");
const S_WD_RATES = doc(
  WD,
  "Revision 33, page 7, occupation list",
  "WD Rev 33",
  "31361 - Truckdriver, Light 18.83 | 31362 - Truckdriver, Medium 20.11 | 31363 - Truckdriver, Heavy 24.03",
);
const S_WD_HW = doc(
  WD,
  "Revision 33, page 9",
  "WD H&W",
  "HEALTH & WELFARE: $5.92 per hour, up to 40 hours per week, or $236.80 per week or $1,026.13 per month",
);
const S_WD_VACATION = doc(
  WD,
  "Revision 33, page 9",
  "WD vacation",
  "VACATION: 2 weeks paid vacation after 1 year of service with a contractor or successor, 3 weeks after 8 years, and 4 weeks after 20 years.",
);
const S_WD_HOLIDAYS = doc(
  WD,
  "Revision 33, page 9",
  "WD holidays",
  "HOLIDAYS: A minimum of eleven paid holidays per year: New Year's Day, Martin Luther King Jr.'s Birthday, Washington's Birthday, Memorial Day, Juneteenth, Independence Day, Labor Day, Columbus Day, Veterans' Day, Thanksgiving Day, and Christmas Day.",
);

// ─── Her own record ───
// Four kinds of source, one chip each in her bid (BidText.tsx): SAM.gov, Your
// profile, Your file (a document she gave GovPreneurs) and Your answer.

const QUARRY_AT = "Your jobs list: Daily box-truck routes to 14 clinics";
const NCDOT_AT = "Your jobs list: On-call storm-work hauling, NCDOT Division 6";
const BRAGG_AT = "Your jobs list: On-call trailer and container hauling, 18th Airborne Corps";

const P_SAM_SDVOSB: Proof = sam(
  "Business types",
  "Service-Disabled Veteran-Owned Small Business, certified by the SBA (VetCert)",
);
const P_SAM_ADDRESS: Proof = sam("Physical address", PERSONA.physicalAddress);
const P_OWNER: Proof = profile("Your strengths", PERSONA.differentiators[0]);
const P_FLEET: Proof = profile("Your strengths", PERSONA.differentiators[1]);
const P_DISPATCH: Proof = profile("Your strengths", PERSONA.differentiators[2]);
const P_YARD: Proof = profile("Your truck yard", PERSONA.kitchen ?? "");
const P_STAFF: Proof = profile("Your company size", `People on staff: ${PERSONA.employeesW2}`);
const P_YEARS: Proof = profile("Company details", `Formed ${PERSONA.formedOn}. ${PERSONA.yearsInBusiness} years in business.`);
const P_DIESEL: Proof = confirmed("Your answer: fuel for each route", `Diesel base price: $${DIESEL} a gallon`);

const P_QUARRY_SCOPE: Proof = profile(QUARRY_AT, JOB_QUARRY.scopeDescription);
const P_QUARRY_TERMS: Proof = profile(
  QUARRY_AT,
  `Since ${longDate(JOB_QUARRY.periodStart)}. ${money(JOB_QUARRY.totalValue)} a year.`,
);
const P_QUARRY_REF: Proof = profile(QUARRY_AT, `Reference: ${REF_QUARRY.name}, ${REF_QUARRY.title}.`);

const P_BRAGG_SCOPE: Proof = yourDoc(BRAGG_FILE, "Statement of work, page 2", JOB_BRAGG.scopeDescription);
const P_BRAGG_TERMS: Proof = yourDoc(
  BRAGG_FILE,
  "Page 1, blocks 2 and 20",
  `Order ${BRAGG_ORDER}. ${longDate(JOB_BRAGG.periodStart)} to ${longDate(JOB_BRAGG.periodEnd)}. Total ${money(JOB_BRAGG.totalValue)}.`,
);
const P_BRAGG_ROLE: Proof = yourDoc(BRAGG_FILE, "Page 1, block 17a", `Contractor: ${PERSONA.businessName}`);
const P_BRAGG_COR: Proof = yourDoc(
  BRAGG_FILE,
  "Page 3, contract administration",
  `Contracting Officer's Representative: ${REF_BRAGG.name}, ${REF_BRAGG.title}`,
);
const P_BRAGG_RATING: Proof = profile(BRAGG_AT, "Performance rating (CPARS): not written yet");

const P_NCDOT_SCOPE: Proof = profile(NCDOT_AT, JOB_NCDOT.scopeDescription);
const P_NCDOT_TERMS: Proof = profile(
  NCDOT_AT,
  `${longDate(JOB_NCDOT.periodStart)} to ${longDate(JOB_NCDOT.periodEnd)}. Total value ${money(JOB_NCDOT.totalValue)}.`,
);
const P_NCDOT_REF: Proof = profile(NCDOT_AT, `Reference: ${REF_NCDOT.name}, ${REF_NCDOT.title}.`);

// ─── The staffing plan: the price pays for these hours ───
// Two route drivers, a relief driver for sick days and vacation, and the PM
// and the Alternate. Paid hours in a contract week, 52 weeks a year.

const PLAN = {
  drivers: { count: 2, hoursPerWeek: 40 },
  relief: { count: 1, hoursPerWeek: 6 },
  lead: { count: 2, hoursPerWeek: 2 },
};
const PLAN_HOURS = Object.values(PLAN).reduce((n, r) => n + r.count * r.hoursPerWeek, 0);
const DRIVER_FLOOR = 24.03;

// ─── The three questions that wait on her (the pack, section 8) ───

const PM_TEXT = {
  "pm-owner": `${OWNER}, is the Project Manager. ${DISPATCHER}, the company's dispatcher, is the Alternate`,
  "pm-dispatcher": `${DISPATCHER}, the company's dispatcher, is the Project Manager. ${OWNER}, is the Alternate`,
  "pm-hire":
    "The company will hire a Project Manager after award, and will name the Project Manager and the Alternate in writing before work starts",
};
const TRUCK_TEXT = {
  "trucks-spare":
    "Two of the company's 26-foot box trucks run the routes, one each, and its third box truck stands by at the yard as the backup",
  "trucks-rent":
    "Two of the company's 26-foot box trucks run the routes, one each. A rental box truck with a lift gate, under a standing agreement, is the backup",
  "trucks-lease":
    "The company will lease two new 26-foot box trucks with lift gates for the routes, and one of its own box trucks is the backup",
};
const LICENSE_TEXT = {
  "lic-state":
    "No hazardous material is carried. Every driver holds the license the truck needs, and the company asked VA in writing which license the price schedule's hazardous material line means",
  "lic-wait":
    "The company asked VA in writing which license the price schedule's hazardous material line means, and will complete that line as VA's answer directs",
  "lic-exception": "The company takes exception to the hazardous material license line",
};

/** The sentence that proves she runs this work today. */
const LEAD_QUARRY = `Since ${pastYear(JOB_QUARRY.periodStart)}, the company's two box trucks have run supplies to 14 clinics every weekday and brought returns back`;

// ─── The bid ───

export const truckingBid: AvaBid = {
  noticeId: ID,
  // The story owns the title, the buyer and the number (lib/ava/fixtures/index.ts).
  officialTitle: STORY.title,
  buyer: STORY.agency,
  bidNumber: ID,
  kind: "short-response",
  kindReason: "A five-page technical approach, three references and VA's Excel price schedule, plus two forms.",

  files: [
    {
      id: RFQ,
      name: `${ID}_Combined_Synopsis_Solicitation.pdf`,
      role: "main",
      pages: 28,
      postedDaysFromNow: POSTED,
      readability: "read",
    },
    {
      id: PWS,
      name: "Attachment_1_Performance_Work_Statement.pdf",
      role: "exhibit",
      pages: 10,
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
      id: WD,
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
    method: "best-value",
    source: S_AWARD,
    criteria: [
      {
        id: "rr-cr-tech",
        name: "Technical approach",
        points: null,
        kind: "scored-writing",
        source: S_EVAL_TECH,
        treatment: "Counts most. The routes, the trucks, the backup and the staffing plan are read closely.",
      },
      {
        id: "rr-cr-pp",
        name: "Past performance on similar work",
        points: null,
        kind: "scored-fact",
        source: S_EVAL_PP,
        treatment: "Counts second. Two or three similar jobs from the last five years.",
      },
      {
        id: "rr-cr-price",
        name: "Price",
        points: null,
        kind: "price-formula",
        source: S_EVAL_PRICE,
        treatment: "Counts least. All five years are added up.",
      },
    ],
    note: "No points. VA weighs your writing and your record against your price.",
  },

  hardRequirements: [
    {
      id: "rr-r-sdvosb",
      grantRow: "gt-sdvosb",
      group: "eligibility",
      label: "Certified service-disabled veteran-owned small business when you quote, and at award",
      source: S_SET_ASIDE,
      initial: "meets",
      evidence: "Your registration lists you as a certified service-disabled veteran-owned small business.",
    },
    {
      id: "rr-r-sam",
      grantRow: "gt-sam",
      group: "eligibility",
      label: "Active federal registration when you quote, and through award",
      source: S_SAM,
      initial: "meets",
      evidence: `Your registration is active until ${SAM_UNTIL}.`,
    },
    {
      id: "rr-r-size",
      grantRow: "gt-size",
      group: "eligibility",
      label: "Small under the size standard for local freight trucking",
      source: S_SIZE,
      initial: "meets",
      evidence: `Your registration lists you as small for industry code ${PERSONA.primaryNaics}.`,
    },
    {
      id: "rr-r-sca",
      group: "pricing",
      label: "Pay the drivers at least $24.03 an hour, plus $5.92 an hour for health and welfare",
      source: S_SCA,
      initial: "confirm",
      askId: "rr-ask-pay",
      askIds: ["rr-ask-hw"],
      afterAsk: "meets",
      evidenceAfter: "Your pay rates, checked against the wage determination",
    },
    {
      id: "rr-r-license",
      grantRow: "gt-license",
      group: "forms",
      // The license is a driver's, needed once the routes run. The quote's
      // line is answered by the same question, with the bid.
      neededAt: "work-start",
      label: "A hazardous material license number on the price schedule",
      source: S_LICENSE,
      initial: "confirm",
      askId: "rr-ask-license",
      evidenceAfter: "Your quote answers the license line",
    },
    {
      id: "rr-r-pm",
      grantRow: "gt-pm",
      group: "people",
      // The work statement wants them reachable once work starts. The
      // technical approach names them, so the ask is asked with the bid.
      neededAt: "work-start",
      label: "A named PM and Alternate, reachable 6:00 AM to 6:00 PM on weekdays",
      source: S_PM,
      initial: "confirm",
      askId: "rr-ask-pm",
      evidenceAfter: "Your quote names your PM and your Alternate",
    },
    {
      id: "rr-r-trucks",
      group: "writing",
      neededAt: "work-start",
      label: "A box truck with a lift gate on each route every weekday, and a backup within 2 hours",
      source: S_TRUCKS,
      initial: "confirm",
      askId: "rr-ask-trucks",
      evidenceAfter: "Your quote names the trucks and the backup",
    },
    {
      id: "rr-r-bond",
      grantRow: "gt-bond",
      group: "people",
      neededAt: "work-start",
      label: "Bonded drivers who pass a VA background check",
      source: S_DRIVERS,
      initial: "confirm",
      askId: "rr-ask-bond",
      evidenceAfter: `Your ${money(DRIVER_BOND)} fidelity bond covers every driver`,
    },
    {
      id: "rr-r-insurance",
      group: "insurance",
      neededAt: "work-start",
      label: "Auto liability of at least $1,000,000 and cargo insurance, before work starts",
      source: S_INSURANCE,
      initial: "meets",
      evidence: "Your $1M auto liability and $100,000 cargo policies are on file.",
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
      summary: "Only certified service-disabled veteran-owned small businesses may quote.",
      source: S_SET_ASIDE,
      requirementId: "rr-r-sdvosb",
    },
    { topic: "bonds", found: false, summary: "No bid, performance or payment bond asked for." },
    {
      topic: "insurance",
      found: true,
      summary: "Auto liability of $1M and cargo insurance before work starts. Your policies meet it.",
      source: S_INSURANCE,
      requirementId: "rr-r-insurance",
    },
    {
      topic: "wages",
      found: true,
      summary: "Service Contract Act pay floors for the drivers, plus $5.92 an hour for health and welfare.",
      source: S_SCA,
      requirementId: "rr-r-sca",
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
      summary: "Two or three similar jobs from the last five years, and a hazardous material license number on the price schedule.",
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
      summary: "Every driver is bonded and passes a VA background check before working on VA property.",
      source: S_DRIVERS,
      requirementId: "rr-r-bond",
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
      id: "rr-c-routes",
      text: "Both routes every weekday except federal holidays: clean linen and supplies out, soiled linen, carts and returns back.",
      source: S_SCOPE,
      pricedAs: `Priced as: a driver for each route, ${PLAN.drivers.hoursPerWeek} hours a week, and the fuel for ${ROUTE_DAYS} route days a year.`,
      needsApproval: true,
    },
    {
      id: "rr-c-times",
      text: "Each truck leaves the warehouse by 6:30 AM and is back by 3:30 PM. A late stop is reported to VA within 30 minutes.",
      source: S_TIMES,
      pricedAs: "Priced as: an 8-hour paid day for each route driver.",
      needsApproval: true,
    },
    {
      id: "rr-c-gps",
      text: "GPS on every route truck, with VA able to see each truck during the route.",
      source: S_GPS,
      pricedAs: "Priced as: part of your yearly truck costs.",
      needsApproval: true,
    },
    {
      id: "rr-c-linen",
      text: "Clean and soiled linen never share a compartment. Soiled linen rides in VA's closed carts.",
      source: S_LINEN,
      pricedAs: "Priced as: part of each route day.",
      needsApproval: true,
    },
    {
      id: "rr-c-hours",
      text: "The PM or the Alternate answers VA from 6:00 AM to 6:00 PM, Monday to Friday.",
      source: S_PM,
      pricedAs: `Priced as: ${PLAN.lead.hoursPerWeek} hours a week each for the PM and the Alternate. Dispatch already runs 5 AM to 9 PM.`,
      needsApproval: true,
    },
    {
      id: "rr-c-price",
      text: "Prices fixed for each year of the contract. They hold even if diesel rises.",
      source: S_FIXED,
      pricedAs: `Priced as: diesel at your base price of $${DIESEL} a gallon, with your yearly increase in each option year.`,
      needsApproval: false,
    },
  ],

  contractTerms: [
    {
      text: "Fixed price for each year. If diesel rises during a year, your price stays the same.",
      source: S_FIXED,
    },
    {
      text: `About ${(ROUTE_DAYS * (ROUTE_1_MILES + ROUTE_2_MILES)).toLocaleString("en-US")} miles a year. At ${MPG} miles a gallon, every 50-cent rise in diesel costs you about $6,000 a year. You asked VA for a fuel adjustment.`,
      source: S_FIXED,
    },
    {
      text: "Wages are not your risk. When a new wage determination comes with an option year, VA adjusts the price for it.",
      source: S_WAGE_ADJ,
    },
    {
      text: "A 12-month base year, then four 12-month option years VA may choose to use.",
      source: S_CONTRACT,
    },
    {
      text: "You price every option year now. Ava adds your yearly increase to each line.",
      source: S_PRICE,
    },
    {
      text: "You bill monthly, after the work, through VA's online invoicing portal. You need a free account there before the first invoice.",
      source: S_INVOICE,
    },
    {
      text: "Payment arrives within 30 days of a correct invoice. You carry about two months of fuel and payroll first.",
      source: S_INVOICE,
    },
    { text: "Your prices hold for 60 days after the due date.", source: S_VALID },
    {
      text: "Firms that are not service-disabled veteran-owned may get no more than half of what VA pays you for services.",
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
      label: "Service-disabled veteran-owned small business",
      value: "Certified by the SBA (VetCert)",
      from: "Your federal registration, and Grant's check",
    },
    {
      label: "Main industry code",
      value: `${PERSONA.primaryNaics} ${PERSONA.primaryNaicsLabel}`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Other industry codes",
      value: PERSONA.secondaryNaics
        .slice(0, 3)
        .map((n) => `${n.code} ${n.label}`)
        .join(", "),
      from: "Your GovPreneurs profile",
    },
    {
      label: "Business size",
      value: `Small for industry code ${PERSONA.primaryNaics}`,
      from: "Your GovPreneurs profile",
    },
    { label: "People on staff", value: String(PERSONA.employeesW2), from: "Your GovPreneurs profile" },
    { label: "Truck yard", value: PERSONA.kitchen ?? "", from: "Your GovPreneurs profile" },
    {
      label: "Insurance on file",
      value: "Auto liability $1M combined single limit. Cargo $100,000.",
      from: "Your GovPreneurs profile",
    },
    {
      label: JOB_QUARRY.projectTitle,
      value: `Main contractor since ${pastYear(JOB_QUARRY.periodStart)}, ${money(JOB_QUARRY.totalValue)} a year`,
      from: "Your GovPreneurs profile, jobs list",
    },
    {
      label: JOB_BRAGG.projectTitle,
      value: `Main contractor, ${pastYear(JOB_BRAGG.periodStart)}, ${money(JOB_BRAGG.totalValue)}. Its federal performance rating (CPARS) is not written yet.`,
      from: "Your order file, and your jobs list",
    },
    {
      label: JOB_NCDOT.projectTitle,
      value: `Main contractor, ${pastYear(JOB_NCDOT.periodStart)}, ${money(JOB_NCDOT.totalValue)}`,
      from: "Your GovPreneurs profile, jobs list",
    },
    {
      label: JOB_CYPRESS.projectTitle,
      value: `Since ${pastYear(JOB_CYPRESS.periodStart)}, ${money(JOB_CYPRESS.totalValue)} a year. Not used here: three references are enough, and the clinic routes are the closer match.`,
      from: "Your GovPreneurs profile, jobs list",
    },
  ],

  asks: [
    // ── The three questions that wait on her ──
    {
      id: "rr-ask-pm",
      kind: "answer",
      title: "Your PM and Alternate",
      source: S_PM,
      why: "The work statement asks for a named PM and Alternate, reachable 6:00 AM to 6:00 PM on weekdays. Your profile names no one for this job.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      // The technical approach names them, so she answers with the bid.
      neededAt: "bid",
      group: "people",
      answer: {
        type: "answer",
        question: "Who are your PM and Alternate? One of them must answer VA from 6:00 AM to 6:00 PM on weekdays.",
        choices: [
          {
            id: "pm-owner",
            label: `I am the PM. ${DISPATCHER}, our dispatcher, is the Alternate`,
            consequence: `Ava names you as PM and ${DISPATCHER} as Alternate.`,
          },
          {
            id: "pm-dispatcher",
            label: `${DISPATCHER} is the PM. I am the Alternate`,
            consequence: `Ava names ${DISPATCHER} as PM and you as Alternate.`,
          },
          {
            id: "pm-hire",
            label: "We hire a PM after award",
            consequence: "Ava writes that you name both before work starts, and flags the risk.",
            gives: {
              status: "confirm",
              evidence: "A risk: you plan to hire a PM after award, so your quote names no one yet",
            },
            warn: "That is a risk. VA reads the staffing plan closely, and a quote that names no PM can be rated lower. I wrote that you name both before work starts.",
          },
        ],
      },
      feeds: ["Draft · Staffing", "Hard requirement · PM and Alternate"],
    },
    {
      id: "rr-ask-trucks",
      kind: "answer",
      title: "Which trucks run the routes",
      source: S_TRUCKS,
      why: "Each route needs a box truck with a lift gate every weekday, and a backup within 2 hours. You have four box trucks, and two already run the Quarry Lane routes.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      neededAt: "bid",
      group: "writing",
      answer: {
        type: "answer",
        question: "Which trucks run the two VA routes, and what is the backup?",
        choices: [
          {
            id: "trucks-spare",
            label: "Two of our box trucks, and the third as the spare",
            consequence: "Ava writes one truck per route and your third box truck as the backup.",
          },
          {
            id: "trucks-rent",
            label: "Two of our box trucks. We rent a spare on breakdowns",
            consequence: "Ava writes a rental box truck with a lift gate, under a standing agreement, as the backup.",
          },
          {
            id: "trucks-lease",
            label: "We lease two new trucks on award",
            consequence: "Ava writes two leased trucks for the routes, and flags the cost.",
            warn: "That adds cost. Two leased box trucks run about $30,000 a year, and your truck costs don't carry them yet. Update your truck costs, or the price runs short.",
          },
        ],
      },
      feeds: ["Draft · Trucks", "Hard requirement · Trucks and backup"],
    },
    {
      id: "rr-ask-license",
      kind: "answer",
      title: "How your quote answers the license line",
      source: S_LICENSE,
      why: "The price schedule asks for a hazardous material license number. None of your drivers holds a hazmat endorsement, and the work statement names no hazardous cargo. Grant and Diana say to ask in Q&A.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      neededAt: "bid",
      group: "forms",
      answer: {
        type: "answer",
        question: "The price schedule asks for a hazardous material license number. How should your quote answer that line?",
        choices: [
          {
            id: "lic-state",
            label: "State our licenses and bond, and ask in Q&A",
            consequence: "Ava writes your drivers' licenses and bond, and drafts your question for the contract specialist.",
          },
          {
            id: "lic-wait",
            label: "Wait for VA's answer in Q&A",
            consequence: "Ava writes that you asked, and that the line follows VA's answer.",
            gives: {
              status: "confirm",
              evidence: `You are waiting for VA's answer. Q&A closes on ${D(QUESTIONS_DAYS)}`,
            },
            warn: `Then send your question to ${SPEC.name} before Q&A closes on ${DM(QUESTIONS_DAYS)}. Every bidder sees the answer. Until it comes, your quote says you asked.`,
          },
          {
            id: "lic-exception",
            label: "Take an exception to the license line",
            failsGate:
              "An exception to the license line makes your quote non-compliant. VA can reject a quote that leaves a field on the price schedule unanswered.",
          },
        ],
      },
      feeds: ["Draft · License line", "Hard requirement · License line"],
    },

    // ── Answered before the story starts ──
    {
      id: "rr-ask-pay",
      kind: "enter",
      title: "What you pay each role (2 roles)",
      source: S_WD_RATES,
      why: "The price starts from what you pay. The drivers need to meet their wage floor, or you owe back pay.",
      owner: "bookkeeper",
      leadDays: 2,
      minutes: 10,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "rr-fld-pay-driver",
            label: "Box-truck driver, per hour",
            unit: "usd-hour",
            hint: "What you pay now, before taxes. The relief driver is paid the same.",
            floor: { value: DRIVER_FLOOR, why: "Truckdriver, Heavy, in the wage determination: the safe reading for a 26-foot box truck." },
          },
          {
            id: "rr-fld-pay-lead",
            label: "PM or Alternate, per hour",
            unit: "usd-hour",
            hint: "What you pay now, before taxes. No wage floor: this role manages the work.",
          },
        ],
      },
      feeds: ["Price · Drivers", "Price · PM and Alternate", "Hard requirement · Wage floors"],
    },
    {
      id: "rr-ask-hw",
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
      id: "rr-ask-payroll",
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
            fieldId: "rr-fld-suta",
            label: "Unemployment tax, state and federal",
            value: 1.2,
            unit: "percent",
            where: "Tax summary, page 2",
          },
          {
            fieldId: "rr-fld-wc",
            label: "Workers' comp premium",
            value: 3.8,
            unit: "percent",
            where: "Employer costs, page 3",
          },
        ],
      },
      feeds: ["Price · Unemployment tax", "Price · Workers' comp"],
    },
    {
      id: "rr-ask-bond",
      kind: "approve",
      title: "Your drivers' fidelity bond",
      source: S_DRIVERS,
      why: "The work statement asks for bonded drivers. It does not say how much, so you asked VA.",
      owner: "insurance-agent",
      leadDays: 1,
      minutes: 2,
      // The technical approach states the bond, so it is asked with the bid.
      neededAt: "bid",
      answer: {
        type: "approve",
        proposal: `Use your ${money(DRIVER_BOND)} fidelity bond, which covers every driver?`,
        from: "Your GovPreneurs profile, insurance",
        value: `Fidelity bond, ${money(DRIVER_BOND)} per driver`,
        asOf: "VA has not said what bond amount it wants. Your question asks.",
      },
      feeds: ["Draft · Drivers", "Hard requirement · Bonded drivers"],
    },
    {
      id: "rr-ask-fuel",
      kind: "enter",
      title: "Fuel for each route day, at your diesel base price",
      source: S_FIXED,
      why: "Five fixed-price years and no fuel clause. Your quote states the diesel price your route prices assume. Only you know it.",
      owner: "you",
      leadDays: 0,
      minutes: 10,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "rr-fld-diesel",
            label: "Diesel base price, per gallon",
            unit: "usd",
            hint: "The price your quote states. What you paid on average over the last three months is a fair start.",
          },
          {
            id: "rr-fld-fuel-r1",
            label: "Fuel for Route 1, per day",
            unit: "usd",
            hint: `About ${ROUTE_1_MILES} miles: at ${MPG} miles a gallon, about ${Math.round(ROUTE_1_MILES / MPG)} gallons.`,
          },
          {
            id: "rr-fld-fuel-r2",
            label: "Fuel for Route 2, per day",
            unit: "usd",
            hint: `About ${ROUTE_2_MILES} miles: at ${MPG} miles a gallon, about ${Math.round(ROUTE_2_MILES / MPG)} gallons.`,
          },
        ],
      },
      feeds: ["Price · Fuel, Route 1", "Price · Fuel, Route 2", "Draft · Fuel"],
    },
    {
      id: "rr-ask-truckcost",
      kind: "enter",
      title: "What the route trucks cost you a year",
      source: S_TRUCKS,
      why: "Insurance, tires, repairs, GPS and wear on the two route trucks and the backup. Your records know it; Ava doesn't guess.",
      owner: "bookkeeper",
      leadDays: 2,
      minutes: 10,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "rr-fld-truck-cost",
            label: "Yearly cost of the route trucks and the backup",
            unit: "usd",
            hint: "Insurance, tires, repairs, GPS and payments or depreciation. Leave out fuel.",
          },
        ],
      },
      feeds: ["Price · Truck costs"],
    },
    {
      id: "rr-ask-pl",
      kind: "upload",
      title: "Your 2025 profit and loss statement",
      source: S_PRICE,
      why: "Ava works out your overhead from it: the yard, dispatch, office and insurance costs.",
      owner: "bookkeeper",
      leadDays: 3,
      minutes: 10,
      answer: {
        type: "upload",
        accepts: "Your 2025 profit and loss statement, from your bookkeeper",
        extracts: [
          {
            fieldId: "rr-fld-overhead",
            label: "Overhead, as a share of direct cost",
            value: 6,
            unit: "percent",
            where: "Operating expenses, page 1",
          },
        ],
      },
      feeds: ["Price · Overhead"],
    },
    {
      id: "rr-ask-contingency",
      kind: "enter",
      title: "Your contingency, for costs that run over",
      source: S_PRICE,
      why: "A reserve for costs that come in higher than you planned, such as a repair. Ava never picks it.",
      owner: "you",
      leadDays: 0,
      minutes: 5,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "rr-fld-contingency",
            label: "Contingency, as a percent of cost",
            unit: "percent",
            hint: "Added to labor, fuel, trucks and overhead, before profit. Enter 0 if you want none.",
          },
        ],
      },
      feeds: ["Price · Contingency"],
    },
    {
      id: "rr-ask-profit",
      kind: "enter",
      title: "Your profit, and your yearly increase for the option years",
      source: S_PRICE,
      why: "Ava never picks your margin. Wages are adjusted for you with each new wage determination; your increase covers fuel, tires and repairs.",
      owner: "you",
      leadDays: 1,
      minutes: 15,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          { id: "rr-fld-profit", label: "Profit", unit: "percent", hint: "A share of your total cost." },
          {
            id: "rr-fld-escalation",
            label: "Yearly increase for each option year",
            unit: "percent",
            hint: "For fuel, tires and repairs. Wage increases are added by VA when a new wage determination comes.",
          },
        ],
      },
      feeds: ["Price · Profit", "Price · Option years"],
    },
    {
      id: "rr-ask-ref1",
      kind: "approve",
      title: "Quarry Lane clinic routes as reference 1",
      source: S_PP,
      why: "Daily box-truck routes to 14 clinics, out and back every weekday: the closest match to this job.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use your Quarry Lane clinic routes as reference 1? ${REF_QUARRY.name} is the contact.`,
        from: "Your GovPreneurs profile, jobs list",
        value: `${JOB_QUARRY.projectTitle}. Contact: ${REF_QUARRY.name}`,
      },
      feeds: ["Similar work · Reference 1", "Form · Attachment 4"],
    },
    {
      id: "rr-ask-ref2",
      kind: "approve",
      title: "Fort Bragg hauling order as reference 2",
      source: S_PP,
      why: "Your first federal prime: 46 on-call moves on post for the 18th Airborne Corps.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use your Fort Bragg hauling order as reference 2? ${REF_BRAGG.name}, named in your order, is the contact.`,
        from: "Your order file",
        value: `${JOB_BRAGG.projectTitle}. Contact: ${REF_BRAGG.name}`,
        asOf: "Its federal performance rating (CPARS) is not written yet.",
      },
      feeds: ["Similar work · Reference 2", "Form · Attachment 4"],
    },
    {
      id: "rr-ask-ref3",
      kind: "approve",
      title: "NCDOT Division 6 storm hauling as reference 3",
      source: S_PP,
      why: "Government trucking on call in Cumberland County, as the main contractor.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use your NCDOT Division 6 storm hauling as reference 3? ${REF_NCDOT.name} is the contact.`,
        from: "Your GovPreneurs profile, jobs list",
        value: `${JOB_NCDOT.projectTitle}. Contact: ${REF_NCDOT.name}`,
      },
      feeds: ["Similar work · Reference 3", "Form · Attachment 4"],
    },
    {
      id: "rr-ask-refcontacts",
      kind: "enter",
      title: "Current phone and email for your three references",
      source: S_REF_FORM,
      why: "VA may call them. A wrong number can weaken this part.",
      owner: "references",
      leadDays: 5,
      minutes: 10,
      answer: {
        type: "enter",
        fields: [
          { id: "rr-fld-ref1-phone", label: `${REF_QUARRY.name}, phone`, unit: "phone" },
          { id: "rr-fld-ref1-email", label: `${REF_QUARRY.name}, email`, unit: "email" },
          { id: "rr-fld-ref2-phone", label: `${REF_BRAGG.name}, phone`, unit: "phone" },
          { id: "rr-fld-ref2-email", label: `${REF_BRAGG.name}, email`, unit: "email" },
          { id: "rr-fld-ref3-phone", label: `${REF_NCDOT.name}, phone`, unit: "phone" },
          { id: "rr-fld-ref3-email", label: `${REF_NCDOT.name}, email`, unit: "email" },
        ],
      },
      feeds: ["Form · Attachment 4"],
    },
  ],

  clarifications: [
    {
      id: "rr-clar-fuel",
      title: "Five fixed-price years, and no fuel adjustment",
      checked: "No section of the quote papers or the price schedule adjusts the price for diesel, and none forbids stating a fuel base price.",
      passages: [S_FIXED, S_CONTRACT],
      question:
        "The routes run about 400 miles a day for up to five years, and prices are firm for each period. Will VA add a fuel price adjustment clause? If not, may the quote state the diesel base price its route prices assume?",
      to: `${SPEC.name}, Contract Specialist, ${STORY.office}`,
      channel: "by email only, per Section 1.5",
      kind: "simple-limit",
      meanwhile: `Ava prices fuel at your diesel base price of $${DIESEL} a gallon, and your quote states it.`,
    },
  ],

  plan: [
    {
      id: "rr-p-tech",
      source: S_TECH,
      kind: "scored-item",
      needs: "writing",
      ifMissed: "VA has nothing to judge your approach by.",
      answeredIn: { kind: "section", id: "rr-s-tech", label: "Technical approach" },
    },
    {
      id: "rr-p-trucks",
      source: S_TRUCKS,
      kind: "instruction",
      needs: "writing",
      ifMissed: "An evaluator has to guess which trucks run the routes and what happens on a breakdown.",
      answeredIn: { kind: "section", id: "rr-s-tech", label: "Technical approach" },
      askId: "rr-ask-trucks",
    },
    {
      id: "rr-p-pm",
      source: S_PM,
      kind: "instruction",
      needs: "writing",
      ifMissed: "A staffing plan with no names can be rated lower.",
      answeredIn: { kind: "section", id: "rr-s-tech", label: "Technical approach" },
      askId: "rr-ask-pm",
    },
    {
      id: "rr-p-license",
      source: S_LICENSE,
      kind: "instruction",
      needs: "price",
      ifMissed: "A blank field on the price schedule reads as an incomplete quote.",
      answeredIn: { kind: "price", id: "price", label: "Price schedule" },
      askId: "rr-ask-license",
    },
    {
      id: "rr-p-fuel",
      source: S_FIXED,
      kind: "instruction",
      needs: "price",
      ifMissed: "Five years of diesel at today's price, with nothing in writing about it.",
      answeredIn: { kind: "price", id: "price", label: "Price schedule" },
      clarificationId: "rr-clar-fuel",
    },
    {
      id: "rr-p-pp",
      source: S_PP,
      kind: "scored-item",
      needs: "writing",
      ifMissed: "With fewer than two references, this part cannot be rated.",
      answeredIn: { kind: "section", id: "rr-s-pp", label: "Your three similar jobs" },
      askId: "rr-ask-ref1",
    },
    {
      id: "rr-p-refform",
      source: S_REF_FORM,
      kind: "form",
      needs: "attachment",
      ifMissed: "VA cannot reach your references, so this part is weaker.",
      answeredIn: { kind: "form", id: "rr-fm-refs", label: "Reference forms, Attachment 4" },
      askId: "rr-ask-refcontacts",
    },
    {
      id: "rr-p-price",
      source: S_PRICE,
      kind: "instruction",
      needs: "price",
      ifMissed: "A missing unit price makes the quote incomplete.",
      answeredIn: { kind: "price", id: "price", label: "Price schedule" },
      askId: "rr-ask-profit",
    },
    {
      id: "rr-p-wages",
      source: S_SCA,
      kind: "instruction",
      needs: "price",
      ifMissed: "You owe back pay if any rate is under its wage floor.",
      answeredIn: { kind: "price", id: "price", label: "Price schedule" },
      askId: "rr-ask-pay",
    },
    {
      id: "rr-p-sf1449",
      source: S_SIGN,
      kind: "form",
      needs: "signature",
      ifMissed: "An unsigned quote may be rejected as incomplete.",
      answeredIn: { kind: "form", id: "rr-fm-sf1449", label: "SF 1449, signed by you" },
    },
    {
      id: "rr-p-reps",
      source: S_REPS,
      kind: "form",
      needs: "signature",
      ifMissed: "VA cannot award to a company whose answers are out of date.",
      answeredIn: { kind: "form", id: "rr-fm-reps", label: "Representations and certifications" },
    },
    {
      id: "rr-p-email",
      source: S_EMAIL,
      kind: "logistics",
      needs: "action",
      ifMissed: "A quote with the wrong subject line or over 10 MB may never arrive.",
      answeredIn: { kind: "checklist", id: "rr-ck-email", label: "Checklist: email the quote" },
    },
    {
      id: "rr-p-due",
      source: S_DUE,
      kind: "logistics",
      needs: "action",
      ifMissed: "A quote after 10:00 AM Eastern Time is not considered.",
      answeredIn: { kind: "checklist", id: "rr-ck-internal", label: "Checklist: internal deadline" },
    },
  ],

  themes: [],

  sections: [
    {
      id: "rr-s-tech",
      title: "Technical approach",
      answers: S_TECH,
      criterionId: "rr-cr-tech",
      points: null,
      pageLimit: 5,
      pages: 4,
      // In Grant's order: the routes, the trucks, the linen and the license
      // line, fuel, then the team.
      paragraphs: [
        // 0 · Who does the work, and where it is.
        [
          {
            text: `${PERSONA.businessName} will run VA's two daily supply and linen routes out of the Fayetteville VA Medical Center warehouse. `,
          },
          {
            text: "The company is a certified service-disabled veteran-owned small business",
            claim: { id: "rr-cl-sdvosb", tag: "verified", proof: P_SAM_SDVOSB },
          },
          { text: ", based at " },
          {
            text: PERSONA.physicalAddress.replace(/, NC \d{5}$/, ""),
            claim: { id: "rr-cl-address", tag: "verified", proof: P_SAM_ADDRESS },
          },
          { text: `, ${MILES} miles from the warehouse. ` },
          {
            text: `It has hauled freight in North Carolina since ${PERSONA.formedOn.slice(-4)}`,
            claim: { id: "rr-cl-years", tag: "verified", proof: P_YEARS },
          },
          { text: ", and it is " },
          {
            text: "run by a former Army truck driver",
            claim: { id: "rr-cl-owner", tag: "verified", proof: P_OWNER },
          },
          { text: "." },
        ],
        // 1 · The routes.
        [
          {
            text: "Route 1 serves the Fayetteville Health Care Center, Sanford and Goldsboro. Route 2 serves Jacksonville, Wilmington and Brunswick. ",
          },
          {
            text: "Both run every weekday except federal holidays, with clean linen and supplies out and soiled linen, carts and returns back",
            claim: { id: "rr-cl-routes", tag: "commitment", commitmentId: "rr-c-routes" },
          },
          { text: ". " },
          {
            text: "Each truck leaves the warehouse by 6:30 AM and is back by 3:30 PM, and a late stop is reported to VA within 30 minutes",
            claim: { id: "rr-cl-times", tag: "commitment", commitmentId: "rr-c-times" },
          },
          { text: ". Drivers call dispatch at each stop. " },
          {
            text: LEAD_QUARRY,
            claim: { id: "rr-cl-quarry", tag: "verified", proof: P_QUARRY_SCOPE },
          },
          { text: "." },
        ],
        // 2 · The trucks.
        [
          {
            text: "Two of the company's box trucks run the routes",
            claim: {
              id: "rr-cl-trucks",
              tag: "unsupported",
              askId: "rr-ask-trucks",
              gap: "[NEEDED: which trucks run the routes, and the backup]",
              resolvedText: TRUCK_TEXT["trucks-spare"],
              resolvedByChoice: TRUCK_TEXT,
            },
          },
          { text: ". " },
          {
            text: "The fleet has box trucks with lift gates, dry vans, a reefer and flatbeds",
            claim: { id: "rr-cl-fleet", tag: "verified", proof: P_FLEET },
          },
          { text: ", kept at " },
          {
            text: "the company's truck yard and shop on Gillespie St",
            claim: { id: "rr-cl-yard", tag: "verified", proof: P_YARD },
          },
          { text: ". " },
          {
            text: "Every route truck has GPS, and VA can see each truck during the route",
            claim: { id: "rr-cl-gps", tag: "commitment", commitmentId: "rr-c-gps" },
          },
          { text: ". " },
          {
            text: "Dispatch runs from 5 AM to 9 PM",
            claim: { id: "rr-cl-dispatch", tag: "verified", proof: P_DISPATCH },
          },
          { text: "." },
        ],
        // 3 · The linen, the drivers and the license line.
        [
          {
            text: "Clean and soiled linen never share a compartment, and soiled linen rides in VA's closed carts",
            claim: { id: "rr-cl-linen", tag: "commitment", commitmentId: "rr-c-linen" },
          },
          { text: ". " },
          {
            text: "Every driver is bonded",
            claim: {
              id: "rr-cl-bond",
              tag: "unsupported",
              askId: "rr-ask-bond",
              gap: "[NEEDED: your drivers' bond]",
              resolvedText: `Every driver is covered by the company's ${money(DRIVER_BOND)} fidelity bond, and passes a VA background check before working on VA property`,
            },
          },
          { text: ". " },
          {
            text: "The hazardous material license line is answered here",
            claim: {
              id: "rr-cl-license",
              tag: "unsupported",
              askId: "rr-ask-license",
              gap: "[NEEDED: how your quote answers the license line]",
              resolvedText: LICENSE_TEXT["lic-state"],
              resolvedByChoice: LICENSE_TEXT,
            },
          },
          { text: "." },
        ],
        // 4 · Fuel.
        [
          { text: "Prices are fixed for each year. " },
          {
            text: "Route prices assume diesel at the base price the company states",
            claim: {
              id: "rr-cl-diesel",
              tag: "unsupported",
              askId: "rr-ask-fuel",
              gap: "[NEEDED: your diesel base price]",
              resolvedText: `Route prices assume diesel at $${DIESEL} a gallon`,
              // "{rr-fld-diesel}" is her typed price; the "$" before it is the dollar sign.
              resolvedTemplate: "Route prices assume diesel at ${rr-fld-diesel} a gallon",
            },
          },
          {
            text: ". The company asked VA in writing whether it will add a fuel adjustment.",
          },
        ],
        // 5 · The team: the one staffing plan the price uses.
        [
          {
            text: "The PM and the Alternate are named here",
            claim: {
              id: "rr-cl-pm",
              tag: "unsupported",
              askId: "rr-ask-pm",
              gap: "[NEEDED: your PM and Alternate]",
              resolvedText: PM_TEXT["pm-owner"],
              resolvedByChoice: PM_TEXT,
            },
          },
          { text: ". " },
          {
            text: "One of them answers VA from 6:00 AM to 6:00 PM, Monday to Friday",
            claim: { id: "rr-cl-hours", tag: "commitment", commitmentId: "rr-c-hours" },
          },
          { text: ". " },
          {
            text: `The company has ${PERSONA.employeesW2} people on staff`,
            claim: { id: "rr-cl-staff", tag: "verified", proof: P_STAFF },
          },
          {
            text: `. The routes use ${PLAN_HOURS} paid hours a week: a driver for each route, a relief driver for sick days and vacation, and the PM and the Alternate.`,
          },
        ],
      ],
      // Grant says VA wants the linen on time every day. Only Tanya knows
      // whether her sites sign for their carts.
      decisions: [
        {
          id: "rr-dec-signoff",
          paragraphIndex: 1,
          choice: "Drivers call dispatch at each stop.",
          other: "Drivers call dispatch at each stop, and each site signs for its carts.",
        },
      ],
      challenges: [],
    },
    {
      id: "rr-s-pp",
      title: "Past performance: three similar jobs",
      answers: S_PP,
      criterionId: "rr-cr-pp",
      points: null,
      pageLimit: null,
      pages: 2,
      paragraphs: [
        [
          { text: "Reference 1: " },
          {
            text: `${JOB_QUARRY.projectTitle}, for ${JOB_QUARRY.customerName}, since ${longDate(JOB_QUARRY.periodStart)}, ${money(JOB_QUARRY.totalValue)} a year`,
            claim: { id: "rr-cl-r1-terms", tag: "verified", proof: P_QUARRY_TERMS },
          },
          { text: ". " },
          {
            text: "Two box trucks run supplies to 14 clinics every weekday and bring returns back",
            claim: { id: "rr-cl-r1-scope", tag: "verified", proof: P_QUARRY_SCOPE },
          },
          { text: ". Contact: " },
          {
            text: `${REF_QUARRY.name}, ${REF_QUARRY.title}`,
            claim: { id: "rr-cl-r1-contact", tag: "verified", proof: P_QUARRY_REF },
          },
          { text: "." },
        ],
        [
          { text: "Reference 2: " },
          {
            text: `${JOB_BRAGG.projectTitle}, order ${BRAGG_ORDER}, ${longDate(JOB_BRAGG.periodStart)} to ${longDate(JOB_BRAGG.periodEnd)}, ${money(JOB_BRAGG.totalValue)}`,
            claim: { id: "rr-cl-r2-terms", tag: "verified", proof: P_BRAGG_TERMS },
          },
          { text: ". " },
          {
            text: `${PERSONA.businessShortName} was the prime contractor`,
            claim: { id: "rr-cl-r2-role", tag: "verified", proof: P_BRAGG_ROLE },
          },
          { text: ". " },
          {
            text: "The work was 46 on-call moves of office trailers, containers and generators between unit areas and off-post yards",
            claim: { id: "rr-cl-r2-scope", tag: "verified", proof: P_BRAGG_SCOPE },
          },
          { text: ". " },
          {
            text: "Its federal performance rating (CPARS) is not written yet",
            claim: { id: "rr-cl-r2-rating", tag: "verified", proof: P_BRAGG_RATING },
          },
          { text: ". Contact: " },
          {
            text: `${REF_BRAGG.name}, ${REF_BRAGG.title}`,
            claim: { id: "rr-cl-r2-contact", tag: "verified", proof: P_BRAGG_COR },
          },
          { text: "." },
        ],
        [
          { text: "Reference 3: " },
          {
            text: `${JOB_NCDOT.projectTitle}, ${longDate(JOB_NCDOT.periodStart)} to ${longDate(JOB_NCDOT.periodEnd)}, ${money(JOB_NCDOT.totalValue)}`,
            claim: { id: "rr-cl-r3-terms", tag: "verified", proof: P_NCDOT_TERMS },
          },
          { text: ". " },
          {
            text: "Trucks and drivers on call after storms, hauling debris and road materials in Cumberland County",
            claim: { id: "rr-cl-r3-scope", tag: "verified", proof: P_NCDOT_SCOPE },
          },
          { text: ". Contact: " },
          {
            text: `${REF_NCDOT.name}, ${REF_NCDOT.title}`,
            claim: { id: "rr-cl-r3-contact", tag: "verified", proof: P_NCDOT_REF },
          },
          { text: "." },
        ],
      ],
      challenges: [],
    },
  ],

  price: {
    sheetName: "Attachment 2, VA's price schedule",
    sheetFileId: SHEET,
    contractType:
      "Firm fixed price for each period: a 12-month base year and four 12-month option years, at the increase you choose.",
    contractTypeSource: S_CONTRACT,
    weeks: WEEKS,
    // The one staffing plan. The technical approach describes these same people.
    roles: [
      {
        id: "rr-role-drivers",
        name: "Route drivers",
        ...PLAN.drivers,
        pay: { askId: "rr-ask-pay", fieldId: "rr-fld-pay-driver" },
        wageFloor: { perHour: DRIVER_FLOOR, source: S_WD_HEAVY },
      },
      {
        id: "rr-role-relief",
        name: "Relief driver",
        ...PLAN.relief,
        pay: { askId: "rr-ask-pay", fieldId: "rr-fld-pay-driver" },
        wageFloor: { perHour: DRIVER_FLOOR, source: S_WD_HEAVY },
      },
      {
        id: "rr-role-lead",
        name: "PM and Alternate",
        ...PLAN.lead,
        pay: { askId: "rr-ask-pay", fieldId: "rr-fld-pay-lead" },
      },
    ],
    burden: [
      {
        id: "rr-b-fica",
        label: "Social Security and Medicare",
        from: { kind: "law", rate: 7.65, text: "The employer share set by federal law." },
      },
      {
        id: "rr-b-hw",
        label: "Health and welfare",
        from: {
          kind: "per-hour",
          amount: 5.92,
          text: "Wage determination amount for every paid hour.",
          source: S_WD_HW,
          cashWhen: { askId: "rr-ask-hw", choiceId: "hw-cash" },
        },
      },
      {
        id: "rr-b-holidays",
        label: "Paid holidays",
        from: {
          kind: "law",
          rate: 4.23,
          text: "Eleven paid holidays in the wage determination: 88 of 2,080 hours a year.",
          source: S_WD_HOLIDAYS,
        },
      },
      {
        id: "rr-b-vacation",
        label: "Paid vacation",
        from: {
          kind: "law",
          rate: 3.85,
          text: "Vacation in the wage determination: 2 weeks a year after 1 year.",
          source: S_WD_VACATION,
        },
      },
      {
        id: "rr-b-suta",
        label: "Unemployment tax",
        from: { kind: "ask", askId: "rr-ask-payroll", fieldId: "rr-fld-suta", text: "From your payroll report." },
      },
      {
        id: "rr-b-wc",
        label: "Workers' comp",
        from: { kind: "ask", askId: "rr-ask-payroll", fieldId: "rr-fld-wc", text: "From your payroll report." },
      },
    ],
    lines: [
      {
        id: "rr-l-route1",
        item: "Route 1: Fayetteville Health Care Center, Sanford and Goldsboro, out and back",
        unit: "per route day",
        qty: ROUTE_DAYS,
        qtySource: doc(
          SHEET,
          "Attachment 2, row 5, CLIN 0001",
          "CLIN 0001",
          `0001 ROUTE 1 SUPPLY AND LINEN TRANSPORTATION, PER BUSINESS DAY. ESTIMATED QUANTITY: ${ROUTE_DAYS} DAYS`,
        ),
        laborShare: 0.45,
        direct: { askId: "rr-ask-fuel", fieldId: "rr-fld-fuel-r1", label: "Fuel" },
      },
      {
        id: "rr-l-route2",
        item: "Route 2: Jacksonville, Wilmington and Brunswick, out and back",
        unit: "per route day",
        qty: ROUTE_DAYS,
        qtySource: doc(
          SHEET,
          "Attachment 2, row 6, CLIN 0002",
          "CLIN 0002",
          `0002 ROUTE 2 SUPPLY AND LINEN TRANSPORTATION, PER BUSINESS DAY. ESTIMATED QUANTITY: ${ROUTE_DAYS} DAYS`,
        ),
        laborShare: 0.55,
        direct: { askId: "rr-ask-fuel", fieldId: "rr-fld-fuel-r2", label: "Fuel" },
      },
    ],
    overhead: {
      askId: "rr-ask-pl",
      fieldId: "rr-fld-overhead",
      text: "From your 2025 profit and loss statement, as a share of direct cost.",
    },
    profit: { askId: "rr-ask-profit", fieldId: "rr-fld-profit" },
    contingency: { askId: "rr-ask-contingency", fieldId: "rr-fld-contingency" },
    otherCosts: [
      {
        id: "rr-cost-trucks",
        label: "Route trucks and the backup: insurance, tires, repairs and GPS",
        yearly: { kind: "ask", askId: "rr-ask-truckcost", fieldId: "rr-fld-truck-cost", text: "Your yearly truck costs" },
        inPrice: true,
        commitmentId: "rr-c-gps",
      },
    ],
    periods: {
      count: OPTION_YEARS,
      label: "Option year",
      escalation: { askId: "rr-ask-profit", fieldId: "rr-fld-escalation" },
      source: S_PRICE,
    },
    payment: {
      text: "Paid monthly in arrears, within 30 days of a correct invoice. You carry about two months of fuel and payroll before the first payment.",
      source: S_INVOICE,
    },
  },

  forms: [
    {
      id: "rr-fm-sf1449",
      name: "SF 1449, Solicitation/Contract/Order for Commercial Products and Commercial Services",
      source: S_SIGN,
      handling: ["ava-fills", "you-sign"],
      signer: "You, as the owner",
      filledFrom: "Your registration details and your price schedule",
    },
    {
      id: "rr-fm-reps",
      name: "Representations and certifications, confirmed current in your registration",
      source: S_REPS,
      handling: ["you-sign"],
      signer: "You, as the owner",
    },
    {
      id: "rr-fm-refs",
      name: "Attachment 4, one reference form for each of your three similar jobs",
      source: S_REF_FORM,
      handling: ["ava-fills"],
      filledFrom: "Your three approved jobs and the contact details you enter",
    },
  ],

  submission: {
    method: "email",
    where: `By email to ${CO.name}, the VA contracting officer for this quote`,
    account: CO.email,
    source: S_EMAIL,
    limits: "10 MB in total, one file per volume, in one email",
    files: [
      {
        id: "rr-pk-tech",
        name: `Volume_I_Technical_Approach_${SHORT_FILE}.pdf`,
        covers: "Volume I, section 3.2",
        contains: [{ kind: "section", id: "rr-s-tech" }],
      },
      {
        id: "rr-pk-pp",
        name: `Volume_II_Past_Performance_${SHORT_FILE}.pdf`,
        covers: "Volume II and Attachment 4",
        contains: [
          { kind: "section", id: "rr-s-pp" },
          { kind: "form", id: "rr-fm-refs" },
        ],
      },
      {
        id: "rr-pk-price",
        // VA's own Excel file, filled in: section 3.4 asks for its format.
        name: `Volume_III_Price_Schedule_${SHORT_FILE}.xlsx`,
        covers: "Volume III, Attachment 2",
        contains: [{ kind: "price", id: "price" }],
      },
      {
        id: "rr-pk-forms",
        name: `Signed_Forms_${SHORT_FILE}.pdf`,
        covers: "SF 1449, section 3.5",
        contains: [
          { kind: "form", id: "rr-fm-sf1449" },
          { kind: "form", id: "rr-fm-reps" },
        ],
      },
    ],
    markings: [
      `Email subject line, word for word: "RFQ ${ID} – ${PERSONA.businessName}"`,
      "Each volume in its own file. The price schedule stays an Excel file, as section 3.4 asks.",
    ],
    checklist: [
      {
        id: "rr-ck-internal",
        label: `Internal deadline: ${D(DUE_DAYS - 1)}, 10:00 AM Eastern Time, one day early`,
        auto: true,
      },
      {
        id: "rr-ck-qa",
        label: `Read VA's Q&A answers on the license line and fuel once Q&A closes on ${D(QUESTIONS_DAYS)}`,
      },
      {
        id: "rr-ck-sam",
        label: "Check your federal registration is active and your answers are current",
      },
      {
        id: "rr-ck-vetcert",
        label: "Send your VetCert renewal. Your eligibility ends in 47 days, before VA is likely to award",
      },
      { id: "rr-ck-sign", label: "Sign the SF 1449" },
      { id: "rr-ck-reps", label: "Read and sign the representations and certifications statement" },
      { id: "rr-ck-subject", label: "Copy the email subject line word for word" },
      { id: "rr-ck-email", label: `Email the 4 files to ${CO.name} before 10:00 AM Eastern Time` },
      { id: "rr-ck-receipt", label: "Save the sent email as your receipt and upload it here" },
    ],
    certifying: [
      "You are a certified service-disabled veteran-owned small business, and your registration says so.",
      "You are small under the size standard for local freight trucking.",
      "You will pay the drivers at least the wage determination rate, plus health and welfare.",
      "Your registration answers are current and true on the day you sign.",
      "Your prices hold for 60 days after the due date, and stay fixed for each year of the contract.",
      "You will pay firms that are not service-disabled veteran-owned no more than half of what VA pays you for services.",
      "The three jobs in your references happened as described, with those values and dates.",
      "You can keep every promise in the technical approach.",
    ],
  },

  reviewerFindings: [
    {
      id: "rr-rf-license",
      sectionId: "rr-s-tech",
      criterionId: "rr-cr-tech",
      quote: "Clean and soiled linen never share a compartment, and soiled linen rides in VA's closed carts.",
      finding:
        "The price schedule asks for a hazardous material license number. The section does not say how the quote answers it. An evaluator would read a blank line as an incomplete quote.",
      suggestedFix: "Say what the drivers hold and that you asked VA which license it means, or wait for VA's answer and say so.",
      severity: "material",
      askId: "rr-ask-license",
    },
  ],

  addenda: [],

  // Page 1 facts that no other part of the bid carries. A null is a fact VA's
  // files do not state: page 1 shows "Not stated".
  overview: {
    noticeType: {
      text: "Request for Quote, with the notice and the rules in one document.",
      source: S_TYPE,
    },
    summary: {
      text: "Two daily box-truck routes out of the Fayetteville VA warehouse: clean linen and supplies out, soiled linen and returns back.",
      source: S_SCOPE,
    },
    work: [
      {
        text: "Route 1: Fayetteville Health Care Center, Sanford and Goldsboro. Route 2: Jacksonville, Wilmington and Brunswick.",
        source: S_ROUTES,
      },
      { text: "Out by 6:30 AM, back by 3:30 PM, every weekday except federal holidays.", source: S_TIMES },
      { text: "A box truck with a lift gate on each route, and a backup within 2 hours.", source: S_TRUCKS },
      { text: "GPS on every truck, which VA can see during the route.", source: S_GPS },
      { text: "Clean and soiled linen kept apart.", source: S_LINEN },
    ],
    place: { text: "The Fayetteville VA Medical Center warehouse and six VA sites in eastern North Carolina.", source: S_ROUTES },
    hours: {
      text: "The PM or the Alternate is reachable 6:00 AM to 6:00 PM, Monday to Friday.",
      source: S_PM,
    },
    staffing: { text: "A PM and an Alternate, named in writing, and bonded drivers who pass a VA background check.", source: S_DRIVERS },
    serviceLevels: {
      text: "A late or missed delivery is reported to VA within 30 minutes.",
      source: S_TIMES,
    },
    outOfScope: null,
    term: {
      text: "One fixed-price contract: a 12-month base year and four 12-month option years.",
      source: S_CONTRACT,
    },
    estimatedValue: null,
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
      text: "Do not contact VA's logistics or linen staff about this quote. Questions go to the contract specialist only.",
      source: S_NO_CONTACT,
    },
    buyerPortal: {
      text: "SAM.gov: VA posts its answers to questions there, for every bidder.",
      source: S_QUESTIONS,
    },
    dates: [],
    expectedAward: null,
    start: {
      text: "Work starts with a kickoff meeting at the Fayetteville VA Medical Center within 10 days of award.",
      source: S_KICKOFF,
    },
    validity: { text: "Quotes stay valid for 60 days after the closing date.", source: S_VALID },
    setAside: {
      text: "Only service-disabled veteran-owned small businesses certified by the SBA.",
      source: S_SET_ASIDE,
    },
    size: {
      text: `Industry code ${PERSONA.primaryNaics}, local freight trucking. Your registration lists you as small.`,
      source: S_SIZE,
    },
    lateRule: { text: "Quotes that arrive after the deadline are not considered.", source: S_DUE },
    subcontracting: {
      text: "Firms that are not service-disabled veteran-owned can get at most half of what VA pays you for services.",
      source: S_SUBS,
    },
  },

  samLegalName: PERSONA.businessName,
  nameInDraft: PERSONA.businessName,
};

// ─── What she told Ava ───
// The start (start.ts) and the presenter's jump (play.ts) both read these.
// The three questions carry her answers too: the jump plays them; the start
// leaves them open.

const AT = (minute: number) => ISO(-1, 15, minute);

export const truckingAnswers: Record<string, AskAnswer> = {
  "rr-ask-hw": { status: "done", at: AT(4), choiceId: "hw-benefits" },
  "rr-ask-pay": {
    status: "done",
    at: AT(8),
    values: { "rr-fld-pay-driver": 24.5, "rr-fld-pay-lead": 30 },
  },
  "rr-ask-payroll": {
    status: "done",
    at: AT(12),
    fileName: `${SHORT_FILE}_Payroll_Summary.pdf`,
    values: { "rr-fld-suta": 1.2, "rr-fld-wc": 3.8 },
  },
  "rr-ask-bond": { status: "done", at: AT(14) },
  "rr-ask-fuel": {
    status: "done",
    at: AT(18),
    values: {
      "rr-fld-diesel": DIESEL,
      "rr-fld-fuel-r1": Math.round(((ROUTE_1_MILES / MPG) * DIESEL) * 100) / 100,
      "rr-fld-fuel-r2": Math.round(((ROUTE_2_MILES / MPG) * DIESEL) * 100) / 100,
    },
  },
  "rr-ask-truckcost": { status: "done", at: AT(21), values: { "rr-fld-truck-cost": 12_000 } },
  "rr-ask-pl": {
    status: "done",
    at: AT(24),
    fileName: `${SHORT_FILE}_Profit_and_Loss_2025.pdf`,
    values: { "rr-fld-overhead": 6 },
  },
  "rr-ask-contingency": { status: "done", at: AT(26), values: { "rr-fld-contingency": 1 } },
  "rr-ask-profit": { status: "done", at: AT(30), values: { "rr-fld-profit": 4, "rr-fld-escalation": 2.5 } },
  "rr-ask-ref1": { status: "done", at: AT(34) },
  "rr-ask-ref2": { status: "done", at: AT(35) },
  "rr-ask-ref3": { status: "done", at: AT(36) },
  "rr-ask-refcontacts": {
    status: "done",
    at: AT(40),
    values: {
      "rr-fld-ref1-phone": REFERENCE_CONTACTS.renataBostic.phone,
      "rr-fld-ref1-email": REFERENCE_CONTACTS.renataBostic.email,
      "rr-fld-ref2-phone": REFERENCE_CONTACTS.calvinStrickland.phone,
      "rr-fld-ref2-email": REFERENCE_CONTACTS.calvinStrickland.email,
      "rr-fld-ref3-phone": REFERENCE_CONTACTS.dwayneLockhart.phone,
      "rr-fld-ref3-email": REFERENCE_CONTACTS.dwayneLockhart.email,
    },
  },
  // The three questions. Her answers when she gives them: she is the PM with
  // her dispatcher as Alternate, two box trucks and the third as the spare,
  // and the license line stated and asked in Q&A (Grant's and Diana's advice).
  "rr-ask-pm": { status: "done", at: AT(50), choiceId: "pm-owner" },
  "rr-ask-trucks": { status: "done", at: AT(51), choiceId: "trucks-spare" },
  "rr-ask-license": { status: "done", at: AT(52), choiceId: "lic-state" },
};

/** The three questions the story says wait on her, in Ava's order. */
export const HERO_OPEN = ["ask:rr-ask-pm", "ask:rr-ask-trucks", "ask:rr-ask-license"];

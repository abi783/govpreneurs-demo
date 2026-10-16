// Ava fixture · Field feeding at Camp Mackall (federal).
//
// A federal Request for Quote: combined synopsis/solicitation for commercial
// services on the SF 1449, set aside for certified woman-owned small
// businesses. Award goes to the lowest price among quotes rated acceptable, so
// the writing is pass or fail: short, complete, no win themes.
//
// THE STORY (src/demo/story): the Army wants breakfast and dinner, cooked,
// packed and delivered to two drop points at Camp Mackall, about 18 training
// rotations a year, for a base year and two option years. Amira has five cooks
// and three of them hold a food handler certificate. The quote asks for proof
// for every cook. The dates, the title and the buyer come from the story, so
// no screen can disagree with the Hunter and Grant pages.
//
// THIS BID IS ALREADY IN PROGRESS. Where it starts is built from real answers
// in lib/ava/starts/mackall.ts: three questions wait on her. The seed at the
// end of this file is a smaller, older state that the tests use.
// Amendment 0001 was posted after the notice and is part of the base bid.
// Amendment 0002 arrives during the build (the demo control delivers it).
//
// The buyer is real in shape and invented in detail. Every quotation from the
// buyer's files is inside a doc() call. The wage determination rates are
// sample values for this demo, not a real Department of Labor schedule.
// No section numbers from the federal rulebook are cited: the buyer's own
// clause text is quoted instead, because the rulebook is mid-overhaul.

import { buyerPeople, REFERENCE_CONTACTS } from "../../../demo/ava/contacts";
import { getGrantBrief } from "../../../demo/story/grantBriefs";
import { getOpportunity } from "../../../demo/story/opportunities";
import { PAST_PERFORMANCE, PERSONA, type PastPerformance } from "../../../demo/story/persona";
import { PLACES } from "../../../demo/story/places";
import { doc, profile } from "../build";
import type { AskAnswer, BidState } from "../store";
import type { AvaBid, Proof } from "../types";
import { D, DM, ET_OFFSET, FORMED_ON, ISO, SAM_ACTIVE_UNTIL, US } from "./when";

// ─── The story's facts for this bid ───

export const MACKALL_ID = "SP4701-26-Q-0021";

const STORY = getOpportunity(MACKALL_ID);
const BRIEF = getGrantBrief(MACKALL_ID);
if (!STORY || !BRIEF) throw new Error(`The story has no bid ${MACKALL_ID}`);

/** Days from today to the day Grant's brief names: "Questions due". */
function briefDay(label: string): number {
  const d = BRIEF!.keyDates.find((k) => k.label === label);
  if (!d) throw new Error(`Grant's brief for ${MACKALL_ID} has no date "${label}"`);
  return d.inDays;
}

const DUE_DAYS = STORY.closesInDays;
/** The Army's contracting officer: the person the opportunity page names. */
const CO = buyerPeople(MACKALL_ID).primary;
const QUESTIONS_DAYS = briefDay("Questions due");
const AWARD_DAYS = briefDay("Expected award");
/** The notice, its work statement and the old wage rates went up together. */
const POSTED = -STORY.postedDaysAgo;
/** Amendment 0001 and the new wage rates went up one day after the notice. */
const POSTED_AMD1 = POSTED + 2;

/** Driving miles from her kitchen to the drop points. */
const MILES = PLACES[STORY.place].milesFromKitchen;
/** The Army expects about this many weekly rotations in a contract year. */
const ROTATION_WEEKS = 18;
/** Rotations run on weekdays. */
const TRAINING_DAYS = ROTATION_WEEKS * 5;
/** Her two refrigerated vans each take one drop point. */
const DROP_POINTS = 2;
/** About 100 soldiers eat each meal on each training day. This is the quote's
 *  estimated quantity for one meal in one contract year. */
const MEALS = TRAINING_DAYS * 100;
/** Amendment 0002 adds weekend field training: 12 more days of meals. */
const MEALS_AMD2 = MEALS + 12 * 100;
/** Two delivery runs a day (breakfast and dinner), each there and back. */
const RUNS = TRAINING_DAYS * 2;
const TRIP_MILES = MILES * 2;
/** Fuel and wear at 70 cents a mile: Ava's starting point for the cost. */
const FUEL_START = Math.round(RUNS * TRIP_MILES * 0.7);
/** Weeks a year when two rotations overlap. */
const OVERLAP_WEEKS = 2;
/** The cooks who do not yet hold a food handler certificate. */
const COOKS_WITHOUT = PERSONA.employeesW2 - PERSONA.foodHandlerCertified;

// ─── Her past jobs, from the story ───

function pastJob(id: PastPerformance["id"]): PastPerformance {
  const job = PAST_PERFORMANCE.find((p) => p.id === id);
  if (!job) throw new Error(`The story has no past job ${id}`);
  return job;
}

const JOB_CDG = pastJob("pp-cdg-sub");
const JOB_SCHOOLS = pastJob("pp-county-schools");
const JOB_CHURCH = pastJob("pp-church");
const JOB_WOMACK = pastJob("pp-womack");

/** A past date as the draft writes it: "8 January 2024". Past jobs are
 *  history, so these dates stay fixed. */
function pastDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
const pastYear = (iso: string) => iso.slice(0, 4);
/** Her short name as a file name: "Haddad_Catering". */
const SHORT_FILE = PERSONA.businessShortName.replace(/\s+/g, "_");
const money = (n: number) => `$${n.toLocaleString("en-US")}`;

// The two sentences that open the technical section, in Ava's order and in
// the order she can swap to.
const Y_CDG = pastYear(JOB_CDG.periodStart);
const Y_SCHOOLS = pastYear(JOB_SCHOOLS.periodStart);
const LEAD_CDG = "as a subcontractor, it served weekend meals at two Fort Bragg dining facilities";
const LEAD_SCHOOLS = "delivered 1,100 meals a day to nine sites";
const SENT_CDG = `In ${Y_CDG}, ${LEAD_CDG}.`;
const SENT_SCHOOLS = `The company's ${Y_SCHOOLS} Cumberland County Schools job ${LEAD_SCHOOLS}.`;

// ─── The buyer's files ───

const RFQ = "mk-f-rfq";
const PWS = "mk-f-pws";
const WD_OLD = "mk-f-wd-25";
const WD = "mk-f-wd";
const MAP = "mk-f-map";
const AMD1 = "mk-f-amd1";
const AMD2 = "mk-f-amd2";

// ─── Sources used more than once ───

const S_DUE = doc(
  RFQ,
  "Section 1.4, page 2",
  "§1.4",
  `Quotes are due no later than 10:00 AM Eastern Time (ET) on ${D(DUE_DAYS)}. Quotes received after this time will not be considered.`,
);
const S_SET_ASIDE = doc(
  RFQ,
  "Section 1.2, page 1",
  "§1.2",
  "This acquisition is set aside 100% for Women-Owned Small Business (WOSB) concerns. The Offeror must be a certified WOSB, and registered as such in SAM, at the time it submits its quote.",
);
const S_SIZE = doc(
  RFQ,
  "Section 1.2, page 1",
  "§1.2",
  "The NAICS code for this acquisition is 722310, Food Service Contractors. The small business size standard is $47 million.",
);
const S_VALID = doc(
  RFQ,
  "Section 1.6, page 2",
  "§1.6",
  "Quotes shall remain valid for 60 calendar days after the closing date.",
);
const S_CONTRACT = doc(
  RFQ,
  "Section 2.1, page 6",
  "§2.1",
  "The Government intends to award a single Firm-Fixed-Price contract with a 12-month base period and two 12-month option periods.",
);
const S_QTY = doc(
  RFQ,
  "Section 2.2, page 6",
  "§2.2",
  "The quantities shown are estimates only. The Government does not guarantee any minimum quantity and will pay only for meals ordered and delivered.",
);
const S_SIGN = doc(
  RFQ,
  "Section 3.1, page 20",
  "§3.1",
  "Offerors shall complete and sign blocks 12, 17a, 30a, 30b and 30c of the SF 1449.",
);
const S_ACK = doc(
  RFQ,
  "Section 3.1, page 20",
  "§3.1",
  "Offerors shall acknowledge each amendment by signing and returning the SF 30 with the quote. A quote that does not acknowledge all amendments may be rejected.",
);
const S_TECH = doc(
  RFQ,
  "Section 3.2, page 21",
  "§3.2",
  "Volume I, Technical Capability Statement, shall not exceed five (5) pages. It shall describe how the Offeror will prepare, pack, transport and deliver meals, keep food safety and temperature records, and staff the work.",
);
const S_FH = doc(
  RFQ,
  "Section 3.2, page 21",
  "§3.2",
  "Attach a copy of the current food handler certificate for every cook who will work on this contract. The certificates do not count toward the page limit.",
);
const S_PP = doc(
  RFQ,
  "Section 3.3, page 21",
  "§3.3",
  "Volume II, Past Performance, has no page limit. Provide two (2) references for similar work, and complete Attachment 4 for each, including a point of contact with current telephone number and email.",
);
const S_PRICE = doc(
  RFQ,
  "Section 3.4, page 22",
  "§3.4",
  "Volume III, Price, shall contain unit prices for every CLIN on the Schedule of Supplies/Services, for the base period and each option period.",
);
const S_REPS = doc(
  RFQ,
  "Section 3.5, page 22",
  "§3.5",
  "Offerors shall confirm that their representations and certifications in SAM are current and accurate, and complete any provision in this RFQ that is not covered in SAM.",
);
const S_EMAIL = doc(
  RFQ,
  "Section 3.6, page 23",
  "§3.6",
  `Quotes shall be emailed to ${CO.email} with the subject line: RFQ ${MACKALL_ID} – [Offeror Name]. Each volume shall be a separate PDF. Total attachments shall not exceed 10 MB.`,
);
const S_AWARD = doc(
  RFQ,
  "Section 4.1, page 24",
  "§4.1",
  "Award will be made to the responsible Offeror whose quote conforms to this RFQ and is the lowest priced among quotes rated Acceptable on both Technical Capability and Past Performance.",
);
const S_AWARD_DATE = doc(
  RFQ,
  "Section 4.3, page 25",
  "§4.3",
  `The Government expects to make the award on or about ${US(AWARD_DAYS)}.`,
);
const S_EVAL_TECH = doc(
  RFQ,
  "Section 4.2(a), page 24",
  "§4.2(a)",
  "Technical Capability will be rated Acceptable or Unacceptable. A quote is Acceptable when it clearly shows the Offeror can prepare, pack, transport and deliver meals as the PWS requires.",
);
const S_EVAL_PP = doc(
  RFQ,
  "Section 4.2(b), page 24",
  "§4.2(b)",
  "Past Performance will be rated Acceptable or Unacceptable, based on two (2) references for similar work performed within the past five (5) years.",
);
const S_EVAL_PRICE = doc(
  RFQ,
  "Section 4.2(c), page 25",
  "§4.2(c)",
  "Price will be evaluated by adding the unit prices multiplied by the estimated quantities for all CLINs. Price will not be rated.",
);
const S_SAM = doc(
  RFQ,
  "Section 5.2, page 29",
  "§5.2",
  "An Offeror shall be registered in SAM when submitting an offer or quotation, and shall continue to be registered until time of award, during performance, and through final payment.",
);
const S_SUBS = doc(
  RFQ,
  "Section 5.3, page 30",
  "§5.3",
  "The Contractor will not pay more than 50 percent of the amount paid by the Government for services to subcontractors that are not similarly situated entities.",
);
const S_WAWF = doc(
  RFQ,
  "Section 5.4, page 31",
  "§5.4",
  "Payment requests shall be submitted electronically through Wide Area WorkFlow (WAWF) in the Procurement Integrated Enterprise Environment (PIEE).",
);
const S_PAY = doc(
  RFQ,
  "Section 5.4, page 31",
  "§5.4",
  "Payment will be made within 30 days after receipt of a proper invoice.",
);
const S_INSURANCE = doc(
  RFQ,
  "Section 5.5, page 32",
  "§5.5",
  "Before starting work, the Contractor shall have general liability insurance of at least $500,000 per occurrence, automobile liability of $200,000 per person and $500,000 per occurrence, and workers' compensation as required by State law.",
);
const S_SCA = doc(
  RFQ,
  "Section 5.6, page 33",
  "§5.6",
  "The Contractor shall pay service employees not less than the wage rates and fringe benefits in the Wage Determination at Attachment 2.",
);
const S_REF_FORM = doc(
  RFQ,
  "Attachment 4, page 39",
  "Att. 4",
  "PAST PERFORMANCE REFERENCE FORM. Complete one form per reference. Point of contact name, title, telephone number and email address are required.",
);
const S_SCHEDULE = doc(
  RFQ,
  "SF 1449 continuation, pages 3 to 5",
  "Schedule",
  "Offerors shall enter a unit price and extended amount for each CLIN. Extended amount equals unit price times estimated quantity.",
);

const S_MENU = doc(
  PWS,
  "Section 4.1, page 5",
  "PWS 4.1",
  "The Contractor shall follow the 21-day menu cycle in Technical Exhibit 1.",
);
const S_ROTATIONS = doc(
  PWS,
  "Section 3.2, page 4",
  "PWS 3.2",
  `Training rotations run Monday through Friday. The Government expects about ${ROTATION_WEEKS} rotations in each contract year, and meals go to the two delivery points in Technical Exhibit 2. In about ${OVERLAP_WEEKS} weeks of the year, two rotations overlap and the Government orders meals for both.`,
);
const S_WINDOW = doc(
  PWS,
  "Section 5.3, page 7",
  "PWS 5.3",
  "Breakfast shall arrive at each delivery point no later than 0530. Dinner shall arrive no later than 1700.",
);
const S_HEADCOUNT = doc(
  PWS,
  "Section 5.5, page 8",
  "PWS 5.5",
  "The Government will provide final headcounts not later than 24 hours before each meal. Headcounts may vary by up to 20 percent from the weekly estimate.",
);
const S_BACKUP = doc(
  PWS,
  "Section 5.7, page 9",
  "PWS 5.7",
  "The Contractor shall have a contingency plan to deliver meals on time if a vehicle or equipment fails.",
);
const S_CONTAINERS = doc(
  PWS,
  "Section 6.1, page 10",
  "PWS 6.1",
  "Meals shall be transported in clean, insulated food containers that keep safe temperatures for at least four hours.",
);
const S_TEMPS = doc(
  PWS,
  "Section 6.2, page 10",
  "PWS 6.2",
  "Hot foods shall be held at 135°F or above and cold foods at 41°F or below. Temperatures shall be recorded at loading and at delivery, and logs provided to the Contracting Officer upon request.",
);
const S_STAFF = doc(
  PWS,
  "Section 7.1, page 12",
  "PWS 7.1",
  "Every food handler shall hold a current food handler certificate before working on this contract. The Contractor shall keep a copy of each certificate on file.",
);
const S_ACCESS = doc(
  PWS,
  "Section 8.1, page 14",
  "PWS 8.1",
  "All Contractor personnel shall obtain installation access, including a criminal background check, before performing work. Personnel who cannot be vetted shall not be used.",
);

const S_WD_RATES = doc(
  WD,
  "Revision 26, page 2, occupation list",
  "WD Rev 26",
  "07041 - Cook I 17.90 | 07130 - Food Service Worker 15.25 | 31361 - Truckdriver, Light 18.40",
);
const S_WD_COOK = doc(WD, "Revision 26, page 2", "WD 07041", "07041 - Cook I 17.90");
const S_WD_DRIVER = doc(WD, "Revision 26, page 3", "WD 31361", "31361 - Truckdriver, Light 18.40");
const S_WD_HW = doc(
  WD,
  "Revision 26, page 5",
  "WD H&W",
  "HEALTH & WELFARE: $5.36 per hour, up to 40 hours per week, or $214.40 per week or $929.07 per month",
);
const S_WD_VACATION = doc(
  WD,
  "Revision 26, page 5",
  "WD vacation",
  "VACATION: 2 weeks paid vacation after 1 year of service with a contractor or successor, 3 weeks after 5 years, and 4 weeks after 15 years.",
);
const S_WD_HOLIDAYS = doc(
  WD,
  "Revision 26, page 5",
  "WD holidays",
  "HOLIDAYS: A minimum of eleven paid holidays per year: New Year's Day, Martin Luther King Jr.'s Birthday, Washington's Birthday, Memorial Day, Juneteenth, Independence Day, Labor Day, Columbus Day, Veterans' Day, Thanksgiving Day, and Christmas Day.",
);

const S_AMD1_ACK = doc(
  AMD1,
  "SF 30, page 1, block 11",
  "Amd 0001",
  "FAILURE OF YOUR ACKNOWLEDGMENT TO BE RECEIVED AT THE PLACE DESIGNATED FOR THE RECEIPT OF OFFERS PRIOR TO THE HOUR AND DATE SPECIFIED MAY RESULT IN REJECTION OF YOUR OFFER.",
);
const S_AMD1_QUESTIONS = doc(
  AMD1,
  "SF 30, page 2, block 14, item 2",
  "Amd 0001",
  `The deadline for questions is extended to 12:00 PM ET on ${D(QUESTIONS_DAYS)}. Questions shall be emailed to the Contracting Officer.`,
);
const S_AMD2_ACK = doc(
  AMD2,
  "SF 30, page 1, block 11",
  "Amd 0002",
  "FAILURE OF YOUR ACKNOWLEDGMENT TO BE RECEIVED AT THE PLACE DESIGNATED FOR THE RECEIPT OF OFFERS PRIOR TO THE HOUR AND DATE SPECIFIED MAY RESULT IN REJECTION OF YOUR OFFER.",
);

// ─── The member's own record (profile) ───

const PP2_AT = "Your jobs list: Fort Bragg dining facility support";
const PP1_AT = "Your jobs list: Cumberland County Schools summer meals";

const P_PP2_SCOPE: Proof = profile(
  PP2_AT,
  "Subcontracted weekend and holiday meal service at two on-post dining facilities.",
);
const P_PP2_RECORDS: Proof = profile(
  PP2_AT,
  "Short-order line, salad bar, dish room, and full HACCP records under the prime's quality plan.",
);
const P_PP2_TERMS: Proof = profile(
  PP2_AT,
  `${pastDate(JOB_CDG.periodStart)} to ${pastDate(JOB_CDG.periodEnd)}. Total value ${money(JOB_CDG.totalValue)}.`,
);
const P_PP2_ROLE: Proof = profile(
  PP2_AT,
  "Sub to Carolina Dining Group (federal prime). Share of the work: 30%.",
);
const P_PP2_REF: Proof = profile(
  PP2_AT,
  "Reference: Mike Sutton, Operations Manager, Carolina Dining Group.",
);
const P_PP1_SCOPE: Proof = profile(
  PP1_AT,
  "Cooked and delivered 1,100 breakfasts and lunches a day to nine summer meal sites.",
);
const P_PP1_LOGS: Proof = profile(
  PP1_AT,
  "USDA meal-pattern compliant menus, daily temperature logs",
);
const P_PP1_TERMS: Proof = profile(
  PP1_AT,
  `${pastDate(JOB_SCHOOLS.periodStart)} to ${pastDate(JOB_SCHOOLS.periodEnd)}. Total value ${money(JOB_SCHOOLS.totalValue)}.`,
);
const P_PP1_ROLE: Proof = profile(
  PP1_AT,
  "Role on this job: main contractor (prime), for the school district.",
);
const P_PP1_REF: Proof = profile(
  PP1_AT,
  "Reference: Janet Reyes, Child Nutrition Director, Cumberland County Schools.",
);
const P_STAFF_COUNT: Proof = profile(
  "Your company size",
  `Employees on payroll: ${PERSONA.employeesW2}`,
);
// Three of the five cooks hold a certificate. No proof says the other two do.
const P_FOOD_HANDLERS: Proof = profile(
  "Your food safety training",
  `Cooks with a current food handler certificate: ${PERSONA.foodHandlerCertified} of ${PERSONA.employeesW2}`,
);
const P_VANS: Proof = profile("Your kitchen", PERSONA.kitchen);

// ─── The staffing plan ───
// One plan: the price pays for these hours, and the writing describes these
// people. All five employees cook. Two of the cooks also drive the two vans.
// One part-time cook covers the weeks when two rotations overlap. That makes
// five people and one part-time hire. Hours are paid hours in a rotation week.

const DRIVERS = DROP_POINTS;
const PLAN = {
  cook: { count: PERSONA.employeesW2 - DRIVERS, hoursPerWeek: 27 },
  driver: { count: DRIVERS, hoursPerWeek: 30 },
  partTime: { count: 1, hoursPerWeek: 10 },
};
const PLAN_HOURS = Object.values(PLAN).reduce((n, r) => n + r.count * r.hoursPerWeek, 0);

// ─── Commitments whose text an addendum changes ───
// Kept as constants so the seed's approval holds the exact text, and
// Amendment 0002's patch reopens it.

const WINDOW_TEXT =
  "Breakfast at each delivery point by 5:30 AM. Dinner by 5:00 PM, every training day.";
const WINDOW_TEXT_AMD2 =
  "Breakfast at each delivery point by 5:00 AM. Dinner by 5:00 PM, every training day, weekends included.";
const STAFF_TEXT = `${PERSONA.employeesW2} cooks, ${DRIVERS} of them also driving, and ${PLAN.partTime.count} part-time cook for the ${OVERLAP_WEEKS} weeks when two rotations overlap. The ${COOKS_WITHOUT} cooks without a food handler certificate finish the course before this quote is sent. Each driver is cleared for installation access before the first delivery.`;

// ─── The bid ───

export const mackallBid: AvaBid = {
  noticeId: MACKALL_ID,
  // The story owns the title, the buyer and the number (fixtures/index.ts).
  officialTitle: STORY.title,
  buyer: STORY.agency,
  bidNumber: MACKALL_ID,
  kind: "short-response",
  kindReason: "A pass-or-fail technical statement and two references, plus the price and forms.",

  files: [
    {
      id: RFQ,
      name: `${MACKALL_ID}_Combined_Synopsis_Solicitation.pdf`,
      role: "main",
      pages: 40,
      postedDaysFromNow: POSTED,
      readability: "read",
    },
    {
      id: PWS,
      name: "Attachment_1_Performance_Work_Statement.pdf",
      role: "exhibit",
      pages: 18,
      postedDaysFromNow: POSTED,
      readability: "read",
    },
    {
      id: WD_OLD,
      name: "Attachment_2_WD_2015-4281_Rev_25.pdf",
      role: "exhibit",
      pages: 9,
      postedDaysFromNow: POSTED,
      readability: "read",
      supersededBy: WD,
      note: "Replaced by Revision 26 in Amendment 0001. Ava prices with Revision 26.",
    },
    {
      id: WD,
      name: "Attachment_2_WD_2015-4281_Rev_26.pdf",
      role: "exhibit",
      pages: 9,
      postedDaysFromNow: POSTED_AMD1,
      readability: "read",
    },
    {
      id: MAP,
      name: "Attachment_3_Delivery_Points_Map.pdf",
      role: "drawing",
      pages: 1,
      postedDaysFromNow: POSTED,
      readability: "scan",
      riskIfMissing: "minor",
      note: "A map drawing. I read it from the picture. The work statement lists the same delivery points in words.",
    },
    {
      id: AMD1,
      name: `${MACKALL_ID}_Amendment_0001_SF30.pdf`,
      role: "addendum",
      pages: 3,
      postedDaysFromNow: POSTED_AMD1,
      readability: "read",
      addendumId: "mk-add-1",
    },
    {
      id: AMD2,
      name: `${MACKALL_ID}_Amendment_0002_SF30.pdf`,
      role: "addendum",
      pages: 4,
      postedDaysFromNow: POSTED_AMD1 + 3,
      readability: "read",
      addendumId: "mk-add-2",
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
    questionsSource: S_AMD1_QUESTIONS,
  },

  award: {
    method: "lowest-price-acceptable",
    source: S_AWARD,
    criteria: [
      {
        id: "mk-cr-tech",
        name: "Technical capability",
        points: null,
        kind: "pass-fail",
        source: S_EVAL_TECH,
        treatment: "Acceptable or not. Clear and complete beats long.",
      },
      {
        id: "mk-cr-pp",
        name: "Past performance on two similar jobs, acceptable or not",
        points: null,
        kind: "pass-fail",
        source: S_EVAL_PP,
        treatment: "Acceptable or not. Two similar jobs from the last five years.",
      },
      {
        id: "mk-cr-price",
        name: "Price",
        points: null,
        kind: "price-formula",
        source: S_EVAL_PRICE,
        treatment: "Lowest price among acceptable quotes wins.",
      },
    ],
    note: "No points. Each part is pass or fail, then the lowest price wins.",
  },

  hardRequirements: [
    {
      id: "mk-r-wosb",
      // No grantRow: Grant asks the same question (mk-wosb-cert), and Ava's ask
      // takes his answer. Ava has no proof to pass back to Grant, so opening
      // the bid writes nothing to Grant's facts.
      group: "eligibility",
      label: "Certified woman-owned small business when you send the quote",
      source: S_SET_ASIDE,
      initial: "confirm",
      evidence: "Your profile says certified. Grant asks you to confirm it is active.",
      askId: "mk-ask-wosb",
      afterAsk: "meets",
      evidenceAfter: "You told Grant your woman-owned certification is active",
    },
    {
      id: "mk-r-sam",
      grantRow: "gm-sam",
      group: "eligibility",
      label: "Active federal registration when you quote, and through award",
      source: S_SAM,
      initial: "meets",
      evidence: `Your registration is active until ${SAM_ACTIVE_UNTIL}.`,
    },
    {
      id: "mk-r-size",
      grantRow: "gm-size",
      group: "eligibility",
      label: "Small under the size standard for food service contractors",
      source: S_SIZE,
      initial: "meets",
      evidence: "Your registration lists you as small for industry code 722310.",
    },
    {
      id: "mk-r-sca",
      group: "pricing",
      label: "Pay at least the wage floors, plus $5.36 an hour for health and welfare",
      source: S_SCA,
      initial: "confirm",
      askId: "mk-ask-pay",
      // The pay floors and how health and welfare is paid: both answers count.
      askIds: ["mk-ask-hw"],
      afterAsk: "meets",
      evidenceAfter: "Your pay rates, checked against the wage determination",
    },
    {
      id: "mk-r-fh",
      grantRow: "gm-foodhandler",
      group: "people",
      label: "Food handler certificate for every cook",
      source: S_FH,
      initial: "confirm",
      evidence: `${PERSONA.foodHandlerCertified} of your ${PERSONA.employeesW2} cooks hold one now. The quote asks for proof for every cook.`,
      askId: "mk-ask-fh",
      afterAsk: "meets",
      evidenceAfter: "Your food handler certificates, uploaded to Ava",
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
      summary:
        "Only certified woman-owned small businesses may quote. No state or local preference.",
      source: S_SET_ASIDE,
      requirementId: "mk-r-wosb",
    },
    { topic: "bonds", found: false, summary: "No bid, performance or payment bond asked for." },
    {
      topic: "insurance",
      found: true,
      summary:
        "Liability, auto and workers' comp insurance before work starts. Your $1M liability policy is above the minimum, and both vans are covered.",
      source: S_INSURANCE,
    },
    {
      topic: "wages",
      found: true,
      summary: "Service Contract Act pay floors, plus $5.36 an hour for health and welfare.",
      source: S_SCA,
      requirementId: "mk-r-sca",
    },
    { topic: "tax", found: false, summary: "No sales or use tax rules in these files." },
    {
      topic: "notary-signature",
      found: true,
      summary: "No notary. You sign the SF 1449 and each amendment form.",
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
      summary: "Two similar jobs as references, and a food handler certificate for every cook.",
      source: S_PP,
      requirementId: "mk-r-fh",
    },
    {
      topic: "participation-goals",
      found: false,
      summary: "No minority or disadvantaged business goals in these files.",
    },
    {
      topic: "background-checks",
      found: true,
      summary: "Delivery drivers need installation access, which includes a background check.",
      source: S_ACCESS,
    },
    {
      topic: "portal-rules",
      found: true,
      summary: "Quotes go by email. One PDF per volume, 10 MB in total, and a set subject line.",
      source: S_EMAIL,
    },
  ],

  commitments: [
    {
      id: "mk-c-window",
      text: WINDOW_TEXT,
      source: S_WINDOW,
      pricedAs: "Priced as: a cook shift from 3:30 AM and 2 delivery runs a day.",
      needsApproval: true,
    },
    {
      id: "mk-c-temps",
      text: "Hot food at 135°F or above, cold food at 41°F or below. Every reading logged and kept for the contracting officer.",
      source: S_TEMPS,
      pricedAs: "Priced as: part of each cook's paid hours.",
      needsApproval: true,
    },
    {
      id: "mk-c-headcount",
      text: "Headcount changes met in full with 24 hours' notice. Changes can be up to 20% either way.",
      source: S_HEADCOUNT,
      pricedAs: "Priced as: food cost per meal, so fewer meals means less food bought.",
      needsApproval: true,
    },
    {
      id: "mk-c-staff",
      text: STAFF_TEXT,
      source: S_STAFF,
      pricedAs: `Priced as: ${PLAN_HOURS} paid hours a week across your ${PERSONA.employeesW2} cooks and ${PLAN.partTime.count} part-time cook, for ${ROTATION_WEEKS} rotation weeks.`,
      needsApproval: true,
    },
    {
      id: "mk-c-price",
      text: "Price per meal fixed for the 12-month base period. It holds even if food or fuel costs rise.",
      source: S_CONTRACT,
      pricedAs: "Priced as: your food cost today. There is no increase during the year.",
      needsApproval: false,
    },
  ],

  contractTerms: [
    {
      text: "Fixed price per meal. If food or fuel costs rise, your price stays the same.",
      source: S_CONTRACT,
    },
    {
      text: "A 12-month base period, then two 12-month option periods the Army may choose to use.",
      source: S_CONTRACT,
    },
    {
      text: "You quote a price for each option period too. You choose any yearly increase.",
      source: S_PRICE,
    },
    {
      text: "Meal counts are estimates, not promises. The Army pays only for meals ordered and delivered.",
      source: S_QTY,
    },
    {
      text: "Headcounts can move 20% either way with 24 hours' notice. Food cost follows the meals, but staff pay does not.",
      source: S_HEADCOUNT,
    },
    {
      text: "You bill through the government's online invoicing system, called Wide Area WorkFlow. You need a free account there before the first invoice.",
      source: S_WAWF,
    },
    {
      text: "Payment arrives within 30 days of a correct invoice.",
      source: S_PAY,
    },
    {
      text: "Your prices hold for 60 days after the due date.",
      source: S_VALID,
    },
    {
      text: "Other companies may get no more than half of what the Army pays you.",
      source: S_SUBS,
    },
  ],

  // Whether a Mentor review is advised, and why, is Grant's call: his
  // warnings (lib/grant/avaSamples.ts). Ava shows them and adds none.
  mentor: { recommended: false, reasons: [] },

  knownFacts: [
    {
      label: "Legal name",
      value: PERSONA.businessName,
      from: "Your federal registration",
    },
    { label: "Unique entity ID", value: PERSONA.uei, from: "Your federal registration" },
    {
      label: "Commercial and Government Entity code",
      value: PERSONA.cage,
      from: "Your federal registration",
    },
    {
      label: "Registration active until",
      value: SAM_ACTIVE_UNTIL,
      from: "Your federal registration",
    },
    {
      label: "Company formed",
      value: `${FORMED_ON}, in ${PERSONA.stateOfIncorporation}`,
      from: "Your Articles of Organization",
    },
    {
      label: "Address",
      value: PERSONA.physicalAddress,
      from: "Your federal registration",
    },
    {
      label: "Woman-owned small business",
      value: "Certified and active",
      from: "Your GovPreneurs profile, and your answer to Grant",
    },
    {
      label: "Main industry code",
      value: `${PERSONA.primaryNaics} ${PERSONA.primaryNaicsLabel}`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Other industry codes",
      value: PERSONA.secondaryNaics
        .slice(0, 2)
        .map((n) => `${n.code} ${n.label}`)
        .join(", "),
      from: "Your GovPreneurs profile",
    },
    {
      label: "Business size",
      value: `Small for industry code ${PERSONA.primaryNaics}`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Employees",
      value: `${PERSONA.employeesW2} on payroll`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Insurance on file",
      value: "General liability $1M per occurrence. Commercial auto insurance covers both vans.",
      from: "Your GovPreneurs profile",
    },
    {
      label: "Food handler certificates",
      value: `${PERSONA.foodHandlerCertified} of your ${PERSONA.employeesW2} cooks hold one. ${COOKS_WITHOUT} do not yet.`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Fort Bragg dining facility support",
      value: `Worked under Carolina Dining Group, ${pastYear(JOB_CDG.periodStart)}, ${money(JOB_CDG.totalValue)}, 30% of the work`,
      from: "Your GovPreneurs profile, jobs list",
    },
    {
      label: "Cumberland County Schools summer meals",
      value: `Main contractor, ${pastYear(JOB_SCHOOLS.periodStart)}, ${money(JOB_SCHOOLS.totalValue)}, 1,100 meals a day at 9 sites`,
      from: "Your GovPreneurs profile, jobs list",
    },
    {
      label: JOB_CHURCH.projectTitle,
      value: `${pastYear(JOB_CHURCH.periodStart)}, ${money(JOB_CHURCH.totalValue)}, 11 events. Not used here: private events are not similar work.`,
      from: "Your GovPreneurs profile, jobs list",
    },
    {
      label: "Womack Army Medical Center patient meals",
      value: `${pastYear(JOB_WOMACK.periodStart)}, ${money(JOB_WOMACK.totalValue)}, main contractor. Not used here: it has no reference contact, and its federal performance rating (CPARS) is not written yet.`,
      from: "Your GovPreneurs profile, jobs list",
    },
  ],

  asks: [
    {
      id: "mk-ask-pay",
      kind: "enter",
      title: "What you pay each role (3 roles)",
      source: S_WD_RATES,
      why: "The price starts from what you pay. Each rate needs to meet its wage floor, or you owe back pay.",
      owner: "bookkeeper",
      leadDays: 2,
      minutes: 15,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "fld-pay-cook",
            label: "Cook, per hour",
            unit: "usd-hour",
            hint: "What you pay now, before taxes.",
            floor: { value: 17.9, why: "Cook I rate in the wage determination." },
          },
          {
            id: "fld-pay-driver",
            label: "Cook who also drives, per hour",
            unit: "usd-hour",
            hint: "What you pay now, before taxes. A driver's hours need the driver rate.",
            floor: {
              value: 18.4,
              why: "Light truck driver rate in the wage determination.",
            },
          },
          {
            id: "fld-pay-parttime",
            label: "Part-time cook, per hour",
            unit: "usd-hour",
            hint: "What you plan to pay the new hire.",
            floor: { value: 17.9, why: "Cook I rate in the wage determination." },
          },
        ],
      },
      feeds: [
        "Price · Cook",
        "Price · Cook who also drives",
        "Price · Part-time cook",
        "Hard requirement · Wage floors",
      ],
    },
    {
      id: "mk-ask-hw",
      kind: "answer",
      title: "How you pay health and welfare",
      source: S_WD_HW,
      why: "The wage determination adds $5.36 for every paid hour. You can pay it as cash or as benefits.",
      owner: "bookkeeper",
      leadDays: 1,
      minutes: 5,
      answer: {
        type: "answer",
        question: "How do you pay the $5.36 an hour for health and welfare?",
        choices: [
          {
            id: "hw-cash",
            label: "As extra cash in each paycheck",
            consequence: "Ava adds $5.36 to every paid hour. Payroll taxes apply to the cash.",
          },
          {
            id: "hw-benefits",
            label: "As health insurance and other benefits",
            consequence: "Ava adds $5.36 an hour. If benefits cost less, you pay the rest as cash.",
          },
          {
            id: "hw-mix",
            label: "Part benefits, part cash",
            consequence:
              "Ava adds $5.36 an hour. Payroll taxes on the cash part are not in the price.",
          },
        ],
      },
      feeds: ["Price · Health and welfare"],
    },
    {
      id: "mk-ask-payroll",
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
            fieldId: "fld-suta",
            label: "Unemployment tax, state and federal",
            value: 1.6,
            unit: "percent",
            where: "Tax summary, page 2",
          },
          {
            fieldId: "fld-wc",
            label: "Workers' comp premium",
            value: 2.4,
            unit: "percent",
            where: "Employer costs, page 3",
          },
        ],
      },
      feeds: ["Price · Unemployment tax", "Price · Workers' comp"],
    },
    {
      id: "mk-ask-food",
      kind: "enter",
      title: "Food and packaging cost per meal",
      source: S_SCHEDULE,
      why: "Food is the biggest cost after pay. Only you know what your supplier charges.",
      owner: "you",
      leadDays: 3,
      minutes: 20,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "fld-food-b",
            label: "Breakfast, food and packaging",
            unit: "usd",
            hint: "Use your supplier's current prices.",
          },
          {
            id: "fld-food-d",
            label: "Dinner, food and packaging",
            unit: "usd",
            hint: "Use your supplier's current prices.",
          },
        ],
      },
      feeds: ["Price · Breakfast", "Price · Dinner"],
    },
    {
      id: "mk-ask-other-costs",
      kind: "enter",
      title: "Other yearly costs for this contract",
      source: S_CONTRACT,
      why: "The price per meal is fixed. These costs come out of it. Ava never puts its own guess in your price.",
      owner: "you",
      leadDays: 2,
      minutes: 20,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "fld-oc-vehicle",
            label: "Delivery vehicles and fuel, per year",
            unit: "usd",
            // Fuel alone at the federal mileage rate. The sample answers never go
            // under it (testLab.ts), so a played bid carries a real fuel cost.
            floor: {
              value: FUEL_START,
              why: "Fuel for every run at 70 cents a mile.",
            },
            hint: `Ava's starting point: ${RUNS} runs × ${TRIP_MILES} miles × 70 cents = about ${money(FUEL_START)}. That is 2 runs a day on ${TRAINING_DAYS} training days. Enter your own figure.`,
          },
          {
            id: "fld-oc-carriers",
            label: "Replacing worn insulated carriers, per year",
            unit: "usd",
            hint: "Ava's starting point: 4 carriers × $300 = about $1,200. Enter your own figure.",
          },
          {
            id: "fld-oc-badges",
            label: "Driver time to get installation access, per year",
            unit: "usd",
            hint: `Ava's starting point: ${DRIVERS} drivers × 8 hours × $19 = about $300. Enter your own figure.`,
          },
        ],
      },
      feeds: [
        "Price · Delivery vehicles and fuel",
        "Price · Insulated carriers",
        "Price · Installation access",
      ],
    },
    {
      id: "mk-ask-pl",
      kind: "upload",
      title: "Your 2025 profit and loss statement",
      source: S_PRICE,
      why: "Ava works out your overhead from it: rent, utilities, insurance and office costs.",
      owner: "bookkeeper",
      leadDays: 3,
      minutes: 10,
      answer: {
        type: "upload",
        accepts: "Your 2025 profit and loss statement, from your bookkeeper",
        extracts: [
          {
            fieldId: "fld-overhead",
            label: "Overhead, as a share of direct cost",
            value: 11.5,
            unit: "percent",
            where: "Operating expenses, page 1",
          },
        ],
      },
      feeds: ["Price · Overhead"],
    },
    {
      id: "mk-ask-contingency",
      kind: "enter",
      title: "Your contingency, for costs that run over",
      source: S_PRICE,
      why: "A reserve for costs that come in higher than you planned, such as food prices. Ava never picks it.",
      owner: "you",
      leadDays: 0,
      minutes: 5,
      answer: {
        type: "enter",
        fields: [
          {
            id: "contingency",
            label: "Contingency, as a percent of cost",
            unit: "percent",
            hint: "Added to labor, direct costs and overhead, before profit. Enter 0 if you want none.",
          },
        ],
      },
      deliberate: true,
      feeds: ["Price · Contingency"],
    },
    {
      id: "mk-ask-profit",
      kind: "enter",
      title: "Your profit, and any yearly increase for option periods",
      source: S_PRICE,
      why: "Ava never picks your margin. The lowest acceptable price wins, so this is your call.",
      owner: "you",
      leadDays: 1,
      minutes: 15,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "fld-profit",
            label: "Profit",
            unit: "percent",
            hint: "A share of your total cost.",
          },
          {
            id: "fld-escalation",
            label: "Yearly increase for each option period",
            unit: "percent",
            hint: "Enter 0 to keep your year-one prices.",
          },
        ],
      },
      feeds: ["Price · Profit", "Price · Option periods"],
    },
    {
      id: "mk-ask-ref1",
      kind: "approve",
      title: "Fort Bragg dining support as reference 1",
      source: S_PP,
      why: `It is Army dining work from ${Y_CDG}, the closest match to this job.`,
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: "Use your Fort Bragg dining job as reference 1? Mike Sutton is the contact.",
        from: "Your GovPreneurs profile, jobs list",
        value: "Fort Bragg dining support. Contact: Mike Sutton",
        asOf: `The contact's title is from ${Y_CDG}. It may have changed.`,
      },
      feeds: ["Similar work · Reference 1"],
    },
    {
      id: "mk-ask-ref2",
      kind: "approve",
      title: "Cumberland County Schools summer meals as reference 2",
      source: S_PP,
      why: "It shows daily delivery at volume, with temperature logs, as the main contractor.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal:
          "Use your Cumberland County Schools summer meals job as reference 2? Janet Reyes is the contact.",
        from: "Your GovPreneurs profile, jobs list",
        value: "Cumberland County Schools summer meals program. Contact: Janet Reyes",
        asOf: `The contact's title is from ${Y_SCHOOLS}. It may have changed.`,
      },
      feeds: ["Similar work · Reference 2"],
    },
    {
      id: "mk-ask-refcontacts",
      kind: "enter",
      title: "Current phone and email for your two references",
      source: S_REF_FORM,
      why: "The Army may call them. A wrong number can make this part not acceptable.",
      owner: "references",
      leadDays: 5,
      minutes: 10,
      answer: {
        type: "enter",
        fields: [
          { id: "fld-ref1-phone", label: "Mike Sutton, phone", unit: "phone" },
          { id: "fld-ref1-email", label: "Mike Sutton, email", unit: "email" },
          { id: "fld-ref2-phone", label: "Janet Reyes, phone", unit: "phone" },
          { id: "fld-ref2-email", label: "Janet Reyes, email", unit: "email" },
        ],
      },
      feeds: ["Form · Reference form, Attachment 4"],
    },
    {
      id: "mk-ask-temps",
      kind: "answer",
      title: "How you check food temperatures on the road",
      source: S_TEMPS,
      why: "The work statement asks for readings at loading and at delivery. Ava writes only what you do.",
      owner: "you",
      leadDays: 0,
      minutes: 5,
      answer: {
        type: "answer",
        question: "How do you check food temperatures while meals travel today?",
        choices: [
          {
            id: "t-probe",
            label: "Probe thermometer at loading and at drop-off, on a paper log",
            consequence: "Ava writes this method as it is.",
          },
          {
            id: "t-logger",
            label: "Probe checks, plus data loggers inside the carriers",
            consequence: "Ava writes both, and keeps the logger records for the Army.",
          },
          {
            id: "t-none",
            label: "We do not check them on the road today",
            consequence:
              "Ava writes the method the work statement asks for. You start it on day one.",
          },
        ],
      },
      feeds: ["Draft · Food safety", "Promise · Food temperatures"],
    },
    {
      id: "mk-ask-access",
      kind: "answer",
      title: "How your drivers get installation access",
      source: S_ACCESS,
      why: "Drivers cannot reach the delivery points without access. The background check takes time, so plan it now.",
      owner: "you",
      leadDays: 1,
      minutes: 5,
      answer: {
        type: "answer",
        question: "How will your drivers get access to Camp Mackall?",
        choices: [
          {
            id: "a-have",
            label: "They already hold installation access cards",
            consequence: "Ava writes that your drivers are ready now.",
          },
          {
            id: "a-apply",
            label: "They apply after award, before the first delivery",
            consequence: "Ava writes this plan and adds the time to your start dates.",
          },
          {
            id: "a-cannot",
            label: "No driver can be cleared before the start",
            failsGate:
              "Only cleared staff may deliver on the installation. Without them the quote cannot be acceptable.",
          },
        ],
      },
      feeds: ["Draft · Staffing"],
    },
    {
      id: "mk-ask-wosb",
      // Grant asks the same question. One answer serves both (lib/ava/grant.ts).
      grantQuestion: "mk-wosb-cert",
      grantChoices: { Yes: "wosb-yes", No: "wosb-no" },
      kind: "answer",
      title: "Your woman-owned small business certification",
      source: S_SET_ASIDE,
      why: "Only certified woman-owned small businesses may quote. Grant asks you the same question, so you answer it once.",
      owner: "you",
      leadDays: 0,
      minutes: 1,
      answer: {
        type: "answer",
        question: "Is your woman-owned certification active?",
        choices: [
          {
            id: "wosb-yes",
            label: "Yes, it is active",
            consequence: "Ava writes that you are a certified woman-owned small business.",
          },
          {
            id: "wosb-no",
            label: "No, it is not active",
            failsGate:
              "Only certified firms may quote on this bid request. The bid goes back to a bid decision.",
          },
        ],
      },
      feeds: ["Hard requirement · Woman-owned status"],
    },
    {
      id: "mk-ask-fh",
      kind: "answer",
      title: "Food handler certificate for each cook",
      source: S_FH,
      why: "The Army asks for proof for every cook. Ava asks for the certificates when you have them all.",
      owner: "you",
      leadDays: 3,
      minutes: 2,
      answer: {
        type: "answer",
        question: `${PERSONA.foodHandlerCertified} of your ${PERSONA.employeesW2} cooks hold a food handler certificate. What about the other ${COOKS_WITHOUT}?`,
        choices: [
          {
            id: "fh-course",
            label: "They finish the course before I send the quote",
            consequence: "Ava asks you for every certificate when they are due.",
            // A plan is not the proof: the rule stays Confirm until the copies come.
            gives: {
              status: "confirm",
              evidence: `${PERSONA.foodHandlerCertified} of your ${PERSONA.employeesW2} cooks hold one. The other ${COOKS_WITHOUT} finish the course before you send the quote.`,
            },
            opensAskId: "mk-ask-fh-copies",
          },
          {
            id: "fh-late",
            label: `They cannot finish before ${DM(DUE_DAYS)}`,
            failsGate:
              "The quote needs a certificate for every cook. Without it the quote cannot be acceptable.",
          },
        ],
      },
      feeds: ["Hard requirement · Food handler certificates", "Draft · Staffing"],
    },
    {
      id: "mk-ask-fh-copies",
      kind: "upload",
      title: "Food handler certificates for all your cooks",
      source: S_FH,
      why: "The Army asks for a copy of the certificate of every cook with the quote.",
      owner: "you",
      leadDays: 1,
      minutes: 5,
      hiddenUntilOpened: true,
      // The day the copies are due in the bid: three days before the quote.
      decideByDaysFromNow: DUE_DAYS - 3,
      answer: {
        type: "upload",
        accepts:
          "One PDF with the current food handler certificate of each cook. A ServSafe Food Handler certificate counts",
      },
      feeds: ["Hard requirement · Food handler certificates"],
    },
    {
      id: "mk-ask-equip",
      kind: "enter",
      title: "Your insulated carriers and your backup if a van breaks down",
      source: S_CONTAINERS,
      why: "The work statement asks for insulated carriers and a backup if a vehicle fails. Ava writes only what you have.",
      owner: "you",
      leadDays: 0,
      minutes: 5,
      answer: {
        type: "enter",
        fields: [
          { id: "fld-carriers", label: "Insulated food carriers you own", unit: "count" },
          {
            id: "fld-backup",
            label: "Backup if a vehicle breaks down",
            unit: "text",
            hint: "For example, a second van or a rental you can get the same morning.",
          },
        ],
      },
      feeds: ["Draft · Equipment", "Draft · Backup vehicle"],
    },
  ],

  clarifications: [],

  plan: [
    {
      id: "mk-p-tech",
      source: S_TECH,
      kind: "scored-item",
      needs: "writing",
      ifMissed: "The quote is rated not acceptable and cannot win.",
      answeredIn: { kind: "section", id: "mk-s-tech", label: "Technical capability section" },
    },
    {
      id: "mk-p-menu",
      source: S_MENU,
      kind: "instruction",
      needs: "writing",
      ifMissed: "The technical statement leaves out how meals are planned.",
      answeredIn: { kind: "section", id: "mk-s-tech", label: "Technical capability section" },
    },
    {
      id: "mk-p-backup",
      source: S_BACKUP,
      kind: "instruction",
      needs: "writing",
      ifMissed: "An evaluator has to guess what happens when a vehicle fails.",
      answeredIn: { kind: "section", id: "mk-s-tech", label: "Technical capability section" },
      askId: "mk-ask-equip",
    },
    {
      id: "mk-p-fh",
      source: S_FH,
      kind: "instruction",
      needs: "attachment",
      ifMissed: "A cook with no certificate on file can make the quote not acceptable.",
      answeredIn: {
        kind: "section",
        id: "mk-s-tech",
        label: "Attached to the technical capability section",
      },
      askId: "mk-ask-fh",
    },
    {
      id: "mk-p-pp",
      source: S_PP,
      kind: "scored-item",
      needs: "writing",
      ifMissed: "The quote is rated not acceptable and cannot win.",
      answeredIn: { kind: "section", id: "mk-s-pp", label: "Section on your two similar jobs" },
      askId: "mk-ask-ref1",
    },
    {
      id: "mk-p-refform",
      source: S_REF_FORM,
      kind: "form",
      needs: "attachment",
      ifMissed: "The Army cannot reach your references, so this part may fail.",
      answeredIn: { kind: "form", id: "mk-fm-refs", label: "Reference form, Attachment 4" },
      askId: "mk-ask-refcontacts",
    },
    {
      id: "mk-p-price",
      source: S_PRICE,
      kind: "instruction",
      needs: "price",
      ifMissed: "A missing unit price makes the quote incomplete.",
      answeredIn: { kind: "price", id: "price", label: "Price schedule" },
      askId: "mk-ask-profit",
    },
    {
      id: "mk-p-wages",
      source: S_SCA,
      kind: "instruction",
      needs: "price",
      ifMissed: "You owe back pay if any rate is under the wage floor.",
      answeredIn: { kind: "price", id: "price", label: "Price schedule" },
      askId: "mk-ask-pay",
    },
    {
      id: "mk-p-sf1449",
      source: S_SIGN,
      kind: "form",
      needs: "signature",
      ifMissed: "An unsigned quote may be rejected as incomplete.",
      answeredIn: { kind: "form", id: "mk-fm-sf1449", label: "SF 1449, signed by you" },
    },
    {
      id: "mk-p-ack",
      source: S_ACK,
      kind: "form",
      needs: "signature",
      ifMissed: "A quote that misses an amendment may be rejected.",
      answeredIn: {
        kind: "form",
        id: "mk-fm-sf30-1",
        label: "SF 30 for Amendment 0001, signed by you",
      },
    },
    {
      id: "mk-p-reps",
      source: S_REPS,
      kind: "form",
      needs: "signature",
      ifMissed: "The Army cannot award to a company whose answers are out of date.",
      answeredIn: { kind: "form", id: "mk-fm-reps", label: "Representations and certifications" },
    },
    {
      id: "mk-p-wosb",
      source: S_SET_ASIDE,
      kind: "instruction",
      needs: "action",
      ifMissed: "A company that is not certified cannot win this quote.",
      answeredIn: {
        kind: "checklist",
        id: "mk-ck-sam",
        label: "Checklist: your registration and status",
      },
      askId: "mk-ask-wosb",
    },
    {
      id: "mk-p-email",
      source: S_EMAIL,
      kind: "logistics",
      needs: "action",
      ifMissed: "A quote with the wrong subject line or over 10 MB may never arrive.",
      answeredIn: { kind: "checklist", id: "mk-ck-email", label: "Checklist: email the quote" },
    },
    {
      id: "mk-p-due",
      source: S_DUE,
      kind: "logistics",
      needs: "action",
      ifMissed: "A quote after 10:00 AM Eastern Time is not considered.",
      answeredIn: {
        kind: "checklist",
        id: "mk-ck-internal",
        label: "Checklist: internal deadline",
      },
    },
  ],

  // Pass-or-fail writing earns nothing for persuasion, so there are no themes.
  themes: [],

  sections: [
    {
      id: "mk-s-tech",
      title: "Technical capability",
      answers: S_TECH,
      criterionId: "mk-cr-tech",
      points: null,
      pageLimit: 5,
      pages: 4,
      paragraphs: [
        // 0 · Who does the work, and the similar work behind it. Both jobs
        // belong to the company: it was formed before either of them.
        [
          { text: `${PERSONA.businessName} will cook, pack and deliver every meal. ` },
          { text: `In ${Y_CDG}, ` },
          {
            text: LEAD_CDG,
            claim: { id: "mk-cl-pp2-lead", tag: "verified", proof: P_PP2_SCOPE },
          },
          { text: `. The company's ${Y_SCHOOLS} Cumberland County Schools job ` },
          {
            text: LEAD_SCHOOLS,
            claim: { id: "mk-cl-pp1-lead", tag: "verified", proof: P_PP1_SCOPE },
          },
          { text: "." },
        ],
        // 1 · Preparation.
        [
          { text: "Cooks prepare each meal in the company kitchen on the day it is served. " },
          { text: "Breakfast is made from 3:30 AM. " },
          { text: "Dinner is made from 12:00 PM. " },
          { text: "Menus follow the 21-day cycle and meal pattern in the work statement." },
        ],
        // 2 · Packing and transport.
        [
          {
            text: "Hot food goes into insulated carriers, and cold food into insulated coolers with ice packs. ",
          },
          {
            text: "The company owns 2 refrigerated delivery vans",
            claim: { id: "mk-cl-vans", tag: "verified", proof: P_VANS },
          },
          { text: ", and " },
          {
            text: "its insulated carriers cover both daily runs",
            claim: {
              id: "mk-cl-equip",
              tag: "unsupported",
              askId: "mk-ask-equip",
              gap: "[NEEDED: how many insulated carriers you have]",
              resolvedText: "its own insulated carriers cover both daily runs",
              resolvedTemplate: "its {fld-carriers} insulated carriers cover both daily runs",
            },
          },
          {
            text: `. Each van takes one delivery point, so one run serves both points. Meals leave the kitchen by 4:10 AM for the drive of about ${MILES} miles. `,
          },
          {
            text: "A backup vehicle covers any breakdown",
            claim: {
              id: "mk-cl-backup",
              tag: "unsupported",
              askId: "mk-ask-equip",
              gap: "[NEEDED: your backup if a delivery vehicle breaks down]",
              resolvedText: "A backup vehicle covers any breakdown",
              resolvedTemplate: "If a delivery vehicle breaks down, the backup is {fld-backup}",
            },
          },
          { text: "." },
        ],
        // 3 · Delivery on the training schedule.
        [
          {
            text: "Drivers deliver to the two points in Technical Exhibit 2, as changed by Amendment 0001. ",
          },
          {
            text: "Breakfast reaches each point by 5:30 AM",
            claim: { id: "mk-cl-window-am", tag: "commitment", commitmentId: "mk-c-window" },
          },
          { text: ". " },
          {
            text: "Dinner reaches each point by 5:00 PM",
            claim: { id: "mk-cl-window-pm", tag: "commitment", commitmentId: "mk-c-window" },
          },
          { text: ". Routes follow the training schedule the Army sends each Thursday. " },
          {
            text: "Headcount changes received 24 hours ahead are met in full",
            claim: { id: "mk-cl-headcount", tag: "commitment", commitmentId: "mk-c-headcount" },
          },
          { text: "." },
        ],
        // 4 · Food safety and temperature records.
        [
          {
            text: "Hot food stays at 135°F or above, and cold food at 41°F or below",
            claim: { id: "mk-cl-temps", tag: "commitment", commitmentId: "mk-c-temps" },
          },
          { text: ". " },
          {
            text: "Staff check every container with a probe thermometer at loading and at drop-off",
            claim: {
              id: "mk-cl-probe",
              tag: "unsupported",
              askId: "mk-ask-temps",
              gap: "[NEEDED: how you check food temperatures during transport today]",
              resolvedText: "Staff probe-check every container at loading and at drop-off",
            },
          },
          { text: ". " },
          {
            text: "Every reading goes on a log kept for the contracting officer",
            claim: { id: "mk-cl-log", tag: "commitment", commitmentId: "mk-c-temps" },
          },
          { text: ". " },
          {
            text: `The company's ${Y_SCHOOLS} school meals job kept daily temperature logs`,
            claim: { id: "mk-cl-pp1-logs", tag: "verified", proof: P_PP1_LOGS },
          },
          { text: "." },
        ],
        // 5 · Staffing: the one staffing plan the price uses. Three of the
        // five cooks hold a certificate today. The draft never says all do.
        [
          {
            text: `The work is staffed by ${PERSONA.employeesW2} cooks, ${DRIVERS} of whom also drive`,
            claim: { id: "mk-cl-staff", tag: "commitment", commitmentId: "mk-c-staff" },
          },
          { text: ". The company has " },
          {
            text: `${PERSONA.employeesW2} employees now`,
            claim: { id: "mk-cl-headcount-now", tag: "verified", proof: P_STAFF_COUNT },
          },
          { text: " and will hire " },
          {
            text: `${PLAN.partTime.count} part-time cook for the ${OVERLAP_WEEKS} weeks when two rotations overlap`,
            claim: { id: "mk-cl-hire", tag: "commitment", commitmentId: "mk-c-staff" },
          },
          { text: ". " },
          {
            text: `${PERSONA.foodHandlerCertified} of the ${PERSONA.employeesW2} cooks hold a current food handler certificate`,
            claim: { id: "mk-cl-food-handlers", tag: "verified", proof: P_FOOD_HANDLERS },
          },
          { text: ", and " },
          {
            text: `the other ${COOKS_WITHOUT} finish the course before this quote is sent`,
            claim: { id: "mk-cl-course", tag: "commitment", commitmentId: "mk-c-staff" },
          },
          { text: ". " },
          {
            text: "Each driver clears the installation access check before the first delivery",
            claim: {
              id: "mk-cl-access",
              tag: "unsupported",
              askId: "mk-ask-access",
              gap: "[NEEDED: how your drivers will get installation access]",
              resolvedText:
                "Each driver clears the installation access check before the first delivery, as planned",
              resolvedByChoice: {
                "a-have": "Each driver already holds installation access",
                "a-apply":
                  "Each driver applies after award and clears the installation access check before the first delivery",
              },
            },
          },
          { text: "." },
        ],
      ],
      decisions: [
        {
          id: "mk-dec-lead",
          paragraphIndex: 0,
          choice: `${SENT_CDG} ${SENT_SCHOOLS}`,
          other: `${SENT_SCHOOLS} ${SENT_CDG}`,
        },
      ],
      challenges: [
        {
          id: "mk-ch-order",
          prompt: "Why lead with the Fort Bragg job instead of the school meals?",
          reasoning:
            "Ava's reasoning: Fort Bragg is Army dining work, the closest match to this job. The school job shows daily delivery at volume, which this job also needs. Both jobs stay in the section either way. The Womack job stays out: it has no reference contact, and its federal performance rating (CPARS) is not written yet.",
          options: [
            {
              id: "mk-ch-order-school",
              label: "Lead with the school meals",
              paragraphIndex: 0,
              redline: {
                remove: `${SENT_CDG} ${SENT_SCHOOLS}`,
                insert: [
                  { text: `The company's ${Y_SCHOOLS} Cumberland County Schools job ` },
                  {
                    text: LEAD_SCHOOLS,
                    claim: { id: "mk-cl-pp1-lead-b", tag: "verified", proof: P_PP1_SCOPE },
                  },
                  { text: `. In ${Y_CDG}, ` },
                  {
                    text: LEAD_CDG,
                    claim: { id: "mk-cl-pp2-lead-b", tag: "verified", proof: P_PP2_SCOPE },
                  },
                  { text: "." },
                ],
              },
            },
            {
              id: "mk-ch-order-records",
              label: "Keep Fort Bragg first and add its food safety records",
              paragraphIndex: 0,
              redline: {
                remove: LEAD_CDG,
                insert: [
                  {
                    text: LEAD_CDG,
                    claim: { id: "mk-cl-pp2-lead-c", tag: "verified", proof: P_PP2_SCOPE },
                  },
                  { text: ". " },
                  {
                    text: "It kept full food safety records there under the main contractor's plan",
                    claim: { id: "mk-cl-pp2-records", tag: "verified", proof: P_PP2_RECORDS },
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      id: "mk-s-pp",
      title: "Past performance: two similar jobs you have done",
      answers: S_PP,
      criterionId: "mk-cr-pp",
      points: null,
      pageLimit: null,
      pages: 1,
      paragraphs: [
        [
          { text: "Reference 1: " },
          {
            text: `Fort Bragg dining facility support, ${pastDate(JOB_CDG.periodStart)} to ${pastDate(JOB_CDG.periodEnd)}, ${money(JOB_CDG.totalValue)}`,
            claim: { id: "mk-cl-r1-terms", tag: "verified", proof: P_PP2_TERMS },
          },
          { text: ". " },
          {
            text: `${PERSONA.businessShortName} worked as a subcontractor to Carolina Dining Group, doing 30% of the work`,
            claim: { id: "mk-cl-r1-role", tag: "verified", proof: P_PP2_ROLE },
          },
          { text: ". " },
          {
            text: "It served weekend and holiday meals at two on-post dining facilities, with food safety records",
            claim: { id: "mk-cl-r1-scope", tag: "verified", proof: P_PP2_SCOPE },
          },
          { text: ". Contact: " },
          {
            text: "Mike Sutton, Operations Manager, Carolina Dining Group",
            claim: { id: "mk-cl-r1-contact", tag: "verified", proof: P_PP2_REF },
          },
          { text: "." },
        ],
        [
          { text: "Reference 2: " },
          {
            text: `Cumberland County Schools summer meals program, ${pastDate(JOB_SCHOOLS.periodStart)} to ${pastDate(JOB_SCHOOLS.periodEnd)}, ${money(JOB_SCHOOLS.totalValue)}`,
            claim: { id: "mk-cl-r2-terms", tag: "verified", proof: P_PP1_TERMS },
          },
          { text: ". " },
          {
            text: "It was a direct contract with the school district",
            claim: { id: "mk-cl-r2-prime", tag: "verified", proof: P_PP1_ROLE },
          },
          { text: ". " },
          {
            text: "The work was 1,100 breakfasts and lunches a day, cooked and delivered to nine sites",
            claim: { id: "mk-cl-r2-scope", tag: "verified", proof: P_PP1_SCOPE },
          },
          { text: ". " },
          {
            text: "The job kept daily temperature logs",
            claim: { id: "mk-cl-r2-logs", tag: "verified", proof: P_PP1_LOGS },
          },
          { text: ". Contact: " },
          {
            text: "Janet Reyes, Child Nutrition Director, Cumberland County Schools",
            claim: { id: "mk-cl-r2-contact", tag: "verified", proof: P_PP1_REF },
          },
          { text: "." },
        ],
      ],
      challenges: [],
    },
  ],

  price: {
    sheetName: "The meal price schedule on the SF 1449 continuation pages",
    sheetFileId: RFQ,
    contractType:
      "Fixed price per meal for the 12-month base period. Option periods at the increase you choose.",
    contractTypeSource: S_CONTRACT,
    // The rotation weeks: the weeks of a contract year when anyone works.
    weeks: ROTATION_WEEKS,
    // The one staffing plan. The technical section describes these same people.
    roles: [
      {
        id: "mk-role-cook",
        name: "Cook",
        ...PLAN.cook,
        pay: { askId: "mk-ask-pay", fieldId: "fld-pay-cook" },
        wageFloor: { perHour: 17.9, source: S_WD_COOK },
      },
      {
        id: "mk-role-driver",
        name: "Cook who also drives",
        ...PLAN.driver,
        pay: { askId: "mk-ask-pay", fieldId: "fld-pay-driver" },
        // Driving hours take the higher driver rate.
        wageFloor: { perHour: 18.4, source: S_WD_DRIVER },
      },
      {
        id: "mk-role-parttime",
        name: "Part-time cook",
        ...PLAN.partTime,
        pay: { askId: "mk-ask-pay", fieldId: "fld-pay-parttime" },
        wageFloor: { perHour: 17.9, source: S_WD_COOK },
      },
    ],
    burden: [
      {
        id: "mk-b-fica",
        label: "Social Security and Medicare",
        from: { kind: "law", rate: 7.65, text: "The employer share set by federal law." },
      },
      {
        id: "mk-b-hw",
        label: "Health and welfare",
        from: {
          kind: "per-hour",
          amount: 5.36,
          text: "Wage determination amount for every paid hour.",
          source: S_WD_HW,
          // Paid as cash in the paycheck, it is wages: payroll taxes apply to it.
          cashWhen: { askId: "mk-ask-hw", choiceId: "hw-cash" },
        },
      },
      {
        id: "mk-b-holidays",
        label: "Paid holidays",
        from: {
          kind: "law",
          rate: 4.23,
          text: "Eleven paid holidays in the wage determination: 88 of 2,080 hours a year.",
          source: S_WD_HOLIDAYS,
        },
      },
      {
        id: "mk-b-vacation",
        label: "Paid vacation",
        from: {
          kind: "law",
          // 2 weeks of 52: 80 of 2,080 hours a year.
          rate: 3.85,
          text: "Vacation in the wage determination: 2 weeks a year after 1 year.",
          source: S_WD_VACATION,
        },
      },
      {
        id: "mk-b-suta",
        label: "Unemployment tax",
        from: {
          kind: "ask",
          askId: "mk-ask-payroll",
          fieldId: "fld-suta",
          text: "From your payroll report.",
        },
      },
      {
        id: "mk-b-wc",
        label: "Workers' comp",
        from: {
          kind: "ask",
          askId: "mk-ask-payroll",
          fieldId: "fld-wc",
          text: "From your payroll report.",
        },
      },
    ],
    lines: [
      {
        id: "mk-l-bfast",
        item: "Breakfast, per meal",
        unit: "per meal",
        qty: MEALS,
        qtySource: doc(
          RFQ,
          "SF 1449 continuation, page 3, CLIN 0001",
          "CLIN 0001",
          `0001 BREAKFAST, FIELD FEEDING, PER MEAL. ESTIMATED QUANTITY: ${MEALS.toLocaleString("en-US")} EA`,
        ),
        laborShare: 0.5,
        direct: { askId: "mk-ask-food", fieldId: "fld-food-b", label: "Food and packaging" },
      },
      {
        id: "mk-l-dinner",
        item: "Dinner, per meal",
        unit: "per meal",
        qty: MEALS,
        qtySource: doc(
          RFQ,
          "SF 1449 continuation, page 3, CLIN 0002",
          "CLIN 0002",
          `0002 DINNER, FIELD FEEDING, PER MEAL. ESTIMATED QUANTITY: ${MEALS.toLocaleString("en-US")} EA`,
        ),
        laborShare: 0.5,
        direct: { askId: "mk-ask-food", fieldId: "fld-food-d", label: "Food and packaging" },
      },
    ],
    overhead: {
      askId: "mk-ask-pl",
      fieldId: "fld-overhead",
      text: "From your 2025 profit and loss statement, as a share of direct cost.",
    },
    profit: { askId: "mk-ask-profit", fieldId: "fld-profit" },
    contingency: { askId: "mk-ask-contingency", fieldId: "contingency" },
    otherCosts: [
      {
        id: "mk-oc-carriers",
        label: "Insulated food carriers",
        yearly: {
          kind: "ask",
          askId: "mk-ask-other-costs",
          fieldId: "fld-oc-carriers",
          text: "Your own figure for worn carriers replaced each year",
        },
        inPrice: true,
      },
      {
        id: "mk-oc-vehicle",
        label: "Delivery vehicle and fuel",
        yearly: {
          kind: "ask",
          askId: "mk-ask-other-costs",
          fieldId: "fld-oc-vehicle",
          text: "Your own figure for fuel and wear on 2 delivery runs a day",
        },
        inPrice: true,
        commitmentId: "mk-c-window",
      },
      {
        id: "mk-oc-badges",
        label: "Installation access for drivers",
        yearly: {
          kind: "ask",
          askId: "mk-ask-other-costs",
          fieldId: "fld-oc-badges",
          text: "Your own figure for paid driver time at the visitor center",
        },
        // A small cost: the price carries it, so the check has nothing to ask.
        inPrice: true,
        commitmentId: "mk-c-staff",
      },
    ],
    // Every CLIN is priced for the base period and each option period. The
    // option years use the member's own yearly increase.
    periods: {
      count: 2,
      label: "Option year",
      escalation: { askId: "mk-ask-profit", fieldId: "fld-escalation" },
      source: S_PRICE,
    },
    payment: {
      text: "Paid within 30 days of a correct invoice. You carry about 2 months of pay and food first.",
      source: S_PAY,
    },
  },

  forms: [
    {
      id: "mk-fm-sf1449",
      name: "SF 1449, Solicitation/Contract/Order for Commercial Products and Commercial Services",
      source: S_SIGN,
      handling: ["ava-fills", "you-sign"],
      signer: "You, as the owner",
      filledFrom: "Your registration details and your price schedule",
    },
    {
      id: "mk-fm-sf30-1",
      name: "SF 30, Amendment of Solicitation, for Amendment 0001",
      source: S_AMD1_ACK,
      handling: ["ava-fills", "you-sign"],
      signer: "You, as the owner",
      filledFrom: "The amendment number and your company details",
      acknowledgesAddendumId: "mk-add-1",
    },
    {
      id: "mk-fm-sf30-2",
      name: "SF 30, Amendment of Solicitation, for Amendment 0002",
      source: S_AMD2_ACK,
      handling: ["ava-fills", "you-sign"],
      signer: "You, as the owner",
      filledFrom: "The amendment number and your company details",
      acknowledgesAddendumId: "mk-add-2",
    },
    {
      id: "mk-fm-reps",
      name: "Representations and certifications, confirmed current in your registration",
      source: S_REPS,
      handling: ["you-sign"],
      signer: "You, as the owner",
    },
    {
      id: "mk-fm-price",
      name: "Price schedule on the SF 1449 continuation pages",
      source: S_SCHEDULE,
      handling: ["ava-fills"],
      filledFrom: "Your pay rates, costs and profit, recalculated line by line",
    },
    {
      id: "mk-fm-refs",
      name: "Attachment 4, reference form for your two similar jobs",
      source: S_REF_FORM,
      handling: ["ava-fills"],
      filledFrom: "Your two approved jobs and the contact details you enter",
    },
  ],

  submission: {
    method: "email",
    where: `By email to ${CO.name}, the Army contracting officer for this quote`,
    account: CO.email,
    source: S_EMAIL,
    limits: "10 MB in total, one PDF per volume, in one email",
    files: [
      {
        id: "mk-pk-tech",
        name: `Volume_I_Technical_Capability_${SHORT_FILE}.pdf`,
        covers: "Volume I, section 3.2",
        contains: [
          { kind: "section", id: "mk-s-tech" },
          { kind: "upload", id: "mk-ask-fh-copies" },
        ],
      },
      {
        id: "mk-pk-pp",
        name: `Volume_II_Past_Performance_${SHORT_FILE}.pdf`,
        covers: "Volume II and Attachment 4",
        contains: [
          { kind: "section", id: "mk-s-pp" },
          { kind: "form", id: "mk-fm-refs" },
        ],
      },
      {
        id: "mk-pk-price",
        name: `Volume_III_Price_${SHORT_FILE}.pdf`,
        covers: "Volume III and the price schedule",
        contains: [
          { kind: "price", id: "price" },
          { kind: "form", id: "mk-fm-price" },
        ],
      },
      {
        id: "mk-pk-forms",
        name: `Signed_Forms_${SHORT_FILE}.pdf`,
        covers: "SF 1449, each SF 30, section 3.5",
        contains: [
          { kind: "form", id: "mk-fm-sf1449" },
          { kind: "form", id: "mk-fm-sf30-1" },
          { kind: "form", id: "mk-fm-sf30-2" },
          { kind: "form", id: "mk-fm-reps" },
        ],
      },
    ],
    markings: [
      `Email subject line, word for word: "RFQ ${MACKALL_ID} – ${PERSONA.businessName}"`,
      "Each volume in its own PDF file, as section 3.6 asks.",
    ],
    checklist: [
      {
        id: "mk-ck-internal",
        label: `Internal deadline: ${D(DUE_DAYS - 1)}, 10:00 AM Eastern Time, one day early`,
        auto: true,
      },
      {
        id: "mk-ck-sam",
        label: "Check your federal registration is active and your answers are current",
      },
      {
        id: "mk-ck-fh",
        label: `Get the food handler certificate of all ${PERSONA.employeesW2} cooks. Add each one to Volume I before you send it`,
      },
      { id: "mk-ck-sign", label: "Sign the SF 1449 and each SF 30 amendment form" },
      { id: "mk-ck-reps", label: "Read and sign the representations and certifications statement" },
      { id: "mk-ck-subject", label: "Copy the email subject line word for word" },
      {
        id: "mk-ck-email",
        label: `Email the 4 PDF files to ${CO.name} before 10:00 AM Eastern Time`,
      },
      { id: "mk-ck-receipt", label: "Save the sent email as your receipt and upload it here" },
    ],
    certifying: [
      "You are a certified woman-owned small business, and your registration says so.",
      "You are small under the size standard for food service contractors.",
      "You will pay each worker at least the wage determination rate, plus health and welfare.",
      "Your registration answers are current and true on the day you sign.",
      "Your prices hold for 60 days after the due date.",
      "You will pay other companies no more than half of what the Army pays you.",
      "The two jobs in your references happened as described, with those values and dates.",
      "You can keep every promise in the technical statement, including the delivery times.",
    ],
  },

  reviewerFindings: [
    {
      id: "mk-rf-backup",
      sectionId: "mk-s-tech",
      criterionId: "mk-cr-tech",
      // A sentence Amendment 0002 does not rewrite, so the quote stays true.
      quote:
        "Drivers deliver to the two points in Technical Exhibit 2, as changed by Amendment 0001.",
      finding:
        "The work statement asks for a plan if a vehicle or equipment fails. The section does not say what happens if the delivery vehicle breaks down. An evaluator would have to guess.",
      suggestedFix:
        "Name the backup vehicle or rental plan, and how fast it reaches the delivery points.",
      severity: "material",
      askId: "mk-ask-equip",
    },
    {
      id: "mk-rf-access",
      sectionId: "mk-s-tech",
      criterionId: "mk-cr-tech",
      quote: "Each driver clears the installation access check before the first delivery",
      finding:
        "The work statement says staff who cannot be vetted may not be used. The section does not say how your drivers get installation access.",
      suggestedFix: "Say whether your drivers hold access now or apply after award.",
      severity: "material",
      askId: "mk-ask-access",
    },
  ],

  addenda: [
    {
      id: "mk-add-1",
      number: 1,
      fileId: AMD1,
      postedDaysFromNow: POSTED_AMD1,
      arrivesDuringBuild: false,
      otherChanges: 1,
      changes: [
        {
          id: "mk-a1-point",
          what: "Delivery Point 2",
          source: doc(
            AMD1,
            "SF 30, page 2, block 14, item 1",
            "Amd 0001",
            "Technical Exhibit 2 is revised. Delivery Point 2 is changed from Training Area Y-12 field site to Training Area Y-15 field site.",
          ),
          before: "Training Area Y-12 field site",
          now: "Training Area Y-15 field site",
          effect: "updated",
          effectText: "Ava built the draft and the delivery route to the new point.",
          patch: { kind: "none" },
        },
        {
          id: "mk-a1-questions",
          what: "Questions deadline",
          source: S_AMD1_QUESTIONS,
          before: `${D(QUESTIONS_DAYS - 7)}, 12:00 PM Eastern Time`,
          now: `${D(QUESTIONS_DAYS)}, 12:00 PM Eastern Time`,
          effect: "updated",
          effectText: `You can send questions to the Army until ${DM(QUESTIONS_DAYS)}.`,
          patch: { kind: "none" },
        },
        {
          id: "mk-a1-wd",
          what: "Wage determination",
          source: doc(
            AMD1,
            "SF 30, page 2, block 14, item 3",
            "Amd 0001",
            "Attachment 2 is replaced with Wage Determination No. 2015-4281, Revision No. 26.",
          ),
          before: "Revision 25, Cook I at $17.62 an hour",
          now: "Revision 26, Cook I at $17.90 an hour",
          effect: "updated",
          effectText: "Ava uses the Revision 26 pay floors in your price.",
          patch: { kind: "none" },
        },
      ],
      stillValid: "Due date, meal counts, delivery times, page limit and forms stayed the same.",
    },
    {
      id: "mk-add-2",
      number: 2,
      fileId: AMD2,
      postedDaysFromNow: POSTED_AMD1 + 3,
      arrivesDuringBuild: true,
      otherChanges: 2,
      changes: [
        {
          id: "mk-a2-bfast",
          what: "Estimated breakfasts, year one",
          source: doc(
            AMD2,
            "SF 30, page 2, block 14, item 1",
            "Amd 0002",
            `CLIN 0001, Breakfast: the estimated quantity is changed from ${MEALS.toLocaleString("en-US")} to ${MEALS_AMD2.toLocaleString("en-US")} to add weekend field training.`,
          ),
          before: `${MEALS.toLocaleString("en-US")} breakfasts`,
          now: `${MEALS_AMD2.toLocaleString("en-US")} breakfasts`,
          effect: "reopened",
          effectText:
            "Your breakfast price changes. Staff hours stay as they are until you change them.",
          patch: { kind: "price-qty", lineId: "mk-l-bfast", qty: MEALS_AMD2 },
        },
        {
          id: "mk-a2-dinner",
          what: "Estimated dinners, year one",
          source: doc(
            AMD2,
            "SF 30, page 2, block 14, item 2",
            "Amd 0002",
            `CLIN 0002, Dinner: the estimated quantity is changed from ${MEALS.toLocaleString("en-US")} to ${MEALS_AMD2.toLocaleString("en-US")} to add weekend field training.`,
          ),
          before: `${MEALS.toLocaleString("en-US")} dinners`,
          now: `${MEALS_AMD2.toLocaleString("en-US")} dinners`,
          effect: "reopened",
          effectText:
            "Your dinner price changes. Staff hours stay as they are until you change them.",
          patch: { kind: "price-qty", lineId: "mk-l-dinner", qty: MEALS_AMD2 },
        },
        {
          id: "mk-a2-window",
          what: "Breakfast delivery time",
          source: doc(
            AMD2,
            "SF 30, page 3, block 14, item 3",
            "Amd 0002",
            "PWS paragraph 5.3 is revised to read: Breakfast shall arrive at each delivery point no later than 0500, including on weekend training days.",
          ),
          before: "By 5:30 AM, weekdays",
          now: "By 5:00 AM, weekends included",
          effect: "reopened",
          effectText:
            "You approved 5:30 AM. The Army now asks for 5:00 AM. Ava rewrote the times in the draft.",
          patch: {
            kind: "commitment",
            commitmentId: "mk-c-window",
            text: WINDOW_TEXT_AMD2,
            pricedAs: "Priced as: a cook shift from 3:00 AM and 2 runs a day, weekends included.",
          },
          // Every sentence in the technical section that states the old window.
          alsoPatches: [
            {
              kind: "draft-text",
              sectionId: "mk-s-tech",
              paragraphIndex: 1,
              remove: "Breakfast is made from 3:30 AM.",
              insert: [{ text: "Breakfast is made from 3:00 AM." }],
            },
            {
              kind: "draft-text",
              sectionId: "mk-s-tech",
              paragraphIndex: 2,
              remove: "Meals leave the kitchen by 4:10 AM",
              insert: [{ text: "Meals leave the kitchen by 3:40 AM" }],
            },
            {
              kind: "draft-text",
              sectionId: "mk-s-tech",
              paragraphIndex: 3,
              remove: "Breakfast reaches each point by 5:30 AM",
              insert: [
                {
                  text: "Breakfast reaches each point by 5:00 AM, weekends included",
                  claim: {
                    id: "mk-cl-window-am-0002",
                    tag: "commitment",
                    commitmentId: "mk-c-window",
                  },
                },
              ],
            },
          ],
        },
        {
          id: "mk-a2-ack",
          what: "Amendment acknowledgment",
          source: S_AMD2_ACK,
          before: "One SF 30 to sign",
          now: "Two SF 30 forms to sign",
          effect: "updated",
          effectText: "Ava added the Amendment 0002 form to your package for you to sign.",
          patch: { kind: "none" },
        },
      ],
      stillValid: "Due date, pay floors, references and the other promises stayed the same.",
    },
  ],

  // Page 1 facts that no other part of the bid carries. A null is a fact the
  // Army's files do not state: page 1 shows "Not stated".
  overview: {
    noticeType: {
      text: "Request for Quote, with the notice and the rules in one document.",
      source: S_AWARD,
    },
    summary: {
      text: "Cook, pack and deliver breakfast and dinner to soldiers at Camp Mackall field sites during training rotations.",
      source: S_TECH,
    },
    work: [
      {
        text: `About ${ROTATION_WEEKS} weekly training rotations a year, with meals for ${DROP_POINTS} delivery points.`,
        source: S_ROTATIONS,
      },
      { text: "Breakfast and dinner, on a 21-day menu.", source: S_MENU },
      { text: "Meals delivered to each delivery point by set times.", source: S_WINDOW },
      {
        text: "Headcounts can change by up to 20%, with 24 hours of notice.",
        source: S_HEADCOUNT,
      },
      {
        text: "Insulated containers that keep food safe for at least 4 hours.",
        source: S_CONTAINERS,
      },
      { text: "A backup plan when a vehicle or equipment fails.", source: S_BACKUP },
    ],
    place: { text: "Two delivery points at the Camp Mackall training site.", source: S_ROTATIONS },
    hours: null,
    staffing: {
      text: "A current food handler certificate for every cook, and a copy of each one with the quote.",
      source: S_FH,
    },
    serviceLevels: {
      text: "Hot food at 135°F or more, cold food at 41°F or less. Both logged at loading and delivery.",
      source: S_TEMPS,
    },
    outOfScope: null,
    term: {
      text: "One fixed-price contract: a 12-month base period and two 12-month option periods.",
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
      text: `By email to ${CO.name}, who runs this quote for the Army.`,
      source: S_AMD1_QUESTIONS,
    },
    noContact: null,
    buyerPortal: null,
    dates: [],
    expectedAward: {
      text: `The Army expects to award on or about ${D(AWARD_DAYS)}.`,
      source: S_AWARD_DATE,
    },
    start: null,
    validity: { text: "Quotes stay valid for 60 days after the closing date.", source: S_VALID },
    setAside: {
      text: "Only certified woman-owned small businesses, registered as such in SAM.",
      source: S_SET_ASIDE,
    },
    size: {
      text: `Industry code ${PERSONA.primaryNaics}, food service contractors. Small means under $47 million a year.`,
      source: S_SIZE,
    },
    lateRule: { text: "Quotes that arrive after the deadline are not considered.", source: S_DUE },
    subcontracting: {
      text: "Subcontractors that are not woman-owned small businesses can get at most half of the pay.",
      source: S_SUBS,
    },
  },

  samLegalName: PERSONA.businessName,
  nameInDraft: PERSONA.businessName,
};

// ─── What she told Ava ───
// The seed below and the starting state (lib/ava/starts/mackall.ts) both read
// these answers, so what she said is written once. The pay rates meet the wage
// floors. The food costs are about 38% of the price per meal.

const AT = (minute: number) => ISO(-1, 15, minute);

export const mackallAnswers: Record<string, AskAnswer> = {
  // She answered Grant's question before she started the bid. Grant keeps the
  // same answer (demo/ava/grantFacts.ts), so Ava does not ask it twice.
  "mk-ask-wosb": {
    status: "done",
    at: ISO(-2, 15, 30),
    choiceId: "wosb-yes",
    fromGrant: "Yes",
  },
  "mk-ask-hw": { status: "done", at: AT(10), choiceId: "hw-cash" },
  "mk-ask-pay": {
    status: "done",
    at: AT(14),
    values: { "fld-pay-cook": 18.9, "fld-pay-driver": 19.4, "fld-pay-parttime": 18.9 },
  },
  "mk-ask-payroll": {
    status: "done",
    at: AT(18),
    fileName: `${SHORT_FILE}_Payroll_Summary.pdf`,
    values: { "fld-suta": 1.6, "fld-wc": 2.4 },
  },
  "mk-ask-pl": {
    status: "done",
    at: AT(22),
    fileName: `${SHORT_FILE}_Profit_and_Loss_2025.pdf`,
    values: { "fld-overhead": 11.5 },
  },
  "mk-ask-food": {
    status: "done",
    at: AT(30),
    values: { "fld-food-b": 3.95, "fld-food-d": 4.75 },
  },
  "mk-ask-other-costs": {
    status: "done",
    at: AT(36),
    values: { "fld-oc-vehicle": FUEL_START, "fld-oc-carriers": 1_200, "fld-oc-badges": 300 },
  },
  "mk-ask-contingency": { status: "done", at: AT(40), values: { contingency: 5 } },
  "mk-ask-profit": {
    status: "done",
    at: AT(44),
    values: { "fld-profit": 5, "fld-escalation": 5 },
  },
  "mk-ask-ref1": { status: "done", at: AT(50) },
  "mk-ask-ref2": { status: "done", at: AT(51) },
  "mk-ask-refcontacts": {
    status: "done",
    at: AT(55),
    values: {
      "fld-ref1-phone": REFERENCE_CONTACTS.mikeSutton.phone,
      "fld-ref1-email": REFERENCE_CONTACTS.mikeSutton.email,
      "fld-ref2-phone": REFERENCE_CONTACTS.janetReyes.phone,
      "fld-ref2-email": REFERENCE_CONTACTS.janetReyes.email,
    },
  },
  "mk-ask-temps": { status: "done", at: AT(58), choiceId: "t-probe" },
  "mk-ask-equip": {
    status: "done",
    at: AT(59),
    values: {
      "fld-carriers": 16,
      "fld-backup": "the second van, which can take both points in two trips",
    },
  },
  // Three of her five cooks hold a certificate. The other two finish the
  // course this week. Ava asks for all the certificates when they are due.
  "mk-ask-fh": { status: "done", at: AT(56), choiceId: "fh-course" },
};

/** The three questions the story says wait on her: the written ones, by key. */
export const MACKALL_OPEN = ["ask:mk-ask-access", "promise:mk-c-window", "promise:mk-c-staff"];

// ─── An early state of the bid: started, about half the list done ───
// The tests use it. Open: pay rates, other costs, profit, temperature checks,
// driver access, the food handler certificates and equipment. The reference
// phone numbers went to the references.

export const mackallSeed: Partial<BidState> = {
  started: true,
  briefConfirmed: true,
  // Ava read the Army's files when she started (two phases: lib/ava/flow).
  read: { startedAt: 0, doneAt: 180_000 },
  answers: {
    "mk-ask-hw": mackallAnswers["mk-ask-hw"],
    "mk-ask-wosb": mackallAnswers["mk-ask-wosb"],
    "mk-ask-ref1": mackallAnswers["mk-ask-ref1"],
    "mk-ask-ref2": mackallAnswers["mk-ask-ref2"],
    "mk-ask-food": mackallAnswers["mk-ask-food"],
    "mk-ask-payroll": mackallAnswers["mk-ask-payroll"],
    "mk-ask-pl": mackallAnswers["mk-ask-pl"],
    "mk-ask-refcontacts": {
      status: "forwarded",
      at: AT(55),
      forwardedTo: "Mike Sutton and Janet Reyes",
    },
  },
  commitments: {
    "mk-c-window": { at: AT(20), text: WINDOW_TEXT },
  },
  addendaReceived: [],
};

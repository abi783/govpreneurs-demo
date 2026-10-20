// Ava fixture · Help desk for the Army Reserve's headquarters, Fort Bragg (federal).
// DEMO: the IT services firm's hero bid (src/demo/members/it).
//
// A federal Request for Quote: a combined synopsis and solicitation for
// commercial services on the SF 1449, set aside for 8(a) firms. Best value:
// the staffing plan counts most, then past performance, then price. A base
// year and four option years, all firm fixed price. The Service Contract Act
// applies, so every tech is paid at least the wage determination's floor.
//
// THE STORY (demo-storyboard/it-services-pack.md, sections 3, 7 and 8): about
// 1,900 users in Marshall Hall, Tier 1 at the walk-up counter and by phone,
// Tier 2 at the desk, imaging and asset tracking, and 14 video-conference
// rooms. Six seats on site 7:00 to 5:00 on weekdays, a named site lead and
// alternate, a 30-day phase-in, and Security+ for every tech with admin rights
// on day one. Hector Salinas (Gallberry Technology Group) has two techs still
// to sit Security+. Every quotation below is the demo's own wording, inside a
// doc() call. The wage rates follow the pack's reading of the Cumberland
// County wage determination; they are sample values for this demo, not a
// Department of Labor schedule. No section numbers from the federal rulebook
// are cited.
//
// THIS BID IS ALREADY IN PROGRESS (start.ts): three questions wait on him (the
// pack, section 8): his site lead and alternate, how he staffs six seats in
// the 30-day phase-in, and how he prices the techs.
//
// The member is always the IT firm: this file reads his own records
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
/** The contracting officer the opportunity page names; the contract specialist beside her. */
const { primary: CO, second: SPEC } = buyerPeople(ID);
const MILES = PLACES[STORY.place].milesFromBase;
const USERS = "1,900";
const ROOMS = 14;
const SEATS = 6;
const PHASE_IN = 30;
const WEEKS = 52;
const OPTION_YEARS = 4;

// ─── His past jobs, from the story ───

function pastJob(id: PastPerformance["id"]): PastPerformance {
  const job = PAST_PERFORMANCE.find((p) => p.id === id);
  if (!job) throw new Error(`The IT firm's story has no past job ${id}`);
  return job;
}

const JOB_SJ = pastJob("pp-sjafb-desktop-support");
const JOB_SEATS = pastJob("pp-bragg-helpdesk-seats");
const JOB_CLINICS = pastJob("pp-sandhills-managed-it");
const JOB_CHROMEBOOK = pastJob("pp-ccs-chromebook-reimage");

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

/** His Seymour Johnson contract, the one federal prime on his record (the pack, section 2). */
const SJ_CONTRACT = "FA480924C0011";
const SJ_FILE = `Seymour_Johnson_Contract_${SJ_CONTRACT}.pdf`;

// ─── The people on this job (fictional) ───

/** His site lead at Seymour Johnson today. */
const LEAD = "Darnell Peebles";
/** His senior tech, Security+ certified. */
const ALTERNATE = "Renee Faison";
const REF_SJ = {
  name: "Lamont Kearney",
  title: "Contracting Officer's Representative, 4th Communications Squadron",
};
const REF_SEATS = { name: JOB_SEATS.referenceName!, title: JOB_SEATS.referenceTitle! };
const REF_CLINICS = { name: JOB_CLINICS.referenceName!, title: JOB_CLINICS.referenceTitle! };

/** His references' phone and email: one each, whichever bid asks. */
export const REFERENCE_CONTACTS = {
  lamontKearney: { phone: "(919) 555-0142", email: "lamont.kearney@us.af.mil.example" },
  deniseHolloman: { phone: "(703) 555-0187", email: "dholloman@tarbridgefederal.example" },
  almaFerebee: { phone: "(910) 555-0129", email: "aferebee@sandhillsfamilymed.example" },
} as const;

// ─── The buyer's files ───

const RFQ = "gt-f-rfq";
const PWS = "gt-f-pws";
const SHEET = "gt-f-price";
const WD = "gt-f-wd";

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
  "This acquisition is set aside for competition among participants in the SBA 8(a) Business Development Program. The Offeror must be an 8(a) participant, and registered as such in SAM, at the time it submits its quote.",
);
const S_SIZE = doc(
  RFQ,
  "Section 1.2, page 1",
  "§1.2",
  "The NAICS code for this acquisition is 541519, Other Computer Related Services. The Offeror must be small under the size standard for this code.",
);
const S_DUE = doc(
  RFQ,
  "Section 1.4, page 2",
  "§1.4",
  `Quotes are due no later than 2:00 PM Eastern Time (ET) on ${US(DUE_DAYS)}. Quotes received after this time will not be considered.`,
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
  "Offerors shall not contact USARC G-6 staff about this requirement. All communication shall go through the Contract Specialist.",
);
const S_VALID = doc(
  RFQ,
  "Section 1.6, page 2",
  "§1.6",
  "Quotes shall remain valid for 90 calendar days after the closing date.",
);
const S_CONTRACT = doc(
  RFQ,
  "Section 2.1, page 5",
  "§2.1",
  "The Government intends to award a single Firm-Fixed-Price contract with a 12-month base period and four 12-month option periods.",
);
const S_SIGN = doc(
  RFQ,
  "Section 3.1, page 20",
  "§3.1",
  "Offerors shall complete and sign blocks 12, 17a, 30a, 30b and 30c of the SF 1449.",
);
const S_TECH = doc(
  RFQ,
  "Section 3.2, page 20",
  "§3.2",
  "Volume I, Technical Approach, shall not exceed eight (8) pages. It shall include the staffing plan for all six (6) on-site positions, the 30-day phase-in plan, the names of the Site Lead and the Alternate Site Lead, and the certifications each proposed technician holds.",
);
const S_PP = doc(
  RFQ,
  "Section 3.3, page 21",
  "§3.3",
  "Volume II, Past Performance, has no page limit. Provide at least two (2) and no more than three (3) references for similar IT support work performed within the past five (5) years, and complete Attachment 4 for each, including a point of contact with current telephone number and email.",
);
const S_PRICE = doc(
  RFQ,
  "Section 3.4, page 21",
  "§3.4",
  "Volume III, Price, shall be the completed Attachment 2, Price Schedule, in its Excel format. Enter a monthly price for every CLIN for the base period and each option period, and show the hourly rate for each labor category.",
);
const S_REPS = doc(
  RFQ,
  "Section 3.5, page 22",
  "§3.5",
  "Offerors shall confirm that their representations and certifications in SAM are current and accurate, and complete any provision in this RFQ that is not covered in SAM.",
);
const S_EMAIL = doc(
  RFQ,
  "Section 3.6, page 22",
  "§3.6",
  `Quotes shall be emailed to ${CO.email} with the subject line: RFQ ${ID} – [Offeror Name]. Each volume shall be a separate file. Total attachments shall not exceed 10 MB.`,
);
const S_AWARD = doc(
  RFQ,
  "Section 4.1, page 23",
  "§4.1",
  "Award will be made to the responsible Offeror whose quote represents the best value to the Government. Technical Approach is more important than Past Performance. Technical Approach and Past Performance, combined, are more important than Price.",
);
const S_EVAL_TECH = doc(
  RFQ,
  "Section 4.2(a), page 23",
  "§4.2(a)",
  "Technical Approach will be evaluated on the staffing plan, the phase-in plan and the qualifications of the proposed personnel, including the Site Lead and the Alternate.",
);
const S_EVAL_PP = doc(
  RFQ,
  "Section 4.2(b), page 23",
  "§4.2(b)",
  "Past Performance will be evaluated for relevance and quality, based on the references for similar work performed within the past five (5) years.",
);
const S_EVAL_PRICE = doc(
  RFQ,
  "Section 4.2(c), page 24",
  "§4.2(c)",
  "Price will be evaluated by adding the extended prices for all CLINs in the base period and all option periods. Labor rates below the applicable wage determination will be found unacceptable.",
);
const S_SAM = doc(
  RFQ,
  "Section 5.2, page 26",
  "§5.2",
  "An Offeror shall be registered in SAM when submitting an offer or quotation, and shall continue to be registered until time of award, during performance, and through final payment.",
);
const S_SUBS = doc(
  RFQ,
  "Section 5.3, page 27",
  "§5.3",
  "The Contractor will not pay more than 50 percent of the amount paid by the Government for services to subcontractors that are not similarly situated entities.",
);
const S_WAWF = doc(
  RFQ,
  "Section 5.4, page 28",
  "§5.4",
  "Payment requests shall be submitted monthly, in arrears, through Wide Area WorkFlow (WAWF) in the Procurement Integrated Enterprise Environment (PIEE).",
);
const S_PAY = doc(
  RFQ,
  "Section 5.4, page 28",
  "§5.4",
  "Payment will be made within 30 days after receipt of a proper invoice.",
);
const S_INSURANCE = doc(
  RFQ,
  "Section 5.5, page 29",
  "§5.5",
  "Before starting work, the Contractor shall have general liability insurance of at least $500,000 per occurrence, and workers' compensation as required by State law.",
);
const S_SCA = doc(
  RFQ,
  "Section 5.6, page 29",
  "§5.6",
  "The Contractor shall pay service employees not less than the wage rates and fringe benefits in the Wage Determination at Attachment 3.",
);
const S_CMMC = doc(
  RFQ,
  "Section 5.7, page 30",
  "§5.7",
  "The Contractor shall hold a current CMMC Level 1 (Self) status in SPRS at the time of award and maintain it throughout performance.",
);
const S_REF_FORM = doc(
  RFQ,
  "Attachment 4, page 35",
  "Att. 4",
  "PAST PERFORMANCE REFERENCE FORM. Complete one form per reference. Point of contact name, title, telephone number and email address are required.",
);

const S_SCOPE = doc(
  PWS,
  "Section 1.2, page 2",
  "PWS 1.2",
  `The Contractor shall provide Tier 1 and Tier 2 end-user IT support for approximately ${USERS} users of USARC headquarters at Marshall Hall, Fort Bragg, North Carolina.`,
);
const S_TIERS = doc(
  PWS,
  "Section 3.1, page 4",
  "PWS 3.1",
  "Tier 1 support shall be provided at a walk-up counter and by telephone. Tier 2 support shall be provided at the user's desk.",
);
const S_IMAGING = doc(
  PWS,
  "Section 3.2, page 5",
  "PWS 3.2",
  "The Contractor shall image, issue, recover and track end-user devices, and keep the asset inventory current in the Government's system of record.",
);
const S_VTC = doc(
  PWS,
  "Section 3.3, page 6",
  "PWS 3.3",
  `The Contractor shall set up, test and support video teleconferencing in ${ROOMS} conference rooms, including checks before scheduled senior leader sessions.`,
);
const S_HOURS = doc(
  PWS,
  "Section 4.1, page 8",
  "PWS 4.1",
  `The Contractor shall staff ${SEATS} on-site positions from 0700 to 1700, Monday through Friday, except federal holidays. The Site Lead or the Alternate Site Lead shall be on site during these hours.`,
);
const S_LEAD = doc(
  PWS,
  "Section 4.2, page 8",
  "PWS 4.2",
  "The Contractor shall name a Site Lead and an Alternate Site Lead in its quote. Either shall have the authority to act for the Contractor on site.",
);
const S_PHASE_IN = doc(
  PWS,
  "Section 4.3, page 9",
  "PWS 4.3",
  `The Contractor shall complete phase-in within ${PHASE_IN} calendar days after award, with all ${SEATS} positions filled by qualified personnel at the end of phase-in.`,
);
const S_SECPLUS = doc(
  PWS,
  "Section 5.1, page 10",
  "PWS 5.1",
  "Every technician with privileged (administrator) access shall hold a current DoD 8140 baseline certification, CompTIA Security+ or higher, on the first day of performance.",
);
const S_RESPONSE = doc(
  PWS,
  "Section 6.1, page 12",
  "PWS 6.1",
  "The Contractor shall answer 90 percent of calls within 60 seconds, and resolve 80 percent of Tier 1 tickets at first contact. Performance shall be reported monthly.",
);
const S_ACCESS = doc(
  PWS,
  "Section 7.1, page 14",
  "PWS 7.1",
  "Contractor personnel shall obtain installation access and a favorable background check, and complete annual cyber awareness training, before receiving network access.",
);
const S_GFE = doc(
  PWS,
  "Section 8.1, page 15",
  "PWS 8.1",
  "The Contractor shall furnish all tools, test equipment, laptops and mobile phones its personnel need to perform, unless stated otherwise in this PWS.",
);

const S_WD_TECH = doc(WD, "Revision 33, page 3", "WD 14160", "14160 - Personal Computer Support Technician 37.50");
const S_WD_LIST = doc(
  WD,
  "Revision 33, page 3, occupation list",
  "WD Rev 33",
  "14041 - Computer Operator I 27.06 | 14160 - Personal Computer Support Technician 37.50 | 14170 - System Support Specialist 41.53",
);
const S_WD_HW = doc(
  WD,
  "Revision 33, page 6",
  "WD H&W",
  "HEALTH & WELFARE: $5.92 per hour, up to 40 hours per week, or $236.80 per week or $1,026.13 per month",
);
const S_WD_VACATION = doc(
  WD,
  "Revision 33, page 6",
  "WD vacation",
  "VACATION: 2 weeks paid vacation after 1 year of service with a contractor or successor, 3 weeks after 5 years, and 4 weeks after 15 years.",
);

const S_CLIN_DESK = doc(
  SHEET,
  "Attachment 2, row 4, CLIN 0001",
  "CLIN 0001",
  "0001 TIER 1 AND TIER 2 END-USER SUPPORT, ON SITE, PER PWS 3.1 AND 4.1. ESTIMATED QUANTITY: 12 MO",
);
const S_CLIN_IMAGING = doc(
  SHEET,
  "Attachment 2, row 5, CLIN 0002",
  "CLIN 0002",
  "0002 DEVICE IMAGING, ISSUE AND ASSET TRACKING, PER PWS 3.2. ESTIMATED QUANTITY: 12 MO",
);
const S_CLIN_VTC = doc(
  SHEET,
  "Attachment 2, row 6, CLIN 0003",
  "CLIN 0003",
  `0003 VIDEO TELECONFERENCE SUPPORT, ${ROOMS} ROOMS, PER PWS 3.3. ESTIMATED QUANTITY: 12 MO`,
);

// ─── His own record ───

const SJ_AT = "Your jobs list: Desktop support, Seymour Johnson AFB";
const SEATS_AT = "Your jobs list: Help-desk seats on Fort Bragg";
const CLINICS_AT = "Your jobs list: Managed IT and help desk, four clinics";

const P_SAM_8A: Proof = sam("Business types", "8(a) Business Development Program participant, certified by the SBA");
const P_SAM_ADDRESS: Proof = sam("Physical address", PERSONA.physicalAddress);
const P_TICKETS: Proof = profile("Your strengths", PERSONA.differentiators[0]);
const P_SECPLUS: Proof = profile("Your strengths", PERSONA.differentiators[1]);
const P_M365: Proof = profile("Your strengths", PERSONA.differentiators[3]);
const P_OFFICE: Proof = profile("Your office", PERSONA.kitchen ?? "");
const P_STAFF: Proof = profile("Your company size", `People on staff: ${PERSONA.employeesW2}`);

const P_SJ_SCOPE: Proof = yourDoc(SJ_FILE, "Statement of work, page 2", JOB_SJ.scopeDescription);
const P_SJ_TERMS: Proof = yourDoc(
  SJ_FILE,
  "Page 1, blocks 3 and 20",
  `Contract ${SJ_CONTRACT}. ${longDate(JOB_SJ.periodStart)} to ${longDate(JOB_SJ.periodEnd)}. Total ${money(JOB_SJ.totalValue)}.`,
);
const P_SJ_COR: Proof = yourDoc(
  SJ_FILE,
  "Page 3, contract administration",
  `Contracting Officer's Representative: ${REF_SJ.name}, ${REF_SJ.title}`,
);
const P_SJ_RATING: Proof = profile(SJ_AT, "Performance rating (CPARS): interim, Very Good");

const P_SEATS_SCOPE: Proof = profile(SEATS_AT, JOB_SEATS.scopeDescription);
const P_SEATS_TERMS: Proof = profile(
  SEATS_AT,
  `${longDate(JOB_SEATS.periodStart)} to ${longDate(JOB_SEATS.periodEnd)}. Total value ${money(JOB_SEATS.totalValue)}.`,
);
const P_SEATS_REF: Proof = profile(SEATS_AT, `Reference: ${REF_SEATS.name}, ${REF_SEATS.title}.`);

const P_CLINICS_SCOPE: Proof = profile(CLINICS_AT, JOB_CLINICS.scopeDescription);
const P_CLINICS_TERMS: Proof = profile(
  CLINICS_AT,
  `Since ${longDate(JOB_CLINICS.periodStart)}. About ${money(JOB_CLINICS.totalValue)} a year.`,
);
const P_CLINICS_REF: Proof = profile(CLINICS_AT, `Reference: ${REF_CLINICS.name}, ${REF_CLINICS.title}.`);

// ─── The staffing plan: the price pays for these hours ───
// Six seats: the site lead takes tickets too, and one of the five techs is the
// alternate. Paid hours in a contract week, 52 weeks a year.

const PLAN = {
  tech: { count: SEATS - 1, hoursPerWeek: 40 },
  lead: { count: 1, hoursPerWeek: 40 },
};
const PLAN_HOURS = Object.values(PLAN).reduce((n, r) => n + r.count * r.hoursPerWeek, 0);

/** The wage floor for a PC support technician, and the $1.50 he adds to keep people. */
const FLOOR = 37.5;
const HW = 5.92;
const TECH_PAY = FLOOR + 1.5;

// ─── The three questions that wait on him (the pack, section 8) ───

const LEAD_TEXT = {
  "lead-move": `${LEAD}, who leads the company's team at Seymour Johnson AFB today, is the Site Lead. ${ALTERNATE}, a senior tech, is the Alternate. The company backfills the Seymour Johnson lead before phase-in starts`,
  "lead-hire": `The company is hiring a Site Lead now, before award, and names the Site Lead in writing before phase-in starts. ${ALTERNATE}, a senior tech, is the Alternate`,
  "lead-owner": `${PERSONA.ownerName}, the company's ${PERSONA.ownerTitle.toLowerCase()}, is the Site Lead. ${ALTERNATE}, a senior tech, is the Alternate`,
};
const STAFF_TEXT = {
  "st-mix": "Three of the company's own techs move to Marshall Hall and three new hires join them. Each new hire works beside a current tech in the first two weeks",
  "st-incumbent":
    "The company offers interviews to the current contractor's techs first, and fills any open seat with its own techs and new hires",
  "st-new": "The company fills all six seats with new hires, recruited before award, and trains them during phase-in",
};
const PAY_TEXT = {
  "tp-plus": `Every tech is paid $${TECH_PAY.toFixed(2)} an hour, $1.50 above the wage floor, plus $${HW} for health and welfare, so the team stays through the option years`,
  "tp-current": "Every tech is paid what the company pays its techs now",
  "tp-floor": `Every tech is paid the wage floor of $${FLOOR.toFixed(2)} an hour, plus $${HW} for health and welfare`,
};

// ─── The bid ───

export const itBid: AvaBid = {
  noticeId: ID,
  officialTitle: STORY.title,
  buyer: STORY.agency,
  bidNumber: ID,
  kind: "short-response",
  kindReason:
    "An eight-page technical approach, three references and the Army's Excel price schedule, plus two forms.",

  files: [
    {
      id: RFQ,
      name: `${ID}_Combined_Synopsis_Solicitation.pdf`,
      role: "main",
      pages: 36,
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
      pages: 10,
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
    method: "best-value",
    source: S_AWARD,
    criteria: [
      {
        id: "gt-cr-tech",
        name: "Technical approach: staffing, phase-in and people",
        points: null,
        kind: "scored-writing",
        source: S_EVAL_TECH,
        treatment: "Counts most. The staffing plan, the phase-in and the named people are read closely.",
      },
      {
        id: "gt-cr-pp",
        name: "Past performance on similar IT support",
        points: null,
        kind: "scored-fact",
        source: S_EVAL_PP,
        treatment: "Counts second. Two or three similar jobs from the last five years.",
      },
      {
        id: "gt-cr-price",
        name: "Price",
        points: null,
        kind: "price-formula",
        source: S_EVAL_PRICE,
        treatment: "Counts least. All five years are added up. A rate under the wage floor is unacceptable.",
      },
    ],
    note: "No points. The Army weighs your staffing plan and your record against your price.",
  },

  hardRequirements: [
    {
      id: "gt-r-8a",
      grantRow: "gt-8a",
      group: "eligibility",
      label: "An 8(a) participant when you send the quote",
      source: S_SET_ASIDE,
      initial: "meets",
      evidence: "Your registration lists you as an 8(a) participant, through March 2030.",
    },
    {
      id: "gt-r-sam",
      grantRow: "gt-sam",
      group: "eligibility",
      label: "Active federal registration when you quote, and through award",
      source: S_SAM,
      initial: "meets",
      evidence: `Your registration is active until ${SAM_UNTIL}.`,
    },
    {
      id: "gt-r-size",
      grantRow: "gt-size",
      group: "eligibility",
      label: "Small under the size standard for computer services",
      source: S_SIZE,
      initial: "meets",
      evidence: `Your registration lists you as small for industry code ${PERSONA.primaryNaics}.`,
    },
    {
      id: "gt-r-sca",
      grantRow: "gt-wages",
      group: "pricing",
      label: `Pay every tech at least $${FLOOR.toFixed(2)} an hour, plus $${HW} for health and welfare`,
      source: S_SCA,
      initial: "confirm",
      askId: "gt-ask-pay",
      askIds: ["gt-ask-hw"],
      afterAsk: "meets",
      evidenceAfter: "Your pay rates, checked against the wage determination",
    },
    {
      id: "gt-r-lead",
      grantRow: "gt-lead",
      group: "people",
      // The work statement wants them on site once work starts. The quote's
      // staffing plan names them, so the ask is asked with the bid.
      neededAt: "work-start",
      label: "A named Site Lead and Alternate, one of them on site 7:00 AM to 5:00 PM on weekdays",
      source: S_LEAD,
      initial: "confirm",
      askId: "gt-ask-lead",
      evidenceAfter: "Your quote names your Site Lead and your Alternate",
    },
    {
      id: "gt-r-phasein",
      group: "people",
      neededAt: "work-start",
      label: `All ${SEATS} seats filled within the ${PHASE_IN}-day phase-in`,
      source: S_PHASE_IN,
      initial: "confirm",
      askId: "gt-ask-staffing",
      evidenceAfter: "Your quote says how you fill the six seats",
    },
    {
      id: "gt-r-secplus",
      grantRow: "gt-secplus",
      group: "people",
      neededAt: "work-start",
      label: "Security+ for every tech with admin rights, on day one",
      source: S_SECPLUS,
      initial: "confirm",
      askId: "gt-ask-secplus",
      evidenceAfter: "Your quote names each tech and the certification each holds",
    },
    {
      id: "gt-r-cmmc",
      grantRow: "gt-cmmc",
      group: "eligibility",
      neededAt: "award",
      label: "CMMC Level 1 (Self) in SPRS at award",
      source: S_CMMC,
      initial: "meets",
      evidence: "Your Level 1 self-assessment is affirmed in SPRS.",
    },
    {
      id: "gt-r-insurance",
      grantRow: "gt-insurance",
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
      summary: "Federal quote. No state or local vendor registration asked for.",
    },
    {
      topic: "preferences",
      found: true,
      summary: "Only 8(a) participants may quote.",
      source: S_SET_ASIDE,
      requirementId: "gt-r-8a",
    },
    { topic: "bonds", found: false, summary: "No bid, performance or payment bond asked for." },
    {
      topic: "insurance",
      found: true,
      summary: "Liability insurance before work starts. Your $1M policy is above the $500,000 minimum.",
      source: S_INSURANCE,
      requirementId: "gt-r-insurance",
    },
    {
      topic: "wages",
      found: true,
      summary: `Service Contract Act pay floors: $${FLOOR.toFixed(2)} an hour for a PC support technician, plus $${HW} for health and welfare.`,
      source: S_SCA,
      requirementId: "gt-r-sca",
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
      summary: "Two or three similar jobs from the last five years, each on its own reference form.",
      source: S_PP,
    },
    {
      topic: "participation-goals",
      found: false,
      summary: "No subcontracting goals in these files.",
    },
    {
      topic: "background-checks",
      found: true,
      summary: "Every tech needs installation access, a background check and cyber awareness training before network access.",
      source: S_ACCESS,
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
      id: "gt-c-hours",
      text: `${SEATS} seats staffed on site from 7:00 AM to 5:00 PM, Monday to Friday, with the Site Lead or the Alternate there the whole time.`,
      source: S_HOURS,
      pricedAs: `Priced as: ${PLAN_HOURS} paid hours a week, ${SEATS} people at 40 hours each.`,
      needsApproval: true,
    },
    {
      id: "gt-c-phasein",
      text: `All ${SEATS} seats filled by qualified techs within ${PHASE_IN} days of award.`,
      source: S_PHASE_IN,
      pricedAs: "Priced as: your payroll from day one. The first payment comes about 60 days after the start.",
      needsApproval: true,
    },
    {
      id: "gt-c-secplus",
      text: "Every tech with admin rights holds Security+ on the first day of work.",
      source: S_SECPLUS,
      pricedAs: "Priced as: your cost. The two exams are not in the price.",
      needsApproval: true,
    },
    {
      id: "gt-c-service",
      text: "90% of calls answered within 60 seconds, and 80% of Tier 1 tickets fixed on the first contact, reported each month.",
      source: S_RESPONSE,
      pricedAs: "Priced as: the six seats. No extra staff.",
      needsApproval: true,
    },
    {
      id: "gt-c-price",
      text: "Prices fixed for each year of the contract. They hold even if wages rise during a year.",
      source: S_CONTRACT,
      pricedAs: "Priced as: today's pay, with your yearly increase in each option year.",
      needsApproval: false,
    },
  ],

  contractTerms: [
    {
      text: "A 12-month base year, then four 12-month option years the Army may choose to use.",
      source: S_CONTRACT,
    },
    {
      text: "You price every option year now. Ava adds your yearly increase to each line.",
      source: S_PRICE,
    },
    {
      text: "Your quote shows the hourly rate for each kind of tech. The Army checks each one against the wage floor.",
      source: S_EVAL_PRICE,
    },
    {
      text: "You bring the laptops, phones and tools your techs use, unless the Army says otherwise. Ask before questions close.",
      source: S_GFE,
    },
    {
      text: "You bill monthly, after the month ends, through Wide Area WorkFlow, the government's online invoicing system.",
      source: S_WAWF,
    },
    {
      text: "Payment arrives within 30 days of a correct invoice. You carry about two months of payroll before the first payment.",
      source: S_PAY,
    },
    { text: "Your prices hold for 90 days after the due date.", source: S_VALID },
    {
      text: "Firms that are not 8(a) firms may get no more than half of what the Army pays you for services.",
      source: S_SUBS,
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
      label: "8(a) participant",
      value: "Since March 2021. The term ends March 2030",
      from: "Your federal registration, and Grant's check",
    },
    {
      label: "Industry codes",
      value: [`${PERSONA.primaryNaics} ${PERSONA.primaryNaicsLabel}`, ...PERSONA.secondaryNaics.map((n) => `${n.code} ${n.label}`)].join(", "),
      from: "Your GovPreneurs profile",
    },
    { label: "People on staff", value: String(PERSONA.employeesW2), from: "Your GovPreneurs profile" },
    { label: "Office and team", value: PERSONA.kitchen ?? "", from: "Your GovPreneurs profile" },
    { label: "Security+", value: PERSONA.differentiators[1], from: "Your GovPreneurs profile" },
    { label: "CMMC", value: "Level 1 (Self), affirmed in SPRS", from: "Your GovPreneurs profile" },
    {
      label: "Insurance on file",
      value: "General liability $1M per occurrence.",
      from: "Your GovPreneurs profile",
    },
    {
      label: JOB_SJ.projectTitle,
      value: `Main contractor, ${pastYear(JOB_SJ.periodStart)}, ${money(JOB_SJ.totalValue)}. Interim CPARS Very Good.`,
      from: "Your contract file, and your jobs list",
    },
    {
      label: JOB_SEATS.projectTitle,
      value: `Subcontractor, ${pastYear(JOB_SEATS.periodStart)} to ${pastYear(JOB_SEATS.periodEnd)}, ${money(JOB_SEATS.totalValue)}`,
      from: "Your GovPreneurs profile, jobs list",
    },
    {
      label: JOB_CLINICS.projectTitle,
      value: `Main contractor, since ${pastYear(JOB_CLINICS.periodStart)}, about ${money(JOB_CLINICS.totalValue)} a year`,
      from: "Your GovPreneurs profile, jobs list",
    },
    {
      label: JOB_CHROMEBOOK.projectTitle,
      value: `Main contractor, ${pastYear(JOB_CHROMEBOOK.periodStart)}, ${money(JOB_CHROMEBOOK.totalValue)}. Not used here: a summer job, not ongoing support.`,
      from: "Your GovPreneurs profile, jobs list",
    },
  ],

  asks: [
    // ── The three questions that wait on him ──
    {
      id: "gt-ask-lead",
      kind: "answer",
      title: "Your Site Lead and Alternate",
      source: S_LEAD,
      why: "The work statement wants a Site Lead and an Alternate named in your quote, and one of them on site 7:00 AM to 5:00 PM. Your profile names no one for this job.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      neededAt: "bid",
      group: "people",
      answer: {
        type: "answer",
        question: "Who are your Site Lead and Alternate? One of them is on site 7:00 AM to 5:00 PM.",
        choices: [
          {
            id: "lead-move",
            label: "Move our Seymour Johnson lead here, and backfill there",
            consequence: `Ava names ${LEAD} as Site Lead and ${ALTERNATE} as Alternate.`,
          },
          {
            id: "lead-hire",
            label: "Hire a lead before award",
            consequence: "Ava writes that you name the Site Lead before phase-in, and flags the cost.",
            gives: {
              status: "confirm",
              evidence: "A risk: you plan to hire the Site Lead, so your quote names no lead yet",
            },
            warn: "That costs you. A lead hired now is on your payroll for weeks before the Army pays anything, and a quote with no named lead can be rated lower. I wrote that you name the lead before phase-in.",
          },
          {
            id: "lead-owner",
            label: "I'll be the site lead",
            consequence: "Ava names you as Site Lead, and warns you.",
            warn: "Then you are at Marshall Hall 7:00 AM to 5:00 PM every weekday, and no one runs the company. Seymour Johnson, payroll and the next bid all wait on you.",
          },
        ],
      },
      feeds: ["Draft · Key people", "Hard requirement · Site Lead and Alternate"],
    },
    {
      id: "gt-ask-staffing",
      kind: "answer",
      title: "How you staff six seats in 30 days",
      source: S_PHASE_IN,
      why: `All ${SEATS} seats must be filled ${PHASE_IN} days after award. You have ${PERSONA.employeesW2} people and most already work on other jobs.`,
      owner: "you",
      leadDays: 0,
      minutes: 2,
      neededAt: "bid",
      group: "people",
      answer: {
        type: "answer",
        question: `How will you fill ${SEATS} seats in a ${PHASE_IN}-day phase-in?`,
        choices: [
          {
            id: "st-mix",
            label: "3 of our techs plus 3 new hires",
            consequence: "Ava writes that three of your techs move over and three new hires join them.",
          },
          {
            id: "st-incumbent",
            label: "Recruit the current contractor's techs",
            consequence: "Ava writes that you interview the current techs first.",
            warn: "No rule makes you hire them any more, but it is the fastest way to fill six seats. Check each one's Security+ before you name them.",
          },
          {
            id: "st-new",
            label: "All new hires",
            consequence: "Ava writes that you recruit all six before award, and flags the risk.",
            gives: {
              status: "confirm",
              evidence: "A risk: six new hires in 30 days, with no one who knows your way of working",
            },
            warn: "That is a risk. Six new people in 30 days is hard to recruit, and the Army reads the phase-in closely. I wrote that you recruit before award.",
          },
        ],
      },
      feeds: ["Draft · Staffing and phase-in", "Hard requirement · Six seats in 30 days"],
    },
    {
      id: "gt-ask-techpay",
      kind: "answer",
      title: "How you price the techs",
      source: S_WD_TECH,
      why: `The wage floor for a PC support technician is $${FLOOR.toFixed(2)} an hour plus $${HW}. That is about $10 an hour above what you pay now.`,
      owner: "you",
      leadDays: 0,
      minutes: 2,
      neededAt: "bid",
      group: "pricing",
      answer: {
        type: "answer",
        question: "How do we price the techs?",
        choices: [
          {
            id: "tp-plus",
            label: "Wage floor plus $1.50, to keep people",
            consequence: `Ava prices each tech at $${TECH_PAY.toFixed(2)} an hour, plus $${HW} for health and welfare.`,
          },
          {
            id: "tp-current",
            label: "What we pay now",
            failsGate: `What you pay now is under the wage floor of $${FLOOR.toFixed(2)} an hour. The Army finds a rate under the floor unacceptable, and you would owe the difference to every tech.`,
          },
          {
            id: "tp-floor",
            label: "Exactly the floor",
            consequence: `Ava writes that each tech is paid $${FLOOR.toFixed(2)} an hour.`,
            warn: `That is legal, and it is how Kettle Creek beat you on the Windows 11 surge. This quote weighs your staffing plan first, so $1.50 to keep your techs can be worth it. Your price uses $${TECH_PAY.toFixed(2)} from your pay rates: change the tech rate there if you want the floor.`,
          },
        ],
      },
      feeds: ["Draft · Pay", "Price · Techs"],
    },

    // ── Answered before the story starts ──
    {
      id: "gt-ask-secplus",
      kind: "answer",
      title: "Security+ for the two techs who lack it",
      source: S_SECPLUS,
      why: "Every tech with admin rights needs Security+ on day one. Two of the six you would put there do not have it yet.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      group: "people",
      answer: {
        type: "answer",
        question: "Two of your six techs don't hold Security+. What is the plan?",
        choices: [
          {
            id: "sec-swap",
            label: "Put two certified techs there instead",
            consequence: "Ava names six techs who hold Security+ today.",
          },
          {
            id: "sec-book",
            label: "Book both exams before the start date",
            consequence: "Ava names all six techs, and says two sit the exam before the start date.",
            gives: {
              status: "confirm",
              evidence: "Two exams to book and pass before the start date",
            },
          },
        ],
      },
      feeds: ["Draft · Certifications", "Hard requirement · Security+"],
    },
    {
      id: "gt-ask-pay",
      kind: "enter",
      title: "What you pay each role (2 roles)",
      source: S_WD_LIST,
      why: "The price starts from what you pay. Every tech must get at least the wage floor, or you owe back pay.",
      owner: "bookkeeper",
      leadDays: 2,
      minutes: 10,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "gt-fld-pay-tech",
            label: "PC support technician, per hour",
            unit: "usd-hour",
            hint: "What you will pay on this contract, before taxes.",
            floor: { value: FLOOR, why: `Personal Computer Support Technician, $${FLOOR.toFixed(2)}, in the wage determination.` },
          },
          {
            id: "gt-fld-pay-lead",
            label: "Site Lead, per hour",
            unit: "usd-hour",
            hint: "What you will pay, before taxes. No wage floor: this role supervises the site.",
          },
        ],
      },
      feeds: ["Price · Techs", "Price · Site Lead", "Hard requirement · Wage floors"],
    },
    {
      id: "gt-ask-hw",
      kind: "answer",
      title: "How you pay health and welfare",
      source: S_WD_HW,
      why: `The wage determination adds $${HW} for every paid hour. You can pay it as cash or as benefits.`,
      owner: "bookkeeper",
      leadDays: 1,
      minutes: 5,
      answer: {
        type: "answer",
        question: `How do you pay the $${HW} an hour for health and welfare?`,
        choices: [
          {
            id: "hw-benefits",
            label: "As health insurance and other benefits",
            consequence: `Ava adds $${HW} an hour. If benefits cost less, you pay the rest as cash.`,
          },
          {
            id: "hw-cash",
            label: "As extra cash in each paycheck",
            consequence: `Ava adds $${HW} to every paid hour. Payroll taxes apply to the cash.`,
          },
        ],
      },
      feeds: ["Price · Health and welfare"],
    },
    {
      id: "gt-ask-payroll",
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
          { fieldId: "gt-fld-suta", label: "Unemployment tax, state and federal", value: 1.1, unit: "percent", where: "Tax summary, page 2" },
          { fieldId: "gt-fld-wc", label: "Workers' comp premium", value: 0.4, unit: "percent", where: "Employer costs, page 3" },
        ],
      },
      feeds: ["Price · Unemployment tax", "Price · Workers' comp"],
    },
    {
      id: "gt-ask-tools",
      kind: "enter",
      title: "Laptops, phones and tools for the six techs",
      source: S_GFE,
      why: "The work statement says you bring them, unless the Army says otherwise. Only you know what they cost you.",
      owner: "you",
      leadDays: 1,
      minutes: 5,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "gt-fld-tools",
            label: "Laptops, phones and tools, per month",
            unit: "usd",
            hint: "Leases or wear on what you buy, and phone plans, for all six techs.",
          },
        ],
      },
      feeds: ["Price · Laptops and tools"],
    },
    {
      id: "gt-ask-pl",
      kind: "upload",
      title: "Your 2025 profit and loss statement",
      source: S_PRICE,
      why: "Ava works out your overhead from it: rent, software, insurance and office costs.",
      owner: "bookkeeper",
      leadDays: 3,
      minutes: 10,
      answer: {
        type: "upload",
        accepts: "Your 2025 profit and loss statement, from your bookkeeper",
        extracts: [
          { fieldId: "gt-fld-overhead", label: "Overhead, as a share of direct cost", value: 6, unit: "percent", where: "Operating expenses, page 1" },
        ],
      },
      feeds: ["Price · Overhead"],
    },
    {
      id: "gt-ask-contingency",
      kind: "enter",
      title: "Your contingency, for costs that run over",
      source: S_PRICE,
      why: "A reserve for costs that come in higher than planned, such as overtime in phase-in. Ava never picks it.",
      owner: "you",
      leadDays: 0,
      minutes: 5,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "gt-fld-contingency",
            label: "Contingency, as a percent of cost",
            unit: "percent",
            hint: "Added to labor, tools and overhead, before profit. Enter 0 if you want none.",
          },
        ],
      },
      feeds: ["Price · Contingency"],
    },
    {
      id: "gt-ask-profit",
      kind: "enter",
      title: "Your profit, and your yearly increase for the option years",
      source: S_PRICE,
      why: "Ava never picks your margin. Price counts least here, but the wage floor leaves little room.",
      owner: "you",
      leadDays: 1,
      minutes: 15,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          { id: "gt-fld-profit", label: "Profit", unit: "percent", hint: "A share of your total cost." },
          {
            id: "gt-fld-escalation",
            label: "Yearly increase for each option year",
            unit: "percent",
            hint: "The wage determination is revised each year, and the floor usually rises with it.",
          },
        ],
      },
      feeds: ["Price · Profit", "Price · Option years"],
    },
    {
      id: "gt-ask-ref1",
      kind: "approve",
      title: "Seymour Johnson desktop support as reference 1",
      source: S_PP,
      why: "On-site desktop support for an Air Force squadron, as the prime, rated Very Good: the closest match to this job.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use your Seymour Johnson contract as reference 1? ${REF_SJ.name}, named in your contract, is the contact.`,
        from: "Your contract file",
        value: `${JOB_SJ.projectTitle}. Contact: ${REF_SJ.name}`,
      },
      feeds: ["Similar work · Reference 1", "Form · Attachment 4"],
    },
    {
      id: "gt-ask-ref2",
      kind: "approve",
      title: "Help-desk seats on Fort Bragg as reference 2",
      source: S_PP,
      why: "Tier 1 and Tier 2 seats for Army units on the same post, for almost five years.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use your Fort Bragg help-desk seats as reference 2? ${REF_SEATS.name} is the contact.`,
        from: "Your GovPreneurs profile, jobs list",
        value: `${JOB_SEATS.projectTitle}. Contact: ${REF_SEATS.name}`,
        asOf: "You were the subcontractor on this job. The reference form asks for your role.",
      },
      feeds: ["Similar work · Reference 2", "Form · Attachment 4"],
    },
    {
      id: "gt-ask-ref3",
      kind: "approve",
      title: "Sandhills Family Medicine managed IT as reference 3",
      source: S_PP,
      why: "Help desk and Microsoft 365 support for four sites, running now.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use your Sandhills clinics work as reference 3? ${REF_CLINICS.name} is the contact.`,
        from: "Your GovPreneurs profile, jobs list",
        value: `${JOB_CLINICS.projectTitle}. Contact: ${REF_CLINICS.name}`,
      },
      feeds: ["Similar work · Reference 3", "Form · Attachment 4"],
    },
    {
      id: "gt-ask-refcontacts",
      kind: "enter",
      title: "Current phone and email for your three references",
      source: S_REF_FORM,
      why: "The Army may call them. A wrong number can weaken this part.",
      owner: "references",
      leadDays: 3,
      minutes: 10,
      answer: {
        type: "enter",
        fields: [
          { id: "gt-fld-ref1-phone", label: `${REF_SJ.name}, phone`, unit: "phone" },
          { id: "gt-fld-ref1-email", label: `${REF_SJ.name}, email`, unit: "email" },
          { id: "gt-fld-ref2-phone", label: `${REF_SEATS.name}, phone`, unit: "phone" },
          { id: "gt-fld-ref2-email", label: `${REF_SEATS.name}, email`, unit: "email" },
          { id: "gt-fld-ref3-phone", label: `${REF_CLINICS.name}, phone`, unit: "phone" },
          { id: "gt-fld-ref3-email", label: `${REF_CLINICS.name}, email`, unit: "email" },
        ],
      },
      feeds: ["Form · Attachment 4"],
    },
  ],

  // His laptops question is a task he has not sent yet (workspace.ts), so it
  // sits on the checklist, not here: a clarification here would read as sent.
  clarifications: [],

  plan: [
    {
      id: "gt-p-tech",
      source: S_TECH,
      kind: "scored-item",
      needs: "writing",
      ifMissed: "The Army has nothing to judge your staffing plan by.",
      answeredIn: { kind: "section", id: "gt-s-tech", label: "Technical approach" },
    },
    {
      id: "gt-p-lead",
      source: S_LEAD,
      kind: "instruction",
      needs: "writing",
      ifMissed: "A quote with no named Site Lead can be rated lower.",
      answeredIn: { kind: "section", id: "gt-s-tech", label: "Technical approach" },
      askId: "gt-ask-lead",
    },
    {
      id: "gt-p-phasein",
      source: S_PHASE_IN,
      kind: "instruction",
      needs: "writing",
      ifMissed: "An evaluator has to guess how you fill six seats in 30 days.",
      answeredIn: { kind: "section", id: "gt-s-tech", label: "Technical approach" },
      askId: "gt-ask-staffing",
    },
    {
      id: "gt-p-certs",
      source: S_SECPLUS,
      kind: "instruction",
      needs: "writing",
      ifMissed: "The Army cannot tell whether your techs can have admin rights on day one.",
      answeredIn: { kind: "section", id: "gt-s-tech", label: "Technical approach" },
      askId: "gt-ask-secplus",
    },
    {
      id: "gt-p-pp",
      source: S_PP,
      kind: "scored-item",
      needs: "writing",
      ifMissed: "With fewer than two references, this part cannot be rated.",
      answeredIn: { kind: "section", id: "gt-s-pp", label: "Your three similar jobs" },
      askId: "gt-ask-ref1",
    },
    {
      id: "gt-p-refform",
      source: S_REF_FORM,
      kind: "form",
      needs: "attachment",
      ifMissed: "The Army cannot reach your references, so this part is weaker.",
      answeredIn: { kind: "form", id: "gt-fm-refs", label: "Reference forms, Attachment 4" },
      askId: "gt-ask-refcontacts",
    },
    {
      id: "gt-p-price",
      source: S_PRICE,
      kind: "instruction",
      needs: "price",
      ifMissed: "A missing monthly price makes the quote incomplete.",
      answeredIn: { kind: "price", id: "price", label: "Price schedule" },
      askId: "gt-ask-profit",
    },
    {
      id: "gt-p-wages",
      source: S_SCA,
      kind: "instruction",
      needs: "price",
      ifMissed: "A rate under the wage floor is unacceptable, and you owe back pay.",
      answeredIn: { kind: "price", id: "price", label: "Price schedule" },
      askId: "gt-ask-pay",
    },
    {
      id: "gt-p-sf1449",
      source: S_SIGN,
      kind: "form",
      needs: "signature",
      ifMissed: "An unsigned quote may be rejected as incomplete.",
      answeredIn: { kind: "form", id: "gt-fm-sf1449", label: "SF 1449, signed by you" },
    },
    {
      id: "gt-p-reps",
      source: S_REPS,
      kind: "form",
      needs: "signature",
      ifMissed: "The Army cannot award to a company whose answers are out of date.",
      answeredIn: { kind: "form", id: "gt-fm-reps", label: "Representations and certifications" },
    },
    {
      id: "gt-p-email",
      source: S_EMAIL,
      kind: "logistics",
      needs: "action",
      ifMissed: "A quote with the wrong subject line or over 10 MB may never arrive.",
      answeredIn: { kind: "checklist", id: "gt-ck-email", label: "Checklist: email the quote" },
    },
    {
      id: "gt-p-due",
      source: S_DUE,
      kind: "logistics",
      needs: "action",
      ifMissed: "A quote after 2:00 PM Eastern Time is not considered.",
      answeredIn: { kind: "checklist", id: "gt-ck-internal", label: "Checklist: internal deadline" },
    },
  ],

  themes: [],

  sections: [
    {
      id: "gt-s-tech",
      title: "Technical approach",
      answers: S_TECH,
      criterionId: "gt-cr-tech",
      points: null,
      pageLimit: 8,
      pages: 5,
      paragraphs: [
        // 0 · Who does the work, and where.
        [
          {
            text: `${PERSONA.businessName} will run Tier 1 and Tier 2 IT support for about ${USERS} users at Marshall Hall. `,
          },
          {
            text: "The company is an 8(a) participant",
            claim: { id: "gt-cl-8a", tag: "verified", proof: P_SAM_8A },
          },
          { text: ", based at " },
          {
            text: PERSONA.physicalAddress.replace(/, NC \d{5}$/, ""),
            claim: { id: "gt-cl-address", tag: "verified", proof: P_SAM_ADDRESS },
          },
          { text: `, ${MILES} miles from Marshall Hall. ` },
          {
            text: "Its techs already work Army and Air Force tickets",
            claim: { id: "gt-cl-tickets", tag: "verified", proof: P_TICKETS },
          },
          { text: ". " },
          {
            text: "Microsoft 365, Intune and SharePoint admin are done in house",
            claim: { id: "gt-cl-m365", tag: "verified", proof: P_M365 },
          },
          { text: "." },
        ],
        // 1 · Key people.
        [
          {
            text: "The Site Lead and the Alternate are named here",
            claim: {
              id: "gt-cl-lead",
              tag: "unsupported",
              askId: "gt-ask-lead",
              gap: "[NEEDED: your Site Lead and Alternate]",
              resolvedText: LEAD_TEXT["lead-move"],
              resolvedByChoice: LEAD_TEXT,
            },
          },
          { text: ". " },
          {
            text: `${SEATS} seats are staffed from 7:00 AM to 5:00 PM, Monday to Friday, with the Site Lead or the Alternate on site the whole time`,
            claim: { id: "gt-cl-hours", tag: "commitment", commitmentId: "gt-c-hours" },
          },
          { text: "." },
        ],
        // 2 · Staffing and phase-in.
        [
          {
            text: "The six seats are filled during phase-in",
            claim: {
              id: "gt-cl-staffing",
              tag: "unsupported",
              askId: "gt-ask-staffing",
              gap: "[NEEDED: how you fill six seats in 30 days]",
              resolvedText: STAFF_TEXT["st-mix"],
              resolvedByChoice: STAFF_TEXT,
            },
          },
          { text: ". " },
          {
            text: `All ${SEATS} seats are filled by qualified techs within ${PHASE_IN} days of award`,
            claim: { id: "gt-cl-phasein", tag: "commitment", commitmentId: "gt-c-phasein" },
          },
          { text: ". Week 1 sets up accounts and access. Week 2 takes over the walk-up counter and the phones. Weeks 3 and 4 take over desk visits, imaging and the conference rooms." },
        ],
        // 3 · Certifications and service.
        [
          {
            text: "9 of the company's 11 techs hold Security+",
            claim: { id: "gt-cl-secplus", tag: "verified", proof: P_SECPLUS },
          },
          { text: ". " },
          {
            text: "Every tech with admin rights holds Security+ on the first day of work",
            claim: { id: "gt-cl-day-one", tag: "commitment", commitmentId: "gt-c-secplus" },
          },
          { text: ". " },
          {
            text: "90% of calls are answered within 60 seconds, and 80% of Tier 1 tickets are fixed on the first contact, reported each month",
            claim: { id: "gt-cl-service", tag: "commitment", commitmentId: "gt-c-service" },
          },
          { text: "." },
        ],
        // 4 · Pay: the one rate the price uses.
        [
          {
            text: "Every tech is paid at least the wage floor",
            claim: {
              id: "gt-cl-pay",
              tag: "unsupported",
              askId: "gt-ask-techpay",
              gap: "[NEEDED: how you price the techs]",
              resolvedText: PAY_TEXT["tp-plus"],
              resolvedByChoice: PAY_TEXT,
            },
          },
          { text: "." },
        ],
        // 5 · The team: the one staffing plan the price uses.
        [
          {
            text: `The company has ${PERSONA.employeesW2} people on staff`,
            claim: { id: "gt-cl-staff", tag: "verified", proof: P_STAFF },
          },
          { text: ". " },
          {
            text: "It works from an office and repair bench on Raeford Rd, with a second team on site at Seymour Johnson AFB",
            claim: { id: "gt-cl-office", tag: "verified", proof: P_OFFICE },
          },
          {
            text: `. This job uses ${PLAN_HOURS} paid hours a week: the Site Lead, who also takes tickets, and five techs. One of the five is the Alternate.`,
          },
        ],
      ],
      decisions: [
        {
          id: "gt-dec-shadow",
          paragraphIndex: 2,
          choice: "Weeks 3 and 4 take over desk visits, imaging and the conference rooms.",
          other:
            "Weeks 3 and 4 take over desk visits, imaging and the conference rooms, and the Site Lead walks the Army's lead through every open ticket each Friday.",
        },
      ],
      challenges: [],
    },
    {
      id: "gt-s-pp",
      title: "Past performance: three similar IT support jobs",
      answers: S_PP,
      criterionId: "gt-cr-pp",
      points: null,
      pageLimit: null,
      pages: 2,
      paragraphs: [
        [
          { text: "Reference 1: " },
          {
            text: `${JOB_SJ.projectTitle}, contract ${SJ_CONTRACT}, ${longDate(JOB_SJ.periodStart)} to ${longDate(JOB_SJ.periodEnd)}, ${money(JOB_SJ.totalValue)}`,
            claim: { id: "gt-cl-r1-terms", tag: "verified", proof: P_SJ_TERMS },
          },
          { text: ". " },
          {
            text: "Two techs on site for the squadron's desktop support, plus an imaging surge for 1,100 Windows 11 laptops",
            claim: { id: "gt-cl-r1-scope", tag: "verified", proof: P_SJ_SCOPE },
          },
          { text: ". " },
          {
            text: "Its interim performance rating (CPARS) is Very Good",
            claim: { id: "gt-cl-r1-rating", tag: "verified", proof: P_SJ_RATING },
          },
          { text: ". Contact: " },
          {
            text: `${REF_SJ.name}, ${REF_SJ.title}`,
            claim: { id: "gt-cl-r1-contact", tag: "verified", proof: P_SJ_COR },
          },
          { text: "." },
        ],
        [
          { text: "Reference 2: " },
          {
            text: `${JOB_SEATS.projectTitle}, ${longDate(JOB_SEATS.periodStart)} to ${longDate(JOB_SEATS.periodEnd)}, ${money(JOB_SEATS.totalValue)}`,
            claim: { id: "gt-cl-r2-terms", tag: "verified", proof: P_SEATS_TERMS },
          },
          { text: ". " },
          {
            text: "Tier 1 and Tier 2 help-desk seats for Army units on Fort Bragg, by phone and at the walk-up counter, five days a week, as a subcontractor",
            claim: { id: "gt-cl-r2-scope", tag: "verified", proof: P_SEATS_SCOPE },
          },
          { text: ". Contact: " },
          {
            text: `${REF_SEATS.name}, ${REF_SEATS.title}`,
            claim: { id: "gt-cl-r2-contact", tag: "verified", proof: P_SEATS_REF },
          },
          { text: "." },
        ],
        [
          { text: "Reference 3: " },
          {
            text: `${JOB_CLINICS.projectTitle}, since ${longDate(JOB_CLINICS.periodStart)}, about ${money(JOB_CLINICS.totalValue)} a year`,
            claim: { id: "gt-cl-r3-terms", tag: "verified", proof: P_CLINICS_TERMS },
          },
          { text: ". " },
          {
            text: "Help desk, Microsoft 365 and network support for four family-medicine clinics",
            claim: { id: "gt-cl-r3-scope", tag: "verified", proof: P_CLINICS_SCOPE },
          },
          { text: ". Contact: " },
          {
            text: `${REF_CLINICS.name}, ${REF_CLINICS.title}`,
            claim: { id: "gt-cl-r3-contact", tag: "verified", proof: P_CLINICS_REF },
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
      "Firm fixed price for each period: a 12-month base year and four 12-month option years, at the increase you choose.",
    contractTypeSource: S_CONTRACT,
    weeks: WEEKS,
    roles: [
      {
        id: "gt-role-tech",
        name: "PC support technicians",
        ...PLAN.tech,
        pay: { askId: "gt-ask-pay", fieldId: "gt-fld-pay-tech" },
        wageFloor: { perHour: FLOOR, source: S_WD_TECH },
      },
      {
        id: "gt-role-lead",
        name: "Site Lead",
        ...PLAN.lead,
        pay: { askId: "gt-ask-pay", fieldId: "gt-fld-pay-lead" },
      },
    ],
    // No paid-holiday line: the 52 weeks already pay the eleven holidays, and
    // the Army closes the desks on them, so no one covers a seat.
    burden: [
      {
        id: "gt-b-fica",
        label: "Social Security and Medicare",
        from: { kind: "law", rate: 7.65, text: "The employer share set by federal law." },
      },
      {
        id: "gt-b-hw",
        label: "Health and welfare",
        from: {
          kind: "per-hour",
          amount: HW,
          text: "Wage determination amount for every paid hour.",
          source: S_WD_HW,
          cashWhen: { askId: "gt-ask-hw", choiceId: "hw-cash" },
        },
      },
      {
        id: "gt-b-vacation",
        label: "Paid vacation",
        from: {
          kind: "law",
          rate: 3.85,
          text: "Vacation in the wage determination: 2 weeks a year after 1 year.",
          source: S_WD_VACATION,
        },
      },
      {
        id: "gt-b-suta",
        label: "Unemployment tax",
        from: { kind: "ask", askId: "gt-ask-payroll", fieldId: "gt-fld-suta", text: "From your payroll report." },
      },
      {
        id: "gt-b-wc",
        label: "Workers' comp",
        from: { kind: "ask", askId: "gt-ask-payroll", fieldId: "gt-fld-wc", text: "From your payroll report." },
      },
    ],
    lines: [
      {
        id: "gt-l-desk",
        item: "Tier 1 and Tier 2 end-user support, on site",
        unit: "per month",
        qty: 12,
        qtySource: S_CLIN_DESK,
        laborShare: 0.8,
        direct: { askId: "gt-ask-tools", fieldId: "gt-fld-tools", label: "Laptops and tools" },
      },
      {
        id: "gt-l-imaging",
        item: "Device imaging, issue and asset tracking",
        unit: "per month",
        qty: 12,
        qtySource: S_CLIN_IMAGING,
        laborShare: 0.12,
      },
      {
        id: "gt-l-vtc",
        item: `Video teleconference support, ${ROOMS} rooms`,
        unit: "per month",
        qty: 12,
        qtySource: S_CLIN_VTC,
        laborShare: 0.08,
      },
    ],
    overhead: {
      askId: "gt-ask-pl",
      fieldId: "gt-fld-overhead",
      text: "From your 2025 profit and loss statement, as a share of direct cost.",
    },
    profit: { askId: "gt-ask-profit", fieldId: "gt-fld-profit" },
    contingency: { askId: "gt-ask-contingency", fieldId: "gt-fld-contingency" },
    otherCosts: [],
    periods: {
      count: OPTION_YEARS,
      label: "Option year",
      escalation: { askId: "gt-ask-profit", fieldId: "gt-fld-escalation" },
      source: S_PRICE,
    },
    payment: {
      text: "Paid monthly, within 30 days of a correct invoice, after the month ends. You carry about two months of payroll before the first payment.",
      source: S_PAY,
    },
  },

  forms: [
    {
      id: "gt-fm-sf1449",
      name: "SF 1449, Solicitation/Contract/Order for Commercial Products and Commercial Services",
      source: S_SIGN,
      handling: ["ava-fills", "you-sign"],
      signer: "You, as the owner",
      filledFrom: "Your registration details and your price schedule",
    },
    {
      id: "gt-fm-reps",
      name: "Representations and certifications, confirmed current in your registration",
      source: S_REPS,
      handling: ["you-sign"],
      signer: "You, as the owner",
    },
    {
      id: "gt-fm-refs",
      name: "Attachment 4, one reference form for each of your three similar jobs",
      source: S_REF_FORM,
      handling: ["ava-fills"],
      filledFrom: "Your three approved jobs and the contact details you enter",
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
        id: "gt-pk-tech",
        name: `Volume_I_Technical_Approach_${SHORT_FILE}.pdf`,
        covers: "Volume I, section 3.2",
        contains: [{ kind: "section", id: "gt-s-tech" }],
      },
      {
        id: "gt-pk-pp",
        name: `Volume_II_Past_Performance_${SHORT_FILE}.pdf`,
        covers: "Volume II and Attachment 4",
        contains: [
          { kind: "section", id: "gt-s-pp" },
          { kind: "form", id: "gt-fm-refs" },
        ],
      },
      {
        id: "gt-pk-price",
        // The Army's own Excel file, filled in: section 3.4 asks for its format.
        name: `Volume_III_Price_Schedule_${SHORT_FILE}.xlsx`,
        covers: "Volume III, Attachment 2",
        contains: [{ kind: "price", id: "price" }],
      },
      {
        id: "gt-pk-forms",
        name: `Signed_Forms_${SHORT_FILE}.pdf`,
        covers: "SF 1449, section 3.5",
        contains: [
          { kind: "form", id: "gt-fm-sf1449" },
          { kind: "form", id: "gt-fm-reps" },
        ],
      },
    ],
    markings: [
      `Email subject line, word for word: "RFQ ${ID} – ${PERSONA.businessName}"`,
      "Each volume in its own file. The price schedule stays an Excel file, as section 3.4 asks.",
    ],
    checklist: [
      {
        id: "gt-ck-internal",
        label: `Internal deadline: ${D(DUE_DAYS - 1)}, 2:00 PM Eastern Time, one day early`,
        auto: true,
      },
      {
        id: "gt-ck-gfe",
        label: `Ask ${SPEC.name} whether the Army issues laptops and tools, before questions close on ${DM(QUESTIONS_DAYS)}`,
      },
      { id: "gt-ck-exams", label: "Book Security+ exams for your two techs, before the start date" },
      {
        id: "gt-ck-sam",
        label: "Check your federal registration is active and your answers are current",
      },
      { id: "gt-ck-sign", label: "Sign the SF 1449" },
      { id: "gt-ck-reps", label: "Read and sign the representations and certifications statement" },
      { id: "gt-ck-subject", label: "Copy the email subject line word for word" },
      { id: "gt-ck-email", label: `Email the 4 files to ${CO.name} before 2:00 PM Eastern Time` },
      { id: "gt-ck-receipt", label: "Save the sent email as your receipt and upload it here" },
    ],
    certifying: [
      "You are an 8(a) participant, and your registration says so.",
      "You are small under the size standard for computer services.",
      "You will pay every tech at least the wage determination rate, plus health and welfare.",
      "Your registration answers are current and true on the day you sign.",
      "Your prices hold for 90 days after the due date, and stay fixed for each year of the contract.",
      "You will pay firms that are not 8(a) firms no more than half of what the Army pays you for services.",
      "The three jobs in your references happened as described, with those values and dates.",
      "Every tech you name holds the certification you list by the first day of work.",
    ],
  },

  reviewerFindings: [],

  addenda: [],

  overview: {
    noticeType: {
      text: "Request for Quote, with the notice and the rules in one document.",
      source: S_TYPE,
    },
    summary: {
      text: `Run the help desk and desk visits for about ${USERS} users at the Army Reserve's headquarters, with ${SEATS} people on site.`,
      source: S_SCOPE,
    },
    work: [
      { text: "Tier 1 at a walk-up counter and by phone.", source: S_TIERS },
      { text: "Tier 2 at the user's desk.", source: S_TIERS },
      { text: "Imaging, issuing and tracking computers.", source: S_IMAGING },
      { text: `Video calls in ${ROOMS} conference rooms.`, source: S_VTC },
      { text: "A monthly report on call times and first-contact fixes.", source: S_RESPONSE },
    ],
    place: { text: "Marshall Hall, Fort Bragg, North Carolina.", source: S_SCOPE },
    hours: {
      text: "7:00 AM to 5:00 PM, Monday to Friday, except federal holidays.",
      source: S_HOURS,
    },
    staffing: {
      text: `${SEATS} people on site, with a named Site Lead and Alternate.`,
      source: S_HOURS,
    },
    serviceLevels: {
      text: "90% of calls answered within 60 seconds. 80% of Tier 1 tickets fixed on the first contact.",
      source: S_RESPONSE,
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
      text: "Do not contact the Army Reserve's IT staff about this quote. Questions go to the contract specialist only.",
      source: S_NO_CONTACT,
    },
    buyerPortal: {
      text: "SAM.gov: the Army posts its answers to questions there, for every bidder.",
      source: S_QUESTIONS,
    },
    dates: [],
    expectedAward: null,
    start: {
      text: `Work starts with a ${PHASE_IN}-day phase-in after award. All ${SEATS} seats are filled by the end of it.`,
      source: S_PHASE_IN,
    },
    validity: { text: "Quotes stay valid for 90 days after the closing date.", source: S_VALID },
    setAside: {
      text: "Only 8(a) participants, registered as such in SAM.",
      source: S_SET_ASIDE,
    },
    size: {
      text: `Industry code ${PERSONA.primaryNaics}, computer services. Your registration lists you as small.`,
      source: S_SIZE,
    },
    lateRule: { text: "Quotes that arrive after the deadline are not considered.", source: S_DUE },
    subcontracting: {
      text: "Firms that are not 8(a) firms can get at most half of what the Army pays you for services.",
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

export const itAnswers: Record<string, AskAnswer> = {
  "gt-ask-secplus": { status: "done", at: AT(2), choiceId: "sec-book" },
  "gt-ask-hw": { status: "done", at: AT(4), choiceId: "hw-benefits" },
  "gt-ask-pay": {
    status: "done",
    at: AT(8),
    values: { "gt-fld-pay-tech": TECH_PAY, "gt-fld-pay-lead": 42 },
  },
  "gt-ask-payroll": {
    status: "done",
    at: AT(12),
    fileName: `${SHORT_FILE}_Payroll_Summary.pdf`,
    values: { "gt-fld-suta": 1.1, "gt-fld-wc": 0.4 },
  },
  "gt-ask-tools": { status: "done", at: AT(16), values: { "gt-fld-tools": 600 } },
  "gt-ask-pl": {
    status: "done",
    at: AT(20),
    fileName: `${SHORT_FILE}_Profit_and_Loss_2025.pdf`,
    values: { "gt-fld-overhead": 6 },
  },
  "gt-ask-contingency": { status: "done", at: AT(24), values: { "gt-fld-contingency": 1 } },
  "gt-ask-profit": {
    status: "done",
    at: AT(28),
    values: { "gt-fld-profit": 4, "gt-fld-escalation": 3 },
  },
  "gt-ask-ref1": { status: "done", at: AT(32) },
  "gt-ask-ref2": { status: "done", at: AT(33) },
  "gt-ask-ref3": { status: "done", at: AT(34) },
  "gt-ask-refcontacts": {
    status: "done",
    at: AT(40),
    values: {
      "gt-fld-ref1-phone": REFERENCE_CONTACTS.lamontKearney.phone,
      "gt-fld-ref1-email": REFERENCE_CONTACTS.lamontKearney.email,
      "gt-fld-ref2-phone": REFERENCE_CONTACTS.deniseHolloman.phone,
      "gt-fld-ref2-email": REFERENCE_CONTACTS.deniseHolloman.email,
      "gt-fld-ref3-phone": REFERENCE_CONTACTS.almaFerebee.phone,
      "gt-fld-ref3-email": REFERENCE_CONTACTS.almaFerebee.email,
    },
  },
  // The three questions. His answers when he gives them: his Seymour Johnson
  // lead moves over, three of his techs plus three hires, and the floor plus $1.50.
  "gt-ask-lead": { status: "done", at: AT(50), choiceId: "lead-move" },
  "gt-ask-staffing": { status: "done", at: AT(51), choiceId: "st-mix" },
  "gt-ask-techpay": { status: "done", at: AT(52), choiceId: "tp-plus" },
};

/** The three questions the story says wait on him, in Ava's order. */
export const HERO_OPEN = ["ask:gt-ask-lead", "ask:gt-ask-staffing", "ask:gt-ask-techpay"];

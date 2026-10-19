// Ava fixture · Supervisory leadership program, Fayetteville VA (federal).
// DEMO: the consulting firm's hero bid (src/demo/members/consulting).
//
// A VA Request for Quote: a combined synopsis and solicitation for commercial
// services on the SF 1449, set aside for service-disabled veteran-owned firms
// under Veterans First. Best value: the technical approach counts most, then
// past performance, then price. A base year and two option years, all firm
// fixed price.
//
// THE STORY (demo-storyboard/consulting-pack.md, sections 3, 7 and 8): four
// cohorts a year of up to 30 new supervisors, six classroom days each at the
// Fayetteville VA Medical Center and the Wilmington Health Care Center, a 360
// and three coaching sessions for each supervisor, coaches with an ICF PCC
// "or equal", and a quarterly report tied to the All Employee Survey. Simone
// Strayhorn (Coppervale Advisory Group) has one PCC and two ACC coaches, and two
// of her four cohort leads are 1099 facilitators. Every quotation below is the
// demo's own wording, inside a doc() call. No section numbers from the federal
// rulebook are cited.
//
// THE PRICE: about $207K for the base year, inside the notice's $170K–$230K a
// year and Grant's "about $200K a year". The Lead Facilitator bills near $138
// an hour once overhead and profit are on, near Grant's GSA median of $146.
//
// THIS BID IS ALREADY IN PROGRESS (start.ts): three questions wait on her (the
// pack, section 8): her Program Manager and Lead Facilitator, who teaches the
// four cohorts, and how she meets the coach credential.
//
// The member is always the consulting firm: this file reads her own records
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
const QUESTIONS_DAYS = briefDay("Q&A closes");
const POSTED = -STORY.postedDaysAgo;
/** The contracting officer the opportunity page names; the contract specialist beside them. */
const { primary: CO, second: SPEC } = buyerPeople(ID);
const MILES = PLACES[STORY.place].milesFromBase;
const WILMINGTON_MILES = PLACES.wilmington.milesFromBase;
const COHORTS = 4;
const SEATS = 30;
const PEOPLE = COHORTS * SEATS;
const DAYS = 6;
const SESSIONS = 3;
const WEEKS = 52;
const OPTION_YEARS = 2;

// ─── Her past jobs, from the story ───

function pastJob(id: PastPerformance["id"]): PastPerformance {
  const job = PAST_PERFORMANCE.find((p) => p.id === id);
  if (!job) throw new Error(`The consulting firm's story has no past job ${id}`);
  return job;
}

const JOB_ACS = pastJob("pp-acs-lean-review");
const JOB_ACADEMY = pastJob("pp-tidewell-academy");
const JOB_HALYARD = pastJob("pp-halyard-family-readiness");

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
const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const SHORT_FILE = PERSONA.businessShortName.replace(/\s+/g, "_");

/** Her Fort Bragg ACS contract, her first federal prime (the pack, section 2). */
const ACS_CONTRACT = "W91247-25-P-A061";
const ACS_FILE = `Fort_Bragg_ACS_Contract_${ACS_CONTRACT}.pdf`;

// ─── The people on this job (fictional) ───

/** Her senior consultant, a W-2 employee. */
const SENIOR = "Yvette Brannock";
/** The 1099 facilitator she can move to payroll. */
const MOVED = "Terrell Haywood";
const REF_ACS = {
  name: "Keisha Monroe",
  title: "Contracting Officer's Representative, Army Community Service, Fort Bragg",
};
const REF_ACADEMY = { name: JOB_ACADEMY.referenceName!, title: JOB_ACADEMY.referenceTitle! };
const REF_HALYARD = { name: JOB_HALYARD.referenceName!, title: JOB_HALYARD.referenceTitle! };

/** Her references' phone and email: one each, whichever bid asks. */
export const REFERENCE_CONTACTS = {
  keishaMonroe: { phone: "(910) 555-0168", email: "keisha.monroe@army.mil.example" },
  lenaAbernathy: { phone: "(910) 555-0133", email: "labernathy@tidewellhealth.example" },
  renataOduya: { phone: "(757) 555-0191", email: "roduya@halyardpointhc.example" },
} as const;

// ─── The buyer's files ───

const RFQ = "cv-f-rfq";
const PWS = "cv-f-pws";
const SHEET = "cv-f-price";
const CERT = "cv-f-cert";

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
  "This acquisition is set aside for service-disabled veteran-owned small businesses under the Veterans First Contracting Program. The Offeror must be listed as a certified SDVOSB in SBA's Veteran Small Business Certification database when it submits its quote and at the time of award.",
);
const S_SIZE = doc(
  RFQ,
  "Section 1.2, page 1",
  "§1.2",
  "The NAICS code for this acquisition is 611430, Professional and Management Development Training. The Offeror must be small under the size standard for this code.",
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
  "Offerors shall not contact Medical Center staff about this requirement. All communication shall go through the Contract Specialist.",
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
  "The Government intends to award a single Firm-Fixed-Price contract with a 12-month base period and two 12-month option periods.",
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
  "Volume I, Technical Approach, shall not exceed ten (10) pages. It shall describe the program design, the cohort schedule, the 360 assessment and coaching approach, and the quarterly reporting plan, and shall name the Program Manager and the Lead Facilitator and give the credential each proposed coach holds.",
);
const S_PP = doc(
  RFQ,
  "Section 3.3, page 15",
  "§3.3",
  "Volume II, Past Performance, has no page limit. Provide at least two (2) and no more than three (3) references for similar leadership training performed within the past five (5) years, and complete Attachment 3 for each, including a point of contact with current telephone number and email.",
);
const S_PRICE = doc(
  RFQ,
  "Section 3.4, page 15",
  "§3.4",
  "Volume III, Price, shall be the completed Attachment 2, Price Schedule, in its Excel format. Enter a unit price for every CLIN for the base period and each option period.",
);
const S_CERT = doc(
  RFQ,
  "Section 3.5, page 16",
  "§3.5",
  "The Offeror shall complete and sign Attachment 4, Limitations on Subcontracting Certificate, and submit it with its quote. A quote without the signed certificate will not be considered for award.",
);
const S_REPS = doc(
  RFQ,
  "Section 3.6, page 16",
  "§3.6",
  "Offerors shall confirm that their representations and certifications in SAM are current and accurate, and complete any provision in this RFQ that is not covered in SAM.",
);
const S_EMAIL = doc(
  RFQ,
  "Section 3.7, page 16",
  "§3.7",
  `Quotes shall be emailed to ${CO.email} with the subject line: RFQ ${ID} – [Offeror Name]. Each volume shall be a separate file. Total attachments shall not exceed 15 MB.`,
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
  "Technical Approach will be evaluated on the program design, the coaching approach, the reporting plan and the qualifications of the Program Manager, the Lead Facilitator and the proposed coaches.",
);
const S_EVAL_PP = doc(
  RFQ,
  "Section 4.2(b), page 17",
  "§4.2(b)",
  "Past Performance will be evaluated for relevance and quality, based on the references for similar work performed within the past five (5) years.",
);
const S_EVAL_PRICE = doc(
  RFQ,
  "Section 4.2(c), page 18",
  "§4.2(c)",
  "Price will be evaluated by adding the extended prices for all CLINs in the base period and both option periods.",
);
const S_SAM = doc(
  RFQ,
  "Section 5.2, page 19",
  "§5.2",
  "An Offeror shall be registered in SAM when submitting an offer or quotation, and shall continue to be registered until time of award, during performance, and through final payment.",
);
const S_SUBS = doc(
  RFQ,
  "Section 5.3, page 20",
  "§5.3",
  "The Contractor will not pay more than 50 percent of the amount paid by the Government for contract performance to subcontractors that are not certified service-disabled veteran-owned or veteran-owned small businesses.",
);
const S_INVOICE = doc(
  RFQ,
  "Section 5.4, page 21",
  "§5.4",
  "Invoices shall be submitted monthly, in arrears, through the VA's electronic invoicing system. Payment will be made within 30 days after receipt of a proper invoice.",
);
const S_INSURANCE = doc(
  RFQ,
  "Section 5.5, page 21",
  "§5.5",
  "Before starting work, the Contractor shall have general liability insurance of at least $500,000 per occurrence, and workers' compensation as required by State law.",
);
const S_REF_FORM = doc(
  RFQ,
  "Attachment 3, page 26",
  "Att. 3",
  "PAST PERFORMANCE REFERENCE FORM. Complete one form per reference. Point of contact name, title, telephone number and email address are required.",
);
const S_CERT_FORM = doc(
  CERT,
  "Attachment 4, page 1",
  "Att. 4",
  "The Offeror certifies that, if awarded the contract, it will not pay more than 50 percent of the amount paid by the Government to firms that are not certified SDVOSBs or VOSBs, and that it will provide supporting records to the Contracting Officer on request.",
);

const S_SCOPE = doc(
  PWS,
  "Section 1.2, page 2",
  "PWS 1.2",
  `The Contractor shall deliver a Supervisory Leadership Development Program for newly appointed supervisors of the Fayetteville VA Coastal Health Care System: ${COHORTS} cohorts per year of up to ${SEATS} participants each.`,
);
const S_CLASSROOM = doc(
  PWS,
  "Section 3.1, page 4",
  "PWS 3.1",
  `Each cohort shall receive ${DAYS} days of in-person classroom instruction, held at the Fayetteville VA Medical Center and the Wilmington Health Care Center as scheduled by the COR.`,
);
const S_360 = doc(
  PWS,
  "Section 3.2, page 5",
  "PWS 3.2",
  `Each participant shall complete a 360-degree leadership assessment with a one-on-one debrief, followed by ${SESSIONS} individual coaching sessions of at least 60 minutes.`,
);
const S_COACH = doc(
  PWS,
  "Section 3.3, page 5",
  "PWS 3.3",
  "Each coach shall hold a current International Coaching Federation (ICF) Professional Certified Coach (PCC) credential or equal.",
);
const S_REPORT = doc(
  PWS,
  "Section 3.4, page 6",
  "PWS 3.4",
  "The Contractor shall submit a quarterly report on attendance, completion and 360 results for each cohort, aligned to the supervisory items of the VA All Employee Survey.",
);
const S_KEY = doc(
  PWS,
  "Section 4.1, page 7",
  "PWS 4.1",
  "The Contractor shall name a Program Manager and a Lead Facilitator in its quote. Neither may be replaced without the Contracting Officer's written approval.",
);
const S_MATERIALS = doc(
  PWS,
  "Section 5.1, page 8",
  "PWS 5.1",
  "The Contractor shall furnish all course materials, assessment licenses and travel needed to perform. The Government provides classrooms at both sites.",
);

const S_CLIN_COHORT = doc(
  SHEET,
  "Attachment 2, row 4, CLIN 0001",
  "CLIN 0001",
  `0001 COHORT CLASSROOM INSTRUCTION, ${DAYS} DAYS, PER PWS 3.1. ESTIMATED QUANTITY: ${COHORTS} EA`,
);
const S_CLIN_COACH = doc(
  SHEET,
  "Attachment 2, row 5, CLIN 0002",
  "CLIN 0002",
  `0002 360 ASSESSMENT, DEBRIEF AND ${SESSIONS} COACHING SESSIONS, PER PARTICIPANT, PER PWS 3.2. ESTIMATED QUANTITY: ${PEOPLE} EA`,
);
const S_CLIN_REPORT = doc(
  SHEET,
  "Attachment 2, row 6, CLIN 0003",
  "CLIN 0003",
  "0003 QUARTERLY PROGRAM REPORT, PER PWS 3.4. ESTIMATED QUANTITY: 4 EA",
);

// ─── Her own record ───

const ACADEMY_AT = "Your jobs list: Nurse-manager leadership academy";
const HALYARD_AT = "Your jobs list: Family readiness staff classes";

const P_SAM_SDVOSB: Proof = sam("Business types", "Service-disabled veteran-owned small business, certified by the SBA");
const P_SAM_ADDRESS: Proof = sam("Physical address", PERSONA.physicalAddress);
const P_G1: Proof = profile("Your strengths", PERSONA.differentiators[0]);
const P_COHORTS: Proof = profile("Your strengths", PERSONA.differentiators[1]);
const P_LEAN: Proof = profile("Your strengths", PERSONA.differentiators[2]);
const P_OFFICE: Proof = profile("Your office", PERSONA.kitchen ?? "");
const P_STAFF: Proof = profile("Your company size", `People on staff: ${PERSONA.employeesW2}`);

const P_ACS_SCOPE: Proof = yourDoc(ACS_FILE, "Statement of work, page 2", JOB_ACS.scopeDescription);
const P_ACS_TERMS: Proof = yourDoc(
  ACS_FILE,
  "Page 1, blocks 3 and 20",
  `Contract ${ACS_CONTRACT}. ${longDate(JOB_ACS.periodStart)} to ${longDate(JOB_ACS.periodEnd)}. Total ${money(JOB_ACS.totalValue)}.`,
);
const P_ACS_COR: Proof = yourDoc(
  ACS_FILE,
  "Page 3, contract administration",
  `Contracting Officer's Representative: ${REF_ACS.name}, ${REF_ACS.title}`,
);

const P_ACADEMY_SCOPE: Proof = profile(ACADEMY_AT, JOB_ACADEMY.scopeDescription);
const P_ACADEMY_TERMS: Proof = profile(
  ACADEMY_AT,
  `${longDate(JOB_ACADEMY.periodStart)} to ${longDate(JOB_ACADEMY.periodEnd)}. Total value ${money(JOB_ACADEMY.totalValue)}.`,
);
const P_ACADEMY_REF: Proof = profile(ACADEMY_AT, `Reference: ${REF_ACADEMY.name}, ${REF_ACADEMY.title}.`);

const P_HALYARD_SCOPE: Proof = profile(HALYARD_AT, JOB_HALYARD.scopeDescription);
const P_HALYARD_TERMS: Proof = profile(
  HALYARD_AT,
  `${longDate(JOB_HALYARD.periodStart)} to ${longDate(JOB_HALYARD.periodEnd)}. Total value ${money(JOB_HALYARD.totalValue)}.`,
);
const P_HALYARD_REF: Proof = profile(HALYARD_AT, `Reference: ${REF_HALYARD.name}, ${REF_HALYARD.title}.`);

// ─── The staffing plan: the price pays for these hours ───
// Paid hours in an average week, over 52 weeks. A year of the program is
// 24 classroom days, 120 debriefs and 360 coaching sessions, and 4 reports.
// ponytail: the price burdens every hour as payroll, 1099 hours included; the
// 1099 facilitator in reserve costs a little less than this.

const PLAN = {
  pm: { count: 1, hoursPerWeek: 3 },
  lead: { count: 1, hoursPerWeek: 6 },
  cohort: { count: COHORTS, hoursPerWeek: 1.5 },
  coach: { count: 3, hoursPerWeek: 3 },
  analyst: { count: 1, hoursPerWeek: 2 },
};
const PLAN_HOURS = Object.values(PLAN).reduce((n, r) => n + r.count * r.hoursPerWeek, 0);

// ─── The three questions that wait on her (the pack, section 8) ───

const LEADS_TEXT = {
  "lead-simone": `${PERSONA.ownerName}, the company's ${PERSONA.ownerTitle.toLowerCase()}, is the Program Manager. ${SENIOR}, a senior consultant on staff, is the Lead Facilitator and teaches part of every cohort`,
  "lead-reverse": `${SENIOR}, a senior consultant on staff, is the Program Manager. ${PERSONA.ownerName}, the company's ${PERSONA.ownerTitle.toLowerCase()}, is the Lead Facilitator and teaches part of every cohort`,
  "lead-hire":
    "The company will hire a Program Manager and a Lead Facilitator after award, and name both to the Contracting Officer in writing before the first cohort",
};
const TEACH_TEXT = {
  "teach-w2": "Each of the four cohorts is led by a facilitator on the company's own payroll",
  "teach-mix":
    "Two cohorts are led by facilitators on the company's payroll, and two by contract facilitators",
  "teach-payroll": `Three cohorts are led by facilitators on the company's payroll. ${MOVED}, a contract facilitator today, joins the payroll before the first cohort and leads the fourth`,
};
const COACH_TEXT = {
  "coach-qa":
    "Coaching is led by a coach who holds the ICF PCC credential, with two ICF ACC coaches who each have more than 100 hours coaching federal supervisors. The company has asked VA in writing whether that experience meets \"or equal\"",
  "coach-hire":
    "Every coach who coaches VA supervisors holds the ICF PCC credential: the company's PCC coach, and PCC coaches it hires to its payroll before the first cohort",
  "coach-exception": "The company takes exception to the PCC requirement",
};

// ─── The bid ───

export const consultingBid: AvaBid = {
  noticeId: ID,
  officialTitle: STORY.title,
  buyer: STORY.agency,
  bidNumber: ID,
  kind: "written-proposal",
  kindReason:
    "A ten-page technical approach, three references, VA's Excel price schedule and a signed subcontracting certificate.",

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
      pages: 11,
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
      id: CERT,
      name: "Attachment_4_Limitations_on_Subcontracting_Certificate.pdf",
      role: "form",
      pages: 2,
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
        id: "cv-cr-tech",
        name: "Technical approach: program, coaching, reporting and people",
        points: null,
        kind: "scored-writing",
        source: S_EVAL_TECH,
        treatment: "Counts most. The program design, the coaches and the named people are read closely.",
      },
      {
        id: "cv-cr-pp",
        name: "Past performance on similar leadership training",
        points: null,
        kind: "scored-fact",
        source: S_EVAL_PP,
        treatment: "Counts second. Two or three similar jobs from the last five years.",
      },
      {
        id: "cv-cr-price",
        name: "Price",
        points: null,
        kind: "price-formula",
        source: S_EVAL_PRICE,
        treatment: "Counts least. All three years are added up.",
      },
    ],
    note: "No points. VA weighs your program and your record against your price.",
  },

  hardRequirements: [
    {
      id: "cv-r-sdvosb",
      grantRow: "cv-sdvosb",
      group: "eligibility",
      label: "A certified service-disabled veteran-owned firm when you quote, and at award",
      source: S_SET_ASIDE,
      initial: "meets",
      evidence: "Certified by SBA on 14 Jan 2024. Eligibility ends 14 Jan 2027: renew before VA awards.",
    },
    {
      id: "cv-r-sam",
      grantRow: "cv-sam",
      group: "eligibility",
      label: "Active federal registration when you quote, and through award",
      source: S_SAM,
      initial: "meets",
      evidence: `Your registration is active until ${SAM_UNTIL}.`,
    },
    {
      id: "cv-r-size",
      grantRow: "cv-size",
      group: "eligibility",
      label: "Small under the size standard for management training",
      source: S_SIZE,
      initial: "meets",
      evidence: "Your registration lists you as small for industry code 611430.",
    },
    {
      id: "cv-r-limits",
      grantRow: "cv-limits",
      group: "people",
      // The limit is kept during the work; the certificate that promises it
      // goes in with the quote (a form). The ask is asked with the bid.
      neededAt: "work-start",
      label: "At most half of what VA pays goes to firms that are not veteran-owned",
      source: S_SUBS,
      initial: "confirm",
      askId: "cv-ask-teach",
      evidenceAfter: "Your quote says who teaches each cohort, and your own staff carry most of the hours",
    },
    {
      id: "cv-r-coach",
      grantRow: "cv-coach",
      group: "people",
      neededAt: "work-start",
      label: "Every coach holds an ICF PCC credential or equal",
      source: S_COACH,
      initial: "confirm",
      askId: "cv-ask-coach",
      evidenceAfter: "Every coach you name holds the PCC credential",
    },
    {
      id: "cv-r-leads",
      grantRow: "cv-leads",
      group: "people",
      // The work statement wants them in place once work starts. The quote's
      // technical approach names them, so the ask is asked with the bid.
      neededAt: "work-start",
      label: "A named Program Manager and Lead Facilitator",
      source: S_KEY,
      initial: "confirm",
      askId: "cv-ask-leads",
      evidenceAfter: "Your quote names your Program Manager and Lead Facilitator",
    },
    {
      id: "cv-r-insurance",
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
      summary: "Only certified service-disabled veteran-owned firms may quote. VA checks it at award too.",
      source: S_SET_ASIDE,
      requirementId: "cv-r-sdvosb",
    },
    { topic: "bonds", found: false, summary: "No bid, performance or payment bond asked for." },
    {
      topic: "insurance",
      found: true,
      summary: "Liability insurance before work starts. Your $1M policy is above the $500,000 minimum.",
      source: S_INSURANCE,
      requirementId: "cv-r-insurance",
    },
    { topic: "wages", found: false, summary: "No wage determination in these files." },
    { topic: "tax", found: false, summary: "No sales or use tax rules in these files." },
    {
      topic: "notary-signature",
      found: true,
      summary: "No notary. You sign the SF 1449 and the subcontracting certificate.",
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
      summary: "Two or three similar jobs from the last five years, each on its own reference form, and each coach's credential.",
      source: S_PP,
    },
    {
      topic: "participation-goals",
      found: true,
      summary: "At most half of what VA pays may go to firms that are not veteran-owned. You sign a certificate saying so.",
      source: S_SUBS,
      requirementId: "cv-r-limits",
    },
    { topic: "background-checks", found: false, summary: "No background checks asked for in these files." },
    {
      topic: "portal-rules",
      found: true,
      summary: "Quotes go by email. One file per volume, 15 MB in total, and a set subject line.",
      source: S_EMAIL,
    },
  ],

  commitments: [
    {
      id: "cv-c-cohorts",
      text: `${COHORTS} cohorts a year of up to ${SEATS} new supervisors, each with ${DAYS} classroom days at the Fayetteville VA Medical Center and the Wilmington Health Care Center.`,
      source: S_CLASSROOM,
      pricedAs: `Priced as: ${PLAN_HOURS} paid hours in an average week, plus materials and travel to Wilmington for each cohort.`,
      needsApproval: true,
    },
    {
      id: "cv-c-coaching",
      text: `A 360 with a one-on-one debrief, then ${SESSIONS} coaching sessions of at least an hour, for every supervisor.`,
      source: S_360,
      pricedAs: `Priced as: three coaches at 3 hours a week each, and a 360 license for each of the ${PEOPLE} supervisors.`,
      needsApproval: true,
    },
    {
      id: "cv-c-report",
      text: "A report each quarter on attendance, completion and 360 results for each cohort, tied to the All Employee Survey.",
      source: S_REPORT,
      pricedAs: "Priced as: an analyst at 2 hours a week.",
      needsApproval: true,
    },
    {
      id: "cv-c-price",
      text: "Prices fixed for each year of the contract.",
      source: S_CONTRACT,
      pricedAs: "Priced as: today's pay, with your yearly increase in each option year.",
      needsApproval: false,
    },
  ],

  contractTerms: [
    {
      text: "A 12-month base year, then two 12-month option years VA may choose to use.",
      source: S_CONTRACT,
    },
    {
      text: "You price both option years now. Ava adds your yearly increase to each line.",
      source: S_PRICE,
    },
    {
      text: "You bring the course materials, the 360 licenses and your own travel. VA provides the classrooms.",
      source: S_MATERIALS,
    },
    {
      text: "You bill monthly, after the month ends, and VA pays within 30 days of a correct invoice.",
      source: S_INVOICE,
    },
    { text: "Your prices hold for 90 days after the due date.", source: S_VALID },
    {
      text: "Firms that are not veteran-owned may get no more than half of what VA pays you. A 1099 facilitator may count as one of them.",
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
      label: "Service-disabled veteran-owned",
      value: "Certified 14 Jan 2024. Eligibility ends 14 Jan 2027",
      from: "Your federal registration, and Grant's check",
    },
    {
      label: "Industry codes",
      value: [`${PERSONA.primaryNaics} ${PERSONA.primaryNaicsLabel}`, ...PERSONA.secondaryNaics.map((n) => `${n.code} ${n.label}`)].join(", "),
      from: "Your GovPreneurs profile",
    },
    { label: "People on staff", value: String(PERSONA.employeesW2), from: "Your GovPreneurs profile" },
    { label: "Office and team", value: PERSONA.kitchen ?? "", from: "Your GovPreneurs profile" },
    { label: "Coaches", value: "One ICF PCC and two ICF ACC", from: "Your staff roster" },
    {
      label: "Insurance on file",
      value: "General liability $1M per occurrence.",
      from: "Your GovPreneurs profile",
    },
    {
      label: JOB_ACS.projectTitle,
      value: `Main contractor, ${money(JOB_ACS.totalValue)}. No performance rating yet.`,
      from: "Your contract file, and your jobs list",
    },
    {
      label: JOB_ACADEMY.projectTitle,
      value: `Main contractor, ${money(JOB_ACADEMY.totalValue)}`,
      from: "Your GovPreneurs profile, jobs list",
    },
    {
      label: JOB_HALYARD.projectTitle,
      value: `Subcontractor, ${money(JOB_HALYARD.totalValue)}`,
      from: "Your GovPreneurs profile, jobs list",
    },
  ],

  asks: [
    // ── The three questions that wait on her ──
    {
      id: "cv-ask-leads",
      kind: "answer",
      title: "Your Program Manager and Lead Facilitator",
      source: S_KEY,
      why: "The work statement wants both named in your quote, and VA must approve any change later. Your profile names no one for this job.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      neededAt: "bid",
      group: "people",
      answer: {
        type: "answer",
        question: "Who are your Program Manager and Lead Facilitator?",
        choices: [
          {
            id: "lead-simone",
            label: `Me as Program Manager, ${SENIOR} as Lead Facilitator`,
            consequence: `Ava names you as Program Manager and ${SENIOR} as Lead Facilitator.`,
          },
          {
            id: "lead-reverse",
            label: `${SENIOR} as Program Manager, me as Lead Facilitator`,
            consequence: `Ava names ${SENIOR} as Program Manager and you as Lead Facilitator.`,
            warn: "Then you teach part of every cohort: 24 classroom days a year, some of them in Wilmington. Plan the ACS work and the next quote around them.",
          },
          {
            id: "lead-hire",
            label: "Hire them on award",
            consequence: "Ava writes that you name both before the first cohort, and flags the risk.",
            gives: {
              status: "confirm",
              evidence: "A risk: you plan to hire both, so your quote names no one yet",
            },
            warn: "That is a risk. The technical approach is read on the named people, and a quote with none can be rated lower. I wrote that you name both before the first cohort.",
          },
        ],
      },
      feeds: ["Draft · Key people", "Hard requirement · Program Manager and Lead Facilitator"],
    },
    {
      id: "cv-ask-teach",
      kind: "answer",
      title: "Who teaches the four cohorts",
      source: S_SUBS,
      why: "At most half of what VA pays may go to firms that are not veteran-owned. Two of your four cohort leads are 1099 facilitators, who may count as subcontractors.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      neededAt: "bid",
      group: "people",
      answer: {
        type: "answer",
        question: "Who teaches the four cohorts?",
        choices: [
          {
            id: "teach-w2",
            label: "All W-2 staff",
            consequence: "Ava writes that a facilitator on your payroll leads each cohort.",
          },
          {
            id: "teach-mix",
            label: "Two W-2 and two 1099 facilitators",
            consequence: "Ava writes that two cohorts are led by contract facilitators, and flags the 50% rule.",
            gives: {
              status: "confirm",
              evidence: "A risk: two cohort leads are 1099 facilitators, who may count as subcontractors",
            },
            warn: "That puts the 50% rule at risk. A 1099 facilitator may count as a subcontractor, and VA can ask you to show that your own staff carry at least half. Count the paid hours by person before you sign the certificate.",
          },
          {
            id: "teach-payroll",
            label: "Move one facilitator to payroll first",
            consequence: `Ava writes that ${MOVED} joins your payroll and three cohorts are led by your own staff.`,
          },
        ],
      },
      feeds: ["Draft · Who teaches", "Hard requirement · The 50% rule"],
    },
    {
      id: "cv-ask-coach",
      kind: "answer",
      title: "How you meet the coach credential",
      source: S_COACH,
      why: "Every coach needs an ICF PCC credential or equal. You have one PCC and two ACC coaches.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      neededAt: "bid",
      group: "people",
      answer: {
        type: "answer",
        question: "How do you meet the coach credential?",
        // The choice that meets the line outright comes first; her own pick,
        // which waits on VA's answer, second.
        choices: [
          {
            id: "coach-hire",
            label: "Hire a PCC coach on payroll",
            consequence: "Ava names PCC coaches only, and you hire the second before the first cohort.",
          },
          {
            id: "coach-qa",
            label: "PCC plus two ACC, with VA's Q&A answer",
            consequence: "Ava names your three coaches and says you asked VA about \"or equal\".",
            gives: {
              status: "confirm",
              evidence: "Waiting on VA's answer to your coach question",
            },
            warn: `Then send the coach question before Q&A closes on ${DM(QUESTIONS_DAYS)}. If VA says an ACC is not equal, hire a PCC coach before you quote.`,
          },
          {
            id: "coach-exception",
            label: "Take exception to the PCC line",
            failsGate:
              "A quote that takes exception to the coach credential does not meet the work statement. VA can set it aside without reading the rest.",
          },
        ],
      },
      feeds: ["Draft · Coaches", "Hard requirement · Coach credential"],
    },

    // ── Answered before the story starts ──
    {
      id: "cv-ask-pay",
      kind: "enter",
      title: "What you pay each role (5 roles)",
      source: S_PRICE,
      why: "The price starts from what you pay each person for an hour of this work.",
      owner: "bookkeeper",
      leadDays: 2,
      minutes: 10,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          { id: "cv-fld-pay-pm", label: "Program Manager, per hour", unit: "usd-hour", hint: "What you will pay, before taxes." },
          { id: "cv-fld-pay-lead", label: "Lead Facilitator, per hour", unit: "usd-hour", hint: "What you will pay, before taxes." },
          { id: "cv-fld-pay-cohort", label: "Cohort facilitator, per hour", unit: "usd-hour", hint: "What you will pay, before taxes." },
          { id: "cv-fld-pay-coach", label: "Coach, per hour", unit: "usd-hour", hint: "What you will pay, before taxes." },
          { id: "cv-fld-pay-analyst", label: "Analyst, per hour", unit: "usd-hour", hint: "What you will pay, before taxes." },
        ],
      },
      feeds: ["Price · Program Manager", "Price · Lead Facilitator", "Price · Facilitators", "Price · Coaches", "Price · Analyst"],
    },
    {
      id: "cv-ask-payroll",
      kind: "upload",
      title: "Your latest payroll report",
      source: S_PRICE,
      why: "Ava reads your unemployment tax, workers' comp and benefits rates from it. Nothing is guessed.",
      owner: "bookkeeper",
      leadDays: 2,
      minutes: 10,
      answer: {
        type: "upload",
        accepts: "A payroll summary from your payroll service, for any recent month",
        extracts: [
          { fieldId: "cv-fld-suta", label: "Unemployment tax, state and federal", value: 1.2, unit: "percent", where: "Tax summary, page 2" },
          { fieldId: "cv-fld-wc", label: "Workers' comp premium", value: 0.3, unit: "percent", where: "Employer costs, page 3" },
          { fieldId: "cv-fld-benefits", label: "Health insurance and paid leave", value: 11, unit: "percent", where: "Employer costs, page 3" },
        ],
      },
      feeds: ["Price · Unemployment tax", "Price · Workers' comp", "Price · Benefits"],
    },
    {
      id: "cv-ask-direct",
      kind: "enter",
      title: "360 licenses, materials and travel",
      source: S_MATERIALS,
      why: "The work statement says you bring them. Only you know what they cost you.",
      owner: "you",
      leadDays: 1,
      minutes: 5,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "cv-fld-360",
            label: "360 assessment license, per supervisor",
            unit: "usd",
            hint: "What your 360 vendor charges for one person.",
          },
          {
            id: "cv-fld-cohort-direct",
            label: "Materials and travel, per cohort",
            unit: "usd",
            hint: `Workbooks, and mileage and hotel for the Wilmington days, ${WILMINGTON_MILES} miles away.`,
          },
        ],
      },
      feeds: ["Price · 360 licenses", "Price · Materials and travel"],
    },
    {
      id: "cv-ask-pl",
      kind: "upload",
      title: "Your 2025 profit and loss statement",
      source: S_PRICE,
      why: "Ava works out your overhead from it: the training room, rent, software, insurance and your time selling the work.",
      owner: "bookkeeper",
      leadDays: 3,
      minutes: 10,
      answer: {
        type: "upload",
        accepts: "Your 2025 profit and loss statement, from your bookkeeper",
        extracts: [
          { fieldId: "cv-fld-overhead", label: "Overhead, as a share of direct cost", value: 45, unit: "percent", where: "Operating expenses, page 1" },
        ],
      },
      feeds: ["Price · Overhead"],
    },
    {
      id: "cv-ask-contingency",
      kind: "enter",
      title: "Your contingency, for costs that run over",
      source: S_PRICE,
      why: "A reserve for costs that come in higher than planned, such as a cohort moved to Wilmington. Ava never picks it.",
      owner: "you",
      leadDays: 0,
      minutes: 5,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "cv-fld-contingency",
            label: "Contingency, as a percent of cost",
            unit: "percent",
            hint: "Added to labor, materials and overhead, before profit. Enter 0 if you want none.",
          },
        ],
      },
      feeds: ["Price · Contingency"],
    },
    {
      id: "cv-ask-profit",
      kind: "enter",
      title: "Your profit, and your yearly increase for the option years",
      source: S_PRICE,
      why: "Ava never picks your margin. Price counts least here, and the last two Fayetteville VA leadership buys went for $153K and $195K.",
      owner: "you",
      leadDays: 1,
      minutes: 15,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          { id: "cv-fld-profit", label: "Profit", unit: "percent", hint: "A share of your total cost." },
          {
            id: "cv-fld-escalation",
            label: "Yearly increase for each option year",
            unit: "percent",
            hint: "What you expect pay and travel to rise each year.",
          },
        ],
      },
      feeds: ["Price · Profit", "Price · Option years"],
    },
    {
      id: "cv-ask-ref1",
      kind: "approve",
      title: "Nurse-manager leadership academy as reference 1",
      source: S_PP,
      why: "Cohorts of new managers with classroom days, a 360 and three coaching sessions each: the same program.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use your nurse-manager academy as reference 1? ${REF_ACADEMY.name} is the contact.`,
        from: "Your GovPreneurs profile, jobs list",
        value: `${JOB_ACADEMY.projectTitle}. Contact: ${REF_ACADEMY.name}`,
      },
      feeds: ["Similar work · Reference 1", "Form · Attachment 3"],
    },
    {
      id: "cv-ask-ref2",
      kind: "approve",
      title: "Fort Bragg ACS Lean review and staff training as reference 2",
      source: S_PP,
      why: "Your federal prime: staff training for a government office, delivered on time.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use your Fort Bragg ACS contract as reference 2? ${REF_ACS.name}, named in your contract, is the contact.`,
        from: "Your contract file",
        value: `${JOB_ACS.projectTitle}. Contact: ${REF_ACS.name}`,
        asOf: "No performance rating has been written for this job yet.",
      },
      feeds: ["Similar work · Reference 2", "Form · Attachment 3"],
    },
    {
      id: "cv-ask-ref3",
      kind: "approve",
      title: "Family readiness staff classes as reference 3",
      source: S_PP,
      why: "Training classes for Army staff, taught in cohorts across the Southeast.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use your family readiness classes as reference 3? ${REF_HALYARD.name} is the contact.`,
        from: "Your GovPreneurs profile, jobs list",
        value: `${JOB_HALYARD.projectTitle}. Contact: ${REF_HALYARD.name}`,
        asOf: "You were the subcontractor on this job. The reference form asks for your role.",
      },
      feeds: ["Similar work · Reference 3", "Form · Attachment 3"],
    },
    {
      id: "cv-ask-refcontacts",
      kind: "enter",
      title: "Current phone and email for your three references",
      source: S_REF_FORM,
      why: "VA may call them. A wrong number can weaken this part.",
      owner: "references",
      leadDays: 3,
      minutes: 10,
      answer: {
        type: "enter",
        fields: [
          { id: "cv-fld-ref1-phone", label: `${REF_ACADEMY.name}, phone`, unit: "phone" },
          { id: "cv-fld-ref1-email", label: `${REF_ACADEMY.name}, email`, unit: "email" },
          { id: "cv-fld-ref2-phone", label: `${REF_ACS.name}, phone`, unit: "phone" },
          { id: "cv-fld-ref2-email", label: `${REF_ACS.name}, email`, unit: "email" },
          { id: "cv-fld-ref3-phone", label: `${REF_HALYARD.name}, phone`, unit: "phone" },
          { id: "cv-fld-ref3-email", label: `${REF_HALYARD.name}, email`, unit: "email" },
        ],
      },
      feeds: ["Form · Attachment 3"],
    },
  ],

  // Her coach question is a task she has not sent yet (workspace.ts), so it
  // sits on the checklist, not here: a clarification here would read as sent.
  clarifications: [],

  plan: [
    {
      id: "cv-p-tech",
      source: S_TECH,
      kind: "scored-item",
      needs: "writing",
      ifMissed: "VA has nothing to judge your program by.",
      answeredIn: { kind: "section", id: "cv-s-tech", label: "Technical approach" },
    },
    {
      id: "cv-p-leads",
      source: S_KEY,
      kind: "instruction",
      needs: "writing",
      ifMissed: "A quote with no named Program Manager or Lead Facilitator can be rated lower.",
      answeredIn: { kind: "section", id: "cv-s-tech", label: "Technical approach" },
      askId: "cv-ask-leads",
    },
    {
      id: "cv-p-coach",
      source: S_COACH,
      kind: "instruction",
      needs: "writing",
      ifMissed: "VA cannot tell whether your coaches meet the credential.",
      answeredIn: { kind: "section", id: "cv-s-tech", label: "Technical approach" },
      askId: "cv-ask-coach",
    },
    {
      id: "cv-p-report",
      source: S_REPORT,
      kind: "instruction",
      needs: "writing",
      ifMissed: "VA reads the program on its results. With no reporting plan, the approach is weaker.",
      answeredIn: { kind: "section", id: "cv-s-tech", label: "Technical approach" },
    },
    {
      id: "cv-p-pp",
      source: S_PP,
      kind: "scored-item",
      needs: "writing",
      ifMissed: "With fewer than two references, this part cannot be rated.",
      answeredIn: { kind: "section", id: "cv-s-pp", label: "Your three similar jobs" },
      askId: "cv-ask-ref1",
    },
    {
      id: "cv-p-refform",
      source: S_REF_FORM,
      kind: "form",
      needs: "attachment",
      ifMissed: "VA cannot reach your references, so this part is weaker.",
      answeredIn: { kind: "form", id: "cv-fm-refs", label: "Reference forms, Attachment 3" },
      askId: "cv-ask-refcontacts",
    },
    {
      id: "cv-p-price",
      source: S_PRICE,
      kind: "instruction",
      needs: "price",
      ifMissed: "A missing unit price makes the quote incomplete.",
      answeredIn: { kind: "price", id: "price", label: "Price schedule" },
      askId: "cv-ask-profit",
    },
    {
      id: "cv-p-cert",
      source: S_CERT,
      kind: "form",
      needs: "signature",
      ifMissed: "A quote without the signed certificate is not considered for award.",
      answeredIn: { kind: "form", id: "cv-fm-cert", label: "Limitations on subcontracting certificate" },
      askId: "cv-ask-teach",
    },
    {
      id: "cv-p-sf1449",
      source: S_SIGN,
      kind: "form",
      needs: "signature",
      ifMissed: "An unsigned quote may be rejected as incomplete.",
      answeredIn: { kind: "form", id: "cv-fm-sf1449", label: "SF 1449, signed by you" },
    },
    {
      id: "cv-p-reps",
      source: S_REPS,
      kind: "form",
      needs: "signature",
      ifMissed: "VA cannot award to a company whose answers are out of date.",
      answeredIn: { kind: "form", id: "cv-fm-reps", label: "Representations and certifications" },
    },
    {
      id: "cv-p-email",
      source: S_EMAIL,
      kind: "logistics",
      needs: "action",
      ifMissed: "A quote with the wrong subject line or over 15 MB may never arrive.",
      answeredIn: { kind: "checklist", id: "cv-ck-email", label: "Checklist: email the quote" },
    },
    {
      id: "cv-p-due",
      source: S_DUE,
      kind: "logistics",
      needs: "action",
      ifMissed: "A quote after 2:00 PM Eastern Time is not considered.",
      answeredIn: { kind: "checklist", id: "cv-ck-internal", label: "Checklist: internal deadline" },
    },
  ],

  themes: [],

  sections: [
    {
      id: "cv-s-tech",
      title: "Technical approach",
      answers: S_TECH,
      criterionId: "cv-cr-tech",
      points: null,
      pageLimit: 10,
      pages: 6,
      paragraphs: [
        // 0 · Who does the work, and where.
        [
          {
            text: `${PERSONA.businessName} will run the Supervisory Leadership Development Program for new supervisors of the Fayetteville VA Coastal Health Care System. `,
          },
          {
            text: "The company is a certified service-disabled veteran-owned small business",
            claim: { id: "cv-cl-sdvosb", tag: "verified", proof: P_SAM_SDVOSB },
          },
          { text: ", based at " },
          {
            text: PERSONA.physicalAddress.replace(/, NC \d{5}$/, ""),
            claim: { id: "cv-cl-address", tag: "verified", proof: P_SAM_ADDRESS },
          },
          { text: `, ${MILES} miles from the Medical Center. ` },
          {
            text: "Its founder ran HR for an Army corps in uniform, as a lieutenant colonel and deputy G-1",
            claim: { id: "cv-cl-g1", tag: "verified", proof: P_G1 },
          },
          { text: "." },
        ],
        // 1 · Key people.
        [
          {
            text: "The Program Manager and the Lead Facilitator are named here",
            claim: {
              id: "cv-cl-leads",
              tag: "unsupported",
              askId: "cv-ask-leads",
              gap: "[NEEDED: your Program Manager and Lead Facilitator]",
              resolvedText: LEADS_TEXT["lead-simone"],
              resolvedByChoice: LEADS_TEXT,
            },
          },
          { text: ". " },
          {
            text: "Each cohort is led by a named facilitator",
            claim: {
              id: "cv-cl-teach",
              tag: "unsupported",
              askId: "cv-ask-teach",
              gap: "[NEEDED: who teaches the four cohorts]",
              resolvedText: TEACH_TEXT["teach-payroll"],
              resolvedByChoice: TEACH_TEXT,
            },
          },
          { text: "." },
        ],
        // 2 · The program.
        [
          {
            text: "The company runs cohort leadership programs with 360s and coaching",
            claim: { id: "cv-cl-cohorts", tag: "verified", proof: P_COHORTS },
          },
          { text: ". " },
          {
            text: `${COHORTS} cohorts a year of up to ${SEATS} new supervisors each have ${DAYS} classroom days at the Fayetteville VA Medical Center and the Wilmington Health Care Center`,
            claim: { id: "cv-cl-classroom", tag: "commitment", commitmentId: "cv-c-cohorts" },
          },
          {
            text: ". Days 1 and 2 cover the supervisor's role and VA's rules for leave, conduct and performance. Days 3 and 4 cover hard conversations and coaching your own staff. Days 5 and 6 cover running a team and fixing one work process, the way the company's Lean reviews do.",
          },
        ],
        // 3 · 360s and coaching.
        [
          {
            text: `Every supervisor gets a 360 with a one-on-one debrief, then ${SESSIONS} coaching sessions of at least an hour`,
            claim: { id: "cv-cl-coaching", tag: "commitment", commitmentId: "cv-c-coaching" },
          },
          { text: ". " },
          {
            text: "Every coach meets the credential",
            claim: {
              id: "cv-cl-coach",
              tag: "unsupported",
              askId: "cv-ask-coach",
              gap: "[NEEDED: how you meet the coach credential]",
              resolvedText: COACH_TEXT["coach-qa"],
              resolvedByChoice: COACH_TEXT,
            },
          },
          { text: "." },
        ],
        // 4 · Reporting.
        [
          {
            text: "Each quarter VA gets a report on attendance, completion and 360 results for each cohort, tied to the All Employee Survey",
            claim: { id: "cv-cl-report", tag: "commitment", commitmentId: "cv-c-report" },
          },
          { text: ". " },
          {
            text: "The company's Lean reviews measure results the same way: walk-in waits at Fort Bragg ACS fell from 38 to 14 minutes",
            claim: { id: "cv-cl-lean", tag: "verified", proof: P_LEAN },
          },
          { text: "." },
        ],
        // 5 · The team: the one staffing plan the price uses.
        [
          {
            text: `The company has ${PERSONA.employeesW2} people on staff`,
            claim: { id: "cv-cl-staff", tag: "verified", proof: P_STAFF },
          },
          { text: ". " },
          {
            text: "It works from an office and a 30-seat training room on Green Street",
            claim: { id: "cv-cl-office", tag: "verified", proof: P_OFFICE },
          },
          {
            text: `. This program uses ${PLAN_HOURS} paid hours in an average week: the Program Manager, the Lead Facilitator, four cohort facilitators, three coaches and an analyst for the 360s and the reports.`,
          },
        ],
      ],
      decisions: [
        {
          id: "cv-dec-days",
          paragraphIndex: 2,
          choice: "Days 5 and 6 cover running a team and fixing one work process, the way the company's Lean reviews do.",
          other:
            "Days 5 and 6 cover running a team and fixing one work process, and each supervisor presents that fix to their own service chief.",
        },
      ],
      challenges: [],
    },
    {
      id: "cv-s-pp",
      title: "Past performance: three similar training jobs",
      answers: S_PP,
      criterionId: "cv-cr-pp",
      points: null,
      pageLimit: null,
      pages: 2,
      paragraphs: [
        [
          { text: "Reference 1: " },
          {
            text: `${JOB_ACADEMY.projectTitle}, ${longDate(JOB_ACADEMY.periodStart)} to ${longDate(JOB_ACADEMY.periodEnd)}, ${money(JOB_ACADEMY.totalValue)}`,
            claim: { id: "cv-cl-r1-terms", tag: "verified", proof: P_ACADEMY_TERMS },
          },
          { text: ". " },
          {
            text: "A cohort leadership academy for new nurse managers: classroom days, a 360 for each manager and three coaching sessions",
            claim: { id: "cv-cl-r1-scope", tag: "verified", proof: P_ACADEMY_SCOPE },
          },
          { text: ". Contact: " },
          {
            text: `${REF_ACADEMY.name}, ${REF_ACADEMY.title}`,
            claim: { id: "cv-cl-r1-contact", tag: "verified", proof: P_ACADEMY_REF },
          },
          { text: "." },
        ],
        [
          { text: "Reference 2: " },
          {
            text: `${JOB_ACS.projectTitle}, contract ${ACS_CONTRACT}, ${longDate(JOB_ACS.periodStart)} to ${longDate(JOB_ACS.periodEnd)}, ${money(JOB_ACS.totalValue)}`,
            claim: { id: "cv-cl-r2-terms", tag: "verified", proof: P_ACS_TERMS },
          },
          { text: ". " },
          {
            text: "A Lean review of the ACS front desk and appointment flow, then Lean basics for 40 ACS staff",
            claim: { id: "cv-cl-r2-scope", tag: "verified", proof: P_ACS_SCOPE },
          },
          { text: ". No performance rating has been written yet. Contact: " },
          {
            text: `${REF_ACS.name}, ${REF_ACS.title}`,
            claim: { id: "cv-cl-r2-contact", tag: "verified", proof: P_ACS_COR },
          },
          { text: "." },
        ],
        [
          { text: "Reference 3: " },
          {
            text: `${JOB_HALYARD.projectTitle}, ${longDate(JOB_HALYARD.periodStart)} to ${longDate(JOB_HALYARD.periodEnd)}, ${money(JOB_HALYARD.totalValue)}`,
            claim: { id: "cv-cl-r3-terms", tag: "verified", proof: P_HALYARD_TERMS },
          },
          { text: ". " },
          {
            text: "Taught the Southeast virtual cohorts of the Army's family readiness staff training, as a subcontractor",
            claim: { id: "cv-cl-r3-scope", tag: "verified", proof: P_HALYARD_SCOPE },
          },
          { text: ". Contact: " },
          {
            text: `${REF_HALYARD.name}, ${REF_HALYARD.title}`,
            claim: { id: "cv-cl-r3-contact", tag: "verified", proof: P_HALYARD_REF },
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
      "Firm fixed price for each period: a 12-month base year and two 12-month option years, at the increase you choose.",
    contractTypeSource: S_CONTRACT,
    weeks: WEEKS,
    roles: [
      { id: "cv-role-pm", name: "Program Manager", ...PLAN.pm, pay: { askId: "cv-ask-pay", fieldId: "cv-fld-pay-pm" } },
      { id: "cv-role-lead", name: "Lead Facilitator", ...PLAN.lead, pay: { askId: "cv-ask-pay", fieldId: "cv-fld-pay-lead" } },
      { id: "cv-role-cohort", name: "Cohort facilitators", ...PLAN.cohort, pay: { askId: "cv-ask-pay", fieldId: "cv-fld-pay-cohort" } },
      { id: "cv-role-coach", name: "Coaches", ...PLAN.coach, pay: { askId: "cv-ask-pay", fieldId: "cv-fld-pay-coach" } },
      { id: "cv-role-analyst", name: "Analyst", ...PLAN.analyst, pay: { askId: "cv-ask-pay", fieldId: "cv-fld-pay-analyst" } },
    ],
    burden: [
      {
        id: "cv-b-fica",
        label: "Social Security and Medicare",
        from: { kind: "law", rate: 7.65, text: "The employer share set by federal law." },
      },
      {
        id: "cv-b-suta",
        label: "Unemployment tax",
        from: { kind: "ask", askId: "cv-ask-payroll", fieldId: "cv-fld-suta", text: "From your payroll report." },
      },
      {
        id: "cv-b-wc",
        label: "Workers' comp",
        from: { kind: "ask", askId: "cv-ask-payroll", fieldId: "cv-fld-wc", text: "From your payroll report." },
      },
      {
        id: "cv-b-benefits",
        label: "Health insurance and paid leave",
        from: { kind: "ask", askId: "cv-ask-payroll", fieldId: "cv-fld-benefits", text: "From your payroll report." },
      },
    ],
    lines: [
      {
        id: "cv-l-cohort",
        item: `Cohort classroom instruction, ${DAYS} days`,
        unit: "per cohort",
        qty: COHORTS,
        qtySource: S_CLIN_COHORT,
        laborShare: 0.5,
        direct: { askId: "cv-ask-direct", fieldId: "cv-fld-cohort-direct", label: "Materials and travel" },
      },
      {
        id: "cv-l-coach",
        item: `360 assessment, debrief and ${SESSIONS} coaching sessions`,
        unit: "per supervisor",
        qty: PEOPLE,
        qtySource: S_CLIN_COACH,
        laborShare: 0.42,
        direct: { askId: "cv-ask-direct", fieldId: "cv-fld-360", label: "360 license" },
      },
      {
        id: "cv-l-report",
        item: "Quarterly program report",
        unit: "per quarter",
        qty: 4,
        qtySource: S_CLIN_REPORT,
        laborShare: 0.08,
      },
    ],
    overhead: {
      askId: "cv-ask-pl",
      fieldId: "cv-fld-overhead",
      text: "From your 2025 profit and loss statement, as a share of direct cost.",
    },
    profit: { askId: "cv-ask-profit", fieldId: "cv-fld-profit" },
    contingency: { askId: "cv-ask-contingency", fieldId: "cv-fld-contingency" },
    otherCosts: [],
    periods: {
      count: OPTION_YEARS,
      label: "Option year",
      escalation: { askId: "cv-ask-profit", fieldId: "cv-fld-escalation" },
      source: S_PRICE,
    },
    payment: {
      text: "Paid monthly, within 30 days of a correct invoice, after the month ends. You carry about two months of costs before the first payment.",
      source: S_INVOICE,
    },
  },

  forms: [
    {
      id: "cv-fm-sf1449",
      name: "SF 1449, Solicitation/Contract/Order for Commercial Products and Commercial Services",
      source: S_SIGN,
      handling: ["ava-fills", "you-sign"],
      signer: "You, as the owner",
      filledFrom: "Your registration details and your price schedule",
    },
    {
      id: "cv-fm-cert",
      name: "Attachment 4, Limitations on Subcontracting Certificate",
      source: S_CERT_FORM,
      handling: ["ava-fills", "you-sign"],
      signer: "You, as the owner",
      filledFrom: "Your registration details, and who teaches each cohort",
    },
    {
      id: "cv-fm-reps",
      name: "Representations and certifications, confirmed current in your registration",
      source: S_REPS,
      handling: ["you-sign"],
      signer: "You, as the owner",
    },
    {
      id: "cv-fm-refs",
      name: "Attachment 3, one reference form for each of your three similar jobs",
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
    limits: "15 MB in total, one file per volume, in one email",
    files: [
      {
        id: "cv-pk-tech",
        name: `Volume_I_Technical_Approach_${SHORT_FILE}.pdf`,
        covers: "Volume I, section 3.2",
        contains: [{ kind: "section", id: "cv-s-tech" }],
      },
      {
        id: "cv-pk-pp",
        name: `Volume_II_Past_Performance_${SHORT_FILE}.pdf`,
        covers: "Volume II and Attachment 3",
        contains: [
          { kind: "section", id: "cv-s-pp" },
          { kind: "form", id: "cv-fm-refs" },
        ],
      },
      {
        id: "cv-pk-price",
        // VA's own Excel file, filled in: section 3.4 asks for its format.
        name: `Volume_III_Price_Schedule_${SHORT_FILE}.xlsx`,
        covers: "Volume III, Attachment 2",
        contains: [{ kind: "price", id: "price" }],
      },
      {
        id: "cv-pk-forms",
        name: `Signed_Forms_${SHORT_FILE}.pdf`,
        covers: "SF 1449, Attachment 4, section 3.6",
        contains: [
          { kind: "form", id: "cv-fm-sf1449" },
          { kind: "form", id: "cv-fm-cert" },
          { kind: "form", id: "cv-fm-reps" },
        ],
      },
    ],
    markings: [
      `Email subject line, word for word: "RFQ ${ID} – ${PERSONA.businessName}"`,
      "Each volume in its own file. The price schedule stays an Excel file, as section 3.4 asks.",
    ],
    checklist: [
      {
        id: "cv-ck-internal",
        label: `Internal deadline: ${D(DUE_DAYS - 1)}, 2:00 PM Eastern Time, one day early`,
        auto: true,
      },
      {
        id: "cv-ck-coach",
        label: `Email ${SPEC.name} the coach question before Q&A closes on ${DM(QUESTIONS_DAYS)}`,
      },
      { id: "cv-ck-hours", label: "Count the paid hours by person, W-2 and 1099, before you sign the certificate" },
      { id: "cv-ck-vetcert", label: "Start your SBA VetCert renewal: VA checks it again at award" },
      {
        id: "cv-ck-sam",
        label: "Check your federal registration is active and your answers are current",
      },
      { id: "cv-ck-sign", label: "Sign the SF 1449" },
      { id: "cv-ck-cert", label: "Sign the limitations on subcontracting certificate" },
      { id: "cv-ck-reps", label: "Read and sign the representations and certifications statement" },
      { id: "cv-ck-subject", label: "Copy the email subject line word for word" },
      { id: "cv-ck-email", label: `Email the 4 files to ${CO.name} before 2:00 PM Eastern Time` },
      { id: "cv-ck-receipt", label: "Save the sent email as your receipt and upload it here" },
    ],
    certifying: [
      "You are a certified service-disabled veteran-owned small business, and SBA's database says so.",
      "You are small under the size standard for management training.",
      "You will pay firms that are not veteran-owned no more than half of what VA pays you, and show VA the records if asked.",
      "Your registration answers are current and true on the day you sign.",
      "Your prices hold for 90 days after the due date, and stay fixed for each year of the contract.",
      "The three jobs in your references happened as described, with those values and dates.",
      "Every coach you name holds the credential you list.",
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
      text: `Run a leadership program for new VA supervisors: ${COHORTS} cohorts a year of up to ${SEATS}, with a 360 and coaching for each.`,
      source: S_SCOPE,
    },
    work: [
      { text: `${DAYS} classroom days for each cohort.`, source: S_CLASSROOM },
      { text: `A 360 and a debrief, then ${SESSIONS} coaching sessions, for every supervisor.`, source: S_360 },
      { text: "Coaches with an ICF PCC credential or equal.", source: S_COACH },
      { text: "A quarterly report tied to the All Employee Survey.", source: S_REPORT },
    ],
    place: {
      text: "The Fayetteville VA Medical Center and the Wilmington Health Care Center, North Carolina.",
      source: S_CLASSROOM,
    },
    hours: null,
    staffing: {
      text: "A named Program Manager and Lead Facilitator. VA must approve any change.",
      source: S_KEY,
    },
    serviceLevels: null,
    outOfScope: null,
    term: {
      text: "One fixed-price contract: a 12-month base year and two 12-month option years.",
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
      text: "Do not contact Medical Center staff about this quote. Questions go to the contract specialist only.",
      source: S_NO_CONTACT,
    },
    buyerPortal: {
      text: "SAM.gov: VA posts its answers to questions there, for every bidder.",
      source: S_QUESTIONS,
    },
    dates: [],
    expectedAward: null,
    start: null,
    validity: { text: "Quotes stay valid for 90 days after the closing date.", source: S_VALID },
    setAside: {
      text: "Only certified service-disabled veteran-owned small businesses, when you quote and at award.",
      source: S_SET_ASIDE,
    },
    size: {
      text: "Industry code 611430, management training. Your registration lists you as small.",
      source: S_SIZE,
    },
    lateRule: { text: "Quotes that arrive after the deadline are not considered.", source: S_DUE },
    subcontracting: {
      text: "Firms that are not veteran-owned can get at most half of what VA pays you.",
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

export const consultingAnswers: Record<string, AskAnswer> = {
  "cv-ask-pay": {
    status: "done",
    at: AT(4),
    values: {
      "cv-fld-pay-pm": 85,
      "cv-fld-pay-lead": 72,
      "cv-fld-pay-cohort": 62,
      "cv-fld-pay-coach": 60,
      "cv-fld-pay-analyst": 36,
    },
  },
  "cv-ask-payroll": {
    status: "done",
    at: AT(8),
    fileName: `${SHORT_FILE}_Payroll_Summary.pdf`,
    values: { "cv-fld-suta": 1.2, "cv-fld-wc": 0.3, "cv-fld-benefits": 11 },
  },
  "cv-ask-direct": { status: "done", at: AT(12), values: { "cv-fld-360": 150, "cv-fld-cohort-direct": 1800 } },
  "cv-ask-pl": {
    status: "done",
    at: AT(16),
    fileName: `${SHORT_FILE}_Profit_and_Loss_2025.pdf`,
    values: { "cv-fld-overhead": 45 },
  },
  "cv-ask-contingency": { status: "done", at: AT(20), values: { "cv-fld-contingency": 2 } },
  "cv-ask-profit": {
    status: "done",
    at: AT(24),
    values: { "cv-fld-profit": 8, "cv-fld-escalation": 3 },
  },
  "cv-ask-ref1": { status: "done", at: AT(28) },
  "cv-ask-ref2": { status: "done", at: AT(29) },
  "cv-ask-ref3": { status: "done", at: AT(30) },
  "cv-ask-refcontacts": {
    status: "done",
    at: AT(36),
    values: {
      "cv-fld-ref1-phone": REFERENCE_CONTACTS.lenaAbernathy.phone,
      "cv-fld-ref1-email": REFERENCE_CONTACTS.lenaAbernathy.email,
      "cv-fld-ref2-phone": REFERENCE_CONTACTS.keishaMonroe.phone,
      "cv-fld-ref2-email": REFERENCE_CONTACTS.keishaMonroe.email,
      "cv-fld-ref3-phone": REFERENCE_CONTACTS.renataOduya.phone,
      "cv-fld-ref3-email": REFERENCE_CONTACTS.renataOduya.email,
    },
  },
  // The three questions. Her answers when she gives them: she manages, her
  // senior consultant leads, one facilitator moves to payroll, and she asks VA
  // about the coaches.
  "cv-ask-leads": { status: "done", at: AT(50), choiceId: "lead-simone" },
  "cv-ask-teach": { status: "done", at: AT(51), choiceId: "teach-payroll" },
  "cv-ask-coach": { status: "done", at: AT(52), choiceId: "coach-qa" },
};

/** The three questions the story says wait on her, in Ava's order. */
export const HERO_OPEN = ["ask:cv-ask-leads", "ask:cv-ask-teach", "ask:cv-ask-coach"];

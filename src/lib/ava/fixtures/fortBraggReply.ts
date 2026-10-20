// Ava fixture · A reply to a sources sought: dining services at Fort Bragg
// (federal). The story's opportunity is W912EE-27-S-0004
// (src/demo/story/opportunities.ts), where Grant says: "Reply. It costs an
// hour and no money."
//
// A sources sought is not a bid. The buyer asks which companies could do the
// work before it writes the real solicitation. Nothing is awarded, nothing is
// scored and no price is allowed, so this bid has no price (`price: null`), no
// signature and no notary. The member sends two files in one email: Part A, a
// statement of at most 3 pages that Ava drafts from her record, and Part B, the
// Army's yes-or-no questionnaire, which Ava fills with her answers.
//
// THE STRUCTURE IS REAL, THE DETAIL IS INVENTED. The notice is modeled on a
// real Army sources sought for dining facilities in Germany and the Black Sea
// region. Its shape is kept: a notice body on SAM.gov with no separate
// solicitation file, "THIS IS NOT A SOLICITATION", Part A capability statement
// (max 3 pages: company name, CAGE, UEI, address, point of contact; similar
// experience; recruiting and keeping staff; running several sites at once),
// Part B industry questionnaire as a PDF form of yes-or-no questions, email to
// the contracting officer AND the contract specialist, a fixed subject line, a
// due time with a time zone, and no payment for replies. The quotations below
// are that notice's wording, with these changes:
//   · Place: the dining facilities at Fort Bragg, North Carolina.
//     "OCONUS environments (specifically Europe)" became "military
//     installations (specifically Army dining facilities)"; "in the target
//     regions" became "in the Fort Bragg area"; "subcontractor networks in
//     Europe" became "in North Carolina"; the scalability bullet compares two
//     dining facilities on the base, not two regions.
//   · Title and number: the story's title and notice number replace the real
//     ones, in the notice header and in the subject line.
//   · Buyer: the Mission and Installation Contracting Command (MICC), Fort
//     Bragg — the same buyer office as the Camp Mackall sample.
//   · Staff examples: "Lead Cooks with Gesellenbrief or equivalent,
//     English-proficient attendants" became "Lead Cooks with ServSafe or
//     equivalent food safety certification, dining facility attendants able to
//     obtain installation access".
//   · Contacts: the two invented people the opportunity page names for this
//     notice (src/demo/ava/contacts.ts): the contracting officer and the
//     contract specialist.
//   · Due time: 1500 Eastern Time (ET). The notice sets no deadline for
//     questions and no meeting.
//   · Part B: twelve questions became nine that make sense at one US base.
//     Questions 1, 3 to 5, 8 and 9 keep the real wording with the place
//     changed. Question 2 is the real "across the ENTIRE contemplated" question
//     written for Fort Bragg's dining facilities. Questions 6 and 7 are new,
//     written in the form's own pattern from the notice's Specialty Food
//     Operations and Remote Site & Field Feeding service types. The real
//     region-only questions (3, 4 and 6) and the exclusion question (12) are
//     left out.
//
// THE MEMBER IS THE SAME RECORD AS EVERY OTHER SAMPLE BID. Every fact about
// Haddad Catering comes from PERSONA, and every past job from PAST_PERFORMANCE
// (src/demo/story/persona.ts). Her contact, her phone and her email are on that
// record, so Ava does not ask for them. Anything the record does not hold is an
// Ask: how she hires and keeps staff, who would lead each site and who
// supplies the food, and every yes or no on Part B. She decides every yes or
// no. Ava proposes none. The Womack Army Medical Center job has no federal
// performance rating (CPARS) yet, so the draft names the job and gives no
// rating. The draft states no dollar figure. The reply names Carolina Dining
// Group only as the main contractor on her 2024 job.
//
// Questions: the reply stays a one-hour job, so Ava asks 11 questions. Two are
// Part A (staff, sites). Nine are the Army's own yes-or-no boxes, one tap each.
//
// Dates: the notice posted 4 days ago and stays open until day 30 at 3:00 PM
// Eastern Time (the story's opportunity). The helpers in when.ts give every
// date; no calendar date is typed in this file.

import { doc, profile, sam, yourDoc } from "../build";
import { buyerPeople } from "../../../demo/ava/contacts";
import { getOpportunity } from "../../../demo/story/opportunities";
import {
  KEY_PARTNER,
  PAST_PERFORMANCE, findPastPerformance,
  PERSONA,
  type PastPerformanceId,
} from "../../../demo/story/persona";
import type { BidState } from "../store";
import type { Ask, AvaBid, PlanRow, Proof, Source } from "../types";
import { D, ET_OFFSET, FORMED_ON, SAM_ACTIVE_UNTIL, US } from "./when";

// ─── The story's facts, read once ───

const NOTICE_ID = "W912EE-27-S-0004";
const STORY = getOpportunity(NOTICE_ID);
if (!STORY) throw new Error(`The story has no opportunity ${NOTICE_ID}`);
/** The Army's two contacts: the people the opportunity page names. */
const { primary: CO, second: CS } = buyerPeople(NOTICE_ID);

/** How many days ago the notice posted, and how many days the reply stays open. */
const POSTED_DAYS_AGO = STORY.postedDaysAgo;
const CLOSES_IN_DAYS = STORY.closesInDays;

const job = (id: PastPerformanceId) => findPastPerformance(id)!;
const FORT_BRAGG_JOB = job("pp-cdg-sub");
const SCHOOLS_JOB = job("pp-county-schools");
const CHURCH_JOB = job("pp-church");
const WOMACK_JOB = job("pp-womack");

/** The main contractor on her 2024 Fort Bragg job. */
const PRIME = KEY_PARTNER.name;

const MONTH_NAMES = [
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

/** A past day written out: "2024-01-08" becomes "8 January 2024". History is fixed. */
function pastDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

/** The sentences of a past job's scope text, in order. */
const sentences = (text: string): string[] => text.split(/(?<=\.)\s+/);

/** Her share of the Fort Bragg job, "30%", read from the job's own scope text. */
const SHARE = FORT_BRAGG_JOB.scopeDescription.match(/(\d+)% subcontractor/)![1] + "%";

/** Her short name in a file name: "Haddad_Catering". */
const FILE_STEM = PERSONA.businessShortName.replace(/\s+/g, "_");

/** The year a past job started. */
const yearOf = (iso: string): string => iso.slice(0, 4);
const FORT_BRAGG_YEAR = yearOf(FORT_BRAGG_JOB.periodStart);

/** The notice's name without its type: "Installation Dining Services Study, Fort Bragg". */
const SHORT_TITLE = STORY.title.replace(/^Sources Sought\s*[—-]\s*/, "");

/** The Army's subject line. Where the Army asks for a company name, a reply puts her legal name. */
const SUBJECT_STEM = `RFI Response - ${NOTICE_ID} - ${SHORT_TITLE} -`;
const SUBJECT_ASKED = `${SUBJECT_STEM} [Your Company Name]`;
const SUBJECT = `${SUBJECT_STEM} ${PERSONA.businessName}`;

// ─── The buyer's files ───

/** The notice body on SAM.gov. For a sources sought it is the whole request. */
const NOTICE = "fb-f-notice";
/** Part B, the Army's questionnaire form. */
const PART_B = "fb-f-partb";

// ─── The buyer's words, quoted once and reused ───

const S_TYPE = doc(
  NOTICE,
  "Notice header",
  "Header",
  `Title: ${STORY.title} Notice Type: ${STORY.noticeType}`,
);
const S_NAICS = doc(
  NOTICE,
  "Notice header",
  "Header",
  `NAICS Code: ${STORY.naics} – ${PERSONA.primaryNaicsLabel} Product Service Code (PSC): M1FD - Operation of Dining Facilities`,
);
const S_NOT_SOLICITATION = doc(
  NOTICE,
  "Section 1.0, Introduction and Purpose",
  "§1.0",
  "This is a Sources Sought Synopsis / Request for Information (RFI) issued by the Department of the Army Mission and Installation Contracting Command (MICC), Fort Bragg. THIS IS NOT A SOLICITATION. This RFI is issued solely for information and planning purposes – it does not constitute a Request for Proposal (RFP) or a promise to issue an RFP in the future.",
);
const S_PURPOSE = doc(
  NOTICE,
  "Section 1.0, Introduction and Purpose",
  "§1.0",
  "The Government is conducting market research to identify qualified and interested sources capable of providing a full spectrum of Dining Facility (DFAC) food services across the dining facilities at Fort Bragg, North Carolina. The Government is contemplating the award of a Multiple Award Task Order Contract (MATOC) / Indefinite Delivery Indefinite Quantity (IDIQ). This MATOC would utilize a modular Contract Line Item Number (CLIN) structure, allowing individual Task Orders to procure highly customized service packages ranging from full turnkey operations to specific staff augmentation.",
);
const S_FFS = doc(
  NOTICE,
  "Section 2.0, Planned Scope of Work",
  "§2.0",
  "Full Food Service (FFS): Turnkey operation including facility management, AFMIS requisitioning, meal preparation, headcount/cashier services, and full facility sanitation.",
);
const S_DFA = doc(
  NOTICE,
  "Section 2.0, Planned Scope of Work",
  "§2.0",
  "Dining Facility Attendant (DFA) / KP Support: Custodial and sanitation services only (e.g., serving line replenishment, table bussing, mechanical/manual dishwashing, latrine maintenance, deep cleaning).",
);
const S_COOKS = doc(
  NOTICE,
  "Section 2.0, Planned Scope of Work",
  "§2.0",
  "Augmented Food Service (Cooks): Providing qualified Lead Cooks and Cooks to supplement a Government-run kitchen.",
);
const S_SPECIALTY = doc(
  NOTICE,
  "Section 2.0, Planned Scope of Work",
  "§2.0",
  "Specialty Food Operations: Operation of non-standard feeding concepts (e.g., Barista Bars, Grab-N-Go sections).",
);
const S_FIELD = doc(
  NOTICE,
  "Section 2.0, Planned Scope of Work",
  "§2.0",
  "Remote Site & Field Feeding: Preparation/packaging of meals in insulated containers for remote sites and handling of MREs/UGRs.",
);
const S_EQUIP = doc(
  NOTICE,
  "Section 2.0, Specific Industry Feedback Requested: DFAC Equipment Maintenance",
  "§2.0",
  "The Government is specifically seeking industry feedback on the feasibility of including Preventative Maintenance and Repair of Government-Furnished food service equipment (GFE) within the scope of this MATOC. We are attempting to determine if bundling equipment repair with food service/DFA labor is appealing to industry or if it would restrict competition.",
);
const S_TWO_PARTS = doc(
  NOTICE,
  "Section 3.0, Requested Information",
  "§3.0",
  "Interested parties are requested to submit a response consisting of two parts: Part A: Capability Statement and Part B: Industry Questionnaire.",
);
const S_PART_A = doc(
  NOTICE,
  "Section 3.0, Part A",
  "§3.0 Part A",
  "Part A: Capability Statement (Max 3 pages) Please provide a brief Capability Statement that includes:",
);
const S_A_ID = doc(
  NOTICE,
  "Section 3.0, Part A, first item",
  "§3.0 Part A",
  "Company Name, CAGE Code, UEI, Address, and Point of Contact.",
);
const S_A_EXP = doc(
  NOTICE,
  "Section 3.0, Part A, second item",
  "§3.0 Part A",
  "A brief summary of your company’s experience performing similar food service operations at military installations (specifically Army dining facilities).",
);
const S_A_STAFF = doc(
  NOTICE,
  "Section 3.0, Part A, third item",
  "§3.0 Part A",
  "A brief description of your approach to recruiting and retaining qualified personnel (e.g., Lead Cooks with ServSafe or equivalent food safety certification, dining facility attendants able to obtain installation access) in the Fort Bragg area.",
);
const S_A_SCALE = doc(
  NOTICE,
  "Section 3.0, Part A, fourth item",
  "§3.0 Part A",
  "Operational Scalability: Please describe your company’s ability to concurrently manage multiple operations across different dining facilities on the installation (e.g., executing a Full Food Service task order at one dining facility while simultaneously mobilizing a DFA task order at another). Detail your existing logistics, local supply chain partnerships, and management structures that support this scalability.",
);
const S_DUE = doc(
  NOTICE,
  "Section 4.0, Submission Instructions",
  "§4.0",
  `This RFI/source sought notice will remain open until 1500 Eastern Time (ET) on ${US(CLOSES_IN_DAYS)}. All interested parties must submit their responses no later than that time via email to:`,
);
const S_SEND = doc(
  NOTICE,
  "Section 4.0, Submission Instructions",
  "§4.0",
  `all interested parties must submit their responses no later than 1500 Eastern Time (ET) on ${US(CLOSES_IN_DAYS)} via email to: Contracting Officer ${CO.email}, and Contract Specialist ${CS.email}`,
);
const S_SUBJECT = doc(
  NOTICE,
  "Section 4.0, Submission Instructions",
  "§4.0",
  `Please use the subject line: “${SUBJECT_ASKED}”.`,
);
const S_NO_PAY = doc(
  NOTICE,
  "Section 4.0, Submission Instructions",
  "§4.0",
  "The Government will not reimburse any costs associated with preparing and submitting a response to this RFI.",
);

// Part B, the Army's form: two pages, nine questions with yes and no boxes.
const S_B_HEAD = doc(
  PART_B,
  "Part B form, page 1, header",
  "Part B",
  "PART B: INDUSTRY QUESTIONNAIRE Company Name: CAGE Code: Point of Contact: Email: Please check the appropriate box and provide comments as necessary to assist the Government.",
);
const S_B_Q1 = doc(
  PART_B,
  "Part B form, page 1, question 1",
  "Part B, 1",
  "1. Is your company interested and capable of performing food services at Fort Bragg? [ ] YES [ ] NO",
);
const S_B_Q2 = doc(
  PART_B,
  "Part B form, page 1, question 2",
  "Part B, 2",
  "2. Is your company capable of, and interested in, performing work across the ENTIRE contemplated Fort Bragg footprint (all installation dining facilities)? [ ] YES [ ] NO",
);
const S_B_Q3 = doc(
  PART_B,
  "Part B form, page 1, question 3",
  "Part B, 3",
  "3. Is your company capable of performing turnkey “Full Food Service” (FFS) operations? [ ] YES [ ] NO",
);
const S_B_Q4 = doc(
  PART_B,
  "Part B form, page 1, question 4",
  "Part B, 4",
  "4. Is your company interested in bidding on Task Orders that are strictly for “Dining Facility Attendant” (DFA) / Custodial services (no cooking)? [ ] YES [ ] NO",
);
const S_B_Q5 = doc(
  PART_B,
  "Part B form, page 2, question 5",
  "Part B, 5",
  "5. Is your company interested in bidding on Task Orders that are strictly for “Augmented Cooks” (providing supplemental culinary labor to a military-run kitchen)? [ ] YES [ ] NO",
);
const S_B_Q6 = doc(
  PART_B,
  "Part B form, page 2, question 6",
  "Part B, 6",
  "6. Is your company interested in bidding on Task Orders that are strictly for “Specialty Food Operations” (e.g., Barista Bars, Grab-N-Go sections)? [ ] YES [ ] NO",
);
const S_B_Q7 = doc(
  PART_B,
  "Part B form, page 2, question 7",
  "Part B, 7",
  "7. Is your company interested in bidding on Task Orders for “Remote Site & Field Feeding” (meals packaged in insulated containers for remote sites)? [ ] YES [ ] NO",
);
const S_B_Q8 = doc(
  PART_B,
  "Part B form, page 2, question 8",
  "Part B, 8",
  "8. Does your company currently have the in-house capability or established subcontractor networks in North Carolina to perform preventative maintenance and repairs on commercial food service equipment? [ ] YES [ ] NO",
);
const S_B_Q9 = doc(
  PART_B,
  "Part B form, page 2, question 9",
  "Part B, 9",
  "9. If DFAC Equipment Maintenance and Repair is included as a mandatory line item in this MATOC, would your company bid on the MATOC? [ ] YES [ ] NO",
);

// ─── The member's own record ───

const PP2_AT = "Your jobs list: Fort Bragg dining facility support";
const PP1_AT = "Your jobs list: Cumberland County Schools summer meals";
const PP4_AT = "Your jobs list: Womack Army Medical Center patient meals";

const FORT_BRAGG_LINES = sentences(FORT_BRAGG_JOB.scopeDescription);
const SCHOOLS_LINES = sentences(SCHOOLS_JOB.scopeDescription);
const WOMACK_LINES = sentences(WOMACK_JOB.scopeDescription);

/** "8 January 2024 to 20 December 2024". */
const FORT_BRAGG_SPAN = `${pastDay(FORT_BRAGG_JOB.periodStart)} to ${pastDay(FORT_BRAGG_JOB.periodEnd)}`;

const P_NAME: Proof = sam("Legal business name", PERSONA.businessName);
const P_CAGE: Proof = sam("CAGE code", PERSONA.cage);
const P_UEI: Proof = sam("Unique entity ID", PERSONA.uei);
const P_ADDRESS: Proof = sam("Physical address", PERSONA.physicalAddress);
const P_ACTIVE: Proof = sam("Registration status", `Active until ${SAM_ACTIVE_UNTIL}`);
const P_WOMAN: Proof = profile(
  "Certifications · Business types",
  "Woman-Owned Small Business (WOSB)",
);
const P_NAICS: Proof = profile(
  "Main industry code",
  `${PERSONA.primaryNaics} ${PERSONA.primaryNaicsLabel}`,
);
const P_FORMED: Proof = yourDoc(
  "Your Articles of Organization",
  "Date of formation",
  PERSONA.formedOn,
);
const P_CONTACT: Proof = profile(
  "Your contact details",
  `${PERSONA.ownerName}, ${PERSONA.ownerTitle}. ${PERSONA.phone}. ${PERSONA.email}.`,
);
const P_STAFF_COUNT: Proof = profile(
  `Company size, entered ${D(-19)}`,
  `Employees on payroll: ${PERSONA.employeesW2}`,
);
const P_SERVSAFE: Proof = profile(
  `Food safety training, entered ${D(-19)}`,
  `${PERSONA.foodHandlerCertified} of ${PERSONA.employeesW2} employees hold a current food-handler (ServSafe) certificate`,
);
const P_KITCHEN: Proof = profile("Your kitchen and vans", (PERSONA.kitchen ?? ""));
const P_PP2_SCOPE: Proof = profile(PP2_AT, FORT_BRAGG_LINES[0]);
const P_PP2_LINE: Proof = profile(PP2_AT, FORT_BRAGG_LINES[1]);
const P_PP2_ROLE: Proof = profile(PP2_AT, `${FORT_BRAGG_JOB.customerName}. ${FORT_BRAGG_LINES[0]}`);
const P_PP2_WHEN: Proof = profile(PP2_AT, `${FORT_BRAGG_SPAN}.`);
const P_PP1_SCOPE: Proof = profile(PP1_AT, SCHOOLS_LINES[0]);
const P_PP1_ROLE: Proof = profile(
  PP1_AT,
  `Main contractor for ${SCHOOLS_JOB.customerName}, ${yearOf(SCHOOLS_JOB.periodStart)}.`,
);
const P_PP4_SCOPE: Proof = profile(PP4_AT, WOMACK_LINES[0]);
const P_PP4_ROLE: Proof = profile(
  PP4_AT,
  `Main contractor for ${WOMACK_JOB.customerName}, ${yearOf(WOMACK_JOB.periodStart)}.`,
);

// ─── Part B: one answer ask per question ───
//
// The form asks yes or no. She decides every answer; Ava proposes none. "I am
// not sure" is a real answer: Ava ticks neither box.

const PART_B_FEED = "Form · Part B";

function partB(n: number, source: Source, title: string, why: string, question: string): Ask {
  return {
    id: `fb-ask-q${n}`,
    kind: "answer",
    title,
    source,
    why,
    owner: "you",
    leadDays: 0,
    minutes: 1,
    answer: {
      type: "answer",
      question,
      choices: [
        { id: `fb-q${n}-yes`, label: "Yes", consequence: "Ava ticks Yes on Part B." },
        { id: `fb-q${n}-no`, label: "No", consequence: "Ava ticks No on Part B." },
        {
          id: `fb-q${n}-unsure`,
          label: "I am not sure",
          consequence: "Ava ticks neither box. Decide before you send the reply.",
        },
      ],
    },
    group: "decisions",
    feeds: [PART_B_FEED],
  };
}

function partBPlan(n: number, source: Source): PlanRow {
  return {
    id: `fb-p-q${n}`,
    source,
    kind: "form",
    needs: "action",
    ifMissed: "The box stays empty on Part B.",
    answeredIn: { kind: "form", id: "fb-fm-partb", label: `Part B, question ${n}` },
    askId: `fb-ask-q${n}`,
  };
}

// ─── The bid ───

export const fortBraggReplyBid: AvaBid = {
  noticeId: NOTICE_ID,
  officialTitle: STORY.title,
  buyer: STORY.agency,
  bidNumber: NOTICE_ID,
  kind: "reply",
  kindReason:
    "A reply by email, in two parts. Part A is up to 3 pages. Part B is a yes-or-no form. No price.",

  files: [
    {
      id: NOTICE,
      name: "The notice on SAM.gov",
      role: "main",
      pages: null,
      postedDaysFromNow: -POSTED_DAYS_AGO,
      readability: "read",
    },
    {
      id: PART_B,
      name: "Part B- Form.pdf",
      role: "form",
      pages: 2,
      postedDaysFromNow: -POSTED_DAYS_AGO,
      readability: "read",
    },
  ],

  deadline: {
    dueDaysFromNow: CLOSES_IN_DAYS,
    time: "3:00 PM",
    time24: "15:00",
    zone: "Eastern Time",
    utcOffset: ET_OFFSET(CLOSES_IN_DAYS),
    source: S_DUE,
  },

  award: {
    method: "none",
    source: S_NOT_SOLICITATION,
    criteria: [],
    note: "Nothing is awarded or scored. The Army uses the replies to plan a future contract.",
  },

  hardRequirements: [
    {
      id: "fb-r-email",
      group: "eligibility",
      label: "Your reply emailed to both Army contacts by the due time",
      source: S_SEND,
      initial: "meets",
      evidence: `Ava writes one email to both contacts. You send it from ${PERSONA.email}.`,
    },
    {
      id: "fb-r-subject",
      group: "writing",
      label: "The Army's subject line on your email, word for word",
      source: S_SUBJECT,
      initial: "meets",
      evidence: "Ava puts the Army's subject line on the email, with your legal name.",
    },
    {
      id: "fb-r-pages",
      group: "writing",
      label: "Part A no longer than 3 pages",
      source: S_PART_A,
      initial: "meets",
      evidence: "Ava builds Part A to the Army's limit of 3 pages. The check measures it.",
    },
  ],

  // A federal notice that asks for no bid: none of the state and local topics
  // apply, and nothing in it asks for bonds, insurance, wages or a signature.
  screen: [
    {
      topic: "vendor-registration",
      found: false,
      summary: "Federal notice. No state or local vendor registration asked for.",
    },
    {
      topic: "preferences",
      found: false,
      summary: "The notice names no set-aside and no preference for any group yet.",
    },
    { topic: "bonds", found: false, summary: "No bonds. This is not a bid." },
    { topic: "insurance", found: false, summary: "No insurance asked for in this notice." },
    { topic: "wages", found: false, summary: "No wage rules in this notice." },
    { topic: "tax", found: false, summary: "No tax rules in this notice." },
    {
      topic: "notary-signature",
      found: false,
      summary: "No signature and no notary. Part B has boxes to tick.",
    },
    { topic: "pre-bid-meeting", found: false, summary: "No meeting and no site visit." },
    {
      topic: "public-opening",
      found: false,
      summary: "Nothing is opened in public. A reply has no price.",
    },
    {
      topic: "references-licenses",
      found: false,
      summary: "No references and no licenses asked for in this notice.",
    },
    {
      topic: "participation-goals",
      found: false,
      summary: "No minority or disadvantaged business goals in this notice.",
    },
    {
      topic: "background-checks",
      found: false,
      summary: "No background checks asked for in this notice.",
    },
    {
      topic: "portal-rules",
      found: false,
      summary: "No portal. You send the reply by email.",
    },
  ],

  commitments: [],

  contractTerms: [
    {
      text: "Nothing is bought now. The Army is planning a future contract.",
      source: S_NOT_SOLICITATION,
    },
    {
      text: "Several companies may each win a contract. The Army then orders the work one job at a time.",
      source: S_PURPOSE,
    },
    {
      text: "One order can be a whole dining facility. Another can be only extra cooks.",
      source: S_PURPOSE,
    },
    {
      text: "The Army may add repair of its kitchen equipment to the work. Part B asks what you think.",
      source: S_EQUIP,
    },
    { text: "The Army does not pay for your reply.", source: S_NO_PAY },
  ],

  // Whether a Mentor review is advised, and why, is Grant's call. Ava shows
  // his read and adds none of its own.
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
      value: `${FORMED_ON}, in ${PERSONA.stateOfIncorporation}. In business for ${PERSONA.yearsInBusiness} years.`,
      from: "Your Articles of Organization",
    },
    {
      label: "Address",
      value: PERSONA.physicalAddress,
      from: "Your federal registration",
    },
    {
      label: "Woman-owned small business",
      value: `Certified. ${PERSONA.certifications.find((c) => c.includes("WOSB"))}.`,
      from: "Your GovPreneurs profile",
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
      value: `Small for industry code ${PERSONA.primaryNaics}`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Employees",
      value: `${PERSONA.employeesW2} on payroll, as you told GovPreneurs on ${D(-19)}`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Food safety training",
      value: `${PERSONA.foodHandlerCertified} of ${PERSONA.employeesW2} employees hold a food-handler (ServSafe) certificate`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Kitchen and vans",
      value: (PERSONA.kitchen ?? ""),
      from: "Your GovPreneurs profile",
    },
    {
      label: "Service area",
      value: `Up to ${PERSONA.serviceRadiusMiles} miles from ${PERSONA.hqCity}, in ${PERSONA.serviceStates.join(", ")}`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Capability statement",
      value: "On file",
      from: "Your GovPreneurs profile",
    },
    {
      label: "Contact",
      value: `${PERSONA.ownerName}, ${PERSONA.ownerTitle}. ${PERSONA.phone}. ${PERSONA.email}.`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Fort Bragg dining facility support",
      value: `Worked under ${PRIME}, ${yearOf(FORT_BRAGG_JOB.periodStart)}, at two dining facilities, ${SHARE} of the work`,
      from: "Your GovPreneurs profile, jobs list",
    },
    {
      label: "Cumberland County Schools summer meals",
      value: `Main contractor, ${yearOf(SCHOOLS_JOB.periodStart)}, 1,100 meals a day at 9 sites`,
      from: "Your GovPreneurs profile, jobs list",
    },
    {
      label: "Riverside Fellowship Church event catering",
      value: `${yearOf(CHURCH_JOB.periodStart)}, 11 events. Not used here: private events are not Army work.`,
      from: "Your GovPreneurs profile, jobs list",
    },
    {
      label: "Womack Army Medical Center patient meals",
      value: `Main contractor, ${yearOf(WOMACK_JOB.periodStart)}, therapeutic diet trays. Its federal performance rating is not written yet, so Part A gives no rating.`,
      from: "Your GovPreneurs profile, jobs list",
    },
  ],

  asks: [
    // ── Part A: what the record does not hold ──
    // The contact is not asked: her name, title, phone and email are on her
    // record (P_CONTACT). Her 2024 Fort Bragg job leads Part A without a
    // question: it is her only job in Army dining facilities, so Ava has no
    // choice to offer.
    {
      id: "fb-ask-staffing",
      kind: "enter",
      title: "How you hire and keep cooks and dining staff",
      source: S_A_STAFF,
      why: `Part A asks how you find good staff and keep them. Your record shows ${PERSONA.employeesW2} employees. It does not show how you hire. Say it in your own words.`,
      owner: "you",
      leadDays: 0,
      minutes: 10,
      answer: {
        type: "enter",
        fields: [
          {
            id: "fb-hire",
            label: "How you find and hire staff",
            unit: "text",
            hint: "Where you find cooks and attendants, and what you check before you hire.",
          },
          {
            id: "fb-keep",
            label: "How you keep staff",
            unit: "text",
            hint: "Pay, hours, training, or anything else that makes people stay.",
          },
        ],
      },
      group: "people",
      feeds: ["Draft · Part A, staff"],
    },
    {
      id: "fb-ask-sites",
      kind: "enter",
      title: "How you would run two dining facilities at once",
      source: S_A_SCALE,
      why: "Part A asks how you would run several dining facilities at once. Your kitchen and vans are on your record. Ava needs who leads each site and who supplies the food.",
      owner: "you",
      leadDays: 0,
      minutes: 10,
      answer: {
        type: "enter",
        fields: [
          {
            id: "fb-sites-lead",
            label: "Who would lead each site",
            unit: "text",
            hint: "Name who would run each kitchen, and who manages them.",
          },
          {
            id: "fb-sites-supply",
            label: "Your food suppliers",
            unit: "text",
            hint: "Name the kinds of companies you buy food from.",
          },
        ],
      },
      feeds: ["Draft · Part A, running several sites"],
    },

    // ── Part B: the Army's nine questions, in the form's order ──
    partB(
      1,
      S_B_Q1,
      "Question 1: food service work at Fort Bragg",
      `The Army asks if you want this work and can do it. Your ${FORT_BRAGG_YEAR} job at two Fort Bragg dining facilities shows that you can.`,
      "Do you want food service work at Fort Bragg, and can you do it?",
    ),
    partB(
      2,
      S_B_Q2,
      "Question 2: work in every dining facility at Fort Bragg",
      `The Army plans work across all its dining facilities on the base. It asks if you could cover all of them. In ${FORT_BRAGG_YEAR} you worked in two.`,
      "Could you work in every Fort Bragg dining facility, and do you want to?",
    ),
    partB(
      3,
      S_B_Q3,
      "Question 3: running a whole dining facility",
      `Full food service means you run the building, order food, cook, count diners and do all cleaning. In ${FORT_BRAGG_YEAR} you did ${SHARE} of the work at two dining facilities, as a subcontractor.`,
      "Can your company run a whole dining facility, from ordering food to cleaning?",
    ),
    partB(
      4,
      S_B_Q4,
      "Question 4: cleaning-only work, with no cooking",
      "Dining facility attendants clean, wash dishes and keep the serving line full. They do not cook.",
      "Would you bid on jobs that are only cleaning and dishwashing, with no cooking?",
    ),
    partB(
      5,
      S_B_Q5,
      "Question 5: your cooks in an Army kitchen",
      `The Army runs the kitchen. You send lead cooks and cooks to work in it. ${PERSONA.foodHandlerCertified} of your ${PERSONA.employeesW2} employees hold food-handler certificates.`,
      "Would you bid on jobs where you only send cooks to an Army kitchen?",
    ),
    partB(
      6,
      S_B_Q6,
      "Question 6: coffee bars and grab-and-go food",
      "These are small food counters inside a dining facility, such as a coffee bar.",
      "Would you bid on jobs that are only a coffee bar or grab-and-go food?",
    ),
    partB(
      7,
      S_B_Q7,
      "Question 7: meals packed for remote sites",
      "Meals are packed in insulated containers for remote sites. The work includes handling field rations. Your record lists refrigerated delivery vans.",
      "Would you bid on jobs to pack meals for remote sites?",
    ),
    partB(
      8,
      S_B_Q8,
      "Question 8: repairing kitchen equipment",
      "The Army asks if you can service and repair commercial kitchen equipment. Your own staff or a repair company that you use both count. Your record lists no repair work.",
      "Can you service and repair kitchen equipment, with your staff or a repair company?",
    ),
    partB(
      9,
      S_B_Q9,
      "Question 9: bidding if equipment repair is part of the work",
      "The Army may make equipment repair a required part of the contract. It wants to know if that would stop you from bidding.",
      "If equipment repair is a required part of the work, would you still bid?",
    ),
  ],

  clarifications: [],

  plan: [
    {
      id: "fb-p-company",
      source: S_A_ID,
      kind: "instruction",
      needs: "writing",
      ifMissed: "The Army cannot tell who you are or how to reach you.",
      answeredIn: { kind: "section", id: "fb-sec-part-a", label: "Part A: our company" },
    },
    {
      id: "fb-p-experience",
      source: S_A_EXP,
      kind: "instruction",
      needs: "writing",
      ifMissed: "The Army does not see your work at Fort Bragg.",
      answeredIn: { kind: "section", id: "fb-sec-part-a", label: "Part A: similar work" },
    },
    {
      id: "fb-p-staff",
      source: S_A_STAFF,
      kind: "instruction",
      needs: "writing",
      ifMissed: "The Army cannot see how you would staff the work.",
      answeredIn: { kind: "section", id: "fb-sec-part-a", label: "Part A: staff" },
      askId: "fb-ask-staffing",
    },
    {
      id: "fb-p-sites",
      source: S_A_SCALE,
      kind: "instruction",
      needs: "writing",
      ifMissed: "The Army cannot see if you could run more than one site.",
      answeredIn: {
        kind: "section",
        id: "fb-sec-part-a",
        label: "Part A: running several sites",
      },
      askId: "fb-ask-sites",
    },
    {
      id: "fb-p-two-parts",
      source: S_TWO_PARTS,
      kind: "logistics",
      needs: "attachment",
      ifMissed: "The Army asked for both parts. One part alone is not a full reply.",
      answeredIn: { kind: "checklist", id: "fb-ck-files", label: "Checklist: attach both parts" },
    },
    {
      id: "fb-p-pages",
      source: S_PART_A,
      kind: "instruction",
      needs: "writing",
      ifMissed: "Part A goes past the Army's limit of 3 pages.",
      answeredIn: { kind: "section", id: "fb-sec-part-a", label: "Part A, 3 pages at most" },
    },
    partBPlan(1, S_B_Q1),
    partBPlan(2, S_B_Q2),
    partBPlan(3, S_B_Q3),
    partBPlan(4, S_B_Q4),
    partBPlan(5, S_B_Q5),
    partBPlan(6, S_B_Q6),
    partBPlan(7, S_B_Q7),
    partBPlan(8, S_B_Q8),
    partBPlan(9, S_B_Q9),
    {
      id: "fb-p-email",
      source: S_SEND,
      kind: "logistics",
      needs: "action",
      ifMissed: "The notice names both contacts. One of them may not see your reply.",
      answeredIn: { kind: "checklist", id: "fb-ck-email", label: "Checklist: email the reply" },
    },
    {
      id: "fb-p-subject",
      source: S_SUBJECT,
      kind: "logistics",
      needs: "action",
      ifMissed: "The Army may not find your reply among the others.",
      answeredIn: {
        kind: "checklist",
        id: "fb-ck-subject",
        label: "Checklist: the Army's subject line",
      },
    },
    {
      id: "fb-p-due",
      source: S_DUE,
      kind: "logistics",
      needs: "action",
      ifMissed: `The notice closes at 3:00 PM Eastern Time on ${D(CLOSES_IN_DAYS)}.`,
      answeredIn: {
        kind: "checklist",
        id: "fb-ck-internal",
        label: "Checklist: internal deadline",
      },
    },
  ],

  // Nothing is scored, so there are no win themes.
  themes: [],

  // Part A is ONE section: the Army gives one limit, "Max 3 pages", for the
  // whole capability statement. Its four parts follow the Army's order, each
  // opening with a short plain lead-in, because a section has no headings.
  sections: [
    {
      id: "fb-sec-part-a",
      title: "Part A: your company and what it can do",
      answers: S_PART_A,
      points: null,
      pageLimit: 3,
      pages: 2,
      paragraphs: [
        // 0 to 3 · Our company (Part A, first item).
        [
          { text: "Our company. Company name: " },
          {
            text: PERSONA.businessName,
            claim: { id: "fb-cl-name", tag: "verified", proof: P_NAME },
          },
          { text: ". CAGE code: " },
          { text: PERSONA.cage, claim: { id: "fb-cl-cage", tag: "verified", proof: P_CAGE } },
          { text: ". Unique entity ID: " },
          { text: PERSONA.uei, claim: { id: "fb-cl-uei", tag: "verified", proof: P_UEI } },
          { text: ". Address: " },
          {
            text: PERSONA.physicalAddress,
            claim: { id: "fb-cl-address", tag: "verified", proof: P_ADDRESS },
          },
          { text: "." },
        ],
        [
          { text: "We are a " },
          {
            text: "woman-owned small business",
            claim: { id: "fb-cl-woman", tag: "verified", proof: P_WOMAN },
          },
          { text: ". " },
          {
            text: `Our main industry code is ${PERSONA.primaryNaics}, ${PERSONA.primaryNaicsLabel.toLowerCase()}`,
            claim: { id: "fb-cl-naics", tag: "verified", proof: P_NAICS },
          },
          { text: ". " },
          {
            text: `Our federal registration is active until ${SAM_ACTIVE_UNTIL}`,
            claim: { id: "fb-cl-active", tag: "verified", proof: P_ACTIVE },
          },
          { text: "." },
        ],
        [
          { text: "In business. " },
          {
            text: `We formed on ${FORMED_ON}`,
            claim: { id: "fb-cl-formed", tag: "verified", proof: P_FORMED },
          },
          { text: ". " },
          {
            text: `We have been in business for ${PERSONA.yearsInBusiness} years`,
            claim: { id: "fb-cl-years", tag: "verified", proof: P_FORMED },
          },
          { text: "." },
        ],
        [
          { text: "Point of contact: " },
          {
            text: `${PERSONA.ownerName}, ${PERSONA.ownerTitle.toLowerCase()}, ${PERSONA.phone}, ${PERSONA.email}`,
            claim: { id: "fb-cl-contact", tag: "verified", proof: P_CONTACT },
          },
          { text: "." },
        ],
        // 4 to 6 · Similar work (Part A, second item).
        [
          { text: `Similar work. In ${yearOf(FORT_BRAGG_JOB.periodStart)}, ` },
          {
            text: "we served weekend and holiday meals at two Fort Bragg dining facilities",
            claim: { id: "fb-cl-bragg", tag: "verified", proof: P_PP2_SCOPE },
          },
          { text: ". " },
          {
            text: `We worked under ${PRIME}, the main contractor, and did ${SHARE} of the work`,
            claim: { id: "fb-cl-share", tag: "verified", proof: P_PP2_ROLE },
          },
          { text: ". The job ran from " },
          {
            text: FORT_BRAGG_SPAN,
            claim: { id: "fb-cl-dates", tag: "verified", proof: P_PP2_WHEN },
          },
          { text: "." },
        ],
        [
          { text: "We staffed " },
          {
            text: "a short-order line, a salad bar and the dish room",
            claim: { id: "fb-cl-line", tag: "verified", proof: P_PP2_LINE },
          },
          { text: ". " },
          {
            text: "We kept full HACCP food safety records under the main contractor's quality plan",
            claim: { id: "fb-cl-haccp", tag: "verified", proof: P_PP2_LINE },
          },
          { text: "." },
        ],
        // The Womack job has no federal performance rating yet. The draft names
        // the job and gives no rating.
        [
          { text: `Patient meals. In ${yearOf(WOMACK_JOB.periodStart)}, ` },
          {
            text: "we were the main contractor for patient meals at Womack Army Medical Center",
            claim: { id: "fb-cl-womack", tag: "verified", proof: P_PP4_ROLE },
          },
          { text: ". " },
          {
            text: "We made therapeutic diet trays for the inpatient wards",
            claim: { id: "fb-cl-womack-scope", tag: "verified", proof: P_PP4_SCOPE },
          },
          { text: "." },
        ],
        // 7 to 9 · Staff (Part A, third item).
        [
          { text: "Staff. We have " },
          {
            text: `${PERSONA.employeesW2} employees today`,
            claim: { id: "fb-cl-staff-count", tag: "verified", proof: P_STAFF_COUNT },
          },
          { text: ". " },
          {
            text: `${PERSONA.foodHandlerCertified} of them hold food-handler (ServSafe) certificates`,
            claim: { id: "fb-cl-servsafe", tag: "verified", proof: P_SERVSAFE },
          },
          { text: "." },
        ],
        [
          { text: "How we hire: " },
          {
            text: "where we find cooks and attendants, and what we check first",
            claim: {
              id: "fb-cl-hire",
              tag: "unsupported",
              askId: "fb-ask-staffing",
              gap: "[NEEDED: how you find and hire cooks and attendants]",
              resolvedText: "where we find cooks and attendants, and what we check first",
              resolvedTemplate: "{fb-hire}",
            },
          },
          { text: "." },
        ],
        [
          { text: "How we keep staff: " },
          {
            text: "what makes our cooks and attendants stay",
            claim: {
              id: "fb-cl-keep",
              tag: "unsupported",
              askId: "fb-ask-staffing",
              gap: "[NEEDED: how you keep your staff]",
              resolvedText: "what makes our cooks and attendants stay",
              resolvedTemplate: "{fb-keep}",
            },
          },
          { text: "." },
        ],
        // 10 to 13 · Running several sites (Part A, fourth item). Both past
        // jobs are the company's own: it formed before either one began.
        [
          {
            text: `Running several sites. Our ${yearOf(FORT_BRAGG_JOB.periodStart)} Fort Bragg job covered `,
          },
          {
            text: "two dining facilities on one contract",
            claim: { id: "fb-cl-two-sites", tag: "verified", proof: P_PP2_SCOPE },
          },
          { text: `. In ${yearOf(SCHOOLS_JOB.periodStart)}, ` },
          {
            text: "we were the main contractor for Cumberland County Schools",
            claim: { id: "fb-cl-schools", tag: "verified", proof: P_PP1_ROLE },
          },
          { text: ". We " },
          {
            text: "cooked and delivered 1,100 breakfasts and lunches a day to nine summer meal sites",
            claim: { id: "fb-cl-nine-sites", tag: "verified", proof: P_PP1_SCOPE },
          },
          { text: "." },
        ],
        [
          { text: "Delivery: " },
          {
            text: `we cook in our own commercial kitchen in ${PERSONA.hqCity} and deliver with our own refrigerated vans`,
            claim: { id: "fb-cl-delivery", tag: "verified", proof: P_KITCHEN },
          },
          { text: "." },
        ],
        [
          { text: "Food suppliers: " },
          {
            text: "the companies we buy from",
            claim: {
              id: "fb-cl-sites-supply",
              tag: "unsupported",
              askId: "fb-ask-sites",
              gap: "[NEEDED: your food suppliers]",
              resolvedText: "the companies we buy from",
              resolvedTemplate: "{fb-sites-supply}",
            },
          },
          { text: "." },
        ],
        [
          { text: "Who leads each site: " },
          {
            text: "the person who runs each kitchen, and who manages them",
            claim: {
              id: "fb-cl-sites-lead",
              tag: "unsupported",
              askId: "fb-ask-sites",
              gap: "[NEEDED: who would lead each dining facility]",
              resolvedText: "the person who runs each kitchen, and who manages them",
              resolvedTemplate: "{fb-sites-lead}",
            },
          },
          { text: "." },
        ],
      ],
      // Ava makes no choice in the writing that is the member's to make: each
      // fact comes from her record, so the reply asks no extra question.
      decisions: [],
      challenges: [],
    },
  ],

  // A sources sought allows no price.
  price: null,

  forms: [
    {
      id: "fb-fm-partb",
      name: "Part B, industry questionnaire: 9 yes-or-no questions",
      source: S_B_HEAD,
      handling: ["ava-fills"],
      filledFrom: "Your registration, your contact details, and your 9 answers",
    },
  ],

  submission: {
    method: "email",
    where: `By email to ${CO.name}, the contracting officer, and ${CS.name}, the contract specialist`,
    account: `${CO.email} and ${CS.email}`,
    source: S_SEND,
    limits: "Part A is 3 pages at most. Part B is the Army's own form. Both go in one email.",
    files: [
      {
        id: "fb-pk-a",
        name: `Part_A_Capability_Statement_${FILE_STEM}.pdf`,
        covers: "Section 3.0, Part A",
        contains: [{ kind: "section", id: "fb-sec-part-a" }],
      },
      {
        id: "fb-pk-b",
        name: `Part_B_Industry_Questionnaire_${FILE_STEM}.pdf`,
        covers: "Section 3.0, Part B, the Army's form",
        contains: [{ kind: "form", id: "fb-fm-partb" }],
      },
    ],
    markings: [
      `Email subject line, word for word: "${SUBJECT}"`,
      "One email to both Army contacts, as section 4.0 asks.",
    ],
    checklist: [
      {
        id: "fb-ck-internal",
        label: `Internal deadline: ${D(CLOSES_IN_DAYS - 1)}, 3:00 PM Eastern Time, one day early`,
        auto: true,
      },
      { id: "fb-ck-files", label: "Attach Part A, 3 pages at most, and Part B as two PDF files" },
      { id: "fb-ck-subject", label: "Copy the Army's subject line word for word" },
      {
        id: "fb-ck-email",
        label: `Send one email to ${CO.name} and ${CS.name} before 3:00 PM Eastern Time`,
      },
      { id: "fb-ck-receipt", label: "Save the sent email as your receipt and upload it here" },
    ],
    certifying: [
      "Every fact about your company in Part A is true today.",
      "Each yes or no on Part B is your own answer.",
      "You know this is not a bid, and the Army pays nothing for it.",
    ],
  },

  reviewerFindings: [],
  addenda: [],

  // Page 1 facts that no other part of the bid carries. A null is a fact the
  // notice does not state: page 1 shows "Not stated".
  overview: {
    noticeType: {
      text: "Sources sought: the Army asks which companies could do this work. It is not a bid.",
      source: S_TYPE,
    },
    summary: {
      text: "Food service in the dining facilities at Fort Bragg, from whole kitchens to cleaning only.",
      source: S_PURPOSE,
    },
    work: [
      {
        text: "Full food service: run a whole dining facility, from ordering food to cleaning.",
        source: S_FFS,
      },
      {
        text: "Dining facility attendants: cleaning, dishwashing and a full serving line. No cooking.",
        source: S_DFA,
      },
      { text: "Extra cooks: lead cooks and cooks in an Army-run kitchen.", source: S_COOKS },
      { text: "Specialty food: coffee bars and grab-and-go counters.", source: S_SPECIALTY },
      {
        text: "Field feeding: meals packed in insulated containers for remote sites, and field rations.",
        source: S_FIELD,
      },
      {
        text: "The Army asks if it should add repair of its kitchen equipment to the work.",
        source: S_EQUIP,
      },
    ],
    place: { text: "The dining facilities at Fort Bragg, North Carolina.", source: S_PURPOSE },
    hours: null,
    staffing: {
      text: "Lead cooks, cooks and dining facility attendants. Part A asks how you hire and keep them.",
      source: S_A_STAFF,
    },
    serviceLevels: null,
    outOfScope: null,
    term: null,
    estimatedValue: null,
    penalties: null,
    contact: {
      name: CO.name,
      role: `Contracting officer, ${STORY.office}`,
      email: CO.email,
      source: S_SEND,
    },
    questionsChannel: null,
    noContact: null,
    buyerPortal: null,
    dates: [],
    expectedAward: {
      text: "No award comes from this notice. The Army may ask for bids later, or may not.",
      source: S_NOT_SOLICITATION,
    },
    start: null,
    validity: null,
    // The notice names no set-aside yet, as Grant and Hunter read it.
    setAside: null,
    size: {
      text: `Industry code ${STORY.naics}: ${PERSONA.primaryNaicsLabel.toLowerCase()}.`,
      source: S_NAICS,
    },
    lateRule: null,
  },

  samLegalName: PERSONA.businessName,
  nameInDraft: PERSONA.businessName,
};

/** Starts fresh: the member has not pressed Start on this reply. */
export const fortBraggReplySeed: Partial<BidState> = {};

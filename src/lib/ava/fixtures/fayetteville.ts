// Fayetteville — the flagship sample bid.
//
// A points-scored city Request for Proposals: a staff cafe at the Public Works
// campus, plus about 20 city events a year. It is a "written proposal": scored
// writing worth 70 of 100 points (approach 40, experience 30), a price scored
// by formula (30), and a stack of forms.
//
// It exercises every part of Ava at once: a mandatory site visit that is
// already past, a floor plan behind the city's portal login, a page limit
// stated two ways, a staffing plan shared by the writing and the price, an
// addendum posted before Ava started (it moved the due date and added a
// question on staffing), and a second addendum that arrives mid-build.
//
// The story is in src/demo/story (opportunity FAYNC-2026-R-08, Grant's brief,
// the Sarah Mitchell thread). The city, its staff and its files are invented.
// Every fact about the member comes from the story's persona or is an Ask.
// Values inside upload `extracts` and claim `resolvedText` are what the
// prototype shows AFTER the member supplies the document or answer.

import { getGrantBrief } from "../../../demo/story/grantBriefs";
import { getOpportunity } from "../../../demo/story/opportunities";
import {
  KEY_PARTNER,
  PAST_PERFORMANCE,
  PERSONA,
  type PastPerformanceId,
} from "../../../demo/story/persona";
import { doc, profile, sam } from "../build";
import { dayFromNow } from "../dates";
import type { AvaBid, Proof } from "../types";
import { D, DM, ET_OFFSET, FORMED_ON, USWD } from "./when";

// ─── Facts of the member, from the story ─────────────────────────────────────

const job = (id: PastPerformanceId) => PAST_PERFORMANCE.find((p) => p.id === id)!;
const COUNTY = job("pp-county-schools");
const BRAGG = job("pp-cdg-sub");
const CHURCH = job("pp-church");
const WOMACK = job("pp-womack");

const LONG_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
/** "1 June 2023", from a stored `YYYY-MM-DD` of a past job. */
const when = (iso: string) => LONG_DATE.format(new Date(`${iso}T12:00:00Z`));
/** "2023": the year a past job started. */
const year = (p: { periodStart: string }) => p.periodStart.slice(0, 4);
/** "$198,000". */
const money = (n: number) => `$${n.toLocaleString("en-US")}`;
/** "Janet Reyes, Child Nutrition Director, Cumberland County Schools". */
const ref = (p: { referenceName?: string; referenceTitle?: string }) =>
  `${p.referenceName}, ${p.referenceTitle}`;
/** "HaddadCatering", for the names of the files she uploads. */
const FILE_NAME = PERSONA.businessShortName.replace(/\s+/g, "");

// ─── The days of this bid ────────────────────────────────────────────────────
// The story fixes three of them: when the main files went up, when the
// questions close and when the bids are due (9 days ago, in 5 days, in 14 days).
// The rest are ours. A city does not hold a site visit or post an addendum on a
// weekend, so each of our days moves to the nearest weekday.

const STORY_ID = "FAYNC-2026-R-08";
const STORY = getOpportunity(STORY_ID)!;
const QUESTIONS_DUE = getGrantBrief(STORY_ID)?.keyDates.find((k) => /^questions/i.test(k.label));
if (!QUESTIONS_DUE) throw new Error(`${STORY_ID}: Grant's brief lists no day for the questions.`);

const DAYS = {
  posted: -STORY.postedDaysAgo,
  questionsDue: QUESTIONS_DUE.inDays,
  due: STORY.closesInDays,
} as const;

/** The weekday nearest to day `n`. On a tie it takes the one on the `prefer` side. */
function weekday(n: number, prefer: 1 | -1): number {
  const isWeekday = (d: number) => ![0, 6].includes(dayFromNow(d).getUTCDay());
  for (const step of [0, 1, 2]) {
    for (const d of [n + prefer * step, n - prefer * step]) if (isWeekday(d)) return d;
  }
  return n;
}

/** The site visit: past, a few days ago. Her company attended. */
const VISIT = weekday(-4, -1);
/** Questions and Answers set 1, and Addendum 1. Both came after the visit. */
const QA_POSTED = weekday(-3, 1);
const A1_POSTED = weekday(-2, 1);
/** The due date before Addendum 1 moved it to day 14. */
const OLD_DUE = weekday(9, -1);
/** Addendum 2 arrives while Ava builds, and moves the due date again. */
const A2_POSTED = weekday(2, 1);
const A2_DUE = weekday(19, 1);

/** What each rule that Grant also checks says once she has given her proof. */
const PROOF_SAYS = {
  siteVisit: `Your company signed the city's attendance sheet on ${D(VISIT)}.`,
  vendor: "Your city vendor number, as you entered it",
  insurance: "Your certificate of insurance, naming the city",
} as const;

// ─── The city's price sheet (Exhibit B) ──────────────────────────────────────

const QTY = {
  lunch: 10_000,
  guest: 1_600,
  event: 20,
  /** Addendum 2 raises the guests. */
  guestAfterA2: 2_200,
} as const;
const num = (n: number) => n.toLocaleString("en-US");

// ─── The buyer's words, one place each ───────────────────────────────────────

const S = {
  // The Request for Proposals FAYNC-2026-R-08, the main document (24 pages)
  late: doc("f-rfp", "Section 1.2, page 1", "§1.2", "Late proposals will not be accepted."),
  siteVisit: doc(
    "f-rfp",
    "Section 1.3, page 2",
    "§1.3",
    `A mandatory pre-proposal site visit will be held on ${USWD(VISIT)} at 10:00 AM at the Public Works Commission campus cafe. Any authorized representative of the Offeror may attend. Each firm shall sign the attendance sheet under its legal name. Offerors not in attendance will be deemed non-responsive.`,
  ),
  portal: doc(
    "f-rfp",
    "Section 1.4, page 2",
    "§1.4",
    "Offerors must be registered in the City's vendor portal to download Exhibit D and to submit a proposal. Registration is free.",
  ),
  exhibitD: doc(
    "f-rfp",
    "Section 1.4, page 2",
    "§1.4",
    "Exhibit D (Cafe Kitchen Floor Plan) is available only to registered vendors through the City's vendor portal.",
  ),
  questions: doc(
    "f-rfp",
    "Section 1.5, page 2",
    "§1.5",
    `Questions shall be submitted by email only to Patricia Boyd, Procurement Officer, at patricia.boyd@fayettevillenc.gov, no later than 5:00 PM Eastern Time on ${USWD(DAYS.questionsDue)}.`,
  ),
  addenda: doc(
    "f-rfp",
    "Section 1.6, page 3",
    "§1.6",
    "Offerors shall acknowledge each addendum on the form provided. Failure to acknowledge an addendum may result in rejection of the proposal.",
  ),
  open: doc(
    "f-rfp",
    "Section 2.1, page 4",
    "§2.1",
    "This procurement is open to all qualified Offerors. No set-aside or local preference applies.",
  ),
  term: doc(
    "f-rfp",
    "Section 3.1, page 5",
    "§3.1",
    "The initial term is twelve (12) months from the Notice to Proceed. The City may renew the contract for two (2) additional one-year periods.",
  ),
  pricing: doc(
    "f-rfp",
    "Section 3.2, page 5",
    "§3.2",
    "Unit prices shall remain firm for the initial twelve (12) month term. At each renewal, unit prices may increase by no more than three percent (3%).",
  ),
  quantities: doc(
    "f-rfp",
    "Section 3.3, page 6",
    "§3.3",
    "Quantities shown on Exhibit B are estimates for evaluation purposes only. The City does not guarantee any minimum quantity.",
  ),
  termination: doc(
    "f-rfp",
    "Section 3.4, page 6",
    "§3.4",
    "The City may terminate this contract for convenience upon thirty (30) days' written notice to the Contractor.",
  ),
  submit: doc(
    "f-rfp",
    "Section 4.1, page 8",
    "§4.1",
    "Proposals shall be submitted electronically through the City's vendor portal. Proposals submitted by email, fax or paper will not be accepted.",
  ),
  fileFormat: doc(
    "f-rfp",
    "Section 4.2, page 8",
    "§4.2",
    "Each file shall not exceed 25 MB. Files shall be in PDF format, except Exhibit B, which shall be submitted in its original Excel format.",
  ),
  fileNames: doc(
    "f-rfp",
    "Section 4.3, page 8",
    "§4.3",
    "Name each file with its number, its content and the Offeror's name, for example: 1_Proposal_CompanyName.pdf.",
  ),
  validity: doc(
    "f-rfp",
    "Section 4.4, page 9",
    "§4.4",
    "Proposals shall remain valid for ninety (90) days after the proposal due date.",
  ),
  pageLimit: doc(
    "f-rfp",
    "Section 5.2, page 11",
    "§5.2",
    "Tab 3, the Technical Proposal (Operations and Staffing Plan), shall not exceed ten (10) pages, excluding resumes and appendices.",
  ),
  tab1: doc(
    "f-rfp",
    "Section 5.3, Tab 1, page 11",
    "§5.3 Tab 1",
    "Tab 1, Cover Letter: signed by an official authorized to bind the Offeror, stating the Offeror's legal name, address, federal tax identification number and primary contact.",
  ),
  tab2: doc(
    "f-rfp",
    "Section 5.3, Tab 2, page 11",
    "§5.3 Tab 2",
    "Tab 2, Experience and References: describe the Offeror's experience providing food service and catering of similar size and scope within the last ten (10) years.",
  ),
  tab3: doc(
    "f-rfp",
    "Section 5.3, Tab 3, page 12",
    "§5.3 Tab 3",
    "Tab 3, Operations and Staffing Plan: describe staffing levels and hours, supervision, daily cafe operations, event service, and how the Offeror will handle short-notice requests and service failures.",
  ),
  tab4: doc(
    "f-rfp",
    "Section 5.3, Tab 4, page 12",
    "§5.3 Tab 4",
    "Tab 4, Menu and Food Safety: describe the Offeror's menu approach, special diets, food safety program, temperature control, allergen handling and health inspection history.",
  ),
  forms: doc(
    "f-rfp",
    "Section 5.4, page 12",
    "§5.4",
    "Include with the proposal: Forms 1 through 5, a completed and signed IRS Form W-9, and a signed acknowledgment for each addendum issued. Forms 2 and 3 shall be notarized.",
  ),
  award: doc(
    "f-rfp",
    "Section 6.1, page 13",
    "§6.1",
    "The contract will be awarded to the responsive, responsible Offeror whose proposal receives the highest total points.",
  ),
  criteria: doc(
    "f-rfp",
    "Section 6.1, page 13",
    "§6.1",
    "Evaluation criteria: Approach (Tab 3 and Tab 4), 40 points; Experience and References (Tab 2), 30 points; Price, 30 points.",
  ),
  priceFormula: doc(
    "f-rfp",
    "Section 6.2, page 13",
    "§6.2",
    "Price points = (lowest total evaluated price ÷ Offeror's total evaluated price) × 30. Total evaluated price is the sum of each Exhibit B quantity times the unit price.",
  ),
  section7: doc(
    "f-rfp",
    "Section 7.1, page 15",
    "§7.1",
    "The Offeror shall be duly organized and authorized to transact business in North Carolina. Failure to meet any requirement of this Section 7 shall result in the proposal being deemed non-responsive.",
  ),
  permit: doc(
    "f-rfp",
    "Section 7.2, page 15",
    "§7.2",
    "The Offeror shall hold a current food establishment permit issued by Cumberland County for its own kitchen and include a copy with the proposal. The Contractor shall obtain a permit for the cafe before service begins.",
  ),
  manager: doc(
    "f-rfp",
    "Section 7.3, page 15",
    "§7.3",
    "The Offeror shall name an on-site manager who holds a current ServSafe Food Protection Manager certificate or equivalent. A copy of the certificate shall be included with the proposal.",
  ),
  newHire: doc(
    "f-rfp",
    "Section 7.3, page 15",
    "§7.3",
    "An Offeror may name a manager to be hired, provided a signed letter of intent from that individual and a copy of the individual's current certificate are included with the proposal.",
  ),
  insurance: doc(
    "f-rfp",
    "Section 7.4, page 16",
    "§7.4",
    "Include a certificate of insurance showing Commercial General Liability of $1,000,000 per occurrence and $2,000,000 aggregate, Automobile Liability of $1,000,000, and Workers' Compensation at statutory limits, naming the City as additional insured.",
  ),
  coverageInForce: doc(
    "f-rfp",
    "Section 7.4, page 16",
    "§7.4",
    "Coverage shall be in force on the date of award and maintained for the term of the contract.",
  ),
  references: doc(
    "f-rfp",
    "Section 7.5, page 17",
    "§7.5",
    "Provide three (3) references for food service or catering work of similar size and scope performed within the last ten (10) years, on Form 5.",
  ),
  invoice: doc(
    "f-rfp",
    "Section 8.1, page 18",
    "§8.1",
    "The Contractor shall invoice monthly. Each invoice shall show daily meal counts and each event served.",
  ),
  payment: doc(
    "f-rfp",
    "Section 8.2, page 18",
    "§8.2",
    "Payment will be made within thirty (30) days of receipt of a correct invoice.",
  ),
  tax: doc(
    "f-rfp",
    "Section 8.3, page 18",
    "§8.3",
    "Unit prices shall not include North Carolina sales tax. The Contractor shall list applicable sales tax as a separate line on each invoice.",
  ),
  publicRecords: doc(
    "f-rfp",
    "Section 9.4, page 21",
    "§9.4",
    "Proposals will not be opened publicly. After award, proposals become public records, except information marked “CONFIDENTIAL — TRADE SECRET” at the time of submission.",
  ),
  keyPerson: doc(
    "f-rfp",
    "Section 10.1, page 23",
    "§10.1",
    "The Kitchen Manager is Key Personnel. The Offeror shall name the Kitchen Manager and include a resume. The Contractor shall not replace the Kitchen Manager without the City's prior written approval.",
  ),

  // Exhibit A, scope of work (9 pages)
  lunch: doc(
    "f-exa",
    "Exhibit A, Section A.3, page 3",
    "Exh. A §A.3",
    "Hot lunch service shall be available from 11:00 AM to 1:30 PM on each City workday. Field crews take a thirty (30) minute meal break beginning at 11:00 AM or 12:00 PM.",
  ),
  events: doc(
    "f-exa",
    "Exhibit A, Section A.5, page 4",
    "Exh. A §A.5",
    "The Contractor shall accept event orders placed at least five (5) business days before the event. Events will range from twenty (20) to four hundred (400) guests at City buildings.",
  ),
  eventCount: doc(
    "f-exa",
    "Exhibit A, Section A.5, page 4",
    "Exh. A §A.5",
    "The City estimates twenty (20) events per year. Event service includes delivery, buffet setup, hot holding and clean-up.",
  ),
  foodSafety: doc(
    "f-exa",
    "Exhibit A, Section A.6, page 6",
    "Exh. A §A.6",
    "The Contractor shall monitor and record hot and cold holding temperatures during all service periods and shall correct any deficiency immediately.",
  ),
  gradeA: doc(
    "f-exa",
    "Exhibit A, Section A.6, page 6",
    "Exh. A §A.6",
    "The Contractor shall maintain a Grade A sanitation rating at all times. A rating below Grade A shall be corrected within ten (10) days.",
  ),
  onSite: doc(
    "f-exa",
    "Exhibit A, Section A.7, page 7",
    "Exh. A §A.7",
    "The Kitchen Manager shall be on site during all hours of cafe service and event preparation.",
  ),
  background: doc(
    "f-exa",
    "Exhibit A, Section A.9, page 8",
    "Exh. A §A.9",
    "Contractor staff working in City buildings shall pass a City criminal background check and wear a City identification badge.",
  ),

  // Exhibit B, the city's price sheet (Excel)
  sheet: doc(
    "f-exb",
    "Exhibit B, instructions",
    "Exh. B",
    "Unit prices shall include all labor, supervision, food, supplies, transportation, insurance, overhead and profit.",
  ),
  qtyLunch: doc(
    "f-exb",
    "Exhibit B, line 1",
    "Exh. B, line 1",
    `Line 1. Weekday hot lunch, per meal. Estimated annual quantity: ${num(QTY.lunch)}.`,
  ),
  qtyGuest: doc(
    "f-exb",
    "Exhibit B, line 2",
    "Exh. B, line 2",
    `Line 2. Catered event, per guest. Estimated annual quantity: ${num(QTY.guest)}.`,
  ),
  qtyEvent: doc(
    "f-exb",
    "Exhibit B, line 3",
    "Exh. B, line 3",
    `Line 3. Event delivery and setup, per event. Estimated annual quantity: ${QTY.event}.`,
  ),

  // Exhibit C, proposal format (3 pages)
  formatTab3: doc(
    "f-exc",
    "Exhibit C, Proposal Format, page 2",
    "Exhibit C",
    "Tab 3, Operations and Staffing Plan: up to twelve (12) pages.",
  ),
  coverPage: doc(
    "f-exc",
    "Exhibit C, Proposal Format, page 1",
    "Exhibit C",
    "The cover page shall read: FAYNC-2026-R-08, Employee Cafe and Event Catering Services, followed by the Offeror's legal name.",
  ),

  // Required forms 1 to 5 (7 pages)
  form1: doc(
    "f-forms",
    "Form 1, page 1",
    "Form 1",
    "Form 1, Proposal Cover Sheet. To be completed and signed by an official authorized to bind the Offeror. Number of employees: ______",
  ),
  form2: doc(
    "f-forms",
    "Form 2, page 2",
    "Form 2",
    "Form 2, Non-Collusion Affidavit. The Offeror has not entered into any agreement to fix prices or restrict competition. No City officer or employee has a financial interest in this proposal.",
  ),
  form3: doc(
    "f-forms",
    "Form 3, pages 3 to 4",
    "Form 3",
    "Form 3, E-Verify Affidavit. The Offeror complies with Article 2 of Chapter 64 of the North Carolina General Statutes, or employs fewer than twenty-five (25) employees in North Carolina.",
  ),
  form4: doc(
    "f-forms",
    "Form 4, page 5",
    "Form 4",
    "Form 4, Iran Divestment Act Certification. The Offeror is not listed on the Final Divestment List created by the North Carolina State Treasurer.",
  ),
  form5: doc(
    "f-forms",
    "Form 5, pages 6 to 7",
    "Form 5",
    "Form 5, References. List each reference's name, title, organization, telephone and email. The City will contact each reference.",
  ),

  // Addendum 1 (posted before Ava started): a new due date, and a new question
  a1Due: doc(
    "f-add1",
    "Addendum 1, item 1, page 1",
    "Add. 1, item 1",
    `Section 1.2 is revised. The proposal due date is changed from ${USWD(OLD_DUE)} to ${USWD(DAYS.due)} at 2:00 PM Eastern Time.`,
  ),
  a1Staffing: doc(
    "f-add1",
    "Addendum 1, item 2, page 1",
    "Add. 1, item 2",
    "Section 5.3, Tab 3 shall also answer this question: How will the Offeror staff the cafe on a workday when a catered event is also held? State who works the cafe and who works the event.",
  ),
  a1Ack: doc(
    "f-add1",
    "Addendum 1, page 2",
    "Add. 1 form",
    "Offerors shall acknowledge receipt of this Addendum by signing below and including this page with the proposal.",
  ),

  // Questions and answers, set 1
  qaBackground: doc(
    "f-qa",
    "Question 6, page 3",
    "Q&A 6",
    "Q6. Who pays for background checks? A6. The City conducts background checks at no cost to the Contractor.",
  ),

  // Addendum 2 (arrives during the build)
  a2Due: doc(
    "f-add2",
    "Addendum 2, item 1, page 1",
    "Add. 2, item 1",
    `The proposal due date is extended to ${USWD(A2_DUE)} at 2:00 PM Eastern Time.`,
  ),
  a2Notice: doc(
    "f-add2",
    "Addendum 2, item 2, page 1",
    "Add. 2, item 2",
    "Exhibit A, Section A.5 is revised: the Contractor shall accept event orders placed at least three (3) business days before the event.",
  ),
  a2Guests: doc(
    "f-add2",
    "Addendum 2, item 3, page 2",
    "Add. 2, item 3",
    `Exhibit B, Line 2, Catered event, per guest: the estimated annual quantity is revised from ${num(QTY.guest)} to ${num(QTY.guestAfterA2)}.`,
  ),
  a2Ack: doc(
    "f-add2",
    "Addendum 2, page 3",
    "Add. 2 form",
    "Offerors shall acknowledge receipt of this Addendum by signing below and including this page with the proposal.",
  ),
};

// ─── The member's proof, from the profile and the registration ───────────────

const PP1 = `Past work · ${COUNTY.projectTitle}`;
const PP2 = `Past work · ${BRAGG.projectTitle}`;
const PP3 = `Past work · ${CHURCH.projectTitle}`;
const PP4 = `Past work · ${WOMACK.projectTitle}`;

const P = {
  pp1Scope: profile(
    PP1,
    "Cooked and delivered 1,100 breakfasts and lunches a day to nine summer meal sites",
  ),
  pp1Role: profile(
    PP1,
    `Role: prime. Period: ${when(COUNTY.periodStart)} to ${when(COUNTY.periodEnd)}.`,
  ),
  pp1Value: profile(PP1, `Total value: ${money(COUNTY.totalValue)}`),
  pp1Logs: profile(
    PP1,
    "USDA meal-pattern compliant menus, daily temperature logs, and allergen-labelled trays.",
  ),
  pp1Sites: profile(PP1, "Nine summer meal sites. Daily temperature logs."),
  pp1Ref: profile(PP1, ref(COUNTY)),
  pp2Scope: profile(
    PP2,
    "Subcontracted weekend and holiday meal service at two on-post dining facilities.",
  ),
  pp2Role: profile(PP2, `Sub to ${KEY_PARTNER.name} (federal prime) · 30%`),
  pp2Line: profile(
    PP2,
    "Short-order line, salad bar, dish room, and full HACCP records under the prime's quality plan.",
  ),
  pp2When: profile(
    PP2,
    `Fort Bragg dining facility support, ${when(BRAGG.periodStart)} to ${when(BRAGG.periodEnd)}`,
  ),
  pp2Ref: profile(PP2, ref(BRAGG)),
  pp3Scope: profile(
    PP3,
    "Catered eleven events from 80 to 400 guests — weddings, memorials and a community iftar.",
  ),
  pp3Service: profile(
    PP3,
    "Full service: menu planning, on-site cooking, servers, setup and clean-up.",
  ),
  pp3Ref: profile(PP3, ref(CHURCH)),
  pp4Diets: profile(
    PP4,
    "Therapeutic diet trays for the inpatient wards. Renal, diabetic and pureed diets to dietitian order.",
  ),
  phone: profile("Company details", PERSONA.phone),
  address: sam("Physical address", PERSONA.physicalAddress),
  uei: sam("Unique entity ID", PERSONA.uei),
  woman: profile("Certifications · Business types", "Woman-Owned Small Business"),
  // Typed by the member into their profile, so it is "You confirmed", not a document.
  halal: {
    kind: "you-confirmed",
    from: "You told Hunter",
    locator: `Your profile · What sets you apart · ${D(-19)}`,
    quote: PERSONA.differentiators[2],
  } satisfies Proof,
};

// ─── The bid ─────────────────────────────────────────────────────────────────

export const fayettevilleBid: AvaBid = {
  noticeId: STORY_ID,
  // The title, the buyer and the number are replaced by the story's (fixtures/index.ts).
  officialTitle: "Employee Cafe and Event Catering Services",
  buyer: "City of Fayetteville, NC",
  bidNumber: "FAYNC-2026-R-08",
  kind: "written-proposal",
  kindReason:
    "Scored writing worth 70 of 100 points (approach 40, experience 30), plus a scored price and forms.",

  files: [
    {
      id: "f-rfp",
      name: "FAYNC-2026-R-08_Employee_Cafe_and_Event_Catering.pdf",
      role: "main",
      pages: 24,
      postedDaysFromNow: DAYS.posted,
      readability: "read",
    },
    {
      id: "f-exa",
      name: "Exhibit_A_Scope_of_Work.pdf",
      role: "exhibit",
      pages: 9,
      postedDaysFromNow: DAYS.posted,
      readability: "read",
    },
    {
      id: "f-exb",
      name: "Exhibit_B_Price_Sheet.xlsx",
      role: "price-form",
      pages: null,
      postedDaysFromNow: DAYS.posted,
      readability: "read",
    },
    {
      id: "f-exc",
      name: "Exhibit_C_Proposal_Format.pdf",
      role: "exhibit",
      pages: 3,
      postedDaysFromNow: DAYS.posted,
      readability: "read",
    },
    {
      id: "f-exd",
      name: "Exhibit_D_Cafe_Kitchen_Floor_Plan.pdf",
      role: "drawing",
      pages: null,
      postedDaysFromNow: DAYS.posted,
      readability: "behind-login",
      note: "The cafe kitchen floor plan. The staffing plan and event cooking depend on it. The city keeps it behind its vendor portal login.",
      riskIfMissing: "material",
      uploadAskId: "ask-floorplan",
    },
    {
      id: "f-forms",
      name: "Required_Forms_1_to_5.pdf",
      role: "form",
      pages: 7,
      postedDaysFromNow: DAYS.posted,
      readability: "read",
    },
    {
      id: "f-add1",
      name: "Addendum_1.pdf",
      role: "addendum",
      pages: 2,
      postedDaysFromNow: A1_POSTED,
      readability: "read",
      addendumId: "add-1",
    },
    {
      id: "f-qa",
      name: "Questions_and_Answers_Set_1.pdf",
      role: "questions-and-answers",
      pages: 3,
      postedDaysFromNow: QA_POSTED,
      readability: "read",
    },
    {
      id: "f-add2",
      name: "Addendum_2.pdf",
      role: "addendum",
      pages: 3,
      postedDaysFromNow: A2_POSTED,
      readability: "read",
      addendumId: "add-2",
    },
  ],

  // Addendum 1 moved the due date to this day, so its words are the source.
  deadline: {
    dueDaysFromNow: DAYS.due,
    time: "2:00 PM",
    time24: "14:00",
    zone: "Eastern Time",
    utcOffset: ET_OFFSET(DAYS.due),
    source: S.a1Due,
    questionsDueDaysFromNow: DAYS.questionsDue,
    questionsTime: "5:00 PM",
    questionsSource: S.questions,
  },

  award: {
    method: "points",
    source: S.award,
    criteria: [
      {
        id: "cr-approach",
        name: "Approach",
        points: 40,
        kind: "scored-writing",
        source: S.criteria,
        treatment:
          "Scored writing in Tab 3 (staffing and operations) and Tab 4 (menu and food safety). Ava builds Tab 3 to 10 pages.",
      },
      {
        id: "cr-experience",
        name: "Experience and references",
        points: 30,
        kind: "scored-writing",
        source: S.criteria,
        treatment: "Scored writing in Tab 2, up to 4 pages.",
      },
      {
        id: "cr-price",
        name: "Price",
        points: 30,
        kind: "price-formula",
        source: S.priceFormula,
        treatment: "Scored by formula. No writing. Ava fills the city's price sheet.",
      },
    ],
    priceFormula: { maxPoints: 30, text: "Lowest price ÷ your price × 30" },
    note: "Approach is worth 40 points and price 30. A stronger plan can outscore a lower price.",
  },

  hardRequirements: [
    {
      id: "hr-site-visit",
      grantRow: "gf-site",
      group: "events",
      label: `Mandatory site visit, ${D(VISIT)} at 10:00 AM`,
      source: S.siteVisit,
      initial: "not-yet",
      // The visit is past. One answer settles it: her company attended and signed.
      askId: "ask-site-visit",
      evidenceAfter: PROOF_SAYS.siteVisit,
    },
    {
      id: "hr-vendor",
      grantRow: "gf-vendor",
      group: "eligibility",
      label: "Registered in the city's vendor portal",
      source: S.portal,
      initial: "confirm",
      askId: "ask-city-vendor",
      evidenceAfter: PROOF_SAYS.vendor,
    },
    {
      id: "hr-permit",
      group: "eligibility",
      label: "County food service permit for your own kitchen",
      source: S.permit,
      initial: "confirm",
      askId: "ask-permit",
      evidenceAfter: "Your Cumberland County permit, uploaded by you",
    },
    {
      id: "hr-manager",
      group: "people",
      label: "A named manager with a food protection manager certificate",
      source: S.manager,
      initial: "confirm",
      askId: "ask-servsafe",
      evidenceAfter: "Your kitchen manager's ServSafe certificate",
    },
    {
      id: "hr-insurance",
      grantRow: "gf-insurance",
      group: "insurance",
      label: "Insurance: liability $1M / $2M, auto $1M, workers' comp",
      source: S.insurance,
      initial: "confirm",
      askId: "ask-insurance",
      evidenceAfter: PROOF_SAYS.insurance,
    },
    {
      id: "hr-nc-business",
      grantRow: "gf-nc",
      group: "eligibility",
      label: "Organized to do business in North Carolina",
      source: S.section7,
      initial: "meets",
      evidence: `Your Articles of Organization: North Carolina, ${FORMED_ON}`,
    },
  ],

  screen: [
    {
      topic: "vendor-registration",
      found: true,
      summary: "Register in the city's vendor portal to submit and to open Exhibit D. It is free.",
      source: S.portal,
      requirementId: "hr-vendor",
    },
    {
      topic: "preferences",
      found: false,
      summary: "No set-aside and no local preference. Any qualified business may bid.",
    },
    {
      topic: "bonds",
      found: false,
      summary: "Not asked for in these files. No bid bond and no performance bond.",
    },
    {
      topic: "insurance",
      found: true,
      summary:
        "Liability $1M / $2M, auto $1M and workers' comp. The city is named on the certificate.",
      source: S.insurance,
      requirementId: "hr-insurance",
    },
    { topic: "wages", found: false, summary: "No wage rule in these files." },
    {
      topic: "tax",
      found: true,
      summary:
        "Prepared food is taxable. Leave sales tax out of your prices, and add it on each invoice.",
      source: S.tax,
    },
    {
      topic: "notary-signature",
      found: true,
      summary:
        "Forms 2 and 3 need a notary. Forms 1 and 4, the W-9 and each addendum form need your signature.",
      source: S.forms,
    },
    {
      topic: "pre-bid-meeting",
      found: true,
      summary: `The mandatory site visit was on ${D(VISIT)} at 10:00 AM. A firm that missed it is out.`,
      source: S.siteVisit,
      requirementId: "hr-site-visit",
    },
    {
      topic: "public-opening",
      found: true,
      summary:
        "No public opening. Proposals become public after award, except pages marked as trade secret.",
      source: S.publicRecords,
    },
    {
      topic: "references-licenses",
      found: true,
      summary: "A county food service permit for your own kitchen, and three references.",
      source: S.permit,
      requirementId: "hr-permit",
    },
    {
      topic: "participation-goals",
      found: false,
      summary: "No participation goal in these files.",
    },
    {
      topic: "background-checks",
      found: true,
      summary:
        "Staff who work in city buildings need a city background check. The city pays for it.",
      source: S.qaBackground,
    },
    {
      topic: "portal-rules",
      found: true,
      summary:
        "PDF files up to 25 MB each, on the city's vendor portal. The price sheet stays in Excel.",
      source: S.fileFormat,
    },
  ],

  commitments: [
    {
      id: "c-lunch",
      text: "Hot lunch served from 11:00 AM to 1:30 PM, Monday to Friday",
      source: S.lunch,
      pricedAs: "Priced as: the cook, and both servers on the line 15 hours a week each.",
      needsApproval: true,
    },
    {
      id: "c-event-notice",
      text: "Cater city events ordered 5 business days ahead, for 20 to 400 guests",
      source: S.events,
      pricedAs: "Priced as: 5 hours a week for each server, for event delivery and service.",
      needsApproval: true,
    },
    {
      id: "c-grade-a",
      text: "Keep a Grade A score at every county inspection of the cafe",
      source: S.gradeA,
      needsApproval: true,
    },
    {
      id: "c-same-manager",
      text: "The same named kitchen manager on site during all service hours",
      source: S.onSite,
      pricedAs: "Priced as: the kitchen manager, 40 hours a week, 50 weeks a year.",
      needsApproval: true,
    },
    {
      id: "c-manager-replace",
      text: "Replace the kitchen manager only with the city's written approval",
      source: S.keyPerson,
      needsApproval: true,
    },
    {
      // Her answer to the staffing question that Addendum 1 added to Tab 3.
      id: "c-event-day",
      text: "On a day with an event, keep the cafe open with the manager, the cook and a part-time server",
      source: S.a1Staffing,
      pricedAs: "Priced as: one part-time server, 5 hours a week.",
      needsApproval: true,
    },
    {
      id: "c-invoice",
      text: "One invoice a month, with daily meal counts and each event served",
      source: S.invoice,
      needsApproval: false,
    },
  ],

  contractTerms: [
    { text: "Unit prices stay fixed for the first 12 months.", source: S.pricing },
    { text: "The city may renew twice, one year at a time. It decides, not you.", source: S.term },
    { text: "At each renewal, prices can rise by 3% at most.", source: S.pricing },
    {
      text: "Quantities are estimates. The city does not promise to buy them, so revenue is not guaranteed.",
      source: S.quantities,
    },
    { text: "The city pays 30 days after a correct invoice.", source: S.payment },
    { text: "The city can end the contract with 30 days' written notice.", source: S.termination },
    { text: "Your prices hold for 90 days after the due date.", source: S.validity },
  ],

  // Whether a Mentor review is advised, and why, is Grant's call: his
  // warnings (src/demo/ava/grantRead.ts). Ava shows them and adds none.
  mentor: { recommended: false, reasons: [] },

  knownFacts: [
    {
      label: "Legal name",
      value: PERSONA.businessName,
      from: "Your federal registration",
    },
    { label: "Unique entity ID", value: PERSONA.uei, from: "Your federal registration" },
    // A city bid: the federal-only facts (CAGE code, SAM.gov expiry) are left
    // out. The city's own vendor registration is hr-vendor, not SAM.gov.
    {
      label: "Business address",
      value: PERSONA.physicalAddress,
      from: "Your federal registration",
    },
    { label: "Business phone", value: PERSONA.phone, from: "Your GovPreneurs profile" },
    {
      label: "Company formed",
      value: `${FORMED_ON}, in ${PERSONA.stateOfIncorporation}`,
      from: "Your Articles of Organization",
    },
    {
      label: "Woman-owned",
      value: "Yes, certified. The certificate is not uploaded yet.",
      from: "Your GovPreneurs profile",
    },
    {
      label: "Employees",
      value: `${PERSONA.employeesW2}, as of ${D(-19)}. This may be out of date.`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Industry codes",
      value: `${PERSONA.primaryNaics} ${PERSONA.primaryNaicsLabel}, and ${PERSONA.secondaryNaics[0].code} ${PERSONA.secondaryNaics[0].label}`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Past job: school summer meals",
      value: `${COUNTY.customerName}, ${year(COUNTY)}, ${money(COUNTY.totalValue)}. 1,100 meals a day at 9 sites.`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Past job: Fort Bragg dining support",
      value: `${year(BRAGG)}, ${money(BRAGG.totalValue)}. You did 30% of the work, under ${KEY_PARTNER.name}.`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Past job: church event catering",
      value: `${CHURCH.customerName}, ${year(CHURCH)}, ${money(CHURCH.totalValue)}. 11 events, 80 to 400 guests.`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Past job: hospital patient meals",
      value: `${WOMACK.customerName.split(",")[0]}, ${year(WOMACK)}, ${money(WOMACK.totalValue)}. No federal performance rating yet.`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Insurance you told Hunter about",
      value: "Liability $1M a claim. The $2M total is not on file. No certificate on file.",
      from: "Your GovPreneurs profile",
    },
  ],

  asks: [
    // ── First: the site visit. It is past. If no one went, the bid is over ──
    {
      id: "ask-site-visit",
      // Her word on a past event: not "Be there", which is for a visit to come.
      proof: "word",
      grantQuestion: "fy-site",
      grantChoices: { Yes: "sv-owner", No: "sv-none" },
      kind: "answer",
      title: `Your company at the site visit on ${D(VISIT)}`,
      source: S.siteVisit,
      why: "The visit was mandatory. The city will not accept a proposal from a firm that missed it.",
      owner: "you",
      leadDays: 0,
      minutes: 1,
      answer: {
        type: "answer",
        question: `Did someone from your company attend the site visit on ${DM(VISIT)} at 10:00 AM, and sign the attendance sheet?`,
        choices: [
          {
            id: "sv-owner",
            label: "Yes, I attended and signed the sheet",
            consequence: "The site visit rule is met.",
          },
          {
            id: "sv-staff",
            label: "Yes, a staff member attended and signed the sheet",
            consequence: "Any authorized person may attend for you. The site visit rule is met.",
          },
          {
            id: "sv-none",
            label: "No, no one from my company went",
            failsGate:
              "The site visit was mandatory. The city deems firms that missed it non-responsive.",
          },
        ],
      },
      feeds: ["Hard requirement · Site visit"],
    },

    // ── Slowest to get ──
    {
      id: "ask-insurance",
      kind: "upload",
      title: "Certificate of insurance naming the city",
      source: S.insurance,
      why: "The city rejects a proposal without it. Your profile lists $1M a claim, but not the $2M total, and no certificate.",
      owner: "insurance-agent",
      leadDays: 5,
      minutes: 15,
      deliberate: true,
      answer: {
        type: "upload",
        accepts: "A certificate from your agent that names the city. Add a note of any added cost.",
        extracts: [
          {
            fieldId: "ins-added-cost",
            label: "Added yearly cost for the city's terms",
            value: 650,
            unit: "usd",
            where: "Your agent's note, line 1",
          },
        ],
      },
      dontHave: [
        {
          id: "dh-ins-buy",
          label: "Buy the coverage now. Your agent quotes it.",
          detail:
            "Your agent quotes the coverage you lack. Ava adds its cost to your price. The rule stays open until the certificate arrives.",
          source: S.coverageInForce,
          outcome: "new-ask",
          opensAskId: "ask-insurance-quote",
          // A quote is a step, not the certificate: the rule stays Confirm.
        },
        {
          id: "dh-ins-decision",
          label: "Go back to a bid decision",
          detail:
            "Without this coverage the proposal is non-responsive. The RFP allows no other way.",
          source: S.section7,
          outcome: "bid-decision",
        },
      ],
      feeds: ["Hard requirement · Insurance", "Price · Insurance cost"],
    },
    {
      id: "ask-insurance-quote",
      kind: "upload",
      title: "Your agent's quote for the coverage you lack",
      source: S.coverageInForce,
      why: "The city needs the coverage in force on the day of award. The quote shows it can be.",
      owner: "insurance-agent",
      leadDays: 5,
      minutes: 20,
      deliberate: true,
      hiddenUntilOpened: true,
      answer: {
        type: "upload",
        accepts: "A written quote or binder from your agent, with the start date and yearly cost",
        extracts: [
          {
            fieldId: "ins-quote-premium",
            label: "Yearly cost of the coverage you lack",
            value: 1_800,
            unit: "usd",
            where: "Your agent's quote, yearly premium",
          },
        ],
      },
      feeds: ["Hard requirement · Insurance", "Price · Insurance cost"],
    },
    {
      id: "ask-ref-contacts",
      kind: "enter",
      title: "Phone, email and permission from your 3 references",
      source: S.form5,
      why: "The city calls each reference. Ask them first, so they expect the call.",
      owner: "references",
      leadDays: 4,
      minutes: 25,
      answer: {
        type: "enter",
        fields: [
          {
            id: "ref1-phone",
            label: `${COUNTY.referenceName}, phone`,
            unit: "phone",
            hint: "Only after she agrees to take the city's call.",
          },
          { id: "ref1-email", label: `${COUNTY.referenceName}, email`, unit: "email" },
          {
            id: "ref2-phone",
            label: `${BRAGG.referenceName}, phone`,
            unit: "phone",
            hint: "Only after he agrees to take the city's call.",
          },
          { id: "ref2-email", label: `${BRAGG.referenceName}, email`, unit: "email" },
          {
            id: "ref3-phone",
            label: `${CHURCH.referenceName}, phone`,
            unit: "phone",
            hint: "Only after he agrees to take the city's call.",
          },
          { id: "ref3-email", label: `${CHURCH.referenceName}, email`, unit: "email" },
        ],
      },
      feeds: ["Form 5 · References"],
    },
    {
      id: "ask-city-vendor",
      kind: "enter",
      title: "City vendor number and tax ID for the city's forms",
      source: S.portal,
      why: "You are registered in the city's vendor portal. The forms and the upload need your vendor number and your tax ID.",
      owner: "you",
      leadDays: 1,
      minutes: 15,
      answer: {
        type: "enter",
        fields: [
          {
            id: "vendor-number",
            label: "City vendor number",
            unit: "text",
            hint: "The portal shows it on your account page.",
          },
          {
            id: "tax-id",
            label: "Federal tax ID (EIN)",
            unit: "text",
            hint: "It goes on the W-9 and the cover sheet.",
          },
        ],
      },
      feeds: ["Hard requirement · City vendor", "Form 1 · Cover sheet", "W-9"],
    },
    {
      id: "ask-floorplan",
      kind: "upload",
      title: "Exhibit D, the cafe kitchen floor plan",
      source: S.exhibitD,
      why: "Ava can't open files behind the city's login. The plan shows the kitchen your staff will use.",
      owner: "you",
      leadDays: 3,
      minutes: 10,
      answer: {
        type: "upload",
        accepts:
          "Exhibit D as a PDF. Sign in to the city's vendor portal, open FAYNC-2026-R-08, and download it.",
      },
      feeds: ["Blocked file · Exhibit D", "Section · Operations and staffing plan"],
    },
    {
      id: "ask-resume",
      kind: "upload",
      title: "Resume for your kitchen manager",
      source: S.keyPerson,
      why: "The city scores the named manager in Tab 3. Ava names them only from their resume.",
      owner: "you",
      leadDays: 3,
      minutes: 30,
      deliberate: true,
      answer: {
        type: "upload",
        accepts: "A resume of 1 or 2 pages. A plain list of jobs and dates is fine.",
      },
      feeds: ["Key person · Kitchen manager", "Section · Operations and staffing plan"],
    },
    {
      id: "ask-payroll",
      kind: "upload",
      title: "Payroll report for 2025, for tax, workers' comp and leave rates",
      source: S.sheet,
      why: "Ava reads your real rates from the report. You approve each one before it goes in the price.",
      owner: "bookkeeper",
      leadDays: 3,
      minutes: 10,
      deliberate: true,
      answer: {
        type: "upload",
        accepts: "A 2025 payroll summary from your payroll system or your bookkeeper",
        extracts: [
          {
            fieldId: "unemployment-rate",
            label: "Unemployment taxes",
            value: 1.9,
            unit: "percent",
            where: "Payroll summary, employer taxes, 2025 totals",
          },
          {
            fieldId: "wc-rate",
            label: "Workers' comp",
            value: 3.1,
            unit: "percent",
            where: "Payroll summary, workers' comp premium",
          },
          {
            fieldId: "leave-rate",
            label: "Paid leave and benefits",
            value: 4.5,
            unit: "percent",
            where: "Payroll summary, paid time off and benefits",
          },
        ],
      },
      feeds: [
        "Price · Unemployment taxes",
        "Price · Workers' comp",
        "Price · Paid leave and benefits",
      ],
    },
    {
      id: "ask-pl",
      kind: "upload",
      title: "Profit and loss statement for 2025, for your overhead",
      source: S.sheet,
      why: "Overhead comes from your own books. Ava never guesses it.",
      owner: "bookkeeper",
      leadDays: 3,
      minutes: 10,
      deliberate: true,
      answer: {
        type: "upload",
        accepts: "Your 2025 profit and loss statement, from your bookkeeper or accounting software",
        extracts: [
          {
            fieldId: "overhead-rate",
            label: "Overhead",
            value: 12,
            unit: "percent",
            where: "2025 profit and loss: rent, utilities, office and admin, against direct costs",
          },
        ],
      },
      feeds: ["Price · Overhead"],
    },
    {
      id: "ask-pay-rates",
      kind: "enter",
      title: "What you pay for each job, per hour (3 rates)",
      source: S.sheet,
      why: "Ava builds each unit price from what you pay, not what you charge.",
      owner: "bookkeeper",
      leadDays: 2,
      minutes: 15,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "pay-manager",
            label: "Kitchen manager, per hour",
            unit: "usd-hour",
            hint: "What you pay, before taxes.",
            floor: { value: 7.25, why: "The North Carolina minimum wage is $7.25 an hour." },
          },
          {
            id: "pay-cook",
            label: "Cook, per hour",
            unit: "usd-hour",
            hint: "What you pay, before taxes.",
            floor: { value: 7.25, why: "The North Carolina minimum wage is $7.25 an hour." },
          },
          {
            id: "pay-server",
            label: "Server and driver, and the part-time server, per hour",
            unit: "usd-hour",
            hint: "What you pay, before taxes.",
            floor: { value: 7.25, why: "The North Carolina minimum wage is $7.25 an hour." },
          },
        ],
      },
      feeds: ["Price · Kitchen manager", "Price · Cook", "Price · Server and driver"],
    },
    {
      id: "ask-servsafe",
      kind: "upload",
      title: "Food protection manager certificate for your kitchen manager",
      source: S.manager,
      why: "The city rejects a proposal without it. A backup manager's certificate helps too.",
      owner: "you",
      leadDays: 2,
      minutes: 10,
      answer: {
        type: "upload",
        accepts:
          "ServSafe Food Protection Manager certificates: your kitchen manager's, and a backup's if you have one",
      },
      dontHave: [
        {
          id: "dh-ss-hire",
          label: "Hire a certified manager with a signed letter of intent",
          detail:
            "Section 7.3 allows a named new hire. Include their letter and their current certificate.",
          source: S.newHire,
          outcome: "new-ask",
          opensAskId: "ask-loi",
          // Section 7.3 accepts this in place of your own manager's certificate.
          satisfies: true,
        },
        {
          id: "dh-ss-exam",
          label: `Take the ServSafe exam before ${D(11)}`,
          detail:
            "Your manager takes the exam. The rule stays open until the certificate is uploaded.",
          source: S.manager,
          outcome: "new-ask",
          opensAskId: "ask-exam",
          // An exam date is not a certificate: the rule stays Confirm.
        },
        {
          id: "dh-ss-decision",
          label: "Go back to a bid decision",
          detail:
            "Without a certified manager the proposal is non-responsive. The RFP allows no other way.",
          source: S.section7,
          outcome: "bid-decision",
        },
      ],
      feeds: ["Hard requirement · Certified manager", "Section · Operations and staffing plan"],
    },
    {
      id: "ask-loi",
      kind: "upload",
      title: "Letter of intent and certificate from the manager you will hire",
      source: S.newHire,
      why: "Section 7.3 accepts a named new hire with both papers. Ava names them in the staffing plan.",
      owner: "you",
      leadDays: 7,
      minutes: 60,
      deliberate: true,
      hiddenUntilOpened: true,
      answer: {
        type: "upload",
        accepts:
          "The person's signed letter of intent and their current ServSafe manager certificate",
      },
      feeds: ["Hard requirement · Certified manager", "Key person · Kitchen manager"],
    },
    {
      id: "ask-exam",
      kind: "enter",
      title: "ServSafe exam date for your kitchen manager",
      source: S.manager,
      why: `The certificate goes in the proposal. An exam before ${DM(11)} leaves time for it to arrive.`,
      owner: "you",
      leadDays: 7,
      minutes: 240,
      hiddenUntilOpened: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "exam-date",
            label: "Exam date",
            unit: "text",
            hint: `Before ${D(11)}, so the certificate arrives in time.`,
          },
        ],
      },
      feeds: ["Hard requirement · Certified manager"],
    },
    {
      id: "ask-food-cost",
      kind: "enter",
      title: "Food and packaging cost per lunch and per event guest",
      source: S.sheet,
      why: "Food is the biggest cost after labor. Only you know what your plates cost.",
      owner: "you",
      leadDays: 2,
      minutes: 45,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "food-lunch",
            label: "Food and packaging, one lunch",
            unit: "usd",
            hint: "Entrée, sides, drink, tray and utensils. Use your menu costing.",
          },
          {
            id: "food-guest",
            label: "Food and serving ware, one event guest",
            unit: "usd",
            hint: "A typical buffet plate, with plates and napkins.",
          },
        ],
      },
      feeds: ["Price · Weekday hot lunch", "Price · Catered event guest"],
    },
    {
      id: "ask-other-costs",
      kind: "enter",
      title: "Other yearly costs for this contract",
      source: S.sheet,
      why: "Exhibit B says unit prices include every cost. Ava never puts its own guess in your price.",
      owner: "you",
      leadDays: 2,
      minutes: 20,
      answer: {
        type: "enter",
        fields: [
          {
            id: "cost-vehicle",
            label: "Vehicle fuel and upkeep for event runs, per year",
            unit: "usd",
            hint: "Ava's starting point: 40 trips × 6 miles × 70 cents = about $170. That is 2 trips for each of the city's 20 events, and the campus is 3 miles from your kitchen. Enter your own figure.",
          },
          {
            id: "cost-permit",
            label: "County permit fee for the cafe kitchen, per year",
            unit: "usd",
            hint: "Ava's starting point: $350. Check the fee with the county health department. Enter your own figure.",
          },
          {
            id: "cost-renewal",
            label: "Renewing the manager's food safety certificate in year one",
            unit: "usd",
            hint: "Ava's starting point: $180 for one exam. Enter 0 if the certificate stays current all year.",
          },
        ],
      },
      feeds: [
        "Price · Vehicle for event runs",
        "Price · Cafe kitchen permit",
        "Price · Certificate renewal",
      ],
    },
    {
      id: "ask-recent-events",
      kind: "upload",
      title: "Your event jobs since 2022, with guest counts and staff",
      source: S.eventCount,
      why: `Your record shows events only in ${year(CHURCH)}. Recent jobs make the events claim provable.`,
      owner: "you",
      leadDays: 2,
      minutes: 30,
      answer: {
        type: "upload",
        accepts: "Invoices or a simple list: date, client, guests and staff for each event",
      },
      feeds: [
        "Section · Experience and references",
        "Section · Operations and staffing plan",
        "Theme · Events",
      ],
    },
    {
      id: "ask-permit",
      kind: "upload",
      title: "County food service permit and last inspection report for your kitchen",
      source: S.permit,
      why: "The city rejects a proposal without a current permit. The inspection report shows your score.",
      owner: "you",
      leadDays: 1,
      minutes: 10,
      answer: {
        type: "upload",
        accepts: "A photo or scan of your permit, and your last inspection report",
      },
      feeds: ["Hard requirement · Health permit", "Section · Menu and food safety"],
    },
    {
      id: "ask-food-safety",
      kind: "enter",
      title: "How you check food temperatures and fix missed items today",
      source: S.foodSafety,
      why: "Tab 4 scores your food safety program. Ava writes only what you do today.",
      owner: "you",
      leadDays: 1,
      minutes: 15,
      answer: {
        type: "enter",
        fields: [
          {
            id: "temp-check",
            label: "How often you check the heat of hot food",
            unit: "text",
          },
          {
            id: "temp-record",
            label: "How you write down each check",
            unit: "text",
          },
          {
            id: "missed-fix",
            label: "What your staff do when an item is missing, wrong or too cold",
            unit: "text",
          },
        ],
      },
      feeds: ["Section · Menu and food safety", "Section · Operations and staffing plan"],
    },
    {
      id: "ask-contingency",
      kind: "enter",
      title: "Your contingency, for costs that run over",
      source: S.priceFormula,
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
      id: "ask-profit",
      kind: "enter",
      title: "Your profit, as a percent",
      source: S.priceFormula,
      why: "Profit is your decision. Ava shows how price turns into points.",
      owner: "you",
      leadDays: 1,
      minutes: 15,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "profit-rate",
            label: "Profit",
            unit: "percent",
            hint: "You decide. Ava never picks it. Price is worth 30 of 100 points.",
          },
        ],
      },
      feeds: ["Price · Profit"],
    },
    {
      id: "ask-ref1",
      kind: "approve",
      title: `${COUNTY.customerName} summer meals as reference 1`,
      source: S.references,
      why: `It is your closest match to the daily cafe. The city will call ${COUNTY.referenceName}.`,
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use the ${COUNTY.projectTitle} (${year(COUNTY)}) as reference 1?`,
        from: "Your GovPreneurs profile · past work",
        value: `${COUNTY.projectTitle}, ${year(COUNTY)}`,
      },
      feeds: ["Section · Experience and references", "Form 5 · References"],
    },
    {
      id: "ask-ref2",
      kind: "approve",
      title: "Fort Bragg dining facility support as reference 2",
      source: S.references,
      why: `It is your newest dining work, on an Army post. The city will call ${BRAGG.referenceName}.`,
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use the Fort Bragg dining facility support (${year(BRAGG)}), under ${KEY_PARTNER.name}, as reference 2?`,
        from: "Your GovPreneurs profile · past work",
        value: `Fort Bragg dining facility support, ${year(BRAGG)}`,
      },
      feeds: ["Section · Experience and references", "Form 5 · References"],
    },
    {
      id: "ask-ref3",
      kind: "approve",
      title: `${CHURCH.customerName} events as reference 3`,
      source: S.references,
      why: `It is your strongest event work. The city will call ${CHURCH.referenceName}.`,
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use the ${CHURCH.customerName} events (${year(CHURCH)}) as reference 3?`,
        from: "Your GovPreneurs profile · past work",
        value: `${CHURCH.customerName} events, ${year(CHURCH)}`,
      },
      feeds: ["Section · Experience and references", "Form 5 · References"],
    },
    {
      id: "ask-backup-manager",
      kind: "enter",
      title: "Who covers when your kitchen manager is out",
      source: S.manager,
      why: "The city needs a certified manager at every service. An evaluator asks who covers sick days.",
      owner: "you",
      leadDays: 1,
      minutes: 10,
      answer: {
        type: "enter",
        fields: [
          {
            id: "backup-name",
            label: "Your backup manager's name",
            unit: "text",
            hint: "For example: Sam Ortiz.",
          },
          {
            id: "backup-role",
            label: "Their job, and any manager certificate they hold",
            unit: "text",
            hint: "For example: our head cook, who holds a ServSafe manager certificate.",
          },
        ],
      },
      feeds: ["Draft · Operations and staffing plan"],
    },
    {
      id: "ask-employees",
      kind: "approve",
      title: "Your employee count, for the cover sheet",
      source: S.form1,
      why: `The cover sheet asks for it. Your profile count is from ${D(-19)}.`,
      owner: "you",
      leadDays: 0,
      minutes: 1,
      answer: {
        type: "approve",
        proposal: `Your profile shows ${PERSONA.employeesW2} employees. Is that still correct?`,
        from: "Your GovPreneurs profile",
        value: String(PERSONA.employeesW2),
        asOf: `${D(-19)}`,
      },
      feeds: ["Form 1 · Cover sheet", "Section · Cover letter"],
    },
  ],

  clarifications: [
    {
      id: "cl-pages",
      title: "The page limit is stated two different ways",
      checked:
        "Neither Addendum 1 nor the questions-and-answers file settles it. Question 2 only points back to both.",
      passages: [S.pageLimit, S.formatTab3],
      question:
        "FAYNC-2026-R-08, Section 5.2 limits Tab 3 to ten (10) pages. Exhibit C allows Tab 3 up to twelve (12) pages. Could you confirm which limit applies?",
      to: "Patricia Boyd, Procurement Officer, City of Fayetteville (patricia.boyd@fayettevillenc.gov)",
      channel: "By email only, per Section 1.5",
      kind: "simple-limit",
      meanwhile: "Ava builds Tab 3 to 10 pages, so it is safe under either limit.",
    },
  ],

  plan: [
    {
      id: "pl-due",
      source: S.a1Due,
      kind: "logistics",
      needs: "action",
      ifMissed: "The city does not accept late proposals.",
      answeredIn: { kind: "checklist", id: "ck-upload", label: "Upload by 2:00 PM Eastern Time" },
    },
    {
      id: "pl-site-visit",
      source: S.siteVisit,
      kind: "logistics",
      needs: "action",
      ifMissed: "The city deems the proposal non-responsive.",
      answeredIn: {
        kind: "checklist",
        id: "ck-site-visit",
        label: "The site visit, already attended",
      },
      askId: "ask-site-visit",
    },
    {
      id: "pl-portal",
      source: S.portal,
      kind: "logistics",
      needs: "action",
      ifMissed: "You cannot upload the proposal or open Exhibit D.",
      answeredIn: { kind: "checklist", id: "ck-test", label: "Test upload on the city's portal" },
      askId: "ask-city-vendor",
    },
    {
      id: "pl-exhibit-d",
      source: S.exhibitD,
      kind: "instruction",
      needs: "action",
      ifMissed: "Ava cannot check the staffing plan against the kitchen space.",
      answeredIn: {
        kind: "section",
        id: "sec-operations",
        label: "Tab 3, Operations and staffing plan",
      },
      askId: "ask-floorplan",
    },
    {
      id: "pl-page-limit",
      source: S.pageLimit,
      kind: "instruction",
      needs: "writing",
      ifMissed: "Pages past the limit may not be read.",
      answeredIn: { kind: "section", id: "sec-operations", label: "Tab 3 page limit" },
      clarificationId: "cl-pages",
    },
    {
      id: "pl-cover",
      source: S.tab1,
      kind: "instruction",
      needs: "writing",
      ifMissed: "The city may find the proposal incomplete.",
      answeredIn: { kind: "section", id: "sec-cover", label: "Tab 1, Cover letter" },
      askId: "ask-city-vendor",
    },
    {
      id: "pl-experience",
      source: S.tab2,
      kind: "scored-item",
      needs: "writing",
      ifMissed: "Up to 30 points are lost.",
      answeredIn: {
        kind: "section",
        id: "sec-experience",
        label: "Tab 2, Experience and references",
      },
      askId: "ask-recent-events",
    },
    {
      id: "pl-references",
      source: S.references,
      kind: "instruction",
      needs: "attachment",
      ifMissed: "The city deems the proposal non-responsive.",
      answeredIn: { kind: "form", id: "form-references", label: "Form 5, References" },
      askId: "ask-ref-contacts",
    },
    {
      id: "pl-operations",
      source: S.tab3,
      kind: "scored-item",
      needs: "writing",
      ifMissed: "Up to 30 of the 40 approach points are lost.",
      answeredIn: {
        kind: "section",
        id: "sec-operations",
        label: "Tab 3, Operations and staffing plan",
      },
      askId: "ask-resume",
    },
    {
      // The question that Addendum 1 added to Tab 3.
      id: "pl-staffing-question",
      source: S.a1Staffing,
      kind: "scored-item",
      needs: "writing",
      ifMissed: "The city may find Tab 3 incomplete, and approach points are lost.",
      answeredIn: {
        kind: "section",
        id: "sec-operations",
        label: "Tab 3, your answer on cafe and event days",
      },
    },
    {
      id: "pl-menu",
      source: S.tab4,
      kind: "scored-item",
      needs: "writing",
      ifMissed: "Up to 10 of the 40 approach points are lost.",
      answeredIn: { kind: "section", id: "sec-menu", label: "Tab 4, Menu and food safety" },
      askId: "ask-food-safety",
    },
    {
      id: "pl-price",
      source: S.priceFormula,
      kind: "scored-item",
      needs: "price",
      ifMissed: "The proposal cannot be scored, and 30 points are lost.",
      answeredIn: { kind: "price", id: "price", label: "Exhibit B, the city's price sheet" },
      askId: "ask-pay-rates",
    },
    {
      id: "pl-price-format",
      source: S.fileFormat,
      kind: "instruction",
      needs: "price",
      ifMissed: "The city may not accept a price sheet in another format.",
      answeredIn: { kind: "price", id: "price", label: "Exhibit B, in the city's Excel file" },
    },
    {
      id: "pl-permit",
      source: S.permit,
      kind: "instruction",
      needs: "attachment",
      ifMissed: "The city deems the proposal non-responsive.",
      answeredIn: { kind: "section", id: "sec-menu", label: "Tab 4, with your permit attached" },
      askId: "ask-permit",
    },
    {
      id: "pl-manager",
      source: S.manager,
      kind: "instruction",
      needs: "attachment",
      ifMissed: "The city deems the proposal non-responsive.",
      answeredIn: {
        kind: "section",
        id: "sec-operations",
        label: "Tab 3, certificate in Appendix B",
      },
      askId: "ask-servsafe",
    },
    {
      id: "pl-insurance",
      source: S.insurance,
      kind: "instruction",
      needs: "attachment",
      ifMissed: "The city deems the proposal non-responsive.",
      answeredIn: { kind: "form", id: "form-insurance", label: "Certificate of insurance" },
      askId: "ask-insurance",
    },
    {
      id: "pl-affidavits",
      source: S.form2,
      kind: "form",
      needs: "signature",
      ifMissed: "The proposal is incomplete, and the city can reject it.",
      answeredIn: {
        kind: "form",
        id: "form-noncollusion",
        label: "Forms 2 and 3, signed before a notary",
      },
    },
    {
      id: "pl-iran",
      source: S.form4,
      kind: "form",
      needs: "signature",
      ifMissed: "The city cannot award you the contract without it.",
      answeredIn: { kind: "form", id: "form-iran", label: "Form 4, Iran divestment" },
    },
    {
      id: "pl-w9",
      source: S.forms,
      kind: "form",
      needs: "signature",
      ifMissed: "The city cannot set you up to be paid.",
      answeredIn: { kind: "form", id: "form-w9", label: "W-9" },
      askId: "ask-city-vendor",
    },
    {
      id: "pl-addenda",
      source: S.addenda,
      kind: "form",
      needs: "signature",
      ifMissed: "The city may reject the proposal.",
      answeredIn: { kind: "form", id: "form-ack1", label: "Addendum acknowledgment forms" },
    },
  ],

  themes: [
    {
      id: "th-on-time",
      theme: "Hot food on time, every day, for crews on a fixed schedule",
      priority: "Crews break at 11:00 AM or 12:00 PM. Hot food has to be ready then.",
      prioritySource: S.lunch,
      evidence: [
        {
          text: `1,100 meals a day to 9 sites for 11 weeks, for ${COUNTY.customerName} in ${year(COUNTY)}`,
          proof: P.pp1Scope,
        },
        { text: "Daily temperature logs at every site", proof: P.pp1Logs },
      ],
    },
    {
      id: "th-events",
      theme: "Events from 80 to 400 guests",
      priority: "The city plans about 20 events a year, of 20 to 400 guests.",
      prioritySource: S.eventCount,
      evidence: [
        {
          text: `11 events of 80 to 400 guests for ${CHURCH.customerName}, ${year(CHURCH)}`,
          proof: P.pp3Scope,
        },
      ],
      weakness: `Your only event proof is one church contract from ${year(CHURCH)}. Nothing shows the city's 20 events a year.`,
      askId: "ask-recent-events",
    },
    {
      id: "th-event-day",
      theme: "Enough people for the cafe and an event on the same day",
      priority: "Addendum 1 asks how you staff a workday that has an event.",
      prioritySource: S.a1Staffing,
      evidence: [
        {
          text: `Weekend and holiday meals at two Fort Bragg dining facilities, ${year(BRAGG)}`,
          proof: P.pp2Scope,
        },
        { text: "A short-order line, a salad bar and the dish room", proof: P.pp2Line },
      ],
    },
  ],

  sections: [
    // ── Tab 1 ──
    {
      id: "sec-cover",
      title: "Cover letter and company information",
      answers: S.tab1,
      points: null,
      pageLimit: 2,
      pages: 1,
      paragraphs: [
        [
          {
            text: "Haddad Catering and Food Services submits this proposal for FAYNC-2026-R-08. We will run the Public Works employee cafe and cater city events. Our business address is ",
          },
          {
            text: "201 Hay Street, Fayetteville, NC 28301",
            claim: { id: "clm-cov-address", tag: "verified", proof: P.address },
          },
          { text: ". We are a " },
          {
            text: "woman-owned small business",
            claim: { id: "clm-cov-woman", tag: "verified", proof: P.woman },
          },
          { text: "." },
        ],
        [
          { text: "Our unique entity ID is " },
          { text: PERSONA.uei, claim: { id: "clm-cov-uei", tag: "verified", proof: P.uei } },
          { text: ". Our business phone is " },
          { text: PERSONA.phone, claim: { id: "clm-cov-phone", tag: "verified", proof: P.phone } },
          { text: ". " },
          {
            text: "Our federal tax ID is in the signature block",
            claim: {
              id: "clm-cov-taxid",
              tag: "unsupported",
              askId: "ask-city-vendor",
              gap: "[NEEDED: your federal tax ID]",
              resolvedText: "Our federal tax ID is in the signature block",
            },
          },
          { text: ". " },
          {
            text: `We have ${PERSONA.employeesW2} employees`,
            claim: {
              id: "clm-cov-staff",
              tag: "unsupported",
              askId: "ask-employees",
              gap: `[CONFIRM: do you still have ${PERSONA.employeesW2} employees?]`,
              resolvedText: `We have ${PERSONA.employeesW2} employees`,
            },
          },
          { text: ". The owner signs this letter and is the city's contact for this proposal." },
        ],
      ],
      challenges: [],
    },

    // ── Tab 2 ──
    {
      id: "sec-experience",
      title: "Experience and references",
      answers: S.tab2,
      criterionId: "cr-experience",
      points: 30,
      pageLimit: 4,
      pages: 3,
      paragraphs: [
        // Events come first: the approach is worth 40 points, and events are the
        // strongest evidence of it (Sarah Mitchell's first note).
        [
          { text: `Events are our strongest work. In ${year(CHURCH)}, we ` },
          {
            text: `catered 11 events for ${CHURCH.customerName}`,
            claim: { id: "clm-exp-church", tag: "verified", proof: P.pp3Scope },
          },
          { text: ". " },
          {
            text: "Events ran from 80 to 400 guests",
            claim: { id: "clm-exp-guests", tag: "verified", proof: P.pp3Scope },
          },
          { text: ". " },
          {
            text: "The team planned the menus, cooked on site, and provided servers, setup and clean-up",
            claim: { id: "clm-exp-full", tag: "verified", proof: P.pp3Service },
          },
          { text: ". " },
          {
            text: "We still cater events of this size today",
            claim: {
              id: "clm-exp-recent",
              tag: "unsupported",
              askId: "ask-recent-events",
              gap: "[NEEDED: your event jobs since 2022, with guest counts]",
              resolvedText:
                "Our event jobs since 2022, with guest counts, are listed in Appendix A",
            },
          },
          { text: "." },
        ],
        [
          {
            text: `Our closest match is the ${COUNTY.customerName} summer meals program. `,
          },
          {
            text: `In summer ${year(COUNTY)}, we were the prime contractor`,
            claim: { id: "clm-exp-prime", tag: "verified", proof: P.pp1Role },
          },
          { text: ". " },
          {
            text: "The team cooked and delivered 1,100 breakfasts and lunches a day to 9 sites",
            claim: { id: "clm-exp-volume", tag: "verified", proof: P.pp1Scope },
          },
          { text: " across Fayetteville. " },
          {
            text: `The contract was worth ${money(COUNTY.totalValue)}`,
            claim: { id: "clm-exp-value", tag: "verified", proof: P.pp1Value },
          },
          { text: ". " },
          {
            text: "Menus met USDA meal rules, and every tray had an allergen label",
            claim: { id: "clm-exp-rules", tag: "verified", proof: P.pp1Logs },
          },
          { text: "." },
        ],
        [
          { text: `In ${year(BRAGG)}, we ` },
          {
            text: "ran weekend and holiday meals at two Fort Bragg dining facilities",
            claim: { id: "clm-exp-bragg", tag: "verified", proof: P.pp2Scope },
          },
          { text: ". " },
          {
            text: `We worked under ${KEY_PARTNER.name} and did 30% of the work`,
            claim: { id: "clm-exp-share", tag: "verified", proof: P.pp2Role },
          },
          { text: ". We staffed " },
          {
            text: "a short-order line, a salad bar and the dish room",
            claim: { id: "clm-exp-line", tag: "verified", proof: P.pp2Line },
          },
          { text: ". " },
          {
            text: "We kept full HACCP food safety records",
            claim: { id: "clm-exp-haccp", tag: "verified", proof: P.pp2Line },
          },
          { text: "." },
        ],
        // One sentence names the three references, in the order of this section.
        // Sarah Mitchell's third note puts Janet Reyes first.
        [
          { text: "Our three references are on Form 5. They are " },
          {
            text: `${CHURCH.referenceName}, ${CHURCH.customerName}`,
            claim: { id: "clm-exp-ref3", tag: "verified", proof: P.pp3Ref },
          },
          { text: "; " },
          {
            text: ref(BRAGG),
            claim: { id: "clm-exp-ref2", tag: "verified", proof: P.pp2Ref },
          },
          { text: "; and " },
          {
            text: ref(COUNTY),
            claim: { id: "clm-exp-ref1", tag: "verified", proof: P.pp1Ref },
          },
          { text: "." },
        ],
      ],
      decisions: [
        {
          id: "dec-exp-lead",
          paragraphIndex: 1,
          choice: `Our closest match is the ${COUNTY.customerName} summer meals program.`,
          other: `Our most recent match is dining facility support at Fort Bragg in ${year(BRAGG)}. Our closest match in size is the ${COUNTY.customerName} summer meals program.`,
        },
      ],
      challenges: [
        {
          id: "ch-exp-lead",
          prompt: "Why lead with the school meals, not Fort Bragg?",
          reasoning:
            "The city scores work of similar size and scope. You were the prime on the school job, with daily volume like the cafe's. At Fort Bragg you did 30% of the work, under another company. An evaluator reads that as a smaller share of the job.",
          options: [
            {
              id: "opt-exp-lead-tie",
              label: "Keep the school job first, and tie it to the cafe",
              paragraphIndex: 1,
              redline: {
                remove: `Our closest match is the ${COUNTY.customerName} summer meals program.`,
                insert: [
                  {
                    text: `Our closest match is the ${COUNTY.customerName} summer meals program. Like the cafe, it meant hot meals every day, `,
                  },
                  {
                    text: "with daily temperature logs",
                    claim: { id: "clm-exp-r-logs", tag: "verified", proof: P.pp1Logs },
                  },
                  { text: "." },
                ],
              },
            },
            {
              id: "opt-exp-lead-bragg",
              label: "Lead with Fort Bragg, your most recent job",
              paragraphIndex: 1,
              redline: {
                remove: `Our closest match is the ${COUNTY.customerName} summer meals program.`,
                insert: [
                  { text: "Our most recent match is " },
                  {
                    text: `dining facility support at Fort Bragg in ${year(BRAGG)}`,
                    claim: { id: "clm-exp-r-bragg", tag: "verified", proof: P.pp2When },
                  },
                  {
                    text: `. Our closest match in size is the ${COUNTY.customerName} summer meals program.`,
                  },
                ],
              },
            },
          ],
        },
        {
          id: "ch-exp-events",
          prompt: "Why not mention our recent events?",
          reasoning: `Your record shows event work only in ${year(CHURCH)}. Ava can't prove anything newer. A claim with no proof stays out of what you submit.`,
          options: [
            {
              id: "opt-exp-events-add",
              label: "Add your event jobs since 2022",
              paragraphIndex: 0,
              needsAskId: "ask-recent-events",
              redline: {
                remove: "We still cater events of this size today.",
                insert: [
                  {
                    text: "Our event jobs since 2022 are listed in Appendix A",
                    claim: {
                      id: "clm-exp-r-events",
                      tag: "unsupported",
                      askId: "ask-recent-events",
                      gap: "[NEEDED: your event jobs since 2022]",
                      resolvedText:
                        "Our event jobs since 2022, with guest counts, are listed in Appendix A",
                    },
                  },
                  { text: "." },
                ],
              },
            },
            {
              id: "opt-exp-events-drop",
              label: "Drop the sentence until you can prove it",
              paragraphIndex: 0,
              redline: { remove: " We still cater events of this size today.", insert: [] },
            },
          ],
        },
      ],
    },

    // ── Tab 3 (approach, part one) ──
    {
      id: "sec-operations",
      title: "Operations and staffing plan",
      answers: S.tab3,
      criterionId: "cr-approach",
      points: 30,
      pageLimit: 10,
      pages: 11,
      paragraphs: [
        [
          {
            text: "Five people run the cafe and the city's events. Four are on our team today. One part-time server is a new hire. ",
          },
          {
            text: "One kitchen manager works on site 40 hours a week, every service day",
            claim: { id: "clm-ops-manager", tag: "commitment", commitmentId: "c-same-manager" },
          },
          { text: ". " },
          {
            text: "A certified backup covers when the manager is out",
            claim: {
              id: "clm-ops-backup",
              tag: "unsupported",
              askId: "ask-backup-manager",
              gap: "[NEEDED: who covers when the kitchen manager is out]",
              resolvedText: "A named backup covers the kitchen when the manager is out",
              resolvedTemplate:
                "When the manager is out, {backup-name}, {backup-role}, covers the kitchen",
            },
          },
          { text: ". " },
          {
            text: "Our kitchen manager is named in Appendix B",
            claim: {
              id: "clm-ops-named",
              tag: "unsupported",
              askId: "ask-resume",
              gap: "[NEEDED: your kitchen manager's name and resume]",
              resolvedText: "Our kitchen manager is named in Appendix B, with a resume",
            },
          },
          {
            text: ". One cook works 30 hours a week, from 7:30 AM to 1:30 PM. Two servers work 20 hours a week each. They also drive to events. The part-time server works 5 hours a week.",
          },
        ],
        [
          { text: "The kitchen manager starts at 7:00 AM, and the cook starts at 7:30 AM. " },
          {
            text: "Hot lunch is served from 11:00 AM to 1:30 PM, Monday to Friday",
            claim: { id: "clm-ops-lunch", tag: "commitment", commitmentId: "c-lunch" },
          },
          {
            text: ". Both servers work the line from 10:45 AM to 1:45 PM. That covers both crew breaks, at 11:00 AM and 12:00 PM. The kitchen manager counts meals from the city's badge scans each day.",
          },
        ],
        [
          {
            text: "Event orders come to one email address, which the kitchen manager reads twice a day. ",
          },
          {
            text: "We accept every event order placed with the notice time in Exhibit A",
            claim: { id: "clm-ops-notice", tag: "commitment", commitmentId: "c-event-notice" },
          },
          { text: ". " },
          {
            text: "Event food is made in the cafe kitchen, in the space Exhibit D shows",
            claim: {
              id: "clm-ops-kitchen",
              tag: "unsupported",
              askId: "ask-floorplan",
              gap: "[NEEDED: Exhibit D, to check the kitchen space]",
              resolvedText:
                "Event food is made in the cafe kitchen shown in Exhibit D, outside lunch hours",
            },
          },
          { text: ". The servers deliver the food, lay out the buffet, keep it hot, and clear. " },
          {
            text: "Events over 150 guests get extra staff from our team",
            claim: {
              id: "clm-ops-big-events",
              tag: "unsupported",
              askId: "ask-recent-events",
              gap: "[NEEDED: how you staffed your largest recent events]",
              resolvedText:
                "Events over 150 guests get extra staff, as in the jobs listed in Appendix A",
            },
          },
          { text: "." },
        ],
        // The answer to the question that Addendum 1 added to Tab 3.
        [
          { text: "Addendum 1 asks how we staff a workday that has an event. " },
          {
            text: "On that day, the manager, the cook and the part-time server keep the cafe open",
            claim: { id: "clm-ops-event-day", tag: "commitment", commitmentId: "c-event-day" },
          },
          {
            text: ". The two servers work the event. They take the food that the cafe kitchen made outside lunch hours.",
          },
        ],
        [
          { text: "If the cook is out, the kitchen manager cooks, and a server covers the line. " },
          {
            text: "Missed or wrong items are fixed the same day",
            claim: {
              id: "clm-ops-missed",
              tag: "unsupported",
              askId: "ask-food-safety",
              gap: "[NEEDED: how you fix missed items today]",
              resolvedText: "Missed or wrong items are logged and fixed before the next service",
            },
          },
          { text: ". " },
          {
            text: "We will not replace the kitchen manager without the city's written approval",
            claim: { id: "clm-ops-replace", tag: "commitment", commitmentId: "c-manager-replace" },
          },
          { text: ". " },
          {
            text: "We send one invoice a month, with daily meal and event counts",
            claim: { id: "clm-ops-invoice", tag: "commitment", commitmentId: "c-invoice" },
          },
          { text: "." },
        ],
      ],
      decisions: [
        {
          id: "dec-ops-badge",
          paragraphIndex: 1,
          choice: "The kitchen manager counts meals from the city's badge scans each day.",
          other: "The meal counts on our invoice are the city's own badge counts.",
        },
      ],
      challenges: [
        {
          id: "ch-ops-events",
          prompt: "Why say so little about large events?",
          reasoning: `Exhibit A allows events of up to 400 guests. The plan names two servers for events. An evaluator will ask who else works a large one. Your record shows 400-guest events, but only in ${year(CHURCH)}.`,
          options: [
            {
              id: "opt-ops-events-church",
              label: "Point to your church events of up to 400 guests",
              paragraphIndex: 2,
              redline: {
                remove: "Events over 150 guests get extra staff from our team.",
                insert: [
                  {
                    text: "We have catered events of up to 400 guests",
                    claim: { id: "clm-ops-r-church", tag: "verified", proof: P.pp3Scope },
                  },
                  { text: "." },
                ],
              },
            },
            {
              id: "opt-ops-events-recent",
              label: "Say how you staffed your largest recent events",
              paragraphIndex: 2,
              needsAskId: "ask-recent-events",
              redline: {
                remove: "Events over 150 guests get extra staff from our team.",
                insert: [
                  {
                    text: "Events over 150 guests get extra servers, as in our recent jobs",
                    claim: {
                      id: "clm-ops-r-recent",
                      tag: "unsupported",
                      askId: "ask-recent-events",
                      gap: "[NEEDED: how you staffed your largest recent events]",
                      resolvedText:
                        "Events over 150 guests get extra servers, as in the jobs listed in Appendix A",
                    },
                  },
                  { text: "." },
                ],
              },
            },
          ],
        },
        {
          id: "ch-ops-badge",
          prompt: "Why mention the city's badge scans?",
          reasoning:
            "Exhibit A pays by the city's own badge count. Your invoice uses the same count. The city sees its bills will match its records.",
          options: [
            {
              id: "opt-ops-badge-tie",
              label: "Tie the badge count to the invoice",
              paragraphIndex: 4,
              redline: {
                remove: "We send one invoice a month, with daily meal and event counts.",
                insert: [
                  {
                    text: "We send one invoice a month, with daily meal and event counts",
                    claim: {
                      id: "clm-ops-r-invoice",
                      tag: "commitment",
                      commitmentId: "c-invoice",
                    },
                  },
                  { text: ". The meal counts are the city's own badge counts." },
                ],
              },
            },
            {
              id: "opt-ops-badge-drop",
              label: "Remove the badge scan sentence",
              paragraphIndex: 1,
              redline: {
                remove: " The kitchen manager counts meals from the city's badge scans each day.",
                insert: [],
              },
            },
          ],
        },
      ],
    },

    // ── Tab 4 (approach, part two) ──
    {
      id: "sec-menu",
      title: "Menu and food safety",
      answers: S.tab4,
      criterionId: "cr-approach",
      points: 10,
      pageLimit: 3,
      pages: 2,
      paragraphs: [
        [
          {
            text: "The menu follows Exhibit A: a hot entrée and a vegetarian choice every day. It runs on a four-week cycle. ",
          },
          {
            text: "We cook halal menus in our own kitchen, and we label allergens as standard",
            claim: { id: "clm-menu-halal", tag: "confirmed", proof: P.halal },
          },
          { text: `. In ${year(WOMACK)}, we ` },
          {
            text: "cooked renal, diabetic and pureed diets to a dietitian's order at Womack Army Medical Center",
            claim: { id: "clm-menu-diets", tag: "verified", proof: P.pp4Diets },
          },
          { text: "." },
        ],
        [
          { text: "At the school meals program, " },
          {
            text: "we kept daily temperature logs",
            claim: { id: "clm-menu-logs", tag: "verified", proof: P.pp1Logs },
          },
          { text: ". " },
          {
            text: "Every tray had an allergen label",
            claim: { id: "clm-menu-labels", tag: "verified", proof: P.pp1Logs },
          },
          { text: ". " },
          {
            text: "At the cafe, the kitchen manager checks hot food every hour and logs it",
            claim: {
              id: "clm-menu-temps",
              tag: "unsupported",
              askId: "ask-food-safety",
              gap: "[NEEDED: how you check food temperatures today]",
              resolvedText:
                "At the cafe, the kitchen manager checks and logs hot food temperatures through each service",
            },
          },
          { text: ". Food below a safe temperature is reheated or thrown away." },
        ],
        [
          {
            text: "We will keep a Grade A score at every county inspection",
            claim: { id: "clm-menu-grade", tag: "commitment", commitmentId: "c-grade-a" },
          },
          { text: ". " },
          {
            text: "Our own kitchen holds a current Cumberland County food service permit",
            claim: {
              id: "clm-menu-permit",
              tag: "unsupported",
              askId: "ask-permit",
              gap: "[NEEDED: a copy of your county permit]",
              resolvedText:
                "Our own kitchen holds a current Cumberland County food service permit, attached",
            },
          },
          { text: "." },
        ],
      ],
      challenges: [
        {
          id: "ch-menu-grade",
          prompt: "Why promise Grade A without showing a score?",
          reasoning:
            "Tab 4 asks for your inspection history. Ava has no inspection report yet. A promise with no past score is weaker.",
          options: [
            {
              id: "opt-menu-grade-report",
              label: "Add your kitchen's last inspection score",
              paragraphIndex: 2,
              needsAskId: "ask-permit",
              redline: {
                remove: "We will keep a Grade A score at every county inspection.",
                insert: [
                  {
                    text: "We will keep a Grade A score at every county inspection",
                    claim: { id: "clm-menu-r-grade", tag: "commitment", commitmentId: "c-grade-a" },
                  },
                  { text: ". " },
                  {
                    text: "Our own kitchen's last inspection score is on the attached report",
                    claim: {
                      id: "clm-menu-r-score",
                      tag: "unsupported",
                      askId: "ask-permit",
                      gap: "[NEEDED: your last inspection report]",
                      resolvedText:
                        "Our own kitchen's last inspection score is on the attached report",
                    },
                  },
                  { text: "." },
                ],
              },
            },
            {
              id: "opt-menu-grade-logs",
              label: "Point to your school program logs instead",
              paragraphIndex: 2,
              redline: {
                remove: "We will keep a Grade A score at every county inspection.",
                insert: [
                  {
                    text: "We will keep a Grade A score at every county inspection",
                    claim: {
                      id: "clm-menu-r-grade2",
                      tag: "commitment",
                      commitmentId: "c-grade-a",
                    },
                  },
                  { text: ". At the school meals program, " },
                  {
                    text: "we kept temperature logs every day at 9 sites",
                    claim: { id: "clm-menu-r-logs", tag: "verified", proof: P.pp1Sites },
                  },
                  { text: "." },
                ],
              },
            },
          ],
        },
      ],
    },
  ],

  price: {
    sheetName: "Exhibit B, the city's price sheet",
    sheetFileId: "f-exb",
    contractType: "Unit prices, fixed for year one, up to 3% a year after",
    contractTypeSource: S.pricing,
    weeks: 50,
    // ONE staffing plan: Tab 3 describes these same people and hours.
    roles: [
      {
        id: "role-manager",
        name: "Kitchen manager",
        count: 1,
        hoursPerWeek: 40,
        pay: { askId: "ask-pay-rates", fieldId: "pay-manager" },
      },
      {
        id: "role-cook",
        name: "Cook",
        count: 1,
        hoursPerWeek: 30,
        pay: { askId: "ask-pay-rates", fieldId: "pay-cook" },
      },
      {
        id: "role-server",
        name: "Server and driver",
        count: 2,
        hoursPerWeek: 20,
        pay: { askId: "ask-pay-rates", fieldId: "pay-server" },
      },
      // The one new hire: Addendum 1's staffing answer (promise c-event-day).
      {
        id: "role-part-time",
        name: "Part-time server (new hire)",
        count: 1,
        hoursPerWeek: 5,
        pay: { askId: "ask-pay-rates", fieldId: "pay-server" },
      },
    ],
    burden: [
      {
        id: "b-fica",
        label: "Social Security and Medicare",
        from: { kind: "law", rate: 7.65, text: "Set by federal law" },
      },
      {
        id: "b-unemployment",
        label: "Unemployment taxes",
        from: {
          kind: "ask",
          askId: "ask-payroll",
          fieldId: "unemployment-rate",
          text: "Your payroll report, 2025",
        },
      },
      {
        id: "b-wc",
        label: "Workers' comp",
        from: {
          kind: "ask",
          askId: "ask-payroll",
          fieldId: "wc-rate",
          text: "Your payroll report, 2025",
        },
      },
      {
        id: "b-leave",
        label: "Paid leave and benefits",
        from: {
          kind: "ask",
          askId: "ask-payroll",
          fieldId: "leave-rate",
          text: "Your payroll report, 2025",
        },
      },
    ],
    lines: [
      {
        id: "line-lunch",
        item: "Weekday hot lunch, per meal",
        unit: "per meal",
        qty: QTY.lunch,
        qtySource: S.qtyLunch,
        laborShare: 0.75,
        direct: {
          askId: "ask-food-cost",
          fieldId: "food-lunch",
          label: "Food and packaging, one lunch",
        },
      },
      {
        id: "line-guest",
        item: "Catered event, per guest",
        unit: "per guest",
        qty: QTY.guest,
        qtySource: S.qtyGuest,
        laborShare: 0.15,
        direct: {
          askId: "ask-food-cost",
          fieldId: "food-guest",
          label: "Food and serving ware, one guest",
        },
      },
      {
        id: "line-delivery",
        item: "Event delivery and setup, per event",
        unit: "per event",
        qty: QTY.event,
        qtySource: S.qtyEvent,
        laborShare: 0.1,
      },
    ],
    overhead: {
      askId: "ask-pl",
      fieldId: "overhead-rate",
      text: "Costs no single job carries: rent, utilities, office and admin. From your 2025 books.",
    },
    profit: { askId: "ask-profit", fieldId: "profit-rate" },
    contingency: { askId: "ask-contingency", fieldId: "contingency" },
    otherCosts: [
      {
        id: "oc-insurance",
        label: "Adding the city to your insurance",
        yearly: {
          kind: "ask",
          askId: "ask-insurance",
          fieldId: "ins-added-cost",
          text: "From your agent's note with the certificate",
        },
        inPrice: true,
        // "Buy the coverage now": the cost is the premium on the agent's quote.
        altFrom: { askId: "ask-insurance-quote", fieldId: "ins-quote-premium" },
      },
      {
        id: "oc-vehicle",
        label: "Vehicle fuel and upkeep for event runs",
        yearly: {
          kind: "ask",
          askId: "ask-other-costs",
          fieldId: "cost-vehicle",
          text: "Your own figure, for the city's 20 events a year",
        },
        inPrice: true,
      },
      {
        id: "oc-permit",
        label: "County permit for the cafe kitchen",
        yearly: {
          kind: "ask",
          askId: "ask-other-costs",
          fieldId: "cost-permit",
          text: "Your own figure. Section 7.2 needs this permit.",
        },
        inPrice: true,
      },
      {
        id: "oc-renewal",
        label: "Renewal of the manager's food safety certificate",
        yearly: {
          kind: "ask",
          askId: "ask-other-costs",
          fieldId: "cost-renewal",
          text: "Your own figure, if the certificate expires during year one",
        },
        inPrice: false,
      },
    ],
    points: { max: 30 },
    payment: {
      text: "The city pays 30 days after a correct invoice. Your first payment comes about 60 days after you start.",
      source: S.payment,
    },
  },

  forms: [
    {
      id: "form-cover",
      name: "Proposal Cover Sheet (Form 1)",
      source: S.form1,
      handling: ["ava-fills", "you-sign"],
      signer: "The owner",
      filledFrom: "Your registration, your profile, and the vendor number and tax ID you enter",
    },
    {
      id: "form-noncollusion",
      name: "Non-Collusion Affidavit (Form 2)",
      source: S.form2,
      handling: ["you-sign", "notary"],
      signer: "The owner, in front of a notary",
    },
    {
      id: "form-everify",
      name: "E-Verify Affidavit (Form 3)",
      source: S.form3,
      handling: ["you-sign", "notary"],
      signer: "The owner, in front of a notary",
    },
    {
      id: "form-iran",
      name: "Iran Divestment Act Certification (Form 4)",
      source: S.form4,
      handling: ["you-sign"],
      signer: "The owner",
    },
    {
      id: "form-references",
      name: "References (Form 5)",
      source: S.form5,
      handling: ["ava-fills"],
      filledFrom: "Your 3 approved past jobs, and the contact details your references give",
    },
    {
      id: "form-w9",
      name: "IRS Form W-9",
      source: S.forms,
      handling: ["ava-fills", "you-sign"],
      signer: "The owner",
      filledFrom: "Your legal name and address, and the tax ID you enter",
    },
    {
      id: "form-ack1",
      name: "Addendum 1 Acknowledgment",
      source: S.a1Ack,
      handling: ["ava-fills", "you-sign"],
      signer: "The owner",
      filledFrom: "Your legal name and the addendum number",
      acknowledgesAddendumId: "add-1",
    },
    {
      id: "form-ack2",
      name: "Addendum 2 Acknowledgment",
      source: S.a2Ack,
      handling: ["ava-fills", "you-sign"],
      signer: "The owner",
      filledFrom: "Your legal name and the addendum number",
      acknowledgesAddendumId: "add-2",
    },
    {
      id: "form-insurance",
      name: "Certificate of Insurance",
      source: S.insurance,
      handling: ["someone-else"],
      providedBy: "Your insurance agent",
      askId: "ask-insurance",
    },
  ],

  submission: {
    method: "portal",
    where: "The City of Fayetteville vendor portal",
    account: "Your city vendor portal login, the same one that opens Exhibit D",
    source: S.submit,
    limits: "25 MB per file, PDF only. The price sheet stays in the city's Excel file.",
    files: [
      {
        id: "pkg-proposal",
        name: `1_Proposal_${FILE_NAME}.pdf`,
        covers: "§5.3, Tabs 1 to 4",
        contains: [
          { kind: "section", id: "sec-cover" },
          { kind: "section", id: "sec-experience" },
          { kind: "section", id: "sec-operations" },
          { kind: "section", id: "sec-menu" },
          { kind: "upload", id: "ask-recent-events" },
          { kind: "upload", id: "ask-resume" },
        ],
      },
      {
        id: "pkg-price",
        name: `2_PriceSheet_${FILE_NAME}.xlsx`,
        covers: "Exhibit B",
        contains: [{ kind: "price", id: "price" }],
      },
      {
        id: "pkg-forms",
        name: `3_Forms_${FILE_NAME}.pdf`,
        covers: "§5.4, Forms 1 to 5, W-9 and addenda",
        contains: [
          { kind: "form", id: "form-cover" },
          { kind: "form", id: "form-noncollusion" },
          { kind: "form", id: "form-everify" },
          { kind: "form", id: "form-iran" },
          { kind: "form", id: "form-references" },
          { kind: "form", id: "form-w9" },
          { kind: "form", id: "form-ack1" },
          { kind: "form", id: "form-ack2" },
        ],
      },
      {
        id: "pkg-certificates",
        name: `4_Certificates_${FILE_NAME}.pdf`,
        covers: "§7.2 to §7.4",
        contains: [
          { kind: "form", id: "form-insurance" },
          { kind: "upload", id: "ask-permit" },
          { kind: "upload", id: "ask-servsafe" },
        ],
      },
    ],
    markings: [
      "Pages you mark as trade secret: “CONFIDENTIAL — TRADE SECRET” at the top, per §9.4",
      "Cover page, per Exhibit C: “FAYNC-2026-R-08, Employee Cafe and Event Catering Services”. Then your legal name.",
      "File names: number, content and company, as in “1_Proposal_CompanyName.pdf”, per §4.3",
    ],
    checklist: [
      {
        // Past. She told Ava her company went and signed in.
        id: "ck-site-visit",
        label: `Site visit on ${D(VISIT)}: your company signed the attendance sheet`,
        auto: true,
      },
      {
        id: "ck-internal",
        label: "Internal deadline: one day before the city's deadline",
        auto: true,
      },
      {
        id: "ck-test",
        label: "Test upload on the city's vendor portal, two days before the deadline",
      },
      {
        id: "ck-sign",
        label:
          "Sign forms 1 to 4, the W-9 and each addendum form. Sign forms 2 and 3 in front of a notary.",
      },
      { id: "ck-read", label: "Read what you're certifying: 8 statements, about 30 minutes" },
      {
        id: "ck-upload",
        label: "Upload the 4 files on the city's vendor portal by 2:00 PM Eastern Time",
      },
      {
        id: "ck-receipt",
        label: "Upload the portal's receipt here, so the bid counts as submitted",
      },
    ],
    certifying: [
      "You did not agree on prices or terms with any other bidder.",
      "No city officer or employee has a money interest in this proposal.",
      "Your company follows North Carolina's E-Verify law, or has fewer than 25 employees there.",
      "Your company is not on the North Carolina Treasurer's Iran divestment list.",
      "Your prices hold for 90 days after the due date.",
      "Your insurance meets Section 7.4 and names the city.",
      `Someone from your company attended the site visit on ${D(VISIT)}.`,
      "Every fact about your company in the proposal is true.",
    ],
  },

  reviewerFindings: [
    {
      id: "rf-backup-manager",
      sectionId: "sec-operations",
      criterionId: "cr-approach",
      quote: "One kitchen manager works on site 40 hours a week, every service day.",
      finding:
        "Exhibit A needs the kitchen manager on site at every service. The plan names one person. An evaluator would have to guess who covers sick days and leave.",
      suggestedFix: "Name a certified backup manager, and say how they are called in.",
      severity: "material",
      askId: "ask-backup-manager",
    },
    {
      id: "rf-menu-restates",
      sectionId: "sec-menu",
      criterionId: "cr-approach",
      quote: "The menu follows Exhibit A: a hot entrée and a vegetarian choice every day.",
      finding:
        "This line repeats Exhibit A. It tells an evaluator nothing about your food, or how the cycle changes.",
      suggestedFix: "Name dishes you cook now, and how often each returns in the four-week cycle.",
      severity: "minor",
    },
  ],

  addenda: [
    {
      // Posted before Ava started. It moved the due date to day 14 and added a
      // question on staffing. Tab 3 answers the question (promise c-event-day).
      id: "add-1",
      number: 1,
      fileId: "f-add1",
      postedDaysFromNow: A1_POSTED,
      arrivesDuringBuild: false,
      otherChanges: 0,
      changes: [
        {
          id: "a1-due",
          what: "Due date",
          source: S.a1Due,
          before: `${D(OLD_DUE)}, 2:00 PM Eastern Time`,
          now: `${D(DAYS.due)}, 2:00 PM Eastern Time`,
          effect: "updated",
          effectText: "Ava used the new due date for every deadline in your bid.",
          patch: { kind: "due", dueDaysFromNow: DAYS.due, time: "2:00 PM", time24: "14:00" },
        },
        {
          id: "a1-staffing",
          what: "A new question on staffing",
          source: S.a1Staffing,
          before: "The RFP did not ask how you staff a day with an event.",
          now: "Tab 3 must say who works the cafe and who works the event on one day.",
          effect: "updated",
          effectText:
            "Your answer is in part 3. It adds one promise and one part-time server to your staffing plan.",
          patch: { kind: "none" },
        },
      ],
      stillValid: "The page limits, price sheet, insurance and forms did not change.",
    },
    {
      id: "add-2",
      number: 2,
      fileId: "f-add2",
      postedDaysFromNow: A2_POSTED,
      arrivesDuringBuild: true,
      otherChanges: 3,
      changes: [
        {
          id: "a2-due",
          what: "Due date",
          source: S.a2Due,
          before: `${D(DAYS.due)}, 2:00 PM Eastern Time`,
          now: `${D(A2_DUE)}, 2:00 PM Eastern Time`,
          effect: "updated",
          effectText: "Ava moved your checklist and ask dates.",
          patch: { kind: "due", dueDaysFromNow: A2_DUE, time: "2:00 PM", time24: "14:00" },
        },
        {
          id: "a2-notice",
          what: "Notice for event orders",
          source: S.a2Notice,
          before: "5 business days",
          now: "3 business days",
          effect: "reopened",
          effectText: "Your approval was for 5 business days. The city now asks for 3.",
          // Tab 3 says "the notice time in Exhibit A", which Addendum 2 revises.
          draftUnchanged: "The writing does not name the number of days. It points to Exhibit A.",
          patch: {
            kind: "commitment",
            commitmentId: "c-event-notice",
            text: "Cater city events ordered 3 business days ahead, for 20 to 400 guests",
            pricedAs:
              "Priced as: 5 hours a week for each server. Shorter notice may mean overtime, not priced yet.",
          },
        },
        {
          id: "a2-guests",
          what: "Event guests, year one estimate",
          source: S.a2Guests,
          before: `${num(QTY.guest)} guests`,
          now: `${num(QTY.guestAfterA2)} guests`,
          effect: "reopened",
          effectText: `Your price sheet total changes. Ava ran the price again with ${num(QTY.guestAfterA2)} guests.`,
          patch: { kind: "price-qty", lineId: "line-guest", qty: QTY.guestAfterA2 },
        },
        {
          id: "a2-ack",
          what: "Acknowledgment form",
          source: S.a2Ack,
          before: "No form",
          now: "Sign and return the Addendum 2 form",
          effect: "updated",
          effectText: "Ava added the form to your forms file.",
          patch: { kind: "none" },
        },
      ],
      stillValid:
        "Page limits, insurance, references, the permit and the site visit did not change. The page limit question is still open.",
    },
  ],

  // Page 1 facts that no other part of the bid carries. A null is a fact the
  // city's files do not state: page 1 shows "Not stated".
  overview: {
    noticeType: {
      text: "Request for Proposals. Written proposals are scored for points.",
      source: S.award,
    },
    summary: {
      text: "Run the employee cafe at the Public Works campus, and cater city events.",
      source: S.lunch,
    },
    work: [
      { text: "Hot lunch in the cafe on each city workday.", source: S.lunch },
      {
        text: "Catered events for 20 to 400 guests at city buildings, about 20 a year.",
        source: S.eventCount,
      },
      {
        text: "Delivery, buffet setup, hot holding and clean-up at each event.",
        source: S.eventCount,
      },
      { text: "Food temperatures checked and recorded at every service.", source: S.foodSafety },
      { text: "A Grade A sanitation rating at all times.", source: S.gradeA },
    ],
    place: {
      text: "The cafe at the Public Works campus, and city buildings for events.",
      source: S.siteVisit,
    },
    hours: { text: "Lunch from 11:00 AM to 1:30 PM on each city workday.", source: S.lunch },
    staffing: {
      text: "A named kitchen manager, on site during all cafe hours. The city approves any change.",
      source: S.keyPerson,
    },
    serviceLevels: {
      text: "A Grade A rating at all times. A lower rating is fixed within 10 days.",
      source: S.gradeA,
    },
    outOfScope: null,
    term: {
      text: "Twelve months from the notice to proceed. The city may renew it twice, one year each.",
      source: S.term,
    },
    estimatedValue: null,
    penalties: null,
    contact: {
      name: "Patricia Boyd",
      role: "Procurement Officer, City of Fayetteville",
      email: "patricia.boyd@fayettevillenc.gov",
      source: S.questions,
    },
    questionsChannel: { text: "By email only, to Patricia Boyd.", source: S.questions },
    noContact: null,
    buyerPortal: {
      text: "The city's vendor portal. A free account opens Exhibit D and the upload.",
      source: S.portal,
    },
    dates: [
      {
        id: "site-visit",
        label: "Site visit at the Public Works campus cafe",
        daysFromNow: VISIT,
        time: "10:00 AM",
        mandatory: true,
        source: S.siteVisit,
      },
    ],
    expectedAward: null,
    start: null,
    validity: { text: "Proposals stay valid for 90 days after the due date.", source: S.validity },
    setAside: { text: "Open to all qualified businesses. There is no set-aside.", source: S.open },
    size: null,
    lateRule: { text: "The city does not accept late proposals.", source: S.late },
  },

  samLegalName: PERSONA.businessName,
  nameInDraft: "Haddad Catering and Food Services",
};

/** What Ava tells Grant the first time this bid opens (lib/ava/grant.ts,
 *  passToGrant): her answer on the site visit, and her proof for each rule that
 *  Grant also checks. The bid starts with all of it answered. Put these in the
 *  seeds of demo/ava/grantFacts.ts, and opening the page writes nothing. */
export const fayettevilleGrantFacts: Record<string, string> = {
  "fy-site": "Yes",
  "proof:gf-site": PROOF_SAYS.siteVisit,
  "proof:gf-vendor": PROOF_SAYS.vendor,
  "proof:gf-insurance": PROOF_SAYS.insurance,
};

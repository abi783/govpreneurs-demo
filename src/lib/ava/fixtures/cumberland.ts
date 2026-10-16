// Cumberland County, NC: inmate meal service at the Detention Annex.
//
// A sealed Invitation for Bid. The lowest responsive, responsible bidder wins.
// This bid shows that Ava does not write where writing earns nothing: no draft
// sections, no win themes, no reviewer findings. The work is the price, the
// forms, the bonds and the logistics of a paper bid.
//
// The bid request, its attachments and every quotation below are invented for
// the demo. The county's contacts are invented people. Every fact about the
// member comes from PERSONA (src/demo/story/persona.ts). A fact that PERSONA
// does not hold is an Ask, never a value.
//
// Dates: this file never types a calendar date. Every date is a day offset
// from the demo clock (when.ts). The story fixes three of them: the notice
// posted 6 days ago, the pre-bid conference in 4 days, the bids due in 20 days.
// Questions are due on day 11, and the Purchasing Office is closed on day 18.
//
// The first start (src/lib/ava/starts/cumberland.ts) pauses this bid at the
// rule "Food-handler certificate for every cook": 3 of the 5 cooks hold one.

import { buyerPeople } from "../../../demo/ava/contacts";
import { getOpportunity } from "../../../demo/story/opportunities";
import { getGrantBrief } from "../../../demo/story/grantBriefs";
import { PAST_PERFORMANCE, PERSONA } from "../../../demo/story/persona";
import { doc } from "../build";
import type { BidState } from "../store";
import type { AvaBid } from "../types";
import { D, DM, ET_OFFSET, SAM_ACTIVE_UNTIL, USWD, WD, WDM } from "./when";

// ─── What the story fixes ───

const NOTICE = "CUMCO-2026-014";
const STORY = getOpportunity(NOTICE)!;
/** The county's buyer: the person the opportunity page names. */
const BUYER = buyerPeople(NOTICE).primary;
const GRANT_DATES = getGrantBrief(NOTICE)!.keyDates;
const inDays = (label: string) => GRANT_DATES.find((k) => k.label === label)!.inDays;

/** The notice posted this many days ago. */
const POSTED = -STORY.postedDaysAgo;
/** The bids are due in this many days. */
const DUE = STORY.closesInDays;
/** The pre-bid conference is in this many days. */
const PREBID = inDays("Pre-bid conference");
/** Questions are due this many days from now, before the due date. */
const QUESTIONS = 11;
/** The Purchasing Office is closed this many days from now. */
const CLOSED = DUE - 2;

// The member, from PERSONA.
const COOKS = PERSONA.employeesW2;
const COOKS_CERTIFIED = PERSONA.foodHandlerCertified;
const COOKS_MISSING = COOKS - COOKS_CERTIFIED;
const BONDED_UP_TO = `$${PERSONA.largestBond.toLocaleString("en-US")}`;
const pastJob = (id: (typeof PAST_PERFORMANCE)[number]["id"]) =>
  PAST_PERFORMANCE.find((p) => p.id === id)!;
const SCHOOLS = pastJob("pp-county-schools");
const FORT_BRAGG = pastJob("pp-cdg-sub");
const WOMACK = pastJob("pp-womack");
const CHURCH = pastJob("pp-church");
/** The summer meals job served this many meals a day (persona.ts, scopeDescription). */
const SCHOOL_MEALS = 1_100;
const yearOf = (p: (typeof PAST_PERFORMANCE)[number]) => p.periodStart.slice(0, 4);

// The county's quantities. The annex has 240 beds. About 100 people sleep
// there on an average day, and Addendum 1 raises that to 110.
const BEDS = 240;
const POPULATION = 100;
const POPULATION_AFTER = 110;
const MEALS_A_DAY = 3;
const DAYS_A_YEAR = 365;
const DIET_QTY = 7_300;
const DIET_QTY_AFTER = 8_000;
const yearlyMeals = (people: number) => people * MEALS_A_DAY * DAYS_A_YEAR;
const REGULAR_QTY = yearlyMeals(POPULATION) - DIET_QTY;
const REGULAR_QTY_AFTER = yearlyMeals(POPULATION_AFTER) - DIET_QTY_AFTER;
const num = (n: number) => n.toLocaleString("en-US");

// The crew Ava prices. All 5 of her employees cook: a kitchen lead and 4
// cooks. The county's food-handler rule covers each of them. The plan makes
// one hire: a part-time driver.
const CREW = { cooks: COOKS - 1, cookHours: 24, leadHours: 40, driverHours: 24 };

// ─── The buyer's files ───

const IFB = "f-ifb";
const ATT_A = "f-att-a";
const ATT_B = "f-att-b";
const FORMS = "f-forms";
const MENU = "f-menu-scan";
const ADD1 = "f-add1";

// ─── The buyer's words, quoted once and reused ───

// Bid request (IFB), 18 pages.
const S_DUE = doc(
  IFB,
  "Section 3.1, page 4",
  "§3.1",
  `Sealed bids will be received in the Purchasing Office, Room 214, County Administration Building, 125 Russell Street, Fayetteville, NC 28301, until 2:00 PM Eastern Time on ${USWD(DUE)}, and then publicly opened and read aloud in Conference Room 3A.`,
);
const S_CLOSED = doc(
  IFB,
  "Section 2.1, page 3",
  "§2.1",
  `The Purchasing Office will be closed on ${USWD(CLOSED)} for a County holiday.`,
);
const S_PREBID = doc(
  IFB,
  "Section 2.2, page 3",
  "§2.2",
  `A MANDATORY pre-bid conference will be held at 10:00 AM on ${USWD(PREBID)}, in the front lobby of the Detention Annex. Bids will not be accepted from any bidder whose representative did not sign the attendance sheet.`,
);
const S_QUESTIONS = doc(
  IFB,
  "Section 2.3, page 3",
  "§2.3",
  `Questions shall be submitted in writing by email only to ${BUYER.name}, ${BUYER.title}, ${BUYER.email}, no later than 5:00 PM Eastern Time on ${USWD(QUESTIONS)}. Answers will be issued by addendum.`,
);
const S_DEPOSIT = doc(
  IFB,
  "Section 3.2, page 4",
  "§3.2",
  "Each bid shall be accompanied by a bid deposit of not less than five percent (5%) of the Total Bid, in the form of a bid bond by a surety licensed in North Carolina or a certified or cashier's check payable to Cumberland County.",
);
const S_DEPOSIT_NONE = doc(
  IFB,
  "Section 3.2, page 4",
  "§3.2",
  "Bids not accompanied by a bid deposit will not be considered.",
);
const S_DEPOSIT_RETURN = doc(
  IFB,
  "Section 3.2, page 4",
  "§3.2",
  "Certified or cashier's checks of unsuccessful bidders will be returned after award.",
);
const S_PERF = doc(
  IFB,
  "Section 3.3, page 5",
  "§3.3",
  "The successful bidder shall furnish a combined performance and payment bond of fifty percent (50%) of the first-year contract price within ten (10) days of notice of award. Each bid shall include a letter from a surety stating that it will issue this bond if the bidder is awarded the contract.",
);
const S_PERF_NONE = doc(
  IFB,
  "Section 3.3, page 5",
  "§3.3",
  "No substitute for the performance and payment bond will be accepted.",
);
const S_PACKAGE = doc(
  IFB,
  "Section 3.4, page 5",
  "§3.4",
  `Submit one (1) original marked "ORIGINAL" and two (2) copies marked "COPY" in one sealed envelope, marked on the outside "SEALED BID – IFB No. ${NOTICE} – Inmate Meal Service – DO NOT OPEN" with the bid opening date and the bidder's name and address.`,
);
const S_SIGN = doc(
  IFB,
  "Section 3.5, page 5",
  "§3.5",
  "The Bid Form and all affidavits shall be signed in blue ink by an owner or officer authorized to bind the bidder. The Non-Collusion Affidavit and the E-Verify Affidavit shall be notarized.",
);
const S_ADDENDA = doc(
  IFB,
  "Section 3.6, page 6",
  "§3.6",
  "Bidders shall acknowledge each addendum by signing and returning its acknowledgment form with the bid. Failure to acknowledge an addendum may cause the bid to be rejected.",
);
const S_FIRM = doc(
  IFB,
  "Section 3.7, page 6",
  "§3.7",
  "Bids shall remain firm for sixty (60) days after the bid opening.",
);
const S_NO_EMAIL = doc(
  IFB,
  "Section 3.8, page 6",
  "§3.8",
  "Bids submitted by email or fax will not be accepted. Bids may be delivered by hand, courier or mail. Bids received after the time set for opening will be returned unopened.",
);
const S_RESPONSIBLE = doc(
  IFB,
  "Section 4.1, page 7",
  "§4.1",
  "Before award, the County will determine whether the low bidder is responsible, including verification of references, permits, certifications and the ability to furnish the required bonds.",
);
const S_REFS = doc(
  IFB,
  "Section 4.2, page 7",
  "§4.2",
  "Provide three (3) references for institutional food service (correctional, school, hospital or military dining) performed by the bidder, as prime contractor or subcontractor, of not less than 100 meals per day within the past five (5) years.",
);
const S_REFS_NONE = doc(
  IFB,
  "Section 4.2, page 7",
  "§4.2",
  "References for work performed by an affiliate, parent company or proposed subcontractor of the bidder will not be accepted.",
);
const S_PERMIT = doc(
  IFB,
  "Section 4.3, page 8",
  "§4.3",
  "The bidder shall hold a current food establishment permit issued by the local health department for the kitchen where meals will be prepared. Include a copy of the permit with the bid.",
);
const S_CFPM = doc(
  IFB,
  "Section 4.4, page 8",
  "§4.4",
  "The bidder shall employ at least one Certified Food Protection Manager, from an ANSI-accredited program, who supervises all food preparation for this contract. Include a copy of the certificate with the bid.",
);
const S_FOODHANDLER = doc(
  IFB,
  "Section 4.5, page 8",
  "§4.5",
  "Every cook who prepares meals for this contract shall hold a current food-handler certificate (ServSafe Food Handler or an equal ANSI-accredited program). Include a copy of each certificate with the bid.",
);
const S_FOODHANDLER_NONE = doc(
  IFB,
  "Section 4.5, page 8",
  "§4.5",
  "A bid that does not include a certificate for every cook will be rejected.",
);
const S_DELIVERY = doc(
  IFB,
  "Section 5.3, page 9",
  "§5.3",
  "Meals shall be delivered to the Detention Annex loading dock in sealed, insulated, heated carts. Hot food shall be at or above 135°F on arrival. The Contractor shall provide the delivery vehicle.",
);
const S_TRAYS_IFB = doc(
  IFB,
  "Section 5.4, page 10",
  "§5.4",
  "The Contractor shall furnish all disposable trays, cups, utensils and napkins required for meal service.",
);
const S_EMERGENCY = doc(
  IFB,
  "Section 5.6, page 10",
  "§5.6",
  "When the County declares an emergency, the Contractor shall deliver ready-to-eat meals for the full population to the Detention Annex within two (2) hours of the County's call, at any hour.",
);
const S_BACKGROUND = doc(
  IFB,
  "Section 5.7, page 11",
  "§5.7",
  "Each Contractor employee who enters the Detention Annex shall first pass a criminal background check by the Cumberland County Sheriff's Office, at no cost to the Contractor. Allow ten (10) business days for each check.",
);
const S_PRICE_FIRM = doc(
  IFB,
  "Section 6.2, page 12",
  "§6.2",
  "Unit prices shall be firm for the first twelve (12) months of the contract. The County will pay only for meals ordered and delivered.",
);
const S_QTY = doc(
  IFB,
  "Section 6.3, page 12",
  "§6.3",
  `The Detention Annex has ${BEDS} beds. The estimated average daily inmate population is ${POPULATION}. Quantities on Attachment B are estimates for bidding purposes only and are not guaranteed.`,
);
const S_TAX = doc(
  IFB,
  "Section 6.4, page 12",
  "§6.4",
  "Bid prices shall include all applicable federal, state and local taxes, fees and charges.",
);
const S_RENEW = doc(
  IFB,
  "Section 6.5, page 13",
  "§6.5",
  "The contract may be renewed for up to four (4) additional one-year periods by mutual agreement. Any price increase at renewal shall not exceed four percent (4%).",
);
const S_PAY = doc(
  IFB,
  "Section 6.6, page 13",
  "§6.6",
  "The Contractor shall invoice monthly. The County will pay within thirty (30) days after it receives and approves a correct invoice.",
);
const S_EXTENSION = doc(
  IFB,
  "Section 6.7, page 13",
  "§6.7",
  "In case of a discrepancy between a unit price and an extended total, the unit price shall govern.",
);
const S_AWARD = doc(
  IFB,
  "Section 7.1, page 14",
  "§7.1",
  "Award will be made to the lowest responsive, responsible bidder, based on the Total Bid shown on Attachment B, Bid Form and Price Schedule.",
);
const S_RESPONSIVE = doc(
  IFB,
  "Section 7.2, page 14",
  "§7.2",
  "A bid is responsive if it is complete, signed and conforms in all material respects to this IFB. Bids missing any required form, signature, notarization or bid deposit will be rejected.",
);
const S_OPENING = doc(
  IFB,
  "Section 7.3, page 14",
  "§7.3",
  "Bids will be opened publicly and read aloud. Bid prices become public record at the opening. Bidders may attend.",
);
const S_INSURANCE = doc(
  IFB,
  "Section 8.1, page 15",
  "§8.1",
  "Within ten (10) days after notice of award, the Contractor shall provide certificates of insurance naming Cumberland County as additional insured: general liability $1,000,000 per occurrence and $2,000,000 aggregate; automobile liability $1,000,000; workers' compensation as required by law.",
);
const S_EVERIFY = doc(
  IFB,
  "Section 9.1, page 16",
  "§9.1",
  "Each bidder shall submit the E-Verify Affidavit (Form C-2), stating that it uses E-Verify as North Carolina law requires, or that it employs fewer than twenty-five (25) employees in North Carolina.",
);
const S_W9 = doc(
  IFB,
  "Section 9.2, page 16",
  "§9.2",
  "Each bidder shall include a completed IRS Form W-9. The successful bidder will be added to the County's vendor file before any payment is made.",
);
const S_IRAN = doc(
  IFB,
  "Section 9.3, page 16",
  "§9.3",
  "Each bidder shall certify on Form C-3 that it is not listed on the Final Divestment List created by the North Carolina State Treasurer under the Iran Divestment Act.",
);
const S_TERMINATE = doc(
  IFB,
  "Section 9.4, page 17",
  "§9.4",
  "The County may terminate the contract for convenience upon thirty (30) days' written notice to the Contractor.",
);

// Attachment A, meal specifications and menu cycle, 9 pages.
const S_MEALS = doc(
  ATT_A,
  "Section 2.1, page 2",
  "Att. A §2.1",
  "Three meals shall be delivered daily, 365 days per year: breakfast no later than 5:30 AM, lunch no later than 11:00 AM, and dinner no later than 4:30 PM.",
);
const S_CALORIES = doc(
  ATT_A,
  "Section 3.1, page 3",
  "Att. A §3.1",
  "Menus shall provide an average of not less than 2,500 calories per day and follow the 5-week cycle menu in Section 7.",
);
const S_DIETS = doc(
  ATT_A,
  "Section 4.1, page 5",
  "Att. A §4.1",
  "The Contractor shall provide therapeutic diets as ordered in writing by Detention Annex medical staff, and religious diets as approved by the Chaplain, no later than 24 hours after the order is received.",
);
const S_TRAYS_ATT = doc(
  ATT_A,
  "Section 5.1, page 6",
  "Att. A §5.1",
  "Meals shall be served on County-owned insulated trays. The Contractor shall collect the trays after each meal and wash and sanitize them at its facility.",
);
const S_CARTS = doc(
  ATT_A,
  "Section 5.2, page 6",
  "Att. A §5.2",
  "The County will lease four (4) heated transport carts to the Contractor at $100.00 per cart per month, deducted from the monthly payment.",
);

// Attachment B, bid form and price schedule, 2 pages.
const S_B_SHEET = doc(ATT_B, "Page 1, price schedule", "Att. B p.1");
const S_B_REG = doc(
  ATT_B,
  "Item 1, page 1",
  "Att. B item 1",
  `Item 1. Regular meal, per meal. Estimated annual quantity: ${num(REGULAR_QTY)}.`,
);
const S_B_DIET = doc(
  ATT_B,
  "Item 2, page 1",
  "Att. B item 2",
  `Item 2. Therapeutic or religious diet meal, per meal. Estimated annual quantity: ${num(DIET_QTY)}.`,
);
const S_B_EMERG = doc(
  ATT_B,
  "Item 3, page 1",
  "Att. B item 3",
  "Item 3. Emergency meal delivery, per event. Meals are billed at the Item 1 or Item 2 unit price. Estimated annual quantity: 6.",
);
const S_B_SIGN = doc(
  ATT_B,
  "Page 2, signature block",
  "Att. B p.2",
  "This Bid Form shall be signed by an owner or officer authorized to bind the bidder. The bidder acknowledges receipt of Addenda No. ______.",
);

// Attachment C, required forms packet, 10 pages.
const S_C1 = doc(
  FORMS,
  "Form C-1, page 1",
  "Form C-1",
  "The undersigned certifies that this bid is made without prior understanding, agreement or connection with any other person or firm submitting a bid for the same service, and is in all respects fair and without collusion or fraud.",
);
const S_C2 = doc(
  FORMS,
  "Form C-2, page 2",
  "Form C-2",
  "I, as an officer of the bidder, affirm that the bidder uses E-Verify as required by North Carolina law, OR employs less than twenty-five (25) employees in the State of North Carolina.",
);
const S_C3 = doc(
  FORMS,
  "Form C-3, page 3",
  "Form C-3",
  "The bidder certifies that it is not listed on the Final Divestment List created by the North Carolina State Treasurer.",
);
const S_C4 = doc(
  FORMS,
  "Form C-4, page 4",
  "Form C-4",
  "List three (3) institutional food service references. Give the facility, dates of service, meals per day, and a contact name, title, telephone and email for each.",
);

// Addendum 1, 3 pages, posted during the build.
const S_ADD_POP = doc(
  ADD1,
  "Item 1, page 1",
  "Add. 1 item 1",
  `Section 6.3 is revised: the estimated average daily inmate population is changed from ${POPULATION} to ${POPULATION_AFTER}. Attachment B, Item 1 estimated annual quantity is revised to ${num(REGULAR_QTY_AFTER)}.`,
);
const S_ADD_DIET = doc(
  ADD1,
  "Item 2, page 1",
  "Add. 1 item 2",
  `Attachment B, Item 2 estimated annual quantity is revised to ${num(DIET_QTY_AFTER)}.`,
);
const S_ADD_KITCHEN = doc(
  ADD1,
  "Item 3, page 2",
  "Add. 1 item 3",
  "Section 4.3 is revised to add: the kitchen named in the bidder's food establishment permit shall be within thirty (30) road miles of the Detention Annex, so that emergency meals can be delivered within two (2) hours.",
);
const S_ADD_TRAYS = doc(
  ADD1,
  "Item 4, page 2",
  "Add. 1 item 4",
  "Question: Section 5.4 and Attachment A, Section 5.1 conflict on trays. Answer: Section 5.4 governs. The Contractor shall furnish disposable trays. Attachment A, Section 5.1 is deleted.",
);
const S_ADD_ACK = doc(
  ADD1,
  "Page 3, acknowledgment form",
  "Add. 1 p.3",
  "Sign and return this acknowledgment with your bid. Failure to acknowledge this addendum may cause the bid to be rejected.",
);

const MIN_WAGE = { value: 7.25, why: "The North Carolina minimum wage is $7.25 an hour." };
const HUNDRED_MEALS = {
  value: 100,
  why: "Section 4.2 counts only jobs of not less than 100 meals per day.",
};

export const cumberlandBid: AvaBid = {
  noticeId: NOTICE,
  officialTitle: STORY.title,
  buyer: STORY.agency,
  bidNumber: NOTICE,
  kind: "bid-package",
  kindReason:
    "No points and no writing. The lowest complete bid wins: price, forms, bonds and a sealed envelope.",

  files: [
    {
      id: IFB,
      name: `IFB ${NOTICE} Inmate Meal Service - Detention Annex.pdf`,
      role: "main",
      pages: 18,
      postedDaysFromNow: POSTED,
      readability: "read",
    },
    {
      id: ATT_A,
      name: "Attachment A - Meal Specifications and Menu Cycle.pdf",
      role: "exhibit",
      pages: 9,
      postedDaysFromNow: POSTED,
      readability: "read",
    },
    {
      id: ATT_B,
      name: "Attachment B - Bid Form and Price Schedule.xlsx",
      role: "price-form",
      pages: 2,
      postedDaysFromNow: POSTED,
      readability: "read",
    },
    {
      id: FORMS,
      name: "Attachment C - Bid Forms C-1 to C-4 and W-9.pdf",
      role: "form",
      pages: 10,
      postedDaysFromNow: POSTED,
      readability: "read",
    },
    {
      id: MENU,
      name: "Sample Menu Cycle - Scanned.pdf",
      role: "exhibit",
      pages: 5,
      postedDaysFromNow: POSTED,
      readability: "scan",
      note: "A scanned sample menu. I read it from a picture of each page. It does not change what you price: Attachment A sets the meal rules.",
      riskIfMissing: "minor",
    },
    {
      id: ADD1,
      name: `Addendum 1 - IFB ${NOTICE}.pdf`,
      role: "addendum",
      pages: 3,
      postedDaysFromNow: 6,
      readability: "read",
      addendumId: "add-1",
    },
  ],

  deadline: {
    dueDaysFromNow: DUE,
    time: "2:00 PM",
    time24: "14:00",
    zone: "Eastern Time",
    utcOffset: ET_OFFSET(DUE),
    source: S_DUE,
    questionsDueDaysFromNow: QUESTIONS,
    questionsTime: "5:00 PM",
    questionsSource: S_QUESTIONS,
  },

  award: {
    method: "low-bid",
    source: S_AWARD,
    criteria: [
      {
        id: "crit-price",
        name: "Lowest total bid",
        points: null,
        kind: "price-formula",
        source: S_AWARD,
        treatment: "Lowest responsive bid wins. No points, no writing.",
      },
      {
        id: "crit-responsive",
        name: "Responsive: every form complete and signed",
        points: null,
        kind: "pass-fail",
        source: S_RESPONSIVE,
        treatment: "Pass or fail. A missing form, signature or notary stamp gets the bid rejected.",
      },
      {
        id: "crit-responsible",
        name: "Responsible: references and permits",
        points: null,
        kind: "pass-fail",
        source: S_RESPONSIBLE,
        treatment: "Pass or fail. The county checks references, permits and bonds before award.",
      },
    ],
    note: "No points. Lowest complete bid wins, so every form matters.",
  },

  hardRequirements: [
    {
      id: "req-bid-bond",
      grantRow: "gc-deposit",
      group: "insurance",
      label: "Bid bond or certified check, 5% of your total bid",
      source: S_DEPOSIT,
      initial: "not-yet",
      askId: "ask-bid-bond",
      evidenceAfter: "Your bid deposit: a bid bond or a certified check",
    },
    {
      id: "req-perf-bond",
      group: "insurance",
      label: "Performance and payment bond, 50% of year one, within 10 days of award",
      source: S_PERF,
      initial: "confirm",
      askId: "ask-perf-letter",
      evidenceAfter: "Your surety's letter for the performance and payment bond",
    },
    {
      id: "req-prebid",
      grantRow: "gc-prebid",
      group: "events",
      label: `Mandatory pre-bid conference, ${WD(PREBID)}, 10:00 AM`,
      source: S_PREBID,
      initial: "not-yet",
      askId: "ask-prebid",
      // Attending is a plan until the sheet is signed: both asks must pass.
      askIds: ["ask-prebid-signed"],
      evidenceAfter: `Your company signed the attendance sheet on ${D(PREBID)}.`,
    },
    {
      id: "req-refs",
      group: "experience",
      label: "Three institutional references, 100 or more meals a day, last 5 years",
      source: S_REFS,
      initial: "confirm",
      askId: "ask-ref-3",
      // Three references are three asks. Each one must pass.
      askIds: ["ask-ref-1", "ask-ref-2"],
      evidenceAfter: "Three institutional jobs you approved, with a count of meals a day",
    },
    {
      id: "req-permit",
      grantRow: "gc-permit",
      group: "eligibility",
      label: "Food establishment permit for your kitchen",
      source: S_PERMIT,
      initial: "confirm",
      askId: "ask-permit",
      evidenceAfter: "Your food establishment permit",
    },
    {
      id: "req-cfpm",
      group: "people",
      label: "Certified food protection manager on your staff",
      source: S_CFPM,
      initial: "confirm",
      askId: "ask-cfpm",
      evidenceAfter: "Your food protection manager certificate",
    },
    {
      id: "req-food-handlers",
      grantRow: "gc-handlers",
      group: "people",
      label: "Food-handler certificate for every cook",
      source: S_FOODHANDLER,
      initial: "not-yet",
      askId: "ask-food-handlers",
      evidenceAfter: `A food-handler certificate for each of your ${COOKS} cooks`,
    },
    {
      id: "req-insurance",
      grantRow: "gc-insurance",
      group: "insurance",
      neededAt: "award",
      label: "Insurance at award: $1M / $2M liability, $1M auto, workers' comp",
      source: S_INSURANCE,
      initial: "confirm",
      askId: "ask-insurance",
      evidenceAfter: "Your certificate naming Cumberland County",
    },
  ],

  screen: [
    {
      topic: "vendor-registration",
      found: true,
      summary:
        "Include a W-9. The county pays only vendors in its vendor file. Grant found your registration active.",
      source: S_W9,
    },
    {
      topic: "preferences",
      found: false,
      summary: "Not in these files. The lowest bid wins, with no local preference.",
    },
    {
      topic: "bonds",
      found: true,
      summary:
        "A 5% bid deposit, and a performance and payment bond of 50% of year one if you win.",
      source: S_DEPOSIT,
      requirementId: "req-bid-bond",
    },
    {
      topic: "insurance",
      found: true,
      summary: "$1M / $2M general liability, $1M auto and workers' comp, due at award.",
      source: S_INSURANCE,
      requirementId: "req-insurance",
    },
    {
      topic: "wages",
      found: false,
      summary: "Not in these files. No wage floor beyond the minimum wage law.",
    },
    {
      topic: "tax",
      found: true,
      summary:
        "Section 6.4 says your prices include all taxes. Your bookkeeper gives Ava the rate.",
      source: S_TAX,
    },
    {
      topic: "notary-signature",
      found: true,
      summary: "Sign in blue ink. Two affidavits need a notary.",
      source: S_SIGN,
    },
    {
      topic: "pre-bid-meeting",
      found: true,
      summary: `Mandatory conference at the annex on ${WD(PREBID)}, 10:00 AM.`,
      source: S_PREBID,
      requirementId: "req-prebid",
    },
    {
      topic: "public-opening",
      found: true,
      summary: `Bids are opened and read aloud at 2:00 PM on ${DM(DUE)}. Your prices become public.`,
      source: S_OPENING,
    },
    {
      topic: "references-licenses",
      found: true,
      summary:
        "Three institutional references, a food permit, a certified food manager and a food-handler certificate for every cook.",
      source: S_REFS,
      requirementId: "req-refs",
    },
    {
      topic: "participation-goals",
      found: false,
      summary: "Not in these files.",
    },
    {
      topic: "background-checks",
      found: true,
      summary: "Staff who enter the annex pass a Sheriff's Office check first.",
      source: S_BACKGROUND,
    },
    {
      topic: "portal-rules",
      found: true,
      summary: "No portal. Paper bids only, sealed and marked. Email and fax bids are rejected.",
      source: S_NO_EMAIL,
    },
  ],

  commitments: [
    {
      id: "com-meals",
      text: "Three meals a day, 365 days a year. Breakfast by 5:30 AM, lunch by 11:00 AM, dinner by 4:30 PM.",
      source: S_MEALS,
      pricedAs: `Priced as: ${CREW.cooks} cooks at ${CREW.cookHours} hours a week, plus a kitchen lead at ${CREW.leadHours}.`,
      needsApproval: true,
    },
    {
      id: "com-diets",
      text: "Medical diets ordered by annex medical staff, and religious diets the chaplain approves. Each starts within 24 hours of the order.",
      source: S_DIETS,
      pricedAs: "Priced as: Attachment B item 2, with its own food cost per meal.",
      needsApproval: true,
    },
    {
      id: "com-delivery",
      text: "Meals delivered hot, in sealed heated carts, to the annex loading dock. Hot food at 135°F or more on arrival.",
      source: S_DELIVERY,
      pricedAs: `Priced as: 1 part-time driver at ${CREW.driverHours} hours a week, and 4 leased carts.`,
      needsApproval: true,
    },
    {
      id: "com-background",
      text: "Every worker who enters the annex passes a Sheriff's Office background check first.",
      source: S_BACKGROUND,
      pricedAs: "No price effect. The Sheriff's Office runs each check at no cost to you.",
      needsApproval: false,
    },
    {
      id: "com-emergency",
      text: "Emergency meals for everyone at the annex, at any hour. They arrive within 2 hours of the county's call.",
      source: S_EMERGENCY,
      pricedAs: "Priced as: Attachment B item 3, one extra run per event, 6 a year.",
      needsApproval: true,
    },
    {
      id: "com-price-fixed",
      text: "Your unit prices stay the same for the first 12 months.",
      source: S_PRICE_FIRM,
      pricedAs:
        "Priced as: today's food cost. If food prices rise in year one, you pay the difference.",
      needsApproval: true,
    },
  ],

  contractTerms: [
    {
      text: "Firm unit price per meal. It stays fixed for the first 12 months.",
      source: S_PRICE_FIRM,
    },
    {
      text: `About ${num(yearlyMeals(POPULATION))} meals a year: ${POPULATION} people a day, ${MEALS_A_DAY} meals, ${DAYS_A_YEAR} days.`,
      source: S_QTY,
    },
    {
      text: "The counts are estimates, not a promise. The county pays only for meals it orders.",
      source: S_PRICE_FIRM,
    },
    { text: "If a total on Attachment B is wrong, the unit price counts.", source: S_EXTENSION },
    {
      text: "The county leases you 4 heated carts for $100 a month each. It deducts this from your payment.",
      source: S_CARTS,
    },
    {
      text: "One year, then up to four yearly renewals. A price rise at renewal is capped at 4%.",
      source: S_RENEW,
    },
    { text: "Net 30 after the county approves your monthly invoice.", source: S_PAY },
    { text: "The county can end the contract with 30 days' written notice.", source: S_TERMINATE },
    { text: "Your prices stay open for 60 days after the opening.", source: S_FIRM },
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
    {
      label: "Business address",
      value: PERSONA.physicalAddress,
      from: "Your federal registration",
    },
    {
      label: "Mailing address",
      value: PERSONA.mailingAddress,
      from: "You told GovPreneurs",
    },
    { label: "Unique entity ID", value: PERSONA.uei, from: "Your federal registration" },
    {
      label: "Federal registration",
      value: `Active until ${SAM_ACTIVE_UNTIL}`,
      from: "Your federal registration",
    },
    {
      label: "Main type of work",
      value: `${PERSONA.primaryNaics}, ${PERSONA.primaryNaicsLabel}`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Employees",
      value: `${PERSONA.employeesW2} on your payroll, ${COOKS_CERTIFIED} with a food-handler certificate`,
      from: "You told GovPreneurs",
    },
    {
      label: "General liability insurance",
      value: "$1M a claim. The $2M yearly total is not on file.",
      from: "You told GovPreneurs",
    },
    {
      label: "Bonding",
      value: `You have been bonded before. Your largest bond was ${BONDED_UP_TO}.`,
      from: "Your GovPreneurs profile",
    },
    {
      label: "Jobs on your record",
      value: `School summer meals ${yearOf(SCHOOLS)}, Fort Bragg dining ${yearOf(FORT_BRAGG)}, Womack patient meals ${yearOf(WOMACK)}, Riverside Fellowship Church events ${yearOf(CHURCH)}`,
      from: "Your GovPreneurs profile",
    },
  ],

  asks: [
    // ── Your surety ──
    {
      id: "ask-bid-bond",
      grantQuestion: "cc-deposit",
      kind: "upload",
      title: "Bid bond, 5% of your total bid",
      source: S_DEPOSIT,
      why: `The county does not consider a bid without a deposit. You have been bonded before, up to ${BONDED_UP_TO}. Ask your surety for a 5% bond.`,
      owner: "surety",
      leadDays: 10,
      minutes: 45,
      answer: {
        type: "upload",
        accepts: "A signed 5% bid bond from a surety licensed in North Carolina",
        extracts: [
          {
            fieldId: "bid-bond-fee",
            label: "Bid bond fee",
            value: 100,
            unit: "usd",
            where: "Your surety's invoice",
          },
        ],
      },
      dontHave: [
        {
          id: "dh-cert-check",
          label: "Use a certified check for 5% of your bid instead",
          detail: "Section 3.2 allows it. The county holds the check until award.",
          source: S_DEPOSIT,
          outcome: "new-ask",
          opensAskId: "ask-cert-check",
          // Section 3.2 accepts a check in place of a bond, and a check has no bond fee.
          satisfies: true,
          noFee: true,
        },
        {
          id: "dh-no-deposit",
          label: "You cannot get a bond or a check in time",
          detail:
            "The county does not consider a bid without a deposit. The bid goes back to a bid decision.",
          source: S_DEPOSIT_NONE,
          outcome: "bid-decision",
        },
      ],
      deliberate: true,
      feeds: ["Hard requirement · Bid deposit", "Form · Bid bond", "Price · Bid bond fee"],
    },
    {
      id: "ask-perf-letter",
      kind: "upload",
      title: "Surety letter for the performance and payment bond, 50% of year one",
      source: S_PERF,
      why: `The county rejects a bid without this letter. If you win, the bond is due within 10 days. Your surety has written bonds up to ${BONDED_UP_TO} for you.`,
      owner: "surety",
      leadDays: 10,
      minutes: 15,
      answer: {
        type: "upload",
        accepts: "A letter on your surety's letterhead, saying it will issue the bond if you win",
        extracts: [
          {
            fieldId: "perf-bond-fee",
            label: "Performance and payment bond fee for year one",
            value: 3600,
            unit: "usd",
            where: "Your surety's letter, fee quote",
          },
        ],
      },
      dontHave: [
        {
          id: "dh-perf-none",
          label: "No surety will write this bond for you",
          detail:
            "Section 3.3 accepts no other kind of guarantee. The bid goes back to a bid decision.",
          source: S_PERF_NONE,
          outcome: "bid-decision",
        },
      ],
      deliberate: true,
      feeds: [
        "Hard requirement · Performance and payment bond",
        "Form · Surety letter",
        "Price · Performance and payment bond fee",
      ],
    },

    // ── You ──
    {
      id: "ask-cert-check",
      kind: "enter",
      title: "Certified check for 5% of your total bid",
      source: S_DEPOSIT_RETURN,
      why: "Your bank issues it after you set your final price. The county returns it after award if you do not win.",
      owner: "you",
      leadDays: 2,
      minutes: 60,
      answer: {
        type: "enter",
        fields: [
          {
            id: "check-amount",
            label: "Amount on your certified check",
            unit: "usd",
            hint: "Make it payable to Cumberland County. Ava checks it is at least 5% of your total bid.",
          },
        ],
      },
      deliberate: true,
      hiddenUntilOpened: true,
      feeds: ["Hard requirement · Bid deposit"],
    },
    {
      id: "ask-prebid",
      proof: "there",
      grantQuestion: "cc-prebid",
      grantChoices: { Yes: "prebid-staff", No: "prebid-no" },
      kind: "answer",
      title: `Pre-bid conference: ${WD(PREBID)}, 10:00 AM`,
      source: S_PREBID,
      why: "Attendance is mandatory. The county does not accept bids from firms that miss it.",
      owner: "you",
      leadDays: 0,
      minutes: 120,
      answer: {
        type: "answer",
        question: `Will someone from your company attend at the Detention Annex on ${WDM(PREBID)}?`,
        choices: [
          {
            id: "prebid-yes",
            label: "Yes, I will attend",
            consequence: "Sign the attendance sheet in the annex lobby.",
            gives: { status: "confirm", evidence: `You plan to attend on ${D(PREBID)}.` },
            opensAskId: "ask-prebid-signed",
          },
          {
            id: "prebid-staff",
            label: "Someone from my company will attend",
            consequence:
              "Section 2.2 accepts any representative. They sign in your company's name.",
            gives: { status: "confirm", evidence: `You plan to attend on ${D(PREBID)}.` },
            opensAskId: "ask-prebid-signed",
          },
          {
            id: "prebid-no",
            label: "No one from my company can attend",
            failsGate:
              "The pre-bid conference is mandatory. The county does not accept bids from firms that miss it.",
          },
        ],
      },
      decideByDaysFromNow: PREBID - 1,
      feeds: ["Hard requirement · Pre-bid conference"],
    },
    {
      id: "ask-prebid-signed",
      kind: "answer",
      title: `Attendance sheet at the pre-bid conference on ${D(PREBID)}`,
      source: S_PREBID,
      why: "The county accepts bids only from firms whose representative signed the sheet.",
      owner: "you",
      leadDays: 0,
      minutes: 5,
      // The day of the conference. The question stays hidden until that day.
      decideByDaysFromNow: PREBID,
      hiddenUntilOpened: true,
      answer: {
        type: "answer",
        question: "Did someone from your company sign the attendance sheet?",
        choices: [
          {
            id: "pbs-signed",
            label: "Yes, we signed it",
            consequence: "The pre-bid conference rule is met.",
          },
          {
            id: "pbs-missed",
            label: "No, we missed it",
            failsGate:
              "The county does not accept bids from firms that did not sign the attendance sheet.",
          },
        ],
      },
      feeds: ["Hard requirement · Pre-bid conference"],
    },
    {
      id: "ask-ref-1",
      kind: "approve",
      title: `Reference 1: Cumberland County Schools summer meals, ${yearOf(SCHOOLS)}`,
      source: S_REFS,
      why: `It served ${num(SCHOOL_MEALS)} meals a day for the county's schools. ${SCHOOLS.referenceName}, the ${SCHOOLS.referenceTitle?.split(",")[0]}, can speak for it.`,
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: "Use your Cumberland County Schools summer meals job as reference 1?",
        from: "Your GovPreneurs profile, past jobs",
        value: `Cumberland County Schools summer meals program, ${yearOf(SCHOOLS)}`,
      },
      dontHave: [
        {
          id: "dh-ref1-other",
          label: "Use a different job",
          detail:
            "Then Ava needs another institutional job your company did. It needs 100 meals a day.",
          source: S_REFS_NONE,
          outcome: "new-ask",
          opensAskId: "ask-ref-other-1",
          // Another qualifying job meets the rule; its meal count is checked there.
          satisfies: true,
        },
      ],
      deliberate: true,
      feeds: ["Hard requirement · References", "Form C-4 · Reference 1"],
    },
    {
      id: "ask-ref-2",
      kind: "approve",
      title: `Reference 2: Fort Bragg dining facility work, ${yearOf(FORT_BRAGG)}`,
      source: S_REFS,
      why: "Section 4.2 counts work your own company did, also as a subcontractor. It does not count work by a related or parent company. Approve only if your crew served 100 or more meals a day.",
      owner: "you",
      leadDays: 0,
      minutes: 3,
      answer: {
        type: "approve",
        proposal: "Use your Fort Bragg dining facility work as reference 2?",
        from: "Your GovPreneurs profile, past jobs",
        value: `Fort Bragg dining facility work, ${yearOf(FORT_BRAGG)}`,
        asOf: "Your record shows no meal count for this job.",
      },
      dontHave: [
        {
          id: "dh-ref2-other",
          label: "It served fewer than 100 meals a day",
          detail: "Then Ava needs a different institutional job for this reference.",
          source: S_REFS,
          outcome: "new-ask",
          opensAskId: "ask-ref-other",
          // Another qualifying job meets the rule; its meal count is checked there.
          satisfies: true,
        },
      ],
      deliberate: true,
      feeds: ["Hard requirement · References", "Form C-4 · Reference 2"],
    },
    {
      id: "ask-ref-3",
      kind: "enter",
      title: `Reference 3: Womack Army Medical Center patient meals, ${yearOf(WOMACK)}`,
      source: S_REFS,
      why: "Section 4.2 does not count your Riverside Fellowship Church events, because that was event work. Your Womack job was hospital food service, which counts. Your record has no meal count and no contact for it. The Army has not written its performance rating (CPARS) yet.",
      owner: "you",
      leadDays: 2,
      minutes: 15,
      answer: {
        type: "enter",
        fields: [
          { id: "ref3-meals", label: "Meals a day at Womack", unit: "count", floor: HUNDRED_MEALS },
          { id: "ref3-name", label: "Your contact's name at Womack", unit: "text" },
          { id: "ref3-title", label: "Their job title", unit: "text" },
          { id: "ref3-phone", label: "Their phone", unit: "phone" },
          { id: "ref3-email", label: "Their email", unit: "email" },
        ],
      },
      dontHave: [
        {
          id: "dh-ref3-other",
          label: "Use a different institutional job",
          detail:
            "Any school, hospital, jail or military dining job in the past 5 years counts. It needs 100 meals a day.",
          source: S_REFS,
          outcome: "new-ask",
          // Its own ask, so one job cannot stand in for two references.
          opensAskId: "ask-ref-other-3",
          satisfies: true,
        },
        {
          id: "dh-ref-none",
          label: "You have no third institutional reference",
          detail:
            "Section 4.2 does not count work by a related or parent company. The bid goes back to a bid decision.",
          source: S_REFS_NONE,
          outcome: "bid-decision",
        },
      ],
      deliberate: true,
      feeds: ["Hard requirement · References", "Form C-4 · Reference 3"],
    },
    {
      id: "ask-ref-other",
      kind: "enter",
      title: "Another institutional food service job, for reference 2",
      source: S_REFS,
      why: "Section 4.2 counts school, hospital, jail or military dining work your company did. It needs 100 meals a day, in the past 5 years.",
      owner: "you",
      leadDays: 3,
      minutes: 15,
      answer: {
        type: "enter",
        fields: [
          { id: "other-customer", label: "Customer name", unit: "text" },
          { id: "other-start", label: "Start date", unit: "text" },
          { id: "other-end", label: "End date", unit: "text" },
          { id: "other-meals", label: "Meals a day", unit: "count", floor: HUNDRED_MEALS },
          { id: "other-contact", label: "Your contact's name", unit: "text" },
          { id: "other-phone", label: "Their phone", unit: "phone" },
          { id: "other-email", label: "Their email", unit: "email" },
        ],
      },
      deliberate: true,
      hiddenUntilOpened: true,
      feeds: ["Hard requirement · References", "Form C-4 · Reference 2"],
    },
    {
      id: "ask-ref-other-1",
      kind: "enter",
      title: "Another institutional food service job, for reference 1",
      source: S_REFS,
      why: "Section 4.2 counts school, hospital, jail or military dining work your company did. It needs 100 meals a day, in the past 5 years.",
      owner: "you",
      leadDays: 3,
      minutes: 15,
      answer: {
        type: "enter",
        fields: [
          { id: "other1-customer", label: "Customer name", unit: "text" },
          { id: "other1-start", label: "Start date", unit: "text" },
          { id: "other1-end", label: "End date", unit: "text" },
          { id: "other1-meals", label: "Meals a day", unit: "count", floor: HUNDRED_MEALS },
          { id: "other1-contact", label: "Your contact's name", unit: "text" },
          { id: "other1-phone", label: "Their phone", unit: "phone" },
          { id: "other1-email", label: "Their email", unit: "email" },
        ],
      },
      deliberate: true,
      hiddenUntilOpened: true,
      feeds: ["Hard requirement · References", "Form C-4 · Reference 1"],
    },
    {
      id: "ask-ref-other-3",
      kind: "enter",
      title: "Another institutional food service job, for reference 3",
      source: S_REFS,
      why: "Section 4.2 counts school, hospital, jail or military dining work your company did. It needs 100 meals a day, in the past 5 years.",
      owner: "you",
      leadDays: 3,
      minutes: 15,
      answer: {
        type: "enter",
        fields: [
          { id: "other3-customer", label: "Customer name", unit: "text" },
          { id: "other3-start", label: "Start date", unit: "text" },
          { id: "other3-end", label: "End date", unit: "text" },
          { id: "other3-meals", label: "Meals a day", unit: "count", floor: HUNDRED_MEALS },
          { id: "other3-contact", label: "Your contact's name", unit: "text" },
          { id: "other3-phone", label: "Their phone", unit: "phone" },
          { id: "other3-email", label: "Their email", unit: "email" },
        ],
      },
      deliberate: true,
      hiddenUntilOpened: true,
      feeds: ["Hard requirement · References", "Form C-4 · Reference 3"],
    },
    {
      id: "ask-food",
      kind: "enter",
      title: "Food cost per meal, with trays and utensils",
      source: S_CALORIES,
      why: "Ava prices each meal from your food cost. Only you know your supplier prices. A price-only bid is thin: keep food cost under 40% of your price, or walk away.",
      owner: "you",
      leadDays: 2,
      minutes: 45,
      answer: {
        type: "enter",
        fields: [
          {
            id: "food-regular",
            label: "Food, tray and utensils: one regular meal",
            unit: "usd",
            hint: "Average it over the 5-week menu in Attachment A.",
          },
          {
            id: "food-diet",
            label: "Food, tray and utensils: one diet meal",
            unit: "usd",
            hint: "Average it over the medical and religious diets.",
          },
        ],
      },
      deliberate: true,
      feeds: ["Price · Regular meal", "Price · Diet meal"],
    },
    {
      id: "ask-contingency",
      kind: "enter",
      title: "Your contingency, for costs that run over",
      source: S_AWARD,
      why: "A reserve for costs that come in higher than you planned, such as food prices. Ava never picks it. The lowest complete bid wins, so keep it lean.",
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
      title: "Your profit on this bid",
      source: S_AWARD,
      why: "Ava never picks your profit. The county awards to the lowest complete bid.",
      owner: "you",
      leadDays: 0,
      minutes: 10,
      answer: {
        type: "enter",
        fields: [
          {
            id: "profit",
            label: "Profit, as a percent of cost",
            unit: "percent",
            hint: "Added after overhead, on every line of Attachment B.",
          },
        ],
      },
      deliberate: true,
      feeds: ["Price · Profit"],
    },
    {
      id: "ask-permit",
      kind: "upload",
      title: "Your food establishment permit",
      source: S_PERMIT,
      why: "Section 4.3 needs a copy with the bid. Your profile has no permit on file.",
      owner: "you",
      leadDays: 1,
      minutes: 5,
      answer: {
        type: "upload",
        accepts: "A photo or scan of your current permit, showing the kitchen address",
      },
      dontHave: [
        {
          id: "dh-permit-none",
          label: "Your kitchen has no current permit",
          detail:
            "A permit needs a health inspection first. Without one, the county can reject the bid.",
          source: S_PERMIT,
          outcome: "bid-decision",
        },
      ],
      feeds: ["Hard requirement · Food permit"],
    },
    {
      id: "ask-cfpm",
      kind: "upload",
      title: "Food protection manager certificate",
      source: S_CFPM,
      why: "The county needs one Certified Food Protection Manager on your staff. This is a manager certificate. It is not a cook's food-handler card.",
      owner: "you",
      leadDays: 1,
      minutes: 5,
      answer: {
        type: "upload",
        accepts:
          "A current ServSafe Manager or other accredited manager certificate, for someone on your staff",
      },
      feeds: ["Hard requirement · Food protection manager"],
    },
    {
      id: "ask-food-handlers",
      kind: "upload",
      title: "Food-handler certificate for every cook",
      source: S_FOODHANDLER,
      why: `The county rejects a bid unless every cook holds one. ${COOKS_CERTIFIED} of your ${COOKS} cooks do. The other ${COOKS_MISSING} each need one day of training.`,
      owner: "you",
      leadDays: COOKS_MISSING,
      minutes: 10,
      answer: {
        type: "upload",
        accepts: `A copy of the food-handler certificate for each of your ${COOKS} cooks`,
      },
      dontHave: [
        {
          id: "dh-handlers-missing",
          label: "I don't have all of them",
          // This sentence is the reason the bid pauses. It is also the status line
          // on the story's bid card.
          detail: `The county asks for a food-handler certificate for every cook. You have ${COOKS_CERTIFIED} of ${COOKS}.`,
          source: S_FOODHANDLER_NONE,
          outcome: "bid-decision",
        },
      ],
      feeds: ["Hard requirement · Food-handler certificates", "Package · Cook certificates"],
    },
    {
      id: "ask-ein",
      kind: "enter",
      title: "Your federal tax ID number, for the W-9",
      source: S_W9,
      why: "Section 9.2 needs a completed W-9 with the bid. Your profile has no tax ID number.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "enter",
        fields: [{ id: "ein", label: "Employer ID number (EIN)", unit: "text" }],
      },
      feeds: ["Form · W-9"],
    },
    {
      id: "ask-background",
      kind: "answer",
      title: "Who will enter the annex",
      source: S_BACKGROUND,
      why: "Each person needs a Sheriff's Office check before the first delivery. Each check takes about 10 business days.",
      owner: "you",
      leadDays: 0,
      minutes: 5,
      answer: {
        type: "answer",
        question: "Who from your company will enter the Detention Annex?",
        choices: [
          {
            id: "bg-drivers",
            label: "Only my delivery driver",
            consequence: "One person needs the check before the first delivery.",
          },
          {
            id: "bg-drivers-lead",
            label: "My delivery driver and my kitchen lead",
            consequence: "Two people need the check before the first delivery.",
          },
        ],
      },
      feeds: ["Promise · Background checks"],
    },

    // ── Your bookkeeper ──
    {
      id: "ask-pay",
      kind: "enter",
      title: "What you pay a cook, a kitchen lead and a driver",
      source: S_B_SHEET,
      why: "Ava builds the labor cost from what you pay, not what you charge. The county sets no wage floor.",
      owner: "bookkeeper",
      leadDays: 2,
      minutes: 15,
      answer: {
        type: "enter",
        fields: [
          {
            id: "pay-cook",
            label: "Cook, per hour",
            unit: "usd-hour",
            hint: `${CREW.cooks} cooks at ${CREW.cookHours} hours a week each`,
            floor: MIN_WAGE,
          },
          {
            id: "pay-lead",
            label: "Kitchen lead, per hour",
            unit: "usd-hour",
            hint: `1 kitchen lead at ${CREW.leadHours} hours a week`,
            floor: MIN_WAGE,
          },
          {
            id: "pay-driver",
            label: "Delivery driver, per hour",
            unit: "usd-hour",
            hint: `1 part-time driver at ${CREW.driverHours} hours a week`,
            floor: MIN_WAGE,
          },
        ],
      },
      deliberate: true,
      feeds: ["Price · Cook", "Price · Kitchen lead", "Price · Delivery driver"],
    },
    {
      id: "ask-payroll",
      kind: "upload",
      title: "Your latest quarterly payroll report",
      source: S_B_SHEET,
      why: "Each paid hour costs more than the wage. Ava finds your tax, workers' comp and leave rates here.",
      owner: "bookkeeper",
      leadDays: 3,
      minutes: 10,
      answer: {
        type: "upload",
        accepts: "A quarterly payroll report, or your payroll company's summary",
        extracts: [
          {
            fieldId: "unemployment",
            label: "Unemployment tax, percent of pay",
            value: 1,
            unit: "percent",
            where: "Payroll report, employer taxes",
          },
          {
            fieldId: "workers-comp",
            label: "Workers' comp, percent of pay",
            value: 2.8,
            unit: "percent",
            where: "Payroll report, workers' comp line",
          },
          {
            fieldId: "paid-leave",
            label: "Paid leave and holidays, percent of pay",
            value: 3.5,
            unit: "percent",
            where: "Payroll report, paid time off",
          },
        ],
      },
      deliberate: true,
      feeds: ["Price · Unemployment tax", "Price · Workers' comp", "Price · Paid leave"],
    },
    {
      id: "ask-overhead",
      kind: "upload",
      title: "Your profit and loss statement, for overhead",
      source: S_B_SHEET,
      why: "Rent, utilities and office costs belong in every meal price. Ava finds your overhead rate in the statement.",
      owner: "bookkeeper",
      leadDays: 3,
      minutes: 10,
      answer: {
        type: "upload",
        accepts: "Your most recent full-year profit and loss statement",
        extracts: [
          {
            fieldId: "overhead",
            label: "Overhead, as a percent of direct cost",
            value: 12,
            unit: "percent",
            where: "Profit and loss statement, operating costs",
          },
        ],
      },
      deliberate: true,
      feeds: ["Price · Overhead"],
    },
    {
      id: "ask-sales-tax",
      kind: "enter",
      title: "Sales tax you must include in your price",
      source: S_TAX,
      why: "Section 6.4 says your prices include all taxes. Your accountant knows if meals sold to the county are taxed.",
      owner: "bookkeeper",
      leadDays: 2,
      minutes: 10,
      answer: {
        type: "enter",
        fields: [
          {
            id: "sales-tax",
            label: "Sales tax, as a percent of the price",
            unit: "percent",
            hint: "Enter 0 if your accountant says meals sold to the county are exempt. Ava does not decide this.",
          },
        ],
      },
      deliberate: true,
      feeds: ["Price · Sales tax"],
    },
    {
      id: "ask-other-costs",
      kind: "enter",
      title: "Other yearly costs for this contract",
      source: S_DELIVERY,
      why: "Section 5.3 says you provide the delivery vehicle. Ava never puts its own guess in your price.",
      owner: "you",
      leadDays: 1,
      minutes: 15,
      answer: {
        type: "enter",
        fields: [
          {
            id: "vehicle-cost",
            label: "Delivery vehicle and fuel, per year",
            unit: "usd",
            hint: "Ava's starting point: 1,095 trips × 12 miles × 70 cents = about $9,198. That is 3 round trips a day, every day. Enter your own figure.",
          },
        ],
      },
      feeds: ["Price · Delivery vehicle and fuel"],
    },

    // ── Your insurance agent ──
    {
      id: "ask-insurance",
      neededAt: "award",
      kind: "upload",
      title: "Certificate of insurance naming Cumberland County",
      source: S_INSURANCE,
      why: "It is due within 10 days of award. Your profile lists $1M a claim of liability cover. The county asks for $1M a claim and $2M a year. It also asks for auto and workers' comp cover. Your agent names the county as additional insured.",
      owner: "insurance-agent",
      leadDays: 5,
      minutes: 10,
      answer: {
        type: "upload",
        accepts: "A certificate from your agent that names Cumberland County as additional insured",
      },
      feeds: ["Hard requirement · Insurance", "Form · Certificate of insurance"],
    },

    // ── Your references ──
    {
      id: "ask-ref-contacts",
      kind: "enter",
      title: `Phone and email for ${SCHOOLS.referenceName} and ${FORT_BRAGG.referenceName}`,
      source: S_C4,
      why: "The county calls each reference before award. Your record has their names but no phone or email.",
      owner: "references",
      leadDays: 3,
      minutes: 10,
      answer: {
        type: "enter",
        fields: [
          { id: "janet-phone", label: `${SCHOOLS.referenceName}, phone`, unit: "phone" },
          { id: "janet-email", label: `${SCHOOLS.referenceName}, email`, unit: "email" },
          { id: "mike-phone", label: `${FORT_BRAGG.referenceName}, phone`, unit: "phone" },
          { id: "mike-email", label: `${FORT_BRAGG.referenceName}, email`, unit: "email" },
        ],
      },
      feeds: ["Form C-4 · References"],
    },
  ],

  clarifications: [
    {
      id: "clar-trays",
      title: "Who supplies the meal trays is stated two ways",
      checked: "No addendum or county answer settles it yet.",
      passages: [S_TRAYS_IFB, S_TRAYS_ATT],
      question: `Section 5.4 of IFB ${NOTICE} says the contractor supplies disposable trays. Attachment A, Section 5.1 says meals go on county trays that the contractor washes. Which one applies to this contract?`,
      to: `${BUYER.name}, ${BUYER.title}, Cumberland County`,
      channel: "by email only, per Section 2.3",
      kind: "decision",
      meanwhile: "Ava prices disposable trays for now. Your food cost per meal includes them.",
      readings: [
        {
          id: "read-disposable",
          label: "You supply disposable trays (Section 5.4)",
          costs: "Adds trays, cups and utensils to every meal. No washing.",
        },
        {
          id: "read-county",
          label: "You wash the county's trays (Attachment A)",
          costs: "No tray cost. Adds dish washing at your kitchen and tray pickup on every run.",
        },
      ],
      settledByAddendumId: "add-1",
    },
  ],

  plan: [
    {
      id: "plan-prebid",
      source: S_PREBID,
      kind: "logistics",
      needs: "action",
      ifMissed: "The county does not accept your bid.",
      answeredIn: {
        kind: "checklist",
        id: "chk-prebid",
        label: `Pre-bid conference, ${DM(PREBID)}`,
      },
      askId: "ask-prebid",
    },
    {
      id: "plan-deposit",
      source: S_DEPOSIT,
      kind: "instruction",
      needs: "attachment",
      ifMissed: "The county does not consider your bid.",
      answeredIn: { kind: "form", id: "form-bid-bond", label: "Bid bond" },
      askId: "ask-bid-bond",
    },
    {
      id: "plan-perf-letter",
      source: S_PERF,
      kind: "instruction",
      needs: "attachment",
      ifMissed: "The bid is rejected as incomplete.",
      answeredIn: { kind: "form", id: "form-perf-letter", label: "Surety letter" },
      askId: "ask-perf-letter",
    },
    {
      id: "plan-price",
      source: S_AWARD,
      kind: "scored-item",
      needs: "price",
      ifMissed: "The bid is rejected. There is no price to compare.",
      answeredIn: { kind: "price", id: "price", label: "Attachment B unit prices" },
    },
    {
      id: "plan-bid-form",
      source: S_B_SIGN,
      kind: "form",
      needs: "signature",
      ifMissed: "The bid is rejected as incomplete.",
      answeredIn: { kind: "form", id: "form-bid", label: "Attachment B, signed" },
    },
    {
      id: "plan-noncollusion",
      source: S_SIGN,
      kind: "form",
      needs: "signature",
      ifMissed: "The bid is rejected as incomplete.",
      answeredIn: { kind: "form", id: "form-noncollusion", label: "Form C-1, notarized" },
    },
    {
      id: "plan-everify",
      source: S_EVERIFY,
      kind: "form",
      needs: "signature",
      ifMissed: "The bid is rejected as incomplete.",
      answeredIn: { kind: "form", id: "form-everify", label: "Form C-2, notarized" },
    },
    {
      id: "plan-iran",
      source: S_IRAN,
      kind: "form",
      needs: "signature",
      ifMissed: "The bid is rejected as incomplete.",
      answeredIn: { kind: "form", id: "form-iran", label: "Form C-3, signed" },
    },
    {
      id: "plan-w9",
      source: S_W9,
      kind: "form",
      needs: "signature",
      ifMissed: "The county cannot add you as a vendor or pay you.",
      answeredIn: { kind: "form", id: "form-w9", label: "W-9, signed" },
      askId: "ask-ein",
    },
    {
      id: "plan-refs",
      source: S_REFS,
      kind: "instruction",
      needs: "attachment",
      ifMissed: "The county can find you not responsible and award the next bid.",
      answeredIn: { kind: "form", id: "form-refs", label: "Form C-4, references" },
      askId: "ask-ref-3",
    },
    {
      id: "plan-permit",
      source: S_PERMIT,
      kind: "instruction",
      needs: "attachment",
      ifMissed: "The county can find you not responsible.",
      answeredIn: { kind: "checklist", id: "chk-attach", label: "Permit copy in each set" },
      askId: "ask-permit",
    },
    {
      id: "plan-cfpm",
      source: S_CFPM,
      kind: "instruction",
      needs: "attachment",
      ifMissed: "The county can find you not responsible.",
      answeredIn: { kind: "checklist", id: "chk-attach", label: "Manager certificate in each set" },
      askId: "ask-cfpm",
    },
    {
      id: "plan-food-handlers",
      source: S_FOODHANDLER,
      kind: "instruction",
      needs: "attachment",
      ifMissed: "The county rejects your bid.",
      answeredIn: {
        kind: "checklist",
        id: "chk-attach",
        label: "A food-handler certificate for each cook in each set",
      },
      askId: "ask-food-handlers",
    },
    {
      id: "plan-envelope",
      source: S_PACKAGE,
      kind: "logistics",
      needs: "action",
      ifMissed: "The county may not treat it as a sealed bid.",
      answeredIn: {
        kind: "checklist",
        id: "chk-envelope",
        label: "One original, two copies, one marked envelope",
      },
    },
    {
      id: "plan-deliver",
      source: S_DUE,
      kind: "logistics",
      needs: "action",
      ifMissed: "A late bid is returned unopened.",
      answeredIn: { kind: "checklist", id: "chk-deliver", label: "Delivery to Room 214" },
    },
    {
      id: "plan-closed",
      source: S_CLOSED,
      kind: "logistics",
      needs: "action",
      ifMissed: `No one is there to take a bid on ${DM(CLOSED)}.`,
      answeredIn: { kind: "checklist", id: "chk-deliver", label: `Delivery by ${DM(CLOSED + 1)}` },
    },
    {
      id: "plan-addenda",
      source: S_ADDENDA,
      kind: "form",
      needs: "signature",
      ifMissed: "The county may reject the bid.",
      answeredIn: { kind: "form", id: "form-ack-1", label: "Addendum acknowledgment forms" },
    },
    {
      id: "plan-trays",
      source: S_TRAYS_IFB,
      kind: "instruction",
      needs: "price",
      ifMissed: "Your price may miss a real cost.",
      answeredIn: { kind: "price", id: "price", label: "Food cost per meal" },
      clarificationId: "clar-trays",
    },
  ],

  themes: [],
  sections: [],

  price: {
    sheetName: "Attachment B, the county's bid form and price schedule",
    sheetFileId: ATT_B,
    contractType:
      "Firm unit prices per meal, fixed for year one. Up to four renewals, capped at 4% a year.",
    contractTypeSource: S_PRICE_FIRM,
    weeks: 52,
    roles: [
      {
        id: "role-cook",
        name: "Cook",
        count: CREW.cooks,
        hoursPerWeek: CREW.cookHours,
        pay: { askId: "ask-pay", fieldId: "pay-cook" },
      },
      {
        id: "role-lead",
        name: "Kitchen lead",
        count: 1,
        hoursPerWeek: CREW.leadHours,
        pay: { askId: "ask-pay", fieldId: "pay-lead" },
      },
      {
        id: "role-driver",
        name: "Delivery driver",
        count: 1,
        hoursPerWeek: CREW.driverHours,
        pay: { askId: "ask-pay", fieldId: "pay-driver" },
      },
    ],
    burden: [
      {
        id: "burden-fica",
        label: "Social Security and Medicare",
        from: { kind: "law", rate: 7.65, text: "Federal law, 7.65% of pay" },
      },
      {
        id: "burden-unemployment",
        label: "Unemployment tax",
        from: {
          kind: "ask",
          askId: "ask-payroll",
          fieldId: "unemployment",
          text: "Your payroll report",
        },
      },
      {
        id: "burden-wc",
        label: "Workers' comp",
        from: {
          kind: "ask",
          askId: "ask-payroll",
          fieldId: "workers-comp",
          text: "Your payroll report",
        },
      },
      {
        id: "burden-leave",
        label: "Paid leave and holidays",
        from: {
          kind: "ask",
          askId: "ask-payroll",
          fieldId: "paid-leave",
          text: "Your payroll report",
        },
      },
    ],
    lines: [
      {
        id: "line-regular",
        item: "Regular meal, per meal",
        unit: "per meal",
        qty: REGULAR_QTY,
        qtySource: S_B_REG,
        laborShare: 0.92,
        direct: { askId: "ask-food", fieldId: "food-regular", label: "Food, tray and utensils" },
      },
      {
        id: "line-diet",
        item: "Therapeutic or religious diet meal, per meal",
        unit: "per meal",
        qty: DIET_QTY,
        qtySource: S_B_DIET,
        laborShare: 0.06,
        direct: { askId: "ask-food", fieldId: "food-diet", label: "Food, tray and utensils" },
      },
      {
        id: "line-emergency",
        item: "Emergency meal delivery, per event",
        unit: "per event",
        qty: 6,
        qtySource: S_B_EMERG,
        laborShare: 0.02,
      },
    ],
    overhead: {
      askId: "ask-overhead",
      fieldId: "overhead",
      text: "Your profit and loss statement",
    },
    profit: { askId: "ask-profit", fieldId: "profit" },
    contingency: { askId: "ask-contingency", fieldId: "contingency" },
    otherCosts: [
      {
        id: "cost-carts",
        label: "Hot cart lease",
        yearly: {
          kind: "fixed",
          amount: 4800,
          text: "4 county carts at $100 a month each, from Attachment A",
        },
        inPrice: true,
        commitmentId: "com-delivery",
      },
      {
        id: "cost-vehicle",
        label: "Delivery vehicle and fuel",
        yearly: {
          kind: "ask",
          askId: "ask-other-costs",
          fieldId: "vehicle-cost",
          text: "Your own figure, for 3 round trips a day",
        },
        inPrice: true,
        commitmentId: "com-delivery",
      },
      {
        id: "cost-bid-bond",
        label: "Bid bond fee",
        yearly: {
          kind: "ask",
          askId: "ask-bid-bond",
          fieldId: "bid-bond-fee",
          text: "Your surety's invoice",
        },
        inPrice: true,
      },
      {
        id: "cost-perf-bond",
        label: "Performance and payment bond fee",
        yearly: {
          kind: "ask",
          askId: "ask-perf-letter",
          fieldId: "perf-bond-fee",
          text: "Your surety's letter",
        },
        inPrice: true,
      },
    ],
    tax: {
      askId: "ask-sales-tax",
      fieldId: "sales-tax",
      text: "Sales tax on meals, as your accountant advises",
      source: S_TAX,
    },
    payment: {
      text: "Net 30 after the county approves your monthly invoice. Your first payment comes about 60 days after you start.",
      source: S_PAY,
    },
  },

  forms: [
    {
      id: "form-bid",
      name: "Attachment B, Bid Form and Price Schedule",
      source: S_B_SIGN,
      handling: ["ava-fills", "you-sign"],
      signer: "You, as an owner or officer of your company",
      filledFrom: "Your unit prices, your company details and the addenda you received",
    },
    {
      id: "form-noncollusion",
      name: "Form C-1, Non-Collusion Affidavit",
      source: S_C1,
      handling: ["you-sign", "notary"],
      signer: "You, in front of a notary",
    },
    {
      id: "form-everify",
      name: "Form C-2, E-Verify Affidavit",
      source: S_C2,
      handling: ["you-sign", "notary"],
      signer: "You, in front of a notary",
    },
    {
      id: "form-iran",
      name: "Form C-3, Iran Divestment Act Certification",
      source: S_C3,
      handling: ["you-sign"],
      signer: "You, as an owner or officer of your company",
    },
    {
      id: "form-w9",
      name: "IRS Form W-9",
      source: S_W9,
      handling: ["ava-fills", "you-sign"],
      signer: "You, as an owner or officer of your company",
      filledFrom: "Your legal name, address and tax ID number",
    },
    {
      id: "form-refs",
      name: "Form C-4, Bidder References",
      source: S_C4,
      handling: ["ava-fills"],
      filledFrom: "The three jobs you approve, with their contacts and meals a day",
    },
    {
      id: "form-bid-bond",
      name: "Bid bond, 5% of the total bid",
      source: S_DEPOSIT,
      handling: ["someone-else", "you-sign"],
      signer: "You sign as the bidder, beside your surety",
      providedBy: "Your surety",
      askId: "ask-bid-bond",
    },
    {
      id: "form-perf-letter",
      name: "Surety letter for the performance and payment bond",
      source: S_PERF,
      handling: ["someone-else"],
      providedBy: "Your surety",
      askId: "ask-perf-letter",
    },
    {
      id: "form-insurance",
      name: "Certificate of insurance, due within 10 days of award",
      source: S_INSURANCE,
      handling: ["someone-else"],
      providedBy: "Your insurance agent",
      askId: "ask-insurance",
    },
    {
      id: "form-ack-1",
      name: "Addendum 1 acknowledgment",
      source: S_ADD_ACK,
      handling: ["ava-fills", "you-sign"],
      signer: "You, as an owner or officer of your company",
      filledFrom: "Your company name and the date",
      acknowledgesAddendumId: "add-1",
    },
  ],

  submission: {
    method: "paper",
    where: "Cumberland County Purchasing Office, Room 214",
    account:
      "No account. Deliver by hand or courier to Room 214, 125 Russell Street, Fayetteville.",
    source: S_NO_EMAIL,
    limits: "Paper only. One original and two copies, in one sealed envelope.",
    files: [
      {
        id: "pkg-original",
        name: "Original bid set, marked ORIGINAL, signed in blue ink",
        covers: "§3.4, §3.5, §4.2 to §4.5, Attachments B and C",
        contains: [
          { kind: "form", id: "form-bid" },
          { kind: "price", id: "price" },
          { kind: "form", id: "form-noncollusion" },
          { kind: "form", id: "form-everify" },
          { kind: "form", id: "form-iran" },
          { kind: "form", id: "form-w9" },
          { kind: "form", id: "form-refs" },
          { kind: "form", id: "form-perf-letter" },
          { kind: "form", id: "form-ack-1" },
          { kind: "upload", id: "ask-permit" },
          { kind: "upload", id: "ask-cfpm" },
          { kind: "upload", id: "ask-food-handlers" },
        ],
      },
      {
        id: "pkg-bond",
        name: "Bid bond, placed with the original set",
        covers: "§3.2",
        contains: [
          { kind: "form", id: "form-bid-bond" },
          { kind: "upload", id: "ask-bid-bond" },
        ],
      },
      {
        id: "pkg-copy-1",
        name: "Copy 1 of the signed original, marked COPY",
        covers: "§3.4",
        contains: [
          { kind: "form", id: "form-bid" },
          { kind: "price", id: "price" },
          { kind: "form", id: "form-noncollusion" },
          { kind: "form", id: "form-everify" },
          { kind: "form", id: "form-iran" },
          { kind: "form", id: "form-w9" },
          { kind: "form", id: "form-refs" },
          { kind: "form", id: "form-perf-letter" },
          { kind: "form", id: "form-ack-1" },
          { kind: "upload", id: "ask-permit" },
          { kind: "upload", id: "ask-cfpm" },
          { kind: "upload", id: "ask-food-handlers" },
        ],
      },
      {
        id: "pkg-copy-2",
        name: "Copy 2 of the signed original, marked COPY",
        covers: "§3.4",
        contains: [
          { kind: "form", id: "form-bid" },
          { kind: "price", id: "price" },
          { kind: "form", id: "form-noncollusion" },
          { kind: "form", id: "form-everify" },
          { kind: "form", id: "form-iran" },
          { kind: "form", id: "form-w9" },
          { kind: "form", id: "form-refs" },
          { kind: "form", id: "form-perf-letter" },
          { kind: "form", id: "form-ack-1" },
          { kind: "upload", id: "ask-permit" },
          { kind: "upload", id: "ask-cfpm" },
          { kind: "upload", id: "ask-food-handlers" },
        ],
      },
    ],
    markings: [
      `Outside of the envelope: "SEALED BID – IFB No. ${NOTICE} – Inmate Meal Service – DO NOT OPEN"`,
      `Outside of the envelope: the opening date, ${D(DUE)}, and your name and address`,
      'Front page of the original: "ORIGINAL". Front page of each copy: "COPY".',
    ],
    checklist: [
      {
        id: "chk-internal",
        label: `Internal deadline: ${WD(DUE - 1)}, 2:00 PM Eastern Time, one day early`,
        auto: true,
      },
      {
        id: "chk-prebid",
        label: `Attend the pre-bid conference, ${WD(PREBID)}, 10:00 AM. Sign the attendance sheet.`,
      },
      {
        id: "chk-sign",
        label:
          "Use blue ink to sign the bid form, Forms C-1 to C-3 and the W-9. Sign each addendum form and the bid bond too.",
      },
      { id: "chk-notary", label: "Sign Forms C-1 and C-2 in front of a notary." },
      {
        id: "chk-attach",
        label:
          "Put a copy of your food permit, your manager certificate and each cook's food-handler certificate in each set.",
      },
      { id: "chk-copies", label: "Make two copies of the signed original. Mark each one COPY." },
      {
        id: "chk-envelope",
        label: "Seal the original, both copies and the bid bond in one marked envelope.",
      },
      {
        id: "chk-deliver",
        label: `Deliver the envelope to Room 214 by hand or courier. The office is closed on ${DM(CLOSED)}.`,
      },
      {
        id: "chk-opening",
        label: `Optional: attend the public opening in Conference Room 3A at 2:00 PM on ${DM(DUE)}.`,
      },
      {
        id: "chk-receipt",
        label: "Ask for a date-stamped receipt, and upload a photo of it here.",
      },
    ],
    certifying: [
      "Your prices were set without talking to any other bidder.",
      "Your company follows North Carolina's E-Verify law, or has fewer than 25 employees there.",
      "Your company is not on the state's Iran Divestment list.",
      "The tax ID and legal name on your W-9 are correct.",
      "Each reference job was work your company did.",
      "Your prices stay open for 60 days after the opening.",
      "You received every addendum and priced its changes.",
      "If you win, you give the performance and payment bond within 10 days.",
    ],
  },

  reviewerFindings: [],

  addenda: [
    {
      id: "add-1",
      number: 1,
      fileId: ADD1,
      postedDaysFromNow: 6,
      arrivesDuringBuild: true,
      otherChanges: 2,
      changes: [
        {
          id: "chg-regular",
          what: "Regular meals, yearly estimate",
          source: S_ADD_POP,
          before: `${num(REGULAR_QTY)} meals, for ${POPULATION} people a day`,
          now: `${num(REGULAR_QTY_AFTER)} meals, for ${POPULATION_AFTER} people a day`,
          effect: "reopened",
          effectText: `Your price was built on ${POPULATION} people a day. The total and both bond amounts rise.`,
          patch: { kind: "price-qty", lineId: "line-regular", qty: REGULAR_QTY_AFTER },
        },
        {
          id: "chg-diet",
          what: "Diet meals, yearly estimate",
          source: S_ADD_DIET,
          before: `${num(DIET_QTY)} meals`,
          now: `${num(DIET_QTY_AFTER)} meals`,
          effect: "reopened",
          effectText: "Your price total changes, so it needs your approval again.",
          patch: { kind: "price-qty", lineId: "line-diet", qty: DIET_QTY_AFTER },
        },
        {
          id: "chg-kitchen",
          what: "Kitchen distance",
          source: S_ADD_KITCHEN,
          before: "Any kitchen with a food permit",
          now: "A permitted kitchen within 30 road miles of the annex",
          effect: "reopened",
          effectText:
            "Confirm that the kitchen on your permit is within 30 road miles of the annex. The permit rule stays open until you do.",
          patch: {
            kind: "requirement",
            requirementId: "req-permit",
            label: "Food permit for a kitchen within 30 miles of the annex",
          },
        },
        {
          id: "chg-trays",
          what: "Meal trays",
          source: S_ADD_TRAYS,
          before: "Stated two ways: Section 5.4 and Attachment A",
          now: "Disposable trays that you supply",
          effect: "updated",
          effectText: "This settles your tray question. Your food cost per meal includes trays.",
          patch: { kind: "none" },
        },
      ],
      stillValid:
        "Still the same: the deadline, bonds, insurance, references and forms. Ava added the Addendum 1 acknowledgment to your package.",
      settlesClarificationId: "clar-trays",
    },
  ],

  // A bond is written as 5% and grows with the bid. A check has a fixed
  // amount, so the check compares it with 5% of the total.
  bidSecurity: {
    percent: 5,
    source: S_DEPOSIT,
    bondAskId: "ask-bid-bond",
    check: { askId: "ask-cert-check", fieldId: "check-amount" },
  },

  // Page 1 facts that no other part of the bid carries. A null is a fact the
  // county's files do not state: page 1 shows "Not stated".
  overview: {
    noticeType: {
      text: "Invitation for Bids, a sealed bid. The lowest complete bid wins.",
      source: S_AWARD,
    },
    summary: {
      text: `Three meals a day at the county's Detention Annex. It has ${BEDS} beds and about ${POPULATION} people on an average day. You cook the meals in your kitchen and deliver them hot.`,
      source: S_MEALS,
    },
    work: [
      {
        text: "Breakfast, lunch and dinner, 365 days a year, each by a set time.",
        source: S_MEALS,
      },
      {
        text: "Medical and religious diets, each started within 24 hours of the order.",
        source: S_DIETS,
      },
      {
        text: "Delivery to the annex in sealed heated carts, in your own vehicle.",
        source: S_DELIVERY,
      },
      {
        text: "Emergency meals for everyone at the annex within 2 hours of the county's call.",
        source: S_EMERGENCY,
      },
      {
        text: "Menus of at least 2,500 calories a day, on the county's 5-week cycle.",
        source: S_CALORIES,
      },
    ],
    place: {
      text: "The Detention Annex loading dock. You cook in your own kitchen.",
      source: S_DELIVERY,
    },
    hours: {
      text: "Breakfast by 5:30 AM, lunch by 11:00 AM and dinner by 4:30 PM, every day.",
      source: S_MEALS,
    },
    staffing: null,
    serviceLevels: {
      text: "Hot food at 135°F or more when it arrives. Diets start within 24 hours.",
      source: S_DELIVERY,
    },
    outOfScope: null,
    term: {
      text: "One year, then up to four yearly renewals. A price rise at renewal is 4% at most.",
      source: S_RENEW,
    },
    estimatedValue: null,
    penalties: null,
    contact: {
      name: BUYER.name,
      role: `${BUYER.title}, Cumberland County`,
      email: BUYER.email,
      source: S_QUESTIONS,
    },
    questionsChannel: {
      text: `In writing, by email only, to ${BUYER.name}. The county answers by addendum.`,
      source: S_QUESTIONS,
    },
    noContact: null,
    buyerPortal: null,
    dates: [
      {
        id: "prebid",
        label: "Pre-bid conference at the Detention Annex",
        daysFromNow: PREBID,
        time: "10:00 AM",
        mandatory: true,
        source: S_PREBID,
      },
      {
        id: "office-closed",
        label: "The Purchasing Office is closed for a County holiday",
        daysFromNow: CLOSED,
        source: S_CLOSED,
      },
      {
        id: "opening",
        label: "Public opening, Conference Room 3A",
        daysFromNow: DUE,
        time: "2:00 PM",
        source: S_OPENING,
      },
    ],
    expectedAward: null,
    start: null,
    validity: { text: "Your prices stay open for 60 days after the opening.", source: S_FIRM },
    setAside: null,
    size: null,
    lateRule: {
      text: "A late bid is returned unopened. The county does not take bids by email or fax.",
      source: S_NO_EMAIL,
    },
  },

  samLegalName: PERSONA.businessName,
  nameInDraft: PERSONA.businessName,
};

/** Starts fresh: the member has not pressed Start on this bid. */
export const cumberlandSeed: Partial<BidState> = {};

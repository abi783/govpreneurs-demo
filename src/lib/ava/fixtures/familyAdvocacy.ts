// Ava fixture · Family Advocacy print and digital ads at Fort Bragg (federal).
// DEMO: the agency's hero bid (src/demo/members/agency, the Level Up story).
//
// A federal Request for Quote: a combined synopsis and solicitation for
// commercial services on the SF 1449, set aside for certified woman-owned
// small businesses. Best value: the technical approach counts most, then past
// performance, then price. A base year and four option years, all firm fixed
// price, so five years of weekly print must be priced today.
//
// THE STORY: the Army Community Service Family Advocacy Program wants its
// prevention messages in front of military families on Fort Bragg and within
// 30 miles: 24 captioned videos a year, monthly social, display and search
// ads, a weekly ad in each of four local papers, and a weekly ad on "the
// contractor's own mobile app", with a named project manager and alternate.
// Dana Okafor (Lantern Row Creative) has no app. The work statement is
// modeled on the real one for this program (PANMCC-21-P-000-009052); every
// quotation below is the demo's own wording of it, inside a doc() call.
//
// THIS BID IS ALREADY IN PROGRESS. Where it starts is built from her real
// answers in lib/ava/starts/familyAdvocacy.ts: three questions wait on her
// (the pack's section 8): her project manager and alternate, how she makes
// the 24 videos, and how the quote covers the app line.
//
// The member is always the agency: this file reads her own records
// (src/demo/members/agency/persona.ts), not the active member's, so the bid
// reads the same whichever story the demo opens on. The wage determination
// rates are sample values for this demo, not a real Department of Labor
// schedule. No section numbers from the federal rulebook are cited.

import { buyerPeople, REFERENCE_CONTACTS } from "../../../demo/ava/contacts";
import { HERO_IDS } from "../../../demo/members/agency/opportunities";
import { PERSONA, PAST_PERFORMANCE } from "../../../demo/members/agency/persona";
import { getGrantBrief } from "../../../demo/story/grantBriefs";
import { getOpportunity } from "../../../demo/story/opportunities";
import { PLACES } from "../../../demo/story/places";
import type { PastPerformance } from "../../../demo/story/persona";
import { doc, profile, sam, yourDoc } from "../build";
import type { AskAnswer } from "../store";
import type { AvaBid, Proof } from "../types";
import { D, DM, ET_OFFSET, ISO, US } from "./when";

// ─── The story's facts for this bid ───

export const FAMILY_ADVOCACY_ID = HERO_IDS.hero;
const ID = FAMILY_ADVOCACY_ID;

const STORY = getOpportunity(ID);
const BRIEF = getGrantBrief(ID);
if (!STORY || !BRIEF) throw new Error(`The story has no bid ${ID}`);

/** Days from today to the day Grant's brief names: "Questions due". */
function briefDay(label: string): number {
  const d = BRIEF!.keyDates.find((k) => k.label === label);
  if (!d) throw new Error(`Grant's brief for ${ID} has no date "${label}"`);
  return d.inDays;
}

const DUE_DAYS = STORY.closesInDays;
const QUESTIONS_DAYS = briefDay("Questions due");
const AWARD_DAYS = briefDay("Expected award");
const POSTED = -STORY.postedDaysAgo;
/** The contracting officer the opportunity page names takes the quotes; the
 *  contract specialist beside her takes the questions. */
const { primary: CO, second: SPEC } = buyerPeople(ID);
/** Miles from her office to the installation. */
const MILES = PLACES[STORY.place].milesFromBase;
/** The area the ads must reach, in the work statement. */
const RADIUS = 30;
const VIDEOS = 24;
const PAPERS = 4;
const WEEKS = 52;
const INSERTIONS = PAPERS * WEEKS;
const OPTION_YEARS = 4;
/** The yearly increase the four papers state on their current rate cards. */
const PAPER_INCREASE = 3;

// ─── Her past jobs, from the story ───

function pastJob(id: PastPerformance["id"]): PastPerformance {
  const job = PAST_PERFORMANCE.find((p) => p.id === id);
  if (!job) throw new Error(`The agency story has no past job ${id}`);
  return job;
}

const JOB_NCNG = pastJob("pp-ncng-recruiting");
const JOB_CITY = pastJob("pp-fayetteville-stormwater");
const JOB_LONGLEAF = pastJob("pp-longleaf-hiring");
const JOB_DENTAL = pastJob("pp-two-rivers-dental");

/** The day her federal registration ends, as Ava writes a date. */
const SAM_UNTIL = (() => {
  const [y, m, d] = PERSONA.samActiveUntil.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
})();

/** A past date as the draft writes it: "1 March 2025". History, so fixed. */
function pastDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
const pastYear = (iso: string) => iso.slice(0, 4);
const money = (n: number) => `$${n.toLocaleString("en-US")}`;
/** Her short name as a file name: "Lantern_Row_Creative". */
const SHORT_FILE = PERSONA.businessShortName.replace(/\s+/g, "_");

/** Her NC Guard contract, the one federal prime on her record (the pack, section 2). */
const NCNG_CONTRACT = "W91242-25-P-A118";
const NCNG_FILE = `NC_Guard_Contract_${NCNG_CONTRACT}.pdf`;

/** The people on this job. Tasha Greene is her account director (fictional). */
const ACCOUNT_DIRECTOR = "Tasha Greene";
const OWNER = `${PERSONA.ownerName}, ${PERSONA.ownerTitle.toLowerCase()}`;
const REF_NCNG = {
  name: "Owen Pryor",
  title:
    "Advertising and Marketing Officer, NC Army National Guard Recruiting & Retention Battalion",
};
const REF_CITY = { name: JOB_CITY.referenceName!, title: JOB_CITY.referenceTitle! };
const REF_LONGLEAF = { name: JOB_LONGLEAF.referenceName!, title: JOB_LONGLEAF.referenceTitle! };

// ─── The buyer's files ───

const RFQ = "fa-f-rfq";
const PWS = "fa-f-pws";
const SHEET = "fa-f-price";
const WD = "fa-f-wd";

// ─── Sources used more than once ───

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
  "This acquisition is set aside 100% for Women-Owned Small Business (WOSB) concerns. The Offeror must be a certified WOSB, and registered as such in SAM, at the time it submits its quote.",
);
const S_SIZE = doc(
  RFQ,
  "Section 1.2, page 1",
  "§1.2",
  "The NAICS code for this acquisition is 541810, Advertising Agencies. The Offeror must be small under the size standard for this code.",
);
const S_DUE = doc(
  RFQ,
  "Section 1.4, page 2",
  "§1.4",
  `Quotes are due no later than 11:00 AM Eastern Time (ET) on ${US(DUE_DAYS)}. Quotes received after this time will not be considered.`,
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
  "Offerors shall not contact Army Community Service or Family Advocacy Program staff about this requirement. All communication shall go through the Contract Specialist.",
);
const S_VALID = doc(
  RFQ,
  "Section 1.6, page 2",
  "§1.6",
  "Quotes shall remain valid for 60 calendar days after the closing date.",
);
const S_CONTRACT = doc(
  RFQ,
  "Section 2.1, page 5",
  "§2.1",
  "The Government intends to award a single Firm-Fixed-Price contract with a 12-month base period and four 12-month option periods.",
);
const S_FIXED = doc(
  RFQ,
  "Section 2.2, page 5",
  "§2.2",
  "Prices for each period are firm. The Government will not adjust any price for changes in newspaper, digital or other media rates during a period.",
);
const S_SIGN = doc(
  RFQ,
  "Section 3.1, page 18",
  "§3.1",
  "Offerors shall complete and sign blocks 12, 17a, 30a, 30b and 30c of the SF 1449.",
);
const S_TECH = doc(
  RFQ,
  "Section 3.2, page 18",
  "§3.2",
  `Volume I, Technical Approach, shall not exceed six (6) pages. It shall describe how the Offeror will reach military families within ${RADIUS} miles of Fort Bragg, produce the videos, place the print, digital and app advertisements, and staff the work, including the Project Manager and the Alternate.`,
);
const S_PP = doc(
  RFQ,
  "Section 3.3, page 19",
  "§3.3",
  "Volume II, Past Performance, has no page limit. Provide at least two (2) and no more than three (3) references for similar work performed within the past five (5) years, and complete Attachment 4 for each, including a point of contact with current telephone number and email.",
);
const S_PRICE = doc(
  RFQ,
  "Section 3.4, page 19",
  "§3.4",
  "Volume III, Price, shall be the completed Attachment 2, Price Schedule, in its Excel format. Enter a unit price for every CLIN for the base period and each option period. State any yearly increase in the option periods.",
);
const S_REPS = doc(
  RFQ,
  "Section 3.5, page 20",
  "§3.5",
  "Offerors shall confirm that their representations and certifications in SAM are current and accurate, and complete any provision in this RFQ that is not covered in SAM.",
);
const S_EMAIL = doc(
  RFQ,
  "Section 3.6, page 20",
  "§3.6",
  `Quotes shall be emailed to ${CO.email} with the subject line: RFQ ${ID} – [Offeror Name]. Each volume shall be a separate file. Total attachments shall not exceed 10 MB.`,
);
const S_AWARD = doc(
  RFQ,
  "Section 4.1, page 21",
  "§4.1",
  "Award will be made to the responsible Offeror whose quote represents the best value to the Government. Technical Approach is more important than Past Performance. Technical Approach and Past Performance, combined, are more important than Price.",
);
const S_EVAL_TECH = doc(
  RFQ,
  "Section 4.2(a), page 21",
  "§4.2(a)",
  `Technical Approach will be evaluated on how well the quote shows it will reach military families within ${RADIUS} miles of Fort Bragg with clear, accurate prevention messages, and on the staffing plan.`,
);
const S_EVAL_PP = doc(
  RFQ,
  "Section 4.2(b), page 21",
  "§4.2(b)",
  "Past Performance will be evaluated for relevance and quality, based on the references for similar work performed within the past five (5) years.",
);
const S_EVAL_PRICE = doc(
  RFQ,
  "Section 4.2(c), page 22",
  "§4.2(c)",
  "Price will be evaluated by adding the extended prices for all CLINs in the base period and all option periods.",
);
const S_AWARD_DATE = doc(
  RFQ,
  "Section 4.3, page 22",
  "§4.3",
  `The Government expects to make the award on or about ${US(AWARD_DAYS)}.`,
);
const S_SAM = doc(
  RFQ,
  "Section 5.2, page 24",
  "§5.2",
  "An Offeror shall be registered in SAM when submitting an offer or quotation, and shall continue to be registered until time of award, during performance, and through final payment.",
);
const S_SUBS = doc(
  RFQ,
  "Section 5.3, page 25",
  "§5.3",
  "The Contractor will not pay more than 50 percent of the amount paid by the Government for services to subcontractors that are not similarly situated entities.",
);
const S_WAWF = doc(
  RFQ,
  "Section 5.4, page 26",
  "§5.4",
  "Payment requests shall be submitted electronically through Wide Area WorkFlow (WAWF) in the Procurement Integrated Enterprise Environment (PIEE).",
);
const S_PAY = doc(
  RFQ,
  "Section 5.4, page 26",
  "§5.4",
  "Payment will be made within 30 days after receipt of a proper invoice.",
);
const S_INSURANCE = doc(
  RFQ,
  "Section 5.5, page 27",
  "§5.5",
  "Before starting work, the Contractor shall have general liability insurance of at least $500,000 per occurrence, and workers' compensation as required by State law.",
);
const S_SCA = doc(
  RFQ,
  "Section 5.6, page 27",
  "§5.6",
  "The Contractor shall pay service employees not less than the wage rates and fringe benefits in the Wage Determination at Attachment 3.",
);
const S_RIGHTS = doc(
  RFQ,
  "Section 5.7, page 28",
  "§5.7",
  "All videos, artwork, scripts and copy produced under this contract are the property of the Government and may be used by the Government without further payment.",
);
const S_REF_FORM = doc(
  RFQ,
  "Attachment 4, page 31",
  "Att. 4",
  "PAST PERFORMANCE REFERENCE FORM. Complete one form per reference. Point of contact name, title, telephone number and email address are required.",
);

const S_SCOPE = doc(
  PWS,
  "Section 2.1, page 2",
  "PWS 2.1",
  `The Contractor shall plan, produce and place print and digital advertisements for the Family Advocacy Program that reach military families living on Fort Bragg and within ${RADIUS} miles of the installation.`,
);
const S_NOT_TV = doc(
  PWS,
  "Section 2.2, page 2",
  "PWS 2.2",
  "Television, cable and streaming advertising are not part of this requirement.",
);
const S_VIDEOS = doc(
  PWS,
  "Section 3.1, page 3",
  "PWS 3.1",
  "The Contractor shall produce twenty-four (24) videos per contract year, each 15 to 30 seconds long, with open captions.",
);
const S_DIGITAL = doc(
  PWS,
  "Section 3.2, page 4",
  "PWS 3.2",
  `The Contractor shall run social media, display and search advertisements each month, targeted to adults within ${RADIUS} miles of Fort Bragg, and report impressions, clicks and video views by the 10th day of the following month.`,
);
const S_PRINT = doc(
  PWS,
  "Section 3.3, page 5",
  "PWS 3.3",
  "The Contractor shall place one advertisement each week in each of the four (4) local newspapers listed in Technical Exhibit 1, in the size listed there.",
);
const S_APP = doc(
  PWS,
  "Section 3.4, page 5",
  "PWS 3.4",
  "The Contractor shall run an App Splash advertisement on the contractor's own mobile application at least once each week.",
);
const S_PM = doc(
  PWS,
  "Section 4.1, page 6",
  "PWS 4.1",
  "The Contractor shall provide a Project Manager and an Alternate, named in writing, who shall be available to the Contracting Officer's Representative from 0800 to 1630, Monday through Friday, except federal holidays.",
);
const S_APPROVAL = doc(
  PWS,
  "Section 4.2, page 6",
  "PWS 4.2",
  "All scripts, artwork and advertisements require Government approval before release. The Government will approve or return content within five (5) business days.",
);
const S_KICKOFF = doc(
  PWS,
  "Section 5.1, page 7",
  "PWS 5.1",
  "The Contractor shall attend a kickoff meeting at Fort Bragg within ten (10) days after award.",
);
const S_ACCESS = doc(
  PWS,
  "Section 6.1, page 8",
  "PWS 6.1",
  "Contractor personnel who film on the installation shall obtain installation access, including a criminal background check, before filming.",
);

const S_WD_RATES = doc(
  WD,
  "Revision 26, page 2, occupation list",
  "WD Rev 26",
  "13042 - Illustrator II 25.10 | 13072 - Photographer II 23.40",
);
const S_WD_ILLUSTRATOR = doc(WD, "Revision 26, page 2", "WD 13042", "13042 - Illustrator II 25.10");
const S_WD_PHOTO = doc(WD, "Revision 26, page 2", "WD 13072", "13072 - Photographer II 23.40");
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

// ─── The member's own record ───
// Four kinds of source, one chip each in her bid (BidText.tsx): SAM.gov, Your
// profile, Your file (a document she gave GovPreneurs) and Your answer.

const NCNG_AT = "Your jobs list: NC Army National Guard digital recruiting campaign";
const CITY_AT = "Your jobs list: City of Fayetteville stormwater campaign";
const LONGLEAF_AT = "Your jobs list: Longleaf Home Health hiring campaign";

const P_SAM_WOSB: Proof = sam(
  "Business types",
  "Woman-Owned Small Business (WOSB), certified by the SBA",
);
const P_SAM_ADDRESS: Proof = sam("Physical address", PERSONA.physicalAddress);
const P_YEARS: Proof = profile("Your strengths", PERSONA.differentiators[0]);
const P_CREW: Proof = profile("Your studio", PERSONA.kitchen ?? "");
const P_STAFF: Proof = profile("Your company size", `People on staff: ${PERSONA.employeesW2}`);
const P_LEADS: Proof = profile("Your strengths", PERSONA.differentiators[3]);

const P_NCNG_SCOPE: Proof = yourDoc(
  NCNG_FILE,
  "Statement of work, page 2",
  JOB_NCNG.scopeDescription,
);
const P_NCNG_TERMS: Proof = yourDoc(
  NCNG_FILE,
  "Page 1, blocks 3 and 20",
  `Contract ${NCNG_CONTRACT}. ${pastDate(JOB_NCNG.periodStart)} to ${pastDate(JOB_NCNG.periodEnd)}. Total ${money(JOB_NCNG.totalValue)}.`,
);
const P_NCNG_ROLE: Proof = yourDoc(
  NCNG_FILE,
  "Page 1, block 17a",
  `Contractor: ${PERSONA.businessName}`,
);
const P_NCNG_COR: Proof = yourDoc(
  NCNG_FILE,
  "Page 3, contract administration",
  `Contracting Officer's Representative: ${REF_NCNG.name}, ${REF_NCNG.title}`,
);
const P_NCNG_RATING: Proof = profile(NCNG_AT, "Performance rating (CPARS): not written yet");

const P_CITY_SCOPE: Proof = profile(CITY_AT, JOB_CITY.scopeDescription);
const P_CITY_TERMS: Proof = profile(
  CITY_AT,
  `${pastDate(JOB_CITY.periodStart)} to ${pastDate(JOB_CITY.periodEnd)}. Total value ${money(JOB_CITY.totalValue)}.`,
);
const P_CITY_ROLE: Proof = profile(
  CITY_AT,
  "Role on this job: main contractor (prime), for the city.",
);
const P_CITY_REF: Proof = profile(CITY_AT, `Reference: ${REF_CITY.name}, ${REF_CITY.title}.`);

const P_LONG_SCOPE: Proof = profile(LONGLEAF_AT, JOB_LONGLEAF.scopeDescription);
const P_LONG_TERMS: Proof = profile(
  LONGLEAF_AT,
  `${pastDate(JOB_LONGLEAF.periodStart)} to ${pastDate(JOB_LONGLEAF.periodEnd)}. Total value ${money(JOB_LONGLEAF.totalValue)}.`,
);
const P_LONG_ROLE: Proof = profile(
  LONGLEAF_AT,
  "Role on this job: main contractor (prime), for the company.",
);
const P_LONG_REF: Proof = profile(
  LONGLEAF_AT,
  `Reference: ${REF_LONGLEAF.name}, ${REF_LONGLEAF.title}.`,
);

// ─── The staffing plan ───
// One plan: the price pays for these hours, and the writing describes these
// people. Hours are paid hours in a contract week, 52 weeks a year.

const PLAN = {
  lead: { count: 2, hoursPerWeek: 8 },
  crew: { count: 2, hoursPerWeek: 14 },
  designer: { count: 1, hoursPerWeek: 18 },
};
const PLAN_HOURS = Object.values(PLAN).reduce((n, r) => n + r.count * r.hoursPerWeek, 0);

// ─── The three questions that wait on her (the pack, section 8) ───

const PM_TEXT = {
  "pm-owner": `${OWNER}, is the project manager. ${ACCOUNT_DIRECTOR}, account director, is the alternate`,
  "pm-director": `${ACCOUNT_DIRECTOR}, account director, is the project manager. ${OWNER}, is the alternate`,
  "pm-hire":
    "The company will hire a project manager after award, and will name the project manager and the alternate in writing before work starts",
};
const VIDEO_TEXT = {
  "v-inhouse": "Its own 2-person crew shoots, edits and captions every video",
  "v-freelance":
    "Its own 2-person crew shoots, edits and captions every video, with a freelance camera operator in the months it films on post",
  "v-sub":
    "A local production company films the videos under the company's direction, and its own team writes, edits and captions each one",
};
const APP_TEXT = {
  "app-partner":
    "App Splash ads run each week on the mobile app of one of those four papers, under a written agreement with that paper",
  "app-wait":
    "The company asked the Army in writing whether a news partner's app meets the App Splash line, and will run those ads as the Army's answer directs",
  "app-exception":
    "The company takes exception to the App Splash line: it has no mobile app of its own",
};

// The sentence that proves reach, and the one Ava can add after it.
const LEAD_NCNG = `In ${pastYear(JOB_NCNG.periodStart)}, the company's NC Army National Guard campaign ran geofenced ads around 40 high schools and the State Fair`;

// ─── The bid ───

export const familyAdvocacyBid: AvaBid = {
  noticeId: ID,
  // The story owns the title, the buyer and the number (fixtures/index.ts).
  officialTitle: STORY.title,
  buyer: STORY.agency,
  bidNumber: ID,
  kind: "short-response",
  kindReason:
    "A six-page technical approach, three references and the Army's Excel price schedule, plus two forms.",

  files: [
    {
      id: RFQ,
      name: `${ID}_Combined_Synopsis_Solicitation.pdf`,
      role: "main",
      pages: 32,
      postedDaysFromNow: POSTED,
      readability: "read",
    },
    {
      id: PWS,
      name: "Attachment_1_Performance_Work_Statement.pdf",
      role: "exhibit",
      pages: 12,
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
      name: "Attachment_3_WD_2015-4281_Rev_26.pdf",
      role: "exhibit",
      pages: 9,
      postedDaysFromNow: POSTED,
      readability: "read",
    },
  ],

  deadline: {
    dueDaysFromNow: DUE_DAYS,
    time: "11:00 AM",
    time24: "11:00",
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
        id: "fa-cr-tech",
        name: "Technical approach",
        points: null,
        kind: "scored-writing",
        source: S_EVAL_TECH,
        treatment: "Counts most. Reach, the videos and the staffing plan are read closely.",
      },
      {
        id: "fa-cr-pp",
        name: "Past performance on similar work",
        points: null,
        kind: "scored-fact",
        source: S_EVAL_PP,
        treatment: "Counts second. Two or three similar jobs from the last five years.",
      },
      {
        id: "fa-cr-price",
        name: "Price",
        points: null,
        kind: "price-formula",
        source: S_EVAL_PRICE,
        treatment: "Counts least. All five years are added up.",
      },
    ],
    note: "No points. The Army weighs your writing and your record against your price.",
  },

  hardRequirements: [
    {
      id: "fa-r-wosb",
      grantRow: "ga-setaside",
      group: "eligibility",
      label: "Certified woman-owned small business when you send the quote",
      source: S_SET_ASIDE,
      // Nothing to collect: Grant's check is the result (lib/ava/grant.ts).
      initial: "meets",
      evidence: "Your registration lists you as a certified woman-owned small business.",
    },
    {
      id: "fa-r-sam",
      grantRow: "ga-sam",
      group: "eligibility",
      label: "Active federal registration when you quote, and through award",
      source: S_SAM,
      initial: "meets",
      evidence: `Your registration is active until ${SAM_UNTIL}.`,
    },
    {
      id: "fa-r-size",
      grantRow: "ga-size",
      group: "eligibility",
      label: "Small under the size standard for advertising agencies",
      source: S_SIZE,
      initial: "meets",
      evidence: `Your registration lists you as small for industry code ${PERSONA.primaryNaics}.`,
    },
    {
      id: "fa-r-sca",
      group: "pricing",
      label:
        "Pay the video crew and the designer at least the wage floors, plus $5.36 an hour for health and welfare",
      source: S_SCA,
      initial: "confirm",
      askId: "fa-ask-pay",
      askIds: ["fa-ask-hw"],
      afterAsk: "meets",
      evidenceAfter: "Your pay rates, checked against the wage determination",
    },
    {
      id: "fa-r-pm",
      grantRow: "ga-pm",
      group: "people",
      // The work statement wants them reachable once work starts. The quote's
      // staffing plan names them, so the ask is asked with the bid.
      neededAt: "work-start",
      label: "A named project manager and alternate, reachable 8:00 AM to 4:30 PM on weekdays",
      source: S_PM,
      initial: "confirm",
      askId: "fa-ask-pm",
      evidenceAfter: "Your quote names your project manager and your alternate",
    },
    {
      id: "fa-r-app",
      grantRow: "ga-app",
      group: "writing",
      neededAt: "work-start",
      label: "A weekly App Splash ad on the contractor's own mobile app",
      source: S_APP,
      initial: "confirm",
      askId: "fa-ask-app",
      evidenceAfter: "Your quote names the app that carries the ads",
    },
    {
      id: "fa-r-insurance",
      grantRow: "ga-insurance",
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
      summary:
        "Only certified woman-owned small businesses may quote. No state or local preference.",
      source: S_SET_ASIDE,
      requirementId: "fa-r-wosb",
    },
    { topic: "bonds", found: false, summary: "No bid, performance or payment bond asked for." },
    {
      topic: "insurance",
      found: true,
      summary:
        "Liability insurance before work starts. Your $1M policy is above the $500,000 minimum.",
      source: S_INSURANCE,
      requirementId: "fa-r-insurance",
    },
    {
      topic: "wages",
      found: true,
      summary:
        "Service Contract Act pay floors for the crew and the designer, plus $5.36 an hour for health and welfare.",
      source: S_SCA,
      requirementId: "fa-r-sca",
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
      summary:
        "Two or three similar jobs from the last five years, each on its own reference form.",
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
      summary: "Crew who film on post need installation access, which includes a background check.",
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
      id: "fa-c-videos",
      text: `${VIDEOS} captioned videos a year, two each month, each 15 to 30 seconds long.`,
      source: S_VIDEOS,
      pricedAs: "Priced as: about half of your team's yearly hours, spread over the 24 videos.",
      needsApproval: true,
    },
    {
      id: "fa-c-digital",
      text: `Social, display and search ads every month for adults within ${RADIUS} miles of Fort Bragg, with a report of views and clicks by the 10th of the next month.`,
      source: S_DIGITAL,
      pricedAs: "Priced as: your monthly ad spend, plus your designer's hours.",
      needsApproval: true,
    },
    {
      id: "fa-c-print",
      text: `One ad a week in each of the ${PAPERS} local papers: ${INSERTIONS} ads a year.`,
      source: S_PRINT,
      pricedAs: "Priced as: the papers' average rate for each ad, plus your designer's hours.",
      needsApproval: true,
    },
    {
      id: "fa-c-approval",
      text: "Every script and ad goes to the Army for approval before it runs.",
      source: S_APPROVAL,
      pricedAs: "Priced as: part of each person's paid hours.",
      needsApproval: true,
    },
    {
      id: "fa-c-hours",
      text: "The project manager or the alternate answers the Army from 8:00 AM to 4:30 PM, Monday to Friday.",
      source: S_PM,
      pricedAs: `Priced as: ${PLAN.lead.hoursPerWeek} hours a week each for the project manager and the alternate.`,
      needsApproval: true,
    },
    {
      id: "fa-c-price",
      text: "Prices fixed for each year of the contract. They hold even if paper or ad rates rise.",
      source: S_FIXED,
      pricedAs: "Priced as: today's rates, with your yearly increase in each option year.",
      needsApproval: false,
    },
  ],

  contractTerms: [
    {
      text: "Fixed price for each year. If paper or ad rates rise during a year, your price stays the same.",
      source: S_FIXED,
    },
    {
      text: "A 12-month base year, then four 12-month option years the Army may choose to use.",
      source: S_CONTRACT,
    },
    {
      text: "You price every option year now. Ava adds your yearly increase to each line.",
      source: S_PRICE,
    },
    {
      text: "Up to five years of weekly print at today's prices. Get each paper's rate in writing, locked for 12 months, with its yearly increase, before you send the quote.",
      source: S_PRINT,
    },
    {
      text: "The Army owns every video, ad and script you make for it.",
      source: S_RIGHTS,
    },
    {
      text: "You bill through the government's online invoicing system, called Wide Area WorkFlow. You need a free account there before the first invoice.",
      source: S_WAWF,
    },
    {
      text: "Payment arrives within 30 days of a correct invoice. You pay the papers and the ad networks first.",
      source: S_PAY,
    },
    { text: "Your prices hold for 60 days after the due date.", source: S_VALID },
    {
      text: "Other companies may get no more than half of what the Army pays you for services.",
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
      value: `${pastDate(new Date(`${PERSONA.formedOn} 12:00 UTC`).toISOString().slice(0, 10))}, in ${PERSONA.stateOfIncorporation}`,
      from: "Your Articles of Organization",
    },
    { label: "Address", value: PERSONA.physicalAddress, from: "Your federal registration" },
    {
      label: "Woman-owned small business",
      value: "Certified by the SBA",
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
    {
      label: "People on staff",
      value: String(PERSONA.employeesW2),
      from: "Your GovPreneurs profile",
    },
    { label: "Studio", value: PERSONA.kitchen ?? "", from: "Your GovPreneurs profile" },
    {
      label: "Insurance on file",
      value: "General liability $1M per occurrence.",
      from: "Your GovPreneurs profile",
    },
    {
      label: JOB_NCNG.projectTitle,
      value: `Main contractor, ${pastYear(JOB_NCNG.periodStart)}, ${money(JOB_NCNG.totalValue)}. Its federal performance rating (CPARS) is not written yet.`,
      from: "Your contract file, and your jobs list",
    },
    {
      label: JOB_CITY.projectTitle,
      value: `Main contractor, ${pastYear(JOB_CITY.periodStart)}, ${money(JOB_CITY.totalValue)}`,
      from: "Your GovPreneurs profile, jobs list",
    },
    {
      label: JOB_LONGLEAF.projectTitle,
      value: `Main contractor, ${pastYear(JOB_LONGLEAF.periodStart)}, ${money(JOB_LONGLEAF.totalValue)}, 140 hires`,
      from: "Your GovPreneurs profile, jobs list",
    },
    {
      label: JOB_DENTAL.projectTitle,
      value: `Since ${pastYear(JOB_DENTAL.periodStart)}, ${money(JOB_DENTAL.totalValue)} in all. Not used here: ads for a dental practice are not public outreach.`,
      from: "Your GovPreneurs profile, jobs list",
    },
  ],

  asks: [
    // ── The three questions that wait on her ──
    {
      id: "fa-ask-pm",
      kind: "answer",
      title: "Your project manager and alternate",
      source: S_PM,
      why: "The work statement asks for a named project manager and alternate, reachable 8:00 AM to 4:30 PM on weekdays. Your profile names no one for this job.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      // The quote's staffing plan names them, so she answers with the bid.
      neededAt: "bid",
      group: "people",
      answer: {
        type: "answer",
        question:
          "Who are your project manager and alternate? One of them must answer the Army from 8:00 AM to 4:30 PM on weekdays.",
        choices: [
          {
            id: "pm-owner",
            label: `I lead it. ${ACCOUNT_DIRECTOR}, our account director, is the alternate`,
            consequence: "Ava names you as project manager and Tasha as alternate.",
          },
          {
            id: "pm-director",
            label: `${ACCOUNT_DIRECTOR} leads it. I am the alternate`,
            consequence: "Ava names Tasha as project manager and you as alternate.",
          },
          {
            id: "pm-hire",
            label: "We hire a project manager after award",
            consequence: "Ava writes that you name both before work starts, and flags the risk.",
            gives: {
              status: "confirm",
              evidence:
                "A risk: you plan to hire a project manager after award, so your quote names no one yet",
            },
            warn: "That is a risk. The Army reads the staffing plan closely, and a quote that names no project manager can be rated lower. I wrote that you name both before work starts.",
          },
        ],
      },
      feeds: ["Draft · Staffing", "Hard requirement · Project manager and alternate"],
    },
    {
      id: "fa-ask-videos",
      kind: "answer",
      title: "How you make the 24 videos",
      source: S_VIDEOS,
      why: `The Army asks for ${VIDEOS} captioned videos a year. Your profile shows a 2-person crew. Only you know your plan for the busy months.`,
      owner: "you",
      leadDays: 0,
      minutes: 2,
      group: "writing",
      answer: {
        type: "answer",
        question: `How will you make the ${VIDEOS} videos?`,
        choices: [
          {
            id: "v-inhouse",
            label: "All in-house, with our 2-person crew",
            consequence: "Ava writes that your own crew makes every video.",
          },
          {
            id: "v-freelance",
            label: "In-house, plus a freelancer in busy months",
            consequence:
              "Ava writes your crew's plan, with a freelance camera operator in busy months.",
          },
          {
            id: "v-sub",
            label: "A local production company makes them",
            consequence: "Ava writes that a production company films under your direction.",
            warn: "Then the production company is a subcontractor. The Army caps what other companies may be paid at half of what it pays you for services, so keep the writing, editing and captions in-house.",
          },
        ],
      },
      feeds: ["Draft · Videos"],
    },
    {
      id: "fa-ask-app",
      kind: "answer",
      title: "How your quote meets the app line",
      source: S_APP,
      why: "The work statement asks for ads on the contractor's own mobile app. Your profile lists no app. Grant and Diana say to ask the Army whether a news partner's app counts.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      neededAt: "bid",
      group: "writing",
      answer: {
        type: "answer",
        question:
          "The work statement asks for ads on your own mobile app. You have none. How should your quote cover that line?",
        choices: [
          {
            id: "app-partner",
            label: "A news partner's app. Say so in the quote",
            consequence:
              "Ava writes that the ads run on one paper's app, under a written agreement.",
          },
          {
            id: "app-wait",
            label: "Wait for the Army's answer in Q&A",
            consequence: "Ava writes that you asked, and that the ads follow the Army's answer.",
            gives: {
              status: "confirm",
              evidence: `You are waiting for the Army's answer. Questions close on ${D(QUESTIONS_DAYS)}`,
            },
            warn: `Then send your question to ${SPEC.name} before questions close on ${DM(QUESTIONS_DAYS)}. Every bidder sees the answer. Until it comes, your quote says you asked.`,
          },
          {
            id: "app-exception",
            label: "Take an exception to the app line",
            failsGate:
              "An exception to the app line makes your quote non-compliant. The Army can reject a quote that does not meet every line of the work statement.",
          },
        ],
      },
      feeds: ["Draft · App ads", "Hard requirement · App ads"],
    },

    // ── Answered before the story starts ──
    {
      id: "fa-ask-pay",
      kind: "enter",
      title: "What you pay each role (3 roles)",
      source: S_WD_RATES,
      why: "The price starts from what you pay. The crew and the designer need to meet their wage floors, or you owe back pay.",
      owner: "bookkeeper",
      leadDays: 2,
      minutes: 10,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "fld-pay-lead",
            label: "Project manager or alternate, per hour",
            unit: "usd-hour",
            hint: "What you pay now, before taxes. No wage floor: this role manages the work.",
          },
          {
            id: "fld-pay-crew",
            label: "Video crew member, per hour",
            unit: "usd-hour",
            hint: "What you pay now, before taxes.",
            floor: { value: 23.4, why: "Photographer II rate in the wage determination." },
          },
          {
            id: "fld-pay-designer",
            label: "Designer who also buys the ads, per hour",
            unit: "usd-hour",
            hint: "What you pay now, before taxes.",
            floor: { value: 25.1, why: "Illustrator II rate in the wage determination." },
          },
        ],
      },
      feeds: [
        "Price · Project manager and alternate",
        "Price · Video crew",
        "Price · Designer",
        "Hard requirement · Wage floors",
      ],
    },
    {
      id: "fa-ask-hw",
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
            id: "hw-benefits",
            label: "As health insurance and other benefits",
            consequence: "Ava adds $5.36 an hour. If benefits cost less, you pay the rest as cash.",
          },
          {
            id: "hw-cash",
            label: "As extra cash in each paycheck",
            consequence: "Ava adds $5.36 to every paid hour. Payroll taxes apply to the cash.",
          },
        ],
      },
      feeds: ["Price · Health and welfare"],
    },
    {
      id: "fa-ask-payroll",
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
            value: 1.4,
            unit: "percent",
            where: "Tax summary, page 2",
          },
          {
            fieldId: "fld-wc",
            label: "Workers' comp premium",
            value: 0.8,
            unit: "percent",
            where: "Employer costs, page 3",
          },
        ],
      },
      feeds: ["Price · Unemployment tax", "Price · Workers' comp"],
    },
    {
      id: "fa-ask-media",
      kind: "enter",
      title: "What the ads cost you to place",
      source: S_PRICE,
      why: "The papers, the ad networks and the app charge you first. Only you know your rates.",
      owner: "you",
      leadDays: 3,
      minutes: 15,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "fld-paper-rate",
            label: "The four papers' average rate for one weekly ad",
            unit: "usd",
            hint: "Add each paper's rate for the ad size in Technical Exhibit 1, then divide by 4.",
          },
          {
            id: "fld-ad-spend",
            label: "Social, display and search ad spend, per month",
            unit: "usd",
            hint: "What you plan to spend with the ad networks each month.",
          },
          {
            id: "fld-app-rate",
            label: "A paper's app rate for one weekly App Splash ad",
            unit: "usd",
            hint: "From the paper whose app carries the ads.",
          },
        ],
      },
      feeds: ["Price · Print ads", "Price · Digital ads", "Price · App ads"],
    },
    {
      id: "fa-ask-pl",
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
          {
            fieldId: "fld-overhead",
            label: "Overhead, as a share of direct cost",
            value: 7.5,
            unit: "percent",
            where: "Operating expenses, page 1",
          },
        ],
      },
      feeds: ["Price · Overhead"],
    },
    {
      id: "fa-ask-contingency",
      kind: "enter",
      title: "Your contingency, for costs that run over",
      source: S_PRICE,
      why: "A reserve for costs that come in higher than you planned, such as a paper's new rate. Ava never picks it.",
      owner: "you",
      leadDays: 0,
      minutes: 5,
      deliberate: true,
      answer: {
        type: "enter",
        fields: [
          {
            id: "contingency",
            label: "Contingency, as a percent of cost",
            unit: "percent",
            hint: "Added to labor, ad costs and overhead, before profit. Enter 0 if you want none.",
          },
        ],
      },
      feeds: ["Price · Contingency"],
    },
    {
      id: "fa-ask-profit",
      kind: "enter",
      title: "Your profit, and your yearly increase for the option years",
      source: S_PRICE,
      why: "Ava never picks your margin. Price counts least here, but five fixed years make the increase matter.",
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
            label: "Yearly increase for each option year",
            unit: "percent",
            hint: `The papers' rate cards rise ${PAPER_INCREASE}% a year. Under that, your print lines lose money in later years.`,
            floor: {
              value: PAPER_INCREASE,
              why: "The yearly increase on the four papers' rate cards.",
            },
          },
        ],
      },
      feeds: ["Price · Profit", "Price · Option years"],
    },
    {
      id: "fa-ask-ref1",
      kind: "approve",
      title: "NC Army National Guard campaign as reference 1",
      source: S_PP,
      why: "It is Army work aimed at young adults near Fort Bragg, the closest match to this job.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use your NC Guard campaign as reference 1? ${REF_NCNG.name}, named in your contract, is the contact.`,
        from: "Your contract file",
        value: `${JOB_NCNG.projectTitle}. Contact: ${REF_NCNG.name}`,
        asOf: "Its federal performance rating (CPARS) is not written yet.",
      },
      feeds: ["Similar work · Reference 1", "Form · Attachment 4"],
    },
    {
      id: "fa-ask-ref2",
      kind: "approve",
      title: "City of Fayetteville stormwater campaign as reference 2",
      source: S_PP,
      why: "It shows plain public messages for local residents, as the main contractor.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use your City of Fayetteville stormwater campaign as reference 2? ${REF_CITY.name} is the contact.`,
        from: "Your GovPreneurs profile, jobs list",
        value: `${JOB_CITY.projectTitle}. Contact: ${REF_CITY.name}`,
        asOf: `The contact's title is from ${pastYear(JOB_CITY.periodStart)}. It may have changed.`,
      },
      feeds: ["Similar work · Reference 2", "Form · Attachment 4"],
    },
    {
      id: "fa-ask-ref3",
      kind: "approve",
      title: "Longleaf Home Health hiring campaign as reference 3",
      source: S_PP,
      why: "It is a year of videos, paid social and search, with lead forms: the same mix this job asks for.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `Use your Longleaf Home Health hiring campaign as reference 3? ${REF_LONGLEAF.name} is the contact.`,
        from: "Your GovPreneurs profile, jobs list",
        value: `${JOB_LONGLEAF.projectTitle}. Contact: ${REF_LONGLEAF.name}`,
      },
      feeds: ["Similar work · Reference 3", "Form · Attachment 4"],
    },
    {
      id: "fa-ask-refcontacts",
      kind: "enter",
      title: "Current phone and email for your three references",
      source: S_REF_FORM,
      why: "The Army may call them. A wrong number can weaken this part.",
      owner: "references",
      leadDays: 5,
      minutes: 10,
      answer: {
        type: "enter",
        fields: [
          { id: "fld-ref1-phone", label: `${REF_NCNG.name}, phone`, unit: "phone" },
          { id: "fld-ref1-email", label: `${REF_NCNG.name}, email`, unit: "email" },
          { id: "fld-ref2-phone", label: `${REF_CITY.name}, phone`, unit: "phone" },
          { id: "fld-ref2-email", label: `${REF_CITY.name}, email`, unit: "email" },
          { id: "fld-ref3-phone", label: `${REF_LONGLEAF.name}, phone`, unit: "phone" },
          { id: "fld-ref3-email", label: `${REF_LONGLEAF.name}, email`, unit: "email" },
        ],
      },
      feeds: ["Form · Attachment 4"],
    },
  ],

  clarifications: [],

  plan: [
    {
      id: "fa-p-tech",
      source: S_TECH,
      kind: "scored-item",
      needs: "writing",
      ifMissed: "The Army has nothing to judge your approach by.",
      answeredIn: { kind: "section", id: "fa-s-tech", label: "Technical approach" },
    },
    {
      id: "fa-p-videos",
      source: S_VIDEOS,
      kind: "instruction",
      needs: "writing",
      ifMissed: "An evaluator has to guess who makes the videos.",
      answeredIn: { kind: "section", id: "fa-s-tech", label: "Technical approach" },
      askId: "fa-ask-videos",
    },
    {
      id: "fa-p-app",
      source: S_APP,
      kind: "instruction",
      needs: "writing",
      ifMissed: "A line of the work statement with no answer reads as a gap.",
      answeredIn: { kind: "section", id: "fa-s-tech", label: "Technical approach" },
      askId: "fa-ask-app",
    },
    {
      id: "fa-p-pm",
      source: S_PM,
      kind: "instruction",
      needs: "writing",
      ifMissed: "A staffing plan with no names can be rated lower.",
      answeredIn: { kind: "section", id: "fa-s-tech", label: "Technical approach" },
      askId: "fa-ask-pm",
    },
    {
      id: "fa-p-pp",
      source: S_PP,
      kind: "scored-item",
      needs: "writing",
      ifMissed: "With fewer than two references, this part cannot be rated.",
      answeredIn: { kind: "section", id: "fa-s-pp", label: "Your three similar jobs" },
      askId: "fa-ask-ref1",
    },
    {
      id: "fa-p-refform",
      source: S_REF_FORM,
      kind: "form",
      needs: "attachment",
      ifMissed: "The Army cannot reach your references, so this part is weaker.",
      answeredIn: { kind: "form", id: "fa-fm-refs", label: "Reference forms, Attachment 4" },
      askId: "fa-ask-refcontacts",
    },
    {
      id: "fa-p-price",
      source: S_PRICE,
      kind: "instruction",
      needs: "price",
      ifMissed: "A missing unit price makes the quote incomplete.",
      answeredIn: { kind: "price", id: "price", label: "Price schedule" },
      askId: "fa-ask-profit",
    },
    {
      id: "fa-p-wages",
      source: S_SCA,
      kind: "instruction",
      needs: "price",
      ifMissed: "You owe back pay if any rate is under its wage floor.",
      answeredIn: { kind: "price", id: "price", label: "Price schedule" },
      askId: "fa-ask-pay",
    },
    {
      id: "fa-p-sf1449",
      source: S_SIGN,
      kind: "form",
      needs: "signature",
      ifMissed: "An unsigned quote may be rejected as incomplete.",
      answeredIn: { kind: "form", id: "fa-fm-sf1449", label: "SF 1449, signed by you" },
    },
    {
      id: "fa-p-reps",
      source: S_REPS,
      kind: "form",
      needs: "signature",
      ifMissed: "The Army cannot award to a company whose answers are out of date.",
      answeredIn: { kind: "form", id: "fa-fm-reps", label: "Representations and certifications" },
    },
    {
      id: "fa-p-email",
      source: S_EMAIL,
      kind: "logistics",
      needs: "action",
      ifMissed: "A quote with the wrong subject line or over 10 MB may never arrive.",
      answeredIn: { kind: "checklist", id: "fa-ck-email", label: "Checklist: email the quote" },
    },
    {
      id: "fa-p-due",
      source: S_DUE,
      kind: "logistics",
      needs: "action",
      ifMissed: "A quote after 11:00 AM Eastern Time is not considered.",
      answeredIn: {
        kind: "checklist",
        id: "fa-ck-internal",
        label: "Checklist: internal deadline",
      },
    },
  ],

  themes: [],

  sections: [
    {
      id: "fa-s-tech",
      title: "Technical approach",
      answers: S_TECH,
      criterionId: "fa-cr-tech",
      points: null,
      pageLimit: 6,
      pages: 5,
      // In Grant's order: reach, the videos, trust, then the team.
      paragraphs: [
        // 0 · Who does the work, and where it is.
        [
          {
            text: `${PERSONA.businessName} will plan, make and place the Family Advocacy Program's ads for military families on Fort Bragg and within ${RADIUS} miles of it. `,
          },
          {
            text: "The company is a certified woman-owned small business",
            claim: { id: "fa-cl-wosb", tag: "verified", proof: P_SAM_WOSB },
          },
          { text: ", based at " },
          {
            text: PERSONA.physicalAddress.replace(/, NC \d{5}$/, ""),
            claim: { id: "fa-cl-address", tag: "verified", proof: P_SAM_ADDRESS },
          },
          { text: `, ${MILES} miles from the installation. ` },
          {
            text: `It has run campaigns for military families around Fort Bragg for ${PERSONA.yearsInBusiness} years`,
            claim: { id: "fa-cl-years", tag: "verified", proof: P_YEARS },
          },
          { text: "." },
        ],
        // 1 · Reach.
        [
          {
            text: `Ads reach adults who live on post or within ${RADIUS} miles, by ZIP code and by the places families go. `,
          },
          {
            text: LEAD_NCNG,
            claim: { id: "fa-cl-ncng-reach", tag: "verified", proof: P_NCNG_SCOPE },
          },
          { text: ". " },
          {
            text: `Social, display and search ads run every month, aimed at adults within ${RADIUS} miles of Fort Bragg`,
            claim: { id: "fa-cl-digital", tag: "commitment", commitmentId: "fa-c-digital" },
          },
          { text: ". " },
          {
            text: "A report of views and clicks goes to the Army by the 10th of each month",
            claim: { id: "fa-cl-report", tag: "commitment", commitmentId: "fa-c-digital" },
          },
          { text: "." },
        ],
        // 2 · The videos.
        [
          {
            text: `The company makes ${VIDEOS} captioned videos a year, two each month`,
            claim: { id: "fa-cl-videos", tag: "commitment", commitmentId: "fa-c-videos" },
          },
          { text: ". " },
          {
            text: "Its own crew makes every video",
            claim: {
              id: "fa-cl-video-plan",
              tag: "unsupported",
              askId: "fa-ask-videos",
              gap: `[NEEDED: how you will make the ${VIDEOS} videos]`,
              resolvedText: VIDEO_TEXT["v-inhouse"],
              resolvedByChoice: VIDEO_TEXT,
            },
          },
          { text: ". " },
          {
            text: "The crew works from the company's studio and edit suite at 112 Person St",
            claim: { id: "fa-cl-studio", tag: "verified", proof: P_CREW },
          },
          {
            text: ". Each video runs 15 to 30 seconds and has open captions, so it works with the sound off.",
          },
        ],
        // 3 · Print and the app.
        [
          {
            text: `One ad runs each week in each of the ${PAPERS} local papers in Technical Exhibit 1`,
            claim: { id: "fa-cl-print", tag: "commitment", commitmentId: "fa-c-print" },
          },
          { text: ". " },
          {
            text: "App Splash ads run each week",
            claim: {
              id: "fa-cl-app",
              tag: "unsupported",
              askId: "fa-ask-app",
              gap: "[NEEDED: how your quote meets the app line]",
              resolvedText: APP_TEXT["app-partner"],
              resolvedByChoice: APP_TEXT,
            },
          },
          { text: "." },
        ],
        // 4 · Trust.
        [
          {
            text: "Messages stay plain and calm. They tell families where to get help before a crisis. ",
          },
          {
            text: "Every script and ad goes to the Army for approval before it runs",
            claim: { id: "fa-cl-approval", tag: "commitment", commitmentId: "fa-c-approval" },
          },
          { text: ". " },
          {
            text: `The company's ${pastYear(JOB_CITY.periodStart)} stormwater campaign for the City of Fayetteville used short videos and a bilingual flyer to reach residents in plain words`,
            claim: { id: "fa-cl-city", tag: "verified", proof: P_CITY_SCOPE },
          },
          { text: "." },
        ],
        // 5 · The team: the one staffing plan the price uses.
        [
          {
            text: "The project manager and the alternate are named here",
            claim: {
              id: "fa-cl-pm",
              tag: "unsupported",
              askId: "fa-ask-pm",
              gap: "[NEEDED: your project manager and alternate]",
              resolvedText: PM_TEXT["pm-owner"],
              resolvedByChoice: PM_TEXT,
            },
          },
          { text: ". " },
          {
            text: "One of them answers the Army from 8:00 AM to 4:30 PM, Monday to Friday",
            claim: { id: "fa-cl-hours", tag: "commitment", commitmentId: "fa-c-hours" },
          },
          { text: ". " },
          {
            text: `The company has ${PERSONA.employeesW2} people on staff`,
            claim: { id: "fa-cl-staff", tag: "verified", proof: P_STAFF },
          },
          {
            text: `. The work uses ${PLAN_HOURS} paid hours a week: the project manager and the alternate, the 2-person video crew, and a designer who also buys the ads.`,
          },
        ],
      ],
      // Grant says to test messages with families. Only Dana knows if she does.
      decisions: [
        {
          id: "fa-dec-tested",
          paragraphIndex: 4,
          choice: "Messages stay plain and calm.",
          other:
            "Messages stay plain and calm, and each one is tried first with a few military spouses.",
        },
      ],
      challenges: [
        {
          id: "fa-ch-reach",
          prompt: "Why use the NC Guard campaign to show reach?",
          reasoning:
            "Ava's reasoning: it is Army work aimed at young adults near Fort Bragg, with geofenced ads like the ones this job needs. The City of Fayetteville job shows plain public messages, so it sits under trust. Its rating is not written yet, so the section leans on what the campaign did.",
          options: [
            {
              id: "fa-ch-reach-leads",
              label: "Keep it, and add the lead forms that text a caseworker",
              paragraphIndex: 1,
              redline: {
                remove: LEAD_NCNG,
                insert: [
                  {
                    text: LEAD_NCNG,
                    claim: { id: "fa-cl-ncng-reach-b", tag: "verified", proof: P_NCNG_SCOPE },
                  },
                  { text: ". " },
                  {
                    text: "The company's lead forms text a recruiter or caseworker within 5 minutes",
                    claim: { id: "fa-cl-leads", tag: "verified", proof: P_LEADS },
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      id: "fa-s-pp",
      title: "Past performance: three similar campaigns",
      answers: S_PP,
      criterionId: "fa-cr-pp",
      points: null,
      pageLimit: null,
      pages: 2,
      paragraphs: [
        [
          { text: "Reference 1: " },
          {
            text: `${JOB_NCNG.projectTitle}, contract ${NCNG_CONTRACT}, ${pastDate(JOB_NCNG.periodStart)} to ${pastDate(JOB_NCNG.periodEnd)}, ${money(JOB_NCNG.totalValue)}`,
            claim: { id: "fa-cl-r1-terms", tag: "verified", proof: P_NCNG_TERMS },
          },
          { text: ". " },
          {
            text: `${PERSONA.businessShortName} was the prime contractor`,
            claim: { id: "fa-cl-r1-role", tag: "verified", proof: P_NCNG_ROLE },
          },
          { text: ". " },
          {
            text: "The work was six 15-second videos, geofenced ads around 40 high schools and the State Fair, and a lead form that sent each lead to a recruiter within 5 minutes",
            claim: { id: "fa-cl-r1-scope", tag: "verified", proof: P_NCNG_SCOPE },
          },
          { text: ". " },
          {
            text: "Its federal performance rating (CPARS) is not written yet",
            claim: { id: "fa-cl-r1-rating", tag: "verified", proof: P_NCNG_RATING },
          },
          { text: ". Contact: " },
          {
            text: `${REF_NCNG.name}, ${REF_NCNG.title}`,
            claim: { id: "fa-cl-r1-contact", tag: "verified", proof: P_NCNG_COR },
          },
          { text: "." },
        ],
        [
          { text: "Reference 2: " },
          {
            text: `${JOB_CITY.projectTitle}, ${pastDate(JOB_CITY.periodStart)} to ${pastDate(JOB_CITY.periodEnd)}, ${money(JOB_CITY.totalValue)}`,
            claim: { id: "fa-cl-r2-terms", tag: "verified", proof: P_CITY_TERMS },
          },
          { text: ". " },
          {
            text: "It was a direct contract with the City of Fayetteville",
            claim: { id: "fa-cl-r2-role", tag: "verified", proof: P_CITY_ROLE },
          },
          { text: ". " },
          {
            text: "The work was bus-shelter and social ads, two short videos and a bilingual flyer that told residents what not to pour down storm drains",
            claim: { id: "fa-cl-r2-scope", tag: "verified", proof: P_CITY_SCOPE },
          },
          { text: ". Contact: " },
          {
            text: `${REF_CITY.name}, ${REF_CITY.title}`,
            claim: { id: "fa-cl-r2-contact", tag: "verified", proof: P_CITY_REF },
          },
          { text: "." },
        ],
        [
          { text: "Reference 3: " },
          {
            text: `${JOB_LONGLEAF.projectTitle}, ${pastDate(JOB_LONGLEAF.periodStart)} to ${pastDate(JOB_LONGLEAF.periodEnd)}, ${money(JOB_LONGLEAF.totalValue)}`,
            claim: { id: "fa-cl-r3-terms", tag: "verified", proof: P_LONG_TERMS },
          },
          { text: ". " },
          {
            text: "It was a direct contract with the company",
            claim: { id: "fa-cl-r3-role", tag: "verified", proof: P_LONG_ROLE },
          },
          { text: ". " },
          {
            text: "The work was a year of recruiting videos, paid social and search ads, and a lead form that texted the recruiter. It led to 140 hires",
            claim: { id: "fa-cl-r3-scope", tag: "verified", proof: P_LONG_SCOPE },
          },
          { text: ". Contact: " },
          {
            text: `${REF_LONGLEAF.name}, ${REF_LONGLEAF.title}`,
            claim: { id: "fa-cl-r3-contact", tag: "verified", proof: P_LONG_REF },
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
    // The one staffing plan. The technical approach describes these same people.
    roles: [
      {
        id: "fa-role-lead",
        name: "Project manager and alternate",
        ...PLAN.lead,
        pay: { askId: "fa-ask-pay", fieldId: "fld-pay-lead" },
      },
      {
        id: "fa-role-crew",
        name: "Video crew",
        ...PLAN.crew,
        pay: { askId: "fa-ask-pay", fieldId: "fld-pay-crew" },
        wageFloor: { perHour: 23.4, source: S_WD_PHOTO },
      },
      {
        id: "fa-role-designer",
        name: "Designer who also buys the ads",
        ...PLAN.designer,
        pay: { askId: "fa-ask-pay", fieldId: "fld-pay-designer" },
        wageFloor: { perHour: 25.1, source: S_WD_ILLUSTRATOR },
      },
    ],
    burden: [
      {
        id: "fa-b-fica",
        label: "Social Security and Medicare",
        from: { kind: "law", rate: 7.65, text: "The employer share set by federal law." },
      },
      {
        id: "fa-b-hw",
        label: "Health and welfare",
        from: {
          kind: "per-hour",
          amount: 5.36,
          text: "Wage determination amount for every paid hour.",
          source: S_WD_HW,
          cashWhen: { askId: "fa-ask-hw", choiceId: "hw-cash" },
        },
      },
      {
        id: "fa-b-holidays",
        label: "Paid holidays",
        from: {
          kind: "law",
          rate: 4.23,
          text: "Eleven paid holidays in the wage determination: 88 of 2,080 hours a year.",
          source: S_WD_HOLIDAYS,
        },
      },
      {
        id: "fa-b-vacation",
        label: "Paid vacation",
        from: {
          kind: "law",
          rate: 3.85,
          text: "Vacation in the wage determination: 2 weeks a year after 1 year.",
          source: S_WD_VACATION,
        },
      },
      {
        id: "fa-b-suta",
        label: "Unemployment tax",
        from: {
          kind: "ask",
          askId: "fa-ask-payroll",
          fieldId: "fld-suta",
          text: "From your payroll report.",
        },
      },
      {
        id: "fa-b-wc",
        label: "Workers' comp",
        from: {
          kind: "ask",
          askId: "fa-ask-payroll",
          fieldId: "fld-wc",
          text: "From your payroll report.",
        },
      },
    ],
    lines: [
      {
        id: "fa-l-video",
        item: "Video, 15 to 30 seconds, with open captions",
        unit: "per video",
        qty: VIDEOS,
        qtySource: doc(
          SHEET,
          "Attachment 2, row 4, CLIN 0001",
          "CLIN 0001",
          `0001 VIDEO PRODUCTION, 15-30 SECONDS, OPEN CAPTIONED. ESTIMATED QUANTITY: ${VIDEOS} EA`,
        ),
        laborShare: 0.55,
      },
      {
        id: "fa-l-digital",
        item: "Social, display and search ads, managed, with the monthly report",
        unit: "per month",
        qty: 12,
        qtySource: doc(
          SHEET,
          "Attachment 2, row 5, CLIN 0002",
          "CLIN 0002",
          "0002 DIGITAL ADVERTISING (SOCIAL, DISPLAY, SEARCH), MONTHLY, INCLUDING REPORT. ESTIMATED QUANTITY: 12 MO",
        ),
        laborShare: 0.25,
        direct: { askId: "fa-ask-media", fieldId: "fld-ad-spend", label: "Ad spend" },
      },
      {
        id: "fa-l-print",
        item: "Print ad, one insertion in one of the four papers",
        unit: "per insertion",
        qty: INSERTIONS,
        qtySource: doc(
          SHEET,
          "Attachment 2, row 6, CLIN 0003",
          "CLIN 0003",
          `0003 PRINT ADVERTISEMENT, ONE INSERTION, PER TECHNICAL EXHIBIT 1. ESTIMATED QUANTITY: ${INSERTIONS} EA`,
        ),
        laborShare: 0.15,
        direct: { askId: "fa-ask-media", fieldId: "fld-paper-rate", label: "Paper rate" },
      },
      {
        id: "fa-l-app",
        item: "App Splash ad, one week",
        unit: "per week",
        qty: WEEKS,
        qtySource: doc(
          SHEET,
          "Attachment 2, row 7, CLIN 0004",
          "CLIN 0004",
          `0004 APP SPLASH ADVERTISEMENT, WEEKLY. ESTIMATED QUANTITY: ${WEEKS} WK`,
        ),
        laborShare: 0.05,
        direct: { askId: "fa-ask-media", fieldId: "fld-app-rate", label: "App rate" },
      },
    ],
    overhead: {
      askId: "fa-ask-pl",
      fieldId: "fld-overhead",
      text: "From your 2025 profit and loss statement, as a share of direct cost.",
    },
    profit: { askId: "fa-ask-profit", fieldId: "fld-profit" },
    contingency: { askId: "fa-ask-contingency", fieldId: "contingency" },
    otherCosts: [],
    periods: {
      count: OPTION_YEARS,
      label: "Option year",
      escalation: { askId: "fa-ask-profit", fieldId: "fld-escalation" },
      source: S_PRICE,
    },
    payment: {
      text: "Paid within 30 days of a correct invoice. You pay the papers and the ad networks about two months before the first payment.",
      source: S_PAY,
    },
  },

  forms: [
    {
      id: "fa-fm-sf1449",
      name: "SF 1449, Solicitation/Contract/Order for Commercial Products and Commercial Services",
      source: S_SIGN,
      handling: ["ava-fills", "you-sign"],
      signer: "You, as the owner",
      filledFrom: "Your registration details and your price schedule",
    },
    {
      id: "fa-fm-reps",
      name: "Representations and certifications, confirmed current in your registration",
      source: S_REPS,
      handling: ["you-sign"],
      signer: "You, as the owner",
    },
    {
      id: "fa-fm-refs",
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
        id: "fa-pk-tech",
        name: `Volume_I_Technical_Approach_${SHORT_FILE}.pdf`,
        covers: "Volume I, section 3.2",
        contains: [{ kind: "section", id: "fa-s-tech" }],
      },
      {
        id: "fa-pk-pp",
        name: `Volume_II_Past_Performance_${SHORT_FILE}.pdf`,
        covers: "Volume II and Attachment 4",
        contains: [
          { kind: "section", id: "fa-s-pp" },
          { kind: "form", id: "fa-fm-refs" },
        ],
      },
      {
        id: "fa-pk-price",
        // The Army's own Excel file, filled in: section 3.4 asks for its format.
        name: `Volume_III_Price_Schedule_${SHORT_FILE}.xlsx`,
        covers: "Volume III, Attachment 2",
        contains: [{ kind: "price", id: "price" }],
      },
      {
        id: "fa-pk-forms",
        name: `Signed_Forms_${SHORT_FILE}.pdf`,
        covers: "SF 1449, section 3.5",
        contains: [
          { kind: "form", id: "fa-fm-sf1449" },
          { kind: "form", id: "fa-fm-reps" },
        ],
      },
    ],
    markings: [
      `Email subject line, word for word: "RFQ ${ID} – ${PERSONA.businessName}"`,
      "Each volume in its own file. The price schedule stays an Excel file, as section 3.4 asks.",
    ],
    checklist: [
      {
        id: "fa-ck-internal",
        label: `Internal deadline: ${D(DUE_DAYS - 1)}, 11:00 AM Eastern Time, one day early`,
        auto: true,
      },
      {
        id: "fa-ck-rates",
        label: "Get each paper's rate in writing, locked for 12 months, with its yearly increase",
      },
      {
        id: "fa-ck-sam",
        label: "Check your federal registration is active and your answers are current",
      },
      { id: "fa-ck-sign", label: "Sign the SF 1449" },
      { id: "fa-ck-reps", label: "Read and sign the representations and certifications statement" },
      { id: "fa-ck-subject", label: "Copy the email subject line word for word" },
      {
        id: "fa-ck-email",
        label: `Email the 4 files to ${CO.name} before 11:00 AM Eastern Time`,
      },
      { id: "fa-ck-receipt", label: "Save the sent email as your receipt and upload it here" },
    ],
    certifying: [
      "You are a certified woman-owned small business, and your registration says so.",
      "You are small under the size standard for advertising agencies.",
      "You will pay the video crew and the designer at least the wage determination rates, plus health and welfare.",
      "Your registration answers are current and true on the day you sign.",
      "Your prices hold for 60 days after the due date, and stay fixed for each year of the contract.",
      "You will pay other companies no more than half of what the Army pays you for services.",
      "The three jobs in your references happened as described, with those values and dates.",
      "You can keep every promise in the technical approach.",
    ],
  },

  reviewerFindings: [
    {
      id: "fa-rf-app",
      sectionId: "fa-s-tech",
      criterionId: "fa-cr-tech",
      quote: `One ad runs each week in each of the ${PAPERS} local papers in Technical Exhibit 1.`,
      finding:
        "The work statement asks for ads on the contractor's own mobile app. The section does not say whose app carries them. An evaluator would mark that line as a gap.",
      suggestedFix:
        "Name the app that carries the App Splash ads, or say you asked the Army whether a partner's app counts.",
      severity: "material",
      askId: "fa-ask-app",
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
      text: `Plan, make and place Family Advocacy prevention ads for military families on Fort Bragg and within ${RADIUS} miles.`,
      source: S_SCOPE,
    },
    work: [
      { text: `${VIDEOS} captioned videos a year, each 15 to 30 seconds.`, source: S_VIDEOS },
      {
        text: "Social, display and search ads every month, with a monthly report.",
        source: S_DIGITAL,
      },
      { text: `One ad a week in each of ${PAPERS} local papers.`, source: S_PRINT },
      { text: "A weekly App Splash ad on the contractor's own mobile app.", source: S_APP },
      { text: "Army approval of every script and ad before it runs.", source: S_APPROVAL },
    ],
    place: { text: `Fort Bragg, and the area within ${RADIUS} miles of it.`, source: S_SCOPE },
    hours: {
      text: "The project manager or the alternate is reachable 8:00 AM to 4:30 PM, Monday to Friday.",
      source: S_PM,
    },
    staffing: { text: "A project manager and an alternate, named in writing.", source: S_PM },
    serviceLevels: {
      text: "The Army approves or returns each script and ad within 5 business days.",
      source: S_APPROVAL,
    },
    outOfScope: {
      text: "Television, cable and streaming ads are not part of this work.",
      source: S_NOT_TV,
    },
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
      text: "Do not contact Family Advocacy staff about this quote. Questions go to the contract specialist only.",
      source: S_NO_CONTACT,
    },
    buyerPortal: {
      text: "SAM.gov: the Army posts its answers to questions there, for every bidder.",
      source: S_QUESTIONS,
    },
    dates: [],
    expectedAward: {
      text: `The Army expects to award on or about ${D(AWARD_DAYS)}.`,
      source: S_AWARD_DATE,
    },
    start: {
      text: "Work starts with a kickoff meeting at Fort Bragg within 10 days of award.",
      source: S_KICKOFF,
    },
    validity: { text: "Quotes stay valid for 60 days after the closing date.", source: S_VALID },
    setAside: {
      text: "Only certified woman-owned small businesses, registered as such in SAM.",
      source: S_SET_ASIDE,
    },
    size: {
      text: `Industry code ${PERSONA.primaryNaics}, advertising agencies. Your registration lists you as small.`,
      source: S_SIZE,
    },
    lateRule: { text: "Quotes that arrive after the deadline are not considered.", source: S_DUE },
    subcontracting: {
      text: "Companies that are not woman-owned small businesses can get at most half of what the Army pays you for services.",
      source: S_SUBS,
    },
  },

  samLegalName: PERSONA.businessName,
  nameInDraft: PERSONA.businessName,
};

// ─── What she told Ava ───
// The starting state (lib/ava/starts/familyAdvocacy.ts) and the played bid
// (play.ts, for the presenter's jump to segment 8) both read these answers, so
// what she said is written once. The three questions that wait on her carry
// her answers too: the jump plays them; the start leaves them open.

const AT = (minute: number) => ISO(-1, 15, minute);

export const familyAdvocacyAnswers: Record<string, AskAnswer> = {
  "fa-ask-hw": { status: "done", at: AT(4), choiceId: "hw-benefits" },
  "fa-ask-pay": {
    status: "done",
    at: AT(8),
    values: { "fld-pay-lead": 40, "fld-pay-crew": 27, "fld-pay-designer": 28 },
  },
  "fa-ask-payroll": {
    status: "done",
    at: AT(12),
    fileName: `${SHORT_FILE}_Payroll_Summary.pdf`,
    values: { "fld-suta": 1.4, "fld-wc": 0.8 },
  },
  "fa-ask-pl": {
    status: "done",
    at: AT(16),
    fileName: `${SHORT_FILE}_Profit_and_Loss_2025.pdf`,
    values: { "fld-overhead": 7.5 },
  },
  "fa-ask-media": {
    status: "done",
    at: AT(22),
    values: { "fld-paper-rate": 180, "fld-ad-spend": 1_500, "fld-app-rate": 60 },
  },
  "fa-ask-contingency": { status: "done", at: AT(26), values: { contingency: 2 } },
  "fa-ask-profit": {
    status: "done",
    at: AT(30),
    values: { "fld-profit": 3, "fld-escalation": PAPER_INCREASE },
  },
  "fa-ask-ref1": { status: "done", at: AT(34) },
  "fa-ask-ref2": { status: "done", at: AT(35) },
  "fa-ask-ref3": { status: "done", at: AT(36) },
  "fa-ask-refcontacts": {
    status: "done",
    at: AT(40),
    values: {
      "fld-ref1-phone": REFERENCE_CONTACTS.owenPryor.phone,
      "fld-ref1-email": REFERENCE_CONTACTS.owenPryor.email,
      "fld-ref2-phone": REFERENCE_CONTACTS.teresaWynn.phone,
      "fld-ref2-email": REFERENCE_CONTACTS.teresaWynn.email,
      "fld-ref3-phone": REFERENCE_CONTACTS.gloriaPratt.phone,
      "fld-ref3-email": REFERENCE_CONTACTS.gloriaPratt.email,
    },
  },
  // The three questions. Her answers when she gives them: she leads it, a
  // freelancer joins in busy months (Grant's advice), and a paper's app.
  "fa-ask-pm": { status: "done", at: AT(50), choiceId: "pm-owner" },
  "fa-ask-videos": { status: "done", at: AT(51), choiceId: "v-freelance" },
  "fa-ask-app": { status: "done", at: AT(52), choiceId: "app-partner" },
};

/** The three questions the story says wait on her, by key. */
export const FAMILY_ADVOCACY_OPEN = ["ask:fa-ask-pm", "ask:fa-ask-videos", "ask:fa-ask-app"];

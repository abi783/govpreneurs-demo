// Ava — the proposal builder. Shared data contract.
//
// ONE AvaBid object carries everything Ava knows about one bid: the buyer's
// files, the rules it read from them, what it asks the member for, the draft,
// the price inputs, the forms and the submission plan. Screens never hold facts
// of their own; they render this object plus the member's answers (store.ts),
// through the pure functions in derive.ts, price.ts, checks.ts and addenda.ts.
//
// The rules this contract encodes (Ava-How-It-Drafts.html, Ava-Build-Spec.html):
//   • The solicitation is the rubric. Every statement about the buyer's rules
//     carries a Source: which file, where in it, and the buyer's exact words.
//   • Nothing without a source. Every fact about the member comes from their
//     documents, their record or their approval (Proof).
//   • Ask, don't guess. A missing fact is an Ask; a contradiction in the
//     buyer's files is a Clarification.
//   • Findings, not scores. Nothing here holds a percentage, a rating or odds.
//
// Fixture values are illustrative samples for the prototype. The SHAPE is the
// handover; the numbers are not.

import type { AvaOpportunity as Opportunity } from "../../demo/ava/opportunity";

// ─── The kind of bid — sets expectations for the member's time ───

/** What the buyer asked for, in the member's terms (concept §5). */
export type BidKind =
  | "bid-package"
  | "short-response"
  | "written-proposal"
  | "qualifications"
  /** A reply to a sources sought or a request for information: the buyer asks
   *  who can do the work before writing the solicitation. No price, no forms,
   *  no signature; sent by email (docs/ava/build-progression.md, item 7). */
  | "reply";

// ─── Sources: where a rule came from ───

/** A place in one of the buyer's files. `quote` is the buyer's exact words and
 *  is built with `doc()` in fixtures, because a quotation is not our copy. */
export interface Source {
  fileId: string;
  /** Human coordinate: "Section 7.4, page 14". */
  locator: string;
  /** Short pin label: "§7.4", "Exhibit C", "Form 3". */
  short: string;
  /** The buyer's exact words. Absent only when the rule is a table or a form. */
  quote?: string;
}

/** Where a fact about the MEMBER came from. Never the buyer's files. */
export interface Proof {
  kind: "your-document" | "you-confirmed" | "profile" | "sam" | "public-record";
  /** "Fort Bragg dining contract.pdf", "Your GovPreneurs profile", "SAM.gov registration". */
  from: string;
  /** "page 1", "Company details", "entered 8 May 2026". */
  locator: string;
  /** What the source says, verbatim or as the record states it. */
  quote: string;
}

// ─── Understand: the buyer's files ───

export type FileRole =
  | "main"
  | "exhibit"
  | "price-form"
  | "form"
  | "addendum"
  | "questions-and-answers"
  | "drawing"
  | "other";

/** Whether Ava could read the file. Anything but "read" is a Blocked flag or a note. */
/** How Ava could read a file. "scan": a picture of each page, read by a
 *  vision model and marked uncertain; it counts as read and never stops the
 *  build (PRD TD-03 and PC-1, Shyam and Ashish, 7 October 2026: was
 *  "scan-no-text", which stopped it). */
export type FileReadability = "read" | "scan" | "behind-login" | "garbled" | "controlled";

/** Ava has the words of this file: read as text, or from a scan. */
export function readable(f: { readability: FileReadability }): boolean {
  return f.readability === "read" || f.readability === "scan";
}

export interface BidFile {
  id: string;
  /** The file's own name, as the buyer posted it. */
  name: string;
  role: FileRole;
  pages: number | null;
  /** Days relative to the app clock (NOW). Negative = before today. */
  postedDaysFromNow: number;
  readability: FileReadability;
  /** Set when a later file replaces this one. */
  supersededBy?: string;
  /** For role "addendum": which Addendum it is. */
  addendumId?: string;
  /** Plain words for a file Ava could not read: what it is and what it affects. */
  note?: string;
  /** How much the missing file matters, if unreadable. Drives the at-risk label. */
  riskIfMissing?: Severity;
  /** The ask that gets the member to upload it, when unreadable. */
  uploadAskId?: string;
}

// ─── The Bid Brief ───

export interface Deadline {
  /** The date comes from the opportunity; the time and zone from the text. */
  dueDaysFromNow: number;
  /** "2:00 PM" as the buyer wrote it. */
  time: string;
  /** 24-hour clock, for arithmetic: "14:00". */
  time24: string;
  /** "Eastern Time", taken from the document text, or null when no file states it. */
  zone: string | null;
  /** UTC offset in hours for the zone on that date (-4 for Eastern daylight time). */
  utcOffset: number | null;
  source: Source;
  questionsDueDaysFromNow?: number;
  questionsTime?: string;
  questionsSource?: Source;
}

export type AwardMethod =
  | "points"
  | "low-bid"
  | "best-value"
  | "lowest-price-acceptable"
  | "qualifications"
  /** Nothing is awarded: the buyer is only asking who can do the work. */
  | "none";

export type CriterionKind = "price-formula" | "scored-writing" | "pass-fail" | "scored-fact";

export interface Criterion {
  id: string;
  /** The buyer's name for it: "Operations and staffing plan". */
  name: string;
  points: number | null;
  kind: CriterionKind;
  source: Source;
  /** Plain words: how Ava treats it. "Scored by formula. No writing." */
  treatment: string;
}

export interface AwardBasis {
  method: AwardMethod;
  /** The buyer's award sentence, verbatim (doc()). */
  source: Source;
  criteria: Criterion[];
  /** "Lowest price ÷ your price × 35". Present when price is scored by formula. */
  priceFormula?: { maxPoints: number; text: string };
  /** One plain line under the bars. */
  note: string;
}

export type ReqStatus = "meets" | "not-yet" | "confirm";

/** When the buyer needs an item: with the bid, at award, or before work
 *  starts. Items needed after the bid never hold the bid (Ava-Simplified,
 *  page 2 "When it's needed"). Absent = with the bid. */
export type NeededAt = "bid" | "award" | "work-start";

/** The topic an item sits under on page 2 (compliance and inputs). */
export type ComplianceGroup =
  | "eligibility"
  | "events"
  | "insurance"
  | "experience"
  | "people"
  | "pricing"
  | "writing"
  | "decisions"
  | "forms"
  | "buyer";

/** A requirement that gets a bid rejected when it is not met. */
export interface HardRequirement {
  id: string;
  label: string;
  /** When the buyer needs it. Absent = with the bid. */
  neededAt?: NeededAt;
  /** The page 2 topic. Absent = worked out from the ask behind it. */
  group?: ComplianceGroup;
  source: Source;
  /** Status before the member answers anything. */
  initial: ReqStatus;
  /** When "meets": the member's own evidence, named. */
  evidence?: string;
  /** Answering this ask settles it. */
  askId?: string;
  /** More asks the requirement needs, every one answered and passing
   *  (three references are three asks; a site visit is "will you attend?"
   *  and then "did you sign the sheet?"). */
  askIds?: string[];
  /** What the status becomes once that ask is done. Default "meets". */
  afterAsk?: ReqStatus;
  /** Evidence line once the ask is done: "Your bond letter from Carolina Surety". */
  evidenceAfter?: string;
  /** The row in Grant's check that is this same rule. Grant judges it; Ava
   *  shows his result and only collects the proof (lib/ava/grant.ts). */
  grantRow?: string;
  /** Filled in by lib/ava/grant.ts: Grant's result, in plain words. */
  grantSays?: string;
}

/** The state and local screen (concept §6.1). One row per topic Ava looked for. */
export type ScreenTopic =
  | "vendor-registration"
  | "preferences"
  | "bonds"
  | "insurance"
  | "wages"
  | "tax"
  | "notary-signature"
  | "pre-bid-meeting"
  | "public-opening"
  | "references-licenses"
  | "participation-goals"
  | "background-checks"
  | "portal-rules";

export interface ScreenItem {
  topic: ScreenTopic;
  /** Did the buyer's files ask for it? */
  found: boolean;
  /** One plain line: what the buyer asks for, or "Not asked for in these files". */
  summary: string;
  source?: Source;
  /** The hard requirement this became, if any. */
  requirementId?: string;
}

/** Something the member promises to do if they win (concept §6.1). */
export interface Commitment {
  id: string;
  /** Plain statement of the promise: "Hot lunch ready by 11:00 AM, 5 days a week". */
  text: string;
  source: Source;
  /** How the price carries it. "Priced as: 2 extra hours a day for the kitchen lead." */
  pricedAs?: string;
  /** True when the member must approve it before it goes in the bid. */
  needsApproval: boolean;
}

export interface MentorAdvice {
  recommended: boolean;
  /** Plain reasons, from the concept's trigger list. */
  reasons: string[];
}

/** A fact Ava already had and did not ask for. */
export interface KnownFact {
  label: string;
  value: string;
  from: string;
}

// ─── Asks: what Ava needs from the member ───

export type AskKind = "approve" | "upload" | "enter" | "answer";

/** Who answers. Asks are grouped by this so a group can be forwarded. */
export type AskOwner =
  | "you"
  | "bookkeeper"
  | "insurance-agent"
  | "surety"
  | "references"
  | "subcontractor";

export interface EnterField {
  id: string;
  /** One fact per box: never "phone and email" or "name and title" (Shyam, 7
   *  October 2026). Two facts are two fields. */
  label: string;
  /** "phone" and "email" are typed text with their own keyboard. */
  unit: "usd-hour" | "usd" | "percent" | "count" | "text" | "phone" | "email";
  /** Shown under the field. */
  hint?: string;
  /** A legal or buyer floor the value must meet. Warned, never blocked. */
  floor?: { value: number; why: string };
}

export interface AnswerChoice {
  id: string;
  label: string;
  /** What choosing it means, in one line. */
  consequence?: string;
  /** Choosing this fails a hard requirement: the bid goes back to a bid decision. */
  failsGate?: string;
  /** What this answer means for the requirement it serves, when it does not
   *  settle it yet: "You plan to attend" is Confirm until the visit happens.
   *  Absent = the answer settles it. */
  gives?: { status: ReqStatus; evidence?: string };
  /** A follow-up ask this answer opens ("Did you sign the attendance sheet?"). */
  opensAskId?: string;
}

export type AskAnswerSpec =
  | {
      type: "approve";
      /** "Use your Fort Bragg dining contract as reference 1?" */
      proposal: string;
      /** Where Ava found it. */
      from: string;
      /** When the fact may be out of date. */
      asOf?: string;
      /** The fact itself, as a form box prints it once she approves: "5",
       *  "Cumberland County Schools summer meals program, 2023". A form never
       *  prints the question (review panel, 7 October 2026; PRD A15: the value
       *  is the fact's stored value). */
      value?: string;
    }
  | {
      type: "upload";
      /** "A letter from your surety, on its letterhead". */
      accepts: string;
      /** Values Ava pulls from the document, for the member to approve. */
      extracts?: {
        fieldId: string;
        label: string;
        value: number;
        unit: EnterField["unit"];
        where: string;
      }[];
    }
  | { type: "enter"; fields: EnterField[] }
  | { type: "answer"; question: string; choices: AnswerChoice[] };

/** "I don't have this" — options limited to what the buyer's files allow. */
export interface DontHaveOption {
  id: string;
  label: string;
  detail: string;
  /** The rule that allows it (or, for the last option, why nothing else is allowed). */
  source?: Source;
  /** "new-ask": this becomes a new ask; "bid-decision": the bid goes back to a bid decision. */
  outcome: "new-ask" | "bid-decision";
  /** For "new-ask": the ask it opens. */
  opensAskId?: string;
  /** The replacement meets the rule once its ask is answered (a certified
   *  check instead of a bid bond). Absent = Confirm: the replacement is a
   *  step toward the rule, not the rule met (an exam date is not a certificate). */
  satisfies?: boolean;
  /** The replacement has no fee, so a cost tied to the original ask is zero. */
  noFee?: boolean;
}

export interface Ask {
  id: string;
  kind: AskKind;
  /** The thing needed, as a noun phrase: "Performance bond letter, 100% of year-one price". */
  title: string;
  /** The rule it serves. */
  source: Source;
  /** Why it matters, in one or two short sentences. */
  why: string;
  owner: AskOwner;
  /** How long it takes to get, in days. Sorts the list: slowest first. */
  leadDays: number;
  /** The member's own time, in minutes. */
  minutes: number;
  answer: AskAnswerSpec;
  /** Shown after "I don't have this". Absent = the button does not appear. */
  dontHave?: DontHaveOption[];
  /** Price, key people, commitments and money need a deliberate confirmation. */
  deliberate?: boolean;
  /** Only appears after another answer opens it (a "new-ask" outcome). */
  hiddenUntilOpened?: boolean;
  /** For an ask tied to a fixed date (a site visit, a pre-bid meeting): the
   *  last day to answer, in days from NOW. Otherwise the decide-by date is
   *  worked back from the due date and `leadDays` (derive.ts). */
  decideByDaysFromNow?: number;
  /** What the answer settles, in plain words: "Hard requirement · Bond", "Price · Cook". */
  feeds: string[];
  /** When the buyer needs it. Absent = with the bid. */
  neededAt?: NeededAt;
  /** The page 2 topic. Absent = worked out from the owner and what it feeds. */
  group?: ComplianceGroup;
  /** Grant's question that asks the same thing. What the member told Grant
   *  shows on the row, so they are never asked twice. */
  grantQuestion?: string;
  /** Grant's "Yes" or "No" as this ask's choice id. With it, the answer the
   *  member gave Grant answers this ask too. */
  grantChoices?: Record<string, string>;
  /** Filled in by lib/ava/grant.ts: what the member told Grant. */
  toldGrant?: string;
  /** The kind of proof the buyer wants, when it is not plain from the kind
   *  of ask: "there" for a visit she must attend (flow.ts proofOf). */
  proof?: "copy" | "word" | "there" | "later" | "type" | "choose";
}

// ─── Clarifications: the buyer's files contradict themselves ───

export interface Clarification {
  id: string;
  /** "The page limit is stated two different ways". */
  title: string;
  /** "Neither Addendum 1 nor the questions-and-answers file settles it." */
  checked: string;
  passages: Source[];
  /** Ready to send, polite, short. The member sends it; Ava never does. */
  question: string;
  /** "Jordan Alvarez, Purchasing, City of Fayetteville". */
  to: string;
  /** "by email only, per Section 1.5". */
  channel: string;
  /** A simple limit: Ava builds to the stricter reading. Otherwise the member decides. */
  kind: "simple-limit" | "decision";
  /** What Ava builds to in the meantime. */
  meanwhile: string;
  /** For "decision": the readings, and what each costs. */
  readings?: { id: string; label: string; costs: string }[];
  /** An addendum that later settles it. */
  settledByAddendumId?: string;
}

// ─── Plan: every requirement, and win themes for scored writing ───

export type PlanKind = "instruction" | "scored-item" | "form" | "logistics";
export type PlanNeed = "writing" | "attachment" | "signature" | "price" | "action";

export interface PlanRow {
  id: string;
  /** The buyer's words (doc()). */
  source: Source;
  kind: PlanKind;
  needs: PlanNeed;
  /** What happens if it's missed: "The bid is rejected." */
  ifMissed: string;
  /** Where the bid answers it: a draft section, a form, the price sheet or the checklist. */
  answeredIn: { kind: "section" | "form" | "price" | "checklist"; id: string; label: string };
  /** Open while this ask is open. */
  askId?: string;
  /** Open while this clarification is open. */
  clarificationId?: string;
}

export interface WinTheme {
  id: string;
  theme: string;
  /** The buyer priority it answers, with the source. */
  priority: string;
  prioritySource: Source;
  /** The member's proof behind it. */
  evidence: { text: string; proof: Proof }[];
  /** Said honestly when the proof is thin. */
  weakness?: string;
  /** The ask that would supply the missing proof. */
  askId?: string;
}

// ─── The draft, with proof ───

export type ClaimTag = "verified" | "confirmed" | "unsupported" | "commitment";

export interface Claim {
  id: string;
  tag: ClaimTag;
  /** Verified / confirmed: what proves it. */
  proof?: Proof;
  /** Unsupported: the ask that would support it. Answered → becomes "confirmed". */
  askId?: string;
  /** Unsupported: the marked gap shown in the working draft, never exported. */
  gap?: string;
  /** Text once the ask is answered (replaces the claim text). */
  resolvedText?: string;
  /** Text per answer choice, when the answer changes what the sentence says
   *  ("our owner held that contract" vs "another business she ran held it"). */
  resolvedByChoice?: Record<string, string>;
  /** Text built from what the member typed: "{fieldId}" is replaced by their
   *  answer ("If a delivery vehicle breaks down, {fld-backup}"). */
  resolvedTemplate?: string;
  /** Commitment: which commitment it carries. */
  commitmentId?: string;
}

export type Span = {
  text: string;
  claim?: Claim;
  /** The words of one of Ava's decisions (DraftSection.decisions). */
  decisionId?: string;
  /** Words rewritten while she read her bid: by her, or by her mentor. */
  edit?: "you" | "mentor";
};

export interface Redline {
  /** The exact text removed from the paragraph. */
  remove: string;
  /** What goes in instead. Every inserted fact carries a tag. */
  insert: Span[];
}

export interface ChallengeOption {
  id: string;
  label: string;
  redline: Redline;
  paragraphIndex: number;
  /** When the fix needs a fact Ava doesn't have, Accept becomes this ask. */
  needsAskId?: string;
}

export interface Challenge {
  id: string;
  /** A question the member might ask: "Why lead with the route instead of the food?" */
  prompt: string;
  /** Ava's reasoning, labeled as reasoning. */
  reasoning: string;
  options: ChallengeOption[];
}

/** A choice Ava made in the writing that is the member's to make: Ava's
 *  wording, and the other wording she could use. The final build asks about
 *  each one. She keeps Ava's choice, uses the other one, or writes her own. */
export interface WritingDecision {
  id: string;
  paragraphIndex: number;
  /** Ava's wording, exactly as it reads in the paragraph. */
  choice: string;
  /** The other wording. */
  other: string;
}

export interface DraftSection {
  id: string;
  title: string;
  /** The buyer's words this section answers. */
  answers: Source;
  criterionId?: string;
  points?: number | null;
  /** Page limit Ava builds to (after any clarification). */
  pageLimit?: number | null;
  /** Measured on the working draft. A fix may lower it (checks.ts). */
  pages: number;
  paragraphs: Span[][];
  challenges: Challenge[];
  decisions?: WritingDecision[];
}

// ─── Price ───

export interface PriceRole {
  id: string;
  name: string;
  count: number;
  hoursPerWeek: number;
  /** The ask + field where the member enters what they pay this role. */
  pay: { askId: string; fieldId: string };
  /** A wage floor the buyer or the law sets. Warned, never blocked. */
  wageFloor?: { perHour: number; source: Source };
}

/** An add-on to each paid hour. A legal rate is a fixed fact; everything else
 *  comes only from the member's documents or entries (never invented). */
export interface BurdenLine {
  id: string;
  label: string;
  /** Every rate is a PERCENT NUMBER: 7.65 means 7.65% of pay. Same for the
   *  member's "percent" fields — they enter 1.2 for 1.2%. */
  from:
    | { kind: "law"; rate: number; text: string; source?: Source }
    | { kind: "ask"; askId: string; fieldId: string; text: string }
    /** A fixed amount per paid hour (a wage determination's health and welfare).
     *  When paid as cash (`cashWhen` answer chosen), payroll taxes apply to it. */
    | {
        kind: "per-hour";
        amount: number;
        text: string;
        source: Source;
        cashWhen?: { askId: string; choiceId: string };
      };
}

export interface PriceLine {
  id: string;
  /** The buyer's line item, as written on their sheet. */
  item: string;
  /** "per meal", "per guest", "per month". */
  unit: string;
  /** The buyer's estimated quantity for year one. Null when the buyer gives
   *  none (a rate list, build-progression.md item 1): nothing is totalled. */
  qty: number | null;
  qtySource: Source;
  /** Share of yearly labor cost this line carries (all lines sum to 1). */
  laborShare: number;
  /** Direct cost per unit (food, supplies), from the member. */
  direct?: { askId: string; fieldId: string; label: string };
}

export interface OtherCost {
  id: string;
  label: string;
  /** Yearly amount, or where it comes from. */
  yearly:
    | { kind: "fixed"; amount: number; text: string }
    | { kind: "ask"; askId: string; fieldId: string; text: string };
  /** Whether Ava put it in the price as its own line. The delivery check
   *  reports the rest, and "Add it to the price" adds them. */
  inPrice: boolean;
  /** Where the amount comes from when "I don't have this" replaced the
   *  original ask with another (a new insurance quote). */
  altFrom?: { askId: string; fieldId: string };
  commitmentId?: string;
}

export interface PriceModel {
  /** "Exhibit B, the city's price sheet". */
  sheetName: string;
  sheetFileId: string;
  /** "Unit prices, fixed for year one, up to 3% a year after". */
  contractType: string;
  contractTypeSource: Source;
  /** Weeks of service in year one. */
  weeks: number;
  roles: PriceRole[];
  burden: BurdenLine[];
  lines: PriceLine[];
  overhead: { askId: string; fieldId: string; text: string };
  profit: { askId: string; fieldId: string };
  /** A reserve for costs that run over, as a percent of cost (labor, direct
   *  costs and overhead), added before profit. The member enters it; Ava never
   *  picks it (Ava-Simplified, step 23: "with contingency included"). */
  contingency?: { askId: string; fieldId: string };
  otherCosts: OtherCost[];
  /** Points for price under the buyer's formula, when there is one. */
  points?: { max: number };
  /** Periods the buyer asks you to price beyond year one (federal option
   *  years). Each is priced at the member's own yearly increase. */
  periods?: {
    count: number;
    label: string;
    escalation: { askId: string; fieldId: string };
    source: Source;
  };
  /** A sales tax the price must include, as a percent the member enters. */
  tax?: { askId: string; fieldId: string; text: string; source: Source };
  /** When the buyer's template has a formula error, it becomes a question. */
  templateError?: string;
  /** Payment terms and cash flow, one plain line with its source. */
  payment: { text: string; source: Source };
  /** Who builds the unit prices. Absent: Ava builds them with its one recipe
   *  (staff hours × weeks, spread over the lines). "you": Ava has no recipe for
   *  this sheet yet (per job, a rate with no quantity, a product), so the
   *  member types each unit price (the ask YOUR_PRICES_ASK in price.ts, one
   *  field per line). Ava adds them up, checks every line has a price and asks
   *  her to approve the total; roles, burden, overhead, profit, contingency,
   *  other costs and tax are not used. The MVP rule in
   *  docs/ava/build-progression.md, item 1. */
  builtBy?: "you";
}

// ─── Forms ───

export type FormHandling = "ava-fills" | "you-sign" | "notary" | "someone-else";

export interface BidForm {
  id: string;
  /** The form's own name. */
  name: string;
  source: Source;
  handling: FormHandling[];
  /** Who signs, when "you-sign" or "notary". */
  signer?: string;
  /** Who provides it, when "someone-else". */
  providedBy?: string;
  /** What Ava fills from, in plain words. */
  filledFrom?: string;
  /** Acknowledges this addendum. Added to the package when it arrives. */
  acknowledgesAddendumId?: string;
  /** The ask that supplies it, when someone else provides it. */
  askId?: string;
}

// ─── Submission ───

/** "portal" uploads files; "typed-portal" answers the buyer's questions on its
 *  website, one screen at a time (`portalScreens`). */
export type SubmitMethod = "portal" | "email" | "paper" | "typed-portal";

/** What a portal field takes, as the buyer's files show it. "unknown" when the
 *  files do not show it: Ava asks rather than guessing. */
export type PortalResponse = "confirm" | "text" | "number" | "upload" | "unknown";

/** One item on a portal screen, in the portal's own words and order. */
export interface PortalField {
  id: string;
  /** The portal's label, verbatim: "2. Bidder's Certification". */
  label: string;
  responseType: PortalResponse;
  required: boolean;
  /** Characters allowed, when the portal says. Portals count characters, not pages. */
  charLimit?: number;
  /** The buyer's words for the item (doc()). What she certifies is these words. */
  source: Source;
  /** A short count of a long item, shown above its full words: "8 statements, A to H". */
  count?: string;
  /** Ava's plain line: what she certifies or gives here. Marked as Ava's. */
  plain: string;
  /** What must be settled before she can tick or type it. */
  answeredBy?: {
    asks?: string[];
    commitmentIds?: string[];
    /** The value is the price she approves. */
    price?: boolean;
    /** The file she uploads here is this draft section. */
    sectionId?: string;
  };
  /** How she enters it on the portal: "Tick Please confirm". */
  onPortal: string;
}

/** A screen of the buyer's portal, as its files print it (or her screenshots show it). */
export interface PortalScreen {
  id: string;
  /** The screen's name, verbatim: "6. Vendor Questionnaire". */
  name: string;
  /** "price" is the pricing table; "questions" is everything else. */
  kind: "price" | "questions";
  source: Source;
  fields: PortalField[];
}

export interface PackageFile {
  id: string;
  /** Named for the submission rules: "1_Proposal_HaddadCatering.pdf". */
  name: string;
  /** What in the buyer's files it answers: "§5.3–5.5". */
  covers: string;
  /** Which parts of the bid go in it. */
  contains: { kind: "section" | "form" | "price" | "upload"; id: string }[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  /** Checked by Ava when a fact makes it true (the internal deadline, say). */
  auto?: boolean;
}

export interface SubmissionPlan {
  method: SubmitMethod;
  /** "The City of Fayetteville bid portal". */
  where: string;
  /** Account, address or mailbox, in plain words. */
  account: string;
  source: Source;
  /** "25 MB per file, PDF only". */
  limits: string;
  files: PackageFile[];
  /** The buyer's exact marking words, with where they must go. */
  markings: string[];
  checklist: ChecklistItem[];
  /** "What you're certifying": the statements the member signs. */
  certifying: string[];
  /** For "typed-portal": the portal's screens, in the portal's order. */
  portalScreens?: PortalScreen[];
  /** For "typed-portal": where she signs in, as the buyer's files give it. */
  portalUrl?: string;
}

// ─── Check: findings, not scores ───

export type Severity = "critical" | "material" | "minor";

/** An evaluator-style finding. In the pilot a GovPreneurs reviewer writes these. */
export interface ReviewerFinding {
  id: string;
  sectionId: string;
  criterionId?: string;
  /** The weak sentence, quoted from the draft. */
  quote: string;
  finding: string;
  suggestedFix: string;
  severity: Severity;
  /** The ask that supplies what the fix needs. */
  askId?: string;
}

// ─── Addenda ───

/** A change an addendum makes, as a typed patch the build can apply. */
export type AddendumPatch =
  | { kind: "due"; dueDaysFromNow: number; time?: string; time24?: string }
  | { kind: "commitment"; commitmentId: string; text: string; pricedAs?: string }
  | { kind: "price-qty"; lineId: string; qty: number }
  | { kind: "page-limit"; sectionId: string; pageLimit: number }
  | { kind: "requirement"; requirementId: string; label: string }
  /** The draft sentence that carries a changed promise, rewritten with it. */
  | {
      kind: "draft-text";
      sectionId: string;
      paragraphIndex: number;
      remove: string;
      insert: Span[];
    }
  | { kind: "none" };

export interface AddendumChange {
  id: string;
  /** "Emergency response time". */
  what: string;
  source: Source;
  before: string;
  now: string;
  /** How it touches the member's bid. */
  effect: "reopened" | "updated" | "no-effect";
  /** One plain line: "Your approval from 8 May was for 2 hours." */
  effectText: string;
  patch: AddendumPatch;
  /** More patches the same change makes (the draft sentence that states the
   *  promise the change rewrote). */
  alsoPatches?: AddendumPatch[];
  /** For a promise change with no draft-text patch: why the writing is still
   *  true (it never states the detail that changed). Without it, the check
   *  reports the writing as stating the old promise. */
  draftUnchanged?: string;
}

export interface Addendum {
  id: string;
  number: number;
  fileId: string;
  /** Days relative to NOW. Negative = already posted before Ava started. */
  postedDaysFromNow: number;
  /** Posted after the build starts; the prototype delivers it with a demo control. */
  arrivesDuringBuild: boolean;
  /** Changes that don't touch this bid, counted but not listed. */
  otherChanges: number;
  changes: AddendumChange[];
  /** What the addendum left alone, so nothing needs re-checking. */
  stillValid: string;
  settlesClarificationId?: string;
}

// ─── Bid decision: a hard requirement fails ───

export interface BidDecisionAtStart {
  /** "The mandatory site visit was on 1 May. Attendance is required." */
  reason: string;
  source: Source;
}

// ─── Page 1: facts about the opportunity no other part of the bid carries ───

/** A fact from the buyer's files, with where it is. */
export interface SourcedFact {
  text: string;
  source: Source;
}

/** A date the buyer's files set, other than the due date and the question deadline. */
export interface KeyDate {
  id: string;
  label: string;
  /** Days relative to NOW. */
  daysFromNow: number;
  /** "10:00 AM", as the buyer wrote it. */
  time?: string;
  /** Missing it gets the bid thrown out. */
  mandatory?: boolean;
  source: Source;
}

/** What page 1 shows that the rest of the bid does not already hold. A null
 *  field is a fact the buyer's files do not state: the page says "Not stated"
 *  rather than hiding it (Ava-Simplified, page 1 rule). */
export interface BidOverview {
  /** The kind of notice, in plain words, with the buyer's own name for it. */
  noticeType: SourcedFact;
  /** One plain line: what the buyer is buying. */
  summary: SourcedFact;
  /** Tasks and deliverables. */
  work: SourcedFact[];
  place: SourcedFact | null;
  /** Hours and coverage. */
  hours: SourcedFact | null;
  staffing: SourcedFact | null;
  /** Response times, delivery windows and standards. */
  serviceLevels: SourcedFact | null;
  outOfScope: SourcedFact | null;
  /** Base period and renewals. */
  term: SourcedFact | null;
  /** Only when a document states it. */
  estimatedValue: SourcedFact | null;
  /** Money taken off for late or missed work. */
  penalties: SourcedFact | null;
  contact: {
    name: string;
    role: string;
    email?: string;
    phone?: string;
    source: Source;
  } | null;
  /** The only allowed way to ask questions. */
  questionsChannel: SourcedFact | null;
  /** Rules against contacting other staff during the bid. */
  noContact: SourcedFact | null;
  /** Where the buyer posts the bid and its addenda. */
  buyerPortal: SourcedFact | null;
  /** Meetings, site visits and other dated events. */
  dates: KeyDate[];
  expectedAward: SourcedFact | null;
  start: SourcedFact | null;
  /** How long the price must stay open. */
  validity: SourcedFact | null;
  /** Who may bid: a set-aside, or open to all. */
  setAside: SourcedFact | null;
  /** The industry code and size limit, when the buyer sets one. */
  size: SourcedFact | null;
  /** What happens to a late bid. */
  lateRule: SourcedFact | null;
  /** How much of the work the bidder must do itself. Absent = not stated. */
  subcontracting?: SourcedFact | null;
}

// ─── The whole bid ───

export interface AvaBid {
  /** The opportunity id this bid is for (Opportunity.noticeId). */
  noticeId: string;
  /** The buyer's own title and number. */
  officialTitle: string;
  buyer: string;
  bidNumber: string;
  kind: BidKind;
  /** Why this label, in one line: "Scored writing worth 60 of 100 points, plus price and forms." */
  kindReason: string;
  /** Pilot-only work (federal Part 15 proposals) is labeled so. */
  pilotOnly?: boolean;
  files: BidFile[];
  deadline: Deadline;
  award: AwardBasis;
  hardRequirements: HardRequirement[];
  screen: ScreenItem[];
  commitments: Commitment[];
  /** Contract type, quantities and price risk, in plain lines with sources. */
  contractTerms: { text: string; source: Source }[];
  mentor: MentorAdvice;
  knownFacts: KnownFact[];
  asks: Ask[];
  clarifications: Clarification[];
  plan: PlanRow[];
  /** Scored writing only. Empty for a bid package. */
  themes: WinTheme[];
  sections: DraftSection[];
  /** Null when the buyer allows no price: a qualifications selection that
   *  talks fees only with the winner, or a reply to a sources sought. Such a
   *  bid has no price sheet, no price approval and no price checks, and the
   *  check makes sure nothing in it states a price. */
  price: PriceModel | null;
  forms: BidForm[];
  submission: SubmissionPlan;
  reviewerFindings: ReviewerFinding[];
  addenda: Addendum[];
  /** Set when a hard requirement has already failed before any work. */
  failedAtStart?: BidDecisionAtStart;
  /** Bid security the buyer requires, as a percent of the total bid. A bond
   *  scales with the bid; a check's amount is compared with the total. */
  bidSecurity?: {
    percent: number;
    source: Source;
    bondAskId: string;
    check?: { askId: string; fieldId: string };
  };
  /** Staffing the WRITING describes, when it differs from the price's plan.
   *  Absent in every real bid: one staffing plan feeds both, so they cannot
   *  drift. The Test Lab sets it to prove the staffing-versus-price check. */
  draftStaffing?: { roleId: string; count: number; hoursPerWeek: number }[];
  /** The member's legal name, for the name check. Read from SAM.gov, the
   *  federal registration. A state or local buyer's vendor registration is a
   *  separate requirement (screen topic "vendor-registration"); SAM.gov never
   *  stands in for it, and the name check names SAM.gov on federal bids only. */
  samLegalName: string;
  /** The name the draft uses today. A mismatch is a minor exact-check finding. */
  nameInDraft: string;
  /** Page 1 facts. Absent on a bid Ava has not fully read. */
  overview?: BidOverview;
}

/** The opportunity plus Ava's bid for it, if Ava has one. */
export interface AvaTarget {
  opp: Opportunity;
  bid: AvaBid | null;
}

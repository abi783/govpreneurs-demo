// DEMO: the opportunity page's data, built from the story.
//
// `buildDetail(id)` answers GET /opportunities/discover/v2/:oppKey with a complete
// `DiscoverV2DetailDto`. Six opportunities have hand-written detail
// (heroDetails.ts). Every other opportunity is built here from the story facts
// and the kind of work (domains.ts), so no page is thin.

import { findReviewByOppKey } from "@/demo/state/mentorReviews";
import { getOpportunity, type StoryOpportunity } from "@/demo/story/opportunities";
import type { DiscoverV2DetailDto } from "@/lib/discoverApi";
import { buyerShort, domainFor, offerWord, type Domain } from "./domains";
import { cap, driveText, factsFor, longDate, type OppFacts, shareWords, termText, usd } from "./facts";
import { keyDateBullets, keyDatesFor, type KeyDate } from "./dates";
import { HERO_DETAILS } from "./heroDetails";
import { buildSolicitation, type ClausePatch, type Solicitation } from "./solicitation";

export type DocKind = "solicitation" | "pws" | "wage" | "price" | "menu" | "sites" | "amendment" | "custom";

/** A document written out in full, for the notices that need one of their own. */
export interface CustomDoc {
  title: string;
  subtitle?: string;
  sections: { heading: string; paragraphs: string[] }[];
}

export interface DocSpec {
  kind: DocKind;
  fileName: string;
  title: string;
}

export interface HeroDetail {
  quickSummary: string;
  accordions: Record<string, string[]>;
  patches: ClausePatch[];
  /** The notice has changed since it was posted. */
  amendment?: { label: string; daysAgo: number; summary: string };
  /** Replace the default document list. */
  documents?: DocSpec[];
  /** Full text of the documents of kind "custom", by file name. */
  custom?: Record<string, CustomDoc>;
}

/** The hand-written detail of one opportunity, or null when it is built from the story facts. */
export function heroDetailFor(f: OppFacts): HeroDetail | null {
  return HERO_DETAILS[f.id]?.(f) ?? null;
}

export function solicitationFor(f: OppFacts): Solicitation {
  return buildSolicitation(f, heroDetailFor(f)?.patches ?? []);
}


// ── Text ─────────────────────────────────────────────────────────────────

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** The story summary is two sentences for a Hunter pick, and one stub for the rest. */
function isStub(opp: StoryOpportunity): boolean {
  return opp.summary.startsWith(opp.plainTitle) && /due in \d+ days\.$/.test(opp.summary);
}

function setAsideSentence(f: OppFacts): string {
  if (f.setAside === "WOSB") return "Only woman-owned small businesses can compete.";
  if (f.setAside === "SBA") return "Only small businesses can compete.";
  return "Any qualified firm can compete.";
}

function valueSentence(f: OppFacts): string {
  if (f.opp.valueLow === null || f.opp.valueHigh === null) return "The notice states no value.";
  return f.opp.valueBasis === "per_year"
    ? `The buyer estimates the value at ${usd(f.opp.valueLow)} to ${usd(f.opp.valueHigh)} a year.`
    : `The buyer estimates the value at ${usd(f.opp.valueLow)} to ${usd(f.opp.valueHigh)} over the full term.`;
}

export function quickSummaryFor(f: OppFacts, d: Domain): string {
  const opp = f.opp;
  const head = isStub(opp)
    ? `${cap(buyerShort(opp))} wants ${lowerFirst(opp.plainTitle)}. ${d.scopeLine} The contract runs for ${termText(f.years)}.`
    : opp.summary;
  return `${head} ${setAsideSentence(f)} ${valueSentence(f)}`;
}

function eligibilityBullets(f: OppFacts, d: Domain): string[] {
  const opp = f.opp;
  const out: string[] = [];
  out.push(
    f.setAside === "WOSB"
      ? "Set-aside: Women-Owned Small Business (WOSB). The firm must hold an active SBA certification when it sends the offer and at award."
      : f.setAside === "SBA"
        ? "Set-aside: total small business. The firm must be small under the size standard when it sends the offer."
        : "No set-aside. Any qualified firm can compete.",
  );
  if (f.isFederal) {
    out.push(
      `NAICS code ${opp.naics}. ${opp.naics === "722310" ? "The size standard is $47.0 million in average annual receipts." : "The size standard for this code applies."}`,
    );
    out.push("An active SAM registration when the offer is sent and through award.");
  } else {
    out.push("A vendor registration with the buyer, complete before award.");
  }
  out.push("A food service permit from the local health department.");
  if (d.key !== "staffing" && d.key !== "construction") {
    out.push("A food-handler certificate for each person who prepares food.");
  }
  out.push("General liability insurance of $1M for each occurrence, commercial vehicle insurance, and workers' compensation.");
  if (opp.clearanceRequired) out.push(opp.clearanceRequired);
  return out;
}

function evaluationBullets(f: OppFacts, d: Domain): string[] {
  if (f.isSealedBid) {
    return [
      "The buyer awards to the lowest bid from a firm that is qualified and responsible.",
      "Price is the only scored factor. There is no technical score.",
      "A bid that leaves out a required document is rejected.",
    ];
  }
  return [
    "The buyer awards to the best-value offer. The factors are below, in order of importance.",
    ...d.scoring.map((s) => `${s.factor}: ${s.weight} percent`),
    "A firm must pass every requirement before the buyer scores it.",
  ];
}

function submissionBullets(f: OppFacts): string[] {
  const offer = offerWord(f.opp);
  const c = f.contact;
  if (f.isSourcesSought) {
    return [
      `Reply by email to ${c.name} at ${c.email} by 5:00 PM Eastern on the due date.`,
      "The reply has two short parts: what your firm does, and what you did for past customers.",
      "Do not send a price. This notice is not a request for an offer.",
    ];
  }
  return [
    `Send the ${offer} by email to ${c.name} at ${c.email}, or through the buyer's portal, by 5:00 PM Eastern on the due date.`,
    offer === "bid"
      ? "Send one document: the signed price schedule. Add proof of insurance and the required certificates."
      : offer === "quote"
        ? "Send the price schedule, a short technical plan of up to three pages, and the certificates and references."
        : "Send a technical volume of up to ten pages, a past performance volume with three references, and the price schedule.",
    "Send questions in writing before the question deadline. The buyer answers them in an amendment.",
  ];
}

function checklistBullets(f: OppFacts, d: Domain): string[] {
  const offer = offerWord(f.opp);
  const out = [
    `Read the ${offer === "reply" ? "notice" : "solicitation"} and the work statement in full.`,
    d.key === "field" || d.key === "boxed" ? "Write a delivery plan with your vans and drive times." : "Write a staffing plan for each shift.",
    "Collect certificates, insurance proof and references.",
  ];
  if (!f.isSourcesSought) out.push("Ask your questions before the question deadline.", `Price the ${offer} line by line.`);
  out.push(`Send the ${offer} before 5:00 PM Eastern on the due date.`);
  return out;
}

function placeBullets(f: OppFacts, d: Domain): string[] {
  return [
    ...d.needs,
    f.years > 0 ? `The contract is ${termText(f.years)}.` : "This notice does not start a contract.",
    `Work is in ${f.placeText}, ${f.miles <= 5 ? "in your hometown" : `${f.miles} miles from your kitchen`}.`,
  ];
}

function riskBullets(f: OppFacts, d: Domain): string[] {
  const out = [...d.risks];
  if (f.miles > 60) out.push(`${f.placeText} is ${f.miles} miles from your kitchen, ${driveText(f.miles)} each way. A daily run adds cost.`);
  if (f.share !== null && f.share >= 1) out.push(`The yearly value is ${shareWords(f.share)}. Check your capacity before you commit.`);
  return out;
}

function genericAccordions(f: OppFacts, d: Domain, dates: KeyDate[]): Record<string, string[]> {
  const acc: Record<string, string[]> = {
    what_the_buyer_needs: placeBullets(f, d),
    eligibility_and_compliance: eligibilityBullets(f, d),
    evaluation_criteria: evaluationBullets(f, d),
    submission_instructions: submissionBullets(f),
    key_dates: keyDateBullets(f, dates),
    deliverables: d.deliverables,
    technical_requirements: d.technical,
    personnel_requirements: d.personnel,
    risks_and_gotchas: riskBullets(f, d),
    quick_checklist: checklistBullets(f, d),
  };
  return acc;
}

// ── Documents ────────────────────────────────────────────────────────────

export function documentsFor(f: OppFacts): DocSpec[] {
  const hero = heroDetailFor(f);
  if (hero?.documents) return hero.documents;
  const d = domainFor(f.opp);
  const id = f.id;
  const docs: DocSpec[] = [
    { kind: "solicitation", fileName: `${id}_${f.opp.noticeType.replace(/[^A-Za-z]+/g, "-")}.pdf`, title: "Solicitation" },
  ];
  if (d.documents.includes("pws")) docs.push({ kind: "pws", fileName: `${id}_Performance-Work-Statement.pdf`, title: "Performance work statement" });
  if (d.documents.includes("wage") && f.isFederal) docs.push({ kind: "wage", fileName: `${id}_Wage-Determination.pdf`, title: "Wage determination" });
  if (d.documents.includes("price")) docs.push({ kind: "price", fileName: `${id}_Price-Schedule.pdf`, title: "Price schedule" });
  if (d.documents.includes("menu")) docs.push({ kind: "menu", fileName: `${id}_Menu-Requirements.pdf`, title: "Menu requirements" });
  if (d.documents.includes("sites")) docs.push({ kind: "sites", fileName: `${id}_Delivery-Sites.pdf`, title: "Delivery sites" });
  if (hero?.amendment) docs.push({ kind: "amendment", fileName: `${id}_Amendment-0001.pdf`, title: hero.amendment.label });
  return docs;
}

// ── The page's record ────────────────────────────────────────────────────

/** Human-readable set-aside text for the page. */
function setAsideText(f: OppFacts): string {
  return f.setAsideLabel;
}

const PSC_FOOD = "S203 (Housekeeping: food)";

function mentorFields(id: string): Pick<DiscoverV2DetailDto, "mentorReviewStatus" | "mentorReviewId"> {
  const review = findReviewByOppKey(id);
  if (!review) return { mentorReviewStatus: null, mentorReviewId: null };
  if (review.status === "pending") return { mentorReviewStatus: "pending", mentorReviewId: review.id };
  const r = review.recommendation;
  return {
    mentorReviewStatus: r === "pursue" ? "pursue" : r === "pass" ? "reject" : "discuss",
    mentorReviewId: review.id,
  };
}

/** The tier the page uses. It follows Grant's call, so the mentor dialog agrees with Grant. */
export function tierAndScore(opp: StoryOpportunity): { tier: "priority" | "strong" | "stretch" | "low"; score: number } {
  const hunter = opp.hunter;
  switch (opp.grant.verdict) {
    case "bid":
      return { tier: hunter.tier === "strong" ? "strong" : "priority", score: Math.max(hunter.score, 80) };
    case "review":
      return { tier: "stretch", score: Math.min(Math.max(hunter.score, 40), 59) };
    case "no_bid":
      return { tier: "low", score: Math.min(hunter.score, 39) };
  }
}

export function buildDetail(id: string): DiscoverV2DetailDto | null {
  const opp = getOpportunity(id);
  if (!opp) return null;
  const f = factsFor(opp);
  const d = domainFor(opp);
  const hero = heroDetailFor(f);
  const dates = keyDatesFor(f);
  const accordions = { ...genericAccordions(f, d, dates), ...(hero?.accordions ?? {}) };
  if (hero?.amendment) {
    accordions.amendment_summary = [hero.amendment.summary];
  }
  const { tier, score } = tierAndScore(opp);
  const sol = solicitationFor(f);
  void sol;
  const docs = documentsFor(f).map((doc) => ({
    fileName: doc.fileName,
    downloadUrl: `/opportunities/discover/v2/${id}/documents?fileName=${encodeURIComponent(doc.fileName)}`,
  }));
  return {
    id,
    title: opp.title,
    geminiPlainEnglishTitle: opp.plainTitle,
    scope: opp.scope,
    agency: { name: `${opp.agency} — ${opp.office}` },
    noticeType: opp.noticeType,
    postedDate: f.postedAtISO,
    responseDeadline: f.closesAtISO,
    setAside: setAsideText(f),
    naicsCode: opp.naics,
    classificationCode: f.isFederal && d.key !== "construction" && d.key !== "staffing" ? PSC_FOOD : undefined,
    solNumber: opp.id,
    placeOfPerformance: { city: f.place.city, state: f.place.state },
    pointOfContact: f.contact,
    secondaryContact: f.secondContact,
    status: "active",
    quickSummary: hero?.quickSummary ?? quickSummaryFor(f, d),
    summarySource: "rag",
    summaryRewritePending: false,
    category: "contract",
    keyDates: keyDateBullets(f, dates),
    accordions,
    valEstLow: opp.valueLow,
    valEstHigh: opp.valueHigh,
    finalScore: score,
    tier,
    matchReasons: (opp.hunter.fit ?? []).map((x) => x.says),
    matchBreakdown: {
      fitPoints: Math.round(score * 0.4),
      setAsidePoints: opp.setAside ? 10 : 0,
      eligible: true,
      certifiable: false,
    },
    documents: docs,
    sourcePath: null,
    ...mentorFields(id),
  };
}

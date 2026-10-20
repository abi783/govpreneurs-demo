// DEMO: the sample solicitation behind each opportunity.
//
// A real notice has numbered clauses. The detail page summarises them, the sample
// PDF prints them, and Grant's source chips quote them. All three read this one
// model, so a quote in a source chip is always a sentence that is in the PDF.

import { PERSONA } from "@/demo/story/persona";
import { questionsDate } from "./dates";
import { buyerShort, domainFor, offerWord, type Domain } from "./domains";
import { longDate, type OppFacts, termText, usd } from "./facts";
import { pinx } from "./rich";
import { V } from "./vocab";
import type { Pin } from "@/lib/grant/types";

export interface Clause {
  /** What the clause is about. Analyses ask for a clause by kind. */
  kind: string;
  /** The reference printed in the document, for example "H.3". */
  ref: string;
  heading: string;
  text: string;
}

export interface Section {
  id: string;
  title: string;
  clauses: Clause[];
}

export interface Solicitation {
  id: string;
  docTitle: string;
  sections: Section[];
}

/** A change to the generic solicitation: replace the text of a kind, or add a clause. */
export interface ClausePatch {
  kind: string;
  /** Where an added clause goes. A replacement keeps its own place. */
  section?: string;
  heading?: string;
  text: string;
  /** Only for an added clause that has no default. */
  ref?: string;
}

type Layout = Record<string, { section: string; ref: string }>;

const FED_SECTIONS: { id: string; title: string }[] = [
  { id: "A", title: "Solicitation form and set-aside" },
  { id: "B", title: "Services and prices" },
  { id: "C", title: "Description and work statement" },
  { id: "F", title: "Period and place of performance" },
  { id: "H", title: "Special contract requirements" },
  { id: "L", title: "Instructions to offerors" },
  { id: "M", title: "Evaluation factors" },
];

const FED_LAYOUT: Layout = {
  purpose: { section: "A", ref: "A.1" },
  setAside: { section: "A", ref: "A.2" },
  naics: { section: "A", ref: "A.3" },
  sam: { section: "A", ref: "A.4" },
  value: { section: "B", ref: "B.1" },
  price: { section: "B", ref: "B.2" },
  scope: { section: "C", ref: "C.1" },
  needs: { section: "C", ref: "C.2" },
  hours: { section: "C", ref: "C.3" },
  permit: { section: "C", ref: "C.4" },
  certs: { section: "C", ref: "C.5" },
  haccp: { section: "C", ref: "C.6" },
  term: { section: "F", ref: "F.1" },
  place: { section: "F", ref: "F.2" },
  wage: { section: "H", ref: "H.1" },
  insurance: { section: "H", ref: "H.2" },
  bond: { section: "H", ref: "H.3" },
  access: { section: "H", ref: "H.4" },
  clearance: { section: "H", ref: "H.5" },
  submit: { section: "L", ref: "L.1" },
  questions: { section: "L", ref: "L.2" },
  content: { section: "L", ref: "L.3" },
  evaluate: { section: "M", ref: "M.1" },
  factors: { section: "M", ref: "M.2" },
};

const LOCAL_SECTIONS: { id: string; title: string }[] = [
  { id: "1", title: "Instructions to bidders" },
  { id: "2", title: "Scope of work" },
  { id: "3", title: "Pricing" },
  { id: "4", title: "Evaluation" },
  { id: "5", title: "Contract terms" },
];

const LOCAL_LAYOUT: Layout = {
  purpose: { section: "1", ref: "1.1" },
  submit: { section: "1", ref: "1.2" },
  questions: { section: "1", ref: "1.3" },
  content: { section: "1", ref: "1.4" },
  setAside: { section: "1", ref: "1.5" },
  naics: { section: "1", ref: "1.6" },
  sam: { section: "1", ref: "1.7" },
  scope: { section: "2", ref: "2.1" },
  needs: { section: "2", ref: "2.2" },
  hours: { section: "2", ref: "2.3" },
  permit: { section: "2", ref: "2.4" },
  certs: { section: "2", ref: "2.5" },
  haccp: { section: "2", ref: "2.6" },
  term: { section: "2", ref: "2.7" },
  place: { section: "2", ref: "2.8" },
  value: { section: "3", ref: "3.1" },
  price: { section: "3", ref: "3.2" },
  evaluate: { section: "4", ref: "4.1" },
  factors: { section: "4", ref: "4.2" },
  insurance: { section: "5", ref: "5.1" },
  bond: { section: "5", ref: "5.2" },
  access: { section: "5", ref: "5.3" },
  wage: { section: "5", ref: "5.4" },
  clearance: { section: "5", ref: "5.5" },
};

export function naicsLabel(code: string): string {
  if (code === PERSONA.primaryNaics) return PERSONA.primaryNaicsLabel;
  return PERSONA.secondaryNaics.find((n) => n.code === code)?.label ?? V.trade;
}

/** Small-business size standard text. Only the primary code carries a stated figure. */
function sizeText(code: string): string {
  return code === PERSONA.primaryNaics && V.sizeStandard
    ? `The small business size standard is ${V.sizeStandard.long} in average annual receipts.`
    : "The small business size standard for this code applies.";
}

const DOC_TITLE: Record<string, string> = {
  "Request for Quote": "REQUEST FOR QUOTE",
  "Combined Synopsis/Solicitation": "COMBINED SYNOPSIS AND SOLICITATION",
  "Request for Proposal": "REQUEST FOR PROPOSAL",
  Solicitation: "SOLICITATION",
  "Invitation for Bid": "INVITATION FOR BID",
  "Sources Sought": "SOURCES SOUGHT NOTICE",
  "Special Notice": "SPECIAL NOTICE",
};

function defaultText(f: OppFacts, d: Domain): Record<string, string | null> {
  const opp = f.opp;
  const offer = offerWord(opp);
  const closes = `${longDate(f.closes)}, ${V.dueInClauses(opp)}`;
  const questionsBy = questionsDate(f);
  const wageApplies = f.isFederal && d.documents.includes("wage");
  const generic: Record<string, string | null> = {
    purpose: `${opp.agency}, ${opp.office}, requests ${offer === "bid" ? "sealed bids" : `${offer}s`} for ${opp.title}. The solicitation number is ${opp.id}. The notice was posted on ${longDate(f.posted)}.`,
    setAside:
      opp.setAside === "WOSB"
        ? "This requirement is a set-aside for Women-Owned Small Businesses (WOSB) under the WOSB Program. Only firms that SBA certifies as WOSB at the time of the offer can compete. A firm whose certification lapses before award is not eligible for award."
        : opp.setAside === "SBA"
          ? "This requirement is a total small business set-aside. Only small businesses under the size standard in the next clause can compete. Size is decided on the date of the offer."
          : "This requirement is open to all qualified firms. No set-aside applies.",
    naics: f.isFederal
      ? `The North American Industry Classification System (NAICS) code is ${opp.naics}, ${naicsLabel(opp.naics)}. ${sizeText(opp.naics)}`
      : null,
    sam: f.isFederal
      ? "The offeror shall be registered in the System for Award Management (SAM) when it sends the offer and through award. The offeror shall show its unique entity identifier (UEI) on the offer."
      : "The vendor shall be on the buyer's vendor list before award. A vendor who is not on the list registers on the buyer's web site.",
    value: `The buyer estimates the value of this requirement at ${f.valueText}${opp.valueBasis === "per_year" ? "" : " over the full term"}. This estimate is not a promise of work.`,
    price: `Price every line on the price schedule. Prices are firm and fixed for each year of the contract. ${d.priceLines.length > 0 ? `The lines are: ${d.priceLines.join("; ").toLowerCase()}.` : ""}`,
    scope: `${d.scopeLine} The place of performance is ${f.placeText}.`,
    needs: d.needs.join(" "),
    hours: null,
    permit: "The contractor shall hold a current food service permit from the local health department for every kitchen that prepares food for this contract.",
    certs: `The contractor shall give the contracting officer's representative a food-handler certificate for each person who prepares food. The contractor shall give proof within ten days of contract start and again for each new hire.`,
    haccp: `The contractor shall keep a written food-safety plan based on Hazard Analysis and Critical Control Points (HACCP). The plan shall cover receiving, hot and cold holding, cooling, reheating and allergen control.`,
    term:
      f.years <= 1
        ? "The period of performance is one year from the award date."
        : `The period of performance is ${termText(f.years)}. The buyer decides each option year in writing before it starts.`,
    place: `Work is performed at ${opp.office.replace(/ — .*$/, "")} sites in and around ${f.placeText}.`,
    wage: wageApplies
      ? "The Service Contract Labor Standards apply. The contractor shall pay at least the rates in the wage determination at Attachment 2 and the fringe benefit rates in it."
      : null,
    insurance:
      "The contractor shall carry commercial general liability insurance of $1,000,000 for each occurrence and $2,000,000 in total, commercial vehicle insurance of $1,000,000, and workers' compensation at the legal limit. Proof is due with the " +
      offer +
      ".",
    bond:
      f.annual !== null && f.annual >= 1_000_000
        ? `The successful offeror shall give a performance bond and a payment bond. Each bond equals 100 percent of the annual contract price, about ${usd(f.annual)}. The bonds shall be in place before performance starts.`
        : null,
    access: f.isFederal
      ? "Each worker needs a background check and base access before the first shift. The contractor starts these checks within five days of award."
      : null,
    clearance: null,
    submit: `Send the ${offer} by email to ${f.contact.email}, or through the buyer's portal, by ${closes}. A late ${offer} is not considered.`,
    questions: `Send written questions by email to ${f.contact.name}, ${f.contact.title}, by ${longDate(questionsBy)}, 5:00 PM Eastern. The buyer posts all answers as an amendment.`,
    content:
      offer === "bid"
        ? "The bid has one document: the signed price schedule. The bid must also include proof of insurance and the certificates the scope of work names."
        : offer === "quote"
          ? "The quote has three parts: the price schedule, a short technical plan (up to three pages), and the certificates and references the scope of work names."
          : "The proposal has three parts: a technical volume (up to ten pages), a past performance volume with three references, and the price schedule.",
    evaluate:
      offer === "bid"
        ? "The buyer awards to the lowest-priced bidder who is responsible and who meets every requirement. Price is the only scored factor."
        : "The buyer awards to the offer that is the best value to the government. Factors are listed in the next clause, in order of importance.",
    factors:
      offer === "bid"
        ? null
        : `Factors and weights: ${d.scoring.map((s) => `${s.factor} (${s.weight} percent)`).join("; ")}.`,
  };
  return { ...generic, ...V.clauses(f, offer) };
}

const NOTICE_SECTIONS = [
  { id: "1", title: "Purpose" },
  { id: "2", title: "Information requested" },
  { id: "3", title: "How to reply" },
  { id: "4", title: "Notice" },
];

/** A sources sought notice is short. It has no price, no award and no set-aside yet. */
function buildNotice(f: OppFacts, patches: ClausePatch[]): Solicitation {
  const closes = `${longDate(f.closes)}, ${V.dueInClauses(f.opp)}`;
  const buyer = buyerShort(f.opp);
  const Buyer = buyer.charAt(0).toUpperCase() + buyer.slice(1);
  const base: Clause[] = [
    { kind: "purpose", ref: "1.1", heading: "Purpose", text: `${f.opp.agency}, ${f.opp.office}, is doing market research. It wants to know which small businesses could provide ${domainFor(f.opp).service} before it writes the next contract. The notice number is ${f.id}. The notice was posted on ${longDate(f.posted)}.` },
    { kind: "setAside", ref: "1.2", heading: "No set-aside yet", text: `This is not a solicitation. ${Buyer} has not decided on a set-aside. It uses the replies to decide whether to set the next contract aside for small businesses.` },
    { kind: "naics", ref: "1.3", heading: "Industry code", text: `The NAICS code for this work is ${f.opp.naics}, ${naicsLabel(f.opp.naics)}.` },
    { kind: "sam", ref: "2.3", heading: "Registration", text: `A firm that replies should be registered in SAM. ${Buyer} uses SAM to confirm size and certifications.` },
    { kind: "ask", ref: "2.1", heading: `What ${buyer} asks`, text: "A firm that wants to reply sends two short parts: (1) what the firm does, with its NAICS codes, size and certifications; and (2) what it did for past customers, with a contact for each." },
    { kind: "noprice", ref: "2.2", heading: "No price", text: `Do not send a price. ${Buyer} will not pay for a reply, and a reply is not an offer.` },
    { kind: "submit", ref: "3.1", heading: "How to reply", text: `Reply by email to ${f.contact.name}, ${f.contact.title}, at ${f.contact.email}, by ${closes}.` },
    { kind: "content", ref: "3.2", heading: "Format", text: "Put both parts in one PDF of up to four pages. Name the PDF with your firm name and the notice number." },
    { kind: "disclaimer", ref: "4.1", heading: "No award", text: `${Buyer} will not award a contract from this notice. A reply does not commit the firm or ${buyer} to anything.` },
  ];
  const byKind = new Map(base.map((c) => [c.kind, c]));
  for (const p of patches) {
    const hit = byKind.get(p.kind);
    if (hit) {
      hit.text = p.text;
      if (p.heading) hit.heading = p.heading;
    } else base.push({ kind: p.kind, ref: p.ref ?? `4.${base.length}`, heading: p.heading ?? p.kind, text: p.text });
  }
  const sections = NOTICE_SECTIONS.map((s) => ({
    id: s.id,
    title: s.title,
    clauses: base.filter((c) => c.ref.startsWith(`${s.id}.`)),
  })).filter((s) => s.clauses.length > 0);
  return { id: f.id, docTitle: DOC_TITLE[f.opp.noticeType], sections };
}

/** Build the sample solicitation for one opportunity. */
export function buildSolicitation(f: OppFacts, own: ClausePatch[] = []): Solicitation {
  if (f.isSourcesSought) return buildNotice(f, own);
  // The trade's own clauses first; a notice's own patch of the same kind wins.
  const patches = [...V.extraClauses(f).filter((x) => !own.some((p) => p.kind === x.kind)), ...own];
  const d = domainFor(f.opp);
  const layout = f.isFederal ? FED_LAYOUT : LOCAL_LAYOUT;
  const sectionDefs = f.isFederal ? FED_SECTIONS : LOCAL_SECTIONS;
  const text = defaultText(f, d);
  const headings: Record<string, string> = {
    purpose: "Purpose",
    setAside: "Set-aside",
    naics: "Industry code and size",
    sam: "Registration",
    value: "Estimated value",
    price: "Prices",
    scope: "Scope",
    needs: "What the contractor does",
    hours: "Hours of service",
    permit: "Food service permit",
    certs: "Food-handler certificates",
    haccp: "Food-safety plan",
    term: "Period of performance",
    place: "Place of performance",
    wage: "Wage determination",
    insurance: "Insurance",
    bond: "Bonds",
    access: "Access",
    clearance: "Security clearance",
    submit: "How to submit",
    questions: "Questions",
    content: "What to include",
    evaluate: "Basis of award",
    factors: "Evaluation factors",
  };

  const bySection = new Map<string, Clause[]>(sectionDefs.map((s) => [s.id, []]));
  const order = Object.keys(layout);
  const patchByKind = new Map(patches.map((p) => [p.kind, p]));

  for (const kind of order) {
    const patch = patchByKind.get(kind);
    const body = patch ? patch.text : text[kind];
    if (!body) continue;
    const place = layout[kind];
    bySection.get(place.section)?.push({
      kind,
      ref: place.ref,
      heading: patch?.heading ?? headings[kind] ?? kind,
      text: body,
    });
  }
  // Added clauses: a patch whose kind is not in the layout.
  for (const p of patches) {
    if (layout[p.kind]) continue;
    const section = p.section ?? sectionDefs[sectionDefs.length - 1].id;
    const list = bySection.get(section);
    if (!list) continue;
    const ref = p.ref ?? `${section}.${list.length + 1}`;
    list.push({ kind: p.kind, ref, heading: p.heading ?? p.kind, text: p.text });
  }
  const sections = sectionDefs
    .map((s) => ({ id: s.id, title: s.title, clauses: bySection.get(s.id) ?? [] }))
    .filter((s) => s.clauses.length > 0);
  // Keep clauses in numeric order inside each section.
  for (const s of sections) {
    s.clauses.sort((a, b) => a.ref.localeCompare(b.ref, "en", { numeric: true }));
  }
  return { id: f.id, docTitle: DOC_TITLE[f.opp.noticeType] ?? "SOLICITATION", sections };
}

/** Find a clause by kind. */
export function clauseOf(sol: Solicitation, kind: string): { clause: Clause; section: Section; before?: Clause; after?: Clause } | null {
  for (const section of sol.sections) {
    const i = section.clauses.findIndex((c) => c.kind === kind);
    if (i >= 0) {
      return { clause: section.clauses[i], section, before: section.clauses[i - 1], after: section.clauses[i + 1] };
    }
  }
  return null;
}

const EXCERPT_MAX = 420;
const clip = (s: string): string => (s.length > EXCERPT_MAX ? `${s.slice(0, EXCERPT_MAX - 1).trimEnd()}…` : s);

/** A source chip that opens the sentence in the sample solicitation. */
export function clausePin(sol: Solicitation, kind: string, label?: string): Pin {
  const hit = clauseOf(sol, kind);
  if (!hit) throw new Error(`Solicitation ${sol.id} has no clause "${kind}"`);
  const { clause, section, before, after } = hit;
  const ref = `§${clause.ref}`;
  return pinx(
    label ?? ref,
    ref,
    `Section ${section.id} · ${section.title} · clause ${clause.ref}`,
    before ? clip(`${before.ref}  ${before.text}`) : undefined,
    clip(`${clause.ref}  ${clause.text}`),
    after ? clip(`${after.ref}  ${after.text}`) : undefined,
  );
}

/** Same as `clausePin`, but returns null when the clause is not in this solicitation. */
export function clausePinMaybe(sol: Solicitation, kind: string, label?: string): Pin | null {
  return clauseOf(sol, kind) ? clausePin(sol, kind, label) : null;
}

export { usd };

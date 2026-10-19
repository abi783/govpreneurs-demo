/**
 * Business Profile field registry — all 37 questions from the PR #11 PRD §4.
 *
 * Field keys are STABLE and must never be renamed (they key ProfileField
 * rows). Sixteen fields gate the intro call (long "Diana's fourteen", widened
 * on 2026-08-26 by home address and T-shirt size); the rest
 * are optional — shown behind one collapsed line, never widening the
 * counter's denominator (PRD R3: counts to the milestone, never a
 * percentage).
 *
 * Copy rules (§4.4): never "must"/"required" without saying what it gates;
 * never "please" in an error; no exclamation marks; sentence case; no emoji;
 * "Not sure" / "None of these" wherever a field can be legitimately unknown.
 */

export type ControlKind =
  | "text"
  // NOT "address": this union and the catalog's `MbType` must stay DISJOINT —
  // that is what lets one switch in `controls.tsx` serve both surfaces — and
  // `MbType` already owns the name "address".
  | "home-address"
  | "radio"
  | "checkbox"
  | "three-things"
  | "website"
  | "work-tree"
  | "service-area"
  | "project"
  | "upload"
  | "long-text";

export type ProfileFieldState =
  | "verified"
  | "needs_review"
  | "attested"
  | "inferred"
  | "stale"
  | "missing"
  | "conflict"
  | "pending_dfy"
  | "error";

export interface RegistryOption {
  value: string;
  label: string;
  hint?: string;
  /** Picking an exclusive option clears the rest, and vice versa. */
  exclusive?: boolean;
}

export interface RegistryField {
  key: string;
  label: string;
  section: SectionId;
  control: ControlKind;
  /** One of the required set — counts toward the milestone denominator. */
  required: boolean;
  helper?: string;
  whyItMatters?: string;
  options?: RegistryOption[];
  /** Tappable worked examples for long-text controls. */
  examples?: string[];
  /** DFY catalog mapping — shown only when state is missing/error (§7). */
  dfy?: { service: string; price: string; href: string };
}

import { WORK_TYPES, WORK_TYPE_TO_NAICS } from "./workTypeTaxonomy";

export type SectionId =
  | "start"
  | "company"
  | "whatyoudo"
  | "experience"
  | "federal"
  | "goals"
  | "documents";

export const SECTIONS: Array<{ id: SectionId; title: string; note: string }> = [
  { id: "start", title: "Start here", note: "You, and how we reach you." },
  { id: "company", title: "Your company", note: "The business itself — what a buyer would look up." },
  { id: "whatyoudo", title: "What you do", note: "The work, in your own words." },
  { id: "experience", title: "Experience", note: "What you have done before. Commercial work counts." },
  { id: "federal", title: "Federal readiness", note: "Where you stand today. No answer here is wrong." },
  { id: "goals", title: "Goals", note: "What a win looks like in the next 90 days." },
  { id: "documents", title: "Documents", note: "Anything you already have. Nothing here holds anything up." },
];

/** Curated trade list for primary_industry, rebuilt from Hunter's WORK_TYPES
 *  taxonomy (source of truth — see workTypeTaxonomy.ts). NAICS codes are
 *  shown as information, never implied as filed or fixed. */
export const TRADES: Array<{ value: string; label: string; naics: string[] }> = [
  ...WORK_TYPES.map((w) => ({ value: w.id, label: w.label, naics: WORK_TYPE_TO_NAICS[w.id] ?? [] })),
  { value: "other", label: "Something else", naics: [] },
];

export const TRAVEL_RUNGS: RegistryOption[] = [
  { value: "metro", label: "My metro area", hint: "Around my city and its suburbs" },
  { value: "nearby", label: "Nearby cities", hint: "A couple of hours' drive" },
  { value: "state", label: "My whole state" },
  { value: "state_plus_neighbors", label: "My state and its neighbors" },
  { value: "national", label: "Anywhere in the US" },
];

/**
 * NAMED AS HUNTER NAMES THEM. `small_biz` and `native_tribal` are two of the
 * nine values in `relevance/set-aside-canonical.ts`, which calls itself the
 * single source of truth for turning a certification into an opportunity
 * filter. Using its spelling is what lets a member's answer here reach the
 * matcher; a slug of our own invention would be read as `null` and gate
 * nothing.
 *
 * WHICH OF THESE ACTUALLY GATE WORK, because it is not obvious and the file
 * above is explicit about it: `8a`, `hubzone`, `sdvosb`, `vosb`, `wosb`,
 * `edwosb`, `small_biz` and `native_tribal` decide which opportunities she is
 * shown. `minority`, `sdb` and `dobe` are listed there as NON-GATING — real
 * things to record for supplier diversity, and they will never change what she
 * is matched to.
 */
const CERT_OPTIONS: RegistryOption[] = [
  { value: "vosb", label: "Veteran-owned", hint: "You served" },
  { value: "sdvosb", label: "Service-disabled veteran-owned (SDVOSB)", hint: "VA-verified or planning to be" },
  { value: "wosb", label: "Woman-owned (WOSB)" },
  { value: "edwosb", label: "Economically disadvantaged woman-owned (EDWOSB)" },
  { value: "eight_a", label: "8(a) program", hint: "SBA's development program" },
  { value: "hubzone", label: "HUBZone", hint: "Your office sits in a designated zone" },
  { value: "minority", label: "Minority-owned" },
  { value: "sdb", label: "Small disadvantaged business (SDB)" },
  { value: "dobe", label: "Disability-owned (DOBE)" },
  {
    value: "small_biz",
    label: "Small business",
    hint: "By the government's size limit for your trade",
  },
  {
    value: "native_tribal",
    label: "Native American or tribally owned",
    hint: "Buy Indian, an Indian Economic Enterprise, an Alaska Native corporation or a tribally owned business",
  },
  { value: "none", label: "None of these", exclusive: true },
  { value: "not_sure", label: "Not sure", hint: "Your mentor will sort this out with you on the call", exclusive: true },
];

export const REGISTRY: RegistryField[] = [
  // ── The required set — needed to be ready ───────────────────────────
  { key: "primary_contact_name", label: "Your name", section: "start", control: "text", required: true },
  { key: "email", label: "Email", section: "start", control: "text", required: true },
  {
    key: "phone", label: "Phone", section: "start", control: "text", required: true,
    helper: "The number your mentor can reach you on.",
  },
  {
    key: "legal_company_name", label: "Legal company name", section: "company", control: "text", required: true,
    helper: "Exactly as it appears on your formation paperwork, if you have it.",
    dfy: { service: "LLC Application", price: "$600", href: "roadmap" },
  },
  {
    // The company's own address and number, not the member's — those are
    // `email` / `phone` above, which ask for "your best" of each. Optional:
    // plenty of one-person firms have neither yet, and the milestone stays 16.
    key: "company_email", label: "Company email", section: "company", control: "text", required: false,
    helper: "The address a buyer would write to. Yours is fine if there is no separate one.",
  },
  {
    key: "company_phone", label: "Company phone", section: "company", control: "text", required: false,
    helper: "The number on your quotes and invoices.",
  },
  {
    key: "website", label: "Website", section: "company", control: "website", required: true,
    helper: "No, not yet is a real answer — many members start without one.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No, not yet" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    key: "primary_industry", label: "Your trade", section: "whatyoudo", control: "work-tree", required: true,
    helper: "Pick what fits best. The codes are how the government files your trade.",
    whyItMatters: "This decides which jobs Hunter shows you.",
  },
  {
    key: "primary_services", label: "Your top services", section: "whatyoudo", control: "three-things", required: true,
    helper: "Up to three. The first is enough to start.",
  },
  {
    key: "geographic_coverage", label: "Where you work", section: "whatyoudo", control: "service-area", required: true,
    helper: "The states you cover, and how far you travel.",
    whyItMatters: "We only show you work you could reach.",
  },
  {
    key: "service_to_sell_to_government", label: "Which service do you want to sell to the government first?", section: "whatyoudo",
    control: "radio", required: true,
    helper: "Pick from your own services above.",
    whyItMatters: "One service is a plan. Three is a brochure.",
  },
  {
    key: "years_of_experience", label: "Years doing this kind of work", section: "experience", control: "radio", required: true,
    options: [
      { value: "lt2", label: "Under 2 years" },
      { value: "2to5", label: "2 to 5 years" },
      { value: "5to10", label: "5 to 10 years" },
      { value: "10to20", label: "10 to 20 years" },
      { value: "gt20", label: "More than 20 years" },
    ],
  },
  {
    key: "past_performance", label: "A job you are proud of", section: "experience", control: "project", required: true,
    helper: "Who it was for, what you did, and roughly what it was worth.",
    whyItMatters: "Write down every job, even the small ones. Buyers accept work you did for private customers.",
  },
  {
    key: "socioeconomic_certifications", label: "Do any of these describe the owner?", section: "federal", control: "checkbox", required: true,
    options: CERT_OPTIONS,
    whyItMatters: "Claiming one wrongly is expensive. Not sure is the safe answer.",
  },
  {
    /* THE LABEL IS THE PLAIN SENTENCE, THE ACRONYM IS IN THE HELPER. It used to
       read "SAM.gov registration", which is also this row's `term` in the
       catalog — and `termToShow` drops a term that repeats the label, so My
       Business showed the jargon and suppressed the plain words entirely. The
       helper carries SAM.gov for the member who knows it by that name, because
       `/intake` renders a helper and never renders a term. */
    key: "sam_registration_status", label: "Registered to sell to the government", section: "federal", control: "radio", required: true,
    helper: "Where you are with it today. Not started is a normal answer.",
    whyItMatters: "You cannot be paid for federal work without it.",
    options: [
      { value: "active", label: "Registered and active" },
      { value: "in_progress", label: "Started, not finished" },
      { value: "not_started", label: "Not started" },
      { value: "not_sure", label: "Not sure" },
    ],
    dfy: { service: "SAM.gov Registration", price: "$2,997", href: "roadmap" },
  },
  {
    key: "ninety_day_goal", label: "What does a win look like in the next 90 days?", section: "goals", control: "long-text", required: true,
    whyItMatters: "Your mentor builds the call around this answer.",
    examples: [
      "Submit my first bid, even a small one",
      "Get registered and meet three contracting officers",
      "Win a micro-purchase under $15,000",
    ],
  },

  // ── The other twenty-three — optional ───────────────────────────────
  { key: "company_address", label: "Business address", section: "company", control: "text", required: false },
  {
    // In parts with an address lookup, unlike `company_address` above, which is
    // one of the frozen thirty-nine and stays a single line. A new key carries
    // none of that debt, so it gets the structured control on both surfaces.
    key: "home_address", label: "Home address", section: "start", control: "home-address", required: true,
    helper: "Where we would post something to you. Start typing and pick from the list, or fill it in yourself.",
  },
  {
    key: "tshirt_size", label: "T-shirt size", section: "start", control: "radio", required: true,
    helper: "For anything we send you. Unisex sizing.",
    options: [
      { value: "xs", label: "XS" },
      { value: "s", label: "S" },
      { value: "m", label: "M" },
      { value: "l", label: "L" },
      { value: "xl", label: "XL" },
      { value: "xxl", label: "2XL" },
      { value: "xxxl", label: "3XL" },
    ],
  },
  {
    key: "year_started_operating", label: "Year you started operating", section: "company", control: "text", required: false,
  },
  { key: "dba_name", label: "Doing business as (DBA)", section: "company", control: "text", required: false },
  { key: "primary_contact_title", label: "Your title", section: "start", control: "text", required: false },
  {
    key: "business_description", label: "Your business in a few sentences", section: "whatyoudo", control: "long-text", required: false,
    examples: ["We are a family-run commercial cleaning company serving the Raleigh area since 2015."],
  },
  {
    key: "current_customer_types", label: "Who you serve today", section: "whatyoudo", control: "checkbox", required: false,
    options: [
      { value: "homeowners", label: "Homeowners" },
      { value: "businesses", label: "Businesses" },
      { value: "gc", label: "General contractors" },
      { value: "government", label: "Government already" },
      { value: "other", label: "Other" },
    ],
  },
  {
    key: "service_delivery_mode", label: "How you deliver", section: "whatyoudo", control: "radio", required: false,
    options: [
      { value: "onsite", label: "On site" },
      { value: "remote", label: "Remotely" },
      { value: "both", label: "Both" },
    ],
  },
  { key: "past_performance_2", label: "Another job worth mentioning", section: "experience", control: "project", required: false },
  { key: "past_performance_3", label: "One more, if you have it", section: "experience", control: "project", required: false },
  {
    key: "sectors_served", label: "Sectors you have worked in", section: "experience", control: "checkbox", required: false,
    options: [
      { value: "commercial", label: "Commercial" },
      { value: "residential", label: "Residential" },
      { value: "industrial", label: "Industrial" },
      { value: "government", label: "Government" },
      { value: "nonprofit", label: "Nonprofit" },
      { value: "none", label: "None of these", exclusive: true },
    ],
  },
  {
    key: "has_active_commercial_contracts", label: "Any active commercial contracts today?", section: "experience", control: "radio", required: false,
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    key: "has_capability_statement", label: "Do you have a capability statement?", section: "federal", control: "radio", required: false,
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_sure", label: "Not sure what that is" },
    ],
    dfy: { service: "Capability Statement", price: "$2,000", href: "roadmap" },
  },
  {
    key: "pursuing_as", label: "How do you plan to pursue work?", section: "federal", control: "radio", required: false,
    options: [
      { value: "prime", label: "Prime — win contracts directly" },
      { value: "sub", label: "Subcontractor — work under a prime" },
      { value: "both", label: "Both" },
      { value: "not_sure", label: "Not sure yet" },
    ],
  },
  { key: "bonding_capacity", label: "A promise from a bank that you will finish the job", section: "federal", control: "text", required: false, helper: "If you carry a bond, the single and aggregate limits." },
  { key: "insurance_coverage", label: "Insurance coverage", section: "federal", control: "text", required: false },
  { key: "licenses", label: "Licenses you hold", section: "federal", control: "text", required: false },
  { key: "security_clearances", label: "Security clearances, if any", section: "federal", control: "text", required: false },
  {
    key: "best_first_opportunity", label: "What would the ideal first contract be?", section: "goals", control: "long-text", required: false,
    examples: ["A grounds maintenance contract at the VA hospital 20 minutes from us."],
  },
  {
    key: "constraints", label: "Anything that limits what you can take on?", section: "goals", control: "checkbox", required: false,
    options: [
      { value: "crew", label: "Crew size" },
      { value: "cashflow", label: "Cash flow" },
      { value: "equipment", label: "Equipment" },
      { value: "time", label: "Owner's time" },
      { value: "none", label: "Nothing significant", exclusive: true },
    ],
  },
  { key: "anything_else", label: "Anything else your mentor should know?", section: "goals", control: "long-text", required: false },
  { key: "doc_capability_statement", label: "Your one-page flyer for buyers", section: "documents", control: "upload", required: false },
  { key: "doc_certifications", label: "Certification letters", section: "documents", control: "upload", required: false },
  { key: "doc_past_performance", label: "Papers about work you have done", section: "documents", control: "upload", required: false },
  { key: "doc_brochure", label: "Your company brochure", section: "documents", control: "upload", required: false },
  { key: "doc_marketing", label: "Marketing material", section: "documents", control: "upload", required: false },
];

export const REQUIRED_KEYS: string[] = REGISTRY.filter((f) => f.required).map((f) => f.key);
/** The intake FORM's required count — 16 since home_address and tshirt_size
 *  were added. The Basic Info milestone is `BEFORE_FIRST_CALL_TOTAL` (14). */
export const REQUIRED_TOTAL = REQUIRED_KEYS.length;

const FIELD_BY_KEY = new Map(REGISTRY.map((f) => [f.key, f]));
export function fieldDef(key: string): RegistryField | undefined {
  return FIELD_BY_KEY.get(key);
}

/** States that make a field count as answered (§3.3): a proposal is not an answer. */
export const ANSWERED_STATES: ReadonlyArray<ProfileFieldState> = ["attested", "verified"];

/**
 * How many of `keys` the member has answered.
 *
 * "No, not yet" and "Not sure" are real answers — they arrive as `attested`
 * rows and count. needs_review/inferred never count.
 *
 * THE KEY SET IS THE CALLER'S TO NAME, and that is the point. There are two
 * sets and they are not the same question: the intake FORM's required fields,
 * and the fourteen the record means before the first call. Counting one and
 * dividing by the other is what produced a counter that could read "16 of 14"
 * — see `basicInfoAnswered` in catalog.ts.
 */
export function countAnswered(
  rows: Array<{ fieldKey: string; state: string }>,
  keys: readonly string[],
): number {
  const answered = new Set(
    rows
      .filter((r) => (ANSWERED_STATES as readonly string[]).includes(r.state))
      .map((r) => r.fieldKey),
  );
  return keys.filter((k) => answered.has(k)).length;
}

/**
 * The intake FORM's counter (§3.3): answered over `REQUIRED_KEYS`.
 *
 * NOT the Basic Info milestone — that is `basicInfoAnswered`. This set is
 * whatever /intake requires, which since 2026-08-26 includes a postal address
 * and a T-shirt size for the welcome pack.
 */
export function answeredCount(rows: Array<{ fieldKey: string; state: string }>): number {
  return countAnswered(rows, REQUIRED_KEYS);
}

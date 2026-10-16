// DEMO: every field on the Business Profile tabs, with its starting values taken
// from the story (src/demo/story). Nothing here types a story fact twice: names,
// codes, places and numbers are imported. A tab shows a field by id
// (components/profile/ProfileField.tsx). What the visitor changes is kept in the
// demo store (store.ts) and laid over these starting values.

import type { ReactNode } from "react";
import { PAST_PERFORMANCE, PERSONA } from "../story/persona";
import { fmtLong, fmtShort, toIsoDay } from "./dates";
import { daysFromNow, isoDaysFromNow } from "../story/clock";
import type { FieldOverride, FieldState, FieldValue } from "./store";
import type { DfyServiceId } from "./dfy";

export type EditInputType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "range"
  | "date"
  | "boolean"
  | "file"
  | "number";

export type ProfileTab =
  | "positioning"
  | "identity"
  | "capabilities"
  | "certifications"
  | "digital"
  | "sled"
  | "bidder-profile";

export interface ConflictChoice {
  source: string;
  value: string;
}

export interface FieldDef {
  id: string;
  tab: ProfileTab;
  tier: "T1" | "T2" | "T3";
  label: string;
  helper?: string;
  whyItMatters?: string;
  chatEditable?: boolean;
  /** What the field holds before the visitor changes anything. */
  initial: { state: FieldState; value?: FieldValue; source?: string; at?: string; errorMessage?: string };
  edit?: {
    type: EditInputType;
    options?: string[];
    placeholder?: string;
    /** Returns a sentence when the value is wrong, or null. */
    validate?: (value: unknown) => string | null;
  };
  /** The DFY service this field can be ordered through. */
  dfy?: { service: DfyServiceId; price: number; leadField?: boolean };
  conflict?: ConflictChoice[];
  /** How the stored value is shown. Default: the text, or the list joined with " · ". */
  show?: (value: FieldValue) => ReactNode;
  /** A note that goes with a field that checks something live. */
  checksAgainst?: string;
}

// ── formatting ───────────────────────────────────────────────────────────────

const ago = (days: number) => fmtShort(daysFromNow(-days));
const told = (days: number) => `You told Hunter on ${ago(days)}`;
const iso = (days: number) => isoDaysFromNow(-days);

function money(n: number): string {
  if (n >= 1_000_000) return `$${+(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${+(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

function mono(text: string): ReactNode {
  return <span className="fr-mono">{text}</span>;
}

/** `722310 Food Service Contractors` → the code in mono, then the title. */
function codeAndTitle(code: string, title: string): ReactNode {
  return (
    <>
      {mono(code)} {title}
    </>
  );
}

function asList(v: FieldValue): string[] {
  return Array.isArray(v) ? v : typeof v === "string" && v ? [v] : [];
}

const STATE_NAMES: Record<string, string> = { NC: "North Carolina", VA: "Virginia", SC: "South Carolina", GA: "Georgia" };

const SAM_DAYS = 150;
const FORMED_ISO = toIsoDay(PERSONA.formedOn);
const SECONDARY = PERSONA.secondaryNaics;
const CORE_CAPABILITIES = [
  "Contract meal service from one commercial kitchen",
  "Therapeutic diets (renal, diabetic, pureed)",
  "Halal and allergen-labelled menus",
  "Event and ceremony catering",
];

// ── validation ───────────────────────────────────────────────────────────────

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const einCheck = (v: unknown) => (/^\d{2}-?\d{7}$/.test(text(v)) ? null : "An EIN has 9 digits, like 12-3456789.");
const ueiCheck = (v: unknown) => (/^[A-Za-z0-9]{12}$/.test(text(v)) ? null : "A UEI is 12 letters and numbers, with no spaces.");
const cageCheck = (v: unknown) => (/^[A-Za-z0-9]{5}$/.test(text(v)) ? null : "A CAGE code is 5 letters and numbers.");
const requiredCheck = (what: string) => (v: unknown) => (text(v) ? null : `Enter ${what}.`);
const urlCheck = (v: unknown) => {
  const t = text(v);
  if (!t) return "Enter a web address.";
  return /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(t) ? null : "That does not look like a web address.";
};
const phoneCheck = (v: unknown) => (text(v).replace(/\D/g, "").length >= 10 ? null : "Enter a 10-digit phone number.");
const countCheck = (v: unknown) => {
  const n = Number(text(String(v ?? "")));
  return Number.isFinite(n) && n >= 0 && text(String(v ?? "")) !== "" ? null : "Enter a number.";
};

// ── the definitions ──────────────────────────────────────────────────────────

const DEFS: FieldDef[] = [
  // ───────────────────────────── Identity ─────────────────────────────
  {
    id: "legal-name",
    tab: "identity",
    tier: "T1",
    label: "Legal Name",
    initial: { state: "verified", value: PERSONA.businessName, source: `SAM.gov on ${ago(SAM_DAYS)}`, at: iso(SAM_DAYS) },
    edit: { type: "text", validate: requiredCheck("your legal name") },
    whyItMatters:
      "Your business's official legal name. Hunter uses this on proposals; mismatches with SAM can disqualify bids.",
  },
  {
    id: "ein",
    tab: "identity",
    tier: "T1",
    label: "EIN",
    helper:
      "Your federal tax ID — the IRS issued this when your business was formed. It's on your CP-575 letter.",
    initial: { state: "missing" },
    edit: { type: "text", placeholder: "12-3456789", validate: einCheck },
    whyItMatters:
      "Federal contracts require your EIN for invoicing and tax forms. Most opportunities can't move forward without it.",
  },
  {
    id: "uei",
    tab: "identity",
    tier: "T1",
    label: "UEI",
    initial: { state: "verified", value: PERSONA.uei, source: `SAM.gov on ${ago(SAM_DAYS)}`, at: iso(SAM_DAYS) },
    edit: { type: "text", validate: ueiCheck },
    show: (v) => mono(String(v ?? "")),
    whyItMatters:
      "Your Unique Entity Identifier — the federal government's way to identify your business. It comes with SAM.gov registration.",
  },
  {
    id: "cage",
    tab: "identity",
    tier: "T1",
    label: "CAGE",
    initial: { state: "verified", value: PERSONA.cage, source: `SAM.gov on ${ago(SAM_DAYS)}`, at: iso(SAM_DAYS) },
    edit: { type: "text", validate: cageCheck },
    show: (v) => mono(String(v ?? "")),
    whyItMatters:
      "Your Commercial and Government Entity code — used by DoD and other agencies for vendor identification.",
  },
  {
    id: "sam-status",
    tab: "identity",
    tier: "T1",
    label: "SAM Status",
    initial: {
      state: "verified",
      value: `Active until ${fmtLong(PERSONA.samActiveUntil)}`,
      source: `SAM.gov on ${ago(SAM_DAYS)}`,
      at: iso(SAM_DAYS),
    },
    edit: { type: "text" },
    whyItMatters:
      "An active SAM.gov registration is required for almost every federal opportunity. Renew before expiration.",
  },
  {
    id: "entity-type",
    tab: "identity",
    tier: "T2",
    label: "Entity Type",
    initial: {
      state: "verified",
      value: PERSONA.entityType,
      source: `Articles of Organization on ${ago(SAM_DAYS + 4)}`,
      at: iso(SAM_DAYS + 4),
    },
    edit: { type: "select", options: ["LLC", "Corporation", "Partnership", "Sole proprietor"] },
    whyItMatters:
      "Federal contracting generally requires a formal entity (LLC, Corp, Partnership) — sole proprietors are restricted.",
  },
  {
    id: "formation-state",
    tab: "identity",
    tier: "T2",
    label: "Formation State",
    initial: {
      state: "verified",
      value: PERSONA.stateOfIncorporation,
      source: `Articles of Organization on ${ago(SAM_DAYS + 4)}`,
      at: iso(SAM_DAYS + 4),
    },
    edit: { type: "select", options: Object.values(STATE_NAMES) },
  },
  {
    id: "physical-address",
    tab: "identity",
    tier: "T2",
    label: "Physical Address",
    initial: { state: "verified", value: PERSONA.physicalAddress, source: `SAM.gov on ${ago(SAM_DAYS)}`, at: iso(SAM_DAYS) },
    edit: { type: "text", validate: requiredCheck("your street address") },
  },
  {
    id: "sos-status",
    tab: "identity",
    tier: "T2",
    label: "Secretary of State Status",
    initial: { state: "stale", value: "Active", at: iso(16) },
    edit: { type: "text" },
    checksAgainst: "NC Secretary of State",
  },
  {
    id: "business-phone",
    tab: "identity",
    tier: "T2",
    label: "Business Phone",
    initial: { state: "attested", value: PERSONA.phone, source: told(110), at: iso(110) },
    edit: { type: "text", placeholder: "(910) 555-0100", validate: phoneCheck },
    helper: "The phone number on your federal proposals. Required for POC fields.",
    whyItMatters: "Federal proposals always need a phone POC.",
  },
  {
    id: "formation-date",
    tab: "identity",
    tier: "T3",
    label: "Formation Date",
    initial: { state: "verified", value: FORMED_ISO, source: `Articles of Organization on ${ago(SAM_DAYS + 4)}`, at: iso(SAM_DAYS + 4) },
    edit: { type: "date" },
    show: (v) => (typeof v === "string" && v ? fmtLong(v) : ""),
  },
  {
    id: "mailing-address",
    tab: "identity",
    tier: "T3",
    label: "Mailing Address",
    initial: { state: "conflict", value: PERSONA.mailingAddress },
    conflict: [
      { source: "SAM.gov", value: PERSONA.physicalAddress },
      { source: `You typed this on ${ago(100)}`, value: PERSONA.mailingAddress },
    ],
    edit: { type: "text", validate: requiredCheck("your mailing address") },
  },
  {
    id: "linkedin",
    tab: "identity",
    tier: "T3",
    label: "LinkedIn Profile",
    helper: "Optional. A LinkedIn page adds credibility on proposals.",
    initial: { state: "missing" },
    edit: { type: "text", placeholder: "linkedin.com/company/your-company", validate: urlCheck },
  },
  {
    id: "years-in-business",
    tab: "identity",
    tier: "T3",
    label: "Years in Business",
    initial: { state: "inferred", value: `~${PERSONA.yearsInBusiness} years`, source: "computed from your formation date" },
    edit: { type: "text" },
  },

  // ───────────────────────────── Capabilities ─────────────────────────────
  {
    id: "primary-naics",
    tab: "capabilities",
    tier: "T1",
    label: "Primary NAICS",
    initial: {
      state: "verified",
      value: `${PERSONA.primaryNaics} ${PERSONA.primaryNaicsLabel}`,
      source: `SAM.gov on ${ago(SAM_DAYS)}`,
      at: iso(SAM_DAYS),
    },
    edit: { type: "text", placeholder: "722310 Food Service Contractors", validate: requiredCheck("a NAICS code") },
    show: (v) => {
      const t = String(v ?? "");
      const m = /^(\d{2,6})\s+(.*)$/.exec(t);
      return m ? codeAndTitle(m[1], m[2]) : t;
    },
    whyItMatters:
      "Your primary industry classification. Hunter uses this as a baseline filter for opportunity matching.",
  },
  {
    id: "core-capabilities",
    tab: "capabilities",
    tier: "T1",
    label: "Core Capabilities",
    initial: { state: "attested", value: CORE_CAPABILITIES, source: `${told(112)}`, at: iso(112) },
    edit: { type: "multiselect" },
    whyItMatters:
      "Hunter uses these phrases to match opportunity scope to your work. The Capability Statement upload is what gates federal credibility.",
  },
  {
    id: "secondary-naics",
    tab: "capabilities",
    tier: "T2",
    label: "Secondary NAICS",
    initial: {
      state: "verified",
      value: SECONDARY.map((n) => `${n.code} ${n.label}`),
      source: `SAM.gov on ${ago(SAM_DAYS)}`,
      at: iso(SAM_DAYS),
    },
    edit: { type: "multiselect" },
    show: (v) => (
      <>
        {asList(v).map((t, i) => {
          const m = /^(\d{2,6})\s+(.*)$/.exec(t);
          return (
            <span key={t}>
              {i > 0 ? " · " : ""}
              {m ? codeAndTitle(m[1], m[2]) : t}
            </span>
          );
        })}
      </>
    ),
  },
  {
    id: "differentiators",
    tab: "capabilities",
    tier: "T2",
    label: "Differentiators",
    initial: { state: "attested", value: [...PERSONA.differentiators], source: told(112), at: iso(112) },
    edit: { type: "multiselect" },
  },
  {
    id: "psc-codes",
    tab: "capabilities",
    tier: "T3",
    label: "PSC Codes",
    helper: "Auto-derived from your NAICS. Refine if needed.",
    initial: { state: "missing" },
    edit: { type: "text", placeholder: "S203, S206" },
  },
  {
    id: "keywords",
    tab: "capabilities",
    tier: "T3",
    label: "Keywords / Skills",
    helper: "Tags that improve match precision.",
    initial: { state: "missing" },
    edit: { type: "multiselect" },
  },
  {
    id: "clearances",
    tab: "capabilities",
    tier: "T3",
    label: "Clearance Levels Held",
    initial: {
      state: "attested",
      value: PERSONA.clearances.length ? [...PERSONA.clearances] : "None — no one on your team holds a security clearance",
      source: told(112),
      at: iso(112),
    },
    edit: { type: "text" },
  },
  {
    id: "vehicles",
    tab: "capabilities",
    tier: "T3",
    label: "Vehicles Held (GSA Schedules, GWACs, IDIQs)",
    initial: { state: "missing" },
    edit: { type: "text" },
  },
  {
    id: "dcaa",
    tab: "capabilities",
    tier: "T3",
    label: "DCAA-Compliant Accounting",
    initial: { state: "missing" },
    edit: { type: "select", options: ["Yes", "No", "Not sure"] },
  },

  // ───────────────────────────── Certifications ─────────────────────────────
  {
    id: "sba-set-aside",
    tab: "certifications",
    tier: "T1",
    label: "SBA Set-Aside Eligibility (from SAM)",
    initial: {
      state: "verified",
      value: PERSONA.certifications.join(" · "),
      source: `SAM.gov on ${ago(SAM_DAYS)}`,
      at: iso(SAM_DAYS),
    },
    edit: { type: "text" },
    whyItMatters:
      "These flags determine which set-aside contracts you can bid on. They come from your SAM.gov registration.",
  },
  {
    id: "small-business",
    tab: "certifications",
    tier: "T1",
    label: `Small Business Status (per NAICS ${PERSONA.primaryNaics})`,
    initial: {
      state: "verified",
      value: `Small (per NAICS ${PERSONA.primaryNaics} size standard)`,
      source: `SAM.gov on ${ago(SAM_DAYS)}`,
      at: iso(SAM_DAYS),
    },
    edit: { type: "text" },
  },
  {
    id: "dsbs",
    tab: "certifications",
    tier: "T2",
    label: "DSBS Profile",
    helper:
      "Your visibility on the Dynamic Small Business Search — where federal buyers find small business contractors.",
    initial: { state: "missing" },
    edit: { type: "text", placeholder: "web.sba.gov/…", validate: urlCheck },
    whyItMatters:
      "Without a DSBS profile, federal buyers searching for small businesses in your NAICS can't find you proactively.",
    dfy: { service: "sbs-visibility", price: 997 },
  },
  {
    id: "wosb-doc",
    tab: "certifications",
    tier: "T2",
    label: "WOSB/EDWOSB Certification",
    helper: "Upload your SBA woman-owned small business certificate so buyers can check it.",
    initial: { state: "attested", value: "WOSB certificate.pdf", source: `You uploaded WOSB certificate.pdf on ${ago(60)}`, at: iso(60) },
    edit: { type: "file" },
    whyItMatters: "Women-owned set-asides ask for proof of certification. Hunter flags these on matching bids.",
  },
  {
    id: "8a",
    tab: "certifications",
    tier: "T3",
    label: "8(a) Certification Document",
    initial: { state: "missing" },
    edit: { type: "file" },
  },
  {
    id: "hubzone",
    tab: "certifications",
    tier: "T3",
    label: "HUBZone Certification",
    initial: { state: "missing" },
    edit: { type: "file" },
  },
  { id: "cmmc", tab: "certifications", tier: "T3", label: "CMMC Level", initial: { state: "missing" }, edit: { type: "select", options: ["Level 1", "Level 2", "Level 3", "None"] } },
  { id: "iso", tab: "certifications", tier: "T3", label: "ISO Certifications", initial: { state: "missing" }, edit: { type: "multiselect" } },
  { id: "soc2", tab: "certifications", tier: "T3", label: "SOC 2 Report", initial: { state: "missing" }, edit: { type: "file" } },
  {
    id: "state-diversity",
    tab: "certifications",
    tier: "T3",
    label: "State Diversity Certifications (DBE/MBE/WBE/MWBE)",
    initial: { state: "missing" },
    edit: { type: "multiselect" },
  },

  // ───────────────────────────── Digital ─────────────────────────────
  {
    id: "website",
    tab: "digital",
    tier: "T2",
    label: "Website",
    initial: { state: "verified", value: PERSONA.website, source: `DNS lookup on ${ago(9)}`, at: iso(9) },
    edit: { type: "text", validate: urlCheck },
    whyItMatters:
      "Federal buyers check your website during evaluations. A broken or missing site hurts your credibility.",
    checksAgainst: "your domain's DNS records",
  },
  {
    id: "custom-email",
    tab: "digital",
    tier: "T2",
    label: "Custom Email Domain",
    initial: { state: "verified", value: PERSONA.email, source: `DNS lookup on ${ago(9)}`, at: iso(9) },
    edit: { type: "text", validate: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(v)) ? null : "Enter an email address.") },
    checksAgainst: "your domain's mail records",
  },
  {
    id: "a2p",
    tab: "digital",
    tier: "T3",
    label: "A2P Brand ID",
    helper: "Required if you send text messages to customers through an SMS system.",
    initial: { state: "missing" },
    edit: { type: "text", placeholder: "BN…" },
  },
  {
    id: "account-signals",
    tab: "digital",
    tier: "T3",
    label: "Account Signals",
    helper: "Synced from your CRM account when connected.",
    initial: { state: "missing" },
    edit: { type: "text" },
  },

  // ───────────────────────────── SLED ─────────────────────────────
  {
    id: "sled-target-states",
    tab: "sled",
    tier: "T2",
    label: "SLED Target States",
    initial: {
      state: "attested",
      value: PERSONA.serviceStates.map((s) => STATE_NAMES[s] ?? s),
      source: told(112),
      at: iso(112),
    },
    edit: { type: "multiselect" },
    chatEditable: true,
  },
  { id: "state-tax-ids", tab: "sled", tier: "T3", label: "State Tax IDs", initial: { state: "missing" }, edit: { type: "text" } },
  {
    id: "insurance-state",
    tab: "sled",
    tier: "T3",
    label: "Insurance Certificates per State",
    initial: { state: "missing" },
    edit: { type: "file" },
  },

  // ───────────────────────────── Positioning ─────────────────────────────
  {
    id: "target-value",
    tab: "positioning",
    tier: "T1",
    label: "Target Contract Value Range",
    helper: "Tells Hunter your size so we stop showing wrong-sized opps.",
    initial: {
      state: "attested",
      value: { min: PERSONA.targetValueMin, max: PERSONA.targetValueMax },
      source: told(112),
      at: iso(112),
    },
    edit: { type: "range" },
    show: (v) => {
      const r = v as { min: number | null; max: number | null } | null;
      if (!r) return "";
      if (r.min != null && r.max != null) return `${money(r.min)} – ${money(r.max)}`;
      if (r.min != null) return `${money(r.min)} and up`;
      if (r.max != null) return `Up to ${money(r.max)}`;
      return "";
    },
    chatEditable: true,
    whyItMatters:
      "Hunter filters by what you can comfortably win. Without this, you'd see contracts way too big or way too small for your team.",
  },
  {
    id: "geo-pref",
    tab: "positioning",
    tier: "T1",
    label: "Geographic Preference",
    helper: "Where you'll work — radius, states, or national. Hunter won't surface opportunities outside your reach.",
    initial: {
      state: "attested",
      value: `Within ${PERSONA.serviceRadiusMiles} miles of ${PERSONA.hqCity}, ${PERSONA.hqState} (covers ${PERSONA.serviceStates.join(", ")}).`,
      source: told(112),
      at: iso(112),
    },
    edit: { type: "textarea" },
    chatEditable: true,
    whyItMatters:
      "Place of performance is often the deciding factor — Hunter prioritises opportunities in your reach.",
  },
  {
    id: "set-aside",
    tab: "positioning",
    tier: "T1",
    label: "Set-Aside Appetite",
    helper: "Set-aside only, full-and-open only, or both. Shapes which opportunities Hunter focuses on.",
    initial: { state: "attested", value: "Both, leaning set-aside", source: told(112), at: iso(112) },
    edit: { type: "select", options: ["Set-aside only", "Both, leaning set-aside", "Both, leaning open", "Full-and-open only"] },
    show: (v) =>
      v === "Full-and-open only" ? String(v) : `${v} (you're a woman-owned small business)`,
    chatEditable: true,
    whyItMatters:
      "Set-aside opportunities have less competition. Full-and-open are bigger but compete with everyone — this tells Hunter where to focus.",
  },
  {
    id: "target-agencies",
    tab: "positioning",
    tier: "T2",
    label: "Target Agencies",
    helper: "Agencies you most want to work with. Hunter will prioritise their solicitations.",
    initial: { state: "attested", value: [...PERSONA.targetAgencies], source: told(60), at: iso(60) },
    edit: { type: "multiselect" },
    chatEditable: true,
    whyItMatters: "Hunter prioritises solicitations from agencies you're hunting, including pre-solicitations.",
  },
  {
    id: "notif-cadence",
    tab: "positioning",
    tier: "T2",
    label: "Notification Cadence",
    helper: "How often you want a digest of new matches.",
    initial: { state: "attested", value: "Weekly digest", source: told(112), at: iso(112) },
    edit: { type: "select", options: ["Daily digest", "Weekly digest", "Monthly digest"] },
    chatEditable: true,
  },
  {
    id: "win-themes",
    tab: "positioning",
    tier: "T2",
    label: "Win Themes",
    helper:
      "In your own words: why should a contracting officer pick you over a competitor? Ava uses these in proposals.",
    initial: { state: "missing" },
    edit: { type: "textarea" },
    chatEditable: true,
    whyItMatters:
      "Without win themes, Ava's drafts are generic. Your honest answer — even rough — gives her something authentic to work from.",
  },
  { id: "naics-priorities", tab: "positioning", tier: "T3", label: "NAICS Targeting Priorities", initial: { state: "missing" }, edit: { type: "text" } },
  { id: "avoid-agencies", tab: "positioning", tier: "T3", label: "Agencies to Avoid", initial: { state: "missing" }, edit: { type: "multiselect" } },
  { id: "key-personnel", tab: "positioning", tier: "T3", label: "Key Personnel Highlight", initial: { state: "missing" }, edit: { type: "textarea" } },

  // ───────────────────────────── Bidder profile ─────────────────────────────
  {
    id: "annual-revenue",
    tab: "bidder-profile",
    tier: "T2",
    label: "Annual Revenue Band",
    helper: "Roughly what your firm makes in a year. Used by Grant to scale capacity expectations.",
    initial: { state: "attested", value: PERSONA.annualRevenueBand, source: told(112), at: iso(112) },
    edit: { type: "select", options: ["Under $100K", "$100K–$500K", "$500K–$1M", "$1M–$5M", "Over $5M"] },
    whyItMatters:
      "Grant uses revenue size to flag contracts that would overload your firm or be too small to bother with.",
  },
  {
    id: "employees",
    tab: "bidder-profile",
    tier: "T2",
    label: "Total Employees (W-2)",
    initial: { state: "attested", value: String(PERSONA.employeesW2), source: told(112), at: iso(112) },
    edit: { type: "number", validate: countCheck },
  },
  {
    id: "basic-insurance",
    tab: "bidder-profile",
    tier: "T2",
    label: "Basic Insurance",
    helper: "Just whether you have general liability insurance. Detail can be added later.",
    initial: { state: "attested", value: "Yes — general liability", source: told(112), at: iso(112) },
    edit: { type: "select", options: ["Yes — general liability", "Yes — general liability and workers' compensation", "Not yet"] },
    whyItMatters:
      "Most federal contracts require minimum insurance — Grant flags ones where your coverage is short.",
  },
  {
    id: "concurrent-capacity",
    tab: "bidder-profile",
    tier: "T2",
    label: "Concurrent Contract Capacity",
    initial: {
      state: "inferred",
      value: `${Math.max(1, Math.floor(PERSONA.employeesW2 / 2))} contracts at a time`,
      source: `your team size of ${PERSONA.employeesW2}`,
    },
    edit: { type: "text" },
    whyItMatters: "Helps Grant flag contracts that would conflict if you won them simultaneously.",
  },
  { id: "cash-flow", tab: "bidder-profile", tier: "T3", label: "Cash Flow Tolerance", initial: { state: "missing" }, edit: { type: "select", options: ["Paid within 30 days", "Can wait 45 days", "Can wait 60 days or more"] } },
  {
    id: "bonding",
    tab: "bidder-profile",
    tier: "T3",
    label: "Bonding Capability",
    initial: {
      state: "attested",
      value: `Up to $${PERSONA.largestBond.toLocaleString("en-US")} (the largest bond you have carried)`,
      source: told(80),
      at: iso(80),
    },
    edit: { type: "text" },
  },
  { id: "insurance-detail", tab: "bidder-profile", tier: "T3", label: "Insurance — per coverage type", initial: { state: "missing" }, edit: { type: "textarea" } },
  { id: "risk", tab: "bidder-profile", tier: "T3", label: "Risk Appetite", initial: { state: "missing" }, edit: { type: "select", options: ["Low", "Medium", "High"] } },
  { id: "competitors", tab: "bidder-profile", tier: "T3", label: "Competitors Known", initial: { state: "missing" }, edit: { type: "multiselect" } },
  {
    id: "teaming",
    tab: "bidder-profile",
    tier: "T3",
    label: "Teaming Partners",
    initial: {
      state: "attested",
      value: `Subcontractor to Fort Bragg dining prime, ${new Date(
        PAST_PERFORMANCE.find((p) => p.id === "pp-cdg-sub")!.periodStart,
      ).getUTCFullYear()}`,
      source: "From your past performance",
    },
    edit: { type: "textarea" },
  },
  { id: "dealbreakers", tab: "bidder-profile", tier: "T3", label: "Bid/No-Bid Deal-Breakers", initial: { state: "missing" }, edit: { type: "textarea" } },
  { id: "subs", tab: "bidder-profile", tier: "T3", label: "Subcontractor Pool Size", initial: { state: "missing" }, edit: { type: "number", validate: countCheck } },
  { id: "mpa", tab: "bidder-profile", tier: "T3", label: "Mentor-Protégé Agreement", initial: { state: "missing" }, edit: { type: "select", options: ["Yes", "No", "In progress"] } },
  { id: "jv", tab: "bidder-profile", tier: "T3", label: "Joint Ventures", initial: { state: "missing" }, edit: { type: "textarea" } },
];

export const FIELD_DEFS: Record<string, FieldDef> = Object.fromEntries(DEFS.map((d) => [d.id, d]));

export function fieldsOnTab(tab: ProfileTab): FieldDef[] {
  return DEFS.filter((d) => d.tab === tab);
}

// ── the food-handler certificates: a count, shown on the Certifications tab ──

export const FOOD_HANDLER_DEF: FieldDef = {
  id: "food-handlers",
  tab: "certifications",
  tier: "T2",
  label: "Food-Handler Certificates (ServSafe)",
  helper: "How many of your staff hold a current food-handler certificate.",
  initial: { state: "attested", value: String(PERSONA.foodHandlerCertified), source: told(20), at: iso(20) },
  edit: { type: "number", validate: countCheck },
  whyItMatters:
    "School and base dining buyers ask for a current certificate for everyone who handles food. Missing ones cost points.",
};
DEFS.push(FOOD_HANDLER_DEF);
FIELD_DEFS[FOOD_HANDLER_DEF.id] = FOOD_HANDLER_DEF;

// ── effective values: the starting values with the visitor's changes on top ──

export interface EffectiveField {
  def: FieldDef;
  state: FieldState;
  value: FieldValue;
  source?: string;
  at?: string;
  errorMessage?: string;
  dfyOrderId?: string;
  /** True when the visitor (or an action) changed it. */
  changed: boolean;
}

export function effectiveField(def: FieldDef, overrides: Record<string, FieldOverride>): EffectiveField {
  const o = overrides[def.id];
  const init = def.initial;
  const state = o?.state ?? init.state;
  const value = o && "value" in o ? (o.value ?? null) : (init.value ?? null);
  return {
    def,
    state,
    value,
    source: o?.source ?? init.source,
    at: o?.at ?? init.at,
    errorMessage: o?.errorMessage ?? init.errorMessage,
    dfyOrderId: o?.dfyOrderId,
    changed: Boolean(o),
  };
}

export function valueToText(value: FieldValue): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join(" · ");
  if (typeof value === "object") return `${value.min ?? ""}–${value.max ?? ""}`;
  return String(value);
}

/** A field counts as an "essential" when it is T1 or T2. It is complete when it has an answer. */
export function isComplete(state: FieldState): boolean {
  return state === "verified" || state === "attested" || state === "inferred" || state === "needs_review";
}

export function essentialsFor(tab: ProfileTab, overrides: Record<string, FieldOverride>): { done: number; total: number } {
  const list = fieldsOnTab(tab).filter((d) => d.tier !== "T3");
  const done = list.filter((d) => isComplete(effectiveField(d, overrides).state)).length;
  return { done, total: list.length };
}

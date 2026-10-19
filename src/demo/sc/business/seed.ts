// DEMO: the starting My Business record for the member on stage.
//
// Every fact comes from the story (`../../story/persona.ts`). Nothing here types a
// story fact a second time: names, numbers, addresses and past jobs are imported.
// Facts that the story does not hold (for example, how much working capital she has)
// are derived here in plain numbers and listed in the report as "Story requests".
//
// Each answer is written as an `MbValue` (the record's own view) and lowered with
// `fromMb` into the shape the database would hold. So the lifted components and the
// validators see exactly what production data looks like.
//
// This file holds the shared helpers and Amira's (the caterer's) answers. Dana's
// (the agency's) answers live in `src/demo/members/agency/sc/business.ts` and use
// the helpers exported here; `buildSeed()` picks the member on stage.
//
// Amira's record is high but not complete, on purpose (47 of 55):
//   - all 14 questions a mentor reads before the first call are answered and sent;
//   - the EIN, licenses, five-year receipts, key staff, owner citizenship and the
//     state diversity programs are not answered yet;
//   - two food-handler certificates are missing (3 of 5 cooks are certified);
//   - three suggestions wait for a yes or a no;
//   - the health permit (21 days) and the woman-owned certification (48 days) run out
//     soon, on the same dates as the Stay Ready page.

import { byMember, own } from "../../member";
import { PAST_PERFORMANCE, PERSONA, MENTOR } from "../../story/persona";
import { dateDaysFromNow, isoDaysFromNow } from "../../story/clock";
import { MEMBER_SINCE_DAYS, POSITIONING_CALL_DAYS_AGO, SAM_CHECKED_DAYS_AGO } from "../timeline";
import { catalogFor, copyFor } from "@sc/lib/businessProfile/catalog";
import { fromMb } from "@sc/lib/businessProfile/legacyShapes";
import { fieldDef } from "@sc/lib/businessProfile/registry";
import {
  FRESHNESS_ON_FILE,
  FRESHNESS_TODAY,
} from "@sc/lib/businessProfile/freshness";
import { ORIGIN_PROSE, type OriginKey } from "@sc/lib/businessProfile/proposalPolicy";
import {
  choice,
  codes,
  count,
  entries,
  list,
  money,
  papers,
  text,
  type Address,
  type Code,
  type JobEntry,
  type MbValue,
  type Paper,
  type StoredFile,
} from "@sc/lib/businessProfile/mbValue";
import type { ProvenancePayload } from "@sc/lib/businessProfile/payload";
import type { ProfileFieldState } from "@sc/lib/businessProfile/registry";
import type { NaicsBySource } from "@sc/lib/naics/naicsBySource";
import type {
  DemoBusinessState,
  DemoDigitalAudit,
  DemoFieldRow,
  DemoProposal,
} from "./types";
import { MEDIA_LOGO_URL } from "./media";

const copy = own(
  import.meta.glob<typeof import("../../members/agency/copy")>("/src/demo/members/*/copy.tsx", { eager: true }),
);

const pack = own(
  import.meta.glob<typeof import("../../members/agency/sc/business")>("/src/demo/members/*/sc/business.ts", { eager: true }),
);

// ── small helpers ──────────────────────────────────────────────────────────

/** When SAM last checked her registration. */
export function samCheckedOn(): string {
  return isoDaysFromNow(-SAM_CHECKED_DAYS_AGO);
}

export function samCheckedLabel(): string {
  return new Date(samCheckedOn()).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function samActiveLabel(): string {
  return new Date(`${PERSONA.samActiveUntil}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** `201 Hay St, Fayetteville, NC 28301` → parts. The story keeps one string. */
export function addressParts(oneLine: string): Address {
  const [line1, city, region] = oneLine.split(",").map((p) => p.trim());
  const [state, postalCode] = (region ?? "").split(" ");
  return { line1, city, state, postalCode };
}

/** `PO Box 5512, Fayetteville, NC 28302` → parts. */
export function mailingParts(): Address {
  return addressParts(PERSONA.mailingAddress);
}

export const PDF = "application/pdf";

export function file(id: string, name: string, sizeBytes: number, daysAgo: number, pages = 1): StoredFile {
  return { id, name, mime: PDF, sizeBytes, uploadedAt: isoDaysFromNow(-daysAgo), pages };
}

/** The capability statement is the real sample file in `public/demo-files`. */
export const CAPABILITY_STATEMENT_NAME = PERSONA.capabilityStatementFile.split("/").pop()!;
// The agency's number is the size of the file scripts/make-capability-statement.ts writes.
export const CAPABILITY_STATEMENT_BYTES = byMember({ caterer: 2960, pack: copy.CAPABILITY_STATEMENT_BYTES });

// ── timeline ───────────────────────────────────────────────────────────────

// "Days ago". The numbers are shared with Home, the Roadmap and Tasks (../timeline.ts).
export const JOINED_DAYS_AGO = MEMBER_SINCE_DAYS;
export const INTAKE_SENT_DAYS_AGO = MEMBER_SINCE_DAYS - 8;

// ── provenance ─────────────────────────────────────────────────────────────

export function samSource(span: string, before: string, after?: string): ProvenancePayload {
  return {
    type: "register",
    sourceLabel: "SAM.gov registration",
    locator: `SAM.gov · UEI ${PERSONA.uei}`,
    quote: null,
    excerpt: { before, span, after },
    retrievedAt: samCheckedLabel(),
    conversation: null,
    unavailable: null,
  };
}

export function capabilitySource(span: string, before?: string, after?: string): ProvenancePayload {
  return {
    type: "document",
    sourceLabel: "Your capability statement",
    locator: CAPABILITY_STATEMENT_NAME,
    quote: null,
    excerpt: { before, span, after },
    retrievedAt: null,
    conversation: null,
    unavailable: null,
  };
}

export function llcSource(): ProvenancePayload {
  return {
    type: "document",
    sourceLabel: "Your LLC paperwork",
    locator: "Articles of Organization",
    quote: null,
    excerpt: {
      before: `${PERSONA.stateOfIncorporation} Secretary of State. Date of formation:`,
      span: PERSONA.formedOn,
      after: `Name: ${PERSONA.businessName}`,
    },
    retrievedAt: null,
    conversation: null,
    unavailable: null,
  };
}

/** A fact Hunter learned in a chat: what she said, and what Hunter wrote back. */
export function hunterChatSource(said: string, heard: string, daysAgo = 9): ProvenancePayload {
  return {
    type: "conversation",
    sourceLabel: "Your chat with Hunter",
    locator: null,
    quote: null,
    excerpt: null,
    retrievedAt: null,
    conversation: {
      channel: "hunter_chat",
      title: "Hunter chat",
      occurred_at: isoDaysFromNow(-daysAgo),
      turns: [
        { id: "t1", speaker: PERSONA.ownerFirstName, role: "member", text: said },
        { id: "t2", speaker: "Hunter", role: "assistant", text: heard },
      ],
      cited_turn_id: "t1",
    },
    unavailable: null,
  };
}

// ── row builders ───────────────────────────────────────────────────────────

export interface RowOptions {
  state?: ProfileFieldState;
  originKey?: OriginKey;
  daysAgo?: number;
  freshnessLabel?: string;
  provenance?: ProvenancePayload | null;
  verifiedAt?: string;
}

/** Lower one authored answer and add the rows (one per key it writes). */
export function rowsFor(fieldKey: string, mb: MbValue, opts: RowOptions = {}): DemoFieldRow[] {
  const originKey: OriginKey = opts.originKey ?? "member.typed";
  const state: ProfileFieldState = opts.state ?? (originKey === "sam.gov" ? "verified" : "attested");
  const at = isoDaysFromNow(-(opts.daysAgo ?? JOINED_DAYS_AGO));
  return Object.entries(fromMb(fieldKey, mb)).map(([key, value]) => ({
    fieldKey: key,
    value,
    state,
    origin: ORIGIN_PROSE[originKey],
    originKey,
    freshnessLabel: opts.freshnessLabel ?? FRESHNESS_TODAY,
    confirmedAt: null,
    attestedAt: state === "attested" ? at : null,
    verifiedAt: state === "verified" ? (opts.verifiedAt ?? at) : null,
    updatedAt: at,
    expiresAt: null,
    declinedAt: null,
    conflict: null,
    errorMessage: null,
    provenance: opts.provenance ?? null,
  }));
}

// ── the answers ────────────────────────────────────────────────────────────

/** Her top three services. The profile page lists the same ones (and a fourth). The
 *  capability statement names them: "Cooks and delivers ... from one kitchen",
 *  "Therapeutic diets ...", "Event and ceremony catering ...". */
const CORE_SERVICES = [
  "Contract meal service from one commercial kitchen",
  "Therapeutic diets (renal, diabetic, pureed)",
  "Event and ceremony catering",
] as const;

/** Several options, each with the wording the member read on the form. */
export function pick(fieldKey: string, ...values: string[]): MbValue {
  const catalog = catalogFor(fieldKey);
  const options = fieldDef(fieldKey)?.options ?? (catalog ? copyFor(catalog).options : undefined) ?? [];
  return {
    kind: "choices",
    options: values.map((value) => ({ value, label: options.find((o) => o.value === value)?.label ?? value })),
  };
}

export const NAICS = (code: string, label: string, primary = false): Code => ({
  system: "NAICS",
  code,
  label,
  ...(primary ? { primary: true } : {}),
});

export function jobFor(pp: (typeof PAST_PERFORMANCE)[number]): JobEntry {
  const customerType: JobEntry["customerType"] =
    pp.customerType === "local"
      ? "school"
      : pp.customerType === "commercial"
        ? "nonprofit"
        : "federal";
  const place = pp.id === "pp-cdg-sub" || pp.id === "pp-womack" ? "Fort Bragg, NC" : "Fayetteville, NC";
  return {
    id: pp.id,
    customer: pp.customerName,
    customerType,
    scope: pp.scopeDescription,
    role: pp.role,
    valueUSD: pp.totalValue,
    valueText: `$${pp.totalValue.toLocaleString("en-US")}`,
    startedAt: pp.periodStart,
    endedAt: pp.periodEnd,
    place,
    ...(pp.referenceName
      ? {
          reference: {
            name: pp.referenceName,
            ...(pp.referenceTitle ? { title: pp.referenceTitle } : {}),
            mayContact: true,
          },
        }
      : {}),
    ...(pp.awaitingReview
      ? { outcome: "The Army has not written its performance rating (CPARS) for this job yet." }
      : {}),
  };
}

/** Food-handler cards: 3 of 5 cooks hold one (the story's number). */
function foodHandlerCards(): Paper[] {
  return Array.from({ length: PERSONA.foodHandlerCertified ?? 0 }, (_, i): Paper => ({
    id: `fh-${i + 1}`,
    kind: "certification",
    name: `Food handler certificate, cook ${i + 1}`,
    issuer: "ServSafe",
    jurisdiction: "North Carolina",
    issuedAt: dateDaysFromNow(-(300 + i * 40)),
    expiresAt: dateDaysFromNow(640 - i * 70),
  }));
}

function catererRows(): DemoFieldRow[] {
  const out: DemoFieldRow[] = [];
  const add = (fieldKey: string, mb: MbValue, opts?: RowOptions) => {
    out.push(...rowsFor(fieldKey, mb, opts));
  };

  const contact: RowOptions = {
    originKey: "ghl.contact",
    freshnessLabel: FRESHNESS_ON_FILE,
    daysAgo: JOINED_DAYS_AGO,
  };
  const sam = (span: string, before: string, after?: string): RowOptions => ({
    originKey: "sam.gov",
    state: "verified",
    daysAgo: 0,
    verifiedAt: samCheckedOn(),
    provenance: samSource(span, before, after),
  });
  const typed = (daysAgo: number): RowOptions => ({ originKey: "member.typed", daysAgo });

  // ── Your legal details ──
  add("primary_contact_name", text(PERSONA.ownerName), contact);
  add("email", text(PERSONA.email), contact);
  add("phone", text(PERSONA.phone), typed(JOINED_DAYS_AGO - 2));
  add("home_address", { kind: "address", address: mailingParts() }, typed(JOINED_DAYS_AGO - 2));
  add("tshirt_size", choice("m", "M"), typed(JOINED_DAYS_AGO - 2));
  add("primary_contact_title", text(PERSONA.ownerTitle), typed(JOINED_DAYS_AGO - 2));
  add(
    "legal_company_name",
    text(PERSONA.businessName),
    sam(PERSONA.businessName, "Legal business name:", `UEI: ${PERSONA.uei}`),
  );
  add("company_email", text(PERSONA.email), typed(JOINED_DAYS_AGO - 5));
  add("company_phone", text(PERSONA.phone), typed(JOINED_DAYS_AGO - 5));
  add("website", text(PERSONA.website), typed(JOINED_DAYS_AGO - 5));
  add("dba_name", text(PERSONA.businessShortName), typed(JOINED_DAYS_AGO - 5));
  add("entity_type", choice("llc", "A company (LLC)"), {
    originKey: "member.typed",
    daysAgo: JOINED_DAYS_AGO - 4,
    provenance: llcSource(),
  });
  add("year_started_operating", { kind: "date", iso: "2021-03-03" }, {
    originKey: "member.typed",
    daysAgo: JOINED_DAYS_AGO - 4,
    provenance: llcSource(),
  });
  add(
    "company_address",
    { kind: "address", address: addressParts(PERSONA.physicalAddress) },
    sam("Physical address", PERSONA.physicalAddress, "is the address on your registration."),
  );
  add("uei", text(PERSONA.uei), sam(PERSONA.uei, "Unique Entity ID (UEI):"));
  add("cage_code", text(PERSONA.cage), sam(PERSONA.cage, "CAGE code:"));
  add(
    "sam_registration_status",
    choice("active", "Registered and active"),
    sam(`Active until ${samActiveLabel()}`, "Registration status:"),
  );
  add(
    "sled_registrations",
    papers(
      {
        id: "sled-city",
        kind: "registration",
        name: "City of Fayetteville vendor registration",
        issuer: "City of Fayetteville",
        jurisdiction: "Fayetteville, NC",
      },
      {
        id: "sled-county",
        kind: "registration",
        name: "Cumberland County vendor registration",
        issuer: "Cumberland County",
        jurisdiction: "Cumberland County, NC",
      },
    ),
    typed(JOINED_DAYS_AGO - 20),
  );
  add("owners", list(`${PERSONA.ownerName}, 100%`), typed(JOINED_DAYS_AGO - 6));
  add("total_employees", count(PERSONA.employeesW2, "people"), typed(JOINED_DAYS_AGO - 6));
  add("size_status", text("Yes. A small business under the size standard for NAICS 722310."), {
    originKey: "sam.gov",
    state: "verified",
    daysAgo: 0,
    verifiedAt: samCheckedOn(),
    provenance: samSource("Small Business", "Business types:", "Woman-Owned Small Business (WOSB)"),
  });
  add(
    "socioeconomic_certifications",
    papers(
      {
        id: "small_biz",
        kind: "certification",
        name: "Small business",
        issuer: "SAM.gov",
      },
      {
        id: "wosb",
        kind: "certification",
        name: "Woman-owned (WOSB)",
        issuer: "U.S. Small Business Administration",
        issuedAt: dateDaysFromNow(-1047),
        // The same date as the Stay Ready page: 48 days from now.
        expiresAt: dateDaysFromNow(48),
      },
    ),
    sam("Woman-Owned Small Business (WOSB)", "Business types: Small Business,", "Active until " + samActiveLabel()),
  );

  // ── What you sell ──
  add(
    "primary_services",
    list(...CORE_SERVICES),
    typed(JOINED_DAYS_AGO - 3),
  );
  add(
    "business_description",
    text(
      `${PERSONA.businessName} is a woman-owned commercial kitchen in ${PERSONA.hqCity}, ${PERSONA.hqState}. We cook and deliver up to 1,100 meals a day for schools, hospitals and military dining facilities in ${PERSONA.serviceStates.join(", ")}. We have been in business since 2021.`,
      true,
    ),
    typed(JOINED_DAYS_AGO - 3),
  );
  add(
    "primary_industry",
    codes(
      { system: "NAICS", code: "", label: "Food Service & Catering" },
      NAICS(PERSONA.primaryNaics, PERSONA.primaryNaicsLabel, true),
      ...PERSONA.secondaryNaics.map((n) => NAICS(n.code, n.label)),
    ),
    typed(JOINED_DAYS_AGO - 3),
  );
  add(
    "commodity_codes",
    codes({ system: "NIGP", code: "96190", label: "Food service and catering" }),
    typed(JOINED_DAYS_AGO - 10),
  );
  add("differentiators", list(...PERSONA.differentiators), typed(JOINED_DAYS_AGO - 7));
  add("service_delivery_mode", choice("onsite", "On site"), typed(JOINED_DAYS_AGO - 7));
  add("current_customer_types", pick("current_customer_types", "businesses", "government"), typed(JOINED_DAYS_AGO - 7));
  add("sectors_served", pick("sectors_served", "commercial", "government", "nonprofit"), typed(JOINED_DAYS_AGO - 7));
  add(
    "service_to_sell_to_government",
    choice(CORE_SERVICES[0]),
    typed(JOINED_DAYS_AGO - 3),
  );
  add(
    "doc_llc_paperwork",
    { kind: "file", file: file("doc-llc", "haddad-catering-articles-of-organization.pdf", 184_320, INTAKE_SENT_DAYS_AGO + 3, 4) },
    { originKey: "member.typed", daysAgo: INTAKE_SENT_DAYS_AGO + 3 },
  );
  add(
    "doc_capability_statement",
    {
      kind: "file",
      file: {
        id: "doc-capability",
        name: CAPABILITY_STATEMENT_NAME,
        mime: PDF,
        sizeBytes: CAPABILITY_STATEMENT_BYTES,
        uploadedAt: isoDaysFromNow(-(POSITIONING_CALL_DAYS_AGO + 2)),
        pages: 1,
      },
    },
    typed(POSITIONING_CALL_DAYS_AGO + 2),
  );

  // ── What you can take on ──
  add(
    "geographic_coverage",
    {
      kind: "area",
      area: { states: [...PERSONA.serviceStates], counties: [], cities: [], rung: "state_plus_neighbors" },
    },
    typed(JOINED_DAYS_AGO - 3),
  );
  add("concurrent_contract_capacity", count(Math.max(1, Math.floor(PERSONA.employeesW2 / 2)), "jobs at once"), typed(JOINED_DAYS_AGO - 8));
  add("facilities", list(`Commercial kitchen at ${PERSONA.physicalAddress}`), typed(JOINED_DAYS_AGO - 8));
  add("payment_terms_tolerance", count(30, "days"), typed(JOINED_DAYS_AGO - 8));
  add("working_capital", money(75_000), typed(JOINED_DAYS_AGO - 8));
  add("bonding_capacity", text(`Largest bond carried: $${PERSONA.largestBond.toLocaleString("en-US")}`), typed(JOINED_DAYS_AGO - 8));
  add("proposal_support", choice("me", "I write them"), typed(JOINED_DAYS_AGO - 8));
  add("pursuing_as", choice("both", "Both"), typed(JOINED_DAYS_AGO - 3));
  add("constraints", pick("constraints", "crew"), typed(JOINED_DAYS_AGO - 8));

  // ── Work you have done ──
  add("past_performance", entries(...PAST_PERFORMANCE.map(jobFor)), typed(JOINED_DAYS_AGO - 3));
  add(
    "public_sector_experience",
    pick("public_sector_experience", "school", "federal", "hospital", "prime"),
    typed(JOINED_DAYS_AGO - 9),
  );
  add("years_of_experience", choice("5to10", "5 to 10 years"), typed(JOINED_DAYS_AGO - 3));
  add("has_active_commercial_contracts", choice("yes", "Yes"), typed(JOINED_DAYS_AGO - 9));
  add(
    "professional_references",
    list(
      ...PAST_PERFORMANCE.filter((p) => p.referenceName).map(
        (p) => `${p.referenceName}, ${p.referenceTitle}`,
      ),
    ),
    typed(JOINED_DAYS_AGO - 9),
  );
  add(
    "ninety_day_goal",
    text(
      "Send bids on Camp Mackall field meals and the Fayetteville cafe, and team up with Carolina Dining Group on the Fort Bragg dining recompete.",
      true,
    ),
    typed(JOINED_DAYS_AGO - 3),
  );
  add(
    "best_first_opportunity",
    text(
      "A school nutrition contract with Cumberland County Schools. Janet Reyes already knows our work.",
      true,
    ),
    typed(JOINED_DAYS_AGO - 9),
  );

  // ── Your papers ──
  add(
    "insurance_coverage",
    papers(
      {
        id: "ins-gl",
        kind: "insurance",
        name: "General liability insurance",
        issuedAt: dateDaysFromNow(-245),
        // The same date as the Stay Ready page: 120 days from now.
        expiresAt: dateDaysFromNow(120),
        limits: [{ label: "Per occurrence", amountUSD: 1_000_000 }],
      },
      {
        id: "ins-auto",
        kind: "insurance",
        name: "Commercial vehicle insurance, both vans",
        issuedAt: dateDaysFromNow(-155),
        expiresAt: dateDaysFromNow(210),
      },
    ),
    typed(JOINED_DAYS_AGO - 12),
  );
  add(
    "health_permits",
    papers({
      id: "permit-county",
      kind: "permit",
      name: "Food service establishment permit",
      issuer: "Cumberland County Department of Public Health",
      jurisdiction: "Cumberland County, NC",
      issuedAt: dateDaysFromNow(-344),
      // The same date as the Stay Ready page: 21 days from now, so the rail shows a renewal.
      expiresAt: dateDaysFromNow(21),
    }),
    typed(JOINED_DAYS_AGO - 12),
  );
  add(
    "food_manager_certifications",
    papers({
      id: "fm-1",
      kind: "certification",
      name: `Food protection manager certificate, ${PERSONA.ownerName}`,
      issuer: "ServSafe",
      issuedAt: dateDaysFromNow(-500),
      expiresAt: dateDaysFromNow(595),
    }),
    typed(JOINED_DAYS_AGO - 12),
  );
  add("food_handler_cards", papers(...foodHandlerCards()), typed(JOINED_DAYS_AGO - 12));
  add(
    "doc_haccp_plan",
    { kind: "file", file: file("doc-haccp", "haddad-catering-haccp-food-safety-plan.pdf", 412_672, JOINED_DAYS_AGO - 14, 12) },
    typed(JOINED_DAYS_AGO - 14),
  );
  add("health_inspection_score", text("Grade A, score 97"), typed(JOINED_DAYS_AGO - 14));
  add(
    "doc_w9",
    { kind: "file", file: file("doc-w9", "haddad-catering-w9.pdf", 96_256, JOINED_DAYS_AGO - 14, 2) },
    typed(JOINED_DAYS_AGO - 14),
  );

  return out;
}

// ── suggestions waiting for a yes or a no ──────────────────────────────────

/** One suggestion that waits for a yes or a no. */
export function proposal(
  id: string,
  fieldKey: string,
  mb: MbValue,
  originKey: OriginKey,
  heard: string | null,
  provenance: ProvenancePayload,
  daysAgo: number,
): DemoProposal {
  return {
    id,
    fieldKey,
    value: fromMb(fieldKey, mb)[fieldKey],
    originKey,
    origin: ORIGIN_PROSE[originKey],
    heard,
    provenance,
    proposedAt: isoDaysFromNow(-daysAgo),
    status: "open",
  };
}

function catererProposals(): DemoProposal[] {
  const make = proposal;
  return [
    make(
      "prop-equipment",
      "equipment",
      list("Two refrigerated delivery vans"),
      "capability_statement",
      null,
      capabilitySource(
        "Two refrigerated vans for same-day delivery inside 60 miles",
        "Core capabilities:",
      ),
      POSITIONING_CALL_DAYS_AGO + 1,
    ),
    make(
      "prop-daily-output",
      "max_daily_output",
      count(1100, "meals a day"),
      "capability_statement",
      null,
      capabilitySource("Cooks and delivers 1,100 meals a day from one kitchen", "Core capabilities:"),
      POSITIONING_CALL_DAYS_AGO + 1,
    ),
    make(
      "prop-keywords",
      "search_keywords",
      list("dining facility", "school meals", "therapeutic diets", "halal catering"),
      "hunter.learned",
      "I look for dining facility work, school meal programs and anything with therapeutic diets.",
      hunterChatSource(
        "I look for dining facility work, school meal programs and anything with therapeutic diets.",
        "Got it. Dining facility, school meals and therapeutic diets.",
      ),
      9,
    ),
  ];
}

// ── the digital compliance audit she submitted ─────────────────────────────

function buildDigital(): DemoDigitalAudit {
  return {
    inputs: {
      businessLegalName: PERSONA.businessName,
      email: PERSONA.email,
      website: PERSONA.website,
      domain: PERSONA.businessShortName,
      phone: PERSONA.phone,
      contactUsUrl: `${PERSONA.website}/contact`,
      privacyUrl: `${PERSONA.website}/privacy`,
    },
    checkedAt: isoDaysFromNow(-62),
    preCheck: [
      { itemKey: "websiteCage", itemTitle: "Website with CAGE code + required footer info", status: "pass", evidence: `CAGE code ${PERSONA.cage} found in the page footer.` },
      { itemKey: "domainMatch", itemTitle: "Domain name matches at least 60% of legal name or DBA", status: "pass", evidence: `${PERSONA.website} matches "${PERSONA.businessShortName}".` },
      { itemKey: "professionalEmail", itemTitle: "Professional email address", status: "pass", evidence: `${PERSONA.email} is on your own domain.` },
      { itemKey: "businessPhone", itemTitle: "Business phone number", status: "pass", evidence: `${PERSONA.phone} is a valid US number.` },
      { itemKey: "a2p", itemTitle: "A2P compliance", status: "skipped", evidence: "No A2P brand ID was provided." },
      { itemKey: "contactConsent", itemTitle: "Contact us page with consent checkboxes", status: "needs_review", evidence: "The contact page loads. We did not find consent checkboxes." },
      { itemKey: "govLandingCaps", itemTitle: "Government contractor landing page with CAPS statement", status: "skipped", evidence: "No landing page address was provided." },
      { itemKey: "letterhead", itemTitle: "Company letterhead", status: "skipped", evidence: "No letterhead link was provided." },
      { itemKey: "privacyPolicy", itemTitle: "Privacy policy", status: "pass", evidence: "The privacy page loads and names your business." },
    ],
  };
}

// ── the whole starting state ───────────────────────────────────────────────

function naicsBySource(): NaicsBySource {
  const at = isoDaysFromNow(-JOINED_DAYS_AGO + 3);
  const samAt = samCheckedOn();
  return {
    sam: { codes: [PERSONA.primaryNaics, ...PERSONA.secondaryNaics.slice(0, 2).map((n) => n.code)], primary: PERSONA.primaryNaics, updatedAt: samAt },
    capability_statement: {
      codes: [PERSONA.primaryNaics, PERSONA.secondaryNaics[0]!.code],
      primary: PERSONA.primaryNaics,
      updatedAt: isoDaysFromNow(-(POSITIONING_CALL_DAYS_AGO + 2)),
    },
    my_business: {
      codes: [PERSONA.primaryNaics, ...PERSONA.secondaryNaics.map((n) => n.code)],
      updatedAt: at,
    },
  };
}

/** The logo the record starts with: a drawn mark with the business's initials. */
export function startingLogo(): string {
  return byMember({ caterer: MEDIA_LOGO_URL, pack: pack.LOGO_URL });
}

export function buildSeed(): DemoBusinessState {
  const naics = naicsBySource();
  const allCodes = [
    PERSONA.primaryNaics,
    ...PERSONA.secondaryNaics.map((n) => n.code),
  ];
  return {
    rows: byMember({ caterer: catererRows, pack: pack.businessRows })(),
    proposals: byMember({ caterer: catererProposals, pack: pack.businessProposals })(),
    intakeSentAt: isoDaysFromNow(-INTAKE_SENT_DAYS_AGO),
    intakeSentMentor: MENTOR.name,
    media: { photoUrl: null, logoUrl: startingLogo() },
    naicsCodes: allCodes,
    naicsBySource: naics,
    onboarding: {
      cohort: PERSONA.plan,
      callAt: isoDaysFromNow(-POSITIONING_CALL_DAYS_AGO),
      mentorName: MENTOR.name,
      llcUploadedAt: isoDaysFromNow(-(INTAKE_SENT_DAYS_AGO + 3)),
      profileDueAt: null,
      callHasHappened: true,
      fullRecordDueAt: null,
    },
    llcVerification: {
      status: "pass",
      message: null,
      requiresConfirmation: false,
      legalName: PERSONA.businessName,
    },
    digital: buildDigital(),
    documents: [],
  };
}


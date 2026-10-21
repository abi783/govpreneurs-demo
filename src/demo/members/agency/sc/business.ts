// THE AGENCY: Dana Okafor's starting My Business record (read through
// src/demo/sc/business/seed.ts, which picks the member on stage).
//
// Every fact comes from the story (members/agency/persona.ts, workspace.ts) or the
// approved pack (demo-storyboard/marketing-agency-pack.md, section 9). The record is
// 44 of 51, on purpose, with the pack's real gaps:
//   - no GSA schedule: she told Sarah so on the positioning call ("Anything else");
//   - no performance rating (CPARS) for the NC Guard job: the job says so;
//   - no project manager and alternate on file: "Who does what on your team" is open;
//   - no line of credit to front ad buys while the government takes about 30 days
//     to pay: "Cash flow" limits her, and Hunter's suggestion waits for a yes;
//   - the woman-owned certification (WOSB) renews in 41 days, the same date as
//     the Stay Ready page.
// Also open: her tax number, owner citizenship, five years of receipts, licenses,
// state programs (North Carolina ended HUB certification in 2026) and the words
// buyers search for ("Tell Hunter everything" fills the last one).
// Five suggestions wait for a yes or a no: equipment and PSC codes read off her
// capability statement, the credit line from her chat with Hunter, clearances from
// her call with Sarah, and citizenship from "Tell Hunter everything". SAM.gov's size
// answer waits for a check. Every kind of source shows on Basic Info (sources.test.ts).
//
// Only functions read the helpers from seed.ts, because seed.ts imports this file.

import { PAST_PERFORMANCE, PERSONA } from "../../../story/persona";
import { dateDaysFromNow, isoDaysFromNow } from "../../../story/clock";
import { POSITIONING_CALL_DAYS_AGO } from "../../../sc/timeline";
import { toIsoDay } from "../../../profile/dates";
import { FRESHNESS_ON_FILE } from "@sc/lib/businessProfile/freshness";
import { choice, codes, count, entries, list, money, papers, text, type JobEntry, type MbValue } from "@sc/lib/businessProfile/mbValue";
import type { DemoFieldRow, DemoProposal } from "../../../sc/business/types";
import {
  CAPABILITY_STATEMENT_BYTES,
  CAPABILITY_STATEMENT_NAME,
  INTAKE_SENT_DAYS_AGO,
  JOINED_DAYS_AGO,
  NAICS,
  PDF,
  addressParts,
  capabilitySource,
  file,
  hunterChatSource,
  jobFor,
  llcSource,
  mailingParts,
  mentorCallProposal,
  mentorCallSource,
  pick,
  proposal,
  rowsFor,
  samActiveLabel,
  samCheckedOn,
  samSource,
  toldHunterSource,
  type RowOptions,
} from "../../../sc/business/seed";

/** The sample sentence "Say it out loud" types into the box (D56: no microphone). */
export const TELL_SAMPLE =
  "We make short videos and run paid social for public agencies from our studio on Person Street. We have a two-person video crew. We want our second federal prime in the next 90 days. We can wait 30 days to be paid.";

/** The starting logo: a drawn mark with her initials, so no file can go missing. */
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
<rect width="160" height="160" rx="30" fill="#24324f"/>
<rect x="34" y="34" width="92" height="92" rx="16" fill="none" stroke="#f2b84b" stroke-width="3" opacity="0.7"/>
<text x="80" y="98" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="54" font-weight="700" fill="#f7efe0">LR</text>
</svg>`;
export const LOGO_URL = `data:image/svg+xml;utf8,${encodeURIComponent(LOGO_SVG)}`;

/** Her top three services. The capability statement names the same ones. */
const CORE_SERVICES = [
  "Short captioned videos, shot and edited in-house",
  "Paid social, search and display ads",
  "Print buying, landing pages and lead routing",
] as const;

/** The pack's customer types, in the record's words. */
function agencyJob(pp: (typeof PAST_PERFORMANCE)[number]): JobEntry {
  const base = jobFor(pp);
  return {
    ...base,
    customerType: pp.customerType === "local" ? "local" : pp.customerType === "commercial" ? "private" : "federal",
    place: pp.id === "pp-ncng-recruiting" ? "Statewide, North Carolina" : `${PERSONA.hqCity}, ${PERSONA.hqState}`,
  };
}

export function businessRows(): DemoFieldRow[] {
  const out: DemoFieldRow[] = [];
  const add = (fieldKey: string, mb: MbValue, opts?: RowOptions) => out.push(...rowsFor(fieldKey, mb, opts));
  const contact: RowOptions = { originKey: "ghl.contact", freshnessLabel: FRESHNESS_ON_FILE, daysAgo: JOINED_DAYS_AGO };
  const sam = (span: string, before: string, after?: string): RowOptions => ({
    originKey: "sam.gov",
    state: "verified",
    daysAgo: 0,
    verifiedAt: samCheckedOn(),
    provenance: samSource(span, before, after),
  });
  const typed = (daysAgo: number): RowOptions => ({ originKey: "member.typed", daysAgo });
  const llc: RowOptions = { originKey: "member.typed", daysAgo: JOINED_DAYS_AGO - 4, provenance: llcSource() };

  // ── Your legal details ──
  add("primary_contact_name", text(PERSONA.ownerName), contact);
  add("email", text(PERSONA.email), contact);
  add("phone", text(PERSONA.phone), typed(JOINED_DAYS_AGO - 2));
  add("home_address", { kind: "address", address: mailingParts() }, typed(JOINED_DAYS_AGO - 2));
  add("tshirt_size", choice("m", "M"), { originKey: "intake.migration", daysAgo: JOINED_DAYS_AGO - 1 });
  add("primary_contact_title", text(PERSONA.ownerTitle), typed(JOINED_DAYS_AGO - 2));
  add("legal_company_name", text(PERSONA.businessName), sam(PERSONA.businessName, "Legal business name:", `UEI: ${PERSONA.uei}`));
  add("company_email", text(PERSONA.email), typed(JOINED_DAYS_AGO - 5));
  add("company_phone", text(PERSONA.phone), typed(JOINED_DAYS_AGO - 5));
  add("website", text(PERSONA.website), typed(JOINED_DAYS_AGO - 5));
  add("dba_name", text(PERSONA.businessShortName), typed(JOINED_DAYS_AGO - 5));
  add("entity_type", choice("llc", "A company (LLC)"), llc);
  add("year_started_operating", { kind: "date", iso: toIsoDay(PERSONA.formedOn) }, llc);
  add(
    "company_address",
    { kind: "address", address: addressParts(PERSONA.physicalAddress) },
    sam("Physical address", PERSONA.physicalAddress, "is the address on your registration."),
  );
  add("uei", text(PERSONA.uei), sam(PERSONA.uei, "Unique Entity ID (UEI):"));
  add("cage_code", text(PERSONA.cage), sam(PERSONA.cage, "CAGE code:"));
  add("sam_registration_status", choice("active", "Registered and active"), sam(`Active until ${samActiveLabel()}`, "Registration status:"));
  add(
    "sled_registrations",
    papers(
      {
        id: "sled-nc-evp",
        kind: "registration",
        name: "North Carolina eVP vendor registration",
        issuer: "NC Department of Administration",
        jurisdiction: "North Carolina",
      },
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
  // SAM.gov's answer, waiting for a check (the one "Check this" row).
  add("size_status", text(`Yes. A small business under the size standard for NAICS ${PERSONA.primaryNaics}.`), {
    ...sam("Small Business", "Business types:", "Woman-Owned Small Business (WOSB)"),
    state: "needs_review",
  });
  add(
    "socioeconomic_certifications",
    papers(
      { id: "small_biz", kind: "certification", name: "Small business", issuer: "SAM.gov" },
      {
        id: "wosb",
        kind: "certification",
        name: "Woman-owned (WOSB)",
        issuer: "U.S. Small Business Administration",
        issuedAt: dateDaysFromNow(-1054),
        // The same date as the Stay Ready page: 41 days from now (the pack's gap 5).
        expiresAt: dateDaysFromNow(41),
      },
    ),
    sam("Woman-Owned Small Business (WOSB)", "Business types: Small Business,", `Active until ${samActiveLabel()}`),
  );

  // ── What you sell ──
  add("primary_services", list(...CORE_SERVICES), {
    originKey: "member.confirmed",
    daysAgo: POSITIONING_CALL_DAYS_AGO + 1,
    provenance: capabilitySource(PERSONA.differentiators[1]!, "Core capabilities:", `· ${PERSONA.differentiators[2]}`),
  });
  add(
    "business_description",
    text(
      `${PERSONA.businessName} is a woman-owned ad agency in ${PERSONA.hqCity}, ${PERSONA.hqState}, 12 miles from Fort Bragg. We make short captioned videos, run paid social, search and display ads, buy print, and build landing pages and lead forms for public agencies and businesses in ${PERSONA.serviceStates.join(", ")}. We have been in business since ${PERSONA.formedOn.slice(-4)}.`,
      true,
    ),
    typed(JOINED_DAYS_AGO - 3),
  );
  add(
    "primary_industry",
    codes(
      { system: "NAICS", code: "", label: "Marketing, Advertising & Media Production" },
      NAICS(PERSONA.primaryNaics, PERSONA.primaryNaicsLabel, true),
      ...PERSONA.secondaryNaics.map((n) => NAICS(n.code, n.label)),
    ),
    typed(JOINED_DAYS_AGO - 3),
  );
  add("commodity_codes", codes({ system: "NIGP", code: "91503", label: "Advertising and public relations services" }), typed(JOINED_DAYS_AGO - 10));
  add("differentiators", list(...PERSONA.differentiators), typed(JOINED_DAYS_AGO - 7));
  add("service_delivery_mode", choice("both", "Both"), typed(JOINED_DAYS_AGO - 7));
  add("current_customer_types", pick("current_customer_types", "businesses", "government"), typed(JOINED_DAYS_AGO - 7));
  add("sectors_served", pick("sectors_served", "commercial", "government"), typed(JOINED_DAYS_AGO - 7));
  add("service_to_sell_to_government", choice(CORE_SERVICES[0]), {
    originKey: "member.confirmed",
    daysAgo: 40,
    provenance: hunterChatSource(
      "The thing I most want to sell the government is short captioned video. We shoot and edit it ourselves.",
      "Got it. Short captioned videos, shot and edited in-house.",
      41,
    ),
  });
  add(
    "doc_llc_paperwork",
    { kind: "file", file: file("doc-llc", "lantern-row-creative-articles-of-organization.pdf", 176_128, INTAKE_SENT_DAYS_AGO + 3, 4) },
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
  add(
    "doc_marketing",
    { kind: "file", file: file("doc-work-samples", "lantern-row-creative-work-samples.pdf", 2_412_544, POSITIONING_CALL_DAYS_AGO + 2, 14) },
    typed(POSITIONING_CALL_DAYS_AGO + 2),
  );

  // ── What you can take on ──
  add(
    "geographic_coverage",
    { kind: "area", area: { states: [...PERSONA.serviceStates], counties: [], cities: [], rung: "state_plus_neighbors" } },
    typed(JOINED_DAYS_AGO - 3),
  );
  add("concurrent_contract_capacity", count(Math.max(1, Math.floor(PERSONA.employeesW2 / 2)), "jobs at once"), {
    originKey: "member.confirmed",
    daysAgo: POSITIONING_CALL_DAYS_AGO - 1,
    provenance: mentorCallSource(
      { text: "How many jobs can you run at the same time?", at: 21 * 60 + 50 },
      { text: "Four at once. Past that, our two-person video crew is the limit.", at: 21 * 60 + 56 },
    ),
  });
  add("payment_terms_tolerance", count(30, "days"), typed(JOINED_DAYS_AGO - 8));
  add("working_capital", money(60_000), typed(JOINED_DAYS_AGO - 8));
  add("bonding_capacity", text("None so far. Our work has never needed a bond."), typed(JOINED_DAYS_AGO - 8));
  add("proposal_support", choice("me", "I write them"), typed(JOINED_DAYS_AGO - 8));
  add("pursuing_as", choice("both", "Both"), typed(JOINED_DAYS_AGO - 3));
  // A two-person crew, and no credit line to front an ad buy until the government pays.
  add("constraints", pick("constraints", "cashflow", "crew"), typed(JOINED_DAYS_AGO - 8));

  // ── Work you have done ──
  add("past_performance", entries(...PAST_PERFORMANCE.map(agencyJob)), typed(JOINED_DAYS_AGO - 3));
  add("public_sector_experience", pick("public_sector_experience", "city", "federal"), typed(JOINED_DAYS_AGO - 9));
  add("years_of_experience", choice("5to10", "5 to 10 years"), typed(JOINED_DAYS_AGO - 3));
  add("has_active_commercial_contracts", choice("yes", "Yes"), typed(JOINED_DAYS_AGO - 9));
  add(
    "professional_references",
    list(...PAST_PERFORMANCE.filter((p) => p.referenceName).map((p) => `${p.referenceName}, ${p.referenceTitle}`)),
    typed(JOINED_DAYS_AGO - 9),
  );
  const goal = "Bid on Army family-program campaigns at Fort Bragg, and keep the NC Guard as a customer.";
  add("ninety_day_goal", text(goal, true), {
    originKey: "member.confirmed",
    daysAgo: POSITIONING_CALL_DAYS_AGO - 1,
    provenance: mentorCallSource(
      { text: "What do you want to win in the next 90 days?", at: 33 * 60 + 12 },
      { text: goal, at: 33 * 60 + 20 },
    ),
  });
  add(
    "best_first_opportunity",
    text("An Army Community Service campaign at Fort Bragg. We already reach military families.", true),
    typed(JOINED_DAYS_AGO - 9),
  );
  add(
    "anything_else",
    text("We do not have a GSA schedule yet. Some federal ad buys are open only to schedule holders.", true),
    typed(POSITIONING_CALL_DAYS_AGO),
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
        id: "ins-pl",
        kind: "insurance",
        name: "Professional liability (errors and omissions) insurance",
        issuedAt: dateDaysFromNow(-155),
        expiresAt: dateDaysFromNow(210),
        limits: [{ label: "Per claim", amountUSD: 1_000_000 }],
      },
    ),
    typed(JOINED_DAYS_AGO - 12),
  );
  // State and county programs stay open: North Carolina ended its HUB certification
  // in 2026, and she holds no other state certification.
  add(
    "doc_w9",
    { kind: "file", file: file("doc-w9", "lantern-row-creative-w9.pdf", 94_208, JOINED_DAYS_AGO - 14, 2) },
    { originKey: "intake.migration", daysAgo: JOINED_DAYS_AGO - 14 },
  );

  return out;
}

export function businessProposals(): DemoProposal[] {
  return [
    proposal(
      "prop-equipment",
      "equipment",
      list("Two cinema cameras, a drone and location lighting"),
      "capability_statement",
      null,
      capabilitySource("Two cinema cameras, a drone and location lighting", "Studio and edit suite on Person Street."),
      POSITIONING_CALL_DAYS_AGO + 1,
    ),
    proposal(
      "prop-psc",
      "psc_codes",
      codes(
        { system: "PSC", code: "R701", label: "Support- Management: Advertising" },
        { system: "PSC", code: "T006", label: "Photo/Map/Print/Publication- Film/Video Tape Production" },
      ),
      "capability_statement",
      null,
      capabilitySource("PSC R701 · T006", "Company data:"),
      POSITIONING_CALL_DAYS_AGO + 1,
    ),
    proposal(
      "prop-credit-line",
      "line_of_credit",
      choice("no", "I do not have one"),
      "hunter.learned",
      "We don't have a credit line, so a big ad buy comes out of our own cash until the government pays.",
      hunterChatSource(
        "We don't have a credit line, so a big ad buy comes out of our own cash until the government pays.",
        "Got it. No line of credit, so you front ad buys from your own cash.",
      ),
      9,
    ),
    mentorCallProposal(
      "prop-clearances",
      "security_clearances",
      list("None"),
      { text: "Does anyone on your team hold a security clearance?", at: 18 * 60 + 30 },
      { text: "No. Nobody on the team holds one.", at: 18 * 60 + 36 },
    ),
    proposal(
      "prop-citizenship",
      "owner_citizenship",
      choice("all", "All owners are US citizens"),
      "member.told",
      "I own all of the business, and I am a US citizen.",
      toldHunterSource("I own all of the business, and I am a US citizen.", 3),
      3,
    ),
  ];
}

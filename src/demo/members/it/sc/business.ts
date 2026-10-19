// THE IT SERVICES FIRM: Hector Salinas's starting My Business record (read
// through src/demo/sc/business/seed.ts, which picks the member on stage).
//
// Every fact comes from the story (members/it/persona.ts, workspace.ts) or the
// approved pack (demo-storyboard/it-services-pack.md, section 9). The record is
// not complete, on purpose, with the pack's real gaps:
//   - no seat on a closed IT contract (ITES-3S, 8(a) STARS III), where much of
//     Fort Bragg's IT work is ordered, and a CMMC Level 2 self-assessment at 92
//     of 110: he told Sarah both on the positioning call ("Anything else");
//   - no credit line: six new hires mean about $95K of payroll before the first
//     payment. "Cash flow" limits him, and Hunter's suggestion waits for a yes;
//   - no site lead and alternate on file: "Who does what on your team" is open,
//     and it is Ava's first question on the hero bid;
//   - the 8(a) term ends in March 2030 (the certificate's end date). The yearly
//     8(a) review is on the Stay Ready page.
// Also open: his tax number, owner citizenship, five years of receipts, licenses,
// state programs (North Carolina ended HUB certification in 2026) and the words
// buyers search for ("Tell Hunter everything" fills the last one).
// Three suggestions wait for a yes or a no: equipment and PSC codes read off his
// capability statement, and the credit line from his chat with Hunter.
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
  pick,
  proposal,
  rowsFor,
  samActiveLabel,
  samCheckedOn,
  samSource,
  type RowOptions,
} from "../../../sc/business/seed";

/** The sample sentence "Say it out loud" types into the box (D56: no microphone). */
export const TELL_SAMPLE =
  "We run the help desk, desktop support and video conferencing for Army and Air Force offices from our office on Raeford Road. We have eleven techs and two network admins. We want our first Army prime in the next 90 days. We can wait 30 days to be paid.";

/** The starting logo: a drawn mark with his initials, so no file can go missing. */
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
<rect width="160" height="160" rx="30" fill="#1f3b3a"/>
<rect x="30" y="40" width="100" height="68" rx="8" fill="none" stroke="#8fd3c1" stroke-width="3" opacity="0.7"/>
<path d="M60 124 H100" stroke="#8fd3c1" stroke-width="3" opacity="0.7"/>
<text x="80" y="90" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="42" font-weight="700" fill="#eef4f1">GT</text>
</svg>`;
export const LOGO_URL = `data:image/svg+xml;utf8,${encodeURIComponent(LOGO_SVG)}`;

/** His top three services. The capability statement names the same ones. */
const CORE_SERVICES = [
  "Help desk, Tier 1 and Tier 2, by phone and walk-up",
  "Desktop support, imaging and video-conference rooms",
  "Microsoft 365, Intune and SharePoint admin, and network support",
] as const;

/** The pack's customer types and places, in the record's words. */
function itJob(pp: (typeof PAST_PERFORMANCE)[number]): JobEntry {
  const base = jobFor(pp);
  const place =
    pp.id === "pp-sjafb-desktop-support"
      ? "Seymour Johnson AFB, Goldsboro, NC"
      : pp.id === "pp-bragg-helpdesk-seats"
        ? "Fort Bragg, NC"
        : `${PERSONA.hqCity}, ${PERSONA.hqState}`;
  return { ...base, customerType: pp.customerType === "commercial" ? "private" : base.customerType, place };
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
  add("tshirt_size", choice("l", "L"), typed(JOINED_DAYS_AGO - 2));
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
        id: "sled-schools",
        kind: "registration",
        name: "Cumberland County Schools vendor registration",
        issuer: "Cumberland County Schools",
        jurisdiction: "Cumberland County, NC",
      },
    ),
    typed(JOINED_DAYS_AGO - 20),
  );
  add("owners", list(`${PERSONA.ownerName}, 100%`), typed(JOINED_DAYS_AGO - 6));
  add("total_employees", count(PERSONA.employeesW2, "people"), typed(JOINED_DAYS_AGO - 6));
  add("size_status", text(`Yes. A small business under the size standard for NAICS ${PERSONA.primaryNaics}.`), {
    ...sam("Small Business", "Business types:", "8(a) Program Participant"),
  });
  add(
    "socioeconomic_certifications",
    papers(
      { id: "small_biz", kind: "certification", name: "Small business", issuer: "SAM.gov" },
      {
        id: "eight_a",
        kind: "certification",
        name: "8(a) program",
        issuer: "U.S. Small Business Administration",
        issuedAt: "2021-03-15",
        // The nine-year term ends in March 2030 (the pack's gap 5). The yearly review is on Stay Ready.
        expiresAt: "2030-03-15",
      },
      { id: "sdb", kind: "certification", name: "Small disadvantaged business (SDB)", issuer: "SAM.gov" },
    ),
    sam("8(a) Program Participant", "Business types: Small Business,", "Small Disadvantaged Business"),
  );

  // ── What you sell ──
  add("primary_services", list(...CORE_SERVICES), typed(JOINED_DAYS_AGO - 3));
  add(
    "business_description",
    text(
      `${PERSONA.businessName} is an 8(a) IT services firm in ${PERSONA.hqCity}, ${PERSONA.hqState}, 12 miles from Fort Bragg. We run help desks, desktop and video-conference support, Microsoft 365 and SharePoint admin, and network support for Army and Air Force units, schools and clinics. A second crew works on site at Seymour Johnson AFB. We have been in business since ${PERSONA.formedOn.slice(-4)}.`,
      true,
    ),
    typed(JOINED_DAYS_AGO - 3),
  );
  add(
    "primary_industry",
    codes(
      { system: "NAICS", code: "", label: "IT Services & Support" },
      NAICS(PERSONA.primaryNaics, PERSONA.primaryNaicsLabel, true),
      ...PERSONA.secondaryNaics.map((n) => NAICS(n.code, n.label)),
    ),
    typed(JOINED_DAYS_AGO - 3),
  );
  add("commodity_codes", codes({ system: "NIGP", code: "920", label: "Data processing, computer, programming and software services" }), typed(JOINED_DAYS_AGO - 10));
  add("differentiators", list(...PERSONA.differentiators), typed(JOINED_DAYS_AGO - 7));
  add("service_delivery_mode", choice("both", "Both"), typed(JOINED_DAYS_AGO - 7));
  add("current_customer_types", pick("current_customer_types", "businesses", "government"), typed(JOINED_DAYS_AGO - 7));
  add("sectors_served", pick("sectors_served", "commercial", "government"), typed(JOINED_DAYS_AGO - 7));
  add("service_to_sell_to_government", choice(CORE_SERVICES[0]), typed(JOINED_DAYS_AGO - 3));
  add(
    "doc_llc_paperwork",
    { kind: "file", file: file("doc-llc", "gallberry-technology-group-articles-of-organization.pdf", 172_032, INTAKE_SENT_DAYS_AGO + 3, 4) },
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
    { kind: "file", file: file("doc-service-sheets", "gallberry-technology-group-service-sheets.pdf", 1_216_512, POSITIONING_CALL_DAYS_AGO + 2, 4) },
    typed(POSITIONING_CALL_DAYS_AGO + 2),
  );

  // ── What you can take on ──
  add(
    "geographic_coverage",
    { kind: "area", area: { states: [...PERSONA.serviceStates], counties: [], cities: [], rung: "state" } },
    typed(JOINED_DAYS_AGO - 3),
  );
  // Seymour Johnson, the four clinics, and room for two more sites.
  add("concurrent_contract_capacity", count(4, "jobs at once"), typed(JOINED_DAYS_AGO - 8));
  add("payment_terms_tolerance", count(30, "days"), typed(JOINED_DAYS_AGO - 8));
  add("working_capital", money(120_000), typed(JOINED_DAYS_AGO - 8));
  add("bonding_capacity", text("None. Our IT support work has never needed a bond."), typed(JOINED_DAYS_AGO - 8));
  add("proposal_support", choice("me", "I write them"), typed(JOINED_DAYS_AGO - 8));
  add("pursuing_as", choice("both", "Both"), typed(JOINED_DAYS_AGO - 3));
  // Six new hires on a new site, and no credit line to carry their pay (about $95K) until the first payment.
  add("constraints", pick("constraints", "cashflow", "crew"), typed(JOINED_DAYS_AGO - 8));

  // ── Work you have done ──
  add("past_performance", entries(...PAST_PERFORMANCE.map(itJob)), typed(JOINED_DAYS_AGO - 3));
  add("public_sector_experience", pick("public_sector_experience", "school", "federal", "prime"), typed(JOINED_DAYS_AGO - 9));
  add("years_of_experience", choice("5to10", "5 to 10 years"), typed(JOINED_DAYS_AGO - 3));
  add("has_active_commercial_contracts", choice("yes", "Yes"), typed(JOINED_DAYS_AGO - 9));
  add(
    "professional_references",
    list(...PAST_PERFORMANCE.filter((p) => p.referenceName).map((p) => `${p.referenceName}, ${p.referenceTitle}`)),
    typed(JOINED_DAYS_AGO - 9),
  );
  add(
    "ninety_day_goal",
    text("Win the Army Reserve help desk at Fort Bragg as prime, and keep Seymour Johnson with the follow-on.", true),
    typed(JOINED_DAYS_AGO - 3),
  );
  add(
    "best_first_opportunity",
    text("An 8(a) help desk at Fort Bragg with six to ten seats. Our techs already work Army tickets.", true),
    typed(JOINED_DAYS_AGO - 9),
  );
  add(
    "anything_else",
    text(
      "We are not on ITES-3S or 8(a) STARS III, and both are closed. Much of the Army's IT work at Fort Bragg is ordered through them. Our CMMC Level 2 self-assessment scores 92 of 110, with 9 items open.",
      true,
    ),
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
        id: "ins-tech-eo",
        kind: "insurance",
        name: "Technology errors and omissions and cyber insurance",
        issuedAt: dateDaysFromNow(-155),
        // The same date as the Stay Ready page: 210 days from now.
        expiresAt: dateDaysFromNow(210),
        limits: [{ label: "Per claim", amountUSD: 2_000_000 }],
      },
    ),
    typed(JOINED_DAYS_AGO - 12),
  );
  // State and county programs stay open: North Carolina ended its HUB certification
  // in 2026, and he holds no other state certification.
  add(
    "doc_w9",
    { kind: "file", file: file("doc-w9", "gallberry-technology-group-w9.pdf", 94_208, JOINED_DAYS_AGO - 14, 2) },
    typed(JOINED_DAYS_AGO - 14),
  );

  return out;
}

export function businessProposals(): DemoProposal[] {
  return [
    proposal(
      "prop-equipment",
      "equipment",
      list("Four imaging stations, 40 loaner laptops and cable testers"),
      "capability_statement",
      null,
      capabilitySource("Four imaging stations, 40 loaner laptops and cable testers", "Office and repair bench on Raeford Rd."),
      POSITIONING_CALL_DAYS_AGO + 1,
    ),
    proposal(
      "prop-psc",
      "psc_codes",
      codes(
        { system: "PSC", code: "DE01", label: "IT and Telecom - End User: Help Desk; Tier 1-2, Workspace, Print, Output, Productivity Tools (Labor)" },
        { system: "PSC", code: "DG01", label: "IT and Telecom - Network Support Services (Labor)" },
      ),
      "capability_statement",
      null,
      capabilitySource("PSC DE01 · DG01", "Company data:"),
      POSITIONING_CALL_DAYS_AGO + 1,
    ),
    proposal(
      "prop-credit-line",
      "line_of_credit",
      choice("no", "I do not have one"),
      "hunter.learned",
      "We don't have a credit line, so new techs' pay comes out of our own cash until the first payment.",
      hunterChatSource(
        "We don't have a credit line, so new techs' pay comes out of our own cash until the first payment.",
        "Got it. No line of credit, so you carry new hires' pay from your own cash.",
      ),
      9,
    ),
  ];
}

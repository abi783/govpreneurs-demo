// THE JANITORIAL FIRM: Reggie Tyndall's starting My Business record (read through
// src/demo/sc/business/seed.ts, which picks the member on stage).
//
// Every fact comes from the story (members/janitorial/persona.ts, workspace.ts)
// or the approved pack (demo-storyboard/janitorial-pack.md, section 9). The record
// is not complete, on purpose, with the pack's real gaps:
//   - the HUBZone recertification is due in 38 days (yearly); residency is 41%,
//     above the 35% floor, but night crews turn over (the certificate, Stay Ready
//     and the task share the date);
//   - no CPARS for the Seymour Johnson dorm job (too small): the job says so;
//   - no QC manager on file, and the PWS names a PM and a QC manager: "Who does
//     what on your team" is open, and it is Ava's first question on the hero bid;
//   - no sandblaster, and two rigs for a contract that wants backup equipment:
//     the equipment suggestion lists what he owns, nothing more;
//   - no credit line: weekly payroll against about 30 days for the government to
//     pay. "Cash flow" limits him, and Hunter's suggestion waits for a yes.
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
  "We clean offices at night and wash building exteriors with hot water from our yard on Gillespie Street. We have 29 night custodians and two exterior techs. We want our first Army prime in the next 90 days. We can wait 30 days to be paid.";

/** The starting logo: a drawn mark with his firm's initials, so no file can go missing. */
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
<rect width="160" height="160" rx="30" fill="#3a3f47"/>
<circle cx="80" cy="80" r="48" fill="none" stroke="#c9b37e" stroke-width="3" opacity="0.7"/>
<text x="80" y="98" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="50" font-weight="700" fill="#eef0f2">GO</text>
</svg>`;
export const LOGO_URL = `data:image/svg+xml;utf8,${encodeURIComponent(LOGO_SVG)}`;

/** His top three services. The capability statement names the same ones. */
const CORE_SERVICES = [
  "Night custodial for offices, clinics and public buildings",
  "Floor care: strip, wax, burnish and carpet extraction",
  "Hot-water pressure washing with wash-water recovery",
] as const;

/** What he owns: no sandblaster, and only two rigs (the pack's gap 4). The capability statement says the same. */
const EQUIPMENT = "Two hot-water pressure-washing trailers (3,500 psi), a wash-water recovery kit, burnishers and carpet extractors";

const PLACES: Record<string, string> = {
  "pp-sj-dorm-wash": "Seymour Johnson AFB, Goldsboro, NC",
  "pp-hope-mills-custodial": "Hope Mills, NC",
  "pp-two-creeks-stores": "Cumberland and Robeson counties, NC",
};

/** The pack's customer types and places, in the record's words. */
function janitorialJob(pp: (typeof PAST_PERFORMANCE)[number]): JobEntry {
  const base = jobFor(pp);
  return {
    ...base,
    customerType: pp.customerType === "local" ? "local" : pp.customerType === "commercial" ? "private" : "federal",
    place: PLACES[pp.id] ?? `${PERSONA.hqCity}, ${PERSONA.hqState}`,
    ...(pp.id === "pp-sj-dorm-wash"
      ? { outcome: "Too small for a performance rating (CPARS). Ask the COR for a reference letter." }
      : {}),
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
        id: "sled-hope-mills",
        kind: "registration",
        name: "Town of Hope Mills vendor registration",
        issuer: "Town of Hope Mills",
        jurisdiction: "Hope Mills, NC",
      },
    ),
    typed(JOINED_DAYS_AGO - 20),
  );
  add("owners", list(`${PERSONA.ownerName}, 100%`), typed(JOINED_DAYS_AGO - 6));
  add("total_employees", count(PERSONA.employeesW2, "people"), typed(JOINED_DAYS_AGO - 6));
  add("size_status", text(`Yes. A small business under the size standard for NAICS ${PERSONA.primaryNaics}.`), {
    ...sam("Small Business", "Business types:", "HUBZone"),
  });
  add(
    "socioeconomic_certifications",
    papers(
      { id: "small_biz", kind: "certification", name: "Small business", issuer: "SAM.gov" },
      {
        id: "hubzone",
        kind: "certification",
        name: "HUBZone (41% of staff live in a HUBZone)",
        issuer: "U.S. Small Business Administration",
        issuedAt: dateDaysFromNow(-327),
        // Yearly: the same date as the Stay Ready page and the task, 38 days from now (the pack's gap 1).
        expiresAt: dateDaysFromNow(38),
      },
    ),
    sam("HUBZone", "Business types: Small Business,", `Active until ${samActiveLabel()}`),
  );

  // ── What you sell ──
  add("primary_services", list(...CORE_SERVICES), typed(JOINED_DAYS_AGO - 3));
  add(
    "business_description",
    text(
      `${PERSONA.businessName} is a HUBZone janitorial and facilities firm in ${PERSONA.hqCity}, ${PERSONA.hqState}, 12 miles from Fort Bragg. Our night crews clean offices, clinics and public buildings across Cumberland, Hoke and Robeson counties. We do our own floor care and wash building exteriors with hot water, keeping the wash water out of storm drains. Our crews are badged for Fort Bragg and Seymour Johnson. We have been in business since ${PERSONA.formedOn.slice(-4)}.`,
      true,
    ),
    typed(JOINED_DAYS_AGO - 3),
  );
  add(
    "primary_industry",
    codes(
      { system: "NAICS", code: "", label: "Services to Buildings and Dwellings" },
      NAICS(PERSONA.primaryNaics, PERSONA.primaryNaicsLabel, true),
      ...PERSONA.secondaryNaics.map((n) => NAICS(n.code, n.label)),
    ),
    typed(JOINED_DAYS_AGO - 3),
  );
  add("commodity_codes", codes({ system: "NIGP", code: "91039", label: "Janitorial and custodial services" }), typed(JOINED_DAYS_AGO - 10));
  add("differentiators", list(...PERSONA.differentiators), typed(JOINED_DAYS_AGO - 7));
  add("service_delivery_mode", choice("onsite", "On site"), typed(JOINED_DAYS_AGO - 7));
  add("current_customer_types", pick("current_customer_types", "businesses", "gc", "government"), typed(JOINED_DAYS_AGO - 7));
  add("sectors_served", pick("sectors_served", "commercial", "government"), typed(JOINED_DAYS_AGO - 7));
  add("service_to_sell_to_government", choice(CORE_SERVICES[2]), typed(JOINED_DAYS_AGO - 3));
  add(
    "doc_llc_paperwork",
    { kind: "file", file: file("doc-llc", "gray-owl-facility-services-articles-of-organization.pdf", 172_032, INTAKE_SENT_DAYS_AGO + 3, 4) },
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
    { kind: "file", file: file("doc-account-sheets", "gray-owl-facility-services-account-sheets.pdf", 1_236_992, POSITIONING_CALL_DAYS_AGO + 2, 5) },
    typed(POSITIONING_CALL_DAYS_AGO + 2),
  );

  // ── What you can take on ──
  add(
    "geographic_coverage",
    { kind: "area", area: { states: [...PERSONA.serviceStates], counties: [], cities: [], rung: "state" } },
    typed(JOINED_DAYS_AGO - 3),
  );
  // Two supervisors, four floor techs and two exterior techs: about a dozen sites a night.
  add("concurrent_contract_capacity", count(12, "sites at once"), typed(JOINED_DAYS_AGO - 8));
  add("payment_terms_tolerance", count(30, "days"), typed(JOINED_DAYS_AGO - 8));
  add("working_capital", money(90_000), typed(JOINED_DAYS_AGO - 8));
  add("bonding_capacity", text("None. Our cleaning contracts have never needed a bond."), typed(JOINED_DAYS_AGO - 8));
  add("proposal_support", choice("me", "I write them"), typed(JOINED_DAYS_AGO - 8));
  add("pursuing_as", choice("both", "Both"), typed(JOINED_DAYS_AGO - 3));
  // Weekly payroll for 38 people and no credit line, against about 30 days for the government to pay.
  add("constraints", pick("constraints", "cashflow"), typed(JOINED_DAYS_AGO - 8));

  // ── Work you have done ──
  add("past_performance", entries(...PAST_PERFORMANCE.map(janitorialJob)), typed(JOINED_DAYS_AGO - 3));
  add("public_sector_experience", pick("public_sector_experience", "city", "federal", "prime"), typed(JOINED_DAYS_AGO - 9));
  add("years_of_experience", choice("10to20", "10 to 20 years"), typed(JOINED_DAYS_AGO - 3));
  add("has_active_commercial_contracts", choice("yes", "Yes"), typed(JOINED_DAYS_AGO - 9));
  add(
    "professional_references",
    list(...PAST_PERFORMANCE.filter((p) => p.referenceName).map((p) => `${p.referenceName}, ${p.referenceTitle}`)),
    typed(JOINED_DAYS_AGO - 9),
  );
  add(
    "ninety_day_goal",
    text("Win our first Army prime, the Fort Bragg exterior-cleaning contract, and get a reference letter for the Seymour Johnson job.", true),
    typed(JOINED_DAYS_AGO - 3),
  );
  add(
    "best_first_opportunity",
    text("A HUBZone exterior-cleaning job at Fort Bragg. Our crews are already badged, and we are 12 miles away.", true),
    typed(JOINED_DAYS_AGO - 9),
  );
  add(
    "anything_else",
    text("Most custodial work at Fort Bragg goes to AbilityOne nonprofits. What we can win there is exterior and floor work.", true),
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
        id: "ins-auto",
        kind: "insurance",
        name: "Business auto insurance",
        issuedAt: dateDaysFromNow(-155),
        expiresAt: dateDaysFromNow(210),
        limits: [{ label: "Per accident", amountUSD: 1_000_000 }],
      },
    ),
    typed(JOINED_DAYS_AGO - 12),
  );
  // State and county programs stay open: North Carolina ended its HUB certification
  // in 2026, and he holds no other state certification.
  add(
    "doc_w9",
    { kind: "file", file: file("doc-w9", "gray-owl-facility-services-w9.pdf", 94_208, JOINED_DAYS_AGO - 14, 2) },
    typed(JOINED_DAYS_AGO - 14),
  );

  return out;
}

export function businessProposals(): DemoProposal[] {
  return [
    proposal(
      "prop-equipment",
      "equipment",
      list(EQUIPMENT),
      "capability_statement",
      null,
      capabilitySource(EQUIPMENT, "Office and equipment yard on Gillespie St."),
      POSITIONING_CALL_DAYS_AGO + 1,
    ),
    proposal(
      "prop-psc",
      "psc_codes",
      codes(
        { system: "PSC", code: "S201", label: "Housekeeping- Custodial Janitorial" },
        { system: "PSC", code: "S299", label: "Housekeeping- Other" },
      ),
      "capability_statement",
      null,
      capabilitySource("PSC S201 · S299", "Company data:"),
      POSITIONING_CALL_DAYS_AGO + 1,
    ),
    proposal(
      "prop-credit-line",
      "line_of_credit",
      choice("no", "I do not have one"),
      "hunter.learned",
      "We don't have a credit line. Payroll goes out every week, so a new contract runs on our own cash until the government pays.",
      hunterChatSource(
        "We don't have a credit line. Payroll goes out every week, so a new contract runs on our own cash until the government pays.",
        "Got it. No line of credit, so weekly payroll comes from your own cash until the government pays.",
      ),
      9,
    ),
  ];
}

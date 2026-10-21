// THE TRUCKING COMPANY: Tanya Merritt's starting My Business record (read through
// src/demo/sc/business/seed.ts, which picks the member on stage).
//
// Every fact comes from the story (members/trucking/persona.ts, workspace.ts) or
// the approved pack (demo-storyboard/trucking-pack.md, section 9). The record is
// not complete, on purpose, with the pack's real gaps:
//   - not registered in SDDC's Freight Carrier Registration Program, so no DoD
//     freight booked through SDDC: she told Sarah so on the positioning call
//     ("Anything else"). She meets its three-year authority rule;
//   - no performance rating (CPARS) for the Fort Bragg hauling job: the job says so;
//   - no hazmat endorsements and no secure-cargo approval (the twin): "Licenses"
//     names her operating authority and nothing more;
//   - no PM and Alternate on file: "Who does what on your team" is open, and it is
//     Ava's first question on the hero bid;
//   - VetCert eligibility ends in 47 days, the same date as the Stay Ready page.
// Also open: her tax number, owner citizenship, five years of receipts, state
// programs (North Carolina ended HUB certification in 2026) and the words buyers
// search for ("Tell Hunter everything" fills the last one).
// Five suggestions wait for a yes or a no: the fleet and PSC codes read off her
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
  "We run supply routes, truckload freight and container moves for the VA and Fort Bragg from our yard on Gillespie Street. We have twelve drivers and a dispatcher. We want our first VA prime contract in the next 90 days. We can wait 30 days to be paid.";

/** The starting logo: a drawn mark with her initials, so no file can go missing. */
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
<rect width="160" height="160" rx="30" fill="#1f3340"/>
<path d="M28 112 H132" stroke="#e0a03a" stroke-width="3" stroke-dasharray="10 8" opacity="0.8"/>
<text x="80" y="96" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="50" font-weight="700" fill="#f1ede4">RR</text>
</svg>`;
export const LOGO_URL = `data:image/svg+xml;utf8,${encodeURIComponent(LOGO_SVG)}`;

/** Her top three services. The capability statement names the same ones. */
const CORE_SERVICES = [
  "Scheduled box-truck routes with lift gates",
  "Dry-van and refrigerated truckload across NC, SC and VA",
  "On-call trailer, container and generator moves",
] as const;

/** The pack's customer types and places, in the record's words. */
function truckingJob(pp: (typeof PAST_PERFORMANCE)[number]): JobEntry {
  const base = jobFor(pp);
  const place =
    pp.id === "pp-bragg-trailer-hauling"
      ? "Fort Bragg, NC"
      : pp.id === "pp-cypress-bend-reefer"
        ? "North Carolina and South Carolina"
        : `${PERSONA.hqCounty}, ${PERSONA.hqState}`;
  return {
    ...base,
    customerType: pp.customerType === "commercial" ? "private" : pp.customerType === "local" ? "state" : base.customerType,
    place,
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
  add("tshirt_size", choice("l", "L"), { originKey: "intake.migration", daysAgo: JOINED_DAYS_AGO - 1 });
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
    ...sam("Small Business", "Business types:", "Service-Disabled Veteran-Owned Business"),
    state: "needs_review",
  });
  add(
    "socioeconomic_certifications",
    papers(
      { id: "small_biz", kind: "certification", name: "Small business", issuer: "SAM.gov" },
      {
        id: "vetcert-sdvosb",
        kind: "certification",
        name: "Service-disabled veteran-owned (SBA VetCert)",
        issuer: "U.S. Small Business Administration",
        // Every 3 years: certified Dec 2023, eligibility ends 47 days from now, the
        // same date as the Stay Ready page (the pack's gap 5).
        issuedAt: dateDaysFromNow(47 - 1096),
        expiresAt: dateDaysFromNow(47),
      },
    ),
    sam("Service-Disabled Veteran-Owned Business", "Business types: Small Business, Veteran-Owned Business,", `Active until ${samActiveLabel()}`),
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
      `${PERSONA.businessName} is a service-disabled veteran-owned trucking company in ${PERSONA.hqCity}, ${PERSONA.hqState}. We run scheduled box-truck routes, dry-van and refrigerated truckload, and on-call trailer and container moves for federal, state and commercial buyers in ${PERSONA.serviceStates.join(", ")}. Our own drivers drive our own trucks; we don't broker loads. We have been in business since ${PERSONA.formedOn.slice(-4)}.`,
      true,
    ),
    typed(JOINED_DAYS_AGO - 3),
  );
  add(
    "primary_industry",
    codes(
      { system: "NAICS", code: "", label: "Truck Transportation" },
      NAICS(PERSONA.primaryNaics, PERSONA.primaryNaicsLabel, true),
      ...PERSONA.secondaryNaics.map((n) => NAICS(n.code, n.label)),
    ),
    typed(JOINED_DAYS_AGO - 3),
  );
  add("commodity_codes", codes({ system: "NIGP", code: "962", label: "Transportation services, including freight" }), typed(JOINED_DAYS_AGO - 10));
  add("differentiators", list(...PERSONA.differentiators), typed(JOINED_DAYS_AGO - 7));
  add("service_delivery_mode", choice("onsite", "On site"), typed(JOINED_DAYS_AGO - 7));
  add("current_customer_types", pick("current_customer_types", "businesses", "government"), typed(JOINED_DAYS_AGO - 7));
  add("sectors_served", pick("sectors_served", "commercial", "government"), typed(JOINED_DAYS_AGO - 7));
  add("service_to_sell_to_government", choice(CORE_SERVICES[0]), {
    originKey: "member.confirmed",
    daysAgo: 40,
    provenance: hunterChatSource(
      "What I want to sell first is scheduled box-truck routes. Our box trucks have lift gates.",
      "Got it. Scheduled box-truck routes with lift gates.",
      41,
    ),
  });
  add(
    "doc_llc_paperwork",
    { kind: "file", file: file("doc-llc", "rockfish-run-freight-articles-of-organization.pdf", 172_032, INTAKE_SENT_DAYS_AGO + 3, 4) },
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
    { kind: "file", file: file("doc-fleet-sheet", "rockfish-run-freight-fleet-sheet.pdf", 1_126_400, POSITIONING_CALL_DAYS_AGO + 2, 3) },
    typed(POSITIONING_CALL_DAYS_AGO + 2),
  );

  // ── What you can take on ──
  add(
    "geographic_coverage",
    { kind: "area", area: { states: [...PERSONA.serviceStates], counties: [], cities: [], rung: "state" } },
    typed(JOINED_DAYS_AGO - 3),
  );
  // Two daily routes and two on-call jobs on top of the commercial work she runs now.
  add("concurrent_contract_capacity", count(4, "routes at once"), {
    originKey: "member.confirmed",
    daysAgo: POSITIONING_CALL_DAYS_AGO - 1,
    provenance: mentorCallSource(
      { text: "How many routes can you run at the same time?", at: 21 * 60 + 50 },
      { text: "Four routes at once with the trucks we have now.", at: 21 * 60 + 56 },
    ),
  });
  add("payment_terms_tolerance", count(30, "days"), typed(JOINED_DAYS_AGO - 8));
  add("working_capital", money(180_000), typed(JOINED_DAYS_AGO - 8));
  add(
    "bonding_capacity",
    text("None so far. Our trucking work has never needed a bond. SDDC's carrier program asks for a DoD bond, through our insurance broker."),
    typed(JOINED_DAYS_AGO - 8),
  );
  add("proposal_support", choice("me", "I write them"), typed(JOINED_DAYS_AGO - 8));
  add("pursuing_as", choice("both", "Both"), typed(JOINED_DAYS_AGO - 3));
  // Twelve drivers: a new daily route needs drivers she would have to hire.
  add("constraints", pick("constraints", "crew"), typed(JOINED_DAYS_AGO - 8));

  // ── Work you have done ──
  add("past_performance", entries(...PAST_PERFORMANCE.map(truckingJob)), typed(JOINED_DAYS_AGO - 3));
  add("public_sector_experience", pick("public_sector_experience", "state", "federal", "prime"), typed(JOINED_DAYS_AGO - 9));
  add("years_of_experience", choice("5to10", "5 to 10 years"), typed(JOINED_DAYS_AGO - 3));
  add("has_active_commercial_contracts", choice("yes", "Yes"), typed(JOINED_DAYS_AGO - 9));
  add(
    "professional_references",
    list(...PAST_PERFORMANCE.filter((p) => p.referenceName).map((p) => `${p.referenceName}, ${p.referenceTitle}`)),
    typed(JOINED_DAYS_AGO - 9),
  );
  const goal = "Win the Fayetteville VA supply and linen runs, and get into SDDC's carrier program.";
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
    text("A VA trucking job set aside for service-disabled veteran-owned firms, close to our yard.", true),
    typed(JOINED_DAYS_AGO - 9),
  );
  add(
    "anything_else",
    text("We are not in SDDC's carrier program yet, so we can't haul DoD freight booked through SDDC. We meet its three-year authority rule.", true),
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
        name: "Commercial auto liability and cargo insurance",
        issuedAt: dateDaysFromNow(-215),
        // The same date as the Stay Ready page: 150 days from now.
        expiresAt: dateDaysFromNow(150),
        limits: [
          { label: "Per accident", amountUSD: 1_000_000 },
          { label: "Cargo", amountUSD: 100_000 },
        ],
      },
    ),
    typed(JOINED_DAYS_AGO - 12),
  );
  // Her operating authority, and nothing more: no driver holds a hazmat endorsement.
  add(
    "licenses",
    papers(
      { id: "lic-usdot", kind: "licence", name: "USDOT number", issuer: "FMCSA", issuedAt: "2017-05-22" },
      { id: "lic-mc", kind: "licence", name: "Motor carrier (MC) operating authority", issuer: "FMCSA", issuedAt: "2017-06-14" },
      { id: "lic-scac", kind: "registration", name: "Standard Carrier Alpha Code (SCAC)", issuer: "NMFTA" },
    ),
    typed(JOINED_DAYS_AGO - 12),
  );
  // State and county programs stay open: North Carolina ended its HUB certification
  // in 2026, and she holds no other state certification.
  add(
    "doc_w9",
    { kind: "file", file: file("doc-w9", "rockfish-run-freight-w9.pdf", 94_208, JOINED_DAYS_AGO - 14, 2) },
    { originKey: "intake.migration", daysAgo: JOINED_DAYS_AGO - 14 },
  );

  return out;
}

export function businessProposals(): DemoProposal[] {
  return [
    proposal(
      "prop-equipment",
      "equipment",
      list("7 tractors, 9 trailers, 4 box trucks with lift gates and a cargo van"),
      "capability_statement",
      null,
      capabilitySource("7 tractors, 9 trailers, 4 box trucks with lift gates and a cargo van", "Truck yard and shop on Gillespie St."),
      POSITIONING_CALL_DAYS_AGO + 1,
    ),
    proposal(
      "prop-psc",
      "psc_codes",
      codes(
        { system: "PSC", code: "V111", label: "Transportation/Travel/Relocation- Transportation: Motor Freight" },
        { system: "PSC", code: "V119", label: "Transportation/Travel/Relocation- Transportation: Other" },
      ),
      "capability_statement",
      null,
      capabilitySource("PSC V111 · V119", "Company data:"),
      POSITIONING_CALL_DAYS_AGO + 1,
    ),
    proposal(
      "prop-credit-line",
      "line_of_credit",
      choice("yes", "I have one"),
      "hunter.learned",
      "We have a $150,000 line of credit at the bank. It covers diesel and payroll until the government pays.",
      hunterChatSource(
        "We have a $150,000 line of credit at the bank. It covers diesel and payroll until the government pays.",
        "Got it. A $150,000 line of credit covers diesel and payroll until you're paid.",
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
      "I am the only owner. I am a US citizen and an Army veteran.",
      toldHunterSource("I am the only owner. I am a US citizen and an Army veteran.", 3),
      3,
    ),
  ];
}

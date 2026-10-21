// THE CONTRACTOR: Derrick Faircloth's starting My Business record (read through
// src/demo/sc/business/seed.ts, which picks the member on stage).
//
// Every fact comes from the story (members/construction/persona.ts, workspace.ts)
// or the approved pack (demo-storyboard/construction-pack.md, section 9). The
// record is not complete, on purpose, with the pack's real gaps:
//   - not on either Fort Bragg HUBZone MATOC, where most of the base's HUBZone
//     work goes: he told Sarah so on the positioning call ("Anything else");
//   - the bond line is tight: $2.9M of a $4M aggregate is in use ("Bonding");
//   - HUBZone residency at 36% (9 of 25): one hire from outside the zone drops
//     him under 35% (the HUBZone certificate, and Stay Ready);
//   - no quality control manager or safety officer on file: "Who does what on
//     your team" is open, and it is Ava's first question on the hero bid;
//   - the HUBZone recertification is due in 44 days, the same date as the Stay
//     Ready page and the task.
// Also open: his tax number, owner citizenship, five years of receipts, licenses,
// state programs (North Carolina ended HUB certification in 2026) and the words
// buyers search for ("Tell Hunter everything" fills the last one).
// Five suggestions wait for a yes or a no: equipment and PSC codes read off his
// capability statement, the credit line from his chat with Hunter, clearances from
// his call with Sarah, and citizenship from "Tell Hunter everything". SAM.gov's size
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
  "We replace chillers, air handlers and electrical service in Army buildings from our shop on Grove Street. We have two electrical crews and two HVAC crews. We want our first Corps of Engineers prime in the next 90 days. We can wait 30 days to be paid.";

/** The starting logo: a drawn mark with his initials, so no file can go missing. */
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
<rect width="160" height="160" rx="30" fill="#2f3a2a"/>
<path d="M34 118 L80 42 L126 118 Z" fill="none" stroke="#d9a441" stroke-width="3" opacity="0.7"/>
<text x="80" y="108" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="46" font-weight="700" fill="#f3eee2">NB</text>
</svg>`;
export const LOGO_URL = `data:image/svg+xml;utf8,${encodeURIComponent(LOGO_SVG)}`;

/** His top three services. The capability statement names the same ones. */
const CORE_SERVICES = [
  "HVAC replacement: chillers, air handlers and heat pumps",
  "Electrical service, panels and switchgear",
  "Building repairs in occupied buildings, phased",
] as const;

/** The pack's customer types and places, in the record's words. */
function constructionJob(pp: (typeof PAST_PERFORMANCE)[number]): JobEntry {
  const base = jobFor(pp);
  const place =
    pp.id === "pp-pope-office-hvac"
      ? "Pope Army Airfield, NC"
      : pp.id === "pp-turnrow-barracks-electrical"
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
  const bond = PERSONA.bondLine!;
  const m = (n: number) => `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;

  // ── Your legal details ──
  add("primary_contact_name", text(PERSONA.ownerName), contact);
  add("email", text(PERSONA.email), contact);
  add("phone", text(PERSONA.phone), typed(JOINED_DAYS_AGO - 2));
  add("home_address", { kind: "address", address: mailingParts() }, typed(JOINED_DAYS_AGO - 2));
  add("tshirt_size", choice("xl", "XL"), { originKey: "intake.migration", daysAgo: JOINED_DAYS_AGO - 1 });
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
  // SAM.gov's answer, waiting for a check (the one "Check this" row).
  add("size_status", text(`Yes. A small business under the size standard for NAICS ${PERSONA.primaryNaics}.`), {
    ...sam("Small Business", "Business types:", "HUBZone"),
    state: "needs_review",
  });
  add(
    "socioeconomic_certifications",
    papers(
      { id: "small_biz", kind: "certification", name: "Small business", issuer: "SAM.gov" },
      {
        id: "hubzone",
        kind: "certification",
        name: "HUBZone (9 of 25 staff live in a HUBZone)",
        issuer: "U.S. Small Business Administration",
        issuedAt: "2023-12-02",
        // Every 3 years: the same date as the Stay Ready page and the task, 44 days from now (the pack's gap 5).
        expiresAt: dateDaysFromNow(44),
      },
    ),
    sam("HUBZone", "Business types: Small Business,", `Active until ${samActiveLabel()}`),
  );

  // ── What you sell ──
  add("primary_services", list(...CORE_SERVICES), {
    originKey: "member.confirmed",
    daysAgo: POSITIONING_CALL_DAYS_AGO + 1,
    provenance: capabilitySource(PERSONA.differentiators[0]!, "Core capabilities:", `· ${PERSONA.differentiators[1]}`),
  });
  add(
    "business_description",
    text(
      `${PERSONA.businessName} is a HUBZone general contractor in ${PERSONA.hqCity}, ${PERSONA.hqState}, 12 miles from Fort Bragg. We self-perform electrical and HVAC work with two crews of each, and run building repairs from bid to closeout for federal, school and commercial buyers in North Carolina. We are bonded to ${m(bond.single)} a job and have been in business since ${PERSONA.formedOn.slice(-4)}.`,
      true,
    ),
    typed(JOINED_DAYS_AGO - 3),
  );
  add(
    "primary_industry",
    codes(
      { system: "NAICS", code: "", label: "Commercial & Institutional Building" },
      NAICS(PERSONA.primaryNaics, PERSONA.primaryNaicsLabel, true),
      ...PERSONA.secondaryNaics.map((n) => NAICS(n.code, n.label)),
    ),
    typed(JOINED_DAYS_AGO - 3),
  );
  add("commodity_codes", codes({ system: "NIGP", code: "910", label: "Building maintenance, installation and repair services" }), typed(JOINED_DAYS_AGO - 10));
  add("differentiators", list(...PERSONA.differentiators), typed(JOINED_DAYS_AGO - 7));
  add("service_delivery_mode", choice("onsite", "On site"), typed(JOINED_DAYS_AGO - 7));
  add("current_customer_types", pick("current_customer_types", "businesses", "gc", "government"), typed(JOINED_DAYS_AGO - 7));
  add("sectors_served", pick("sectors_served", "commercial", "government"), typed(JOINED_DAYS_AGO - 7));
  add("service_to_sell_to_government", choice(CORE_SERVICES[0]), {
    originKey: "member.confirmed",
    daysAgo: 40,
    provenance: hunterChatSource(
      "What I want to sell the government first is HVAC replacement. Chillers, air handlers and heat pumps.",
      "Got it. HVAC replacement: chillers, air handlers and heat pumps.",
      41,
    ),
  });
  add(
    "doc_llc_paperwork",
    { kind: "file", file: file("doc-llc", "ninebark-builders-articles-of-organization.pdf", 181_248, INTAKE_SENT_DAYS_AGO + 3, 4) },
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
    { kind: "file", file: file("doc-project-sheets", "ninebark-builders-project-sheets.pdf", 1_884_160, POSITIONING_CALL_DAYS_AGO + 2, 6) },
    typed(POSITIONING_CALL_DAYS_AGO + 2),
  );

  // ── What you can take on ──
  add(
    "geographic_coverage",
    { kind: "area", area: { states: [...PERSONA.serviceStates], counties: [], cities: [], rung: "state" } },
    typed(JOINED_DAYS_AGO - 3),
  );
  // Five crews: two electrical, two HVAC, one carpentry.
  add("concurrent_contract_capacity", count(5, "jobs at once"), {
    originKey: "member.confirmed",
    daysAgo: POSITIONING_CALL_DAYS_AGO - 1,
    provenance: mentorCallSource(
      { text: "How many jobs can you run at the same time?", at: 21 * 60 + 50 },
      { text: "Five at once. We have two crews of each trade, so one job does not stall another.", at: 21 * 60 + 56 },
    ),
  });
  add("payment_terms_tolerance", count(30, "days"), typed(JOINED_DAYS_AGO - 8));
  add("working_capital", money(400_000), typed(JOINED_DAYS_AGO - 8));
  add(
    "bonding_capacity",
    text(`${m(bond.single)} a job and ${m(bond.aggregate)} in total, through our surety. ${m(bond.inUse)} is in use now.`),
    typed(JOINED_DAYS_AGO - 8),
  );
  add("proposal_support", choice("me", "I write them"), typed(JOINED_DAYS_AGO - 8));
  add("pursuing_as", choice("both", "Both"), typed(JOINED_DAYS_AGO - 3));
  // The bond aggregate is the limit: the surety sizes it to his cash.
  add("constraints", pick("constraints", "cashflow"), typed(JOINED_DAYS_AGO - 8));

  // ── Work you have done ──
  add("past_performance", entries(...PAST_PERFORMANCE.map(constructionJob)), typed(JOINED_DAYS_AGO - 3));
  add("public_sector_experience", pick("public_sector_experience", "school", "federal", "prime"), typed(JOINED_DAYS_AGO - 9));
  add("years_of_experience", choice("10to20", "10 to 20 years"), typed(JOINED_DAYS_AGO - 3));
  add("has_active_commercial_contracts", choice("yes", "Yes"), typed(JOINED_DAYS_AGO - 9));
  add(
    "professional_references",
    list(...PAST_PERFORMANCE.filter((p) => p.referenceName).map((p) => `${p.referenceName}, ${p.referenceTitle}`)),
    typed(JOINED_DAYS_AGO - 9),
  );
  const goal = "Win our first Corps of Engineers job at Fort Bragg, and answer the Minor Construction MATOC sources sought.";
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
    text("A HUBZone repair job at Fort Bragg under $1M that needs both our trades.", true),
    typed(JOINED_DAYS_AGO - 9),
  );
  add(
    "anything_else",
    text("We are not on either Fort Bragg HUBZone MATOC. Most of the base's HUBZone work goes through them.", true),
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
    { kind: "file", file: file("doc-w9", "ninebark-builders-w9.pdf", 94_208, JOINED_DAYS_AGO - 14, 2) },
    { originKey: "intake.migration", daysAgo: JOINED_DAYS_AGO - 14 },
  );

  return out;
}

export function businessProposals(): DemoProposal[] {
  return [
    proposal(
      "prop-equipment",
      "equipment",
      list("Two bucket trucks, a scissor lift and refrigerant recovery machines"),
      "capability_statement",
      null,
      capabilitySource("Two bucket trucks, a scissor lift and refrigerant recovery machines", "Shop and yard on Grove Street."),
      POSITIONING_CALL_DAYS_AGO + 1,
    ),
    proposal(
      "prop-psc",
      "psc_codes",
      codes(
        { system: "PSC", code: "Z2AA", label: "Repair or Alteration of Office Buildings" },
        { system: "PSC", code: "Z2JZ", label: "Repair or Alteration of Miscellaneous Buildings" },
      ),
      "capability_statement",
      null,
      capabilitySource("PSC Z2AA · Z2JZ", "Company data:"),
      POSITIONING_CALL_DAYS_AGO + 1,
    ),
    proposal(
      "prop-credit-line",
      "line_of_credit",
      choice("yes", "I have one"),
      "hunter.learned",
      "We have a $250,000 line of credit at the bank. It carries materials until the monthly progress payment comes in.",
      hunterChatSource(
        "We have a $250,000 line of credit at the bank. It carries materials until the monthly progress payment comes in.",
        "Got it. A $250,000 line of credit carries your materials between progress payments.",
      ),
      9,
    ),
    mentorCallProposal(
      "prop-clearances",
      "security_clearances",
      list("None"),
      { text: "Does anyone on your team hold a security clearance?", at: 18 * 60 + 30 },
      { text: "No. Our crews badge onto post, but nobody holds a clearance.", at: 18 * 60 + 36 },
    ),
    proposal(
      "prop-citizenship",
      "owner_citizenship",
      choice("all", "All owners are US citizens"),
      "member.told",
      "I own all of the company, and I am a US citizen.",
      toldHunterSource("I own all of the company, and I am a US citizen.", 3),
      3,
    ),
  ];
}

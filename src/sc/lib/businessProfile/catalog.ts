/**
 * The 75-row field catalog. Pure. `registry.ts` is the `/intake` contract and
 * does not change; this supersets it and inherits its copy.
 *
 * THE RULE THAT KEEPS THE TWO FROM DRIFTING: the catalog states only what
 * `registry.ts` cannot hold — `part`, `mbType`, `priority`, `ask`, `addPrompt`,
 * `term`, `scope`, `trade`, `optionsFrom`. Labels, helpers and options are
 * inherited where the registry has them and supplied only where it does not; a
 * row with a registry home never restates or overrides a line. `copyFor()` is
 * the single accessor, and a guard test asserts both halves.
 *
 * A row and a key are not the same unit:
 *   75 rows = 35 mapped to existing keys + 38 new + 2 virtual (photo, logo)
 *   78 ProfileField keys = 39 existing + 38 new + `can_get_bonding`
 * `alsoKeys` is the one mechanism for second keys and for the four
 * `LEGACY_KEYS` folded into a host row. There is no second table.
 *
 * `intake` IS DERIVED, NEVER AUTHORED — `AuthoredField` has no such property,
 * so a new catalog field is structurally incapable of widening the milestone.
 *
 * IT IS DERIVED FROM THIS FILE'S OWN LIST, NOT FROM `/intake`. It used to read
 * `REQUIRED_KEYS`, which means "required to submit the cohort intake form" —
 * a different question from "one of the fourteen a mentor needs before the
 * first call". The two agreed until `home_address` and `tshirt_size` were made
 * required on that form: a postal address and a T-shirt size for the welcome
 * pack then appeared on the record's Basic Info screen and widened its counter
 * from 14 to 16, silently, with no change to this file. `BEFORE_FIRST_CALL`
 * says what the record means, so /intake can require whatever it needs.
 */

import { countAnswered, fieldDef, type RegistryOption } from "./registry";
import type { MbFieldSpec, MbType } from "./mbValue";
import type { PartId } from "./parts";

/** How much it matters that we hold this AT ALL, by any channel. Not the same
 *  as how soon we ASK her: a field can be P1 and never asked, because a
 *  register supplies it. */
export type Priority = 1 | 2 | 3;

/**
 * The three tiers, in the member's words. Ported verbatim from the prototype —
 * these are reviewed copy, not placeholders. They are deliberately NOT
 * "Core / Recommended / Additional": all three fail the plain-English rule.
 */
export const PRIORITY: Record<Priority, { label: string; note: string }> = {
  1: {
    label: "Needed to find you work",
    note: "Without these we cannot find work for you, or you cannot bid for it.",
  },
  2: {
    label: "Helps us find better work",
    note: "These help us show you better work. They also help a buyer say yes.",
  },
  3: {
    label: "Extra, when you have time",
    note: "Useful to know. Nothing is waiting for these.",
  },
};

/** What a row states for itself. No `intake` — see the header. */
export interface AuthoredField {
  /** camelCase id — the vocabulary `govpreneures` and the prototype share.
   *  Unique across all 75 rows. Pinned by `CATALOG_ID_SNAPSHOT` (Gap 7). */
  id: string;
  /** The `ProfileField.fieldKey` this row is stored under. `null` for the two
   *  VIRTUAL rows (photo, logo) which live on `SuccessCenter` columns.
   *  ADD, NEVER RENAME — live rows are keyed on it, with no migration path. */
  key: string | null;
  /** Extra `ProfileField` keys that render inside this one row: the four
   *  `LEGACY_KEYS`, and `can_get_bonding` from the bonding split. */
  alsoKeys?: string[];
  part: PartId;
  mbType: MbType;
  priority: Priority;
  /** The same fact phrased as a question Hunter can ask out loud. Only fields
   *  with an `ask` are ever put in front of her as a question. */
  ask?: string;
  /** The call to action on an empty row. Authored, never generated. */
  addPrompt?: string;
  /** The official government name, when `label` is the plain sentence. */
  term?: string;
  scope?: "federal" | "sled" | "both";
  /** Shown only when her trade needs it. */
  trade?: "food";
  /** The answers come from what she already told us in another field. Names a
   *  catalog `id`, not a fieldKey. */
  optionsFrom?: string;
  /** AUTHORED ON A ROW WITH NO REGISTRY HOME, OR WHERE THE REGISTRY LEFT THIS
   *  ONE LINE EMPTY. Never where the registry already says it. Header rule. */
  label?: string;
  helper?: string;
  whyItMatters?: string;
  options?: RegistryOption[];
}

export interface CatalogField extends AuthoredField {
  /** DERIVED: `key !== null && BEFORE_FIRST_CALL.includes(key)`. One of Diana's
   *  required set. Never hand-authored — only a registry field can widen it. */
  intake: boolean;
}

/**
 * The 75 rows, in part order (business 23 · sell 16 · capacity 14 · jobs 10 ·
 * papers 12), priority split 15/36/24.
 *
 * Order within a part is RENDER order, and it is sorted by EFFORT, not value:
 * what she can answer from memory on a phone comes before what needs her to go
 * and find a document.
 *
 * Every `ask`, `addPrompt` and `term` below is TRANSCRIBED, not written here and
 * not generated: 31 asks, 74 add prompts, 16 terms, hand-copied from the
 * prototype's authored catalogue. Templating an add prompt off a label once
 * shipped "Add you are registered to sell to the us government", so the tests
 * pin the counts and check that no prompt has lost an acronym's case.
 */
const AUTHORED: AuthoredField[] = [
  {
    id: "primaryContactName",
    key: "primary_contact_name",
    part: "business",
    mbType: "text",
    priority: 1,
    ask: "Who does a buyer talk to?",
    addPrompt: "Add a contact name",
  },
  {
    id: "primaryContactEmail",
    key: "email",
    part: "business",
    mbType: "text",
    priority: 1,
    ask: "What is your best email address?",
    addPrompt: "Add your email",
  },
  {
    id: "businessPhoneNumber",
    key: "phone",
    part: "business",
    mbType: "text",
    priority: 1,
    ask: "What is the best number to reach you on?",
    addPrompt: "Add your phone number",
  },
  {
    /* Where we post things to her — a different question from `company_address`
       above, which is where the work happens and is what SAM and HUBZone read.
       P2, not P3: nothing DERIVES from it, but it is asked at intake and a row
       sitting under "Extra, when you have time · nothing is waiting for these"
       would contradict the form that just required it. Copy is inherited. */
    id: "homeAddress",
    key: "home_address",
    part: "business",
    mbType: "address",
    priority: 2,
    addPrompt: "Add where to post things",
  },
  {
    id: "tshirtSize",
    key: "tshirt_size",
    part: "business",
    mbType: "choice",
    priority: 2,
    addPrompt: "Add your T-shirt size",
  },
  {
    /* VIRTUAL — no `ProfileField` key. Stored on `SuccessCenter.mainContactPhotoUrl`,
       which the portal home already writes. */
    id: "profilePhoto",
    key: null,
    part: "business",
    mbType: "file",
    priority: 3,
    addPrompt: "Upload a photo of yourself",
    label: "Your photo",
    helper: "Shown on your Success Center.",
  },
  {
    id: "primaryContactTitle",
    key: "primary_contact_title",
    part: "business",
    mbType: "text",
    priority: 3,
    addPrompt: "Add your title",
  },
  // ══ 1 · YOUR LEGAL DETAILS ════════════════════════════════════════════════
  {
    id: "legalName",
    key: "legal_company_name",
    part: "business",
    mbType: "text",
    priority: 1,
    ask: "What is your business called?",
    addPrompt: "Add your business name",
  },
  {
    /* The company's own address and number — `primaryContactEmail` and
       `businessPhoneNumber` below are the member's own ("your best email",
       "the best number to reach you on"). A one-person firm often has neither
       of these yet, which is why they are optional on the intake. */
    id: "companyEmail",
    key: "company_email",
    part: "business",
    mbType: "text",
    priority: 2,
    addPrompt: "Add your company email",
  },
  {
    id: "companyPhone",
    key: "company_phone",
    part: "business",
    mbType: "text",
    priority: 2,
    addPrompt: "Add your company phone",
  },
  {
    /* Hazard 7: Success Center stores `{ has, url }`, which is strictly richer
       than the prototype's bare string, and that shape is kept. `text` is what
       holds the URL; "No, not yet" and "Not sure" are carried by the two
       first-class empties (`none` / `unknown`), so nothing is lost and the row
       never renders the word "Yes" where a member expects an address. */
    id: "website",
    key: "website",
    part: "business",
    mbType: "text",
    priority: 3,
    ask: "Do you have a website?",
    addPrompt: "Add your website",
  },
  {
    /* VIRTUAL — `SuccessCenter.companyLogoUrl`. */
    id: "businessLogo",
    key: null,
    part: "business",
    mbType: "file",
    priority: 3,
    addPrompt: "Upload your logo",
    label: "Your business logo",
    helper: "Shown on your Success Center.",
  },
  {
    id: "dbaName",
    key: "dba_name",
    part: "business",
    mbType: "text",
    priority: 3,
    addPrompt: "Add your other trading name",
  },
  {
    id: "entityType",
    key: "entity_type",
    part: "business",
    mbType: "choice",
    priority: 2,
    addPrompt: "Add what kind of business it is",
    label: "Kind of business",
    helper: "A company, a partnership, or just you.",
    options: [
      { value: "llc", label: "A company (LLC)" },
      { value: "corp", label: "A corporation" },
      { value: "sole", label: "Just me (sole proprietor)" },
      { value: "partnership", label: "A partnership" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    /* Hazard 8: the stored value is a year string. It widens to 2015-01-01 on
       read and renders year-only. It never narrows back. */
    id: "formationDate",
    key: "year_started_operating",
    part: "business",
    mbType: "date",
    priority: 2,
    ask: "What year did you start the business?",
    addPrompt: "Add the year you started",
  },
  {
    /* In parts, not one line: SAM matches on the physical address, HUBZone
       eligibility is decided by it, and a SLED portal files a vendor by state.
       `/intake` still asks for it as one line — `registry.ts` is frozen — and a
       string already on disk lifts whole into `line1` rather than being split
       on commas, which guesses wrong exactly where it matters. */
    id: "physicalAddress",
    key: "company_address",
    part: "business",
    mbType: "address",
    priority: 1,
    ask: "Where do you work from?",
    addPrompt: "Add where you work",
  },
  {
    id: "ein",
    key: "ein",
    part: "business",
    mbType: "text",
    priority: 2,
    ask: "Do you have a tax number for the business?",
    addPrompt: "Add your tax number",
    term: "EIN",
    label: "Your tax number for the business",
    helper: "Nine digits. It is on the letter the IRS sent you.",
    whyItMatters: "The government needs it before it can pay you.",
  },
  {
    id: "uei",
    key: "uei",
    part: "business",
    mbType: "text",
    priority: 2,
    addPrompt: "Add your government ID number",
    term: "UEI",
    scope: "federal",
    label: "Your government ID number",
    whyItMatters: "You need this number before the government can pay you.",
  },
  {
    id: "cage",
    key: "cage_code",
    part: "business",
    mbType: "text",
    priority: 2,
    addPrompt: "Add your supplier code",
    term: "CAGE code",
    scope: "federal",
    label: "Your government supplier code",
  },
  {
    /* Hazard 9: Success Center's slugs win — `in_progress` / `not_sure`, not the
       prototype's `started` / `unsure`. They are on disk in live rows, and
       inheriting the options from the registry is what makes that automatic. */
    id: "samRegistration",
    key: "sam_registration_status",
    part: "business",
    mbType: "choice",
    priority: 2,
    addPrompt: "Add your government registration",
    term: "SAM.gov registration",
    scope: "federal",
  },
  {
    id: "sledRegistrations",
    key: "sled_registrations",
    part: "business",
    mbType: "papers",
    priority: 1,
    addPrompt: "Add the lists you are on",
    term: "State and county vendor portals",
    scope: "sled",
    label: "Lists you are on, so buyers can find you",
    helper: "Each state, county and school district keeps its own list.",
    whyItMatters: "Most school districts only email people on their list.",
  },
  {
    id: "owners",
    key: "owners",
    part: "business",
    mbType: "list",
    priority: 2,
    addPrompt: "Add who owns the business",
    label: "Owners, and the share each one holds",
    helper: "Names and the share each person holds.",
    whyItMatters: "Some programs need one owner to hold more than half.",
  },
  {
    id: "ownerCitizenship",
    key: "owner_citizenship",
    part: "business",
    mbType: "choice",
    priority: 2,
    addPrompt: "Add whether the owners are US citizens",
    label: "US citizenship of the owners",
    helper: "Citizenship decides which set-asides you can claim.",
    options: [
      { value: "all", label: "All owners are US citizens" },
      { value: "some", label: "Some are, some are not" },
      { value: "none", label: "No owners are US citizens" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "totalEmployeesW2",
    key: "total_employees",
    part: "business",
    mbType: "count",
    priority: 2,
    ask: "How many people work with you?",
    addPrompt: "Add how many people work with you",
    label: "People who work with you",
    helper: "Count part-time and temporary staff the same as full-time.",
    whyItMatters: "Your income and your staff count together decide this.",
  },
  {
    id: "annualReceipts",
    key: "annual_receipts",
    part: "business",
    mbType: "list",
    priority: 2,
    addPrompt: "Add what the business made each year",
    label: "Money the business made, each of the last five years",
    helper: "An estimate is fine to start.",
    whyItMatters: "The size test uses five years together. One year is not enough.",
  },
  {
    /* The one row with no add prompt: it is worked out from her income and her
       staff count, so there is nothing for her to add. */
    id: "sizeStatus",
    key: "size_status",
    part: "business",
    mbType: "text",
    priority: 2,
    label: "Whether you count as a small business for this kind of work",
    helper: "We use your yearly income and how many people work with you.",
    whyItMatters: "We show a separate answer for each kind of work.",
  },
  {
    /* Hazard 1: stored as `string[]` slugs feeding `deriveCerts` and set-aside
       eligibility. Lifted to `Paper[]` on read, NEVER migrated. `doc_certifications`
       is the letters behind the same claim, so it renders inside this row. */
    id: "samBusinessTypes",
    key: "socioeconomic_certifications",
    alsoKeys: ["doc_certifications"],
    part: "business",
    mbType: "papers",
    priority: 2,
    addPrompt: "Add programs you qualify for",
    term: "WOSB, SDVOSB, 8(a) and similar",
  },

  // ══ 2 · WHAT YOU SELL ═════════════════════════════════════════════════════
  {
    /* Hazard 10: stored as `string[]`, read as `ListItem[]`. `servicesFrom()` is
       an exported contract that /intake depends on, so both directions adapt. */
    id: "coreCapabilities",
    key: "primary_services",
    part: "sell",
    mbType: "list",
    priority: 1,
    ask: "What are the main things you do?",
    addPrompt: "Add your main services",
  },
  {
    id: "businessSummary",
    key: "business_description",
    part: "sell",
    mbType: "long-text",
    priority: 2,
    ask: "How would you describe your business to a buyer?",
    addPrompt: "Add a description",
  },
  {
    /* Hazard 5: Success Center's fused `{ categories, naics }` shape is kept —
       it feeds a union onto `SuccessCenter.naicsCodes`. */
    id: "naicsCodes",
    key: "primary_industry",
    part: "sell",
    mbType: "codes",
    priority: 1,
    addPrompt: "Add the government's codes for your work",
    term: "NAICS codes",
    scope: "federal",
  },
  {
    id: "pscCodes",
    key: "psc_codes",
    part: "sell",
    mbType: "codes",
    priority: 3,
    addPrompt: "Add the codes buyers search for",
    term: "PSC codes",
    scope: "federal",
    label: "The way federal buyers search for what you sell",
    whyItMatters: "This is how a federal buyer finds someone who does what you do.",
  },
  {
    id: "commodityCodes",
    key: "commodity_codes",
    part: "sell",
    mbType: "codes",
    priority: 1,
    addPrompt: "Add the codes states and schools use",
    term: "NIGP and UNSPSC codes",
    scope: "sled",
    label: "The way states and school districts list what you sell",
    helper: "Each portal has its own list. We help you pick the right ones.",
    whyItMatters: "This is what decides whether a school district emails you.",
  },
  {
    id: "keywordsSkills",
    key: "search_keywords",
    part: "sell",
    mbType: "list",
    priority: 2,
    addPrompt: "Add words a buyer might search for",
    label: "Words a buyer might search for",
    helper: "Plain words, the way a buyer would say them.",
  },
  {
    id: "differentiators",
    key: "differentiators",
    part: "sell",
    mbType: "list",
    priority: 2,
    ask: "Why should a buyer pick you and not someone else?",
    addPrompt: "Add what makes you different",
    label: "What makes you different from the others?",
    helper: "Use a number where you can. Write twelve years, not many years.",
    whyItMatters: "Buyers read this part of your one-page flyer first.",
  },
  {
    id: "deliveryModes",
    key: "service_delivery_mode",
    part: "sell",
    mbType: "choice",
    priority: 2,
    addPrompt: "Add how you deliver",
  },
  {
    id: "customerTypes",
    key: "current_customer_types",
    part: "sell",
    mbType: "choices",
    priority: 2,
    addPrompt: "Add who buys from you today",
  },
  {
    id: "llcPaperwork",
    key: "doc_llc_paperwork",
    part: "sell",
    mbType: "file",
    priority: 2,
    addPrompt: "Upload your LLC paperwork",
    term: "Articles of Organization",
    label: "Your LLC paperwork",
    helper: "The certificate of formation, or the filing receipt.",
    whyItMatters: "One upload fills in your legal name, your type and your start date.",
  },
  {
    /* `has_capability_statement` asks whether she has one; this row holds the
       document itself. One question, one row, two stored keys. */
    id: "capabilityStatement",
    key: "doc_capability_statement",
    alsoKeys: ["has_capability_statement"],
    part: "sell",
    mbType: "file",
    priority: 2,
    addPrompt: "Upload your one-page flyer",
    term: "Capability statement",
  },
  {
    id: "menusAndPricing",
    key: "doc_menus_and_pricing",
    part: "sell",
    mbType: "file",
    priority: 3,
    addPrompt: "Upload your menus and prices",
    scope: "sled",
    trade: "food",
    label: "Your menus and prices",
    helper: "A school district scores your menu and your price per meal.",
  },
  {
    /* Her own services are the only possible answers, so the set is resolved at
       render time from `coreCapabilities` — which is why that row comes first. */
    id: "serviceToSell",
    key: "service_to_sell_to_government",
    part: "sell",
    mbType: "choice",
    priority: 1,
    ask: "Which service do you want to sell to the government first?",
    addPrompt: "Pick the service to start with",
    optionsFrom: "coreCapabilities",
  },
  {
    id: "sectorsServed",
    key: "sectors_served",
    part: "sell",
    mbType: "choices",
    priority: 2,
    addPrompt: "Add the sectors you have worked in",
  },
  {
    id: "brochure",
    key: "doc_brochure",
    part: "sell",
    mbType: "file",
    priority: 3,
    addPrompt: "Upload your brochure",
  },
  {
    id: "marketingMaterial",
    key: "doc_marketing",
    part: "sell",
    mbType: "file",
    priority: 3,
    addPrompt: "Upload marketing material",
  },

  // ══ 3 · WHAT YOU CAN TAKE ON ══════════════════════════════════════════════
  {
    /* Hazard 4: Success Center's `{ states, cities, rung }` is kept and `Area`
       gains `cities` + `rung`. A rung is a named tier, not a distance, so
       turning one into miles is banned. */
    id: "geographicPreference",
    key: "geographic_coverage",
    part: "capacity",
    mbType: "area",
    priority: 1,
    ask: "How far will you travel for a job?",
    addPrompt: "Add where you can work",
  },
  {
    id: "maxDailyOutput",
    key: "max_daily_output",
    part: "capacity",
    mbType: "count",
    priority: 2,
    ask: "What is the most you have ever done in one day?",
    addPrompt: "Add how much you can do in a day",
    trade: "food",
    label: "The most you can do in one day",
    helper: "Your best guess is fine.",
    whyItMatters: "This tells us when a job is too big for you.",
  },
  {
    id: "concurrentContractCapacity",
    key: "concurrent_contract_capacity",
    part: "capacity",
    mbType: "count",
    priority: 2,
    ask: "How many jobs can you run at the same time?",
    addPrompt: "Add how many jobs at once",
    label: "Jobs you can run at once",
    helper: "One at a time is a perfectly good answer.",
  },
  {
    id: "facilities",
    key: "facilities",
    part: "capacity",
    mbType: "list",
    priority: 2,
    ask: "Where do you work from?",
    addPrompt: "Add where you work from",
    trade: "food",
    label: "The places you work from",
    helper: "Each place you use, and whether you own or rent it.",
    whyItMatters: "A school needs a health permit for every kitchen you use.",
  },
  {
    id: "equipment",
    key: "equipment",
    part: "capacity",
    mbType: "list",
    priority: 3,
    ask: "What vans or equipment do you have?",
    addPrompt: "Add your equipment",
    label: "Equipment and vehicles you have",
    helper: "Vans, cold storage, warming units.",
  },
  {
    id: "keyPersonnel",
    key: "key_personnel",
    part: "capacity",
    mbType: "list",
    priority: 2,
    addPrompt: "Add who does what on your team",
    label: "Who does what on your team",
    helper: "Who does the work, who drives, who helps with paperwork.",
  },
  {
    id: "paymentTermsTolerance",
    key: "payment_terms_tolerance",
    part: "capacity",
    mbType: "count",
    priority: 2,
    ask: "How long could you wait to be paid?",
    addPrompt: "Add how long you can wait",
    label: "How long you can wait to be paid",
    helper: "In days. Many buyers pay thirty to forty days after the invoice.",
    whyItMatters: "Many small businesses run out of money waiting to be paid.",
  },
  {
    id: "workingCapital",
    key: "working_capital",
    part: "capacity",
    mbType: "money",
    priority: 2,
    addPrompt: "Add money you could put into a job",
    label: "Money you could put into a new job",
    helper: "Only you see this. It is never shown to a buyer.",
    whyItMatters: "It tells us the biggest job you could take without trouble.",
  },
  {
    id: "lineOfCredit",
    key: "line_of_credit",
    part: "capacity",
    mbType: "choice",
    priority: 3,
    addPrompt: "Add whether you have a line of credit",
    label: "Line of credit",
    helper: "Money you can draw on to cover a job before you are paid.",
    options: [
      { value: "yes", label: "I have one" },
      { value: "no", label: "I do not have one" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    /* Hazard 2 — THE SPLIT. Two different questions shared one key. The stored
       limits TEXT keeps `bonding_capacity`, which is why this row is typed
       `text`; the "can you get one" CHOICE becomes `can_get_bonding` and renders
       inside the same row. Neither is ever coerced into the other. */
    id: "bondingCapability",
    key: "bonding_capacity",
    alsoKeys: ["can_get_bonding"],
    part: "capacity",
    mbType: "text",
    priority: 2,
    addPrompt: "Add whether you have this",
    term: "Surety bonding",
    scope: "federal",
  },
  {
    id: "proposalSupport",
    key: "proposal_support",
    part: "capacity",
    mbType: "choice",
    priority: 3,
    addPrompt: "Add who writes your offers",
    label: "Who writes your offers",
    helper: "You, someone on your team, or nobody yet.",
    options: [
      { value: "me", label: "I write them" },
      { value: "team", label: "Someone on my team" },
      { value: "nobody", label: "Nobody yet" },
    ],
  },
  {
    /* Hazard 9: Success Center's `not_sure` wins over the prototype's `unsure`. */
    id: "pursuingAs",
    key: "pursuing_as",
    part: "capacity",
    mbType: "choice",
    priority: 2,
    ask: "Do you want to win work directly, or work under someone else?",
    addPrompt: "Add how you want to win work",
  },
  {
    /* GAP-FILL, not a restatement: the registry gives this key a label and
       nothing else, so the box opened with no example of what belongs in it.
       See the header rule — the registry still owns every line it carries. */
    id: "securityClearances",
    key: "security_clearances",
    part: "capacity",
    mbType: "list",
    priority: 3,
    addPrompt: "Add any security clearances",
    helper: "Secret, or public trust. None is a fine answer.",
    whyItMatters: "A few federal jobs are only open to people who hold one.",
  },
  {
    id: "constraints",
    key: "constraints",
    part: "capacity",
    mbType: "choices",
    priority: 2,
    ask: "Is there anything that limits what you can take on?",
    addPrompt: "Add anything that limits you",
  },

  // ══ 4 · WORK YOU HAVE DONE ════════════════════════════════════════════════
  {
    /* Hazard 3: three single-project rows on disk, one `entries[]` on the
       record. Read concatenates; write mirrors entries 0–2 back to the three
       keys, so `formatFieldValue`'s `"customer" in o` branch keeps working. */
    id: "pastPerformance",
    key: "past_performance",
    alsoKeys: ["past_performance_2", "past_performance_3"],
    part: "jobs",
    mbType: "entries",
    priority: 1,
    ask: "Who was your last customer?",
    addPrompt: "Add a job you have done",
    term: "Past performance",
  },
  {
    id: "publicSectorExperience",
    key: "public_sector_experience",
    part: "jobs",
    mbType: "choices",
    priority: 2,
    ask: "Have you worked for a school, a city or a government office?",
    addPrompt: "Add public work you have done",
    label: "Have you worked for a school, city or government before?",
    helper: "Even one small job helps. Buyers look for it first.",
    whyItMatters: "Public work already done is the strongest thing you can show.",
    /* Every public buyer a small business plausibly serves, not just the four
       obvious tiers. The first list held school / city / state / federal only,
       and a member whose only public work was a community college, a county
       hospital, a water district or a housing authority had no honest answer
       but "None of these yet" — which is the WORST possible outcome for the one
       field whose own copy calls this "the strongest thing you can show".
       `prime` is here because the commonest first public job is not a contract
       with a government at all: it is work for someone else's. These values are
       also the allowlist — `optionLabel` throws on anything not in this list —
       so a value may be ADDED but never renamed. */
    options: [
      { value: "school", label: "A school or school district" },
      { value: "college", label: "A public college or university" },
      { value: "city", label: "A city or county office" },
      { value: "state", label: "A state office" },
      { value: "federal", label: "A federal office" },
      { value: "hospital", label: "A public hospital or health system" },
      { value: "district", label: "A special district — water, transit, fire" },
      { value: "housing", label: "A public housing authority" },
      { value: "tribal", label: "A tribal government" },
      { value: "prime", label: "A prime contractor, on a public job" },
      { value: "none", label: "None of these yet", exclusive: true },
    ],
  },
  {
    id: "yearsInBusiness",
    key: "years_of_experience",
    part: "jobs",
    mbType: "choice",
    priority: 2,
    ask: "How long have you done this work?",
    addPrompt: "Add your years of experience",
  },
  {
    id: "activeContracts",
    key: "has_active_commercial_contracts",
    part: "jobs",
    mbType: "choice",
    priority: 3,
    addPrompt: "Add jobs you are working on now",
  },
  {
    id: "lostBids",
    key: "lost_bids",
    part: "jobs",
    mbType: "entries",
    priority: 3,
    addPrompt: "Add work you did not win",
    scope: "sled",
    label: "Work you did not win",
    helper: "Some buyers ask for this. An honest answer is fine.",
    whyItMatters: "School districts ask for five years of it, so it is better held ready.",
  },
  {
    id: "professionalReferences",
    key: "professional_references",
    part: "jobs",
    mbType: "list",
    priority: 2,
    addPrompt: "Add people who will speak for you",
    label: "People who will speak for you",
    helper: "Name, where they work, and how to reach them.",
  },
  {
    id: "ninetyDayGoal",
    key: "ninety_day_goal",
    part: "jobs",
    mbType: "long-text",
    priority: 1,
    ask: "What would a win look like in the next three months?",
    addPrompt: "Add what a win looks like",
  },
  {
    id: "bestFirstOpportunity",
    key: "best_first_opportunity",
    part: "jobs",
    mbType: "long-text",
    priority: 2,
    ask: "What would the ideal first contract be?",
    addPrompt: "Add your ideal first contract",
  },
  {
    id: "anythingElse",
    key: "anything_else",
    part: "jobs",
    mbType: "long-text",
    priority: 3,
    ask: "Is there anything else your mentor should know?",
    addPrompt: "Add anything else",
  },
  {
    id: "pastPerformanceDocs",
    key: "doc_past_performance",
    part: "jobs",
    mbType: "file",
    priority: 3,
    addPrompt: "Upload past performance papers",
  },

  // ══ 5 · YOUR PAPERS ═══════════════════════════════════════════════════════
  {
    /* Hazard 6: free text on disk, `Paper[]` on the record. Lifted with NO
       `expiresAt`, so a legacy row can never fire a false renewal. */
    id: "insuranceCoverages",
    key: "insurance_coverage",
    part: "papers",
    mbType: "papers",
    priority: 1,
    ask: "Do you have insurance for the business?",
    addPrompt: "Add your insurance",
    /* GAP-FILL, not a restatement: the registry gives this key a label and
       nothing else, so it opened as a bare box and a member had no way to know
       whether "yes", a kind of cover, an amount or an insurer's name was
       wanted. The helper is the placeholder IN that box, so it is an example of
       the answer rather than an instruction about it. What the record cannot
       take here is the expiry — see GOAL.md's known gap 11. */
    helper: "General liability, $1 million. Not sure is a fine answer.",
    whyItMatters: "A buyer asks to see your insurance before the work starts.",
  },
  {
    id: "businessLicense",
    key: "licenses",
    part: "papers",
    mbType: "papers",
    priority: 2,
    ask: "Do you have a license to trade?",
    addPrompt: "Add your license",
    /* GAP-FILL — same bare registry row, same reasoning as above. */
    helper: "Business license, issued by your city or county. None yet is a fine answer.",
    whyItMatters: "Some work can only go to a business that holds the right license.",
  },
  {
    id: "healthPermits",
    key: "health_permits",
    part: "papers",
    mbType: "papers",
    priority: 1,
    ask: "Do you have a health permit for your kitchen?",
    addPrompt: "Add your health permit",
    scope: "sled",
    trade: "food",
    label: "Your health permit, for every kitchen you use",
    helper: "One per kitchen. A photo of the certificate is fine.",
    whyItMatters: "A school cannot buy food from a kitchen with no permit.",
  },
  {
    id: "foodManagerCertifications",
    key: "food_manager_certifications",
    part: "papers",
    mbType: "papers",
    priority: 2,
    ask: "Do you have a food safety certificate?",
    addPrompt: "Add your food safety certificate",
    term: "ServSafe Manager",
    trade: "food",
    label: "Your food safety certificate for managers",
    helper: "One for each person who runs a kitchen.",
  },
  {
    id: "foodHandlerCards",
    key: "food_handler_cards",
    part: "papers",
    mbType: "papers",
    priority: 3,
    addPrompt: "Add your staff food handler cards",
    trade: "food",
    label: "Food handler cards for your staff",
  },
  {
    id: "haccpPlan",
    key: "doc_haccp_plan",
    part: "papers",
    mbType: "file",
    priority: 3,
    addPrompt: "Upload your food safety plan",
    term: "HACCP plan",
    trade: "food",
    label: "Your written food safety plan",
    helper: "Most federal food work asks for one. It must match your menus.",
  },
  {
    id: "allergenPlan",
    key: "doc_allergen_plan",
    part: "papers",
    mbType: "file",
    priority: 3,
    addPrompt: "Upload your allergy plan",
    scope: "sled",
    trade: "food",
    label: "How you handle food allergies",
    helper: "How you label them, and how you keep foods apart.",
  },
  {
    id: "healthInspectionScore",
    key: "health_inspection_score",
    part: "papers",
    mbType: "text",
    priority: 3,
    addPrompt: "Add your last health inspection",
    trade: "food",
    label: "Your last health inspection",
    helper: "The score and the date.",
  },
  {
    id: "backgroundChecks",
    key: "background_checks",
    part: "papers",
    mbType: "choice",
    priority: 3,
    addPrompt: "Add whether you run background checks",
    scope: "sled",
    trade: "food",
    label: "Background checks on staff who go into schools",
    helper: "Some states require this by law.",
    options: [
      { value: "yes", label: "We run them" },
      { value: "no", label: "We do not run them" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "stateDiversityCertifications",
    key: "state_diversity_certifications",
    part: "papers",
    mbType: "papers",
    priority: 2,
    addPrompt: "Add state and county programs",
    scope: "sled",
    label: "State and county programs you qualify for",
    helper: "These are separate from the federal ones, with their own dates.",
  },
  {
    id: "w9Form",
    key: "doc_w9",
    part: "papers",
    mbType: "file",
    priority: 3,
    addPrompt: "Upload your tax form",
    term: "Form W-9",
    label: "Your tax form for buyers",
    helper: "Almost every buyer asks for this before your first invoice.",
  },
  {
    id: "taxReturns",
    key: "doc_tax_returns",
    part: "papers",
    mbType: "file",
    priority: 3,
    addPrompt: "Upload your tax returns",
    scope: "sled",
    label: "Your tax returns for the last three years",
    helper: "Only shared when a buyer asks. Never shown publicly.",
    whyItMatters: "School districts score this, and ask for three years.",
  },
];

/**
 * Diana's fourteen: the questions a mentor reads before the first call.
 *
 * THE RECORD'S OWN CONTRACT, in the order she is asked. It is not `/intake`'s
 * `required` set — see this file's header for what borrowing that cost. A key
 * here that no catalog row carries is a typo, and the guard test says so.
 */
export const BEFORE_FIRST_CALL: readonly string[] = [
  "primary_contact_name",
  "email",
  "phone",
  "legal_company_name",
  "website",
  "primary_industry",
  "primary_services",
  "geographic_coverage",
  "service_to_sell_to_government",
  "years_of_experience",
  "past_performance",
  "socioeconomic_certifications",
  "sam_registration_status",
  "ninety_day_goal",
];

/** The counter's fixed denominator. Fourteen, and never widened by a form. */
export const BEFORE_FIRST_CALL_TOTAL = BEFORE_FIRST_CALL.length;

/**
 * How many of the fourteen she has answered — the Basic Info milestone.
 *
 * ONE FUNCTION, SO THE TWO SURFACES CANNOT DISAGREE. The business page and the
 * tasks page were counting different sets: the page counted `answeredCount`
 * (the intake form's SIXTEEN) and divided it by `BEFORE_FIRST_CALL_TOTAL`
 * (fourteen), so a member who filled in her postal address and T-shirt size
 * would have been shown "16 of 14"; the tasks page counted sixteen and needed
 * sixteen, so its task could never tick while the page beside it said
 * "Basic Info — all in".
 *
 * `home_address` and `tshirt_size` are required by /intake for the welcome
 * pack, and they are not part of what a mentor reads before the first call.
 * That distinction is the whole reason `BEFORE_FIRST_CALL` exists.
 */
export function basicInfoAnswered(
  rows: Array<{ fieldKey: string; state: string }>,
): number {
  return countAnswered(rows, BEFORE_FIRST_CALL);
}

/** The catalog, with `intake` derived. The only export anything should read. */
export const CATALOG: CatalogField[] = AUTHORED.map((f) => ({
  ...f,
  intake: f.key !== null && BEFORE_FIRST_CALL.includes(f.key),
}));

export const FIELDS_BY_ID: Record<string, CatalogField> = Object.fromEntries(
  CATALOG.map((f) => [f.id, f] as const),
);

/** Every `ProfileField` key this row owns — its own plus its `alsoKeys`. */
export function keysOf(field: CatalogField): string[] {
  return [...(field.key ? [field.key] : []), ...(field.alsoKeys ?? [])];
}

const BY_KEY: Map<string, CatalogField> = new Map(
  CATALOG.flatMap((f) => keysOf(f).map((k) => [k, f] as const)),
);

/** The row a stored `ProfileField` renders inside — including the four
 *  `LEGACY_KEYS` and `can_get_bonding`, which resolve to their host row. */
export function catalogFor(fieldKey: string): CatalogField | undefined {
  return BY_KEY.get(fieldKey);
}

/** `ProfileField.tier` — the stored mirror of `priority`. */
export type Tier = "T1" | "T2" | "T3";

/**
 * The tier `upsertProfileField` stamps on the row, for SQL and BI only — app
 * code reads `priority` off the catalog. A LEGACY_KEY inherits the tier of the
 * row it folds into (that is what `catalogFor` resolves), and a key with no
 * catalog home at all is `null`: an unclassifiable row must not be given a
 * guessed tier that a query would then trust.
 */
export function tierFor(fieldKey: string): Tier | null {
  const field = catalogFor(fieldKey);
  return field ? (`T${field.priority}` as Tier) : null;
}

/** The rows of one part, in authored order. */
export function fieldsIn(part: PartId): CatalogField[] {
  return CATALOG.filter((f) => f.part === part);
}

export interface CatalogCopy {
  label: string;
  helper?: string;
  whyItMatters?: string;
  options?: RegistryOption[];
}

/**
 * THE ANTI-DRIFT ACCESSOR, and the rule it now applies: INHERIT WHEN THE
 * REGISTRY HAS IT, SUPPLY WHEN IT DOES NOT — line by line, never wholesale.
 *
 * The rule it USED to apply was "inherit, full stop": one registry entry meant
 * every line came from the registry and the catalog's own were ignored. That
 * left `insurance_coverage`, `licenses` and `security_clearances` — registry
 * rows with a label and nothing else — opening as a bare text box with no
 * helper, no example and no hint, and no way to fix it except editing
 * `registry.ts`, which is the `/intake` contract and a public site.
 *
 * What has NOT changed is the half that matters: the registry always wins where
 * it has a line, so the catalog can fill a gap but can never restate or
 * override — restating is how the two files drift. The guard test in
 * `catalog.test.ts` enforces it at the source, and the `??` order here is what
 * makes an override inert even if one is ever authored.
 */
export function copyFor(field: CatalogField): CatalogCopy {
  const reg = field.key ? fieldDef(field.key) : undefined;
  return {
    label: reg?.label ?? field.label ?? field.id,
    helper: reg?.helper ?? field.helper,
    whyItMatters: reg?.whyItMatters ?? field.whyItMatters,
    options: reg?.options ?? field.options,
  };
}

/**
 * The row that owns this key, or null when the key is folded into another one.
 *
 * `catalogFor("can_get_bonding")` resolves to the `bonding_capacity` row, whose
 * `mbType` is `text` for the OTHER question on it, so a caller that wants the
 * row's own type has to know it asked about the row and not a lodger.
 */
export function ownRow(fieldKey: string): CatalogField | null {
  const field = catalogFor(fieldKey);
  return field && field.key === fieldKey ? field : null;
}

/**
 * The row as `parseMbValue` reads it: its type, and the options she was shown.
 *
 * Lives here rather than beside either caller because the two callers are the
 * two halves of one rule — `rowEditor` decides what she is OFFERED and
 * `storedValue` decides what the record ACCEPTS. Two copies of this projection
 * is a way for the editor and the validator to disagree about the same row,
 * with no type error anywhere and a valid answer refused as the symptom.
 */
export function specOf(field: CatalogField): MbFieldSpec {
  return {
    id: field.id,
    mbType: field.mbType,
    options: copyFor(field).options,
    optionsFrom: field.optionsFrom,
  };
}

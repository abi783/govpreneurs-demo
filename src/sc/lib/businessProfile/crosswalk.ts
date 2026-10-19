/**
 * crosswalk.ts — where the two vocabularies meet, and where the permanent sets
 * are pinned. ENTITY LAYER.
 *
 * FILLED BY F4 (`CATALOG_ID_SNAPSHOT` only — everything else is frame).
 *
 * Two vocabularies exist and neither is going away:
 *   · `ProfileField.fieldKey` — snake_case, on disk, keyed by live member rows,
 *     shared with `/intake`. ADD, NEVER RENAME. A rename is data loss.
 *   · the catalog `id` — camelCase, the vocabulary `govpreneures` and the
 *     prototype use for the same 75 fields.
 *
 * THE PAIRING IS AUTHORED ON THE CATALOG ROW (`id` + `key`, one line, side by
 * side) because a second authored table is exactly how two lists drift. This
 * module is the only place the mapping is EXPOSED: every consumer that needs a
 * translation imports it from here and never rebuilds it from `CATALOG`.
 *
 * It also owns the two frozen sets that make silent divergence a failing test
 * rather than a support ticket.
 */

import { CATALOG, keysOf } from "./catalog";
import { hasOwnKey } from "./untrustedInput";

/**
 * THE PERMANENCE PIN — all 39 keys live in `ProfileField` today, read from
 * `registry.ts` on 2026-08-14. F4's guard test asserts this list equals
 * `REGISTRY.map(f => f.key)` exactly. A failing assert means someone renamed a
 * key: that is data loss, not a refactor, and the fix is to put the key back.
 */
export const FROZEN_KEYS: readonly string[] = [
  // Diana's fourteen
  "primary_contact_name",
  "email",
  "phone",
  "legal_company_name",
  // Added 2026-08-26/27 and frozen the moment they shipped: the pin means
  // "the registry owns this key and it must never be renamed", not a date.
  // This list is asserted to equal REGISTRY order, so they sit where the
  // registry declares them, not at the end.
  "company_email",
  "company_phone",
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
  // the other twenty-five
  "company_address",
  "home_address",
  "tshirt_size",
  "year_started_operating",
  "dba_name",
  "primary_contact_title",
  "business_description",
  "current_customer_types",
  "service_delivery_mode",
  "past_performance_2",
  "past_performance_3",
  "sectors_served",
  "has_active_commercial_contracts",
  "has_capability_statement",
  "pursuing_as",
  "bonding_capacity",
  "insurance_coverage",
  "licenses",
  "security_clearances",
  "best_first_opportunity",
  "constraints",
  "anything_else",
  "doc_capability_statement",
  "doc_certifications",
  "doc_past_performance",
  "doc_brochure",
  "doc_marketing",
];

/**
 * Still asked by `/intake`, folded into a record row rather than given one of
 * their own. Each MUST appear in exactly one catalog row's `alsoKeys` — F4
 * asserts it. They keep their `ProfileField` rows forever; the record simply
 * renders them inside their host.
 */
export const LEGACY_KEYS: readonly string[] = [
  "past_performance_2",
  "past_performance_3",
  "has_capability_statement",
  "doc_certifications",
];

/**
 * Catalog rows backed by NO `ProfileField` key — they live on `SuccessCenter`
 * columns (`mainContactPhotoUrl`, `companyLogoUrl`) and the portal home writes
 * the same columns. NOTE: these are catalog **ids**, not field keys; the name
 * is the one GOAL.md uses and is kept for that reason.
 *
 * The ids are the ones the prototype and `govpreneures` both use — the shorter
 * `photo` / `logo` sketched in the frame would have been a third vocabulary for
 * two rows, and `CATALOG_ID_SNAPSHOT` would not have matched either repo.
 */
export const VIRTUAL_KEYS: readonly string[] = ["profilePhoto", "businessLogo"];

/**
 * THE GAP-7 GUARD — a checked-in snapshot of the 75 camelCase catalog ids.
 * Nothing verifies Success Center's catalog against
 * `govpreneures/backend/src/profile-record/catalog.ts`, the other consumer of
 * the same 75 fields. This snapshot plus F4's test is the cheapest available
 * defence: changing the catalog without updating the snapshot fails the suite,
 * which forces the author to notice the cross-repo contract exists.
 *
 * 79 ids, sorted, copied from the authored catalog. The first 75 were verified
 * identical to the `govpreneures` backend catalog's own 75 ids on 2026-08-14;
 * `homeAddress` and `tshirtSize` were added here on 2026-08-26 and exist on
 * this side only until that repo adds them.
 */
export const CATALOG_ID_SNAPSHOT: readonly string[] = [
  "activeContracts",
  "allergenPlan",
  "annualReceipts",
  "anythingElse",
  "backgroundChecks",
  "bestFirstOpportunity",
  "bondingCapability",
  "brochure",
  "businessLicense",
  "businessLogo",
  "businessPhoneNumber",
  "businessSummary",
  "cage",
  "capabilityStatement",
  "commodityCodes",
  "companyEmail",
  "companyPhone",
  "concurrentContractCapacity",
  "constraints",
  "coreCapabilities",
  "customerTypes",
  "dbaName",
  "deliveryModes",
  "differentiators",
  "ein",
  "entityType",
  "equipment",
  "facilities",
  "foodHandlerCards",
  "foodManagerCertifications",
  "formationDate",
  "geographicPreference",
  "haccpPlan",
  "healthInspectionScore",
  "healthPermits",
  "homeAddress",
  "insuranceCoverages",
  "keyPersonnel",
  "keywordsSkills",
  "legalName",
  "lineOfCredit",
  "llcPaperwork",
  "lostBids",
  "marketingMaterial",
  "maxDailyOutput",
  "menusAndPricing",
  "naicsCodes",
  "ninetyDayGoal",
  "ownerCitizenship",
  "owners",
  "pastPerformance",
  "pastPerformanceDocs",
  "paymentTermsTolerance",
  "physicalAddress",
  "primaryContactEmail",
  "primaryContactName",
  "primaryContactTitle",
  "professionalReferences",
  "profilePhoto",
  "proposalSupport",
  "pscCodes",
  "publicSectorExperience",
  "pursuingAs",
  "samBusinessTypes",
  "samRegistration",
  "sectorsServed",
  "securityClearances",
  "serviceToSell",
  "sizeStatus",
  "sledRegistrations",
  "stateDiversityCertifications",
  "taxReturns",
  "totalEmployeesW2",
  "tshirtSize",
  "uei",
  "w9Form",
  "website",
  "workingCapital",
  "yearsInBusiness",
];

/** catalog id → `ProfileField.fieldKey`. Absent for the two virtual rows. */
export const KEY_BY_CATALOG_ID: Record<string, string> = Object.fromEntries(
  CATALOG.filter((f) => f.key !== null).map((f) => [f.id, f.key as string] as const),
);

/** `ProfileField.fieldKey` → catalog id. Includes `alsoKeys`, so a legacy key
 *  resolves to the id of the row it renders inside. */
export const CATALOG_ID_BY_KEY: Record<string, string> = Object.fromEntries(
  CATALOG.flatMap((f) => keysOf(f).map((k) => [k, f.id] as const)),
);

export function catalogIdFor(fieldKey: string): string | undefined {
  return CATALOG_ID_BY_KEY[fieldKey];
}

export function fieldKeyFor(catalogId: string): string | undefined {
  return KEY_BY_CATALOG_ID[catalogId];
}

/**
 * THE 78-KEY GATE. Every `ProfileField.fieldKey` this app may write: the 39
 * frozen keys plus every key the catalog owns (its own and its `alsoKeys`).
 *
 * WHY THIS EXISTS, AND IT IS EASY TO MISS. The member `PUT` route currently
 * validates the path segment with `fieldDef(fieldKey)` — i.e. against the 39
 * registry keys. The moment the catalog adds 38 new keys, every one of them
 * would 400 on save. F7/F12 must move that gate to `isKnownFieldKey`.
 */
export function isKnownFieldKey(fieldKey: string): boolean {
  return FROZEN_KEYS.includes(fieldKey) || hasOwnKey(CATALOG_ID_BY_KEY, fieldKey);
}

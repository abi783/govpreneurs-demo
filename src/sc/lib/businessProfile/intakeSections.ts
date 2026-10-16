/**
 * intakeSections.ts — how the Basic Info screen groups its questions.
 * ENTITY LAYER: pure, no Prisma, no React.
 *
 * A FORM'S SECTIONS, NOT THE RECORD'S PARTS. The screen used to group the
 * fourteen by the part that holds each one, which meant its card headings
 * repeated the rail's destinations — "Your legal details" over the questions on
 * a screen the rail already calls "Basic Info". The record's parts answer
 * "where does this fact live"; a form's sections answer "what am I being asked
 * about now", and those are different questions.
 *
 * These are the source design's own sections and its own copy, ported as-is.
 * Membership is by CATALOG ID, which both products share — the ids in this file
 * are the same strings `catalog.ts` declares.
 *
 * A section with none of the asked questions in it renders nothing at all, so
 * this list can name a field the screen is not currently asking for without
 * leaving an empty card behind.
 */

/** One group of questions on the Basic Info screen. */
export interface IntakeSection {
  id: string;
  title: string;
  /** The one line saying why this group is asked. */
  note: string;
  /** Catalog ids, in the order the section asks them. */
  fields: readonly string[];
}

export const INTAKE_SECTIONS: readonly IntakeSection[] = [
  {
    id: "company",
    title: "Your company",
    note: "The basics your mentor reads first.",
    fields: [
      "primaryContactName",
      "primaryContactEmail",
      "businessPhoneNumber",
      "legalName",
      "website",
      "physicalAddress",
      "formationDate",
      "dbaName",
      "primaryContactTitle",
    ],
  },
  {
    id: "whatyoudo",
    title: "What you do",
    note: "The work, in your own words.",
    fields: [
      "naicsCodes",
      "coreCapabilities",
      "geographicPreference",
      "serviceToSell",
      "businessSummary",
      "customerTypes",
      "deliveryModes",
    ],
  },
  {
    id: "experience",
    title: "Experience",
    note: "What you have done before. Commercial work counts.",
    fields: ["yearsInBusiness", "pastPerformance", "sectorsServed", "activeContracts"],
  },
  {
    id: "federal",
    title: "Federal readiness",
    note: "Where you stand today. No answer here is wrong.",
    fields: [
      "samBusinessTypes",
      "samRegistration",
      "pursuingAs",
      "bondingCapability",
      "insuranceCoverages",
      "businessLicense",
      "securityClearances",
    ],
  },
  {
    id: "goals",
    title: "Goals",
    note: "What a win looks like in the next 90 days.",
    fields: ["ninetyDayGoal", "bestFirstOpportunity", "constraints", "anythingElse"],
  },
];

/**
 * Which section a catalog id belongs to, or `undefined` for one no section
 * names.
 *
 * Built once from the list above, so a field cannot be in two sections without
 * the second silently winning — the first section that names it owns it.
 */
const SECTION_BY_FIELD: ReadonlyMap<string, IntakeSection> = new Map(
  INTAKE_SECTIONS.flatMap((section) =>
    section.fields.map((id) => [id, section] as const),
  ),
);

export function sectionForField(catalogId: string): IntakeSection | undefined {
  return SECTION_BY_FIELD.get(catalogId);
}

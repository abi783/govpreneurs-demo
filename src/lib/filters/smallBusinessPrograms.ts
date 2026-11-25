// Set-asides and certifications: one list for the Awards and the Partners filters.
//
// Measured on production (read-only sample, 19 Nov 2026):
// - hg_awards.type_of_set_aside holds 20 values, written as "<name> (<code>)", for example
//   "Small Business Set Aside - Total (SBA)". 87% of awards have no set-aside.
// - hg_awardees.bus_type_info holds about 90 business types, each with `cert_flag` (true when
//   the SBA certified it). This file keeps the ones that are a certification or an ownership
//   status. It leaves out the kind of organisation (LLC, nonprofit, city, university).
// - hg_awardees has no size status, so "small business" is not a company certification here.
//
// The codes and names come from the FPDS set-aside list and the SAM business types. The plain
// labels match the Opportunities filter (frontend-v2 src/lib/setAsideTaxonomy.ts).

import { isSoleSource } from "../awardsApi";

/** One choice in a filter: a plain label, and the official term shown small under it. */
export interface ProgramChoice<Id extends string = string> {
  id: Id;
  label: string;
  term?: string;
}

// ── awards: who could bid ──────────────────────────────────────────────────

export type SetAsideId =
  | "open"
  | "sb"
  | "8a"
  | "hubzone"
  | "wosb"
  | "edwosb"
  | "sdvosb"
  | "vosb"
  | "native";

export interface SetAsideChoice extends ProgramChoice<SetAsideId> {
  /** The FPDS codes that the choice covers, sole-source codes included. */
  codes: string[];
  /** The award window's "Who could bid" answer. */
  only: string;
}

export const SET_ASIDE_CHOICES: SetAsideChoice[] = [
  { id: "open", label: "Not set aside", codes: ["NONE"], only: "Any firm" },
  // Total, partial, reserved, emerging, very small, and local area (disaster) set-asides.
  {
    id: "sb",
    label: "Small business",
    codes: ["SBA", "SBP", "RSB", "ESB", "VSB", "LAS"],
    only: "Small firms only",
  },
  {
    id: "8a",
    label: "Business development program",
    term: "8(a)",
    codes: ["8A", "8AN", "HS3"],
    only: "Small firms in the business development program only",
  },
  {
    id: "hubzone",
    label: "Low-income area",
    term: "HUBZone",
    // HS3 is 8(a) with a HUBZone preference, so it is in both choices.
    codes: ["HZC", "HZS", "HS3"],
    only: "Small firms based in low-income areas only",
  },
  {
    id: "wosb",
    label: "Woman-owned",
    term: "WOSB",
    codes: ["WOSB", "WOSBSS"],
    only: "Woman-owned small firms only",
  },
  {
    id: "edwosb",
    label: "Disadvantaged woman-owned",
    term: "EDWOSB",
    codes: ["EDWOSB", "EDWOSBSS"],
    only: "Disadvantaged woman-owned small firms only",
  },
  {
    id: "sdvosb",
    label: "Disabled veteran-owned",
    term: "SDVOSB",
    codes: ["SDVOSBC", "SDVOSBS"],
    only: "Disabled veteran-owned small firms only",
  },
  // VA only (Veterans First).
  {
    id: "vosb",
    label: "Veteran-owned",
    term: "VOSB",
    codes: ["VSA", "VSS"],
    only: "Veteran-owned small firms only",
  },
  {
    id: "native",
    label: "Native American-owned",
    term: "Indian Economic Enterprise, Buy Indian",
    codes: ["ISBEE", "IEE", "BI", "BICIV"],
    only: "Native American-owned firms only",
  },
];

/** The code at the end of a set-aside value: "Hubzone Set-Aside (HZC)" gives "HZC". */
export function setAsideCode(value: string | null | undefined): string {
  if (!value?.trim()) return "NONE";
  const m = value.match(/\(([A-Za-z0-9]+)\)\s*$/);
  return (m ? m[1] : value).toUpperCase();
}

/** The filter choice for a set-aside value. An unknown code counts as small business. */
export function setAsideChoice(value: string | null | undefined): SetAsideChoice {
  const code = setAsideCode(value);
  return SET_ASIDE_CHOICES.find((c) => c.codes.includes(code)) ?? SET_ASIDE_CHOICES[1];
}

/**
 * Who could bid, in plain words. "Small firms only, for part of the job" for a partial
 * set-aside (SBP). An award with no set-aside that the buyer gave to one firm without a
 * competition says so: "Any firm" would be false there.
 */
export function whoCouldBid(
  value: string | null | undefined,
  extentCompeted?: string | null,
): { value: string; term?: string } {
  const choice = setAsideChoice(value);
  if (choice.id === "open" && isSoleSource(extentCompeted ?? null)) {
    return { value: "One firm, chosen by the buyer" };
  }
  const part = setAsideCode(value) === "SBP" ? ", for part of the job" : "";
  return { value: choice.only + part, term: choice.term };
}

// ── partners: certifications ───────────────────────────────────────────────

export interface CertChoice extends ProgramChoice {
  /** The bus_type_description values that it covers, as SAM writes them. */
  types: string[];
}

export interface CertGroup {
  title: string;
  choices: CertChoice[];
}

/** Four groups, so a long list stays easy to scan. */
export const CERT_GROUPS: CertGroup[] = [
  {
    title: "Small business programs",
    choices: [
      {
        id: "8a",
        label: "Business development program",
        term: "8(a)",
        types: ["8(a) Active", "8(a) Joint Venture"],
      },
      {
        id: "hubzone",
        label: "Low-income area",
        term: "HUBZone",
        types: ["HUBZone", "Self-Certified HUBZone Joint Venture"],
      },
      {
        id: "wosb",
        label: "Woman-owned small business",
        term: "WOSB",
        types: [
          "Woman Owned Small Business",
          "Certified Women-Owned Small Business",
          "Joint Venture Women Owned Small Business",
        ],
      },
      {
        id: "edwosb",
        label: "Disadvantaged woman-owned",
        term: "EDWOSB",
        types: [
          "Economically Disadvantaged Women Small Owned Business",
          "Certified Economically Disadvantaged Women-Owned Small Business",
          "Joint Venture Economically Disadvantaged Women Small Owned Business",
        ],
      },
      {
        id: "sdvosb",
        label: "Disabled veteran-owned",
        term: "SDVOSB",
        types: [
          "Service Disabled Veteran Owned Small Business",
          "Service Disabled Veteran Owned Business",
        ],
      },
      {
        id: "vosb",
        label: "Veteran-owned",
        term: "VOSB",
        types: ["Veteran Owned Business", "Veteran Joint Venture"],
      },
      {
        id: "sdb",
        label: "Small disadvantaged business",
        term: "SDB",
        types: ["Self-Certified Small Disadvantaged Business"],
      },
    ],
  },
  {
    title: "Native American and tribal",
    choices: [
      {
        id: "native",
        label: "Native American-owned",
        term: "Indian Economic Enterprise",
        types: [
          "Native American Owned",
          "American Indian Owned",
          "Indian Economic Enterprise",
          "Indian Small Business Economic Enterprise",
        ],
      },
      {
        id: "anc",
        label: "Alaska Native Corporation",
        term: "ANC",
        types: ["Alaskan Native Corporation Owned Firm"],
      },
      {
        id: "tribal",
        label: "Tribally owned",
        types: ["Tribally Owned Firm", "Indian Tribe (Federally Recognized)"],
      },
      {
        id: "nho",
        label: "Native Hawaiian Organization",
        term: "NHO",
        types: ["Native Hawaiian Organization Owned Firm"],
      },
    ],
  },
  {
    title: "Ownership",
    choices: [
      { id: "minority", label: "Minority-owned", types: ["Minority Owned Business"] },
      { id: "black", label: "Black American-owned", types: ["Black American Owned"] },
      { id: "hispanic", label: "Hispanic American-owned", types: ["Hispanic American Owned"] },
      {
        id: "asian",
        label: "Asian-Pacific American-owned",
        types: ["Asian-Pacific American Owned"],
      },
      {
        id: "subcontinent",
        label: "Subcontinent Asian American-owned",
        types: ["Subcontinent Asian (Asian-Indian) American Owned"],
      },
      { id: "woman", label: "Woman-owned, any size", types: ["Woman Owned Business"] },
      {
        id: "cdc",
        label: "Community development corporation",
        types: [
          "Community Development Corporation Owned Firm",
          "Community Development Corporation",
        ],
      },
      {
        id: "abilityone",
        label: "Employs people who are blind or disabled",
        term: "AbilityOne",
        types: ["AbilityOne Non Profit Agency"],
      },
    ],
  },
  {
    title: "Other certifications",
    choices: [
      {
        id: "dbe",
        label: "Disadvantaged business, for transportation work",
        term: "DOT DBE",
        types: ["DOT Certified Disadvantaged Business Enterprise (DBE)"],
      },
      { id: "iso", label: "Quality management", term: "ISO 9000", types: ["ISO-9000 Series"] },
      {
        id: "milq",
        label: "Military quality standards",
        term: "MIL-Q-9858, MIL-STD-45662A, ANSI/ASQC Z1.4",
        types: ["MIL-Q-9858", "MIL-STD-45662A", "ANSI/ASQC Z1.4"],
      },
    ],
  },
];

export const CERT_CHOICES: CertChoice[] = CERT_GROUPS.flatMap((g) => g.choices);

const norm = (s: string) => s.trim().toLowerCase();
const CERT_BY_TYPE = new Map(
  CERT_CHOICES.flatMap((c) => c.types.map((t) => [norm(t), c] as const)),
);

/** The certification choice for a SAM business type, or undefined when it is not one. */
export const certChoice = (busType: string): CertChoice | undefined =>
  CERT_BY_TYPE.get(norm(busType));

/** The certification ids of a company, without repeats. */
export const certIds = (busTypes: string[] | undefined): string[] => [
  ...new Set(
    (busTypes ?? []).map((t) => certChoice(t)?.id).filter((id): id is string => Boolean(id)),
  ),
];

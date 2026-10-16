// Two-level set-aside taxonomy for the onboarding wizard (Step 3), ported
// from the govpreneurs-v2 reference (`src/lib/mock/setAsideTaxonomy.ts` on
// origin/pr10), derived from "GovPreneurs Data Inputs Mapping Set Aside v3.csv".
//
//   Level 1 = Category (what the business IS — the qualification a non-expert
//             recognizes, e.g. "Service-Disabled Veteran-Owned Small Business").
//   Level 2 = the specific set-aside program codes under it (the Set-Aside and
//             Sole-Source variants) — for advanced users who know the codes.
//
// A non-expert checks the category and gets every code under it (and therefore
// every relevant opportunity); an expert expands and unchecks specific codes.
//
// "Full and Open Competition (No Set-Aside)" is intentionally EXCLUDED here per
// the CSV rule ("Do not show this option in Create/Edit Profile pages; DO
// include it in the Filters page"). It is a filter concept, not a qualification.
//
// Some codes intentionally repeat across categories (the Native-American
// programs also appear under Alaska Native Corporation and Tribally Owned
// Business) — faithful to the source. Child ids are namespaced by category
// (`${categoryId}::${code}`, via treeSelection's `childId`) so a code selected
// under one category is independent of the same code under another.
//
// Codes are aligned against the production `CERT_LABELS` code space
// (lib/businessProfile.tsx) where they overlap (SDVOSBC/SDVOSBS/HZC/HZS/
// WOSBSS/EDWOSBSS/8A/8AN etc.). Codes the reference has that CERT_LABELS
// lacks (SBA, ESB, LAS, SBP, VSA, VSS, IEE, ISBEE, BI, BICiv) are kept as-is —
// they are official SAM set-aside/sole-source codes, not firm certifications,
// so there is no cert-label equivalent to align to.

export type SetAsideKind = "set_aside" | "sole_source";

export type SetAsideCode = {
  code: string; // official SAM set-aside code, e.g. "SDVOSBC"
  label: string; // human description
  kind: SetAsideKind;
};

export type SetAsideCategory = {
  id: string;
  label: string;
  section: "core" | "native_tribal"; // group header the category sits under
  codes: SetAsideCode[];
};

const SA = (code: string, label: string): SetAsideCode => ({ code, label, kind: "set_aside" });
const SS = (code: string, label: string): SetAsideCode => ({ code, label, kind: "sole_source" });

export const SET_ASIDE_CATEGORIES: SetAsideCategory[] = [
  {
    id: "small_business",
    label: "Small Business",
    section: "core",
    codes: [
      SA("SBA", "Total Small Business Set-Aside"),
      SA("ESB", "Emerging Small Business Set-Aside"),
      SA("LAS", "Local Area Set-Aside (Stafford Act)"),
    ],
  },
  {
    id: "partial_sb",
    label: "Partial Small Business",
    section: "core",
    codes: [SA("SBP", "Partial Small Business Set-Aside")],
  },
  {
    id: "eight_a",
    label: "8(a) Business Development",
    section: "core",
    codes: [SA("8A", "8(a) Competed"), SS("8AN", "8(a) Sole Source")],
  },
  {
    id: "hubzone",
    label: "HUBZone",
    section: "core",
    codes: [SA("HZC", "HUBZone Set-Aside"), SS("HZS", "HUBZone Sole Source")],
  },
  {
    id: "wosb",
    label: "Women-Owned Small Business",
    section: "core",
    codes: [
      SA("WOSB", "Women-Owned Small Business (WOSB) Program Set-Aside"),
      SS("WOSBSS", "Women-Owned Small Business (WOSB) Program Sole Source"),
    ],
  },
  {
    id: "edwosb",
    label: "Economically Disadvantaged Women-Owned Small Business",
    section: "core",
    codes: [
      SA("EDWOSB", "Economically Disadvantaged WOSB (EDWOSB) Program Set-Aside"),
      SS("EDWOSBSS", "Economically Disadvantaged WOSB (EDWOSB) Program Sole Source"),
    ],
  },
  {
    id: "sdvosb",
    label: "Service-Disabled Veteran-Owned Small Business",
    section: "core",
    codes: [
      SA("SDVOSBC", "Service-Disabled Veteran-Owned Small Business Set-Aside"),
      SS("SDVOSBS", "Service-Disabled Veteran-Owned Small Business Sole Source"),
    ],
  },
  {
    id: "vosb",
    label: "Veteran-Owned Small Business",
    section: "core",
    codes: [SA("VSA", "Veteran Set-Aside"), SS("VSS", "Veteran Sole Source")],
  },
  {
    id: "iee",
    label: "Native American / Indian Economic Enterprise",
    section: "native_tribal",
    codes: [SA("IEE", "Indian Economic Enterprise Set-Aside")],
  },
  {
    id: "isbee",
    label: "Indian Small Business Economic Enterprise",
    section: "native_tribal",
    codes: [SA("ISBEE", "Indian Small Business Economic Enterprise Set-Aside")],
  },
  {
    id: "buy_indian",
    label: "Buy Indian Act",
    section: "native_tribal",
    codes: [SA("BI", "Buy Indian Set-Aside"), SA("BICiv", "Buy Indian Set-Aside (Civilian / HHS)")],
  },
  {
    id: "alaska_native",
    label: "Alaska Native Corporation",
    section: "native_tribal",
    codes: [
      SA("8A", "8(a) Competed"),
      SS("8AN", "8(a) Sole Source"),
      SA("IEE", "Indian Economic Enterprise Set-Aside"),
      SA("ISBEE", "Indian Small Business Economic Enterprise Set-Aside"),
      SA("BI", "Buy Indian Set-Aside"),
      SA("BICiv", "Buy Indian Set-Aside (Civilian / HHS)"),
    ],
  },
  {
    id: "tribally_owned",
    label: "Tribally Owned Business",
    section: "native_tribal",
    codes: [
      SA("8A", "8(a) Competed"),
      SS("8AN", "8(a) Sole Source"),
      SA("IEE", "Indian Economic Enterprise Set-Aside"),
      SA("ISBEE", "Indian Small Business Economic Enterprise Set-Aside"),
      SA("BI", "Buy Indian Set-Aside"),
      SA("BICiv", "Buy Indian Set-Aside (Civilian / HHS)"),
    ],
  },
];

export const SET_ASIDE_SECTION_LABEL: Record<SetAsideCategory["section"], string> = {
  core: "Ownership & programs",
  native_tribal: "Native American & Tribal",
};

/**
 * Maps each category id into the production 7-token `SET_ASIDES` vocab
 * (`VOSB, SB, 8A, WOSB, HUBZone, NATIVE_TRIBAL, FULL_OPEN` — see
 * lib/mock/govTaxonomy.ts). There is no separate `SDVOSB` filter token in
 * production (unlike the reference, which assumes one) — production's single
 * `VOSB` bucket covers both VOSB and SDVOSB per its label "VOSB / SDVOSB", so
 * both the `sdvosb` and `vosb` categories map to `["VOSB"]`. All native_tribal
 * categories map to `["NATIVE_TRIBAL"]`. `FULL_OPEN` is never emitted here —
 * it is a filter-only concept, not a profile qualification.
 */
export const SET_ASIDE_CATEGORY_TO_FILTER: Record<string, string[]> = {
  small_business: ["SB"],
  partial_sb: ["SB"],
  eight_a: ["8A"],
  hubzone: ["HUBZone"],
  wosb: ["WOSB"],
  edwosb: ["WOSB"],
  sdvosb: ["VOSB"],
  vosb: ["VOSB"],
  iee: ["NATIVE_TRIBAL"],
  isbee: ["NATIVE_TRIBAL"],
  buy_indian: ["NATIVE_TRIBAL"],
  alaska_native: ["NATIVE_TRIBAL"],
  tribally_owned: ["NATIVE_TRIBAL"],
};

export function setAsideCategoryById(id: string): SetAsideCategory | undefined {
  return SET_ASIDE_CATEGORIES.find((c) => c.id === id);
}

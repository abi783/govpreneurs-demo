/**
 * Two-level set-aside taxonomy, PORTED VERBATIM from Hunter (frontend-v2)'s
 * `src/lib/setAsideTaxonomy.ts` — see that file's header for the full
 * derivation ("GovPreneurs Data Inputs Mapping Set Aside v3.csv").
 *
 *   Level 1 = Category (what the business IS — the qualification a
 *             non-expert recognizes, e.g. "Service-Disabled Veteran-Owned
 *             Small Business").
 *   Level 2 = the specific set-aside program codes under it (Set-Aside and
 *             Sole-Source variants) — for advanced users who know the codes.
 *
 * "Full and Open Competition (No Set-Aside)" is intentionally excluded — a
 * filter concept, not a profile qualification.
 *
 * `SET_ASIDE_CATEGORY_TO_SC_SLUG` (below `SET_ASIDE_CATEGORIES`) is new here,
 * not in Hunter: it maps each category to SC's own `CERT_OPTIONS` slugs
 * (registry.ts) for persistence, since SC's cert field stores those 11 slugs
 * rather than Hunter's 7-token filter vocab.
 */

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

export function setAsideCategoryById(id: string): SetAsideCategory | undefined {
  return SET_ASIDE_CATEGORIES.find((c) => c.id === id);
}

/**
 * Category id -> SC's `CERT_OPTIONS` slug (registry.ts). Built by comparing
 * this file's 13 categories against SC's 9 real cert slugs (`vosb, sdvosb,
 * wosb, edwosb, eight_a, hubzone, minority, sdb, dobe` — `none`/`not_sure`
 * are exclusive quick-picks, not tree categories, handled separately).
 *
 * Categories omitted here have no SC slug and are dropped from the saved
 * payload if selected (tree selection still works locally; it just doesn't
 * persist a cert): `small_business`, `partial_sb` (no small-business-generic
 * slug — SC's list starts at named socio-economic statuses), `iee`, `isbee`,
 * `buy_indian`, `alaska_native`, `tribally_owned` (no native/tribal slug in
 * CERT_OPTIONS at all — closest analog `minority` is deliberately NOT
 * inferred here, since Native American ownership and "minority-owned" are
 * legally distinct statuses and conflating them would misrepresent the
 * member on a federal set-aside claim).
 */
export const SET_ASIDE_CATEGORY_TO_SC_SLUG: Record<string, string> = {
  eight_a: "eight_a",
  hubzone: "hubzone",
  wosb: "wosb",
  edwosb: "edwosb",
  sdvosb: "sdvosb",
  vosb: "vosb",
  /* Success Center's own three, declared as categories in `treeData.ts` rather
     than above — the taxonomy is Hunter's verbatim and these are not in it.
     They were answerable on `/intake` and unreachable in the record's picker. */
  minority: "minority",
  sdb: "sdb",
  dobe: "dobe",
  /* The two collapsed categories `treeData.ts` builds, named as Hunter names
     them so a member's answer reaches the matcher instead of reading as null. */
  small_biz: "small_biz",
  native_tribal: "native_tribal",
};

/* EVERY CATEGORY THE PICKER OFFERS NOW HAS A SLUG, and each slug has exactly
 * one category. `small_biz` and `native_tribal` are Hunter's own canonical
 * names (`relevance/set-aside-canonical.ts`), and `treeData.ts` collapses the
 * taxonomy categories they cover into one parent apiece — `small_business` and
 * `partial_sb` into the first, the five Buy Indian / IEE / ISBEE / Alaska
 * Native / tribally-owned categories into the second.
 *
 * ONE CATEGORY PER SLUG IS A REQUIREMENT, NOT A PREFERENCE.
 * `selectionFromCertSlugs` reverse-looks-up slug to category, so two categories
 * sharing a slug would store correctly and read back with both ticked. That is
 * why the collapse happens in the tree rather than as a many-to-one entry here.
 */

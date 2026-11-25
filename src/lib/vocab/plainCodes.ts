// Plain words for the government's codes and short descriptions. One place, so the cards,
// the windows, the filters and the search all say the same thing.
//
// The official name stays available: show it small, under the plain words (the acronym rule).
// A code that is not in a list falls back to its official name in sentence case.

import { sentenceCase } from "../format";

/** Short names for NAICS codes (kinds of work). */
const NAICS_PLAIN: Record<string, string> = {
  "236220": "Building construction",
  "238160": "Roofing",
  "238210": "Electrical work",
  "238220": "Heating, air-conditioning and plumbing",
  "238320": "Painting",
  "238910": "Site preparation",
  "311811": "Bakeries",
  "423440": "Kitchen equipment supply",
  "423740": "Refrigeration supply",
  "424410": "Grocery wholesale",
  "424470": "Meat wholesale",
  "424480": "Fresh produce wholesale",
  "484110": "Local trucking",
  "492210": "Local delivery",
  "493120": "Cold storage",
  "561320": "Temporary staffing",
  "561710": "Pest control",
  "561720": "Janitorial services",
  "561730": "Landscaping",
  "561740": "Carpet cleaning",
  "562111": "Trash collection",
  "562991": "Septic and grease trap service",
  "722310": "Food service",
  "722320": "Catering",
  "722514": "Cafeterias",
  "722515": "Coffee and snack bars",
  "811310": "Equipment repair",
  "812332": "Laundry and linen service",
};

/** Short names for PSC codes (what was bought). */
const PSC_PLAIN: Record<string, string> = {
  "8905": "Meat, poultry and fish",
  "8915": "Fruits and vegetables",
  J041: "Repair of heating, cooling and refrigeration equipment",
  J073: "Repair of kitchen equipment",
  S201: "Cleaning",
  S203: "Food service",
  S207: "Pest control",
  S222: "Waste treatment",
};

/** The plain name of a kind of work. */
export const plainNaics = (code: string | null | undefined, official?: string | null): string =>
  (code && NAICS_PLAIN[code]) || sentenceCase(official ?? code ?? "");

/** The plain name of what was bought. */
export const plainPsc = (code: string | null | undefined, official?: string | null): string =>
  (code && PSC_PLAIN[code]) || sentenceCase(official ?? code ?? "");

/** How the price is set, in plain words (type_of_contract_pricing). */
export function plainPricing(pricing: string | null | undefined): string {
  if (!pricing) return "";
  if (/economic price adjustment/i.test(pricing)) return "Fixed price that can change with costs";
  if (/firm fixed|^fixed price/i.test(pricing)) return "Fixed price (one set price)";
  if (/time and materials/i.test(pricing)) return "Paid by the hour, plus materials";
  if (/labor hours/i.test(pricing)) return "Paid by the hour";
  if (/cost plus|cost-plus|cost reimburs/i.test(pricing)) return "Costs paid, plus a fee";
  return sentenceCase(pricing);
}

// ── the short descriptions on award records ────────────────────────────────

/** Abbreviations that the records use, and their words. */
const EXPAND: Record<string, string> = {
  SVC: "Service",
  SVCS: "Services",
  BLDG: "Building",
  FED: "Federal",
  MAINT: "Maintenance",
  OPS: "Operations",
  PT: "Point",
  SE: "Southeast",
  DFAC: "Dining Facility",
  DFACS: "Dining Facilities",
  IPM: "Pest Management",
  PM: "Preventive Maintenance",
  CBOC: "Outpatient Clinic",
};

/** Names and programs that stay in capitals. */
const KEEP = new Set("HVAC IDIQ AFB AAF MCAS MCLB VA NC SC GA US GSA DPW JOC II III IV".split(" "));

const SMALL = new Set("and of for the in at to a on with or".split(" "));

/**
 * "GALLEY SUPPORT SVCS MCAS CHERRY PT" becomes "Galley Support Services MCAS Cherry Point".
 * The records are in capitals, so we cannot tell a place name from an ordinary word. Title
 * case keeps place names readable. Known abbreviations are spelled out.
 */
export function plainDescription(text: string | null | undefined): string {
  if (!text?.trim()) return "";
  return text
    .trim()
    .split(/\s+/)
    .map((w, i) => {
      const bare = w.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      if (EXPAND[bare]) return w.toUpperCase().replace(bare, EXPAND[bare]);
      if (KEEP.has(bare) || /\d/.test(bare)) return w.toUpperCase();
      const lower = w.toLowerCase();
      if (i > 0 && SMALL.has(lower)) return lower;
      return lower.replace(
        /(^|[-/])([a-z])/g,
        (_, sep: string, c: string) => sep + c.toUpperCase(),
      );
    })
    .join(" ");
}

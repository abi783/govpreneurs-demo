// Contract vehicles seed data — sample data, written for a food service business.
// DEMO: this file was written for a different sample member. It now says which vehicles fit
// Amira Haddad, a caterer in Fayetteville, NC (woman-owned, NAICS 722310).
// Some vehicles are real programs (GSA schedules, DLA programs). Others are sample
// names for contracts like the ones that exist at Fort Bragg, the VA and the Navy.

export type VehicleType = "IDIQ" | "GWAC" | "GSA MAS" | "BPA" | "MATOC" | "Program";

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  sponsor: string; // agency
  ceilingValue: number; // total ceiling in USD
  setAside: "Unrestricted" | "Total SB" | "SDVOSB" | "8(a)" | "WOSB" | "HUBZone";
  scope: string; // plain-English what it covers
  openToNewEntrants: "Open now" | "Closed — next on-ramp not announced" | "On-ramp expected" | "Closed";
  recompeteWindow?: string; // human readable, e.g. "FY27 Q2"
  /** True when the vehicle buys the kind of work Amira does (food service and catering). */
  fitsFood: boolean;
  fitReason: string; // plain-English why it fits or doesn't
  pursueLink?: { label: string; href: string };
}

export const VEHICLES: Vehicle[] = [
  // ── Fits a caterer ─────────────────────────────────────────────────
  {
    id: "veh-fortbragg-events-idiq",
    name: "Fort Bragg Small-Event Catering IDIQ (MICC)",
    type: "IDIQ",
    sponsor: "Army MICC, Fort Bragg",
    ceilingValue: 750_000,
    setAside: "WOSB",
    scope:
      "Order-as-needed catering for unit events, ceremonies and holiday meals across Fort Bragg. Orders run from a few thousand dollars to about $100K each.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Open request now",
    fitsFood: true,
    fitReason:
      "Direct match. It is kept for woman-owned firms, it is close to your kitchen, and the orders are the size of the events you cook. Quote this one.",
    pursueLink: { label: "See the open request", href: "/opportunities/W912PM-26-Q-0084" },
  },
  {
    id: "veh-va-nutrition-bpa",
    name: "VA Nutrition and Food Service BPA (Network 6)",
    type: "BPA",
    sponsor: "Department of Veterans Affairs",
    ceilingValue: 28_000_000,
    setAside: "Total SB",
    scope:
      "Patient meals, hospital kitchen support and retail dining at VA medical centers in North Carolina and Virginia. Calls against the agreement run from $50K to $2M.",
    openToNewEntrants: "On-ramp expected",
    recompeteWindow: "FY27 Q3",
    fitsFood: true,
    fitReason:
      "The VA is one of your three target buyers, and your Womack job proves you can run therapeutic diets. The VA tends to add vendors mid-cycle, so build the relationship now.",
    pursueLink: { label: "See the VA as a buyer", href: "/government-buyers?buyer=va-nco6" },
  },
  {
    id: "veh-navfac-galley-matoc",
    name: "NAVFAC Mid-Atlantic Galley Services MATOC (Small Business)",
    type: "MATOC",
    sponsor: "Navy / NAVFAC",
    ceilingValue: 95_000_000,
    setAside: "Total SB",
    scope:
      "Pool of pre-approved firms that compete for galley, mess attendant and dining hall task orders at Camp Lejeune, New River, Cherry Point and other Mid-Atlantic bases.",
    openToNewEntrants: "Closed — next on-ramp not announced",
    recompeteWindow: "FY28 Q1",
    fitsFood: true,
    fitReason:
      "Heavy food service work in North Carolina. It is closed today, and the bases are 100 miles or more from your kitchen. The practical route is to team with a firm that holds a seat.",
    pursueLink: { label: "See Camp Lejeune as a buyer", href: "/government-buyers?buyer=navfac-lejeune" },
  },
  {
    id: "veh-nc-term-catering",
    name: "NC Statewide Term Contract: Catering and Food Service",
    type: "BPA",
    sponsor: "NC Department of Administration",
    ceilingValue: 40_000_000,
    setAside: "Unrestricted",
    scope:
      "A state price list that NC agencies, universities and counties can buy from without running their own bid. Vendors apply when the state opens the list.",
    openToNewEntrants: "On-ramp expected",
    recompeteWindow: "FY27 Q4",
    fitsFood: true,
    fitReason:
      "One application puts you in front of many local buyers at once. You would be the right size, and North Carolina buyers are the ones nearest your kitchen.",
    pursueLink: { label: "See local buyers", href: "/government-buyers?near=nc" },
  },
  {
    id: "veh-gsa-mas-food",
    name: "GSA MAS: Facilities and Food Service Support",
    type: "GSA MAS",
    sponsor: "GSA",
    ceilingValue: 0, // GSA MAS has no fixed ceiling
    setAside: "Unrestricted",
    scope:
      "Government-wide schedule any agency can buy off. Food service and event support sit with the facilities services categories. Once you are on, buyers can place orders without a full request for proposals.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Continuous (rolling)",
    fitsFood: true,
    fitReason:
      "It accepts new offerors all year, and your past performance counts. It takes months and the first orders are slow. Treat it as a second step, after Fort Bragg and the VA.",
    pursueLink: { label: "Plan your next steps", href: "/roadmap" },
  },
  {
    id: "veh-sba-mentor-protege",
    name: "SBA Mentor-Protégé Program (teaming with a prime)",
    type: "Program",
    sponsor: "SBA",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "A small business partners with a larger firm that coaches it and can bid with it. The pair can bid as a team on work that is too big for the small firm alone.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Continuous (rolling)",
    fitsFood: true,
    fitReason:
      "Carolina Dining Group holds Fort Bragg dining and is looking for woman-owned subcontractors. A formal agreement would let you bid jobs near $2M a year together.",
    pursueLink: { label: "See Carolina Dining Group", href: "/partners?view=find&company=4001" },
  },

  // ── Worth knowing, not for you yet ─────────────────────────────────
  {
    id: "veh-dla-subsistence-pv",
    name: "DLA Troop Support Subsistence Prime Vendor Program",
    type: "Program",
    sponsor: "Defense Logistics Agency",
    ceilingValue: 8_000_000_000,
    setAside: "Unrestricted",
    scope:
      "Big distributors supply the food that military dining facilities cook with. The distributors hold the contracts, and the dining halls order from them.",
    openToNewEntrants: "Closed",
    recompeteWindow: "Varies by region",
    fitsFood: false,
    fitReason:
      "This buys food by the truckload, not meals. It is worth knowing because the dining halls you may cook in order from it. It is not a path for a caterer.",
  },
  {
    id: "veh-alliant-3",
    name: "GSA Alliant 3",
    type: "GWAC",
    sponsor: "GSA",
    ceilingValue: 75_000_000_000,
    setAside: "Unrestricted",
    scope: "Government-wide IT services and solutions: systems integration, cloud, cybersecurity.",
    openToNewEntrants: "Closed",
    fitsFood: false,
    fitReason: "IT services. Not a food service path.",
  },
  {
    id: "veh-sewp-vi",
    name: "NASA SEWP VI",
    type: "GWAC",
    sponsor: "NASA",
    ceilingValue: 90_000_000_000,
    setAside: "Unrestricted",
    scope:
      "Government-wide IT hardware, software and related services. Used by every agency for tech purchases.",
    openToNewEntrants: "Closed",
    recompeteWindow: "FY29",
    fitsFood: false,
    fitReason: "IT only. The ceiling is huge, but every order is for technology. Worth knowing the name exists.",
  },
  {
    id: "veh-oasis-plus",
    name: "GSA OASIS+",
    type: "IDIQ",
    sponsor: "GSA",
    ceilingValue: 60_000_000_000,
    setAside: "Unrestricted",
    scope: "Government-wide professional services: management consulting, engineering, research.",
    openToNewEntrants: "Open now",
    fitsFood: false,
    fitReason: "Professional services such as consulting and engineering studies. Not food service.",
  },
];

export function vehiclesByFit(vehicles: Vehicle[], fitsOnly: boolean): Vehicle[] {
  return fitsOnly ? vehicles.filter((v) => v.fitsFood) : vehicles;
}

export function formatCeiling(v: number): string {
  if (v <= 0) return "No fixed ceiling";
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(v % 1_000_000_000 === 0 ? 0 : 1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v}`;
}

export const VEHICLE_TYPE_GLOSS: Record<VehicleType, string> = {
  IDIQ:
    "Indefinite Delivery / Indefinite Quantity — a pre-approved contract the agency uses to order work as needed, up to a ceiling.",
  GWAC:
    "Government-Wide Acquisition Contract — usually IT-focused; any federal agency can buy from it.",
  "GSA MAS":
    "GSA Multiple Award Schedule — a long-term contract any agency can order from. It has categories for facilities and food service support.",
  BPA:
    "Blanket Purchase Agreement — a quick-ordering account for recurring needs, such as meals or catering.",
  MATOC:
    "Multiple Award Task Order Contract — a pool of pre-approved firms that compete only against each other for individual task orders.",
  Program:
    "A government program, not one contract. It sets rules for who can buy, who can team up, or how a group of contracts work.",
};

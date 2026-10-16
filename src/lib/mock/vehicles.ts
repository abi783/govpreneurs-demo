// Contract vehicles seed data — mock but realistic. Honest about
// which vehicles fit a NC roofing contractor and which don't.

export type VehicleType = "IDIQ" | "GWAC" | "GSA MAS" | "BPA" | "MATOC";

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  sponsor: string; // agency
  ceilingValue: number; // total ceiling in USD
  setAside: "Unrestricted" | "Total SB" | "SDVOSB" | "8(a)" | "WOSB" | "HUBZone";
  scope: string; // plain-English what it covers
  openToNewEntrants: "Open now" | "Closed — next on-ramp TBD" | "On-ramp expected" | "Closed";
  recompeteWindow?: string; // human readable, e.g. "FY27 Q2"
  fitsRoofing: boolean;
  fitReason: string; // plain-English why it fits or doesn't
  pursueLink?: { label: string; href: string };
}

export const VEHICLES: Vehicle[] = [
  // ── Fits a roofer ──────────────────────────────────────────────────
  {
    id: "veh-gsa-mas-facilities",
    name: "GSA MAS — Facilities (Subcategory: Roofing & Building Envelope)",
    type: "GSA MAS",
    sponsor: "GSA",
    ceilingValue: 0, // GSA MAS has no fixed ceiling
    setAside: "Unrestricted",
    scope:
      "Government-wide schedule any agency can buy off. Roofing falls under the Facilities category. Once you're on, federal buyers can place orders directly without a full RFP.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Continuous (rolling)",
    fitsRoofing: true,
    fitReason:
      "Direct match. The Facilities Schedule has a roofing & envelope subcategory and accepts new offerors year-round. Most realistic first vehicle for a roofer.",
    pursueLink: { label: "How to pursue GSA MAS", href: "/government-buyers" },
  },
  {
    id: "veh-usace-matoc-savannah",
    name: "USACE Savannah District MATOC — General Construction",
    type: "MATOC",
    sponsor: "USACE",
    ceilingValue: 495_000_000,
    setAside: "Total SB",
    scope:
      "Multiple-award construction pool for the SE region (NC, SC, GA, FL). Roofing shows up as task orders under base maintenance and renovation projects.",
    openToNewEntrants: "Closed — next on-ramp TBD",
    recompeteWindow: "FY28 Q1",
    fitsRoofing: true,
    fitReason:
      "Geography fits (covers NC) and construction scope includes roofing. Track the recompete and prepare paperwork early — these only re-open every 5 years.",
    pursueLink: { label: "See recompete in Forecasts", href: "/forecasts" },
  },
  {
    id: "veh-va-sdvosb-roofing",
    name: "VA SDVOSB Roofing & Envelope IDIQ (VISN 6)",
    type: "IDIQ",
    sponsor: "Department of Veterans Affairs",
    ceilingValue: 75_000_000,
    setAside: "SDVOSB",
    scope:
      "VA medical-center roofing repairs and replacements across NC and VA. Task orders typically $50K–$2M.",
    openToNewEntrants: "On-ramp expected",
    recompeteWindow: "FY27 Q2",
    fitsRoofing: true,
    fitReason:
      "This one is built for you — SDVOSB-only, roofing scope, NC included. The VA tends to do on-ramps mid-cycle. Worth building the relationship now.",
    pursueLink: { label: "See VA in Forecasts", href: "/forecasts" },
  },
  {
    id: "veh-navfac-macc-southeast",
    name: "NAVFAC Mid-Atlantic MACC — Small Business",
    type: "MATOC",
    sponsor: "Navy / NAVFAC",
    ceilingValue: 240_000_000,
    setAside: "Total SB",
    scope:
      "Multiple Award Construction Contract for Navy/Marine installations including Camp Lejeune and Cherry Point. Roofing rolls under R&M task orders.",
    openToNewEntrants: "Closed",
    recompeteWindow: "FY29 Q4",
    fitsRoofing: true,
    fitReason:
      "Heavy work base in NC. Currently closed but recompete is a known target — start positioning via teaming with current MACC holders.",
    pursueLink: { label: "See incumbents in Awarded", href: "/opportunities" },
  },
  {
    id: "veh-army-jocs-bragg",
    name: "Fort Bragg JOC — Job Order Contract",
    type: "IDIQ",
    sponsor: "USACE (Wilmington District)",
    ceilingValue: 95_000_000,
    setAside: "Total SB",
    scope:
      "On-call construction & repair contract for Fort Bragg. Small individual jobs ($25K–$750K), high frequency, includes roofing repairs.",
    openToNewEntrants: "Closed",
    recompeteWindow: "FY27 Q4",
    fitsRoofing: true,
    fitReason:
      "Perfect size for a small roofer. Closed today but recompete window is reachable — get NC license + bonding ready in the meantime.",
    pursueLink: { label: "Get ready checklist", href: "/roadmap" },
  },
  {
    id: "veh-gsa-bpa-roofing-region4",
    name: "GSA Region 4 Roofing BPA",
    type: "BPA",
    sponsor: "GSA PBS Region 4",
    ceilingValue: 18_000_000,
    setAside: "Total SB",
    scope:
      "Blanket Purchase Agreement for federal building roof repairs in the Southeast. Quick-turn task orders against GSA MAS holders.",
    openToNewEntrants: "On-ramp expected",
    recompeteWindow: "FY26 Q4",
    fitsRoofing: true,
    fitReason:
      "Built on top of GSA MAS — so step 1 is getting on the Schedule. Then GSA can add you to this BPA at the next refresh.",
    pursueLink: { label: "How to pursue GSA MAS", href: "/government-buyers" },
  },

  // ── IT vehicles — not for you yet ─────────────────────────────────
  {
    id: "veh-sewp-vi",
    name: "NASA SEWP VI",
    type: "GWAC",
    sponsor: "NASA",
    ceilingValue: 90_000_000_000,
    setAside: "Unrestricted",
    scope:
      "Government-wide IT hardware, software, and related services. Used by every agency for tech procurement.",
    openToNewEntrants: "Closed",
    recompeteWindow: "FY29",
    fitsRoofing: false,
    fitReason:
      "IT-only. Massive ceiling, but every task order is for tech — not construction. Worth knowing the name exists.",
  },
  {
    id: "veh-alliant-3",
    name: "GSA Alliant 3",
    type: "GWAC",
    sponsor: "GSA",
    ceilingValue: 75_000_000_000,
    setAside: "Unrestricted",
    scope: "Government-wide IT services and solutions — systems integration, cloud, cybersecurity.",
    openToNewEntrants: "Closed",
    fitsRoofing: false,
    fitReason: "IT services. Not a roofing path.",
  },
  {
    id: "veh-cio-sp4",
    name: "NIH CIO-SP4",
    type: "GWAC",
    sponsor: "NIH NITAAC",
    ceilingValue: 50_000_000_000,
    setAside: "Unrestricted",
    scope: "Government-wide IT and health-IT services.",
    openToNewEntrants: "Closed",
    fitsRoofing: false,
    fitReason: "IT/health-IT services. Not for construction.",
  },
  {
    id: "veh-vets-2",
    name: "GSA VETS 2",
    type: "GWAC",
    sponsor: "GSA",
    ceilingValue: 5_000_000_000,
    setAside: "SDVOSB",
    scope: "Government-wide IT services — SDVOSB-only.",
    openToNewEntrants: "Closed",
    fitsRoofing: false,
    fitReason:
      "SDVOSB-only sounds like a fit — but the scope is strictly IT services. Worth recognizing the name, not your path.",
  },
  {
    id: "veh-polaris",
    name: "GSA Polaris",
    type: "GWAC",
    sponsor: "GSA",
    ceilingValue: 50_000_000_000,
    setAside: "Total SB",
    scope: "Small-business government-wide IT services.",
    openToNewEntrants: "Closed",
    fitsRoofing: false,
    fitReason: "IT services for small businesses. Not construction.",
  },
  {
    id: "veh-oasis-plus",
    name: "GSA OASIS+",
    type: "IDIQ",
    sponsor: "GSA",
    ceilingValue: 60_000_000_000,
    setAside: "Unrestricted",
    scope: "Government-wide professional services — management consulting, engineering, R&D.",
    openToNewEntrants: "Open now",
    fitsRoofing: false,
    fitReason:
      "Professional services (consulting, engineering studies). Not construction trades.",
  },
];

export function vehiclesByFit(vehicles: Vehicle[], fitsOnly: boolean): Vehicle[] {
  return fitsOnly ? vehicles.filter((v) => v.fitsRoofing) : vehicles;
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
    "GSA Multiple Award Schedule — a long-term contract any agency can order from. Has subcategories like Facilities/Roofing.",
  BPA:
    "Blanket Purchase Agreement — a quick-ordering account built on top of an existing schedule for recurring needs.",
  MATOC:
    "Multiple Award Task Order Contract — a pool of pre-approved firms that compete only against each other for individual task orders.",
};

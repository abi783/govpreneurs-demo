// DEMO (Hunter): the NAICS and PSC code lists behind GET /naics/* and GET /psc/search.
//
// NAICS (North American Industry Classification System) names the kind of
// business. PSC (Product and Service Code) names what the government buys. The
// real backend holds both lists in full. The demo holds the codes that the story
// uses, the codes of every trade in the Filters drawer, and the common codes
// that a visitor may type, so a search always finds something real.
//
// The member's own codes sit first in every result list. The list leaves out
// the trade code of the old sample member, because it is not this member's business.

import { PERSONA } from "../story/persona";
import { VOCAB } from "./vocab";

export interface CodeRow {
  code: string;
  description: string;
}

const NAICS: CodeRow[] = [
  // Food service and accommodation: the member's own lane
  { code: "722310", description: "Food Service Contractors" },
  { code: "722320", description: "Caterers" },
  { code: "722330", description: "Mobile Food Services" },
  { code: "722410", description: "Drinking Places (Alcoholic Beverages)" },
  { code: "722511", description: "Full-Service Restaurants" },
  { code: "722513", description: "Limited-Service Restaurants" },
  { code: "722514", description: "Cafeterias, Grill Buffets, and Buffets" },
  { code: "722515", description: "Snack and Nonalcoholic Beverage Bars" },
  { code: "721110", description: "Hotels (except Casino Hotels) and Motels" },
  { code: "721120", description: "Casino Hotels" },
  { code: "721191", description: "Bed-and-Breakfast Inns" },
  { code: "721199", description: "All Other Traveler Accommodation" },
  { code: "721211", description: "RV (Recreational Vehicle) Parks and Campgrounds" },
  { code: "721214", description: "Recreational and Vacation Camps (except Campgrounds)" },
  { code: "721310", description: "Rooming and Boarding Houses, Dormitories, and Workers' Camps" },
  // Food manufacturing and distribution
  { code: "311991", description: "Perishable Prepared Food Manufacturing" },
  { code: "311812", description: "Commercial Bakeries" },
  { code: "311811", description: "Retail Bakeries" },
  { code: "311999", description: "All Other Miscellaneous Food Manufacturing" },
  { code: "311612", description: "Meat Processed from Carcasses" },
  { code: "311423", description: "Dried and Dehydrated Food Manufacturing" },
  { code: "312111", description: "Soft Drink Manufacturing" },
  { code: "312112", description: "Bottled Water Manufacturing" },
  {
    code: "423430",
    description: "Computer and Computer Peripheral Equipment and Software Merchant Wholesalers",
  },
  { code: "424410", description: "General Line Grocery Merchant Wholesalers" },
  { code: "424420", description: "Packaged Frozen Food Merchant Wholesalers" },
  { code: "424430", description: "Dairy Product (except Dried or Canned) Merchant Wholesalers" },
  { code: "424450", description: "Confectionery Merchant Wholesalers" },
  { code: "424490", description: "Other Grocery and Related Products Merchant Wholesalers" },
  {
    code: "445110",
    description: "Supermarkets and Other Grocery Retailers (except Convenience Retailers)",
  },
  // Facilities and business support
  { code: "561210", description: "Facilities Support Services" },
  { code: "561110", description: "Office Administrative Services" },
  { code: "561310", description: "Employment Placement Agencies" },
  { code: "561320", description: "Temporary Help Services" },
  { code: "561330", description: "Professional Employer Organizations" },
  { code: "561410", description: "Document Preparation Services" },
  { code: "561421", description: "Telephone Answering Services" },
  { code: "561422", description: "Telemarketing Bureaus and Other Contact Centers" },
  { code: "561499", description: "All Other Business Support Services" },
  { code: "561612", description: "Security Guards and Patrol Services" },
  { code: "561621", description: "Security Systems Services (except Locksmiths)" },
  { code: "561710", description: "Exterminating and Pest Control Services" },
  { code: "561720", description: "Janitorial Services" },
  { code: "561730", description: "Landscaping Services" },
  { code: "561740", description: "Carpet and Upholstery Cleaning Services" },
  { code: "561790", description: "Other Services to Buildings and Dwellings" },
  { code: "561920", description: "Convention and Trade Show Organizers" },
  { code: "562111", description: "Solid Waste Collection" },
  { code: "562119", description: "Other Waste Collection" },
  { code: "562211", description: "Hazardous Waste Treatment and Disposal" },
  { code: "562910", description: "Remediation Services" },
  { code: "562991", description: "Septic Tank and Related Services" },
  { code: "812320", description: "Drycleaning and Laundry Services (except Coin-Operated)" },
  { code: "812332", description: "Industrial Launderers" },
  // Professional services
  { code: "541110", description: "Offices of Lawyers" },
  { code: "541199", description: "All Other Legal Services" },
  { code: "541211", description: "Offices of Certified Public Accountants" },
  { code: "541330", description: "Engineering Services" },
  { code: "541370", description: "Surveying and Mapping (except Geophysical) Services" },
  { code: "541380", description: "Testing Laboratories and Services" },
  { code: "541511", description: "Custom Computer Programming Services" },
  { code: "541512", description: "Computer Systems Design Services" },
  { code: "541513", description: "Computer Facilities Management Services" },
  { code: "541519", description: "Other Computer Related Services" },
  {
    code: "541611",
    description: "Administrative Management and General Management Consulting Services",
  },
  { code: "541612", description: "Human Resources Consulting Services" },
  {
    code: "541614",
    description: "Process, Physical Distribution, and Logistics Consulting Services",
  },
  { code: "541618", description: "Other Management Consulting Services" },
  { code: "541690", description: "Other Scientific and Technical Consulting Services" },
  {
    code: "541715",
    description: "Research and Development in the Physical, Engineering, and Life Sciences",
  },
  // Advertising, marketing and media: the agency's lane
  { code: "541810", description: "Advertising Agencies" },
  { code: "541820", description: "Public Relations Agencies" },
  { code: "541613", description: "Marketing Consulting Services" },
  { code: "541430", description: "Graphic Design Services" },
  { code: "541490", description: "Other Specialized Design Services" },
  { code: "541830", description: "Media Buying Agencies" },
  { code: "541840", description: "Media Representatives" },
  { code: "541850", description: "Indoor and Outdoor Display Advertising" },
  { code: "541860", description: "Direct Mail Advertising" },
  { code: "541870", description: "Advertising Material Distribution Services" },
  { code: "541890", description: "Other Services Related to Advertising" },
  { code: "541910", description: "Marketing Research and Public Opinion Polling" },
  { code: "541921", description: "Photography Studios, Portrait" },
  { code: "541922", description: "Commercial Photography" },
  { code: "512110", description: "Motion Picture and Video Production" },
  { code: "512191", description: "Teleproduction and Other Postproduction Services" },
  { code: "323111", description: "Commercial Printing (except Screen and Books)" },
  { code: "541930", description: "Translation and Interpretation Services" },
  { code: "541990", description: "All Other Professional, Scientific, and Technical Services" },
  {
    code: "518210",
    description:
      "Computing Infrastructure Providers, Data Processing, Web Hosting, and Related Services",
  },
  { code: "517111", description: "Wired Telecommunications Carriers" },
  { code: "517112", description: "Wireless Telecommunications Carriers (except Satellite)" },
  // Construction (building trades other than the member's)
  {
    code: "236115",
    description: "New Single-Family Housing Construction (except For-Sale Builders)",
  },
  {
    code: "236116",
    description: "New Multifamily Housing Construction (except For-Sale Builders)",
  },
  { code: "236117", description: "New Housing For-Sale Builders" },
  { code: "236118", description: "Residential Remodelers" },
  { code: "236210", description: "Industrial Building Construction" },
  { code: "236220", description: "Commercial and Institutional Building Construction" },
  { code: "237110", description: "Water and Sewer Line and Related Structures Construction" },
  {
    code: "237130",
    description: "Power and Communication Line and Related Structures Construction",
  },
  { code: "237310", description: "Highway, Street, and Bridge Construction" },
  { code: "237990", description: "Other Heavy and Civil Engineering Construction" },
  { code: "238110", description: "Poured Concrete Foundation and Structure Contractors" },
  { code: "238120", description: "Structural Steel and Precast Concrete Contractors" },
  { code: "238130", description: "Framing Contractors" },
  { code: "238140", description: "Masonry Contractors" },
  { code: "238150", description: "Glass and Glazing Contractors" },
  { code: "238170", description: "Siding Contractors" },
  { code: "238190", description: "Other Foundation, Structure, and Building Exterior Contractors" },
  {
    code: "238210",
    description: "Electrical Contractors and Other Wiring Installation Contractors",
  },
  { code: "238220", description: "Plumbing, Heating, and Air-Conditioning Contractors" },
  { code: "238290", description: "Other Building Equipment Contractors" },
  { code: "238310", description: "Drywall and Insulation Contractors" },
  { code: "238320", description: "Painting and Wall Covering Contractors" },
  { code: "238330", description: "Flooring Contractors" },
  { code: "238340", description: "Tile and Terrazzo Contractors" },
  { code: "238350", description: "Finish Carpentry Contractors" },
  { code: "238390", description: "Other Building Finishing Contractors" },
  { code: "238910", description: "Site Preparation Contractors" },
  { code: "238990", description: "All Other Specialty Trade Contractors" },
  // Transport, health, education and repair
  { code: "484110", description: "General Freight Trucking, Local" },
  { code: "484121", description: "General Freight Trucking, Long-Distance, Truckload" },
  { code: "485410", description: "School and Employee Bus Transportation" },
  { code: "485991", description: "Special Needs Transportation" },
  { code: "488510", description: "Freight Transportation Arrangement" },
  { code: "492110", description: "Couriers and Express Delivery Services" },
  { code: "492210", description: "Local Messengers and Local Delivery" },
  { code: "493110", description: "General Warehousing and Storage" },
  { code: "621111", description: "Offices of Physicians (except Mental Health Specialists)" },
  { code: "621610", description: "Home Health Care Services" },
  { code: "622110", description: "General Medical and Surgical Hospitals" },
  { code: "623110", description: "Nursing Care Facilities (Skilled Nursing Facilities)" },
  { code: "624190", description: "Other Individual and Family Services" },
  { code: "624410", description: "Child Day Care Services" },
  { code: "611430", description: "Professional and Management Development Training" },
  { code: "611710", description: "Educational Support Services" },
  { code: "811111", description: "General Automotive Repair" },
  { code: "811210", description: "Electronic and Precision Equipment Repair and Maintenance" },
  {
    code: "811310",
    description:
      "Commercial and Industrial Machinery and Equipment (except Automotive and Electronic) Repair and Maintenance",
  },
  { code: "339113", description: "Surgical Appliance and Supplies Manufacturing" },
  { code: "334111", description: "Electronic Computer Manufacturing" },
  { code: "332311", description: "Prefabricated Metal Building and Component Manufacturing" },
];

const PSC: CodeRow[] = [
  // Food service: what the member's buyers write on the notice
  { code: "S203", description: "HOUSEKEEPING- FOOD" },
  { code: "8905", description: "MEAT, POULTRY, AND FISH" },
  { code: "8910", description: "DAIRY FOODS AND EGGS" },
  { code: "8915", description: "FRUITS AND VEGETABLES" },
  { code: "8920", description: "BAKERY AND CEREAL PRODUCTS" },
  { code: "8925", description: "SUGARS, CONFECTIONERY, AND NUTS" },
  { code: "8935", description: "SOUPS AND BOUILLONS" },
  { code: "8940", description: "SPECIAL DIETARY FOOD ITEMS" },
  { code: "8945", description: "FOOD OILS AND FATS" },
  { code: "8950", description: "CONDIMENTS AND RELATED PRODUCTS" },
  { code: "8955", description: "COFFEE, TEA, AND COCOA" },
  { code: "8960", description: "BEVERAGES, NONALCOHOLIC" },
  { code: "8965", description: "SUBSISTENCE PACKAGES" },
  { code: "8970", description: "COMPOSITE FOOD PACKAGES" },
  { code: "7310", description: "FOOD COOKING, BAKING, AND SERVING EQUIPMENT" },
  { code: "7320", description: "KITCHEN EQUIPMENT AND APPLIANCES" },
  { code: "7360", description: "SETS, KITS, AND OUTFITS: FOOD PREPARATION AND SERVING" },
  // Housekeeping and facility services
  { code: "S201", description: "HOUSEKEEPING- CUSTODIAL JANITORIAL" },
  { code: "S205", description: "HOUSEKEEPING- TRASH/GARBAGE COLLECTION" },
  { code: "S206", description: "HOUSEKEEPING- GUARD" },
  { code: "S207", description: "HOUSEKEEPING- INSECT/RODENT CONTROL" },
  { code: "S208", description: "HOUSEKEEPING- LANDSCAPING/GROUNDSKEEPING" },
  { code: "S209", description: "HOUSEKEEPING- LAUNDRY/DRY CLEANING" },
  { code: "S216", description: "HOUSEKEEPING- FACILITIES OPERATIONS SUPPORT" },
  // Advertising and media
  { code: "R701", description: "SUPPORT- MANAGEMENT: ADVERTISING" },
  { code: "R708", description: "SUPPORT- MANAGEMENT: PUBLIC RELATIONS" },
  { code: "T001", description: "PHOTO/MAP/PRINT/PUBLICATION- ARTS/GRAPHICS" },
  // Professional and administrative support
  { code: "R408", description: "SUPPORT- PROFESSIONAL: PROGRAM MANAGEMENT/SUPPORT" },
  { code: "R499", description: "SUPPORT- PROFESSIONAL: OTHER" },
  { code: "R699", description: "SUPPORT- ADMINISTRATIVE: OTHER" },
  { code: "R706", description: "SUPPORT- MANAGEMENT: LOGISTICS SUPPORT" },
  { code: "R707", description: "SUPPORT- MANAGEMENT: CONTRACT/PROCUREMENT/ACQUISITION SUPPORT" },
  { code: "R425", description: "SUPPORT- PROFESSIONAL: ENGINEERING/TECHNICAL" },
  { code: "R799", description: "SUPPORT- MANAGEMENT: OTHER" },
  { code: "U008", description: "EDUCATION/TRAINING- TRAINING/CURRICULUM DEVELOPMENT" },
  // IT
  { code: "D301", description: "IT AND TELECOM- FACILITY OPERATION AND MAINTENANCE" },
  { code: "D302", description: "IT AND TELECOM- SYSTEMS DEVELOPMENT" },
  { code: "D306", description: "IT AND TELECOM- SYSTEMS ANALYSIS" },
  { code: "D307", description: "IT AND TELECOM- IT STRATEGY AND ARCHITECTURE" },
  { code: "D310", description: "IT AND TELECOM- CYBER SECURITY AND DATA BACKUP" },
  { code: "D399", description: "IT AND TELECOM- OTHER IT AND TELECOMMUNICATIONS" },
  // Maintenance, lease, medical
  {
    code: "J065",
    description:
      "MAINTENANCE, REPAIR, REBUILDING OF EQUIPMENT: MEDICAL, DENTAL, AND VETERINARY EQUIPMENT",
  },
  { code: "J099", description: "MAINTENANCE, REPAIR, REBUILDING OF EQUIPMENT: MISCELLANEOUS" },
  {
    code: "W073",
    description: "LEASE OR RENTAL OF EQUIPMENT- FOOD PREPARATION AND SERVING EQUIPMENT",
  },
  { code: "Q201", description: "MEDICAL- GENERAL HEALTH CARE" },
  { code: "Q301", description: "MEDICAL- LABORATORY TESTING" },
  { code: "F999", description: "OTHER ENVIRONMENTAL SERVICES" },
  // Construction
  { code: "Y1AA", description: "CONSTRUCTION OF OFFICE BUILDINGS" },
  { code: "Z2AA", description: "REPAIR OR ALTERATION OF OFFICE BUILDINGS" },
  { code: "Z1JZ", description: "MAINTENANCE OF MISCELLANEOUS BUILDINGS/FACILITIES" },
  { code: "Z2JZ", description: "REPAIR OR ALTERATION OF MISCELLANEOUS BUILDINGS" },
  { code: "Y1JZ", description: "CONSTRUCTION OF MISCELLANEOUS BUILDINGS" },
  // Supplies
  { code: "5110", description: "HAND TOOLS, EDGED, NONPOWERED" },
  { code: "6515", description: "MEDICAL AND SURGICAL INSTRUMENTS, EQUIPMENT, AND SUPPLIES" },
  { code: "7030", description: "INFORMATION TECHNOLOGY SOFTWARE" },
  { code: "7110", description: "OFFICE FURNITURE" },
  { code: "7210", description: "HOUSEHOLD FURNISHINGS" },
  { code: "7930", description: "CLEANING AND POLISHING COMPOUNDS AND PREPARATIONS" },
  { code: "8405", description: "OUTERWEAR, MEN'S" },
];

const OWN_CODES = new Set<string>([
  PERSONA.primaryNaics,
  ...PERSONA.secondaryNaics.map((n) => n.code),
]);

const NAICS_BY_CODE = new Map(NAICS.map((r) => [r.code, r.description]));

/** The taxonomy's words for a code, or undefined for a code the list does not hold. */
export function naicsDescription(code: string): string | undefined {
  return NAICS_BY_CODE.get(code);
}

/** The rows for these codes. A code the list does not hold is left out. */
export function naicsDescriptions(codes: string[]): CodeRow[] {
  const rows: CodeRow[] = [];
  for (const code of codes) {
    const description = NAICS_BY_CODE.get(code.trim());
    if (description) rows.push({ code: code.trim(), description });
  }
  return rows;
}

/** Words a visitor types that the taxonomy writes another way. */
const ALIASES: Record<string, string[]> = {
  catering: ["caterers"],
  caterer: ["caterers"],
  meals: ["food service", "cafeterias", "caterers"],
  meal: ["food service", "cafeterias", "caterers"],
  dining: ["food service", "cafeterias", "restaurants"],
  cafeteria: ["cafeterias"],
  kitchen: ["food service", "caterers"],
  mess: ["food service"],
  chef: ["food service", "caterers"],
  food: ["food"],
  truck: ["mobile food", "trucking"],
  snack: ["snack"],
  bakery: ["bakeries"],
  cleaning: ["janitorial", "cleaning"],
  janitor: ["janitorial"],
  lawn: ["landscaping"],
  guard: ["security guards"],
  software: ["computer programming"],
  cyber: ["computer systems", "computer related"],
  lodging: ["hotels", "accommodation"],
  hotel: ["hotels"],
  // Marketing words
  ad: ["advertising"],
  ads: ["advertising"],
  marketing: ["marketing", "advertising"],
  branding: ["advertising", "marketing", "design"],
  campaign: ["advertising", "marketing"],
  video: ["video", "teleproduction"],
  film: ["motion picture", "video"],
  pr: ["public relations"],
  publicity: ["public relations"],
  graphics: ["graphic design"],
  logo: ["graphic design"],
  social: ["advertising", "marketing", "media"],
  media: ["media", "advertising", "marketing"],
  digital: ["advertising", "marketing"],
  billboard: ["outdoor display"],
  photo: ["photography"],
};

/** A word cut to its root, so "catering" and "caterers" meet at "cater". */
function stem(word: string): string {
  const w = word.toLowerCase();
  const cut = w.replace(/(ing|ers|er|es|s)$/, "");
  return cut.length >= 4 ? cut : w;
}

function tokens(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function scoreRow(row: CodeRow, queryTokens: string[]): number {
  const words = tokens(row.description);
  const wordStems = words.map(stem);
  let score = 0;
  for (const t of queryTokens) {
    const s = stem(t);
    const alias = (ALIASES[t] ?? []).some((a) => row.description.toLowerCase().includes(a));
    // A two-letter word ("pr", "ad") is an abbreviation, not the start of every word.
    const prefix =
      t.length > 2 &&
      (words.some((w) => w.startsWith(t)) || wordStems.some((w) => w.startsWith(s)));
    const inside = row.description.toLowerCase().includes(t);
    if (prefix) score += 3;
    else if (alias) score += 2;
    else if (inside && t.length >= 3) score += 1;
    else return 0;
  }
  return score;
}

function search(
  rows: CodeRow[],
  q: string,
  limit: number,
  boost: (r: CodeRow) => number,
): CodeRow[] {
  const query = q.trim();
  if (!query) return [];
  const lower = query.toLowerCase();
  const scored: { row: CodeRow; score: number }[] = [];
  const isCode = /^[0-9a-z]{2,6}$/i.test(query) && /\d/.test(query);
  for (const row of rows) {
    let score = 0;
    if (isCode && row.code.toLowerCase().startsWith(lower)) {
      score = 10 + (row.code.toLowerCase() === lower ? 5 : 0);
    } else {
      score = scoreRow(row, tokens(query));
    }
    if (score > 0) scored.push({ row, score: score + boost(row) });
  }
  scored.sort((a, b) => b.score - a.score || a.row.code.localeCompare(b.row.code));
  return scored.slice(0, limit).map((s) => s.row);
}

/** NAICS codes that match a code prefix or words. The member's own codes come first. */
export function searchNaics(q: string, limit = 20): CodeRow[] {
  return search(NAICS, q, limit, (r) =>
    r.code === PERSONA.primaryNaics ? 6 : OWN_CODES.has(r.code) ? 4 : 0,
  );
}

/** PSC codes that match a code prefix or words. The member's main code comes first. */
export function searchPsc(q: string, limit = 20): CodeRow[] {
  return search(PSC, q, limit, (r) => (r.code === VOCAB.mainPsc ? 4 : 0));
}

/** Every NAICS code the demo holds. The tests read it. */
export function allNaicsRows(): readonly CodeRow[] {
  return NAICS;
}

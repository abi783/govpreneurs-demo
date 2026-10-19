// DEMO: a small list of Product and Service Codes (PSC) for the PSC picker.
//
// The real picker reads about 2,340 codes from Hunter. The demo carries the groups and
// codes that matter for a food-service business and its neighbors (food, kitchen
// equipment, housekeeping and support services), so the tree, the search and the
// "code you already have" box all work. Titles follow the published PSC manual.

export type PscSegment = "product" | "service" | "randd";

export interface PscCode {
  code: string;
  description: string;
  segment: PscSegment;
  groupCode: string;
  groupTitle: string;
}

export interface PscGroupRow {
  groupCode: string;
  groupTitle: string;
  segment: PscSegment;
  category: string;
  count: number;
}

interface GroupDef {
  groupCode: string;
  groupTitle: string;
  segment: PscSegment;
  category: string;
  codes: [string, string][];
}

const GROUPS: GroupDef[] = [
  {
    groupCode: "S2",
    groupTitle: "Housekeeping Services",
    segment: "service",
    category: "Utilities and Housekeeping Services",
    codes: [
      ["S201", "Housekeeping- Custodial Janitorial"],
      ["S202", "Housekeeping- Fire Protection"],
      ["S203", "Housekeeping- Food"],
      ["S204", "Housekeeping- Gardening or Plant Maintenance Not Related to Agricultural Programs"],
      ["S205", "Housekeeping- Trash or Garbage Collection"],
      ["S206", "Housekeeping- Guard"],
      ["S207", "Housekeeping- Insect or Rodent Control"],
      ["S208", "Housekeeping- Landscaping or Groundskeeping"],
      ["S209", "Housekeeping- Laundry or Dry Cleaning"],
    ],
  },
  {
    groupCode: "S1",
    groupTitle: "Utilities",
    segment: "service",
    category: "Utilities and Housekeeping Services",
    codes: [
      ["S111", "Utilities- Gas"],
      ["S112", "Utilities- Electric"],
      ["S113", "Utilities- Water"],
    ],
  },
  {
    groupCode: "89",
    groupTitle: "Subsistence",
    segment: "product",
    category: "Subsistence",
    codes: [
      ["8905", "Meat, Poultry, and Fish"],
      ["8910", "Dairy Foods and Eggs"],
      ["8915", "Fruits and Vegetables"],
      ["8920", "Bakery and Cereal Products"],
      ["8925", "Sugar, Confectionery, and Nuts"],
      ["8930", "Jams, Jellies, and Syrups"],
      ["8935", "Soups and Bouillons"],
      ["8940", "Special Dietary Foods and Food Specialty Preparations"],
      ["8945", "Food Oils and Fats"],
      ["8950", "Condiments and Related Products"],
      ["8955", "Coffee, Tea, and Cocoa"],
      ["8960", "Beverages, Nonalcoholic"],
      ["8970", "Composite Food Packages"],
      ["8975", "Tobacco Products"],
      ["8980", "Subsistence Items, Not Elsewhere Classified"],
    ],
  },
  {
    groupCode: "73",
    groupTitle: "Food Preparation and Serving Equipment",
    segment: "product",
    category: "Food Preparation and Serving Equipment",
    codes: [
      ["7310", "Food Cooking, Baking, and Serving Equipment"],
      ["7320", "Kitchen Equipment and Appliances"],
      ["7330", "Kitchen Hand Tools and Utensils"],
      ["7340", "Cutlery and Flatware"],
      ["7350", "Tableware"],
      ["7360", "Sets, Kits, and Outfits: Food Preparation and Serving"],
    ],
  },
  {
    groupCode: "R4",
    groupTitle: "Support Services (Professional, Administrative, Management)",
    segment: "service",
    category: "Professional, Administrative and Management Support Services",
    codes: [
      ["R408", "Support- Professional: Program Management or Support"],
      ["R425", "Support- Professional: Engineering or Technical"],
      ["R499", "Support- Professional: Other"],
      ["R706", "Support- Management: Logistics Support"],
    ],
  },
  {
    groupCode: "Q5",
    groupTitle: "Medical Services",
    segment: "service",
    category: "Medical Services",
    codes: [
      ["Q501", "Medical- General Health Care"],
      ["Q999", "Medical- Other"],
    ],
  },
];

export const PSC_CODES: PscCode[] = GROUPS.flatMap((g) =>
  g.codes.map(([code, description]) => ({
    code,
    description,
    segment: g.segment,
    groupCode: g.groupCode,
    groupTitle: g.groupTitle,
  })),
);

export const PSC_GROUPS: PscGroupRow[] = GROUPS.map((g) => ({
  groupCode: g.groupCode,
  groupTitle: g.groupTitle,
  segment: g.segment,
  category: g.category,
  count: g.codes.length,
}));

/** Codes whose code or description holds every word of `q`. At most 20, best match first. */
export function searchPsc(q: string): PscCode[] {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const scored = PSC_CODES.flatMap((row) => {
    const hay = `${row.code} ${row.description} ${row.groupTitle}`.toLowerCase();
    if (!words.every((w) => hay.includes(w))) return [];
    const exact = row.code.toLowerCase() === q.trim().toLowerCase() ? 0 : row.code.toLowerCase().startsWith(words[0]!) ? 1 : 2;
    return [{ row, exact }];
  });
  scored.sort((a, b) => a.exact - b.exact || a.row.code.localeCompare(b.row.code));
  return scored.slice(0, 20).map((s) => s.row);
}

export function pscDescriptions(codes: string[]): PscCode[] {
  const wanted = new Set(codes.map((c) => c.toUpperCase()));
  return PSC_CODES.filter((row) => wanted.has(row.code.toUpperCase()));
}

export function pscGroupCodes(groupCode: string): PscCode[] {
  return PSC_CODES.filter((row) => row.groupCode === groupCode);
}

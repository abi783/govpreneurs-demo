// Small orders — the category taxonomy.
//
// The twelve categories she can pick, plus `other` for an order we could not
// classify. The backend maps a Federal Supply Group onto this list, so the
// taxonomy is live and it is not fixture data. It sat in
// `lib/mock/microPurchaseOrders.ts`, where the import path said `mock` about
// the live pipeline's own vocabulary.
//
// Layer: ENTITIES. This module imports nothing.

export type MicroCategory =
  // DEMO: three food-service categories for a caterer. Production has none.
  | "food-beverage"
  | "food-service-supplies"
  | "kitchen-equipment"
  | "fasteners"
  | "pipes-valves"
  | "wire-cable"
  | "bearings-seals"
  | "hand-tools"
  | "filters"
  | "hoses-belts"
  | "electrical"
  | "engine-parts"
  | "metal-stock"
  | "safety-gear"
  | "office-cleaning"
  // "other" is NOT in MICRO_CATEGORIES and she can never pick it. It is the
  // designed state for an order whose Federal Supply Class is null or is not in
  // our mapping (PRD 7.1). It exists so that "we could not classify this" is a
  // state the type can hold, instead of an order quietly falling out of every
  // board. Orders in it are excluded and COUNTED, never silently dropped.
  | "other";

export const MICRO_CATEGORIES: { id: MicroCategory; label: string; hint: string }[] = [
  // DEMO: the sample member is a caterer, so her three kinds of food-service
  // buy come first. The hardware categories stay below, as in production.
  { id: "food-beverage", label: "Food and drink", hint: "Meal pouches, rice, pasta, coffee, water" },
  {
    id: "food-service-supplies",
    label: "Serving and packaging supplies",
    hint: "Pans, trays, cups, napkins",
  },
  {
    id: "kitchen-equipment",
    label: "Kitchen and serving equipment",
    hint: "Food carriers, dispensers, utensils",
  },
  // Ordered by how likely a first-time reseller can actually source them.
  // Fasteners sit LOWER than instinct suggests: a defined population of FSG 53
  // stock numbers are Critical Safety Items carrying extra requirements for new
  // manufacturers, dealers and distributors (DLA supplier notice, Nov 2023).
  {
    id: "office-cleaning",
    label: "Office and cleaning supplies",
    hint: "Paper, soap, bags, tools",
  },
  { id: "hand-tools", label: "Hand tools", hint: "Wrenches, drivers, cutters" },
  { id: "safety-gear", label: "Safety gear and clothing", hint: "Gloves, glasses, boots" },
  { id: "filters", label: "Filters", hint: "Air, oil, fuel, water" },
  { id: "hoses-belts", label: "Hoses and belts", hint: "Rubber hose, drive belts" },
  { id: "bearings-seals", label: "Bearings and seals", hint: "Bearings, o-rings, gaskets" },
  { id: "pipes-valves", label: "Pipes, valves and fittings", hint: "Plumbing and hydraulic" },
  { id: "wire-cable", label: "Wire, cable and connectors", hint: "Electrical wire and plugs" },
  { id: "electrical", label: "Electrical parts", hint: "Switches, relays, lamps" },
  { id: "metal-stock", label: "Metal stock and sheet", hint: "Bar, plate, tube, sheet" },
  { id: "engine-parts", label: "Engine parts", hint: "Pumps, valves, kits" },
  // The hint slot lists what is IN a category on every other row. This one read
  // "Some need extra approval" — a warning wearing the shape of a list, on the
  // one screen where she is choosing rather than deciding, and naming no way to
  // find out which ones. The approval fact is carried honestly on the board,
  // where the restricted count and each order's own verdict say it per order.
  { id: "fasteners", label: "Bolts, screws and fasteners", hint: "Bolts, screws, nuts, washers" },
];

export const CATEGORY_LABEL: Record<MicroCategory, string> = Object.fromEntries(
  MICRO_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<MicroCategory, string>;

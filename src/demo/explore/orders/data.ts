// THE SMALL ORDERS SAMPLE: 20 Defense Logistics Agency (DLA) product buys that a
// caterer can read, price and quote. They replace the auto-parts sample.
//
// - 14 orders are open to Haddad Catering ("Orders for you").
// - 6 orders are not open to her: a source-approval order, a qualified-products
//   order, a drawing-rights order and an approved-sellers order. They fill the
//   "Ones not open to you" page.
//
// Every date is an offset from the day the demo opens (clock.ts). The suppliers
// are made up (suppliers.ts). DLA, Fort Bragg, Camp Lejeune and Pope Army
// Airfield are real government places. A stock number, a solicitation number
// and a contract number below are made up but have the real shape.
//
// Where the ship-to place shows: DLA writes it on the order paper, not on the
// order record. So the title says it ("ships to Fort Bragg") and the sample
// order paper (a PDF) lists the full address.

import type { MicroCategory } from "@/lib/microPurchases/categories";
import type { MicroAward, MicroOrder } from "@/lib/microPurchases/order";
import { calendarDay } from "../dates";
import { SUPPLIERS, type SupplierKey } from "./suppliers";

export type ShipTo = "fortBragg" | "campLejeune" | "popeAaf";

export const SHIP_TO: Record<ShipTo, { name: string; address: string }> = {
  fortBragg: { name: "Fort Bragg", address: "Dining Facility Supply Point, Fort Bragg, NC 28310" },
  campLejeune: { name: "Camp Lejeune", address: "Food Service Warehouse, Camp Lejeune, NC 28547" },
  popeAaf: { name: "Pope Army Airfield", address: "Base Supply Receiving, Pope Army Airfield, NC 28308" },
};

/** What the demo knows about an order beyond the record DLA publishes. */
export interface OrderMeta {
  shipTo: ShipTo;
  /** The matching engine's fit score for Amira, 0 to 100. */
  fit: number;
}

type AwardSpec = [
  supplier: SupplierKey,
  daysAgo: number,
  quantity: number,
  unitCost: number,
  contract: string,
  partNumber?: string | null,
];

interface Spec {
  n: number;
  /** DIBBS solicitation number. */
  sol: string;
  plain: string;
  official: string;
  nsn: string;
  category: MicroCategory;
  naics: string | null;
  quantity: number;
  ui: string;
  amc: string;
  amsc: string;
  standardPrice: number | null;
  deliveryDays: number;
  setAside?: string | null;
  status?: string;
  fast?: boolean | null;
  repeats?: boolean | null;
  drawings?: boolean | null;
  postedDaysAgo: number;
  closesInDays: number | null;
  contact: [name: string, phone: string];
  approved: [SupplierKey, string][];
  awards: AwardSpec[];
  paper?: boolean;
  version?: string;
  amendedDaysAgo?: number;
  shipTo: ShipTo;
  fit: number;
}

const CONTACTS = {
  okafor: ["R. Okafor", "215-555-0142"],
  brandt: ["L. Brandt", "215-555-0177"],
  castellanos: ["M. Castellanos", "215-555-0119"],
  whitfield: ["T. Whitfield", "215-555-0163"],
  nakamura: ["J. Nakamura", "215-555-0108"],
} as const satisfies Record<string, [string, string]>;

function emailOf(name: string): string {
  const [initial, last] = name.replace(".", "").split(" ");
  return `${initial.toLowerCase()}.${last.toLowerCase()}@dla.mil`;
}

function toAward(a: AwardSpec): MicroAward {
  const [supplier, daysAgo, quantity, unitCost, contract, partNumber] = a;
  return {
    cage: SUPPLIERS[supplier].cage,
    contract,
    quantity,
    unitCost,
    awardedOn: calendarDay(-daysAgo),
    surplus: false,
    partNumber: partNumber ?? null,
  };
}

function build(s: Spec): { order: MicroOrder; meta: OrderMeta } {
  const awards = s.awards.map(toAward);
  const newest = awards[0];
  const order: MicroOrder = {
    id: `mp-${s.n}`,
    solicitation: s.sol,
    // We hold no real DIBBS page for a made-up solicitation, so there is no link.
    dlaOrderUrl: null,
    paper: s.paper === false ? null : { fileName: `${s.sol}.pdf`, fileSize: null },
    version: s.version ?? s.sol,
    amendedOn: s.amendedDaysAgo != null ? calendarDay(-s.amendedDaysAgo) : null,
    nsn: s.nsn,
    plainName: s.plain,
    officialName: s.official,
    category: s.category,
    naics: s.naics,
    quantity: s.quantity,
    unitOfIssue: s.ui,
    amc: s.amc,
    amsc: s.amsc,
    lastPricePerUnit: newest?.unitCost ?? null,
    lastPriceDate: newest?.awardedOn ?? null,
    standardPrice: s.standardPrice,
    deliveryDays: s.deliveryDays,
    setAside: s.setAside ?? null,
    fobDestination: null,
    fastAward: s.fast ?? null,
    repeats: s.repeats ?? null,
    needsDrawings: s.drawings ?? null,
    dibbsStatus: s.status ?? "Open",
    postedOn: calendarDay(-s.postedDaysAgo),
    closesOn: s.closesInDays == null ? null : calendarDay(s.closesInDays),
    buyer: "DLA Troop Support",
    buyerContact: { name: s.contact[0], email: emailOf(s.contact[0]), phone: s.contact[1] },
    partNumbers: [...new Set(s.approved.map(([, part]) => part))].join(", ") || null,
    approvedSources: s.approved.map(([k, part]) => ({ cage: SUPPLIERS[k].cage, partNumber: part })),
    awards,
  };
  return { order, meta: { shipTo: s.shipTo, fit: s.fit } };
}

const SPECS: Spec[] = [
  // ── Open to Haddad Catering ───────────────────────────────────────────────
  {
    n: 101,
    sol: "SPE3S126T1042",
    plain: "Ground coffee, 2-lb bags, ships to Fort Bragg",
    official: "COFFEE,ROASTED AND GROUND",
    nsn: "8955016124418",
    category: "food-beverage",
    naics: "311920",
    quantity: 240,
    ui: "BG",
    amc: "1",
    amsc: "Z",
    standardPrice: 12.1,
    deliveryDays: 28,
    setAside: "SBA",
    fast: true,
    repeats: true,
    postedDaysAgo: 2,
    closesInDays: 9,
    contact: CONTACTS.okafor,
    approved: [["saltmarsh", "RG-2LB-DARK"], ["morrow", "MFD-COF-2L"]],
    awards: [
      ["saltmarsh", 18, 300, 11.4, "SPE3S126F2231", "RG-2LB-DARK"],
      ["morrow", 95, 260, 11.15, "SPE3S126F0914"],
      ["saltmarsh", 190, 240, 10.9, "SPE3S125F7720", "RG-2LB-DARK"],
      ["ashlar", 310, 280, 10.55, "SPE3S125F3305"],
    ],
    shipTo: "fortBragg",
    fit: 78,
  },
  {
    n: 102,
    sol: "SPE3S126T1067",
    plain: "Bottled drinking water, 24-packs, ships to Camp Lejeune",
    official: "WATER,DRINKING,BOTTLED",
    nsn: "8960015907732",
    category: "food-beverage",
    naics: "312112",
    quantity: 600,
    ui: "PG",
    amc: "2",
    amsc: "Z",
    standardPrice: 6.3,
    deliveryDays: 21,
    fast: true,
    postedDaysAgo: 3,
    closesInDays: 4,
    contact: CONTACTS.brandt,
    approved: [["brightwater", "BW-168-24"]],
    awards: [
      ["brightwater", 12, 700, 5.85, "SPE3S126F2054"],
      ["brightwater", 70, 640, 5.8, "SPE3S126F1180"],
      ["morrow", 150, 800, 5.65, "SPE3S125F9031"],
      ["brightwater", 240, 700, 5.5, "SPE3S125F6642"],
    ],
    shipTo: "campLejeune",
    fit: 60,
  },
  {
    n: 103,
    sol: "SPE8E126T2210",
    plain: "Insulated food carriers, top-loading, ships to Fort Bragg",
    official: "CARRIER,FOOD,INSULATED",
    nsn: "7360016042217",
    category: "kitchen-equipment",
    naics: "333318",
    quantity: 18,
    ui: "EA",
    amc: "1",
    amsc: "G",
    standardPrice: 239,
    deliveryDays: 75,
    setAside: "SBA",
    drawings: true,
    postedDaysAgo: 5,
    closesInDays: 14,
    contact: CONTACTS.castellanos,
    approved: [["kestrel", "IFC-6P-TL"], ["fairhaven", "FH-6020"]],
    awards: [
      ["kestrel", 40, 20, 214.3, "SPE8E126F4410", "IFC-6P-TL"],
      ["fairhaven", 160, 12, 209, "SPE8E126F1022", "FH-6020"],
      ["kestrel", 330, 15, 198.5, "SPE8E125F8841", "IFC-6P-TL"],
    ],
    shipTo: "fortBragg",
    fit: 66,
  },
  {
    n: 104,
    sol: "SPE8E126T2232",
    plain: "Foil steam-table pans with lids, ships to Pope Army Airfield",
    official: "PAN,FOOD,DISPOSABLE",
    nsn: "7350015983345",
    category: "food-service-supplies",
    naics: "332439",
    quantity: 80,
    ui: "BX",
    amc: "1",
    amsc: "Z",
    standardPrice: 44.5,
    deliveryDays: 30,
    fast: true,
    repeats: true,
    postedDaysAgo: 1,
    closesInDays: 8,
    contact: CONTACTS.castellanos,
    approved: [["tallow", "TC-HSP-12"], ["lanternfish", "LF-STM-12L"]],
    awards: [
      ["tallow", 25, 90, 42.1, "SPE8E126F3987"],
      ["lanternfish", 120, 100, 40.75, "SPE8E126F0613"],
      ["tallow", 260, 60, 39.9, "SPE8E125F7120"],
    ],
    shipTo: "popeAaf",
    fit: 62,
  },
  {
    n: 105,
    sol: "SPE8E126T2251",
    plain: "Paper hot cups with lids, 12-oz, ships to Fort Bragg",
    official: "CUP,DISPOSABLE,BEVERAGE",
    nsn: "7350016091120",
    category: "food-service-supplies",
    naics: "322299",
    quantity: 300,
    ui: "BX",
    amc: "2",
    amsc: "Z",
    standardPrice: 15.2,
    deliveryDays: 30,
    repeats: true,
    postedDaysAgo: 4,
    closesInDays: 11,
    contact: CONTACTS.whitfield,
    approved: [["halvorsen", "HP-HC12-LID"]],
    awards: [
      ["halvorsen", 33, 400, 14.25, "SPE8E126F3560"],
      ["granite", 140, 350, 13.9, "SPE8E126F0877"],
      ["halvorsen", 280, 300, 13.4, "SPE8E125F6208"],
    ],
    shipTo: "fortBragg",
    fit: 57,
  },
  {
    n: 106,
    sol: "SPE1C126T0930",
    plain: "Nitrile food-handler gloves, size large, ships to Camp Lejeune",
    official: "GLOVES,DISPOSABLE",
    nsn: "8415016118870",
    category: "safety-gear",
    naics: "326299",
    quantity: 500,
    ui: "BX",
    amc: "1",
    amsc: "Z",
    standardPrice: 9.9,
    deliveryDays: 35,
    setAside: "SBA",
    fast: true,
    repeats: true,
    postedDaysAgo: 2,
    closesInDays: 7,
    contact: CONTACTS.nakamura,
    approved: [["westbrook", "NF-100-L"]],
    awards: [
      ["westbrook", 20, 600, 9.1, "SPE1C126F1841", "NF-100-L"],
      ["westbrook", 110, 500, 8.85, "SPE1C126F0402", "NF-100-L"],
      ["granite", 200, 700, 8.6, "SPE1C125F9173"],
    ],
    shipTo: "campLejeune",
    fit: 58,
  },
  {
    n: 107,
    sol: "SPE8E126T2275",
    plain: "Paper napkins for dispensers, ships to Fort Bragg",
    official: "NAPKIN,PAPER",
    nsn: "8540015876620",
    category: "food-service-supplies",
    naics: "322291",
    quantity: 120,
    ui: "BX",
    amc: "1",
    amsc: "Z",
    standardPrice: 40.1,
    deliveryDays: 28,
    repeats: true,
    postedDaysAgo: 3,
    closesInDays: 12,
    contact: CONTACTS.whitfield,
    approved: [["halvorsen", "HP-NAP-6K"], ["granite", "GH-NAP-DSP"]],
    awards: [
      ["halvorsen", 48, 150, 38.5, "SPE8E126F2776"],
      ["granite", 190, 100, 37.2, "SPE8E125F8450"],
    ],
    shipTo: "fortBragg",
    fit: 55,
  },
  {
    n: 108,
    sol: "SPE3S126T1091",
    plain: "Ketchup and mustard packets, ships to Pope Army Airfield",
    official: "CONDIMENT PACKET ASSORTMENT",
    nsn: "8950016031194",
    category: "food-beverage",
    naics: "311941",
    quantity: 200,
    ui: "BX",
    amc: "2",
    amsc: "Z",
    standardPrice: 29.2,
    deliveryDays: 30,
    repeats: true,
    postedDaysAgo: 1,
    closesInDays: 10,
    contact: CONTACTS.okafor,
    approved: [["orchard", "OL-CND-500"]],
    awards: [
      ["orchard", 30, 220, 27.9, "SPE3S126F1993"],
      ["morrow", 130, 200, 27.4, "SPE3S126F0245"],
      ["ashlar", 270, 180, 26.1, "SPE3S125F7352"],
    ],
    paper: false,
    shipTo: "popeAaf",
    fit: 70,
  },
  {
    n: 109,
    sol: "SPE3S126T1103",
    plain: "Dry spaghetti, 20-lb boxes, ships to Fort Bragg",
    official: "SPAGHETTI,DRY",
    nsn: "8920015852209",
    category: "food-beverage",
    naics: "311824",
    quantity: 90,
    ui: "BX",
    amc: "1",
    amsc: "G",
    standardPrice: 22.9,
    deliveryDays: 35,
    fast: true,
    repeats: true,
    postedDaysAgo: 2,
    closesInDays: 8,
    contact: CONTACTS.brandt,
    approved: [["pinecrest", "PI-SPG-20"], ["cobalt", "CF-SPG-20"]],
    awards: [
      ["pinecrest", 22, 120, 21.8, "SPE3S126F2410"],
      ["cobalt", 105, 100, 21.35, "SPE3S126F0788"],
      ["pinecrest", 230, 90, 20.4, "SPE3S125F7961"],
    ],
    shipTo: "fortBragg",
    fit: 74,
  },
  {
    n: 110,
    sol: "SPE3S126T1115",
    plain: "Long-grain parboiled rice, 25-lb bags, ships to Camp Lejeune",
    official: "RICE,PARBOILED",
    nsn: "8920015924471",
    category: "food-beverage",
    naics: "311212",
    quantity: 150,
    ui: "BG",
    amc: "1",
    amsc: "G",
    standardPrice: 20.5,
    deliveryDays: 42,
    repeats: true,
    postedDaysAgo: 5,
    closesInDays: 13,
    contact: CONTACTS.brandt,
    approved: [["cobalt", "CF-RICE-25P"]],
    // The newest award is 14 months old: the price advice says costs may have moved.
    awards: [
      ["cobalt", 430, 150, 19.4, "SPE3S125F1180"],
      ["cobalt", 520, 120, 18.1, "SPE3S125F0412"],
      ["ashlar", 640, 140, 17.65, "SPE3S124F8830"],
    ],
    paper: false,
    shipTo: "campLejeune",
    fit: 73,
  },
  {
    n: 111,
    sol: "SPE3S126T1118",
    plain: "Shelf-stable entree pouches, 8-oz, ships to Fort Bragg",
    official: "ENTREE,SHELF STABLE,POUCH,ASSORTED",
    nsn: "8940016205538",
    category: "food-beverage",
    naics: "311991",
    quantity: 2400,
    ui: "EA",
    amc: "2",
    amsc: "Z",
    standardPrice: 2.45,
    deliveryDays: 45,
    setAside: "SBA",
    fast: true,
    repeats: true,
    postedDaysAgo: 1,
    closesInDays: 12,
    contact: CONTACTS.okafor,
    approved: [["ridgeline", "RC-ENT-8"], ["pinecrest", "PI-ENT-8"]],
    awards: [
      ["ridgeline", 15, 3000, 2.35, "SPE3S126F2288"],
      ["ridgeline", 75, 2800, 2.3, "SPE3S126F1105"],
      ["pinecrest", 160, 2400, 2.22, "SPE3S125F9340"],
      ["ashlar", 290, 2000, 2.1, "SPE3S125F4417"],
    ],
    version: "SPE3S126T1118 AMD 0002",
    amendedDaysAgo: 1,
    shipTo: "fortBragg",
    fit: 94,
  },
  {
    n: 112,
    sol: "SPE3S126T1124",
    plain: "Halal-certified chicken entree pouches, ships to Pope Army Airfield",
    official: "ENTREE,SHELF STABLE,HALAL,CHICKEN",
    nsn: "8940016210907",
    category: "food-beverage",
    naics: "311991",
    quantity: 1200,
    ui: "EA",
    amc: "1",
    amsc: "Z",
    standardPrice: 3.4,
    deliveryDays: 60,
    setAside: "WOSB",
    repeats: true,
    postedDaysAgo: 0,
    closesInDays: 15,
    contact: CONTACTS.okafor,
    approved: [["ridgeline", "RC-HAL-CH8"]],
    // A new stock number: no award yet, so there is no price history to read.
    awards: [],
    shipTo: "popeAaf",
    fit: 92,
  },
  {
    n: 113,
    sol: "SPE8E126T2290",
    plain: "Insulated beverage dispensers, 5-gallon, ships to Camp Lejeune",
    official: "DISPENSER,BEVERAGE,INSULATED",
    nsn: "7240015968813",
    category: "kitchen-equipment",
    naics: "326199",
    quantity: 24,
    ui: "EA",
    amc: "1",
    amsc: "G",
    standardPrice: 61.5,
    deliveryDays: 50,
    setAside: "SDVOSBC",
    postedDaysAgo: 6,
    closesInDays: 6,
    contact: CONTACTS.whitfield,
    approved: [["marlin", "BD-5G-INS"], ["fairhaven", "FH-BD5"]],
    awards: [
      ["marlin", 52, 30, 58.9, "SPE8E126F3115", "BD-5G-INS"],
      ["fairhaven", 200, 24, 56.1, "SPE8E125F9026"],
    ],
    shipTo: "campLejeune",
    fit: 52,
  },
  {
    n: 114,
    sol: "SPE8E126T2301",
    plain: "Compartment food trays with lids, ships to Fort Bragg",
    official: "TRAY,FOOD,DISPOSABLE",
    nsn: "7350016093351",
    category: "food-service-supplies",
    naics: "322299",
    quantity: 400,
    ui: "BX",
    amc: "2",
    amsc: "Z",
    standardPrice: 32.4,
    deliveryDays: 30,
    // Posted but not open for prices yet: the "opens in a few days" state.
    status: "Pending",
    repeats: true,
    postedDaysAgo: 0,
    closesInDays: 16,
    contact: CONTACTS.nakamura,
    approved: [["granite", "GH-TRY-5C"], ["lanternfish", "LF-TRY-5C"]],
    awards: [
      ["granite", 60, 500, 31.2, "SPE8E126F2890"],
      ["lanternfish", 170, 400, 30.1, "SPE8E126F0954"],
    ],
    shipTo: "fortBragg",
    fit: 64,
  },
  // ── Not open to Haddad Catering ───────────────────────────────────────────
  {
    n: 121,
    sol: "SPE8E126T2312",
    plain: "Insulated 15-gallon food containers, field pattern, ships to Fort Bragg",
    official: "CONTAINER,FOOD,INSULATED",
    nsn: "7360012886341",
    category: "kitchen-equipment",
    naics: "333318",
    quantity: 12,
    ui: "EA",
    amc: "2",
    amsc: "C",
    standardPrice: 512,
    deliveryDays: 90,
    drawings: true,
    postedDaysAgo: 3,
    closesInDays: 11,
    contact: CONTACTS.castellanos,
    approved: [["fairhaven", "FC-15-MIL"]],
    awards: [["fairhaven", 90, 10, 486, "SPE8E126F2001", "FC-15-MIL"]],
    shipTo: "fortBragg",
    fit: 48,
  },
  {
    n: 122,
    sol: "SPE8E126T2318",
    plain: "Replacement griddle plates for field kitchens, ships to Camp Lejeune",
    official: "PLATE,GRIDDLE",
    nsn: "7360014417902",
    category: "kitchen-equipment",
    naics: "333318",
    quantity: 8,
    ui: "EA",
    amc: "2",
    amsc: "C",
    standardPrice: 134,
    deliveryDays: 120,
    drawings: true,
    postedDaysAgo: 4,
    closesInDays: 13,
    contact: CONTACTS.castellanos,
    approved: [["marlin", "GP-FK-22"]],
    awards: [["marlin", 140, 8, 129.5, "SPE8E125F9934", "GP-FK-22"]],
    shipTo: "campLejeune",
    fit: 44,
  },
  {
    n: 123,
    sol: "SPE3S126T1140",
    plain: "Flameless ration heaters, ships to Fort Bragg",
    official: "HEATER,FLAMELESS,RATION",
    nsn: "8970015050043",
    category: "food-beverage",
    naics: "325998",
    quantity: 2000,
    ui: "EA",
    amc: "1",
    amsc: "T",
    standardPrice: 1.24,
    deliveryDays: 60,
    postedDaysAgo: 2,
    closesInDays: 9,
    contact: CONTACTS.okafor,
    approved: [["ridgeline", "RC-HTR-FL1"]],
    awards: [["ridgeline", 60, 3000, 1.18, "SPE3S126F1650", "RC-HTR-FL1"]],
    shipTo: "fortBragg",
    fit: 46,
  },
  {
    n: 124,
    sol: "SPE8E126T2330",
    plain: "Thermal food-transport containers, ships to Pope Army Airfield",
    official: "CONTAINER,THERMAL,FOOD TRANSPORT",
    nsn: "7360015512876",
    category: "kitchen-equipment",
    naics: "326199",
    quantity: 30,
    ui: "EA",
    amc: "1",
    amsc: "T",
    standardPrice: 79,
    deliveryDays: 70,
    postedDaysAgo: 5,
    closesInDays: 10,
    contact: CONTACTS.whitfield,
    approved: [["kestrel", "TC-30-QPL"]],
    awards: [["kestrel", 120, 30, 74.2, "SPE8E126F0540", "TC-30-QPL"]],
    shipTo: "popeAaf",
    fit: 45,
  },
  {
    n: 125,
    sol: "SPE8E126T2344",
    plain: "Stainless steel steam-table pans, military pattern, ships to Fort Bragg",
    official: "PAN,FOOD,WARMING",
    nsn: "7350012204498",
    category: "kitchen-equipment",
    naics: "332439",
    quantity: 40,
    ui: "EA",
    amc: "1",
    amsc: "P",
    standardPrice: 66,
    deliveryDays: 80,
    postedDaysAgo: 6,
    closesInDays: 14,
    contact: CONTACTS.castellanos,
    approved: [["fairhaven", "SP-12-MIL"]],
    awards: [["fairhaven", 75, 40, 63.5, "SPE8E126F1788", "SP-12-MIL"]],
    shipTo: "fortBragg",
    fit: 42,
  },
  {
    n: 126,
    sol: "SPE8E126T2356",
    plain: "Hand can openers, military pattern, ships to Camp Lejeune",
    official: "OPENER,CAN,HAND",
    nsn: "7340002402337",
    category: "kitchen-equipment",
    naics: "332216",
    quantity: 60,
    ui: "EA",
    amc: "2",
    amsc: "Q",
    standardPrice: 7.9,
    deliveryDays: 45,
    postedDaysAgo: 4,
    closesInDays: 12,
    contact: CONTACTS.nakamura,
    approved: [["kestrel", "CO-MIL-1"], ["marlin", "CO-MIL-1"]],
    awards: [["kestrel", 100, 60, 7.35, "SPE8E126F0991", "CO-MIL-1"]],
    shipTo: "campLejeune",
    fit: 40,
  },
];

export const ORDER_META: ReadonlyMap<string, OrderMeta> = new Map();
export const ORDERS: MicroOrder[] = [];

for (const spec of SPECS) {
  const { order, meta } = build(spec);
  ORDERS.push(order);
  (ORDER_META as Map<string, OrderMeta>).set(order.id, meta);
}

export function findOrder(id: string): MicroOrder | undefined {
  return ORDERS.find((o) => o.id === id);
}

export function isSmallOrderId(id: string): boolean {
  return ORDER_META.has(id);
}

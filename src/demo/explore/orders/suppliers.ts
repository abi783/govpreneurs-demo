// The companies that sell to DLA in the Small Orders sample data.
// Every company here is made up. A CAGE code is the five-character number that
// the government gives to each company that sells to it.

export interface Supplier {
  cage: string;
  name: string;
}

export const SUPPLIERS = {
  brightwater: { cage: "3BW41", name: "Brightwater Beverage Supply LLC" },
  ashlar: { cage: "5AP27", name: "Ashlar Provisions Inc." },
  tallow: { cage: "7TC93", name: "Tallow Creek Packaging" },
  morrow: { cage: "1MF58", name: "Morrow Foodservice Distributors" },
  kestrel: { cage: "8KK36", name: "Kestrel Kitchen Supply" },
  halvorsen: { cage: "4HP62", name: "Halvorsen Paper and Pack" },
  ridgeline: { cage: "6RC15", name: "Ridgeline Commissary Foods" },
  saltmarsh: { cage: "2SC84", name: "Saltmarsh Coffee Roasters" },
  pinecrest: { cage: "9PI70", name: "Pinecrest Institutional Foods" },
  granite: { cage: "0GH49", name: "Granite Hollow Disposables" },
  marlin: { cage: "3MP12", name: "Marlin Point Equipment Co." },
  cobalt: { cage: "5CF66", name: "Cobalt Fields Grain and Rice" },
  westbrook: { cage: "7WS38", name: "Westbrook Safety Supply" },
  lanternfish: { cage: "4LP91", name: "Lanternfish Packaging Group" },
  orchard: { cage: "8OL25", name: "Orchard Lane Sauces" },
  fairhaven: { cage: "1FF73", name: "Fairhaven Food Equipment" },
} as const satisfies Record<string, Supplier>;

export type SupplierKey = keyof typeof SUPPLIERS;

const BY_CAGE: ReadonlyMap<string, string> = new Map(
  Object.values(SUPPLIERS).map((s) => [s.cage, s.name]),
);

/** CAGE code to company name, for the CAGE codes in `cages`. */
export function supplierNames(cages: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const cage of cages) {
    const name = BY_CAGE.get(cage);
    if (name) out[cage] = name;
  }
  return out;
}

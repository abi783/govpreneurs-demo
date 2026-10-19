// Every place of performance in the story, with the driving distance from
// Haddad Catering's kitchen in Fayetteville, NC. Hunter's distance claims are
// checked against this table (see check.ts).

export interface Place {
  city: string;
  state: string;
  /** Approximate driving miles from 201 Hay St, Fayetteville, NC. */
  milesFromKitchen: number;
}

export const PLACES = {
  fayetteville: { city: "Fayetteville", state: "NC", milesFromKitchen: 3 },
  fortBragg: { city: "Fort Bragg", state: "NC", milesFromKitchen: 12 },
  popeAaf: { city: "Pope Army Airfield", state: "NC", milesFromKitchen: 15 },
  hopeMills: { city: "Hope Mills", state: "NC", milesFromKitchen: 10 },
  campMackall: { city: "Camp Mackall", state: "NC", milesFromKitchen: 45 },
  lumberton: { city: "Lumberton", state: "NC", milesFromKitchen: 35 },
  goldsboro: { city: "Goldsboro", state: "NC", milesFromKitchen: 75 },
  raleigh: { city: "Raleigh", state: "NC", milesFromKitchen: 65 },
  durham: { city: "Durham", state: "NC", milesFromKitchen: 85 },
  chapelHill: { city: "Chapel Hill", state: "NC", milesFromKitchen: 85 },
  wilmington: { city: "Wilmington", state: "NC", milesFromKitchen: 90 },
  jacksonville: { city: "Jacksonville", state: "NC", milesFromKitchen: 100 },
  greensboro: { city: "Greensboro", state: "NC", milesFromKitchen: 115 },
  salisbury: { city: "Salisbury", state: "NC", milesFromKitchen: 130 },
  cherryPoint: { city: "Havelock", state: "NC", milesFromKitchen: 140 },
  charlotte: { city: "Charlotte", state: "NC", milesFromKitchen: 140 },
  statewideNc: { city: "Multiple districts", state: "NC", milesFromKitchen: 150 },
  richmond: { city: "Richmond", state: "VA", milesFromKitchen: 170 },
  norfolk: { city: "Norfolk", state: "VA", milesFromKitchen: 220 },
  virginiaBeach: { city: "Virginia Beach", state: "VA", milesFromKitchen: 230 },
  hampton: { city: "Hampton", state: "VA", milesFromKitchen: 210 },
  charleston: { city: "Charleston", state: "SC", milesFromKitchen: 210 },
  northCharleston: { city: "North Charleston", state: "SC", milesFromKitchen: 200 },
  augusta: { city: "Augusta", state: "GA", milesFromKitchen: 230 },
  fortStewart: { city: "Fort Stewart", state: "GA", milesFromKitchen: 290 },
  multiStateSe: { city: "Multiple sites (NC, VA, SC, GA, FL)", state: "NC", milesFromKitchen: 250 },
} as const satisfies Record<string, Place>;

export type PlaceKey = keyof typeof PLACES;

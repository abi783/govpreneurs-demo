// Every place of performance in the story, with the driving distance from the
// member's base in downtown Fayetteville, NC (Haddad Catering's kitchen on Hay St,
// Lantern Row Creative's studio on Person St, a few blocks apart). Hunter's
// distance claims are checked against this table (see check.ts).

export interface Place {
  city: string;
  state: string;
  /** Approximate driving miles from downtown Fayetteville, NC. */
  milesFromBase: number;
}

export const PLACES = {
  fayetteville: { city: "Fayetteville", state: "NC", milesFromBase: 3 },
  fortBragg: { city: "Fort Bragg", state: "NC", milesFromBase: 12 },
  popeAaf: { city: "Pope Army Airfield", state: "NC", milesFromBase: 15 },
  hopeMills: { city: "Hope Mills", state: "NC", milesFromBase: 10 },
  springLake: { city: "Spring Lake", state: "NC", milesFromBase: 12 },
  raeford: { city: "Raeford", state: "NC", milesFromBase: 22 },
  redSprings: { city: "Red Springs", state: "NC", milesFromBase: 25 },
  dunn: { city: "Dunn", state: "NC", milesFromBase: 28 },
  lillington: { city: "Lillington", state: "NC", milesFromBase: 30 },
  maxton: { city: "Maxton", state: "NC", milesFromBase: 35 },
  sanford: { city: "Sanford", state: "NC", milesFromBase: 38 },
  southernPines: { city: "Southern Pines", state: "NC", milesFromBase: 38 },
  clinton: { city: "Clinton", state: "NC", milesFromBase: 40 },
  elizabethtown: { city: "Elizabethtown", state: "NC", milesFromBase: 40 },
  laurinburg: { city: "Laurinburg", state: "NC", milesFromBase: 42 },
  campMackall: { city: "Camp Mackall", state: "NC", milesFromBase: 45 },
  lumberton: { city: "Lumberton", state: "NC", milesFromBase: 35 },
  goldsboro: { city: "Goldsboro", state: "NC", milesFromBase: 75 },
  raleigh: { city: "Raleigh", state: "NC", milesFromBase: 65 },
  durham: { city: "Durham", state: "NC", milesFromBase: 85 },
  chapelHill: { city: "Chapel Hill", state: "NC", milesFromBase: 85 },
  wilmington: { city: "Wilmington", state: "NC", milesFromBase: 90 },
  jacksonville: { city: "Jacksonville", state: "NC", milesFromBase: 100 },
  greensboro: { city: "Greensboro", state: "NC", milesFromBase: 115 },
  salisbury: { city: "Salisbury", state: "NC", milesFromBase: 130 },
  cherryPoint: { city: "Havelock", state: "NC", milesFromBase: 140 },
  charlotte: { city: "Charlotte", state: "NC", milesFromBase: 140 },
  statewideNc: { city: "Multiple districts", state: "NC", milesFromBase: 150 },
  richmond: { city: "Richmond", state: "VA", milesFromBase: 170 },
  norfolk: { city: "Norfolk", state: "VA", milesFromBase: 220 },
  virginiaBeach: { city: "Virginia Beach", state: "VA", milesFromBase: 230 },
  hampton: { city: "Hampton", state: "VA", milesFromBase: 210 },
  florence: { city: "Florence", state: "SC", milesFromBase: 85 },
  charleston: { city: "Charleston", state: "SC", milesFromBase: 210 },
  northCharleston: { city: "North Charleston", state: "SC", milesFromBase: 200 },
  augusta: { city: "Augusta", state: "GA", milesFromBase: 230 },
  asheville: { city: "Asheville", state: "NC", milesFromBase: 250 },
  fortStewart: { city: "Fort Stewart", state: "GA", milesFromBase: 290 },
  multiStateSe: { city: "Multiple sites (NC, VA, SC, GA, FL)", state: "NC", milesFromBase: 250 },
} as const satisfies Record<string, Place>;

export type PlaceKey = keyof typeof PLACES;

// DEMO: states, cities and street addresses for the service-area picker and the
// address lookup. The real page asks Hunter (cities) and Google (addresses).

/** Cities the demo offers under each state. `count` is a made-up count of notices. */
const CITIES: Record<string, string[]> = {
  AL: ["Birmingham", "Huntsville", "Mobile", "Montgomery", "Tuscaloosa"],
  AK: ["Anchorage", "Fairbanks", "Juneau"],
  AZ: ["Phoenix", "Tucson", "Mesa", "Sierra Vista", "Yuma"],
  AR: ["Little Rock", "Fayetteville", "Fort Smith", "Jonesboro"],
  CA: ["Los Angeles", "San Diego", "Sacramento", "San Francisco", "Fresno"],
  CO: ["Denver", "Colorado Springs", "Aurora", "Fort Collins"],
  CT: ["Hartford", "New Haven", "Groton", "Stamford"],
  DE: ["Wilmington", "Dover", "Newark"],
  DC: ["Washington"],
  FL: ["Jacksonville", "Tampa", "Orlando", "Pensacola", "Miami", "Tallahassee"],
  GA: ["Atlanta", "Augusta", "Savannah", "Fort Stewart", "Columbus", "Warner Robins"],
  HI: ["Honolulu", "Pearl City"],
  ID: ["Boise", "Mountain Home"],
  IL: ["Chicago", "Springfield", "Rock Island", "Peoria"],
  IN: ["Indianapolis", "Fort Wayne", "Crane"],
  IA: ["Des Moines", "Cedar Rapids", "Davenport"],
  KS: ["Wichita", "Topeka", "Fort Riley", "Leavenworth"],
  KY: ["Louisville", "Lexington", "Fort Knox", "Fort Campbell"],
  LA: ["New Orleans", "Baton Rouge", "Shreveport", "Fort Polk"],
  ME: ["Portland", "Bangor", "Kittery"],
  MD: ["Baltimore", "Annapolis", "Aberdeen", "Bethesda", "Patuxent River"],
  MA: ["Boston", "Worcester", "Springfield"],
  MI: ["Detroit", "Grand Rapids", "Lansing"],
  MN: ["Minneapolis", "Saint Paul", "Duluth"],
  MS: ["Jackson", "Gulfport", "Biloxi", "Columbus"],
  MO: ["Kansas City", "Saint Louis", "Springfield", "Fort Leonard Wood"],
  MT: ["Billings", "Helena", "Great Falls"],
  NE: ["Omaha", "Lincoln", "Offutt"],
  NV: ["Las Vegas", "Reno", "Fallon"],
  NH: ["Manchester", "Concord", "Portsmouth"],
  NJ: ["Newark", "Trenton", "Lakehurst", "Fort Dix"],
  NM: ["Albuquerque", "Santa Fe", "Las Cruces", "Alamogordo"],
  NY: ["New York", "Albany", "Buffalo", "Rochester", "West Point"],
  NC: [
    "Fayetteville", "Fort Bragg", "Hope Mills", "Raleigh", "Durham", "Chapel Hill", "Charlotte",
    "Greensboro", "Wilmington", "Jacksonville", "Goldsboro", "Lumberton", "Havelock", "Salisbury",
    "Camp Mackall", "Pope Army Airfield",
  ],
  ND: ["Fargo", "Bismarck", "Minot"],
  OH: ["Columbus", "Cleveland", "Cincinnati", "Dayton"],
  OK: ["Oklahoma City", "Tulsa", "Lawton", "Fort Sill"],
  OR: ["Portland", "Salem", "Eugene"],
  PA: ["Philadelphia", "Pittsburgh", "Harrisburg", "Carlisle"],
  RI: ["Providence", "Newport"],
  SC: ["Charleston", "North Charleston", "Columbia", "Greenville", "Beaufort", "Fort Jackson", "Myrtle Beach"],
  SD: ["Sioux Falls", "Rapid City"],
  TN: ["Nashville", "Memphis", "Knoxville", "Chattanooga"],
  TX: ["Houston", "Dallas", "San Antonio", "Austin", "El Paso", "Killeen", "Fort Hood"],
  UT: ["Salt Lake City", "Ogden", "Provo"],
  VT: ["Burlington", "Montpelier"],
  VA: ["Norfolk", "Virginia Beach", "Hampton", "Richmond", "Newport News", "Quantico", "Fort Lee"],
  WA: ["Seattle", "Tacoma", "Spokane", "Bremerton"],
  WV: ["Charleston", "Morgantown", "Huntington"],
  WI: ["Milwaukee", "Madison", "Green Bay"],
  WY: ["Cheyenne", "Casper", "Laramie"],
};

export function citiesFor(state: string): { state: string; cities: { city: string; count: number }[] }[] {
  const code = state.toUpperCase();
  const names = CITIES[code];
  if (!names) return [];
  return [
    {
      state: code,
      cities: names.map((city, i) => ({ city, count: Math.max(3, 60 - i * 7 + (city.length % 5)) })),
    },
  ];
}

// ── addresses ──────────────────────────────────────────────────────────────

export interface AddressSuggestion {
  placeId: string;
  text: string;
  address: { line1: string; city: string; state: string; postalCode: string };
}

const KNOWN: AddressSuggestion[] = [
  { placeId: "p-hay", text: "201 Hay St, Fayetteville, NC 28301", address: { line1: "201 Hay St", city: "Fayetteville", state: "NC", postalCode: "28301" } },
  { placeId: "p-ramsey", text: "1805 Ramsey St, Fayetteville, NC 28301", address: { line1: "1805 Ramsey St", city: "Fayetteville", state: "NC", postalCode: "28301" } },
  { placeId: "p-skibo", text: "3404 Skibo Rd, Fayetteville, NC 28314", address: { line1: "3404 Skibo Rd", city: "Fayetteville", state: "NC", postalCode: "28314" } },
  { placeId: "p-raeford", text: "4100 Raeford Rd, Fayetteville, NC 28304", address: { line1: "4100 Raeford Rd", city: "Fayetteville", state: "NC", postalCode: "28304" } },
  { placeId: "p-glenwood", text: "418 Glenwood Avenue, Raleigh, NC 27603", address: { line1: "418 Glenwood Avenue", city: "Raleigh", state: "NC", postalCode: "27603" } },
  { placeId: "p-fayetteville-st", text: "300 Fayetteville St, Raleigh, NC 27601", address: { line1: "300 Fayetteville St", city: "Raleigh", state: "NC", postalCode: "27601" } },
  { placeId: "p-main-ft", text: "2175 Reilly Rd, Fort Bragg, NC 28310", address: { line1: "2175 Reilly Rd", city: "Fort Bragg", state: "NC", postalCode: "28310" } },
  { placeId: "p-pobox", text: "PO Box 5512, Fayetteville, NC 28302", address: { line1: "PO Box 5512", city: "Fayetteville", state: "NC", postalCode: "28302" } },
];

/** Suggestions for what she typed. A typed street that matches nothing still gets one. */
export function suggestAddresses(q: string): { placeId: string; text: string }[] {
  const words = q.toLowerCase().split(/[\s,]+/).filter(Boolean);
  if (words.length === 0) return [];
  const hits = KNOWN.filter((a) => words.every((w) => a.text.toLowerCase().includes(w)));
  const out = hits.map(({ placeId, text }) => ({ placeId, text }));
  if (out.length === 0) {
    const street = q.trim().replace(/\s+/g, " ");
    out.push({ placeId: `typed:${encodeURIComponent(street)}`, text: `${street}, Fayetteville, NC 28301` });
  }
  return out.slice(0, 5);
}

/** The picked suggestion in parts. */
export function addressForPlace(placeId: string): { line1: string; city: string; state: string; postalCode: string } | null {
  const known = KNOWN.find((a) => a.placeId === placeId);
  if (known) return known.address;
  if (placeId.startsWith("typed:")) {
    const street = decodeURIComponent(placeId.slice("typed:".length));
    return { line1: street, city: "Fayetteville", state: "NC", postalCode: "28301" };
  }
  return null;
}

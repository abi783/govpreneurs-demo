// ISO 3166 reference data + the single location-resolution layer.
//
// WHY THIS EXISTS: the opportunity `location` is legacy free-text ("City, ST",
// US-only place of performance). International opportunities carry an explicit
// ISO code in `locationCode`. This module is the ONE place that turns either
// representation into structured, code-keyed identity — so display uses
// human names, filtering uses codes, and a malformed value is bucketed as
// "Location not specified" instead of being guessed into the wrong country
// (the competitor "India → San Diego" failure mode).
//
// Designed so international SUBDIVISIONS (ISO 3166-2, e.g. "OM-MA") can be
// surfaced later by populating an intl-subdivision name table — no call-site
// rework. Phase 1 deliberately resolves but does not surface them.

// Sentinel country code for anything that can't be pinned to a real place.
export const UNSPECIFIED_CODE = "ZZ";
export const UNSPECIFIED_NAME = "Location not specified";
export const US_CODE = "US";
// Sentinel selection meaning "any international country" — avoids stuffing all
// ~248 codes into the filter. Handled specially by the evaluator.
export const INTL_ALL_CODE = "INTL";
export const INTL_ALL_NAME = "All international";

// ISO 3166-1 alpha-2 → English short name (exhaustive official set).
export const COUNTRIES: Record<string, string> = {
  AF: "Afghanistan",
  AX: "Åland Islands",
  AL: "Albania",
  DZ: "Algeria",
  AS: "American Samoa",
  AD: "Andorra",
  AO: "Angola",
  AI: "Anguilla",
  AQ: "Antarctica",
  AG: "Antigua and Barbuda",
  AR: "Argentina",
  AM: "Armenia",
  AW: "Aruba",
  AU: "Australia",
  AT: "Austria",
  AZ: "Azerbaijan",
  BS: "Bahamas",
  BH: "Bahrain",
  BD: "Bangladesh",
  BB: "Barbados",
  BY: "Belarus",
  BE: "Belgium",
  BZ: "Belize",
  BJ: "Benin",
  BM: "Bermuda",
  BT: "Bhutan",
  BO: "Bolivia",
  BQ: "Bonaire, Sint Eustatius and Saba",
  BA: "Bosnia and Herzegovina",
  BW: "Botswana",
  BV: "Bouvet Island",
  BR: "Brazil",
  IO: "British Indian Ocean Territory",
  BN: "Brunei Darussalam",
  BG: "Bulgaria",
  BF: "Burkina Faso",
  BI: "Burundi",
  CV: "Cabo Verde",
  KH: "Cambodia",
  CM: "Cameroon",
  CA: "Canada",
  KY: "Cayman Islands",
  CF: "Central African Republic",
  TD: "Chad",
  CL: "Chile",
  CN: "China",
  CX: "Christmas Island",
  CC: "Cocos (Keeling) Islands",
  CO: "Colombia",
  KM: "Comoros",
  CG: "Congo",
  CD: "Congo (DRC)",
  CK: "Cook Islands",
  CR: "Costa Rica",
  CI: "Côte d'Ivoire",
  HR: "Croatia",
  CU: "Cuba",
  CW: "Curaçao",
  CY: "Cyprus",
  CZ: "Czechia",
  DK: "Denmark",
  DJ: "Djibouti",
  DM: "Dominica",
  DO: "Dominican Republic",
  EC: "Ecuador",
  EG: "Egypt",
  SV: "El Salvador",
  GQ: "Equatorial Guinea",
  ER: "Eritrea",
  EE: "Estonia",
  SZ: "Eswatini",
  ET: "Ethiopia",
  FK: "Falkland Islands",
  FO: "Faroe Islands",
  FJ: "Fiji",
  FI: "Finland",
  FR: "France",
  GF: "French Guiana",
  PF: "French Polynesia",
  TF: "French Southern Territories",
  GA: "Gabon",
  GM: "Gambia",
  GE: "Georgia",
  DE: "Germany",
  GH: "Ghana",
  GI: "Gibraltar",
  GR: "Greece",
  GL: "Greenland",
  GD: "Grenada",
  GP: "Guadeloupe",
  GU: "Guam",
  GT: "Guatemala",
  GG: "Guernsey",
  GN: "Guinea",
  GW: "Guinea-Bissau",
  GY: "Guyana",
  HT: "Haiti",
  HM: "Heard Island and McDonald Islands",
  VA: "Holy See",
  HN: "Honduras",
  HK: "Hong Kong",
  HU: "Hungary",
  IS: "Iceland",
  IN: "India",
  ID: "Indonesia",
  IR: "Iran",
  IQ: "Iraq",
  IE: "Ireland",
  IM: "Isle of Man",
  IL: "Israel",
  IT: "Italy",
  JM: "Jamaica",
  JP: "Japan",
  JE: "Jersey",
  JO: "Jordan",
  KZ: "Kazakhstan",
  KE: "Kenya",
  KI: "Kiribati",
  KP: "North Korea",
  KR: "South Korea",
  KW: "Kuwait",
  KG: "Kyrgyzstan",
  LA: "Laos",
  LV: "Latvia",
  LB: "Lebanon",
  LS: "Lesotho",
  LR: "Liberia",
  LY: "Libya",
  LI: "Liechtenstein",
  LT: "Lithuania",
  LU: "Luxembourg",
  MO: "Macao",
  MG: "Madagascar",
  MW: "Malawi",
  MY: "Malaysia",
  MV: "Maldives",
  ML: "Mali",
  MT: "Malta",
  MH: "Marshall Islands",
  MQ: "Martinique",
  MR: "Mauritania",
  MU: "Mauritius",
  YT: "Mayotte",
  MX: "Mexico",
  FM: "Micronesia",
  MD: "Moldova",
  MC: "Monaco",
  MN: "Mongolia",
  ME: "Montenegro",
  MS: "Montserrat",
  MA: "Morocco",
  MZ: "Mozambique",
  MM: "Myanmar",
  NA: "Namibia",
  NR: "Nauru",
  NP: "Nepal",
  NL: "Netherlands",
  NC: "New Caledonia",
  NZ: "New Zealand",
  NI: "Nicaragua",
  NE: "Niger",
  NG: "Nigeria",
  NU: "Niue",
  NF: "Norfolk Island",
  MK: "North Macedonia",
  MP: "Northern Mariana Islands",
  NO: "Norway",
  OM: "Oman",
  PK: "Pakistan",
  PW: "Palau",
  PS: "Palestine",
  PA: "Panama",
  PG: "Papua New Guinea",
  PY: "Paraguay",
  PE: "Peru",
  PH: "Philippines",
  PN: "Pitcairn",
  PL: "Poland",
  PT: "Portugal",
  PR: "Puerto Rico",
  QA: "Qatar",
  RE: "Réunion",
  RO: "Romania",
  RU: "Russia",
  RW: "Rwanda",
  BL: "Saint Barthélemy",
  SH: "Saint Helena",
  KN: "Saint Kitts and Nevis",
  LC: "Saint Lucia",
  MF: "Saint Martin",
  PM: "Saint Pierre and Miquelon",
  VC: "Saint Vincent and the Grenadines",
  WS: "Samoa",
  SM: "San Marino",
  ST: "Sao Tome and Principe",
  SA: "Saudi Arabia",
  SN: "Senegal",
  RS: "Serbia",
  SC: "Seychelles",
  SL: "Sierra Leone",
  SG: "Singapore",
  SX: "Sint Maarten",
  SK: "Slovakia",
  SI: "Slovenia",
  SB: "Solomon Islands",
  SO: "Somalia",
  ZA: "South Africa",
  GS: "South Georgia and the South Sandwich Islands",
  SS: "South Sudan",
  ES: "Spain",
  LK: "Sri Lanka",
  SD: "Sudan",
  SR: "Suriname",
  SJ: "Svalbard and Jan Mayen",
  SE: "Sweden",
  CH: "Switzerland",
  SY: "Syria",
  TW: "Taiwan",
  TJ: "Tajikistan",
  TZ: "Tanzania",
  TH: "Thailand",
  TL: "Timor-Leste",
  TG: "Togo",
  TK: "Tokelau",
  TO: "Tonga",
  TT: "Trinidad and Tobago",
  TN: "Tunisia",
  TR: "Türkiye",
  TM: "Turkmenistan",
  TC: "Turks and Caicos Islands",
  TV: "Tuvalu",
  UG: "Uganda",
  UA: "Ukraine",
  AE: "United Arab Emirates",
  GB: "United Kingdom",
  US: "United States",
  UM: "United States Minor Outlying Islands",
  UY: "Uruguay",
  UZ: "Uzbekistan",
  VU: "Vanuatu",
  VE: "Venezuela",
  VN: "Vietnam",
  VG: "British Virgin Islands",
  VI: "U.S. Virgin Islands",
  WF: "Wallis and Futuna",
  EH: "Western Sahara",
  YE: "Yemen",
  ZM: "Zambia",
  ZW: "Zimbabwe",
};

// US states / DC / territories — 2-letter postal → name, for the "US-XX"
// subdivision name. (US keeps subdivision granularity in Phase 1.)
export const US_STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
  PR: "Puerto Rico",
  GU: "Guam",
  VI: "U.S. Virgin Islands",
  AS: "American Samoa",
  MP: "Northern Mariana Islands",
};

export type LocationBucket = "us" | "international" | "unspecified";

export type ResolvedLocation = {
  countryCode: string; // ISO alpha-2, or "ZZ" when unresolvable
  countryName: string;
  subdivisionCode?: string; // e.g. "US-NC" (US only in Phase 1)
  subdivisionName?: string;
  bucket: LocationBucket;
};

/** True for a real country code that is not the US and not the sentinel. */
export function isInternationalCode(code: string): boolean {
  return code !== US_CODE && code !== UNSPECIFIED_CODE && code in COUNTRIES;
}

// Legacy US string → 2-letter state, validated against the real US set.
// "Fayetteville, NC" → "NC"; "Nationwide"/"Multi-state (…)"/")"-suffixed → "".
function usStateFromLocation(loc: string): string {
  const m = loc.match(/,\s*([A-Z]{2})\s*$/);
  if (!m) return "";
  return US_STATE_NAMES[m[1]] ? m[1] : "";
}

const UNSPECIFIED: ResolvedLocation = {
  countryCode: UNSPECIFIED_CODE,
  countryName: UNSPECIFIED_NAME,
  bucket: "unspecified",
};

type LocatableOpp = { location: string; locationCode?: string };

/**
 * The country code an opportunity filters under — the fast path used by the
 * evaluator (one call per record over the whole catalog). Prefers the explicit
 * ISO `locationCode`; falls back to parsing the legacy US string. Never guesses:
 * an unrecognized code or an unparseable string resolves to the sentinel.
 */
export function countryCodeOf(o: LocatableOpp): string {
  if (o.locationCode) {
    const cc = o.locationCode.split("-")[0].toUpperCase();
    return COUNTRIES[cc] ? cc : UNSPECIFIED_CODE;
  }
  return usStateFromLocation(o.location) ? US_CODE : UNSPECIFIED_CODE;
}

/** Full structured resolution for display + bucketing. */
export function resolveLocation(o: LocatableOpp): ResolvedLocation {
  if (o.locationCode) {
    const [rawCc, rawSub] = o.locationCode.split("-");
    const cc = rawCc.toUpperCase();
    const name = COUNTRIES[cc];
    if (!name) return UNSPECIFIED;
    if (cc === US_CODE) {
      const sub = rawSub?.toUpperCase();
      return {
        countryCode: US_CODE,
        countryName: name,
        subdivisionCode: sub ? `US-${sub}` : undefined,
        subdivisionName: sub ? US_STATE_NAMES[sub] : undefined,
        bucket: "us",
      };
    }
    return {
      countryCode: cc,
      countryName: name,
      // Parsed but intentionally NOT surfaced in Phase 1 (country-level only).
      // Populate an intl-subdivision name table here to switch it on later.
      subdivisionCode: rawSub ? `${cc}-${rawSub.toUpperCase()}` : undefined,
      subdivisionName: undefined,
      bucket: "international",
    };
  }
  const st = usStateFromLocation(o.location);
  if (st) {
    return {
      countryCode: US_CODE,
      countryName: "United States",
      subdivisionCode: `US-${st}`,
      subdivisionName: US_STATE_NAMES[st],
      bucket: "us",
    };
  }
  return UNSPECIFIED;
}

export type CountryOption = { code: string; name: string };

// All ISO 3166-1 countries except the US (which lives in the US group),
// alphabetized by name — the exhaustive International group list.
export const INTERNATIONAL_COUNTRIES: CountryOption[] = Object.entries(COUNTRIES)
  .filter(([code]) => code !== US_CODE)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

// THE TRUCKING COMPANY's words on Hunter's surfaces (feed lines, chat, search,
// examples). Read through src/demo/hunter/vocab.ts, which picks the active
// member. Every claim here is true of persona.ts and opportunities.ts in this
// folder's parent: Hunter explains fit; Grant makes the call.

import type { HunterVocab, WorkType } from "../../../hunter/vocab";
import { HERO_IDS, OPPORTUNITIES } from "../opportunities";
import { KEY_PARTNER, PERSONA } from "../persona";

/** A past job that matches the notice, by what the notice is about. None when nothing fits. */
function pastJobId(row: Parameters<HunterVocab["pastJobId"]>[0]) {
  const text = `${row.o.plainTitle} ${row.o.agency} ${row.o.office}`.toLowerCase();
  if (/storm|ncdot|transportation, division|hurricane/.test(text)) return "pp-ncdot-storm-hauling";
  if (/trailer|container|army|marine|navy|guard/.test(text)) return "pp-bragg-trailer-hauling";
  if (/linen|supply|clinic|medical|courier|furniture/.test(text)) return "pp-quarry-lane-routes";
  if (/truckload|mail route|refrigerat/.test(text)) return "pp-cypress-bend-reefer";
  return undefined;
}

const hero = OPPORTUNITIES.find((o) => o.id === HERO_IDS.hero)!;

/** The member's own codes, by the name the taxonomy gives them. */
const CODE_NAMES: WorkType[] = [
  { code: PERSONA.primaryNaics, label: PERSONA.primaryNaicsLabel },
  ...PERSONA.secondaryNaics,
].map((n) => ({
  rx: new RegExp(String.raw`\b${n.label.toLowerCase().replace(/[()]/g, "\\$&")}\b`),
  naics: [n.code],
  noun: `${n.label} work (NAICS ${n.code})`,
}));

const TEAM_UP = "Fort Bragg's base logistics draft";

export const VOCAB: HunterVocab = {
  base: "yard",
  hometown: "across town",
  place: "The work",
  longWay: "a long day for a driver, with empty miles home",
  codePhrases: {
    "484110": "your local-freight code",
    "484121": "your truckload code",
    "484220": "your specialized-freight code",
    "484210": "your moving code",
    "492110": "your courier code",
    "488490": "your road-transport support code",
  },
  // V112 motor freight; V301 relocation for moves; R602 courier.
  pscFor: (naics) => (naics === "484210" ? "V301" : naics === "492110" ? "R602" : "V112"),
  mainPsc: "V112",
  pastJobId,
  aboveRangeTeam: ` ${KEY_PARTNER.name} looks for a local service-disabled veteran-owned carrier for Fort Bragg.`,
  profile: {
    teamLabel: "Trucks and yard",
    intro: `${PERSONA.employeesW2} employees, a truck yard on Gillespie Street, 7 tractors, 9 trailers and 4 box trucks`,
    chip: "We also run a refrigerated trailer",
  },
  avaLine: `Ava is already working on the ${hero.plainTitle} quote. ${hero.ava!.statusLine} Open Ava under Your Workspace, on the left.`,
  certLine: "You already hold Small Business and Service-Disabled Veteran-Owned (SDVOSB) status.",
  competitionExample: "",
  searchHint: "a kind of freight work",
  canon: [
    "What's out there for me right now?",
    "What's new this week?",
    "Which of these am I actually ready for?",
    "Compare my top 3 — which should I chase?",
    "How do you pick my matches?",
    "What do you know about my business?",
    "Show only SDVOSB set-asides",
    "Show only federal",
    "Show only state and local",
    "Show jobs under $100K",
    "Show work near Fayetteville",
    "What closes first?",
    "Show my saved ones",
    "What is a Sources Sought notice?",
    "What is an SDVOSB set-aside?",
    "What is a NAICS code?",
    "Do I qualify for these set-asides?",
    "Show me Fort Bragg jobs",
    "Show me VA routes",
    "Show trailer hauling",
    "Start over",
  ],
  workTypes: [
    ...CODE_NAMES,
    { rx: /\btruckload\b|\blong[- ]haul\b|\bdry vans?\b/, naics: ["484121"], noun: "truckload work (NAICS 484121)" },
    { rx: /\btrailers?\b|\bcontainers?\b|\bhauling\b|\bflatbeds?\b/, naics: ["484220"], noun: "trailer and container hauling (NAICS 484220)" },
    { rx: /\bmov(e|es|ing|ers?)\b|\bfurniture\b/, naics: ["484210"], noun: "furniture and equipment moves (NAICS 484210)" },
    { rx: /\bcouriers?\b|\bspecimens?\b|\bpharmacy\b/, naics: ["492110"], noun: "courier work (NAICS 492110)" },
    { rx: /\broutes?\b|\blinen\b|\bbox trucks?\b/, search: "route", noun: "scheduled routes" },
    { rx: /\bstorms?\b|\bhurricanes?\b|\bdebris\b/, search: "storm", noun: "storm and emergency hauling" },
    { rx: /\btruck\w*\b|\bfreight\b|\bdelivery\b/, naics: ["484110"], noun: "freight trucking work (NAICS 484110)" },
  ],
  forecastCodes: `freight trucking work (NAICS ${PERSONA.primaryNaics}, ${PERSONA.secondaryNaics.map((n) => n.code).join(", ")})`,
  glossary: {
    sourcesSought: "the Army asks for comments on its draft of Fort Bragg's next base logistics contract.",
    psc: "Freight work often uses V112, Transportation: Motor Freight.",
    rfqExample: ` The ${hero.plainTitle} is one.`,
    incumbent: {
      line: "On your list, Fort Bragg's base logistics contract is one. The current task order ends on June 30, 2027, and the Army has posted a draft of the next one.",
      chips: [`Why does ${TEAM_UP} match me?`, "What is a prime and a sub?"],
    },
    primeSub: {
      line: `On a job that is too big to hold alone, or open only to firms on a vehicle you are not on, a small carrier can team up as a sub. ${KEY_PARTNER.name}, an EAGLE agreement holder, wants ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}.`,
      chips: [`Why does ${TEAM_UP} match me?`, "What is a recompete?"],
    },
    bond: {
      line: "You carry no surety bond line, and none of the work on your list asks for a bid or performance bond. Some notices ask for bonded drivers, which is a different, smaller bond.",
      chips: ["What is a prime and a sub?", "What's out there for me right now?"],
    },
    clearance: {
      line: "Your company and drivers hold no clearances. Secure freight for DoD needs both, so I mark those notices as out of reach for now.",
      chips: ["Which of these am I actually ready for?", "What's out there for me right now?"],
    },
  },
  api: {
    trade: "freight_trucking",
    alliedNaics: ["484122", "484230", "488510", "492210", "493110"],
  },
  ui: {
    quickPicks: [
      "Trucking jobs in NC $15K–$750K",
      "SDVOSB set-asides closing in 30 days",
      "Fort Bragg hauling",
      "VA routes and courier work",
      "Partner opportunities — Fort Bragg primes",
    ],
    workTypes: [
      "Scheduled routes",
      "Trailer and container hauling",
      "Truckload freight",
      "Furniture moves",
      "Courier runs",
      "Storm hauling",
      "Other",
    ],
    searchPlaceholders: [
      "Box-truck routes near Fayetteville…",
      "Fort Bragg trailer hauling…",
      "SDVOSB set-asides closing this month…",
      "VA courier and supply runs in NC…",
    ],
    saveSearchPlaceholder: "Name it — e.g. Fort Bragg hauling",
    naicsGloss: `The government's industry codes — we've prefilled yours (${PERSONA.primaryNaics} ${PERSONA.primaryNaicsLabel}).`,
    smartList: {
      workTypes: [
        "Scheduled routes",
        "Trailer and container hauling",
        "Truckload freight",
        "Refrigerated freight",
        "Furniture and equipment moves",
        "Courier runs",
        "Storm and emergency hauling",
        "Gravel and material delivery",
      ],
      seedName: "SDVOSB trucking $15K–$750K, NC",
      seedSetAsides: ["SDVOSB", "Total Small Business"],
      seedValue: [15_000, 750_000],
    },
  },
};

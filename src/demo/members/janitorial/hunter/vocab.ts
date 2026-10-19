// THE JANITORIAL FIRM's words on Hunter's surfaces (feed lines, chat, search,
// examples). Read through src/demo/hunter/vocab.ts, which picks the active
// member. Every claim here is true of persona.ts and opportunities.ts in this
// folder's parent: Hunter explains fit; Grant makes the call.

import type { HunterVocab, WorkType } from "../../../hunter/vocab";
import { HERO_IDS, OPPORTUNITIES } from "../opportunities";
import { KEY_PARTNER, PERSONA } from "../persona";

/** A past job that matches the notice, by what the notice is about. None when nothing fits. */
function pastJobId(row: Parameters<HunterVocab["pastJobId"]>[0]) {
  const text = `${row.o.plainTitle} ${row.o.agency} ${row.o.office}`.toLowerCase();
  if (/pressure|washing|exterior/.test(text)) return "pp-sj-dorm-wash";
  if (/floor|veterans/.test(text)) return "pp-redtail-va-floors";
  if (/town|county|city of|housing authority|office cleaning|mowing|grounds/.test(text)) return "pp-hope-mills-custodial";
  if (/medical|clinic/.test(text)) return "pp-briar-glen-medical";
  return undefined;
}

const hero = OPPORTUNITIES.find((o) => o.id === HERO_IDS.hero)!;

/** The member's own codes, by the name the taxonomy gives them. */
const CODE_NAMES: WorkType[] = [
  { code: PERSONA.primaryNaics, label: PERSONA.primaryNaicsLabel },
  ...PERSONA.secondaryNaics,
].map((n) => ({
  rx: new RegExp(String.raw`\b${n.label.toLowerCase()}\b`),
  naics: [n.code],
  noun: `${n.label} work (NAICS ${n.code})`,
}));

const ARMY_RESERVE = "the Army Reserve centers notice";

export const VOCAB: HunterVocab = {
  base: "office",
  hometown: "across town",
  place: "The site",
  longWay: "a long drive for your night crews",
  codePhrases: {
    "561720": "your janitorial code",
    "561790": "your building-cleaning code",
    "561740": "your carpet-cleaning code",
    "561730": "your grounds code",
  },
  // S201 custodial, S208 grounds, S299 other housekeeping (exterior washing).
  pscFor: (naics) => (naics === "561730" ? "S208" : naics === "561790" ? "S299" : "S201"),
  mainPsc: "S201",
  pastJobId,
  aboveRangeTeam: ` ${KEY_PARTNER.name} looks for a local subcontractor for the North Carolina Army Reserve centers.`,
  profile: {
    teamLabel: "Crews and yard",
    intro: `${PERSONA.employeesW2} employees, an office and equipment yard on Gillespie Street, night custodial crews and two hot-water washing rigs`,
    chip: "We also clean carpets and upholstery",
  },
  avaLine: `Ava is already working on the ${hero.plainTitle} quote. ${hero.ava!.statusLine} Open Ava under Your Workspace, on the left.`,
  certLine: "You already hold Small Business and HUBZone status.",
  competitionExample: "",
  searchHint: "a kind of cleaning work",
  canon: [
    "What's out there for me right now?",
    "What's new this week?",
    "Which of these am I actually ready for?",
    "Compare my top 3 — which should I chase?",
    "How do you pick my matches?",
    "What do you know about my business?",
    "Show only HUBZone set-asides",
    "Show only federal",
    "Show only state and local",
    "Show jobs under $25K",
    "Show work near Fayetteville",
    "What closes first?",
    "Show my saved ones",
    "What is a Sources Sought notice?",
    "What is a HUBZone set-aside?",
    "What is AbilityOne?",
    "What is a NAICS code?",
    "Do I qualify for these set-asides?",
    "Show me Fort Bragg jobs",
    "Show floor care jobs",
    "Show custodial jobs",
    "Start over",
  ],
  workTypes: [
    ...CODE_NAMES,
    { rx: /\bfloors?\b|\bstrip\w*\b|\bwax\w*\b|\bburnish\w*\b/, search: "floor", noun: "floor care jobs" },
    { rx: /\bcarpets?\b|\bupholstery\b/, naics: ["561740"], noun: "carpet cleaning work (NAICS 561740)" },
    { rx: /\bpressure\b|\bwash\w*\b|\bexterior\b/, naics: ["561790"], noun: "exterior washing work (NAICS 561790)" },
    { rx: /\bmow\w*\b|\bgrounds\b|\blawn\b|\blandscap\w*\b/, naics: ["561730"], noun: "grounds work (NAICS 561730)" },
    { rx: /\bcustodial\b|\bjanitor\w*\b|\bcleaning\b|\bhousekeeping\b/, naics: ["561720"], noun: "custodial work (NAICS 561720)" },
  ],
  forecastCodes: `cleaning, floor care, exterior washing and grounds work (NAICS ${PERSONA.primaryNaics}, ${PERSONA.secondaryNaics.map((n) => n.code).join(", ")})`,
  glossary: {
    sourcesSought: "the Corps asks which firms could clean and mow the Army Reserve centers in NC and SC, and Fort Bragg asks who could clean its mess-hall exhaust hoods.",
    psc: "Custodial work often uses S201, Housekeeping: Custodial Janitorial.",
    rfqExample: ` The ${hero.plainTitle.charAt(0).toLowerCase()}${hero.plainTitle.slice(1)} is one.`,
    incumbent: {
      line: "On your list, the Army Reserve centers' cleaning and mowing is one. The current contract ends in early 2027, and the Corps is asking who could do the next one.",
      chips: [`Why does ${ARMY_RESERVE} match me?`, "What is a prime and a sub?"],
    },
    primeSub: {
      line: `On a job that is too big to hold alone, or set aside for a group you are not in, a small firm can team up as a sub. ${KEY_PARTNER.name}, an 8(a) firm, wants ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}.`,
      chips: [`Why does ${ARMY_RESERVE} match me?`, "What is a recompete?"],
    },
    bond: {
      line: "You have never needed one. Cleaning contracts on your list don't ask for a bond.",
      chips: ["What is a prime and a sub?", "What's out there for me right now?"],
    },
    clearance: {
      line: "Your crews hold no clearances. They badge onto Fort Bragg and Seymour Johnson with a base pass, and none of the work on your list needs a clearance. I would mark any that did.",
      chips: ["Which of these am I actually ready for?", "What's out there for me right now?"],
    },
  },
  api: {
    trade: "janitorial_and_building_services",
    alliedNaics: ["561710", "561740", "561790", "562111"],
  },
  ui: {
    quickPicks: [
      "Cleaning jobs in NC $8K–$600K",
      "HUBZone set-asides closing in 30 days",
      "Fort Bragg exterior and floor work",
      "One-time floor jobs under $25K",
      "Partner opportunities — 8(a) primes",
    ],
    workTypes: ["Custodial", "Floor care", "Carpet cleaning", "Exterior washing", "Grounds", "Other"],
    searchPlaceholders: [
      "Custodial jobs under $600K near Fayetteville…",
      "Fort Bragg floor and exterior work…",
      "HUBZone set-asides closing this month…",
      "Floor care jobs in NC…",
    ],
    saveSearchPlaceholder: "Name it — e.g. Fort Bragg floor jobs",
    naicsGloss: `The government's industry codes — we've prefilled yours (${PERSONA.primaryNaics} ${PERSONA.primaryNaicsLabel}).`,
    smartList: {
      workTypes: [
        "Night custodial",
        "Floor care",
        "Carpet extraction",
        "Exterior washing",
        "Restroom deep cleaning",
        "Grounds and mowing",
        "One-time deep cleans",
        "Window cleaning",
      ],
      seedName: "HUBZone cleaning $8K–$600K, NC",
      seedSetAsides: ["HUBZone", "Total Small Business"],
      seedValue: [8_000, 600_000],
    },
  },
};

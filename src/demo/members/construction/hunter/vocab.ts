// THE CONTRACTOR's words on Hunter's surfaces (feed lines, chat, search, examples).
// Read through src/demo/hunter/vocab.ts, which picks the active member. Every
// claim here is true of persona.ts and opportunities.ts in this folder's parent:
// Hunter explains fit; Grant makes the call.

import type { HunterVocab, WorkType } from "../../../hunter/vocab";
import { HERO_IDS, OPPORTUNITIES } from "../opportunities";
import { KEY_PARTNER, PERSONA } from "../persona";

/** A past job that matches the notice, by what the notice is about. None when nothing fits. */
function pastJobId(row: Parameters<HunterVocab["pastJobId"]>[0]) {
  const text = `${row.o.plainTitle} ${row.o.agency} ${row.o.office}`.toLowerCase();
  if (/barracks/.test(text)) return "pp-turnrow-barracks-electrical";
  if (/school|college|university|fayetteville tech|fayetteville state/.test(text)) return "pp-ccs-school-hvac";
  if (/pope|air force|aviation|army|veterans|navy/.test(text)) return "pp-pope-office-hvac";
  if (/medical|clinic|office/.test(text)) return "pp-tallow-branch-medical";
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

const VA_SOURCES_SOUGHT = "the Fayetteville VA fan coil notice";

export const VOCAB: HunterVocab = {
  base: "shop",
  hometown: "across town",
  place: "The site",
  longWay: "a long drive for your crews each day",
  codePhrases: {
    "236220": "your building code",
    "238210": "your electrical code",
    "238220": "your HVAC code",
  },
  // Z2JZ: repair or alteration of buildings, the code most of his federal notices carry.
  pscFor: () => "Z2JZ",
  mainPsc: "Z2JZ",
  pastJobId,
  aboveRangeTeam: ` ${KEY_PARTNER.name} looks for a HUBZone firm for its VA jobs.`,
  profile: {
    teamLabel: "Crews and shop",
    intro: `${PERSONA.employeesW2} employees, a shop and yard on Grove Street, and two electrical and two HVAC crews`,
    chip: "We also do building controls work",
  },
  avaLine: `Ava is already working on the ${hero.plainTitle} bid. ${hero.ava!.statusLine} Open Ava under Your Workspace, on the left.`,
  certLine: "You already hold Small Business and HUBZone status.",
  competitionExample: "",
  searchHint: "a kind of building work",
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
    "Show jobs under $100K",
    "Show work near Fayetteville",
    "What closes first?",
    "Show my saved ones",
    "What is a Sources Sought notice?",
    "What is a HUBZone set-aside?",
    "What is a NAICS code?",
    "Do I qualify for these set-asides?",
    "What is a bond?",
    "Show me Fort Bragg jobs",
    "Show HVAC jobs",
    "Show electrical jobs",
    "Start over",
  ],
  workTypes: [
    ...CODE_NAMES,
    { rx: /\bhvac\b|\bheating\b|\bair[- ]condition\w*\b|\bchillers?\b|\bair handl\w*\b|\bboilers?\b/, naics: ["238220"], noun: "HVAC work (NAICS 238220)" },
    { rx: /\belectric\w*\b|\bswitchgear\b|\bpanels?\b|\bwiring\b|\blighting\b/, naics: ["238210"], noun: "electrical work (NAICS 238210)" },
    { rx: /\bbarracks\b/, search: "barracks", noun: "barracks repairs" },
    { rx: /\brepairs?\b|\brenovat\w*\b/, search: "repair", noun: "building repairs" },
    { rx: /\bschools?\b|\bcollege\b|\buniversity\b/, search: "school", noun: "school and campus jobs" },
    { rx: /\bconstruction\b|\bbuilding\b|\bcontractor\b/, naics: ["236220"], noun: "building construction work (NAICS 236220)" },
  ],
  forecastCodes: `building, electrical and HVAC work (NAICS ${PERSONA.primaryNaics}, ${PERSONA.secondaryNaics.map((n) => n.code).join(" and ")})`,
  glossary: {
    sourcesSought: "the VA asks which firms could replace the fan coil units at the Fayetteville VA, and Fort Bragg asks who could hold its next Minor Construction MATOC.",
    psc: "Building repair work often uses Z2JZ, Repair or Alteration of Miscellaneous Buildings.",
    rfqExample: " The split systems and panel job at Pope is one.",
    incumbent: {
      line: "On your list, the Fayetteville VA's fan coil job is one. The 3rd floor was done in 2023–2025, and the VA is asking who could do floors 2 and 4.",
      chips: [`Why does ${VA_SOURCES_SOUGHT} match me?`, "What is a prime and a sub?"],
    },
    primeSub: {
      line: `On a job that is too big to bond alone, or set aside for a group you are not in, a small firm can team up as a sub. ${KEY_PARTNER.name}, a veteran-owned firm, wants ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}.`,
      chips: [`Why does ${VA_SOURCES_SOUGHT} match me?`, "What is a recompete?"],
    },
    bond: {
      line: `A surety's promise that you will finish the job and pay your subs. Federal jobs over $150K need one. Your line is $1.5M a job and $4M in total, with $2.9M in use.`,
      chips: ["Which of these am I actually ready for?", "What's out there for me right now?"],
    },
    clearance: {
      line: "Your crews hold no clearances. They badge onto post with a base pass, and none of the work on your list needs a clearance. I would mark any that did.",
      chips: ["Which of these am I actually ready for?", "What's out there for me right now?"],
    },
  },
  api: {
    trade: "commercial_and_institutional_building",
    alliedNaics: ["236210", "238290", "238990"],
  },
  ui: {
    quickPicks: [
      "HVAC and electrical jobs in NC $50K–$1.5M",
      "HUBZone set-asides closing in 30 days",
      "Fort Bragg building repairs",
      "Small repair jobs under $100K",
      "Partner opportunities — veteran-owned primes",
    ],
    workTypes: [
      "HVAC replacement",
      "Electrical upgrades",
      "Building repair and renovation",
      "Controls",
      "Lighting",
      "Other",
    ],
    searchPlaceholders: [
      "HVAC jobs under $1.5M near Fayetteville…",
      "Fort Bragg building repairs…",
      "HUBZone set-asides closing this month…",
      "School and campus HVAC jobs in NC…",
    ],
    saveSearchPlaceholder: "Name it — e.g. Fort Bragg HVAC jobs",
    naicsGloss: `The government's industry codes — we've prefilled yours (${PERSONA.primaryNaics} ${PERSONA.primaryNaicsLabel}).`,
    smartList: {
      workTypes: [
        "HVAC replacement",
        "Electrical upgrades",
        "Switchgear and service",
        "Building repair and renovation",
        "Controls",
        "Lighting",
        "Boilers and hot water",
        "Barracks and dormitory repairs",
      ],
      seedName: "HUBZone HVAC and electrical $50K–$1.5M, NC",
      seedSetAsides: ["HUBZone", "Total Small Business"],
      seedValue: [50_000, 1_500_000],
    },
  },
};

// THE AGENCY's words on Hunter's surfaces (feed lines, chat, search, examples).
// Read through src/demo/hunter/vocab.ts, which picks the active member. Every
// claim here is true of persona.ts and opportunities.ts in this folder's parent:
// Hunter explains fit; Grant makes the call.

import type { HunterVocab, WorkType } from "../../../hunter/vocab";
import { HERO_IDS, OPPORTUNITIES } from "../opportunities";
import { KEY_PARTNER, PERSONA } from "../persona";

/** A past job that matches the notice, by what the notice is about. None when nothing fits. */
function pastJobId(row: Parameters<HunterVocab["pastJobId"]>[0]) {
  const text = `${row.o.plainTitle} ${row.o.agency} ${row.o.office}`.toLowerCase();
  if (/national guard|enrollment/.test(text)) return "pp-ncng-recruiting";
  if (/recruit|hiring|employer/.test(text)) return "pp-longleaf-hiring";
  if (/army|navy|air force|marine|family|readiness|air show/.test(text))
    return "pp-ncng-recruiting";
  if (/city of|county|awareness|transit|water|utility|safety|voter/.test(text))
    return "pp-fayetteville-stormwater";
  return undefined;
}

const hero = OPPORTUNITIES.find((o) => o.id === HERO_IDS.hero)!;

/** The member's own codes, by the name the taxonomy gives them: "advertising agencies work". */
const CODE_NAMES: WorkType[] = [
  { code: PERSONA.primaryNaics, label: PERSONA.primaryNaicsLabel },
  ...PERSONA.secondaryNaics,
].map((n) => ({
  rx: new RegExp(String.raw`\b${n.label.toLowerCase()}\b`),
  naics: [n.code],
  noun: `${n.label} work (NAICS ${n.code})`,
}));

const VA_SOURCES_SOUGHT = "the Veterans Affairs Sources Sought notice";

export const AGENCY_VOCAB: HunterVocab = {
  base: "office",
  hometown: "across town",
  place: "The work",
  longWay: "a long drive to shoots and meetings",
  codePhrases: {
    "541810": "your advertising code",
    "541613": "your marketing-consulting code",
    "541430": "your graphic-design code",
    "512110": "your video-production code",
    "541820": "your public-relations code",
  },
  // R701 Advertising, T001 Arts/Graphics, R708 Public Relations.
  pscFor: (naics) => (naics === "541430" ? "T001" : naics === "541820" ? "R708" : "R701"),
  mainPsc: "R701",
  pastJobId,
  aboveRangeTeam: "",
  profile: {
    teamLabel: "Team and studio",
    intro: `${PERSONA.employeesW2} employees, a studio and edit suite, and a 2-person video crew`,
    chip: "We also make Spanish-language videos",
  },
  avaLine: `Ava is already working on the ${hero.plainTitle} quote. ${hero.ava!.statusLine} Open Ava under Your Workspace, on the left.`,
  certLine: "You already hold Small Business and Woman-Owned (WOSB) status.",
  competitionExample: "",
  searchHint: "a kind of campaign",
  canon: [
    "What's out there for me right now?",
    "What's new this week?",
    "Which of these am I actually ready for?",
    "Compare my top 3 — which should I chase?",
    "How do you pick my matches?",
    "What do you know about my business?",
    "Show only woman-owned set-asides",
    "Show only federal",
    "Show only state and local",
    "Show jobs under $100K",
    "Show work near Fayetteville",
    "Show work in Virginia and South Carolina",
    "What closes first?",
    "Show my saved ones",
    "What is a Sources Sought notice?",
    "What is a WOSB set-aside?",
    "What is a NAICS code?",
    "Do I qualify for these set-asides?",
    "Show me Fort Bragg ads",
    "Show video jobs",
    "Show me recruiting campaigns",
    "Start over",
  ],
  workTypes: [
    ...CODE_NAMES,
    {
      rx: /\bmarketing consulting\b/,
      naics: ["541613"],
      noun: "Marketing Consulting Services work (NAICS 541613)",
    },
    {
      rx: /\bpublic relations\b|\bpr\b/,
      naics: ["541820"],
      noun: "Public Relations Agencies work (NAICS 541820)",
    },
    { rx: /\brecruit\w*\b|\bhiring\b/, search: "recruit", noun: "recruiting and hiring campaigns" },
    { rx: /\bvideos?\b|\bfilm\w*\b/, search: "video", noun: "video work" },
    { rx: /\bgraphic design\b|\bdesign\b|\bgraphics\b/, search: "design", noun: "design work" },
    { rx: /\bsocial media\b|\bsocial\b/, search: "social", noun: "social media work" },
    { rx: /\bprint\w*\b|\bnewspapers?\b/, search: "print", noun: "print advertising work" },
    { rx: /\bpublic health\b|\bhealth\b/, search: "health", noun: "health campaigns" },
    { rx: /\bschools?\b|\bteachers?\b/, search: "school", noun: "school opportunities" },
    {
      rx: /\b(ads|advertising|advertisements?)\b/,
      search: "advertising",
      noun: "advertising work",
    },
  ],
  forecastCodes: `advertising and marketing work (NAICS ${PERSONA.primaryNaics} and your other four)`,
  glossary: {
    sourcesSought: "the VA asks which firms could run its national health-care hiring campaign.",
    psc: "Advertising work often uses R701, Support - Management: Advertising.",
    rfqExample: ` The ${hero.plainTitle} is one.`,
    incumbent: {
      line: "On your list, the VA's national health-care hiring campaign is one. Its current contract ends in September 2027, and the VA is asking who could run the next one.",
      chips: [`Why does ${VA_SOURCES_SOUGHT} match me?`, "What is a prime and a sub?"],
    },
    primeSub: {
      line: `On a job that is too big to hold alone, or set aside for a group you are not in, a small firm can team up as a sub. ${KEY_PARTNER.name}, a veteran-owned firm, wants ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}.`,
      chips: [`Why does ${VA_SOURCES_SOUGHT} match me?`, "What is a recompete?"],
    },
    bond: {
      line: "You have never needed one. None of the work on your list asks for a bond.",
      chips: ["What is a prime and a sub?", "What's out there for me right now?"],
    },
    clearance: {
      line: "Your team holds no clearances. None of the work on your list needs one, and I would mark any that did.",
      chips: ["Which of these am I actually ready for?", "What's out there for me right now?"],
    },
  },
  api: {
    trade: "marketing_advertising_and_media_production",
    alliedNaics: ["541830", "541850", "541860", "541890", "541910", "541922"],
  },
  ui: {
    quickPicks: [
      "Ad campaigns in NC $25K–$450K",
      "Woman-owned set-asides closing in 30 days",
      "Fort Bragg family program ads",
      "Video and design jobs under $100K",
      "Partner opportunities — veteran-owned primes",
    ],
    workTypes: [
      "Advertising campaigns",
      "Video production",
      "Graphic design",
      "Paid social and search",
      "Public relations",
      "Recruiting and hiring campaigns",
      "Other",
    ],
    searchPlaceholders: [
      "Ad campaigns under $450K near Fayetteville…",
      "Fort Bragg family program ads…",
      "Woman-owned set-asides closing this month…",
      "Recruiting and public-health campaigns in NC…",
    ],
    saveSearchPlaceholder: "Name it — e.g. Fort Bragg ad campaigns",
    naicsGloss: `The government's industry codes — we've prefilled yours (${PERSONA.primaryNaics} ${PERSONA.primaryNaicsLabel}).`,
    smartList: {
      workTypes: [
        "Advertising campaigns",
        "Video production",
        "Graphic design",
        "Paid social and search",
        "Print and outdoor buying",
        "Public relations",
        "Recruiting campaigns",
        "Landing pages and lead routing",
      ],
      seedName: "WOSB ad campaigns $25K–$450K, NC",
      seedSetAsides: ["WOSB", "Total Small Business"],
      seedValue: [25_000, 450_000],
    },
  },
};

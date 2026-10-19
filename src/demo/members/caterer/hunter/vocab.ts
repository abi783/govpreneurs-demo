// THE CATERER's words on Hunter's surfaces (feed lines, chat, search, examples).
// Read through src/demo/hunter/vocab.ts, which picks the active member. The text
// moved here unchanged from Hunter's engines when the agency joined the demo.

import { money } from "../../../../lib/money";
import type { HunterVocab } from "../../../hunter/vocab";
import { HERO_IDS } from "../opportunities";
import { KEY_PARTNER, PERSONA } from "../persona";

/** A past job that matches the notice, by what the notice is about. */
function pastJobId(row: Parameters<HunterVocab["pastJobId"]>[0]) {
  const text = `${row.o.plainTitle} ${row.o.agency} ${row.o.office}`.toLowerCase();
  if (row.o.naics === "722320") return "pp-church";
  if (/patient|hospital|medical|nutrition|veterans/.test(text)) return "pp-womack";
  if (/school|cafeteria|child nutrition|senior|detention|meal program|meals for/.test(text)) {
    return "pp-county-schools";
  }
  if (
    /fort bragg|camp mackall|pope|dining|army|mess|barracks|airfield|flight line|lodging/.test(text)
  ) {
    return "pp-cdg-sub";
  }
  return "pp-county-schools";
}

/** Food-handler gap: the one closable gap that the story names for the Camp Mackall job. */
const readinessAct: HunterVocab["readinessAct"] = (row) => {
  if (row.id !== HERO_IDS.hero) return undefined;
  const certified = PERSONA.foodHandlerCertified ?? 0;
  const missing = PERSONA.employeesW2 - certified;
  return {
    act: {
      gap: {
        kind: "set_aside",
        oppKey: row.id,
        title: row.o.plainTitle,
        setAsideName: "Food-handler",
        note: `${certified} of your ${PERSONA.employeesW2} cooks hold a food-handler certificate. The quote asks for proof for every cook. ${missing} still need one.`,
      },
      trustLevel: "high",
      offers: [],
      bidChecklist: [
        { label: `SAM.gov registration active until April 2027`, done: true },
        { label: "Woman-owned small business status on file", done: true },
        { label: "HACCP food-safety plan", done: true },
        { label: "Insurance for the kitchen and both vans", done: true },
        {
          label: `Food-handler certificates for all ${PERSONA.employeesW2} cooks (${certified} done)`,
          done: false,
        },
      ],
    },
    note: ` One thing needs work before you answer: food-handler certificates. ${certified} of your ${PERSONA.employeesW2} cooks hold one.`,
  };
};

const RUN_FORT_BRAGG = "the Run two Fort Bragg dining halls";

export const CATERER_VOCAB: HunterVocab = {
  base: "kitchen",
  hometown: "in your hometown",
  place: "The site",
  longWay: "a long daily haul",
  codePhrases: {
    [PERSONA.primaryNaics]: "your food-service code",
    "722320": "your catering code",
    "722330": "your mobile-food code",
  },
  pscFor: () => "S203",
  mainPsc: "S203",
  pastJobId,
  readinessAct,
  aboveRangeTeam: ` ${KEY_PARTNER.name} holds the job now and looks for woman-owned subcontractors.`,
  profile: {
    teamLabel: "Team and kitchen",
    intro: `${PERSONA.employeesW2} employees and one kitchen that cooks ${PERSONA.differentiators[0].match(/[\d,]+ meals a day/)?.[0] ?? "1,100 meals a day"}`,
    chip: "I can now cook 1,500 meals a day",
  },
  avaLine:
    "Ava is already working on the Camp Mackall field meals quote, and she has questions for you. Open Ava from the menu.",
  certLine: "You already hold Small Business and Woman-Owned (WOSB) status.",
  competitionExample:
    " On the Fort Bragg dining halls, for example, the firm that holds the job now is Carolina Dining Group.",
  searchHint: "a type of food service",
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
    "Show jobs under $500K",
    "Show work near Fayetteville",
    "Show work in Virginia and South Carolina",
    "What closes first?",
    "Show my saved ones",
    "What is a Sources Sought notice?",
    "What is a WOSB set-aside?",
    "What is a NAICS code?",
    "Do I qualify for these set-asides?",
    "Show me Fort Bragg dining halls",
    "Show catering jobs",
    "Show me school meals",
    "Start over",
  ],
  workTypes: [
    {
      rx: /\bfood service contractors?\b|\bfood service work\b/,
      naics: [PERSONA.primaryNaics],
      noun: `${PERSONA.primaryNaicsLabel} work (NAICS ${PERSONA.primaryNaics})`,
    },
    {
      rx: /\bmobile food|food trucks?\b/,
      naics: ["722330"],
      noun: "Mobile Food Services work (NAICS 722330)",
    },
    { rx: /\b(catering|caterers?)\b/, search: "catering", noun: "catering opportunities" },
    {
      rx: /\bdining (halls?|facilit\w+)\b|\bdfacs?\b/,
      search: "dining",
      noun: "dining facility opportunities",
    },
    {
      rx: /\bschools?\b|\bchild nutrition\b|\bstudents?\b/,
      search: "school",
      noun: "school meal opportunities",
    },
    {
      rx: /\bhospitals?\b|\bpatients?\b|\bmedical center\b|\bnutrition\b/,
      search: "patient",
      noun: "hospital and patient meal opportunities",
    },
    { rx: /\bcafeterias?\b|\bcafe\b/, search: "cafeteria", noun: "cafeteria opportunities" },
    {
      rx: /\b(boxed|box|grab and go|grab-and-go|field meals?|field feeding)\b/,
      search: "meals",
      noun: "meal-delivery opportunities",
    },
    { rx: /\bsenior\w*\b/, search: "senior", noun: "senior meal opportunities" },
  ],
  incumbent: {
    id: HERO_IDS.teamUp,
    rx: /\bfort bragg\b.*\b(dining|dfac)\b|\b(dining|dfac)\b.*\bfort bragg\b/,
    reply: `${KEY_PARTNER.name} holds it now. ${KEY_PARTNER.holds}. They are looking for ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}, and you worked with them on Fort Bragg dining in 2024. Grant can tell you what that means for your options.`,
  },
  forecastCodes: `food service and catering work (NAICS ${PERSONA.primaryNaics} and your other three)`,
  glossary: {
    sourcesSought: "Fort Bragg asks which small caterers could run its dining program.",
    psc: "Food service work often uses S203, Housekeeping - Food.",
    rfqExample: " The Camp Mackall field meals job is one.",
    incumbent: {
      line: `${KEY_PARTNER.name} is the incumbent for Fort Bragg dining. It has held the contract since 2019 and is looking for woman-owned subcontractors for the recompete. Grant can tell you what that means for you.`,
      chips: [`Why does ${RUN_FORT_BRAGG} match me?`, "What is a prime and a sub?"],
    },
    primeSub: {
      line: "On a job that is too big to hold alone, a small firm can team up as a sub. That is how you worked on Fort Bragg dining halls with Carolina Dining Group.",
      chips: [`Why does ${RUN_FORT_BRAGG} match me?`, "What is a recompete?"],
    },
    bond: {
      line: `Your largest bond so far is ${money(PERSONA.largestBond)}. The Fort Bragg dining halls need a bond of 100% of the yearly price, which is about $2M.`,
      chips: [`Am I ready to bid ${RUN_FORT_BRAGG}?`, "What is a prime and a sub?"],
    },
    clearance: {
      line: "Your team holds no clearances. So I mark any job that needs them, such as the restricted Camp Mackall site.",
      chips: [
        "Am I ready to bid the Dining support at a restricted Camp Mackall site?",
        "What's out there for me right now?",
      ],
    },
  },
  api: {
    trade: "food_service_and_catering",
    alliedNaics: ["722410", "722511", "722513", "722514", "722515", "561210"],
  },
  ui: {
    quickPicks: [
      "Catering NC $250K–$1M",
      "Woman-owned set-asides closing in 30 days",
      "Fort Bragg dining and field meals",
      "VA patient meals I qualify for",
      "Partner opportunities — local NC primes",
    ],
    workTypes: [
      "Food service contracts",
      "Event and ceremony catering",
      "Mobile food service",
      "Therapeutic and patient diets",
      "School and community meals",
      "Specialty food production",
      "Other",
    ],
    searchPlaceholders: [
      "Catering under $500K near Fayetteville…",
      "Fort Bragg dining and field meals…",
      "Woman-owned set-asides closing this month…",
      "School and hospital meal programs in NC…",
    ],
    saveSearchPlaceholder: "Name it — e.g. Fort Bragg catering",
    naicsGloss:
      "The government's industry codes — we've prefilled yours (722310 Food Service Contractors).",
  },
};
